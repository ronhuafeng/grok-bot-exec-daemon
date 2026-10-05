import test from 'node:test';
import assert from 'node:assert/strict';
import { RingBuffer } from '../src/runtime/ring-buffer.js';
import { parseCommaSeparatedNames as parse } from '../src/runtime/comma-separated-names.js';
import { prependExecDaemonBundleToPath as prependBundle, prependExecDaemonGatedToolsToPath as prependGated } from '../src/runtime/bundledToolPath.js';
import { createServeCommand, collectUnknownServeOptions } from '../src/runtime/serveCommand.js';
import { Command, Option } from '../src/interop/vendor/commander.js';
const plain = (value: unknown): unknown => value;

test('ordinary modules construct the exact retained Commander and Option classes', () => {
  const command = createServeCommand();
  assert.ok(command instanceof Command);
  assert.ok(command.options.every(option => option instanceof Option));
});

test('ring buffer retains the latest capacity items in chronological order through multiple wraps', () => {
  const buffer = new RingBuffer<unknown>(3);
  assert.equal(buffer.size, 0);
  assert.deepEqual(plain(buffer.toArray()), []);
  for (const value of [1, 2]) buffer.push(value);
  assert.equal(buffer.size, 2);
  assert.deepEqual(plain(buffer.toArray()), [1, 2]);
  for (const value of [3, 4, 5, 6, 7]) buffer.push(value);
  assert.equal(buffer.size, 3);
  assert.deepEqual(plain(buffer.toArray()), [5, 6, 7]);
  const copy = buffer.toArray();
  copy.push(999);
  assert.deepEqual(plain(buffer.toArray()), [5, 6, 7]);
});

test('ring buffer sliceAfter handles a match, newest item, and an absent cursor', () => {
  const buffer = new RingBuffer<{ id: string }>(3);
  for (const id of ['evicted', 'a', 'b', 'c']) buffer.push({ id });
  assert.deepEqual(plain(buffer.sliceAfter((item) => item.id === 'b')), [{ id: 'c' }]);
  assert.deepEqual(plain(buffer.sliceAfter((item) => item.id === 'c')), []);
  assert.deepEqual(plain(buffer.sliceAfter((item) => item.id === 'evicted')), [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  assert.deepEqual(plain(buffer.toArray()), [{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
});

test('ring buffer preserves existing undefined-item behavior and capacity-one overwrite', () => {
  const buffer = new RingBuffer<undefined | null | boolean>(3);
  buffer.push(undefined);
  buffer.push(null);
  buffer.push(false);
  assert.equal(buffer.size, 3);
  assert.deepEqual(plain(buffer.toArray()), [null, false]);
  const single = new RingBuffer<string>(1);
  single.push('first');
  single.push('last');
  assert.equal(single.size, 1);
  assert.deepEqual(plain(single.toArray()), ['last']);
});

test('comma-separated names trim, skip empties, deduplicate, and retain first-seen case-sensitive order', () => {
  for (const empty of [undefined, '', ' , , \t\n ']) assert.deepEqual(plain(parse(empty)), []);
  assert.deepEqual(plain(parse(' alpha, beta ,alpha,,Beta, café, beta, café ')), ['alpha', 'beta', 'Beta', 'café']);
});

const systemPath = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';

test('bundle PATH prepending backfills absent or blank PATH without mutating the host process', (t) => {
  t.mock.property(process, 'execPath', '/fixture/bundle with spaces/node');
  const hostPath = process.env.PATH;
  for (const env of [{}, { PATH: '' }, { PATH: ' \t ' }]) {
    prependBundle(env);
    assert.equal(env.PATH, `/fixture/bundle with spaces:${systemPath}`);
    prependBundle(env);
    assert.equal(env.PATH, `/fixture/bundle with spaces:${systemPath}`);
  }
  assert.equal(process.env.PATH, hostPath);
});

test('bundle and gated tool paths preserve PATH order, normalize empty segments, and stay idempotent', (t) => {
  t.mock.property(process, 'execPath', '/fixture/bundle with spaces/node');
  const originalPath = process.env.PATH;
  const env = { PATH: ':/usr/bin::/bin:' };
  prependBundle(env);
  assert.equal(env.PATH, '/fixture/bundle with spaces:/usr/bin:/bin');
  prependGated(env);
  assert.equal(env.PATH, '/fixture/bundle with spaces/tools:/fixture/bundle with spaces:/usr/bin:/bin');
  prependBundle(env);
  prependGated(env);
  assert.equal(env.PATH, '/fixture/bundle with spaces/tools:/fixture/bundle with spaces:/usr/bin:/bin');
  assert.equal(process.env.PATH, originalPath);
  const alreadyPresent = { PATH: '/bin:/fixture/bundle with spaces:/usr/bin' };
  prependBundle(alreadyPresent);
  assert.equal(alreadyPresent.PATH, '/bin:/fixture/bundle with spaces:/usr/bin');
});

test('PATH resolution honors a nonempty Path key and falls back from an empty Path key', (t) => {
  t.mock.property(process, 'execPath', '/fixture/bundle with spaces/node');
  const mixed = { Path: '/custom', PATH: '/untouched' };
  prependBundle(mixed);
  assert.deepEqual(mixed, { Path: '/fixture/bundle with spaces:/custom', PATH: '/untouched' });
  const empty = { Path: '', PATH: '/bin' };
  prependGated(empty);
  assert.deepEqual(empty, { Path: '', PATH: '/fixture/bundle with spaces/tools:/bin' });
});

function serve() {
  const runtime = { output: { stdout: '', stderr: '' } };
  const command = createServeCommand().exitOverride().configureOutput({
    writeOut: value => { runtime.output.stdout += value; },
    writeErr: value => { runtime.output.stderr += value; },
  });
  return { runtime, command, collectUnknownServeOptions };
}

test('real bundled Commander parses serve defaults without daemon startup', () => {
  const { runtime, command } = serve();
  command.parse(['--auth-token', 'test-only-token'], { from: 'user' });
  const options = command.opts();
  assert.equal(command.name(), 'serve');
  assert.equal(options.authToken, 'test-only-token');
  assert.equal(options.port, 8080);
  assert.equal(options.ptyWebsocketPort, 8081);
  assert.equal(options.rgPath, 'rg');
  assert.equal(options.claudeMdEnabled, true);
  assert.equal(options.ghostMode, true);
  assert.equal(options.traceInsecure, false);
  for (const name of ['browserEnabled', 'computerUseEnabled', 'computerUseLazyInit', 'originCliEnabled', 'sandboxEnabled']) {
    assert.equal(Reflect.get(options, name), false, name);
  }
  assert.equal(runtime.output.stdout + runtime.output.stderr, '');
});

test('real serve parser handles numeric, boolean, negated, repeatable, and trace options', () => {
  const { command } = serve();
  command.parse([
    '--auth-token', 'test-only-token', '-p', '9100', '--pty-websocket-port', '9101',
    '--computer-use-api-width', '1600', '--computer-use-api-height', '900',
    '--browser-enabled', '--computer-use-lazy-init', '--origin-cli-enabled', '--no-claude-md-enabled',
    '--ghost-mode', 'false', '--trace-insecure', 'true', '--log-level', 'warn',
    '--project-dir', '/workspace/project with spaces',
    '--agent-store-skills-dir', '/store/one', '--agent-store-skills-dir', '/store/two',
    '--trace-attributes', ' region = iad , cluster=first, token=a=b, cluster=second, empty= ',
  ], { from: 'user' });
  const options = command.opts();
  for (const [key, value] of Object.entries({
    port: 9100, ptyWebsocketPort: 9101, computerUseApiWidth: 1600, computerUseApiHeight: 900,
    browserEnabled: true, computerUseLazyInit: true, originCliEnabled: true, claudeMdEnabled: false,
    ghostMode: false, traceInsecure: true, logLevel: 'warn', projectDir: '/workspace/project with spaces',
  })) assert.equal(Reflect.get(options, key), value, key);
  assert.deepEqual(plain(options.agentStoreSkillsDir), ['/store/one', '/store/two']);
  assert.deepEqual(plain(options.traceAttributes), { region: 'iad', cluster: 'second', token: 'a=b', empty: '' });
});

test('new launcher flags and excess operands are tolerated and option-looking leftovers remain visible', () => {
  const { command, collectUnknownServeOptions } = serve();
  command.parse([
    '--auth-token', 'test-only-token', '--future-feature', 'future-value',
    '--another-future=enabled', 'extra-operand', '--port', '9200',
  ], { from: 'user' });
  assert.equal(command.opts().port, 9200);
  assert.deepEqual(plain(command.args), ['--future-feature', 'future-value', '--another-future=enabled', 'extra-operand']);
  assert.deepEqual(plain(collectUnknownServeOptions(command.args)), ['--future-feature', '--another-future=enabled']);
});

test('required auth, known option values, and missing option arguments remain strict', () => {
  const cases = [
    { args: [], code: 'commander.missingMandatoryOptionValue', message: /auth-token/ },
    { args: ['--auth-token', 'test-only-token', '--log-level', 'verbose'], code: 'commander.invalidArgument', message: /Allowed choices/ },
    { args: ['--auth-token', 'test-only-token', '--port'], code: 'commander.optionMissingArgument', message: /port/ },
  ];
  for (const { args, code, message } of cases) {
    const { command, runtime } = serve();
    assert.throws(() => command.parse(args, { from: 'user' }), (error: unknown) => {
    assert.ok(typeof error === 'object' && error !== null);
    assert.ok('code' in error && 'exitCode' in error && 'message' in error);
      assert.equal(error.code, code);
      assert.equal(error.exitCode, 1);
      assert.equal(typeof error.message, 'string');
      assert.match(String(error.message), message);
      return true;
    });
    assert.notEqual(runtime.output.stderr, '');
  }
});

test('trace attributes accept blank input and reject malformed pairs', () => {
  const { command } = serve();
  command.parse(['--auth-token', 'test-only-token', '--trace-attributes', ' \t '], { from: 'user' });
  assert.deepEqual(plain(command.opts().traceAttributes), {});
  for (const value of ['missing-equals', '=missing-key', 'ok=yes,broken']) {
    const { command: invalid } = serve();
    assert.throws(() => invalid.parse(['--auth-token', 'test-only-token', '--trace-attributes', value], { from: 'user' }), /Invalid trace attribute/);
  }
});

test('serve help advertises gated options and exits through Commander override', () => {
  const { command, runtime } = serve();
  assert.throws(() => command.parse(['--help'], { from: 'user' }), (error: unknown) => {
    assert.ok(typeof error === 'object' && error !== null);
    assert.ok('code' in error && 'exitCode' in error && 'message' in error);
    assert.equal(error.code, 'commander.helpDisplayed');
    assert.equal(error.exitCode, 0);
    return true;
  });
  for (const flag of ['--auth-token', '--computer-use-lazy-init', '--origin-cli-enabled', '--agent-store-skills-dir']) {
    assert.ok(runtime.output.stdout.includes(flag), flag);
  }
  assert.equal(runtime.output.stderr, '');
});
