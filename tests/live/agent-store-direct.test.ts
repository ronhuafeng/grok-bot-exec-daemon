import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { chmod, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';
import { combineAssertionAndCleanup, unmountFuse, type CommandRunner } from '../lib/fuse-mount-cleanup.js';

const storeId = 'bc-00000000-0000-4000-8000-000000000099';
const grant = 'direct-proof-grant';
const token = 'direct-proof-token';
const seeded = 'seeded-skill\n';
const writtenName = 'skills/out.txt';
const writtenBody = 'direct-write\n';
const helperPath = path.join(buildRoot, 'cursor-agent-store-fuse');

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

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isEsrch(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ESRCH';
}

async function filesystemType(mountPath: string): Promise<string> {
  const listed = await run('findmnt', ['-n', '-o', 'FSTYPE', mountPath]).catch(() => ({ status: 1, stdout: '', stderr: '' }));
  return listed.status === 0 ? listed.stdout.trim() : '';
}

function readBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

function send(response: ServerResponse, status: number, body: Buffer | string, type = 'application/json'): void {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  response.writeHead(status, { 'content-type': type, 'content-length': payload.length });
  response.end(payload);
}

interface Backend {
  port: number;
  objects: Map<string, Buffer>;
  close(): Promise<void>;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function startBackend(unauthorized: boolean): Promise<Backend> {
  const objects = new Map<string, Buffer>([['skills/hello.txt', Buffer.from(seeded)]]);
  let port = 0;
  const server = createServer((request, response) => {
    void handle(request, response, objects, unauthorized, port).catch(() => {
      if (!response.headersSent) send(response, 500, '{"code":"backend"}');
    });
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      port = typeof address === 'object' && address !== null ? address.port : 0;
      resolve({
        port,
        objects,
        close: () => new Promise((done, fail) => {
          server.closeAllConnections();
          server.close(error => error ? fail(error) : done());
        }),
      });
    });
  });
}

async function handle(request: IncomingMessage, response: ServerResponse, objects: Map<string, Buffer>, unauthorized: boolean, port: number): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const body = await readBody(request);
  if (request.method === 'GET' && url.pathname.startsWith('/objects/')) {
    const relPath = decodeURIComponent(url.pathname.slice('/objects/'.length));
    const stored = objects.get(relPath);
    if (stored === undefined) {
      send(response, 404, 'missing', 'text/plain');
      return;
    }
    send(response, 200, stored, 'application/octet-stream');
    return;
  }
  if (request.method === 'PUT' && url.pathname.startsWith('/objects/')) {
    objects.set(decodeURIComponent(url.pathname.slice('/objects/'.length)), body);
    send(response, 200, '');
    return;
  }
  if (request.method !== 'POST') {
    send(response, 404, '{}');
    return;
  }
  const rpc = url.pathname.split('/').at(-1) ?? '';
  if (rpc === 'MintAgentStoreToken') {
    if (unauthorized || request.headers['x-agent-store-pod-grant'] !== grant) {
      send(response, 401, '{"code":"unauthenticated"}');
      return;
    }
    send(response, 200, JSON.stringify({ token, expiresAtMs: '4102444800000', storeIds: [storeId] }));
    return;
  }
  if (request.headers['x-agent-store-token'] !== token) {
    send(response, 401, '{"code":"unauthenticated"}');
    return;
  }
  const parsed: unknown = body.length === 0 ? {} : JSON.parse(body.toString('utf8'));
  const record = objectValue(parsed) ?? {};
  if (rpc === 'ListAgentStoreDirectory') {
    const relative = typeof record.relativePath === 'string' ? record.relativePath : '';
    const files: { relPath: string; sizeBytes: string; lastModifiedMs: string }[] = [];
    const subdirs = new Set<string>();
    for (const [relPath, bytes] of objects) {
      if (relative !== '' && relPath !== relative && !relPath.startsWith(`${relative}/`)) continue;
      const rest = relative === '' ? relPath : relPath.slice(relative.length + 1);
      if (rest.includes('/')) subdirs.add(rest.split('/')[0] ?? rest);
      files.push({ relPath, sizeBytes: String(bytes.length), lastModifiedMs: '1' });
    }
    if (relative === '') {
      for (const relPath of objects.keys()) {
        const slash = relPath.indexOf('/');
        if (slash > 0) subdirs.add(relPath.slice(0, slash));
      }
    }
    send(response, 200, JSON.stringify({ files, subdirs: [...subdirs], tombstones: [], listingComplete: true }));
    return;
  }
  if (rpc === 'PresignAgentStoreReads' || rpc === 'PresignAgentStoreWrites') {
    const relPaths = stringList(record.relPaths);
    const fromFiles = fileRelPaths(record.files);
    const names = relPaths.length > 0 ? relPaths : fromFiles;
    const instructions = names.map(relPath => ({ relPath, url: `http://127.0.0.1:${port}/objects/${relPath}` }));
    send(response, 200, JSON.stringify({ instructions }));
    return;
  }
  if (rpc === 'DeleteAgentStoreFiles') {
    for (const relPath of fileRelPaths(record.files).concat(stringList(record.relPaths))) objects.delete(relPath);
    send(response, 200, JSON.stringify({ results: [{ status: 'AGENT_STORE_DELETE_FILE_STATUS_DELETED' }] }));
    return;
  }
  send(response, 200, '{}');
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const entries = value as readonly unknown[];
  const names: string[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry: unknown = entries[index];
    if (typeof entry === 'string') names.push(entry);
  }
  return names;
}

function fileRelPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const entries = value as readonly unknown[];
  const names: string[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = objectValue(entries[index]);
    if (entry !== undefined && typeof entry.relPath === 'string') names.push(entry.relPath);
  }
  return names;
}

async function mountDirect(mountPath: string, endpoint: string, grantPath: string, scratch: string, logLevel: string): Promise<{ helper: ChildProcess; pid: number; logs: () => string }> {
  const logs: Buffer[] = [];
  const helper = spawn(helperPath, [
    '--backend-mode', 'direct',
    '--bcs-endpoint', endpoint,
    '--pod-grant-path', grantPath,
    '--allow-insecure-presigned-urls',
    '--mount-root', mountPath,
    '--self-store-id', storeId,
    '--ready-sentinel-path', path.join(scratch, 'ready'),
    '--events-path', path.join(scratch, 'events.jsonl'),
    '--log-level', logLevel,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const pid = helper.pid;
  if (pid === undefined) throw new Error('direct-mode helper did not start');
  helper.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
  helper.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
  const ready = path.join(scratch, 'ready');
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (helper.exitCode !== null) break;
    try {
      await stat(ready);
      return { helper, pid, logs: () => Buffer.concat(logs).toString('utf8') };
    } catch {
      await delay(100);
    }
  }
  throw new Error(`direct-mode helper did not become ready: ${Buffer.concat(logs).toString('utf8')}`);
}

async function cleanupMount(mountPath: string, helper: ChildProcess | undefined, pid: number | undefined, scratch: string): Promise<void> {
  const problems: unknown[] = [];
  if (await filesystemType(mountPath) !== '') {
    try {
      await unmountFuse(mountPath, run);
    } catch (error) {
      problems.push(error);
    }
  }
  if (helper !== undefined && typeof pid === 'number' && pid > 1 && helper.exitCode === null) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (error) {
      if (!isEsrch(error)) problems.push(error);
    }
    await delay(200);
    if (helper.exitCode === null) {
      try {
        process.kill(pid, 'SIGKILL');
      } catch (error) {
        if (!isEsrch(error)) problems.push(error);
      }
    }
  }
  try {
    await rm(scratch, { recursive: true, force: true });
  } catch (error) {
    problems.push(error);
  }
  if (problems.length > 0) throw new Error(problems.map(errorText).join('\n'));
}

test('direct mode reads and writes through the provisioned helper', { timeout: 120000 }, async (t) => {
  const helperBytes = await readFile(helperPath);
  const digest = createHash('sha256').update(helperBytes).digest('hex');
  const lock = JSON.parse(await readFile(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as { tools: { id: string; sha256?: string }[] };
  assert.equal(lock.tools.find(tool => tool.id === 'cursor-agent-store-fuse')?.sha256, digest);
  t.diagnostic(`cursor-agent-store-fuse sha256 ${digest} backend=direct`);
  const parent = await mkdtemp(path.join(os.tmpdir(), 'agent-store-direct-'));
  const scratch = path.join(parent, 'scratch');
  const mountPath = path.join(parent, 'mnt');
  await mkdir(scratch);
  await mkdir(mountPath);
  const grantPath = path.join(scratch, 'grant');
  await writeFile(grantPath, grant, { mode: 0o600 });
  await chmod(grantPath, 0o600);
  const grantStat = await stat(grantPath);
  assert.equal(grantStat.mode & 0o777, 0o600);
  const backend = await startBackend(false);
  let helper: ChildProcess | undefined;
  let pid: number | undefined;
  let assertion: unknown;
  try {
    const mounted = await mountDirect(mountPath, `http://127.0.0.1:${backend.port}`, grantPath, scratch, 'error');
    helper = mounted.helper;
    pid = mounted.pid;
    assert.equal(await filesystemType(mountPath), 'fuse.agent-store');
    const names = await readFileNames(mountPath);
    assert.ok(names.includes(storeId), names.join(','));
    assert.ok(names.includes('self'), names.join(','));
    const seededPath = path.join(mountPath, storeId, 'skills/hello.txt');
    assert.equal(await readFile(seededPath, 'utf8'), seeded);
    const outputPath = path.join(mountPath, storeId, writtenName);
    await writeFile(outputPath, writtenBody);
    assert.equal(await readFile(outputPath, 'utf8'), writtenBody);
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && !backend.objects.get(writtenName)?.equals(Buffer.from(writtenBody))) await delay(50);
    assert.equal(backend.objects.get(writtenName)?.toString('utf8'), writtenBody);
    const latchScript = path.join(scratch, 'skill-latch.mjs');
    const latchModule = path.join(buildRoot, 'app/runtime/agent-store-skills.js');
    await writeFile(latchScript, [
      `import { createAgentStoreSkillsMountLatch } from ${JSON.stringify(latchModule)};`,
      "import { readFile } from 'node:fs/promises';",
      'const root = process.argv[2];',
      'const file = process.argv[3];',
      'const reloaded = [];',
      'const latch = createAgentStoreSkillsMountLatch({ roots: [root], reloadRoots(roots) { reloaded.push(roots); } });',
      'await latch();',
      'const body = await readFile(file, "utf8");',
      'process.stdout.write(JSON.stringify({ reloaded, body }));',
    ].join('\n'));
    const reloaded = await run(process.execPath, [latchScript, mountPath, seededPath]);
    assert.equal(reloaded.status, 0, `${reloaded.stderr}\n${reloaded.stdout}`);
    const observed = JSON.parse(reloaded.stdout) as { reloaded: string[][]; body: string };
    assert.deepEqual(observed.reloaded, [[mountPath]]);
    assert.equal(observed.body, seeded);
    const helperLog = mounted.logs();
    const events = await readFile(path.join(scratch, 'events.jsonl'), 'utf8').catch(() => '');
    assert.equal(helperLog.includes(grant), false);
    assert.equal(helperLog.includes(token), false);
    assert.equal(events.includes(grant), false);
    assert.equal(events.includes(token), false);
  } catch (error) {
    assertion = error;
  } finally {
    let cleanup: unknown;
    try {
      await backend.close();
    } catch (error) {
      cleanup = error;
    }
    try {
      await cleanupMount(mountPath, helper, pid, scratch);
      await rm(parent, { recursive: true, force: true });
    } catch (error) {
      cleanup = cleanup === undefined ? error : new Error(`${errorText(cleanup)}\n${errorText(error)}`);
    }
    if (assertion !== undefined && cleanup !== undefined) throw combineAssertionAndCleanup(assertion, cleanup);
    if (cleanup !== undefined) throw cleanup;
    if (assertion !== undefined) throw assertion;
  }
});

async function readFileNames(directory: string): Promise<string[]> {
  return readdir(directory);
}

test('direct-mode authentication failure is attributed to the backend', { timeout: 120000 }, async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'agent-store-direct-auth-'));
  const scratch = path.join(parent, 'scratch');
  const mountPath = path.join(parent, 'mnt');
  await mkdir(scratch);
  await mkdir(mountPath);
  const grantPath = path.join(scratch, 'grant');
  await writeFile(grantPath, grant, { mode: 0o600 });
  await chmod(grantPath, 0o600);
  const backend = await startBackend(true);
  let helper: ChildProcess | undefined;
  let pid: number | undefined;
  let assertion: unknown;
  try {
    const mounted = await mountDirect(mountPath, `http://127.0.0.1:${backend.port}`, grantPath, scratch, 'info');
    helper = mounted.helper;
    pid = mounted.pid;
    assert.equal(await filesystemType(mountPath), 'fuse.agent-store');
    await assert.rejects(Promise.race([
      readFile(path.join(mountPath, storeId, 'skills/hello.txt'), 'utf8'),
      delay(8000).then(() => { throw new Error('backend read timed out'); }),
    ]));
    const helperLog = mounted.logs();
    assert.match(helperLog, /MintAgentStoreToken/);
    assert.match(helperLog, /401|rpc\.failed|unauthenticated/);
    assert.doesNotMatch(helperLog, /sha256|helper identity mismatch/);
    assert.equal(helperLog.includes(grant), false);
  } catch (error) {
    assertion = error;
  } finally {
    let cleanup: unknown;
    try {
      await backend.close();
    } catch (error) {
      cleanup = error;
    }
    try {
      await cleanupMount(mountPath, helper, pid, scratch);
      await rm(parent, { recursive: true, force: true });
    } catch (error) {
      cleanup = cleanup === undefined ? error : new Error(`${errorText(cleanup)}\n${errorText(error)}`);
    }
    if (assertion !== undefined && cleanup !== undefined) throw combineAssertionAndCleanup(assertion, cleanup);
    if (cleanup !== undefined) throw cleanup;
    if (assertion !== undefined) throw assertion;
  }
});
