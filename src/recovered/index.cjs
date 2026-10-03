module.exports = {
/***/ "./src/index.ts"
(module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony import */ var _anysphere_context__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../context/dist/core.js");
/* harmony import */ var _anysphere_context__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("../context/dist/logger.js");
/* harmony import */ var _anysphere_context__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("../context/dist/otel.js");
/* harmony import */ var _anysphere_hooks__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("../hooks/dist/index.js");
/* harmony import */ var _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("../local-exec/dist/index.js");
/* harmony import */ var _anysphere_orbit_client__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("../orbit-client/dist/index.js");
/* harmony import */ var _anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("../proto/dist/generated/agent/v1/request_context_exec_pb.js");
/* harmony import */ var _anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("../shell-exec/dist/index.js");
/* harmony import */ var _anysphere_utils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("../utils/dist/workload-spawn.js");
/* harmony import */ var _commander_js_extra_typings__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("../../node_modules/.pnpm/@commander-js+extra-typings@14.0.0_commander@15.0.0/node_modules/@commander-js/extra-typings/esm.mjs");
/* harmony import */ var _bundledToolPath_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("./src/bundledToolPath.ts");
/* harmony import */ var _fuseLiveness_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__("./src/fuseLiveness.ts");
/* harmony import */ var _git_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__("./src/git.ts");
/* harmony import */ var _logger_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__("./src/logger.ts");
/* harmony import */ var _machine_resources_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__("./src/machine-resources.ts");
/* harmony import */ var _refresh_git_token_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__("./src/refresh-git-token.ts");
/* harmony import */ var _request_context_disk_cache_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__("./src/request-context-disk-cache.ts");
/* harmony import */ var _serveCommand_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__("./src/serveCommand.ts");
/* harmony import */ var _server_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__("./src/server.ts");
/* harmony import */ var _setup_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__("./src/setup.ts");
/* harmony import */ var _startup_traceparent_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__("./src/startup-traceparent.ts");
/* harmony import */ var _tmux_session_manager_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__("./src/tmux-session-manager.ts");
/* harmony import */ var _tracing_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__("./src/tracing.ts");
/* harmony import */ var _workspace_discovery_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__("./src/workspace-discovery.ts");
//#!/usr/bin/env node






















(0,_bundledToolPath_js__WEBPACK_IMPORTED_MODULE_10__/* .prependExecDaemonBundleToPath */ .o5)();
const execDaemonLogger = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_1__/* .createLogger */ .h)("exec-daemon");
// CLI entry point
// Set up the filtered logger backend early
const filteredLoggerBackend = new _logger_js__WEBPACK_IMPORTED_MODULE_13__/* .FilteredLoggerBackend */ .M();
const globalContext = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_0__/* .createContext */ .q6)().with(_anysphere_context__WEBPACK_IMPORTED_MODULE_1__/* .loggerKey */ ._O, filteredLoggerBackend);
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
const gitService = new _git_js__WEBPACK_IMPORTED_MODULE_12__/* .GitService */ .Y8(globalContext);
// Define the CLI program with commander (types are automatically inferred by @commander-js/extra-typings)
const program = new _commander_js_extra_typings__WEBPACK_IMPORTED_MODULE_9__/* .Command */ .uB()
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
        await (0,_refresh_git_token_js__WEBPACK_IMPORTED_MODULE_15__/* .refreshGitTokenForCurrentWorkspace */ .E)(globalContext, gitService, opts.token, opts.hostname, process.cwd(), {
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
    .addOption(new _commander_js_extra_typings__WEBPACK_IMPORTED_MODULE_9__/* .Option */ .c$("--log-level <level>", "Log level").choices([
    "debug",
    "info",
    "warn",
    "error",
]))
    .action(async (opts) => {
    filteredLoggerBackend.setMinLevel(opts.logLevel);
    (0,_anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_7__/* .configureRipgrepPath */ .J)(opts.rgPath);
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
const serveCommand = (0,_serveCommand_js__WEBPACK_IMPORTED_MODULE_17__/* .createServeCommand */ .l)().action(async (opts, command) => {
    // Surface any option-looking tokens serve tolerated but did not recognize (see
    // createServeCommand's header). They are ignored so a newer launcher flag can
    // never brick an older daemon, but logging keeps a generator typo visible.
    const unknownServeOptions = (0,_serveCommand_js__WEBPACK_IMPORTED_MODULE_17__/* .collectUnknownServeOptions */ .E)(command.args);
    if (unknownServeOptions.length > 0) {
        execDaemonLogger.warn(globalContext, "Ignoring unrecognized exec-daemon serve options", {
            unknownServeOptions,
        });
    }
    filteredLoggerBackend.setMinLevel(opts.logLevel);
    (0,_anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_7__/* .configureRipgrepPath */ .J)(opts.rgPath);
    if (opts.originCliEnabled) {
        (0,_bundledToolPath_js__WEBPACK_IMPORTED_MODULE_10__/* .prependExecDaemonGatedToolsToPath */ .W2)();
    }
    if (opts.sandboxHelperPath) {
        (0,_anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_7__/* .configureSandboxPrereqs */ .St)({ sandboxBinaryPath: opts.sandboxHelperPath });
    }
    await runServer({
        ...opts,
        logLevel: opts.logLevel ?? filteredLoggerBackend.getMinLevel(),
    });
});
program.addCommand(serveCommand, { isDefault: true });
await program.parseAsync(process.argv);
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
async function prebuildRequestContextCache(opts) {
    const ctx = globalContext;
    const workspacePath = process.cwd();
    const dataDir = process.env[_setup_js__WEBPACK_IMPORTED_MODULE_19__/* .EXEC_DAEMON_DATA_DIR_ENV_VAR */ .Sg];
    const logLevel = opts.logLevel ?? filteredLoggerBackend.getMinLevel();
    const workspaceDiscovery = await (0,_workspace_discovery_js__WEBPACK_IMPORTED_MODULE_23__/* .discoverExecDaemonWorkspacePaths */ .MH)(ctx, new _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_4__/* .LocalGitExecutor */ .xK7(), workspacePath);
    const result = await (0,_setup_js__WEBPACK_IMPORTED_MODULE_19__/* .setupDaemon */ .My)({
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
    const rcResult = await result.requestContextExecutor.execute(ctx, new _anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_6__/* .RequestContextArgs */ ._K({}));
    if (rcResult.result.case !== "success") {
        const message = rcResult.result.case === "error" ? rcResult.result.value.error : "unknown";
        throw new Error(`request-context execute failed: ${message}`);
    }
    const requestContext = rcResult.result.value.requestContext;
    if (requestContext === undefined) {
        throw new Error("request-context execute returned no requestContext");
    }
    await (0,_request_context_disk_cache_js__WEBPACK_IMPORTED_MODULE_16__/* .writeRequestContextDiskCache */ .N6)(ctx, _request_context_disk_cache_js__WEBPACK_IMPORTED_MODULE_16__/* .REQUEST_CONTEXT_DISK_CACHE_PATH */ .Tk, requestContext);
}
// Server implementation
async function runServer(opts) {
    // Initialize tracing early, before any spans are created
    // Only enable tracing when ghost mode is disabled and trace endpoint + token are provided
    const willInitTracing = !!(opts.traceEndpoint && opts.traceAuthToken && !opts.ghostMode);
    execDaemonLogger.info(globalContext, "Tracing config check", {
        hasTraceEndpoint: !!opts.traceEndpoint,
        hasTraceAuthToken: !!opts.traceAuthToken,
        ghostMode: opts.ghostMode,
        willInitTracing,
    });
    if (willInitTracing) {
        execDaemonLogger.info(globalContext, "Initializing tracing...");
        (0,_tracing_js__WEBPACK_IMPORTED_MODULE_22__/* .initTracing */ .Hu)({
            ctx: globalContext,
            traceEndpoint: opts.traceEndpoint,
            authToken: opts.traceAuthToken,
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
    const workloadPlacement = (0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_8__/* .getWorkloadPlacement */ .NG)();
    const exportedWorkloadCgroup = process.env[_anysphere_utils__WEBPACK_IMPORTED_MODULE_8__/* .WORKLOAD_CGROUP_ENV_VAR */ .ZH];
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
    const startupTraceparent = (0,_startup_traceparent_js__WEBPACK_IMPORTED_MODULE_20__/* .withStartupTraceparent */ .t1)(globalContext);
    if (startupTraceparent.status === "invalid") {
        execDaemonLogger.warn(globalContext, "Ignoring invalid exec-daemon startup traceparent");
    }
    const startupCtx = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .withSpan */ .fR)(startupTraceparent.ctx.withName("exec_daemon.startup"));
    const startupSpan = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .getSpan */ .fU)(startupCtx);
    startupSpan?.setAttribute("exec_daemon.port", opts.port);
    startupSpan?.setAttribute("exec_daemon.pty_websocket_port", opts.ptyWebsocketPort);
    startupSpan?.setAttribute("exec_daemon.ghost_mode", opts.ghostMode);
    startupSpan?.setAttribute("exec_daemon.workload_cgroup_placement", workloadPlacement.kind);
    const runStartupStep = async (name, fn) => {
        const stepCtx = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .withSpan */ .fR)(startupCtx.withName(name));
        const stepSpan = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .getSpan */ .fU)(stepCtx);
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
    const endStartupSpan = (error) => {
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
    const dataDir = process.env[_setup_js__WEBPACK_IMPORTED_MODULE_19__/* .EXEC_DAEMON_DATA_DIR_ENV_VAR */ .Sg];
    const workspaceDiscovery = await runStartupStep("exec_daemon.startup.discover_workspaces", async (stepCtx) => await (0,_workspace_discovery_js__WEBPACK_IMPORTED_MODULE_23__/* .discoverExecDaemonWorkspacePaths */ .MH)(stepCtx, new _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_4__/* .LocalGitExecutor */ .xK7(), workspacePath));
    startupSpan?.setAttribute("exec_daemon.workspace_count", workspaceDiscovery.workspacePaths.length);
    execDaemonLogger.info(startupCtx, "Discovered exec-daemon workspaces", {
        workspacePath,
        usesReposRoot: workspaceDiscovery.usesReposRoot,
        workspacePaths: workspaceDiscovery.workspacePaths,
    });
    let orbitReporter;
    if (opts.orbitdProxySocket !== undefined) {
        try {
            orbitReporter = (0,_anysphere_orbit_client__WEBPACK_IMPORTED_MODULE_5__/* .createOrbitOperationReporter */ .nz)({
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
    let result;
    try {
        result = await runStartupStep("exec_daemon.startup.setup_daemon", async (stepCtx) => await (0,_setup_js__WEBPACK_IMPORTED_MODULE_19__/* .setupDaemon */ .My)({
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
            commandHookPayloadTransport: (0,_anysphere_hooks__WEBPACK_IMPORTED_MODULE_3__/* .getCommandHookPayloadTransport */ .S6)(opts.commandHookStdinTransportEnabled),
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
        (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .reportEvent */ .HF)(startupCtx, "startup.setup_complete");
    }
    catch (error) {
        endStartupSpan(error);
        execDaemonLogger.error(startupCtx, "Failed to setup daemon", error);
        process.exit(1);
    }
    const { resources, remoteAccessService, ptyManager, artifactUploadManagerProvider, mcpFileSystemWriter, secretRedactionState, scopedSecretStore, reloadAgentSkills, reloadPlugins, getComputerUseSupported, desktopLeaseStore, closeMcpClients, } = result;
    const tmuxSessionManager = opts.tmuxServiceEnabled
        ? new _tmux_session_manager_js__WEBPACK_IMPORTED_MODULE_21__/* .TmuxSessionManager */ .a0({
            globalContext,
            workspacePath,
            ptyManager,
            tmuxBinaryPath: opts.tmuxPath,
            tmuxConfigPath: opts.tmuxConfPath,
        })
        : undefined;
    const machineResourceMonitor = new _machine_resources_js__WEBPACK_IMPORTED_MODULE_14__/* .MachineResourceMonitor */ .Up({
        workspacePath,
        environment: "pod",
    });
    if (opts.machineResourcesEnabled) {
        machineResourceMonitor.start(startupCtx);
    }
    // Probe from a detached helper so a wedged mount cannot block this process.
    // The kill flag only authorizes signaling the FUSE; the monitor itself
    // always runs on Linux.
    const fuseLivenessMonitor = new _fuseLiveness_js__WEBPACK_IMPORTED_MODULE_11__/* .FuseLivenessMonitor */ .Hj({
        killEnabled: opts.agentStoreFuseLivenessKill,
    });
    if (true) {
        // Reports land minutes later; do not pin them to the startup span.
        fuseLivenessMonitor.start(globalContext);
    }
    // Start the HTTP daemon server
    const stopServer = await runStartupStep("exec_daemon.startup.start_http_server", async (stepCtx) => await (0,_server_js__WEBPACK_IMPORTED_MODULE_18__/* .startServer */ .UD)(stepCtx, opts.port, opts.authToken, resources, gitService, remoteAccessService, artifactUploadManagerProvider, workspaceDiscovery.workspacePaths, tmuxSessionManager, secretRedactionState, scopedSecretStore, reloadAgentSkills, reloadPlugins, getComputerUseSupported, result.loadSessionMcpServers, desktopLeaseStore, machineResourceMonitor, {
        onPing: async (pingCtx) => {
            fuseLivenessMonitor.reportRelaunchReason(pingCtx);
        },
    })).catch((error) => {
        endStartupSpan(error);
        execDaemonLogger.error(startupCtx, "Failed to start daemon", error);
        process.exit(1);
    });
    (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .reportEvent */ .HF)(startupCtx, "startup.http_listening");
    // Start the PTY host WebSocket server
    const stopPtyWebSocketServer = await runStartupStep("exec_daemon.startup.start_pty_websocket_server", async (stepCtx) => await (0,_server_js__WEBPACK_IMPORTED_MODULE_18__/* .startPtyHostWebSocketServer */ .mC)(stepCtx, opts.ptyWebsocketPort, ptyManager, tmuxSessionManager, opts.ptyAuthToken, machineResourceMonitor)).catch((error) => {
        endStartupSpan(error);
        execDaemonLogger.error(startupCtx, "Failed to start PTY WebSocket server", error);
        process.exit(1);
    });
    (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .reportEvent */ .HF)(startupCtx, "startup.pty_websocket_listening");
    (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .reportEvent */ .HF)(startupCtx, "startup.ready_for_ping");
    endStartupSpan();
    // Handle graceful shutdown
    const gracefulShutdown = async (signal) => {
        const shutdownCtx = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .withSpan */ .fR)(globalContext.withName("exec_daemon.shutdown"));
        const shutdownSpan = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_2__/* .getSpan */ .fU)(shutdownCtx);
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
            await (0,_tracing_js__WEBPACK_IMPORTED_MODULE_22__/* .shutdownTracing */ .HO)(shutdownCtx);
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

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ },

};
