/** Compile-time proofs for reconstructed boundary relationships.
 * These do not load the preserved bundle or native addons. */
import type { Context, ContextKey, LoggerBackend } from "../src/interop/contracts/context.js";
import type { Resource, ResourceAccessor } from "../src/interop/contracts/agent-exec.js";
import type { MessageInit } from "../src/interop/contracts/protobuf-runtime.js";
import type { agent_v1_RequestContextResult, agent_v1_RequestContext, agent_v1_ShellArgs, agent_v1_ShellStream, ExecServiceDescriptor } from "../src/interop/contracts/protobuf-generated.js";
import type { MethodInput, MethodOutput } from "../src/interop/contracts/connect.js";
import type { RawCloudPluginManifest } from "../src/interop/contracts/cursor-plugins.js";
import type { JsonValue } from "../src/interop/contracts/protobuf-runtime.js";

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assignable<A, B> = A extends B ? true : false;
type Not<T extends boolean> = T extends true ? false : true;

export type RequestResultIsDiscriminated = Expect<Equal<agent_v1_RequestContextResult["result"]["case"], "success" | "error" | "rejected" | undefined>>;
export type ContextRulesAreMessages = Expect<Assignable<agent_v1_RequestContext["rules"][number], { fullPath: string }>>;
export type OneofInitializersKeepTheirCase = Expect<Not<Assignable<{ result: { case: "invalid"; value: {} } }, MessageInit<agent_v1_RequestContextResult>>>>;
export type RawPluginInputRemainsJson = Expect<Equal<RawCloudPluginManifest, JsonValue>>;
export type ReadFileIsServerStreaming = Expect<Equal<ExecServiceDescriptor["methods"]["readFile"]["kind"], 1>>;
export type ReadFileInputIsNotIterable = Expect<Not<Assignable<MethodInput<ExecServiceDescriptor["methods"]["readFile"]>, AsyncIterable<unknown>>>>;
export type ReadFileOutputIsIterable = Expect<Assignable<MethodOutput<ExecServiceDescriptor["methods"]["readFile"]>, AsyncIterable<object>>>;

export function contextKeyProof(ctx: Context, key: ContextKey<LoggerBackend>): LoggerBackend {
  return ctx.get(key);
}
export function resourceResultProof(accessor: ResourceAccessor, resource: Resource<{ execute(ctx: Context, args: agent_v1_ShellArgs): AsyncIterable<agent_v1_ShellStream> }>) {
  return accessor.get(resource);
}
