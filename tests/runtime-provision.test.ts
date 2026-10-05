import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chmod, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { root } from '../tools/lib/project.js';
import { assertProvisionDestination, assertTreeArchiveEntries, extractArchiveMember, parseRuntimeToolLock, provisionRuntimeTools, sha256 } from '../tools/lib/runtime-provision.js';
import type { LockedFile, RuntimeToolLock } from '../tools/lib/runtime-provision.js';

const lockPath = path.join(root, 'runtime/tools.lock.json');
const contractPath = path.join(root, 'runtime/contract.json');

async function temp(t: TestContext, prefix: string): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

function fileTool(overrides: Partial<Omit<LockedFile, 'kind'>> = {}): RuntimeToolLock {
  return {
    schemaVersion: 1,
    sourceBuildTimestamp: '2026-10-04T20:39:01.722Z',
    defaultEnvironment: '/missing-exec-daemon',
    tools: [{
      kind: 'file',
      id: 'rg',
      dest: 'rg',
      version: 'test',
      sha256: sha256(Buffer.from('ripgrep-bytes')),
      size: Buffer.byteLength('ripgrep-bytes'),
      mode: '100755',
      profiles: ['core', 'supported'],
      optional: false,
      executableCheck: 'none',
      sources: [{ kind: 'repo', path: 'rg' }],
      ...overrides,
    }],
  };
}

test('the committed runtime tools match the lock and contract', async () => {
  const lock = parseRuntimeToolLock(JSON.parse(await readFile(lockPath, 'utf8')) as unknown);
  const contract = JSON.parse(await readFile(contractPath, 'utf8')) as {
    node: { version: string; binarySha256: string };
    profiles: { supported: { required: string[]; optional: string[] } };
  };
  const node = lock.tools.find(tool => tool.id === 'node');
  assert.ok(node && node.kind === 'file');
  assert.equal(node.version, contract.node.version);
  assert.equal(node.sha256, contract.node.binarySha256);
  assert.deepEqual(contract.profiles.supported.optional, ['gh', 'ssh-keygen']);
  for (const tool of lock.tools) {
    if (!tool.profiles.includes('supported')) continue;
    const listed = tool.optional ? contract.profiles.supported.optional : contract.profiles.supported.required;
    assert.ok(listed.includes(tool.id), tool.id);
  }
  for (const tool of lock.tools) {
    if (tool.kind !== 'file') continue;
    const repo = tool.sources.find(source => source.kind === 'repo');
    if (!repo || repo.kind !== 'repo') continue;
    const bytes = await readFile(path.join(root, repo.path));
    assert.equal(bytes.length, tool.size, tool.id);
    assert.equal(sha256(bytes), tool.sha256, tool.id);
    const stat = await lstat(path.join(root, repo.path));
    assert.equal(stat.mode & 0o777, Number.parseInt(tool.mode.slice(-3), 8), tool.id);
  }
  const tmux = lock.tools.find(tool => tool.id === 'tmux-root');
  assert.ok(tmux && tmux.kind === 'tree');
  const archive = tmux.sources.find(source => source.kind === 'repo-archive');
  assert.ok(archive && archive.kind === 'repo-archive');
  const archiveBytes = await readFile(path.join(root, archive.path));
  assert.equal(archiveBytes.length, archive.size);
  assert.equal(sha256(archiveBytes), archive.sha256);
});

test('provisioning copies a matching repo file and refuses the vendor tree', async (t) => {
  const repoRoot = await temp(t, 'exec-daemon-provision-repo-');
  const destRoot = await temp(t, 'exec-daemon-provision-dest-');
  const vendorRoot = await temp(t, 'exec-daemon-provision-vendor-');
  await writeFile(path.join(repoRoot, 'rg'), 'ripgrep-bytes');
  await chmod(path.join(repoRoot, 'rg'), 0o755);
  const actions = await provisionRuntimeTools({
    lock: fileTool(), repoRoot, destRoot, vendorRoot, profile: 'core', verifyExecutables: false,
  });
  assert.deepEqual(actions, [{ id: 'rg', status: 'copied', detail: path.join(repoRoot, 'rg') }]);
  assert.equal(await readFile(path.join(destRoot, 'rg'), 'utf8'), 'ripgrep-bytes');
  assert.equal((await lstat(path.join(destRoot, 'rg'))).mode & 0o777, 0o755);
  assert.throws(() => assertProvisionDestination(vendorRoot, vendorRoot), /immutable vendor tree/);
  await assert.rejects(provisionRuntimeTools({
    lock: fileTool(), repoRoot, destRoot: vendorRoot, vendorRoot, profile: 'core', verifyExecutables: false,
  }), /immutable vendor tree/);
});

test('provisioning fails closed on a hash mismatch and skips an absent optional tool', async (t) => {
  const repoRoot = await temp(t, 'exec-daemon-provision-bad-');
  const destRoot = await temp(t, 'exec-daemon-provision-bad-dest-');
  const vendorRoot = await temp(t, 'exec-daemon-provision-bad-vendor-');
  await writeFile(path.join(repoRoot, 'rg'), 'different-bytes');
  await assert.rejects(provisionRuntimeTools({
    lock: fileTool(), repoRoot, destRoot, vendorRoot, profile: 'core', verifyExecutables: false,
  }), /Hash mismatch/);
  const empty = await temp(t, 'exec-daemon-provision-empty-');
  const actions = await provisionRuntimeTools({
    lock: fileTool({ optional: true, sources: [{ kind: 'environment', path: 'rg' }] }),
    repoRoot, destRoot, vendorRoot, environmentRoot: empty, profile: 'supported', verifyExecutables: false,
  });
  assert.deepEqual(actions, [{ id: 'rg', status: 'skipped', detail: 'optional source absent' }]);
  await assert.rejects(provisionRuntimeTools({
    lock: fileTool({ sources: [{ kind: 'environment', path: 'rg' }] }),
    repoRoot, destRoot, vendorRoot, environmentRoot: empty, profile: 'core', verifyExecutables: false,
  }), /unavailable: rg/);
});

test('provisioning copies a locked environment tree and preserves its symlink', async (t) => {
  const environment = await temp(t, 'exec-daemon-provision-tree-');
  const destRoot = await temp(t, 'exec-daemon-provision-tree-dest-');
  const vendorRoot = await temp(t, 'exec-daemon-provision-tree-vendor-');
  await mkdir(path.join(environment, 'tmux-root/bin'), { recursive: true });
  await writeFile(path.join(environment, 'tmux-root/bin/tmux'), 'tmux-bytes');
  await chmod(path.join(environment, 'tmux-root/bin/tmux'), 0o755);
  await symlink('tmux', path.join(environment, 'tmux-root/bin/tmux-link'));
  const stamp = Buffer.from('stamp');
  const binary = Buffer.from('tmux-bytes');
  const lock: RuntimeToolLock = {
    schemaVersion: 1,
    sourceBuildTimestamp: '2026-10-04T20:39:01.722Z',
    defaultEnvironment: environment,
    tools: [{
      kind: 'tree',
      id: 'tmux-root',
      dest: 'tmux-root',
      version: 'test',
      profiles: ['supported'],
      optional: true,
      sources: [{ kind: 'environment', path: 'tmux-root' }],
      checks: [
        { path: 'bin/tmux', sha256: sha256(binary), size: binary.length, mode: '100755' },
        { path: '.portable-build-stamp', sha256: sha256(stamp), size: stamp.length, mode: '100644' },
      ],
    }],
  };
  await writeFile(path.join(environment, 'tmux-root/.portable-build-stamp'), stamp);
  const actions = await provisionRuntimeTools({
    lock, repoRoot: environment, destRoot, vendorRoot, environmentRoot: environment, profile: 'supported', verifyExecutables: false,
  });
  assert.equal(actions[0]?.status, 'copied');
  assert.equal(await readFile(path.join(destRoot, 'tmux-root/bin/tmux'), 'utf8'), 'tmux-bytes');
  assert.equal(await lstat(path.join(destRoot, 'tmux-root/bin/tmux-link')).then(stat => stat.isSymbolicLink()), true);
});

test('archive installation checks the archive hash and extracts one member', async (t) => {
  const directory = await temp(t, 'exec-daemon-provision-archive-');
  const payload = path.join(directory, 'payload/bin');
  await mkdir(payload, { recursive: true });
  await writeFile(path.join(payload, 'node'), 'node-bytes');
  const archivePath = path.join(directory, 'node.tar');
  await new Promise<void>((resolve, reject) => {
    const child = spawn('tar', ['-cf', archivePath, '-C', directory, 'payload/bin/node'], { stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`tar exited ${code ?? 'unknown'}`)));
  });
  const archive = await readFile(archivePath);
  const member = await extractArchiveMember(archive, 'payload/bin/node', 'tar');
  assert.equal(Buffer.from(member).toString('utf8'), 'node-bytes');
  const destRoot = await temp(t, 'exec-daemon-provision-url-dest-');
  const vendorRoot = await temp(t, 'exec-daemon-provision-url-vendor-');
  const bytes = Buffer.from('node-bytes');
  const actions = await provisionRuntimeTools({
    lock: fileTool({
      id: 'node',
      dest: 'node',
      sha256: sha256(bytes),
      size: bytes.length,
      sources: [{ kind: 'url', url: 'https://example.invalid/node.tar', archiveSha256: sha256(archive), archiveMember: 'payload/bin/node' }],
    }),
    repoRoot: directory,
    destRoot,
    vendorRoot,
    profile: 'core',
    verifyExecutables: false,
    fetchArchive: async () => archive,
  });
  assert.equal(actions[0]?.status, 'downloaded');
  assert.equal(await readFile(path.join(destRoot, 'node'), 'utf8'), 'node-bytes');
  await assert.rejects(provisionRuntimeTools({
    lock: fileTool({
      id: 'node',
      dest: 'node',
      sha256: sha256(bytes),
      size: bytes.length,
      sources: [{ kind: 'url', url: 'https://example.invalid/node.tar', archiveSha256: '0'.repeat(64), archiveMember: 'payload/bin/node' }],
    }),
    repoRoot: directory,
    destRoot,
    vendorRoot,
    profile: 'core',
    verifyExecutables: false,
    fetchArchive: async () => archive,
  }), /Hash mismatch/);
});

test('a repo archive restores a checked tree and rejects an escaping entry', async (t) => {
  assert.throws(() => assertTreeArchiveEntries(['../tmux-root/bin/tmux'], 'tmux-root'), /Unsafe archive entry/);
  assert.throws(() => assertTreeArchiveEntries(['other/bin/tmux'], 'tmux-root'), /outside tmux-root/);
  const repoRoot = await temp(t, 'exec-daemon-provision-archive-tree-');
  const destRoot = await temp(t, 'exec-daemon-provision-archive-dest-');
  const vendorRoot = await temp(t, 'exec-daemon-provision-archive-vendor-');
  const tree = path.join(repoRoot, 'stage/tmux-root/bin');
  await mkdir(tree, { recursive: true });
  const binary = Buffer.from('tmux-bytes');
  const stamp = Buffer.from('stamp');
  await writeFile(path.join(tree, 'tmux'), binary);
  await chmod(path.join(tree, 'tmux'), 0o755);
  await writeFile(path.join(repoRoot, 'stage/tmux-root/.portable-build-stamp'), stamp);
  const archivePath = path.join(repoRoot, 'tmux-root.tar');
  await new Promise<void>((resolve, reject) => {
    const child = spawn('tar', ['-cf', archivePath, '-C', path.join(repoRoot, 'stage'), 'tmux-root'], { stdio: 'ignore' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`tar exited ${code ?? 'unknown'}`)));
  });
  const archive = await readFile(archivePath);
  const lock: RuntimeToolLock = {
    schemaVersion: 1,
    sourceBuildTimestamp: '2026-10-04T20:39:01.722Z',
    defaultEnvironment: '/missing',
    tools: [{
      kind: 'tree',
      id: 'tmux-root',
      dest: 'tmux-root',
      version: 'test',
      profiles: ['supported'],
      optional: false,
      sources: [{ kind: 'repo-archive', path: 'tmux-root.tar', sha256: sha256(archive), size: archive.length }],
      checks: [
        { path: 'bin/tmux', sha256: sha256(binary), size: binary.length, mode: '100755' },
        { path: '.portable-build-stamp', sha256: sha256(stamp), size: stamp.length, mode: '100644' },
      ],
    }],
  };
  const actions = await provisionRuntimeTools({
    lock, repoRoot, destRoot, vendorRoot, profile: 'supported', verifyExecutables: false,
  });
  assert.equal(actions[0]?.status, 'copied');
  assert.equal(await readFile(path.join(destRoot, 'tmux-root/bin/tmux'), 'utf8'), 'tmux-bytes');
});

test('the lock parser rejects a tampered tool', () => {
  assert.throws(() => parseRuntimeToolLock({ schemaVersion: 1, sourceBuildTimestamp: 'time', defaultEnvironment: '/exec-daemon', tools: [] }), /Expected entries: tools/);
  assert.throws(() => parseRuntimeToolLock({
    schemaVersion: 1,
    sourceBuildTimestamp: 'time',
    defaultEnvironment: '/exec-daemon',
    tools: [{
      kind: 'file', id: '../node', dest: 'node', version: '1', sha256: 'a'.repeat(64), size: 1, mode: '100755',
      profiles: ['core'], optional: false, executableCheck: 'none', sources: [{ kind: 'repo', path: 'node' }],
    }],
  }), /Unsafe tool id/);
});
