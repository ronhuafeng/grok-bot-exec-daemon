import { spawnSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { collectHostFacts, recordHostConfiguration } from './host-preflight.js';
import { root } from './project.js';
import { parseRuntimeToolLock } from './runtime-provision.js';
import type { LockedTool } from './runtime-provision.js';
import { assertProducedToolIdentity, buildRuntimeProof, classifyTool, resolveProofHostScope } from './runtime-proof.js';
import type { RuntimeProof, RuntimeProofHost, RuntimeProofNode, RuntimeProofReporting, RuntimeProofTool } from './runtime-proof.js';

export interface EmitReportRequest { step: string; file: string }
export interface EmitRuntimeProofRequest {
  reports: readonly EmitReportRequest[];
  blocked: ReadonlyMap<string, string>;
  outputPath: string;
  failureStage: string | null;
  runtimeRoot: string;
  lockPath?: string;
  sourceSha?: string;
  testedSha?: string;
  hostScope?: string;
}

export interface EmitRuntimeProofResult {
  proof: RuntimeProof;
  exitCode: number;
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

function captureText(command: string, args: string[]): string | undefined {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) return undefined;
  const text = result.stdout.trim();
  return text === '' ? undefined : text;
}

function optionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === '') return null;
  return trimmed;
}

function appendError(reporting: RuntimeProofReporting, message: string): RuntimeProofReporting {
  if (reporting.status === 'ok' || reporting.error === null) return { status: 'metadata-failed', error: message };
  return { status: 'metadata-failed', error: `${reporting.error}\n${message}` };
}

function readReport(file: string): { xml: string | null; error: string | null } {
  try {
    return { xml: readFileSync(file, 'utf8'), error: null };
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return { xml: null, error: null };
    return { xml: null, error: `Runtime proof report is unreadable: ${file}` };
  }
}

function readProvisionedBytes(tool: LockedTool, runtimeRoot: string): { bytes: Uint8Array | undefined; error: string | null } {
  const destination = path.join(runtimeRoot, tool.dest);
  let stat: ReturnType<typeof statSync>;
  try {
    stat = statSync(destination);
  } catch (error) {
    if (errorCode(error) === 'ENOENT') return { bytes: undefined, error: null };
    return { bytes: undefined, error: `Runtime proof tool is unreadable: ${tool.id}` };
  }
  if (tool.kind === 'file') {
    if (!stat.isFile()) return { bytes: undefined, error: null };
    try {
      return { bytes: readFileSync(destination), error: null };
    } catch {
      return { bytes: undefined, error: `Runtime proof tool is unreadable: ${tool.id}` };
    }
  }
  if (!stat.isDirectory()) return { bytes: undefined, error: null };
  const archive = tool.sources.find(source => source.kind === 'repo-archive');
  if (archive === undefined || archive.kind !== 'repo-archive') {
    return { bytes: undefined, error: `Runtime proof tool has no archive identity: ${tool.id}` };
  }
  try {
    return { bytes: readFileSync(path.join(root, archive.path)), error: null };
  } catch {
    return { bytes: undefined, error: `Runtime proof archive is missing: ${tool.id}` };
  }
}

function observeNode(runtimeRoot: string): RuntimeProofNode {
  const reported = captureText(path.join(runtimeRoot, 'node'), ['-p', 'process.version + " " + process.versions.modules']);
  if (reported === undefined) return { version: null, modules: null, state: 'unavailable' };
  const parts = reported.split(' ');
  const version = parts[0];
  const modules = Number(parts[1]);
  if (version === undefined || !/^v\d+\.\d+\.\d+$/.test(version) || !Number.isInteger(modules)) {
    return { version: null, modules: null, state: 'unavailable' };
  }
  return { version, modules, state: 'produced' };
}

function commitSha(explicit: string | undefined, envName: string, gitArgs: string[]): string | undefined {
  const fromArg = explicit?.trim();
  if (fromArg !== undefined && fromArg !== '') return fromArg;
  const fromEnv = process.env[envName]?.trim();
  if (fromEnv !== undefined && fromEnv !== '') return fromEnv;
  return captureText('git', gitArgs);
}

function observeHost(scope: ReturnType<typeof resolveProofHostScope>): { host: RuntimeProofHost; error: string | null } {
  const kernel = captureText('uname', ['-r']) ?? '';
  const libc = captureText('getconf', ['GNU_LIBC_VERSION']) ?? '';
  try {
    const configuration = recordHostConfiguration(collectHostFacts(), scope);
    if (configuration.scope !== scope) {
      return {
        host: fallbackHost(kernel, libc),
        error: `Host scope ${scope} was rewritten to ${configuration.scope}`,
      };
    }
    return {
      host: {
        os: process.platform,
        arch: process.arch,
        kernel,
        libc,
        apparmorRestrictUnprivilegedUserns: configuration.apparmorRestrictUnprivilegedUserns,
        fuseUserAllowOther: configuration.fuseUserAllowOther,
        sandboxBackend: configuration.sandboxBackend,
        sandboxBackendViable: configuration.sandboxBackendViable,
      },
      error: kernel === '' || libc === '' ? 'Runtime proof host identity could not be fully observed' : null,
    };
  } catch (error) {
    return { host: fallbackHost(kernel, libc), error: error instanceof Error ? error.message : String(error) };
  }
}

function fallbackHost(kernel: string, libc: string): RuntimeProofHost {
  return {
    os: process.platform,
    arch: process.arch,
    kernel,
    libc,
    apparmorRestrictUnprivilegedUserns: 'unreadable',
    fuseUserAllowOther: 'unreadable',
    sandboxBackend: 'bubblewrap',
    sandboxBackendViable: 'unreadable',
  };
}

function actionTrace(): RuntimeProof['actions'] {
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

/** Collects each observation independently and always writes the conformance record. */
export function emitRuntimeProof(request: EmitRuntimeProofRequest): EmitRuntimeProofResult {
  const scope = resolveProofHostScope(request.hostScope ?? process.env.RUNTIME_PROOF_HOST_SCOPE);
  const failureStage = request.failureStage?.trim() ? request.failureStage.trim() : null;
  let reporting: RuntimeProofReporting = { status: 'ok', error: null };
  const sourceCommit = commitSha(request.sourceSha, 'RUNTIME_PROOF_SOURCE_SHA', ['-C', root, 'rev-parse', 'HEAD']);
  const testedCommit = commitSha(request.testedSha, 'RUNTIME_PROOF_TESTED_SHA', ['-C', root, 'rev-parse', 'HEAD']);
  if (sourceCommit === undefined) reporting = appendError(reporting, 'Runtime proof source commit could not be observed');
  if (testedCommit === undefined) reporting = appendError(reporting, 'Runtime proof tested commit could not be observed');

  const hostObservation = observeHost(scope);
  if (hostObservation.error !== null) reporting = appendError(reporting, hostObservation.error);

  let tools: RuntimeProofTool[] = [];
  try {
    const lock = parseRuntimeToolLock(JSON.parse(readFileSync(request.lockPath ?? path.join(root, 'runtime/tools.lock.json'), 'utf8')) as unknown);
    const selected = lock.tools.filter(tool => tool.profiles.includes('supported'));
    tools = selected.map(tool => {
      const read = readProvisionedBytes(tool, request.runtimeRoot);
      if (read.error !== null) reporting = appendError(reporting, read.error);
      return classifyTool(tool, read.bytes);
    });
    if (failureStage === null) {
      try {
        assertProducedToolIdentity(selected.map((tool, index) => ({ id: tool.id, optional: tool.optional, state: tools[index]?.state ?? 'unavailable' })));
      } catch (error) {
        reporting = appendError(reporting, error instanceof Error ? error.message : String(error));
      }
    }
  } catch (error) {
    reporting = appendError(reporting, error instanceof Error ? error.message : String(error));
  }

  const node = observeNode(request.runtimeRoot);
  if (node.state === 'unavailable' && failureStage === null) {
    reporting = appendError(reporting, 'Provisioned Node identity could not be produced');
  }

  const reports = request.reports.map(report => {
    const reason = request.blocked.get(report.step);
    if (reason !== undefined) return { step: report.step, file: report.file, xml: null, blockedReason: reason };
    const read = readReport(report.file);
    if (read.error !== null) reporting = appendError(reporting, read.error);
    return { step: report.step, file: report.file, xml: read.xml, blockedReason: undefined };
  });

  const proof = assembleProof({
    sourceCommit: sourceCommit ?? '0'.repeat(40),
    testedCommit: testedCommit ?? '0'.repeat(40),
    failureStage,
    scope,
    host: hostObservation.host,
    node,
    tools,
    reports,
    reporting,
  });
  writeFileSync(request.outputPath, `${JSON.stringify(proof, null, 2)}\n`);
  const exitCode = proof.reporting.status !== 'ok' && proof.failureStage === null ? 1 : 0;
  return { proof, exitCode };
}

function assembleProof(input: {
  sourceCommit: string;
  testedCommit: string;
  failureStage: string | null;
  scope: ReturnType<typeof resolveProofHostScope>;
  host: RuntimeProofHost;
  node: RuntimeProofNode;
  tools: RuntimeProofTool[];
  reports: { step: string; file: string; xml: string | null; blockedReason: string | undefined }[];
  reporting: RuntimeProofReporting;
}): RuntimeProof {
  const runnableReports = input.reports.length > 0 ? input.reports : [{
    step: 'runtime proof',
    file: 'runtime-proof.json',
    xml: null,
    blockedReason: input.failureStage ?? 'no junit reports were declared',
  }];
  const runnableTools = input.tools.length > 0 ? input.tools : [placeholderTool()];
  try {
    return buildRuntimeProof({
      sourceCommit: input.sourceCommit,
      testedCommit: input.testedCommit,
      workflowRunId: optionalEnv(process.env.GITHUB_RUN_ID),
      workflowRunAttempt: optionalEnv(process.env.GITHUB_RUN_ATTEMPT),
      reporting: input.reporting,
      actions: actionTrace(),
      profile: 'supported',
      failureStage: input.failureStage,
      hostScope: input.scope,
      host: input.host,
      node: input.node,
      tools: runnableTools,
      reports: runnableReports,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const reporting = appendError(input.reporting, message);
    return buildRuntimeProof({
      sourceCommit: /^[0-9a-f]{40}$/.test(input.sourceCommit) ? input.sourceCommit : '0'.repeat(40),
      testedCommit: /^[0-9a-f]{40}$/.test(input.testedCommit) ? input.testedCommit : '0'.repeat(40),
      workflowRunId: optionalEnv(process.env.GITHUB_RUN_ID),
      workflowRunAttempt: optionalEnv(process.env.GITHUB_RUN_ATTEMPT),
      reporting,
      actions: actionTrace(),
      profile: 'supported',
      failureStage: input.failureStage,
      hostScope: input.scope,
      host: linuxHost(input.host),
      node: { version: null, modules: null, state: 'unavailable' },
      tools: [placeholderTool()],
      reports: runnableReports.map(report => ({ ...report, xml: null, blockedReason: report.blockedReason ?? input.failureStage ?? 'metadata observation failed' })),
    });
  }
}

function linuxHost(host: RuntimeProofHost): RuntimeProofHost {
  return {
    os: 'linux',
    arch: 'x64',
    kernel: host.kernel === '' ? 'unobserved' : host.kernel,
    libc: host.libc.toLowerCase().includes('glibc') ? host.libc : 'glibc unobserved',
    apparmorRestrictUnprivilegedUserns: 'unreadable',
    fuseUserAllowOther: 'unreadable',
    sandboxBackend: 'bubblewrap',
    sandboxBackendViable: 'unreadable',
  };
}

function placeholderTool(): RuntimeProofTool {
  return {
    id: 'runtime',
    version: 'unobserved',
    expectedSha256: '0'.repeat(64),
    provisionedSha256: null,
    state: 'unavailable',
  };
}
