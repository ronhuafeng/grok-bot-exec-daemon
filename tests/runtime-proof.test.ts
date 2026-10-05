import test from 'node:test';
import assert from 'node:assert/strict';
import { REQUIRED_LIVE_CHECKS, buildRuntimeProof, parseTapStatuses } from '../tools/lib/runtime-proof.js';

const identity = {
  commit: '3cdd641a1f0f58fca4861afca064fe08254c7cc9',
  profile: 'supported' as const,
  host: { os: 'linux', arch: 'x64', kernel: '6.8.0', libc: 'glibc 2.39' },
  node: { version: 'v22.14.0', modules: 127 },
  tools: [{ id: 'node', version: '22.14.0', sha256: 'a'.repeat(64) }],
};

test('runtime proof accepts a complete passing TAP log and rejects gaps', () => {
  const tap = ['TAP version 13', ...REQUIRED_LIVE_CHECKS.map((name, index) => `ok ${index + 1} - ${name}`), `1..${REQUIRED_LIVE_CHECKS.length}`].join('\n');
  const proof = buildRuntimeProof({ ...identity, tap });
  assert.equal(proof.schemaVersion, 1);
  assert.equal(proof.checks.length, REQUIRED_LIVE_CHECKS.length);
  assert.equal(parseTapStatuses('not ok 2 - the pinned pty addon opens a real process').get('the pinned pty addon opens a real process'), 'failed');
  assert.throws(() => buildRuntimeProof({ ...identity, commit: 'abc', tap }), /commit/);
  assert.throws(() => buildRuntimeProof({ ...identity, tap: tap.replace(REQUIRED_LIVE_CHECKS[0], 'renamed check') }), /did not pass/);
});
