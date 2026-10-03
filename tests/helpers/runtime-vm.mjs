import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { readFactories, wrapFactory } from '../../tools/lib/bundle.mjs';
import { runtimeRoot } from '../../tools/lib/project.mjs';

const hostRequire = createRequire(import.meta.url);
const baseline = await readFile(path.join(runtimeRoot, 'index.js'), 'utf8');
const startup = '/******/ \tvar __webpack_exports__ = __webpack_require__("./src/index.ts");';
const trailer = `${startup}\n/******/ \t\n/******/ })()\n;`;

// Fail closed if the pinned Webpack entry changes. Never execute index.ts, a
// daemon action, an asynchronous chunk, or a native addon to test CLI parsing.
assert.equal(baseline.split(startup).length, 2, 'expected exactly one startup line');
assert.ok(baseline.endsWith(trailer), 'expected the exact final Webpack startup');
const bootstrap = new vm.Script(baseline.replace(startup,
  '/******/ \tglobalThis.__testWebpackRequire = __webpack_require__;'),
{ filename: 'test-only-webpack-bootstrap.js' });

const factories = await readFactories();
const factoryScripts = [...factories].map(([id, text]) => [id,
  new vm.Script(wrapFactory(text), { filename: `recovered:${id}` })]);

const deny = (operation) => () => { throw new Error(`Forbidden test operation: ${operation}`); };
const blockedModule = (id) => new Proxy(Object.create(null), {
  get: (_target, name) => deny(`${id}.${String(name)}`),
});

export function loadRecoveredRuntime({ env = {}, execPath = '/fixture/bundle with spaces/node' } = {}) {
  const output = { stdout: '', stderr: '' };
  const fakeProcess = {
    env: { ...env }, execPath, platform: 'linux', argv: [execPath, '/fixture/index.js'],
    execArgv: [], versions: {}, exit: deny('process.exit'), on: deny('process.on'),
    stdout: { isTTY: false, write: (value) => { output.stdout += value; return true; } },
    stderr: { isTTY: false, write: (value) => { output.stderr += value; return true; } },
  };
  const externals = new Set();
  const safeBuiltins = new Set(['node:events', 'node:path', 'node:url', 'node:util']);
  const context = vm.createContext({
    process: fakeProcess,
    __filename: '/fixture/index.js',
    require(id) {
      externals.add(id);
      if (id === 'node:process') return fakeProcess;
      if (id === 'node:fs' || id === 'node:child_process') return blockedModule(id);
      if (!safeBuiltins.has(id)) throw new Error(`Forbidden external require: ${id}`);
      return hostRequire(id);
    },
  });
  bootstrap.runInContext(context, { timeout: 5000 });
  const webpackRequire = context.__testWebpackRequire;
  assert.deepEqual(Object.keys(webpackRequire.c), [], 'bootstrap must not run the entrypoint');

  // Evaluate maintained factories in the SAME realm as the bundled libraries.
  // Requiring the baseline alone would silently ignore future src/ edits.
  for (const [id, script] of factoryScripts) {
    const originalFactory = webpackRequire.m[id];
    context.module = { exports: {} };
    script.runInContext(context, { timeout: 5000 });
    assert.deepEqual(Object.keys(context.module.exports), [id]);
    webpackRequire.m[id] = context.module.exports[id];
    assert.notEqual(webpackRequire.m[id], originalFactory);
  }
  delete context.module;
  delete context.__testWebpackRequire;

  return {
    require: webpackRequire,
    process: fakeProcess,
    output,
    externals,
    loadedIds: () => Object.keys(webpackRequire.c),
  };
}

// Cross-realm objects have distinct prototypes. Convert JSON-compatible
// results before strict comparisons rather than weakening assertions.
export const plain = (value) => JSON.parse(JSON.stringify(value));
