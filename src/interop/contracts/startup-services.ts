/** Startup-only ports reconstructed from the preserved local-exec class bodies.
 * These constructor signatures admit the daemon's supported dependency subset;
 * they do not claim to model uncalled IDE integrations or optional subsystems. */
import type { Context } from "./context.js";
import type { Executor, ListableResourceAccessor, RegistryResourceAccessor } from "./agent-exec.js";
import type { GitExecutor } from "./local-exec.js";
import type { ComputerUseExecutor, InputEventLogger } from "./computer-use.js";
import type { McpLease } from "./mcp-services.js";
import type { McpStateAccessor, CursorRulesService, AgentSkillsService, CloudRulesService, SubagentsService, RepositoryProvider, RequestContextOptions, RequestContextExecutor, RequestContextGrepProvider, DisposeSubscription } from "./request-context.js";
import type { SandboxPolicy, ShellCoreArgs, ShellCoreExecutor, TerminalExecutor } from "./shell.js";
import type { CanvasDiagnosticsProvider } from "./artifact-canvas.js";
import type { agent_v1_RecordScreenArgs, agent_v1_RecordScreenResult, agent_v1_HookAdditionalContext, agent_v1_MountedAgentStore } from "./protobuf-generated.js";

export interface FileChangeMetadata { toolCallId?: string; }
export interface FileChange { path: string; before?: string; after?: string; metadata?: FileChangeMetadata; }
export interface FileChangeTracker {
  subscribe(listener: (change: FileChange | undefined) => void): DisposeSubscription;
  trackChange(path: string, before: string | undefined, after: string | undefined, metadata?: FileChangeMetadata): Promise<void>;
  getChanges(): FileChange[];
  getChange(path: string): FileChange | undefined;
  hasChange(path: string): boolean;
  accept(path: string): void;
  acceptAll(): void;
  reject(path: string): Promise<void>;
  rejectAll(): Promise<void>;
  clear(): void;
  readonly size: number;
  dispose(): void;
}
export interface IgnoreService {
  isIgnoredByAny(filePath: string): Promise<boolean>;
  isGitIgnored(filePath: string): Promise<boolean>;
  isCursorIgnored(filePath: string): Promise<boolean>;
  isRepoBlocked(filePath: string): Promise<boolean>;
  listCursorIgnoreFilesByRoot(root: string): Promise<string[]>;
  getCursorIgnoreMapping(): Promise<Record<string, string[]>>;
  getShellSandboxIgnoreMapping(): Promise<Record<string, string[]>>;
  getGitIgnoreMapping(): Promise<Record<string, string[]>>;
  getRepoBlockExcludeGlobs(rootDirectory: string): Promise<string[]>;
}
export interface NestedExtensibilityResult { rules: string[]; skills: string[]; markdown: string[]; agents: string[]; }
export interface NestedExtensibilityService { discover(ctx: Context): Promise<NestedExtensibilityResult>; }
/** All three retained rule services expose this concrete subscription method. */
export interface StartupCursorRulesService extends CursorRulesService {
  onDidChangeRules(callback: () => void): DisposeSubscription;
}
export interface AgentSkillsCursorRulesService extends StartupCursorRulesService, AgentSkillsService {
  onDidChangeSkills(callback: () => void): DisposeSubscription;
  reloadSkillRoots(): void;
}
export interface NoticeCursor { journalEpoch: string; seq: number; lastEventId: string; }
export interface ConflictJournalEvent {
  v: number; event_id: string; journal_epoch: string; seq: number; ts_ms: number; kind: string;
  store_id?: string; original_rel_path?: string; conflict_rel_path?: string;
  original_abs_path?: string; conflict_abs_path?: string; preserved_bytes?: number;
  scope_kind?: string; limit_bytes?: number; usage_bytes?: number;
}
export interface AgentStoreConflictJournalDrainer {
  readonly isEnabled: boolean;
  readonly journalPath: string;
  setIncludeQuotaNoticesOverride(enabled: boolean): void;
  drain(args?: { advance?: boolean; cursor?: NoticeCursor }): Promise<{ events: ConflictJournalEvent[]; nextCursor: NoticeCursor; gap: boolean; includeQuotaNotices: boolean }>;
  drainHookContexts(): Promise<agent_v1_HookAdditionalContext[]>;
}
/** The daemon intentionally supplies an allow-only implementation. Ignored inputs
 * are unknown because this port never inspects them; outputs remain concrete. */
export interface DaemonPermissionsPort {
  shouldBlockRead(filePath: string): Promise<false>;
  shouldBlockWrite(ctx: Context, filePath: string, newContents: string): Promise<false>;
  shouldBlockShellCommand(ctx: Context, command: string, options: unknown, policy?: SandboxPolicy): Promise<{ kind: "allow"; policy: SandboxPolicy }>;
  isShellCommandFullyAllowlisted(ctx: Context, command: string, options: unknown): Promise<boolean>;
  isMcpFullyAllowlisted(ctx: Context, options: unknown): Promise<boolean>;
  isWebFetchFullyAllowlisted(ctx: Context, options: unknown): Promise<boolean>;
  shouldEnforceShellInvariantBlocks(ctx: Context, options: unknown, policy?: SandboxPolicy): Promise<{ kind: "allow" }>;
  shouldBlockMcp(ctx: Context, args: unknown): Promise<false>;
  addToAllowList(ctx: Context, kind: unknown, value: unknown): Promise<void>;
  addToDenyList(ctx: Context, kind: unknown, value: unknown): Promise<void>;
}
export interface LspDiagnostic {
  message: unknown;
  severity?: number;
  range?: { start: { line: number; character: number }; end: { line: number; character: number } };
  source?: string;
  code?: string | number;
}
export interface DiagnosticsProvider {
  open(ctx: Context, uri: URL): Promise<void>;
  getDiagnostics(ctx: Context, uri: URL): Promise<LspDiagnostic[]>;
}
export interface RecordScreenExecutor extends Executor<agent_v1_RecordScreenArgs, agent_v1_RecordScreenResult> {
  setOnRecordingStarted(callback: (logger: InputEventLogger) => void): void;
  setOnRecordingStopped(callback: () => void): void;
  dispose(): Promise<void>;
}
export interface PolishedRecordingRenderer {
  assertAvailable(): void;
  renderRecordingSession(options: { stagingSessionDir: string; fps?: number; outputVideoPath: string; includeBrandTag?: boolean }): Promise<void>;
}
export interface LocalResourceProviderOptions extends RequestContextOptions {
  pendingDecisionStore: { requestApproval(...unused: unknown[]): Promise<{ approved: boolean; reason?: string }> };
  fileChangeTracker: FileChangeTracker;
  gitExecutor: GitExecutor;
  ignoreService: IgnoreService;
  grepProvider: RequestContextGrepProvider;
  permissionsService: DaemonPermissionsPort;
  workspacePaths: string[];
  diagnosticsProvider: DiagnosticsProvider;
  getCanvasDiagnostics?: CanvasDiagnosticsProvider["getDiagnostics"];
  beginCanvasSave?: NonNullable<ReturnType<typeof import("../../runtime/canvasDiagnostics.js").setupExecDaemonCanvasDiagnostics>>["beginCanvasSave"];
  mcpLease: McpLease;
  mcpStateAccessor?: McpStateAccessor;
  ensureMcpServersLoaded?: (ctx: Context, identifiers: readonly string[], options?: { wait?: boolean }) => Promise<void>;
  cursorRulesService: CursorRulesService;
  cloudRulesService?: CloudRulesService;
  subagentsService?: SubagentsService;
  repositoryProvider: RepositoryProvider;
  sharedRequestContextExecutor?: RequestContextExecutor;
  shellManager?: undefined;
  _sandboxPolicyResolver?: undefined;
  _defaultSandboxPolicy?: SandboxPolicy;
  mcpFileOutputThresholdBytes?: number;
  terminalExecutor?: TerminalExecutor;
  computerUseExecutor?: ComputerUseExecutor;
  enableRecordScreen?: boolean;
  recordScreenArtifactsDir?: string;
  recordScreenDisplay?: string;
  polishedRecordingRenderer?: PolishedRecordingRenderer;
  registerRedactedReadExecutor?: boolean;
  shellCoreWrapper?: (executor: ShellCoreExecutor) => ShellCoreExecutor;
  shellExtraEnvProvider?: (ctx: Context, args: ShellCoreArgs) => NodeJS.ProcessEnv | undefined;
  getMountedAgentStores?: (ctx: Context) => Promise<agent_v1_MountedAgentStore[]>;
  agentStoreConflictDrainer?: AgentStoreConflictJournalDrainer;
}
export interface LocalResourceProvider extends RegistryResourceAccessor {
  getRecordScreenExecutor(): RecordScreenExecutor | undefined;
  getMcpExecutionPolicyDeps(): Pick<LocalResourceProviderOptions, "permissionsService"> & { pendingDecisionProvider: LocalResourceProviderOptions["pendingDecisionStore"] };
  dispose(): Promise<void>;
}
declare module "./local-exec.js" {
  interface LocalExecModule {
    $1H: new (workspacePath: string) => FileChangeTracker;
    E1e: new (git: GitExecutor, teamSettings: undefined, rootDirectories?: string[]) => IgnoreService;
    IK_: new (root: string, git: GitExecutor, userHomeDirectory: string, thirdPartyEnabled: () => boolean) => NestedExtensibilityService;
    KOV: new (ctx: Context, git: GitExecutor, root: string, loadNested: boolean, thirdPartyEnabled: () => boolean, watcher: undefined, ignoreService?: IgnoreService, initial?: Promise<NestedExtensibilityResult>) => StartupCursorRulesService;
    EVC: new (ctx: Context, workspacePaths: string[], userHomeDirectory: string, git: GitExecutor, loadNested: boolean, watcher: undefined, thirdPartyEnabled?: () => boolean, builtinSync?: Promise<void>, surface?: string, initial?: Promise<NestedExtensibilityResult>[], getStoreRoots?: () => readonly string[]) => AgentSkillsCursorRulesService;
    TCT: new (ctx: Context, root: string, watcher: undefined) => CloudRulesService;
    VzO: new (workspacePath: string, thirdPartyEnabled?: () => boolean) => SubagentsService;
    tou: new (options: { enabled: boolean; includeQuotaNotices?: boolean | (() => boolean); eventsPath?: string; cursorPath?: string }) => AgentStoreConflictJournalDrainer;
    DvK: new (options: LocalResourceProviderOptions) => LocalResourceProvider;
    yJf: new (inner: ListableResourceAccessor, drainer: AgentStoreConflictJournalDrainer) => ListableResourceAccessor;
  }
}
