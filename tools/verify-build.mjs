import assert from 'node:assert/strict';
import { readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { buildRoot, gitBlobHash } from './lib/project.mjs';
import { readSnapshot } from './lib/snapshot.mjs';
import { readFactories, assembleBundle, readBaseline } from './lib/bundle.mjs';

const snapshot = await readSnapshot();
const expectedBundle = assembleBundle(await readBaseline(), await readFactories());
for (const file of snapshot.files) {
  const filename = path.join(buildRoot, file.path);
  const stat = await lstat(filename);
  assert.ok(stat.isFile() && !stat.isSymbolicLink(), `Not a regular built file: ${file.path}`);
  const bytes = await readFile(filename);
  if (file.path === 'index.js') assert.equal(bytes.toString('utf8'), expectedBundle, 'Built entrypoint differs from recovered sources');
  else assert.equal(gitBlobHash(bytes), file.sha, `Built asset changed: ${file.path}`);
  if (process.platform !== 'win32') assert.equal(stat.mode & 0o777, Number.parseInt(file.mode.slice(-3), 8), `Built mode changed: ${file.path}`);
}
console.log(`Verified ${snapshot.files.length} built runtime files. Separately provisioned tools are outside this check.`);
