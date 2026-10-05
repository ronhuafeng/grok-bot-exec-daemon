import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildRoot } from '../../tools/lib/project.js';

test('the provisioned ripgrep accepts --cursor-ignore', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-rg-'));
  try {
    await writeFile(path.join(directory, 'kept.txt'), 'hello kept\n');
    await writeFile(path.join(directory, 'hidden.txt'), 'hello hidden\n');
    await writeFile(path.join(directory, 'ignore'), 'hidden.txt\n');
    const result = await new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn(path.join(buildRoot, 'rg'), ['hello', '--cursor-ignore', path.join(directory, 'ignore'), directory], { stdio: ['ignore', 'pipe', 'pipe'] });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];
      child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
      child.on('error', reject);
      child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /kept\.txt/);
    assert.doesNotMatch(result.stdout, /hidden\.txt/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
