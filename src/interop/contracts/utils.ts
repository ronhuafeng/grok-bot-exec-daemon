/** Contracts reconstructed from the corresponding ../utils/dist factories. */

export interface ConcurrencyOptions { max?: number; }
export type SettledResult<T> = { status: "fulfilled"; value: T } | { status: "rejected"; reason: unknown };
export interface PromiseQueue<T> {
  enqueue(block: () => PromiseLike<T>): Promise<T>;
  enqueueList<K>(list: readonly K[], block: (item: K) => PromiseLike<T>): Promise<Map<K, T>>;
  close(): Promise<void>;
}
export interface PromiseExtrasModule {
  MU: new (message?: string) => Error;
  PH<K, V>(array: readonly K[], selector: (item: K) => PromiseLike<V>, options?: ConcurrencyOptions): Promise<V[]>;
  TJ: new <T>(options?: ConcurrencyOptions) => PromiseQueue<T>;
  cb(ms: number): Promise<void>;
  up<K, V>(array: readonly K[], selector: (item: K) => PromiseLike<V>, options?: ConcurrencyOptions): Promise<SettledResult<V>[]>;
  wj<T>(promise: PromiseLike<T>, timeoutMs: number, message?: string): Promise<T>;
  xb<K, V>(array: readonly K[], selector: (item: K) => PromiseLike<V>, options?: ConcurrencyOptions): Promise<Map<K, V>>;
}
export interface SpawnCwdDependencies {
  platform?: string;
  processCwd?: string;
  tmpdir?: string;
  readMountinfo?: () => string | undefined;
}
export interface SpawnCwdOptions { cwd?: string; shell?: boolean | string; }
export type SpawnCwdPlan<O extends SpawnCwdOptions> =
  | { command: string; args: string[]; options: O | undefined; hopped: false }
  | { command: "/bin/sh"; args: string[]; options: O & { cwd: string }; hopped: true; hopCwd: string };
export interface SpawnCwdFailureEvidence {
  cwd: string | undefined;
  env?: NodeJS.ProcessEnv;
  exitCode: number | null;
  stdoutBytes: number;
  stdoutPrefix: string | Uint8Array;
}
export interface SpawnCwdHopStdoutHold {
  readonly bytes: number;
  readonly stdoutPrefix: Buffer;
  readonly diverged: boolean;
  note(chunk: Uint8Array | string): Buffer | undefined;
  takeHeld(): Buffer | undefined;
}
export interface SafeSpawnCwdModule {
  $Y(cwd: string | undefined, env?: NodeJS.ProcessEnv): boolean;
  $f(cwd: string): boolean;
  A(cwd: string, deps?: SpawnCwdDependencies): boolean;
  Bn: "CURSOR_SPAWN_CWD_HOP";
  D1(deps?: SpawnCwdDependencies): string;
  Gq: "exec_daemon.spawn.cwd_hop_cd_failed";
  Gw: "cursor-fuse-cwd";
  KX(error: unknown, hopCwd: string): never;
  N6: string;
  Vn(cwd: string): Error & { code: "ENOENT" };
  Zv: new () => SpawnCwdHopStdoutHold;
  fK(error: unknown, cwd: string): error is Error & { code: "ENOENT" };
  iA(cwd: string): { cwdKind: "agent_store_fuse" | "fuse"; cwdHash: string };
  mM<O extends SpawnCwdOptions>(command: string, args: readonly string[], options?: O, deps?: SpawnCwdDependencies): SpawnCwdPlan<O>;
  qr(env?: NodeJS.ProcessEnv): boolean;
  wr<T>(result: T, hopCwd: string): WorkloadResult<T>;
  wz(args: SpawnCwdFailureEvidence): boolean;
  yo: "exec_daemon.spawn.cwd_hop";
}
export type WorkloadPlacement = Readonly<{ kind: "direct" }> | Readonly<{
  kind: "armed";
  workloadCgroupDir: string;
  executable: "/bin/sh";
  argumentPrefix: readonly string[];
}>;
/** Hopped promises are chained with then(), so promise-subclass extras such as
 * promisified execFile's .child are not guaranteed on the returned promise. */
export type WorkloadResult<Result> = Result extends Promise<infer Value> ? Promise<Value>
  : Result extends PromiseLike<infer Value> ? PromiseLike<Value> : Result;
/** argv/rest arguments and resolved process results preserve their relationships. */
export interface SpawnWorkload {
  <Rest extends unknown[], Result>(createProcess: (command: string, args: string[], ...rest: Rest) => Result, command: string, args: readonly string[], ...rest: Rest): WorkloadResult<Result>;
}
export interface WorkloadSpawnModule {
  D9: SpawnWorkload;
  NG(): WorkloadPlacement;
  ZH: "CURSOR_WORKLOAD_CGROUP";
}
export interface PathUtilsModule {
  BJ(realAbsolutePath: string, realRootDirectory: string): boolean;
  DN(path: string, basePath?: string): Promise<string | null>;
  PS: string;
  ZU(paths: { basePath: string; targetPath: string }): boolean;
  fl(params: { targetPath?: string; workspacePaths: readonly string[]; mainWorktreePath?: string }): boolean;
  o1(path: string, basePath?: string): string;
  oL(path: string): string;
  yn(path: string | undefined, homeDir: string): boolean;
}
export interface ContentFormat {
  encoding: string;
  lineEnding: "LF" | "CRLF";
  isBinaryFile: boolean;
  isImageFile: boolean;
  isVideoFile: boolean;
}
export interface EncodingModule {
  Yd: Map<string, string>;
  lt(data: string): number;
  Bh(file: string, content: string, workspaceRoot?: string, encodingHint?: string): Promise<{ lines: number; buffer: Buffer; format: ContentFormat }>;
  zV(file: string): Promise<ContentFormat>;
  d8(filePath: string): boolean;
  yR(file: string, encodingHint?: string): Promise<string>;
  x3(file: string, content: string, workspaceRoot?: string, encodingHint?: string): Promise<void>;
}
export interface WritableIterable<T> extends AsyncIterable<T, undefined, void> {
  write(value: T): Promise<void>;
  throw(error: unknown): void;
  close(): void;
}
export interface WorkspacePathsModule {
  O2: "agent-transcripts";
  Rv(homeDir: string, workspacePath: string): string;
  r_(path: string): string;
  sh(conversationId: string): string;
}
export interface RepoUrlModule {
  A9(pathname: string): string;
  Ol(pathname: string): string;
  UG(remoteUrl: string | undefined): Readonly<{ hostname: string; owner: string; name: string }> | undefined;
  Wo(repoUrl: string | URL, host: string): string;
  a8(remoteUrl: string): boolean;
  gT(repoUrl: string | URL): string;
  ve(host: string): boolean;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../utils/dist/promise-extras.js": PromiseExtrasModule;
    "../utils/dist/safe-spawn-cwd.js": SafeSpawnCwdModule;
    "../utils/dist/workload-spawn.js": WorkloadSpawnModule;
    "../utils/dist/path-utils.js": PathUtilsModule;
    "../utils/dist/encoding.js": EncodingModule;
    "../utils/dist/workspace-paths.js": WorkspacePathsModule;
    "../utils/dist/repo-url.js": RepoUrlModule;
    "../utils/dist/writable-iterable.js": { Jt<T>(): WritableIterable<T>; W2: new (message?: string) => Error };
    "../utils/dist/find-executable.js": { E(exe: string, args: string[], pathMustMatch?: RegExp): { cmd: string; args: string[] } };
    "../utils/dist/oom-score-adj.js": { A(pid: number | undefined): void; W(command: string, args: readonly string[]): { command: string; args: string[] } };
  }
}
