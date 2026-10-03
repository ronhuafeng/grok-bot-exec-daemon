import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { root, runtimeRoot } from '../tools/lib/project.mjs';

// These tests execute only the shell launchers and a fake shell "node" binary.
// The JavaScript fixture throws if it is ever accidentally run by real Node.
async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec daemon launcher '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const project = path.join(directory, 'project with spaces');
  const runtime = path.join(project, 'dist/runtime');
  const cwd = path.join(directory, 'unrelated working directory');
  await mkdir(path.join(project, 'bin'), { recursive: true });
  await mkdir(runtime, { recursive: true });
  await mkdir(cwd);
  const launcher = path.join(project, 'bin/exec-daemon');
  await copyFile(path.join(root, 'bin/exec-daemon'), launcher);
  await chmod(launcher, 0o755);
  await copyFile(path.join(runtimeRoot, 'exec-daemon'), path.join(runtime, 'exec-daemon'));
  await chmod(path.join(runtime, 'exec-daemon'), 0o755);
  await writeFile(path.join(runtime, 'index.js'), 'throw new Error("test must not run real Node");\n');
  await writeFile(path.join(runtime, 'node'), '#!/usr/bin/env bash\nprintf \'%s\\0\' "$PWD" "$@"\nexit "${TEST_EXIT_STATUS:-0}"\n');
  await chmod(path.join(runtime, 'node'), 0o755);
  return { directory, project, runtime, cwd, launcher };
}

function run(fixture, args = [], executable = fixture.launcher, exitStatus = 0) {
  const result = spawnSync(executable, args, {
    cwd: fixture.cwd, encoding: 'utf8', timeout: 5000,
    env: { PATH: process.env.PATH, TEST_EXIT_STATUS: String(exitStatus) },
  });
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  return result;
}

function assertForwarded(result, fixture, args, exitStatus = 0) {
  assert.equal(result.status, exitStatus);
  assert.equal(result.stderr, '');
  const values = result.stdout.split('\0');
  assert.equal(values.pop(), '');
  assert.deepEqual(values, [fixture.cwd, path.join(fixture.runtime, 'index.js'), ...args]);
}

test('launcher forwards arguments exactly, retains caller cwd, handles spaces, and propagates child status', async (t) => {
  const tree = await fixture(t);
  const args = ['serve', '--auth-token', 'fixture token', '', '*', 'quotes\'";$HOME', 'line one\nline two', '--'];
  assertForwarded(run(tree, args, tree.launcher, 37), tree, args, 37);
});

test('launcher resolves a relative symlink chain from an unrelated directory', async (t) => {
  const tree = await fixture(t);
  const links = path.join(tree.directory, 'symlink bin with spaces');
  await mkdir(links);
  await symlink(path.relative(links, tree.launcher), path.join(links, 'middle'));
  await symlink('middle', path.join(links, 'exec-daemon'));
  const args = ['serve', '--future-flag=value'];
  assertForwarded(run(tree, args, path.join(links, 'exec-daemon')), tree, args);
});

test('launcher resolves an absolute symlink and relative invocation path', async (t) => {
  const tree = await fixture(t);
  const link = path.join(tree.cwd, 'linked daemon');
  await symlink(tree.launcher, link);
  assertForwarded(run(tree, [], './linked daemon'), tree, []);
});

test('launcher reports an unbuilt runtime instead of invoking Node', async (t) => {
  for (const missing of ['index.js', 'exec-daemon']) {
    await t.test(missing, async (t) => {
      const tree = await fixture(t);
      await rm(path.join(tree.runtime, missing));
      const result = run(tree);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /Runtime has not been built.*npm run build/);
    });
  }
});

test('launcher treats a non-executable runtime launcher as an unbuilt runtime', async (t) => {
  const tree = await fixture(t);
  await chmod(path.join(tree.runtime, 'exec-daemon'), 0o644);
  const result = run(tree);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Runtime has not been built/);
});

test('launcher explains missing or non-executable bundled Node without falling back to host Node', async (t) => {
  for (const state of ['missing', 'not executable']) {
    await t.test(state, async (t) => {
      const tree = await fixture(t);
      if (state === 'missing') await rm(path.join(tree.runtime, 'node'));
      else await chmod(path.join(tree.runtime, 'node'), 0o644);
      const result = run(tree);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, '');
      assert.match(result.stderr, /original Node binary was not included/);
      assert.match(result.stderr, /dist\/runtime\/node.*npm run doctor/);
    });
  }
});
