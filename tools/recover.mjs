import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { moduleBlocks, wrapFactory, readBaseline } from './lib/bundle.mjs';

if (process.argv.length !== 4 || process.argv[2] !== '--output') {
  console.error('Usage: npm run recover -- --output <new-directory>\nThe output directory must not already exist; maintained sources are never overwritten.');
  process.exit(1);
}
const directory = path.resolve(process.argv[3]);
const bundle = await readBaseline();
const blocks = moduleBlocks(bundle);
await mkdir(directory); // Deliberately fails if the output already exists.
const manifest = [];
for (const [id, { text }] of blocks) {
  const file = id.slice('./src/'.length).replace(/\.ts$/, '.cjs');
  if (file.includes('/') || !file.endsWith('.cjs')) throw new Error(`Unsupported source ID: ${id}`);
  await writeFile(path.join(directory, file), wrapFactory(text), { flag: 'wx' });
  manifest.push({ id, file });
}
await writeFile(path.join(directory, 'modules.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
console.log(`Recovered ${manifest.length} compiled factories into ${directory}. These are not original TypeScript sources.`);
