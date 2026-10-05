import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import * as nodeStream from 'node:stream';
import { pipeline as streamPipeline } from 'node:stream/promises';
import { loadOwnedSegmentSide, normalized, assertFunctionBindings } from './helpers/owned-vm.js';
import { fixtureGlobals, fixtureContext, errorMessage, FixtureRecord, connect, codeEnum, FixtureSecretRedactor, FixtureRequestContext, FixtureProto, FixtureRule, FixtureSkill, FixtureSubagent, FixtureResource, FixtureResources, FixtureShellArgs, FixtureShellStream, fixtureStats, fixtureBigIntStats, fixtureDeferred } from './fixtures/foundation.js';
import type { Context } from '../src/interop/contracts/context.js';
import type { McpClient } from '../src/interop/contracts/mcp.js';
import type { GitExecutor } from '../src/interop/contracts/local-exec.js';
import type { ShellStreamExecutor } from '../src/interop/contracts/agent-exec.js';
import type { DiskBackedRequestContextOptions } from '../src/runtime/request-context-disk-cache.js';
import type { DesktopLeaseOwnerView, DesktopLeaseStorePort } from '../src/runtime/desktopLease.js';
import type { agent_v1_DesktopLeaseRequest } from '../src/interop/contracts/protobuf-generated.js';
import { serviceGlobals } from './fixtures/service-fixtures.js';
import { FixtureWebSocket, FixtureExecClient, FixtureExecControl } from './fixtures/foundation.js';
import type { ExecDisposeEnvironment } from '../src/runtime/exec.js';
import type { ControlledExecManager } from '../src/interop/contracts/agent-exec.js';
import type { PtyHostManagerPort } from '../src/runtime/pty-host-server.js';
import type { UniversalServerRequest, RpcRequest } from '../src/interop/contracts/connect.js';
import type { WebSocketHandlers } from '../src/runtime/connect-websocket-adapter.js';
test('foundation differential: ring-buffer', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('ring-buffer', ['RingBuffer'], globals, side);
        assertFunctionBindings(bindings, ["RingBuffer"]);
        const m = bindings as Pick<typeof import('../src/runtime/ring-buffer.js'), "RingBuffer">;
        return [0, 1, 3].map(cap => {
            const r = new m.RingBuffer(cap);
            for (const x of [undefined, 0, 1, 2, 3, 4])
                r.push(x);
            return [r.size, r.toArray(), r.sliceAfter(x => x === 3), r.sliceAfter(x => x === 'absent')];
        });
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: comma-separated-names', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('comma-separated-names', ['parseCommaSeparatedNames'], globals, side);
        assertFunctionBindings(bindings, ["parseCommaSeparatedNames"]);
        const m = bindings as Pick<typeof import('../src/runtime/comma-separated-names.js'), "parseCommaSeparatedNames">;
        return [undefined, '', ' a,b, a ,,B, café '].map(m.parseCommaSeparatedNames);
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: bundledToolPath', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "node:path": path };
        const bindings = await loadOwnedSegmentSide('bundledToolPath', ['prependExecDaemonBundleToPath', 'prependExecDaemonGatedToolsToPath'], globals, side);
        assertFunctionBindings(bindings, ["prependExecDaemonBundleToPath", "prependExecDaemonGatedToolsToPath"]);
        const m = bindings as Pick<typeof import('../src/runtime/bundledToolPath.js'), "prependExecDaemonBundleToPath" | "prependExecDaemonGatedToolsToPath">;
        return [{}, { PATH: ' ' }, { Path: '/a', PATH: '/b' }, { PATH: ':/bin::/a:' }].map(env => { m.prependExecDaemonBundleToPath(env); m.prependExecDaemonGatedToolsToPath(env); m.prependExecDaemonBundleToPath(env); return env; });
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: managed-environment', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/utils-safe-spawn-cwd.js": { SPAWN_CWD_HOP_ENV_VAR: 'CWD_HOP' }, "../interop/vendor/utils-workload-spawn.js": { WORKLOAD_CGROUP_ENV_VAR: 'CGROUP' } };
        const bindings = await loadOwnedSegmentSide('managed-environment', ['ManagedEnvironment'], globals, side);
        assertFunctionBindings(bindings, ["ManagedEnvironment"]);
        const m = bindings as Pick<typeof import('../src/runtime/managed-environment.js'), "ManagedEnvironment">;
        const env = new m.ManagedEnvironment();
        const out: unknown[] = [env.apply({ env: { KEEP: 'a', CURSOR_AUTH_TOKEN: 'b' } }), env.apply({ env: { NEW: 'c' }, replace: true }), env.snapshot(), env.remove(['NEW', 'absent']), env.snapshot()];
        for (const key of ['1BAD', 'xCURSOR_SANDBOXx', 'CGROUP', 'CWD_HOP'])
            try {
                env.apply({ env: { [key]: 'x' } });
            }
            catch (e) {
                out.push(errorMessage(e));
            }
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: trace-attributes', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('trace-attributes', ['parseTraceAttributes'], globals, side);
        assertFunctionBindings(bindings, ["parseTraceAttributes"]);
        const m = bindings as Pick<typeof import('../src/runtime/trace-attributes.js'), "parseTraceAttributes">;
        return ['', ' a=b, a=c,d=e=f ', 'broken', '=value'].map(s => {
            try {
                return m.parseTraceAttributes(s);
            }
            catch (e) {
                return errorMessage(e);
            }
        });
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: git-name-status', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('git-name-status', ['parseRawDiffZ', 'parseNumstatZ', 'numstatBigFileThreshold'], globals, side);
        assertFunctionBindings(bindings, ["parseRawDiffZ", "parseNumstatZ", "numstatBigFileThreshold"]);
        const m = bindings as Pick<typeof import('../src/runtime/git-name-status.js'), "parseRawDiffZ" | "parseNumstatZ" | "numstatBigFileThreshold">;
        return [
            m.parseRawDiffZ(':100644 100644 abc def R100\0a\0b\0:000000 100644 000 def A\0c\0'),
            [...m.parseNumstatZ('1\t2\tb\0-\t-\tbin\x003\t4\t\0old\0new\0')],
            [0, 9, 10, 11, 100].map(b => m.numstatBigFileThreshold([{ fromBytes: 5, toBytes: 5 }, { fromBytes: 5, toBytes: 1 }], b))
        ];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: cat-file-batch', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('cat-file-batch', ['CatFileBatchOutputParser', 'parseCatFileBatchCheck'], globals, side);
        assertFunctionBindings(bindings, ["CatFileBatchOutputParser", "parseCatFileBatchCheck"]);
        const m = bindings as Pick<typeof import('../src/runtime/cat-file-batch.js'), "CatFileBatchOutputParser" | "parseCatFileBatchCheck">;
        const body = Buffer.from('a😀z');
        const data = Buffer.concat([Buffer.from('a'.repeat(40) + ' blob ' + body.length + '\n'), body, Buffer.from('\nmissing missing\n' + 'b'.repeat(40) + ' tree 0\n\n')]);
        const out: unknown[] = [];
        for (let size = 1; size <= data.length; size++) {
            const p = new m.CatFileBatchOutputParser(3);
            for (let i = 0; i < data.length; i += size)
                p.push(data.subarray(i, i + size));
            out.push(p.finish());
        }
        for (const raw of ['abc blob 1\nx', 'a'.repeat(40) + ' blob 2\na', 'a'.repeat(40) + ' blob 1\nx!'])
            try {
                const p = new m.CatFileBatchOutputParser(1);
                p.push(Buffer.from(raw));
                out.push(p.finish());
            }
            catch (e) {
                out.push(errorMessage(e));
            }
        out.push([...m.parseCatFileBatchCheck('a'.repeat(40) + ' blob 99\n' + 'b'.repeat(40) + ' tree 9\n')]);
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: logger', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('logger', ['FilteredLoggerBackend', 'normalizeLogLevel', 'safeJsonStringify'], globals, side);
        assertFunctionBindings(bindings, ["FilteredLoggerBackend", "normalizeLogLevel", "safeJsonStringify"]);
        const m = bindings as Pick<typeof import('../src/runtime/logger.js'), "FilteredLoggerBackend" | "normalizeLogLevel" | "safeJsonStringify">;
        const out: unknown[] = [];
        for (const level of [undefined, 'DEBUG', 'warn', 'constructor', '__proto__', 'toString', 'bad']) {
            globals.process.env.LOG_LEVEL = level;
            const log = new m.FilteredLoggerBackend();
            for (const l of (['debug', 'info', 'warn', 'error'] as const))
                log.log(fixtureContext(), { level: l, message: 'msg', timestamp: new Date(0), logger: 'fixture', context: fixtureContext() });
            out.push([level, m.normalizeLogLevel(level), log.getMinLevel()]);
        }
        const cyclic: {
            self?: unknown;
        } = {};
        cyclic.self = cyclic;
        out.push(logs, m.safeJsonStringify(cyclic), m.safeJsonStringify(undefined));
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: startup-traceparent', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/context-otel.js": { SPAN_KEY: { symbol: Symbol('span'), defaultValue: undefined } }, "../interop/vendor/otel-trace-api.js": { trace: { wrapSpanContext: (x: unknown) => x } } };
        const bindings = await loadOwnedSegmentSide('startup-traceparent', ['parseTraceparentHeader', 'withStartupTraceparent'], globals, side);
        assertFunctionBindings(bindings, ["parseTraceparentHeader", "withStartupTraceparent"]);
        const m = bindings as Pick<typeof import('../src/runtime/startup-traceparent.js'), "parseTraceparentHeader" | "withStartupTraceparent">;
        const ctx = fixtureContext();
        return [undefined, '', '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01', 'ff-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01', '00-' + '0'.repeat(32) + '-' + 'b'.repeat(16) + '-01'].map(v => m.withStartupTraceparent(ctx, { EXEC_DAEMON_STARTUP_TRACEPARENT: v }));
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: secretRedaction', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "./comma-separated-names.js": { parseCommaSeparatedNames: (value: string | undefined) => [...new Set((value ?? '').split(',').map(s => s.trim()).filter(Boolean))] }, "../interop/vendor/secrets-exec.js": { SecretRedactor: FixtureSecretRedactor } };
        const bindings = await loadOwnedSegmentSide('secretRedaction', ['extractSyntheticGitAuthTokensFromGitConfigContents', 'createExecDaemonSecretAccessor', 'SecretRedactionState'], globals, side);
        assertFunctionBindings(bindings, ["extractSyntheticGitAuthTokensFromGitConfigContents", "createExecDaemonSecretAccessor", "SecretRedactionState"]);
        const m = bindings as Pick<typeof import('../src/runtime/secretRedaction.js'), "extractSyntheticGitAuthTokensFromGitConfigContents" | "createExecDaemonSecretAccessor" | "SecretRedactionState">;
        const parsed = m.extractSyntheticGitAuthTokensFromGitConfigContents('[url "https://x-access-token:one@example.test"]\n[url "https://x-access-token:two@example.test/repo"]\n[url "http://oauth2:no@example.test"]');
        const get = (name: string) => parsed[name];
        const access = m.createExecDaemonSecretAccessor({ NAME: 'value' }, get);
        const state = new m.SecretRedactionState(get);
        state.retainSecretsRemovedByEnvUpdate({ env: { CLOUD_AGENT_INJECTED_SECRET_NAMES: 'NAME', NAME: 'old' }, nextSecretNamesEnv: '', removedKeys: ['NAME'] });
        state.refreshFromEnv({ CURSOR_AUTH_TOKEN: 'current' });
        const r = state.getRedactor();
        assert.ok(r instanceof FixtureSecretRedactor);
        return [parsed, access('NAME'), access('__CURSOR_GITHUB_AUTH_TOKEN'), r.names.map(n => [n, r.access(n)])];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: scoped-secrets', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "./managed-environment.js": { validateManagedEnvironmentNames: () => { } } };
        const bindings = await loadOwnedSegmentSide('scoped-secrets', ['ScopedSecretStore', 'ScopedSecretsShellCoreExecutor'], globals, side);
        assertFunctionBindings(bindings, ["ScopedSecretStore", "ScopedSecretsShellCoreExecutor"]);
        const m = bindings as Pick<typeof import('../src/runtime/scoped-secrets.js'), "ScopedSecretStore" | "ScopedSecretsShellCoreExecutor">;
        const added: unknown[] = [];
        const store = new m.ScopedSecretStore(values => added.push(values));
        const out: unknown[] = [store.requestScopedEnvFor(undefined)];
        store.set('a', 1, { KEY: 'one' });
        store.set('b', 2, { OTHER: 'two' });
        store.set('a', 3, {});
        out.push(store.get('a'), store.revisionOf('a'), store.requestScopedEnvFor('a'), store.requestScopedEnvFor('b'));
        const wrapper = new m.ScopedSecretsShellCoreExecutor({ execute: (ctx, args) => args, getCwd: async (id) => id ?? '/root', getWorkspacePath: () => '/workspace' }, store);
        out.push(wrapper.execute(fixtureContext(), { secretScopeId: 'b', requestScopedEnv: { KEY: 'override' } }), await wrapper.getCwd('conversation'), wrapper.getWorkspacePath(), added);
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: mcp-token-storage', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('mcp-token-storage', ['createEphemeralScopedTokenStorage', 'getRefreshedMcpOAuthTokens', 'refreshedTokensInMemory'], globals, side);
        assertFunctionBindings(bindings, ["createEphemeralScopedTokenStorage", "getRefreshedMcpOAuthTokens"]);
        assert.ok(typeof bindings.refreshedTokensInMemory === 'object' && bindings.refreshedTokensInMemory !== null);
        const m = bindings as Pick<typeof import('../src/runtime/mcp-token-storage.js'), "createEphemeralScopedTokenStorage" | "getRefreshedMcpOAuthTokens" | "refreshedTokensInMemory">;
        m.refreshedTokensInMemory['https://example.test'] = { refreshToken: 'fixture' };
        const store = m.createEphemeralScopedTokenStorage();
        return [m.getRefreshedMcpOAuthTokens(), m.getRefreshedMcpOAuthTokens(), await store.loadTokens(), await store.loadClientInformation(), await store.saveTokens(), await store.saveClientInformation()];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: workspace-discovery', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "node:path": path, "node:fs/promises": { realpath: async (p: string) => p === '/workspace/alias' ? '/workspace/main' : p, stat: async (p: string) => ({ isDirectory: () => p !== '/repos/file' }), readdir: async () => ['z', 'file', 'a', 'nested'] }, "../interop/vendor/local-exec.js": { findGitRoot: async (_ctx: Context, _git: GitExecutor, p: string) => p === '/repos/nested' ? '/repos' : p } };
        const bindings = await loadOwnedSegmentSide('workspace-discovery', ['discoverExecDaemonWorkspacePaths'], globals, side);
        assertFunctionBindings(bindings, ["discoverExecDaemonWorkspacePaths"]);
        const m = bindings as Pick<typeof import('../src/runtime/workspace-discovery.js'), "discoverExecDaemonWorkspacePaths">;
        return m.discoverExecDaemonWorkspacePaths(fixtureContext(), { exec: async () => { throw new Error('Git execution is not expected'); } }, '/workspace/alias', { reposRoot: '/repos' });
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: refresh-git-token', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/local-exec.js": { LocalGitExecutor: class {
                } }, "./workspace-discovery.js": { discoverExecDaemonWorkspacePaths: async () => ({ workspacePaths: ['/a', '/b'], usesReposRoot: true }) } };
        const bindings = await loadOwnedSegmentSide('refresh-git-token', ['refreshGitTokenForCurrentWorkspace'], globals, side);
        assertFunctionBindings(bindings, ["refreshGitTokenForCurrentWorkspace"]);
        const m = bindings as Pick<typeof import('../src/runtime/refresh-git-token.js'), "refreshGitTokenForCurrentWorkspace">;
        const calls: unknown[] = [];
        await m.refreshGitTokenForCurrentWorkspace(fixtureContext(), { refreshGithubAccessToken: async (...args) => { calls.push(args); return { appliedCloneUsername: 'fixture', staleRewritesDisplaced: 0, remotesNormalized: 0 }; } }, 'fixture-token', 'example.test', '/workspace', { verbose: true, repoUrl: 'https://example.test/repo' });
        return calls;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: request-context-disk-cache', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        let raw = '';
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/context-logger.js": { createLogger: () => ({ info() { }, warn() { } }) }, "../interop/vendor/proto-agent-v1-request-context-exec-pb.js": { RequestContext: { fromJson: (value: unknown) => value }, RequestContextResult: FixtureRecord, RequestContextSuccess: FixtureRecord }, "node:fs/promises": { readFile: async () => raw }, "node:path": path };
        const bindings = await loadOwnedSegmentSide('request-context-disk-cache', ['readRequestContextDiskCache', 'mergeBakedStaticIntoRequestContext', 'DiskBackedRequestContextExecutor'], globals, side);
        assertFunctionBindings(bindings, ['readRequestContextDiskCache', 'mergeBakedStaticIntoRequestContext', 'DiskBackedRequestContextExecutor']);
        const m = bindings as Pick<typeof import('../src/runtime/request-context-disk-cache.js'), 'readRequestContextDiskCache' | 'mergeBakedStaticIntoRequestContext' | 'DiskBackedRequestContextExecutor'>;
        const reads: unknown[] = [];
        for (const value of ['null', 'broken', '[]', '{"version":0}', '{"version":1,"requestContext":null}', '{"version":1,"requestContext":{"rules":[]}}']) {
            raw = value;
            reads.push(await m.readRequestContextDiskCache(fixtureContext(), '/cache'));
        }
        const baked = new FixtureRequestContext();
        const calls: unknown[] = [];
        const options: DiskBackedRequestContextOptions<{
            useCached: boolean;
        }, Record<string, never>> = {
            read: async () => baked,
            createFullExecutor: () => ({ execute: async (...args) => { calls.push(args); return Object.assign(new FixtureProto(), { result: { case: undefined } }); } }),
            getPluginRules: async () => [new FixtureRule('p')], getPluginAgentSkills: async () => [], getPluginSubagents: async () => [new FixtureSubagent('sub')],
            dedupeRules: rules => rules, updateBaked: async (_ctx, result) => { result.cloudRule += '-updated'; }
        };
        const executor = new m.DiskBackedRequestContextExecutor(options);
        const hit = await executor.execute(fixtureContext(), { useCached: true }, {});
        const miss = await executor.execute(fixtureContext(), { useCached: false }, {});
        assert.equal(hit.result.case, 'success');
        assert.equal(calls.length, 1);
        assert.equal(baked.cloudRule, 'cloud');
        assert.deepEqual(baked.rules.map(rule => rule.fullPath), ['b']);
        return [reads, hit, miss, baked.rules, calls.length];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: plugin-install/errors', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum } };
        const bindings = await loadOwnedSegmentSide('plugin-install/errors', ['pluginInstallFailureMessage', 'isDownloadTimeoutError', 'toPluginInstallConnectError'], globals, side);
        assertFunctionBindings(bindings, ["pluginInstallFailureMessage", "isDownloadTimeoutError", "toPluginInstallConnectError"]);
        const m = bindings as Pick<typeof import('../src/runtime/plugin-install/errors.js'), "pluginInstallFailureMessage" | "isDownloadTimeoutError" | "toPluginInstallConnectError">;
        const out: unknown[] = [];
        for (const phase of (['download', 'filesystem', 'extraction'] as const))
            for (const kind of (['timeout', 'failed'] as const))
                out.push(m.pluginInstallFailureMessage(phase, kind));
        out.push(m.toPluginInstallConnectError('raw rejection', 'download').message);
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: plugin-install/limits', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('plugin-install/limits', ['parseTarVerboseListingSize'], globals, side);
        assertFunctionBindings(bindings, ["parseTarVerboseListingSize"]);
        const m = bindings as Pick<typeof import('../src/runtime/plugin-install/limits.js'), "parseTarVerboseListingSize">;
        return ['', 'bad', '-rw-r--r-- user/group 1234 2024-01-15 12:00 file', '-rw-r--r--  0 user group  543 May 19 12:00 file'].map(m.parseTarVerboseListingSize);
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: plugin-install/paths', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "node:path": path, "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum } };
        const bindings = await loadOwnedSegmentSide('plugin-install/paths', ['isPathStrictlyInside', 'isPathEqualOrInside', 'isAllowedPluginInstallTargetRoot', 'getMatchingAllowedPluginCacheRoot'], globals, side);
        assertFunctionBindings(bindings, ["isPathStrictlyInside", "isPathEqualOrInside", "isAllowedPluginInstallTargetRoot", "getMatchingAllowedPluginCacheRoot"]);
        const m = bindings as Pick<typeof import('../src/runtime/plugin-install/paths.js'), "isPathStrictlyInside" | "isPathEqualOrInside" | "isAllowedPluginInstallTargetRoot" | "getMatchingAllowedPluginCacheRoot">;
        globals.process.env.HOME = '/home/test';
        const out: unknown[] = [];
        for (const p of ['/home/test/.cursor/plugins/cache', '/home/test/.cursor/plugins/cache/a', '/home/test/.cursor/plugins/cache-evil/a', '/tmp/cursor-readonly-plugin-cache/a', '/etc', 'relative']) {
            out.push([p, m.isAllowedPluginInstallTargetRoot(p)]);
            try {
                out.push(m.getMatchingAllowedPluginCacheRoot(p));
            }
            catch (e) {
                out.push(errorMessage(e));
            }
        }
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: plugin-install/tar', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "node:child_process": { spawn() { throw new Error('Fixture must not spawn'); } }, "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "./plugin-install/limits.js": {
                ...{
                    PLUGIN_ARTIFACT_MAX_ENTRIES: 3
                },
                ...{
                    PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES: 10
                },
                ...{
                    parseTarVerboseListingSize: (s: string) => { const m = /^\S+\s+\S+\/\S+\s+(\d+)\s+\d{4}-\d{2}-\d{2}/.exec(s); return m ? Number(m[1]) : null; }
                }
            } };
        const bindings = await loadOwnedSegmentSide('plugin-install/tar', ['recordTarListingLine', 'buildExtractTarArgs'], globals, side);
        assertFunctionBindings(bindings, ["recordTarListingLine", "buildExtractTarArgs"]);
        const m = bindings as Pick<typeof import('../src/runtime/plugin-install/tar.js'), "recordTarListingLine" | "buildExtractTarArgs">;
        const out: unknown[] = [];
        for (const line of ['', '-rw-r--r-- u/g 9 2024-01-15 12:00 file', 'drwxr-xr-x u/g 0 2024-01-15 12:00 dir', 'lrwxr-xr-x u/g 3 2024-01-15 12:00 link', 'prw------- u/g 0 2024-01-15 12:00 fifo', '-bad']) {
            const stats = { entryCount: 0, totalUncompressedBytes: 0 };
            try {
                m.recordTarListingLine(line, stats);
                out.push(stats);
            }
            catch (e) {
                out.push(errorMessage(e));
            }
        }
        out.push(m.buildExtractTarArgs('/archive', '/target'));
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: agent-store-skills', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('agent-store-skills', ['resolveAgentStoreSkillRoots', 'createAgentStoreSkillsMountLatch'], globals, side);
        assertFunctionBindings(bindings, ["resolveAgentStoreSkillRoots", "createAgentStoreSkillsMountLatch"]);
        const m = bindings as Pick<typeof import('../src/runtime/agent-store-skills.js'), "resolveAgentStoreSkillRoots" | "createAgentStoreSkillsMountLatch">;
        const calls: unknown[] = [];
        let pass = 0;
        const latch = m.createAgentStoreSkillsMountLatch({ roots: ['/a', '/b', '/c'], probeMount: async (p) => { calls.push(p); return p === '/a' ? 'mounted' : p === '/b' ? 'unresponsive' : pass ? 'mounted' : 'absent'; }, reloadRoots: r => calls.push(['reload', r]), onUnresponsive: r => calls.push(['unresponsive', r]) });
        await Promise.all([latch(), latch()]);
        pass = 1;
        await latch();
        await latch();
        return [m.resolveAgentStoreSkillRoots([' a ', 'b', 'a', '']), calls];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: dedupe-agent-skill-rules', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('dedupe-agent-skill-rules', ['removeDuplicatedAgentSkillRules', 'withDeduplicatedAgentSkillRules'], globals, side);
        assertFunctionBindings(bindings, ["removeDuplicatedAgentSkillRules", "withDeduplicatedAgentSkillRules"]);
        const m = bindings as Pick<typeof import('../src/runtime/dedupe-agent-skill-rules.js'), "removeDuplicatedAgentSkillRules" | "withDeduplicatedAgentSkillRules">;
        const rules = [new FixtureRule('a', 'agentFetched'), new FixtureRule('a', 'global'), new FixtureRule('b', 'agentFetched')];
        const skills = [new FixtureSkill('a')];
        let forwarded = 0;
        const inner = { getAllCursorRules: async () => rules, reload: () => forwarded++, dispose: () => forwarded++, onDidChangeRules: (cb: () => void) => { cb(); return () => forwarded++; } };
        const service = m.withDeduplicatedAgentSkillRules(inner, async () => skills);
        const filtered = await service.getAllCursorRules(fixtureContext());
        service.reload(fixtureContext());
        service.onDidChangeRules(() => forwarded++)();
        service.dispose();
        return [filtered, forwarded, m.removeDuplicatedAgentSkillRules(rules, []) === rules];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: canvasPreviewPersistRoot', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('canvasPreviewPersistRoot', ['resolveCanvasPreviewPersistArtifactsRoot'], globals, side);
        assertFunctionBindings(bindings, ["resolveCanvasPreviewPersistArtifactsRoot"]);
        const m = bindings as Pick<typeof import('../src/runtime/canvasPreviewPersistRoot.js'), "resolveCanvasPreviewPersistArtifactsRoot">;
        const id = '12345678-abcd-4234-8234-123456789abc';
        const common = { fallbackArtifactsRoot: '/fallback', realpath: async () => '/cursor/stores/' + id + '/artifacts', isFuseBacked: async () => true };
        return [await m.resolveCanvasPreviewPersistArtifactsRoot({ ...common, conversationId: id }), await m.resolveCanvasPreviewPersistArtifactsRoot({ ...common, conversationId: 'bad' }), await m.resolveCanvasPreviewPersistArtifactsRoot({ ...common, realpath: async () => '/escape', conversationId: 'bad' }), await m.resolveCanvasPreviewPersistArtifactsRoot({ ...common, isFuseBacked: async () => false })];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: desktopLease', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "../interop/vendor/proto-agent-v1-control-service-pb.js": { DesktopLeaseStatus: { OK: 1, BUSY: 2, INVALID_REQUEST: 3 }, DesktopLeaseActorKind: { HUMAN: 1, AGENT: 2 }, DesktopLeaseResponse: FixtureRecord, DesktopLeaseOwner: FixtureRecord } };
        const bindings = await loadOwnedSegmentSide('desktopLease', ['handleDesktopLease'], globals, side);
        assertFunctionBindings(bindings, ["handleDesktopLease"]);
        const m = bindings as Pick<typeof import('../src/runtime/desktopLease.js'), "handleDesktopLease">;
        const owner: DesktopLeaseOwnerView = { kind: 'human', actorId: 'actor', expiresAtUnixMs: 123 };
        const store: DesktopLeaseStorePort = { acquire: async () => ({ status: 'ok', owner, message: 'acquired' }), release: () => ({ status: 'ok', owner: undefined, message: 'released' }), getOwner: () => owner };
        const out: unknown[] = [];
        for (const action of [{ case: 'acquire', value: Object.assign(new FixtureProto(), { actorId: 'actor' }) }, { case: 'release', value: Object.assign(new FixtureProto(), { actorId: 'actor' }) }, { case: 'getState', value: new FixtureProto() }, { case: undefined }] satisfies agent_v1_DesktopLeaseRequest['action'][])
            out.push(await m.handleDesktopLease(store, Object.assign(new FixtureProto(), { action })));
        try {
            await m.handleDesktopLease(undefined, Object.assign(new FixtureProto(), { action: { case: undefined } }));
        }
        catch (e) {
            out.push(errorMessage(e));
        }
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: global-hook-context', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs) };
        const bindings = await loadOwnedSegmentSide('global-hook-context', ['resolveExecDaemonGlobalHookContext'], globals, side);
        assertFunctionBindings(bindings, ["resolveExecDaemonGlobalHookContext"]);
        const m = bindings as Pick<typeof import('../src/runtime/global-hook-context.js'), "resolveExecDaemonGlobalHookContext">;
        return [m.resolveExecDaemonGlobalHookContext(), m.resolveExecDaemonGlobalHookContext({ env: { CURSOR_CLOUD_AGENT_USER_EMAIL_ADDRESS: ' fixture@example.test ' } }), m.resolveExecDaemonGlobalHookContext({ env: {}, userEmail: ' explicit@example.test ', cursorVersion: '2' })];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: export-file', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "node:path": path };
        const bindings = await loadOwnedSegmentSide('export-file', ['assertExportableRegularFile', 'isPathWithinRoot'], globals, side);
        assertFunctionBindings(bindings, ["assertExportableRegularFile", "isPathWithinRoot"]);
        const m = bindings as Pick<typeof import('../src/runtime/export-file.js'), "assertExportableRegularFile" | "isPathWithinRoot">;
        const out: unknown[] = [];
        for (const f of [fixtureStats(false, 1), fixtureStats(true, 2), fixtureStats(true, 1), fixtureBigIntStats(true, 1n), fixtureBigIntStats(true, 2n)])
            try {
                m.assertExportableRegularFile(f);
                out.push('ok');
            }
            catch (e) {
                out.push(errorMessage(e));
            }
        for (const targetPath of ['/root/a', '/root', '/root2/a', '/root/../escape'])
            out.push(m.isPathWithinRoot({ rootPath: '/root', targetPath }));
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: mcp-cloud-env', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "./comma-separated-names.js": { parseCommaSeparatedNames: (v: string | undefined) => (v ?? '').split(',').filter(Boolean) }, "./managed-environment.js": { SANDBOX_ENV_RESTORE_ENV_VAR: '__CURSOR_SANDBOX_ENV_RESTORE' }, "./secretRedaction.js": { ALWAYS_REDACTED_ENV_SECRET_NAMES: ['CURSOR_API_KEY', 'CURSOR_AUTH_TOKEN'], CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR: 'CLOUD_AGENT_INJECTED_SECRET_NAMES' }, "../interop/vendor/mcp-agent-exec.js": { expandLocalEnvMap: (env: Record<string, string>, lookup: (name: string) => string | undefined) => Object.fromEntries(Object.entries(env).map(([k, v]) => [k, v.replace(/\$\{(\w+)\}/g, (_: string, n: string) => lookup(n) ?? '${' + n + '}')])) } };
        const bindings = await loadOwnedSegmentSide('mcp-cloud-env', ['createCloudMcpInjectedSecretAccessor', 'expandCloudMcpStdioEnvOnly', 'withInheritedExecDaemonEnv'], globals, side);
        assertFunctionBindings(bindings, ["createCloudMcpInjectedSecretAccessor", "expandCloudMcpStdioEnvOnly", "withInheritedExecDaemonEnv"]);
        const m = bindings as Pick<typeof import('../src/runtime/mcp-cloud-env.js'), "createCloudMcpInjectedSecretAccessor" | "expandCloudMcpStdioEnvOnly" | "withInheritedExecDaemonEnv">;
        const accessor = m.createCloudMcpInjectedSecretAccessor({ secretNamesEnv: 'KEEP', secretAccessor: n => n === 'KEEP' ? 'fixture' : undefined });
        const stdio = { command: 'server', env: { EXPLICIT: 'override', TEMPLATE: '${KEEP}' } };
        const remote = { url: 'https://example.test' };
        return [accessor('KEEP'), accessor('OTHER'), m.expandCloudMcpStdioEnvOnly({ mcpServers: { stdio, remote } }, accessor), m.withInheritedExecDaemonEnv(stdio, { KEEP: 'fixture', CURSOR_AUTH_TOKEN: 'private', ALIAS: 'x-private-y', __CURSOR_SANDBOX_ENV_RESTORE: 'restored', EMPTY: '', EXPLICIT: 'inherited' }), m.withInheritedExecDaemonEnv(remote, { KEEP: 'fixture' }) === remote];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: shell-oom-kill', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const shellResource = new FixtureResource<ShellStreamExecutor>('shell');
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/agent-exec.js": { shellStreamExecutorResource: shellResource }, "../interop/vendor/context-logger.js": { createLogger: () => ({ warn() { } }) }, "node:path": path, "../interop/vendor/proto-agent-v1-shell-exec-pb.js": { ShellOomKill_Kind: { UNCONFIRMED: 1, COMMAND_KILLED: 2, COMMAND_FAILED: 3, 1: 'UNCONFIRMED', 2: 'COMMAND_KILLED', 3: 'COMMAND_FAILED' }, ShellOomKill: FixtureRecord } };
        const bindings = await loadOwnedSegmentSide('shell-oom-kill', ['ShellOomKillProbe', 'withShellOomKillReporting', 'classifyFailedCommand'], globals, side);
        assertFunctionBindings(bindings, ['ShellOomKillProbe', 'withShellOomKillReporting', 'classifyFailedCommand']);
        const m = bindings as Pick<typeof import('../src/runtime/shell-oom-kill.js'), 'ShellOomKillProbe' | 'withShellOomKillReporting' | 'classifyFailedCommand'>;
        let counter = 1;
        const probe = new m.ShellOomKillProbe({ commandCgroupDir: '/sys/fs/cgroup/test', read: file => file.endsWith('memory.events') ? 'oom_kill ' + counter + '\n' : file.endsWith('memory.max') ? '1000' : undefined, totalMemoryBytes: () => 9000n });
        const shell: ShellStreamExecutor = { async *execute() { counter = 3; yield new FixtureShellStream(137); } };
        const other = new FixtureResource<{
            keep: boolean;
        }>('other'), otherValue = { keep: true };
        const values = new FixtureResources();
        values.register(shellResource, shell);
        values.register(other, otherValue);
        const wrapped = m.withShellOomKillReporting(values, probe);
        const stream = wrapped.get(shellResource);
        assert.ok(stream);
        const streams: unknown[] = [];
        for await (const event of stream.execute(fixtureContext(), new FixtureShellArgs()))
            streams.push(event);
        const entries = [...wrapped.entries()];
        const absent = m.withShellOomKillReporting(new FixtureResources(), probe).get(shellResource);
        assert.ok(absent);
        let absentError: string | undefined;
        try {
            for await (const event of absent.execute(fixtureContext(), new FixtureShellArgs()))
                streams.push(event);
        }
        catch (error) {
            absentError = errorMessage(error);
        }
        assert.equal(wrapped.get(other), otherValue);
        assert.equal(entries[1]?.[1], otherValue);
        assert.ok(absentError);
        return [streams, wrapped.get(other) === otherValue, entries[1]?.[1] === otherValue, absent !== undefined, absentError, [undefined, { start: 1, end: 1 }, { start: 1, end: 2 }].map(counts => [0, 1, 137, -1].map(code => m.classifyFailedCommand(code, counts)))];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: lazy-mcp-client', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), setTimeout, clearTimeout };
        const bindings = await loadOwnedSegmentSide('lazy-mcp-client', ['LazyMcpClient'], globals, side);
        assertFunctionBindings(bindings, ['LazyMcpClient']);
        const m = bindings as Pick<typeof import('../src/runtime/lazy-mcp-client.js'), 'LazyMcpClient'>;
        let loads = 0, closes = 0, loaded = 0;
        const loading = fixtureDeferred<McpClient>();
        const calls: unknown[] = [];
        const client: McpClient = { serverName: 'fixture', config: { command: 'x' }, getTools: async () => [{ name: 'tool', inputSchema: { type: 'object' } }], getState: async () => ({ kind: 'ready' }), getInstructions: async () => 'instructions',
            callTool: async (...args) => { calls.push(args.slice(1)); return { content: [], isError: false }; }, listResources: async () => ({ resources: [] }), readResource: async () => ({ contents: [] }), listPrompts: async () => [], getPrompt: async () => ({ messages: [] }), close: async () => { closes++; } };
        const lazy = new m.LazyMcpClient('fixture', { command: 'x' }, async () => { loads++; return loading.promise; }, () => { loaded++; }, 1000);
        const ctx = fixtureContext();
        const toolsBefore = await lazy.getTools(ctx), a = lazy.ensureLoaded(ctx), b = lazy.ensureLoaded(ctx), loadingState = await lazy.getState(ctx);
        loading.resolve(client);
        await Promise.all([a, b]);
        assert.equal(loads, 1);
        assert.equal(loaded, 1);
        const out: unknown[] = [toolsBefore, loadingState, loads, loaded, await lazy.getTools(ctx), await lazy.getState(ctx), await lazy.callTool(ctx, 'tool', {}, 'id', undefined), calls];
        await lazy.close();
        out.push(closes);
        try {
            await lazy.ensureLoaded(ctx);
        }
        catch (error) {
            out.push(errorMessage(error));
        }
        let lateCloses = 0;
        const lateLoading = fixtureDeferred<McpClient>();
        const late = new m.LazyMcpClient('late', { command: 'x' }, () => lateLoading.promise, () => { }, 1);
        try {
            await late.ensureLoaded(ctx);
        }
        catch (error) {
            out.push(errorMessage(error));
        }
        lateLoading.resolve({ ...client, close: async () => { lateCloses++; } });
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        out.push(await late.getState(ctx), lateCloses);
        assert.equal(lateCloses, 1);
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: recording-renderer', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const calls: unknown[] = [];
        let errors: string[] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/setup-private.js": {
                ...{
                    DEFAULT_RENDERER_CONFIG: { fixture: true }
                },
                ...{
                    generateRenderPlan: async (options: {
                        sessionDir: string;
                        fps?: number;
                    }, config: {
                        fixture: boolean;
                    }) => { calls.push([options, config]); return { diagnostics: { errors } }; }
                },
                ...{
                    renderFromPlan: async (options: unknown) => { calls.push(options); }
                }
            } };
        const bindings = await loadOwnedSegmentSide('recording-renderer', ['ExecDaemonPolishedRecordingRenderer'], globals, side);
        assertFunctionBindings(bindings, ['ExecDaemonPolishedRecordingRenderer']);
        const m = bindings as Pick<typeof import('../src/runtime/recording-renderer.js'), 'ExecDaemonPolishedRecordingRenderer'>;
        const renderer = new m.ExecDaemonPolishedRecordingRenderer();
        await renderer.renderRecordingSession({ stagingSessionDir: '/stage', fps: 30, outputVideoPath: '/video', includeBrandTag: false });
        errors = ['one', 'two'];
        try {
            await renderer.renderRecordingSession({ stagingSessionDir: '/stage', outputVideoPath: '/video' });
        }
        catch (error) {
            calls.push(errorMessage(error));
        }
        assert.equal(calls.at(-1), 'Plan generation failed: one, two');
        return calls;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: webp-codec-startup', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        let registration: { registered: boolean; reason?: string } = { registered: true };
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/local-exec.js": { registerLocalWebpCodec: (): {
                    registered: boolean;
                    reason?: string;
                } => registration }, "../interop/vendor/context-logger.js": { createLogger: () => ({ info() { }, error() { } }) } };
        const bindings = await loadOwnedSegmentSide('webp-codec-startup', ['registerExecDaemonWebpCodec'], globals, side);
        assertFunctionBindings(bindings, ["registerExecDaemonWebpCodec"]);
        const m = bindings as Pick<typeof import('../src/runtime/webp-codec-startup.js'), "registerExecDaemonWebpCodec">;
        const out: unknown[] = [];
        for (const nextRegistration of [{ registered: true }, { registered: false, reason: 'fixture unavailable' }]) {
            registration = nextRegistration;
            out.push(m.registerExecDaemonWebpCodec(fixtureContext()));
        }
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: errors', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "node:fs": { existsSync: (p: string) => p === '/exists' } };
        const bindings = await loadOwnedSegmentSide('errors', ['annotateSpawnEnoent', 'toInternalConnectError', 'isClientDisconnectError'], globals, side);
        assertFunctionBindings(bindings, ["annotateSpawnEnoent", "toInternalConnectError", "isClientDisconnectError"]);
        const m = bindings as Pick<typeof import('../src/runtime/errors.js'), "annotateSpawnEnoent" | "toInternalConnectError" | "isClientDisconnectError">;
        const out: unknown[] = [];
        for (const cwd of ['/exists', '/missing']) {
            const error = Object.assign(new Error('spawn x ENOENT'), { code: 'ENOENT' });
            out.push(m.annotateSpawnEnoent(error, { command: 'x', cwd }));
        }
        out.push(m.toInternalConnectError('Prefix', 'raw error').message, m.isClientDisconnectError('no'));
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: read-file', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const data = Buffer.from('abcdef');
        let closes = 0;
        const stat = { size: 6n, mtimeNs: 1n, ctimeNs: 1n, dev: 1n, ino: 2n, isFile: () => true };
        const file = { fd: 12, stat: async () => stat, close: async () => { closes++; }, read: async (buffer: Buffer, offset: number, length: number, position: number) => ({ bytesRead: data.copy(buffer, offset, position, Math.min(position + length, data.length)) }) };
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "node:fs": { constants: { O_RDONLY: 0, O_NONBLOCK: 1 } }, "node:crypto": await import('node:crypto'), "../interop/vendor/server-private.js": {
                ReadFileResponse: FixtureRecord
            }, "./errors.js": {
                toInternalConnectError: (prefix: string, error: unknown) => new Error(prefix + ': ' + errorMessage(error))
            }, "node:fs/promises": { open: async () => file, readlink: async () => '/fixture/file', stat: async () => stat } };
        const bindings = await loadOwnedSegmentSide('read-file', ['readFile'], globals, side);
        assertFunctionBindings(bindings, ['readFile']);
        const m = bindings as Pick<typeof import('../src/runtime/read-file.js'), 'readFile'>;
        const out: unknown[] = [];
        for await (const item of m.readFile(fixtureContext(), { path: '/fixture/file', maxBytes: 0n, offset: 1n, length: 3n }))
            out.push(item);
        assert.equal(closes, 1);
        out.push(closes);
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: cloud-plugins-service', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        let raw = '';
        const globals = { ...fixtureGlobals(logs), "node:path": path, "node:util": { debuglog: () => () => { } }, "node:fs/promises": { readFile: async () => raw }, "../interop/vendor/cursor-plugins.js": { PLUGINS_CACHE_ROOT: 'plugins/cache', loadPluginsFromCloudManifest: async (manifest: {
                    plugins: unknown[];
                }) => manifest.plugins.map(entry => { assert.ok(typeof entry === 'object' && entry !== null && 'id' in entry); return { id: entry.id }; }) } };
        const bindings = await loadOwnedSegmentSide('cloud-plugins-service', ['CloudPluginsService'], globals, side);
        assertFunctionBindings(bindings, ['CloudPluginsService']);
        const m = bindings as Pick<typeof import('../src/runtime/cloud-plugins-service.js'), 'CloudPluginsService'>;
        const out: unknown[] = [];
        for (const value of ['null', 'bad', '{}', '{"plugins":[]}', '{"plugins":[null]}', '{"plugins":[{"id":"ok"}]}']) {
            raw = value;
            const service = new m.CloudPluginsService('/home/test');
            const plugins = await service.getAllEnabledPlugins();
            out.push([plugins, service.isPluginSetIncomplete(), service.getLoadFailures()]);
        }
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: plugin-install/download', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const out: unknown[] = [];
        let chunks: string[] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "./plugin-install/limits.js": {
                PLUGIN_ARTIFACT_MAX_BYTES: 10
            }, "node:stream": nodeStream, "node:stream/promises": { pipeline: (source: NodeJS.ReadableStream, destination: NodeJS.WritableStream) => streamPipeline(source, destination) }, AbortSignal: { timeout: (ms: number) => AbortSignal.timeout(ms) }, "node:fs": { createWriteStream: (_path: string, options: {
                    flags: string;
                    mode: number;
                }) => { out.push(options); return new nodeStream.Writable({ write(chunk: Buffer, _encoding: BufferEncoding, done: (error?: Error | null) => void) { chunks.push(chunk.toString()); done(); } }); } } };
        const bindings = await loadOwnedSegmentSide('plugin-install/download', ['downloadPluginArtifactToFile'], globals, side);
        assertFunctionBindings(bindings, ['downloadPluginArtifactToFile']);
        const m = bindings as Pick<typeof import('../src/runtime/plugin-install/download.js'), 'downloadPluginArtifactToFile'>;
        for (const contents of ['okay', '01234567890123456789']) {
            chunks = [];
            try {
                await m.downloadPluginArtifactToFile({ fetchImpl: async () => new Response(contents), downloadUrl: 'https://example.test/fixture', timeoutMs: 1000, destinationPath: '/fixture' });
                out.push(chunks);
            }
            catch (error) {
                out.push(errorMessage(error));
            }
        }
        assert.equal(out.at(-1), 'plugin artifact too large');
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: install-plugin-artifact', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        let mode = 'ok';
        let calls: unknown[] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/context-logger.js": { createLogger: () => ({ info() { }, warn() { } }) }, "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "node:path": path, "../interop/vendor/proto-agent-v1-control-service-pb.js": { InstallPluginArtifactResponse: FixtureRecord }, "./plugin-install/limits.js": {
                ...{
                    PLUGIN_INSTALL_TIMEOUT_MS: 115000
                },
                ...{
                    PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS: 45000
                }
            }, "./plugin-install/paths.js": {
                ...{
                    isAllowedPluginInstallTargetRoot: () => true
                },
                ...{
                    resetPluginInstallTargetDirectory: async (target: string) => { calls.push(['reset', target]); }
                }
            }, "./plugin-install/errors.js": {
                ...{
                    remainingInstallTimeoutMs: () => 100
                },
                ...{
                    remainingPhaseTimeoutMs: () => 100
                },
                ...{
                    pluginInstallFailureMessage: () => 'fixture extraction failed'
                },
                ...{
                    toPluginInstallConnectError: (error: unknown, phase: string) => error instanceof connect.ConnectError ? error : new connect.ConnectError(phase + ' failed', 13)
                }
            }, "./plugin-install/tar.js": {
                ...{
                    validateTarballBeforeExtraction: async () => { }
                },
                ...{
                    verifyExtractedArtifactPaths: async () => { }
                },
                ...{
                    extractTarball: async () => mode === 'extraction' ? 1 : 0
                }
            }, "node:fs/promises": { rm: async (target: string, options: {
                    force?: boolean;
                    recursive?: boolean;
                }) => { calls.push(['rm', target, options]); } }, "./plugin-install/download.js": {
                downloadPluginArtifactToFile: async () => {
                    calls.push(['download']);
                    if (mode === 'download')
                        throw new Error('fixture download error');
                }
            } };
        const bindings = await loadOwnedSegmentSide('install-plugin-artifact', ['installPluginArtifactFromUrl'], globals, side);
        assertFunctionBindings(bindings, ['installPluginArtifactFromUrl']);
        const m = bindings as Pick<typeof import('../src/runtime/install-plugin-artifact.js'), 'installPluginArtifactFromUrl'>;
        const out: unknown[] = [];
        for (const variant of ['ok', 'extraction', 'download', 'invalid']) {
            mode = variant;
            calls = [];
            const request = Object.assign(new FixtureProto(), { targetRoot: mode === 'invalid' ? '' : '/cache/p', downloadUrl: 'https://example.test/artifact', artifactDigest: 'fixture' });
            try {
                await m.installPluginArtifactFromUrl(fixtureContext(), request, { fetchImpl: async () => new Response('fixture') });
                calls.push('ok');
            }
            catch (error) {
                calls.push(errorMessage(error));
            }
            if (mode === 'ok')
                assert.equal(calls.at(-1), 'ok');
            out.push(calls);
        }
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: exec', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const manager: ControlledExecManager = { register() { }, handleControlMessage() { }, async *handle() { yield new FixtureExecClient(1); yield new FixtureExecControl(); } };
        const globals = { ...fixtureGlobals(logs), Symbol, "../interop/vendor/context-logger.js": { createLogger: () => ({ info() { }, debug() { }, error() { } }) }, "./read-file.js": {
                readFile: () => { }
            }, "../interop/vendor/agent-exec.js": { SimpleControlledExecManager: { fromResources: () => manager } }, "../interop/vendor/context-otel.js": { withSpan: (ctx: Context) => ctx, getSpan: () => undefined }, "../interop/vendor/proto-agent-v1-exec-pb.js": { ExecClientMessage: FixtureExecClient, ExecClientControlMessage: FixtureExecControl }, "../interop/vendor/server-private.js": {
                ExecStreamElement: FixtureRecord
            }, "./errors.js": {
                ...{
                    isClientDisconnectError: () => false
                },
                ...{
                    toInternalConnectError: (_prefix: string, error: unknown) => error
                }
            } };
        const names = ['__addDisposableResource', '__disposeResources', 'ExecServer'] as const;
        const bindings = await loadOwnedSegmentSide('exec', names, globals, side);
        assertFunctionBindings(bindings, names);
        const m = bindings as Pick<typeof import('../src/runtime/exec.js'), typeof names[number]>;
        const events: unknown[] = [];
        const env: ExecDisposeEnvironment = { stack: [], error: undefined, hasError: false };
        m.__addDisposableResource(env, { [Symbol.dispose]() { events.push('first'); } }, false);
        m.__addDisposableResource(env, { [Symbol.dispose]() { events.push('second'); } }, false);
        await m.__disposeResources(env);
        assert.deepEqual([...events], ['second', 'first']);
        const suppressed: ExecDisposeEnvironment = { stack: [], error: new Error('body'), hasError: true };
        m.__addDisposableResource(suppressed, { [Symbol.dispose]() { throw new Error('dispose'); } }, false);
        try {
            await m.__disposeResources(suppressed);
        }
        catch (error) {
            assert.ok(typeof error === 'object' && error !== null && 'name' in error && 'error' in error && 'suppressed' in error);
            events.push([error.name, errorMessage(error.error), errorMessage(error.suppressed)]);
        }
        const asyncEnv: ExecDisposeEnvironment = { stack: [], error: undefined, hasError: false };
        m.__addDisposableResource(asyncEnv, null, true);
        m.__addDisposableResource(asyncEnv, { async [Symbol.asyncDispose]() { events.push('async'); } }, true);
        await m.__disposeResources(asyncEnv);
        try {
            m.__addDisposableResource({ stack: [], error: undefined, hasError: false }, 123, false);
        }
        catch (error) {
            events.push(errorMessage(error));
        }
        const ctx = fixtureContext();
        const server = new m.ExecServer(ctx, new FixtureResources());
        const output: unknown[] = [];
        const request = Object.assign(new FixtureProto(), { id: 1, execId: 'fixture', message: { case: 'requestContextArgs' as const, value: new FixtureProto() } });
        for await (const item of server.exec(ctx, request))
            output.push(item);
        assert.equal(output.length, 2);
        return [events, output];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: control', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const common = fixtureGlobals(logs);
        common.process.env.KEY = 'original';
        const envBindings = await loadOwnedSegmentSide('managed-environment', ['ManagedEnvironment', 'ManagedEnvironmentValidationError'], { ...common, "../interop/vendor/utils-safe-spawn-cwd.js": { SPAWN_CWD_HOP_ENV_VAR: 'CWD_HOP' }, "../interop/vendor/utils-workload-spawn.js": { WORKLOAD_CGROUP_ENV_VAR: 'CGROUP' } }, side);
        assertFunctionBindings(envBindings, ['ManagedEnvironment']);
        const env = envBindings as Pick<typeof import('../src/runtime/managed-environment.js'), 'ManagedEnvironment' | 'ManagedEnvironmentValidationError'>;
        const gitBindings = await loadOwnedSegmentSide('git', ['GitService'], serviceGlobals(), side);
        assertFunctionBindings(gitBindings, ['GitService']);
        const git = gitBindings as Pick<typeof import('../src/runtime/git.js'), 'GitService'>;
        const artifactBindings = await loadOwnedSegmentSide('artifactUploads', ['ArtifactUploadManagerProvider'], serviceGlobals(), side);
        assertFunctionBindings(artifactBindings, ['ArtifactUploadManagerProvider']);
        const artifact = artifactBindings as Pick<typeof import('../src/runtime/artifactUploads.js'), 'ArtifactUploadManagerProvider'>;
        const globals = { ...common, "../interop/vendor/context-logger.js": { createLogger: () => ({ info() { }, warn() { }, debug() { }, error() { } }) }, "../interop/vendor/context-otel.js": { withSpan: (ctx: Context) => ctx, getSpan: () => undefined }, "./managed-environment.js": { ManagedEnvironment: env.ManagedEnvironment, ManagedEnvironmentValidationError: env.ManagedEnvironmentValidationError, SANDBOX_ENV_RESTORE_ENV_VAR: '__CURSOR_SANDBOX_ENV_RESTORE' }, "./secretRedaction.js": { CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR: 'CLOUD_AGENT_ALL_SECRET_NAMES', CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR: 'CLOUD_AGENT_INJECTED_SECRET_NAMES' }, "./comma-separated-names.js": { parseCommaSeparatedNames: (value: string | undefined) => (value ?? '').split(',').filter(Boolean) }, "../interop/vendor/proto-agent-v1-control-service-pb.js": { UpdateEnvironmentVariablesResponse: FixtureRecord } };
        const names = ['ControlServer', 'formatCloneAfterTokenRefreshFailure', 'knownRevisionsMatch'] as const;
        const bindings = await loadOwnedSegmentSide('control', names, globals, side);
        assertFunctionBindings(bindings, names);
        const m = bindings as Pick<typeof import('../src/runtime/control.js'), typeof names[number]>;
        const calls: unknown[] = [];
        const ctx = fixtureContext();
        const server = new m.ControlServer(new git.GitService(ctx), { warmCursorServer: async () => { throw new Error('Unexpected remote access'); }, downloadCursorServer: async () => { throw new Error('Unexpected remote access'); } }, new artifact.ArtifactUploadManagerProvider({ resolveRoot: () => { throw new Error('Unexpected artifact access'); } }), { onManagedEnvironmentUpdated: async (_ctx, args) => { calls.push(args); } });
        const request = (values: Record<string, string>, holder: string, release = false) => Object.assign(new FixtureProto(), { env: values, replace: false, restorePreviousValues: true, runScopedOverlay: Object.assign(new FixtureProto(), { runId: 'r', holder, release }) });
        const out: unknown[] = [];
        out.push(await server.updateEnvironmentVariables(ctx, request({ KEY: 'temporary' }, 'one')), await server.updateEnvironmentVariables(ctx, request({ KEY: 'ignored' }, 'two')), common.process.env.KEY);
        out.push(await server.updateEnvironmentVariables(ctx, request({}, 'one', true)), common.process.env.KEY, await server.updateEnvironmentVariables(ctx, request({}, 'two', true)), common.process.env.KEY);
        assert.equal(common.process.env.KEY, 'original');
        out.push(calls, m.formatCloneAfterTokenRefreshFailure('bad https://user:pass@example.test/path\nerror'), m.knownRevisionsMatch(Object.assign(new FixtureProto(), { knownBaseSha: 'a', knownHeadSha: 'b', fetchBranches: [] }), { baseSha: 'a', headSha: 'b', workspaceHash: undefined }));
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: pty-host-server', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/context-logger.js": { createLogger: () => ({ info() { }, debug() { }, error() { } }) }, "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "./errors.js": {
                isClientDisconnectError: () => false
            }, "../interop/vendor/proto-agent-v1-pty-host-service-pb.js": { PtyEvent: FixtureRecord, PtyData: FixtureRecord, PtyExited: FixtureRecord } };
        const names = ['PtyHostServer'] as const;
        const bindings = await loadOwnedSegmentSide('pty-host-server', names, globals, side);
        assertFunctionBindings(bindings, names);
        const m = bindings as Pick<typeof import('../src/runtime/pty-host-server.js'), typeof names[number]>;
        const detached: string[] = [];
        const manager: PtyHostManagerPort = { spawn: () => 'pty-1', attach: (_id, listener) => { listener({ eventId: 'exit', data: { type: 'exit', exitCode: 7 } }); return { events: [{ eventId: 'history', data: { type: 'data', data: Buffer.from('hi') } }] }; }, detach: id => { detached.push(id); }, sendInput: () => true, resize: () => true, list: () => [], terminate: () => true };
        const server = new m.PtyHostServer(manager);
        const events: unknown[] = [];
        const ctx = fixtureContext();
        for await (const event of server.attachPty(ctx, Object.assign(new FixtureProto(), { ptyId: 'pty-1', lastEventId: '' })))
            events.push(event);
        assert.equal(events.length, 2);
        assert.deepEqual(detached, ['pty-1']);
        return [events, detached, await server.spawnPty(ctx, Object.assign(new FixtureProto(), { cols: 80, rows: 24, cwd: '/fixture', env: {} })), await server.terminatePty(ctx, Object.assign(new FixtureProto(), { ptyId: 'pty-1' }))];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: tmux-session-server', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const managerBindings = await loadOwnedSegmentSide('tmux-session-manager', ['TmuxSessionManager'], serviceGlobals(), side);
        assertFunctionBindings(managerBindings, ['TmuxSessionManager']);
        const managerModule = managerBindings as Pick<typeof import('../src/runtime/tmux-session-manager.js'), 'TmuxSessionManager'>;
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/context-logger.js": { createLogger: () => ({ info() { }, error() { } }) }, "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum }, "./tmux-session-manager.js": { TmuxValidationError: class extends Error {
                }, TmuxSessionAlreadyExistsError: class extends Error {
                } }, "../interop/vendor/proto-agent-v1-tmux-session-service-pb.js": { TmuxSession: FixtureRecord } };
        const names = ['TmuxSessionServer'] as const;
        const bindings = await loadOwnedSegmentSide('tmux-session-server', names, globals, side);
        assertFunctionBindings(bindings, names);
        const m = bindings as Pick<typeof import('../src/runtime/tmux-session-server.js'), typeof names[number]>;
        const session = { sessionId: 's', sessionName: 'session', displayName: 'display', kind: 1, cwd: '/workspace', shell: '/bin/sh', processArgs: [], createdAtUnixMs: 123, attachedClientCount: 1 };
        const manager = new managerModule.TmuxSessionManager({ workspacePath: '/workspace', ptyManager: { spawn: () => { throw new Error('Unexpected PTY spawn'); } }, globalContext: fixtureContext(), execTmux: async () => { throw new Error('Unexpected tmux execution'); } });
        manager.isValidSessionName = name => name !== 'bad';
        manager.createSession = async () => session;
        manager.listSessions = async () => [session];
        manager.killSession = async () => true;
        manager.attachSession = async () => ({ ptyId: 'p', session });
        const server = new m.TmuxSessionServer(manager), ctx = fixtureContext();
        const request = (sessionName: string) => Object.assign(new FixtureProto(), { sessionName, kind: 1, displayName: 'display', cwd: '/workspace', env: {} });
        const out: unknown[] = [await server.createSession(ctx, request('valid')), await server.listSessions(ctx, new FixtureProto()), await server.attachSession(ctx, Object.assign(new FixtureProto(), { sessionId: 's', cols: 80, rows: 24 }))];
        try {
            await server.createSession(ctx, request('bad'));
        }
        catch (error) {
            out.push(errorMessage(error));
        }
        assert.equal(out.at(-1), 'Invalid tmux session name');
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: server', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), "../interop/vendor/context-logger.js": { createLogger: () => ({}) }, "../interop/vendor/connect-connect-error.js": connect, "../interop/vendor/connect-code.js": { Code: codeEnum } };
        const names = ['parseWorkspaceRootsHeader', 'createPtyAuthGuard', 'createAuthInterceptor', 'matchesExpectedBearerToken'] as const;
        const bindings = await loadOwnedSegmentSide('server', names, globals, side);
        assertFunctionBindings(bindings, names);
        const m = bindings as Pick<typeof import('../src/runtime/server.js'), typeof names[number]>;
        const out: unknown[] = ['null', '{}', '[]', '["/a",2,"","/b"]', 'broken'].map(m.parseWorkspaceRootsHeader);
        const guard = m.createPtyAuthGuard('fixture');
        for (const request of [{ headers: { authorization: 'Bearer fixture' }, url: '/' }, { headers: {}, url: '/?token=fixture' }, { headers: {}, url: '/?token=wrong' }, { headers: { authorization: ['Bearer fixture'] } }]) {
            // Raw transport headers intentionally include a non-scalar authorization value.
            // Invoke that ingestion boundary without pretending this object is a live HTTP socket.
            const allowed: unknown = Reflect.apply(guard, undefined, [request]);
            assert.equal(typeof allowed, 'boolean');
            out.push(allowed);
        }
        const interceptor = m.createAuthInterceptor('fixture')(async () => ({ header: new Headers(), trailer: new Headers(), stream: false, message: new FixtureProto() }));
        const request = (header: Headers): RpcRequest => ({ header, signal: new AbortController().signal, stream: false, message: new FixtureProto() });
        out.push(await interceptor(request(new Headers({ authorization: 'Bearer fixture' }))));
        try {
            await interceptor(request(new Headers()));
        }
        catch (error) {
            out.push(errorMessage(error));
        }
        assert.equal(out.at(-1), 'Unauthorized');
        return out;
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
test('foundation differential: connect-websocket-adapter', async () => {
    async function run(side: 'baseline' | 'typed') {
        const logs: unknown[][] = [];
        const globals = { ...fixtureGlobals(logs), Headers, AbortController };
        const names = ['handleConnection', 'handleRequest'] as const;
        const bindings = await loadOwnedSegmentSide('connect-websocket-adapter', names, globals, side);
        assertFunctionBindings(bindings, names);
        const m = bindings as Pick<typeof import('../src/runtime/connect-websocket-adapter.js'), typeof names[number]>;
        const socket = new FixtureWebSocket();
        const received: unknown[] = [];
        const handler = Object.assign(async (request: UniversalServerRequest) => {
            received.push([request.method, [...request.header.entries()]]);
            const bytes: number[][] = [];
            for await (const chunk of request.body)
                bytes.push([...chunk]);
            received.push(bytes);
            return { status: request.method === 'POST' ? 200 : 405, header: new Headers({ 'x-fixture': 'yes' }), body: (async function* () { yield Buffer.from('ok'); })(), trailer: new Headers() };
        }, { requestPath: '/rpc' });
        const handlers: WebSocketHandlers = new Map([['/rpc', handler]]);
        m.handleConnection(socket, handlers);
        const errors: string[] = [];
        for (const text of ['bad', 'null', '42', '{"type":99}', JSON.stringify({ type: 1, requestId: { raw: 'id' }, path: '/rpc', method: 'POST', headers: { numeric: 123 }, body: [65, 66] }), JSON.stringify({ type: 1, requestId: 'numeric-method', path: '/rpc', method: 7, headers: {}, body: '' }), JSON.stringify({ type: 1, requestId: 'bad-body', path: '/rpc', method: 'POST', headers: {}, body: 3 })]) {
            try {
                socket.message(Buffer.from(text), false);
            }
            catch (error) {
                errors.push(errorMessage(error));
            }
        }
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        socket.close();
        assert.ok(socket.sends.some(value => typeof value === 'object' && value !== null && 'status' in value && value.status === 200));
        assert.ok(socket.sends.some(value => typeof value === 'object' && value !== null && 'status' in value && value.status === 405));
        assert.equal(errors.length, 2);
        return [socket.sends, received, errors];
    }
    assert.deepEqual(normalized(await run('typed')), normalized(await run('baseline')));
});
