import { createLogger } from "../interop/vendor/context-logger.js";
import { withSpan, getSpan, reportEvent } from "../interop/vendor/context-otel.js";
import { PingResponse, GetCapabilitiesResponse, SyncScopedSecretsResponse, ReloadAgentSkillsResponse, ReloadPluginsResponse, LoadMcpServersResponse, ExecResponse, StdoutEvent, StderrEvent, ExitEvent, EntryType, DirectoryEntry, ListDirectoryResponse, ReadTextFileResponse, WriteTextFileResponse, ReadBinaryFileResponse, ExportFileResponse, ExportFileMetadata, WriteBinaryFileResponse, BatchGetDiffErrorKind, BatchGetDiffResult, BatchGetDiffUnchanged, BatchGetDiffResponse, BatchGetDiffError, GetWorkspaceChangesHashResponse, RefreshGithubAccessTokenResponse, WarmRemoteAccessServerResponse, DownloadCursorServerResponse, ArtifactRootKind, ListArtifactsResponse, ArtifactPathError, ArtifactPathErrorKind, ArtifactUploadMetadata, ArtifactUploadStatus, GetMcpRefreshTokensResponse, UpdateEnvironmentVariablesRequest, UpdateEnvironmentVariablesResponse } from "../interop/vendor/proto-agent-v1-control-service-pb.js";
import { GetDiffRequest_OutputFormat } from "../interop/vendor/proto-aiserver-v1-utils-pb.js";
import { asyncMapValues } from "../interop/vendor/utils-promise-extras.js";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import nodeChildProcess from "node:child_process";
import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import { normalizeCloudAgentArtifactAbsolutePath, toAgentStoreArtifactPath } from "../interop/vendor/agent-core-cloud-agent-artifact-paths.js";
import { LocalGitExecutor } from "../interop/vendor/local-exec.js";
import { createWritableIterable } from "../interop/vendor/utils-writable-iterable.js";
import { isSpawnCwdHopActive, SPAWN_CWD_HOP_USED_EVENT, spawnCwdHopLogFields, isSpawnCwdHopCdFailure, SPAWN_CWD_HOP_CD_FAILED_EVENT, isSpawnCwdHopCdFailedError } from "../interop/vendor/utils-safe-spawn-cwd.js";
import { spawnWorkload } from "../interop/vendor/utils-workload-spawn.js";
import { ARTIFACT_MTIME_TOLERANCE_MS } from "./artifactUploads.js";
import { parseCommaSeparatedNames } from "./comma-separated-names.js";
import { handleDesktopLease } from "./desktopLease.js";
import { isClientDisconnectError, annotateSpawnEnoent, toInternalConnectError } from "./errors.js";
import { exportFileChunks } from "./export-file.js";
import { installPluginArtifactFromUrl } from "./install-plugin-artifact.js";
import { ManagedEnvironment as ManagedEnvironmentDependency, ManagedEnvironmentValidationError, SANDBOX_ENV_RESTORE_ENV_VAR } from "./managed-environment.js";
import { getRefreshedMcpOAuthTokens } from "./mcp-token-storage.js";
import { CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR, CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR } from "./secretRedaction.js";
import { discoverExecDaemonWorkspacePaths } from "./workspace-discovery.js";
import type { Context } from "../interop/contracts/context.js";
import type { Span } from "../interop/contracts/otel.js";
import type * as Proto from "../interop/contracts/protobuf-generated.js";
import type { GitService, GitDiffRequest } from "./git.js";
import type { ArtifactUploadManagerProvider } from "./artifactUploads.js";
import type { ManagedEnvironment, ManagedEnvironmentUpdate } from "./managed-environment.js";
import type { SecretRedactionState } from "./secretRedaction.js";
import type { ScopedSecretStore } from "./scoped-secrets.js";
import type { DesktopLeaseStorePort } from "./desktopLease.js";
import type { MachineResourceMonitor } from "./machine-resources.js";
export interface ControlRemoteAccessService {
    warmCursorServer(ctx: Context, commit: string, port: number, connectionToken: string): Promise<{ spawnedPid: number | undefined }>;
    downloadCursorServer(ctx: Context, commit: string): Promise<boolean>;
}
export interface ControlServerOptions {
    workspacePaths?: string[];
    onReloadAgentSkills?: (ctx: Context) => void | Promise<void>;
    onReloadPlugins?: (ctx: Context) => void | Promise<void>;
    onLoadMcpServers?: (ctx: Context, mcpConfigJson: string, options: { removeMissing?: boolean }) => Promise<string[]>;
    getComputerUseSupported?: () => boolean;
    desktopLeaseStore?: DesktopLeaseStorePort;
    machineResourceMonitor?: MachineResourceMonitor;
    managedEnvironment?: ManagedEnvironment;
    githubTokenPushConsent?: boolean;
    secretRedactionState?: SecretRedactionState;
    scopedSecretStore?: ScopedSecretStore;
    onGithubAccessTokenRefreshed?: () => void | Promise<void>;
    onManagedEnvironmentUpdated?: (ctx: Context, args: Pick<ManagedEnvironmentUpdate, "env" | "removedKeys">) => void | Promise<void>;
    onPing?: (ctx: Context) => void | Promise<void>;
}

export const logger = createLogger("exec-daemon");
export const filesystemLogger = createLogger("filesystem");
export const BATCH_GET_DIFF_FETCH_TIMEOUT_MS = 30000;
export function createInternalError(prefix: string, error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const message = `${prefix}: ${errorMessage}${errorStack ? `\n\nStack trace:\n${errorStack}` : ""}`;
    return new ConnectError(message, Code.Internal, undefined, undefined, error);
}
export function logFilesystemError(ctx: Context, operation: string, error: unknown) {
    // Never log raw fs errors; Node's messages frequently include absolute paths.
    if (error instanceof ConnectError) {
        filesystemLogger.error(ctx, `${operation} failed`, new Error("ConnectError"), {
            connectCode: error.code,
        });
        return;
    }
    if (error instanceof Error && "code" in error) {
        const nodeError = error;
        filesystemLogger.error(ctx, `${operation} failed`, new Error("FsError"), {
            fsCode: nodeError.code,
        });
        return;
    }
    filesystemLogger.error(ctx, `${operation} failed`, new Error("UnknownError"));
}
export async function runControlSpan<T>(ctx: Context, name: string, fn: (ctx: Context, span: Span | undefined) => Promise<T>): Promise<T> {
    const spanCtx = withSpan(ctx.withName(name));
    const span = getSpan(spanCtx);
    try {
        return await fn(spanCtx, span);
    }
    catch (error) {
        span?.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span?.end();
    }
}
export function mapFsErrorToConnectError(error: unknown, operation: string) {
    if (error instanceof ConnectError) {
        return error;
    }
    if (error instanceof Error && "code" in error) {
        const nodeError = error;
        switch (nodeError.code) {
            case "ENOENT":
                return new ConnectError(`${operation}: not found`, Code.NotFound);
            case "EACCES":
            case "EPERM":
                return new ConnectError(`${operation}: permission denied`, Code.PermissionDenied);
            case "ENOTDIR":
                return new ConnectError(`${operation}: not a directory`, Code.InvalidArgument);
            case "EISDIR":
                return new ConnectError(`${operation}: is a directory`, Code.InvalidArgument);
            case "ELOOP":
            case "ENAMETOOLONG":
                return new ConnectError(`${operation}: invalid path`, Code.InvalidArgument);
            default:
                return new ConnectError(`${operation} failed`, Code.Internal);
        }
    }
    return new ConnectError(`${operation} failed`, Code.Internal);
}
// Keep in sync with the prefix `githubHandler.ts` (backend) matches to pull the
// detail out of the token-push failure log.
export const CLONE_AFTER_TOKEN_REFRESH_FAILED_MESSAGE_PREFIX = "Failed to clone git repositories after token refresh";
export const CLONE_AFTER_TOKEN_REFRESH_DETAIL_MAX_CHARS = 500;
/**
 * The RPC error for a failed clone-on-claim hook: the constant prefix the
 * backend groups on, then the hook's own message (which the hook already made
 * credential- and path-free) on one line and capped, so what git said is
 * readable in our logs without the worker's.
 */
export function formatCloneAfterTokenRefreshFailure(error: unknown) {
    const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
    let detail = raw
        .replace(/:\/\/[^/@\s]+@/g, "://")
        .replace(/\s+/g, " ")
        .trim();
    if (detail.length === 0) {
        return CLONE_AFTER_TOKEN_REFRESH_FAILED_MESSAGE_PREFIX;
    }
    if (detail.length > CLONE_AFTER_TOKEN_REFRESH_DETAIL_MAX_CHARS) {
        detail = `${detail.slice(0, CLONE_AFTER_TOKEN_REFRESH_DETAIL_MAX_CHARS)}…`;
    }
    return `${CLONE_AFTER_TOKEN_REFRESH_FAILED_MESSAGE_PREFIX}: ${detail}`;
}
export function getGitOptionsFromGetDiffRequest(request: Proto.aiserver_v1_GetDiffRequest) {
    return {
        ref: request.ref,
        baseRef: request.baseRef,
        mergeBase: request.mergeBase,
        targetPaths: request.targetPaths,
        unifiedContextLines: request.unifiedContextLines ?? 3,
        maxUntrackedFiles: request.maxUntrackedFiles,
        submoduleRecurseDepth: request.submoduleRecurseDepth,
        includeSpaceChanges: request.includeSpaceChanges,
        outputFormat: request.outputFormat ?? GetDiffRequest_OutputFormat.FILE_DIFFS,
        computePatchId: request.computePatchId,
        returnHeadSha: request.returnHeadSha,
        maxFilesWithContents: request.maxFilesWithContents,
        maxContentBytes: request.maxContentBytes,
    };
}
export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * True when the caller's recorded revisions still describe what a diff would
 * be computed from. A working-tree diff (empty `ref`) also needs the workspace
 * hash to match, since the head sha does not cover uncommitted edits.
 */
export function knownRevisionsMatch(item: Proto.agent_v1_BatchGetDiffItem, revisions: Awaited<ReturnType<GitService["resolveDiffRevisions"]>>) {
    if (!item.knownBaseSha || !item.knownHeadSha) {
        return false;
    }
    if (item.knownBaseSha !== revisions.baseSha || item.knownHeadSha !== revisions.headSha) {
        return false;
    }
    if (revisions.workspaceHash === undefined) {
        return true;
    }
    return (item.knownWorkspaceHash !== undefined &&
        item.knownWorkspaceHash !== "" &&
        item.knownWorkspaceHash === revisions.workspaceHash);
}
/**
 * Run an abortable async operation with a timeout. The operation receives an
 * AbortSignal that is aborted when the timeout elapses, so it can cancel any
 * underlying work (e.g. kill a child process) instead of leaving an orphan.
 *
 * Prefer this over `Promise.race`-style timeouts whenever the wrapped work
 * holds external resources (file locks, sockets, subprocesses).
 */
export async function withTimeoutAndAbort<T>(run: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await run(controller.signal);
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Core exec daemon implementation
 */
export class ControlServer {
    gitService: GitService;
    remoteAccessService: ControlRemoteAccessService;
    artifactUploadManagerProvider: ArtifactUploadManagerProvider;
    managedEnvironment: ManagedEnvironment;
    workspacePaths: string[];
    onReloadAgentSkills: ControlServerOptions["onReloadAgentSkills"];
    onReloadPlugins: ControlServerOptions["onReloadPlugins"];
    onLoadMcpServers: ControlServerOptions["onLoadMcpServers"];
    getComputerUseSupported: ControlServerOptions["getComputerUseSupported"];
    desktopLeaseStore: ControlServerOptions["desktopLeaseStore"];
    machineResourceMonitor: ControlServerOptions["machineResourceMonitor"];
    githubTokenPushConsent: ControlServerOptions["githubTokenPushConsent"];
    secretRedactionState: ControlServerOptions["secretRedactionState"];
    scopedSecretStore: ControlServerOptions["scopedSecretStore"];
    onGithubAccessTokenRefreshed: ControlServerOptions["onGithubAccessTokenRefreshed"];
    onManagedEnvironmentUpdated: ControlServerOptions["onManagedEnvironmentUpdated"];
    onPing: ControlServerOptions["onPing"];
    // Keys that were removed from the managed environment and need to be unset in
    // the restore script until they are re-added. This persists across calls so
    // rapid successive replace calls (e.g., user clicking "save" twice) don't
    // lose the unset commands before a shell command has a chance to run and
    // update the snapshot.
    pendingUnsets = new Set<string>();
    pendingRestores = new Map<string, string>();
    previousManagedEnvironmentValues = new Map<string, string | undefined>();
    // Run-scoped env overlays keyed by runId, refcounted by holder. Concurrent
    // activities for the same run share one overlay: env is applied for the first
    // holder and the keys are removed only when the last holder releases, so a
    // sibling activity finishing first cannot strip run env mid-run. Holders are
    // stable per-activity ids, so a retried apply re-adds the same holder
    // (idempotent) and cannot leave run env stranded on the VM after the run.
    runScopedOverlays = new Map<string, { keys: Set<string>; holders: Set<string> }>();
    // Serializes environment updates so concurrent overlay apply/release (and
    // other managed-env writers) cannot interleave their process.env mutations.
    envUpdateChain = Promise.resolve();
    constructor(gitService: GitService, remoteAccessService: ControlRemoteAccessService, artifactUploadManagerProvider: ArtifactUploadManagerProvider, options: ControlServerOptions = {}) {
        this.gitService = gitService;
        this.remoteAccessService = remoteAccessService;
        this.artifactUploadManagerProvider = artifactUploadManagerProvider;
        this.workspacePaths = options.workspacePaths ?? [process.cwd()];
        this.onReloadAgentSkills = options.onReloadAgentSkills;
        this.onReloadPlugins = options.onReloadPlugins;
        this.onLoadMcpServers = options.onLoadMcpServers;
        this.getComputerUseSupported = options.getComputerUseSupported;
        this.desktopLeaseStore = options.desktopLeaseStore;
        this.machineResourceMonitor = options.machineResourceMonitor;
        this.managedEnvironment = options.managedEnvironment ?? new ManagedEnvironmentDependency();
        this.githubTokenPushConsent = options.githubTokenPushConsent;
        this.secretRedactionState = options.secretRedactionState;
        this.scopedSecretStore = options.scopedSecretStore;
        this.onGithubAccessTokenRefreshed = options.onGithubAccessTokenRefreshed;
        this.onManagedEnvironmentUpdated = options.onManagedEnvironmentUpdated;
        this.onPing = options.onPing;
    }
    async ping(ctx: Context, _request: Proto.agent_v1_PingRequest) {
        logger.debug(ctx, "Ping");
        try {
            await this.onPing?.(ctx);
        }
        catch (error) {
            logger.warn(ctx, "onPing hook failed", { error });
        }
        return new PingResponse({});
    }
    async getCapabilities(ctx: Context, _request: Proto.agent_v1_GetCapabilitiesRequest) {
        logger.debug(ctx, "GetCapabilities");
        return new GetCapabilitiesResponse({
            installPluginArtifactSupported: true,
            computerUseKeyStrokeSupported: true,
            ...(this.getComputerUseSupported !== undefined && {
                computerUseSupported: this.getComputerUseSupported(),
            }),
        });
    }
    async syncScopedSecrets(ctx: Context, request: Proto.agent_v1_SyncScopedSecretsRequest) {
        if (this.scopedSecretStore === undefined) {
            throw new ConnectError("scoped secrets are not enabled on this daemon", Code.Unimplemented);
        }
        if (request.scopeId.length === 0) {
            throw new ConnectError("scope_id is required", Code.InvalidArgument);
        }
        const held = this.scopedSecretStore.revisionOf(request.scopeId);
        if (request.secrets !== undefined) {
            const isStalePush = held !== undefined && request.revision < held;
            if (!isStalePush) {
                try {
                    this.scopedSecretStore.set(request.scopeId, request.revision, request.secrets.values);
                }
                catch (error) {
                    if (error instanceof ManagedEnvironmentValidationError) {
                        throw new ConnectError(error.message, Code.InvalidArgument);
                    }
                    throw error;
                }
            }
            logger.info(ctx, "SyncScopedSecrets push", {
                scopeId: request.scopeId,
                revision: request.revision,
                heldRevision: held,
                applied: !isStalePush,
                count: Object.keys(request.secrets.values).length,
            });
        }
        const current = this.scopedSecretStore.revisionOf(request.scopeId);
        return new SyncScopedSecretsResponse(current === undefined ? {} : { revision: current });
    }
    desktopLease(_ctx: Context, request: Proto.agent_v1_DesktopLeaseRequest) {
        return handleDesktopLease(this.desktopLeaseStore, request);
    }
    async getResourceUsage(_ctx: Context, request: Proto.agent_v1_GetResourceUsageRequest) {
        if (this.machineResourceMonitor === undefined) {
            throw new ConnectError("Machine resources are not available on this daemon", Code.Unimplemented);
        }
        return this.machineResourceMonitor.handleGetResourceUsage(request);
    }
    async installPluginArtifact(ctx: Context, request: Proto.agent_v1_InstallPluginArtifactRequest) {
        return await runControlSpan(ctx, "exec_daemon.installPluginArtifact", async (spanCtx, span) => {
            span?.setAttribute("plugin.has_artifact_digest", request.artifactDigest.length > 0);
            return await installPluginArtifactFromUrl(spanCtx, request);
        });
    }
    async reloadAgentSkills(ctx: Context, _request: Proto.agent_v1_ReloadAgentSkillsRequest) {
        return await runControlSpan(ctx, "exec_daemon.reloadAgentSkills", async (spanCtx) => {
            await this.onReloadAgentSkills?.(spanCtx);
            return new ReloadAgentSkillsResponse({});
        });
    }
    async reloadPlugins(ctx: Context, _request: Proto.agent_v1_ReloadPluginsRequest) {
        return await runControlSpan(ctx, "exec_daemon.reloadPlugins", async (spanCtx) => {
            await this.onReloadPlugins?.(spanCtx);
            return new ReloadPluginsResponse({});
        });
    }
    async loadMcpServers(ctx: Context, request: Proto.agent_v1_LoadMcpServersRequest) {
        return await runControlSpan(ctx, "exec_daemon.loadMcpServers", async (spanCtx) => {
            const loader = this.onLoadMcpServers;
            if (loader === undefined) {
                throw new ConnectError("Session MCP loading is not available on this daemon", Code.Unimplemented);
            }
            const loadedServerNames = await loader(spanCtx, request.mcpConfigJson, {
                removeMissing: request.removeMissing,
            });
            return new LoadMcpServersResponse({ loadedServerNames });
        });
    }
    /**
     * Handle simple process exec requests - server-side streaming
     */
    async *exec(ctx: Context, request: Proto.agent_v1_ExecRequest) {
        // Create a child span for this operation
        const spanCtx = withSpan(ctx.withName("exec_daemon.exec"));
        const span = getSpan(spanCtx);
        try {
            logger.debug(spanCtx, "Running command", {
                command: request.command,
                args: request.args,
                cwd: request.cwd,
            });
            const stream = createWritableIterable<Proto.agent_v1_ExecResponse>();
            const effectiveCwd = request.cwd || process.cwd();
            if (isSpawnCwdHopActive(effectiveCwd)) {
                reportEvent(spanCtx, SPAWN_CWD_HOP_USED_EVENT);
                logger.info(spanCtx, SPAWN_CWD_HOP_USED_EVENT, {
                    caller: "exec",
                    ...spawnCwdHopLogFields(effectiveCwd),
                });
            }
            const child = spawnWorkload(nodeChildProcess.spawn, request.command, request.args, {
                env: { ...process.env, ...request.environment },
                // exec has no input channel, so give the child /dev/null for stdin.
                // An open stdin pipe makes tools that read stdin when given no path
                // (e.g. `rg`) block forever, and keeps fd 0 open in background
                // processes, which can delay the `close` event.
                stdio: ["ignore", "pipe", "pipe"],
                cwd: effectiveCwd,
            });
            let streamFinalized = false;
            let stdoutBytes = 0;
            let stdoutPrefix = Buffer.alloc(0);
            const stdoutPrefixLimit = 32;
            function finalizeStream(err?: unknown) {
                if (streamFinalized)
                    return;
                streamFinalized = true;
                if (err) {
                    stream.throw(err);
                }
                else {
                    stream.close();
                }
            }
            function safeStreamWrite(response: Proto.agent_v1_ExecResponse) {
                void stream.write(response).catch((writeErr: unknown) => {
                    if (isClientDisconnectError(writeErr)) {
                        logger.debug(spanCtx, "Stream write failed (client disconnected)");
                    }
                    else {
                        logger.debug(spanCtx, "Stream write failed", {
                            error: writeErr instanceof Error ? writeErr.message : String(writeErr),
                        });
                    }
                    finalizeStream();
                });
            }
            child.stdout?.on("data", (data: Buffer) => {
                stdoutBytes += data.length;
                if (stdoutPrefix.length < stdoutPrefixLimit) {
                    const take = Math.min(data.length, stdoutPrefixLimit - stdoutPrefix.length);
                    stdoutPrefix = Buffer.concat([stdoutPrefix, data.subarray(0, take)]);
                }
                if (streamFinalized)
                    return;
                const response = new ExecResponse({
                    event: {
                        case: "stdoutEvent",
                        value: new StdoutEvent({ data: data.toString() }),
                    },
                });
                safeStreamWrite(response);
            });
            child.stderr?.on("data", (data: Buffer) => {
                if (streamFinalized)
                    return;
                const response = new ExecResponse({
                    event: {
                        case: "stderrEvent",
                        value: new StderrEvent({ data: data.toString() }),
                    },
                });
                safeStreamWrite(response);
            });
            child.on("close", (code) => {
                if (isSpawnCwdHopCdFailure({
                    exitCode: code,
                    stdoutBytes,
                    stdoutPrefix,
                    cwd: effectiveCwd,
                })) {
                    reportEvent(spanCtx, SPAWN_CWD_HOP_CD_FAILED_EVENT);
                    logger.warn(spanCtx, SPAWN_CWD_HOP_CD_FAILED_EVENT, {
                        caller: "exec",
                        ...spawnCwdHopLogFields(effectiveCwd),
                    });
                }
                span?.setAttribute("exec.exit_code", code ?? 0);
                span?.end();
                if (streamFinalized)
                    return;
                const response = new ExecResponse({
                    event: {
                        case: "exitEvent",
                        value: new ExitEvent({ exitCode: code ?? 0 }),
                    },
                });
                void stream.write(response).then(() => finalizeStream(), (writeErr: unknown) => {
                    if (!isClientDisconnectError(writeErr)) {
                        logger.debug(spanCtx, "Stream write failed on close", {
                            error: writeErr instanceof Error ? writeErr.message : String(writeErr),
                        });
                    }
                    finalizeStream();
                });
            });
            child.on("error", (rawErr) => {
                if (isSpawnCwdHopCdFailedError(rawErr, effectiveCwd)) {
                    reportEvent(spanCtx, SPAWN_CWD_HOP_CD_FAILED_EVENT);
                    logger.warn(spanCtx, SPAWN_CWD_HOP_CD_FAILED_EVENT, {
                        caller: "exec",
                        ...spawnCwdHopLogFields(effectiveCwd),
                    });
                    span?.recordException(rawErr);
                    span?.end();
                    finalizeStream(rawErr);
                    return;
                }
                const err = annotateSpawnEnoent(rawErr, {
                    command: request.command,
                    cwd: effectiveCwd,
                });
                logger.error(spanCtx, "Process spawn error", err);
                span?.recordException(err);
                span?.end();
                finalizeStream(err);
            });
            // Yield from the stream
            yield* stream;
        }
        catch (error) {
            // Client disconnect errors (e.g. timeout on client side) are expected and not worth logging as errors
            if (isClientDisconnectError(error)) {
                logger.debug(ctx, "Client disconnected during streaming", {
                    code: error.code,
                });
                span?.end();
                return;
            }
            logger.error(spanCtx, "Exec request failed", error);
            span?.recordException(error);
            span?.end();
            throw toInternalConnectError("Exec command failed", error);
        }
    }
    async listDirectory(ctx: Context, request: Proto.agent_v1_ListDirectoryRequest) {
        return await runControlSpan(ctx, "exec_daemon.listDirectory", async (spanCtx, span) => {
            const requestPath = request.path || "";
            const includeHidden = request.includeHidden;
            span?.setAttribute("fs.include_hidden", includeHidden);
            try {
                const directoryPath = requestPath.length === 0 ? "." : requestPath;
                const dirents = await nodeFsPromises.readdir(directoryPath, { withFileTypes: true });
                const entries = [];
                const visibleDirents = dirents.filter((dirent) => {
                    if (includeHidden)
                        return true;
                    return !dirent.name.startsWith(".");
                });
                const batchSize = 64;
                for (let i = 0; i < visibleDirents.length; i += batchSize) {
                    const batch = visibleDirents.slice(i, i + batchSize);
                    const batchEntries = await Promise.all(batch.map(async (dirent) => {
                        const entryAbsolutePath = nodePath.resolve(directoryPath, dirent.name);
                        let entryType: Proto.agent_v1_EntryType;
                        if (dirent.isSymbolicLink()) {
                            entryType = EntryType.SYMLINK;
                        }
                        else if (dirent.isDirectory()) {
                            entryType = EntryType.DIRECTORY;
                        }
                        else {
                            entryType = EntryType.FILE;
                        }
                        try {
                            const stats = await nodeFsPromises.lstat(entryAbsolutePath);
                            return new DirectoryEntry({
                                name: dirent.name,
                                path: entryAbsolutePath,
                                type: entryType,
                                sizeBytes: BigInt(stats.size),
                                modifiedAtUnixMs: BigInt(Math.trunc(stats.mtimeMs)),
                            });
                        }
                        catch (error) {
                            // If the entry disappears between readdir() and lstat(), skip it.
                            if (error instanceof Error && "code" in error) {
                                const nodeError = error;
                                if (nodeError.code === "ENOENT") {
                                    return null;
                                }
                            }
                            throw error;
                        }
                    }));
                    for (const entry of batchEntries) {
                        if (entry)
                            entries.push(entry);
                    }
                }
                entries.sort((a, b) => {
                    const aIsDir = a.type === EntryType.DIRECTORY;
                    const bIsDir = b.type === EntryType.DIRECTORY;
                    if (aIsDir && !bIsDir)
                        return -1;
                    if (!aIsDir && bIsDir)
                        return 1;
                    return a.name.localeCompare(b.name);
                });
                span?.setAttribute("fs.entry_count", entries.length);
                return new ListDirectoryResponse({ entries });
            }
            catch (error) {
                logFilesystemError(spanCtx, "ListDirectory", error);
                throw mapFsErrorToConnectError(error, "ListDirectory");
            }
        });
    }
    /**
     * Read a text file from the filesystem
     */
    async readTextFile(ctx: Context, request: Proto.agent_v1_ReadTextFileRequest) {
        // Create a child span for this operation
        const spanCtx = withSpan(ctx.withName("exec_daemon.readTextFile"));
        const span = getSpan(spanCtx);
        span?.setAttribute("file.path", request.path);
        try {
            logger.debug(spanCtx, "Reading file", { path: request.path });
            const content = await nodeFsPromises.readFile(request.path, "utf8");
            span?.setAttribute("file.size", content.length);
            const response = new ReadTextFileResponse();
            response.content = content;
            span?.end();
            return response;
        }
        catch (error) {
            logger.error(spanCtx, "Read file failed", error, { path: request.path });
            span?.recordException(error);
            span?.end();
            if (error instanceof Error && "code" in error) {
                const nodeError = error;
                if (nodeError.code === "ENOENT") {
                    throw new ConnectError("File not found", Code.NotFound);
                }
                if (nodeError.code === "EACCES") {
                    throw new ConnectError("Permission denied", Code.PermissionDenied);
                }
                if (nodeError.code === "EISDIR") {
                    throw new ConnectError("Path is a directory", Code.InvalidArgument);
                }
            }
            throw createInternalError("Failed to read file", error);
        }
    }
    /**
     * Write a text file to the filesystem
     */
    async writeTextFile(ctx: Context, request: Proto.agent_v1_WriteTextFileRequest) {
        const spanCtx = withSpan(ctx.withName("exec_daemon.writeTextFile"));
        const span = getSpan(spanCtx);
        try {
            logger.debug(spanCtx, "Writing file", { path: request.path });
            await nodeFsPromises.writeFile(request.path, request.content, "utf8");
            span?.end();
            return new WriteTextFileResponse();
        }
        catch (error) {
            logger.error(spanCtx, "Write file failed", error, { path: request.path });
            span?.recordException(error);
            span?.end();
            if (error instanceof Error && "code" in error) {
                const nodeError = error;
                if (nodeError.code === "ENOENT") {
                    throw new ConnectError("Directory not found", Code.NotFound);
                }
                if (nodeError.code === "EACCES") {
                    throw new ConnectError("Permission denied", Code.PermissionDenied);
                }
                if (nodeError.code === "EISDIR") {
                    throw new ConnectError("Path is a directory", Code.InvalidArgument);
                }
            }
            throw createInternalError("Failed to write file", error);
        }
    }
    /**
     * Read a binary file from the filesystem
     */
    async readBinaryFile(ctx: Context, request: Proto.agent_v1_ReadBinaryFileRequest) {
        return await runControlSpan(ctx, "exec_daemon.readBinaryFile", async (spanCtx, span) => {
            try {
                logger.debug(spanCtx, "Reading binary file", { path: request.path });
                const content = await nodeFsPromises.readFile(request.path);
                span?.setAttribute("file.size", content.length);
                const response = new ReadBinaryFileResponse();
                response.content = new Uint8Array(content);
                return response;
            }
            catch (error) {
                logger.error(spanCtx, "Read binary file failed", error, {
                    path: request.path,
                });
                if (error instanceof Error && "code" in error) {
                    const nodeError = error;
                    if (nodeError.code === "ENOENT") {
                        throw new ConnectError("File not found", Code.NotFound);
                    }
                    if (nodeError.code === "EACCES") {
                        throw new ConnectError("Permission denied", Code.PermissionDenied);
                    }
                    if (nodeError.code === "EISDIR") {
                        throw new ConnectError("Path is a directory", Code.InvalidArgument);
                    }
                }
                throw createInternalError("Failed to read binary file", error);
            }
        });
    }
    async *exportFile(ctx: Context, request: Proto.agent_v1_ExportFileRequest) {
        const spanCtx = withSpan(ctx.withName("exec_daemon.exportFile"));
        const span = getSpan(spanCtx);
        try {
            for await (const part of exportFileChunks({
                filePath: request.path,
                workspaceRootPath: request.workspaceRootPath,
                authoritativeWorkspaceRootPaths: this.workspacePaths,
            })) {
                if (part.type === "metadata") {
                    span?.setAttribute("file.size", part.totalBytes.toString());
                    yield new ExportFileResponse({
                        payload: {
                            case: "metadata",
                            value: new ExportFileMetadata({
                                totalBytes: part.totalBytes,
                            }),
                        },
                    });
                }
                else {
                    yield new ExportFileResponse({
                        payload: {
                            case: "contentChunk",
                            value: part.contentChunk,
                        },
                    });
                }
            }
        }
        catch (error) {
            span?.recordException(error);
            throw mapFsErrorToConnectError(error, "Export file");
        }
        finally {
            span?.end();
        }
    }
    /**
     * Write a binary file to the filesystem
     */
    async writeBinaryFile(ctx: Context, request: Proto.agent_v1_WriteBinaryFileRequest) {
        return await runControlSpan(ctx, "exec_daemon.writeBinaryFile", async (spanCtx, span) => {
            span?.setAttribute("file.size", request.content.length);
            try {
                logger.debug(spanCtx, "Writing binary file", { path: request.path });
                await nodeFsPromises.writeFile(request.path, request.content);
                return new WriteBinaryFileResponse();
            }
            catch (error) {
                logger.error(spanCtx, "Write binary file failed", error, {
                    path: request.path,
                });
                if (error instanceof Error && "code" in error) {
                    const nodeError = error;
                    if (nodeError.code === "ENOENT") {
                        throw new ConnectError("Directory not found", Code.NotFound);
                    }
                    if (nodeError.code === "EACCES") {
                        throw new ConnectError("Permission denied", Code.PermissionDenied);
                    }
                    if (nodeError.code === "EISDIR") {
                        throw new ConnectError("Path is a directory", Code.InvalidArgument);
                    }
                }
                throw createInternalError("Failed to write binary file", error);
            }
        });
    }
    /**
     * Get git diff between refs
     */
    async getDiff(ctx: Context, request: Proto.aiserver_v1_GetDiffRequest) {
        // Create a child span for this operation
        const spanCtx = withSpan(ctx.withName("exec_daemon.getDiff"));
        const span = getSpan(spanCtx);
        span?.setAttribute("git.cwd", request.cwd);
        span?.setAttribute("git.base_ref", request.baseRef);
        span?.setAttribute("git.ref", request.ref);
        try {
            logger.debug(spanCtx, "Getting git diff", {
                cwd: request.cwd,
                baseRef: request.baseRef,
                ref: request.ref,
            });
            const result = await this.gitService.getDiff(request.cwd, getGitOptionsFromGetDiffRequest(request));
            span?.end();
            return result;
        }
        catch (error) {
            logger.error(spanCtx, "Get diff failed", error, { request });
            span?.recordException(error);
            span?.end();
            throw createInternalError("Failed to get diff", error);
        }
    }
    async batchGetDiff(ctx: Context, request: Proto.agent_v1_BatchGetDiffRequest) {
        const spanCtx = withSpan(ctx.withName("exec_daemon.batchGetDiff"));
        const span = getSpan(spanCtx);
        span?.setAttribute("batch.item_count", request.items.length);
        try {
            const fetchesByCwd = new Map<string, Set<string>>();
            for (const item of request.items) {
                const diffRequest = item.diffRequest;
                if (diffRequest === undefined) {
                    continue;
                }
                let branches = fetchesByCwd.get(diffRequest.cwd);
                if (branches === undefined) {
                    branches = new Set<string>();
                    fetchesByCwd.set(diffRequest.cwd, branches);
                }
                for (const branch of item.fetchBranches) {
                    branches.add(branch);
                }
            }
            let totalFetches = 0;
            for (const branches of fetchesByCwd.values()) {
                totalFetches += branches.size;
            }
            span?.setAttribute("batch.cwd_count", fetchesByCwd.size);
            span?.setAttribute("batch.fetch_count", totalFetches);
            logger.debug(spanCtx, "Running batch get diff", {
                itemCount: request.items.length,
                cwdCount: fetchesByCwd.size,
                fetchCount: totalFetches,
            });
            const fetchedByCwd = new Map<string, Set<string>>();
            const failedByCwd = new Map<string, Set<string>>();
            const fetchErrorsByCwd = new Map<string, Map<string, string>>();
            // Parallelize across cwds (different repos can fetch concurrently with no
            // contention) but sequential within a cwd to avoid racing on .git locks
            // (refs/heads/<branch>.lock, packed-refs.lock, index.lock).
            await asyncMapValues([...fetchesByCwd.entries()], async ([cwd, branches]) => {
                const fetched = new Set<string>();
                const failed = new Set<string>();
                const errors = new Map<string, string>();
                for (const branch of branches) {
                    try {
                        await this.fetchBranch({ cwd, branch });
                        fetched.add(branch);
                    }
                    catch (error) {
                        const message = getErrorMessage(error);
                        failed.add(branch);
                        errors.set(branch, message);
                        logger.debug(spanCtx, "Batch get diff fetch failed", {
                            branch,
                            error: message,
                        });
                    }
                }
                if (fetched.size > 0)
                    fetchedByCwd.set(cwd, fetched);
                if (failed.size > 0) {
                    failedByCwd.set(cwd, failed);
                    fetchErrorsByCwd.set(cwd, errors);
                }
            }, { max: 4 });
            let totalFetched = 0;
            let totalFailed = 0;
            for (const set of fetchedByCwd.values())
                totalFetched += set.size;
            for (const set of failedByCwd.values())
                totalFailed += set.size;
            span?.setAttribute("batch.fetched_count", totalFetched);
            span?.setAttribute("batch.failed_count", totalFailed);
            const results = [];
            let diffSuccessCount = 0;
            let diffFailureCount = 0;
            let diffUnchangedCount = 0;
            for (let i = 0; i < request.items.length; i++) {
                const item = request.items[i];
                const diffRequest = item.diffRequest;
                if (diffRequest === undefined) {
                    results.push(this.createBatchGetDiffErrorResult({
                        itemIndex: i,
                        fetchedBranches: [],
                        failedBranches: [],
                        kind: BatchGetDiffErrorKind.INTERNAL,
                        message: "Missing diff request",
                    }));
                    diffFailureCount += 1;
                    continue;
                }
                const fetchedBranches = item.fetchBranches.filter((branch) => fetchedByCwd.get(diffRequest.cwd)?.has(branch));
                const failedBranches = item.fetchBranches.filter((branch) => failedByCwd.get(diffRequest.cwd)?.has(branch));
                if (failedBranches.length > 0) {
                    const errors = fetchErrorsByCwd.get(diffRequest.cwd);
                    results.push(this.createBatchGetDiffErrorResult({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        kind: BatchGetDiffErrorKind.FETCH_FAILED,
                        message: failedBranches.map((branch) => errors?.get(branch) ?? branch).join("\n"),
                    }));
                    diffFailureCount += 1;
                    continue;
                }
                const gitOptions = {
                    ...getGitOptionsFromGetDiffRequest(diffRequest),
                    useCatFileBatch: item.useCatFileBatch === true,
                };
                const revisions = await this.resolveDiffRevisionsBestEffort(spanCtx, diffRequest.cwd, gitOptions);
                const resolvedFields = {
                    resolvedBaseSha: revisions?.baseSha,
                    resolvedHeadSha: revisions?.headSha,
                    resolvedWorkspaceHash: revisions?.workspaceHash,
                };
                if (revisions !== undefined && knownRevisionsMatch(item, revisions)) {
                    results.push(new BatchGetDiffResult({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        result: { case: "unchanged", value: new BatchGetDiffUnchanged() },
                        ...resolvedFields,
                    }));
                    diffUnchangedCount += 1;
                    continue;
                }
                try {
                    const diff = await this.gitService.getDiff(diffRequest.cwd, gitOptions);
                    results.push(new BatchGetDiffResult({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        result: { case: "diff", value: diff },
                        ...resolvedFields,
                    }));
                    diffSuccessCount += 1;
                }
                catch (error) {
                    const message = getErrorMessage(error);
                    logger.error(spanCtx, "Batch get diff item failed", error, {
                        itemIndex: i,
                    });
                    results.push(this.createBatchGetDiffErrorResult({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        kind: BatchGetDiffErrorKind.DIFF_FAILED,
                        message,
                    }));
                    diffFailureCount += 1;
                }
            }
            span?.setAttribute("batch.diff_success_count", diffSuccessCount);
            span?.setAttribute("batch.diff_failure_count", diffFailureCount);
            span?.setAttribute("batch.diff_unchanged_count", diffUnchangedCount);
            span?.end();
            return new BatchGetDiffResponse({ results });
        }
        catch (error) {
            logger.error(spanCtx, "Batch get diff failed", error);
            span?.recordException(error);
            span?.end();
            throw createInternalError("Failed to batch get diff", error);
        }
    }
    /**
     * Resolution failing must never fail the diff: the caller just gets no
     * revisions to record and recomputes next time.
     */
    async resolveDiffRevisionsBestEffort(ctx: Context, cwd: string, options: Pick<GitDiffRequest, "ref" | "baseRef" | "mergeBase">) {
        try {
            return await this.gitService.resolveDiffRevisions(cwd, options);
        }
        catch (error) {
            logger.debug(ctx, "Batch get diff revision resolution failed", {
                cwd,
                error: getErrorMessage(error),
            });
            return undefined;
        }
    }
    async fetchBranch({ cwd, branch }: { cwd: string; branch: string }) {
        // Forward the abort signal so a timed-out fetch kills the underlying
        // git process. Otherwise an orphan can hold .git locks
        // (refs/heads/<branch>.lock, packed-refs.lock, index.lock) and break
        // the sequential-within-cwd guarantee in batchGetDiff.
        await withTimeoutAndAbort((signal) => this.gitService.executeGitCommand(cwd, ["fetch", "origin", branch], {
            signal,
        }), BATCH_GET_DIFF_FETCH_TIMEOUT_MS);
    }
    createBatchGetDiffErrorResult(args: { itemIndex: number; fetchedBranches: string[]; failedBranches: string[]; kind: Proto.agent_v1_BatchGetDiffErrorKind; message: string }) {
        return new BatchGetDiffResult({
            itemIndex: args.itemIndex,
            fetchedBranches: args.fetchedBranches,
            failedBranches: args.failedBranches,
            result: {
                case: "error",
                value: new BatchGetDiffError({
                    kind: args.kind,
                    message: args.message,
                }),
            },
        });
    }
    /**
     * Get workspace changes hash
     */
    async getWorkspaceChangesHash(ctx: Context, request: Proto.agent_v1_GetWorkspaceChangesHashRequest) {
        return await runControlSpan(ctx, "exec_daemon.getWorkspaceChangesHash", async (spanCtx, span) => {
            span?.setAttribute("git.has_base_ref", request.baseRef.length > 0);
            try {
                logger.debug(spanCtx, "Getting workspace changes hash", {
                    rootPath: request.rootPath,
                    baseRef: request.baseRef,
                });
                const hash = await this.gitService.getWorkspaceChangesHash(request.rootPath, request.baseRef);
                return new GetWorkspaceChangesHashResponse({ hash });
            }
            catch (error) {
                logger.error(spanCtx, "Get workspace changes hash failed", error, {
                    request,
                });
                throw createInternalError("Failed to get workspace changes hash", error);
            }
        });
    }
    /**
     * Refresh access token for GitHub or GitLab
     */
    async refreshGithubAccessToken(ctx: Context, request: Proto.agent_v1_RefreshGithubAccessTokenRequest) {
        return await runControlSpan(ctx, "exec_daemon.refreshGithubAccessToken", async (spanCtx, span) => {
            if (this.githubTokenPushConsent === false) {
                throw new ConnectError("Start the worker with --mint-github-token to allow GitHub token pushes", Code.PermissionDenied);
            }
            span?.setAttribute("git.has_repo_url", request.repoUrl !== undefined && request.repoUrl.length > 0);
            try {
                const cloneUsername = request.cloneUsername !== undefined && request.cloneUsername.length > 0
                    ? request.cloneUsername
                    : undefined;
                span?.setAttribute("git.clone_username_requested", cloneUsername !== undefined);
                // If we're refreshing a token just for a specific repo (per-repo auth), we need to discover the workspace paths that may require rewrites because the single global rewrite won't work
                // Host-scoped refreshes that carry a clone username also discover
                // paths: normalizing every same-host embedded remote (multi-repo
                // pods keep them under /agent/repos, not the daemon cwd) is what
                // lets the fresh rewrite apply.
                const workspaceDiscovery = (request.repoUrl !== undefined && request.repoUrl.length > 0) ||
                    cloneUsername !== undefined
                    ? await discoverExecDaemonWorkspacePaths(spanCtx, new LocalGitExecutor(), process.cwd())
                    : undefined;
                span?.setAttribute("git.workspace_path_count", workspaceDiscovery?.workspacePaths.length ?? 0);
                const refreshStats = await this.gitService.refreshGithubAccessToken(request.githubAccessToken, request.hostname, {
                    repoPaths: workspaceDiscovery?.workspacePaths,
                    repoUrl: request.repoUrl,
                    cloneUsername,
                });
                // Passive telemetry for CS-216-class regressions: which scheme
                // actually landed and whether the stale state was displaced.
                // Queryable per pod in Datadog APM on this span.
                span?.setAttribute("git.applied_clone_username", refreshStats.appliedCloneUsername);
                span?.setAttribute("git.stale_rewrites_displaced", refreshStats.staleRewritesDisplaced);
                span?.setAttribute("git.remotes_normalized", refreshStats.remotesNormalized);
                this.secretRedactionState?.refreshFromEnv(process.env);
            }
            catch (_error) {
                // We keep this error opaque to avoid leaking the access token to clients and logs.
                throw new ConnectError("Failed to refresh access token", Code.Internal);
            }
            if (this.onGithubAccessTokenRefreshed !== undefined) {
                try {
                    await this.onGithubAccessTokenRefreshed();
                }
                catch (error) {
                    // This RPC returns to the backend; the hook contract (see
                    // ControlServerOptions) is that its message is already safe to
                    // forward, so what git said becomes readable in our own logs.
                    throw new ConnectError(formatCloneAfterTokenRefreshFailure(error), Code.Internal);
                }
            }
            return new RefreshGithubAccessTokenResponse();
        });
    }
    /**
     * Warm cursor server
     */
    async warmRemoteAccessServer(ctx: Context, request: Proto.agent_v1_WarmRemoteAccessServerRequest) {
        return await runControlSpan(ctx, "exec_daemon.warmRemoteAccessServer", async (spanCtx) => {
            try {
                await this.remoteAccessService.warmCursorServer(spanCtx, request.commit, request.port, request.connectionToken);
                return new WarmRemoteAccessServerResponse();
            }
            catch (error) {
                throw createInternalError("Failed to warm remote access server", error);
            }
        });
    }
    /**
     * Download cursor server binary without starting it
     */
    async downloadCursorServer(ctx: Context, request: Proto.agent_v1_DownloadCursorServerRequest) {
        return await runControlSpan(ctx, "exec_daemon.downloadCursorServer", async (spanCtx, span) => {
            try {
                const alreadyDownloaded = await this.remoteAccessService.downloadCursorServer(spanCtx, request.commit);
                span?.setAttribute("remote.already_downloaded", alreadyDownloaded);
                return new DownloadCursorServerResponse({ alreadyDownloaded });
            }
            catch (error) {
                throw createInternalError("Failed to download cursor server", error);
            }
        });
    }
    async listArtifacts(ctx: Context, request: Proto.agent_v1_ListArtifactsRequest) {
        return await runControlSpan(ctx, "exec_daemon.listArtifacts", async (spanCtx, span) => {
            span?.setAttribute("artifact.extra_path_count", request.extraPaths.length);
            try {
                const { manager, rootKind, artifactsRootPath } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                const responseRootKind = rootKind === "agent_store_backed"
                    ? ArtifactRootKind.AGENT_STORE_BACKED
                    : ArtifactRootKind.LOCAL;
                const extraPaths = request.extraPaths;
                const artifacts = await manager.listArtifacts(spanCtx);
                span?.setAttribute("artifact.existing_count", artifacts.length);
                if (extraPaths.length === 0) {
                    span?.setAttribute("artifact.path_error_count", 0);
                    return new ListArtifactsResponse({
                        artifacts,
                        rootKind: responseRootKind,
                    });
                }
                const existingPathIndexes = new Map<string, number>();
                const existingStorePathIndexes = new Map<string, number>();
                for (const [index, artifact] of artifacts.entries()) {
                    const normalizedArtifactPath = normalizeCloudAgentArtifactAbsolutePath(artifact.absolutePath) ?? artifact.absolutePath;
                    existingPathIndexes.set(normalizedArtifactPath, index);
                    const storeRelativePath = toAgentStoreArtifactPath({
                        absolutePath: normalizedArtifactPath,
                        artifactsRootPath,
                    })?.storeRelativePath;
                    if (storeRelativePath !== undefined) {
                        existingStorePathIndexes.set(storeRelativePath, index);
                    }
                }
                // Track normalized paths we've already considered (including extra paths)
                // so variants like /foo/./bar don't produce duplicate entries.
                const seenExtraPaths = new Set<string>();
                const extraArtifacts = [];
                const pathErrors: Record<string, Proto.agent_v1_ArtifactPathError> = {};
                for (const rawPath of extraPaths) {
                    const normalizedPath = normalizeCloudAgentArtifactAbsolutePath(rawPath);
                    if (normalizedPath === undefined) {
                        pathErrors[rawPath] = new ArtifactPathError({
                            kind: ArtifactPathErrorKind.INVALID_PATH,
                            code: "INVALID_PATH",
                            message: "Invalid artifact path",
                        });
                        continue;
                    }
                    if (seenExtraPaths.has(normalizedPath)) {
                        continue;
                    }
                    seenExtraPaths.add(normalizedPath);
                    const storeRelativePath = toAgentStoreArtifactPath({
                        absolutePath: normalizedPath,
                        artifactsRootPath,
                    })?.storeRelativePath;
                    const existingIndex = existingPathIndexes.get(normalizedPath) ??
                        (storeRelativePath === undefined
                            ? undefined
                            : existingStorePathIndexes.get(storeRelativePath));
                    try {
                        const stat = await nodeFsPromises.lstat(normalizedPath);
                        if (!stat.isFile()) {
                            if (existingIndex !== undefined) {
                                continue;
                            }
                            pathErrors[normalizedPath] = new ArtifactPathError({
                                kind: ArtifactPathErrorKind.NOT_A_FILE,
                                code: "NOT_A_FILE",
                                message: "Path is not a file",
                            });
                            continue;
                        }
                        const sizeBytes = BigInt(stat.size);
                        const updatedAtUnixMs = BigInt(Math.trunc(stat.mtimeMs));
                        const existing = existingIndex === undefined ? undefined : artifacts[existingIndex];
                        const mtimeDifferenceMs = existing === undefined
                            ? undefined
                            : existing.updatedAtUnixMs >= updatedAtUnixMs
                                ? existing.updatedAtUnixMs - updatedAtUnixMs
                                : updatedAtUnixMs - existing.updatedAtUnixMs;
                        if (existing?.sizeBytes === sizeBytes &&
                            mtimeDifferenceMs !== undefined &&
                            mtimeDifferenceMs <= BigInt(ARTIFACT_MTIME_TOLERANCE_MS)) {
                            continue;
                        }
                        const sourceArtifact = new ArtifactUploadMetadata({
                            absolutePath: normalizedPath,
                            artifactRelativePath: manager.getArtifactRelativePath(normalizedPath),
                            sizeBytes,
                            updatedAtUnixMs,
                            status: ArtifactUploadStatus.NOT_STARTED,
                        });
                        if (existingIndex === undefined) {
                            extraArtifacts.push(sourceArtifact);
                        }
                        else {
                            artifacts[existingIndex] = sourceArtifact;
                        }
                    }
                    catch (error) {
                        if (existingIndex !== undefined) {
                            continue;
                        }
                        if (error instanceof Error && "code" in error) {
                            const nodeError = error;
                            switch (nodeError.code) {
                                case "ENOENT":
                                    pathErrors[normalizedPath] = new ArtifactPathError({
                                        kind: ArtifactPathErrorKind.MISSING,
                                        code: nodeError.code,
                                        message: nodeError.message,
                                    });
                                    continue;
                                case "EACCES":
                                case "EPERM":
                                    pathErrors[normalizedPath] = new ArtifactPathError({
                                        kind: ArtifactPathErrorKind.PERMISSION,
                                        code: nodeError.code,
                                        message: nodeError.message,
                                    });
                                    continue;
                                case "ENOTDIR":
                                case "EISDIR":
                                    pathErrors[normalizedPath] = new ArtifactPathError({
                                        kind: ArtifactPathErrorKind.NOT_A_FILE,
                                        code: nodeError.code,
                                        message: nodeError.message,
                                    });
                                    continue;
                                default:
                                    break;
                            }
                        }
                        logFilesystemError(spanCtx, "listArtifacts extra path stat", error);
                        const err = error instanceof Error ? error : new Error(String(error));
                        pathErrors[normalizedPath] = new ArtifactPathError({
                            kind: ArtifactPathErrorKind.UNKNOWN,
                            code: "UNKNOWN",
                            message: err.message,
                        });
                    }
                }
                span?.setAttribute("artifact.extra_artifact_count", extraArtifacts.length);
                span?.setAttribute("artifact.path_error_count", Object.keys(pathErrors).length);
                return new ListArtifactsResponse({
                    artifacts: [...artifacts, ...extraArtifacts],
                    pathErrors,
                    rootKind: responseRootKind,
                });
            }
            catch (error) {
                logger.error(spanCtx, "Failed to list artifacts", error);
                throw createInternalError("Failed to list artifacts", error);
            }
        });
    }
    async uploadArtifacts(ctx: Context, request: Proto.agent_v1_UploadArtifactsRequest) {
        return await runControlSpan(ctx, "exec_daemon.uploadArtifacts", async (spanCtx, span) => {
            span?.setAttribute("artifact.upload_count", request.uploads.length);
            span?.setAttribute("artifact.wait_for_completion", request.waitForCompletion);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                return await manager.uploadArtifacts(spanCtx, request.uploads, request.waitForCompletion);
            }
            catch (error) {
                logger.error(spanCtx, "Failed to start artifact uploads", error);
                throw createInternalError("Failed to start artifact uploads", error);
            }
        });
    }
    async persistArtifactsToAgentStore(ctx: Context, request: Proto.agent_v1_PersistArtifactsToAgentStoreRequest) {
        return await runControlSpan(ctx, "exec_daemon.persistArtifactsToAgentStore", async (spanCtx, span) => {
            span?.setAttribute("artifact.persist_count", request.artifacts.length);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                return await manager.persistArtifactsToAgentStore(spanCtx, request.artifacts);
            }
            catch (error) {
                logger.error(spanCtx, "Failed to persist artifacts to Agent Store", error);
                throw createInternalError("Failed to persist artifacts to Agent Store", error);
            }
        });
    }
    async persistArtifactsToParentStore(ctx: Context, request: Proto.agent_v1_PersistArtifactsToParentStoreRequest) {
        return await runControlSpan(ctx, "exec_daemon.persistArtifactsToParentStore", async (spanCtx, span) => {
            span?.setAttribute("artifact.persist_count", request.artifacts.length);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                return await manager.persistArtifactsToParentStore(spanCtx, request.artifacts);
            }
            catch (error) {
                logger.error(spanCtx, "Failed to persist artifacts to parent store", error);
                throw createInternalError("Failed to persist artifacts to parent store", error);
            }
        });
    }
    async restoreArtifacts(ctx: Context, request: Proto.agent_v1_RestoreArtifactsRequest) {
        return await runControlSpan(ctx, "exec_daemon.restoreArtifacts", async (spanCtx, span) => {
            span?.setAttribute("artifact.restore_count", request.artifacts.length);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                const response = await manager.restoreArtifacts(spanCtx, request.artifacts);
                span?.setAttribute("artifact.restore_result_count", response.results.length);
                return response;
            }
            catch (error) {
                logger.error(spanCtx, "Failed to restore artifacts", error);
                throw createInternalError("Failed to restore artifacts", error);
            }
        });
    }
    async getMcpRefreshTokens(ctx: Context, _request: Proto.agent_v1_GetMcpRefreshTokensRequest) {
        return await runControlSpan(ctx, "exec_daemon.getMcpRefreshTokens", async (spanCtx, span) => {
            try {
                const tokens = getRefreshedMcpOAuthTokens();
                span?.setAttribute("mcp.refresh_token_count", Object.keys(tokens).length);
                const refreshTokens: Record<string, string> = {};
                for (const [serverUrl, data] of Object.entries(tokens)) {
                    refreshTokens[serverUrl] = data.refreshToken;
                }
                return new GetMcpRefreshTokensResponse({ refreshTokens });
            }
            catch (error) {
                logger.error(spanCtx, "Failed to get MCP OAuth tokens", error);
                throw createInternalError("Failed to get MCP OAuth tokens", error);
            }
        });
    }
    withEnvUpdateLock<T>(fn: () => Promise<T>): Promise<T> {
        const result = this.envUpdateChain.then(fn, fn);
        this.envUpdateChain = result.then(() => undefined, () => undefined);
        return result;
    }
    async updateEnvironmentVariables(ctx: Context, request: Proto.agent_v1_UpdateEnvironmentVariablesRequest) {
        return this.withEnvUpdateLock(() => this.updateEnvironmentVariablesLocked(ctx, request));
    }
    async tearDownClaimState(ctx: Context, options: { removeGitCredentials: boolean }) {
        if (options.removeGitCredentials) {
            await this.gitService.removeGithubAccessToken();
        }
        await this.withEnvUpdateLock(async () => {
            const allSecretNames = this.managedEnvironment.snapshot()[CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR];
            if (allSecretNames === undefined) {
                return;
            }
            const keysToRemove = new Set<string>(parseCommaSeparatedNames(allSecretNames));
            keysToRemove.add(CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR);
            keysToRemove.add(CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR);
            await this.updateEnvironmentVariablesLocked(ctx, new UpdateEnvironmentVariablesRequest({ env: {} }), [...keysToRemove]);
        });
    }
    async updateEnvironmentVariablesLocked(ctx: Context, request: Proto.agent_v1_UpdateEnvironmentVariablesRequest, claimKeysToRemove?: readonly string[]) {
        return await runControlSpan(ctx, "exec_daemon.updateEnvironmentVariables", async (spanCtx, span) => {
            const envEntries = request.env;
            const replace = request.replace === true;
            const restorePreviousValues = request.restorePreviousValues === true;
            // Run-scoped overlay refcounting by holder (see runScopedOverlays).
            // Return early for the no-op references: a non-first apply or a
            // non-last release. releasedOverlayKeysToRemove is set only on the
            // last release; overlayApplyRunId only on the first apply (recorded
            // after the apply succeeds). Adding/removing holders is idempotent, so
            // a retried apply (same holder) cannot inflate the refcount and strand
            // run env on the VM.
            const overlay = request.runScopedOverlay;
            let releasedOverlayKeysToRemove: string[] | undefined;
            let overlayApplyRunId: string | undefined;
            if (overlay !== undefined) {
                const existing = this.runScopedOverlays.get(overlay.runId);
                if (overlay.release) {
                    if (existing === undefined) {
                        return new UpdateEnvironmentVariablesResponse({
                            applied: 0,
                            removed: 0,
                        });
                    }
                    existing.holders.delete(overlay.holder);
                    if (existing.holders.size > 0) {
                        return new UpdateEnvironmentVariablesResponse({
                            applied: 0,
                            removed: 0,
                        });
                    }
                    this.runScopedOverlays.delete(overlay.runId);
                    releasedOverlayKeysToRemove = [...existing.keys];
                }
                else if (existing !== undefined) {
                    existing.holders.add(overlay.holder);
                    return new UpdateEnvironmentVariablesResponse({
                        applied: 0,
                        removed: 0,
                    });
                }
                else {
                    overlayApplyRunId = overlay.runId;
                }
            }
            span?.setAttribute("env.requested_count", Object.keys(envEntries).length);
            span?.setAttribute("env.replace", replace);
            span?.setAttribute("env.restore_previous_values", restorePreviousValues);
            if (restorePreviousValues) {
                // Remember the value each updated key currently shadows so teardown
                // can restore it. This must include keys already held by a base
                // (agent/team/user) managed secret: a run-scoped overlay var that
                // shares a name otherwise permanently deletes that base secret when
                // the overlay is removed. The `has` guard keeps the earliest value
                // across repeated applies for the same key.
                for (const key of Object.keys(envEntries)) {
                    if (!this.previousManagedEnvironmentValues.has(key)) {
                        this.previousManagedEnvironmentValues.set(key, process.env[key]);
                    }
                }
            }
            // A non-replace push carries the secret-name manifest of THAT sync
            // pass only, while the secret values it delivered earlier persist
            // (replace:false never removes keys). Overwriting the manifest with a
            // smaller list would orphan previously delivered values: still set in
            // the managed environment, but no longer named by the manifest that
            // tearDownClaimState and redaction trust. Union the incoming manifest
            // with the current one so it always names every delivered key.
            // Replace-mode pushes reset the whole managed set and claim teardown
            // removes the manifest keys, so both still reset the union.
            let effectiveEnvEntries = envEntries;
            if (claimKeysToRemove === undefined &&
                releasedOverlayKeysToRemove === undefined &&
                !replace) {
                const currentManagedEnv = this.managedEnvironment.snapshot();
                for (const manifestKey of [
                    CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR,
                    CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR,
                ]) {
                    const incomingNames = envEntries[manifestKey];
                    if (incomingNames === undefined) {
                        continue;
                    }
                    const mergedNames = [
                        ...new Set<string>([
                            ...parseCommaSeparatedNames(currentManagedEnv[manifestKey]),
                            ...parseCommaSeparatedNames(incomingNames),
                        ]),
                    ].join(",");
                    if (mergedNames !== incomingNames) {
                        if (effectiveEnvEntries === envEntries) {
                            effectiveEnvEntries = { ...envEntries };
                        }
                        effectiveEnvEntries[manifestKey] = mergedNames;
                    }
                }
            }
            let update: ManagedEnvironmentUpdate;
            try {
                if (releasedOverlayKeysToRemove !== undefined) {
                    update = this.managedEnvironment.remove(releasedOverlayKeysToRemove);
                }
                else if (claimKeysToRemove !== undefined) {
                    update = this.managedEnvironment.remove(claimKeysToRemove);
                }
                else {
                    update = this.managedEnvironment.apply({
                        env: effectiveEnvEntries,
                        replace,
                    });
                }
            }
            catch (error) {
                if (error instanceof ManagedEnvironmentValidationError) {
                    throw new ConnectError(error.message, Code.InvalidArgument);
                }
                throw error;
            }
            if (overlayApplyRunId !== undefined && overlay !== undefined) {
                this.runScopedOverlays.set(overlayApplyRunId, {
                    keys: new Set<string>(Object.keys(envEntries)),
                    holders: new Set<string>([overlay.holder]),
                });
            }
            const nextSecretNamesEnv = update.removedKeys.includes(CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR)
                ? undefined
                : (update.env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR] ??
                    process.env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR]);
            // Snapshot removed redacted values before mutating process.env. Existing
            // tmux panes can keep old env vars until they are idle enough to refresh.
            this.secretRedactionState?.retainSecretsRemovedByEnvUpdate({
                env: process.env,
                nextSecretNamesEnv,
                removedKeys: update.removedKeys,
            });
            for (const key of update.removedKeys) {
                if (restorePreviousValues && this.previousManagedEnvironmentValues.has(key)) {
                    const previousValue = this.previousManagedEnvironmentValues.get(key);
                    this.previousManagedEnvironmentValues.delete(key);
                    if (previousValue === undefined) {
                        delete process.env[key];
                        this.pendingUnsets.add(key);
                        this.pendingRestores.delete(key);
                    }
                    else {
                        process.env[key] = previousValue;
                        this.pendingRestores.set(key, previousValue);
                        this.pendingUnsets.delete(key);
                    }
                }
                else {
                    delete process.env[key];
                    this.pendingUnsets.add(key);
                    this.pendingRestores.delete(key);
                }
            }
            // If a previously-removed key is being re-added, stop unsetting it.
            for (const key of Object.keys(update.env)) {
                this.pendingUnsets.delete(key);
                this.pendingRestores.delete(key);
            }
            let applied = 0;
            for (const [name, value] of Object.entries(update.env)) {
                process.env[name] = value;
                applied += 1;
            }
            // Build a restore script that re-exports managed env vars after shell state
            // snapshot restore. The shell-exec snapshot-restore mechanism captures all
            // exported env vars via `export -p` and replays them via `eval "$snap"` on
            // each command. This means env vars updated via this RPC would be overwritten
            // by stale values baked into the snapshot.
            //
            // __CURSOR_SANDBOX_ENV_RESTORE is:
            //   - filtered from state dumps (by the CURSOR_SANDBOX grep pattern in
            //     dump_bash_state.ts, dump_zsh_state.ts, dump_zsh_state_light.ts)
            //   - eval'd AFTER snapshot restore in bash.ts, zsh.ts, zsh-light.ts
            //
            // This ensures updated values override stale snapshot values. The same
            // mechanism is used by the sandbox helper (env.rs) to preserve proxy env
            // vars across snapshot restores. It is safe to reuse here because
            // exec-daemon always uses the insecure_none sandbox policy, so the sandbox
            // helper never sets this variable.
            const restoreParts: string[] = [];
            // Unset removed keys so the snapshot's declare -x doesn't resurrect them.
            // pendingUnsets persists across calls so that rapid successive replace
            // calls (e.g., user clicking "save" twice) don't lose the unset commands
            // before a shell command runs and updates the snapshot. Unsetting a
            // non-existent variable is a harmless no-op in bash.
            for (const key of this.pendingUnsets) {
                restoreParts.push(`unset ${key}`);
            }
            for (const [key, value] of this.pendingRestores) {
                const escaped = value.replace(/'/g, "'\\''");
                restoreParts.push(`builtin export ${key}='${escaped}'`);
            }
            // Re-export ALL managed env vars (not just the current request's vars), so
            // shell snapshot restore cannot silently revert values from earlier calls.
            for (const [key, value] of this.managedEnvironment.entries()) {
                const escaped = value.replace(/'/g, "'\\''");
                restoreParts.push(`builtin export ${key}='${escaped}'`);
            }
            if (restoreParts.length > 0) {
                process.env[SANDBOX_ENV_RESTORE_ENV_VAR] = restoreParts.join("; ");
            }
            else {
                delete process.env[SANDBOX_ENV_RESTORE_ENV_VAR];
            }
            this.secretRedactionState?.refreshFromEnv(process.env);
            span?.setAttribute("env.applied_count", applied);
            span?.setAttribute("env.removed_count", update.removed);
            // Log only counts, never values.
            logger.info(spanCtx, "Updated exec-daemon environment", {
                requested: Object.keys(envEntries).length,
                applied,
                removed: update.removed,
                replace,
            });
            try {
                // Dependents mirror process.env, so read the effective change back
                // from it: a restored (overlay release) key is re-set, not unset.
                const dependentEnv: Record<string, string> = {};
                const dependentRemovedKeys: string[] = [];
                for (const key of new Set<string>([...update.removedKeys, ...Object.keys(update.env)])) {
                    const value = process.env[key];
                    if (value === undefined) {
                        dependentRemovedKeys.push(key);
                    }
                    else {
                        dependentEnv[key] = value;
                    }
                }
                await this.onManagedEnvironmentUpdated?.(spanCtx, {
                    env: dependentEnv,
                    removedKeys: dependentRemovedKeys,
                });
            }
            catch {
                logger.warn(spanCtx, "Failed to refresh managed environment dependents", {
                    requested: Object.keys(envEntries).length,
                    removed: update.removed,
                    replace,
                });
            }
            return new UpdateEnvironmentVariablesResponse({
                applied,
                removed: update.removed,
            });
        });
    }
}
