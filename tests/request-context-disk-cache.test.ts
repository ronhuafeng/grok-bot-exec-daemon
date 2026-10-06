import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createContext } from '../src/interop/vendor/context-core.js';
import { loggerKey } from '../src/interop/vendor/context-logger.js';
import { RequestContext } from '../src/interop/vendor/proto-agent-v1-request-context-exec-pb.js';
import { FilteredLoggerBackend } from '../src/runtime/logger.js';
import { REQUEST_CONTEXT_DISK_CACHE_PATH, readRequestContextDiskCache, resolveRequestContextDiskCachePath, writeRequestContextDiskCache } from '../src/runtime/request-context-disk-cache.js';
import { root } from '../tools/lib/project.js';

function cacheContext() {
  return createContext().with(loggerKey, new FilteredLoggerBackend('error'));
}

test('request-context disk cache round-trips under the configured data directory', async () => {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'request-context-cache-'));
  try {
    const ctx = cacheContext();
    const requestContext = RequestContext.fromJson({
      rules: [],
      agentSkills: [],
      customSubagents: [],
      repositoryInfo: [],
      cloudRule: 'cache-proof',
    });
    const filePath = resolveRequestContextDiskCachePath(dataDir);
    assert.equal(filePath, path.join(dataDir, 'request-context-cache.json'));
    const historicalBefore = existsSync(REQUEST_CONTEXT_DISK_CACHE_PATH) ? statSync(REQUEST_CONTEXT_DISK_CACHE_PATH) : undefined;
    await writeRequestContextDiskCache(ctx, filePath, requestContext);
    assert.equal(existsSync(filePath), true);
    if (historicalBefore === undefined) {
      assert.equal(existsSync(REQUEST_CONTEXT_DISK_CACHE_PATH), false);
    } else {
      const historicalAfter = statSync(REQUEST_CONTEXT_DISK_CACHE_PATH);
      assert.equal(historicalAfter.ino, historicalBefore.ino);
      assert.equal(historicalAfter.size, historicalBefore.size);
      assert.equal(historicalAfter.mtimeMs, historicalBefore.mtimeMs);
    }
    const read = await readRequestContextDiskCache(ctx, filePath);
    assert.notEqual(read, undefined);
    assert.equal(read?.cloudRule, 'cache-proof');
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('an unset data directory keeps the historical request-context cache path', () => {
  assert.equal(resolveRequestContextDiskCachePath(undefined), '/opt/cursor/.exec-daemon/request-context-cache.json');
  assert.equal(resolveRequestContextDiskCachePath(undefined), REQUEST_CONTEXT_DISK_CACHE_PATH);
});

test('prebuild writer and daemon reader both call resolveRequestContextDiskCachePath', () => {
  const indexSource = readFileSync(path.join(root, 'src/runtime/index.ts'), 'utf8');
  const setupSource = readFileSync(path.join(root, 'src/runtime/setup.ts'), 'utf8');
  assert.equal(indexSource.includes('resolveRequestContextDiskCachePath('), true);
  assert.equal(setupSource.includes('resolveRequestContextDiskCachePath('), true);
});
