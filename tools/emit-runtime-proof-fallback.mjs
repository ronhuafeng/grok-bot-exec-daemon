import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const reports = [];
const blocked = new Map();
let failureStage = null;
let output = 'runtime-proof.json';
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  const value = args[index + 1];
  if (flag === '--report' || flag === '--blocked') {
    const split = value.indexOf('=');
    const step = value.slice(0, split);
    const rest = value.slice(split + 1);
    if (flag === '--report') reports.push({ step, file: rest });
    else blocked.set(step, rest);
    index += 1;
  } else if (flag === '--failure-stage') {
    failureStage = value;
    index += 1;
  } else if (flag === '--output') {
    output = value;
    index += 1;
  } else {
    throw new Error(`Unknown fallback argument ${flag}`);
  }
}
if (reports.length === 0) throw new Error('--report is required');

function capture(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const text = result.stdout.trim();
  return text === '' ? null : text;
}

const head = capture('git', ['rev-parse', 'HEAD']) ?? '0'.repeat(40);
const lock = JSON.parse(readFileSync(path.join(process.cwd(), 'runtime/tools.lock.json'), 'utf8'));
const tools = [];
for (const tool of lock.tools) {
  if (!tool.profiles.includes('supported')) continue;
  const expected = tool.sha256 ?? tool.sources?.find(source => source.sha256)?.sha256;
  tools.push({
    id: tool.id,
    version: tool.version,
    expectedSha256: expected,
    provisionedSha256: null,
    state: tool.optional === true ? 'absent' : 'unavailable',
  });
}

const proof = {
  schemaVersion: 4,
  sourceCommit: head,
  testedCommit: head,
  workflowRunId: process.env.GITHUB_RUN_ID ?? null,
  workflowRunAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
  profile: 'supported',
  failureStage,
  hostScope: process.env.RUNTIME_PROOF_HOST_SCOPE === 'prepared-runner' ? 'prepared-runner' : 'observed-host',
  host: {
    os: 'linux',
    arch: 'x64',
    kernel: capture('uname', ['-r']) ?? 'unobserved',
    libc: capture('getconf', ['GNU_LIBC_VERSION']) ?? 'glibc unobserved',
    apparmorRestrictUnprivilegedUserns: 'unreadable',
    fuseUserAllowOther: 'unreadable',
    sandboxBackend: 'bubblewrap',
    sandboxBackendViable: 'unreadable',
  },
  node: { version: null, modules: null, state: 'unavailable' },
  tools,
  checks: [],
  capabilities: reports.map(report => ({
    step: report.step,
    status: blocked.has(report.step) || failureStage !== null ? 'prerequisite-blocked' : 'not-run',
    detail: blocked.get(report.step) ?? failureStage ?? 'compiled emitter was not produced',
  })),
  reporting: { status: 'ok', error: null },
  actions: {
    repository: process.env.GITHUB_REPOSITORY ?? null,
    workflow: process.env.GITHUB_WORKFLOW ?? null,
    job: process.env.GITHUB_JOB ?? null,
    runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    runUrl: process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : null,
  },
  reports: reports.map(report => ({ step: report.step, file: report.file })),
};
writeFileSync(path.resolve(output), `${JSON.stringify(proof, null, 2)}\n`);
console.log(`Wrote fallback runtime proof failure stage ${failureStage ?? 'none'}.`);
