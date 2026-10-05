import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot } from '../../tools/lib/project.js';

async function sandbox(policy: string, args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(path.join(buildRoot, 'cursorsandbox'), ['--policy', policy, '--', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
  });
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
  const connect = `/bin/bash -c 'echo >/dev/tcp/127.0.0.1/${port}'`;
  try {
    const open = await new Promise<{ status: number | null }>((resolve, reject) => {
      const child = spawn('/bin/bash', ['-c', connect], { stdio: 'ignore' });
      child.on('error', reject);
      child.on('exit', status => resolve({ status }));
    });
    assert.equal(open.status, 0);
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
    const blocked = await sandbox(policy, ['/bin/bash', '-c', connect]);
    assert.notEqual(blocked.status, 0, blocked.stdout + blocked.stderr);
    assert.doesNotMatch(`${blocked.stdout}\n${blocked.stderr}`, /CONNECTED/);
  } finally {
    server.close();
    await rm(directory, { recursive: true, force: true });
  }
});
