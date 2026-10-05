import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

function run(command: string, args: string[], cwd?: string): Promise<{ status: number | null; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
    const stdout: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8') }));
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

function portOpen(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
  });
}

test('graceful shutdown releases listeners and daemon-owned children', { timeout: 180000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-shutdown-'));
  const workspace = path.join(directory, 'workspace');
  const home = path.join(directory, 'home');
  const data = path.join(directory, 'data');
  const tmuxTmp = path.join(directory, 'tmux');
  const sleeper = path.join(directory, 'sleep-fixture.sh');
  await mkdir(workspace);
  await mkdir(home);
  await mkdir(data);
  await mkdir(tmuxTmp);
  await writeFile(sleeper, '#!/bin/sh\nsleep 180\n');
  await chmod(sleeper, 0o755);
  await run('git', ['init'], workspace);
  const httpPort = await freePort();
  const ptyPort = await freePort();
  const token = 'ci-shutdown-token';
  const ptyToken = 'ci-shutdown-pty-token';
  const args = [
    'serve', '--port', String(httpPort), '--pty-websocket-port', String(ptyPort), '--bind-host', '127.0.0.1',
    '--rg-path', path.join(buildRoot, 'rg'), '--project-dir', workspace, '--log-level', 'error',
    '--tmux-service-enabled', '--tmux-path', path.join(buildRoot, 'tmux'),
  ];
  const env = {
    ...process.env,
    HOME: home,
    CURSOR_EXEC_DAEMON_DATA_DIR: data,
    EXEC_DAEMON_AUTH_TOKEN: token,
    EXEC_DAEMON_PTY_AUTH_TOKEN: ptyToken,
    TMUX_TMPDIR: tmuxTmp,
  };
  const start = (): ChildProcess => spawn(path.join(root, 'bin/exec-daemon'), args, { cwd: workspace, env, stdio: 'ignore' });
  let child = start();
  try {
    const deadline = Date.now() + 90000;
    let ready = false;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`daemon exited ${child.exitCode}`);
      const response = await fetch(`http://127.0.0.1:${httpPort}/agent.v1.ControlService/Ping`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` }, body: '{}',
      }).catch(() => undefined);
      if (response?.status === 200) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.equal(ready, true);
    const socket = new WebSocket(`ws://127.0.0.1:${ptyPort}/?token=${encodeURIComponent(ptyToken)}`);
    const spawned = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('pty spawn timed out')), 10000);
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({
          type: 1, requestId: 'sleep', path: '/agent.v1.PtyHostService/SpawnPty', method: 'POST',
          headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${ptyToken}` },
          body: Buffer.from(JSON.stringify({ cwd: workspace, cols: 80, rows: 24, process: { shell: sleeper, args: [] } })).toString('base64'),
        }));
      });
      socket.addEventListener('message', event => {
        const parsed: unknown = JSON.parse(String(event.data));
        if (typeof parsed !== 'object' || parsed === null || !('body' in parsed)) return;
        const body = Buffer.from(String((parsed as { body?: string }).body ?? ''), 'base64').toString('utf8');
        const ptyId = /"ptyId"\s*:\s*"([^"]+)"/.exec(body)?.[1];
        if (ptyId !== undefined) { clearTimeout(timer); resolve(ptyId); }
      });
      socket.addEventListener('error', () => undefined);
    });
    assert.ok(spawned);
    socket.close();
    const owned = await run('pgrep', ['-f', sleeper]);
    assert.equal(owned.status, 0, owned.stdout);
    child.kill('SIGTERM');
    const stopped = Date.now() + 15000;
    while (child.exitCode === null && Date.now() < stopped) await new Promise(resolve => setTimeout(resolve, 100));
    if (child.exitCode === null) child.kill('SIGKILL');
    assert.equal(await portOpen(httpPort), false);
    assert.equal(await portOpen(ptyPort), false);
    const remaining = await run('pgrep', ['-f', sleeper]);
    assert.notEqual(remaining.status, 0);
    const tmux = await new Promise<{ status: number | null }>((resolve, reject) => {
      const probe = spawn(path.join(buildRoot, 'tmux'), ['list-sessions'], { env: { ...process.env, TMUX_TMPDIR: tmuxTmp }, stdio: 'ignore' });
      probe.on('error', reject);
      probe.on('exit', status => resolve({ status }));
    });
    assert.notEqual(tmux.status, 0);
    child = start();
    const restarted = Date.now() + 90000;
    let again = false;
    while (Date.now() < restarted) {
      const response = await fetch(`http://127.0.0.1:${httpPort}/agent.v1.ControlService/Ping`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` }, body: '{}',
      }).catch(() => undefined);
      if (response?.status === 200) { again = true; break; }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.equal(again, true);
  } finally {
    if (child.exitCode === null) child.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 300));
    if (child.exitCode === null) child.kill('SIGKILL');
    await run('pkill', ['-f', sleeper]).catch(() => undefined);
    await rm(directory, { recursive: true, force: true });
  }
});
