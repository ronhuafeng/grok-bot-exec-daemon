import assert from 'node:assert/strict';
import test from 'node:test';
import { loadOwnedSegmentSide, normalized, assertFunctionBindings } from './helpers/owned-vm.js';
import { errorMessage } from './fixtures/foundation.js';
import { context, logging, denied } from './fixtures/service-fixtures.js';
import type { ComputerUseSetupDeps } from '../src/runtime/computerUseExecutorSetup.js';
import type { Resolution, X11ComputerUseExecutor, ComputerUseExecutor } from '../src/interop/contracts/computer-use.js';
import type { Context } from '../src/interop/contracts/context.js';
import type { NetworkPolicy } from '../src/interop/contracts/shell.js';
// Only these function bindings execute. Startup itself, listeners, subprocesses,
// network calls, and native addons are never invoked by these fixtures.
test('startup helpers: span lifecycles, executable lookup, and permission merging preserve behavior', async () => {
    async function run(side: 'baseline' | 'typed') {
        const events: string[] = [];
        const exports = ['runSetupStepSpan', 'DaemonPermissionsService', 'resolveExecutablePath'] as const;
        const raw = await loadOwnedSegmentSide('setup', exports, {
            "../interop/vendor/context-logger.js": logging,
            "node:child_process": { execFileSync: denied },
            "../interop/vendor/utils-workload-spawn.js": { spawnWorkload: (_create: unknown, command: string, args: string[]) => command === 'which' && args[0] === 'present' ? ' /bin/present\n' : '' },
            "../interop/vendor/context-otel.js": { withSpan: (ctx: Context) => ctx, getSpan: () => ({ end: () => events.push('end'), recordException: () => events.push('error') }) },
            "../interop/vendor/shell-exec.js": {
                isAllowAllNetworkByPolicy: (policy: NetworkPolicy | undefined) => policy?.default === 'allow',
                networkAllowAllPolicy: () => ({ version: 1, default: 'allow' }),
                mergeNetworkPolicies: (...policies: (NetworkPolicy | undefined)[]) => ({ version: 1, default: 'deny', allow: policies.flatMap(p => p?.allow ?? []) }),
                mergePathsUnion: (...paths: (string[] | undefined)[]) => [...new Set(paths.flatMap(p => p ?? []))]
            }
        }, side);
        assertFunctionBindings(raw, exports);
        const m = raw as Pick<typeof import('../src/runtime/setup.js'), typeof exports[number]>;
        const ctx = context;
        const success = await m.runSetupStepSpan(ctx, 'success', async () => 7);
        let failure = '';
        try {
            await m.runSetupStepSpan(ctx, 'failure', () => { throw 'failure'; });
        }
        catch (error) {
            failure = errorMessage(error);
        }
        const p = new m.DaemonPermissionsService({ type: 'workspace_readwrite', additionalReadonlyPaths: ['/read'], additionalReadwritePaths: ['/write'], networkPolicy: { version: 1, default: 'deny', allow: ['first'] } });
        const merged = await p.shouldBlockShellCommand(ctx, 'echo ok', {}, { type: 'workspace_readwrite', additionalReadonlyPaths: ['/read', '/other'], additionalReadwritePaths: ['/other-write'], networkPolicy: { version: 1, default: 'deny', allow: ['second'] } });
        return { events, success, failure, merged, resolved: [m.resolveExecutablePath('present'), m.resolveExecutablePath('missing')], gates: [await p.shouldBlockRead('/x'), await p.shouldBlockWrite(ctx, '/x', 'value'), await p.shouldBlockMcp(ctx, {})] };
    }
    const typed = normalized(await run('typed'));
    assert.deepEqual(typed, normalized(await run('baseline')));
});
test('computer startup: successful lazy, eager, and macOS registration preserves behavior', async () => {
    async function run(side: 'baseline' | 'typed') {
        const events: string[] = [];
        class X11 implements X11ComputerUseExecutor {
            readonly kind: string = 'x11';
            constructor(readonly options: {
                displayNum: number;
                display: string;
                resolution: Resolution;
            }) { events.push('x11'); }
            async execute(): Promise<never> { return denied(); }
            async releaseHeldInput() { events.push('release'); }
            setInputEventLogger() { events.push('logger'); }
        }
        class Mac implements ComputerUseExecutor {
            readonly kind = 'mac';
            constructor() { events.push('mac'); }
            async execute(): Promise<never> { return denied(); }
        }
        class Lazy implements X11ComputerUseExecutor {
            readonly kind = 'lazy';
            constructor(readonly options: {
                display: string;
                initialize(display: string, timeout: number): Promise<X11ComputerUseExecutor>;
            }) { events.push('lazy'); }
            prime() { events.push('prime'); }
            async execute(): Promise<never> { return denied(); }
            async releaseHeldInput() { events.push('release'); }
            setInputEventLogger() { events.push('logger'); }
        }
        const exports = ['buildExecDaemonComputerUseExecutor', 'computerUseExecutorHasInputEventLogger'] as const;
        const deps: ComputerUseSetupDeps = {
            isX11Installed: () => true,
            waitForDisplay: async (display, timeout) => { events.push(`wait:${display}:${timeout}`); },
            detectDisplaySync: () => ({ display: { width: 1920, height: 1080 }, resolution: { display: { width: 1920, height: 1080 }, api: { width: 1280, height: 720 } }, resolutionString: '1920x1080' }),
            platform: 'linux', isMacSidecarInstalled: () => true,
        };
        const raw = await loadOwnedSegmentSide('computerUseExecutorSetup', exports, {
            "../interop/vendor/context-logger.js": logging,
            Date: { now: () => 100 },
            "../interop/vendor/local-exec.js": { isX11Installed: deps.isX11Installed, waitForDisplay: deps.waitForDisplay, detectDisplaySync: deps.detectDisplaySync, MacComputerUseRPCClient: { isInstalled: () => true },
                X11ComputerUseExecutor: X11, MacRemoteComputerUseExecutor: Mac, LazyX11ComputerUseExecutor: Lazy, parseDisplayNum: () => 3,
                resolutionConfigForDisplay: (width: number, height: number, apiWidth?: number, apiHeight?: number): Resolution => ({ display: { width, height }, api: { width: apiWidth ?? 1280, height: apiHeight ?? 720 } })
            }
        }, side);
        assertFunctionBindings(raw, exports);
        const m = raw as Pick<typeof import('../src/runtime/computerUseExecutorSetup.js'), typeof exports[number]>;
        const ctx = context;
        const args = { isComputerUseEnabled: true, lazyComputerUseInit: false, display: ':3', apiWidth: 1024, apiHeight: 576 };
        const scenarios: [
            typeof args,
            ComputerUseSetupDeps
        ][] = [
            [{ ...args, lazyComputerUseInit: true }, deps], [args, deps],
            [args, { ...deps, platform: 'darwin' }],
        ];
        const results: unknown[] = [];
        for (const [input, dependencies] of scenarios) {
            const executor = await m.buildExecDaemonComputerUseExecutor(ctx, input, dependencies);
            if (executor instanceof Lazy)
                await executor.options.initialize(':3', 55);
            results.push(executor === undefined ? 'none' : { kind: executor instanceof X11 || executor instanceof Lazy || executor instanceof Mac ? executor.kind : 'unexpected', inputLogger: m.computerUseExecutorHasInputEventLogger(executor) });
        }
        return { events, results };
    }
    const typed = await run('typed');
    assert.deepEqual(typed.results, [{ kind: 'lazy', inputLogger: true }, { kind: 'x11', inputLogger: true }, { kind: 'mac', inputLogger: false }]);
    assert.deepEqual(typed.events, ['lazy', 'prime', 'wait::3:55', 'x11', 'wait::3:undefined', 'x11', 'mac']);
    assert.deepEqual(normalized(typed), normalized(await run('baseline')));
});
