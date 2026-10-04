import type { ProtoMessage } from "./protobuf-runtime.js";
/** Retained @connectrpc/connect 1.6.1 Code and ConnectError surfaces. */
export declare enum ConnectCode {
  Canceled = 1, Unknown = 2, InvalidArgument = 3, DeadlineExceeded = 4,
  NotFound = 5, AlreadyExists = 6, PermissionDenied = 7, ResourceExhausted = 8,
  FailedPrecondition = 9, Aborted = 10, OutOfRange = 11, Unimplemented = 12,
  Internal = 13, Unavailable = 14, DataLoss = 15, Unauthenticated = 16,
}
export declare class ConnectError extends Error {
  constructor(message: string, code?: ConnectCode, metadata?: ConstructorParameters<typeof Headers>[0], outgoingDetails?: ProtoMessage[], cause?: unknown);
  readonly rawMessage: string;
  readonly code: ConnectCode;
  readonly metadata: Headers;
  readonly details: (ProtoMessage | { type: string; value: Uint8Array })[];
  readonly cause: unknown;
  static from(reason: unknown, code?: ConnectCode): ConnectError;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/code.js": { C: typeof ConnectCode };
    "../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/connect-error.js": { T: typeof ConnectError };
  }
}

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Context } from "./context.js";
import type { MessageInit } from "./protobuf-runtime.js";
export interface HandlerContext {
  readonly requestHeader: Headers;
  readonly responseHeader: Headers;
  readonly responseTrailer: Headers;
  readonly signal: AbortSignal;
  readonly protocolName: string;
  readonly requestMethod: string;
  readonly url: string;
}
export interface ProtoConstructor<T extends ProtoMessage = ProtoMessage> {
  new (): T;
  readonly typeName: string;
}
export interface MethodDescription {
  name: string;
  I: ProtoConstructor;
  O: ProtoConstructor;
  kind: 0 | 1 | 2 | 3;
}
export interface ServiceDescription { typeName: string; methods: Record<string, MethodDescription>; }
export type MethodInput<M extends MethodDescription> = M["kind"] extends 2 | 3 ? AsyncIterable<InstanceType<M["I"]>> : InstanceType<M["I"]>;
export type MethodOutput<M extends MethodDescription> = M["kind"] extends 1 | 3 ? AsyncIterable<MessageInit<InstanceType<M["O"]>>> : MessageInit<InstanceType<M["O"]>>;
export type ServiceImplementation<S extends ServiceDescription> = {
  [K in keyof S["methods"]]?: (input: MethodInput<S["methods"][K]>, context: HandlerContext) => MethodOutput<S["methods"][K]> | Promise<MethodOutput<S["methods"][K]>>;
};
export type ContextExtractedImplementation<I> = {
  [K in keyof I]: I[K] extends (ctx: Context, input: infer Input, ...rest: infer _Rest) => infer Result
    ? (input: Input, context: HandlerContext) => Result : I[K];
};
export interface ContextExtractionOptions {
  extractTraceHeaders?: boolean;
  extractContext?: (headers: Headers, context: HandlerContext) => Context;
}
export interface RpcRequest {
  readonly header: Headers;
  readonly signal: AbortSignal;
  readonly stream: boolean;
  readonly message: ProtoMessage | AsyncIterable<ProtoMessage>;
}
export interface RpcResponse {
  readonly header: Headers;
  readonly trailer: Headers;
  readonly stream: boolean;
  readonly message: ProtoMessage | AsyncIterable<ProtoMessage>;
}
export type RpcHandler = (request: RpcRequest) => Promise<RpcResponse>;
export type Interceptor = (next: RpcHandler) => RpcHandler;
export interface Compression {
  name: string;
  compress(data: Uint8Array): Promise<Uint8Array>;
  decompress(data: Uint8Array, readMaxBytes: number): Promise<Uint8Array>;
}
export interface UniversalServerRequest {
  httpVersion: string;
  url: string;
  method: string;
  header: Headers;
  body: AsyncIterable<Uint8Array>;
  signal: AbortSignal;
}
export interface UniversalServerResponse {
  status: number;
  header?: Headers;
  body?: AsyncIterable<Uint8Array>;
  trailer?: Headers;
}
export interface UniversalHandler {
  (request: UniversalServerRequest): Promise<UniversalServerResponse>;
  readonly requestPath: string;
}
export interface ConnectRouter {
  readonly handlers: UniversalHandler[];
  service<S extends ServiceDescription>(service: S, implementation: ServiceImplementation<S>): this;
}
export interface ConnectRouterOptions {
  acceptCompression?: readonly Compression[];
  requireConnectProtocolHeader?: boolean;
  interceptors?: readonly Interceptor[];
}
export interface ConnectNodeOptions extends ConnectRouterOptions { routes(router: ConnectRouter): void; }
export type ConnectNodeHandler = (request: IncomingMessage, response: ServerResponse) => void;
declare module "../modules.js" {
  interface ExternalModules {
    "../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/router.js": { k(options?: ConnectRouterOptions): ConnectRouter };
    "../../node_modules/.pnpm/@connectrpc+connect-node@1.6.1_patch_hash=5af812e0fa98d57d4268dc76827544673e2390a1c7193_62a3b3b4c8b16dc586e31982becdd4cf/node_modules/@connectrpc/connect-node/dist/esm/index.js": { aO(options: ConnectNodeOptions): ConnectNodeHandler; JY: Compression };
  }
}
