import { spawnSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { collectHostFacts, recordHostConfiguration } from './lib/host-preflight.js';
import { buildRoot, root } from './lib/project.js';
import { parseRuntimeToolLock } from './lib/runtime-provision.js';
import type { LockedTool } from './lib/runtime-provision.js';
import { assertProducedToolIdentity, buildRuntimeProof, classifyTool, resolveProofHostScope } from './lib/runtime-proof.js';
import type { CheckStatus, RuntimeProofReporting } from './lib/runtime-proof.js';

function capture(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed`);
  return result.stdout.trim();
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

function optionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === '') return null;
  return trimmed;
}

function readReport(file: string): string | null {
  try {
    return readFileSync(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return null;
    throw new Error(`Runtime proof report is unreadable: ${file}`);
  }
}

/** File tools are hashed at dist/runtime/<dest>. Archive tools hash the lock's repo archive only when that destination exists. */
function readProvisionedBytes(tool: LockedTool): Uint8Array | undefined {
  const destination = path.join(buildRoot, tool.dest);
  let stat: ReturnType<typeof statSync>;
  try {
    stat = statSync(destination);
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return undefined;
    throw new Error(`Runtime proof tool is unreadable: ${tool.id}`);
  }
  if (tool.kind === 'file') {
    if (!stat.isFile()) return undefined;
    return readFileSync(destination);
  }
  if (!stat.isDirectory()) return undefined;
  const archive = tool.sources.find(source => source.kind === 'repo-archive');
  if (archive === undefined || archive.kind !== 'repo-archive') throw new Error(`Runtime proof tool has no archive identity: ${tool.id}`);
  try {
    return readFileSync(path.join(root, archive.path));
  } catch {
    throw new Error(`Runtime proof archive is missing: ${tool.id}`);
  }
}

function parseReportArg(value: string): { step: string; file: string } {
  const split = value.indexOf('=');
  if (split <= 0 || split === value.length - 1) throw new Error(`Invalid --report ${value}`);
  return { step: value.slice(0, split), file: value.slice(split + 1) };
}

const { values } = parseArgs({
  options: {
    report: { type: 'string', multiple: true },
    blocked: { type: 'string', multiple: true },
    output: { type: 'string', default: 'runtime-proof.json' },
  },
});
const reportArgs = values.report ?? [];
if (reportArgs.length === 0) throw new Error('--report is required');
const blocked = new Map<string, string>();
for (const value of values.blocked ?? []) {
  const parsed = parseReportArg(value);
  blocked.set(parsed.step, parsed.file);
}
const reports = reportArgs.map(value => {
  const parsed = parseReportArg(value);
  const reason = blocked.get(parsed.step);
  return {
    step: parsed.step,
    file: parsed.file,
    xml: reason === undefined ? readReport(parsed.file) : null,
    blockedReason: reason,
  };
});

const lock = parseRuntimeToolLock(JSON.parse(readFileSync(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as unknown);
const selected = lock.tools.filter(tool => tool.profiles.includes('supported'));
const classified = selected.map(tool => ({ tool, proof: classifyTool(tool, readProvisionedBytes(tool)) }));
let reporting: RuntimeProofReporting = { status: 'ok', error: null };
try {
  assertProducedToolIdentity(classified.map(item => ({ id: item.tool.id, optional: item.tool.optional, state: item.proof.state })));
} catch (error) {
  reporting = { status: 'metadata-failed', error: error instanceof Error ? error.message : String(error) };
}

const testedCommit = capture('git', ['-C', root, 'rev-parse', 'HEAD']);
const sourceEnv = process.env.RUNTIME_PROOF_SOURCE_SHA?.trim();
const sourceCommit = sourceEnv === undefined || sourceEnv === '' ? testedCommit : sourceEnv;
const scope = resolveProofHostScope(process.env.RUNTIME_PROOF_HOST_SCOPE);
const configuration = recordHostConfiguration(collectHostFacts(), scope);
if (configuration.scope !== scope) throw new Error(`Host scope ${scope} was rewritten to ${configuration.scope}`);

const node = capture(path.join(buildRoot, 'node'), ['-p', 'process.version + " " + process.versions.modules']).split(' ');
const version = node[0];
const modules = Number(node[1]);
if (version === undefined || !Number.isInteger(modules)) throw new Error('Provisioned Node did not report its ABI');

const proof = buildRuntimeProof({
  sourceCommit,
  testedCommit,
  workflowRunId: optionalEnv(process.env.GITHUB_RUN_ID),
  workflowRunAttempt: optionalEnv(process.env.GITHUB_RUN_ATTEMPT),
  reporting,
  actions: actionTrace(),
  profile: 'supported',
  hostScope: scope,
  host: {
    os: process.platform,
    arch: process.arch,
    kernel: capture('uname', ['-r']),
    libc: capture('getconf', ['GNU_LIBC_VERSION']),
    apparmorRestrictUnprivilegedUserns: configuration.apparmorRestrictUnprivilegedUserns,
    fuseUserAllowOther: configuration.fuseUserAllowOther,
    sandboxBackend: configuration.sandboxBackend,
    sandboxBackendViable: configuration.sandboxBackendViable,
  },
  node: { version, modules },
  tools: classified.map(item => item.proof),
  reports,
});
writeFileSync(path.resolve(values.output ?? 'runtime-proof.json'), `${JSON.stringify(proof, null, 2)}\n`);
const counts: Record<CheckStatus, number> = { passed: 0, failed: 0, skipped: 0, 'not-run': 0, 'prerequisite-blocked': 0 };
for (const capability of proof.capabilities) counts[capability.status] += 1;
console.log(`Wrote runtime proof tested ${proof.testedCommit} source ${proof.sourceCommit}: ${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped, ${counts['not-run']} not-run, ${counts['prerequisite-blocked']} prerequisite-blocked. Reporting ${proof.reporting.status}.`);
if (proof.reporting.status !== 'ok') process.exitCode = 1;

function actionTrace(): { repository: string | null; workflow: string | null; job: string | null; runId: string | null; runAttempt: string | null; runUrl: string | null } {
  const repository = optionalEnv(process.env.GITHUB_REPOSITORY);
  const runId = optionalEnv(process.env.GITHUB_RUN_ID);
  return {
    repository,
    workflow: optionalEnv(process.env.GITHUB_WORKFLOW),
    job: optionalEnv(process.env.GITHUB_JOB),
    runId,
    runAttempt: optionalEnv(process.env.GITHUB_RUN_ATTEMPT),
    runUrl: repository !== null && runId !== null ? `https://github.com/${repository}/actions/runs/${runId}` : null,
  };
}
