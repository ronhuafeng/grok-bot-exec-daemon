import nodeHttp from "node:http";
import { EXEC_CONVERSATION_ID_HEADER, execConversationIdKey, EXEC_REQUEST_ID_HEADER, execRequestIdKey, EXEC_BROWSER_OPERATION_SOURCE_HEADER, EXEC_BROWSER_OPERATION_SOURCES, execBrowserOperationSourceKey, EXEC_HOOK_CONVERSATION_ID_HEADER, execHookConversationIdKey, EXEC_HOOK_GENERATION_ID_HEADER, execHookGenerationIdKey, EXEC_HOOK_MODEL_HEADER, execHookModelKey, EXEC_HOOK_WORKSPACE_ROOTS_HEADER, execHookWorkspaceRootsKey } from "../interop/vendor/agent-exec.js";
import { createLogger, loggerKey } from "../interop/vendor/context-logger.js";
import { createContext } from "../interop/vendor/context-core.js";
import { withSpan, getSpan } from "../interop/vendor/context-otel.js";
import { TmuxSessionKind } from "../interop/vendor/proto-agent-v1-tmux-session-service-pb.js";
import { asyncMapSettledValues } from "../interop/vendor/utils-promise-extras.js";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import { connectNodeAdapter, compressionGzip } from "../interop/vendor/connect-node.js";
import { WebSocketServer } from "../interop/vendor/websocket.js";
import { connectWebSocketAdapter } from "./connect-websocket-adapter.js";
import { ControlServer } from "./control.js";
import { ExecServer } from "./exec.js";
import { PtyHostServer } from "./pty-host-server.js";
import { TmuxSessionServer } from "./tmux-session-server.js";
import { createContextExtractingService, ExecService, ControlService, TmuxSessionService, PtyHostService } from "../interop/vendor/server-private.js";
import type { Context } from "../interop/contracts/context.js";
import type { ListableResourceAccessor } from "../interop/contracts/agent-exec.js";
import type { Interceptor } from "../interop/contracts/connect.js";
import type { IncomingMessage } from "node:http";
import type { agent_v1_TmuxSessionKind, agent_v1_GetResourceUsageRequest } from "../interop/contracts/protobuf-generated.js";
import type { TmuxSessionManager, TmuxEnvironmentUpdate } from "./tmux-session-manager.js";
import type { PtyHostManagerPort } from "./pty-host-server.js";
import type { ControlServerOptions, ControlRemoteAccessService } from "./control.js";
import type { GitService } from "./git.js";
import type { ArtifactUploadManagerProvider } from "./artifactUploads.js";
import type { MachineResourceMonitor } from "./machine-resources.js";

export const logger = createLogger("exec-daemon-server");
export function parseWorkspaceRootsHeader(rawHeader: string) {
    try {
        const parsed: unknown = JSON.parse(rawHeader);
        if (!Array.isArray(parsed)) {
            return undefined;
        }
        const workspaceRoots = parsed.filter((root: unknown): root is string => typeof root === "string" && root.length > 0);
        return workspaceRoots.length > 0 ? workspaceRoots : undefined;
    }
    catch {
        return undefined;
    }
}
export function createExecRequestContext(globalContext: Context, headers: Headers) {
    let ctx = createContext().with(loggerKey, globalContext.get(loggerKey));
    const conversationId = headers.get(EXEC_CONVERSATION_ID_HEADER);
    if (conversationId) {
        ctx = ctx.with(execConversationIdKey, conversationId);
    }
    const requestId = headers.get(EXEC_REQUEST_ID_HEADER);
    if (requestId) {
        ctx = ctx.with(execRequestIdKey, requestId);
    }
    const browserOperationSource = headers.get(EXEC_BROWSER_OPERATION_SOURCE_HEADER);
    if (browserOperationSource === EXEC_BROWSER_OPERATION_SOURCES.toolCall) {
        ctx = ctx.with(execBrowserOperationSourceKey, browserOperationSource);
    }
    const hookConversationId = headers.get(EXEC_HOOK_CONVERSATION_ID_HEADER);
    if (hookConversationId) {
        ctx = ctx.with(execHookConversationIdKey, hookConversationId);
    }
    const hookGenerationId = headers.get(EXEC_HOOK_GENERATION_ID_HEADER);
    if (hookGenerationId) {
        ctx = ctx.with(execHookGenerationIdKey, hookGenerationId);
    }
    const model = headers.get(EXEC_HOOK_MODEL_HEADER);
    if (model) {
        ctx = ctx.with(execHookModelKey, model);
    }
    const workspaceRootsHeader = headers.get(EXEC_HOOK_WORKSPACE_ROOTS_HEADER);
    if (workspaceRootsHeader) {
        const workspaceRoots = parseWorkspaceRootsHeader(workspaceRootsHeader);
        if (workspaceRoots !== undefined) {
            ctx = ctx.with(execHookWorkspaceRootsKey, workspaceRoots);
        }
    }
    return ctx;
}
export function createAuthInterceptor(authToken: string): Interceptor {
    return (next) => async (req) => {
        const auth = req.header?.get?.("authorization");
        if (auth !== `Bearer ${authToken}`) {
            throw new ConnectError("Unauthorized", Code.Unauthenticated);
        }
        return await next(req);
    };
}
export function createTmuxSessionImplementation(tmuxSessionManager: TmuxSessionManager | undefined) {
    const tmuxSessionServer = tmuxSessionManager
        ? new TmuxSessionServer(tmuxSessionManager)
        : undefined;
    if (!tmuxSessionServer) {
        return undefined;
    }
    return {
        createSession: tmuxSessionServer.createSession.bind(tmuxSessionServer),
        listSessions: tmuxSessionServer.listSessions.bind(tmuxSessionServer),
        killSession: tmuxSessionServer.killSession.bind(tmuxSessionServer),
        attachSession: tmuxSessionServer.attachSession.bind(tmuxSessionServer),
    };
}
export function isManagedEnvironmentRefreshableKind(kind: agent_v1_TmuxSessionKind) {
    return kind === TmuxSessionKind.AGENT_BACKGROUND || kind === TmuxSessionKind.AGENT_INTERACTIVE;
}
export function getSafeRefreshErrorType(reason: unknown) {
    if (reason instanceof Error) {
        return reason.name;
    }
    return typeof reason;
}
export function createManagedEnvironmentUpdatedHandler(tmuxSessionManager: TmuxSessionManager) {
    return async (ctx: Context, args: TmuxEnvironmentUpdate) => {
        // Global environment first: it is what sessions created after this update
        // inherit (see refreshGlobalEnvironment).
        try {
            const globalResult = await tmuxSessionManager.refreshGlobalEnvironment(args);
            logger.info(ctx, "Refreshed tmux global environment", {
                serverRunning: globalResult.serverRunning,
                applied: globalResult.applied,
                removed: globalResult.removed,
                failed: globalResult.failed,
            });
        }
        catch (error) {
            logger.warn(ctx, "Failed to refresh tmux global environment", {
                errorType: getSafeRefreshErrorType(error),
            });
        }
        const sessions = await tmuxSessionManager.listSessions();
        const refreshableSessions = sessions.filter((session) => isManagedEnvironmentRefreshableKind(session.kind));
        const results = await asyncMapSettledValues(refreshableSessions, (session) => tmuxSessionManager.refreshSessionEnvironment({
            sessionName: session.sessionName,
            env: args.env,
            removedKeys: args.removedKeys,
            refreshPaneIfIdle: true,
        }));
        const failed = results.filter((result) => result.status === "rejected");
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === "rejected") {
                const session = refreshableSessions[i];
                logger.warn(ctx, "Failed to refresh tmux session environment", {
                    sessionName: session.sessionName,
                    failed: failed.length,
                    succeeded: results.length - failed.length,
                    total: results.length,
                    errorType: getSafeRefreshErrorType(result.reason),
                });
            }
        }
    };
}
/**
 * Create and start the exec daemon server (HTTP)
 * @param globalContext Global context for logging and tracking
 * @param port Port to listen on
 * @param authToken Authentication token for Bearer auth
 * @param resourceAccessor ListableResourceAccessor instance for accessing resources
 * @param gitService GitService instance for git operations
 * @param remoteAccessService RemoteAccessService instance for remote access operations
 * @returns Promise that resolves to a function that stops the server
 */
export async function startServer(globalContext: Context, port: number, authToken: string, resourceAccessor: ListableResourceAccessor, gitService: GitService, remoteAccessService: ControlRemoteAccessService, artifactUploadManagerProvider: ArtifactUploadManagerProvider, workspacePaths: string[], tmuxSessionManager: TmuxSessionManager | undefined, secretRedactionState: ControlServerOptions["secretRedactionState"], scopedSecretStore: ControlServerOptions["scopedSecretStore"], onReloadAgentSkills: ControlServerOptions["onReloadAgentSkills"], onReloadPlugins: ControlServerOptions["onReloadPlugins"], getComputerUseSupported: ControlServerOptions["getComputerUseSupported"], onLoadMcpServers: ControlServerOptions["onLoadMcpServers"], desktopLeaseStore: ControlServerOptions["desktopLeaseStore"], machineResourceMonitor: MachineResourceMonitor | undefined, hooks?: { onPing?: ControlServerOptions["onPing"] }, bindHost?: string) {
    const startupCtx = withSpan(globalContext.withName("exec_daemon.server.start_http"));
    const startupSpan = getSpan(startupCtx);
    startupSpan?.setAttribute("server.port", port);
    startupSpan?.setAttribute("server.tmux_enabled", tmuxSessionManager !== undefined);
    logger.debug(startupCtx, "Starting ExecDaemon server", { port });
    try {
        // Create daemon instance with the provided resource accessor
        const execServer = new ExecServer(startupCtx, resourceAccessor);
        await artifactUploadManagerProvider.initialize(startupCtx);
        const controlServer = new ControlServer(gitService, remoteAccessService, artifactUploadManagerProvider, {
            workspacePaths,
            onReloadAgentSkills,
            onReloadPlugins,
            onLoadMcpServers,
            getComputerUseSupported,
            desktopLeaseStore,
            machineResourceMonitor,
            managedEnvironment: tmuxSessionManager?.getManagedEnvironment(),
            secretRedactionState,
            scopedSecretStore,
            onManagedEnvironmentUpdated: tmuxSessionManager
                ? createManagedEnvironmentUpdatedHandler(tmuxSessionManager)
                : undefined,
            onPing: hooks?.onPing,
        });
        // Create context-aware service implementations
        const execImplementation = {
            exec: execServer.exec.bind(execServer),
            readFile: execServer.readFile,
        };
        const controlImplementation = {
            ping: controlServer.ping.bind(controlServer),
            getCapabilities: controlServer.getCapabilities.bind(controlServer),
            exec: controlServer.exec.bind(controlServer),
            listDirectory: controlServer.listDirectory.bind(controlServer),
            readTextFile: controlServer.readTextFile.bind(controlServer),
            writeTextFile: controlServer.writeTextFile.bind(controlServer),
            readBinaryFile: controlServer.readBinaryFile.bind(controlServer),
            writeBinaryFile: controlServer.writeBinaryFile.bind(controlServer),
            exportFile: controlServer.exportFile.bind(controlServer),
            getDiff: controlServer.getDiff.bind(controlServer),
            batchGetDiff: controlServer.batchGetDiff.bind(controlServer),
            getWorkspaceChangesHash: controlServer.getWorkspaceChangesHash.bind(controlServer),
            refreshGithubAccessToken: controlServer.refreshGithubAccessToken.bind(controlServer),
            warmRemoteAccessServer: controlServer.warmRemoteAccessServer.bind(controlServer),
            listArtifacts: controlServer.listArtifacts.bind(controlServer),
            uploadArtifacts: controlServer.uploadArtifacts.bind(controlServer),
            persistArtifactsToAgentStore: controlServer.persistArtifactsToAgentStore.bind(controlServer),
            persistArtifactsToParentStore: controlServer.persistArtifactsToParentStore.bind(controlServer),
            restoreArtifacts: controlServer.restoreArtifacts.bind(controlServer),
            getMcpRefreshTokens: controlServer.getMcpRefreshTokens.bind(controlServer),
            updateEnvironmentVariables: controlServer.updateEnvironmentVariables.bind(controlServer),
            syncScopedSecrets: controlServer.syncScopedSecrets.bind(controlServer),
            reloadAgentSkills: controlServer.reloadAgentSkills.bind(controlServer),
            reloadPlugins: controlServer.reloadPlugins.bind(controlServer),
            installPluginArtifact: controlServer.installPluginArtifact.bind(controlServer),
            loadMcpServers: controlServer.loadMcpServers.bind(controlServer),
            desktopLease: controlServer.desktopLease.bind(controlServer),
            getResourceUsage: controlServer.getResourceUsage.bind(controlServer),
        };
        const tmuxSessionImplementation = createTmuxSessionImplementation(tmuxSessionManager);
        // Wrap the implementations to automatically extract context from incoming requests
        const wrappedExecImplementation = createContextExtractingService(execImplementation, {
            extractTraceHeaders: true, // Enable automatic trace context extraction
            extractContext: (headers, _handlerContext) => {
                return createExecRequestContext(startupCtx, headers);
            },
        });
        const wrappedControlImplementation = createContextExtractingService(controlImplementation, {
            extractTraceHeaders: true, // Enable automatic trace context extraction
            extractContext: (headers, _handlerContext) => {
                return createExecRequestContext(startupCtx, headers);
            },
        });
        const wrappedTmuxSessionImplementation = tmuxSessionImplementation
            ? createContextExtractingService(tmuxSessionImplementation, {
                extractTraceHeaders: true,
                extractContext: (_headers, _handlerContext) => {
                    return createContext().with(loggerKey, startupCtx.get(loggerKey));
                },
            })
            : undefined;
        const handler = connectNodeAdapter({
            routes: (router) => {
                router.service(ExecService, wrappedExecImplementation);
                router.service(ControlService, wrappedControlImplementation);
                if (wrappedTmuxSessionImplementation) {
                    router.service(TmuxSessionService, wrappedTmuxSessionImplementation);
                }
            },
            acceptCompression: [compressionGzip],
            requireConnectProtocolHeader: false, // Allow Connect without protocol header
            interceptors: [createAuthInterceptor(authToken)],
        });
        // Create HTTP server
        const server = nodeHttp.createServer(handler);
        // Start listening
        await new Promise<void>((resolve, reject) => {
            const onListen = (err?: Error) => {
                if (err) reject(err);
                else {
                    logger.info(startupCtx, "ExecDaemon server listening", { port, bindHost: bindHost ?? "all-interfaces" });
                    resolve();
                }
            };
            if (bindHost === undefined) server.listen(port, onListen);
            else server.listen(port, bindHost, onListen);
        });
        startupSpan?.end();
        // Return closure to stop the server
        return async () => {
            logger.debug(globalContext, "Stopping ExecDaemon server", { port });
            await new Promise<void>((resolve) => {
                server.close(() => {
                    logger.debug(globalContext, "ExecDaemon server stopped", { port });
                    resolve();
                });
            });
        };
    }
    catch (error) {
        startupSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
        startupSpan?.end();
        throw error;
    }
}
/**
 * Create and start the PTY host WebSocket server
 *
 * @param globalContext Global context for logging and tracking
 * @param port Port to listen on for WebSocket connections
 * @param ptyManager PtyManager instance for managing PTY instances
 * @param machineResourceMonitor When set, also serves
 *   ControlService.GetResourceUsage so a renderer can poll it over the same
 *   WebSocket the Terminal tab uses (no CORS preflight against cursorvm.com)
 * @returns Promise that resolves to a function that stops the server
 */
export async function startPtyHostWebSocketServer(globalContext: Context, port: number, ptyManager: PtyHostManagerPort, tmuxSessionManager: TmuxSessionManager | undefined, ptyAuthToken: string | undefined, machineResourceMonitor: MachineResourceMonitor | undefined, bindHost?: string) {
    const startupCtx = withSpan(globalContext.withName("exec_daemon.server.start_pty_ws"));
    const startupSpan = getSpan(startupCtx);
    startupSpan?.setAttribute("server.port", port);
    startupSpan?.setAttribute("server.tmux_enabled", tmuxSessionManager !== undefined);
    logger.debug(startupCtx, "Starting PtyHost WebSocket server", { port });
    try {
        // Create PTY host server
        const ptyHostServer = new PtyHostServer(ptyManager);
        // Create context-aware service implementation for PtyHostService
        const ptyHostImplementation = {
            spawnPty: ptyHostServer.spawnPty.bind(ptyHostServer),
            attachPty: ptyHostServer.attachPty.bind(ptyHostServer),
            sendInput: ptyHostServer.sendInput.bind(ptyHostServer),
            resizePty: ptyHostServer.resizePty.bind(ptyHostServer),
            listPtys: ptyHostServer.listPtys.bind(ptyHostServer),
            terminatePty: ptyHostServer.terminatePty.bind(ptyHostServer),
        };
        const tmuxSessionImplementation = createTmuxSessionImplementation(tmuxSessionManager);
        const wrappedPtyHostImplementation = createContextExtractingService(ptyHostImplementation, {
            extractTraceHeaders: true,
            extractContext: (_headers, _handlerContext) => {
                return createContext().with(loggerKey, startupCtx.get(loggerKey));
            },
        });
        const wrappedTmuxSessionImplementation = tmuxSessionImplementation
            ? createContextExtractingService(tmuxSessionImplementation, {
                extractTraceHeaders: true,
                extractContext: (_headers, _handlerContext) => {
                    return createContext().with(loggerKey, startupCtx.get(loggerKey));
                },
            })
            : undefined;
        const wrappedMachineResourcesImplementation = machineResourceMonitor
            ? createContextExtractingService({
                getResourceUsage: async (_ctx: Context, request: agent_v1_GetResourceUsageRequest) => machineResourceMonitor.handleGetResourceUsage(request),
            }, {
                extractTraceHeaders: true,
                extractContext: (_headers, _handlerContext) => {
                    return createContext().with(loggerKey, startupCtx.get(loggerKey));
                },
            })
            : undefined;
        // Create WebSocket server
        const wss = new WebSocketServer(bindHost === undefined ? { port } : { port, host: bindHost });
        // Apply the ConnectRPC WebSocket adapter
        connectWebSocketAdapter(wss, {
            routes: (router) => {
                router.service(PtyHostService, wrappedPtyHostImplementation);
                if (wrappedTmuxSessionImplementation) {
                    router.service(TmuxSessionService, wrappedTmuxSessionImplementation);
                }
                if (wrappedMachineResourcesImplementation) {
                    router.service(ControlService, wrappedMachineResourcesImplementation);
                }
            },
            requireConnectProtocolHeader: false,
            interceptors: ptyAuthToken === undefined ? undefined : [createAuthInterceptor(ptyAuthToken)],
            authenticate: ptyAuthToken === undefined ? undefined : createPtyAuthGuard(ptyAuthToken),
        });
        logger.info(startupCtx, "PtyHost WebSocket server listening", { port });
        startupSpan?.end();
        // Return closure to stop the server
        return async () => {
            logger.debug(globalContext, "Stopping PtyHost WebSocket server", {
                port,
            });
            await new Promise<void>((resolve, reject) => {
                wss.close((err) => {
                    if (err) {
                        logger.error(globalContext, "Error stopping PtyHost WebSocket server", { error: err });
                        reject(err);
                    }
                    else {
                        logger.debug(globalContext, "PtyHost WebSocket server stopped", {
                            port,
                        });
                        resolve();
                    }
                });
            });
        };
    }
    catch (error) {
        startupSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
        startupSpan?.end();
        throw error;
    }
}
export function createPtyAuthGuard(ptyAuthToken: string) {
    return (request: IncomingMessage) => {
        const authHeader = request.headers.authorization;
        if (matchesExpectedBearerToken(authHeader, ptyAuthToken)) {
            return true;
        }
        // Browsers cannot set custom headers on WebSocket upgrade requests.
        // Accept the token query param for browser clients while still requiring
        // per-RPC authorization headers via Connect interceptors above.
        const requestUrl = request.url;
        if (typeof requestUrl !== "string") {
            return false;
        }
        try {
            const parsedUrl = new URL(requestUrl, "ws://localhost");
            const tokenParam = parsedUrl.searchParams.get("token");
            return tokenParam === ptyAuthToken;
        }
        catch {
            return false;
        }
    };
}
export function matchesExpectedBearerToken(authHeader: string | readonly string[] | undefined, expectedToken: string) {
    if (typeof authHeader === "string") {
        return authHeader === `Bearer ${expectedToken}`;
    }
    if (Array.isArray(authHeader) && authHeader.length === 1) {
        return authHeader[0] === `Bearer ${expectedToken}`;
    }
    return false;
}
