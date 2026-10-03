import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { buildRoot } from './lib/project.mjs';

const checks = [];
checks.push({ name: 'native platform', ok: process.platform === 'linux' && process.arch === 'x64',
  detail: `snapshot native addons are Linux x86-64 ELF; host is ${process.platform}/${process.arch}` });
for (const name of ['index.js', 'node', 'exec-daemon', 'npx', 'lib/node_modules/npm/bin/npx-cli.js',
  'pty.node', 'polished-renderer.node', 'canvas-runtime/canvas-runtime.esm.js', 'agent-sdk/cursor/package.json']) {
  let ok = true;
  try { await access(path.join(buildRoot, name), ['node', 'exec-daemon', 'npx'].includes(name) ? constants.X_OK : constants.R_OK); }
  catch { ok = false; }
  checks.push({ name, ok, detail: ok ? 'present' : 'missing or inaccessible in dist/runtime' });
}
for (const check of checks) console.log(`${check.ok ? 'OK' : 'MISSING'}  ${check.name}: ${check.detail}`);
console.log('\nNo code, native addon, server, browser, or external tool was executed by this check.');
console.log('Node ABI compatibility, shared libraries, external services, credentials, and optional tool availability remain unverified.');
console.log('Optional features may require rg, gh, ssh-keygen, cursorsandbox, tools/origin, or tmux-root/. See docs/runtime.md.');
// Read only the ELF header, never dlopen the imported binary.
try {
  const bytes = await readFile(path.join(buildRoot, 'pty.node'));
  if (bytes.subarray(0, 4).toString('hex') !== '7f454c46') {
    console.error('Unexpected PTY addon header.');
    process.exitCode = 1;
  }
} catch { /* Missing files were already reported. */ }
if (checks.some((check) => !check.ok)) process.exitCode = 1;
