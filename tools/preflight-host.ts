import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { evaluateHost, parseHostProfile } from './lib/host-preflight.js';
import type { HostFacts } from './lib/host-preflight.js';

function commandExists(name: string): boolean {
  const result = spawnSync('sh', ['-c', `command -v ${name}`], { encoding: 'utf8' });
  return result.status === 0 && result.stdout.trim() !== '';
}

function libcVersion(): string | undefined {
  const result = spawnSync('getconf', ['GNU_LIBC_VERSION'], { encoding: 'utf8' });
  if (result.status === 0 && result.stdout.trim() !== '') return result.stdout.trim();
  return undefined;
}

function apparmorRestriction(): boolean | undefined {
  try {
    const value = readFileSync('/proc/sys/kernel/apparmor_restrict_unprivileged_userns', 'utf8').trim();
    if (value === '1') return true;
    if (value === '0') return false;
    return undefined;
  } catch {
    return undefined;
  }
}

function collectFacts(): HostFacts {
  let fuseDevice = false;
  try { fuseDevice = statSync('/dev/fuse').isCharacterDevice(); } catch { fuseDevice = false; }
  let fuseUserAllowOther = false;
  try { fuseUserAllowOther = readFileSync('/etc/fuse.conf', 'utf8').split('\n').some(line => line.trim() === 'user_allow_other'); } catch { fuseUserAllowOther = false; }
  let cgroupV2 = false;
  try { cgroupV2 = existsSync('/sys/fs/cgroup/cgroup.controllers'); } catch { cgroupV2 = false; }
  return {
    platform: process.platform,
    arch: process.arch,
    libc: libcVersion(),
    commands: { bwrap: commandExists('bwrap'), fusermount3: commandExists('fusermount3') },
    fuseDevice,
    fuseUserAllowOther,
    cgroupV2,
    apparmorRestrictsUserNamespaces: apparmorRestriction(),
  };
}

const { values } = parseArgs({ options: { profile: { type: 'string', default: 'supported' } } });
const profile = parseHostProfile(values.profile ?? 'supported');
const checks = evaluateHost(collectFacts(), profile);
for (const check of checks) console.log(`${check.ok ? 'OK' : 'MISSING'}  ${check.id}: ${check.detail}`);
if (checks.some(check => !check.ok)) {
  console.error(`Host preflight failed for profile ${profile}. The command does not change host configuration.`);
  process.exit(1);
}
console.log(`Host preflight passed for profile ${profile}.`);
