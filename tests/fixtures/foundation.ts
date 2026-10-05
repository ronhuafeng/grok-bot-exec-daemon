import type { Context, ContextKey, CancelContext } from '../../src/interop/contracts/context.js';
import type { ProtoMessage, JsonValue } from '../../src/interop/contracts/protobuf-runtime.js';
import type { CachedRequestContext } from '../../src/runtime/request-context-disk-cache.js';
import type { agent_v1_AgentSkill, agent_v1_CursorRule, agent_v1_CustomSubagent, agent_v1_CursorRuleType, agent_v1_ShellArgs, agent_v1_ShellStream, agent_v1_ShellStreamExit } from '../../src/interop/contracts/protobuf-generated.js';
import type { SecretRedactor } from '../../src/interop/contracts/local-exec.js';
import type { ListableResourceAccessor, Resource, ResourceEntry } from '../../src/interop/contracts/agent-exec.js';
import type { Stats, BigIntStats } from 'node:fs';
import type { WebSocket } from '../../src/interop/contracts/websocket.js';
import type { agent_v1_ExecClientMessage, agent_v1_ExecClientControlMessage } from '../../src/interop/contracts/protobuf-generated.js';
export function errorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string')
        return error.message;
    return String(error);
}
export function fixtureGlobals(logs: unknown[][]) {
    const env: NodeJS.ProcessEnv = {};
    return { Buffer, URL, TextEncoder, TextDecoder, exports: {},
        console: { log: (...args: unknown[]) => logs.push(['log', ...args]), error: (...args: unknown[]) => logs.push(['error', ...args]) },
        process: { env, execPath: '/fixture/bundle/node', pid: 99, cwd: () => '/fixture/cwd' } };
}
export class FixtureContext implements Context {
    readonly signal = new AbortController().signal;
    readonly canceled = false;
    readonly reason = undefined;
    readonly values: [
        symbol,
        unknown
    ][] = [];
    get<T>(key: ContextKey<T>): T { return key.defaultValue; }
    with<T>(key: ContextKey<T>, value: NoInfer<T>): Context { this.values.push([key.symbol, value]); return this; }
    withCancel(): [
        Context,
        CancelContext
    ] { return [this, () => { }]; }
    withTimeout(_ms: number): Context { return this; }
    withDeadline(_deadline: Date): Context { return this; }
    withTimeoutAndCancel(_ms: number): [
        Context,
        CancelContext
    ] { return this.withCancel(); }
    withName(_name: string): Context { return this; }
    withDetached(): Context { return this; }
    getParent(): Context | undefined { return undefined; }
    getPath(): string[] { return []; }
}
export function fixtureContext(): Context { return new FixtureContext(); }
/** Isolated output-only protobuf stand-in. Payloads stay opaque at the VM boundary. */
export class FixtureRecord {
    constructor(value: object) { Object.assign(this, value); }
}
export const codeEnum = { InvalidArgument: 3, Internal: 13, Unimplemented: 12, PermissionDenied: 7, Canceled: 1, DeadlineExceeded: 4, NotFound: 5, DataLoss: 15, ResourceExhausted: 8 };
export const connect = { ConnectError: class extends Error {
        constructor(message: string, readonly code: number) { super(message); }
    } };
/** Only clone is exercised. Unexpected protocol serialization fails loudly. */
export class FixtureProto implements ProtoMessage {
    clone(): this { return { ...this }; }
    fromBinary(): this { throw new Error('Unexpected fixture binary parsing'); }
    fromJson(): this { throw new Error('Unexpected fixture JSON parsing'); }
    fromJsonString(): this { throw new Error('Unexpected fixture JSON parsing'); }
    toBinary(): Uint8Array { throw new Error('Unexpected fixture binary serialization'); }
    toJson(): JsonValue { throw new Error('Unexpected fixture JSON serialization'); }
    toJsonString(): string { throw new Error('Unexpected fixture JSON serialization'); }
}
export class FixtureSkill extends FixtureProto implements agent_v1_AgentSkill {
    content = '';
    description = '';
    environments: string[] = [];
    disabledEnvironments: string[] = [];
    disableModelInvocation = false;
    globs: string[] = [];
    scopedTo: string[] = [];
    argumentHint = '';
    disableUserInvocation = false;
    constructor(readonly fullPath: string) { super(); }
}
export class FixtureRule extends FixtureProto implements agent_v1_CursorRule {
    content = '';
    source = 0;
    environments: string[] = [];
    disabledEnvironments: string[] = [];
    scopedTo: string[] = [];
    frontmatter = '';
    type: agent_v1_CursorRuleType;
    constructor(readonly fullPath: string, kind: 'global' | 'agentFetched' = 'global') {
        super();
        this.type = Object.assign(new FixtureProto(), { type: kind === 'global'
                ? { case: 'global' as const, value: new FixtureProto() }
                : { case: 'agentFetched' as const, value: Object.assign(new FixtureProto(), { description: '' }) } });
    }
}
export class FixtureSubagent extends FixtureProto implements agent_v1_CustomSubagent {
    fullPath = '/subagent';
    description = '';
    tools: string[] = [];
    model = '';
    prompt = '';
    permissionMode = 0;
    isBackground = false;
    forceDefaultModel = false;
    constructor(readonly name: string) { super(); }
}
export class FixtureRequestContext extends FixtureProto implements CachedRequestContext {
    rules: CachedRequestContext['rules'] = [new FixtureRule('b')];
    agentSkills: CachedRequestContext['agentSkills'] = [new FixtureSkill('skill')];
    customSubagents: CachedRequestContext['customSubagents'] = [];
    repositoryInfo: CachedRequestContext['repositoryInfo'] = [];
    tools: CachedRequestContext['tools'] = [];
    gitRepos: CachedRequestContext['gitRepos'] = [];
    projectLayouts: CachedRequestContext['projectLayouts'] = [];
    mcpInstructions: CachedRequestContext['mcpInstructions'] = [];
    fileContents: CachedRequestContext['fileContents'] = {};
    precomputedHumanChanges: CachedRequestContext['precomputedHumanChanges'] = [];
    nonFileRules: CachedRequestContext['nonFileRules'] = [];
    disabledTeamRules: string[] = [];
    adminCommandDenylist: string[] = [];
    cloudRule = 'cloud';
}
export class FixtureSecretRedactor implements SecretRedactor {
    constructor(readonly names: readonly string[], readonly access: (name: string) => string | readonly string[] | undefined) { }
    hasSecrets(): boolean { return this.names.length > 0; }
    getTrailingSecretPrefixLength(): number { throw new Error('Unexpected redaction'); }
    startOfMatchAcross(): number { throw new Error('Unexpected redaction'); }
    redactString(): never { throw new Error('Unexpected redaction'); }
    redactBytes(): never { throw new Error('Unexpected redaction'); }
}
export class FixtureResource<T> implements Resource<T> {
    readonly symbol: symbol;
    constructor(readonly name: string) { this.symbol = Symbol(name); }
    remoteImplementation(): T { throw new Error('Unexpected remote fixture resource'); }
    registerControlledImplementation(): void { throw new Error('Unexpected controlled fixture resource'); }
}
export class FixtureResources implements ListableResourceAccessor {
    private readonly values = new Map<Resource<unknown>, unknown>();
    register<T>(resource: Resource<T>, value: NoInfer<T>): void { this.values.set(resource, value); }
    get<T>(resource: Resource<T>): T | undefined {
        // register enforces the value/resource relationship; this identity lookup restores it.
        return this.values.get(resource) as T | undefined;
    }
    entries(): Iterable<ResourceEntry> { return this.values.entries(); }
}
export class FixtureShellArgs extends FixtureProto implements agent_v1_ShellArgs {
    command = 'fixture';
    workingDirectory = '/fixture';
    timeout = 0;
    toolCallId = 't';
    simpleCommands: string[] = [];
    hasInputRedirect = false;
    hasOutputRedirect = false;
    isBackground = false;
    skipApproval = false;
    timeoutBehavior = 0;
    closeStdin = false;
    adminCommandDenylist: string[] = [];
}
export class FixtureShellExit extends FixtureProto implements agent_v1_ShellStreamExit {
    cwd = '/fixture';
    aborted = false;
    constructor(readonly code: number) { super(); }
}
export class FixtureShellStream extends FixtureProto implements agent_v1_ShellStream {
    event: agent_v1_ShellStream['event'];
    constructor(code: number) { super(); this.event = { case: 'exit', value: new FixtureShellExit(code) }; }
}
export function fixtureStats(isFile: boolean, links: number): Stats {
    return { dev: 1, ino: 2, mode: 0, nlink: links, uid: 0, gid: 0, rdev: 0, size: 0, blksize: 0, blocks: 0,
        atimeMs: 0, mtimeMs: 0, ctimeMs: 0, birthtimeMs: 0, atime: new Date(0), mtime: new Date(0), ctime: new Date(0), birthtime: new Date(0),
        isFile: () => isFile, isDirectory: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isSymbolicLink: () => false, isFIFO: () => false, isSocket: () => false };
}
export function fixtureDeferred<T>() {
    let resolve: (value: T) => void = () => { throw new Error('Deferred initialized incorrectly'); };
    const promise = new Promise<T>(accept => { resolve = accept; });
    return { promise, resolve };
}
export class FixtureWebSocket implements WebSocket {
    readonly readyState = 1;
    readonly sends: unknown[] = [];
    message: (data: Buffer, isBinary: boolean) => void = () => { throw new Error('Message listener not installed'); };
    closed: (code: number, reason: Buffer) => void = () => { throw new Error('Close listener not installed'); };
    failed: (error: Error) => void = () => { throw new Error('Error listener not installed'); };
    on(...args: [
        'message',
        (data: Buffer, isBinary: boolean) => void
    ] | [
        'close',
        (code: number, reason: Buffer) => void
    ] | [
        'error',
        (error: Error) => void
    ]): this {
        if (args[0] === 'message')
            this.message = args[1];
        if (args[0] === 'close')
            this.closed = args[1];
        if (args[0] === 'error')
            this.failed = args[1];
        return this;
    }
    send(data: string | Uint8Array): void {
        const value: unknown = JSON.parse(typeof data === 'string' ? data : Buffer.from(data).toString());
        this.sends.push(value);
    }
    close(): void { this.closed(1000, Buffer.alloc(0)); }
}
export class FixtureExecClient extends FixtureProto implements agent_v1_ExecClientMessage {
    execId = '';
    hookAdditionalContexts: agent_v1_ExecClientMessage['hookAdditionalContexts'] = [];
    message: agent_v1_ExecClientMessage['message'] = { case: undefined };
    constructor(readonly id: number) { super(); }
}
export class FixtureExecControl extends FixtureProto implements agent_v1_ExecClientControlMessage {
    message: agent_v1_ExecClientControlMessage['message'] = { case: undefined };
}
export function fixtureBigIntStats(isFile: boolean, links: bigint): BigIntStats {
    return { dev: 1n, ino: 2n, mode: 0n, nlink: links, uid: 0n, gid: 0n, rdev: 0n, size: 0n, blksize: 0n, blocks: 0n,
        atimeMs: 0n, mtimeMs: 0n, ctimeMs: 0n, birthtimeMs: 0n, atimeNs: 0n, mtimeNs: 0n, ctimeNs: 0n, birthtimeNs: 0n,
        atime: new Date(0), mtime: new Date(0), ctime: new Date(0), birthtime: new Date(0),
        isFile: () => isFile, isDirectory: () => false, isBlockDevice: () => false, isCharacterDevice: () => false, isSymbolicLink: () => false, isFIFO: () => false, isSocket: () => false };
}
