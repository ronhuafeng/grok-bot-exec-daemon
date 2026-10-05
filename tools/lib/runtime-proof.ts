export const RUNTIME_PROOF_SCHEMA_VERSION = 1;

export const REQUIRED_LIVE_CHECKS = [
  'the agent-store mount reports fuse.agent-store',
  'the provisioned Origin CLI reports its locked version',
  'the provisioned tmux tree runs tmux 3.5a',
  'the provisioned agent-store helper advertises the mock backend',
  'the project launcher prints help with the provisioned Node',
  'the provisioned Node 22.14.0 loads the pinned native addons',
  'the pinned pty addon opens a real process',
  'the provisioned ripgrep accepts --cursor-ignore',
  'cursorsandbox allows a workspace write and denies an outside write',
  'cursorsandbox denies a local network connection',
  'serve authenticates HTTP Ping and PTY WebSocket spawn',
  'GetResourceUsage reports the cgroup v2 limits',
  'graceful shutdown releases listeners and daemon-owned children',
] as const;

export interface RuntimeProofTool { id: string; version: string; sha256: string }
export interface RuntimeProofCheck { name: string; status: 'passed' }
export interface RuntimeProof {
  schemaVersion: 1;
  commit: string;
  profile: 'supported';
  host: { os: string; arch: string; kernel: string; libc: string };
  node: { version: string; modules: number };
  tools: RuntimeProofTool[];
  checks: RuntimeProofCheck[];
}

export function parseTapStatuses(tap: string): Map<string, 'passed' | 'failed'> {
  const statuses = new Map<string, 'passed' | 'failed'>();
  for (const line of tap.split('\n')) {
    const match = /^(not ok|ok)\s+\d+\s+-\s+(.+?)(?:\s+#.*)?$/.exec(line.trim());
    if (!match) continue;
    const name = match[2]?.trim();
    if (name === undefined || name === '') continue;
    statuses.set(name, match[1] === 'ok' ? 'passed' : 'failed');
  }
  return statuses;
}

export function buildRuntimeProof(input: Omit<RuntimeProof, 'schemaVersion' | 'checks'> & { tap: string }): RuntimeProof {
  if (!/^[0-9a-f]{40}$/.test(input.commit)) throw new Error('Runtime proof requires the full Git commit SHA');
  if (input.host.os !== 'linux' || input.host.arch !== 'x64' || input.host.kernel === '' || !input.host.libc.toLowerCase().includes('glibc')) {
    throw new Error('Runtime proof host identity is incomplete');
  }
  if (!/^v\d+\.\d+\.\d+$/.test(input.node.version) || !Number.isInteger(input.node.modules)) throw new Error('Runtime proof Node identity is incomplete');
  if (input.tools.length === 0 || input.tools.some(tool => !/^[0-9a-f]{64}$/.test(tool.sha256) || tool.version === '')) {
    throw new Error('Runtime proof tool identities are incomplete');
  }
  const statuses = parseTapStatuses(input.tap);
  const checks: RuntimeProofCheck[] = [];
  for (const name of REQUIRED_LIVE_CHECKS) {
    if (statuses.get(name) !== 'passed') throw new Error(`Required live check did not pass: ${name}`);
    checks.push({ name, status: 'passed' });
  }
  return {
    schemaVersion: RUNTIME_PROOF_SCHEMA_VERSION,
    commit: input.commit,
    profile: 'supported',
    host: input.host,
    node: input.node,
    tools: input.tools,
    checks,
  };
}
