import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { buildRoot, root } from '../../tools/lib/project.js';
import { collectHostFacts, evaluateHost } from '../../tools/lib/host-preflight.js';
import { execRequest } from '../lib/connect-exec.js';

const typed = 'desk-ok';
const artifactDir = '/opt/cursor/artifacts';

function run(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('exit', status => resolve({ status, stdout: Buffer.concat(stdout).toString('utf8'), stderr: Buffer.concat(stderr).toString('utf8') }));
  });
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address !== null ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface PageEvent { kind: string; detail: string }

function pageHtml(): string {
  return `<!doctype html><html><body style="margin:0;background:#fff">
<input id="q" style="position:fixed;left:0;top:0;width:100%;height:45%;box-sizing:border-box;font-size:32px">
<button id="go" style="position:fixed;left:0;top:45%;width:100%;height:55%;font-size:32px">MARK</button>
<script>
const q = document.getElementById('q');
async function report(kind, detail) {
  await fetch('/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, detail }) });
}
document.addEventListener('pointerdown', (event) => { void report('pointer', event.clientX + ',' + event.clientY); }, true);
q.addEventListener('input', () => { void report('keyboard', q.value); });
document.getElementById('go').addEventListener('click', () => { void report('click', q.value); });
</script></body></html>`;
}

async function chromeWindow(display: string): Promise<{ x: number; y: number; width: number; height: number }> {
  const listed = await run('xwininfo', ['-root', '-tree', '-display', display]);
  const windows = [...listed.stdout.matchAll(/([0-9]+)x([0-9]+)\+([0-9]+)\+([0-9]+)/g)].map(match => ({
    width: Number(match[1]),
    height: Number(match[2]),
    x: Number(match[3]),
    y: Number(match[4]),
  })).filter(item => item.width >= 200 && item.height >= 200);
  const nested = windows.filter(item => !(item.width === 1280 && item.height === 800 && item.x === 0 && item.y === 0));
  const window = (nested.length > 0 ? nested : windows).sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
  if (window === undefined) throw new Error(`desktop prerequisite failed: Chrome window was not mapped\n${listed.stdout}`);
  return window;
}

async function waitFor(label: string, check: () => Promise<boolean>): Promise<void> {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(200);
  }
  throw new Error(`desktop prerequisite was not ready: ${label}`);
}

test('non-headless Chrome computer-use and recording run on an isolated display', { timeout: 180000 }, async () => {
  const facts = collectHostFacts();
  const gaps = evaluateHost(facts, 'desktop').filter(check => !check.ok);
  assert.deepEqual(gaps.map(check => `${check.id}: ${check.detail}`), [], 'desktop prerequisites failed before computer-use');
  const fixture = await run('sh', ['-c', 'command -v xfwm4']);
  assert.equal(fixture.status, 0, 'desktop fixture prerequisite: xfwm4 is not on PATH. It is required to focus the proof window and is not a runtime host-contract requirement.');
  const browser = facts.commands['google-chrome'] === true ? 'google-chrome' : 'chromium';
  const browserVersion = await run(browser, ['--version']);
  assert.equal(browserVersion.status, 0, `desktop prerequisite failed: ${browser} did not report a version`);
  console.log(`browser identity: ${browser} ${browserVersion.stdout.trim()}`);
  const events: PageEvent[] = [];
  const page = createServer((request: IncomingMessage, response: ServerResponse) => {
    if (request.method === 'POST' && request.url === '/event') {
      const chunks: Buffer[] = [];
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (typeof parsed === 'object' && parsed !== null && 'kind' in parsed && 'detail' in parsed) {
          events.push({ kind: String(parsed.kind), detail: String(parsed.detail) });
        }
        response.writeHead(204);
        response.end();
      });
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(pageHtml());
  });
  await new Promise<void>(resolve => page.listen(0, '127.0.0.1', () => resolve()));
  const pageAddress = page.address();
  const pagePort = typeof pageAddress === 'object' && pageAddress !== null ? pageAddress.port : 0;
  const directory = await mkdtemp(path.join(os.tmpdir(), 'exec-daemon-desktop-'));
  const workspace = path.join(directory, 'workspace');
  const data = path.join(directory, 'data');
  const chromeData = path.join(directory, 'chrome');
  await run('mkdir', ['-p', workspace, data, chromeData]);
  await run('git', ['init', workspace]);
  const display = `:${90 + (process.pid % 20)}`;
  const xvfb = spawn('Xvfb', [display, '-screen', '0', '1280x800x24', '-ac', '-nolisten', 'tcp'], { stdio: 'ignore' });
  const windowManager = spawn('xfwm4', ['--replace'], { env: { ...process.env, DISPLAY: display }, stdio: 'ignore' });
  const chrome = spawn(browser, [
    '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check',
    '--disable-gpu', '--disable-component-update', '--disable-background-networking', '--disable-sync',
    '--kiosk', `--user-data-dir=${chromeData}`, '--disable-extensions',
    `http://127.0.0.1:${pagePort}/`,
  ], { env: { ...process.env, DISPLAY: display }, stdio: 'ignore' });
  const httpPort = await freePort();
  const ptyPort = await freePort();
  const token = 'desktop-http-token';
  const ptyToken = 'desktop-pty-token';
  let daemon: ChildProcess | undefined;
  try {
    await waitFor('xdpyinfo', async () => (await run('xdpyinfo', ['-display', display])).status === 0);
    await delay(1000);
    daemon = spawn(path.join(root, 'bin/exec-daemon'), [
      'serve', '--port', String(httpPort), '--pty-websocket-port', String(ptyPort), '--bind-host', '127.0.0.1',
      '--rg-path', path.join(buildRoot, 'rg'), '--project-dir', workspace, '--log-level', 'error',
      '--computer-use-enabled', '--record-screen-enabled', '--chrome-executable-path', browser,
    ], {
      cwd: workspace,
      env: { ...process.env, DISPLAY: display, HOME: directory, CURSOR_EXEC_DAEMON_DATA_DIR: data, EXEC_DAEMON_AUTH_TOKEN: token, EXEC_DAEMON_PTY_AUTH_TOKEN: ptyToken },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const logs: Buffer[] = [];
    daemon.stdout?.on('data', (chunk: Buffer) => logs.push(chunk));
    daemon.stderr?.on('data', (chunk: Buffer) => logs.push(chunk));
    const readyDeadline = Date.now() + 90000;
    let ready = false;
    while (Date.now() < readyDeadline) {
      if (daemon.exitCode !== null) break;
      const response = await fetch(`http://127.0.0.1:${httpPort}/agent.v1.ControlService/Ping`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'connect-protocol-version': '1', authorization: `Bearer ${token}` }, body: '{}',
      }).catch(() => undefined);
      if (response?.status === 200) { ready = true; break; }
      await delay(200);
    }
    assert.equal(ready, true, Buffer.concat(logs).toString('utf8').slice(-2000));
    const window = await chromeWindow(display);
    const inputPoint = { x: window.x + Math.round(window.width / 2), y: window.y + Math.round(window.height / 4) };
    const buttonPoint = { x: window.x + Math.round(window.width / 2), y: window.y + Math.round(window.height * 3 / 4) };
    const screenshot = await computerUse(httpPort, token, [{ screenshot: {} }], 'shot');
    const image = screenshotBytes(screenshot.raw);
    assert.ok(image.byteLength > 32, classify(screenshot.raw, 'screenshot'));
    mkdirSync(artifactDir, { recursive: true });
    const shotName = image.subarray(0, 4).toString('ascii') === 'RIFF' ? 'desktop-screenshot.webp' : 'desktop-screenshot.png';
    await writeFile(path.join(artifactDir, shotName), image);
    await computerUse(httpPort, token, [
      { click: { coordinate: inputPoint, button: 'LEFT', count: 1 } },
      { wait: { durationMs: 200 } },
      { type: { text: typed } },
      { click: { coordinate: buttonPoint, button: 'LEFT', count: 1 } },
    ], 'type');
    const eventDeadline = Date.now() + 10000;
    while (Date.now() < eventDeadline && !(events.some(event => event.kind === 'keyboard' && event.detail.includes(typed)) && events.some(event => event.kind === 'pointer'))) {
      await delay(100);
    }
    assert.ok(events.some(event => event.kind === 'pointer'), `computer-use pointer did not reach the local page: ${JSON.stringify(events)}`);
    assert.ok(events.some(event => event.kind === 'keyboard' && event.detail.includes(typed)), `computer-use keyboard did not reach the local page: ${JSON.stringify(events)}`);
    const started = await record(httpPort, token, 1, 'rec-start');
    assert.equal(started.status, 200, classify(started.raw, 'record-start'));
    assert.match(started.raw, /startSuccess/, classify(started.raw, 'record-start'));
    await delay(1200);
    const saved = await record(httpPort, token, 2, 'rec-save');
    assert.equal(saved.status, 200, classify(saved.raw, 'record-save'));
    const savedPath = /"path"\s*:\s*"([^"]+)"/.exec(saved.raw)?.[1];
    assert.ok(savedPath, classify(saved.raw, 'record-save'));
    const probed = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=format_name,duration:stream=codec_name,width,height', '-of', 'json', savedPath]);
    assert.equal(probed.status, 0, probed.stderr);
    const metadata = JSON.parse(probed.stdout) as { streams?: { codec_name?: string; width?: number }[]; format?: { duration?: string } };
    assert.ok((metadata.streams?.[0]?.codec_name ?? '').length > 0, probed.stdout);
    assert.ok((metadata.streams?.[0]?.width ?? 0) > 0, probed.stdout);
    assert.ok(Number(metadata.format?.duration ?? '0') > 0, probed.stdout);
    await writeFile(path.join(artifactDir, 'desktop-recording-ffprobe.json'), probed.stdout);
    const video = await readFile(savedPath);
    assert.ok(video.byteLength > 0);
    await writeFile(path.join(artifactDir, 'desktop-recording.mp4'), video);
  } finally {
    daemon?.kill('SIGTERM');
    chrome.kill('SIGTERM');
    windowManager.kill('SIGTERM');
    xvfb.kill('SIGTERM');
    page.close();
    await delay(300);
    if (daemon && daemon.exitCode === null) daemon.kill('SIGKILL');
    if (chrome.exitCode === null) chrome.kill('SIGKILL');
    if (windowManager.exitCode === null) windowManager.kill('SIGKILL');
    if (xvfb.exitCode === null) xvfb.kill('SIGKILL');
    await rm(directory, { recursive: true, force: true });
  }
});

function classify(raw: string, step: string): string {
  const compact = raw.replace(/\s+/g, ' ').slice(0, 1500);
  if (/xdpyinfo|X11 is not installed|ffmpeg not found|browser/i.test(compact)) {
    return `desktop prerequisite failed during ${step}: ${compact}`;
  }
  return `computer-use failure during ${step}: ${compact}`;
}

async function computerUse(port: number, token: string, actions: unknown[], id: string): Promise<{ status: number; raw: string }> {
  const result = await execRequest(port, token, {
    id: 1,
    execId: id,
    computerUseArgs: { toolCallId: id, actions },
  });
  if (result.status !== 200 || /"error"\s*:/.test(result.raw) && !/"success"/.test(result.raw)) {
    throw new Error(classify(result.raw || `HTTP ${result.status}`, id));
  }
  return result;
}

async function record(port: number, token: string, mode: number, id: string): Promise<{ status: number; raw: string }> {
  return execRequest(port, token, {
    id: 1,
    execId: id,
    recordScreenArgs: { toolCallId: id, mode, saveAsFilename: 'desktop-proof' },
  });
}

function screenshotBytes(raw: string): Buffer {
  const encoded = /"screenshot"\s*:\s*"([^"]+)"/.exec(raw)?.[1] ?? '';
  const bytes = Buffer.from(encoded, 'base64');
  const png = bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const jpeg = bytes.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]));
  const webp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!png && !jpeg && !webp) return Buffer.alloc(0);
  return bytes;
}
