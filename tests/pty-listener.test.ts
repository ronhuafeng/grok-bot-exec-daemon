import test from 'node:test';
import assert from 'node:assert/strict';
import { decidePtyListener, resolveAuthSecret } from '../src/runtime/runtime-ingress.js';

const loopbackMessage = 'Unauthenticated PTY requires an explicit loopback bind host';

test('missing and empty PTY secrets disable the listener', () => {
  const missing = resolveAuthSecret({});
  const empty = resolveAuthSecret({ cli: '  ', environment: '\n' });
  assert.equal(missing, undefined);
  assert.equal(empty, undefined);
  for (const secret of [missing, empty]) {
    assert.deepEqual(decidePtyListener({ secret, allowAnonymous: false, bindHost: undefined }), { mode: 'disabled' });
    assert.deepEqual(decidePtyListener({ secret, allowAnonymous: false, bindHost: '0.0.0.0' }), { mode: 'disabled' });
    assert.deepEqual(decidePtyListener({ secret, allowAnonymous: false, bindHost: '127.0.0.1' }), { mode: 'disabled' });
  }
});

test('a valid PTY secret authenticates and preserves its source', () => {
  const fromEnv = resolveAuthSecret({ environment: ' pty-secret ' });
  assert.ok(fromEnv);
  assert.deepEqual(decidePtyListener({ secret: fromEnv, allowAnonymous: false, bindHost: undefined }), {
    mode: 'authenticated',
    token: 'pty-secret',
    source: 'environment',
  });
  const fromCli = resolveAuthSecret({ cli: 'from-cli', filePath: '/ignored', environment: 'from-env', readFile: () => 'from-file' });
  assert.ok(fromCli);
  assert.deepEqual(decidePtyListener({ secret: fromCli, allowAnonymous: true, bindHost: '0.0.0.0' }), {
    mode: 'authenticated',
    token: 'from-cli',
    source: 'cli',
  });
});

test('anonymous PTY requires an explicit loopback bind host', () => {
  assert.throws(() => decidePtyListener({ secret: undefined, allowAnonymous: true, bindHost: undefined }), { message: loopbackMessage });
  assert.throws(() => decidePtyListener({ secret: undefined, allowAnonymous: true, bindHost: '0.0.0.0' }), { message: loopbackMessage });
  assert.throws(() => decidePtyListener({ secret: undefined, allowAnonymous: true, bindHost: ' 127.0.0.1' }), { message: loopbackMessage });
  for (const bindHost of ['127.0.0.1', '::1', 'localhost']) {
    assert.deepEqual(decidePtyListener({ secret: undefined, allowAnonymous: true, bindHost }), { mode: 'anonymous', bindHost });
  }
});

test('decidePtyListener has no HTTP credential input, so a missing PTY secret stays disabled', () => {
  assert.deepEqual(decidePtyListener({ secret: undefined, allowAnonymous: false, bindHost: '127.0.0.1' }), { mode: 'disabled' });
});
