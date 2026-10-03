import { createHash } from 'node:crypto';
import { readdir, readFile, lstat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const runtimeRoot = path.join(root, 'vendor/exec-daemon-runtime');
export const recoveredRoot = path.join(root, 'src/recovered');
export const buildRoot = path.join(root, 'dist/runtime');
export const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

export function gitBlobHash(bytes) {
  return createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}

export function gitTreeHash(files) {
  const tree = new Map();
  for (const file of files) {
    const parts = validateRelativePath(file.path).split('/');
    let directory = tree;
    for (const part of parts.slice(0, -1)) {
      if (!directory.has(part)) directory.set(part, new Map());
      directory = directory.get(part);
      if (!(directory instanceof Map)) throw new Error(`Conflicting tree path: ${file.path}`);
    }
    const name = parts.at(-1);
    if (directory.has(name)) throw new Error(`Conflicting tree path: ${file.path}`);
    directory.set(name, file);
  }
  function hash(directory) {
    const entries = [...directory].map(([name, value]) => value instanceof Map
      ? { name, mode: '40000', sha: hash(value), sort: `${name}/` }
      : { name, mode: value.mode, sha: value.sha, sort: name });
    entries.sort((a, b) => Buffer.compare(Buffer.from(a.sort), Buffer.from(b.sort)));
    const bytes = Buffer.concat(entries.flatMap(({ name, mode, sha }) => [Buffer.from(`${mode} ${name}\0`), Buffer.from(sha, 'hex')]));
    return createHash('sha1').update(`tree ${bytes.length}\0`).update(bytes).digest('hex');
  }
  return hash(tree);
}

export function validateRelativePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') ||
      value.split('/').some((part) => !part || part === '.' || part === '..') ||
      value.includes('\0') || /^[A-Za-z]:/.test(value)) {
    throw new Error(`Unsafe relative path: ${JSON.stringify(value)}`);
  }
  return value;
}

export async function listFiles(directory, prefix = '') {
  const directoryStat = await lstat(directory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) throw new Error(`Not a real directory: ${directory}`);
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${name}`);
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), `${name}/`));
    else if (entry.isFile()) files.push(name);
    else throw new Error(`Unsupported file type: ${name}`);
  }
  return files.sort();
}

// Build output can contain separately provisioned tools, but never follow a
// directory symlink while writing generated runtime files.
export async function ensureDirectory(directory) {
  const parent = path.dirname(directory);
  if (parent !== directory) await ensureDirectory(parent);
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Not a real directory: ${directory}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(directory);
  }
}
