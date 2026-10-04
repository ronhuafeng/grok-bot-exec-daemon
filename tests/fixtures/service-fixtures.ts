import path from 'node:path';
import os from 'node:os';
import util from 'node:util';
import crypto from 'node:crypto';
import type { Context, ContextKey, CancelContext, Logger } from '../../src/interop/contracts/context.js';
export class FixtureContext implements Context {
    readonly controller = new AbortController();
    readonly signal = this.controller.signal;
    get canceled(): boolean { return this.signal.aborted; }
    get reason(): unknown { return this.signal.reason; }
    get<T>(key: ContextKey<T>): T { return key.defaultValue; }
    with<T>(_key: ContextKey<T>, _value: NoInfer<T>): Context { return this; }
    withCancel(): [
        Context,
        CancelContext
    ] { return [this, reason => this.controller.abort(reason)]; }
    withTimeout(): Context { return this; }
    withDeadline(): Context { return this; }
    withTimeoutAndCancel(): [
        Context,
        CancelContext
    ] { return this.withCancel(); }
    withName(): Context { return this; }
    withDetached(): Context { return this; }
    getParent(): undefined { return undefined; }
    getPath(): string[] { return []; }
}
export const context = new FixtureContext();
export const logger: Logger = { info() { }, debug() { }, warn() { }, error() { } };
export const logging = { createLogger: () => logger };
export const enums = { ArtifactUploadStatus: { NOT_STARTED: 1, IN_PROGRESS: 2, COMPLETED: 3, FAILED: 4 }, ResourceScope: { HOST: 3, CONTAINER: 2, POD_VM: 1 }, ResourcePressure: { NONE: 1, HIGH: 2 } };
export class RecordMessage {
    constructor(data: object) { Object.assign(this, data); }
}
export function denied(): never { throw new Error('Fixture must not execute a process, timer, native addon, or filesystem operation'); }
const processPort = { execFile: denied, spawn: denied, exec: denied, spawnSync: denied };
class FixtureRing<T> {
    values: T[] = [];
    push(value: T): void { this.values.push(value); }
    toArray(): T[] { return [...this.values]; }
}
export function serviceGlobals(): Record<string, unknown> {
    return {
        console: { log() { }, error() { }, warn() { } }, URL, Error, Buffer, Promise, TextDecoder,
        process: { pid: 100, env: {}, argv: ['node', '/bundle/index.js'] },
        setTimeout: denied, clearTimeout: denied, setInterval: denied, clearInterval: denied, AbortController,
        "../interop/vendor/context-logger.js": logging,
        "../interop/vendor/context-otel.js": { getSpan: () => undefined, withInheritableAttribute: (ctx: Context) => ctx },
        "../interop/vendor/constants-agent-store-fuse.js": { AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE: 'agent-store-fuse', AGENT_STORE_FUSE_PID_FILE: '/fuse.pid', AGENT_STORE_FUSE_DISPATCH_WEDGE_REPORT_PATH: '/wedge', AGENT_STORE_FUSE_RELAUNCH_REASON_PATH: '/relaunch' },
        "../interop/vendor/constants-agent-store-ids.js": { AGENT_STORE_MOUNT_ROOT: '/store' },
        "../interop/vendor/proto-agent-v1-control-service-pb.js": { ...enums, ResourceSample: RecordMessage, ResourceLimits: RecordMessage, GetResourceUsageResponse: RecordMessage },
        "../interop/vendor/utils-path-utils.js": { isPathWithin: ({ basePath, targetPath }: {
                basePath: string;
                targetPath: string;
            }) => {
                const relative = path.relative(basePath, targetPath);
                return relative !== '..' && !relative.startsWith('../') && !path.isAbsolute(relative);
            } },
        "../interop/vendor/utils-workload-spawn.js": { getWorkloadPlacement: () => ({ kind: 'direct' }) },
        "../interop/vendor/utils-oom-score-adj.js": { resetOomScoreAdjBeforeExec: (command: string, args: readonly string[]) => ({ command, args }) },
        "./managed-environment.js": { ManagedEnvironment: class {
                snapshot() { return {}; }
            }, ENV_NAME_PATTERN: /^[A-Z_]+$/, CURSOR_SANDBOX_ENV_NAME_PATTERN: /^CURSOR_SANDBOX/ },
        "../interop/vendor/proto-agent-v1-tmux-session-service-pb.js": { TmuxSessionKind: { UNSPECIFIED: 0 } },
        "node:child_process": processPort,
        "node:path": path,
        "node:os": os,
        "node:util": util,
        "node:crypto": crypto,
        "node:fs": { existsSync: () => false },
        "./secretRedaction.js": { SYNTHETIC_GIT_AUTH_USERNAMES: ['x-access-token', 'oauth2'], refreshCachedGitAuthTokens: denied },
        "./ring-buffer.js": { RingBuffer: FixtureRing }
    };
}
import type { Pty, PtyExit, PtySpawnOptions } from '../../src/interop/contracts/pty.js';
import type { PtyHostEvent } from '../../src/runtime/pty-host-server.js';
export class FixturePty implements Pty {
    readonly pid = 99;
    cols = 80;
    rows = 24;
    readonly process = '/bin/bash';
    readonly input: (string | Buffer)[] = [];
    size: [
        number,
        number
    ] | undefined;
    emitData: (data: string | Buffer) => void = () => { throw new Error('Missing fixture listener'); };
    onData = (listener: (data: string | Buffer) => void) => { this.emitData = listener; return { dispose() { } }; };
    onExit(_listener: (exit: PtyExit) => void) { return { dispose() { } }; }
    write(data: string | Buffer): void { this.input.push(data); }
    resize(cols: number, rows: number): void { this.cols = cols; this.rows = rows; this.size = [cols, rows]; }
    kill(): void { }
    pause(): void { }
    resume(): void { }
}
export class PtyEventRing {
    values: PtyHostEvent[] = [];
    constructor(readonly capacity: number) { }
    push(value: PtyHostEvent): void {
        this.values.push(value);
        if (this.values.length > this.capacity)
            this.values.shift();
    }
    toArray(): PtyHostEvent[] { return [...this.values]; }
    sliceAfter(predicate: (value: PtyHostEvent, index: number, array: PtyHostEvent[]) => boolean): PtyHostEvent[] { return this.values.slice(this.values.findIndex(predicate) + 1); }
}
export function fixturePtySpawn(fn: (command: string, args: string[], options: PtySpawnOptions) => Pty, command: string, args: string[], options: PtySpawnOptions): Pty { return fn(command, args, options); }
