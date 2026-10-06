import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { root } from '../tools/lib/project.js';
import { evaluateRedistribution, loadCommittedRedistributionInventory, requiredRedistributionIds } from '../tools/lib/redistribution.js';

const lock = JSON.parse(readFileSync(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as unknown;
const requiredIds = requiredRedistributionIds(lock);

test('the committed inventory is complete and the public release path fails closed', () => {
  const inventory = loadCommittedRedistributionInventory();
  const completeness = evaluateRedistribution(inventory, 'completeness', requiredIds);
  assert.deepEqual(completeness.errors, [], completeness.errors.join('\n'));
  assert.equal(completeness.ok, true);
  const release = evaluateRedistribution(inventory, 'public', requiredIds);
  assert.equal(release.ok, false);
  assert.ok(release.errors.some(error => error.includes('public release rejects rg (unresolved)')));
  assert.ok(release.errors.some(error => error.includes('public release rejects project-source (internal)')));
  assert.ok(release.errors.some(error => error.includes('native:pty.node')));
  const text = JSON.stringify(inventory);
  assert.equal(text.includes('"private"'), false);
});

test('a hash match and private flag do not authorize an unresolved artifact', () => {
  const inventory = {
    schemaVersion: 1,
    private: true,
    visibility: 'public',
    notice: 'runtime/NOTICES.md',
    components: [
      {
        id: 'rg',
        version: '15.1.0-cursor5',
        status: 'unresolved',
        packaged: true,
        identityKind: 'sha256',
        identity: 'd42ae51b08e3a368ff9504ea713dc05934a6315f759531eb1f714147dd9989a5',
        bundledPath: 'runtime-tools/ripgrep/linux-x64/rg',
        private: true,
      },
    ],
  };
  const release = evaluateRedistribution(inventory, 'public', ['rg']);
  assert.equal(release.ok, false);
  assert.ok(release.errors.some(error => error.includes('unresolved')));
  assert.equal(release.errors.some(error => /private|visibility|license/i.test(error)), false);
  const missing = evaluateRedistribution({
    schemaVersion: 1,
    notice: 'runtime/NOTICES.md',
    components: [{ id: 'rg', version: '1', status: '', packaged: true, identityKind: 'sha256', identity: 'ab' }],
  }, 'completeness', ['rg']);
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.some(error => error.includes('missing a distribution status')));
});

test('the public command fails and the completeness command passes', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'redistribution-'));
  try {
    const completeness = spawnSync(process.execPath, [path.join(root, 'dist/project/tools/check-redistribution.js')], { encoding: 'utf8' });
    assert.equal(completeness.status, 0, completeness.stderr);
    const release = spawnSync(process.execPath, [path.join(root, 'dist/project/tools/check-redistribution.js'), '--public'], { encoding: 'utf8' });
    assert.equal(release.status, 1);
    assert.match(release.stderr, /public release rejects/);
    assert.doesNotMatch(release.stderr, /private: true|GitHub visibility/);
    writeFileSync(path.join(directory, 'unused'), 'x');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
