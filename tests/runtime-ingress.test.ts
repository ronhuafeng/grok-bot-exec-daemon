import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthSecret, resolveBindHost } from '../src/runtime/runtime-ingress.js';
import { REQUEST_CONTEXT_DISK_CACHE_PATH, resolveRequestContextDiskCachePath } from '../src/runtime/request-context-disk-cache.js';

test('request-context cache stays under the configured data directory', () => {
  assert.equal(resolveRequestContextDiskCachePath('/data'), '/data/request-context-cache.json');
  assert.equal(resolveRequestContextDiskCachePath('  /srv/exec '), '/srv/exec/request-context-cache.json');
  assert.equal(resolveRequestContextDiskCachePath(undefined), REQUEST_CONTEXT_DISK_CACHE_PATH);
  assert.equal(resolveRequestContextDiskCachePath('   '), REQUEST_CONTEXT_DISK_CACHE_PATH);
});

test('auth secret precedence is cli, then file, then environment', () => {
  assert.deepEqual(resolveAuthSecret({ cli: ' from-cli ', filePath: '/token', environment: 'from-env', readFile: () => 'from-file' }), { value: 'from-cli', source: 'cli' });
  assert.deepEqual(resolveAuthSecret({ filePath: '/token', environment: 'from-env', readFile: () => ' from-file\n' }), { value: 'from-file', source: 'file' });
  assert.deepEqual(resolveAuthSecret({ environment: ' from-env ' }), { value: 'from-env', source: 'environment' });
  assert.equal(resolveAuthSecret({ cli: '  ', environment: '  ' }), undefined);
  assert.throws(() => resolveAuthSecret({ filePath: '/token', readFile: () => ' \n' }), /empty/);
});

test('bind host prefers the CLI and rejects blank or whitespace values', () => {
  assert.equal(resolveBindHost(' 127.0.0.1 ', '0.0.0.0'), '127.0.0.1');
  assert.equal(resolveBindHost(undefined, '::1'), '::1');
  assert.equal(resolveBindHost(' ', ' '), undefined);
  assert.throws(() => resolveBindHost('bad host', undefined), /Invalid bind host/);
});
