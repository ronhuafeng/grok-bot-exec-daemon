import path from 'node:path';
import { buildVendorCapsule } from './lib/vendor-capsule.js';
import { root, ensureDirectory, writeGeneratedFile } from './lib/project.js';

const output = path.join(root, 'dist/project');
await buildVendorCapsule(output);
// Numbered vendor chunks retain CommonJS semantics. Compiled project modules
// have their own explicit ESM scopes, matching the production app/ boundary.
for (const directory of ['src', 'tools', 'tests']) {
  const target = path.join(output, directory);
  await ensureDirectory(target);
  await writeGeneratedFile(path.join(target, 'package.json'), '{"type":"module"}\n');
}
console.log('Prepared the pinned vendor capsule and ordinary-module test scopes.');
