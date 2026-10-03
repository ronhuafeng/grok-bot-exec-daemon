import assert from 'node:assert/strict';
import { gitBlobHash } from './lib/project.mjs';
import { assembleBundle, readFactories, readBaseline } from './lib/bundle.mjs';

const baseline = await readBaseline();
const assembled = assembleBundle(baseline, await readFactories());
assert.equal(gitBlobHash(Buffer.from(assembled)), gitBlobHash(Buffer.from(baseline)),
  'Recovered modules differ from the imported baseline. Expected after intentional runtime edits; review the diff and behavioral tests.');
console.log(`Byte-identical reconstruction: ${gitBlobHash(Buffer.from(assembled))}`);
