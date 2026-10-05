import type { Writable } from "node:stream";
import type { Context } from "./context.js";
import type { JsonValue } from "./protobuf-runtime.js";
import type { agent_v1_OutputLocation } from "./protobuf-generated.js";
export interface NetworkPolicy {
  version: 1;
  default?: "allow" | "deny";
  allow?: string[];
  deny?: string[];
  logging?: { decisionLogPath?: string; logFormat?: "jsonl" };
}
export interface SandboxCommon { debugOutputDir?: string; captureDenies?: boolean; enableSharedBuildCache?: boolean; }
export interface SandboxedCommon extends SandboxCommon {
  networkAccess?: boolean;
  networkPolicy?: NetworkPolicy;
  networkPolicyStrict?: boolean;
  additionalReadonlyPaths?: string[];
  readBoundary?: "system" | "workspace";
  additionalReadPaths?: string[];
  disableTmpWrite?: boolean;
}
export type SandboxPolicy = (SandboxCommon & { type: "insecure_none" }) | (SandboxedCommon & { type: "workspace_readonly" }) | (SandboxedCommon & { type: "workspace_readwrite"; additionalReadwritePaths?: string[] });
/** Exact JSON input fields accepted by the preserved private validator.
 * It only checks network allow/deny are arrays; the converter filters their items. */
export interface ValidatedNetworkPolicyJson {
  default?: "allow" | "deny";
  allow?: JsonValue[];
  deny?: JsonValue[];
  logging?: JsonValue;
  version?: JsonValue;
}
export interface PartialSandboxPolicyJson extends Omit<SandboxedCommon, "networkPolicy"> {
  type?: SandboxPolicy["type"];
  additionalReadwritePaths?: string[];
  networkPolicy?: ValidatedNetworkPolicyJson | JsonValue[];
}
/** JSON-array roots also pass the original validator and parse as default policies. */
export type ValidatedSandboxPolicyInput = PartialSandboxPolicyJson | JsonValue[];
export interface SandboxPolicyConfig { perUser?: SandboxPolicy; perRepo?: SandboxPolicy; teamAdmin?: SandboxPolicy; }
export interface SandboxDenyEvent {
  raw: string;
  /** The retained macOS log parser copies this JSON member without validation. */
  timestamp?: unknown;
  processName?: string; pid?: number; decision?: string; decisionCode?: number;
  operation?: string; target?: string; duplicateCount?: number;
  relationship?: string;
}
export type TerminalEvent =
  | { type: "stdout" | "stderr"; data: string | Buffer }
  | { type: "exit"; code: number | null; data: string; aborted: boolean }
  | { type: "stdin_ready"; stdin: Writable | undefined; pid: number | undefined }
  | { type: "sandbox_denies"; events: SandboxDenyEvent[] }
  | { type: "suppressed_output" };
export interface TerminalExecuteOptions {
  signal?: AbortSignal;
  workingDirectory?: string;
  env?: NodeJS.ProcessEnv;
  sandboxPolicy?: SandboxPolicyConfig;
  sandboxWorkspaceRoot?: string;
  pipeStdin?: boolean;
  bufferOutputEvents?: boolean;
  outputLimiterOptions?: { flushIntervalMs?: number; maxBufferedBytes?: number };
}
export interface TerminalExecutor {
  getCwd(): Promise<string>;
  clone(workingDirectory?: string): TerminalExecutor;
  execute(ctx: Context, command: string, options?: TerminalExecuteOptions): AsyncIterable<TerminalEvent>;
}
export interface ShellCoreArgs {
  command: string;
  conversationId?: string;
  requestId?: string;
  toolCallId?: string;
  workingDirectory?: string;
  fileOutputThresholdBytes?: bigint | number;
  signal?: AbortSignal;
  sandboxPolicy?: SandboxPolicyConfig;
  requestScopedEnv?: NodeJS.ProcessEnv;
  askpassConfig?: { helperPath: string; socketPath: string; secret: string };
  pipeStdin?: boolean;
  env?: NodeJS.ProcessEnv;
}
export type ShellCoreEvent = Exclude<TerminalEvent, { type: "exit" } | { type: "suppressed_output" } | { type: "stdout" | "stderr" }>
  | { type: "stdout" | "stderr"; data: string }
  | { type: "stdout_trimmed" | "stderr_trimmed" }
  | { type: "start"; sandboxed: boolean }
  | { type: "exit"; code: number | null; aborted: boolean; outputLocation?: agent_v1_OutputLocation; localExecutionTimeMs: number };
export interface ShellCoreExecutor {
  execute(ctx: Context, args: ShellCoreArgs): AsyncIterable<ShellCoreEvent>;
  getCwd(conversationId?: string): Promise<string>;
  getWorkspacePath(): string;
}
export interface ShellExecModule {
  J(path: string): void;
  Ko(): string;
  St(options: { sandboxBinaryPath?: string }): void;
  Fn(options?: { userTerminalHint?: string }): TerminalExecutor;
  fi(options?: { shell?: string; shellArgs?: string[] }): TerminalExecutor;
  K3(policy?: SandboxPolicyConfig, options?: { cwd?: string; ctx?: Context }): boolean;
  _B(policy: NetworkPolicy | undefined): boolean;
  T6(): NetworkPolicy & { default: "allow" };
  Po(): NetworkPolicy & { default: "deny" };
  fZ(...sources: (NetworkPolicy | undefined)[]): NetworkPolicy | undefined;
  s9(...sources: (readonly string[] | undefined)[]): string[];
  /** This converter does not validate arbitrary JSON. */
  $6(json: ValidatedSandboxPolicyInput): SandboxPolicy;
  l7(policy: SandboxPolicy, baseDir: string): SandboxPolicy;
  G6(userTerminalHint?: string): string;
  BM: SandboxPolicyConfig;
}
declare module "../modules.js" { interface ExternalModules { "../shell-exec/dist/index.js": ShellExecModule; } }
declare module "./local-exec.js" {
  interface SecretsExecModule {
    sR: new (inner: ShellCoreExecutor, lazySecretReader: () => import("./local-exec.js").SecretRedactor | undefined) => ShellCoreExecutor;
    DA: new (inner: import("./agent-exec.js").ListableResourceAccessor, lazySecretReader: () => import("./local-exec.js").SecretRedactor | undefined, redactedResources: ReadonlySet<symbol>) => import("./agent-exec.js").ListableResourceAccessor;
  }
}
