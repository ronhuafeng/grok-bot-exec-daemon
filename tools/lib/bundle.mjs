import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { recoveredRoot, runtimeRoot, readJson, validateRelativePath, gitBlobHash } from './project.mjs';
import { readSnapshot } from './snapshot.mjs';

const prefix = 'module.exports = {\n';
const suffix = '};\n';

export async function readBaseline() {
  const snapshot = await readSnapshot();
  const expected = snapshot.files.find((file) => file.path === 'index.js');
  const bytes = await readFile(path.join(runtimeRoot, 'index.js'));
  if (!expected || gitBlobHash(bytes) !== expected.sha) throw new Error('Baseline bundle differs from the pinned snapshot');
  return bytes.toString('utf8');
}

export function moduleBlocks(bundle) {
  const markers = [...bundle.matchAll(/^\/\*\*\*\/ "([^"\n]+)"\n/gm)];
  const blocks = new Map();
  for (let index = 0; index < markers.length - 1; index++) {
    const marker = markers[index];
    if (!marker[1].startsWith('./src/')) continue;
    if (blocks.has(marker[1])) throw new Error(`Duplicate module ID: ${marker[1]}`);
    const start = marker.index;
    const end = markers[index + 1].index;
    const text = bundle.slice(start, end);
    if (!text.endsWith('/***/ },\n\n')) throw new Error(`Unsupported module boundary: ${marker[1]}`);
    blocks.set(marker[1], { start, end, text });
  }
  if (blocks.size === 0) throw new Error('No recoverable exec-daemon modules found');
  return blocks;
}

export const wrapFactory = (block) => prefix + block + suffix;

export function unwrapFactory(source, id) {
  if (!source.startsWith(prefix) || !source.endsWith(suffix)) throw new Error(`Invalid factory wrapper: ${id}`);
  const text = source.slice(prefix.length, -suffix.length);
  if (!text.startsWith(`/***/ ${JSON.stringify(id)}\n`) || !text.endsWith('/***/ },\n\n')) {
    throw new Error(`Factory ID or boundary changed: ${id}`);
  }
  const markers = [...text.matchAll(/^\/\*\*\*\/ "([^"\n]+)"\n/gm)];
  if (markers.length !== 1) throw new Error(`Expected exactly one factory: ${id}`);
  new vm.Script(source, { filename: id }); // Parse only; never execute build inputs.
  return text;
}

export async function readFactories(directory = recoveredRoot) {
  const manifest = await readJson(path.join(directory, 'modules.json'));
  if (!Array.isArray(manifest) || !manifest.length) throw new Error('Empty recovered-module manifest');
  const factories = new Map();
  const filenames = new Set();
  for (const { id, file } of manifest) {
    validateRelativePath(file);
    if (file.includes('/') || !file.endsWith('.cjs') || typeof id !== 'string' || !id.startsWith('./src/') ||
        factories.has(id) || filenames.has(file)) throw new Error(`Invalid recovered-module entry: ${file}`);
    const source = await readFile(path.join(directory, file), 'utf8');
    factories.set(id, unwrapFactory(source, id));
    filenames.add(file);
  }
  for (const file of await readdir(directory)) {
    if (file.endsWith('.cjs') && !filenames.has(file)) throw new Error(`Unlisted recovered factory: ${file}`);
  }
  return factories;
}

export function assembleBundle(baseline, factories) {
  const blocks = moduleBlocks(baseline);
  if (blocks.size !== factories.size || [...blocks.keys()].some((id) => !factories.has(id))) {
    throw new Error('Recovered factory IDs must exactly match the pinned bundle');
  }
  let cursor = 0;
  const parts = [];
  for (const [id, block] of blocks) {
    unwrapFactory(wrapFactory(factories.get(id)), id);
    parts.push(baseline.slice(cursor, block.start), factories.get(id));
    cursor = block.end;
  }
  parts.push(baseline.slice(cursor));
  const output = parts.join('');
  new vm.Script(output, { filename: 'index.js' });
  return output;
}
