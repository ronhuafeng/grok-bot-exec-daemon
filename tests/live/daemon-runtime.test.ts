import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { root } from '../../tools/lib/project.js';

test('the project launcher prints help with the provisioned Node', async () => {
  const result = await new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(path.join(root, 'bin/exec-daemon'), ['--help'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Cursor exec daemon/);
  assert.match(result.stdout, /serve/);
  assert.match(result.stdout, /refresh-git-token/);
});
