import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadHostContract } from '../tools/lib/host-contract.js';
import { collectHostFacts, evaluateHost, parseHostScope, recordHostConfiguration } from '../tools/lib/host-preflight.js';
import { root } from '../tools/lib/project.js';
import type { HostCheck, HostFacts, HostProfile, Observation } from '../tools/lib/host-preflight.js';

const ready: HostFacts = {
  platform: 'linux',
  arch: 'x64',
  libc: 'glibc 2.39',
  commands: { bwrap: true, fusermount3: true },
  fuseDevice: true,
  fuseUserAllowOther: { state: 'observed', value: true, detail: 'user_allow_other is set' },
  cgroupV2: true,
  apparmorRestrictsUserNamespaces: { state: 'observed', value: false, detail: 'kernel.apparmor_restrict_unprivileged_userns=0' },
  sandboxBackend: 'bubblewrap',
  sandboxBackendViable: { state: 'observed', value: true, detail: 'bubblewrap unprivileged user namespace probe succeeded' },
  sharedLibraries: {
    'libfreetype.so.6': true,
    'libavcodec.so.60': true,
    'libavdevice.so.60': true,
    'libavformat.so.60': true,
    'libavutil.so.58': true,
    'libswscale.so.7': true,
  },
};

function observed(value: boolean, detail: string): Observation<boolean> {
  return { state: 'observed', value, detail };
}

function unavailable(detail: string): Observation<boolean> {
  return { state: 'unavailable', detail };
}

function unreadable(detail: string): Observation<boolean> {
  return { state: 'unreadable', detail };
}

function withFacts(overrides: Partial<HostFacts>): HostFacts {
  return { ...ready, ...overrides };
}

function namedCheck(facts: HostFacts, profile: HostProfile, id: string): HostCheck {
  const found = evaluateHost(facts, profile).find(check => check.id === id);
  assert.ok(found, id);
  return found;
}

test('supported host preflight accepts a prepared Linux host and names each gap', () => {
  assert.equal(evaluateHost(ready, 'supported').some(check => !check.ok), false);
  const gaps = evaluateHost(withFacts({
    arch: 'arm64',
    libc: undefined,
    commands: { bwrap: false, fusermount3: false },
    fuseDevice: false,
    fuseUserAllowOther: observed(false, '/etc/fuse.conf does not set user_allow_other'),
    cgroupV2: false,
    apparmorRestrictsUserNamespaces: observed(true, 'kernel.apparmor_restrict_unprivileged_userns=1'),
    sandboxBackendViable: unavailable('bwrap is not on PATH'),
  }), 'supported');
  const failed = new Set(gaps.filter(check => !check.ok).map(check => check.id));
  assert.deepEqual([...failed].sort(), ['bubblewrap', 'cgroup-v2', 'fuse-allow-other', 'fuse-device', 'fusermount3', 'libc', 'platform', 'sandbox-backend', 'user-namespace']);
  const byId = new Map(gaps.map(check => [check.id, check.detail]));
  assert.equal(byId.get('fuse-device'), '/dev/fuse is missing');
  assert.equal(byId.get('fusermount3'), 'fusermount3 is not on PATH');
  assert.equal(byId.get('cgroup-v2'), 'cgroup v2 was not found at /sys/fs/cgroup');
  assert.equal(byId.get('bubblewrap'), 'bwrap is not on PATH');
  assert.equal(byId.get('user-namespace')?.includes('kernel.apparmor_restrict_unprivileged_userns=1'), true);
});

test('core preflight does not require sandbox or FUSE facilities', () => {
  const checks = evaluateHost(withFacts({
    commands: {},
    fuseDevice: false,
    fuseUserAllowOther: unreadable('EACCES'),
    cgroupV2: false,
    apparmorRestrictsUserNamespaces: unreadable('EACCES'),
    sandboxBackendViable: unavailable('bwrap is not on PATH'),
  }), 'core');
  assert.deepEqual(checks.map(check => check.id), ['platform', 'libc']);
  assert.equal(checks.every(check => check.ok), true);
});

test('user-namespace passes only when bubblewrap viability is observed and AppArmor is not restricted or unreadable', () => {
  const viable = observed(true, 'bubblewrap unprivileged user namespace probe succeeded');
  const notViable = observed(false, 'bwrap probe failed (status 1): Operation not permitted');
  const cases: Array<{ name: string; apparmor: Observation<boolean>; viability: Observation<boolean>; ok: boolean; detail: string }> = [
    {
      name: 'allowed sysctl and viable probe',
      apparmor: observed(false, 'kernel.apparmor_restrict_unprivileged_userns=0'),
      viability: viable,
      ok: true,
      detail: 'unprivileged user namespaces are allowed (backend=bubblewrap viability=observed:true)',
    },
    {
      name: 'restricted sysctl even when the probe would work',
      apparmor: observed(true, 'kernel.apparmor_restrict_unprivileged_userns=1'),
      viability: viable,
      ok: false,
      detail: 'kernel.apparmor_restrict_unprivileged_userns=1 blocks sandbox network namespaces (backend=bubblewrap viability=observed:true)',
    },
    {
      name: 'missing AppArmor file and no viable probe',
      apparmor: unavailable('AppArmor unprivileged user-namespace restriction file is not present'),
      viability: unavailable('bwrap is not on PATH'),
      ok: false,
      detail: 'A missing AppArmor restriction file does not prove unprivileged user namespaces (backend=bubblewrap viability=unavailable): bwrap is not on PATH',
    },
    {
      name: 'missing AppArmor file and a failed probe',
      apparmor: unavailable('AppArmor unprivileged user-namespace restriction file is not present'),
      viability: notViable,
      ok: false,
      detail: 'A missing AppArmor restriction file does not prove unprivileged user namespaces (backend=bubblewrap viability=observed:false): bwrap probe failed (status 1): Operation not permitted',
    },
    {
      name: 'missing AppArmor file with a demonstrated namespace probe',
      apparmor: unavailable('AppArmor unprivileged user-namespace restriction file is not present'),
      viability: viable,
      ok: true,
      detail: 'unprivileged user namespaces are viable; a missing AppArmor file is not treated as proof (backend=bubblewrap viability=observed:true)',
    },
    {
      name: 'unreadable AppArmor even when the probe succeeded',
      apparmor: unreadable('EACCES'),
      viability: viable,
      ok: false,
      detail: 'Cannot read /proc/sys/kernel/apparmor_restrict_unprivileged_userns; an unreadable AppArmor observation does not prove unprivileged user namespaces are allowed (backend=bubblewrap viability=observed:true): EACCES',
    },
    {
      name: 'sysctl 0 without a viable probe',
      apparmor: observed(false, 'kernel.apparmor_restrict_unprivileged_userns=0'),
      viability: notViable,
      ok: false,
      detail: 'kernel.apparmor_restrict_unprivileged_userns=0 does not by itself prove unprivileged user namespaces (backend=bubblewrap viability=observed:false): bwrap probe failed (status 1): Operation not permitted',
    },
  ];
  for (const item of cases) {
    const facts = withFacts({ apparmorRestrictsUserNamespaces: item.apparmor, sandboxBackendViable: item.viability });
    for (const profile of ['sandbox', 'supported'] as const) {
      const check = namedCheck(facts, profile, 'user-namespace');
      assert.equal(check.ok, item.ok, `${item.name} (${profile})`);
      assert.equal(check.detail, item.detail, `${item.name} (${profile})`);
      const backend = namedCheck(facts, profile, 'sandbox-backend');
      assert.equal(backend.ok, item.viability.state === 'observed' && item.viability.value === true, `${item.name} backend`);
      assert.equal(backend.detail.includes('backend=bubblewrap'), true);
      assert.equal(backend.detail.includes(`viability=${item.viability.state === 'observed' ? `observed:${String(item.viability.value)}` : item.viability.state}`), true);
    }
  }
});

test('fuse user_allow_other observed false, unavailable, and unreadable fail differently', () => {
  const cases: Array<{ observation: Observation<boolean>; detail: string }> = [
    { observation: observed(false, 'disabled'), detail: '/etc/fuse.conf does not set user_allow_other' },
    { observation: unavailable('missing'), detail: '/etc/fuse.conf is not present' },
    { observation: unreadable('EACCES'), detail: 'Cannot read /etc/fuse.conf: EACCES' },
  ];
  const details: string[] = [];
  for (const item of cases) {
    const check = namedCheck(withFacts({ fuseUserAllowOther: item.observation }), 'agent-store', 'fuse-allow-other');
    assert.equal(check.ok, false);
    assert.equal(check.detail, item.detail);
    details.push(check.detail);
  }
  assert.equal(new Set(details).size, details.length);
  const enabled = namedCheck(ready, 'agent-store', 'fuse-allow-other');
  assert.equal(enabled.ok, true);
  assert.equal(enabled.detail, 'user_allow_other is set');
  const device = namedCheck(withFacts({ fuseDevice: false, commands: { bwrap: true, fusermount3: false } }), 'agent-store', 'fuse-device');
  assert.equal(device.detail, '/dev/fuse is missing');
  assert.equal(namedCheck(withFacts({ commands: { bwrap: true, fusermount3: false } }), 'agent-store', 'fusermount3').detail, 'fusermount3 is not on PATH');
});

test('recordHostConfiguration maps observations and records scope without changing evaluation', () => {
  assert.deepEqual(recordHostConfiguration(ready, 'observed-host'), {
    apparmorRestrictUnprivilegedUserns: '0',
    fuseUserAllowOther: 'enabled',
    sandboxBackend: 'bubblewrap',
    sandboxBackendViable: 'viable',
    scope: 'observed-host',
  });
  const prepared = recordHostConfiguration(ready, 'prepared-runner');
  assert.equal(prepared.scope, 'prepared-runner');
  assert.deepEqual({ ...prepared, scope: 'observed-host' as const }, recordHostConfiguration(ready, 'observed-host'));
  assert.equal(recordHostConfiguration(withFacts({
    apparmorRestrictsUserNamespaces: observed(true, 'restricted'),
  }), 'prepared-runner').apparmorRestrictUnprivilegedUserns, '1');
  assert.equal(recordHostConfiguration(withFacts({
    apparmorRestrictsUserNamespaces: unavailable('missing'),
  }), 'observed-host').apparmorRestrictUnprivilegedUserns, 'unavailable');
  assert.equal(recordHostConfiguration(withFacts({
    apparmorRestrictsUserNamespaces: unreadable('EACCES'),
  }), 'observed-host').apparmorRestrictUnprivilegedUserns, 'unreadable');
  assert.equal(recordHostConfiguration(withFacts({
    apparmorRestrictsUserNamespaces: { state: 'observed', detail: 'kernel.apparmor_restrict_unprivileged_userns has unexpected contents: 2' },
  }), 'observed-host').apparmorRestrictUnprivilegedUserns, 'unexpected');
  assert.equal(recordHostConfiguration(withFacts({
    fuseUserAllowOther: observed(false, 'disabled'),
  }), 'observed-host').fuseUserAllowOther, 'disabled');
  assert.equal(recordHostConfiguration(withFacts({
    fuseUserAllowOther: unavailable('missing'),
  }), 'observed-host').fuseUserAllowOther, 'unavailable');
  assert.equal(recordHostConfiguration(withFacts({
    fuseUserAllowOther: unreadable('EACCES'),
  }), 'observed-host').fuseUserAllowOther, 'unreadable');
  assert.equal(recordHostConfiguration(withFacts({
    sandboxBackendViable: observed(false, 'probe failed'),
  }), 'observed-host').sandboxBackendViable, 'not-viable');
  assert.equal(recordHostConfiguration(withFacts({
    sandboxBackendViable: unavailable('bwrap is not on PATH'),
  }), 'observed-host').sandboxBackendViable, 'unavailable');
  assert.equal(recordHostConfiguration(withFacts({
    sandboxBackendViable: unreadable('unreadable probe'),
  }), 'prepared-runner').sandboxBackendViable, 'unreadable');
});

test('evaluateHost uses only the supplied facts', () => {
  const facts = withFacts({ platform: 'plan9', arch: 'sparc', libc: 'musl 1.2' });
  const first = evaluateHost(facts, 'supported');
  const second = evaluateHost(facts, 'supported');
  assert.deepEqual(first, second);
  assert.equal(namedCheck(facts, 'core', 'platform').detail, 'plan9/sparc');
  assert.equal(namedCheck(facts, 'core', 'platform').ok, false);
  assert.equal(namedCheck(facts, 'core', 'libc').detail, 'musl 1.2');
  assert.equal(namedCheck(facts, 'core', 'libc').ok, false);
});

test('parseHostScope accepts only the recorded scopes', () => {
  assert.equal(parseHostScope('observed-host'), 'observed-host');
  assert.equal(parseHostScope('prepared-runner'), 'prepared-runner');
  assert.throws(() => parseHostScope('mutated'), /Unsupported host scope: mutated/);
});

function fileSnapshot(file: string): string {
  try {
    return `text:${readFileSync(file, 'utf8')}`;
  } catch (error) {
    const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : 'UNKNOWN';
    return `error:${code}`;
  }
}

test('collectHostFacts reads AppArmor, fuse.conf, and bubblewrap without changing them', { timeout: 20_000 }, () => {
  const apparmorPath = '/proc/sys/kernel/apparmor_restrict_unprivileged_userns';
  const fusePath = '/etc/fuse.conf';
  const beforeApparmor = fileSnapshot(apparmorPath);
  const beforeFuse = fileSnapshot(fusePath);
  const facts = collectHostFacts();
  assert.equal(fileSnapshot(apparmorPath), beforeApparmor);
  assert.equal(fileSnapshot(fusePath), beforeFuse);
  assert.equal(facts.platform, process.platform);
  assert.equal(facts.arch, process.arch);
  assert.equal(facts.sandboxBackend, 'bubblewrap');
  const libc = spawnSync('getconf', ['GNU_LIBC_VERSION'], { encoding: 'utf8' });
  const expectedLibc = libc.status === 0 && libc.stdout.trim() !== '' ? libc.stdout.trim() : undefined;
  assert.equal(facts.libc, expectedLibc);
  if (facts.commands.bwrap !== true) assert.equal(facts.sandboxBackendViable.state, 'unavailable');
  if (beforeApparmor.startsWith('error:ENOENT')) assert.equal(facts.apparmorRestrictsUserNamespaces.state, 'unavailable');
  if (beforeApparmor.startsWith('error:EACCES') || beforeApparmor.startsWith('error:EPERM')) {
    assert.equal(facts.apparmorRestrictsUserNamespaces.state, 'unreadable');
  }
  if (beforeApparmor.startsWith('text:')) {
    const value = beforeApparmor.slice('text:'.length).trim();
    if (value === '1') assert.deepEqual(facts.apparmorRestrictsUserNamespaces, { state: 'observed', value: true, detail: 'kernel.apparmor_restrict_unprivileged_userns=1' });
    if (value === '0') assert.deepEqual(facts.apparmorRestrictsUserNamespaces, { state: 'observed', value: false, detail: 'kernel.apparmor_restrict_unprivileged_userns=0' });
    if (value !== '0' && value !== '1') {
      assert.equal(facts.apparmorRestrictsUserNamespaces.state, 'observed');
      assert.equal(facts.apparmorRestrictsUserNamespaces.value, undefined);
      assert.equal(recordHostConfiguration(facts, 'observed-host').apparmorRestrictUnprivilegedUserns, 'unexpected');
    }
  }
  if (beforeFuse.startsWith('error:ENOENT')) assert.equal(facts.fuseUserAllowOther.state, 'unavailable');
  if (beforeFuse.startsWith('error:EACCES') || beforeFuse.startsWith('error:EPERM')) assert.equal(facts.fuseUserAllowOther.state, 'unreadable');
  if (beforeFuse.startsWith('text:')) {
    const enabled = beforeFuse.slice('text:'.length).split('\n').some(line => {
      const trimmed = line.trim();
      return trimmed !== '' && !trimmed.startsWith('#') && trimmed === 'user_allow_other';
    });
    assert.equal(facts.fuseUserAllowOther.state, 'observed');
    assert.equal(facts.fuseUserAllowOther.value, enabled);
  }
});

test('preflight records scope and does not change host configuration', { timeout: 30_000 }, () => {
  const script = fileURLToPath(new URL('../tools/preflight-host.js', import.meta.url));
  const apparmorPath = '/proc/sys/kernel/apparmor_restrict_unprivileged_userns';
  const fusePath = '/etc/fuse.conf';
  const beforeApparmor = fileSnapshot(apparmorPath);
  const beforeFuse = fileSnapshot(fusePath);
  function run(args: readonly string[]) {
    return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 20_000 });
  }
  function configuration(stdout: string): { scope: string; sandboxBackend: string } {
    const line = stdout.split('\n').find(item => item.startsWith('host-configuration '));
    assert.ok(line);
    const parsed: unknown = JSON.parse(line.slice('host-configuration '.length));
    if (typeof parsed !== 'object' || parsed === null || !('scope' in parsed) || !('sandboxBackend' in parsed)) {
      throw new Error('host-configuration JSON is missing scope or sandboxBackend');
    }
    if (typeof parsed.scope !== 'string' || typeof parsed.sandboxBackend !== 'string') {
      throw new Error('host-configuration scope and sandboxBackend must be strings');
    }
    return { scope: parsed.scope, sandboxBackend: parsed.sandboxBackend };
  }
  function checkLines(stdout: string): string[] {
    return stdout.split('\n').filter(line => line.startsWith('OK  ') || line.startsWith('MISSING  '));
  }
  const prepared = run(['--profile', 'core', '--scope', 'prepared-runner']);
  const observed = run(['--profile', 'core']);
  assert.equal(fileSnapshot(apparmorPath), beforeApparmor);
  assert.equal(fileSnapshot(fusePath), beforeFuse);
  assert.equal(prepared.status, observed.status);
  assert.deepEqual(checkLines(prepared.stdout), checkLines(observed.stdout));
  assert.equal(configuration(prepared.stdout).scope, 'prepared-runner');
  assert.equal(configuration(observed.stdout).scope, 'observed-host');
  assert.equal(configuration(prepared.stdout).sandboxBackend, 'bubblewrap');
  assert.match(`${prepared.stdout}\n${prepared.stderr}`, /does not change host configuration/);
  assert.match(`${observed.stdout}\n${observed.stderr}`, /does not change host configuration/);
  const invalid = run(['--profile', 'core', '--scope', 'mutated']);
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Unsupported host scope: mutated/);
});

test('desktop preflight names missing browser, display, and recording prerequisites separately', () => {
  const readyDesktop = withFacts({
    commands: { xdpyinfo: true, xrandr: true, ffmpeg: true, ffprobe: true, xdotool: true, 'google-chrome': true },
  });
  assert.equal(evaluateHost(readyDesktop, 'desktop').some(check => !check.ok), false);
  assert.equal(evaluateHost(readyDesktop, 'supported').some(check => check.id === 'browser'), false);
  const gaps = evaluateHost(withFacts({
    commands: {},
    sharedLibraries: { 'libfreetype.so.6': false, 'libavcodec.so.60': false, 'libavdevice.so.60': true, 'libavformat.so.60': true, 'libavutil.so.58': true, 'libswscale.so.7': true },
  }), 'desktop');
  const failed = new Map(gaps.filter(check => !check.ok).map(check => [check.id, check.detail]));
  assert.match(failed.get('xdpyinfo') ?? '', /X11 computer-use cannot start/);
  assert.match(failed.get('ffmpeg') ?? '', /screen recording cannot start/);
  assert.match(failed.get('browser') ?? '', /browser computer-use cannot start/);
  assert.match(failed.get('library:libavcodec.so.60') ?? '', /polished recording cannot load/);
});

test('a host contract the preflight cannot represent is rejected', () => {
  const committed = loadHostContract(JSON.parse(readFileSync(path.join(root, 'runtime/contract.json'), 'utf8')));
  assert.equal(committed.sandbox.executable, 'bwrap');
  assert.equal(committed.agentStore.device, '/dev/fuse');
  assert.throws(() => loadHostContract({ host: { ...committed, sandbox: { ...committed.sandbox, backend: 'landlock' } } }), /cannot represent sandbox backend/);
  assert.throws(() => loadHostContract({ host: { ...committed, cgroup: { ...committed.cgroup, version: 1 } } }), /cannot represent cgroup version/);
  assert.throws(() => loadHostContract({ host: { ...committed, extraProbe: true } }), /cannot represent contract field host.extraProbe/);
  const renamed = { ...committed, sandbox: { ...committed.sandbox, executable: 'custom-bwrap' } };
  const check = evaluateHost(withFacts({ commands: {} }), 'sandbox', renamed);
  assert.equal(check.find(item => item.id === 'bubblewrap')?.detail, 'custom-bwrap is not on PATH');
});
