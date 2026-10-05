// Preserve native PTY initialization before shared recording-module probes.
import { PtyManager } from "./pty-manager.js";
import { createHttpMcpLeaseFromJson, resolveSandboxPolicyFromJson } from "./configuration.js";
import nodeChildProcess from "node:child_process";
import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodeOs from "node:os";
import nodePath from "node:path";
import { buildNamedMcpToolDefinitionFromFileContent, shouldIncludeAgentSkillInRequestContext, stripAgentSkillContentForRequestContext, grepExecutorResource, redactedReadExecutorResource, mcpExecutorResource, readMcpResourceExecutorResource, execHookConversationIdKey, execHookGenerationIdKey, execHookModelKey } from "../interop/vendor/agent-exec.js";
import { createLogger, loggerKey } from "../interop/vendor/context-logger.js";
import { withSpan, getSpan } from "../interop/vendor/context-otel.js";
import { asyncMapSettledValues } from "../interop/vendor/utils-promise-extras.js";
import { LOGS_DIR, RECORDING_STAGING_DIR, LocalGitExecutor, FileChangeTracker, LazyIgnoreService, NestedExtensibilityService, LocalCursorRulesService, AgentSkillsCursorRulesService, CursorPluginsAgentSkillsService, MergedCursorRulesService, MergedAgentSkillsService, MergedCloudRulesService, LocalCloudRulesService, CursorPluginsSubagentsService, LocalSubagentsService, MergedSubagentsService, StaticMcpLease, CombinedMcpLease, McpFileSystemWriter as McpFileSystemWriterDependency, getDisplay, DesktopLeaseStore, ObservableMcpStateAccessor, LocalRequestContextExecutor, buildLegacyMcpRequestContextFields, buildMcpMetaToolOptions, AgentStoreConflictJournalDrainer, LocalResourceProvider, gateComputerUseExecutor, AgentStoreConflictDrainAccessor } from "../interop/vendor/local-exec.js";
import { mcpConfigSchema, expandMcpConfigForCloudRuntime, McpManager, loadServer, getMcpStdioStderrTail, ManagerMcpLease } from "../interop/vendor/mcp-agent-exec.js";
import { RedactingShellCoreExecutor, RedactingResourceAccessor } from "../interop/vendor/secrets-exec.js";
import { isAllowAllNetworkByPolicy, networkAllowAllPolicy, mergeNetworkPolicies, mergePathsUnion, getRipgrepBinaryPath, isSandboxSupported, parseSandboxPolicyJson, resolvePolicyPaths, createDefaultTerminalExecutor, createNaiveTerminalExecutor } from "../interop/vendor/shell-exec.js";
import { findActualExecutable } from "../interop/vendor/utils-find-executable.js";
import { spawnWorkload } from "../interop/vendor/utils-workload-spawn.js";
import { resolveAgentStoreSkillRoots, createAgentStoreSkillsMountLatch } from "./agent-store-skills.js";
import { resolveArtifactsRootPath, ArtifactUploadManagerProvider } from "./artifactUploads.js";
import { setupExecDaemonCanvasDiagnostics } from "./canvasDiagnostics.js";
import { resolveCanvasPreviewPersistArtifactsRoot } from "./canvasPreviewPersistRoot.js";
import { CloudPluginsService } from "./cloud-plugins-service.js";
import { buildExecDaemonComputerUseExecutor, computerUseExecutorHasInputEventLogger } from "./computerUseExecutorSetup.js";
import { withDeduplicatedAgentSkillRules, removeDuplicatedAgentSkillRules } from "./dedupe-agent-skill-rules.js";
import { GitService } from "./git.js";
import { resolveExecDaemonGlobalHookContext } from "./global-hook-context.js";
import { LazyMcpClient } from "./lazy-mcp-client.js";
import { safeJsonStringify } from "./logger.js";
import { SecretRedactionState, refreshCachedGitAuthTokens } from "./secretRedaction.js";
import { createCloudMcpInjectedSecretAccessor, withInheritedExecDaemonEnv, expandCloudMcpStdioServerEnvOnly } from "./mcp-cloud-env.js";
import { createEphemeralScopedTokenStorage } from "./mcp-token-storage.js";
import { withOrbitOperationReporting } from "./orbit/operation-reporting.js";
import { createReadOnlyVmDaemonBareRequestContextExecutor } from "./read-only-bare/request-context.js";
import { ExecDaemonPolishedRecordingRenderer } from "./recording-renderer.js";
import { RemoteAccessService } from "./remoteAccess.js";
import { DiskBackedRequestContextExecutor, readRequestContextDiskCache, resolveRequestContextDiskCachePath } from "./request-context-disk-cache.js";
import { ScopedSecretStore, ScopedSecretsShellCoreExecutor } from "./scoped-secrets.js";
import { withShellOomKillReporting } from "./shell-oom-kill.js";
import { registerExecDaemonWebpCodec } from "./webp-codec-startup.js";
import { hasAnyHooks, HooksConfigLoader, getProjectDir, getHooksConfigPaths, getCloudManagedTeamHooksPath, NodeFileReader, MutableHooksConfigLeaseImpl, CliHooksExecutor, ListableHooksResourceAccessor } from "../interop/vendor/setup-private.js";
import type { ExecFileSyncOptionsWithStringEncoding } from "node:child_process";
import type { Context } from "../interop/contracts/context.js";
import type { BuiltinComputerUseExecutor } from "../interop/contracts/computer-use.js";
import type { McpConfig, McpServerConfig } from "../interop/contracts/mcp.js";
import type { McpLease, McpFileSystemWriter, OAuthTokens, OAuthClientInformation } from "../interop/contracts/mcp-services.js";
import type { RequestContextOptions, RequestContextExecutor } from "../interop/contracts/request-context.js";
import type { agent_v1_AgentSkill } from "../interop/contracts/protobuf-generated.js";
import type { JsonValue } from "../interop/contracts/protobuf-runtime.js";
import type { SandboxPolicy } from "../interop/contracts/shell.js";
import type { HooksConfig, LoadedHooksConfig } from "../interop/contracts/hooks.js";
import type { ArtifactUploadManagerProviderOptions } from "./artifactUploads.js";

type LocalResourceOptions = ConstructorParameters<typeof import("../interop/vendor/local-exec.js").LocalResourceProvider>[0];
type HookExecutorOptions = NonNullable<ConstructorParameters<typeof import("../interop/vendor/setup-private.js").CliHooksExecutor>[7]>;
export interface SetupDaemonOptions {
    globalContext: Context;
    workspacePaths: string[];
    logLevel: string;
    isBrowserEnabled?: boolean;
    isCursorSelfControlEnabled?: boolean;
    isCloudRulesEnabled?: boolean;
    isComputerUseEnabled?: boolean;
    lazyComputerUseInit?: boolean;
    computerUseApiWidth?: number;
    computerUseApiHeight?: number;
    desktopLeaseEnforce?: boolean;
    isSecretRedactionEnabled?: boolean;
    isRecordScreenEnabled?: boolean;
    agentStoreConflictNoticesEnabled?: boolean;
    agentStoreQuotaNoticesEnabled?: boolean;
    isGenerateImageEnabled?: boolean;
    isMcpMetaToolEnabled?: boolean;
    stripAgentSkillContent?: boolean;
    filterModelDisabledSkills?: boolean;
    agentStoreSkillsDir?: string | readonly string[];
    getDynamicAgentStoreSkillRoots?: () => readonly string[];
    isMcpMetaToolSlimDescriptors?: boolean;
    mcpInputSchemaJson?: boolean;
    isSandboxEnabled?: boolean;
    sandboxPolicyJson?: string;
    getThirdPartyExtensibilityEnabled?: () => boolean;
    chromeExecutablePath?: string;
    mcpConfig?: string;
    httpMcpToolsFile?: string;
    gitService?: InstanceType<typeof import("./git.js").GitService>;
    surface?: ConstructorParameters<typeof import("../interop/vendor/local-exec.js").AgentSkillsCursorRulesService>[8];
    dataDir?: string;
    projectDir?: string;
    readOnlyBareMode?: boolean;
    readOnlyBareRepoPath?: string;
    disableRequestContextDiskCache?: boolean;
    includePluginsInRequestContext?: boolean;
    exposeMcpFileSystemForSessionMcp?: boolean;
    artifactRootResolver?: ArtifactUploadManagerProviderOptions["resolveRoot"];
    orbitOperationReporter?: ReturnType<typeof import("../interop/vendor/orbit-client.js").createOrbitOperationReporter>;
    recordScreenArtifactsDir?: string;
    recordScreenDisplay?: string;
    shellExtraEnvProvider?: LocalResourceOptions["shellExtraEnvProvider"];
    getMountedAgentStores?: LocalResourceOptions["getMountedAgentStores"];
    userEmail?: string;
    promptHookClient?: ConstructorParameters<typeof import("../interop/vendor/setup-private.js").CliHooksExecutor>[4];
    enableClaudeNestedHookSpecificOutputCompatibility?: HookExecutorOptions["enableClaudeNestedHookSpecificOutputCompatibility"];
    commandHookPayloadTransport?: HookExecutorOptions["commandHookPayloadTransport"];
    runtimeHooks?: HookExecutorOptions["runtimeHooks"];
}
export interface SessionMcpLoadOptions { initialize?: boolean; removeMissing?: boolean; }

/**
 * Shared setup logic for exec-daemon that can be used by both the standalone daemon
 * and bridge mode in agent-cli
 */
export const execDaemonLogger = createLogger("exec-daemon");
// Pins the string-encoding overload so output stays a string through spawnWorkload.
export const execFileSyncUtf8: (file: string, args: readonly string[], options: ExecFileSyncOptionsWithStringEncoding) => string = nodeChildProcess.execFileSync;
export const EXEC_DAEMON_DATA_DIR_ENV_VAR = "CURSOR_EXEC_DAEMON_DATA_DIR";
// Hard upper bound on a single `loadServer` + `getTools` call for a
// session-scoped stdio MCP server. Covers both the SDK's own 60s per-RPC
// timeout (initialize + listTools) plus a small margin for spawn / stderr
// drain so a truly stuck child process (hung OAuth, wedged npx download,
// etc.) is surfaced as an error instead of pinning the per-server entry in
// `inFlightSessionMcpLoads` for the life of the daemon.
export const SESSION_MCP_LOAD_TIMEOUT_MS = 90000;

/**
 * Checks if a command exists and is executable.
 * Uses findActualExecutable which handles PATH search and Windows extension
 * resolution (.exe, .cmd, .bat) cross-platform.
 */
export function validateExecutable(command: string, ctx: Context) {
    const resolved = findActualExecutable(command, []);
    const resolvedPath = resolved.cmd;
    try {
        const mode = false ? 0 : nodeFs.constants.X_OK;
        nodeFs.accessSync(resolvedPath, mode);
    }
    catch {
        const msg = `Binary not found: '${command}' is not a valid executable or not in PATH`;
        execDaemonLogger.error(ctx, msg);
        process.stderr.write(`${msg}\n`);
        process.exit(1);
    }
}
export function resolveExecutablePath(command: string) {
    try {
        const executablePath = spawnWorkload(execFileSyncUtf8, "which", [command], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 500,
        }).trim();
        return executablePath.length > 0 ? executablePath : undefined;
    }
    catch {
        return undefined;
    }
}
export function shouldUseWorldWritableDirs(dir: string) {
    const resolved = nodePath.resolve(dir);
    const optCursorRoot = nodePath.resolve("/opt/cursor");
    return resolved === optCursorRoot || resolved.startsWith(`${optCursorRoot}${(nodePath).sep}`);
}
export function summarizeUnknownError(error: unknown) {
    if (error instanceof Error) {
        return {
            errorForLogger: error,
            metadata: {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                errorCause: error.cause === undefined
                    ? undefined
                    : error.cause instanceof Error
                        ? `${error.cause.name}: ${error.cause.message}`
                        : safeJsonStringify(error.cause),
            },
        };
    }
    return {
        metadata: {
            errorType: typeof error,
            errorValue: safeJsonStringify(error),
        },
    };
}
export function hashSensitiveLogValue(value: string) {
    return nodeCrypto.createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}
export function getMcpServerLogMetadata(serverConfig: McpServerConfig) {
    if ("command" in serverConfig) {
        return {
            transport: "stdio",
            commandHash: hashSensitiveLogValue(serverConfig.command),
            cwdHash: serverConfig.cwd === undefined ? undefined : hashSensitiveLogValue(serverConfig.cwd),
            envKeys: Object.keys(serverConfig.env ?? {}),
        };
    }
    return {
        transport: "http",
        urlHash: hashSensitiveLogValue(serverConfig.url),
        headerKeys: Object.keys(serverConfig.headers ?? {}),
        hasAuth: serverConfig.auth !== undefined,
    };
}
export function countConfiguredHooks(hookConfig: HooksConfig | undefined) {
    return Object.values(hookConfig?.hooks ?? {}).reduce((total, hooksForStep) => total + hooksForStep.length, 0);
}
export function summarizeHooksConfigForLogging(hooksConfig: LoadedHooksConfig) {
    return {
        hasAnyHooks: hasAnyHooks(hooksConfig),
        configuredSteps: [...HooksConfigLoader.getConfiguredSteps(hooksConfig)].sort(),
        errorCount: hooksConfig.errors.length,
        errorSources: [
            ...new Set(hooksConfig.errors.map((error) => {
                switch (error.source) {
                    case "claude-user":
                        return "thirdParty-user";
                    case "claude-project":
                        return "thirdParty-project";
                    case "claude-project-local":
                        return "thirdParty-project-local";
                    default:
                        return error.source;
                }
            })),
        ],
        hookCountsBySource: {
            enterprise: countConfiguredHooks(hooksConfig.enterpriseHooks),
            team: countConfiguredHooks(hooksConfig.teamHooks),
            user: countConfiguredHooks(hooksConfig.userHooks),
            project: countConfiguredHooks(hooksConfig.projectHooks),
            thirdPartyUser: countConfiguredHooks(hooksConfig.claudeUserHooks),
            thirdPartyProject: countConfiguredHooks(hooksConfig.claudeProjectHooks),
            thirdPartyProjectLocal: countConfiguredHooks(hooksConfig.claudeProjectLocalHooks),
        },
    };
}
export function ensureDirWithDataDirPolicy(params: { dir: string; globalContext: Context; successLogMessage: string; failureLogMessage: string; mode: number }) {
    const { dir, globalContext, successLogMessage, failureLogMessage, mode } = params;
    try {
        nodeFs.mkdirSync(dir, { recursive: true, mode });
        nodeFs.chmodSync(dir, mode);
        execDaemonLogger.info(globalContext, successLogMessage);
    }
    catch (mkdirError) {
        execDaemonLogger.error(globalContext, failureLogMessage, {
            error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
        });
    }
}
export async function runSetupStepSpan<T>(ctx: Context, name: string, fn: (ctx: Context) => T | PromiseLike<T>): Promise<T> {
    const spanCtx = withSpan(ctx.withName(name));
    const span = getSpan(spanCtx);
    try {
        return await fn(spanCtx);
    }
    catch (error) {
        span?.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span?.end();
    }
}
export class MockDiagnosticsProvider {
    async open(_ctx: Context, _uri: unknown) {
        // No-op for mock
    }
    async getDiagnostics(_ctx: Context, _uri: unknown) {
        return [];
    }
}
export class MockCodebaseReferenceProvider {
    async getCodebaseReference() {
        return undefined; // No codebase reference in daemon mode
    }
}
export class MockDecisionProvider {
    async requestApproval() {
        return { approved: true }; // Always approve for daemon mode
    }
}
/**
 * Simple token storage for daemon mode - doesn't persist tokens
 */
export class NoOpTokenStorage {
    async loadTokens(_identifier: string) {
        return undefined; // No OAuth tokens in daemon mode
    }
    async saveTokens(_identifier: string, _tokens: OAuthTokens) {
        // No-op in daemon mode
    }
    async loadClientInformation(_identifier: string) {
        return undefined; // No OAuth client info in daemon mode
    }
    async saveClientInformation(_identifier: string, _clientInfo: OAuthClientInformation) {
        // No-op in daemon mode
    }
    async clearTokens(_identifier: string) {
        // No-op in daemon mode
    }
}
export class DaemonPermissionsService {
    _defaultPolicy: SandboxPolicy;
    constructor(defaultPolicy?: SandboxPolicy) {
        this._defaultPolicy = defaultPolicy ?? { type: "insecure_none" };
    }
    shouldBlockRead(_filePath: string): Promise<false> {
        return Promise.resolve(false);
    }
    shouldBlockWrite(_ctx: Context, _filePath: string, _newContents: string): Promise<false> {
        return Promise.resolve(false);
    }
    shouldBlockShellCommand(_ctx: Context, _command: string, _options: unknown, requestedPolicy?: SandboxPolicy): Promise<{ kind: "allow"; policy: SandboxPolicy }> {
        const effective = requestedPolicy ?? this._defaultPolicy;
        const merged = this._mergeWithDefault(effective);
        return Promise.resolve({ kind: "allow", policy: merged });
    }
    isShellCommandFullyAllowlisted(_ctx: Context, _command: string, _options: unknown) {
        return Promise.resolve(false);
    }
    isMcpFullyAllowlisted(_ctx: Context, _options: unknown) {
        return Promise.resolve(false);
    }
    isWebFetchFullyAllowlisted(_ctx: Context, _options: unknown) {
        return Promise.resolve(false);
    }
    shouldEnforceShellInvariantBlocks(_ctx: Context, _options: unknown, _requestedPolicy?: SandboxPolicy): Promise<{ kind: "allow" }> {
        return Promise.resolve({ kind: "allow" });
    }
    _mergeWithDefault(requested: SandboxPolicy): SandboxPolicy {
        if (requested.type === "insecure_none" || this._defaultPolicy.type === "insecure_none") {
            return requested;
        }
        const mergedNetwork = isAllowAllNetworkByPolicy(requested.networkPolicy)
            ? networkAllowAllPolicy()
            : mergeNetworkPolicies(this._defaultPolicy.networkPolicy, requested.networkPolicy);
        const mergedReadonlyPaths = mergePathsUnion(this._defaultPolicy.additionalReadonlyPaths, requested.additionalReadonlyPaths);
        if (requested.type === "workspace_readwrite" &&
            this._defaultPolicy.type === "workspace_readwrite") {
            const mergedReadwritePaths = mergePathsUnion(this._defaultPolicy.additionalReadwritePaths, requested.additionalReadwritePaths);
            return {
                ...requested,
                additionalReadonlyPaths: mergedReadonlyPaths.length > 0 ? mergedReadonlyPaths : undefined,
                additionalReadwritePaths: mergedReadwritePaths.length > 0 ? mergedReadwritePaths : undefined,
                networkPolicy: mergedNetwork,
            };
        }
        return {
            ...requested,
            additionalReadonlyPaths: mergedReadonlyPaths.length > 0 ? mergedReadonlyPaths : undefined,
            networkPolicy: mergedNetwork,
        };
    }
    shouldBlockMcp(_ctx: Context, _args: unknown): Promise<false> {
        return Promise.resolve(false);
    }
    addToAllowList(_ctx: Context, _kind: unknown, _value: unknown) {
        return Promise.resolve();
    }
    addToDenyList(_ctx: Context, _kind: unknown, _value: unknown) {
        return Promise.resolve();
    }
}
/**
 * Set up all the required dependencies for exec-daemon
 */
export async function setupDaemon(options: SetupDaemonOptions) {
    const { globalContext, workspacePaths, logLevel, isBrowserEnabled = false, isCursorSelfControlEnabled = false, isCloudRulesEnabled = false, isComputerUseEnabled = false, lazyComputerUseInit = false, computerUseApiWidth, computerUseApiHeight, desktopLeaseEnforce = false, isSecretRedactionEnabled = false, isRecordScreenEnabled = false, agentStoreConflictNoticesEnabled = false, agentStoreQuotaNoticesEnabled = false, isGenerateImageEnabled = false, isMcpMetaToolEnabled = true, stripAgentSkillContent = false, filterModelDisabledSkills = false, agentStoreSkillsDir, getDynamicAgentStoreSkillRoots, isMcpMetaToolSlimDescriptors = false, mcpInputSchemaJson = false, isSandboxEnabled = false, sandboxPolicyJson, 
    // Ideally this should sync based on the user's settings
    getThirdPartyExtensibilityEnabled = () => true, chromeExecutablePath, mcpConfig: mcpConfigJson, httpMcpToolsFile, gitService: providedGitService, surface = "cloud", dataDir, projectDir, readOnlyBareMode: readOnlyBareModeOption = false, readOnlyBareRepoPath: readOnlyBareRepoPathOption = "/workspace/readonly-pod-bare.git", disableRequestContextDiskCache = false, includePluginsInRequestContext = true, exposeMcpFileSystemForSessionMcp = false, } = options;
    const workspacePath = workspacePaths[0];
    if (workspacePath === undefined) {
        throw new Error("setupDaemon requires at least one workspace path");
    }
    const resolvedDataDir = dataDir ?? process.env[EXEC_DAEMON_DATA_DIR_ENV_VAR];
    const resolvedLogsDir = resolvedDataDir ? nodePath.join(resolvedDataDir, "logs") : LOGS_DIR;
    const resolvedArtifactsDir = resolveArtifactsRootPath(resolvedDataDir);
    const artifactRootResolver: ArtifactUploadManagerProviderOptions["resolveRoot"] = options.artifactRootResolver ??
        (() => ({
            artifactsRootPath: resolvedArtifactsDir,
            rootKind: "local",
        }));
    const artifactUploadManagerProvider = new ArtifactUploadManagerProvider({
        resolveRoot: artifactRootResolver,
        detectAgentStoreBackedAlias: options.artifactRootResolver === undefined && resolvedDataDir === undefined,
    });
    const getArtifactsFolder = (ctx: Context) => artifactRootResolver(ctx).artifactsRootPath;
    const resolvedRecordingStagingDir = resolvedDataDir
        ? nodePath.join(resolvedDataDir, "recording-staging")
        : RECORDING_STAGING_DIR;
    const cloudMcpSecretAccessor = createCloudMcpInjectedSecretAccessor({
        secretAccessor: (name) => process.env[name],
    });
    const dirCreateMode = shouldUseWorldWritableDirs(resolvedDataDir ?? resolvedLogsDir)
        ? 0o777
        : 0o700;
    // Set up git service (use provided or create new), remote access service, and pty manager
    const gitService = providedGitService ?? new GitService(globalContext);
    const remoteAccessService = new RemoteAccessService();
    const ptyManager = new PtyManager(globalContext);
    // Parse MCP config from option (non-encrypted, so passed via CLI)
    let mcpConfig: McpConfig | undefined;
    await runSetupStepSpan(globalContext, "exec_daemon.setup.parse_mcp_config", async (spanCtx) => {
        if (mcpConfigJson) {
            try {
                const parsed: JsonValue = JSON.parse(mcpConfigJson);
                // Object.keys throws on JSON null before schema parsing; the assertion
                // models only this existing throwing operation, not a config schema.
                if (Object.keys(parsed!).length > 0) {
                    const parsedConfig = mcpConfigSchema.parse(parsed);
                    mcpConfig = expandMcpConfigForCloudRuntime(parsedConfig, () => undefined);
                }
            }
            catch (error) {
                execDaemonLogger.error(spanCtx, "Failed to parse MCP config", error);
            }
        }
    });
    const mcpConfigSummary = {
        hasMcpConfig: mcpConfig !== undefined,
        serverNames: Object.keys(mcpConfig?.mcpServers ?? {}),
        stdioServerCount: Object.values(mcpConfig?.mcpServers ?? {}).filter((config) => "command" in config).length,
        httpServerCount: Object.values(mcpConfig?.mcpServers ?? {}).filter((config) => "url" in config)
            .length,
    };
    // Keep a stable metadata directory for transcripts and other daemon state.
    const resolvedProjectDir = projectDir ?? getProjectDir(workspacePath);
    execDaemonLogger.info(globalContext, "Starting exec-daemon", {
        logLevel,
        workspacePath,
        projectDir: resolvedProjectDir,
        browserEnabled: isBrowserEnabled,
        cursorSelfControlEnabled: isCursorSelfControlEnabled,
        mcpConfigSummary,
        cloudRulesEnabled: isCloudRulesEnabled,
        computerUseEnabled: isComputerUseEnabled,
        secretRedactionEnabled: isSecretRedactionEnabled,
        recordScreenEnabled: isRecordScreenEnabled,
        orbitOperationReportingEnabled: options.orbitOperationReporter !== undefined,
        chromeExecutablePath: chromeExecutablePath,
    });
    const gitExecutor = new LocalGitExecutor();
    execDaemonLogger.info(globalContext, "Resolved exec-daemon workspaces", {
        workspacePath,
        workspacePaths,
    });
    // Set up all the required dependencies
    const decisionProvider = new MockDecisionProvider();
    // FileChangeTracker is unused in exec-daemon (no IDE file watchers), but
    // LocalResourceProvider requires one. Use the first discovered workspace
    // rather than the raw daemon cwd which may be /agent (not a git repo).
    const fileChangeTracker = new FileChangeTracker(workspacePath);
    validateExecutable(getRipgrepBinaryPath(), globalContext); // fail hard if ripgrep cannot be found, so we don't silently fail to load Cursor rules
    const ignoreService = new LazyIgnoreService(gitExecutor, undefined);
    // Validate ffmpeg availability (optional - executor will handle errors gracefully if missing)
    // If screen recording is enabled, check for ffmpeg and warn if not found
    if (isRecordScreenEnabled) {
        const ffmpegResolved = findActualExecutable("ffmpeg", []);
        const ffmpegMode = false ? 0 : nodeFs.constants.X_OK;
        let ffmpegMissing = false;
        try {
            nodeFs.accessSync(ffmpegResolved.cmd, ffmpegMode);
        }
        catch {
            ffmpegMissing = true;
        }
        if (ffmpegMissing) {
            execDaemonLogger.warn(globalContext, "ffmpeg not found in PATH - screen recording will not work. Please install ffmpeg to use the recordScreen tool.");
        }
        const artifactsDir = options.recordScreenArtifactsDir ?? resolvedArtifactsDir;
        const stagingDir = resolvedRecordingStagingDir;
        for (const dir of [artifactsDir, stagingDir]) {
            ensureDirWithDataDirPolicy({
                dir,
                globalContext,
                successLogMessage: `Recording directory created/verified: ${dir}`,
                failureLogMessage: `Failed to create recording directory ${dir} - screen recording may not work`,
                mode: dirCreateMode,
            });
        }
    }
    if (options.isGenerateImageEnabled) {
        const artifactsAssetsDir = nodePath.join(resolvedArtifactsDir, "assets");
        ensureDirWithDataDirPolicy({
            dir: artifactsAssetsDir,
            globalContext,
            successLogMessage: `Artifacts assets directory created/verified: ${artifactsAssetsDir}`,
            failureLogMessage: `Failed to create artifacts assets directory ${artifactsAssetsDir} - generated images may not work`,
            mode: dirCreateMode,
        });
    }
    ensureDirWithDataDirPolicy({
        dir: resolvedLogsDir,
        globalContext,
        successLogMessage: `Logs directory created/verified: ${resolvedLogsDir}`,
        failureLogMessage: `Failed to create logs directory ${resolvedLogsDir} - debug subagent logging may not work`,
        mode: dirCreateMode,
    });
    // Eagerly create the terminals directory: the agent's prompt advertises it
    // from the very first turn (as RequestContextEnv.terminalsFolder), but it is
    // otherwise only created lazily when a shell first backgrounds
    // (FileLoggingShellFactory), and on cloud VMs nothing else creates it.
    // Agents that inspect the advertised path at startup hit ENOENT, conclude
    // the path is wrong, and waste turns hunting for the "real" location
    // (CPROD-905). Plain default-mode mkdir (not ensureDirWithDataDirPolicy,
    // whose chmod would diverge from the lazy writer's default-mode mkdir);
    // best-effort — on failure the lazy path still applies.
    try {
        await nodeFs.promises.mkdir(nodePath.join(resolvedProjectDir, "terminals"), {
            recursive: true,
        });
    }
    catch (mkdirError) {
        execDaemonLogger.warn(globalContext, `Failed to create terminals directory under ${resolvedProjectDir} - the prompt-advertised terminals folder may not exist until a shell backgrounds`, {
            error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
        });
    }
    const diagnosticsProvider = new MockDiagnosticsProvider();
    const codebaseReferenceProvider = new MockCodebaseReferenceProvider();
    const mcpManager = new McpManager({});
    if (mcpConfig !== undefined) {
        const configuredMcpServers = mcpConfig.mcpServers;
        await runSetupStepSpan(globalContext, "exec_daemon.setup.load_static_mcp_servers", async (spanCtx) => {
            execDaemonLogger.info(spanCtx, "Exec-daemon received MCP config", {
                ...mcpConfigSummary,
                transports: Object.fromEntries(Object.entries(configuredMcpServers).map(([name, cfg]) => [
                    name,
                    "command" in cfg ? "stdio" : "url" in cfg ? "http" : "unknown",
                ])),
            });
            for (const [serverName, serverConfig] of Object.entries(configuredMcpServers)) {
                if (!("command" in serverConfig)) {
                    continue;
                }
                const loadConfiguredClient = async (ctx: Context) => {
                    // Expand stdio env at spawn time: warm-fork secret injection via
                    // UpdateEnvironmentVariables can land after daemon startup. The
                    // daemon's own env is layered in at the same point, for the same
                    // reason.
                    const spawnServerConfig = withInheritedExecDaemonEnv(expandCloudMcpStdioServerEnvOnly(serverConfig, cloudMcpSecretAccessor));
                    const client = await loadServer(ctx, serverName, spawnServerConfig, createEphemeralScopedTokenStorage());
                    execDaemonLogger.info(ctx, "Exec-daemon MCP server loaded", {
                        serverName,
                    });
                    return client;
                };
                if (!isMcpMetaToolEnabled) {
                    try {
                        mcpManager.setClient(serverName, await loadConfiguredClient(spanCtx));
                    }
                    catch (error) {
                        const { errorForLogger, metadata: errorMetadata } = summarizeUnknownError(error);
                        execDaemonLogger.error(spanCtx, "Exec-daemon MCP server failed to start", errorForLogger, {
                            serverName,
                            ...getMcpServerLogMetadata(serverConfig),
                            ...errorMetadata,
                            stderrTail: getMcpStdioStderrTail(error),
                        });
                    }
                    continue;
                }
                let lazyClient: InstanceType<typeof LazyMcpClient>;
                lazyClient = new LazyMcpClient(serverName, serverConfig, loadConfiguredClient, () => {
                    if (mcpManager.getClient(serverName) === lazyClient) {
                        mcpManager.setClient(serverName, lazyClient);
                    }
                }, SESSION_MCP_LOAD_TIMEOUT_MS);
                mcpManager.setClient(serverName, lazyClient);
            }
        });
    }
    const initialNestedExtensibilityResults = workspacePaths.map((currentWorkspacePath) => {
        const service = new NestedExtensibilityService(currentWorkspacePath, gitExecutor, nodeOs.homedir(), getThirdPartyExtensibilityEnabled);
        return service.discover(globalContext);
    });
    // Set up cursor rules services across all discovered workspaces.
    const localCursorRulesServices = workspacePaths.map((currentWorkspacePath, idx) => new LocalCursorRulesService(globalContext, gitExecutor, currentWorkspacePath, true, // loadNestedRules
    getThirdPartyExtensibilityEnabled, undefined, // No file watching in exec-daemon
    undefined, initialNestedExtensibilityResults[idx]));
    const launcherAgentStoreSkillRoots = resolveAgentStoreSkillRoots(agentStoreSkillsDir);
    // A provider rather than the resolved list, because a private worker's roots
    // are not knowable at startup: its store mounts per claim, under a path that
    // depends on which owner claimed the worker.
    const getAgentStoreSkillRoots = () => getDynamicAgentStoreSkillRoots === undefined
        ? launcherAgentStoreSkillRoots
        : resolveAgentStoreSkillRoots([
            ...launcherAgentStoreSkillRoots,
            ...getDynamicAgentStoreSkillRoots(),
        ]);
    // Discovery and dedupe must read the same roots, or a store skill is surfaced
    // that dedupe does not recognise and tiers under the wrong scope.
    const agentStoreSkillsContext = () => ({
        userHomeDirectory: nodeOs.homedir(),
        agentStoreSkillsDirs: getAgentStoreSkillRoots(),
    });
    // Set up agent skills service for the caller's execution surface.
    const agentSkillsService = new AgentSkillsCursorRulesService(globalContext, workspacePaths, nodeOs.homedir(), gitExecutor, true, // loadNestedSkills — same as LocalCursorRulesService nested flag
    undefined, // No file watching in exec-daemon
    getThirdPartyExtensibilityEnabled, undefined, surface, initialNestedExtensibilityResults, getAgentStoreSkillRoots);
    const importThirdPartyPlugins = false;
    const pluginsService = new CloudPluginsService(nodeOs.homedir());
    const pluginSkillsService = new CursorPluginsAgentSkillsService(globalContext, () => ({ importThirdPartyPlugins }), undefined, // No file watching in exec-daemon
    pluginsService);
    // Skill services must stay in this merge: their `getAllCursorRules()` is the
    // only source of always-apply skills (`global` rules) and plugin `rules/`
    // entries, neither of which appears in `RequestContext.agentSkills`.
    const cursorRulesService = new MergedCursorRulesService([...localCursorRulesServices, agentSkillsService, pluginSkillsService], agentStoreSkillsContext);
    const mergedAgentSkillsService = new MergedAgentSkillsService([agentSkillsService, pluginSkillsService], () => [], () => ({
        workspacePaths,
        ...agentStoreSkillsContext(),
    }));
    const requestContextCursorRulesService = withDeduplicatedAgentSkillRules(cursorRulesService, (ctx) => mergedAgentSkillsService.getAllAgentSkills(ctx));
    // Only create cloud rules service if explicitly enabled
    const cloudRulesService = isCloudRulesEnabled
        ? new MergedCloudRulesService(workspacePaths.map((currentWorkspacePath) => ({
            workspacePath: currentWorkspacePath,
            service: new LocalCloudRulesService(globalContext, currentWorkspacePath, undefined),
        })))
        : undefined;
    // Set up subagents service
    const pluginSubagentsService = new CursorPluginsSubagentsService(() => ({ importThirdPartyPlugins }), pluginsService);
    const localSubagentsServices = workspacePaths.map((currentWorkspacePath) => new LocalSubagentsService(currentWorkspacePath, getThirdPartyExtensibilityEnabled));
    const subagentsService = new MergedSubagentsService([
        ...localSubagentsServices,
        pluginSubagentsService,
    ]);
    // Repo hooks should always resolve from the actual workspace root to match
    // desktop / VS Code behavior; metadata dir remains only for daemon state.
    const hooksProjectPath = workspacePath;
    const stdioMcpLease = new ManagerMcpLease(mcpManager);
    let refreshMcpState: ((ctx: Context) => Promise<void>) | undefined;
    const ensureMcpServersLoaded = async (ctx: Context, serverIdentifiers: readonly string[], options?: { wait?: boolean }) => {
        const wait = options?.wait !== false;
        // Load in parallel and isolate per-server failures: a single spawn/
        // handshake error must not skip (or serialize behind) the rest of the
        // set — otherwise later lazy clients stay forever in `loading`
        // (settings "Starting") until a later listing happens to name them first.
        const loadOne = async (serverIdentifier: string) => {
            const client = mcpManager.getClient(serverIdentifier) ??
                Object.values(mcpManager.getClients()).find((candidate) => candidate.serverName === serverIdentifier);
            if (!(client instanceof LazyMcpClient)) {
                return;
            }
            try {
                await client.ensureLoaded(ctx);
            }
            catch (error) {
                execDaemonLogger.warn(ctx, "Failed to load session MCP server", {
                    serverName: serverIdentifier,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    stderrTail: getMcpStdioStderrTail(error),
                });
            }
        };
        if (!wait) {
            // Kick every load, then return so the caller can snapshot "loading"
            // status immediately. Refresh MCP state once the batch settles so
            // subsequent reads see connected/error without another ensureLoaded.
            void asyncMapSettledValues([...serverIdentifiers], loadOne, {
                max: Math.max(serverIdentifiers.length, 1),
            })
                .then(async () => {
                if (serverIdentifiers.length > 0) {
                    await refreshMcpState?.(ctx);
                }
            })
                .catch((error: unknown) => {
                execDaemonLogger.warn(ctx, "Failed to refresh MCP state after kick-only load", {
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            });
            return;
        }
        try {
            await asyncMapSettledValues([...serverIdentifiers], loadOne, {
                max: Math.max(serverIdentifiers.length, 1),
            });
        }
        finally {
            if (serverIdentifiers.length > 0) {
                await refreshMcpState?.(ctx);
            }
        }
    };
    const sessionMcpRegistered = new Set<string>();
    // Each registered server's serialized config, so a later push with a CHANGED
    // command/args/env replaces the client instead of silently keeping the old
    // process configuration (callers like the Sand box treat every push as the
    // full desired config, including in-place edits).
    const sessionMcpConfigJsons = new Map<string, string>();
    const sessionMcpRegistrations = new Map<string, Promise<void>>();
    let lastRegisteredConfigHash: string | undefined;
    let onSessionMcpServersLoaded: ((ctx: Context) => Promise<void>) | undefined;
    const loadSessionMcpServers = async (ctx: Context, configJson: string, options?: SessionMcpLoadOptions) => {
        const loadedServerNames: string[] = [];
        // The hash covers the config alone, so a repeat call after a non-reconcile
        // load could still have removals to apply — skip the dedupe when
        // removeMissing is set (the per-server checks keep re-adds cheap).
        const configHash = nodeCrypto.createHash("sha256").update(configJson).digest("hex");
        if (lastRegisteredConfigHash === configHash &&
            options?.initialize !== true &&
            options?.removeMissing !== true) {
            return loadedServerNames;
        }
        let allConfiguredServerNames: string[] | undefined;
        try {
            const parsed: JsonValue = JSON.parse(configJson);
            const config = expandMcpConfigForCloudRuntime(mcpConfigSchema.parse(parsed), () => undefined);
            allConfiguredServerNames = Object.keys(config.mcpServers);
            for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
                const serverConfigJson = JSON.stringify(serverConfig);
                const existingRegistration = sessionMcpRegistrations.get(serverName);
                if (existingRegistration !== undefined) {
                    await existingRegistration;
                }
                // Already registered with the SAME config → untouched. A changed
                // config falls through and re-registers, replacing (and closing) the
                // previous client.
                if (sessionMcpRegistered.has(serverName) &&
                    sessionMcpConfigJsons.get(serverName) === serverConfigJson) {
                    continue;
                }
                const registration = (async () => {
                    const previousClient = mcpManager.getClient(serverName);
                    let lazyClient: InstanceType<typeof LazyMcpClient>;
                    lazyClient = new LazyMcpClient(serverName, serverConfig, async (loadCtx) => {
                        // Expand stdio env and inherit the daemon's env at spawn time
                        // (see loadConfiguredClient).
                        const spawnServerConfig = withInheritedExecDaemonEnv(expandCloudMcpStdioServerEnvOnly(serverConfig, cloudMcpSecretAccessor));
                        return await loadServer(loadCtx, serverName, spawnServerConfig, createEphemeralScopedTokenStorage());
                    }, () => {
                        if (mcpManager.getClient(serverName) === lazyClient) {
                            mcpManager.setClient(serverName, lazyClient);
                        }
                    }, SESSION_MCP_LOAD_TIMEOUT_MS);
                    mcpManager.setClient(serverName, lazyClient);
                    sessionMcpRegistered.add(serverName);
                    sessionMcpConfigJsons.set(serverName, serverConfigJson);
                    loadedServerNames.push(serverName);
                    try {
                        await previousClient?.close?.();
                    }
                    catch (error) {
                        execDaemonLogger.warn(ctx, "Failed to close replaced MCP client", {
                            serverName,
                            errorMessage: error instanceof Error ? error.message : String(error),
                        });
                    }
                })();
                sessionMcpRegistrations.set(serverName, registration);
                try {
                    await registration;
                }
                finally {
                    if (sessionMcpRegistrations.get(serverName) === registration) {
                        sessionMcpRegistrations.delete(serverName);
                    }
                }
            }
        }
        catch (error) {
            execDaemonLogger.error(ctx, "Failed to parse MCP config for session", error instanceof Error ? error : undefined);
        }
        // Reconcile removals: session-registered servers absent from the desired
        // config are closed + deregistered. Guarded on a successfully parsed
        // config so a malformed payload can never wipe every session server, and
        // scoped to `sessionMcpRegistered` so static --mcp-config servers are
        // never removed.
        const removedServerNames: string[] = [];
        if (options?.removeMissing === true && allConfiguredServerNames !== undefined) {
            const desiredServerNames = new Set(allConfiguredServerNames);
            for (const serverName of [...sessionMcpRegistered]) {
                if (desiredServerNames.has(serverName)) {
                    continue;
                }
                const existing = mcpManager.getClient(serverName);
                mcpManager.deleteClient(serverName);
                sessionMcpRegistered.delete(serverName);
                sessionMcpConfigJsons.delete(serverName);
                removedServerNames.push(serverName);
                try {
                    await existing?.close?.();
                }
                catch (error) {
                    execDaemonLogger.warn(ctx, "Failed to close removed session MCP client", {
                        serverName,
                        errorMessage: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            if (removedServerNames.length > 0) {
                execDaemonLogger.info(ctx, "Removed session MCP servers", {
                    removedServerNames,
                });
            }
        }
        const allServersRegistered = allConfiguredServerNames?.every((name) => sessionMcpRegistered.has(name)) === true;
        if (!isMcpMetaToolEnabled || options?.initialize === true) {
            await ensureMcpServersLoaded(ctx, allConfiguredServerNames ?? []);
        }
        if (allServersRegistered) {
            lastRegisteredConfigHash = configHash;
        }
        if ((loadedServerNames.length > 0 || removedServerNames.length > 0) &&
            onSessionMcpServersLoaded) {
            await onSessionMcpServersLoaded(ctx);
        }
        return loadedServerNames;
    };
    
    const httpMcpToolsJson = httpMcpToolsFile
        ? await (async () => {
            try {
                return await nodeFs.promises.readFile(httpMcpToolsFile, "utf-8");
            }
            catch (error) {
                execDaemonLogger.error(globalContext, "Failed to read HTTP MCP tools file", {
                    path: httpMcpToolsFile,
                    error,
                });
                return undefined;
            }
        })()
        : undefined;
    const httpMcpLease = createHttpMcpLeaseFromJson(httpMcpToolsJson, {
        globalContext, execDaemonLogger, buildNamedMcpToolDefinitionFromFileContent,
        createLease: (tools) => new StaticMcpLease(tools),
    });
    const mcpLeaseForDiscovery = httpMcpLease
        ? new CombinedMcpLease([stdioMcpLease, httpMcpLease])
        : stdioMcpLease;
    let mcpFileSystemWriter: McpFileSystemWriter | undefined;
    const hasConfiguredMcpServers = mcpConfigSummary.serverNames.length > 0;
    const shouldExposeMcpFileSystem = httpMcpLease || hasConfiguredMcpServers || exposeMcpFileSystemForSessionMcp;
    if (shouldExposeMcpFileSystem) {
        // Exec daemon currently keeps the default MCP auth/status copy fallback from
        // local-exec. VSCode can override this copy via dynamic config.
        mcpFileSystemWriter = new McpFileSystemWriterDependency(mcpLeaseForDiscovery, resolvedProjectDir, {
            loggerBackend: globalContext.get(loggerKey),
            exposeVirtualMcpAuthTool: false,
        });
    }
    const mcpLease = stdioMcpLease;
    const grepProvider = {
        executeIndexedGrep: undefined,
    };
    let sandboxEnabled = false;
    if (isSandboxEnabled) {
        sandboxEnabled = isSandboxSupported(undefined, {
            cwd: workspacePath,
            ctx: globalContext,
        });
        if (!sandboxEnabled) {
            execDaemonLogger.warn(globalContext, "Sandbox was requested but is not supported in this environment. Continuing with sandbox disabled.");
        }
    }
    // Set up permissions service with sandbox policies
    const defaultSandboxPolicy = resolveSandboxPolicyFromJson(sandboxPolicyJson, {
        sandboxEnabled, workspacePath, globalContext, execDaemonLogger,
        parseSandboxPolicyJson, resolvePolicyPaths,
    });
    const permissionsService = new DaemonPermissionsService(defaultSandboxPolicy);
    const hooksConfigPaths = getHooksConfigPaths(hooksProjectPath);
    hooksConfigPaths.teamConfigPath = getCloudManagedTeamHooksPath(nodeOs.homedir());
    const fileReader = new NodeFileReader();
    const loadHooksConfig = async () => {
        const configLoader = new HooksConfigLoader(fileReader, hooksConfigPaths);
        return await configLoader.load();
    };
    const hooksConfig = await loadHooksConfig();
    const hooksConfigLease = new MutableHooksConfigLeaseImpl(hooksConfig);
    const execDaemonTerminalExecutor = createDefaultTerminalExecutor();
    const hooksTerminalExecutor = createNaiveTerminalExecutor();
    // Build the computer-use executor. See computerUseExecutorSetup.ts for the
    // lazy-vs-eager init modes.
    const computerUseDisplay = getDisplay(options.recordScreenDisplay);
    const xdpyinfoPath = resolveExecutablePath("xdpyinfo");
    let computerUseExecutor: BuiltinComputerUseExecutor | undefined;
    await runSetupStepSpan(globalContext, "exec_daemon.setup.init_computer_use", async (spanCtx) => {
        execDaemonLogger.info(spanCtx, "computer_use_startup_config", {
            computerUseEnabled: isComputerUseEnabled,
            lazyComputerUseInit,
            computerUseApiWidth,
            computerUseApiHeight,
            recordScreenEnabled: isRecordScreenEnabled,
            recordScreenDisplayOption: options.recordScreenDisplay,
            resolvedDisplay: computerUseDisplay,
            displayEnv: process.env.DISPLAY,
            hasXdpyinfo: xdpyinfoPath !== undefined,
            xdpyinfoPath,
        });
        computerUseExecutor = await buildExecDaemonComputerUseExecutor(spanCtx, {
            isComputerUseEnabled,
            lazyComputerUseInit,
            display: computerUseDisplay,
            xdpyinfoPath,
            apiWidth: computerUseApiWidth,
            apiHeight: computerUseApiHeight,
        });
    });
    // Only an X11 desktop can be shared with a human; Mac computer use has no
    // lease, so its RPC answers Unimplemented and clients fall back.
    const x11ComputerUseExecutor = computerUseExecutor !== undefined && computerUseExecutorHasInputEventLogger(computerUseExecutor)
        ? computerUseExecutor
        : undefined;
    const desktopLeaseStore = x11ComputerUseExecutor === undefined
        ? undefined
        : new DesktopLeaseStore({
            enforce: desktopLeaseEnforce,
            releaseHeldInput: () => x11ComputerUseExecutor.releaseHeldInput(),
        });
    execDaemonLogger.info(globalContext, "loading resource provider", {
        computerUseEnabled: isComputerUseEnabled,
        computerUseRunning: computerUseExecutor !== undefined,
        desktopLeaseEnforce,
    });
    let secretRedactionState: InstanceType<typeof SecretRedactionState> | undefined;
    if (isSecretRedactionEnabled) {
        await refreshCachedGitAuthTokens();
        secretRedactionState = new SecretRedactionState();
        secretRedactionState.refreshFromEnv(process.env);
    }
    const lazySecretReader = secretRedactionState
        ? () => secretRedactionState.getRedactor()
        : undefined;
    // Scoped secrets ride the redaction switch: a value the daemon can inject is
    // always one it can redact.
    const scopedSecretStore = secretRedactionState
        ? new ScopedSecretStore((values) => secretRedactionState.retainSecretValues(values, process.env))
        : undefined;
    const polishedRecordingRenderer = isRecordScreenEnabled
        ? new ExecDaemonPolishedRecordingRenderer()
        : undefined;
    const sharedMcpStateAccessor = new ObservableMcpStateAccessor(mcpLeaseForDiscovery);
    if (shouldExposeMcpFileSystem) {
        await sharedMcpStateAccessor.refreshNow(globalContext);
    }
    refreshMcpState = async (ctx) => {
        await sharedMcpStateAccessor.refreshNow(ctx);
    };
    onSessionMcpServersLoaded = async (ctx) => {
        await sharedMcpStateAccessor.refreshNow(ctx);
    };
    const readOnlyBareMode = readOnlyBareModeOption;
    const readOnlyBareRepoPath = readOnlyBareRepoPathOption.trim();
    // Read-only bare mode currently runs request-context against a single
    // bare mirror, which can only represent one repo. If the daemon
    // discovered multiple workspaces, sibling repos would silently disappear
    // from rules / skills / codebase resolution — fail loud instead so the
    // caller knows multi-root isn't supported on this path yet.
    if (readOnlyBareMode && workspacePaths.length > 1) {
        throw new Error(`--read-only-bare-mode does not support multi-root workspaces (got ${workspacePaths.length}: ${workspacePaths.join(", ")})`);
    }
    const projectAgentSkillsForRequestContext = (skills: agent_v1_AgentSkill[]) => {
        let projected = skills;
        if (filterModelDisabledSkills) {
            projected = projected.filter(shouldIncludeAgentSkillInRequestContext);
        }
        if (stripAgentSkillContent) {
            projected = stripAgentSkillContentForRequestContext(projected, {
                preservePluginSkillContent: true,
            });
        }
        return projected;
    };
    // Request-context options shared by the full executor and the dynamic-only
    // executor (everything except the static workspace providers and agent skills,
    // which differ between the two).
    const sharedRequestContextOptions: RequestContextOptions = {
        projectDir: resolvedProjectDir,
        getSandboxEnabled: () => sandboxEnabled,
        getSandboxSupported: () => sandboxEnabled,
        getMcpFileSystemOptions: mcpFileSystemWriter
            ? async (ctx, options) => mcpFileSystemWriter.getMcpFileSystemOptions(ctx, options)
            : undefined,
        mcpMetaToolEnabled: isMcpMetaToolEnabled,
        mcpMetaToolSlimDescriptors: isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors,
        mcpInputSchemaJson,
        getArtifactsFolder,
        secretRedactionEnabled: !!lazySecretReader,
        getComputerUseSupported: () => computerUseExecutor !== undefined,
    };
    // Filesystem-only static services (no plugin content). The env-build prebuild
    // bakes from these so the on-disk cache is plugin-free: cloud plugins are
    // provisioned per-agent at runtime, after the snapshot, and the runtime daemon
    // merges them on top of the baked baseline. Baking plugin content here would
    // double-count it once an agent's plugins are installed.
    const filesystemAgentSkillsService = new MergedAgentSkillsService([agentSkillsService], () => [], () => ({
        workspacePaths,
        ...agentStoreSkillsContext(),
    }));
    const filesystemRequestContextCursorRulesService = withDeduplicatedAgentSkillRules(new MergedCursorRulesService([...localCursorRulesServices, agentSkillsService], agentStoreSkillsContext), (ctx) => filesystemAgentSkillsService.getAllAgentSkills(ctx));
    const filesystemSubagentsService = new MergedSubagentsService(localSubagentsServices);
    // The full executor scans the workspace for the static request context (rules,
    // skills, subagents, codebase ref, cloud rule). Used directly by the env-build
    // prebuild (filesystem-only, so the baked cache is plugin-free) and as the
    // runtime cache-miss fallback (with live plugins merged, matching the cache-hit
    // path); built lazily there so the rescan never runs on the cache-hit path.
    const buildFullRequestContextExecutor = (includePlugins: boolean) => {
        const executor = new LocalRequestContextExecutor(includePlugins
            ? requestContextCursorRulesService
            : filesystemRequestContextCursorRulesService, cloudRulesService, includePlugins ? subagentsService : filesystemSubagentsService, codebaseReferenceProvider, grepProvider, sharedMcpStateAccessor, gitExecutor, workspacePaths, {
            ...sharedRequestContextOptions,
            getAgentSkills: async (ctx) => projectAgentSkillsForRequestContext(await (includePlugins ? mergedAgentSkillsService : filesystemAgentSkillsService).getAllAgentSkills(ctx)),
        });
        // Always-apply skills reach a turn as cursor rules, which the executor
        // memoizes for the process lifetime because the daemon runs no file
        // watcher. The skill catalog changes without a file edit when an Agent
        // Store root is reloaded — the mount latch below and `reloadAgentSkills`
        // both do that — so subscribe to the catalog itself rather than to either
        // trigger. `_loaded` is already swapped when this fires, so the recompute
        // reads the new catalog. Plugin rules are memoized the same way and have
        // their own reload (`reloadPlugins`), so they get their own subscription
        // rather than relying on the merged service's fan-out order. Each service
        // notifies directly and synchronously; the merged rules service coalesces
        // by a second, which a turn inside that second would notice.
        const invalidate = () => executor.invalidateGlobalCache();
        agentSkillsService.onDidChangeRules(invalidate);
        pluginSkillsService.onDidChangeRules(invalidate);
        return executor;
    };
    const baseRequestContextExecutor = readOnlyBareMode
        ? createReadOnlyVmDaemonBareRequestContextExecutor({
            workspacePath,
            bareRepoPath: readOnlyBareRepoPath,
            mcpStateAccessor: sharedMcpStateAccessor,
            stripAgentSkillContent,
            filterModelDisabledSkills,
            options: {
                projectDir: resolvedProjectDir,
                getSandboxEnabled: () => sandboxEnabled,
                getSandboxSupported: () => sandboxEnabled,
                getMcpFileSystemOptions: mcpFileSystemWriter
                    ? async (ctx, options) => mcpFileSystemWriter.getMcpFileSystemOptions(ctx, options)
                    : undefined,
                mcpMetaToolEnabled: isMcpMetaToolEnabled,
                mcpMetaToolSlimDescriptors: isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors,
                mcpInputSchemaJson,
                getArtifactsFolder,
                secretRedactionEnabled: !!lazySecretReader,
                getComputerUseSupported: () => computerUseExecutor !== undefined,
            },
        })
        : disableRequestContextDiskCache
            ? // No disk cache: recompute from the live workspace. The prebuild drops
                // plugins here so the baked cache is plugin-free; a worker keeps them,
                // since its plugins are provisioned live and nothing merges them later.
                buildFullRequestContextExecutor(includePluginsInRequestContext)
            : new DiskBackedRequestContextExecutor({
                createFullExecutor: () => buildFullRequestContextExecutor(true),
                read: (ctx) => readRequestContextDiskCache(ctx, resolveRequestContextDiskCachePath(resolvedDataDir)),
                getPluginRules: (ctx) => pluginSkillsService.getAllCursorRules(ctx),
                getPluginAgentSkills: (ctx) => pluginSkillsService.getAllAgentSkills(ctx),
                getPluginSubagents: () => pluginSubagentsService.getAllSubagents(),
                dedupeRules: removeDuplicatedAgentSkillRules,
                updateBaked: async (ctx, requestContext) => {
                    // Snapshot bakes can predate strip/filter flags; re-apply so fat
                    // skill catalogs never cross the exec RPC on a disk-cache hit.
                    requestContext.agentSkills = projectAgentSkillsForRequestContext(requestContext.agentSkills);
                    const mcpState = await sharedMcpStateAccessor.getState(ctx);
                    const slimMcp = isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors;
                    const legacyMcp = buildLegacyMcpRequestContextFields(mcpState, {
                        internalBrowserProvidersOnly: slimMcp,
                        inputSchemaJson: mcpInputSchemaJson,
                    });
                    requestContext.tools = legacyMcp.tools;
                    requestContext.mcpInstructions = legacyMcp.mcpInstructions;
                    requestContext.mcpMetaToolOptions = isMcpMetaToolEnabled
                        ? buildMcpMetaToolOptions(mcpState, {
                            slimDescriptors: slimMcp,
                            inputSchemaJson: mcpInputSchemaJson,
                        })
                        : undefined;
                    requestContext.mcpFileSystemOptions =
                        await mcpFileSystemWriter?.getMcpFileSystemOptions(ctx);
                    // The baked env carries the artifacts folder from env-build time.
                    // Re-resolve so a request-scoped folder (private workers) or a
                    // differing runtime data dir never serves a stale baked value.
                    if (requestContext.env !== undefined) {
                        requestContext.env.artifactsFolder = getArtifactsFolder(ctx);
                    }
                },
            });
    // The store mount lands after the daemon's startup scan, so every turn
    // re-checks for it and reloads that root the first time it is there. Wrapping
    // the shared executor rather than the full one covers the disk-cache hit too.
    // Launcher roots only: dynamic roots come and go with their claim, and the
    // launcher reloads the catalog at those boundaries instead of probing here.
    const ensureAgentStoreSkillsDiscovered = createAgentStoreSkillsMountLatch({
        roots: launcherAgentStoreSkillRoots,
        reloadRoots: () => agentSkillsService.reloadSkillRoots(),
        onReloaded: (roots) => {
            execDaemonLogger.info(globalContext, "Agent store skills mount found", {
                roots,
            });
        },
        onUnresponsive: (root) => {
            execDaemonLogger.warn(globalContext, "Agent store skills mount did not respond; giving up on discovering it", { root });
        },
    });
    const sharedRequestContextExecutor: RequestContextExecutor = {
        execute: async (ctx, args, options) => {
            await ensureAgentStoreSkillsDiscovered();
            return await baseRequestContextExecutor.execute(ctx, args, options);
        },
    };
    // Create the LocalResourceProvider
    const resourceProviderCtx = withSpan(globalContext.withName("exec_daemon.setup.create_resource_provider"));
    const resourceProviderSpan = getSpan(resourceProviderCtx);
    try {
        const agentStoreConflictDrainer = new AgentStoreConflictJournalDrainer({
            enabled: agentStoreConflictNoticesEnabled,
            // Boolean CLI snapshot (not a live getter): cloud has no in-pod Statsig.
            // Backend turn-start / turn-end drains refresh via include_quota_notices
            // on AgentStoreConflictArgs so hook carriers flip with the live gate.
            // IDE and private-worker pass live gate readers instead.
            includeQuotaNotices: agentStoreQuotaNoticesEnabled,
        });
        const canvasPreviewArtifactsRoot = surface === "cloud"
            ? await resolveCanvasPreviewPersistArtifactsRoot({
                fallbackArtifactsRoot: resolvedArtifactsDir,
            })
            : undefined;
        const canvasDiagnostics = setupExecDaemonCanvasDiagnostics({
            ctx: resourceProviderCtx,
            workspacePath,
            // Gzip preview persist is cloud-only. Prefer the FUSE self-store
            // artifacts dir so the write does not depend on /opt/cursor/artifacts.
            artifactsRoot: canvasPreviewArtifactsRoot,
            enableStoreCanvasPersist: surface === "cloud",
        });
        // The Read and MCP executors below resize images in this process, so the
        // WebP codec must be registered before the first oversized .webp arrives.
        registerExecDaemonWebpCodec(resourceProviderCtx);
        const baseResources = new LocalResourceProvider({
            pendingDecisionStore: decisionProvider,
            fileChangeTracker,
            gitExecutor,
            ignoreService,
            grepProvider,
            permissionsService,
            workspacePaths,
            diagnosticsProvider,
            getCanvasDiagnostics: canvasDiagnostics?.getCanvasDiagnostics,
            beginCanvasSave: canvasDiagnostics?.beginCanvasSave,
            mcpLease,
            mcpStateAccessor: sharedMcpStateAccessor,
            ensureMcpServersLoaded,
            cursorRulesService,
            cloudRulesService,
            subagentsService,
            repositoryProvider: codebaseReferenceProvider,
            projectDir: resolvedProjectDir,
            sharedRequestContextExecutor,
            shellManager: undefined,
            _sandboxPolicyResolver: undefined,
            _defaultSandboxPolicy: defaultSandboxPolicy,
            mcpFileOutputThresholdBytes: undefined,
            terminalExecutor: execDaemonTerminalExecutor,
            getSandboxEnabled: () => sandboxEnabled,
            getSandboxSupported: () => sandboxEnabled,
            computerUseExecutor: computerUseExecutor !== undefined && desktopLeaseStore !== undefined
                ? gateComputerUseExecutor(desktopLeaseStore, computerUseExecutor)
                : computerUseExecutor,
            enableRecordScreen: isRecordScreenEnabled,
            recordScreenArtifactsDir: options.recordScreenArtifactsDir ?? resolvedArtifactsDir,
            recordScreenDisplay: getDisplay(options.recordScreenDisplay),
            polishedRecordingRenderer,
            getArtifactsFolder,
            secretRedactionEnabled: !!lazySecretReader,
            registerRedactedReadExecutor: !!lazySecretReader,
            shellCoreWrapper: lazySecretReader && scopedSecretStore
                ? (executor) => new RedactingShellCoreExecutor(new ScopedSecretsShellCoreExecutor(executor, scopedSecretStore), lazySecretReader)
                : undefined,
            shellExtraEnvProvider: options.shellExtraEnvProvider,
            getMountedAgentStores: options.getMountedAgentStores,
            // Provide MCP file system options for agent discovery (when enabled)
            getMcpFileSystemOptions: mcpFileSystemWriter
                ? async (ctx, options) => mcpFileSystemWriter.getMcpFileSystemOptions(ctx, options)
                : undefined,
            mcpMetaToolEnabled: isMcpMetaToolEnabled,
            mcpMetaToolSlimDescriptors: isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors,
            mcpInputSchemaJson,
            getAgentSkills: async (ctx) => projectAgentSkillsForRequestContext(await mergedAgentSkillsService.getAllAgentSkills(ctx)),
            agentStoreConflictDrainer,
        });
        execDaemonLogger.info(resourceProviderCtx, "resource provider loaded", {
            hooksConfig,
        });
        // Wire up InputEventLogger between screen recorder and computer-use executor
        if (isRecordScreenEnabled && isComputerUseEnabled && computerUseExecutor) {
            const activeComputerUseExecutor = computerUseExecutor;
            const recordScreenExecutor = baseResources.getRecordScreenExecutor();
            if (recordScreenExecutor &&
                computerUseExecutorHasInputEventLogger(activeComputerUseExecutor)) {
                // When recording starts, connect the InputEventLogger to the X11Executor
                recordScreenExecutor.setOnRecordingStarted((logger) => {
                    execDaemonLogger.info(resourceProviderCtx, "Recording started, connecting InputEventLogger to X11Executor");
                    activeComputerUseExecutor.setInputEventLogger(logger);
                });
                // When recording stops, disconnect the logger
                recordScreenExecutor.setOnRecordingStopped(() => {
                    execDaemonLogger.info(resourceProviderCtx, "Recording stopped, disconnecting InputEventLogger from X11Executor");
                    activeComputerUseExecutor.setInputEventLogger(undefined);
                });
                execDaemonLogger.info(resourceProviderCtx, "InputEventLogger wiring configured for polished recordings");
            }
        }
        // Always create hook executor and wrap with ListableHooksResourceAccessor to ensure
        // the hook executor resource is registered. This prevents the chat from hanging
        // when the backend sends hook execution requests. The executor will no-op if no
        // hooks are configured for a given step.
        const globalHookContext = resolveExecDaemonGlobalHookContext({
            cursorVersion: "1.0.0",
            userEmail: options.userEmail,
        });
        const hookExecutor = new CliHooksExecutor(hooksConfig, hooksProjectPath, globalHookContext, hooksTerminalExecutor, options.promptHookClient, undefined, undefined, {
            enableClaudeNestedHookSpecificOutputCompatibility: options.enableClaudeNestedHookSpecificOutputCompatibility,
            commandHookPayloadTransport: options.commandHookPayloadTransport,
            runtimeHooks: options.runtimeHooks,
        });
        execDaemonLogger.info(resourceProviderCtx, "Exec-daemon loaded hook executor", {
            hasUserHooks: !!hooksConfig.userHooks,
            hasProjectHooks: !!hooksConfig.projectHooks,
        });
        const oomKillResources = withShellOomKillReporting(baseResources);
        const redactedResources = lazySecretReader
            ? new RedactingResourceAccessor(oomKillResources, lazySecretReader, new Set([
                grepExecutorResource.symbol,
                redactedReadExecutorResource.symbol,
                mcpExecutorResource.symbol,
                readMcpResourceExecutorResource.symbol,
            ]))
            : oomKillResources;
        const orbitReportingResources = options.orbitOperationReporter === undefined
            ? redactedResources
            : withOrbitOperationReporting(redactedResources, options.orbitOperationReporter);
        const resources = new AgentStoreConflictDrainAccessor(new ListableHooksResourceAccessor(orbitReportingResources, hookExecutor, (ctx) => ({
            conversation_id: ctx.get(execHookConversationIdKey) ?? "",
            generation_id: ctx.get(execHookGenerationIdKey) ?? "",
            model: ctx.get(execHookModelKey) ?? "unknown",
        }), mcpLease, undefined, undefined, hooksConfigLease), agentStoreConflictDrainer);
        execDaemonLogger.info(resourceProviderCtx, "Exec-daemon loaded resources", {
            resourceCount: [...resources.entries()].length,
        });
        return {
            resources,
            gitService,
            remoteAccessService,
            requestContextExecutor: sharedRequestContextExecutor,
            ptyManager,
            artifactUploadManagerProvider,
            hookExecutor,
            mcpFileSystemWriter,
            secretRedactionState,
            scopedSecretStore,
            reloadAgentSkills: async (ctx: Context) => {
                try {
                    const reloadedHooksConfig = await loadHooksConfig();
                    hooksConfigLease.setConfig(reloadedHooksConfig);
                    hookExecutor.updateConfig(reloadedHooksConfig);
                    execDaemonLogger.info(ctx, "Reloaded hook configuration summary", {
                        ...summarizeHooksConfigForLogging(reloadedHooksConfig),
                    });
                }
                catch (error) {
                    execDaemonLogger.warn(ctx, "Failed to reload hook configuration; keeping previous hooks config", {
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
                mergedAgentSkillsService.reload(ctx);
                await canvasDiagnostics?.remirrorSkillSdk();
            },
            // `reloadSkillRoots` re-reads the provider and reconciles the settled
            // snapshot against it, so a departed root is dropped without being named.
            reloadAgentStoreSkills: () => agentSkillsService.reloadSkillRoots(),
            reloadPlugins: async (ctx: Context) => {
                await pluginsService.reload();
                mergedAgentSkillsService.reload(ctx);
                await subagentsService.reload();
            },
            getComputerUseSupported: () => computerUseExecutor !== undefined,
            desktopLeaseStore,
            loadSessionMcpServers,
            closeMcpClients: () => mcpManager.closeAllClients(),
        };
    }
    catch (error) {
        resourceProviderSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
        execDaemonLogger.error(resourceProviderCtx, "error creating resource provider", {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
    finally {
        resourceProviderSpan?.end();
    }
}
