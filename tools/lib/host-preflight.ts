export type HostProfile = 'core' | 'sandbox' | 'agent-store' | 'cgroup' | 'supported';

export interface HostFacts {
  platform: string;
  arch: string;
  libc: string | undefined;
  commands: Readonly<Record<string, boolean>>;
  fuseDevice: boolean;
  fuseUserAllowOther: boolean;
  cgroupV2: boolean;
  apparmorRestrictsUserNamespaces: boolean | undefined;
}

export interface HostCheck { id: string; ok: boolean; detail: string }

const supportedProfiles = new Set<HostProfile>(['core', 'sandbox', 'agent-store', 'cgroup', 'supported']);

export function parseHostProfile(value: string): HostProfile {
  if (!supportedProfiles.has(value as HostProfile)) throw new Error(`Unsupported host profile: ${value}`);
  return value as HostProfile;
}

function includes(profile: HostProfile, part: Exclude<HostProfile, 'supported'>): boolean {
  return profile === 'supported' || profile === part;
}

/** Read-only evaluation of host facts. This never changes sysctls or configuration. */
export function evaluateHost(facts: HostFacts, profile: HostProfile): HostCheck[] {
  const checks: HostCheck[] = [];
  if (includes(profile, 'core')) {
    checks.push({ id: 'platform', ok: facts.platform === 'linux' && facts.arch === 'x64', detail: `${facts.platform}/${facts.arch}` });
    checks.push({ id: 'libc', ok: facts.libc?.toLowerCase().includes('glibc') === true, detail: facts.libc ?? 'glibc was not identified' });
  }
  if (includes(profile, 'sandbox')) {
    checks.push({ id: 'bubblewrap', ok: facts.commands.bwrap === true, detail: facts.commands.bwrap ? 'bwrap is on PATH' : 'bwrap is not on PATH' });
    const restricted = facts.apparmorRestrictsUserNamespaces === true;
    checks.push({
      id: 'user-namespace',
      ok: !restricted,
      detail: facts.apparmorRestrictsUserNamespaces === undefined
        ? 'AppArmor unprivileged user-namespace restriction is not present'
        : restricted
          ? 'kernel.apparmor_restrict_unprivileged_userns=1 blocks sandbox network namespaces'
          : 'unprivileged user namespaces are allowed',
    });
  }
  if (includes(profile, 'agent-store')) {
    checks.push({ id: 'fuse-device', ok: facts.fuseDevice, detail: facts.fuseDevice ? '/dev/fuse is present' : '/dev/fuse is missing' });
    checks.push({ id: 'fuse-allow-other', ok: facts.fuseUserAllowOther, detail: facts.fuseUserAllowOther ? 'user_allow_other is set' : '/etc/fuse.conf does not set user_allow_other' });
    checks.push({ id: 'fusermount3', ok: facts.commands.fusermount3 === true, detail: facts.commands.fusermount3 ? 'fusermount3 is on PATH' : 'fusermount3 is not on PATH' });
  }
  if (includes(profile, 'cgroup')) {
    checks.push({ id: 'cgroup-v2', ok: facts.cgroupV2, detail: facts.cgroupV2 ? 'cgroup v2 is mounted at /sys/fs/cgroup' : 'cgroup v2 was not found at /sys/fs/cgroup' });
  }
  return checks;
}
