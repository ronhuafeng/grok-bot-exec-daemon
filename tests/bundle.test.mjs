import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { moduleBlocks, wrapFactory, unwrapFactory, readFactories, assembleBundle } from '../tools/lib/bundle.mjs';
import { runtimeRoot } from '../tools/lib/project.mjs';

const baselineBytes = await readFile(path.join(runtimeRoot, 'index.js'));
const baseline = baselineBytes.toString('utf8');
const blocks = moduleBlocks(baseline);
const originals = new Map([...blocks].map(([id, block]) => [id, block.text]));
const id = './src/example.ts';
const block = `/***/ "${id}"\n(module) {\nmodule.exports = 1;\n/***/ },\n\n`;

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-factories-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const manifest = [{ id, file: 'example.cjs' }];
  await writeFile(path.join(directory, 'modules.json'), JSON.stringify(manifest));
  await writeFile(path.join(directory, 'example.cjs'), wrapFactory(block));
  return { directory, manifest };
}

test('unchanged extraction, factory wrappers, and reassembly preserve every original byte', async (t) => {
  assert.equal(blocks.size, 21);
  const { directory } = await fixture(t);
  // Build a new extraction from original bytes, independently of editable src/.
  await rm(path.join(directory, 'example.cjs'));
  const manifest = [];
  for (const [moduleId, { text }] of blocks) {
    const file = moduleId.slice('./src/'.length).replace(/\.ts$/, '.cjs');
    manifest.push({ id: moduleId, file });
    const wrapped = wrapFactory(text);
    assert.equal(unwrapFactory(wrapped, moduleId), text);
    await writeFile(path.join(directory, file), wrapped);
  }
  await writeFile(path.join(directory, 'modules.json'), JSON.stringify(manifest));
  const extracted = await readFactories(directory);
  assert.deepEqual(Buffer.from(assembleBundle(baseline, extracted)), baselineBytes);
});

test('current maintained factory IDs match the pinned bundle', async () => {
  const current = await readFactories();
  assert.deepEqual([...current.keys()].sort(), [...blocks.keys()].sort());
  assert.doesNotThrow(() => assembleBundle(baseline, current));
});

test('one intentional edit changes only its target factory block', () => {
  const target = './src/comma-separated-names.ts';
  const original = originals.get(target);
  const changed = original.replace('const names = new Set();', 'const names = new Set(); // intentional test edit');
  assert.notEqual(changed, original);
  const factories = new Map(originals);
  factories.set(target, changed);
  const built = assembleBundle(baseline, factories);
  const { start, end } = blocks.get(target);
  assert.equal(built, baseline.slice(0, start) + changed + baseline.slice(end));
  const rebuiltBlocks = moduleBlocks(built);
  for (const [moduleId, entry] of blocks) {
    assert.equal(rebuiltBlocks.get(moduleId).text, moduleId === target ? changed : entry.text);
  }
});

test('assembly rejects missing, extra, and wrong module IDs', () => {
  const missing = new Map(originals);
  missing.delete('./src/ring-buffer.ts');
  assert.throws(() => assembleBundle(baseline, missing), /IDs must exactly match/);
  const extra = new Map(originals).set('./src/extra.ts', block);
  assert.throws(() => assembleBundle(baseline, extra), /IDs must exactly match/);
  const wrong = new Map(missing).set('./src/wrong.ts', originals.get('./src/ring-buffer.ts'));
  assert.throws(() => assembleBundle(baseline, wrong), /IDs must exactly match/);
});

test('factory validation rejects wrong wrappers, IDs, boundaries, multiple factories, and invalid syntax', () => {
  assert.throws(() => unwrapFactory(block, id), /Invalid factory wrapper/);
  assert.throws(() => unwrapFactory(wrapFactory(block), './src/other.ts'), /ID or boundary changed/);
  assert.throws(() => unwrapFactory(wrapFactory(block.trimEnd()), id), /ID or boundary changed/);
  assert.throws(() => unwrapFactory(wrapFactory(block + block), id), /exactly one factory/);
  assert.throws(() => unwrapFactory(wrapFactory(block.replace('module.exports = 1;', 'const = ;')), id), SyntaxError);
  const invalid = new Map(originals);
  const target = './src/ring-buffer.ts';
  invalid.set(target, originals.get(target).replace('class RingBuffer {', 'class RingBuffer ??? {'));
  assert.throws(() => assembleBundle(baseline, invalid), SyntaxError);
});

test('readFactories rejects a missing listed file', async (t) => {
  const { directory } = await fixture(t);
  await rm(path.join(directory, 'example.cjs'));
  await assert.rejects(readFactories(directory), { code: 'ENOENT' });
});

test('readFactories rejects an unlisted factory', async (t) => {
  const { directory } = await fixture(t);
  await writeFile(path.join(directory, 'extra.cjs'), wrapFactory(block));
  await assert.rejects(readFactories(directory), /Unlisted recovered factory: extra.cjs/);
});

test('readFactories rejects a changed factory ID and malformed syntax', async (t) => {
  const { directory } = await fixture(t);
  await writeFile(path.join(directory, 'example.cjs'), wrapFactory(block.replace(id, './src/other.ts')));
  await assert.rejects(readFactories(directory), /ID or boundary changed/);
  await writeFile(path.join(directory, 'example.cjs'), wrapFactory(block.replace('module.exports = 1;', 'const = ;')));
  await assert.rejects(readFactories(directory), SyntaxError);
});

test('readFactories rejects duplicate IDs, duplicate filenames, empty manifests, and unsafe paths', async (t) => {
  const { directory, manifest } = await fixture(t);
  for (const entries of [
    [],
    [...manifest, { id, file: 'other.cjs' }],
    [...manifest, { id: './src/other.ts', file: 'example.cjs' }],
    [{ id, file: '../escape.cjs' }],
    [{ id: './dependency.ts', file: 'example.cjs' }],
  ]) {
    await writeFile(path.join(directory, 'modules.json'), JSON.stringify(entries));
    await assert.rejects(readFactories(directory), /manifest|Invalid recovered-module entry|Unsafe relative path/);
  }
});

test('module boundary discovery rejects unsupported or duplicate boundaries', () => {
  const boundary = '/***/ "node:path"\n(module) { module.exports = {}; }\n';
  assert.throws(() => moduleBlocks('no factories'), /No recoverable/);
  assert.throws(() => moduleBlocks(block + block + boundary), /Duplicate module ID/);
  assert.throws(() => moduleBlocks(block.replace('/***/ },', '/***/ }') + boundary), /Unsupported module boundary/);
});
