import type { Context } from "./context.js";
import type { JsonValue } from "./protobuf-runtime.js";
import type { ListableResourceAccessor } from "./agent-exec.js";
import type { TerminalExecutor } from "./shell.js";
import type { McpLease } from "./mcp-services.js";
export type HookStep = "beforeShellExecution" | "beforeMCPExecution" | "afterShellExecution" | "afterMCPExecution" | "beforeReadFile" | "afterFileEdit" | "beforeTabFileRead" | "afterTabFileEdit" | "stop" | "beforeSubmitPrompt" | "afterAgentResponse" | "afterAgentThought" | "sessionStart" | "sessionEnd" | "preCompact" | "subagentStart" | "subagentStop" | "preToolUse" | "postToolUse" | "postToolUseFailure" | "workspaceOpen";
export type CommandHookPayloadTransport = "stdin" | "legacy";
export interface HookScriptCommon { matcher?: string; timeout?: number; loop_limit?: number | null; failClosed?: boolean; }
export type HookScript = HookScriptCommon & ({ type?: "command"; command: string } | { type: "prompt"; prompt: string; model?: string });
export interface HooksConfig { version: number; hooks: Partial<Record<HookStep, HookScript[]>>; }
export interface LoadedHooksConfig {
  errors: { source: string; message: string }[];
  enterpriseHooks?: HooksConfig;
  teamHooks?: HooksConfig;
  userHooks?: HooksConfig;
  projectHooks?: HooksConfig;
  claudeUserHooks?: HooksConfig;
  claudeProjectHooks?: HooksConfig;
  claudeProjectLocalHooks?: HooksConfig;
  configDirs?: { enterprise?: string; team?: string; user?: string; project?: string; claudeUser?: string; claudeProject?: string; claudeProjectLocal?: string };
  pluginHooks?: { config: HooksConfig; sourcePath?: string; pluginName?: string; installPath?: string }[];
}
export interface HooksConfigPaths {
  enterpriseConfigPath?: string;
  teamConfigPath?: string;
  userConfigPath?: string;
  projectConfigPath?: string;
  claudeUserConfigPath?: string;
  claudeProjectConfigPath?: string;
  claudeProjectLocalConfigPath?: string;
}
export interface HookFileReader {
  readFile(path: string): Promise<string | undefined>;
  exists(path: string): Promise<boolean>;
  pathContainsSymlink?(path: string, trustedRoot: string): Promise<boolean>;
}
export interface HooksConfigLoader { load(options?: { loadProjectHooks?: boolean }): Promise<LoadedHooksConfig>; }
export interface HooksConfigLease {
  getConfig(): LoadedHooksConfig;
  hasHookForStep(step: HookStep): boolean;
  getConfiguredSteps(): Set<HookStep>;
  setConfig(config: LoadedHooksConfig): void;
}
/** Hook payloads are an intentionally extensible JSON wire object. */
export interface HookRequest { [field: string]: JsonValue | undefined; }
export interface HookResponse {
  permission?: "allow" | "deny" | "ask";
  continue?: boolean;
  user_message?: string;
  agent_message?: string;
  additional_context?: string;
  followup_message?: string;
  reason?: string;
  env?: Record<string, string>;
  updated_input?: { [field: string]: JsonValue };
}
export interface PromptHookClient {
  evaluatePromptHook(ctx: Context, params: { prompt: string; hookInputJson: JsonValue; modelName?: string }): Promise<{ ok: boolean; reason?: string }>;
}
export interface HooksExecutor {
  executeHookForStep(step: HookStep, request: HookRequest, options?: { cwd?: string; env?: NodeJS.ProcessEnv }): Promise<HookResponse | undefined>;
  updateConfig(config: LoadedHooksConfig): void;
  addConfigReadyPromise(promise: Promise<unknown>): void;
  hasHooksForStep(step: HookStep): boolean;
}
export interface GlobalHookContext { cursor_version: string; user_email: string | null; }
export interface BaseHookRequest { conversation_id: string; generation_id: string; model: string; }
export interface HookExecutionEvent {
  hookStep: HookStep;
  hookSource: string;
  hookType: "command" | "prompt";
  status: string;
  latencyMs: number;
  payloadSizeBytes: number;
  errorClass?: string;
  failClosed?: boolean;
  exitCode?: number;
  transportMode?: string;
}
export interface CliHooksOptions {
  enableClaudeNestedHookSpecificOutputCompatibility?: boolean;
  commandHookPayloadTransport?: CommandHookPayloadTransport;
  runtimeHooks?: HooksConfig;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../hooks/dist/index.js": { S6(useStdinTransport: boolean | undefined): CommandHookPayloadTransport; _E: { [Step in HookStep]: Step } };
  }
}
declare module "./vendor.js" {
  interface SetupVendorBindings {
    CliHooksExecutor: new (config: LoadedHooksConfig, workspacePath: string, context: GlobalHookContext, terminal: TerminalExecutor, promptHookClient?: PromptHookClient, ready?: Promise<unknown>, onExecution?: (event: HookExecutionEvent) => void, options?: CliHooksOptions) => HooksExecutor;
    HooksConfigLoader: { new (reader: HookFileReader, paths: HooksConfigPaths, logger?: { warn(message: string): void; info(message: string): void }): HooksConfigLoader; getConfiguredSteps(config: LoadedHooksConfig): Set<HookStep> };
    NodeFileReader: new () => HookFileReader;
    MutableHooksConfigLeaseImpl: new (config: LoadedHooksConfig) => HooksConfigLease;
    getCloudManagedTeamHooksPath(homeDir: string): string;
    getHooksConfigPaths(projectDir: string): HooksConfigPaths;
    hasAnyHooks(config: LoadedHooksConfig): boolean;
    ListableHooksResourceAccessor: new (inner: ListableResourceAccessor, hooks: HooksExecutor, extractBase: (ctx: Context) => BaseHookRequest, mcpLease?: McpLease, additionalContext?: Promise<string | undefined>, teamHooksReady?: Promise<unknown>, config?: HooksConfigLease) => ListableResourceAccessor;
  }
}
