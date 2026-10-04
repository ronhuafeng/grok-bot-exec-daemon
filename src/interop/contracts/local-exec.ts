import type { Context } from "./context.js";
/** Observed ../local-exec/dist/git-executor.js contract. */
export interface GitExecOptions { caller?: string; timeout?: number; }
export interface GitExecResult { exitCode: number; stdout: string; stderr: string; }
export interface GitExecutor {
  exec(ctx: Context, cwd: string, args: readonly string[], options?: GitExecOptions): Promise<GitExecResult>;
}
export type ParsedDiffChange =
  | { type: "normal"; normal: true; ln1: number; ln2: number; content: string }
  | { type: "add"; add: true; ln: number; content: string }
  | { type: "del"; del: true; ln: number; content: string };
export interface ParsedDiffChunk {
  content: string; changes: ParsedDiffChange[];
  oldStart: number; oldLines: number; newStart: number; newLines: number;
}
export interface ParsedFileDiff {
  chunks: ParsedDiffChunk[]; deletions: number; additions: number;
  from?: string; to?: string; new?: boolean; deleted?: boolean;
  newMode?: string; oldMode?: string; index?: string[];
}
export interface LocalExecModule {
  FRC(input: unknown): ParsedFileDiff[];
  Zu2(): { registered: true } | { registered: false; reason: string };
  c6e: "/opt/cursor/logs/";
  OhU: "/opt/cursor/recording-staging/";
  ky5(ctx: Context, gitExecutor: GitExecutor, startPath: string): Promise<string | null>;
  xK7: new () => GitExecutor;
}
export interface SecretRedactorOptions {
  redactJwtIssuer?: (issuer: string) => boolean;
  expandStructuredValues?: boolean;
}
export interface SecretRedactor {
  hasSecrets(): boolean;
  getTrailingSecretPrefixLength(text: string): number;
  startOfMatchAcross(text: string, boundary: number): number;
  redactString(text: string): { redactedText: string; wasRedacted: boolean };
  redactBytes(bytes: Uint8Array): { redactedBytes: Uint8Array; wasRedacted: boolean };
}
export interface SecretsExecModule {
  pE: new (secretNames: readonly string[], secretAccessor: (name: string) => string | readonly string[] | undefined, options?: SecretRedactorOptions) => SecretRedactor;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../local-exec/dist/index.js": LocalExecModule;
    "../secrets-exec/dist/index.js": SecretsExecModule;
  }
}
