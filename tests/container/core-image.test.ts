import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { root } from '../../tools/lib/project.js';

const image = process.env.EXEC_DAEMON_IMAGE ?? 'exec-daemon-core:local';
const httpToken = 'container-http-token';
const ptyToken = 'container-pty-token';
const name = `exec-daemon-core-${process.pid}`;

function run(command: string, args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
  });
}

function docker(args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return run('sudo', ['-n', 'docker', ...args]);
}

async function dockerOk(args: string[]): Promise<string> {
  const result = await docker(args);
  assert.equal(result.status, 0, `${args.join(' ')}\n${result.stderr}`);
  return result.stdout;
}

test('the core image serves auth and PTY from a read-only root', { timeout: 180000 }, async () => {
  const present = await docker(['image', 'inspect', image]);
  assert.equal(present.status, 0, `image ${image} is not built: ${present.stderr}`);
  const inspected = JSON.parse(await dockerOk(['image', 'inspect', image])) as {
    Config?: { User?: string; Env?: string[] };
  }[];
  const config = inspected[0]?.Config;
  assert.equal(config?.User, 'exec');
  const baked = (config?.Env ?? []).join('\n');
  assert.equal(baked.includes(httpToken), false);
  assert.equal(baked.includes('EXEC_DAEMON_AUTH_TOKEN='), false);
  const history = await dockerOk(['history', '--no-trunc', image]);
  assert.equal(history.includes(httpToken), false);
  assert.equal(history.includes(ptyToken), false);

  const lock = JSON.parse(await readFile(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as {
    tools: { id: string; dest: string; sha256: string; profiles: string[]; optional: boolean }[];
  };
  await docker(['rm', '-f', name]);
  const started = await docker([
    'run', '-d', '--name', name, '--read-only',
    '--tmpfs', '/tmp:rw,nosuid,mode=1777,size=256m',
    '--tmpfs', '/home/exec:rw,nosuid,uid=1010,gid=1010,mode=755,size=64m',
    '--tmpfs', '/data:rw,nosuid,uid=1010,gid=1010,mode=755,size=128m',
    '--tmpfs', '/workspace:rw,nosuid,uid=1010,gid=1010,mode=755,size=64m',
    '-e', `EXEC_DAEMON_AUTH_TOKEN=${httpToken}`,
    '-e', `EXEC_DAEMON_PTY_AUTH_TOKEN=${ptyToken}`,
    '-e', 'CURSOR_EXEC_DAEMON_DATA_DIR=/data',
    '-e', 'HOME=/home/exec',
    '-p', '127.0.0.1::8080',
    '-p', '127.0.0.1::8081',
    image,
  ]);
  assert.equal(started.status, 0, started.stderr);
  try {
    const hostConfig = JSON.parse(await dockerOk(['inspect', name])) as {
      HostConfig?: { ReadonlyRootfs?: boolean; Binds?: string[] | null };
    }[];
    assert.equal(hostConfig[0]?.HostConfig?.ReadonlyRootfs, true);
    assert.deepEqual(hostConfig[0]?.HostConfig?.Binds ?? [], []);
    const mapped = await dockerOk(['port', name]);
    const httpPort = /8080\/tcp -> 127\.0\.0\.1:(\d+)/.exec(mapped)?.[1];
    const ptyPort = /8081\/tcp -> 127\.0\.0\.1:(\d+)/.exec(mapped)?.[1];
    assert.ok(httpPort && ptyPort, mapped);
    const deadline = Date.now() + 90000;
    let pingStatus = 0;
    while (Date.now() < deadline) {
      const response = await fetch(`http://127.0.0.1:${httpPort}/agent.v1.ControlService/Ping`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${httpToken}` },
        body: '{}',
      }).catch(() => undefined);
      if (response?.status === 200) { pingStatus = response.status; break; }
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    assert.equal(pingStatus, 200, await dockerOk(['logs', name]));
    const anonymous = await fetch(`http://127.0.0.1:${httpPort}/agent.v1.ControlService/Ping`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'connect-protocol-version': '1' },
      body: '{}',
    });
    assert.notEqual(anonymous.status, 200);
    const help = await docker(['exec', name, '/opt/exec-daemon/bin/exec-daemon', '--help']);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /serve/);
    for (const tool of lock.tools.filter(tool => tool.profiles.includes('core') && !tool.optional)) {
      const digest = await docker(['exec', name, '/opt/exec-daemon/dist/runtime/node', '-e', `const fs=require('fs');const c=require('crypto');const b=fs.readFileSync('/opt/exec-daemon/dist/runtime/${tool.dest}');if(b.length===0)process.exit(2);process.stdout.write(c.createHash('sha256').update(b).digest('hex'))`]);
      assert.equal(digest.status, 0, digest.stderr);
      assert.equal(digest.stdout.trim(), tool.sha256, tool.id);
    }
    const native = await docker(['exec', name, '/opt/exec-daemon/dist/runtime/node', '-e', `
      const pty = require('/opt/exec-daemon/dist/runtime/pty.node');
      const tree = require('/opt/exec-daemon/dist/runtime/node_modules/tree-sitter/build/Release/tree_sitter_runtime_binding.node');
      const bash = require('/opt/exec-daemon/dist/runtime/node_modules/tree-sitter-bash/build/Release/tree_sitter_bash_binding.node');
      const renderer = require('/opt/exec-daemon/dist/runtime/polished-renderer.node');
      if (!pty.fork || !tree.Parser || !bash.language || !renderer.renderFromPlanNative) throw new Error('native exports missing');
      process.stdout.write(process.version + ' ' + process.versions.modules);
    `]);
    assert.equal(native.status, 0, native.stderr);
    assert.equal(native.stdout.trim(), 'v22.14.0 127');
    const socket = new WebSocket(`ws://127.0.0.1:${ptyPort}/?token=${encodeURIComponent(ptyToken)}`);
    const spawned = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('pty spawn timed out')), 15000);
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({
          type: 1, requestId: 'pty', path: '/agent.v1.PtyHostService/SpawnPty', method: 'POST',
          headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${ptyToken}` },
          body: Buffer.from(JSON.stringify({ cwd: '/workspace', cols: 80, rows: 24, process: { shell: '/bin/echo', args: ['pty-ok'] } })).toString('base64'),
        }));
      });
      socket.addEventListener('message', event => {
        const parsed: unknown = JSON.parse(String(event.data));
        if (typeof parsed !== 'object' || parsed === null || !('body' in parsed)) return;
        const body = Buffer.from(String((parsed as { body?: string }).body ?? ''), 'base64').toString('utf8');
        if (body.includes('pty-ok') || /"ptyId"/.test(body)) { clearTimeout(timer); resolve(body); }
      });
      socket.addEventListener('error', () => undefined);
    });
    socket.close();
    assert.match(spawned, /pty-ok|ptyId/);
  } finally {
    await docker(['rm', '-f', name]);
  }
});
