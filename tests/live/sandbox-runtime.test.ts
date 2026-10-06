import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot } from '../../tools/lib/project.js';

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

function sandbox(policy: string, args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return run(path.join(buildRoot, 'cursorsandbox'), ['--policy', policy, '--', ...args]);
}

test('cursorsandbox allows a workspace write and denies an outside write', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-sandbox-'));
  const outside = path.join(os.tmpdir(), `exec-daemon-sandbox-deny-${process.pid}`);
  try {
    const policyBody = JSON.stringify({
      sandbox: {
        type: 'workspace_readwrite',
        cwd: directory,
        readBoundary: 'workspace',
        hardcodedReadPaths: ['/bin', '/usr', '/lib', '/lib64', directory],
        additionalReadwritePaths: [directory],
        networkAccess: false,
        disableTmpWrite: true,
      },
    });
    const writePolicy = async (): Promise<string> => {
      const policy = path.join(directory, `policy-${Math.random().toString(16).slice(2)}.json`);
      await writeFile(policy, policyBody);
      return policy;
    };
    const allowed = await sandbox(await writePolicy(), ['/bin/sh', '-c', `echo yes > ${JSON.stringify(path.join(directory, 'ok.txt'))}`]);
    assert.equal(allowed.status, 0, allowed.stderr);
    assert.equal(await readFile(path.join(directory, 'ok.txt'), 'utf8'), 'yes\n');
    const denied = await sandbox(await writePolicy(), ['/bin/sh', '-c', `echo no > ${JSON.stringify(outside)}`]);
    assert.match(denied.stderr, /Permission denied/);
    await assert.rejects(readFile(outside));
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(outside, { force: true });
  }
});

test('cursorsandbox denies a local network connection', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-sandbox-net-'));
  const server = net.createServer(socket => { socket.end('ok'); });
  await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', () => resolve()); });
  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;
  assert.ok(Number.isInteger(port) && port > 0 && port <= 65535);
  const script = `if echo >/dev/tcp/127.0.0.1/${port}; then echo CONNECTED; exit 0; fi\necho DENIED\nexit 42`;
  const program = ['/bin/bash', '-c', script];
  try {
    const open = await run(program[0], program.slice(1));
    assert.equal(open.status, 0, open.stderr);
    assert.match(open.stdout, /CONNECTED/);
    const policy = path.join(directory, 'policy.json');
    await writeFile(policy, JSON.stringify({
      sandbox: {
        type: 'workspace_readwrite',
        cwd: directory,
        readBoundary: 'workspace',
        hardcodedReadPaths: ['/bin', '/usr', '/lib', '/lib64', directory],
        additionalReadwritePaths: [directory],
        networkAccess: false,
        disableTmpWrite: true,
      },
    }));
    const sandboxExecutable = path.join(buildRoot, 'cursorsandbox');
    assert.ok(existsSync(sandboxExecutable), `${sandboxExecutable}: missing executable is a setup failure`);
    const blocked = await sandbox(policy, program);
    const output = `${blocked.stdout}\n${blocked.stderr}`;
    assert.doesNotMatch(output, /No such file or directory|spawn .* ENOENT|bwrap: execvp|failed to start sandbox/i);
    assert.match(blocked.stdout, /DENIED/);
    assert.doesNotMatch(blocked.stdout, /CONNECTED/);
    assert.equal(blocked.status, 42, output);
  } finally {
    server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
