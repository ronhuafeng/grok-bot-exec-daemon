import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { emitRuntimeProof } from '../tools/lib/emit-runtime-proof.js';
import { root } from '../tools/lib/project.js';
import { sha256 } from '../tools/lib/runtime-provision.js';
import {
  assertProducedToolIdentity,
  buildRuntimeProof,
  classifyTool,
  passedChecks,
  resolveProofHostScope,
} from '../tools/lib/runtime-proof.js';
import type { RuntimeProofInput, RuntimeProofTool } from '../tools/lib/runtime-proof.js';

const hash = 'a'.repeat(64);
const sourceCommit = '3cdd641a1f0f58fca4861afca064fe08254c7cc9';
const testedCommit = '18010f97b6069ccc4916f51be99a9f4992146d25';

const verifiedTool: RuntimeProofTool = {
  id: 'node',
  version: '22.14.0',
  expectedSha256: hash,
  provisionedSha256: hash,
  state: 'verified',
};

function identity(reports: RuntimeProofInput['reports'], extras: Partial<RuntimeProofInput> = {}): RuntimeProofInput {
  return {
    sourceCommit,
    testedCommit,
    workflowRunId: '37317019167',
    workflowRunAttempt: '1',
    profile: 'supported',
    hostScope: 'prepared-runner',
    host: {
      os: 'linux',
      arch: 'x64',
      kernel: '6.8.0',
      libc: 'glibc 2.39',
      apparmorRestrictUnprivilegedUserns: '0',
      fuseUserAllowOther: 'enabled',
      sandboxBackend: 'bubblewrap',
      sandboxBackendViable: 'viable',
    },
    failureStage: null,
    node: { version: 'v22.14.0', modules: 127, state: 'produced' },
    tools: [verifiedTool],
    reports,
    ...extras,
  };
}

const passingXml = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<testsuites>',
  '<testcase name="alpha passes" time="0.001" classname="native-runtime.test.js" file="dist/project/tests/live/native-runtime.test.js"/>',
  '</testsuites>',
].join('\n');

test('passing junit records passed checks for the caller step and file', () => {
  const proof = buildRuntimeProof(identity([{
    step: 'Native addons and PTY output',
    file: 'proof-reports/native-pty.junit.xml',
    xml: passingXml,
  }]));
  assert.equal(proof.schemaVersion, 4);
  assert.equal(proof.failureStage, null);
  assert.equal(proof.node.state, 'produced');
  assert.equal(proof.capabilities[0]?.status, 'passed');
  assert.equal(proof.reporting.status, 'ok');
  assert.equal(proof.sourceCommit, sourceCommit);
  assert.equal(proof.testedCommit, testedCommit);
  assert.notEqual(proof.sourceCommit, proof.testedCommit);
  assert.equal(proof.checks.length, 1);
  assert.equal(proof.checks[0]?.status, 'passed');
  assert.equal(proof.checks[0]?.name, 'alpha passes');
  assert.equal(proof.checks[0]?.file, 'native-runtime.test.js');
  assert.equal(proof.checks[0]?.step, 'Native addons and PTY output');
  assert.equal(proof.reports[0]?.file, 'proof-reports/native-pty.junit.xml');
  assert.deepEqual(passedChecks(proof.checks).map(check => check.name), ['alpha passes']);
});

test('skipped junit stays skipped and is not counted as passed', () => {
  const reports = [{
    step: 'HTTP and PTY authentication',
    file: 'proof-reports/server.junit.xml',
    xml: '<testcase name="example"><skipped message="skip"/></testcase>',
  }];
  const proof = buildRuntimeProof(identity(reports));
  assert.equal(proof.checks[0]?.status, 'skipped');
  assert.equal(proof.checks[0]?.name, 'example');
  assert.equal(proof.checks[0]?.file, 'server.junit.xml');
  assert.notEqual(proof.checks[0]?.status, 'passed');
  assert.deepEqual(passedChecks(proof.checks), []);
  assert.throws(() => buildRuntimeProof(identity(reports, { requireAllPassed: true })), /did not pass/);
});

test('failed junit stays failed', () => {
  const reports = [{
    step: 'Native addons and PTY output',
    file: 'proof-reports/native-pty.junit.xml',
    xml: '<testsuites><testcase name="gamma fails" classname="pty-runtime.test.js"><failure type="testCodeFailure" message="nope">stack</failure></testcase></testsuites>',
  }];
  const proof = buildRuntimeProof(identity(reports));
  assert.equal(proof.checks[0]?.status, 'failed');
  assert.equal(proof.checks[0]?.file, 'pty-runtime.test.js');
  assert.deepEqual(passedChecks(proof.checks), []);
  assert.throws(() => buildRuntimeProof(identity(reports, { requireAllPassed: true })), /did not pass/);
});

test('an honest record keeps failed and skipped checks without requireAllPassed', () => {
  const proof = buildRuntimeProof(identity([{
    step: 'Sandbox filesystem and network confinement',
    file: 'proof-reports/sandbox.junit.xml',
    xml: [
      '<testsuites>',
      '<testcase name="allows a workspace write" classname="sandbox-runtime.test.js"/>',
      '<testcase name="example"><skipped message="skip"/></testcase>',
      '<testcase name="denies a local network connection" classname="sandbox-runtime.test.js"><error message="boom">stack</error></testcase>',
      '</testsuites>',
    ].join(''),
  }]));
  assert.deepEqual(proof.checks.map(check => check.status), ['passed', 'skipped', 'failed']);
  assert.deepEqual(passedChecks(proof.checks).map(check => check.status), ['passed']);
  assert.equal(proof.capabilities[0]?.status, 'failed');
});

test('missing and blocked capabilities stay distinct from native results', () => {
  const proof = buildRuntimeProof(identity([
    { step: 'Native addons and PTY output', file: 'proof-reports/native-pty.junit.xml', xml: null },
    { step: 'Sandbox filesystem and network confinement', file: 'proof-reports/sandbox.junit.xml', xml: null, blockedReason: 'host preflight failed' },
  ]));
  assert.deepEqual(proof.checks, []);
  assert.deepEqual(proof.capabilities.map(item => item.status), ['not-run', 'prerequisite-blocked']);
  assert.equal(proof.capabilities[1]?.detail, 'host preflight failed');
  assert.deepEqual(passedChecks(proof.checks), []);
  const traced = buildRuntimeProof(identity([{ step: 'Native addons and PTY output', file: 'a.junit.xml', xml: passingXml }], {
    actions: { repository: 'ronhuafeng/grok-bot-exec-daemon', workflow: 'Runtime proof', job: 'proof', runId: '99', runAttempt: '1', runUrl: 'https://github.com/ronhuafeng/grok-bot-exec-daemon/actions/runs/99' },
    reporting: { status: 'metadata-failed', error: 'tool mismatch' },
  }));
  assert.equal(traced.checks[0]?.status, 'passed');
  assert.equal(traced.reporting.error, 'tool mismatch');
  assert.equal(traced.actions.runUrl, 'https://github.com/ronhuafeng/grok-bot-exec-daemon/actions/runs/99');
});

test('runtime proof rejects incomplete commits, host identity, and empty junit', () => {
  const reports = [{ step: 'Cgroup resource reporting', file: 'proof-reports/cgroup.junit.xml', xml: passingXml }];
  assert.throws(() => buildRuntimeProof(identity(reports, { sourceCommit: 'abc' })), /commit/i);
  assert.throws(() => buildRuntimeProof(identity(reports, { testedCommit: 'ABC123' })), /commit/i);
  assert.throws(() => buildRuntimeProof(identity(reports, { host: { ...identity(reports).host, kernel: '' } })), /host identity/);
  assert.throws(() => buildRuntimeProof(identity(reports, { node: { version: '22.14.0', modules: 127, state: 'produced' } })), /Node identity/);
  assert.throws(() => buildRuntimeProof(identity(reports, { node: { version: 'v22.14.0', modules: 127, state: 'unavailable' } })), /Node identity/);
  assert.throws(() => buildRuntimeProof(identity([{ ...reports[0]!, xml: '' }])), /empty/);
  assert.throws(() => buildRuntimeProof(identity([{ ...reports[0]!, xml: 'this is not xml' }])), /not XML/);
  assert.throws(() => buildRuntimeProof(identity([{ ...reports[0]!, xml: '<testsuites></testsuites>' }])), /empty/);
});

test('prepared-runner host scope is stored and not rewritten to observed-host', () => {
  const proof = buildRuntimeProof(identity([{
    step: 'Shutdown and restart lifecycle',
    file: 'proof-reports/shutdown.junit.xml',
    xml: passingXml,
  }], {
    hostScope: 'prepared-runner',
    host: {
      ...identity([]).host,
      apparmorRestrictUnprivilegedUserns: '1',
      sandboxBackendViable: 'not-viable',
    },
  }));
  assert.equal(proof.hostScope, 'prepared-runner');
  assert.notEqual(proof.hostScope, 'observed-host');
  assert.equal(proof.host.apparmorRestrictUnprivilegedUserns, '1');
  assert.equal(proof.host.sandboxBackend, 'bubblewrap');
  assert.equal(resolveProofHostScope(undefined), 'observed-host');
  assert.equal(resolveProofHostScope(''), 'observed-host');
  assert.equal(resolveProofHostScope('default-host'), 'observed-host');
  assert.equal(resolveProofHostScope(' prepared-runner '), 'prepared-runner');
  assert.equal(resolveProofHostScope('observed-host'), 'observed-host');
});

test('classifyTool keeps an optional absent tool absent and records hash match or mismatch', () => {
  const bytes = new TextEncoder().encode('tool-bytes');
  const expected = sha256(bytes);
  const other = sha256(new TextEncoder().encode('other-bytes'));
  const absent = classifyTool({ id: 'gh', version: '2.99.0', sha256: expected, optional: true }, undefined);
  assert.equal(absent.state, 'absent');
  assert.equal(absent.provisionedSha256, null);
  assert.notEqual(absent.state, 'verified');
  const verified = classifyTool({ id: 'node', version: '22.14.0', sha256: expected }, bytes);
  assert.equal(verified.state, 'verified');
  assert.equal(verified.provisionedSha256, expected);
  const mismatch = classifyTool({ id: 'rg', version: '15.1.0-cursor5', sha256: other }, bytes);
  assert.equal(mismatch.state, 'mismatch');
  assert.equal(mismatch.expectedSha256, other);
  assert.equal(mismatch.provisionedSha256, expected);
  const archive = classifyTool({
    id: 'tmux-root',
    version: '3.5a',
    sources: [{ kind: 'repo-archive', sha256: expected }],
  }, bytes);
  assert.equal(archive.state, 'verified');
  assert.equal(archive.expectedSha256, expected);
  assert.doesNotThrow(() => assertProducedToolIdentity([
    { id: 'node', optional: false, state: 'verified' },
    { id: 'gh', optional: true, state: 'absent' },
  ]));
  const unavailable = classifyTool({ id: 'node', version: '22.14.0', sha256: expected, optional: false }, undefined);
  assert.equal(unavailable.state, 'unavailable');
  assert.equal(unavailable.provisionedSha256, null);
  assert.notEqual(unavailable.state, 'absent');
  assert.throws(() => assertProducedToolIdentity([{ id: 'node', optional: false, state: 'absent' }]), /not verified/);
  assert.throws(() => assertProducedToolIdentity([{ id: 'node', optional: false, state: 'unavailable' }]), /could not be produced/);
  assert.throws(() => assertProducedToolIdentity([{ id: 'rg', optional: false, state: 'mismatch' }]), /not verified/);
  assert.throws(() => assertProducedToolIdentity([{ id: 'ssh-keygen', optional: true, state: 'mismatch' }]), /not verified/);
});

test('node:test junit preserves pass, skip, and failure', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'runtime-proof-'));
  const file = path.join(directory, 'sample.test.js');
  const report = path.join(directory, 'out.xml');
  writeFileSync(file, [
    "const test = require('node:test');",
    "test('alpha passes', () => {});",
    "test('beta skips', { skip: 'not now' }, () => {});",
    "test('gamma fails', () => { throw new Error('nope'); });",
    "test('parent', async (t) => { await t.test('child passes', () => {}); });",
    '',
  ].join('\n'));
    try {
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(process.execPath, ['--test', '--test-reporter=junit', `--test-reporter-destination=${report}`, file], { encoding: 'utf8', env });
    assert.equal(result.status, 1);
    const proof = buildRuntimeProof(identity([{
      step: 'Native addons and PTY output',
      file: 'proof-reports/native-pty.junit.xml',
      xml: readFileSync(report, 'utf8'),
    }]));
    const statuses = new Map(proof.checks.map(check => [check.name, check.status]));
    assert.equal(statuses.get('alpha passes'), 'passed');
    assert.equal(statuses.get('beta skips'), 'skipped');
    assert.equal(statuses.get('gamma fails'), 'failed');
    assert.equal(statuses.get('child passes'), 'passed');
    assert.equal(statuses.has('parent'), false);
    assert.equal(passedChecks(proof.checks).some(check => check.name === 'beta skips' || check.name === 'gamma fails'), false);
    assert.equal(proof.checks.find(check => check.name === 'beta skips')?.status, 'skipped');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function blockedReports(reason: string): { reports: { step: string; file: string }[]; blocked: Map<string, string> } {
  const steps = ['behavior-a', 'behavior-b'];
  const reports = steps.map(step => ({ step, file: `${step}.xml` }));
  const blocked = new Map(steps.map(step => [step, reason]));
  return { reports, blocked };
}

test('a missing runtime still writes a prerequisite-blocked record', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'runtime-proof-emit-'));
  const output = path.join(directory, 'runtime-proof.json');
  const runtimeRoot = path.join(directory, 'empty-runtime');
  mkdirSync(runtimeRoot);
  const blocked = blockedReports('host-preflight failed');
  try {
    const result = emitRuntimeProof({
      reports: blocked.reports,
      blocked: blocked.blocked,
      outputPath: output,
      failureStage: 'host-preflight',
      runtimeRoot,
      sourceSha: sourceCommit,
      testedSha: testedCommit,
    });
    assert.equal(result.exitCode, 0);
    const written = JSON.parse(readFileSync(output, 'utf8')) as { schemaVersion: number; failureStage: string; node: { state: string; version: string | null }; tools: { id: string; state: string }[]; capabilities: { status: string; detail: string }[]; reporting: { status: string } };
    assert.equal(written.schemaVersion, 4);
    assert.equal(written.failureStage, 'host-preflight');
    assert.equal(written.node.state, 'unavailable');
    assert.equal(written.node.version, null);
    assert.equal(written.tools.find(tool => tool.id === 'node')?.state, 'unavailable');
    assert.equal(written.tools.find(tool => tool.id === 'gh')?.state, 'absent');
    assert.notEqual(written.tools.find(tool => tool.id === 'node')?.state, 'absent');
    assert.deepEqual(written.capabilities.map(item => item.status), ['prerequisite-blocked', 'prerequisite-blocked']);
    assert.equal(result.proof.reporting.status, 'ok');
    assert.equal(written.reporting.status, 'ok');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a partial runtime records verified and unavailable tools without erasing the failure stage', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'runtime-proof-partial-'));
  const output = path.join(directory, 'runtime-proof.json');
  const runtimeRoot = path.join(directory, 'runtime');
  mkdirSync(runtimeRoot);
  copyFileSync(path.join(root, 'runtime-tools/ripgrep/linux-x64/rg'), path.join(runtimeRoot, 'rg'));
  const unreadable = path.join(directory, 'unreadable-report');
  mkdirSync(unreadable);
  try {
    const result = emitRuntimeProof({
      reports: [
        { step: 'behavior-a', file: path.join(directory, 'missing.xml') },
        { step: 'behavior-b', file: unreadable },
      ],
      blocked: new Map([['behavior-a', 'provision failed']]),
      outputPath: output,
      failureStage: 'provision',
      runtimeRoot,
      sourceSha: sourceCommit,
      testedSha: testedCommit,
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.proof.failureStage, 'provision');
    assert.equal(result.proof.reporting.status, 'metadata-failed');
    assert.match(result.proof.reporting.error ?? '', /unreadable/);
    assert.equal(result.proof.tools.find(tool => tool.id === 'rg')?.state, 'verified');
    assert.equal(result.proof.tools.find(tool => tool.id === 'origin')?.state, 'unavailable');
    assert.equal(result.proof.node.state, 'unavailable');
    assert.deepEqual(result.proof.capabilities.map(item => item.status), ['prerequisite-blocked', 'not-run']);
    assert.equal(result.proof.checks.length, 0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('required identity that was never produced fails metadata without a failure stage', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'runtime-proof-meta-'));
  const output = path.join(directory, 'runtime-proof.json');
  const runtimeRoot = path.join(directory, 'empty-runtime');
  mkdirSync(runtimeRoot);
  try {
    const result = emitRuntimeProof({
      reports: [{ step: 'behavior-a', file: path.join(directory, 'missing.xml') }],
      blocked: new Map<string, string>(),
      outputPath: output,
      failureStage: null,
      runtimeRoot,
      sourceSha: sourceCommit,
      testedSha: testedCommit,
    });
    assert.equal(result.exitCode, 1);
    assert.equal(result.proof.failureStage, null);
    assert.equal(result.proof.reporting.status, 'metadata-failed');
    assert.match(result.proof.reporting.error ?? '', /could not be produced/);
    assert.equal(result.proof.capabilities[0]?.status, 'not-run');
    assert.equal(JSON.parse(readFileSync(output, 'utf8')).schemaVersion, 4);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
