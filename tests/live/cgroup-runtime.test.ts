import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

const memoryLimit = 1073741824;
const cpuQuota = 20000;
const cpuPeriod = 100000;
const cpuLimitMcores = Math.round((cpuQuota / cpuPeriod) * 1000);
const cgroup = '/sys/fs/cgroup/exec-daemon-proof';

function run(command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code ?? 'unknown'}`)));
  });
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function assertRecord(value: unknown, detail: string): asserts value is Record<string, unknown> {
  assert.ok(value !== null && typeof value === 'object' && !Array.isArray(value), detail);
}

function parseUsage(body: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(body);
  assertRecord(parsed, body);
  return parsed;
}

function assertResourceUsage(usage: Record<string, unknown>, detail: string): void {
  assertRecord(usage.limits, detail);
  const memory = usage.limits.memoryLimitBytes;
  assert.ok(memory === memoryLimit || memory === String(memoryLimit), `${detail} limits.memoryLimitBytes=${JSON.stringify(memory)}`);
  assert.equal(usage.limits.cpuLimitMcores, cpuLimitMcores, `${detail} limits.cpuLimitMcores=${JSON.stringify(usage.limits.cpuLimitMcores)}`);
  const scope = usage.limits.scope;
  assert.ok(typeof scope === 'string' && scope.includes('CONTAINER'), `${detail} limits.scope=${JSON.stringify(scope)}`);
  assertRecord(usage.current, detail);
  assert.ok('memoryUsedBytes' in usage.current, `${detail} current=${JSON.stringify(usage.current)}`);
}

async function prepareCgroup(): Promise<void> {
  await run('sudo', ['-n', 'mkdir', '-p', cgroup]);
  await new Promise<void>((resolve, reject) => {
    const child = spawn('sudo', ['-n', 'tee', `${cgroup}/memory.max`], { stdio: ['pipe', 'ignore', 'pipe'] });
    child.stdin?.end(String(memoryLimit));
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('memory.max was not writable')));
  });
  await new Promise<void>((resolve, reject) => {
    const child = spawn('sudo', ['-n', 'tee', `${cgroup}/cpu.max`], { stdio: ['pipe', 'ignore', 'pipe'] });
    child.stdin?.end(`${cpuQuota} ${cpuPeriod}`);
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('cpu.max was not writable')));
  });
}

test('GetResourceUsage reports the cgroup v2 limits', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-cgroup-'));
  const workspace = path.join(directory, 'workspace');
  const home = path.join(directory, 'home');
  await mkdir(workspace);
  await mkdir(home);
  await run('git', ['init'], workspace);
  await prepareCgroup();
  const token = 'ci-resource-token';
  const children: ChildProcess[] = [];
  const logs: Buffer[] = [];
  const start = async (enabled: boolean): Promise<{ port: number; child: ChildProcess }> => {
    const port = await freePort();
    const ptyPort = await freePort();
    const args = ['serve', '--port', String(port), '--pty-websocket-port', String(ptyPort), '--bind-host', '127.0.0.1', '--rg-path', path.join(buildRoot, 'rg'), '--project-dir', workspace, '--log-level', 'error'];
    if (enabled) args.push('--machine-resources-enabled');
    const command = path.join(root, 'bin/exec-daemon');
    const spawnCommand = enabled
      ? { command: 'bash', args: ['-c', 'echo $ | sudo -n tee /sys/fs/cgroup/exec-daemon-proof/cgroup.procs >/dev/null && exec "$@"', 'exec-daemon', command, ...args] }
      : { command, args };
    const child = spawn(spawnCommand.command, spawnCommand.args, {
      cwd: workspace,
      env: { ...process.env, HOME: home, CURSOR_EXEC_DAEMON_DATA_DIR: path.join(directory, enabled ? 'data-on' : 'data-off'), EXEC_DAEMON_AUTH_TOKEN: token },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
    child.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
    children.push(child);
    return { port, child };
  };
  try {
    const disabled = await start(false);
    const enabled = await start(true);
    const deadline = Date.now() + 90000;
    let body = '';
    while (Date.now() < deadline) {
      if (enabled.child.exitCode !== null || disabled.child.exitCode !== null) break;
      const response = await fetch(`http://127.0.0.1:${enabled.port}/agent.v1.ControlService/GetResourceUsage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` },
        body: '{}',
      }).catch(() => undefined);
      if (response?.status === 200) { body = await response.text(); break; }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    const logTail = Buffer.concat(logs).toString('utf8').slice(-2000);
    assert.notEqual(body, '', logTail);
    const usage = parseUsage(body);
    assertResourceUsage(usage, `${body}\n${logTail}`);
    const cursor = usage.nextCursor;
    assert.ok(typeof cursor === 'string' && cursor.length > 0, body);
    const continued = await fetch(`http://127.0.0.1:${enabled.port}/agent.v1.ControlService/GetResourceUsage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` },
      body: JSON.stringify({ cursor }),
    });
    assert.equal(continued.status, 200);
    const continuedBody = await continued.text();
    const continuedUsage = parseUsage(continuedBody);
    assertResourceUsage(continuedUsage, continuedBody);
    assert.ok(continuedUsage.history === undefined || (Array.isArray(continuedUsage.history) && continuedUsage.history.length === 0), continuedBody);
    const disabledResponse = await fetch(`http://127.0.0.1:${disabled.port}/agent.v1.ControlService/GetResourceUsage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` },
      body: '{}',
    });
    assert.equal(disabledResponse.status, 400);
    assert.match(await disabledResponse.text(), /failed_precondition/);
    const placement = await readFile(`/proc/${enabled.child.pid}/cgroup`, 'utf8');
    assert.match(placement, /exec-daemon-proof/);
  } finally {
    for (const child of children) child.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 300));
    for (const child of children) if (child.exitCode === null) child.kill('SIGKILL');
    await rm(directory, { recursive: true, force: true });
    await run('sudo', ['-n', 'rmdir', cgroup]).catch(() => undefined);
  }
});
