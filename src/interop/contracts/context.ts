/** Contracts reconstructed from ../context/dist/{core,logger}.js in the supplied bundle. */
export interface ContextKey<T> {
  readonly symbol: symbol;
  readonly defaultValue: T;
}
export type CancelContext = (reason?: unknown) => void;
export interface Context {
  readonly signal: AbortSignal;
  readonly canceled: boolean;
  readonly reason: unknown;
  readonly name?: string;
  get<T>(key: ContextKey<T>): T;
  with<T>(key: ContextKey<T>, value: NoInfer<T>): Context;
  withCancel(): [Context, CancelContext];
  withTimeout(ms: number): Context;
  withDeadline(deadline: Date): Context;
  withTimeoutAndCancel(ms: number): [Context, CancelContext];
  withName(name: string): Context;
  withDetached(): Context;
  getParent(): Context | undefined;
  getPath(): string[];
}
export interface ContextModule {
  cF<T>(name: symbol, defaultValue: T): ContextKey<T>;
  cF<T>(name: symbol): ContextKey<T | undefined>;
  q6(): Context;
}
export type LogLevel = "debug" | "info" | "warn" | "error";
/** Metadata is deliberately an arbitrary logging payload, never a service response. */
export type LogMetadata = Readonly<Record<string, unknown>>;
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  logger: string;
  context: Context;
  metadata?: LogMetadata;
  error?: unknown;
}
export interface LoggerBackend { log(ctx: Context, entry: LogEntry): void; }
export interface Logger {
  debug(ctx: Context, message: string, metadata?: LogMetadata): void;
  info(ctx: Context, message: string, metadata?: LogMetadata): void;
  warn(ctx: Context, message: string, metadata?: LogMetadata): void;
  error(ctx: Context, message: string, error?: unknown, metadata?: LogMetadata): void;
}
export interface LoggerModule {
  readonly _O: ContextKey<LoggerBackend>;
  h(name: string): Logger;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../context/dist/core.js": ContextModule;
    "../context/dist/logger.js": LoggerModule;
  }
}
