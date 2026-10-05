import { readFile, lstat } from 'node:fs/promises';
import path from 'node:path';
import { root, runtimeRoot, readJson, listFiles, gitBlobHash, gitTreeHash, validateRelativePath,
  requireRecord, requireString, hasCode } from './project.js';
import type { GitFile } from './project.js';

export interface SnapshotFile extends GitFile { size: number }
export interface SnapshotInventory { files: readonly SnapshotFile[] }
export interface SnapshotManifest extends SnapshotInventory {
  schemaVersion: 1;
  repository: string;
  commit: string;
  tree: string;
  packageName: string;
  upstreamGitCommit: string;
  buildTimestamp: string;
}

export function parseSnapshot(value: unknown): SnapshotManifest {
  const record = requireRecord(value, 'snapshot');
  if (record.schemaVersion !== 1 || !Array.isArray(record.files) || record.files.length === 0) {
    throw new Error('Unsupported or empty snapshot manifest');
  }
  const inputs: unknown[] = record.files;
  const files: SnapshotFile[] = [];
  const seen = new Set<string>();
  for (const input of inputs) {
    const file = requireRecord(input, 'snapshot file');
    const filename = validateRelativePath(file.path);
    const sha = requireString(file.sha, `${filename}.sha`);
    const { mode, size } = file;
    if (seen.has(filename) || !/^[a-f0-9]{40}$/.test(sha) ||
        (mode !== '100644' && mode !== '100755') || typeof size !== 'number' ||
        !Number.isSafeInteger(size) || size < 0) throw new Error(`Invalid snapshot entry: ${filename}`);
    seen.add(filename);
    files.push({ path: filename, sha, mode, size });
  }
  const snapshot: SnapshotManifest = {
    schemaVersion: 1,
    repository: requireString(record.repository, 'repository'),
    commit: requireString(record.commit, 'commit'),
    tree: requireString(record.tree, 'tree'),
    packageName: requireString(record.packageName, 'packageName'),
    upstreamGitCommit: requireString(record.upstreamGitCommit, 'upstreamGitCommit'),
    buildTimestamp: requireString(record.buildTimestamp, 'buildTimestamp'),
    files,
  };
  if (gitTreeHash(snapshot.files) !== snapshot.tree) throw new Error('Snapshot manifest does not reproduce its recorded Git tree');
  return snapshot;
}

export async function readSnapshot(): Promise<SnapshotManifest> {
  return parseSnapshot(await readJson(path.join(root, 'vendor/snapshot.json')));
}

export async function verifySnapshot(directory = runtimeRoot, inventory?: SnapshotInventory): Promise<SnapshotInventory> {
  const snapshot = inventory ?? await readSnapshot();
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
      if (hasCode(error, 'ENOENT')) errors.push(`missing: ${file.path}`);
      else throw error;
    }
  }
  if (errors.length) throw new Error(`Snapshot verification failed (${errors.length}):\n${errors.join('\n')}`);
  return snapshot;
}
