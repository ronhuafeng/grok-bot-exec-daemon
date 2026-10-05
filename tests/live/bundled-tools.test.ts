import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { buildRoot } from '../../tools/lib/project.js';

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
  });
}

test('the provisioned Origin CLI reports its locked version', async () => {
  const result = await run(path.join(buildRoot, 'tools/origin'), ['--version']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout + result.stderr, /2026\.09\.24-20-34-11-8ed25e0/);
});

test('the provisioned tmux tree runs tmux 3.5a', async () => {
  const root = path.join(buildRoot, 'tmux-root');
  const result = await run(path.join(root, 'bin/tmux'), ['-V'], {
    ...process.env,
    LD_LIBRARY_PATH: path.join(root, 'lib'),
    TERMINFO_DIRS: path.join(root, 'share/terminfo'),
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /tmux 3\.5a/);
});

test('the provisioned agent-store helper advertises the mock backend', async () => {
  const result = await run(path.join(buildRoot, 'cursor-agent-store-fuse'), ['--help']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /fuse\.agent-store|In-VM FUSE/);
  assert.match(result.stdout, /--backend-mode/);
  assert.match(result.stdout, /mock/);
});
