import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

const httpToken = 'ci-http-token';
const ptyToken = 'ci-pty-token';
const marker = '###-begin-origin-completions-###';
const originPath = path.join(buildRoot, 'tools/origin');

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

function run(command: string, args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
  });
}

interface SocketMessage { type?: number; requestId?: string; status?: number; body?: string }

function decodeConnectFrames(bytes: Buffer): string {
  const parts: string[] = [];
  let offset = 0;
  while (offset + 5 <= bytes.length) {
    const length = bytes.readUInt32BE(offset + 1);
    offset += 5;
    if (offset + length > bytes.length) break;
    parts.push(bytes.subarray(offset, offset + length).toString('utf8'));
    offset += length;
  }
  return parts.join('');
}

function socketText(messages: readonly SocketMessage[]): string {
  const raw = messages.filter(message => message.type === 3).map(message => {
    const bytes = Buffer.from(message.body ?? '', 'base64');
    return decodeConnectFrames(bytes) + bytes.toString('utf8');
  }).join('');
  const decoded: string[] = [];
  for (const match of raw.matchAll(/"data"\s*:\s*"([^"]*)"/g)) {
    const value = match[1];
    if (value !== undefined) decoded.push(Buffer.from(value, 'base64').toString('utf8'));
  }
  return `${raw}\n${decoded.join('')}`;
}

function socketMessages(port: number, token: string, requests: readonly Record<string, unknown>[], until: string): Promise<SocketMessage[]> {
  return new Promise((resolve, reject) => {
    const messages: SocketMessage[] = [];
    const socket = new WebSocket(`ws://127.0.0.1:${port}/?token=${encodeURIComponent(token)}`);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error(`WebSocket timed out: ${socketText(messages).slice(-1000)}`));
    }, 20000);
    socket.addEventListener('open', () => {
      for (const request of requests) socket.send(JSON.stringify(request));
    });
    socket.addEventListener('message', (event) => {
      const parsed: unknown = JSON.parse(String(event.data));
      if (typeof parsed !== 'object' || parsed === null) return;
      messages.push(parsed as SocketMessage);
      if (socketText(messages).includes(until)) {
        clearTimeout(timer);
        socket.close();
      }
    });
    socket.addEventListener('error', () => { /* close carries the result */ });
    socket.addEventListener('close', () => {
      clearTimeout(timer);
      resolve(messages);
    });
  });
}

async function startDaemon(workspace: string, home: string, data: string, originEnabled: boolean): Promise<{ child: ChildProcess; httpPort: number; ptyPort: number; output: () => string }> {
  const httpPort = await freePort();
  const ptyPort = await freePort();
  const logs: Buffer[] = [];
  const args = [
    'serve', '--port', String(httpPort), '--pty-websocket-port', String(ptyPort), '--bind-host', '127.0.0.1',
    '--rg-path', path.join(buildRoot, 'rg'), '--project-dir', workspace, '--log-level', 'error',
  ];
  if (originEnabled) args.push('--origin-cli-enabled');
  const child = spawn(path.join(root, 'bin/exec-daemon'), args, {
    cwd: workspace,
    env: { ...process.env, HOME: home, CURSOR_EXEC_DAEMON_DATA_DIR: data, EXEC_DAEMON_AUTH_TOKEN: httpToken, EXEC_DAEMON_PTY_AUTH_TOKEN: ptyToken },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
  child.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
  const output = () => Buffer.concat(logs).toString('utf8').slice(-4000);
  const deadline = Date.now() + 90000;
  let ready = false;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`daemon exited ${child.exitCode}: ${output()}`);
    const response = await fetch(`http://127.0.0.1:${httpPort}/agent.v1.ControlService/Ping`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${httpToken}` },
      body: '{}',
    }).catch(() => undefined);
    if (response?.status === 200) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error(`daemon did not become ready: ${output()}`);
  return { child, httpPort, ptyPort, output };
}

async function stopDaemon(child: ChildProcess): Promise<void> {
  child.kill('SIGTERM');
  await new Promise(resolve => setTimeout(resolve, 400));
  if (child.exitCode === null) child.kill('SIGKILL');
}

function requestBody(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64');
}

async function ptyCommand(ptyPort: number, workspace: string, command: string, until: string): Promise<string> {
  const spawned = await socketMessages(ptyPort, ptyToken, [{
    type: 1,
    requestId: 'spawn',
    path: '/agent.v1.PtyHostService/SpawnPty',
    method: 'POST',
    headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${ptyToken}` },
    body: requestBody({ cwd: workspace, cols: 120, rows: 40, process: { shell: '/bin/bash', args: ['-c', command] } }),
  }], '"ptyId"');
  const spawnBody = socketText(spawned);
  const ptyId = /"ptyId"\s*:\s*"([^"]+)"/.exec(spawnBody)?.[1];
  assert.ok(ptyId, spawnBody.slice(0, 500));
  const data = Buffer.from(JSON.stringify({ ptyId }));
  const frame = Buffer.alloc(5 + data.length);
  frame.writeUInt32BE(data.length, 1);
  data.copy(frame, 5);
  const attached = await socketMessages(ptyPort, ptyToken, [{
    type: 1,
    requestId: 'attach',
    path: '/agent.v1.PtyHostService/AttachPty',
    method: 'POST',
    headers: { 'content-type': 'application/connect+json', 'connect-protocol-version': '1', authorization: `Bearer ${ptyToken}` },
    body: frame.toString('base64'),
  }], until);
  return socketText(attached);
}

test('a version-only origin stub does not emit the bash completion script', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'origin-stub-'));
  const stub = path.join(directory, 'origin');
  try {
    await writeFile(stub, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo 2026.09.24-20-34-11-8ed25e0; exit 0; fi\necho "origin: unsupported command" >&2\nexit 1\n');
    await chmod(stub, 0o755);
    const version = await run(stub, ['--version']);
    assert.equal(version.status, 0);
    assert.match(version.stdout, /2026\.09\.24-20-34-11-8ed25e0/);
    const completion = await run(stub, ['completion', 'bash']);
    assert.notEqual(completion.status, 0);
    assert.doesNotMatch(`${completion.stdout}\n${completion.stderr}`, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(completion.stderr, /unsupported command/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('the daemon exposes the locked origin binary to agent shells', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'origin-daemon-'));
  const workspace = path.join(directory, 'workspace');
  const home = path.join(directory, 'home');
  const data = path.join(directory, 'data');
  await mkdir(workspace);
  await mkdir(home);
  await mkdir(data);
  const init = await run('git', ['init', workspace]);
  assert.equal(init.status, 0, init.stderr);
  const enabled = await startDaemon(workspace, home, data, true);
  try {
    const output = (await ptyCommand(enabled.ptyPort, workspace, 'command -v origin; origin completion bash; printf "\\nORIGIN_DONE\\n"', 'ORIGIN_DONE')).replace(/\r/g, '');
    assert.match(output, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), output.slice(0, 800));
    assert.match(output, /ORIGIN_DONE/);
    const resolved = output.split('\n').map(line => line.trim()).find(line => line.endsWith('/tools/origin'));
    assert.equal(resolved, originPath, output.slice(0, 800));
    const lock = JSON.parse(await readFile(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as { tools: { id: string; version: string }[] };
    const version = lock.tools.find(tool => tool.id === 'origin')?.version;
    assert.equal(version, '2026.09.24-20-34-11-8ed25e0');
  } finally {
    await stopDaemon(enabled.child);
    await rm(directory, { recursive: true, force: true });
  }
});

test('a daemon without the origin flag does not resolve the provisioned origin', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'origin-disabled-'));
  const workspace = path.join(directory, 'workspace');
  const home = path.join(directory, 'home');
  const data = path.join(directory, 'data');
  await mkdir(workspace);
  await mkdir(home);
  await mkdir(data);
  const init = await run('git', ['init', workspace]);
  assert.equal(init.status, 0, init.stderr);
  const disabled = await startDaemon(workspace, home, data, false);
  try {
    const output = (await ptyCommand(disabled.ptyPort, workspace, `resolved=$(command -v origin || true); printf '%s\\n' "$resolved"; if [ "$resolved" = ${JSON.stringify(originPath)} ]; then echo PROVISIONED; else echo NOT_PROVISIONED; fi`, 'NOT_PROVISIONED')).replace(/\r/g, '');
    assert.match(output, /NOT_PROVISIONED/);
    assert.equal(output.split('\n').some(line => line.trim() === 'PROVISIONED'), false);
  } finally {
    await stopDaemon(disabled.child);
    await rm(directory, { recursive: true, force: true });
  }
});
