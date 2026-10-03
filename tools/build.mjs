import { writeFile, rename, chmod, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { runtimeRoot, buildRoot, ensureDirectory } from './lib/project.mjs';
import { verifySnapshot } from './lib/snapshot.mjs';
import { readFactories, assembleBundle, readBaseline } from './lib/bundle.mjs';

const snapshot = await verifySnapshot();
const bundle = assembleBundle(await readBaseline(), await readFactories());
await ensureDirectory(buildRoot);
for (const file of snapshot.files) {
  const destination = path.join(buildRoot, file.path);
  await ensureDirectory(path.dirname(destination));
  const temporary = `${destination}.build-${process.pid}`;
  if (file.path === 'index.js') await writeFile(temporary, bundle, { flag: 'wx' });
  else await copyFile(path.join(runtimeRoot, file.path), temporary, constants.COPYFILE_EXCL);
  await chmod(temporary, Number.parseInt(file.mode.slice(-3), 8));
  await rename(temporary, destination);
}
console.log(`Built ${snapshot.files.length} runtime files in dist/runtime (21 editable factories).`);
console.log('External tools are not downloaded or replaced. Run npm run doctor before launching.');
