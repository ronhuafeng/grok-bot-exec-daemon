import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../../tools/lib/project.js';

const contract = JSON.parse(await readFile(path.join(root, 'runtime/contract.json'), 'utf8')) as {
  agentStore: { filesystemType: string; mountPath: string };
};

function run(command: string, args: string[]): Promise<{ status: number | null; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'ignore'] });
    const stdout: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8') }));
  });
}

const mounted = await run('findmnt', ['-n', '-o', 'FSTYPE', contract.agentStore.mountPath]).catch(() => ({ status: 1, stdout: '' }));
const present = mounted.status === 0 && mounted.stdout.trim() === contract.agentStore.filesystemType;

test('an observed agent-store mount reports fuse.agent-store', { skip: !present }, () => {
  assert.equal(mounted.stdout.trim(), 'fuse.agent-store');
});
