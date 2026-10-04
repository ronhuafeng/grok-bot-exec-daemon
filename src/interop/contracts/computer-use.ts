import type { Context } from "./context.js";
import type { Executor } from "./agent-exec.js";
import type { agent_v1_ComputerUseArgs, agent_v1_ComputerUseResult } from "./protobuf-generated.js";
export interface Resolution { display: { width: number; height: number }; api: { width: number; height: number }; }
export interface DisplayInfo { width: number; height: number; refreshRate?: number; }
export interface InputEventLogger { logEvent(action: agent_v1_ComputerUseArgs["actions"][number], startTime: number, endTime: number): void; }
export interface ComputerUseExecutor extends Executor<agent_v1_ComputerUseArgs, agent_v1_ComputerUseResult> {}
/** The preserved Mac class defines only its execution methods; these X11
 * capability members are absent on the built-in instances constructed by setup. */
export interface MacRemoteComputerUseExecutor extends ComputerUseExecutor {
  readonly setInputEventLogger?: never;
  readonly releaseHeldInput?: never;
}
export type BuiltinComputerUseExecutor = MacRemoteComputerUseExecutor | X11ComputerUseExecutor;
export interface X11ComputerUseExecutor extends ComputerUseExecutor {
  setInputEventLogger(logger: InputEventLogger | undefined): void;
  releaseHeldInput(): Promise<void>;
}
export interface LazyX11ComputerUseExecutor extends X11ComputerUseExecutor { prime(ctx: Context): void; }
export interface DesktopLeaseOwner { kind: "human" | "agent"; actorId: string; expiresAtUnixMs: number; }
export interface DesktopLeaseResult { status: "ok" | "busy" | "invalid"; owner: DesktopLeaseOwner | undefined; message: string; }
export interface DesktopLeaseStore {
  getOwner(): DesktopLeaseOwner | undefined;
  acquire(actorId: string): Promise<DesktopLeaseResult>;
  release(actorId: string): DesktopLeaseResult;
  run<T>(ctx: Context, actorId: string | undefined, fn: (ctx: Context) => Promise<T>): Promise<T>;
}
declare module "./local-exec.js" {
  interface LocalExecModule {
    PDU(): boolean;
    JtE(display: string, timeoutMs?: number): Promise<void>;
    L_j(display: string): { display: DisplayInfo; resolution: Resolution; resolutionString: string };
    Sap: { isInstalled(): boolean };
    iTV: new (options: { displayNum: number; display: string; resolution: Resolution; screenshotDelayMs?: number }, screenshotDirectory?: string) => X11ComputerUseExecutor;
    c6U(display: string): number;
    WZL(displayWidth: number, displayHeight: number, apiWidth?: number, apiHeight?: number): Resolution;
    p$J: new () => MacRemoteComputerUseExecutor;
    Wy$: new (options: { display: string; readyTimeoutMs?: number; initialize?: (display: string, readyTimeoutMs: number) => Promise<X11ComputerUseExecutor> }) => LazyX11ComputerUseExecutor;
    pvL(override?: string): string;
    eI$: new (options?: { enforce?: boolean; nowMs?: () => number; humanTtlMs?: number; agentTtlMs?: number; releaseHeldInput?: () => Promise<void> }) => DesktopLeaseStore;
    f8t(store: DesktopLeaseStore, inner: ComputerUseExecutor): ComputerUseExecutor;
  }
}
