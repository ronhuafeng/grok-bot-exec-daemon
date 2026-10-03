import { readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { root, runtimeRoot, readJson, listFiles, gitBlobHash, gitTreeHash, validateRelativePath } from './project.mjs';

export async function readSnapshot() {
  const snapshot = await readJson(path.join(root, 'vendor/snapshot.json'));
  if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.files) || !snapshot.files.length) {
    throw new Error('Unsupported or empty snapshot manifest');
  }
  const seen = new Set();
  for (const file of snapshot.files) {
    validateRelativePath(file.path);
    if (seen.has(file.path) || !/^[a-f0-9]{40}$/.test(file.sha) ||
        !['100644', '100755'].includes(file.mode) || !Number.isSafeInteger(file.size) || file.size < 0) {
      throw new Error(`Invalid snapshot entry: ${file.path}`);
    }
    seen.add(file.path);
  }
  if (gitTreeHash(snapshot.files) !== snapshot.tree) throw new Error('Snapshot manifest does not reproduce its recorded Git tree');
  return snapshot;
}

export async function verifySnapshot(directory = runtimeRoot, snapshot) {
  snapshot ??= await readSnapshot();
  const expected = new Set(snapshot.files.map((file) => file.path));
  const actual = await listFiles(directory);
  const errors = actual.filter((file) => !expected.has(file)).map((file) => `unexpected: ${file}`);
  for (const file of snapshot.files) {
    const filename = path.join(directory, file.path);
    try {
      const stat = await lstat(filename);
      if (!stat.isFile() || stat.isSymbolicLink()) { errors.push(`not a regular file: ${file.path}`); continue; }
      const bytes = await readFile(filename);
      if (bytes.length !== file.size || gitBlobHash(bytes) !== file.sha) errors.push(`content changed: ${file.path}`);
      if (process.platform !== 'win32' && (stat.mode & 0o777) !== Number.parseInt(file.mode.slice(-3), 8)) {
        errors.push(`mode changed: ${file.path}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') errors.push(`missing: ${file.path}`);
      else throw error;
    }
  }
  if (errors.length) throw new Error(`Snapshot verification failed (${errors.length}):\n${errors.join('\n')}`);
  return snapshot;
}
