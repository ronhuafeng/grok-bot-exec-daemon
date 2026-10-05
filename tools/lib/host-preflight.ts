import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { committedHostContract } from './host-contract.js';
import type { HostContract } from './host-contract.js';

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

const sandboxProbeTimeoutMs = 5_000;
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

function userNamespaceDetail(facts: HostFacts, sysctlPath: string): string {
  const apparmor = facts.apparmorRestrictsUserNamespaces;
  const viability = facts.sandboxBackendViable;
  const context = backendContext(facts);
  const viable = isObservedTrue(viability);
  if (apparmor.state === 'observed' && apparmor.value === true) {
    return `kernel.apparmor_restrict_unprivileged_userns=1 blocks sandbox network namespaces (${context})`;
  }
  if (apparmor.state === 'unreadable') {
    const reason = observationReason(apparmor, 'unreadable');
    return `Cannot read ${sysctlPath}; an unreadable AppArmor observation does not prove unprivileged user namespaces are allowed (${context}): ${reason}`;
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

function userNamespaceCheck(facts: HostFacts, sysctlPath: string): HostCheck {
  const apparmor = facts.apparmorRestrictsUserNamespaces;
  const restricted = apparmor.state === 'observed' && apparmor.value === true;
  const unreadable = apparmor.state === 'unreadable';
  return {
    id: 'user-namespace',
    ok: isObservedTrue(facts.sandboxBackendViable) && !restricted && !unreadable,
    detail: userNamespaceDetail(facts, sysctlPath),
  };
}

function sandboxBackendCheck(facts: HostFacts): HostCheck {
  const context = backendContext(facts);
  if (isObservedTrue(facts.sandboxBackendViable)) return { id: 'sandbox-backend', ok: true, detail: context };
  const reason = observationReason(facts.sandboxBackendViable, viabilityState(facts.sandboxBackendViable));
  return { id: 'sandbox-backend', ok: false, detail: `${context}; ${reason}` };
}

function fuseAllowOtherCheck(observation: Observation<boolean>, fuseConf: string): HostCheck {
  if (observation.state === 'observed' && observation.value === true) {
    return { id: 'fuse-allow-other', ok: true, detail: 'user_allow_other is set' };
  }
  if (observation.state === 'observed' && observation.value === false) {
    return { id: 'fuse-allow-other', ok: false, detail: `${fuseConf} does not set user_allow_other` };
  }
  if (observation.state === 'unavailable') {
    return { id: 'fuse-allow-other', ok: false, detail: `${fuseConf} is not present` };
  }
  return {
    id: 'fuse-allow-other',
    ok: false,
    detail: `Cannot read ${fuseConf}: ${observationReason(observation, 'unreadable')}`,
  };
}

/** Read-only evaluation of supplied host facts. It does not read the host or change sysctls. */
export function evaluateHost(facts: HostFacts, profile: HostProfile, contract: HostContract = committedHostContract()): HostCheck[] {
  const checks: HostCheck[] = [];
  if (includes(profile, 'core')) {
    checks.push({ id: 'platform', ok: facts.platform === contract.core.os && facts.arch === contract.core.arch, detail: `${facts.platform}/${facts.arch}` });
    checks.push({ id: 'libc', ok: facts.libc?.toLowerCase().includes(contract.core.libc) === true, detail: facts.libc ?? `${contract.core.libc} was not identified` });
  }
  if (includes(profile, 'sandbox')) {
    const executable = contract.sandbox.executable;
    checks.push({ id: 'bubblewrap', ok: facts.commands[executable] === true, detail: facts.commands[executable] === true ? `${executable} is on PATH` : `${executable} is not on PATH` });
    checks.push(userNamespaceCheck(facts, contract.sandbox.apparmorSysctl));
    checks.push(sandboxBackendCheck(facts));
  }
  if (includes(profile, 'agent-store')) {
    const device = contract.agentStore.device;
    const executable = contract.agentStore.executable;
    checks.push({ id: 'fuse-device', ok: facts.fuseDevice, detail: facts.fuseDevice ? `${device} is present` : `${device} is missing` });
    checks.push(fuseAllowOtherCheck(facts.fuseUserAllowOther, contract.agentStore.fuseConf));
    checks.push({ id: executable, ok: facts.commands[executable] === true, detail: facts.commands[executable] === true ? `${executable} is on PATH` : `${executable} is not on PATH` });
  }
  if (includes(profile, 'cgroup')) {
    checks.push({ id: 'cgroup-v2', ok: facts.cgroupV2, detail: facts.cgroupV2 ? `cgroup v2 is mounted at ${contract.cgroup.mount}` : `cgroup v2 was not found at ${contract.cgroup.mount}` });
  }
  if (profile === 'desktop') {
    for (const executable of contract.desktop.executables) checks.push(desktopCommandCheck(facts, executable));
    const browser = contract.desktop.browsers.some(name => facts.commands[name] === true);
    checks.push({
      id: 'browser',
      ok: browser,
      detail: browser ? 'a non-headless Chrome or Chromium executable is on PATH' : `${contract.desktop.browsers.join(' and ')} are not on PATH; browser computer-use cannot start`,
    });
    for (const library of contract.desktop.sharedLibraries) {
      checks.push({
        id: `library:${library}`,
        ok: facts.sharedLibraries[library] === true,
        detail: facts.sharedLibraries[library] === true ? `${library} is installed` : `${library} was not found; polished recording cannot load`,
      });
    }
  }
  return checks;
}

function desktopCommandCheck(facts: HostFacts, executable: string): HostCheck {
  const ok = facts.commands[executable] === true;
  const absent = executable === 'xdpyinfo'
    ? 'xdpyinfo is not on PATH; X11 computer-use cannot start'
    : executable === 'ffmpeg'
      ? 'ffmpeg is not on PATH; screen recording cannot start'
        : executable === 'ffprobe'
        ? 'ffprobe is not on PATH; recording metadata cannot be checked'
        : executable === 'xrandr'
          ? 'xrandr is not on PATH; display resolution cannot be detected'
          : `${executable} is not on PATH`;
  return { id: executable, ok, detail: ok ? `${executable} is on PATH` : absent };
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

function readApparmorRestriction(sysctlPath: string): Observation<boolean> {
  const read = readHostText(sysctlPath);
  if (!read.ok) {
    return permissionObservation(read.code, 'AppArmor unprivileged user-namespace restriction file is not present');
  }
  const value = read.text.trim();
  const label = path.basename(sysctlPath) === 'apparmor_restrict_unprivileged_userns'
    ? 'kernel.apparmor_restrict_unprivileged_userns'
    : path.basename(sysctlPath);
  if (value === '1') return { state: 'observed', value: true, detail: `${label}=1` };
  if (value === '0') return { state: 'observed', value: false, detail: `${label}=0` };
  return { state: 'observed', detail: `${label} has unexpected contents: ${truncate(value)}` };
}

function fuseConfEnablesUserAllowOther(text: string): boolean {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    if (trimmed === 'user_allow_other') return true;
  }
  return false;
}

function readFuseUserAllowOther(fuseConf: string): Observation<boolean> {
  const read = readHostText(fuseConf);
  if (!read.ok) return permissionObservation(read.code, `${fuseConf} is not present`);
  if (fuseConfEnablesUserAllowOther(read.text)) return { state: 'observed', value: true, detail: 'user_allow_other is set' };
  return { state: 'observed', value: false, detail: `${fuseConf} does not set user_allow_other` };
}

/** Non-mutating probe. It never writes sysctls, AppArmor, or fuse.conf. */
function probeSandbox(executable: string, probe: readonly string[], installed: boolean): Observation<boolean> {
  if (!installed) return { state: 'unavailable', detail: `${executable} is not on PATH` };
  try {
    const result = spawnSync(executable, [...probe], {
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

function sharedLibraries(names: readonly string[]): Record<string, boolean> {
  const listed = spawnSync('ldconfig', ['-p'], { encoding: 'utf8' });
  const text = listed.status === 0 ? listed.stdout : '';
  const libraries: Record<string, boolean> = {};
  for (const library of names) {
    libraries[library] = text.includes(library) || existsSync(`/lib/x86_64-linux-gnu/${library}`) || existsSync(`/usr/lib/x86_64-linux-gnu/${library}`);
  }
  return libraries;
}

function libcVersion(): string | undefined {
  const result = spawnSync('getconf', ['GNU_LIBC_VERSION'], { encoding: 'utf8' });
  if (result.status === 0 && result.stdout.trim() !== '') return result.stdout.trim();
  return undefined;
}

function fuseDevicePresent(device: string): boolean {
  try { return statSync(device).isCharacterDevice(); } catch { return false; }
}

function cgroupV2Mounted(mount: string, marker: string): boolean {
  try { return existsSync(path.join(mount, marker)); } catch { return false; }
}

/** Reads host observations from the committed contract. The probe never changes host configuration. */
export function collectHostFacts(contract: HostContract = committedHostContract()): HostFacts {
  const commands: Record<string, boolean> = {};
  for (const name of [contract.sandbox.executable, contract.agentStore.executable, ...contract.desktop.executables, ...contract.desktop.browsers]) {
    commands[name] = commandExists(name);
  }
  const sandboxInstalled = commands[contract.sandbox.executable] === true;
  return {
    platform: process.platform,
    arch: process.arch,
    libc: libcVersion(),
    commands,
    fuseDevice: fuseDevicePresent(contract.agentStore.device),
    fuseUserAllowOther: readFuseUserAllowOther(contract.agentStore.fuseConf),
    cgroupV2: cgroupV2Mounted(contract.cgroup.mount, contract.cgroup.marker),
    apparmorRestrictsUserNamespaces: readApparmorRestriction(contract.sandbox.apparmorSysctl),
    sandboxBackend: contract.sandbox.backend,
    sandboxBackendViable: probeSandbox(contract.sandbox.executable, contract.sandbox.probe, sandboxInstalled),
    sharedLibraries: sharedLibraries(contract.desktop.sharedLibraries),
  };
}
