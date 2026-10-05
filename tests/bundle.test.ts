import test from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { moduleBlocks, ownedSegments, readBaseline, readRuntimeInventory, readRuntimeSources, wrapFactory, unwrapFactory } from '../tools/lib/bundle.js';
import { gitBlobHash, gitTreeHash } from '../tools/lib/project.js';
import { materializeRuntimeBuild, planRuntimeBuild, verifyRuntimeBuild } from '../tools/lib/module-build.js';
import type { CapsuleResult } from '../tools/lib/vendor-capsule.js';
import type { SnapshotFile } from '../tools/lib/snapshot.js';

const baseline = await readBaseline();
const inventory = await readRuntimeInventory(baseline);
const sources = inventory.sources;
async function sourceFixture(t: TestContext) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-source-inventory-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const manifest = { schemaVersion: 2, baselineBlob: gitBlobHash(Buffer.from(baseline)),
    sources: sources.map(({ source: _source, ...entry }) => entry),
    support: inventory.support.map(({ source: _source, ...entry }) => entry),
    retiredSources: inventory.retiredSources,
    reviewedOmissions: [{ proof: 'linux-platform-residue-v1', factory: './src/machine-resources.ts', declarations: inventory.declarations }],
  };
  for (const source of [...sources, ...inventory.support]) {
    await mkdir(path.dirname(path.join(directory, source.file)), { recursive: true });
    await writeFile(path.join(directory, source.file), source.source);
  }
  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
  return { directory, manifest };
}

test('the immutable 64-segment inventory is covered by 63 real modules and the exact reviewed retirement', () => {
  assert.equal(moduleBlocks(baseline).size, 21);
  assert.equal(ownedSegments(baseline).length, 64);
  assert.equal(sources.length, 63);
  assert.deepEqual(inventory.retiredSources.map(source => source.id), ['./src/darwin-memory.ts']);
  assert.equal(inventory.declarations.length, 16);
  assert.ok(inventory.support.some(source => source.file === 'runtime-location.ts'));
  assert.ok(inventory.support.some(source => source.file === 'configuration.ts'));
  assert.ok(sources.some(source => source.source.includes('import {')));
});

test('baseline factory wrappers remain a read-only provenance utility', () => {
  for (const [id, block] of moduleBlocks(baseline)) assert.equal(unwrapFactory(wrapFactory(block.text), id), block.text);
  const id = './src/example.ts';
  const block = `/***/ "${id}"\n(module) { module.exports = 1;\n/***/ },\n\n`;
  assert.throws(() => unwrapFactory(block, id), /Invalid factory wrapper/);
  assert.throws(() => unwrapFactory(wrapFactory(block.replace('module.exports = 1;', 'const = ;')), id), SyntaxError);
});

test('source inventory rejects missing, omitted, and unlisted modules', async t => {
  const { directory, manifest } = await sourceFixture(t);
  const first = sources[0];
  assert.ok(first);
  await rm(path.join(directory, first.file));
  await assert.rejects(readRuntimeInventory(baseline, directory), { code: 'ENOENT' });
  await writeFile(path.join(directory, first.file), first.source);
  await writeFile(path.join(directory, 'unlisted.ts'), 'export const extra = 1;');
  await assert.rejects(readRuntimeInventory(baseline, directory), /Unlisted maintained/);
  await rm(path.join(directory, 'unlisted.ts'));
  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify({ ...manifest, sources: manifest.sources.slice(1) }));
  await assert.rejects(readRuntimeSources(baseline, directory), /Every owned runtime segment/);
});

test('source inventory rejects arbitrary retirement, duplicate mapping, and provenance tampering', async t => {
  const { directory, manifest } = await sourceFixture(t);
  const first = manifest.sources[0];
  assert.ok(first);
  const invalid = [
    { ...manifest, retiredSources: [] },
    { ...manifest, retiredSources: [...manifest.retiredSources, { id: first.id, factory: first.factory, proof: 'other' }] },
    { ...manifest, sources: [...manifest.sources, first] },
    { ...manifest, sources: [{ ...first, file: '../escape.ts' }, ...manifest.sources.slice(1)] },
    { ...manifest, baselineBlob: '0'.repeat(40) },
    { ...manifest, support: [...manifest.support, manifest.support[0]] },
    { ...manifest, support: [...manifest.support, { file: 'darwin-memory.ts', purpose: 'Reintroduced retired code' }] },
    { ...manifest, reviewedOmissions: [] },
    { ...manifest, reviewedOmissions: [{ ...manifest.reviewedOmissions[0], declarations: inventory.declarations.slice(1) }] },
    { ...manifest, reviewedOmissions: [{ ...manifest.reviewedOmissions[0], declarations: inventory.declarations.map((entry, index) => index === 0 ? { ...entry, sha256: '0'.repeat(64) } : entry) }] },
  ];
  for (const value of invalid) {
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(value));
    await assert.rejects(readRuntimeInventory(baseline, directory));
  }
});

const fixtureCapsule: CapsuleResult = {
  code: 'exports.runtimeRoot = __dirname;\n', relocations: [],
  proof: { sourceFactories: 0, retainedFactories: 0, ownedFactoriesRemoved: 0, ownedSegmentsRemoved: 0,
    ownedExportReferencesRemoved: 0, ownedImportInitializersRemoved: 0, directRegistryEdges: 0,
    boundRegistryEdges: 0, namespaceRegistryEdges: 0, literalChunkRequests: 0, directHostRequires: 0,
    privateBindings: 0, relocatedVendorInitializers: 0 },
};
async function packageFixture(t: TestContext) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon build with spaces '));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const assets = path.join(directory, 'assets');
  const output = path.join(directory, 'installed runtime');
  await mkdir(assets);
  const files: SnapshotFile[] = [];
  async function asset(filename: string, text: string, mode: SnapshotFile['mode'] = '100644'): Promise<void> {
    const bytes = Buffer.from(text);
    await writeFile(path.join(assets, filename), bytes);
    await chmod(path.join(assets, filename), Number.parseInt(mode.slice(-3), 8));
    files.push({ path: filename, size: bytes.length, sha: gitBlobHash(bytes), mode });
  }
  await asset('index.js', 'throw new Error("Original runnable bundle must not be copied");\n');
  await asset('package.json', '{"private":true}\n');
  await asset('162.index.js', 'exports.ids = [162]; exports.modules = {};\n');
  await asset('NOTICE', 'Original vendor notice, unchanged.\n');
  await asset('exec-daemon', '#!/bin/sh\nexit 17\n', '100755');
  const compiled = new Map<string, Uint8Array>([
    ['runtime-entry.cjs', await readFile(new URL('../src/runtime-entry.cjs', import.meta.url))],
    ['runtime-entry.cjs.map', await readFile(new URL('../src/runtime-entry.cjs.map', import.meta.url))],
    ['runtime/index.js', Buffer.from('export async function main(argv) { if (argv[2] === "reject") throw new Error("fixture rejection"); console.log(JSON.stringify({ args: argv.slice(2), module: import.meta.url })); }\n')],
    ['runtime/index.js.map', Buffer.from('{"version":3,"sources":[],"names":[],"mappings":""}\n')],
  ]);
  const snapshot = { files, tree: gitTreeHash(files) };
  return { directory, assets, output, snapshot, compiled, plan: planRuntimeBuild(snapshot, compiled, fixtureCapsule, assets) };
}

test('normal-module packaging preserves assets/notices/modes and never copies the old runnable bundle', async t => {
  const fixture = await packageFixture(t);
  await materializeRuntimeBuild(fixture.plan, fixture.output);
  await verifyRuntimeBuild(fixture.plan, fixture.output);
  assert.deepEqual(await readFile(path.join(fixture.output, 'index.js')), fixture.compiled.get('runtime-entry.cjs'));
  assert.equal(await readFile(path.join(fixture.output, 'NOTICE'), 'utf8'), 'Original vendor notice, unchanged.\n');
  assert.equal(await readFile(path.join(fixture.output, 'app/package.json'), 'utf8'), '{"private":true,"type":"module"}\n');
  assert.ok(!fixture.plan.files.some(file => file.path === 'app/runtime-entry.cjs'));
  assert.equal(fixture.plan.files.filter(file => file.kind === 'capsule').length, 1);
  assert.ok(fixture.plan.files.some(file => file.path === 'app/runtime/index.js'));
  assert.match(await readFile(path.join(fixture.output, 'runtime-entry.cjs.map'), 'utf8'), /\.\.\/\.\.\/src\/runtime-entry\.cts/);
});

test('the strictly compiled root bootstrap loads real ESM from unrelated cwd and a path with spaces', async t => {
  const fixture = await packageFixture(t);
  await materializeRuntimeBuild(fixture.plan, fixture.output);
  const entry = path.join(fixture.output, 'index.js');
  const good = spawnSync(process.execPath, ['--no-addons', entry, 'one', 'two words'], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 10_000 });
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /"args":\["one","two words"\]/);
  assert.match(good.stdout, /app\/runtime\/index.js/);
  const rejected = spawnSync(process.execPath, ['--no-addons', entry, 'reject'], { cwd: os.tmpdir(), encoding: 'utf8', timeout: 10_000 });
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /fixture rejection/);
});

test('complete output verification rejects orphaned old code, missing files, changed bytes, modes, and symlinks', async t => {
  const fixture = await packageFixture(t);
  await materializeRuntimeBuild(fixture.plan, fixture.output);
  const extra = path.join(fixture.output, 'app/runtime/darwin-memory.js');
  await writeFile(extra, 'export class OldOwnedCode {}');
  await assert.rejects(verifyRuntimeBuild(fixture.plan, fixture.output), /Unexpected built runtime files/);
  await rm(extra);
  const notice = path.join(fixture.output, 'NOTICE');
  await writeFile(notice, 'tampered');
  await assert.rejects(verifyRuntimeBuild(fixture.plan, fixture.output), /content changed/);
  await materializeRuntimeBuild(fixture.plan, fixture.output);
  await chmod(notice, 0o600);
  await assert.rejects(verifyRuntimeBuild(fixture.plan, fixture.output), /mode changed/);
  await materializeRuntimeBuild(fixture.plan, fixture.output);
  await rm(notice);
  await assert.rejects(verifyRuntimeBuild(fixture.plan, fixture.output), { code: 'ENOENT' });
  await symlink(path.join(fixture.assets, 'NOTICE'), notice);
  await assert.rejects(verifyRuntimeBuild(fixture.plan, fixture.output), /symlink/);
});

test('known separately provisioned tools stay untouched and outside artifact verification', async t => {
  const fixture = await packageFixture(t);
  await mkdir(path.join(fixture.output, 'tools'), { recursive: true });
  await mkdir(path.join(fixture.output, 'tmux-root/bin'), { recursive: true });
  await writeFile(path.join(fixture.output, 'node'), 'externally provisioned node');
  await writeFile(path.join(fixture.output, 'cursor-agent-store-fuse'), 'externally provisioned agent store');
  await symlink(path.join(fixture.output, 'node'), path.join(fixture.output, 'gh'));
  await writeFile(path.join(fixture.output, 'tools/origin'), 'externally provisioned tool');
  await writeFile(path.join(fixture.output, 'tmux-root/bin/tmux'), 'externally provisioned tmux');
  await materializeRuntimeBuild(fixture.plan, fixture.output);
  await verifyRuntimeBuild(fixture.plan, fixture.output);
  assert.equal(await readFile(path.join(fixture.output, 'node'), 'utf8'), 'externally provisioned node');
  assert.equal(await readFile(path.join(fixture.output, 'cursor-agent-store-fuse'), 'utf8'), 'externally provisioned agent store');
  await writeFile(path.join(fixture.output, 'tools/unexpected'), 'unlisted');
  await assert.rejects(verifyRuntimeBuild(fixture.plan, fixture.output), /Unexpected built runtime files/);
});

test('planning and copying fail closed on missing entrypoints, collisions, unsafe output paths, and changed assets', async t => {
  const fixture = await packageFixture(t);
  assert.throws(() => planRuntimeBuild(fixture.snapshot, new Map<string, Uint8Array>(), fixtureCapsule, fixture.assets), /Incomplete normal-module/);
  const collision = new Map(fixture.compiled).set('package.json', Buffer.from('{}'));
  assert.throws(() => planRuntimeBuild(fixture.snapshot, collision, fixtureCapsule, fixture.assets), /Unsupported compiler output/);
  const escaped = new Map(fixture.compiled).set('../escape.js', Buffer.from(''));
  assert.throws(() => planRuntimeBuild(fixture.snapshot, escaped, fixtureCapsule, fixture.assets), /Unsafe relative path/);
  await writeFile(path.join(fixture.assets, 'NOTICE'), 'changed after planning');
  await assert.rejects(materializeRuntimeBuild(fixture.plan, fixture.output), /Build input changed while copying/);
});
