import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { root } from '../tools/lib/project.mjs';

test('vendor attributes override generic JSON/Markdown rules and preserve CRLF through Git checkout', async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-attributes-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const env = {
    PATH: process.env.PATH, HOME: directory,
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1',
  };
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: directory, env, timeout: 5000 });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, `git ${args.join(' ')}: ${result.stderr}`);
    return result.stdout;
  };
  git('init', '--quiet');
  git('config', 'core.autocrlf', 'true');
  git('config', 'user.name', 'Local Fixture');
  git('config', 'user.email', 'fixture@example.invalid');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'core.hooksPath', path.join(directory, 'no-hooks'));
  await copyFile(path.join(root, '.gitattributes'), path.join(directory, '.gitattributes'));

  const fixtures = new Map([
    ['vendor/exec-daemon-runtime/nested/package.json', Buffer.from('{\r\n  "fixture": true\r\n}\r\n')],
    ['vendor/exec-daemon-runtime/nested/README.md', Buffer.from('# Imported fixture\r\n\r\nPreserve every byte.\r\n')],
  ]);
  for (const [file, bytes] of fixtures) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), bytes);
    // Check precedence explicitly: -text alone must not leave a stale eol=lf
    // attribute inherited from the generic *.json or *.md rules above it.
    assert.deepEqual(git('check-attr', '-z', 'text', 'diff', 'eol', '--', file).toString().split('\0'), [
      file, 'text', 'unset', file, 'diff', 'unset', file, 'eol', 'unspecified', '',
    ]);
  }
  await writeFile(path.join(directory, 'ordinary.json'), '{\r\n  "normalText": true\r\n}\r\n');
  git('add', '--all');
  git('commit', '--quiet', '-m', 'Test byte-preserving vendor attributes');
  for (const [file, bytes] of fixtures) {
    assert.deepEqual(git('show', `HEAD:${file}`), bytes, `committed blob: ${file}`);
    await rm(path.join(directory, file));
  }
  // The normal JSON rule still normalizes text. Only imported vendor bytes
  // bypass normalization; this also proves autocrlf/text conversion is active.
  assert.equal(git('show', 'HEAD:ordinary.json').toString(), '{\n  "normalText": true\n}\n');
  git('checkout-index', '--force', '--all');
  for (const [file, bytes] of fixtures) {
    assert.deepEqual(await readFile(path.join(directory, file)), bytes, `fresh checkout: ${file}`);
  }
  assert.equal(git('status', '--porcelain', '--untracked-files=all').toString(), '');
});
