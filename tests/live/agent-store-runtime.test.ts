import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

const contract = JSON.parse(await readFile(path.join(root, 'runtime/contract.json'), 'utf8')) as {
  agentStore: { filesystemType: string; mountPath: string };
};

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

async function filesystemType(mountPath: string): Promise<string> {
  const listed = await run('findmnt', ['-n', '-o', 'FSTYPE', mountPath]).catch(() => ({ status: 1, stdout: '', stderr: '' }));
  return listed.status === 0 ? listed.stdout.trim() : '';
}

test('the agent-store mount reports fuse.agent-store', async () => {
  const mountPath = contract.agentStore.mountPath;
  const existing = await filesystemType(mountPath);
  if (existing === contract.agentStore.filesystemType) {
    assert.equal(existing, 'fuse.agent-store');
    return;
  }
  await mkdir(mountPath, { recursive: true });
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-agent-store-'));
  const ready = path.join(scratch, 'ready');
  const helper = spawn(path.join(buildRoot, 'cursor-agent-store-fuse'), [
    '--backend-mode', 'mock',
    '--mount-root', mountPath,
    '--self-store-id', 'bc-00000000-0000-4000-8000-000000000001',
    '--ready-sentinel-path', ready,
    '--events-path', path.join(scratch, 'events.jsonl'),
    '--log-level', 'error',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const logs: Buffer[] = [];
  helper.stderr.on('data', (chunk: Buffer) => logs.push(chunk));
  helper.stdout.on('data', (chunk: Buffer) => logs.push(chunk));
  try {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (helper.exitCode !== null) break;
      try {
        await stat(ready);
        break;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    const fstype = await filesystemType(mountPath);
    assert.equal(fstype, 'fuse.agent-store', Buffer.concat(logs).toString('utf8'));
  } finally {
    await run('fusermount3', ['-u', mountPath]).catch(() => run('fusermount', ['-u', mountPath])).catch(() => run('umount', [mountPath]));
    helper.kill('SIGTERM');
    await rm(scratch, { recursive: true, force: true });
  }
});
