import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';
import { combineAssertionAndCleanup, unmountFuse, type CommandRunner } from '../lib/fuse-mount-cleanup.js';

const contract = JSON.parse(await readFile(path.join(root, 'runtime/contract.json'), 'utf8')) as {
  agentStore: { filesystemType: string; mountPath: string };
};

const storeId = 'bc-00000000-0000-4000-8000-000000000001';

const run: CommandRunner = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const stdout: Buffer[] = [];
  const stderr: Buffer[] = [];
  child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
  child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
  child.on('error', reject);
  child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
});

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') return error.code;
  return undefined;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function filesystemType(mountPath: string): Promise<string> {
  const listed = await run('findmnt', ['-n', '-o', 'FSTYPE', mountPath]).catch(() => ({ status: 1, stdout: '', stderr: '' }));
  return listed.status === 0 ? listed.stdout.trim() : '';
}

/** Stat and list the mount so success is a real filesystem operation. */
async function assertMountMetadata(mountPath: string): Promise<string[]> {
  const info = await stat(mountPath);
  assert.equal(info.isDirectory(), true, mountPath);
  const names = await readdir(mountPath);
  if (names.length > 0) {
    const child = names[0];
    assert.equal(typeof child, 'string');
    if (child !== undefined) {
      const childInfo = await stat(path.join(mountPath, child));
      assert.equal(typeof childInfo.ino, 'number');
    }
  }
  return names;
}

async function exerciseMockFilesystem(mountPath: string): Promise<'read-write' | 'read-only'> {
  const names = await assertMountMetadata(mountPath);
  assert.ok(names.includes(storeId), `store directory missing from ${mountPath}: ${names.join(', ')}`);
  const fileName = `acceptance-${process.pid}-${randomBytes(4).toString('hex')}.txt`;
  const directory = path.join(mountPath, storeId);
  const source = path.join(directory, fileName);
  const destination = path.join(directory, `${fileName}.renamed`);
  const payload = `agent-store ${fileName}\n`;
  try {
    await writeFile(source, payload, { flag: 'wx' });
  } catch (error) {
    const code = errorCode(error);
    assert.ok(
      code === 'EACCES' || code === 'EROFS' || code === 'ENOSYS',
      `write failed with ${code ?? 'unknown'}: ${errorText(error)}`,
    );
    const info = await stat(mountPath);
    assert.equal(info.isDirectory(), true);
    const listing = await readdir(mountPath);
    assert.ok(Array.isArray(listing));
    return 'read-only';
  }
  const written = await stat(source);
  assert.equal(written.isFile(), true);
  assert.equal(written.size, Buffer.byteLength(payload));
  assert.equal(await readFile(source, 'utf8'), payload);
  assert.ok((await readdir(directory)).includes(fileName));
  await rename(source, destination);
  const moved = await stat(destination);
  assert.equal(moved.isFile(), true);
  assert.equal(moved.size, Buffer.byteLength(payload));
  assert.equal(await readFile(destination, 'utf8'), payload);
  await unlink(destination);
  await assert.rejects(stat(destination), (error: unknown) => {
    assert.equal(errorCode(error), 'ENOENT');
    return true;
  });
  return 'read-write';
}

function waitForExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise(resolve => {
    let onExit = (): void => {};
    const timer = setTimeout(() => {
      child.off('exit', onExit);
      resolve(false);
    }, timeoutMs);
    onExit = () => {
      clearTimeout(timer);
      resolve(true);
    };
    child.once('exit', onExit);
  });
}

async function signalRecordedPid(child: ChildProcess, pid: number, signal: NodeJS.Signals, timeoutMs: number): Promise<boolean> {
  const pending = waitForExit(child, timeoutMs);
  try {
    process.kill(pid, signal);
  } catch (error) {
    if (errorCode(error) !== 'ESRCH') throw error;
  }
  return pending;
}

async function stopRecordedHelper(child: ChildProcess, pid: number): Promise<void> {
  if (await signalRecordedPid(child, pid, 'SIGTERM', 5000)) return;
  if (await signalRecordedPid(child, pid, 'SIGKILL', 2000)) return;
  throw new Error(`helper pid ${pid} did not exit after SIGKILL`);
}

async function proveCreatedAgentStoreMount(mountPath: string): Promise<'read-write' | 'read-only'> {
  await mkdir(mountPath, { recursive: true });
  const scratch = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-agent-store-'));
  const ready = path.join(scratch, 'ready');
  const logs: Buffer[] = [];
  const helper = spawn(path.join(buildRoot, 'cursor-agent-store-fuse'), [
    '--backend-mode', 'mock',
    '--mount-root', mountPath,
    '--self-store-id', storeId,
    '--ready-sentinel-path', ready,
    '--events-path', path.join(scratch, 'events.jsonl'),
    '--log-level', 'error',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const recordedPid = helper.pid;
  let spawnFailure: Error | undefined;
  helper.on('error', (error: Error) => { spawnFailure = error; });
  helper.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
  helper.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
  let createdMount = false;
  let outcome: 'read-write' | 'read-only' | undefined;
  let assertionError: unknown;
  try {
    const deadline = Date.now() + 15000;
    let readySeen = false;
    while (Date.now() < deadline) {
      if (spawnFailure) break;
      if (helper.exitCode !== null) break;
      try {
        await stat(ready);
        readySeen = true;
        break;
      } catch (error) {
        if (errorCode(error) !== 'ENOENT') throw error;
        await delay(100);
      }
    }
    if (spawnFailure) throw spawnFailure;
    const fstype = await filesystemType(mountPath);
    if (readySeen || fstype === 'fuse.agent-store') createdMount = true;
    assert.equal(fstype, 'fuse.agent-store', Buffer.concat(logs).toString('utf8'));
    outcome = await exerciseMockFilesystem(mountPath);
    const latchScript = path.join(scratch, 'skill-latch.mjs');
    const latchModule = path.join(buildRoot, 'app/runtime/agent-store-skills.js');
    await writeFile(latchScript, [
      `import { createAgentStoreSkillsMountLatch } from ${JSON.stringify(latchModule)};`,
      'const root = process.argv[2];',
      'const reloaded = [];',
      'const latch = createAgentStoreSkillsMountLatch({ roots: [root], reloadRoots(roots) { reloaded.push(roots); } });',
      'await latch();',
      'if (JSON.stringify(reloaded) !== JSON.stringify([[root]])) {',
      '  console.error(JSON.stringify(reloaded));',
      '  process.exit(1);',
      '}',
      'console.log("reloaded");',
    ].join('\n'));
    const reloaded = await run(process.execPath, [latchScript, mountPath]);
    assert.equal(reloaded.status, 0, `${reloaded.stderr}\n${reloaded.stdout}`);
    assert.match(reloaded.stdout, /reloaded/);
  } catch (error) {
    assertionError = error;
  } finally {
    let cleanupError: unknown;
    try {
      const problems: unknown[] = [];
      if (createdMount) {
        try {
          await unmountFuse(mountPath, run);
        } catch (error) {
          problems.push(error);
        }
      }
      if (typeof recordedPid === 'number' && recordedPid > 1) {
        try {
          await stopRecordedHelper(helper, recordedPid);
        } catch (error) {
          problems.push(error);
        }
      }
      if (createdMount) {
        try {
          const fstype = await filesystemType(mountPath);
          if (fstype !== '') problems.push(new Error(`mount ${mountPath} still reports ${fstype} after cleanup`));
        } catch (error) {
          problems.push(error);
        }
      }
      try {
        await rm(scratch, { recursive: true, force: true });
      } catch (error) {
        problems.push(error);
      }
      if (problems.length > 0) throw new Error(problems.map(errorText).join('\n'));
    } catch (error) {
      cleanupError = error;
    }
    if (assertionError !== undefined && cleanupError !== undefined) {
      throw combineAssertionAndCleanup(assertionError, cleanupError);
    }
    if (cleanupError !== undefined) throw cleanupError;
  }
  if (assertionError !== undefined) throw assertionError;
  if (outcome === undefined) throw new Error(`agent-store exercise did not finish for ${mountPath}`);
  return outcome;
}

test('the agent-store mount reports fuse.agent-store', async () => {
  const mountPath = contract.agentStore.mountPath;
  const existing = await filesystemType(mountPath);
  if (existing === contract.agentStore.filesystemType) {
    assert.equal(existing, 'fuse.agent-store');
    await assertMountMetadata(mountPath);
    return;
  }
  const outcome = await proveCreatedAgentStoreMount(mountPath);
  assert.ok(outcome === 'read-write' || outcome === 'read-only');
});

test('a mock agent-store mount created by this test supports filesystem operations and unmounts', async (t) => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-agent-store-mount-'));
  try {
    const outcome = await proveCreatedAgentStoreMount(path.join(parent, 'mnt'));
    t.diagnostic(`mock filesystem outcome: ${outcome}`);
    assert.ok(outcome === 'read-write' || outcome === 'read-only');
  } finally {
    // A busy mount must not replace the assertion or unmount error.
    await rm(parent, { recursive: true, force: true }).catch(() => undefined);
  }
});
