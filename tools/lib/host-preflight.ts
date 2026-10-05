import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

export type HostProfile = 'core' | 'sandbox' | 'agent-store' | 'cgroup' | 'desktop' | 'supported';
export type HostScope = 'observed-host' | 'prepared-runner';
export type ObservationState = 'observed' | 'unavailable' | 'unreadable';

export interface Observation<T> {
  state: ObservationState;
  value?: T;
  detail: string;
}

export interface HostFacts {
  platform: string;
  arch: string;
  libc: string | undefined;
  commands: Readonly<Record<string, boolean>>;
  fuseDevice: boolean;
  fuseUserAllowOther: Observation<boolean>;
  cgroupV2: boolean;
  apparmorRestrictsUserNamespaces: Observation<boolean>;
  sandboxBackend: 'bubblewrap';
  sandboxBackendViable: Observation<boolean>;
  sharedLibraries: Readonly<Record<string, boolean>>;
}

export interface HostConfigurationRecord {
  apparmorRestrictUnprivilegedUserns: '0' | '1' | 'unavailable' | 'unreadable' | 'unexpected';
  fuseUserAllowOther: 'enabled' | 'disabled' | 'unavailable' | 'unreadable';
  sandboxBackend: 'bubblewrap';
  sandboxBackendViable: 'viable' | 'not-viable' | 'unavailable' | 'unreadable';
  scope: HostScope;
}

export interface HostCheck { id: string; ok: boolean; detail: string }

const apparmorPath = '/proc/sys/kernel/apparmor_restrict_unprivileged_userns';
const fuseConfPath = '/etc/fuse.conf';
const fuseDevicePath = '/dev/fuse';
const cgroupControllersPath = '/sys/fs/cgroup/cgroup.controllers';
const sandboxProbeTimeoutMs = 5_000;
export const DESKTOP_SHARED_LIBRARIES = ['libfreetype.so.6', 'libavcodec.so.60', 'libavdevice.so.60', 'libavformat.so.60', 'libavutil.so.58', 'libswscale.so.7'] as const;

const supportedProfiles = new Set<HostProfile>(['core', 'sandbox', 'agent-store', 'cgroup', 'desktop', 'supported']);
const hostScopes = new Set<HostScope>(['observed-host', 'prepared-runner']);

export function parseHostProfile(value: string): HostProfile {
  if (!supportedProfiles.has(value as HostProfile)) throw new Error(`Unsupported host profile: ${value}`);
  return value as HostProfile;
}

export function parseHostScope(value: string): HostScope {
  if (!hostScopes.has(value as HostScope)) throw new Error(`Unsupported host scope: ${value}`);
  return value as HostScope;
}

function includes(profile: HostProfile, part: Exclude<HostProfile, 'supported' | 'desktop'>): boolean {
  return profile === 'supported' || profile === part;
}

function isObservedTrue(observation: Observation<boolean>): boolean {
  return observation.state === 'observed' && observation.value === true;
}

function viabilityState(observation: Observation<boolean>): string {
  if (observation.state !== 'observed') return observation.state;
  if (observation.value === true) return 'observed:true';
  if (observation.value === false) return 'observed:false';
  return 'observed:unexpected';
}

function backendContext(facts: HostFacts): string {
  return `backend=${facts.sandboxBackend} viability=${viabilityState(facts.sandboxBackendViable)}`;
}

function observationReason(observation: Observation<boolean>, fallback: string): string {
  return observation.detail === '' ? fallback : observation.detail;
}

function userNamespaceDetail(facts: HostFacts): string {
  const apparmor = facts.apparmorRestrictsUserNamespaces;
  const viability = facts.sandboxBackendViable;
  const context = backendContext(facts);
  const viable = isObservedTrue(viability);
  if (apparmor.state === 'observed' && apparmor.value === true) {
    return `kernel.apparmor_restrict_unprivileged_userns=1 blocks sandbox network namespaces (${context})`;
  }
  if (apparmor.state === 'unreadable') {
    const reason = observationReason(apparmor, 'unreadable');
    return `Cannot read ${apparmorPath}; an unreadable AppArmor observation does not prove unprivileged user namespaces are allowed (${context}): ${reason}`;
  }
  if (viable && apparmor.state === 'observed' && apparmor.value === false) {
    return `unprivileged user namespaces are allowed (${context})`;
  }
  if (viable && apparmor.state === 'unavailable') {
    return `unprivileged user namespaces are viable; a missing AppArmor file is not treated as proof (${context})`;
  }
  if (viable && apparmor.state === 'observed' && apparmor.value === undefined) {
    return `unprivileged user namespaces are viable; unexpected AppArmor sysctl contents are not treated as a restriction (${context})`;
  }
  if (viable) return `unprivileged user namespaces are viable (${context})`;
  const reason = observationReason(viability, viabilityState(viability));
  if (apparmor.state === 'unavailable') {
    return `A missing AppArmor restriction file does not prove unprivileged user namespaces (${context}): ${reason}`;
  }
  if (apparmor.state === 'observed' && apparmor.value === false) {
    return `kernel.apparmor_restrict_unprivileged_userns=0 does not by itself prove unprivileged user namespaces (${context}): ${reason}`;
  }
  return `bubblewrap did not demonstrate unprivileged user namespaces (${context}): ${reason}`;
}

function userNamespaceCheck(facts: HostFacts): HostCheck {
  const apparmor = facts.apparmorRestrictsUserNamespaces;
  const restricted = apparmor.state === 'observed' && apparmor.value === true;
  const unreadable = apparmor.state === 'unreadable';
  return {
    id: 'user-namespace',
    ok: isObservedTrue(facts.sandboxBackendViable) && !restricted && !unreadable,
    detail: userNamespaceDetail(facts),
  };
}

function sandboxBackendCheck(facts: HostFacts): HostCheck {
  const context = backendContext(facts);
  if (isObservedTrue(facts.sandboxBackendViable)) return { id: 'sandbox-backend', ok: true, detail: context };
  const reason = observationReason(facts.sandboxBackendViable, viabilityState(facts.sandboxBackendViable));
  return { id: 'sandbox-backend', ok: false, detail: `${context}; ${reason}` };
}

function fuseAllowOtherCheck(observation: Observation<boolean>): HostCheck {
  if (observation.state === 'observed' && observation.value === true) {
    return { id: 'fuse-allow-other', ok: true, detail: 'user_allow_other is set' };
  }
  if (observation.state === 'observed' && observation.value === false) {
    return { id: 'fuse-allow-other', ok: false, detail: '/etc/fuse.conf does not set user_allow_other' };
  }
  if (observation.state === 'unavailable') {
    return { id: 'fuse-allow-other', ok: false, detail: '/etc/fuse.conf is not present' };
  }
  return {
    id: 'fuse-allow-other',
    ok: false,
    detail: `Cannot read /etc/fuse.conf: ${observationReason(observation, 'unreadable')}`,
  };
}

/** Read-only evaluation of supplied host facts. It does not read the host or change sysctls. */
export function evaluateHost(facts: HostFacts, profile: HostProfile): HostCheck[] {
  const checks: HostCheck[] = [];
  if (includes(profile, 'core')) {
    checks.push({ id: 'platform', ok: facts.platform === 'linux' && facts.arch === 'x64', detail: `${facts.platform}/${facts.arch}` });
    checks.push({ id: 'libc', ok: facts.libc?.toLowerCase().includes('glibc') === true, detail: facts.libc ?? 'glibc was not identified' });
  }
  if (includes(profile, 'sandbox')) {
    checks.push({ id: 'bubblewrap', ok: facts.commands.bwrap === true, detail: facts.commands.bwrap ? 'bwrap is on PATH' : 'bwrap is not on PATH' });
    checks.push(userNamespaceCheck(facts));
    checks.push(sandboxBackendCheck(facts));
  }
  if (includes(profile, 'agent-store')) {
    checks.push({ id: 'fuse-device', ok: facts.fuseDevice, detail: facts.fuseDevice ? '/dev/fuse is present' : '/dev/fuse is missing' });
    checks.push(fuseAllowOtherCheck(facts.fuseUserAllowOther));
    checks.push({ id: 'fusermount3', ok: facts.commands.fusermount3 === true, detail: facts.commands.fusermount3 ? 'fusermount3 is on PATH' : 'fusermount3 is not on PATH' });
  }
  if (includes(profile, 'cgroup')) {
    checks.push({ id: 'cgroup-v2', ok: facts.cgroupV2, detail: facts.cgroupV2 ? 'cgroup v2 is mounted at /sys/fs/cgroup' : 'cgroup v2 was not found at /sys/fs/cgroup' });
  }
  if (profile === 'desktop') {
    checks.push(commandCheck(facts, 'xdpyinfo', 'xdpyinfo is on PATH', 'xdpyinfo is not on PATH; X11 computer-use cannot start'));
    checks.push(commandCheck(facts, 'ffmpeg', 'ffmpeg is on PATH', 'ffmpeg is not on PATH; screen recording cannot start'));
    checks.push(commandCheck(facts, 'ffprobe', 'ffprobe is on PATH', 'ffprobe is not on PATH; recording metadata cannot be checked'));
    const browser = facts.commands['google-chrome'] === true || facts.commands.chromium === true;
    checks.push({
      id: 'browser',
      ok: browser,
      detail: browser ? 'a non-headless Chrome or Chromium executable is on PATH' : 'google-chrome and chromium are not on PATH; browser computer-use cannot start',
    });
    for (const library of DESKTOP_SHARED_LIBRARIES) {
      checks.push({
        id: `library:${library}`,
        ok: facts.sharedLibraries[library] === true,
        detail: facts.sharedLibraries[library] === true ? `${library} is installed` : `${library} was not found; polished recording cannot load`,
      });
    }
  }
  return checks;
}

function commandCheck(facts: HostFacts, id: string, present: string, absent: string): HostCheck {
  const ok = facts.commands[id] === true;
  return { id, ok, detail: ok ? present : absent };
}

export function recordHostConfiguration(facts: HostFacts, scope: HostScope): HostConfigurationRecord {
  return {
    apparmorRestrictUnprivilegedUserns: apparmorRecord(facts.apparmorRestrictsUserNamespaces),
    fuseUserAllowOther: fuseRecord(facts.fuseUserAllowOther),
    sandboxBackend: facts.sandboxBackend,
    sandboxBackendViable: viabilityRecord(facts.sandboxBackendViable),
    scope,
  };
}

function apparmorRecord(observation: Observation<boolean>): HostConfigurationRecord['apparmorRestrictUnprivilegedUserns'] {
  if (observation.state === 'unavailable') return 'unavailable';
  if (observation.state === 'unreadable') return 'unreadable';
  if (observation.value === true) return '1';
  if (observation.value === false) return '0';
  return 'unexpected';
}

function fuseRecord(observation: Observation<boolean>): HostConfigurationRecord['fuseUserAllowOther'] {
  if (observation.state === 'unavailable') return 'unavailable';
  if (observation.state === 'unreadable') return 'unreadable';
  if (observation.value === true) return 'enabled';
  if (observation.value === false) return 'disabled';
  return 'unreadable';
}

function viabilityRecord(observation: Observation<boolean>): HostConfigurationRecord['sandboxBackendViable'] {
  if (observation.state === 'unavailable') return 'unavailable';
  if (observation.state === 'unreadable') return 'unreadable';
  if (observation.value === true) return 'viable';
  if (observation.value === false) return 'not-viable';
  return 'unreadable';
}

function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  return typeof error.code === 'string' ? error.code : undefined;
}

function truncate(text: string, limit = 200): string {
  const single = text.replace(/\s+/g, ' ').trim();
  if (single.length <= limit) return single;
  return `${single.slice(0, limit)}...`;
}

function readHostText(file: string): { ok: true; text: string } | { ok: false; code: string | undefined } {
  try {
    return { ok: true, text: readFileSync(file, 'utf8') };
  } catch (error) {
    return { ok: false, code: errorCode(error) };
  }
}

function permissionObservation(code: string | undefined, missingDetail: string): Observation<boolean> {
  if (code === 'ENOENT') return { state: 'unavailable', detail: missingDetail };
  return { state: 'unreadable', detail: code ?? 'unreadable' };
}

function readApparmorRestriction(): Observation<boolean> {
  const read = readHostText(apparmorPath);
  if (!read.ok) {
    return permissionObservation(read.code, 'AppArmor unprivileged user-namespace restriction file is not present');
  }
  const value = read.text.trim();
  if (value === '1') return { state: 'observed', value: true, detail: 'kernel.apparmor_restrict_unprivileged_userns=1' };
  if (value === '0') return { state: 'observed', value: false, detail: 'kernel.apparmor_restrict_unprivileged_userns=0' };
  return { state: 'observed', detail: `kernel.apparmor_restrict_unprivileged_userns has unexpected contents: ${truncate(value)}` };
}

function fuseConfEnablesUserAllowOther(text: string): boolean {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    if (trimmed === 'user_allow_other') return true;
  }
  return false;
}

function readFuseUserAllowOther(): Observation<boolean> {
  const read = readHostText(fuseConfPath);
  if (!read.ok) return permissionObservation(read.code, '/etc/fuse.conf is not present');
  if (fuseConfEnablesUserAllowOther(read.text)) return { state: 'observed', value: true, detail: 'user_allow_other is set' };
  return { state: 'observed', value: false, detail: '/etc/fuse.conf does not set user_allow_other' };
}

/** Non-mutating probe. It never writes sysctls, AppArmor, or fuse.conf. */
function probeSandbox(bwrapInstalled: boolean): Observation<boolean> {
  if (!bwrapInstalled) return { state: 'unavailable', detail: 'bwrap is not on PATH' };
  try {
    const result = spawnSync('bwrap', [
      '--unshare-user',
      '--unshare-net',
      '--ro-bind', '/', '/',
      '--dev', '/dev',
      '--proc', '/proc',
      '--',
      'true',
    ], {
      encoding: 'utf8',
      timeout: sandboxProbeTimeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: 16 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.error !== undefined) {
      return { state: 'unavailable', detail: `bwrap probe could not be observed: ${truncate(result.error.message)}` };
    }
    if (result.status === 0) {
      return { state: 'observed', value: true, detail: 'bubblewrap unprivileged user namespace probe succeeded' };
    }
    const stderr = truncate(result.stderr);
    const exit = result.status === null ? `signal ${result.signal ?? 'unknown'}` : `status ${result.status}`;
    return {
      state: 'observed',
      value: false,
      detail: stderr === '' ? `bwrap probe exited ${exit}` : `bwrap probe failed (${exit}): ${stderr}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return { state: 'unavailable', detail: `bwrap probe could not be observed: ${truncate(message)}` };
  }
}

function commandExists(name: string): boolean {
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return false;
  const result = spawnSync('sh', ['-c', `command -v ${name}`], { encoding: 'utf8' });
  return result.status === 0 && result.stdout.trim() !== '';
}

function sharedLibraries(): Record<string, boolean> {
  const listed = spawnSync('ldconfig', ['-p'], { encoding: 'utf8' });
  const text = listed.status === 0 ? listed.stdout : '';
  const libraries: Record<string, boolean> = {};
  for (const library of DESKTOP_SHARED_LIBRARIES) {
    libraries[library] = text.includes(library) || existsSync(`/lib/x86_64-linux-gnu/${library}`) || existsSync(`/usr/lib/x86_64-linux-gnu/${library}`);
  }
  return libraries;
}

function libcVersion(): string | undefined {
  const result = spawnSync('getconf', ['GNU_LIBC_VERSION'], { encoding: 'utf8' });
  if (result.status === 0 && result.stdout.trim() !== '') return result.stdout.trim();
  return undefined;
}

function fuseDevicePresent(): boolean {
  try { return statSync(fuseDevicePath).isCharacterDevice(); } catch { return false; }
}

function cgroupV2Mounted(): boolean {
  try { return existsSync(cgroupControllersPath); } catch { return false; }
}

/** Reads host observations. The bubblewrap probe never changes sysctls, AppArmor, or fuse.conf. */
export function collectHostFacts(): HostFacts {
  const bwrap = commandExists('bwrap');
  return {
    platform: process.platform,
    arch: process.arch,
    libc: libcVersion(),
    commands: {
      bwrap,
      fusermount3: commandExists('fusermount3'),
      xdpyinfo: commandExists('xdpyinfo'),
      ffmpeg: commandExists('ffmpeg'),
      ffprobe: commandExists('ffprobe'),
      'google-chrome': commandExists('google-chrome'),
      chromium: commandExists('chromium'),
    },
    fuseDevice: fuseDevicePresent(),
    fuseUserAllowOther: readFuseUserAllowOther(),
    cgroupV2: cgroupV2Mounted(),
    apparmorRestrictsUserNamespaces: readApparmorRestriction(),
    sandboxBackend: 'bubblewrap',
    sandboxBackendViable: probeSandbox(bwrap),
    sharedLibraries: sharedLibraries(),
  };
}
