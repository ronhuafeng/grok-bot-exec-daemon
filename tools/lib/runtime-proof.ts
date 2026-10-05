import { sha256 } from './runtime-provision.js';

export const RUNTIME_PROOF_SCHEMA_VERSION = 2;

const commitSha = /^[0-9a-f]{40}$/;
const contentSha = /^[0-9a-f]{64}$/;
const apparmorValues = new Set(['0', '1', 'unavailable', 'unreadable', 'unexpected']);
const fuseValues = new Set(['enabled', 'disabled', 'unavailable', 'unreadable']);
const viabilityValues = new Set(['viable', 'not-viable', 'unavailable', 'unreadable']);
const hostScopes = new Set(['observed-host', 'prepared-runner']);
const toolStates = new Set(['verified', 'absent', 'mismatch']);

export type ProofHostScope = 'observed-host' | 'prepared-runner';
export type ToolState = 'verified' | 'absent' | 'mismatch';
export type CheckStatus = 'passed' | 'failed' | 'skipped';

export interface RuntimeProofTool {
  id: string;
  version: string;
  expectedSha256: string;
  provisionedSha256: string | null;
  state: ToolState;
}
export interface RuntimeProofCheck {
  name: string;
  file: string;
  status: CheckStatus;
  step: string;
}
export interface RuntimeProofReport { step: string; file: string }
export interface RuntimeProofHost {
  os: string;
  arch: string;
  kernel: string;
  libc: string;
  apparmorRestrictUnprivilegedUserns: '0' | '1' | 'unavailable' | 'unreadable' | 'unexpected';
  fuseUserAllowOther: 'enabled' | 'disabled' | 'unavailable' | 'unreadable';
  sandboxBackend: 'bubblewrap';
  sandboxBackendViable: 'viable' | 'not-viable' | 'unavailable' | 'unreadable';
}
export interface RuntimeProof {
  schemaVersion: 2;
  sourceCommit: string;
  testedCommit: string;
  workflowRunId: string | null;
  workflowRunAttempt: string | null;
  profile: 'supported';
  hostScope: ProofHostScope;
  host: RuntimeProofHost;
  node: { version: string; modules: number };
  tools: RuntimeProofTool[];
  checks: RuntimeProofCheck[];
  reports: RuntimeProofReport[];
}

export interface ClassifiableTool {
  id: string;
  version: string;
  sha256?: string;
  sources?: readonly { kind: string; sha256?: string }[];
}
export interface RuntimeProofReportInput {
  step: string;
  file: string;
  xml: string;
}
export interface RuntimeProofInput {
  sourceCommit: string;
  testedCommit: string;
  workflowRunId: string | null;
  workflowRunAttempt: string | null;
  profile: 'supported';
  hostScope: ProofHostScope;
  host: RuntimeProofHost;
  node: { version: string; modules: number };
  tools: readonly RuntimeProofTool[];
  reports: readonly RuntimeProofReportInput[];
  requireAllPassed?: boolean;
}

/** Invalid or unset workflow scope is the observed host. A prepared runner is never relabeled. */
export function resolveProofHostScope(value: string | undefined): ProofHostScope {
  const scope = value?.trim();
  if (scope === 'prepared-runner' || scope === 'observed-host') return scope;
  return 'observed-host';
}

export function passedChecks(checks: readonly RuntimeProofCheck[]): RuntimeProofCheck[] {
  return checks.filter(check => check.status === 'passed');
}

export function classifyTool(lockEntry: ClassifiableTool, provisionedBytes: Uint8Array | undefined): RuntimeProofTool {
  const expectedSha256 = expectedToolSha256(lockEntry);
  if (provisionedBytes === undefined) {
    return { id: lockEntry.id, version: lockEntry.version, expectedSha256, provisionedSha256: null, state: 'absent' };
  }
  const provisionedSha256 = sha256(provisionedBytes);
  return {
    id: lockEntry.id,
    version: lockEntry.version,
    expectedSha256,
    provisionedSha256,
    state: provisionedSha256 === expectedSha256 ? 'verified' : 'mismatch',
  };
}

/** Required tools must be verified. An optional tool may be absent; a lock hash alone is not verification. */
export function assertProducedToolIdentity(tools: readonly { id: string; optional: boolean; state: ToolState }[]): void {
  for (const tool of tools) {
    if (tool.state === 'verified') continue;
    if (tool.optional && tool.state === 'absent') continue;
    throw new Error(`Runtime proof tool is not verified: ${tool.id} (${tool.state})`);
  }
}

export function buildRuntimeProof(input: RuntimeProofInput): RuntimeProof {
  if (!commitSha.test(input.sourceCommit) || !commitSha.test(input.testedCommit)) {
    throw new Error('Runtime proof requires full Git commit SHAs');
  }
  if (input.profile !== 'supported') throw new Error('Runtime proof profile is incomplete');
  if (!hostScopes.has(input.hostScope)) throw new Error('Runtime proof host scope is incomplete');
  assertHost(input.host);
  if (!/^v\d+\.\d+\.\d+$/.test(input.node.version) || !Number.isInteger(input.node.modules)) {
    throw new Error('Runtime proof Node identity is incomplete');
  }
  if (input.workflowRunId !== null && input.workflowRunId === '') throw new Error('Runtime proof workflow run id is incomplete');
  if (input.workflowRunAttempt !== null && input.workflowRunAttempt === '') throw new Error('Runtime proof workflow run attempt is incomplete');
  if (input.tools.length === 0) throw new Error('Runtime proof tool identities are incomplete');
  for (const tool of input.tools) assertTool(tool);
  if (input.reports.length === 0) throw new Error('JUnit report is missing');
  const checks: RuntimeProofCheck[] = [];
  const reports: RuntimeProofReport[] = [];
  for (const report of input.reports) {
    if (report.step.trim() === '' || report.file.trim() === '') throw new Error('JUnit report identity is incomplete');
    reports.push({ step: report.step, file: report.file });
    checks.push(...parseJunitChecks(report.xml, report.file, report.step));
  }
  if (input.requireAllPassed === true && checks.some(check => check.status !== 'passed')) {
    throw new Error('Runtime proof check did not pass');
  }
  return {
    schemaVersion: RUNTIME_PROOF_SCHEMA_VERSION,
    sourceCommit: input.sourceCommit,
    testedCommit: input.testedCommit,
    workflowRunId: input.workflowRunId,
    workflowRunAttempt: input.workflowRunAttempt,
    profile: 'supported',
    hostScope: input.hostScope,
    host: { ...input.host },
    node: { version: input.node.version, modules: input.node.modules },
    tools: input.tools.map(tool => ({ ...tool })),
    checks,
    reports,
  };
}

function expectedToolSha256(lockEntry: ClassifiableTool): string {
  if (lockEntry.id === '' || lockEntry.version === '') throw new Error('Runtime proof tool identities are incomplete');
  if (lockEntry.sha256 !== undefined) {
    if (!contentSha.test(lockEntry.sha256)) throw new Error(`Runtime proof tool hash is incomplete: ${lockEntry.id}`);
    return lockEntry.sha256;
  }
  const archive = lockEntry.sources?.find(source => source.kind === 'repo-archive' && source.sha256 !== undefined);
  if (archive?.sha256 !== undefined && contentSha.test(archive.sha256)) return archive.sha256;
  throw new Error(`Runtime proof tool hash is incomplete: ${lockEntry.id}`);
}

function assertHost(host: RuntimeProofHost): void {
  if (host.os !== 'linux' || host.arch !== 'x64' || host.kernel === '' || !host.libc.toLowerCase().includes('glibc')) {
    throw new Error('Runtime proof host identity is incomplete');
  }
  if (!apparmorValues.has(host.apparmorRestrictUnprivilegedUserns) || !fuseValues.has(host.fuseUserAllowOther)) {
    throw new Error('Runtime proof host identity is incomplete');
  }
  if (host.sandboxBackend !== 'bubblewrap' || !viabilityValues.has(host.sandboxBackendViable)) {
    throw new Error('Runtime proof host identity is incomplete');
  }
}

function assertTool(tool: RuntimeProofTool): void {
  if (tool.id === '' || tool.version === '' || !contentSha.test(tool.expectedSha256) || !toolStates.has(tool.state)) {
    throw new Error('Runtime proof tool identities are incomplete');
  }
  if (tool.state === 'absent') {
    if (tool.provisionedSha256 !== null) throw new Error('Runtime proof tool identities are incomplete');
    return;
  }
  if (tool.provisionedSha256 === null || !contentSha.test(tool.provisionedSha256)) {
    throw new Error('Runtime proof tool identities are incomplete');
  }
  const matches = tool.provisionedSha256 === tool.expectedSha256;
  if (tool.state === 'verified' && !matches) throw new Error('Runtime proof tool identities are incomplete');
  if (tool.state === 'mismatch' && matches) throw new Error('Runtime proof tool identities are incomplete');
}

function parseJunitChecks(xml: string, reportFile: string, step: string): RuntimeProofCheck[] {
  const trimmed = xml.replace(/^\uFEFF/, '').trim();
  if (trimmed === '') throw new Error('JUnit report is empty');
  if (!trimmed.startsWith('<')) throw new Error('JUnit report is not XML');
  if (!/<(?:testsuites|testsuite|testcase)(?:\s|>|\/)/.test(trimmed)) throw new Error('JUnit report is not XML');
  const checks: RuntimeProofCheck[] = [];
  let index = 0;
  while (index < trimmed.length) {
    const start = trimmed.indexOf('<testcase', index);
    if (start === -1) break;
    const tagEnd = trimmed.indexOf('>', start);
    if (tagEnd === -1) throw new Error('JUnit report is not XML');
    const opening = trimmed.slice(start, tagEnd + 1);
    const attrs = parseAttributes(opening);
    const name = attrs.get('name');
    if (name === undefined || name === '') throw new Error('JUnit testcase name is missing');
    let body = '';
    let next = tagEnd + 1;
    if (!opening.endsWith('/>')) {
      const close = findClosingTestcase(trimmed, tagEnd + 1);
      body = trimmed.slice(tagEnd + 1, close.start);
      next = close.end;
    }
    if (next <= index) throw new Error('JUnit report is not XML');
    checks.push({ name, file: testcaseFile(attrs, reportFile), status: testcaseStatus(body), step });
    index = next;
  }
  if (checks.length === 0) throw new Error('JUnit report is empty');
  return checks;
}

function testcaseStatus(body: string): CheckStatus {
  if (/<(?:failure|error)(?:\s|\/|>)/.test(body)) return 'failed';
  if (/<skipped(?:\s|\/|>)/.test(body)) return 'skipped';
  return 'passed';
}

function testcaseFile(attrs: Map<string, string>, reportFile: string): string {
  // Node 22's JUnit reporter hardcodes classname="test" and omits the source path.
  const explicit = attrs.get('file');
  if (explicit !== undefined && explicit !== '') return fileBasename(explicit);
  const classname = attrs.get('classname');
  if (classname !== undefined && classname !== 'test' && /\.(?:js|mjs|cjs|ts)$/.test(classname)) return fileBasename(classname);
  const base = fileBasename(reportFile);
  if (base === '') throw new Error('JUnit report file name is missing');
  return base;
}

function fileBasename(file: string): string {
  const parts = file.replace(/\\/g, '/').split('/');
  return parts.at(-1) ?? file;
}

function parseAttributes(tag: string): Map<string, string> {
  const attrs = new Map<string, string>();
  for (const match of tag.matchAll(/([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    const key = match[1];
    const value = match[2] ?? match[3];
    if (key === undefined || value === undefined) continue;
    attrs.set(key, decodeXml(value));
  }
  return attrs;
}

function findClosingTestcase(xml: string, from: number): { start: number; end: number } {
  let depth = 1;
  let index = from;
  while (index < xml.length) {
    const nextOpen = xml.indexOf('<testcase', index);
    const nextClose = xml.indexOf('</testcase>', index);
    if (nextClose === -1) throw new Error('JUnit report is not XML');
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      index = nextOpen + '<testcase'.length;
      continue;
    }
    depth -= 1;
    if (depth === 0) return { start: nextClose, end: nextClose + '</testcase>'.length };
    index = nextClose + '</testcase>'.length;
  }
  throw new Error('JUnit report is not XML');
}

function decodeXml(value: string): string {
  return value.replace(/&(?:#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, entity => {
    if (entity === '&lt;') return '<';
    if (entity === '&gt;') return '>';
    if (entity === '&amp;') return '&';
    if (entity === '&quot;') return '"';
    if (entity === '&apos;') return "'";
    if (entity.startsWith('&#x')) return String.fromCodePoint(Number.parseInt(entity.slice(3, -1), 16));
    return String.fromCodePoint(Number.parseInt(entity.slice(2, -1), 10));
  });
}
