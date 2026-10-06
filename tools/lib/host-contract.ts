import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './project.js';

export interface HostContract {
  core: { os: 'linux'; arch: 'x64'; libc: 'glibc' };
  sandbox: {
    executable: string;
    backend: 'bubblewrap';
    probe: readonly string[];
    apparmorSysctl: string;
    unprivilegedUserNamespace: 'viable-probe-required';
  };
  agentStore: {
    device: string;
    fuseConf: string;
    fuseConfSetting: 'user_allow_other';
    executable: string;
  };
  cgroup: { version: 2; mount: string; marker: string };
  desktop: {
    executables: readonly string[];
    browsers: readonly string[];
    sharedLibraries: readonly string[];
  };
}

const hostKeys = new Set(['core', 'sandbox', 'agentStore', 'cgroup', 'desktop', 'scopeNote']);
const namePattern = /^[A-Za-z0-9._+-]+$/;
const pathPattern = /^\/[A-Za-z0-9._+/-]+$/;

let cached: HostContract | undefined;

export function committedHostContract(): HostContract {
  cached ??= loadHostContract(JSON.parse(readFileSync(path.join(root, 'runtime/contract.json'), 'utf8')));
  return cached;
}

/** Rejects a contract the preflight cannot execute, instead of ignoring the new requirement. */
export function loadHostContract(json: unknown): HostContract {
  const rootValue = record(json, 'contract');
  const host = record(rootValue.host, 'host');
  for (const key of Object.keys(host)) {
    if (!hostKeys.has(key)) throw new Error(`Host preflight cannot represent contract field host.${key}`);
  }
  const core = record(host.core, 'host.core');
  if (core.os !== 'linux' || core.arch !== 'x64' || core.libc !== 'glibc') {
    throw new Error('Host preflight cannot represent host.core outside linux/x64/glibc');
  }
  const sandbox = record(host.sandbox, 'host.sandbox');
  if (sandbox.backend !== 'bubblewrap') throw new Error(`Host preflight cannot represent sandbox backend ${String(sandbox.backend)}`);
  if (sandbox.unprivilegedUserNamespace !== 'viable-probe-required') {
    throw new Error('Host preflight cannot represent a sandbox namespace requirement other than viable-probe-required');
  }
  const probe = stringList(sandbox.probe, 'host.sandbox.probe');
  if (probe.length === 0 || probe[0] !== '--unshare-user') throw new Error('Host preflight cannot represent host.sandbox.probe');
  const agentStore = record(host.agentStore, 'host.agentStore');
  if (agentStore.fuseConfSetting !== 'user_allow_other') throw new Error('Host preflight cannot represent host.agentStore.fuseConfSetting');
  const cgroup = record(host.cgroup, 'host.cgroup');
  if (cgroup.version !== 2) throw new Error(`Host preflight cannot represent cgroup version ${String(cgroup.version)}`);
  const desktop = record(host.desktop, 'host.desktop');
  return {
    core: { os: 'linux', arch: 'x64', libc: 'glibc' },
    sandbox: {
      executable: commandName(sandbox.executable, 'host.sandbox.executable'),
      backend: 'bubblewrap',
      probe,
      apparmorSysctl: absolutePath(sandbox.apparmorSysctl, 'host.sandbox.apparmorSysctl'),
      unprivilegedUserNamespace: 'viable-probe-required',
    },
    agentStore: {
      device: absolutePath(agentStore.device, 'host.agentStore.device'),
      fuseConf: absolutePath(agentStore.fuseConf, 'host.agentStore.fuseConf'),
      fuseConfSetting: 'user_allow_other',
      executable: commandName(agentStore.executable, 'host.agentStore.executable'),
    },
    cgroup: {
      version: 2,
      mount: absolutePath(cgroup.mount, 'host.cgroup.mount'),
      marker: commandName(cgroup.marker, 'host.cgroup.marker'),
    },
    desktop: {
      executables: stringList(desktop.executables, 'host.desktop.executables').map(item => commandName(item, 'host.desktop.executables')),
      browsers: stringList(desktop.browsers, 'host.desktop.browsers').map(item => commandName(item, 'host.desktop.browsers')),
      sharedLibraries: stringList(desktop.sharedLibraries, 'host.desktop.sharedLibraries').map(item => commandName(item, 'host.desktop.sharedLibraries')),
    },
  };
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`Host contract ${label} must be an object`);
  return value as Record<string, unknown>;
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`Host preflight cannot represent ${label}`);
  const items: string[] = [];
  const entries = value as readonly unknown[];
  for (let index = 0; index < entries.length; index += 1) {
    const entry: unknown = entries[index];
    if (typeof entry !== 'string' || entry.trim() === '') throw new Error(`Host preflight cannot represent ${label}`);
    items.push(entry);
  }
  return items;
}

function commandName(value: unknown, label: string): string {
  if (typeof value !== 'string' || !namePattern.test(value)) throw new Error(`Host preflight cannot represent ${label}`);
  return value;
}

function absolutePath(value: unknown, label: string): string {
  if (typeof value !== 'string' || !pathPattern.test(value)) throw new Error(`Host preflight cannot represent ${label}`);
  return value;
}
