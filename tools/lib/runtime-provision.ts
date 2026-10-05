import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { access, cp, lstat, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { ensureDirectory, hasCode, requireRecord, requireString, validateRelativePath, writeGeneratedFile } from './project.js';

export type RuntimeProfile = 'core' | 'supported';
export type ExecutableCheck = 'none' | 'node-22.14.0' | 'ripgrep-cursor5' | 'cursorsandbox-help' | 'origin-version' | 'agent-store-help';
export type FileMode = '100644' | '100755';

export interface FileSourceEnvironment { kind: 'environment'; path: string }
export interface FileSourceRepo { kind: 'repo'; path: string }
export interface FileSourceUrl {
  kind: 'url';
  url: string;
  archiveSha256: string;
  archiveMember: string;
}
export type ToolSource = FileSourceEnvironment | FileSourceRepo | FileSourceUrl;
export interface TreeSourceEnvironment { kind: 'environment'; path: string }
export interface TreeSourceArchive { kind: 'repo-archive'; path: string; sha256: string; size: number }
export type TreeSource = TreeSourceEnvironment | TreeSourceArchive;

export interface FileCheck { path: string; sha256: string; size: number; mode: FileMode }
export interface LockedFile {
  kind: 'file';
  id: string;
  dest: string;
  version: string;
  sha256: string;
  size: number;
  mode: FileMode;
  profiles: readonly RuntimeProfile[];
  optional: boolean;
  executableCheck: ExecutableCheck;
  sources: readonly ToolSource[];
}
export interface LockedTree {
  kind: 'tree';
  id: string;
  dest: string;
  version: string;
  profiles: readonly RuntimeProfile[];
  optional: boolean;
  sources: readonly TreeSource[];
  checks: readonly FileCheck[];
}
export type LockedTool = LockedFile | LockedTree;
export interface RuntimeToolLock {
  schemaVersion: 1;
  sourceBuildTimestamp: string;
  defaultEnvironment: string;
  tools: readonly LockedTool[];
}
export interface ProvisionAction {
  id: string;
  status: 'copied' | 'downloaded' | 'skipped';
  detail: string;
}
export interface ProvisionOptions {
  lock: RuntimeToolLock;
  repoRoot: string;
  destRoot: string;
  vendorRoot: string;
  environmentRoot?: string;
  profile: RuntimeProfile;
  verifyExecutables: boolean;
  fetchArchive?: (url: string) => Promise<Uint8Array>;
}

const profiles = new Set<RuntimeProfile>(['core', 'supported']);
const checks = new Set<ExecutableCheck>(['none', 'node-22.14.0', 'ripgrep-cursor5', 'cursorsandbox-help', 'origin-version', 'agent-store-help']);
const modes = new Set<FileMode>(['100644', '100755']);

export function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`Expected boolean: ${label}`);
  return value;
}

function requireProfiles(value: unknown, label: string): RuntimeProfile[] {
  const items = unknownItems(value, label);
  if (items.some(item => typeof item !== 'string' || !profiles.has(item as RuntimeProfile))) {
    throw new Error(`Expected runtime profiles: ${label}`);
  }
  return items as RuntimeProfile[];
}

function requireMode(value: unknown, label: string): FileMode {
  if (typeof value !== 'string' || !modes.has(value as FileMode)) throw new Error(`Expected file mode: ${label}`);
  return value as FileMode;
}

function requireSha256(value: unknown, label: string): string {
  const hash = requireString(value, label);
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Expected sha256: ${label}`);
  return hash;
}

function requireSize(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error(`Expected size: ${label}`);
  return value;
}

function unknownItems(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`Expected entries: ${label}`);
  return value.map((item: unknown): unknown => item);
}

function parseTreeSource(value: unknown, label: string): TreeSource {
  const source = requireRecord(value, label);
  const kind = requireString(source.kind, `${label}.kind`);
  if (kind === 'environment') return { kind, path: validateRelativePath(source.path) };
  if (kind === 'repo-archive') {
    return {
      kind,
      path: validateRelativePath(source.path),
      sha256: requireSha256(source.sha256, `${label}.sha256`),
      size: requireSize(source.size, `${label}.size`),
    };
  }
  throw new Error(`Unsupported tree source: ${label}`);
}

function parseSource(value: unknown, label: string, allowUrl: boolean): ToolSource {
  const source = requireRecord(value, label);
  const kind = requireString(source.kind, `${label}.kind`);
  if (kind === 'environment' || kind === 'repo') return { kind, path: validateRelativePath(source.path) };
  if (kind === 'url' && allowUrl) {
    const url = requireString(source.url, `${label}.url`);
    if (!url.startsWith('https://')) throw new Error(`Expected https URL: ${label}`);
    return {
      kind,
      url,
      archiveSha256: requireSha256(source.archiveSha256, `${label}.archiveSha256`),
      archiveMember: validateRelativePath(source.archiveMember),
    };
  }
  throw new Error(`Unsupported tool source: ${label}`);
}

function parseFileCheck(value: unknown, label: string): FileCheck {
  const check = requireRecord(value, label);
  return {
    path: validateRelativePath(check.path),
    sha256: requireSha256(check.sha256, `${label}.sha256`),
    size: requireSize(check.size, `${label}.size`),
    mode: requireMode(check.mode, `${label}.mode`),
  };
}

function parseTool(value: unknown, index: number): LockedTool {
  const tool = requireRecord(value, `tools[${index}]`);
  const kind = requireString(tool.kind, `tools[${index}].kind`);
  const id = requireString(tool.id, `tools[${index}].id`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Unsafe tool id: ${id}`);
  const base = {
    id,
    dest: validateRelativePath(tool.dest),
    version: requireString(tool.version, `${id}.version`),
    profiles: requireProfiles(tool.profiles, `${id}.profiles`),
    optional: requireBoolean(tool.optional, `${id}.optional`),
  };
  const sources = unknownItems(tool.sources, `${id}.sources`);
  if (kind === 'tree') {
    const parsedSources = sources.map((source, sourceIndex) => parseTreeSource(source, `${id}.sources[${sourceIndex}]`));
    return { kind: 'tree', ...base, sources: parsedSources, checks: unknownItems(tool.checks, `${id}.checks`).map((check, checkIndex) => parseFileCheck(check, `${id}.checks[${checkIndex}]`)) };
  }
  if (kind !== 'file') throw new Error(`Unsupported tool kind: ${id}`);
  const executableCheck = requireString(tool.executableCheck, `${id}.executableCheck`);
  if (!checks.has(executableCheck as ExecutableCheck)) throw new Error(`Unsupported executable check: ${id}`);
  return {
    kind: 'file',
    ...base,
    sha256: requireSha256(tool.sha256, `${id}.sha256`),
    size: requireSize(tool.size, `${id}.size`),
    mode: requireMode(tool.mode, `${id}.mode`),
    executableCheck: executableCheck as ExecutableCheck,
    sources: sources.map((source, sourceIndex) => parseSource(source, `${id}.sources[${sourceIndex}]`, true)),
  };
}

export function parseRuntimeToolLock(value: unknown): RuntimeToolLock {
  const record = requireRecord(value, 'runtime tool lock');
  if (record.schemaVersion !== 1) throw new Error('Unsupported runtime tool lock');
  const tools = unknownItems(record.tools, 'tools').map((tool, index) => parseTool(tool, index));
  if (new Set(tools.map(tool => tool.id)).size !== tools.length) throw new Error('Duplicate runtime tool id');
  if (new Set(tools.map(tool => tool.dest)).size !== tools.length) throw new Error('Duplicate runtime tool destination');
  return {
    schemaVersion: 1,
    sourceBuildTimestamp: requireString(record.sourceBuildTimestamp, 'sourceBuildTimestamp'),
    defaultEnvironment: requireString(record.defaultEnvironment, 'defaultEnvironment'),
    tools,
  };
}

export function assertProvisionDestination(destRoot: string, vendorRoot: string): void {
  const destination = path.resolve(destRoot);
  const vendor = path.resolve(vendorRoot);
  if (destination === vendor || destination.startsWith(vendor + path.sep)) {
    throw new Error('Refusing to provision tools into the immutable vendor tree');
  }
}

function resolveInside(root: string, relative: string): string {
  const destination = path.resolve(root, validateRelativePath(relative));
  const base = path.resolve(root);
  if (destination !== base && !destination.startsWith(base + path.sep)) throw new Error(`Path escapes its root: ${relative}`);
  return destination;
}

async function readRegularFile(filename: string): Promise<Uint8Array | undefined> {
  try {
    const stat = await lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Not a regular file: ${filename}`);
    return await readFile(filename);
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return undefined;
    throw error;
  }
}

function assertBytes(bytes: Uint8Array, spec: { sha256: string; size: number }, label: string): void {
  if (bytes.length !== spec.size || sha256(bytes) !== spec.sha256) throw new Error(`Hash mismatch: ${label}`);
}

async function directoryExists(filename: string): Promise<boolean> {
  try {
    const stat = await lstat(filename);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Not a real directory: ${filename}`);
    return true;
  } catch (error) {
    if (hasCode(error, 'ENOENT')) return false;
    throw error;
  }
}

export async function extractArchiveMember(archive: Uint8Array, member: string, format: 'tar' | 'xz'): Promise<Uint8Array> {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-runtime-archive-'));
  try {
    const archivePath = path.join(directory, 'archive');
    await writeGeneratedFile(archivePath, archive);
    await new Promise<void>((resolve, reject) => {
      const child = spawn('tar', [format === 'xz' ? '-xJf' : '-xf', archivePath, '-C', directory, member], { stdio: 'ignore' });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`tar exited ${code ?? 'unknown'}`)));
    });
    const bytes = await readRegularFile(resolveInside(directory, member));
    if (!bytes) throw new Error(`Archive member missing: ${member}`);
    return bytes;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function verifyExecutable(filename: string, check: ExecutableCheck): Promise<void> {
  if (check === 'none') return;
  const args = check === 'node-22.14.0'
    ? ['-p', 'process.version + " " + process.versions.modules']
    : check === 'ripgrep-cursor5' || check === 'origin-version' ? ['--version'] : ['--help'];
  const result = await new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(filename, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
  });
  const output = result.stdout + result.stderr;
  if (check === 'node-22.14.0' && result.stdout.trim() !== 'v22.14.0 127') throw new Error(`Provisioned Node is ${result.stdout.trim() || 'unreadable'}`);
  if (check === 'ripgrep-cursor5' && !output.includes('ripgrep 15.1.0-cursor5')) throw new Error('Provisioned ripgrep is not 15.1.0-cursor5');
  if (check === 'cursorsandbox-help' && (result.status !== 0 || !output.includes('--preflight-only'))) throw new Error('Provisioned cursorsandbox did not report its help');
  if (check === 'origin-version' && (result.status !== 0 || !output.includes('2026.09.24-20-34-11-8ed25e0'))) throw new Error('Provisioned Origin CLI did not report its locked version');
  if (check === 'agent-store-help' && (result.status !== 0 || !output.includes('--backend-mode'))) throw new Error('Provisioned agent-store FUSE helper did not report its help');
}

async function fetchArchiveBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed ${response.status}: ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

async function placeFile(destination: string, bytes: Uint8Array, mode: FileMode): Promise<void> {
  await writeGeneratedFile(destination, bytes, Number.parseInt(mode.slice(-3), 8));
  await access(destination, constants.R_OK);
}

async function provisionFile(tool: LockedFile, options: ProvisionOptions, environmentRoot: string | undefined): Promise<ProvisionAction> {
  const destination = resolveInside(options.destRoot, tool.dest);
  for (const source of tool.sources) {
    if (source.kind === 'environment') {
      if (!environmentRoot) continue;
      const candidate = resolveInside(environmentRoot, source.path);
      const bytes = await readRegularFile(candidate);
      if (!bytes) continue;
      assertBytes(bytes, tool, candidate);
      await placeFile(destination, bytes, tool.mode);
      if (options.verifyExecutables) await verifyExecutable(destination, tool.executableCheck);
      return { id: tool.id, status: 'copied', detail: candidate };
    }
    if (source.kind === 'repo') {
      const candidate = resolveInside(options.repoRoot, source.path);
      const bytes = await readRegularFile(candidate);
      if (!bytes) continue;
      assertBytes(bytes, tool, candidate);
      await placeFile(destination, bytes, tool.mode);
      if (options.verifyExecutables) await verifyExecutable(destination, tool.executableCheck);
      return { id: tool.id, status: 'copied', detail: candidate };
    }
    const archive = await (options.fetchArchive ?? fetchArchiveBytes)(source.url);
    assertBytes(archive, { sha256: source.archiveSha256, size: archive.length }, source.url);
    const member = await extractArchiveMember(archive, source.archiveMember, source.url.endsWith('.tar.xz') ? 'xz' : 'tar');
    assertBytes(member, tool, source.archiveMember);
    await placeFile(destination, member, tool.mode);
    if (options.verifyExecutables) await verifyExecutable(destination, tool.executableCheck);
    return { id: tool.id, status: 'downloaded', detail: source.url };
  }
  if (tool.optional) return { id: tool.id, status: 'skipped', detail: 'optional source absent' };
  throw new Error(`Required runtime tool is unavailable: ${tool.id}`);
}

async function matchingTree(root: string, checks: readonly FileCheck[]): Promise<boolean> {
  for (const check of checks) {
    const bytes = await readRegularFile(resolveInside(root, check.path));
    if (!bytes) return false;
    assertBytes(bytes, check, path.join(root, check.path));
    const stat = await lstat(resolveInside(root, check.path));
    if ((stat.mode & 0o777) !== Number.parseInt(check.mode.slice(-3), 8)) throw new Error(`Mode mismatch: ${check.path}`);
  }
  return true;
}

export function assertTreeArchiveEntries(entries: readonly string[], rootName: string): void {
  if (entries.length === 0) throw new Error(`Empty runtime archive: ${rootName}`);
  for (const entry of entries) {
    const relative = entry.replace(/\/$/, '');
    if (!relative || relative.split('/').some(part => !part || part === '.' || part === '..')) throw new Error(`Unsafe archive entry: ${entry}`);
    if (relative !== rootName && !relative.startsWith(`${rootName}/`)) throw new Error(`Archive entry is outside ${rootName}: ${entry}`);
  }
}

async function commandOutput(command: string, args: readonly string[]): Promise<{ status: number | null; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8') }));
  });
}

async function extractRepoTree(archivePath: string, destRoot: string, rootName: string): Promise<void> {
  const listed = await commandOutput('tar', ['-tf', archivePath]);
  if (listed.status !== 0) throw new Error(`Cannot list runtime archive: ${archivePath}`);
  assertTreeArchiveEntries(listed.stdout.split('\n').filter(entry => entry !== ''), rootName);
  await ensureDirectory(destRoot);
  const destination = resolveInside(destRoot, rootName);
  await rm(destination, { recursive: true, force: true });
  await new Promise<void>((resolve, reject) => {
    const child = spawn('tar', ['-xf', archivePath, '-C', destRoot], { stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`tar exited ${code ?? 'unknown'}`)));
  });
}

async function provisionTree(tool: LockedTree, options: ProvisionOptions, environmentRoot: string | undefined): Promise<ProvisionAction> {
  for (const source of tool.sources) {
    if (source.kind === 'repo-archive') {
      const archivePath = resolveInside(options.repoRoot, source.path);
      const bytes = await readRegularFile(archivePath);
      if (!bytes) continue;
      assertBytes(bytes, source, archivePath);
      await extractRepoTree(archivePath, options.destRoot, tool.dest);
      const destination = resolveInside(options.destRoot, tool.dest);
      if (!await matchingTree(destination, tool.checks)) throw new Error(`Extracted runtime tree does not match the lock: ${tool.id}`);
      return { id: tool.id, status: 'copied', detail: archivePath };
    }
    if (!environmentRoot) continue;
    const from = resolveInside(environmentRoot, source.path);
    if (!await directoryExists(from)) continue;
    if (!await matchingTree(from, tool.checks)) throw new Error(`Runtime tree does not match the lock: ${tool.id}`);
    const destination = resolveInside(options.destRoot, tool.dest);
    await rm(destination, { recursive: true, force: true });
    await cp(from, destination, { recursive: true, verbatimSymlinks: true });
    if (!await matchingTree(destination, tool.checks)) throw new Error(`Copied runtime tree does not match the lock: ${tool.id}`);
    return { id: tool.id, status: 'copied', detail: from };
  }
  if (tool.optional) return { id: tool.id, status: 'skipped', detail: 'optional source absent' };
  throw new Error(`Required runtime tree is unavailable: ${tool.id}`);
}

export async function provisionRuntimeTools(options: ProvisionOptions): Promise<ProvisionAction[]> {
  assertProvisionDestination(options.destRoot, options.vendorRoot);
  let environmentRoot = options.environmentRoot;
  if (environmentRoot && !await directoryExists(environmentRoot)) environmentRoot = undefined;
  const actions: ProvisionAction[] = [];
  for (const tool of options.lock.tools) {
    if (options.profile === 'core' && !tool.profiles.includes('core')) continue;
    actions.push(tool.kind === 'file'
      ? await provisionFile(tool, options, environmentRoot)
      : await provisionTree(tool, options, environmentRoot));
  }
  return actions;
}
