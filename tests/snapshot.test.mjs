import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { verifySnapshot } from '../tools/lib/snapshot.mjs';
import { ensureDirectory, gitBlobHash, listFiles, validateRelativePath } from '../tools/lib/project.mjs';

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-snapshot-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const files = [
    { path: 'index.js', bytes: Buffer.from('fixture runtime\n'), mode: '100644' },
    { path: 'nested directory/launcher', bytes: Buffer.from('#!/bin/sh\nexit 0\n'), mode: '100755' },
  ];
  for (const file of files) {
    const destination = path.join(directory, file.path);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.bytes);
    await chmod(destination, Number.parseInt(file.mode.slice(-3), 8));
  }
  const snapshot = { schemaVersion: 1, files: files.map(({ path: filePath, bytes, mode }) => ({
    path: filePath, size: bytes.length, mode, sha: gitBlobHash(bytes),
  })) };
  return { directory, snapshot };
}

test('snapshot verifier accepts a tiny exact fixture with executable modes', async (t) => {
  const { directory, snapshot } = await fixture(t);
  assert.equal(await verifySnapshot(directory, snapshot), snapshot);
});

test('snapshot verifier reports missing and unexpected files together', async (t) => {
  const { directory, snapshot } = await fixture(t);
  await rm(path.join(directory, 'index.js'));
  await writeFile(path.join(directory, 'extra.js'), 'extra');
  await assert.rejects(verifySnapshot(directory, snapshot), (error) => {
    assert.match(error.message, /missing: index\.js/);
    assert.match(error.message, /unexpected: extra\.js/);
    return true;
  });
});

test('snapshot verifier detects same-size content corruption by Git blob hash', async (t) => {
  const { directory, snapshot } = await fixture(t);
  await writeFile(path.join(directory, 'index.js'), 'Fixture runtime\n');
  await assert.rejects(verifySnapshot(directory, snapshot), /content changed: index\.js/);
});

test('snapshot verifier detects a size mismatch', async (t) => {
  const { directory, snapshot } = await fixture(t);
  await writeFile(path.join(directory, 'index.js'), 'truncated');
  await assert.rejects(verifySnapshot(directory, snapshot), /content changed: index\.js/);
});

test('snapshot verifier rejects mode-only changes', { skip: process.platform === 'win32' }, async (t) => {
  const { directory, snapshot } = await fixture(t);
  await chmod(path.join(directory, 'nested directory/launcher'), 0o644);
  await assert.rejects(verifySnapshot(directory, snapshot), /mode changed: nested directory\/launcher/);
});

test('snapshot verifier rejects file symlinks even if their target is valid', { skip: process.platform === 'win32' }, async (t) => {
  const { directory, snapshot } = await fixture(t);
  await rm(path.join(directory, 'index.js'));
  await symlink('nested directory/launcher', path.join(directory, 'index.js'));
  await assert.rejects(verifySnapshot(directory, snapshot), /Unexpected symlink: index\.js/);
});

test('snapshot verifier rejects directory symlinks without traversing them', { skip: process.platform === 'win32' }, async (t) => {
  const { directory, snapshot } = await fixture(t);
  await symlink('.', path.join(directory, 'cycle'));
  await assert.rejects(verifySnapshot(directory, snapshot), /Unexpected symlink: cycle/);
});

test('listFiles rejects a symlinked root instead of traversing its valid target', { skip: process.platform === 'win32' }, async (t) => {
  const { directory } = await fixture(t);
  const link = path.join(directory, 'linked-root');
  await symlink('nested directory', link);
  await assert.rejects(listFiles(link), (error) => {
    assert.equal(error.message, `Not a real directory: ${link}`);
    return true;
  });
});

test('ensureDirectory rejects an existing output directory behind a symlink ancestor', { skip: process.platform === 'win32' }, async (t) => {
  const { directory } = await fixture(t);
  const target = path.join(directory, 'real-build/runtime');
  await mkdir(target, { recursive: true });
  const marker = path.join(target, 'existing-output.txt');
  await writeFile(marker, 'must stay untouched');
  const link = path.join(directory, 'linked-build');
  await symlink('real-build', link);
  // The leaf exists and lstat(leaf) reports an ordinary directory. The helper
  // must validate ancestors too, rather than returning early for that leaf.
  await assert.rejects(ensureDirectory(path.join(link, 'runtime')), (error) => {
    assert.equal(error.message, `Not a real directory: ${link}`);
    return true;
  });
  assert.equal(await readFile(marker, 'utf8'), 'must stay untouched');
});

test('path validation rejects absolute, parent, empty, drive, and backslash paths', () => {
  for (const value of ['/absolute', '../escape', 'a/../b', './a', 'a//b', 'a/', '', 'C:/drive', 'a\\b', 'a\0b']) {
    assert.throws(() => validateRelativePath(value), /Unsafe relative path/);
  }
  assert.equal(validateRelativePath('nested directory/file.js'), 'nested directory/file.js');
  assert.equal(gitBlobHash(Buffer.alloc(0)), 'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
});
