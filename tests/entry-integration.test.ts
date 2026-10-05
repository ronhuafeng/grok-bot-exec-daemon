import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCompiledApplication } from '../tools/lib/module-build.js';
import { readBaseline } from '../tools/lib/bundle.js';
import { root } from '../tools/lib/project.js';

let fixture: string;
before(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon entry with spaces '));
  const compiled = await readCompiledApplication();
  for (const [name, bytes] of compiled) {
    const destination = path.join(fixture, name === 'runtime-entry.cjs' ? 'index.js' : 'app/' + name);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, bytes);
  }
  await writeFile(path.join(fixture, 'package.json'), '{"type":"commonjs"}\n');
  await writeFile(path.join(fixture, 'app/package.json'), '{"type":"module"}\n');
  const prepared = path.join(root, 'dist/project');
  for (const file of await readdir(prepared)) {
    if (file === 'vendor.cjs' || /^\d+\.index\.js$/.test(file)) await copyFile(path.join(prepared, file), path.join(fixture, file));
  }
  const baseline = await readBaseline();
  await writeFile(path.join(fixture, 'baseline.cjs'), baseline);
  const startup = 'var __webpack_exports__ = __webpack_require__("./src/index.ts");';
  assert.equal(baseline.split(startup).length, 2, 'one exact baseline startup');
  await writeFile(path.join(fixture, 'baseline-registry.cjs'), baseline.replace(startup, 'module.exports = __webpack_require__;'));
});
after(async () => { if (fixture !== undefined) await rm(fixture, { recursive: true, force: true }); });

interface EntryResult { status: number | null; stdout: string; stderr: string; events: string[][]; }
function run(side: 'baseline' | 'candidate', scenario: string): EntryResult {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./fixtures/entry-guard.js', import.meta.url)), fixture, side, scenario], {
    cwd: os.tmpdir(), env: { PATH: '/fixture/bin', HOME: path.join(fixture, 'home'), NODE_ENV: 'test' },
    encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024,
  });
  assert.equal(result.error, undefined, `${side}/${scenario}: ${result.error?.message}`);
  assert.equal(result.signal, null, `${side}/${scenario} timed out or was signaled`);
  const marker = /\nENTRY_EVENTS (.+)\n/.exec(result.stderr);
  assert.ok(marker?.[1], `${side}/${scenario} did not report guarded completion: ${result.stderr}`);
  const record: unknown = JSON.parse(marker[1]);
  assert.ok(typeof record === 'object' && record !== null && 'events' in record && Array.isArray(record.events));
  const rows: unknown[] = record.events;
  assert.ok(rows.every(row => Array.isArray(row) && row.every((part: unknown) => typeof part === 'string')));
  const events = rows as string[][];
  assert.ok(!events.some(event => event[0] === 'forbidden'), `${side}/${scenario} attempted a forbidden operation: ${JSON.stringify(events)}`);
  return { status: result.status, stdout: result.stdout, stderr: result.stderr.replace(marker[0], ''), events };
}

for (const scenario of ['help', 'serve-help', 'missing-token', 'polished-present']) {
  test(`real application module loading preserves CLI output and initialization effects: ${scenario}`, () => {
    const baseline = run('baseline', scenario);
    const candidate = run('candidate', scenario);
    assert.deepEqual(candidate, baseline);
    assert.equal(candidate.status, scenario === 'missing-token' ? 1 : 0);
    assert.deepEqual(candidate.events.filter(event => event[0] === 'handler'), [
      ['handler', 'uncaughtException'], ['handler', 'unhandledRejection'],
    ]);
    const native = candidate.events.filter(event => event[0] === 'native');
    assert.deepEqual(native, scenario === 'polished-present'
      ? [['native', 'pty.node'], ['native', 'polished-renderer.node']]
      : [['native', 'pty.node']]);
  });
}

test('import/native-boundary failure before application handlers retains Node failure behavior', () => {
  const baseline = run('baseline', 'native-failure');
  const candidate = run('candidate', 'native-failure');
  assert.equal(baseline.status, 1);
  assert.equal(candidate.status, baseline.status);
  assert.deepEqual(candidate.events, baseline.events);
  assert.ok(!candidate.events.some(event => event[0] === 'handler'));
  assert.match(candidate.stderr, /native fixture unavailable/);
  assert.match(baseline.stderr, /native fixture unavailable/);
});

test('parser rejection after handler installation preserves application logging without a new exit policy', () => {
  const baseline = run('baseline', 'parse-reject');
  const candidate = run('candidate', 'parse-reject');
  assert.equal(candidate.status, baseline.status);
  assert.equal(candidate.status, 0);
  assert.deepEqual(candidate.events, baseline.events);
  for (const result of [baseline, candidate]) {
    assert.match(result.stderr + result.stdout, /Unhandled promise rejection/);
    assert.match(result.stderr + result.stdout, /parser fixture rejection/);
  }
});

test('resolved parser and ordinary application entry complete without service startup', () => {
  const baseline = run('baseline', 'parse-resolve');
  const candidate = run('candidate', 'parse-resolve');
  assert.deepEqual(candidate, baseline);
  assert.equal(candidate.status, 0);
  assert.equal(candidate.events.filter(event => event[0] === 'parse').length, 1);
});
