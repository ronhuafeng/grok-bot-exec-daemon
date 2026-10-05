import assert from 'node:assert/strict';
import vm from 'node:vm';
import { afterEach, mock } from 'node:test';
import { readBaseline, ownedSegments } from '../../tools/lib/bundle.js';
import { baselineBindings } from '../fixtures/baseline-bindings.js';
import { localExecPorts, childProcessPorts, setupPrivatePorts, cursorPluginPorts, unexpectedOperation } from '../fixtures/native-boundaries.js';

const baseline = await readBaseline();
const segments = ownedSegments(baseline);
const runtimeUrl = new URL('../../src/runtime/', import.meta.url);
const restorations: { restore(): void }[] = [];
let sequence = 0;
function restoreCandidate(): void {
  for (const item of restorations.splice(0).reverse()) item.restore();
}
afterEach(restoreCandidate);
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Only the immutable baseline uses lexical compiler ABI. Candidate fixtures
 * name real module specifiers and semantic exports, and never call this bridge. */
function baselineGlobals(name: string, fixture: Record<string, unknown>): Record<string, unknown> {
  const result = Object.fromEntries(Object.entries(fixture).filter(([name]) => !name.startsWith('.') && !name.startsWith('node:')));
  for (const binding of baselineBindings[name] ?? []) {
    const value = fixture[binding.module];
    const exports = binding.exports ?? {};
    const hasReexportFixture = Object.values(exports).some(source =>
      typeof source !== 'string' && record(fixture[source.module]));
    if (value === undefined && !hasReexportFixture) continue;
    if (binding.kind === 'default') result[binding.old] = () => value;
    else if (binding.kind === 'owned' || binding.kind === 'private') result[binding.old] = record(value) && binding.name ? value[binding.name] : undefined;
    else if (binding.module.startsWith('node:')) result[binding.old] = value;
    else if (record(value) || hasReexportFixture) {
      const namespace: Record<string, unknown> = {};
      for (const [raw, source] of Object.entries(exports)) {
        Object.defineProperty(namespace, raw, { enumerable: true, get: () => {
          const module = typeof source === 'string' ? value : fixture[source.module];
          const name = typeof source === 'string' ? source : source.name;
          assert.ok(record(module) && name in module, `Missing baseline fixture export: ${typeof source === 'string' ? binding.module : source.module}#${name} (${binding.old}.${raw})`);
          return module[name];
        } });
      }
      result[binding.old] = namespace;
    }
  }
  return result;
}

function fixtureGlobals(fixture: Record<string, unknown>): void {
  const proc = fixture.process;
  if (record(proc)) {
    if (record(proc.env)) restorations.push(mock.property(process, 'env', proc.env as NodeJS.ProcessEnv).mock);
    if (typeof proc.execPath === 'string') restorations.push(mock.property(process, 'execPath', proc.execPath).mock);
    if (typeof proc.version === 'string') restorations.push(mock.property(process, 'version', proc.version as typeof process.version).mock);
    if (typeof proc.pid === 'number') restorations.push(mock.property(process, 'pid', proc.pid).mock);
    if (Array.isArray(proc.argv)) restorations.push(mock.property(process, 'argv', proc.argv as string[]).mock);
    if (typeof proc.cwd === 'function') restorations.push(mock.method(process, 'cwd', proc.cwd as () => string).mock);
  }
  const clock = fixture.Date;
  if (record(clock) && typeof clock.now === 'function') restorations.push(mock.method(Date, 'now', clock.now as () => number).mock);
  const output = fixture.console;
  if (record(output)) for (const name of ['log', 'warn', 'error'] as const) {
    if (typeof output[name] === 'function') restorations.push(mock.method(console, name, output[name] as typeof console[typeof name]).mock);
  }
  for (const name of ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] as const) {
    const value = fixture[name];
    if (typeof value === 'function' && value !== globalThis[name]) restorations.push(mock.method(globalThis, name, value as typeof globalThis[typeof name]).mock);
  }
}

/** Native module loading is authoritative. Standard node:test mocks substitute
 * explicitly named service/platform ports; no candidate source is read/evaluated. */
async function loadCandidate(name: string, fixture: Record<string, unknown>): Promise<Record<string, unknown>> {
  restorations.push(mock.method(process, 'dlopen', unexpectedOperation).mock);
  const modules: Record<string, unknown> = {
    '../interop/vendor/local-exec.js': localExecPorts,
    '../interop/vendor/node-pty.js': { spawn: unexpectedOperation },
    '../interop/vendor/setup-private.js': setupPrivatePorts,
    '../interop/vendor/cursor-plugins.js': cursorPluginPorts,
    'node:child_process': childProcessPorts,
    ...Object.fromEntries(Object.entries(fixture).filter(([key]) => key.startsWith('.') || key.startsWith('node:'))),
  };
  // First establish the denied native/platform boundaries, before loading any
  // real retained vendor facade used for a partial semantic mock.
  for (const key of ['../interop/vendor/local-exec.js', '../interop/vendor/node-pty.js', '../interop/vendor/setup-private.js', '../interop/vendor/cursor-plugins.js', 'node:child_process']) {
    const base = key.endsWith('local-exec.js') ? localExecPorts : key === 'node:child_process' ? childProcessPorts : key.endsWith('setup-private.js') ? setupPrivatePorts : key.endsWith('cursor-plugins.js') ? cursorPluginPorts : { spawn: unexpectedOperation };
    const value = modules[key];
    assert.ok(record(value), `module fixture ${key}`);
    const exports = { ...base, ...value };
    restorations.push(mock.module(key.startsWith('node:') ? key : new URL(key, runtimeUrl), { namedExports: exports, defaultExport: exports }));
    delete modules[key];
  }
  for (const [specifier, value] of Object.entries(modules)) {
    assert.ok(record(value), `module fixture ${specifier}`);
    const url = specifier.startsWith('node:') ? specifier : new URL(specifier, runtimeUrl);
    // Partial mocks of retained vendor facades preserve all other exact exports.
    // Owned and builtin overrides are intentionally only the ports the test names.
    const base: Record<string, unknown> = specifier.startsWith('../interop/vendor/') ? await import(String(url)) : {};
    const exports = { ...base, ...value };
    restorations.push(mock.module(url, { namedExports: exports, defaultExport: exports }));
  }
  if (typeof fixture.__dirname === 'string') restorations.push(mock.module(new URL('./runtime-location.js', runtimeUrl), { namedExports: { runtimeRoot: fixture.__dirname } }));
  fixtureGlobals(fixture);
  const url = new URL(`${name}.js`, runtimeUrl);
  url.searchParams.set('fixture', String(sequence++));
  return await import(url.href) as Record<string, unknown>;
}

/** The baseline half alone evaluates a pinned source slice. The candidate half
 * imports its actual compiled file and checks the requested semantic exports. */
export async function loadOwnedSegmentSide(name: string, exportNames: readonly string[], fixture: Record<string, unknown>, side: 'baseline' | 'typed'): Promise<Record<string, unknown>> {
  restoreCandidate();
  assert.equal(new Set(exportNames).size, exportNames.length, 'duplicate selected binding');
  for (const exportName of exportNames) assert.match(exportName, /^[A-Za-z_$][\w$]*$/);
  if (side === 'typed') {
    const module = await loadCandidate(name, fixture);
    for (const name of exportNames) assert.ok(name in module, `actual candidate export ${name}`);
    return Object.fromEntries(exportNames.map(name => [name, module[name]]));
  }
  const segment = segments.find(candidate => candidate.id === `./src/${name}.ts`);
  assert.ok(segment, `pinned baseline segment ${name}`);
  const script = new vm.Script(`${segment.text}\n;({${exportNames.join(',')}})`, { filename: `baseline:${name}.js` });
  const raw: unknown = script.runInNewContext(baselineGlobals(name, fixture), { timeout: 2000 });
  assert.ok(record(raw));
  assert.deepEqual(Object.keys(raw).sort(), [...exportNames].sort());
  return raw;
}
export async function loadOwnedSegment(name: string, exportNames: readonly string[], fixture: Record<string, unknown> = {}): Promise<{ baseline: Record<string, unknown>; typed: Record<string, unknown> }> {
  return { baseline: await loadOwnedSegmentSide(name, exportNames, fixture, 'baseline'), typed: await loadOwnedSegmentSide(name, exportNames, fixture, 'typed') };
}
export function normalized(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (_key, item: unknown) => typeof item === 'bigint' ? `${item}n` : item)) as unknown;
}
export function assertFunctionBindings(value: Record<string, unknown>, names: readonly string[]): void {
  for (const name of names) assert.equal(typeof value[name], 'function', `expected callable binding: ${name}`);
}
