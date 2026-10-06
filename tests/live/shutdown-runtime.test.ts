import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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

function pidDead(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return error instanceof Error && 'code' in error && error.code === 'ESRCH';
  }
}

async function commandLinePids(marker: string): Promise<number[]> {
  const entries = await readdir('/proc');
  const matches: number[] = [];
  for (const entry of entries) {
    if (!/^[0-9]+$/.test(entry)) continue;
    const pid = Number(entry);
    if (pid === process.pid) continue;
    try {
      const cmdline = await readFile(`/proc/${pid}/cmdline`);
      if (cmdline.includes(marker)) matches.push(pid);
    } catch {
      // The process exited between the directory listing and the read.
    }
  }
  return matches;
}

function tmux(args: string[], socket?: string): Promise<{ status: number | null; stdout: string; stderr: string }> {
  const argv = socket === undefined ? args : ['-S', socket, ...args];
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.TMUX;
    delete env.TMUX_TMPDIR;
    const probe = spawn(path.join(buildRoot, 'tmux'), argv, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    probe.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    probe.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    probe.on('error', reject);
    probe.on('exit', status => resolve({
      status,
      stdout: Buffer.concat(stdout).toString('utf8'),
      stderr: Buffer.concat(stderr).toString('utf8'),
    }));
  });
}

test('graceful shutdown releases listeners and daemon-owned children', { timeout: 180000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-shutdown-'));
  const unrelatedDirectory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-unrelated-tmux-'));
  const workspace = path.join(directory, 'workspace');
  const home = path.join(directory, 'home');
  const data = path.join(directory, 'data');
  const unrelatedSocket = path.join(unrelatedDirectory, 'user.sock');
  const daemonSocket = path.join(data, 'tmux.sock');
  const sleeper = path.join(directory, 'sleep-fixture.sh');
  await mkdir(workspace);
  await mkdir(home);
  await mkdir(data);
  await writeFile(sleeper, '#!/bin/sh\nsleep 180 &\nwait\n');
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
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    HOME: home,
    CURSOR_EXEC_DAEMON_DATA_DIR: data,
    EXEC_DAEMON_AUTH_TOKEN: token,
    EXEC_DAEMON_PTY_AUTH_TOKEN: ptyToken,
  };
  delete env.TMUX;
  delete env.TMUX_TMPDIR;
  const start = (): ChildProcess => spawn(path.join(root, 'bin/exec-daemon'), args, { cwd: workspace, env, stdio: 'ignore' });
  let child = start();
  const recordedPids: number[] = [];
  const unrelated = await tmux(['new-session', '-d', '-s', 'user-kept', 'sleep', '180'], unrelatedSocket);
  assert.equal(unrelated.status, 0, `${unrelated.stdout}${unrelated.stderr}`);
  const defaultBefore = await tmux(['list-sessions', '-F', '#{session_name}']);
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
    const created = await fetch(`http://127.0.0.1:${httpPort}/agent.v1.TmuxSessionService/CreateSession`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionName: 'proof1', cwd: workspace, process: { shell: '/bin/sleep', args: ['180'] } }),
    });
    const createdBody = await created.text();
    assert.equal(created.status, 200, createdBody);
    const listed = await tmux(['list-sessions', '-F', '#{session_name}'], daemonSocket);
    assert.equal(listed.status, 0, `${listed.stdout}${listed.stderr}`);
    assert.match(listed.stdout, /^proof1$/m);
    const unrelatedBefore = await tmux(['list-sessions', '-F', '#{session_name}'], unrelatedSocket);
    assert.equal(unrelatedBefore.status, 0, `${unrelatedBefore.stdout}${unrelatedBefore.stderr}`);
    assert.match(unrelatedBefore.stdout, /^user-kept$/m);
    const owned = await run('pgrep', ['-f', sleeper]);
    assert.equal(owned.status, 0, owned.stdout);
    const scriptPids = owned.stdout.trim().split('\n').map(value => Number(value)).filter(pid => pid > 1);
    let scriptPid = 0;
    const childPids: number[] = [];
    for (const pid of scriptPids) {
      const children = await run('pgrep', ['-P', String(pid)]);
      if (children.status !== 0) continue;
      scriptPid = pid;
      childPids.push(...children.stdout.trim().split('\n').map(value => Number(value)).filter(childPid => childPid > 1));
      break;
    }
    assert.ok(scriptPid > 1, owned.stdout);
    assert.ok(childPids.length > 0, owned.stdout);
    recordedPids.push(scriptPid, ...childPids);
    child.kill('SIGTERM');
    const stopped = Date.now() + 15000;
    while (child.exitCode === null && Date.now() < stopped) await new Promise(resolve => setTimeout(resolve, 100));
    assert.notEqual(child.exitCode, null, 'graceful shutdown did not finish before escalation');
    assert.equal(await portOpen(httpPort), false);
    assert.equal(await portOpen(ptyPort), false);
    const remaining = await run('pgrep', ['-f', sleeper]);
    assert.notEqual(remaining.status, 0);
    for (const descendant of childPids) assert.equal(pidDead(descendant), true, `descendant ${descendant} still running`);
    const lingering = await commandLinePids(directory);
    assert.deepEqual(lingering, [], `processes still contain ${directory}: ${lingering.join(',')}`);
    const tmuxAfter = await tmux(['list-sessions', '-F', '#{session_name}'], daemonSocket);
    assert.notEqual(tmuxAfter.status, 0, `${tmuxAfter.stdout}${tmuxAfter.stderr}`);
    const unrelatedAfter = await tmux(['list-sessions', '-F', '#{session_name}'], unrelatedSocket);
    assert.equal(unrelatedAfter.status, 0, `${unrelatedAfter.stdout}${unrelatedAfter.stderr}`);
    assert.match(unrelatedAfter.stdout, /^user-kept$/m);
    const defaultAfter = await tmux(['list-sessions', '-F', '#{session_name}']);
    assert.equal(defaultAfter.status, defaultBefore.status);
    assert.equal(defaultAfter.stdout, defaultBefore.stdout);
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
    for (const pid of recordedPids) {
      try { process.kill(pid, 'SIGKILL'); } catch { /* already reaped */ }
    }
    await tmux(['kill-server'], unrelatedSocket);
    await tmux(['kill-server'], daemonSocket);
    await rm(directory, { recursive: true, force: true });
    await rm(unrelatedDirectory, { recursive: true, force: true });
  }
});
