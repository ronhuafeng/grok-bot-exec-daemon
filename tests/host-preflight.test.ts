import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHost } from '../tools/lib/host-preflight.js';
import type { HostFacts } from '../tools/lib/host-preflight.js';

const ready: HostFacts = {
  platform: 'linux',
  arch: 'x64',
  libc: 'glibc 2.39',
  commands: { bwrap: true, fusermount3: true },
  fuseDevice: true,
  fuseUserAllowOther: true,
  cgroupV2: true,
  apparmorRestrictsUserNamespaces: false,
};

test('supported host preflight accepts a prepared Linux host and names each gap', () => {
  assert.equal(evaluateHost(ready, 'supported').some(check => !check.ok), false);
  const gaps = evaluateHost({
    ...ready,
    arch: 'arm64',
    libc: undefined,
    commands: { bwrap: false, fusermount3: false },
    fuseDevice: false,
    fuseUserAllowOther: false,
    cgroupV2: false,
    apparmorRestrictsUserNamespaces: true,
  }, 'supported');
  const failed = new Set(gaps.filter(check => !check.ok).map(check => check.id));
  assert.deepEqual([...failed].sort(), ['bubblewrap', 'cgroup-v2', 'fuse-allow-other', 'fuse-device', 'fusermount3', 'libc', 'platform', 'user-namespace']);
});

test('core preflight does not require sandbox or FUSE facilities', () => {
  const checks = evaluateHost({ ...ready, commands: {}, fuseDevice: false, fuseUserAllowOther: false, cgroupV2: false }, 'core');
  assert.deepEqual(checks.map(check => check.id), ['platform', 'libc']);
  assert.equal(checks.every(check => check.ok), true);
});
