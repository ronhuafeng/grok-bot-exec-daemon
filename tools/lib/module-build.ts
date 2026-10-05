/** Ordinary-module packaging. Every executable application byte comes from the
 * strict NodeNext compiler; the only transformed dependency is vendor.cjs. */
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { buildRoot, ensureDirectory, gitBlobHash, listFiles, root, runtimeRoot, validateRelativePath, requireRecord, writeGeneratedFile } from './project.js';
import type { GitFile } from './project.js';
import type { SnapshotInventory } from './snapshot.js';
import type { CapsuleResult } from './vendor-capsule.js';
import { checkProjectTypes, formatDiagnostics } from './typecheck.js';

export type RuntimeFileKind = 'vendor-asset' | 'application' | 'bootstrap' | 'capsule' | 'metadata';
export interface RuntimeFileRecord extends GitFile { size: number; kind: RuntimeFileKind; }
export interface RuntimePlannedFile extends RuntimeFileRecord {
  content: { source: string } | { bytes: Uint8Array };
}
export interface RuntimeBuildPlan { files: RuntimePlannedFile[]; }
const compiledSourceRoot = path.join(root, 'dist/project/src');
const inventoryFilename = 'runtime-build.json';
// Original deployment prerequisites, deliberately outside the immutable artifact.
// Never copy, delete, traverse, or hash these user-provisioned paths.
export function isProvisionedTool(filename: string): boolean {
  return ['node', 'gh', 'rg', 'ssh-keygen', 'cursorsandbox', 'cursor-agent-store-fuse', 'tools/origin'].includes(filename) || filename === 'tmux-root' || filename.startsWith('tmux-root/');
}
async function listManagedBuildFiles(directory: string, prefix = ''): Promise<string[]> {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Not a real build directory: ${directory}`);
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (isProvisionedTool(relative)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Unexpected built symlink: ${relative}`);
    if (entry.isDirectory()) result.push(...await listManagedBuildFiles(path.join(directory, entry.name), relative + '/'));
    else if (entry.isFile()) result.push(relative);
    else throw new Error(`Unsupported built file: ${relative}`);
  }
  return result.sort();
}

/** Check actual tsc outputs against a fresh emit from the same strictly checked
 * program. Stale or extra source output never becomes an implicit runtime input. */
export async function readCompiledApplication(requiredSources: readonly string[] = []): Promise<Map<string, Uint8Array>> {
  const checked = checkProjectTypes(requiredSources);
  for (const file of await listFiles(path.join(root, 'src'))) {
    if (/\.(?:ts|mts|cts)$/.test(file) && !checked.getSourceFile(path.join(root, 'src', file))) throw new Error(`Maintained source excluded from strict compilation: ${file}`);
  }
  const options = checked.getCompilerOptions();
  if (options.module !== ts.ModuleKind.NodeNext || options.moduleResolution !== ts.ModuleResolutionKind.NodeNext || options.sourceMap !== true) {
    throw new Error('Runtime modules require the strict NodeNext compiler and source maps');
  }
  const program = ts.createProgram({ rootNames: checked.getRootFileNames(), options: { ...options, noEmit: false }, oldProgram: checked });
  const expected = new Map<string, Uint8Array>();
  const emit = program.emit(undefined, (filename, text, bom) => {
    const relative = path.relative(compiledSourceRoot, filename);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return;
    expected.set(validateRelativePath(relative.split(path.sep).join('/')), Buffer.from((bom ? '\ufeff' : '') + text));
  });
  if (emit.emitSkipped || emit.diagnostics.length) throw new Error(`Cannot emit the checked application:\n${formatDiagnostics(emit.diagnostics)}`);
  if (!expected.has('runtime-entry.cjs') || !expected.has('runtime/index.js') || !expected.has('interop/vendor/loader.js')) {
    throw new Error('The compiler omitted the owned bootstrap, application entry, or vendor adapter');
  }
  const allActual = await listFiles(compiledSourceRoot);
  if (allActual.includes('package.json') && (await readFile(path.join(compiledSourceRoot, 'package.json'), 'utf8')).trim() !== '{"type":"module"}') throw new Error('Unexpected generated application package boundary');
  const actual = allActual.filter(file => file !== 'package.json');
  if (actual.length !== expected.size || actual.some(file => !expected.has(file))) throw new Error('Stale or unlisted compiled application file; run a clean compile');
  for (const [file, bytes] of expected) {
    const filename = path.join(compiledSourceRoot, file);
    const stat = await lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink() || !Buffer.from(bytes).equals(await readFile(filename))) {
      throw new Error(`Compiled application differs from the checked source: ${file}`);
    }
  }
  return expected;
}

function relocateBootstrapMap(bytes: Uint8Array): Uint8Array {
  const parsed: unknown = JSON.parse(Buffer.from(bytes).toString('utf8')) as unknown;
  const map = requireRecord(parsed, 'compiled bootstrap source map');
  if (map.version !== 3 || map.file !== 'runtime-entry.cjs' || map.sourceRoot !== '' ||
      !Array.isArray(map.sources) || map.sources.length !== 1 || map.sources[0] !== '../../../src/runtime-entry.cts') {
    throw new Error('Unexpected compiled bootstrap source-map layout');
  }
  return Buffer.from(JSON.stringify({ ...map, file: 'index.js', sources: ['../../src/runtime-entry.cts'] }) + '\n');
}

/** Pure output planning is separately testable with complete, harmless fixtures.
 * Production callers must validate the full pinned payload before materializing. */
export function planRuntimeBuild(snapshot: SnapshotInventory & { tree: string }, compiled: ReadonlyMap<string, Uint8Array>,
  capsule: CapsuleResult, assetsDirectory = runtimeRoot): RuntimeBuildPlan {
  const files = new Map<string, RuntimePlannedFile>();
  function add(record: RuntimePlannedFile): void {
    validateRelativePath(record.path);
    if (files.has(record.path)) throw new Error(`Runtime output collision: ${record.path}`);
    files.set(record.path, record);
  }
  function generated(filename: string, bytes: Uint8Array, kind: RuntimeFileKind, mode: GitFile['mode'] = '100644'): void {
    add({ path: filename, size: bytes.byteLength, sha: gitBlobHash(bytes), mode, kind, content: { bytes } });
  }
  const originalEntry = snapshot.files.find(file => file.path === 'index.js');
  const bootstrap = compiled.get('runtime-entry.cjs');
  const bootstrapMap = compiled.get('runtime-entry.cjs.map');
  if (!originalEntry || !bootstrap || !bootstrapMap || !compiled.has('runtime/index.js')) throw new Error('Incomplete normal-module bootstrap inputs');
  for (const file of snapshot.files) {
    if (file.path === 'index.js') continue;
    if (isProvisionedTool(file.path)) throw new Error(`Snapshot collides with a separately provisioned tool: ${file.path}`);
    add({ ...file, kind: 'vendor-asset', content: { source: path.join(assetsDirectory, validateRelativePath(file.path)) } });
  }
  for (const [file, bytes] of compiled) {
    validateRelativePath(file);
    if (file === 'runtime-entry.cjs' || file === 'runtime-entry.cjs.map') continue;
    if (!/\.(?:js|mjs|cjs)(?:\.map)?$/.test(file)) throw new Error(`Unsupported compiler output: ${file}`);
    generated(`app/${file}`, bytes, 'application');
  }
  // The original CJS package boundary and numbered chunk names remain intact.
  // ESM is confined to the ordinary application module directory.
  generated('app/package.json', Buffer.from('{"private":true,"type":"module"}\n'), 'metadata');
  generated('index.js', bootstrap, 'bootstrap', originalEntry.mode);
  generated('runtime-entry.cjs.map', relocateBootstrapMap(bootstrapMap), 'metadata');
  generated('vendor.cjs', Buffer.from(capsule.code), 'capsule');
  const records = [...files.values()].sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path)))
    .map(({ content: _content, ...record }) => record);
  generated(inventoryFilename, Buffer.from(JSON.stringify({ schemaVersion: 1, snapshotTree: snapshot.tree,
    capsule: { proof: capsule.proof, relocatedInitializers: capsule.relocations }, files: records }, null, 2) + '\n'), 'metadata');
  return { files: [...files.values()].sort((left, right) => Buffer.compare(Buffer.from(left.path), Buffer.from(right.path))) };
}

export async function materializeRuntimeBuild(plan: RuntimeBuildPlan, directory = buildRoot): Promise<void> {
  await ensureDirectory(directory);
  for (const file of plan.files) {
    const destination = path.join(directory, validateRelativePath(file.path));
    await ensureDirectory(path.dirname(destination));
    const bytes = 'source' in file.content ? await readFile(file.content.source) : file.content.bytes;
    if (bytes.length !== file.size || gitBlobHash(bytes) !== file.sha) throw new Error(`Build input changed while copying: ${file.path}`);
    await writeGeneratedFile(destination, bytes, Number.parseInt(file.mode.slice(-3), 8));
  }
}

/** Compare against a freshly derived plan, not a self-attested output manifest.
 * Includes added app/capsule files, content, modes, and unexpected-file rejection. */
export async function verifyRuntimeBuild(plan: RuntimeBuildPlan, directory = buildRoot): Promise<void> {
  const actual = await listManagedBuildFiles(directory);
  const expected = new Set(plan.files.map(file => file.path));
  const unexpected = actual.filter(file => !expected.has(file));
  if (unexpected.length) throw new Error(`Unexpected built runtime files: ${unexpected.join(', ')}`);
  for (const file of plan.files) {
    const filename = path.join(directory, validateRelativePath(file.path));
    const stat = await lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular built runtime file: ${file.path}`);
    const bytes = await readFile(filename);
    if (bytes.length !== file.size || gitBlobHash(bytes) !== file.sha) throw new Error(`Built runtime content changed: ${file.path}`);
    if (process.platform !== 'win32' && (stat.mode & 0o777) !== Number.parseInt(file.mode.slice(-3), 8)) throw new Error(`Built runtime mode changed: ${file.path}`);
  }
}
