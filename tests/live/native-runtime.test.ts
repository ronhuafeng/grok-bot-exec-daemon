import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { lstat } from 'node:fs/promises';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

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

const node = path.join(buildRoot, 'node');
const addonRoot = path.join(root, 'vendor/exec-daemon-runtime');

test('the provisioned Node 22.14.0 loads the pinned native addons', async () => {
  assert.equal((await lstat(node)).isFile(), true);
  const script = `
    const pty = require(${JSON.stringify(path.join(addonRoot, 'pty.node'))});
    const treeSitter = require(${JSON.stringify(path.join(addonRoot, 'node_modules/tree-sitter/build/Release/tree_sitter_runtime_binding.node'))});
    const bash = require(${JSON.stringify(path.join(addonRoot, 'node_modules/tree-sitter-bash/build/Release/tree_sitter_bash_binding.node'))});
    const renderer = require(${JSON.stringify(path.join(addonRoot, 'polished-renderer.node'))});
    if (!pty.fork || !treeSitter.Parser || !bash.language || !renderer.renderFromPlanNative) {
      throw new Error('native exports missing');
    }
    console.log(process.version + ' ' + process.versions.modules);
  `;
  const result = await run(node, ['-e', script]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), 'v22.14.0 127');
});
