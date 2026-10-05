import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile, lstat, mkdir, open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Tooling is executed from dist/project/tools/lib after the strict compilation.
export const root = fileURLToPath(new URL('../../../../', import.meta.url));
export const runtimeRoot = path.join(root, 'vendor/exec-daemon-runtime');
export const sourceRoot = path.join(root, 'src/runtime');
export const buildRoot = path.join(root, 'dist/runtime');
export const readJson = async (file: string): Promise<unknown> => JSON.parse(await readFile(file, 'utf8')) as unknown;

export interface GitFile {
  path: string;
  mode: '100644' | '100755';
  sha: string;
}

export function gitBlobHash(bytes: Uint8Array): string {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

export function gitTreeHash(files: readonly GitFile[]): string {
  type Tree = Map<string, Tree | GitFile>;
  const tree: Tree = new Map<string, Tree | GitFile>();
  for (const file of files) {
    const parts = validateRelativePath(file.path).split('/');
    let directory = tree;
    for (const part of parts.slice(0, -1)) {
      if (!directory.has(part)) directory.set(part, new Map<string, Tree | GitFile>());
      const next = directory.get(part);
      if (!(next instanceof Map)) throw new Error(`Conflicting tree path: ${file.path}`);
      directory = next;
    }
    const name = parts.at(-1);
    if (name === undefined || directory.has(name)) throw new Error(`Conflicting tree path: ${file.path}`);
    directory.set(name, file);
  }
  function hash(directory: Tree): string {
    const entries = [...directory].map(([name, value]) => value instanceof Map
      ? { name, mode: '40000', sha: hash(value), sort: `${name}/` }
      : { name, mode: value.mode, sha: value.sha, sort: name });
    entries.sort((a, b) => Buffer.compare(Buffer.from(a.sort), Buffer.from(b.sort)));
    const bytes = Buffer.concat(entries.flatMap(({ name, mode, sha }) => [Buffer.from(`${mode} ${name}\0`), Buffer.from(sha, 'hex')]));
    return createHash('sha1').update(`tree ${bytes.length}\0`).update(bytes).digest('hex');
  }
  return hash(tree);
}

export function validateRelativePath(value: unknown): string {
  if (typeof value !== 'string' || !value || value.includes('\\') ||
      value.split('/').some((part) => !part || part === '.' || part === '..') ||
      value.includes('\0') || /^[A-Za-z]:/.test(value)) {
    throw new Error(`Unsafe relative path: ${JSON.stringify(value)}`);
  }
  return value;
}

export function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

export function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`Expected object: ${label}`);
  return value as Record<string, unknown>;
}

export function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new Error(`Expected string: ${label}`);
  return value;
}

export async function listFiles(directory: string, prefix = ''): Promise<string[]> {
  const directoryStat = await lstat(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) throw new Error(`Not a real directory: ${directory}`);
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${name}`);
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), `${name}/`));
    else if (entry.isFile()) files.push(name);
    else throw new Error(`Unsupported file type: ${name}`);
  }
  return files.sort();
}

export async function ensureDirectory(directory: string): Promise<void> {
  const parent = path.dirname(directory);
  if (parent !== directory) await ensureDirectory(parent);
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Not a real directory: ${directory}`);
  } catch (error) {
    if (!hasCode(error, 'ENOENT')) throw error;
    await mkdir(directory);
  }
}

/** Generated output may replace a regular file, never a symlink or directory. */
export async function assertGeneratedFilePath(filename: string): Promise<void> {
  await ensureDirectory(path.dirname(filename));
  try {
    const stat = await lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular generated output: ${filename}`);
  } catch (error) {
    if (!hasCode(error, 'ENOENT')) throw error;
  }
}

/** One atomic writer for compiler-adjacent metadata, capsules and built assets.
 * Never open/chmod the destination leaf: write through our exclusive handle,
 * then rename the completed sibling. Existing links cannot redirect the write. */
export async function writeGeneratedFile(filename: string, bytes: string | Uint8Array, mode = 0o644): Promise<void> {
  await assertGeneratedFilePath(filename);
  const temporary = `${filename}.generated-${randomUUID()}`;
  const handle = await open(temporary, 'wx', mode);
  try {
    try {
      await handle.writeFile(bytes);
      await handle.chmod(mode);
    } finally {
      await handle.close();
    }
    await assertGeneratedFilePath(filename);
    await rename(temporary, filename);
  } finally {
    await rm(temporary, { force: true });
  }
}
