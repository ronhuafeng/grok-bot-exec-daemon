/** Retained @lydell/node-pty Linux spawn contract; no native addon is loaded here. */
export interface PtyDisposable { dispose(): void; }
export interface PtyExit { exitCode: number; signal?: number; }
export interface Pty {
  readonly pid: number;
  readonly cols: number;
  readonly rows: number;
  readonly process: string;
  onData(listener: (data: string | Buffer) => void): PtyDisposable;
  onExit(listener: (exit: PtyExit) => void): PtyDisposable;
  write(data: string | Buffer): void;
  resize(columns: number, rows: number): void;
  kill(signal?: string): void;
  pause(): void;
  resume(): void;
}
export interface PtySpawnOptions {
  helperPath: string;
  name?: string;
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  encoding?: string | null;
  uid?: number;
  gid?: number;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../../node_modules/.pnpm/@lydell+node-pty@1.1.0_patch_hash=8cc7c6b3b59e47c0436b0f2bbb89cec1ced0f8ac0beadc41a2d07016bef0ea46/node_modules/@lydell/node-pty/index.js": { cH(file: string, args: string[], options: PtySpawnOptions): Pty };
  }
}
