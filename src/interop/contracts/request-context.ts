import type { Context } from "./context.js";
import type { GitExecutor } from "./local-exec.js";
import type { Executor } from "./agent-exec.js";
import type { PluginContent } from "./cursor-plugins.js";
import type { JsonValue } from "./protobuf-runtime.js";
import type { McpTool } from "./mcp.js";
import type {
  agent_v1_AgentSkill, agent_v1_CursorRule, agent_v1_CustomSubagent,
  agent_v1_RequestContextArgs, agent_v1_RequestContextResult,
  agent_v1_RepositoryIndexingInfo, agent_v1_McpFileSystemOptions,
  agent_v1_McpInstructions,
} from "./protobuf-generated.js";
export type DisposeSubscription = () => void;
export interface FileWatcher {
  onDidChange(callback: (path: string) => void): void;
  onDidCreate(callback: (path: string) => void): void;
  onDidDelete(callback: (path: string) => void): void;
  dispose(): void;
}
export interface CursorRulesService {
  getAllCursorRules(ctx: Context): Promise<agent_v1_CursorRule[]>;
  reload(ctx: Context): void | Promise<void>;
  onDidChangeRules?(callback: () => void): DisposeSubscription;
  dispose?(): void;
}
export interface MergedCursorRulesService extends CursorRulesService {
  onDidChangeRules(callback: () => void): DisposeSubscription;
  dispose(): void;
}
export interface PluginRulesAndSkillsService extends MergedCursorRulesService, Omit<AgentSkillsService, "dispose"> {
  onDidChangeSkills(callback: () => void): DisposeSubscription;
}
export interface AgentSkillsService {
  getAllAgentSkills(ctx: Context): Promise<agent_v1_AgentSkill[]>;
  reload(ctx: Context): void | Promise<void>;
  onDidChangeSkills?(callback: () => void): DisposeSubscription;
  dispose?(): void;
}
export interface CloudRulesService {
  getCloudRule(ctx: Context): Promise<string | null>;
  reload(ctx: Context): void | Promise<void>;
  onDidChangeRule(callback: () => void): void;
  dispose(): void;
}
export interface SubagentsService {
  getAllSubagents(): Promise<agent_v1_CustomSubagent[]>;
  reload(): Promise<agent_v1_CustomSubagent[]>;
  dispose?(): void;
}
export interface PluginLoadFailure { pluginName: string; errorMessage: string; errorType: string; pluginId?: string; marketplaceName?: string; }
export interface PluginsService {
  getAllEnabledPlugins(): Promise<PluginContent[]>;
  reload(): Promise<PluginContent[]>;
  getLoadFailures(): PluginLoadFailure[];
  isPluginSetIncomplete?(): boolean;
}
export interface AgentStoreSkillsContext { agentStoreSkillsDirs: readonly string[]; userHomeDirectory: string; }
export interface SkillPromptSortContext extends AgentStoreSkillsContext { workspacePaths: readonly string[]; }
export interface BareRepository {
  getTreeSha(): string;
  readFile(ctx: Context, path: string): Promise<Uint8Array | undefined>;
  readFiles?(ctx: Context, paths: readonly string[]): Promise<Map<string, Uint8Array | undefined>>;
  stat(ctx: Context, path: string): Promise<"file" | "directory" | "missing">;
  listFiles(ctx: Context, prefix: string): Promise<string[]>;
  runGit(ctx: Context, args: readonly string[], timeoutMs?: number): Promise<{ exitCode: number; stdout: Uint8Array; stderr: Uint8Array }>;
}
export interface BareGitWorkspaceRuntimeRef {
  runWith<T>(ctx: Context, fn: () => T): T;
  get(): Context | undefined;
}
export type ResolveRuntimeContext = (agentCtx: Context, current: Context | undefined) => Context | undefined;
export interface BareGitWorkspaceFilesystem {
  readTextFile(ctx: Context, absolutePath: string): Promise<string | undefined>;
  readTextFiles(ctx: Context, absolutePaths: readonly string[]): Promise<Map<string, string | undefined>>;
  stat(ctx: Context, path: string): Promise<"file" | "directory" | "missing">;
  walkFiles(ctx: Context, options: { rootDir: string; includeGlobs: readonly string[]; excludeGlobs?: readonly string[] }): AsyncIterable<string>;
  isIgnoredForRuleDiscovery(ctx: Context, path: string): Promise<boolean>;
  reset(): void;
}
export interface BareGitExtensibilityService extends CursorRulesService, AgentSkillsService, CloudRulesService {
  getAllSubagents(): Promise<agent_v1_CustomSubagent[]>;
  reloadSubagents(): Promise<agent_v1_CustomSubagent[]>;
  dispose(): void;
}
export interface NamedMcpTool extends Omit<McpTool, "inputSchema"> {
  inputSchema?: McpTool["inputSchema"];
  clientKey: string; providerIdentifier: string; toolName: string;
  plugin?: string; marketplace?: string; pluginId?: string; marketplaceId?: string;
}
export interface McpState {
  servers: {
    serverIdentifier: string; serverName: string; plugin?: string; marketplace?: string;
    pluginId?: string; marketplaceId?: string;
    tools: NamedMcpTool[];
    instructions: Pick<agent_v1_McpInstructions, "instructions" | "serverName">[];
    status?: "connected" | "needsAuth" | "error" | "loading";
    errorMessage?: string;
  }[];
}
export interface McpStateAccessor { getState(ctx: Context): Promise<McpState>; refreshNow?(ctx: Context): Promise<void>; }
export interface RepositoryProvider {
  getCodebaseReference(ctx: Context, signal?: AbortSignal): Promise<Pick<agent_v1_RepositoryIndexingInfo, "relativeWorkspacePath" | "repoName" | "repoOwner" | "isTracked" | "isLocal" | "orthogonalTransformSeed" | "pathEncryptionKey"> | undefined>;
}
export interface RequestContextGrepProvider {
  executeIndexedGrep?: never;
  getTrackedState?(workspacePaths: readonly string[]): Promise<Record<string, { gitStatus: string; gitBranchName: string }> | undefined>;
}
export interface RequestContextOptions {
  projectDir?: string;
  getSmartModeClassifierAutoModeEnabled?: () => boolean | undefined;
  getAdminCommandDenylist?: () => Promise<string[] | undefined>;
  devForceNextSmartModeClassifierBlockToken?: string;
  isWorkingDirHomeDir?: boolean;
  createFileWatcher?: () => FileWatcher;
  getSandboxEnabled?: () => boolean;
  getSandboxSupported?: () => boolean | undefined;
  getNetworkAllowlistInfo?: () => Promise<{ hasDefaults?: boolean; explicitEntries?: string[] } | undefined>;
  userTerminalHint?: string;
  getMcpFileSystemOptions?: (ctx: Context, options?: { timeoutMs?: number }) => Promise<agent_v1_McpFileSystemOptions | undefined>;
  mcpMetaToolEnabled?: boolean;
  mcpMetaToolSlimDescriptors?: boolean;
  mcpInputSchemaJson?: boolean;
  alwaysExposeVirtualMcpAuthTool?: boolean;
  getArtifactsFolder?: (ctx: Context) => string | undefined;
  secretRedactionEnabled?: boolean;
  attributionConfigProvider?: { get(): { attribution?: { attributeCommitsToAgent?: boolean; attributePRsToAgent?: boolean } } | undefined };
  isAttributionDisabledByAdmin?: () => Promise<boolean>;
  getAgentSkills?: (ctx: Context) => Promise<agent_v1_AgentSkill[]>;
  additionalRules?: agent_v1_CursorRule[];
  getComputerUseSupported?: () => boolean;
  getMockPromptTime?: () => Date | undefined;
  reduceContextHotPath?: boolean;
}
export interface RequestContextExecutor extends Executor<agent_v1_RequestContextArgs, agent_v1_RequestContextResult> {
  dispose?(): void;
}
export interface LocalRequestContextExecutor extends RequestContextExecutor { invalidateGlobalCache(): void; }
declare module "./local-exec.js" {
  interface LocalExecModule {
    bR2: new () => BareGitWorkspaceRuntimeRef;
    TlW: new (repository: BareRepository, root: string, ref: BareGitWorkspaceRuntimeRef, resolve: ResolveRuntimeContext) => GitExecutor;
    ZNu: new (repository: BareRepository, root: string, ref: BareGitWorkspaceRuntimeRef, resolve: ResolveRuntimeContext) => BareGitWorkspaceFilesystem;
    Z1t: new (workspacePath: string, fs: BareGitWorkspaceFilesystem, getThirdPartyExtensibilityEnabled?: () => boolean) => BareGitExtensibilityService;
    Rxj: new (ctx: Context, settings: () => { importThirdPartyPlugins?: boolean }, watcher: FileWatcher | undefined, plugins: PluginsService) => PluginRulesAndSkillsService;
    Px0: new (services: readonly CursorRulesService[], getAgentStoreSkillsContext?: () => AgentStoreSkillsContext) => MergedCursorRulesService;
    $3f: AgentStoreSkillsContext;
    NB: new (services: readonly AgentSkillsService[], getDisabledManagedSkillPaths?: () => readonly string[] | Promise<readonly string[]>, getPromptSortContext?: () => SkillPromptSortContext) => AgentSkillsService;
    M10: new (services: readonly { workspacePath: string; service: CloudRulesService }[]) => CloudRulesService;
    _Ji: new (settings: () => { importThirdPartyPlugins?: boolean }, plugins: PluginsService) => SubagentsService;
    o_K: new (services: readonly SubagentsService[]) => SubagentsService;
    d2r: new (cursorRules: CursorRulesService, cloudRules: CloudRulesService | undefined, subagents: SubagentsService | undefined, repository: RepositoryProvider, grep: RequestContextGrepProvider, mcpState: McpStateAccessor, git: GitExecutor, workspacePaths: string[], options?: RequestContextOptions) => LocalRequestContextExecutor;
  }
}
declare module "./agent-exec.js" {
  interface AgentExecModule {
    X_3(skill: agent_v1_AgentSkill): boolean;
    tx6(skills: readonly agent_v1_AgentSkill[], options?: { preservePluginSkillContent?: boolean }): agent_v1_AgentSkill[];
  }
}

declare module "./local-exec.js" {
  interface LocalExecModule {
    bXp(state: McpState, options?: { internalBrowserProvidersOnly?: boolean; inputSchemaJson?: boolean }): Pick<import("./protobuf-generated.js").agent_v1_RequestContext, "tools" | "mcpInstructions">;
    a0x(state: McpState, options?: { alwaysExposeVirtualMcpAuthTool?: boolean; slimDescriptors?: boolean; inputSchemaJson?: boolean }): import("./protobuf-generated.js").agent_v1_McpMetaToolOptions;
  }
}
