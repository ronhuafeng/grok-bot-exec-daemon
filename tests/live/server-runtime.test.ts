import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

const httpToken = 'ci-http-token';
const ptyToken = 'ci-pty-token';

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

async function ping(port: number, token: string | undefined): Promise<{ status: number; body: string }> {
  const headers: Record<string, string> = { 'content-type': 'application/json', 'connect-protocol-version': '1' };
  if (token !== undefined) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${port}/agent.v1.ControlService/Ping`, { method: 'POST', headers, body: '{}' });
  return { status: response.status, body: await response.text() };
}

interface SocketMessage { type?: number; requestId?: string; status?: number; body?: string; message?: string }

function socketMessages(port: number, token: string | undefined, requests: readonly Record<string, unknown>[]): Promise<{ closeCode: number; messages: SocketMessage[] }> {
  const query = token === undefined ? '' : `?token=${encodeURIComponent(token)}`;
  return new Promise((resolve, reject) => {
    const messages: SocketMessage[] = [];
    const socket = new WebSocket(`ws://127.0.0.1:${port}/${query}`);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error(`WebSocket timed out: ${JSON.stringify(messages)}`));
    }, 10000);
    socket.addEventListener('open', () => {
      for (const request of requests) socket.send(JSON.stringify(request));
    });
    socket.addEventListener('message', (event) => {
      const parsed: unknown = JSON.parse(String(event.data));
      if (typeof parsed !== 'object' || parsed === null) return;
      messages.push(parsed as SocketMessage);
      const latest = messages.at(-1);
      const latestText = Buffer.from(latest?.body ?? '', 'base64').toString('utf8');
      if (latestText.includes('pty-ok') || latestText.includes('cHR5LW9r')) {
        clearTimeout(timer);
        socket.close();
        return;
      }
      const pending = new Set(requests.map(request => String(request.requestId)));
      for (const message of messages) {
        if ((message.type === 5 || message.type === 6) && message.requestId !== undefined) pending.delete(message.requestId);
      }
      if (requests.length > 0 && pending.size === 0) {
        clearTimeout(timer);
        socket.close();
      }
    });
    socket.addEventListener('error', () => { /* close carries the result */ });
    socket.addEventListener('close', (event) => {
      clearTimeout(timer);
      resolve({ closeCode: event.code, messages });
    });
  });
}

function requestBody(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64');
}

function connectStreamBody(value: unknown): string {
  const data = Buffer.from(JSON.stringify(value));
  const frame = Buffer.alloc(5 + data.length);
  frame.writeUInt32BE(data.length, 1);
  data.copy(frame, 5);
  return frame.toString('base64');
}

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

test('serve authenticates HTTP Ping and PTY WebSocket spawn', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-serve-'));
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
    '--auth-token', httpToken,
    '--pty-auth-token', ptyToken,
    '--rg-path', path.join(buildRoot, 'rg'),
    '--project-dir', workspace,
    '--log-level', 'info',
  ], {
    cwd: workspace,
    env: { ...process.env, HOME: home, CURSOR_EXEC_DAEMON_DATA_DIR: data },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
  child.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
  const output = () => Buffer.concat(logs).toString('utf8').slice(-4000);
  try {
    const deadline = Date.now() + 90000;
    let ready = false;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`daemon exited ${child.exitCode}: ${output()}`);
      const result = await ping(httpPort, httpToken).catch(() => undefined);
      if (result?.status === 200) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.equal(ready, true, output());
    const anonymous = await ping(httpPort, undefined);
    const wrong = await ping(httpPort, 'wrong-token');
    const accepted = await ping(httpPort, httpToken);
    assert.equal(anonymous.status, 401, anonymous.body);
    assert.equal(wrong.status, 401, wrong.body);
    assert.equal(accepted.status, 200, accepted.body);

    const rejected = await socketMessages(ptyPort, 'wrong-token', []);
    assert.equal(rejected.closeCode, 4001, JSON.stringify(rejected.messages));
    const unauthenticated = await socketMessages(ptyPort, ptyToken, [{
      type: 1,
      requestId: 'denied',
      path: '/agent.v1.PtyHostService/SpawnPty',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1' },
      body: requestBody({ cwd: workspace, cols: 80, rows: 24, process: { shell: '/bin/echo', args: ['pty-ok'] } }),
    }]);
    assert.equal(unauthenticated.messages.find(message => message.type === 4)?.status, 401, JSON.stringify(unauthenticated.messages));
    const spawned = await socketMessages(ptyPort, ptyToken, [{
      type: 1,
      requestId: 'spawn',
      path: '/agent.v1.PtyHostService/SpawnPty',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${ptyToken}` },
      body: requestBody({ cwd: workspace, cols: 80, rows: 24, process: { shell: '/bin/echo', args: ['pty-ok'] } }),
    }]);
    const spawnHeader = spawned.messages.find(message => message.requestId === 'spawn' && message.type === 4);
    assert.equal(spawnHeader?.status, 200, JSON.stringify(spawned.messages));
    const spawnBody = spawned.messages.filter(message => message.requestId === 'spawn' && message.type === 3).map(message => Buffer.from(message.body ?? '', 'base64').toString('utf8')).join('');
    const ptyId = /"ptyId"\s*:\s*"([^"]+)"/.exec(spawnBody)?.[1];
    assert.ok(ptyId, spawnBody);
    const attached = await socketMessages(ptyPort, ptyToken, [{
      type: 1,
      requestId: 'attach',
      path: '/agent.v1.PtyHostService/AttachPty',
      method: 'POST',
      headers: { 'content-type': 'application/connect+json', 'connect-protocol-version': '1', authorization: `Bearer ${ptyToken}` },
      body: connectStreamBody({ ptyId }),
    }]);
    const attachedText = attached.messages.filter(message => message.type === 3).map(message => {
      const bytes = Buffer.from(message.body ?? '', 'base64');
      return decodeConnectFrames(bytes) + bytes.toString('utf8');
    }).join('');
    assert.match(attachedText, /pty-ok|cHR5LW9r/, JSON.stringify(attached.messages));
  } finally {
    child.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 500));
    if (child.exitCode === null) child.kill('SIGKILL');
    await rm(directory, { recursive: true, force: true });
  }
});
