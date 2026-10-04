import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { lstat, mkdir, mkdtemp, readFile, readdir, readlink, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assertNoOwnedFactories, buildVendorCapsule, capsuleDeclaration, extractVendorCapsule, privateBindings, readCapsuleSources } from '../tools/lib/vendor-capsule.js';
import type { CapsuleSources } from '../tools/lib/vendor-capsule.js';
import { gitBlobHash, root, runtimeRoot } from '../tools/lib/project.js';

const sources = await readCapsuleSources();
const extracted = extractVendorCapsule(sources);
const sharedMarker = ';// ../context-rpc/dist/index.js\n';
function changedMain(before: string, after: string): CapsuleSources {
  assert.equal(sources.main.split(before).length, 2, 'fixture must replace exactly one pinned location');
  return { ...sources, main: sources.main.replace(before, after) };
}
function inShared(statement: string): CapsuleSources {
  return changedMain(sharedMarker, `${sharedMarker}${statement}\n`);
}

test('vendor capsule removes every owned body and original registry identity', () => {
  assert.deepEqual(extracted.proof, {
    sourceFactories: 1071, retainedFactories: 1053, ownedFactoriesRemoved: 21, ownedSegmentsRemoved: 64,
    ownedExportReferencesRemoved: 45, ownedImportInitializersRemoved: 35,
    directRegistryEdges: 3328, boundRegistryEdges: 18, namespaceRegistryEdges: 10,
    literalChunkRequests: 14, directHostRequires: 63, privateBindings: 22, relocatedVendorInitializers: 56,
  });
  assert.doesNotMatch(extracted.code, /^\/\*\*\*\/ "\.\/src\//m);
  assert.doesNotMatch(extracted.code, /^;\/\/ \.\/src\//m);
  assert.doesNotMatch(extracted.code, /var __webpack_exports__ = __webpack_require__\("\.\/src\/index.ts"\)/);
  for (const name of ['server', 'setup', 'tracing']) assert.match(extracted.code, new RegExp(`"vendor-private/${name}"`));
  for (const names of Object.values(privateBindings)) for (const name of names) {
    assert.ok(extracted.code.includes(`${JSON.stringify(name)}: () => ${name}`), `exact source binding ${name}`);
  }
});

test('capsule rejects a retained lexical reference to removed owned implementation', () => {
  assert.throws(() => extractVendorCapsule(inShared('void startServer;')), /Shared-to-owned lexical backedge.*startServer/);
  assert.throws(() => extractVendorCapsule(inShared('const leak = { startServer };')), /Shared-to-owned lexical backedge.*startServer/);
});

test('capsule rejects shared use of an owned-target import initializer', () => {
  assert.throws(() => extractVendorCapsule(inShared('void artifactUploads;')), /Shared-to-owned import backedge.*artifactUploads/);
});

test('capsule rejects shared use of a reviewed relocated vendor import', () => {
  const marker = ';// ../cursor-config/dist/paths.js\n';
  assert.throws(() => extractVendorCapsule(changedMain(marker, `${marker}void node_pty;\n`)), /Unsafe vendor initializer relocation.*node_pty/);
});

test('capsule rejects dynamic registry, aliased registry, and dynamic chunk requests', () => {
  assert.throws(() => extractVendorCapsule(inShared('__webpack_require__(String("node:fs"));')), /Dynamic registry request/);
  assert.throws(() => extractVendorCapsule(inShared('const indirect = __webpack_require__;')), /Registry alias\/escape/);
  assert.throws(() => extractVendorCapsule(inShared('__webpack_require__.e(Number("731"));')), /Dynamic\/unknown chunk request/);
  assert.throws(() => extractVendorCapsule(inShared('__webpack_require__.bind(__webpack_require__, String("node:fs"));')), /Dynamic registry request/);
});

test('capsule limits computed cache access to the two exact pinned instrumentation boundaries', () => {
  for (const statement of ['void __webpack_require__.c["./src/index.ts"];', 'void ("./src/index.ts" in __webpack_require__.c);', 'void __webpack_require__.c[request];']) {
    assert.throws(() => extractVendorCapsule(inShared(statement)), /Unsupported module-cache boundary/);
  }
  const original = 'filename in __webpack_require__.c';
  assert.throws(() => extractVendorCapsule(changedMain(original, `(${original} || ${original})`)), /Unsupported module-cache boundary/);
});

test('capsule refuses a missing exact private binding instead of inventing a replacement', () => {
  assert.throws(() => extractVendorCapsule(changedMain('const ControlService = {', 'const MissingControlService = {')), /Missing retained private binding.*ControlService/);
});

test('capsule refuses owned factory reintroduction in main and numbered chunks', () => {
  const factory = '"./src/reintroduced.ts"(module) { module.exports = {}; },\n';
  assert.throws(() => assertNoOwnedFactories({ ...sources, main: extracted.code.replace('var __webpack_modules__ = ({', `var __webpack_modules__ = ({\n${factory}`) }), /Owned factory reintroduced/);
  const chunk = sources.chunks.get('162.index.js');
  assert.ok(chunk);
  const chunks = new Map(sources.chunks);
  chunks.set('162.index.js', chunk.replace('exports.modules = {', `exports.modules = {\n${factory}`));
  assert.throws(() => assertNoOwnedFactories({ main: extracted.code, chunks }), /Owned factory reintroduced/);
});

test('capsule rejects unexpected loader runtime and chunk-envelope execution', () => {
  assert.throws(() => extractVendorCapsule(changedMain('function __webpack_require__(moduleId) {', 'function __webpack_require__(moduleId) {\nrequire(moduleId);')), /Pinned Webpack loader\/startup envelope changed/);
  const chunks = new Map(sources.chunks);
  const chunk = chunks.get('162.index.js');
  assert.ok(chunk);
  chunks.set('162.index.js', `${chunk}\nrequire("./index.js");\n`);
  assert.throws(() => extractVendorCapsule({ ...sources, chunks }), /Unsupported chunk runtime envelope/);
});

test('relocation is source-bound, ordered, and excludes unknown-effect unused imports', () => {
  assert.equal(extracted.relocations.length, 56);
  assert.deepEqual(Object.fromEntries(['./src/server.ts', './src/setup.ts', './src/tracing.ts'].map(factory =>
    [factory, extracted.relocations.filter(entry => entry.factory === factory).length])),
  { './src/server.ts': 24, './src/setup.ts': 26, './src/tracing.ts': 6 });
  for (const factory of ['server', 'setup', 'tracing']) {
    const entries = extracted.relocations.filter(entry => entry.factory === `./src/${factory}.ts`);
    assert.deepEqual(entries.map(entry => entry.order), entries.map(entry => entry.order).sort((a, b) => a - b));
    for (const entry of entries) {
      assert.ok(entry.ownedConsumers.length > 0, `owned consumer is required for ${entry.binding}`);
      assert.ok(sources.main.split('\n')[entry.originalLine - 1]?.includes(entry.binding), `source line for ${entry.binding}`);
    }
  }
  assert.ok(!extracted.relocations.some(entry => entry.binding === 'canvas_skill_types_section'));
  assert.match(extracted.code, /var canvas_skill_types_section = __webpack_require__/);
  assert.ok(extracted.relocations.some(entry => entry.binding === 'node_pty'));
});

test('capsule writer rejects capsule, chunk, and metadata symlink leaves without changing external targets', async () => {
  const parent = path.join(root, '.work/module-pilot');
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(path.join(parent, 'leaf-symlinks-'));
  try {
    for (const filename of ['vendor.cjs', '162.index.js', 'package.json', 'vendor.d.cts', 'capsule-proof.json', 'capsule-relocations.json']) {
      const destination = path.join(directory, filename + '-output');
      const target = path.join(directory, filename + '-external');
      await mkdir(destination);
      await writeFile(target, 'external target must remain unchanged', { mode: 0o600 });
      const before = await lstat(target);
      const leaf = path.join(destination, filename);
      await symlink(target, leaf);
      await assert.rejects(buildVendorCapsule(destination), /Not a regular generated output/);
      assert.equal(await readFile(target, 'utf8'), 'external target must remain unchanged', filename);
      assert.equal((await lstat(target)).mode, before.mode, filename);
      assert.equal(await readlink(leaf), target, filename);
      assert.deepEqual(await readdir(destination), [filename], 'preflight must prevent partial output');
    }
    const danglingOutput = path.join(directory, 'dangling-output');
    const absentTarget = path.join(directory, 'absent-external');
    await mkdir(danglingOutput);
    await symlink(absentTarget, path.join(danglingOutput, 'vendor.cjs'));
    await assert.rejects(buildVendorCapsule(danglingOutput), /Not a regular generated output/);
    await assert.rejects(lstat(absentTarget), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('capsule writer atomically replaces regular output leaves and preserves pinned assets', async () => {
  const parent = path.join(root, '.work/module-pilot');
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(path.join(parent, 'regular-output-'));
  try {
    await writeFile(path.join(directory, 'vendor.cjs'), 'stale capsule', { mode: 0o600 });
    await writeFile(path.join(directory, '162.index.js'), 'stale chunk');
    await writeFile(path.join(directory, 'package.json'), 'stale metadata');
    assert.deepEqual(await buildVendorCapsule(directory), extracted.proof);
    assert.equal(await readFile(path.join(directory, 'vendor.cjs'), 'utf8'), extracted.code);
    assert.equal(await readFile(path.join(directory, 'vendor.d.cts'), 'utf8'), capsuleDeclaration);
    assert.equal(await readFile(path.join(directory, 'capsule-proof.json'), 'utf8'), JSON.stringify(extracted.proof, null, 2) + '\n');
    assert.equal(await readFile(path.join(directory, 'capsule-relocations.json'), 'utf8'), JSON.stringify(extracted.relocations, null, 2) + '\n');
    for (const [filename, bytes] of sources.chunks) assert.equal(await readFile(path.join(directory, filename), 'utf8'), bytes);
    assert.deepEqual(await readFile(path.join(directory, 'package.json')), await readFile(path.join(runtimeRoot, 'package.json')));
    const filenames = [...sources.chunks.keys(), 'package.json', 'vendor.cjs', 'vendor.d.cts', 'capsule-proof.json', 'capsule-relocations.json'];
    assert.deepEqual((await readdir(directory)).sort(), filenames.sort(), 'no temporary siblings remain');
    for (const filename of filenames) {
      const stat = await lstat(path.join(directory, filename));
      assert.ok(stat.isFile() && !stat.isSymbolicLink(), filename);
      if (process.platform !== 'win32') assert.equal(stat.mode & 0o777, 0o644, filename);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('normal CJS imports preserve Commander/context/private identities without owned or native execution', async () => {
  const directory = path.join(root, '.work/module-pilot/capsule-test');
  await mkdir(directory, { recursive: true });
  const filename = path.join(directory, 'vendor.cjs');
  await writeFile(filename, extracted.code);
  await writeFile(path.join(directory, 'vendor.d.cts'), capsuleDeclaration);
  const script = `
const assert = require('node:assert/strict');
const attempted = [];
process.dlopen = () => { attempted.push('native'); throw new Error('Native loading forbidden'); };
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function(request, ...args) {
  if (typeof request === 'string' && (request.endsWith('.node') || /[0-9]+[.]index[.]js$/.test(request))) {
    attempted.push(request); throw new Error('Native/chunk loading forbidden during import proof');
  }
  return originalLoad.call(this, request, ...args);
};
const net = require('node:net');
net.Socket.prototype.connect = () => { attempted.push('socket'); throw new Error('Network forbidden'); };
for (const name of ['createServer', 'connect', 'createConnection']) net[name] = () => { attempted.push(name); throw new Error('Network forbidden'); };
for (const id of ['node:fs', 'node:fs/promises']) {
  const fs = require(id);
  for (const method of ['writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'mkdir', 'mkdirSync', 'rm', 'rmSync', 'unlink', 'unlinkSync', 'rename', 'renameSync', 'createWriteStream']) {
    if (typeof fs[method] === 'function') fs[method] = () => { attempted.push(id + '.' + method); throw new Error('Filesystem mutation forbidden'); };
  }
}
for (const [id, methods] of [['node:child_process', ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork']], ['node:http', ['request', 'get', 'createServer']], ['node:https', ['request', 'get', 'createServer']]]) {
  const value = require(id);
  for (const method of methods) value[method] = () => { attempted.push(id + '.' + method); throw new Error('External operation forbidden'); };
}
const initialHandlers = process.listenerCount('uncaughtException') + process.listenerCount('unhandledRejection');
const capsule = require(${JSON.stringify(filename)});
assert.equal(capsule.runtimeRoot, ${JSON.stringify(directory)});
assert.equal(initialHandlers, process.listenerCount('uncaughtException') + process.listenerCount('unhandledRejection'));
const commander = capsule.loadCommander();
assert.strictEqual(commander, capsule.loadCommander());
assert.equal(new commander.Command('probe').name(), 'probe');
assert.equal(new commander.Option('--test').long, '--test');
const context = capsule.loadContext();
assert.strictEqual(context, capsule.loadContext());
const key = context.createContextKey(Symbol('probe'), 1);
assert.equal(context.createContext().with(key, 7).get(key), 7);
assert.throws(() => capsule.loadVendor('./src/index.ts'), /vendor factory/);
assert.throws(() => capsule.loadVendor('./src/setup.ts'), /vendor factory/);
assert.throws(() => capsule.loadVendor('missing'), /vendor factory/);
const server = capsule.loadPrivate('server');
assert.strictEqual(server, capsule.loadServerPrivate());
assert.strictEqual(server.ExecService.methods.exec.O, server.ExecStreamElement);
assert.strictEqual(server.ExecService.methods.readFile.I, server.ReadFileRequest);
assert.strictEqual(server.ExecService.methods.readFile.O, server.ReadFileResponse);
const message = new server.ReadFileResponse({ payload: { case: 'chunk', value: Uint8Array.of(1, 2) } });
assert.ok(server.ReadFileResponse.fromBinary(message.toBinary()) instanceof server.ReadFileResponse);
const setup = capsule.loadPrivate('setup');
assert.strictEqual(setup, capsule.loadSetupPrivate());
assert.equal(typeof setup.CliHooksExecutor, 'function');
assert.equal(typeof setup.HooksConfigLoader, 'function');
assert.equal(typeof setup.NodeFileReader, 'function');
const tracing = capsule.loadPrivate('tracing');
assert.strictEqual(tracing, capsule.loadTracingPrivate());
assert.equal(tracing.resourceFromAttributes({ proof: 'yes' }).attributes.proof, 'yes');
assert.deepEqual(attempted, []);
console.log('capsule-normal-import-ok');
`;
  const scriptFile = path.join(directory, 'normal-import-proof.cjs');
  await writeFile(scriptFile, script);
  const child = spawnSync(process.execPath, ['--no-addons', scriptFile], { encoding: 'utf8', timeout: 15_000 });
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /capsule-normal-import-ok/);
  // This check verifies the file actually executed is the deterministic output.
  assert.equal(gitBlobHash(await readFile(filename)), gitBlobHash(Buffer.from(extracted.code)));
});
