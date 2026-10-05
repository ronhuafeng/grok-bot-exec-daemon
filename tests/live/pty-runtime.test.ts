import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';

test('the pinned pty addon opens a real process', async () => {
  const node = path.join(buildRoot, 'node');
  const addon = path.join(root, 'vendor/exec-daemon-runtime/pty.node');
  const script = `
    const fs = require('fs');
    const pty = require(${JSON.stringify(addon)});
    const term = pty.fork('/bin/echo', ['pty-ok'], ['PATH=/usr/bin:/bin'], '/tmp', 80, 24, -1, -1, true, 'spawn-helper-unused', (code, signal) => {
      let output = '';
      const buffer = Buffer.alloc(4096);
      try {
        while (true) {
          const count = fs.readSync(term.fd, buffer, 0, buffer.length);
          if (count <= 0) break;
          output += buffer.subarray(0, count).toString('utf8');
        }
      } catch (error) {
        if (!error || (error.code !== 'EAGAIN' && error.code !== 'EIO')) throw error;
      }
      if (code !== 0 || signal !== 0 || !output.includes('pty-ok')) {
        console.error(JSON.stringify({ code, signal, output }));
        process.exit(1);
      }
      process.exit(0);
    });
  `;
  const result = await new Promise<{ status: number | null; stderr: string }>((resolve, reject) => {
    const child = spawn(node, ['-e', script], { stdio: ['ignore', 'pipe', 'pipe'] });
    const stderr: Buffer[] = [];
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stderr: Buffer.concat(stderr).toString('utf8') }));
  });
  assert.equal(result.status, 0, result.stderr);
});
