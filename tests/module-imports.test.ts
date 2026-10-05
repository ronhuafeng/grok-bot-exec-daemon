import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import type { SpawnSyncReturns } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Command, Option } from '../src/interop/vendor/commander.js';
import { createServeCommand } from '../src/runtime/serveCommand.js';

const compiled = new URL('../src/', import.meta.url);
const capsule = new URL('../vendor.cjs', import.meta.url);
const require = createRequire(import.meta.url);

async function fixture(t: TestContext) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec normal modules '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const runtime = path.join(directory, 'installed runtime with spaces');
  const cwd = path.join(directory, 'unrelated cwd');
  await mkdir(path.join(runtime, 'app/runtime'), { recursive: true });
  await mkdir(path.join(runtime, 'app/interop/vendor'), { recursive: true });
  await mkdir(cwd);
  await writeFile(path.join(runtime, 'package.json'), '{"type":"commonjs"}\n');
  await writeFile(path.join(runtime, 'app/package.json'), '{"type":"module"}\n');
  return { directory, runtime, cwd };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;
function run(tree: Fixture, script: string, args: readonly string[] = []): SpawnSyncReturns<string> {
  const result = spawnSync(process.execPath, ['--no-addons', path.join(tree.runtime, script), ...args], {
    cwd: tree.cwd, encoding: 'utf8', timeout: 10_000, env: { PATH: process.env.PATH },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return result;
}
function record(result: SpawnSyncReturns<string>, status = 0): Record<string, unknown> {
  assert.equal(result.status, status, result.stderr);
  assert.equal(result.stderr, '');
  const lines = result.stdout.trimEnd().split('\n');
  assert.equal(lines.length, 1, 'only one controlled entry invocation');
  const value: unknown = JSON.parse(lines[0]);
  assert.ok(typeof value === 'object' && value !== null);
  return value as Record<string, unknown>;
}

async function wrapperFixture(t: TestContext, entry: string) {
  const tree = await fixture(t);
  await copyFile(new URL('runtime-entry.cjs', compiled), path.join(tree.runtime, 'index.js'));
  await writeFile(path.join(tree.runtime, 'app/runtime/index.js'), entry);
  return tree;
}

test('semantic facade and native owned consumers share the exact retained constructor identities', async () => {
  const raw: unknown = require(fileURLToPath(capsule));
  assert.ok(typeof raw === 'object' && raw !== null && 'loadCommander' in raw && typeof raw.loadCommander === 'function');
  const loaded: unknown = raw.loadCommander();
  assert.ok(typeof loaded === 'object' && loaded !== null && 'Command' in loaded && 'Option' in loaded);
  const again = await import('../src/interop/vendor/commander.js');
  assert.equal(Command, loaded.Command);
  assert.equal(Option, loaded.Option);
  assert.equal(again.Command, Command);
  assert.ok(createServeCommand() instanceof Command);
});

test('compiled pure leaves execute from an isolated ESM tree without capsule or invented globals', async (t) => {
  const tree = await fixture(t);
  for (const file of ['ring-buffer.js', 'trace-attributes.js']) {
    await copyFile(new URL(`runtime/${file}`, compiled), path.join(tree.runtime, 'app/runtime', file));
  }
  await writeFile(path.join(tree.runtime, 'probe.mjs'), `
import { RingBuffer } from './app/runtime/ring-buffer.js';
import { parseTraceAttributes } from './app/runtime/trace-attributes.js';
const values = new RingBuffer(2); values.push(1); values.push(2); values.push(3);
console.log(JSON.stringify({ values: values.toArray(), attributes: parseTraceAttributes('module=native') }));
`);
  assert.deepEqual(record(run(tree, 'probe.mjs')), { values: [2, 3], attributes: { module: 'native' } });
});

test('real runtime-location and capsule loader resolve the installed root after relocation with spaces', async (t) => {
  const tree = await fixture(t);
  await copyFile(new URL('runtime/runtime-location.js', compiled), path.join(tree.runtime, 'app/runtime/runtime-location.js'));
  await copyFile(new URL('interop/vendor/loader.js', compiled), path.join(tree.runtime, 'app/interop/vendor/loader.js'));
  await copyFile(capsule, path.join(tree.runtime, 'vendor.cjs'));
  await writeFile(path.join(tree.runtime, 'probe.mjs'), `
import { runtimeRoot } from './app/runtime/runtime-location.js';
console.log(JSON.stringify({ runtimeRoot, cwd: process.cwd() }));
`);
  assert.deepEqual(record(run(tree, 'probe.mjs')), { runtimeRoot: tree.runtime, cwd: tree.cwd });
  const location = await readFile(new URL('runtime/runtime-location.js', compiled), 'utf8');
  assert.doesNotMatch(location, /process\.cwd|__dirname|file:\/\/\/workdir/);
});

test('production CJS wrapper starts the controlled ESM main once and forwards full argv unchanged', async (t) => {
  const tree = await wrapperFixture(t, `
let calls = 0;
export async function main(argv) {
  calls++;
  process.once('beforeExit', () => undefined);
  console.log(JSON.stringify({ calls, argv, handlers: process.listenerCount('beforeExit') }));
}
`);
  await writeFile(path.join(tree.runtime, 'repeat.cjs'), `
const assert = require('node:assert/strict');
const first = require('./index.js'); const second = require('./index.js');
assert.equal(first, second);
Promise.all([first, second]).then(() => assert.equal(process.listenerCount('beforeExit'), 1));
`);
  const args = ['serve', 'space value', '', '*', 'quotes\'";$HOME', 'line\nbreak', '示例', '--'];
  assert.deepEqual(record(run(tree, 'repeat.cjs', args)), {
    calls: 1, argv: [process.execPath, path.join(tree.runtime, 'repeat.cjs'), ...args], handlers: 1,
  });
});

test('production wrapper leaves before-handler import rejection to Node default failure behavior', async (t) => {
  const tree = await wrapperFixture(t, 'throw new Error("controlled before-handler import failure");\n');
  const result = run(tree, 'index.js');
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Error: controlled before-handler import failure/);
});

test('production wrapper leaves post-handler rejection to the installed application handler without forcing exit 1', async (t) => {
  const tree = await wrapperFixture(t, `
export async function main() {
  process.on('unhandledRejection', (reason) => console.log(JSON.stringify({ logged: reason.message })));
  throw new Error('controlled after-handler rejection');
}
`);
  assert.deepEqual(record(run(tree, 'index.js')), { logged: 'controlled after-handler rejection' });
});

test('production wrapper preserves explicit main exit status', async (t) => {
  const tree = await wrapperFixture(t, 'export async function main() { process.exitCode = 37; }\n');
  const result = run(tree, 'index.js');
  assert.equal(result.status, 37);
  assert.equal(result.stdout + result.stderr, '');
});

test('production wrapper fails closed when the actual ESM entry lacks callable main', async (t) => {
  const tree = await wrapperFixture(t, 'export const main = 7;\n');
  const result = run(tree, 'index.js');
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /does not export main/);
});
