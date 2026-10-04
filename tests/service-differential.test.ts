import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import util from 'node:util';
import { loadOwnedSegmentSide, normalized as plain, assertFunctionBindings } from './helpers/owned-vm.js';
import { context, serviceGlobals, RecordMessage, FixturePty, PtyEventRing, fixturePtySpawn } from './fixtures/service-fixtures.js';
import type { FuseLivenessHost, ProbeProcess } from '../src/runtime/fuseLiveness.js';
import type { ArtifactUploadState } from '../src/runtime/artifactUploads.js';
async function compare(name: string, names: readonly string[], exercise: (raw: Record<string, unknown>) => unknown | Promise<unknown>, overrides: Record<string, unknown> = {}): Promise<void> {
    const before = await exercise(await loadOwnedSegmentSide(name, names, { ...serviceGlobals(), ...overrides }, 'baseline'));
    const after = await exercise(await loadOwnedSegmentSide(name, names, { ...serviceGlobals(), ...overrides }, 'typed'));
    assert.deepEqual(plain(after), plain(before), name);
}
test('managed-git-credentials: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['escapeGitConfigRegexp', 'encodeGitAuthScopeMarker', 'decodeGitAuthScopeMarker', 'getTokenizedInsteadOfKeyPattern', 'hasGitConfigExitCode'] as const;
    await compare('managed-git-credentials', selected, (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/managed-git-credentials.js'), typeof selected[number]>;
        const scopes = [{ hostname: 'github.com' }, { hostname: 'git.example.com', pathname: '/org/a+b' }];
        return { scopes: scopes.map(s => [m.encodeGitAuthScopeMarker(s), m.decodeGitAuthScopeMarker(m.encodeGitAuthScopeMarker(s)), m.getTokenizedInsteadOfKeyPattern(s)]), regex: m.escapeGitConfigRegexp('[x].*$'), exit: [m.hasGitConfigExitCode(Object.assign(new Error(), { code: 1 }), 1), m.hasGitConfigExitCode({}, 1)] };
    });
});
test('git: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['serializeUntrackedFilesForPatchId', 'appendDiffForPatchId', 'GitService', 'canonicalizeUrl'] as const;
    await compare('git', selected, async (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/git.js'), typeof selected[number]>;
        const service = new m.GitService(context);
        let reads = 0;
        service.getGitVersionUncached = async () => { reads++; return { major: 2, minor: 15, patch: 2 }; };
        const versions = await Promise.all([service.getGitVersion('/a'), service.getGitVersion('/b')]);
        await service.getGitVersion('/a');
        return { patch: m.serializeUntrackedFilesForPatchId([{ path: 'a b', contents: 'first\nsecond' }, { path: 'empty', contents: '' }]), append: m.appendDiffForPatchId('', 'a', 'b', ''), versions, reads, support: [service.supportsNoOptionalLocks({ major: 2, minor: 15, patch: 1 }), service.supportsNoOptionalLocks({ major: 2, minor: 15, patch: 2 })], refs: ['origin/main', 'abc', 'a'.repeat(40)].map(x => [service.isRemoteRef(x), service.isCommitHash(x)]), url: m.canonicalizeUrl('example.com/a').href };
    });
});
test('fuseLiveness: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['unescapeMountinfoPath', 'fuseConnectionMinorFromMountinfo', 'parsePid', 'FuseLivenessMonitor'] as const;
    await compare('fuseLiveness', selected, (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/fuseLiveness.js'), typeof selected[number]>;
        let now = 0;
        const scheduled: {
            ms: number;
            fn: () => void;
            canceled: boolean;
        }[] = [];
        const signals: [
            number,
            NodeJS.Signals
        ][] = [];
        const children: ProbeProcess[] = [];
        const events: string[] = [];
        const host: FuseLivenessHost = { now: () => now, schedule(ms, fn) { const item = { ms, fn, canceled: false }; scheduled.push(item); return { cancel() { item.canceled = true; } }; }, spawnProbe() {
                const child: ProbeProcess & {
                    exit?: (code: number | null) => void;
                } = { pid: 300 + children.length, unref() { }, onceExit(cb) { this.exit = cb; }, onceError() { } };
                children.push(child);
                return child;
            }, readFile: p => p === '/fuse.pid' ? '55' : undefined, processAlive: () => true, readCmdline: () => 'agent-store-fuse', kill: (pid, signal) => signals.push([pid, signal]), abortConnection: () => events.push('abort'), renameFile: () => false, removeFile() { }, safeCwd: () => '/safe', reportEvent: (_ctx, event) => events.push(event), spanFactory: ctx => ctx };
        const monitor = new m.FuseLivenessMonitor({ host, killEnabled: true });
        monitor.start(context);
        function step() { const item = scheduled.find(x => !x.canceled); assert.ok(item); item.canceled = true; now += item.ms; item.fn(); }
        step();
        step();
        step();
        step();
        step();
        monitor.stop();
        return { mount: m.fuseConnectionMinorFromMountinfo('/a b', '1 0 0:10 / /a\\040b rw - fuse.agent-store fuse rw\n2 0 0:11 / /a\\040b rw - fuse.agent-store fuse rw'), escape: m.unescapeMountinfoPath('a\\040b\\999'), pids: [undefined, ' 42 ', '1', 'abc'].map(x => m.parsePid(x)), signals, events, failures: monitor.consecutiveFailureCount, parked: monitor.parkedHelperPids.size, running: monitor.isRunning };
    });
});
test('machine-resources: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['cpuUsedMcores', 'parseMemInfoKb', 'MachineResourceMonitor', 'findCgroupMemoryLimit', 'resolveWorkloadUsageDir'] as const;
    await compare('machine-resources', selected, (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/machine-resources.js'), typeof selected[number]>;
        const monitor = new m.MachineResourceMonitor({ workspacePath: '/x', environment: 'pod' }), pressure: number[] = [];
        for (const used of [91n, 92n, 81n, 80n, 79n]) {
            monitor.evaluatePressure(used, 100n);
            pressure.push(monitor.pressure);
        }
        return { cpu: [m.cpuUsedMcores({ current: { busy: 20, total: 50 }, previous: { busy: 10, total: 30 } }, 2000), m.cpuUsedMcores({ current: { busy: 5, total: 20 }, previous: { busy: 10, total: 30 } }, 2000)], kb: m.parseMemInfoKb('MemAvailable: 1234 kB'), pressure, limit: m.findCgroupMemoryLimit('/sys/fs/cgroup/pod/a', (dir) => dir.endsWith('/pod') ? 200n : undefined), placement: [m.resolveWorkloadUsageDir('/sys/fs/cgroup/pod', { kind: 'armed', executable: '/bin/sh', argumentPrefix: [], workloadCgroupDir: '/sys/fs/cgroup/pod/work' }), m.resolveWorkloadUsageDir('/sys/fs/cgroup/pod', { kind: 'armed', executable: '/bin/sh', argumentPrefix: [], workloadCgroupDir: '/sys/fs/cgroup/other' })] };
    });
});
test('tmux-session-manager: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['parseTmuxSessionLines', 'buildShellEnvironmentRefreshCommand', 'classifyTmuxExecError', 'TmuxSessionManager'] as const;
    await compare('tmux-session-manager', selected, async (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/tmux-session-manager.js'), typeof selected[number]>;
        const manager = new m.TmuxSessionManager({ workspacePath: '/x', ptyManager: { spawn: () => 'pty-1' }, globalContext: context, execTmux: async () => '' });
        const order: string[] = [];
        const results = await Promise.all([manager.withGlobalEnvSyncLock(async () => { order.push('first'); await Promise.resolve(); order.push('first-end'); return 1; }), manager.withGlobalEnvSyncLock(() => { order.push('second'); return 2; })]);
        return { sessions: m.parseTmuxSessionLines('abc|3|2\n\nother|bad|0'), command: m.buildShellEnvironmentRefreshCommand({ tmuxBinaryPath: "/a'b/tmux", sessionName: 'session', tmuxConfigPath: '/c d' }), errors: [Object.assign(new Error('timed out'), { killed: true }), new Error('no server running'), new Error("can't find session")].map(e => m.classifyTmuxExecError(e).name), order, results };
    });
});
test('artifactUploads: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['decodeMountInfoPath', 'isPathBackedByAgentStoreMount', 'ArtifactUploadManager'] as const;
    await compare('artifactUploads', selected, async (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/artifactUploads.js'), typeof selected[number]>;
        const state: ArtifactUploadState = { status: 1, bytesUploaded: 0, uploadAttempts: 0, lastError: '', lastStartedAtUnixMs: 0, uploadId: 'fixture' };
        const manager = new m.ArtifactUploadManager(context, { artifactsRootPath: '/artifacts' });
        manager.artifactIdentity = x => x;
        const order: string[] = [];
        const first = manager.withPathMutex('/x', async () => { order.push('one'); await Promise.resolve(); order.push('one-end'); throw new Error('expected'); }).catch((error: unknown) => { assert.ok(error instanceof Error); return error.message; });
        const second = manager.withPathMutex('/x', () => { order.push('two'); return 2; });
        return { decode: m.decodeMountInfoPath('a\\040b\\011c\\134d'), mount: [m.isPathBackedByAgentStoreMount('/store/artifact', '1 0 0:2 / /store rw - fuse.agent-store fuse rw'), m.isPathBackedByAgentStoreMount('/store/nested/a', '1 0 0:2 / /store rw - fuse.agent-store fuse rw\n2 0 0:3 / /store/nested rw - ext4 disk rw')], mutations: [manager.hasFileChangedSinceUpload({ ...state, uploadedFileMtimeMs: 1, uploadedFileSizeBytes: 2 }, { updatedAtUnixMs: 1, sizeBytes: 2 }), manager.hasFileChangedSinceUpload({ ...state, uploadedFileMtimeMs: 1, uploadedFileSizeBytes: 2 }, { updatedAtUnixMs: 2, sizeBytes: 2 }), manager.hasFileChangedSinceUpload(state, { updatedAtUnixMs: 2, sizeBytes: 2 })], values: await Promise.all([first, second]), order, remainingMutexes: manager.pathMutexes.size };
    });
});
test('remoteAccess: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['PromiseLock', 'getWarmCursorServerBackoffMs', 'getWarmCursorServerMaxRetries', 'processTree', 'listeningSocketInodes', 'loopbackListenerOwner'] as const;
    await compare('remoteAccess', selected, async (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/remoteAccess.js'), typeof selected[number]>;
        const lock = new m.PromiseLock(), order: string[] = [];
        const releaseFirst = await lock.acquire();
        const pending = lock.acquire().then(release => { order.push('second'); release(); });
        order.push('first');
        releaseFirst();
        await pending;
        return { backoff: [0, 1, 2, 20].map(i => m.getWarmCursorServerBackoffMs(i)), retries: [0, 100, 300, 550].map(i => m.getWarmCursorServerMaxRetries(i)), order, locked: lock.isLocked, tree: await m.processTree(55), inodes: [...await m.listeningSocketInodes(8080)], owner: await m.loopbackListenerOwner({ port: 8080, pid: 55 }) };
    }, {
        "../interop/vendor/utils-workload-spawn.js": { spawnWorkload: () => { throw new Error('No spawn is allowed in this fixture'); } },
        "../interop/vendor/utils-promise-extras.js": { asyncMapValues: async (xs: number[], fn: (value: number) => Promise<number | undefined>) => Promise.all(xs.map(fn)) },
        "node:fs/promises": {
            readdir: async (p: string) => p === '/proc' ? ['1', '55', '56', '57', 'self'] : ['1'],
            readFile: async (p: string) => p === '/proc/net/tcp' ? 'header\n0: 0100007F:1F90 00000000:0000 0A 0 0 0 0 0 999' : p === '/proc/net/tcp6' ? 'header' : p === '/proc/55/stat' ? '55 (server name) S 1' : p === '/proc/56/stat' ? '56 (child) S 55' : p === '/proc/57/stat' ? '57 (grandchild) S 56' : '1 (init) S 0',
            readlink: async (p: string) => p.includes('/56/') ? 'socket:[999]' : 'socket:[0]',
        }
    });
});
test('pty-manager: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['resolvePtySpawnHelperPath', 'isScriptPath', 'toPtyDataBuffer', 'PtyManager'] as const;
    await compare('pty-manager', selected, (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/pty-manager.js'), typeof selected[number]>;
        const manager = new m.PtyManager(context, 3);
        const id = manager.spawn({ cwd: '/workspace', cols: 80, rows: 24, process: { shell: '/bin/bash', args: [] } }), received: unknown[] = [];
        const instance = manager.get(id);
        assert.ok(instance);
        const pty = instance.pty;
        assert.ok(pty instanceof FixturePty);
        pty.emitData('α');
        const initial = manager.attach(id, event => received.push(plain(event)));
        pty.emitData(Buffer.from('beta'));
        manager.sendInput(id, Buffer.from('x'));
        manager.resize(id, 90, 30);
        assert.ok(initial);
        const snapshot = manager.list();
        const resumed = manager.attach(id, () => { }, initial.events[0].eventId);
        assert.ok(resumed);
        const terminated = manager.terminate(id);
        return { paths: [m.resolvePtySpawnHelperPath({ platform: 'linux' }), m.resolvePtySpawnHelperPath({ platform: 'darwin', execPath: '/bin/node', argv1: '/bundle/main.js', existsSync: p => p === '/bundle/spawn-helper', resolveFromNodeModules: () => '/fallback' })], scripts: ['worker', './main.js', 'foo.cjs', undefined].map(x => m.isScriptPath(x)), bytes: [...m.toPtyDataBuffer('λ')], snapshot, initial: initial.events, resumed: resumed.events, received, input: pty.input, size: pty.size, terminated, remaining: manager.list() };
    }, {
        "../interop/vendor/node-pty.js": { spawn: () => new FixturePty() },
        "../interop/vendor/utils-workload-spawn.js": { spawnWorkload: fixturePtySpawn },
        "./ring-buffer.js": { RingBuffer: PtyEventRing }
    });
});
test('read-only-bare/repository: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['VmDaemonBareGitRepository', 'isObjectMissingStderr'] as const;
    await compare('read-only-bare/repository', selected, async (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/read-only-bare/repository.js'), typeof selected[number]>;
        const repo = new m.VmDaemonBareGitRepository('/bare', () => 'sha'), calls: (readonly string[])[] = [];
        repo.runPlumbing = async (_ctx, args) => {
            calls.push(args);
            if (args[0] === 'ls-tree')
                return { exitCode: 0, stdout: Buffer.from('a\0b/c\0'), stderr: Buffer.alloc(0) };
            if (args.at(-1)?.includes('missing'))
                return { exitCode: 1, stdout: Buffer.alloc(0), stderr: Buffer.from('does not exist') };
            return { exitCode: 0, stdout: Buffer.from(args[1] === '-t' ? 'blob' : 'hello'), stderr: Buffer.alloc(0) };
        };
        const contents = await repo.readFile(context, 'a');
        assert.ok(contents);
        return { text: contents.toString(), missing: await repo.readFile(context, 'missing'), file: await repo.stat(context, 'a'), missingStat: await repo.stat(context, 'missing'), files: await repo.listFiles(context, '/prefix/'), empty: [...await repo.readFiles(context, [])], calls, patterns: ['does not exist', 'not a blob', 'permission denied'].map(m.isObjectMissingStderr) };
    }, { "node:util": util, TextDecoder });
});
test('read-only-bare/request-context: isolated baseline and compiled TypeScript behavior match', async () => {
    const selected = ['mapRequiredPathBetweenRoots', 'mapOptionalPathBetweenRoots', 'canonicalizeReadOnlyPluginPaths', 'ReadOnlyPluginCacheService', 'cacheKeyForSha', 'requestContextErrorResult'] as const;
    await compare('read-only-bare/request-context', selected, async (raw) => {
        assertFunctionBindings(raw, selected);
        const m = raw as Pick<typeof import('../src/runtime/read-only-bare/request-context.js'), typeof selected[number]>;
        const service = new m.ReadOnlyPluginCacheService('/cache');
        const initial = service.isPluginSetIncomplete();
        const plugins = await service.getAllEnabledPlugins();
        const reloaded = await service.reload();
        let outside: string | undefined;
        try {
            m.mapRequiredPathBetweenRoots({ path: '/other/a', sourceRoot: '/cache', targetRoot: '/target' });
        }
        catch (error) {
            assert.ok(error instanceof Error);
            outside = error.message;
        }
        return { map: m.mapRequiredPathBetweenRoots({ path: '/cache/p/sub', sourceRoot: '/cache', targetRoot: '/target' }), optional: m.mapOptionalPathBetweenRoots({ sourceRoot: '/cache', targetRoot: '/target' }), outside, initial, complete: service.isPluginSetIncomplete(), plugins, reloaded, key: m.cacheKeyForSha({ sha: 'abc', pluginCacheRoot: '/cache' }), error: m.requestContextErrorResult('expected') };
    }, { "node:util": util, "node:os": os, "node:fs/promises": { readFile: async () => '{"plugins":[]}' }, "../interop/vendor/cursor-plugins.js": { PLUGINS_CACHE_ROOT: 'plugins/cache', loadPluginsFromCloudManifest: async () => [{ installPath: '/cache/plugin', hooks: { config: {}, sourcePath: '/cache/plugin/hooks.json' }, skills: [], rules: [], agents: [], commands: [] }] }, "../interop/vendor/proto-agent-v1-request-context-exec-pb.js": { RequestContextResult: RecordMessage, RequestContextError: RecordMessage } });
});
