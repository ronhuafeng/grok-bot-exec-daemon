import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import * as url from 'node:url';
import * as crypto from 'node:crypto';
import { loadOwnedSegmentSide, normalized, assertFunctionBindings } from './helpers/owned-vm.js';
import { context, logging, denied } from './fixtures/service-fixtures.js';
import type { ComputerUseSetupDeps } from '../src/runtime/computerUseExecutorSetup.js';
import type { OperationOutcome, OrbitOperationReporter } from '../src/interop/contracts/orbit.js';
async function differential(name: string, names: readonly string[], makeGlobals: () => Record<string, unknown>, exercise: (module: Record<string, unknown>) => unknown | Promise<unknown>): Promise<void> {
    const outputs: unknown[] = [];
    for (const side of ['baseline', 'typed'] as const) {
        const bindings = await loadOwnedSegmentSide(name, names, makeGlobals(), side);
        assertFunctionBindings(bindings, names);
        outputs.push(normalized(await exercise(bindings)));
    }
    assert.deepEqual(outputs[1], outputs[0]);
}
const fileGlobals = () => ({ "../interop/vendor/context-logger.js": logging, Error, Buffer, __dirname: '/fixture/bundle', "node:path": path, "node:url": url, "node:fs": { existsSync: () => false }, process: { cwd: () => '/fixture/cwd' } });
const browserGlobals = () => ({
    "./orbit/browser-operation.js": {
        ...{
            BROWSER_OPERATION_NAMESPACES: { sandBrowser: 'sand_browser', playwrightMcp: 'playwright_mcp' }
        },
        ...{
            operationOutcome: (status: OperationOutcome['status'], detail?: Record<string, unknown>): OperationOutcome => detail === undefined ? { status } : { status, detailJson: JSON.stringify(detail) }
        },
        ...{
            sandBoxCdpEndpoint: (windowIndex: number) => ({ host: '127.0.0.1', port: 9222 + windowIndex })
        }
    }
});
test('canvasShareBundle: path containment, naming and missing-file cleanup preserve behavior', async () => {
    const names = ['moduleDirname', 'isPathInsideDir', 'resolveCanvasRuntimeDir', 'canvasShareBundleArtifactAbsolutePath', 'canvasShareBundleDestDir', 'isNotFoundError', 'removeFileIfPresent'] as const;
    await differential('canvasShareBundle', names, () => ({ ...fileGlobals(), "../interop/vendor/canvas-shared-canvas-share-bundle.js": { canvasSourceBasenameToShareBundleFileName: (name: string) => name.endsWith('.canvas.tsx') ? name.replace('.tsx', '.bundle.gz') : undefined,
            agentCanvasPreviewPrefix: (root: string) => `${root}/canvases/` }, "node:fs/promises": { unlink: async (name: string) => {
                if (name === '/missing')
                    throw { code: 'ENOENT' };
                if (name === '/denied')
                    throw new Error('denied');
            } } }), async (raw) => {
        const m = raw as Pick<typeof import('../src/runtime/canvasShareBundle.js'), typeof names[number]>;
        await m.removeFileIfPresent('/missing');
        await m.removeFileIfPresent('/present');
        await assert.rejects(m.removeFileIfPresent('/denied'), /denied/);
        return [m.moduleDirname(), m.resolveCanvasRuntimeDir(), ['/root', '/root/a', '/root2/a', '/root/../escape'].map(filePath => m.isPathInsideDir({ filePath, dir: '/root' })),
            m.canvasShareBundleArtifactAbsolutePath({ canvasPath: '/work/one.canvas.tsx', artifactsRoot: '/artifacts' }),
            m.canvasShareBundleArtifactAbsolutePath({ canvasPath: '/work/ignored.txt', artifactsRoot: '/artifacts' }), m.canvasShareBundleDestDir('/artifacts'),
            [null, { code: 'ENOENT' }, { code: 'EACCES' }, { code: 1 }].map(m.isNotFoundError)];
    });
});
test('canvasStorePersist: title limits and error summaries preserve behavior', async () => {
    const names = ['errnoCode', 'oversizedSourceDetail', 'parseCanvasTitlePragma', 'errorMessage'] as const;
    await differential('canvasStorePersist', names, () => ({ ...fileGlobals(), "../interop/vendor/constants-agent-store-ids.js": { CLOUD_CANVAS_SOURCE_BASENAME: 'canvas.tsx' }, "../interop/vendor/canvas-shared-cloud-canvas.js": { CLOUD_CANVAS_SOURCE_MAX_BYTES: 1024 } }), raw => {
        const m = raw as Pick<typeof import('../src/runtime/canvasStorePersist.js'), typeof names[number]>;
        const titles = ['// cursor-canvas-title: Example', 'no title', '// cursor-canvas-title:   ', `// cursor-canvas-title: ${'x'.repeat(150)}`].map(m.parseCanvasTitlePragma);
        assert.equal(titles.at(-1)?.length, 120);
        return [titles, m.oversizedSourceDetail(2048), [null, { code: 'ENOENT' }, { code: 42 }].map(m.errnoCode), m.errorMessage(new Error('fixture')), m.errorMessage('plain')];
    });
});
test('canvasDiagnostics: unavailable packaged assets fail softly without starting diagnostics', async () => {
    const names = ['resolveExecDaemonRuntimeDir', 'resolveCanvasSdkSourceDir', 'setupExecDaemonCanvasDiagnostics'] as const;
    await differential('canvasDiagnostics', names, fileGlobals, raw => {
        const m = raw as Pick<typeof import('../src/runtime/canvasDiagnostics.js'), typeof names[number]>;
        return [m.resolveExecDaemonRuntimeDir(), m.resolveCanvasSdkSourceDir(), m.setupExecDaemonCanvasDiagnostics({ ctx: context, workspacePath: '/workspace' })];
    });
});
test('computerUseExecutorSetup: disabled, missing desktop and eager timeout paths stay isolated', async () => {
    const names = ['buildExecDaemonComputerUseExecutor'] as const;
    await differential('computerUseExecutorSetup', names, () => ({ "../interop/vendor/context-logger.js": logging, Error, "../interop/vendor/local-exec.js": { isX11Installed: denied, waitForDisplay: denied, detectDisplaySync: denied } }), async (raw) => {
        const m = raw as Pick<typeof import('../src/runtime/computerUseExecutorSetup.js'), typeof names[number]>;
        const deps: ComputerUseSetupDeps = { platform: 'linux', isX11Installed: () => false, isMacSidecarInstalled: () => false,
            waitForDisplay: async () => { throw new Error('fixture unavailable'); }, detectDisplaySync: denied };
        const args = { isComputerUseEnabled: true, lazyComputerUseInit: false, display: ':1' };
        return [await m.buildExecDaemonComputerUseExecutor(context, { ...args, isComputerUseEnabled: false }, deps),
            await m.buildExecDaemonComputerUseExecutor(context, args, deps),
            await m.buildExecDaemonComputerUseExecutor(context, args, { ...deps, platform: 'darwin' }),
            await m.buildExecDaemonComputerUseExecutor(context, args, { ...deps, isX11Installed: () => true })];
    });
});
test('browser-operation: endpoint indexing and optional outcome details preserve behavior', async () => {
    const names = ['operationOutcome', 'sandBoxCdpEndpoint'] as const;
    await differential('orbit/browser-operation', names, () => ({}), raw => {
        const m = raw as Pick<typeof import('../src/runtime/orbit/browser-operation.js'), typeof names[number]>;
        return [m.operationOutcome('completed'), m.operationOutcome('failed', { reason: 'fixture' }), [1, 2, 56313].map(m.sandBoxCdpEndpoint)];
    });
});
/** Deliberately partial wire-shaped messages exercise only mcpOutcome's inspected
 * oneof case and isError field. These never impersonate full protobuf instances. */
interface McpOutcomeFixturePort {
    mcpOutcome(result: {
        result: {
            case?: string;
            value?: {
                isError: boolean;
            };
        };
    }): OperationOutcome;
}
test('playwright-mcp: recognized result cases preserve their fail-closed outcomes', async () => {
    const names = ['mcpOutcome'] as const;
    await differential('orbit/playwright-mcp', names, browserGlobals, raw => {
        const m: McpOutcomeFixturePort = { mcpOutcome: raw.mcpOutcome as McpOutcomeFixturePort['mcpOutcome'] };
        return [m.mcpOutcome({ result: { case: 'success', value: { isError: false } } }), m.mcpOutcome({ result: { case: 'success', value: { isError: true } } }),
            ...['error', 'rejected', 'permissionDenied', 'toolNotFound', 'serverNotFound', 'approved', 'unexpected', undefined].map(value => m.mcpOutcome({ result: { case: value } }))];
    });
});
test('sand-browser-driver: bounded request parsing and result protocol preserve behavior', async () => {
    const names = ['parseRequest', 'driverOutcome'] as const;
    await differential('orbit/sand-browser-driver', names, () => ({ ...browserGlobals(), "node:buffer": { Buffer } }), raw => {
        const m = raw as Pick<typeof import('../src/runtime/orbit/sand-browser-driver.js'), typeof names[number]>;
        const command = (body: string) => `node /tmp/.sand-browser/driver-0123456789abcdef.mjs ${Buffer.from(body).toString('base64')}`;
        const outcomes = ['ignored', '__SAND_BROWSER_RESULT__{"ok":true}', '__SAND_BROWSER_RESULT__{"ok":false,"infra":true}', '__SAND_BROWSER_RESULT__bad', '__SAND_BROWSER_RESULT__{"ok":1}'].map(value => m.driverOutcome('navigate', value));
        return [m.parseRequest(command('{"op":"navigate","display":1,"cdpPort":9223}')), m.parseRequest(command('null')), m.parseRequest(command('bad')),
            m.parseRequest('echo ignored'), m.parseRequest(`node /tmp/.sand-browser/driver-0123456789abcdef.mjs ${'A'.repeat(262148)}`), outcomes,
            m.driverOutcome('screenshot', '__SAND_BROWSER_RESULT__{"ok":true}'), m.driverOutcome('screenshot', '__SAND_BROWSER_RESULT__{"ok":true,"screenshot":true}')];
    });
});
test('operation-reporting: admission failures and reporter failures cannot replace executor results', async () => {
    const names = ['reportOperation', 'recognizeFailOpen'] as const;
    await differential('orbit/operation-reporting', names, browserGlobals, async (raw) => {
        const m = raw as Pick<typeof import('../src/runtime/orbit/operation-reporting.js'), typeof names[number]>;
        const calls: string[] = [];
        const reporter: OrbitOperationReporter = { startOperation: async () => { calls.push('start'); throw new Error('ambiguous admission'); },
            endOperation: async () => { calls.push('end'); throw new Error('reporter unavailable'); }, close() { } };
        const operation = { cdpEndpoint: { host: '127.0.0.1', port: 9223 }, request: { name: 'fixture' }, outcomeOf: (_result: number): OperationOutcome => ({ status: 'completed' }) };
        const source = { kind: 'toolCall' as const, conversationId: 'c', requestId: 'r', toolCallId: 't' };
        const result = await m.reportOperation(reporter, context, 'fixture-operation', operation, source, async () => 42);
        assert.equal(result, 42);
        assert.deepEqual(calls, ['start', 'end']);
        await assert.rejects(m.reportOperation(reporter, context, 'fixture-operation-2', operation, source, async () => { throw new Error('executor failure'); }), /executor failure/);
        return [result, calls, m.recognizeFailOpen(() => { throw new Error('unrecognized'); }), m.recognizeFailOpen(() => undefined)];
    });
});
test('setup: path policies and safe MCP metadata do not disclose configuration values', async () => {
    const names = ['shouldUseWorldWritableDirs', 'hashSensitiveLogValue', 'getMcpServerLogMetadata', 'summarizeUnknownError'] as const;
    await differential('setup', names, () => ({ ...fileGlobals(), "node:child_process": { execFileSync: denied }, "node:crypto": crypto, "./logger.js": { safeJsonStringify: (value: unknown) => JSON.stringify(value) } }), raw => {
        const m = raw as Pick<typeof import('../src/runtime/setup.js'), typeof names[number]>;
        const metadata = m.getMcpServerLogMetadata({ command: 'fixture-command', cwd: '/fixture/work', env: { EXAMPLE: 'private-fixture-value' } });
        assert.doesNotMatch(JSON.stringify(metadata), /fixture-command|private-fixture-value|\/fixture\/work/);
        return [['/opt/cursor', '/opt/cursor/a', '/opt/cursor-else', '/tmp'].map(m.shouldUseWorldWritableDirs), m.hashSensitiveLogValue('fixture'), metadata,
            m.getMcpServerLogMetadata({ url: 'https://fixture.invalid', headers: { 'x-fixture': 'private-header' } }), m.summarizeUnknownError('fixture error')];
    });
});
test('tracing: resource/exporter construction and lifecycle run only fake SDK ports', async () => {
    const names = ['buildResource', 'createExporter', 'initTracing', 'shutdownTracing'] as const;
    const events: string[] = [];
    class FixtureExporter {
        constructor(readonly options: object) { }
    }
    class FixtureSdk {
        constructor(readonly options: object) { }
        start() { events.push('start'); }
        async shutdown() { events.push('shutdown'); }
    }
    await differential('tracing', names, () => {
        events.length = 0;
        return { '../interop/vendor/context-logger.js': logging, process: { version: 'v-fixture' },
            'node:os': { platform: () => 'linux', arch: () => 'x64', release: () => 'fixture-release', hostname: () => 'fixture-host' },
            '../interop/vendor/tracing-private.js': { resourceFromAttributes: (attributes: Record<string, unknown>) => ({ attributes }) },
            '../interop/vendor/otel-trace-exporter.js': { OTLPTraceExporter: FixtureExporter },
            '../interop/vendor/otel-diag-api.js': { diag: { setLogger() { events.push('diagnostics'); } } },
            '../interop/vendor/otel-types.js': { DiagLogLevel: { DEBUG: 4 } },
            '../interop/vendor/otel-node-sdk.js': { NodeSDK: FixtureSdk } };
    }, async (raw) => {
        const m = raw as Pick<typeof import('../src/runtime/tracing.js'), typeof names[number]>;
        const resource = m.buildResource({ serviceVersion: 'fixture', traceAttributes: { region: 'test' } });
        const options = { ctx: context, traceEndpoint: 'https://fixture.invalid', authToken: 'test-only-token' };
        const exporter = m.createExporter(context, { ...options, insecure: true });
        assert.ok(exporter instanceof FixtureExporter);
        m.initTracing(options);
        m.initTracing(options);
        await m.shutdownTracing(context);
        assert.deepEqual(events, ['diagnostics', 'start', 'shutdown']);
        return [resource, exporter.options, [...events]];
    });
});
