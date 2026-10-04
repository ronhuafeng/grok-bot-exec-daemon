import type { Context, ContextKey } from "./context.js";
import type {
  agent_v1_ExecServerMessage, agent_v1_ExecClientMessage, agent_v1_ExecClientControlMessage,
  agent_v1_ExecServerControlMessage, agent_v1_ShellArgs, agent_v1_ShellStream,
  agent_v1_HookAdditionalContext,
} from "./protobuf-generated.js";
export interface ExecOptions {
  execId?: string;
  machineId?: string;
  hookContextCollector?: agent_v1_HookAdditionalContext[];
  deliverAgentStoreConflictNotices?: boolean;
}
export interface Executor<Args, Result> { execute(ctx: Context, args: Args, options?: ExecOptions): Promise<Result>; }
export interface StreamExecutor<Args, Item> { execute(ctx: Context, args: Args, options?: ExecOptions): AsyncIterable<Item>; }
export type ShellStreamExecutor = StreamExecutor<agent_v1_ShellArgs, agent_v1_ShellStream>;
export interface RemoteExecManager {
  createExecInstance(ctx: Context, message: (id: number) => agent_v1_ExecServerMessage): AsyncIterable<agent_v1_ExecClientMessage>;
}
export interface ControlledExecHandler {
  handle(ctx: Context, message: agent_v1_ExecServerMessage): AsyncIterable<agent_v1_ExecClientMessage> | undefined;
}
export interface ControlledExecManager {
  register(handler: ControlledExecHandler): void;
  handleControlMessage(message: agent_v1_ExecServerControlMessage): void;
  handle(ctx: Context, message: agent_v1_ExecServerMessage): AsyncIterable<agent_v1_ExecClientMessage | agent_v1_ExecClientControlMessage>;
}
/** Resource identity and generic relation come from createResource's actual methods. */
export interface Resource<T> {
  readonly name: string;
  readonly symbol: symbol;
  remoteImplementation(manager: RemoteExecManager): T;
  registerControlledImplementation(implementation: T, manager: ControlledExecManager): void;
}
export interface ResourceAccessor { get<T>(resource: Resource<T>): T | undefined; }
/** entries() is genuinely heterogeneous; its values must be narrowed by resource identity. */
export type ResourceEntry = readonly [Resource<unknown>, unknown];
export interface ListableResourceAccessor extends ResourceAccessor { entries(): Iterable<ResourceEntry>; }
export interface RegistryResourceAccessor extends ListableResourceAccessor { register<T>(resource: Resource<T>, implementation: NoInfer<T>): void; }
export interface AgentExecModule {
  S5q: "x-cursor-exec-conversation-id";
  sMm: "x-cursor-exec-request-id";
  LXI: "x-cursor-exec-browser-operation-source";
  Kwv: { readonly toolCall: "tool_call" };
  FmW: ContextKey<string | undefined>;
  dxK: ContextKey<string | undefined>;
  $mb: ContextKey<"tool_call" | undefined>;
  OIF: "x-cursor-hook-conversation-id";
  TpB: "x-cursor-hook-generation-id";
  AnR: "x-cursor-hook-model";
  s0I: "x-cursor-hook-workspace-roots";
  WWy: ContextKey<string | undefined>;
  JT2: ContextKey<string | undefined>;
  dBo: ContextKey<string | undefined>;
  IjH: ContextKey<string[] | undefined>;
  wve: Resource<ShellStreamExecutor>;
  ha6: new () => RegistryResourceAccessor;
  n6O: {
    new (options?: { includeGitStderrInThrows?: boolean | (() => boolean) }): ControlledExecManager;
    fromResources(resources: ListableResourceAccessor, options?: { includeGitStderrInThrows?: boolean | (() => boolean) }): ControlledExecManager;
  };
}
declare module "../modules.js" {
  interface ExternalModules { "../agent-exec/dist/index.js": AgentExecModule; }
}
