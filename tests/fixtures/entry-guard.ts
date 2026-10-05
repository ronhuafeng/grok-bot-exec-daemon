/** Runs only CLI construction/help or a forced parser result in a disposable child.
 * All native code and live filesystem/network/process effects are replaced or denied. */
import fs from 'node:fs';
import path from 'node:path';
import moduleApi, { createRequire, syncBuiltinESMExports } from 'node:module';
import { fileURLToPath } from 'node:url';

const hostRequire = createRequire(import.meta.url);
const fixture = process.argv[2];
const side = process.argv[3];
const scenario = process.argv[4];
if (fixture === undefined || !['baseline', 'candidate'].includes(side ?? '') || scenario === undefined) throw new Error('Missing fixture arguments');
const root = path.resolve(fixture);
const events: string[][] = [];
const originalOn = process.on.bind(process);
const originalRead = fs.readFileSync;
const originalOpen = fs.openSync;
const originalExists = fs.existsSync;
const originalStat = fs.statSync;
const originalRealpath = fs.realpathSync;
const originalPromiseRead = fs.promises.readFile;
const originalLoad: unknown = Reflect.get(moduleApi, '_load');
if (typeof originalLoad !== 'function') throw new Error('Missing Node CJS loader fixture boundary');

function inside(value: unknown): boolean {
  const name = value instanceof URL ? fileURLToPath(value) : value;
  return typeof name === 'string' && (path.resolve(name) === root || path.resolve(name).startsWith(root + path.sep));
}
function missing(value: unknown): NodeJS.ErrnoException {
  return Object.assign(new Error('Fixture has no external path'), { code: 'ENOENT', path: String(value) });
}
function denied(name: string): () => never {
  return () => { events.push(['forbidden', name]); throw new Error(`Forbidden fixture operation: ${name}`); };
}
function replace(target: object, key: PropertyKey, value: unknown): void {
  Object.defineProperty(target, key, { configurable: true, writable: true, value });
}
replace(fs, 'readFileSync', (file: fs.PathOrFileDescriptor, options?: BufferEncoding | { encoding?: BufferEncoding | null; flag?: string } | null): Buffer | string => {
  if (inside(file)) return originalRead(file, options);
  events.push(['read', String(file)]); throw missing(file);
});
replace(fs, 'openSync', (file: fs.PathLike, flags: fs.OpenMode, mode?: fs.Mode): number => {
  if (inside(file) && (flags === 'r' || flags === 0)) return originalOpen(file, flags, mode);
  return denied('fs.openSync')();
});
replace(fs, 'existsSync', (file: fs.PathLike): boolean => {
  if (scenario === 'polished-present' && path.basename(String(file)) === 'polished-renderer.node') {
    events.push(['exists', 'polished-renderer.node']); return true;
  }
  if (inside(file)) return originalExists(file);
  events.push(['exists', String(file)]); return false;
});
replace(fs, 'statSync', (file: fs.PathLike): fs.Stats => {
  if (inside(file)) return originalStat(file);
  events.push(['stat', String(file)]); throw missing(file);
});
const realpath = (file: fs.PathLike): string => {
  if (inside(file)) return originalRealpath(file);
  throw missing(file);
};
replace(realpath, 'native', realpath);
replace(fs, 'realpathSync', realpath);
replace(fs.promises, 'readFile', async (file: fs.PathLike, options?: BufferEncoding): Promise<Buffer | string> => {
  if (inside(file)) return originalPromiseRead(file, options);
  events.push(['read', String(file)]); throw missing(file);
});
for (const key of ['writeFile', 'appendFile', 'unlink', 'mkdir', 'rm', 'rename', 'open', 'truncate', 'chmod', 'chown', 'cp', 'mkdtemp', 'rmdir', 'link', 'symlink', 'utimes']) {
  replace(fs, key, denied(`fs.${key}`));
  if (key !== 'open') replace(fs, `${key}Sync`, denied(`fs.${key}Sync`));
  replace(fs.promises, key, denied(`fs.promises.${key}`));
}
for (const key of ['createWriteStream', 'createReadStream']) replace(fs, key, denied(`fs.${key}`));
// Async reads and metadata APIs must not escape the disposable source fixture.
for (const target of [fs, fs.promises]) {
  for (const key of ['readFile', 'stat', 'lstat', 'readdir', 'readlink', 'realpath', 'access', 'opendir']) {
    const original: unknown = Reflect.get(target, key);
    if (typeof original !== 'function') continue;
    replace(target, key, (file: unknown, ...args: unknown[]): unknown => {
      if (inside(file)) return Reflect.apply(original, target, [file, ...args]) as unknown;
      events.push(['read-api', key, String(file)]);
      throw missing(file);
    });
  }
}
for (const key of ['watch', 'watchFile']) replace(fs, key, denied(`fs.${key}`));

for (const [name, keys] of [
  ['node:child_process', ['exec', 'execFile', 'execSync', 'execFileSync', 'spawn', 'spawnSync', 'fork']],
  ['node:net', ['connect', 'createConnection', 'createServer']],
  ['node:tls', ['connect', 'createServer']],
  ['node:http', ['request', 'get', 'createServer']],
  ['node:https', ['request', 'get', 'createServer']],
  ['node:dgram', ['createSocket']],
  ['node:dns', ['lookup', 'resolve']],
] as const) {
  const dependency: unknown = hostRequire(name);
  if ((typeof dependency !== 'object' && typeof dependency !== 'function') || dependency === null) throw new Error(`Invalid builtin ${name}`);
  for (const key of keys) replace(dependency, key, denied(`${name}.${key}`));
}
const net: typeof import('node:net') = hostRequire('node:net') as typeof import('node:net');
replace(net.Server.prototype, 'listen', denied('net.Server.listen'));
replace(net.Socket.prototype, 'connect', denied('net.Socket.connect'));
replace(globalThis, 'fetch', denied('fetch'));
replace(process, 'kill', denied('process.kill'));
replace(process, 'dlopen', (holder: { exports: unknown }, filename: string): void => {
  events.push(['native', path.basename(filename)]);
  if (scenario === 'native-failure') throw new Error('native fixture unavailable');
  if (scenario === 'polished-present' && path.basename(filename) === 'polished-renderer.node') {
    holder.exports = { renderFromPlanNative: denied('polished render') }; return;
  }
  if (path.basename(filename) !== 'pty.node') throw new Error('Unexpected native fixture');
  holder.exports = { fork: denied('pty.fork'), open: denied('pty.open'), resize: denied('pty.resize'), process: denied('pty.process') };
});
replace(process, 'on', (event: string | symbol, ...args: unknown[]): unknown => {
  events.push(['handler', String(event)]);
  return Reflect.apply(originalOn, process, [event, ...args]) as unknown;
});
replace(moduleApi, '_load', function (this: unknown, request: string, ...args: unknown[]): unknown {
  if (request === 'tree-sitter') {
    events.push(['external', request]);
    return class Parser { constructor() { denied('tree-sitter construction')(); } };
  }
  if (request === 'tree-sitter-bash') { events.push(['external', request]); return Object.freeze({}); }
  return Reflect.apply(originalLoad, this, [request, ...args]) as unknown;
});
syncBuiltinESMExports();
originalOn('exit', code => { process.stderr.write(`\nENTRY_EVENTS ${JSON.stringify({ code, events })}\n`); });

const command = scenario === 'serve-help' ? ['serve', '--help'] : scenario === 'missing-token' ? ['serve'] : ['--help'];
process.argv = [process.execPath, path.join(root, side === 'baseline' ? 'baseline.cjs' : 'index.js'), ...command];
interface CommanderBoundary { uB: { prototype: { parseAsync(): Promise<unknown> } }; }
interface BaselineRequire { (id: string): unknown; }
const commanderId = '../../node_modules/.pnpm/@commander-js+extra-typings@14.0.0_commander@15.0.0/node_modules/@commander-js/extra-typings/esm.mjs';
let baselineRequire: BaselineRequire | undefined;
if (scenario === 'parse-reject' || scenario === 'parse-resolve') {
  let commander: unknown;
  if (side === 'baseline') {
    const value: unknown = hostRequire(path.join(root, 'baseline-registry.cjs'));
    if (typeof value !== 'function') throw new Error('Invalid baseline registry fixture');
    baselineRequire = value as BaselineRequire;
    commander = baselineRequire(commanderId);
  } else {
    const capsule: unknown = hostRequire(path.join(root, 'vendor.cjs'));
    if (typeof capsule !== 'object' || capsule === null || !('loadVendor' in capsule) || typeof capsule.loadVendor !== 'function') throw new Error('Invalid capsule fixture');
    commander = Reflect.apply(capsule.loadVendor, capsule, [commanderId]) as unknown;
  }
  if (typeof commander !== 'object' || commander === null || !('uB' in commander) || typeof commander.uB !== 'function') throw new Error('Invalid Commander fixture');
  const parser = commander as CommanderBoundary;
  parser.uB.prototype.parseAsync = () => {
    events.push(['parse']);
    return scenario === 'parse-reject' ? Promise.reject(new Error('parser fixture rejection')) : Promise.resolve(undefined);
  };
}
if (baselineRequire !== undefined) baselineRequire('./src/index.ts');
else hostRequire(process.argv[1]);
