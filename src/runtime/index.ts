import { createContext } from "../interop/vendor/context-core.js";
import { createLogger, loggerKey } from "../interop/vendor/context-logger.js";
import { withSpan, getSpan, reportEvent } from "../interop/vendor/context-otel.js";
import { getCommandHookPayloadTransport } from "../interop/vendor/hooks.js";
import { LocalGitExecutor } from "../interop/vendor/local-exec.js";
import { createOrbitOperationReporter } from "../interop/vendor/orbit-client.js";
import { RequestContextArgs } from "../interop/vendor/proto-agent-v1-request-context-exec-pb.js";
import { configureRipgrepPath, configureSandboxPrereqs } from "../interop/vendor/shell-exec.js";
import { getWorkloadPlacement, WORKLOAD_CGROUP_ENV_VAR } from "../interop/vendor/utils-workload-spawn.js";
import { Command, Option } from "../interop/vendor/commander.js";
import { prependExecDaemonBundleToPath, prependExecDaemonGatedToolsToPath } from "./bundledToolPath.js";
import { FuseLivenessMonitor } from "./fuseLiveness.js";
import { GitService } from "./git.js";
import { FilteredLoggerBackend } from "./logger.js";
import { MachineResourceMonitor } from "./machine-resources.js";
import { refreshGitTokenForCurrentWorkspace } from "./refresh-git-token.js";
import { writeRequestContextDiskCache, resolveRequestContextDiskCachePath } from "./request-context-disk-cache.js";
import { createServeCommand, collectUnknownServeOptions } from "./serveCommand.js";
import { startServer, startPtyHostWebSocketServer } from "./server.js";
import { AUTH_TOKEN_ENV_VAR, AUTH_TOKEN_FILE_ENV_VAR, BIND_HOST_ENV_VAR, PTY_AUTH_TOKEN_ENV_VAR, PTY_AUTH_TOKEN_FILE_ENV_VAR, PTY_BIND_HOST_ENV_VAR, resolveAuthSecret, resolveBindHost } from "./runtime-ingress.js";
import { EXEC_DAEMON_DATA_DIR_ENV_VAR, setupDaemon } from "./setup.js";
import { withStartupTraceparent } from "./startup-traceparent.js";
import { TmuxSessionManager } from "./tmux-session-manager.js";
import { initTracing, shutdownTracing } from "./tracing.js";
import { discoverExecDaemonWorkspacePaths } from "./workspace-discovery.js";
import type { Context } from "../interop/contracts/context.js";
import type { ServeOptions } from "./serveCommand.js";

export type PrebuildOptions = Pick<ServeOptions, "cloudRulesEnabled" | "mcpMetaToolEnabled" | "stripAgentSkillContent" | "mcpMetaToolSlimDescriptors" | "mcpInputSchemaJson" | "claudeMdEnabled" | "projectDir" | "rgPath" | "logLevel">;

let startup: Promise<void> | undefined;
/** The executable calls main once; repeated callers share its result and handlers. */
export function main(argv: string[] = process.argv): Promise<void> {
    return startup ??= start(argv);
}

async function start(argv: string[]): Promise<void> {

    prependExecDaemonBundleToPath();
    const execDaemonLogger = createLogger("exec-daemon");
    // CLI entry point
    // Set up the filtered logger backend early
    const filteredLoggerBackend = new FilteredLoggerBackend();
    const globalContext = createContext().with(loggerKey, filteredLoggerBackend);
    // Set up global exception handlers to prevent crashes
    process.on("uncaughtException", (error) => {
        execDaemonLogger.error(globalContext, "Uncaught exception", {
            message: error.message,
            stack: error.stack,
            name: error.name,
        });
    });
    process.on("unhandledRejection", (reason, _promise) => {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        execDaemonLogger.error(globalContext, "Unhandled promise rejection", error);
    });
    // Set up git service early so it can be used by the refresh-git-token command
    const gitService = new GitService(globalContext);
    // Define the CLI program with commander (types are automatically inferred by @commander-js/extra-typings)
    const program = new Command()
        .name("exec-daemon")
        .description("Cursor exec daemon for agent execution");
    // Subcommand: refresh-git-token
    program
        .command("refresh-git-token")
        .description("Refresh GitHub access token in git config and exit")
        .option("--verbose", "Emit token-safe step timing logs", false)
        .requiredOption("--token <token>", "GitHub access token")
        .requiredOption("--hostname <hostname>", "Git hostname (e.g., github.com, gitlab.com)")
        .option("--repo-url <repoUrl>", "Repository URL for repo-scoped git auth")
        .action(async (opts) => {
        try {
            await refreshGitTokenForCurrentWorkspace(globalContext, gitService, opts.token, opts.hostname, process.cwd(), {
                verbose: opts.verbose,
                repoUrl: opts.repoUrl,
            });
            process.exit(0);
        }
        catch (error) {
            const sanitizedError = new Error(String(error instanceof Error ? error.message : error)
                .split(opts.token)
                .join("[REDACTED_GIT_TOKEN]"));
            execDaemonLogger.error(globalContext, "Failed to refresh GitHub access token", sanitizedError);
            process.exit(1);
        }
    });
    // Subcommand: prebuild-request-context-cache
    //
    // Run once during an environment build (after repos are checked out, before the
    // snapshot) to compute the request context and write the whole thing to the
    // daemon's on-disk cache. A pod started from the resulting snapshot serves this
    // whole baked context (static rules/skills/subagents/codebase ref/cloud rule
    // plus the dynamic env, MCP, git, notes) on its cold first turn, merging only
    // live plugin content on top, instead of rescanning the whole workspace. Every
    // turn after the first bypasses the cache and recomputes live, so runtime-varying
    // fields like git status never go stale.
    program
        .command("prebuild-request-context-cache")
        .description("Compute the request context and write it to disk for snapshot reuse")
        .option("--cloud-rules-enabled", "Enable cloud rules", false)
        .option("--mcp-meta-tool-enabled", "Enable MCP meta-tool discovery", false)
        .option("--strip-agent-skill-content", "Omit AgentSkill.content from the baked request context for non-plugin skills", false)
        .option("--mcp-meta-tool-slim-descriptors", "Omit per-tool MCP descriptions/schemas from the baked request context", false)
        .option("--mcp-input-schema-json", "Carry remaining MCP schemas as flat JSON strings in the baked request context", false)
        .option("--claude-md-enabled", "Enable claude.md loading", true)
        .option("--no-claude-md-enabled", "Disable claude.md loading")
        .option("--project-dir <path>", "Overrides the project directory for the exec daemon")
        // Mirror `serve`: default to PATH-resolved "rg" (the bundled ripgrep is on
        // PATH via prependExecDaemonBundleToPath), so the static rule/skill scan works.
        .option("--rg-path <path>", "Path to ripgrep executable", "rg")
        .addOption(new Option("--log-level <level>", "Log level").choices([
        "debug",
        "info",
        "warn",
        "error",
    ]))
        .action(async (opts) => {
        filteredLoggerBackend.setMinLevel(opts.logLevel);
        configureRipgrepPath(opts.rgPath);
        try {
            await prebuildRequestContextCache(opts);
            process.exit(0);
        }
        catch (error) {
            execDaemonLogger.error(globalContext, "Failed to prebuild request-context cache", error instanceof Error ? error : new Error(String(error)));
            process.exit(1);
        }
    });
    // Subcommand: serve (default). The option surface + unknown-option tolerance
    // live in createServeCommand() so they can be unit-tested without booting the
    // daemon; the action stays here because it wires module-level singletons.
    const serveCommand = createServeCommand().action(async (opts, command) => {
        // Surface any option-looking tokens serve tolerated but did not recognize (see
        // createServeCommand's header). They are ignored so a newer launcher flag can
        // never brick an older daemon, but logging keeps a generator typo visible.
        const unknownServeOptions = collectUnknownServeOptions(command.args);
        if (unknownServeOptions.length > 0) {
            execDaemonLogger.warn(globalContext, "Ignoring unrecognized exec-daemon serve options", {
                unknownServeOptions,
            });
        }
        filteredLoggerBackend.setMinLevel(opts.logLevel);
        const httpAuth = resolveAuthSecret({
            cli: opts.authToken,
            filePath: process.env[AUTH_TOKEN_FILE_ENV_VAR],
            environment: process.env[AUTH_TOKEN_ENV_VAR],
        });
        if (httpAuth === undefined) {
            execDaemonLogger.error(globalContext, "HTTP auth token is required via --auth-token, EXEC_DAEMON_AUTH_TOKEN_FILE, or EXEC_DAEMON_AUTH_TOKEN");
            process.exit(1);
        }
        const ptyAuth = resolveAuthSecret({
            cli: opts.ptyAuthToken,
            filePath: process.env[PTY_AUTH_TOKEN_FILE_ENV_VAR],
            environment: process.env[PTY_AUTH_TOKEN_ENV_VAR],
        });
        const bindHost = resolveBindHost(opts.bindHost, process.env[BIND_HOST_ENV_VAR]);
        const ptyBindHost = resolveBindHost(opts.ptyBindHost, process.env[PTY_BIND_HOST_ENV_VAR]) ?? bindHost;
        execDaemonLogger.info(globalContext, "Listener authentication configured", {
            httpAuthSource: httpAuth.source,
            ptyAuthSource: ptyAuth?.source ?? "disabled",
            bindHost: bindHost ?? "all-interfaces",
            ptyBindHost: ptyBindHost ?? "all-interfaces",
        });
        configureRipgrepPath(opts.rgPath);
        if (opts.originCliEnabled) {
            prependExecDaemonGatedToolsToPath();
        }
        if (opts.sandboxHelperPath) {
            configureSandboxPrereqs({ sandboxBinaryPath: opts.sandboxHelperPath });
        }
        await runServer({
            ...opts,
            authToken: httpAuth.value,
            ptyAuthToken: ptyAuth?.value,
            bindHost,
            ptyBindHost,
            logLevel: opts.logLevel ?? filteredLoggerBackend.getMinLevel(),
        });
    });
    program.addCommand(serveCommand, { isDefault: true });
    await program.parseAsync(argv);
    /**
     * Compute the request context once during an environment build and persist the
     * whole thing to the daemon's on-disk cache, so a pod started from this build's
     * snapshot serves the whole baked context (static rules/skills/subagents/
     * codebase ref/cloud rule plus the dynamic env, MCP, git, notes) from disk on
     * its cold first turn instead of rescanning the workspace. Subsequent turns
     * recompute live, so the baked dynamic fields only ever back the first turn.
     *
     * Reuses `setupDaemon` so the baked data is computed by the exact same provider
     * wiring the runtime daemon uses, and disables the disk cache during this run so
     * a stale file from a prior build is never round-tripped back out.
     */
    async function prebuildRequestContextCache(opts: PrebuildOptions) {
        const ctx = globalContext;
        const workspacePath = process.cwd();
        const dataDir = process.env[EXEC_DAEMON_DATA_DIR_ENV_VAR];
        const logLevel = opts.logLevel ?? filteredLoggerBackend.getMinLevel();
        const workspaceDiscovery = await discoverExecDaemonWorkspacePaths(ctx, new LocalGitExecutor(), workspacePath);
        const result = await setupDaemon({
            globalContext: ctx,
            workspacePaths: workspaceDiscovery.workspacePaths,
            surface: "cloud",
            projectDir: opts.projectDir,
            logLevel,
            isCloudRulesEnabled: opts.cloudRulesEnabled,
            isMcpMetaToolEnabled: opts.mcpMetaToolEnabled,
            stripAgentSkillContent: opts.stripAgentSkillContent,
            isMcpMetaToolSlimDescriptors: opts.mcpMetaToolSlimDescriptors === true,
            mcpInputSchemaJson: opts.mcpInputSchemaJson === true,
            isSecretRedactionEnabled: true,
            getThirdPartyExtensibilityEnabled: () => opts.claudeMdEnabled,
            gitService,
            dataDir,
            // Always recompute from the live workspace so we bake a fresh cache, and
            // bake it plugin-free: plugins arrive per agent after the snapshot.
            disableRequestContextDiskCache: true,
            includePluginsInRequestContext: false,
        });
        const rcResult = await result.requestContextExecutor.execute(ctx, new RequestContextArgs({}));
        if (rcResult.result.case !== "success") {
            const message = rcResult.result.case === "error" ? rcResult.result.value.error : "unknown";
            throw new Error(`request-context execute failed: ${message}`);
        }
        const requestContext = rcResult.result.value.requestContext;
        if (requestContext === undefined) {
            throw new Error("request-context execute returned no requestContext");
        }
        await writeRequestContextDiskCache(ctx, resolveRequestContextDiskCachePath(dataDir), requestContext);
    }
    // Server implementation
    async function runServer(opts: Omit<ServeOptions, "logLevel" | "authToken"> & { logLevel: string; authToken: string }) {
        // Initialize tracing early, before any spans are created
        // Only enable tracing when ghost mode is disabled and trace endpoint + token are provided
        const willInitTracing = !!(opts.traceEndpoint && opts.traceAuthToken && !opts.ghostMode);
        execDaemonLogger.info(globalContext, "Tracing config check", {
            hasTraceEndpoint: !!opts.traceEndpoint,
            hasTraceAuthToken: !!opts.traceAuthToken,
            ghostMode: opts.ghostMode,
            willInitTracing,
        });
        // willInitTracing proves both optional strings are nonempty before this branch.
        if (willInitTracing) {
            execDaemonLogger.info(globalContext, "Initializing tracing...");
            initTracing({
                ctx: globalContext,
                traceEndpoint: opts.traceEndpoint!,
                authToken: opts.traceAuthToken!,
                insecure: opts.traceInsecure,
                traceAttributes: opts.traceAttributes,
            });
        }
        else {
            execDaemonLogger.info(globalContext, "Tracing NOT initialized", {
                reason: !opts.traceEndpoint
                    ? "no trace endpoint provided"
                    : !opts.traceAuthToken
                        ? "no trace auth token provided"
                        : "ghost mode is enabled",
            });
        }
        // Boot-time record of the workload cgroup placement (resolved once at
        // module load). An exported contract the daemon could not use is the
        // suspicious case, so that one logs at warn.
        const workloadPlacement = getWorkloadPlacement();
        const exportedWorkloadCgroup = process.env[WORKLOAD_CGROUP_ENV_VAR];
        const placementDegraded = workloadPlacement.kind === "direct" && exportedWorkloadCgroup !== undefined;
        const placementFields = {
            placement: workloadPlacement.kind,
            exportedWorkloadCgroup,
        };
        if (placementDegraded) {
            execDaemonLogger.warn(globalContext, "Workload cgroup placement resolved", placementFields);
        }
        else {
            execDaemonLogger.info(globalContext, "Workload cgroup placement resolved", placementFields);
        }
        const startupTraceparent = withStartupTraceparent(globalContext);
        if (startupTraceparent.status === "invalid") {
            execDaemonLogger.warn(globalContext, "Ignoring invalid exec-daemon startup traceparent");
        }
        const startupCtx = withSpan(startupTraceparent.ctx.withName("exec_daemon.startup"));
        const startupSpan = getSpan(startupCtx);
        startupSpan?.setAttribute("exec_daemon.port", opts.port);
        startupSpan?.setAttribute("exec_daemon.pty_websocket_port", opts.ptyWebsocketPort);
        startupSpan?.setAttribute("exec_daemon.ghost_mode", opts.ghostMode);
        startupSpan?.setAttribute("exec_daemon.workload_cgroup_placement", workloadPlacement.kind);
        const runStartupStep = async <T>(name: string, fn: (ctx: Context) => T | PromiseLike<T>): Promise<T> => {
            const stepCtx = withSpan(startupCtx.withName(name));
            const stepSpan = getSpan(stepCtx);
            try {
                return await fn(stepCtx);
            }
            catch (error) {
                stepSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
            finally {
                stepSpan?.end();
            }
        };
        let startupSpanEnded = false;
        const endStartupSpan = (error?: unknown) => {
            if (startupSpanEnded) {
                return;
            }
            if (error) {
                startupSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
            }
            startupSpan?.end();
            startupSpanEnded = true;
        };
        const workspacePath = process.cwd();
        const dataDir = process.env[EXEC_DAEMON_DATA_DIR_ENV_VAR];
        const workspaceDiscovery = await runStartupStep("exec_daemon.startup.discover_workspaces", async (stepCtx) => await discoverExecDaemonWorkspacePaths(stepCtx, new LocalGitExecutor(), workspacePath));
        startupSpan?.setAttribute("exec_daemon.workspace_count", workspaceDiscovery.workspacePaths.length);
        execDaemonLogger.info(startupCtx, "Discovered exec-daemon workspaces", {
            workspacePath,
            usesReposRoot: workspaceDiscovery.usesReposRoot,
            workspacePaths: workspaceDiscovery.workspacePaths,
        });
        let orbitReporter: ReturnType<typeof import("../interop/vendor/orbit-client.js").createOrbitOperationReporter> | undefined;
        if (opts.orbitdProxySocket !== undefined) {
            try {
                orbitReporter = createOrbitOperationReporter({
                    socketPath: opts.orbitdProxySocket,
                });
            }
            catch (error) {
                execDaemonLogger.warn(startupCtx, "Orbit operation reporting disabled", {
                    errorType: error instanceof Error ? error.name : typeof error,
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            }
        }
        // Set up the daemon with shared configuration
        let result: Awaited<ReturnType<typeof setupDaemon>>;
        try {
            result = await runStartupStep("exec_daemon.startup.setup_daemon", async (stepCtx) => await setupDaemon({
                globalContext: stepCtx,
                workspacePaths: workspaceDiscovery.workspacePaths,
                surface: "cloud",
                projectDir: opts.projectDir,
                logLevel: opts.logLevel,
                isBrowserEnabled: opts.browserEnabled,
                isCursorSelfControlEnabled: opts.cursorSelfControlEnabled,
                isCloudRulesEnabled: opts.cloudRulesEnabled,
                isComputerUseEnabled: opts.computerUseEnabled,
                lazyComputerUseInit: opts.computerUseLazyInit,
                computerUseApiWidth: opts.computerUseApiWidth,
                computerUseApiHeight: opts.computerUseApiHeight,
                desktopLeaseEnforce: opts.desktopLeaseEnforce,
                isSecretRedactionEnabled: true,
                isRecordScreenEnabled: opts.recordScreenEnabled,
                agentStoreConflictNoticesEnabled: opts.agentStoreConflictNotices,
                agentStoreQuotaNoticesEnabled: opts.agentStoreQuotaNotices,
                isGenerateImageEnabled: opts.generateImageEnabled,
                enableClaudeNestedHookSpecificOutputCompatibility: opts.nestedClaudeHookOutputNormalizationEnabled,
                commandHookPayloadTransport: getCommandHookPayloadTransport(opts.commandHookStdinTransportEnabled),
                isMcpMetaToolEnabled: opts.mcpMetaToolEnabled,
                exposeMcpFileSystemForSessionMcp: opts.sessionMcpEnabled,
                stripAgentSkillContent: opts.stripAgentSkillContent,
                filterModelDisabledSkills: opts.filterModelDisabledSkills,
                agentStoreSkillsDir: opts.agentStoreSkillsDir,
                isMcpMetaToolSlimDescriptors: opts.mcpMetaToolSlimDescriptors,
                mcpInputSchemaJson: opts.mcpInputSchemaJson,
                isSandboxEnabled: opts.sandboxEnabled,
                sandboxPolicyJson: opts.sandboxPolicy,
                getThirdPartyExtensibilityEnabled: () => opts.claudeMdEnabled,
                chromeExecutablePath: opts.chromeExecutablePath,
                mcpConfig: opts.mcpConfig,
                httpMcpToolsFile: opts.httpMcpToolsFile,
                gitService, // Use the same gitService instance created early
                dataDir,
                readOnlyBareMode: opts.readOnlyBareMode,
                readOnlyBareRepoPath: opts.readOnlyBareRepoPath,
                orbitOperationReporter: orbitReporter,
            }));
            reportEvent(startupCtx, "startup.setup_complete");
        }
        catch (error) {
            endStartupSpan(error);
            execDaemonLogger.error(startupCtx, "Failed to setup daemon", error);
            process.exit(1);
        }
        const { resources, remoteAccessService, ptyManager, artifactUploadManagerProvider, mcpFileSystemWriter, secretRedactionState, scopedSecretStore, reloadAgentSkills, reloadPlugins, getComputerUseSupported, desktopLeaseStore, closeMcpClients, } = result;
        const tmuxSessionManager = opts.tmuxServiceEnabled
            ? new TmuxSessionManager({
                globalContext,
                workspacePath,
                ptyManager,
                tmuxBinaryPath: opts.tmuxPath,
                tmuxConfigPath: opts.tmuxConfPath,
            })
            : undefined;
        const machineResourceMonitor = new MachineResourceMonitor({
            workspacePath,
            environment: "pod",
        });
        if (opts.machineResourcesEnabled) {
            machineResourceMonitor.start(startupCtx);
        }
        // Probe from a detached helper so a wedged mount cannot block this process.
        // The kill flag only authorizes signaling the FUSE; the monitor itself
        // always runs on Linux.
        const fuseLivenessMonitor = new FuseLivenessMonitor({
            killEnabled: opts.agentStoreFuseLivenessKill,
        });
        if (true) {
            // Reports land minutes later; do not pin them to the startup span.
            fuseLivenessMonitor.start(globalContext);
        }
        // Start the HTTP daemon server
        const stopServer = await runStartupStep("exec_daemon.startup.start_http_server", async (stepCtx) => await startServer(stepCtx, opts.port, opts.authToken, resources, gitService, remoteAccessService, artifactUploadManagerProvider, workspaceDiscovery.workspacePaths, tmuxSessionManager, secretRedactionState, scopedSecretStore, reloadAgentSkills, reloadPlugins, getComputerUseSupported, result.loadSessionMcpServers, desktopLeaseStore, machineResourceMonitor, {
            onPing: async (pingCtx) => {
                fuseLivenessMonitor.reportRelaunchReason(pingCtx);
            },
        }, opts.bindHost)).catch((error: unknown) => {
            endStartupSpan(error);
            execDaemonLogger.error(startupCtx, "Failed to start daemon", error);
            process.exit(1);
        });
        reportEvent(startupCtx, "startup.http_listening");
        // Start the PTY host WebSocket server
        const stopPtyWebSocketServer = await runStartupStep("exec_daemon.startup.start_pty_websocket_server", async (stepCtx) => await startPtyHostWebSocketServer(stepCtx, opts.ptyWebsocketPort, ptyManager, tmuxSessionManager, opts.ptyAuthToken, machineResourceMonitor, opts.ptyBindHost)).catch((error: unknown) => {
            endStartupSpan(error);
            execDaemonLogger.error(startupCtx, "Failed to start PTY WebSocket server", error);
            process.exit(1);
        });
        reportEvent(startupCtx, "startup.pty_websocket_listening");
        reportEvent(startupCtx, "startup.ready_for_ping");
        endStartupSpan();
        // Handle graceful shutdown
        const gracefulShutdown = async (signal: NodeJS.Signals) => {
            const shutdownCtx = withSpan(globalContext.withName("exec_daemon.shutdown"));
            const shutdownSpan = getSpan(shutdownCtx);
            let shutdownSpanEnded = false;
            const endShutdownSpan = () => {
                if (shutdownSpanEnded) {
                    return;
                }
                shutdownSpan?.end();
                shutdownSpanEnded = true;
            };
            shutdownSpan?.setAttribute("exec_daemon.shutdown_signal", signal);
            execDaemonLogger.info(shutdownCtx, "Received shutdown signal, stopping daemon...");
            try {
                await stopServer();
                orbitReporter?.close();
                await stopPtyWebSocketServer();
                machineResourceMonitor.stop();
                fuseLivenessMonitor.stop();
                // Dispose all PTY instances
                ptyManager.dispose();
                // Dispose MCP file system writer
                mcpFileSystemWriter?.dispose();
                await closeMcpClients();
                // Flush pending traces before exiting
                await shutdownTracing(shutdownCtx);
                endShutdownSpan();
                process.exit(0);
            }
            catch (error) {
                shutdownSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
                throw error;
            }
            finally {
                endShutdownSpan();
            }
        };
        process.on("SIGINT", () => {
            void gracefulShutdown("SIGINT");
        });
        process.on("SIGTERM", () => {
            void gracefulShutdown("SIGTERM");
        });
    }
}
