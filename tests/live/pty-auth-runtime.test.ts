import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

const httpToken = 'ci-http-only-token';

function run(command: string, args: string[], cwd?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code ?? 'unknown'}`)));
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

async function ping(port: number, token: string): Promise<number> {
  const response = await fetch(`http://127.0.0.1:${port}/agent.v1.ControlService/Ping`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` },
    body: '{}',
  });
  return response.status;
}

test('HTTP auth without a PTY token does not open a PTY listener', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-pty-disabled-'));
  const workspace = path.join(directory, 'workspace');
  const home = path.join(directory, 'home');
  const data = path.join(directory, 'data');
  await mkdir(workspace);
  await mkdir(home);
  await mkdir(data);
  await run('git', ['init'], workspace);
  const httpPort = await freePort();
  const ptyPort = await freePort();
  const logs: Buffer[] = [];
  const child: ChildProcess = spawn(path.join(root, 'bin/exec-daemon'), [
    'serve',
    '--port', String(httpPort),
    '--pty-websocket-port', String(ptyPort),
    '--bind-host', '127.0.0.1',
    '--rg-path', path.join(buildRoot, 'rg'),
    '--project-dir', workspace,
    '--log-level', 'info',
  ], {
    cwd: workspace,
    env: {
      ...process.env,
      HOME: home,
      CURSOR_EXEC_DAEMON_DATA_DIR: data,
      EXEC_DAEMON_AUTH_TOKEN: httpToken,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
  child.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
  const output = () => Buffer.concat(logs).toString('utf8');
  try {
    const deadline = Date.now() + 90000;
    let ready = false;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`daemon exited ${child.exitCode}: ${output()}`);
      const status = await ping(httpPort, httpToken).catch(() => undefined);
      if (status === 200) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.equal(ready, true, output());
    assert.equal(await portOpen(ptyPort), false);
    assert.equal(output().includes(httpToken), false);
  } finally {
    if (child.exitCode === null) child.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 300));
    if (child.exitCode === null) child.kill('SIGKILL');
    await rm(directory, { recursive: true, force: true });
  }
});

test('unauthenticated PTY on a non-loopback bind host exits before listening', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-pty-anon-'));
  const workspace = path.join(directory, 'workspace');
  const home = path.join(directory, 'home');
  const data = path.join(directory, 'data');
  await mkdir(workspace);
  await mkdir(home);
  await mkdir(data);
  await run('git', ['init'], workspace);
  const httpPort = await freePort();
  const ptyPort = await freePort();
  const logs: Buffer[] = [];
  const child: ChildProcess = spawn(path.join(root, 'bin/exec-daemon'), [
    'serve',
    '--port', String(httpPort),
    '--pty-websocket-port', String(ptyPort),
    '--bind-host', '0.0.0.0',
    '--allow-unauthenticated-pty',
    '--rg-path', path.join(buildRoot, 'rg'),
    '--project-dir', workspace,
    '--log-level', 'info',
  ], {
    cwd: workspace,
    env: {
      ...process.env,
      HOME: home,
      CURSOR_EXEC_DAEMON_DATA_DIR: data,
      EXEC_DAEMON_AUTH_TOKEN: httpToken,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
  child.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
  const output = () => Buffer.concat(logs).toString('utf8');
  try {
    const exitCode = await new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => resolve(child.exitCode), 15000);
      child.on('exit', (code) => {
        clearTimeout(timer);
        resolve(code);
      });
    });
    assert.notEqual(exitCode, null, output());
    assert.notEqual(exitCode, 0, output());
    assert.equal(output().includes('Unauthenticated PTY requires an explicit loopback bind host'), true, output());
    assert.equal(output().includes(httpToken), false, output());
  } finally {
    if (child.exitCode === null) child.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 300));
    if (child.exitCode === null) child.kill('SIGKILL');
    await rm(directory, { recursive: true, force: true });
  }
});
