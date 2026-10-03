module.exports = {
/***/ "./src/server.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  mC: () => (/* binding */ startPtyHostWebSocketServer),
  UD: () => (/* binding */ startServer)
});

// UNUSED EXPORTS: createExecRequestContext, createManagedEnvironmentUpdatedHandler

// EXTERNAL MODULE: external "node:http"
var external_node_http_ = __webpack_require__("node:http");
// EXTERNAL MODULE: ../agent-exec/dist/index.js + 56 modules
var dist = __webpack_require__("../agent-exec/dist/index.js");
// EXTERNAL MODULE: ../context/dist/logger.js
var logger = __webpack_require__("../context/dist/logger.js");
// EXTERNAL MODULE: ../context/dist/core.js
var core = __webpack_require__("../context/dist/core.js");
// EXTERNAL MODULE: ../context/dist/otel.js
var otel = __webpack_require__("../context/dist/otel.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/context-values.js
var context_values = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/context-values.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/status.js
var trace_status = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/status.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js + 1 modules
var trace_api = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js
var span_kind = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js");
;// ../context-rpc/dist/index.js
/* unused harmony import specifier */ var SPAN_KEY;
/* unused harmony import specifier */ var getSpan;
/* unused harmony import specifier */ var withSpan;
/* unused harmony import specifier */ var createClient;
/* unused harmony import specifier */ var createContextValues;
/* unused harmony import specifier */ var SpanKind;
/* unused harmony import specifier */ var SpanStatusCode;
/* unused harmony import specifier */ var isSpanContextValid;
/* unused harmony import specifier */ var trace;
/**
 * Context-aware wrappers for Connect RPC clients and servers.
 * Automatically injects trace headers stored in @anysphere/context for clients,
 * and extracts trace context for servers.
 *
 * @example Client usage:
 * ```typescript
 * import { createContextPropagatingClient } from "@anysphere/context-rpc";
 * import { createContext } from "@anysphere/context";
 * import { MyService } from "./generated/service_connect";
 * import { createConnectTransport } from "@connectrpc/connect-node";
 *
 * const transport = createConnectTransport({ baseUrl: "https://api.example.com" });
 * const client = createContextPropagatingClient(MyService, transport);
 *
 * const ctx = createContext();
 * const response = await client.myMethod(ctx, { message: "hello" });
 * ```
 *
 * @example Server usage:
 * ```typescript
 * import { createContextExtractingService } from "@anysphere/context-rpc";
 * import { MyService } from "./generated/service_connect";
 * import type { ContextServiceImpl } from "@anysphere/context-rpc";
 *
 * const implementation: Partial<ContextServiceImpl<typeof MyService>> = {
 *   myMethod: async (ctx, request) => {
 *     // ctx is automatically created from incoming request headers
 *     // including revived span context for tracing
 *     return { response: "hello world" };
 *   }
 * };
 *
 * const wrappedImplementation = createContextExtractingService(implementation);
 * // Use wrappedImplementation with your Connect router
 * ```
 */



/**
 * ContextValues key carrying the caller's `Context` (holding the active RPC
 * span) across the Connect client boundary, so transport-level code that runs
 * inside the call (e.g. header injectors doing async work) can parent its
 * spans under the RPC span instead of emitting orphan roots.
 */
const callerContextKey = (0,context_values/* createContextKey */.n)(undefined, {
    description: "anysphere.callerContext",
});
/* ──────────────────────────────────────── helpers ─────────────────────────────────────── */
/**
 * Check if a value is an async iterable
 */
function isAsyncIterable(value) {
    return value !== null && typeof value === "object" && Symbol.asyncIterator in value;
}
function isPromiseLike(value) {
    return (value !== null &&
        typeof value === "object" &&
        "then" in value &&
        typeof value.then === "function");
}
function bridgeHandlerSignal({ ctx, handlerSignal }) {
    const [handlerCtx, cancel] = ctx.withCancel();
    const abort = () => cancel(handlerSignal.reason);
    handlerSignal.addEventListener("abort", abort, { once: true });
    if (handlerSignal.aborted) {
        abort();
    }
    return {
        ctx: handlerCtx,
        cleanup: () => handlerSignal.removeEventListener("abort", abort),
    };
}
/**
 * Wrap an async iterable to complete the span when iteration finishes.
 * The span is ended when:
 * - All elements have been consumed (iteration complete)
 * - An error occurs during iteration
 * - The iteration is aborted early (return/break)
 */
function wrapAsyncIterableWithSpan(iterable, span, cleanupSignalListener) {
    return {
        [Symbol.asyncIterator]() {
            const iterator = iterable[Symbol.asyncIterator]();
            let finished = false;
            const finish = (error) => {
                if (finished)
                    return;
                finished = true;
                if (error) {
                    span?.recordException(error instanceof Error ? error : new Error(String(error)));
                    span?.setStatus({
                        code: trace_status/* SpanStatusCode */.s.ERROR,
                        message: error instanceof Error ? error.message : "Stream failed",
                    });
                }
                else {
                    span?.setStatus({ code: trace_status/* SpanStatusCode */.s.OK });
                }
                span?.end();
                cleanupSignalListener?.();
            };
            return {
                async next() {
                    try {
                        const result = await iterator.next();
                        if (result.done) {
                            finish();
                        }
                        return result;
                    }
                    catch (error) {
                        finish(error);
                        throw error;
                    }
                },
                async return(value) {
                    // Called when consumer breaks/returns early
                    finish();
                    if (iterator.return) {
                        return iterator.return(value);
                    }
                    return { done: true, value: undefined };
                },
                async throw(error) {
                    finish(error);
                    if (iterator.throw) {
                        return iterator.throw(error);
                    }
                    throw error;
                },
            };
        },
    };
}
/**
 * Parse W3C traceparent header to extract span context information.
 * Format: version-trace_id-span_id-trace_flags
 */
function parseTraceparentHeader(traceparent) {
    const parts = traceparent.split("-");
    if (parts.length !== 4)
        return null;
    const [version, traceId, spanId, flags] = parts;
    // Only support version 00
    if (version !== "00")
        return null;
    // Validate format
    if (traceId.length !== 32 || spanId.length !== 16 || flags.length !== 2)
        return null;
    const traceFlags = parseInt(flags, 16);
    if (Number.isNaN(traceFlags))
        return null;
    return { traceId, spanId, traceFlags };
}
function remoteSpanContextFromHeaders(headers) {
    try {
        const traceparent = headers.get("traceparent") || headers.get("backend-traceparent");
        if (!traceparent)
            return undefined;
        const parsed = parseTraceparentHeader(traceparent);
        if (!parsed)
            return undefined;
        return {
            traceId: parsed.traceId,
            spanId: parsed.spanId,
            traceFlags: parsed.traceFlags,
            isRemote: true,
        };
    }
    catch {
        return undefined;
    }
}
/**
 * Marked local, as the caller's span is in this process: a sampler may record
 * every child of a remote parent whatever its flag, as the IDE extension
 * host's does, where a local parent's children keep it. A caller without a
 * valid span still sends all-zero trace headers, so those, like malformed
 * ids, leave `ctx` as it is.
 */
function withInProcessCallerSpan(ctx, headers) {
    const caller = remoteSpanContextFromHeaders(headers);
    if (caller === undefined || !isSpanContextValid(caller)) {
        return ctx;
    }
    return ctx.with(SPAN_KEY, trace.wrapSpanContext({ ...caller, isRemote: false }));
}
function extractTraceHeaders(ctx) {
    const headers = new Headers();
    try {
        // `getSpan` can throw if tracing is disabled – swallow errors.
        const span = getSpan(ctx);
        const spanContext = span?.spanContext?.();
        if (spanContext?.traceId && spanContext.spanId) {
            const traceFlags = spanContext.traceFlags ?? 0;
            const headerValue = `00-${spanContext.traceId}-${spanContext.spanId}-${traceFlags.toString(16).padStart(2, "0")}`;
            headers.set("traceparent", headerValue);
            // Our backend only respects backend-traceparent.
            headers.set("backend-traceparent", headerValue);
            if (spanContext.traceState) {
                const traceState = typeof spanContext.traceState.serialize === "function"
                    ? spanContext.traceState.serialize()
                    : String(spanContext.traceState);
                headers.set("tracestate", traceState);
            }
        }
    }
    catch {
        // Do not fail RPC calls because of tracing problems.
    }
    return headers;
}
function mergeHeaders(...sources) {
    const merged = new Headers();
    for (const src of sources) {
        if (!src)
            continue;
        if (src instanceof Headers) {
            src.forEach((v, k) => {
                merged.set(k, v);
            });
        }
        else {
            Object.entries(src).forEach(([k, v]) => {
                merged.set(k, v);
            });
        }
    }
    return merged;
}
/**
 * Internal helper shared by the two public APIs.
 */
function addContextPropagation(client, options) {
    const { injectTraceHeaders = true, extractHeaders } = options;
    return new Proxy(client, {
        get(target, prop) {
            const original = target[prop];
            if (typeof original !== "function")
                return original;
            return (ctx, input, callOptions = {}) => {
                // Create a span for the RPC call and add to context for propagation
                const spanCtx = withSpan(ctx.withName(`rpc.${String(prop)}`), {
                    kind: SpanKind.CLIENT,
                    attributes: {
                        "rpc.method": String(prop),
                        "rpc.system": "connect",
                    },
                });
                const span = getSpan(spanCtx);
                let cleanupSignalListener;
                try {
                    let contextHeaders;
                    if (injectTraceHeaders) {
                        contextHeaders = extractTraceHeaders(spanCtx);
                    }
                    if (extractHeaders) {
                        const extra = extractHeaders(spanCtx);
                        if (extra)
                            contextHeaders = mergeHeaders(contextHeaders, extra);
                    }
                    const finalHeaders = mergeHeaders(callOptions.headers, contextHeaders);
                    // Check config to determine if signal should be enabled
                    const { signal, cleanup } = options.enableAbortSignal === true
                        ? mergeContextSignal(spanCtx.signal, callOptions.signal)
                        : { signal: callOptions.signal, cleanup: undefined };
                    cleanupSignalListener = cleanup;
                    const contextValues = (callOptions.contextValues ?? createContextValues()).set(callerContextKey, spanCtx);
                    const enhancedOptions = {
                        ...callOptions,
                        headers: finalHeaders,
                        signal,
                        contextValues,
                    };
                    const result = original.call(target, input, enhancedOptions);
                    // Handle async iterables (server-side streaming and bidi streaming)
                    if (isAsyncIterable(result)) {
                        return wrapAsyncIterableWithSpan(result, span, cleanupSignalListener);
                    }
                    // Handle promises (unary RPCs and client-side streaming)
                    if (isPromiseLike(result)) {
                        return result
                            .then((res) => {
                            // Check if the resolved value is an async iterable (for bidi streaming)
                            if (isAsyncIterable(res)) {
                                return wrapAsyncIterableWithSpan(res, span, cleanupSignalListener);
                            }
                            span?.setStatus({ code: SpanStatusCode.OK });
                            span?.end();
                            cleanupSignalListener?.();
                            return res;
                        })
                            .catch((error) => {
                            span?.recordException(error instanceof Error ? error : new Error(String(error)));
                            span?.setStatus({
                                code: SpanStatusCode.ERROR,
                                message: error instanceof Error ? error.message : "RPC call failed",
                            });
                            span?.end();
                            cleanupSignalListener?.();
                            throw error;
                        });
                    }
                    else {
                        // Synchronous result
                        span?.setStatus({ code: SpanStatusCode.OK });
                        span?.end();
                        cleanupSignalListener?.();
                        return result;
                    }
                }
                catch (error) {
                    span?.recordException(error instanceof Error ? error : new Error(String(error)));
                    span?.setStatus({
                        code: SpanStatusCode.ERROR,
                        message: error instanceof Error ? error.message : "RPC call failed",
                    });
                    span?.end();
                    cleanupSignalListener?.();
                    throw error;
                }
            };
        },
    });
}
/**
 * Internal helper for wrapping server implementations.
 */
function addContextExtraction(implementation, options) {
    const { extractTraceHeaders = true, extractContext } = options;
    const wrappedImplementation = {};
    for (const [methodName, methodImpl] of Object.entries(implementation)) {
        if (typeof methodImpl !== "function") {
            wrappedImplementation[methodName] = methodImpl;
            continue;
        }
        wrappedImplementation[methodName] = (input, handlerContext) => {
            let ctx;
            let cleanupSignalListener;
            try {
                // Create base context
                if (extractContext) {
                    ctx = extractContext(handlerContext.requestHeader, handlerContext);
                }
                else {
                    ctx = (0,core/* createContext */.q6)();
                }
                if (extractTraceHeaders) {
                    const remoteSpanContext = remoteSpanContextFromHeaders(handlerContext.requestHeader);
                    if (remoteSpanContext !== undefined) {
                        ctx = ctx.with(otel/* SPAN_KEY */.Rm, trace_api/* trace */.u.wrapSpanContext(remoteSpanContext));
                        ctx = (0,otel/* withSpan */.fR)(ctx.withName(`rpc.${methodName}`), {
                            kind: span_kind/* SpanKind */.v.SERVER,
                            attributes: {
                                "rpc.method": methodName,
                                "rpc.system": "connect",
                                "rpc.protocol": handlerContext.protocolName,
                            },
                        });
                    }
                }
                const bridged = bridgeHandlerSignal({
                    ctx,
                    handlerSignal: handlerContext.signal,
                });
                ctx = bridged.ctx;
                cleanupSignalListener = bridged.cleanup;
                // Call the original implementation with context as first parameter
                const contextAwareImpl = methodImpl;
                const result = contextAwareImpl(ctx, input, handlerContext);
                const span = (0,otel/* getSpan */.fU)(ctx);
                if (isAsyncIterable(result)) {
                    return wrapAsyncIterableWithSpan(result, span, cleanupSignalListener);
                }
                if (isPromiseLike(result)) {
                    return result
                        .then((res) => {
                        if (isAsyncIterable(res)) {
                            return wrapAsyncIterableWithSpan(res, span, cleanupSignalListener);
                        }
                        span?.setStatus({ code: trace_status/* SpanStatusCode */.s.OK });
                        span?.end();
                        cleanupSignalListener?.();
                        return res;
                    })
                        .catch((error) => {
                        span?.recordException(error instanceof Error ? error : new Error(String(error)));
                        span?.setStatus({
                            code: trace_status/* SpanStatusCode */.s.ERROR,
                            message: error instanceof Error ? error.message : "RPC call failed",
                        });
                        span?.end();
                        cleanupSignalListener?.();
                        throw error;
                    });
                }
                span?.setStatus({ code: trace_status/* SpanStatusCode */.s.OK });
                span?.end();
                cleanupSignalListener?.();
                return result;
            }
            catch (error) {
                // Handle span completion for failed calls
                const span = (0,otel/* getSpan */.fU)(ctx);
                if (span) {
                    span.recordException(error instanceof Error ? error : new Error(String(error)));
                    span.setStatus({
                        code: trace_status/* SpanStatusCode */.s.ERROR,
                        message: error instanceof Error ? error.message : "RPC call failed",
                    });
                    span.end();
                }
                cleanupSignalListener?.();
                throw error;
            }
        };
    }
    return wrappedImplementation;
}
function mergeContextSignal(ctxSignal, providedSignal) {
    if (providedSignal === undefined || providedSignal === ctxSignal) {
        return {
            signal: ctxSignal,
        };
    }
    const controller = new AbortController();
    const abortFromContext = () => {
        controller.abort(ctxSignal.reason);
    };
    const abortFromProvided = () => {
        controller.abort(providedSignal.reason);
    };
    ctxSignal.addEventListener("abort", abortFromContext, { once: true });
    providedSignal.addEventListener("abort", abortFromProvided, { once: true });
    if (ctxSignal.aborted) {
        abortFromContext();
    }
    else if (providedSignal.aborted) {
        abortFromProvided();
    }
    const cleanup = () => {
        ctxSignal.removeEventListener("abort", abortFromContext);
        providedSignal.removeEventListener("abort", abortFromProvided);
    };
    return {
        signal: controller.signal,
        cleanup,
    };
}
/* ──────────────────────────────────────── public API ──────────────────────────────────── */
function createContextPropagatingClient(service, transport, options = {}) {
    const base = createClient(service, transport);
    return addContextPropagation(base, options);
}
/**
 * Wraps a service implementation to automatically extract context from incoming requests.
 * The wrapped implementation will receive a Context as its first parameter.
 */
function createContextExtractingService(implementation, options = {}) {
    // Cast the context-aware implementation to regular implementation for wrapping
    const regularImpl = implementation;
    return addContextExtraction(regularImpl, options);
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/control_service_pb.js
var control_service_pb = __webpack_require__("../proto/dist/generated/agent/v1/control_service_pb.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/service-type.js
var service_type = __webpack_require__("../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/service-type.js");
// EXTERNAL MODULE: ../proto/dist/generated/aiserver/v1/utils_pb.js
var utils_pb = __webpack_require__("../proto/dist/generated/aiserver/v1/utils_pb.js");
;// ../proto/dist/generated/agent/v1/control_service_connect.js
// @generated by protoc-gen-connect-es v1.6.1 with parameter "target=ts"
// @generated from file agent/v1/control_service.proto (package agent.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck



/**
 * @generated from service agent.v1.ControlService
 */
const ControlService = {
    typeName: "agent.v1.ControlService",
    methods: {
        /**
         * @generated from rpc agent.v1.ControlService.Ping
         */
        ping: {
            name: "Ping",
            I: control_service_pb/* PingRequest */.qp,
            O: control_service_pb/* PingResponse */.eJ,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Capabilities supported  (e.g. computer use)
         *
         * @generated from rpc agent.v1.ControlService.GetCapabilities
         */
        getCapabilities: {
            name: "GetCapabilities",
            I: control_service_pb/* GetCapabilitiesRequest */.cQ,
            O: control_service_pb/* GetCapabilitiesResponse */.y3,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Spawn
         *
         * @generated from rpc agent.v1.ControlService.Exec
         */
        exec: {
            name: "Exec",
            I: control_service_pb/* ExecRequest */.D7,
            O: control_service_pb/* ExecResponse */.fY,
            kind: service_type/* MethodKind */.I.ServerStreaming,
        },
        /**
         * Filesystem browsing (arbitrary paths).
         *
         * @generated from rpc agent.v1.ControlService.ListDirectory
         */
        listDirectory: {
            name: "ListDirectory",
            I: control_service_pb/* ListDirectoryRequest */.fV,
            O: control_service_pb/* ListDirectoryResponse */.Rz,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * File read / write (arbitrary filesystem paths).
         *
         * @generated from rpc agent.v1.ControlService.ReadTextFile
         */
        readTextFile: {
            name: "ReadTextFile",
            I: control_service_pb/* ReadTextFileRequest */.b3,
            O: control_service_pb/* ReadTextFileResponse */.vy,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.WriteTextFile
         */
        writeTextFile: {
            name: "WriteTextFile",
            I: control_service_pb/* WriteTextFileRequest */.Wz,
            O: control_service_pb/* WriteTextFileResponse */.eb,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Binary file read / write
         *
         * @generated from rpc agent.v1.ControlService.ReadBinaryFile
         */
        readBinaryFile: {
            name: "ReadBinaryFile",
            I: control_service_pb/* ReadBinaryFileRequest */.nS,
            O: control_service_pb/* ReadBinaryFileResponse */.TV,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.WriteBinaryFile
         */
        writeBinaryFile: {
            name: "WriteBinaryFile",
            I: control_service_pb/* WriteBinaryFileRequest */.OS,
            O: control_service_pb/* WriteBinaryFileResponse */.Qp,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Workspace-contained streaming file export for user-initiated saves.
         *
         * @generated from rpc agent.v1.ControlService.ExportFile
         */
        exportFile: {
            name: "ExportFile",
            I: control_service_pb/* ExportFileRequest */.YQ,
            O: control_service_pb/* ExportFileResponse */.o_,
            kind: service_type/* MethodKind */.I.ServerStreaming,
        },
        /**
         * Git
         *
         * @generated from rpc agent.v1.ControlService.GetDiff
         */
        getDiff: {
            name: "GetDiff",
            I: utils_pb/* GetDiffRequest */.Vq,
            O: utils_pb/* GetDiffResponse */.df,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.BatchGetDiff
         */
        batchGetDiff: {
            name: "BatchGetDiff",
            I: control_service_pb/* BatchGetDiffRequest */.fi,
            O: control_service_pb/* BatchGetDiffResponse */.hO,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.GetWorkspaceChangesHash
         */
        getWorkspaceChangesHash: {
            name: "GetWorkspaceChangesHash",
            I: control_service_pb/* GetWorkspaceChangesHashRequest */.Sv,
            O: control_service_pb/* GetWorkspaceChangesHashResponse */.Y_,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.RefreshGithubAccessToken
         */
        refreshGithubAccessToken: {
            name: "RefreshGithubAccessToken",
            I: control_service_pb/* RefreshGithubAccessTokenRequest */.Vd,
            O: control_service_pb/* RefreshGithubAccessTokenResponse */.Jm,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Remote access
         *
         * @generated from rpc agent.v1.ControlService.WarmRemoteAccessServer
         */
        warmRemoteAccessServer: {
            name: "WarmRemoteAccessServer",
            I: control_service_pb/* WarmRemoteAccessServerRequest */.Er,
            O: control_service_pb/* WarmRemoteAccessServerResponse */.Ks,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Artifact uploads
         *
         * @generated from rpc agent.v1.ControlService.ListArtifacts
         */
        listArtifacts: {
            name: "ListArtifacts",
            I: control_service_pb/* ListArtifactsRequest */.FG,
            O: control_service_pb/* ListArtifactsResponse */.pl,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.UploadArtifacts
         */
        uploadArtifacts: {
            name: "UploadArtifacts",
            I: control_service_pb/* UploadArtifactsRequest */.AH,
            O: control_service_pb/* UploadArtifactsResponse */.Ce,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.PersistArtifactsToAgentStore
         */
        persistArtifactsToAgentStore: {
            name: "PersistArtifactsToAgentStore",
            I: control_service_pb/* PersistArtifactsToAgentStoreRequest */.OT,
            O: control_service_pb/* PersistArtifactsToAgentStoreResponse */.sK,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.PersistArtifactsToParentStore
         */
        persistArtifactsToParentStore: {
            name: "PersistArtifactsToParentStore",
            I: control_service_pb/* PersistArtifactsToParentStoreRequest */.D9,
            O: control_service_pb/* PersistArtifactsToParentStoreResponse */.f,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.RestoreArtifacts
         */
        restoreArtifacts: {
            name: "RestoreArtifacts",
            I: control_service_pb/* RestoreArtifactsRequest */.tA,
            O: control_service_pb/* RestoreArtifactsResponse */.pt,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.ControlService.GetMcpRefreshTokens
         */
        getMcpRefreshTokens: {
            name: "GetMcpRefreshTokens",
            I: control_service_pb/* GetMcpRefreshTokensRequest */.RH,
            O: control_service_pb/* GetMcpRefreshTokensResponse */.TL,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Download (but do not start) the cursor server for a given commit.
         * This is used to pre-download the cursor server binary so that subsequent
         * WarmRemoteAccessServer calls are faster.
         *
         * @generated from rpc agent.v1.ControlService.DownloadCursorServer
         */
        downloadCursorServer: {
            name: "DownloadCursorServer",
            I: control_service_pb/* DownloadCursorServerRequest */.JO,
            O: control_service_pb/* DownloadCursorServerResponse */.Nj,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Update the exec-daemon's environment variables for subsequent process spawns.
         * This does NOT affect already-running processes.
         *
         * @generated from rpc agent.v1.ControlService.UpdateEnvironmentVariables
         */
        updateEnvironmentVariables: {
            name: "UpdateEnvironmentVariables",
            I: control_service_pb/* UpdateEnvironmentVariablesRequest */.t3,
            O: control_service_pb/* UpdateEnvironmentVariablesResponse */.zj,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Per-scope secrets for shell injection: the daemon sets them on exactly the
         * shell commands whose ShellArgs.secret_scope_id matches (a Grok Bot's agent
         * id), never on the daemon-wide environment, so a bot's values are absent
         * from every other command's environment and shell snapshot by default. The
         * scope id is caller-asserted under the daemon's shared bearer token, so
         * this is not a boundary against a hostile caller that already holds that
         * token (such a caller can also Exec or rewrite the daemon environment); the
         * box is one trust domain. With `secrets` unset the call only reports the
         * revision the daemon holds; with it set the daemon replaces the scope's
         * values at `revision`, ignoring a push older than what it already holds.
         * Revisions come from the server; values live in daemon memory only.
         *
         * @generated from rpc agent.v1.ControlService.SyncScopedSecrets
         */
        syncScopedSecrets: {
            name: "SyncScopedSecrets",
            I: control_service_pb/* SyncScopedSecretsRequest */.sD,
            O: control_service_pb/* SyncScopedSecretsResponse */.qM,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Reload agent skills from disk (~/.cursor/skills/, workspace skills, etc.).
         * Call after writing new SKILL.md files so the next agent turn sees them.
         *
         * @generated from rpc agent.v1.ControlService.ReloadAgentSkills
         */
        reloadAgentSkills: {
            name: "ReloadAgentSkills",
            I: control_service_pb/* ReloadAgentSkillsRequest */.Qj,
            O: control_service_pb/* ReloadAgentSkillsResponse */.q2,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Reload plugin-backed skills/subagents after the cloud harness materializes
         * plugin files onto disk. Empty reload_targets means "reload everything".
         *
         * @generated from rpc agent.v1.ControlService.ReloadPlugins
         */
        reloadPlugins: {
            name: "ReloadPlugins",
            I: control_service_pb/* ReloadPluginsRequest */.D3,
            O: control_service_pb/* ReloadPluginsResponse */.dj,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Download a plugin artifact tarball from a presigned URL and extract it on the VM.
         *
         * @generated from rpc agent.v1.ControlService.InstallPluginArtifact
         */
        installPluginArtifact: {
            name: "InstallPluginArtifact",
            I: control_service_pb/* InstallPluginArtifactRequest */.kM,
            O: control_service_pb/* InstallPluginArtifactResponse */.wY,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Load (and optionally reconcile) session MCP servers on the daemon from a
         * desired MCP config. The same operation the private-worker bridge performs
         * in-process at claim time, exposed for co-located callers (e.g. the Sand
         * in-box host) whose MCP config changes while the daemon runs. Servers are
         * registered lazily (child processes spawn on first use); servers already
         * registered with the same config are left untouched.
         *
         * @generated from rpc agent.v1.ControlService.LoadMcpServers
         */
        loadMcpServers: {
            name: "LoadMcpServers",
            I: control_service_pb/* LoadMcpServersRequest */.i5,
            O: control_service_pb/* LoadMcpServersResponse */.I,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * In-memory per-desktop input lease: who may drive X11 on this VM. A human
         * acquire preempts a computer-use agent and aborts its in-flight input;
         * stamped ComputerUseArgs.desktop_lease_actor_id actions are rejected while
         * another actor holds the desktop. Authoritative on this daemon only.
         *
         * @generated from rpc agent.v1.ControlService.DesktopLease
         */
        desktopLease: {
            name: "DesktopLease",
            I: control_service_pb/* DesktopLeaseRequest */.A9,
            O: control_service_pb/* DesktopLeaseResponse */.Mj,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Memory / CPU / disk of the machine this daemon runs on: the current 5 s
         * sample plus the samples since the caller's `cursor`, out of a 15-minute
         * ring buffer. FailedPrecondition when the daemon runs without
         * --machine-resources-enabled; daemons that predate the RPC answer
         * Unimplemented.
         *
         * @generated from rpc agent.v1.ControlService.GetResourceUsage
         */
        getResourceUsage: {
            name: "GetResourceUsage",
            I: control_service_pb/* GetResourceUsageRequest */.rk,
            O: control_service_pb/* GetResourceUsageResponse */.RE,
            kind: service_type/* MethodKind */.I.Unary,
        },
    }
};

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/exec_pb.js + 4 modules
var exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/exec_pb.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/proto3.js + 18 modules
var proto3 = __webpack_require__("../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/proto3.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
var proto_int64 = __webpack_require__("../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js");
// EXTERNAL MODULE: ../proto/dist/runtime/compact.js
var compact = __webpack_require__("../proto/dist/runtime/compact.js");
;// ../proto/dist/generated/agent/v1/exec_service_pb.js
// @generated by protoc-gen-es v1.10.1 with parameter "target=ts"
// @generated from file agent/v1/exec_service.proto (package agent.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck



const __protoPackage = "agent.v1.";
class __protoMessage3 extends compact/* CompactMessage */.HL {
    static get runtime() { return (0,compact/* defineOwn */.kU)(this, "runtime", proto3/* proto3 */.C); }
    static $p() { return __protoPackage; }
}
/**
 * @generated from message agent.v1.ExecStreamElement
 */
class ExecStreamElement extends __protoMessage3 {
    constructor(data) {
        super();
        /**
         * @generated from oneof agent.v1.ExecStreamElement.element
         */
        this.element = { case: undefined };
        proto3/* proto3 */.C.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new ExecStreamElement().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new ExecStreamElement().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new ExecStreamElement().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3/* proto3 */.C.util.equals(ExecStreamElement, a, b);
    }
    static $() { return ["ExecStreamElement|1 exec_client_message #0 element|2 exec_client_control_message #1 element", exec_pb/* ExecClientMessage */.yT, exec_pb/* ExecClientControlMessage */.$Y]; }
}
/**
 * @generated from message agent.v1.ReadFileRequest
 */
class ReadFileRequest extends __protoMessage3 {
    constructor(data) {
        super();
        /**
         * @generated from field: string path = 1;
         */
        this.path = "";
        /**
         * Zero uses the server limit. Requests cannot raise the 256 MiB hard cap.
         * The limit applies to the bytes streamed, so a range of a larger file passes.
         *
         * @generated from field: uint64 max_bytes = 2;
         */
        this.maxBytes = proto_int64/* protoInt64 */.M.zero;
        /**
         * First byte to stream. An offset at or past the end streams nothing.
         *
         * @generated from field: uint64 offset = 3;
         */
        this.offset = proto_int64/* protoInt64 */.M.zero;
        /**
         * Bytes to stream from offset. Zero streams to the end of the file.
         *
         * @generated from field: uint64 length = 4;
         */
        this.length = proto_int64/* protoInt64 */.M.zero;
        proto3/* proto3 */.C.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new ReadFileRequest().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new ReadFileRequest().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new ReadFileRequest().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3/* proto3 */.C.util.equals(ReadFileRequest, a, b);
    }
    static $() { return ["ReadFileRequest|1 path 9|2 max_bytes 4|3 offset 4|4 length 4"]; }
}
/**
 * @generated from message agent.v1.ReadFileHeader
 */
class ReadFileHeader extends __protoMessage3 {
    constructor(data) {
        super();
        /**
         * Size of the whole file, not of the range.
         *
         * @generated from field: uint64 size = 1;
         */
        this.size = proto_int64/* protoInt64 */.M.zero;
        /**
         * The path after the daemon resolved every symlink. Daemons older than this
         * field leave it empty.
         *
         * @generated from field: string real_path = 2;
         */
        this.realPath = "";
        proto3/* proto3 */.C.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new ReadFileHeader().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new ReadFileHeader().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new ReadFileHeader().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3/* proto3 */.C.util.equals(ReadFileHeader, a, b);
    }
    static $() { return ["ReadFileHeader|1 size 4|2 real_path 9"]; }
}
/**
 * @generated from message agent.v1.ReadFileComplete
 */
class ReadFileComplete extends __protoMessage3 {
    constructor(data) {
        super();
        /**
         * Bytes streamed: the whole file, or the range cut at the end of the file.
         *
         * @generated from field: uint64 size = 1;
         */
        this.size = proto_int64/* protoInt64 */.M.zero;
        /**
         * SHA-256 of the streamed bytes, not a hex-encoded string.
         *
         * @generated from field: bytes sha256 = 2;
         */
        this.sha256 = new Uint8Array(0);
        proto3/* proto3 */.C.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new ReadFileComplete().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new ReadFileComplete().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new ReadFileComplete().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3/* proto3 */.C.util.equals(ReadFileComplete, a, b);
    }
    static $() { return ["ReadFileComplete|1 size 4|2 sha256 12"]; }
}
/**
 * @generated from message agent.v1.ReadFileResponse
 */
class ReadFileResponse extends __protoMessage3 {
    constructor(data) {
        super();
        /**
         * Exactly one header, zero or more chunks (at most 256 KiB each), then
         * complete. Consumers must require complete AND successful RPC termination;
         * any error invalidates all previously received bytes. A daemon older than
         * offset and length ignores both and streams the whole file, so a consumer
         * that sent a range must check complete.size against the range it asked for.
         *
         * @generated from oneof agent.v1.ReadFileResponse.payload
         */
        this.payload = { case: undefined };
        proto3/* proto3 */.C.util.initPartial(data, this);
    }
    static fromBinary(bytes, options) {
        return new ReadFileResponse().fromBinary(bytes, options);
    }
    static fromJson(jsonValue, options) {
        return new ReadFileResponse().fromJson(jsonValue, options);
    }
    static fromJsonString(jsonString, options) {
        return new ReadFileResponse().fromJsonString(jsonString, options);
    }
    static equals(a, b) {
        return proto3/* proto3 */.C.util.equals(ReadFileResponse, a, b);
    }
    static $() { return ["ReadFileResponse|1 header #0 payload|2 chunk 12 payload|3 complete #1 payload", ReadFileHeader, ReadFileComplete]; }
}

;// ../proto/dist/generated/agent/v1/exec_service_connect.js
// @generated by protoc-gen-connect-es v1.6.1 with parameter "target=ts"
// @generated from file agent/v1/exec_service.proto (package agent.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck



/**
 * @generated from service agent.v1.ExecService
 */
const ExecService = {
    typeName: "agent.v1.ExecService",
    methods: {
        /**
         * @generated from rpc agent.v1.ExecService.Exec
         */
        exec: {
            name: "Exec",
            I: exec_pb/* ExecServerMessage */.Ye,
            O: ExecStreamElement,
            kind: service_type/* MethodKind */.I.ServerStreaming,
        },
        /**
         * Trusted daemon filesystem access with no text/image transformations.
         *
         * @generated from rpc agent.v1.ExecService.ReadFile
         */
        readFile: {
            name: "ReadFile",
            I: ReadFileRequest,
            O: ReadFileResponse,
            kind: service_type/* MethodKind */.I.ServerStreaming,
        },
    }
};

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/pty_host_service_pb.js
var pty_host_service_pb = __webpack_require__("../proto/dist/generated/agent/v1/pty_host_service_pb.js");
;// ../proto/dist/generated/agent/v1/pty_host_service_connect.js
// @generated by protoc-gen-connect-es v1.6.1 with parameter "target=ts"
// @generated from file agent/v1/pty_host_service.proto (package agent.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck


/**
 * Service for managing PTY (pseudo-terminal) instances
 *
 * @generated from service agent.v1.PtyHostService
 */
const PtyHostService = {
    typeName: "agent.v1.PtyHostService",
    methods: {
        /**
         * Spawns a new PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.SpawnPty
         */
        spawnPty: {
            name: "SpawnPty",
            I: pty_host_service_pb/* SpawnPtyRequest */.MR,
            O: pty_host_service_pb/* SpawnPtyResponse */.SW,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Attaches to an existing PTY instance and streams its output
         *
         * @generated from rpc agent.v1.PtyHostService.AttachPty
         */
        attachPty: {
            name: "AttachPty",
            I: pty_host_service_pb/* AttachPtyRequest */.st,
            O: pty_host_service_pb/* PtyEvent */.G,
            kind: service_type/* MethodKind */.I.ServerStreaming,
        },
        /**
         * Sends input to a PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.SendInput
         */
        sendInput: {
            name: "SendInput",
            I: pty_host_service_pb/* SendInputRequest */.ss,
            O: pty_host_service_pb/* SendInputResponse */.E_,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Resizes a PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.ResizePty
         */
        resizePty: {
            name: "ResizePty",
            I: pty_host_service_pb/* ResizePtyRequest */.Bk,
            O: pty_host_service_pb/* ResizePtyResponse */.Jz,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Lists all active PTY instances
         *
         * @generated from rpc agent.v1.PtyHostService.ListPtys
         */
        listPtys: {
            name: "ListPtys",
            I: pty_host_service_pb/* ListPtysRequest */.e7,
            O: pty_host_service_pb/* ListPtysResponse */.iB,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * Terminates a PTY instance
         *
         * @generated from rpc agent.v1.PtyHostService.TerminatePty
         */
        terminatePty: {
            name: "TerminatePty",
            I: pty_host_service_pb/* TerminatePtyRequest */._q,
            O: pty_host_service_pb/* TerminatePtyResponse */.cL,
            kind: service_type/* MethodKind */.I.Unary,
        },
    }
};

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js
var tmux_session_service_pb = __webpack_require__("../proto/dist/generated/agent/v1/tmux_session_service_pb.js");
;// ../proto/dist/generated/agent/v1/tmux_session_service_connect.js
// @generated by protoc-gen-connect-es v1.6.1 with parameter "target=ts"
// @generated from file agent/v1/tmux_session_service.proto (package agent.v1, syntax proto3)
/* eslint-disable */
// @ts-nocheck


/**
 * @generated from service agent.v1.TmuxSessionService
 */
const TmuxSessionService = {
    typeName: "agent.v1.TmuxSessionService",
    methods: {
        /**
         * @generated from rpc agent.v1.TmuxSessionService.CreateSession
         */
        createSession: {
            name: "CreateSession",
            I: tmux_session_service_pb/* CreateTmuxSessionRequest */.uL,
            O: tmux_session_service_pb/* CreateTmuxSessionResponse */.Cd,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.TmuxSessionService.ListSessions
         */
        listSessions: {
            name: "ListSessions",
            I: tmux_session_service_pb/* ListTmuxSessionsRequest */.fq,
            O: tmux_session_service_pb/* ListTmuxSessionsResponse */.nx,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.TmuxSessionService.KillSession
         */
        killSession: {
            name: "KillSession",
            I: tmux_session_service_pb/* KillTmuxSessionRequest */.GP,
            O: tmux_session_service_pb/* KillTmuxSessionResponse */.su,
            kind: service_type/* MethodKind */.I.Unary,
        },
        /**
         * @generated from rpc agent.v1.TmuxSessionService.AttachSession
         */
        attachSession: {
            name: "AttachSession",
            I: tmux_session_service_pb/* AttachTmuxSessionRequest */.Lw,
            O: tmux_session_service_pb/* AttachTmuxSessionResponse */.rt,
            kind: service_type/* MethodKind */.I.Unary,
        },
    }
};

// EXTERNAL MODULE: ../utils/dist/promise-extras.js
var promise_extras = __webpack_require__("../utils/dist/promise-extras.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/connect-error.js
var connect_error = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/connect-error.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/code.js
var esm_code = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/code.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect-node@1.6.1_patch_hash=5af812e0fa98d57d4268dc76827544673e2390a1c7193_62a3b3b4c8b16dc586e31982becdd4cf/node_modules/@connectrpc/connect-node/dist/esm/index.js + 17 modules
var esm = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect-node@1.6.1_patch_hash=5af812e0fa98d57d4268dc76827544673e2390a1c7193_62a3b3b4c8b16dc586e31982becdd4cf/node_modules/@connectrpc/connect-node/dist/esm/index.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/ws@8.21.3/node_modules/ws/wrapper.mjs
var wrapper = __webpack_require__("../../node_modules/.pnpm/ws@8.21.3/node_modules/ws/wrapper.mjs");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/router.js + 16 modules
var esm_router = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/router.js");
;// ./src/connect-websocket-adapter.ts
/**
 * WebSocket adapter for ConnectRPC server-side transport.
 *
 * This adapter allows exposing ConnectRPC services over WebSocket connections,
 * supporting headers, cancellation, and server-side streaming.
 *
 * Copyright Anysphere Inc.
 */

/**
 * Message types for the WebSocket protocol
 */
var WebSocketMessageType;
(function (WebSocketMessageType) {
    /** Client sends a request to invoke an RPC */
    WebSocketMessageType[WebSocketMessageType["REQUEST"] = 1] = "REQUEST";
    /** Client sends a cancellation signal */
    WebSocketMessageType[WebSocketMessageType["CANCEL"] = 2] = "CANCEL";
    /** Server sends response data (can be multiple for streaming) */
    WebSocketMessageType[WebSocketMessageType["RESPONSE"] = 3] = "RESPONSE";
    /** Server sends response headers */
    WebSocketMessageType[WebSocketMessageType["RESPONSE_HEADERS"] = 4] = "RESPONSE_HEADERS";
    /** Server sends response trailers and signals end of stream */
    WebSocketMessageType[WebSocketMessageType["RESPONSE_END"] = 5] = "RESPONSE_END";
    /** Server sends an error */
    WebSocketMessageType[WebSocketMessageType["ERROR"] = 6] = "ERROR";
})(WebSocketMessageType || (WebSocketMessageType = {}));
/**
 * Creates a WebSocket handler that serves ConnectRPC services.
 *
 * @param wss - WebSocket server instance
 * @param options - Adapter options including routes
 */
function connectWebSocketAdapter(wss, options) {
    const router = (0,esm_router/* createConnectRouter */.k)(options);
    options.routes(router);
    // Build path -> handler map
    const handlers = new Map();
    for (const handler of router.handlers) {
        handlers.set(handler.requestPath, handler);
    }
    wss.on("connection", (ws, request) => {
        // Authenticate if handler provided
        const authPromise = options.authenticate
            ? Promise.resolve(options.authenticate(request))
            : Promise.resolve(true);
        authPromise
            .then((authenticated) => {
            if (!authenticated) {
                ws.close(4001, "Unauthorized");
                return;
            }
            handleConnection(ws, handlers);
        })
            .catch((error) => {
            const message = error instanceof Error ? error.message : "Auth error";
            ws.close(4001, message);
        });
    });
}
/**
 * Handle an authenticated WebSocket connection
 */
function handleConnection(ws, handlers) {
    const activeRequests = new Map();
    ws.on("message", (data) => {
        let message;
        try {
            const messageStr = typeof data === "string" ? data : data.toString("utf8");
            message = JSON.parse(messageStr);
        }
        catch {
            sendError(ws, "", "INVALID_MESSAGE", "Failed to parse message");
            return;
        }
        switch (message.type) {
            case WebSocketMessageType.REQUEST:
                handleRequest(ws, handlers, activeRequests, message);
                break;
            case WebSocketMessageType.CANCEL:
                handleCancel(activeRequests, message);
                break;
            default:
                sendError(ws, "", "UNKNOWN_MESSAGE_TYPE", "Unknown message type");
        }
    });
    ws.on("close", () => {
        // Abort all active requests when connection closes
        for (const ctx of activeRequests.values()) {
            ctx.abortController.abort();
        }
        activeRequests.clear();
    });
    ws.on("error", () => {
        // Abort all active requests on error
        for (const ctx of activeRequests.values()) {
            ctx.abortController.abort();
        }
        activeRequests.clear();
    });
}
/**
 * Handle an RPC request
 */
function handleRequest(ws, handlers, activeRequests, request) {
    const { requestId, path, method, headers, body } = request;
    // Check if request ID is already in use
    if (activeRequests.has(requestId)) {
        sendError(ws, requestId, "DUPLICATE_REQUEST_ID", "Request ID already in use");
        return;
    }
    // Find handler for path
    const handler = handlers.get(path);
    if (!handler) {
        sendError(ws, requestId, "NOT_FOUND", `No handler for path: ${path}`);
        return;
    }
    // Create abort controller for this request
    const abortController = new AbortController();
    activeRequests.set(requestId, { abortController });
    // Build UniversalServerRequest
    const requestHeaders = new Headers();
    for (const [key, value] of Object.entries(headers)) {
        requestHeaders.set(key, value);
    }
    // Decode body from base64
    const bodyBytes = Buffer.from(body, "base64");
    // Create async iterable for body
    async function* bodyIterator() {
        yield bodyBytes;
    }
    const universalRequest = {
        httpVersion: "2.0", // Pretend to be HTTP/2 to allow streaming
        url: `https://websocket${path}`,
        method,
        header: requestHeaders,
        body: bodyIterator(),
        signal: abortController.signal,
        contextValues: undefined,
    };
    // Execute handler
    handler(universalRequest)
        .then(async (response) => {
        // Check if request was cancelled
        if (abortController.signal.aborted) {
            return;
        }
        // Send response headers
        const responseHeaders = {};
        if (response.header) {
            response.header.forEach((value, key) => {
                responseHeaders[key] = value;
            });
        }
        sendMessage(ws, {
            type: WebSocketMessageType.RESPONSE_HEADERS,
            requestId,
            status: response.status,
            headers: responseHeaders,
        });
        // Stream response body
        if (response.body) {
            try {
                for await (const chunk of response.body) {
                    // Check for cancellation between chunks
                    if (abortController.signal.aborted) {
                        break;
                    }
                    sendMessage(ws, {
                        type: WebSocketMessageType.RESPONSE,
                        requestId,
                        body: Buffer.from(chunk).toString("base64"),
                    });
                }
            }
            catch (error) {
                if (!abortController.signal.aborted) {
                    const message = error instanceof Error ? error.message : "Stream error";
                    sendError(ws, requestId, "STREAM_ERROR", message);
                }
                return;
            }
        }
        // Send response end with trailers
        const trailers = {};
        if (response.trailer) {
            response.trailer.forEach((value, key) => {
                trailers[key] = value;
            });
        }
        sendMessage(ws, {
            type: WebSocketMessageType.RESPONSE_END,
            requestId,
            trailers,
        });
    })
        .catch((error) => {
        if (!abortController.signal.aborted) {
            const message = error instanceof Error ? error.message : "Handler error";
            sendError(ws, requestId, "INTERNAL_ERROR", message);
        }
    })
        .finally(() => {
        activeRequests.delete(requestId);
    });
}
/**
 * Handle a cancellation request
 */
function handleCancel(activeRequests, cancel) {
    const ctx = activeRequests.get(cancel.requestId);
    if (ctx) {
        ctx.abortController.abort();
        activeRequests.delete(cancel.requestId);
    }
}
/**
 * Send a message to the WebSocket client
 */
function sendMessage(ws, message) {
    if (ws.readyState === 1) {
        // WebSocket.OPEN
        ws.send(JSON.stringify(message));
    }
}
/**
 * Send an error message to the WebSocket client
 */
function sendError(ws, requestId, code, message) {
    sendMessage(ws, {
        type: WebSocketMessageType.ERROR,
        requestId,
        code,
        message,
    });
}

// EXTERNAL MODULE: external "node:child_process"
var external_node_child_process_ = __webpack_require__("node:child_process");
// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__("node:fs/promises");
var promises_default = /*#__PURE__*/__webpack_require__.n(promises_);
// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__("node:path");
var external_node_path_default = /*#__PURE__*/__webpack_require__.n(external_node_path_);
// EXTERNAL MODULE: ../agent-core/dist/cloud-agent-artifact-paths.js
var cloud_agent_artifact_paths = __webpack_require__("../agent-core/dist/cloud-agent-artifact-paths.js");
// EXTERNAL MODULE: ../local-exec/dist/index.js + 151 modules
var local_exec_dist = __webpack_require__("../local-exec/dist/index.js");
// EXTERNAL MODULE: ../utils/dist/writable-iterable.js
var writable_iterable = __webpack_require__("../utils/dist/writable-iterable.js");
// EXTERNAL MODULE: ../utils/dist/safe-spawn-cwd.js
var safe_spawn_cwd = __webpack_require__("../utils/dist/safe-spawn-cwd.js");
// EXTERNAL MODULE: ../utils/dist/workload-spawn.js
var workload_spawn = __webpack_require__("../utils/dist/workload-spawn.js");
// EXTERNAL MODULE: ./src/artifactUploads.ts
var artifactUploads = __webpack_require__("./src/artifactUploads.ts");
// EXTERNAL MODULE: ./src/comma-separated-names.ts
var comma_separated_names = __webpack_require__("./src/comma-separated-names.ts");
;// ./src/desktopLease.ts


const PROTO_STATUS = {
    ok: control_service_pb/* DesktopLeaseStatus */.V2.OK,
    busy: control_service_pb/* DesktopLeaseStatus */.V2.BUSY,
    invalid: control_service_pb/* DesktopLeaseStatus */.V2.INVALID_REQUEST,
};
const PROTO_ACTOR_KIND = {
    human: control_service_pb/* DesktopLeaseActorKind */.MA.HUMAN,
    agent: control_service_pb/* DesktopLeaseActorKind */.MA.AGENT,
};
function toResponse(result) {
    const owner = result.owner;
    return new control_service_pb/* DesktopLeaseResponse */.Mj({
        status: PROTO_STATUS[result.status],
        owner: owner === undefined
            ? undefined
            : new control_service_pb/* DesktopLeaseOwner */.YM({
                kind: PROTO_ACTOR_KIND[owner.kind],
                actorId: owner.actorId,
                expiresAtUnixMs: BigInt(owner.expiresAtUnixMs),
            }),
        message: result.message,
    });
}
/**
 * ControlService.DesktopLease. Acquire is for humans; agents take the desktop
 * by stamping their computer actions. `store` is undefined on daemons without
 * an X11 desktop, which answer Unimplemented so callers fall back.
 */
async function handleDesktopLease(store, request) {
    if (store === undefined) {
        throw new connect_error/* ConnectError */.T("Desktop lease is not available on this daemon", esm_code/* Code */.C.Unimplemented);
    }
    const action = request.action;
    switch (action.case) {
        case "acquire":
            return toResponse(await store.acquire(action.value.actorId));
        case "release":
            return toResponse(store.release(action.value.actorId));
        case "getState":
            return toResponse({
                status: "ok",
                owner: store.getOwner(),
                message: "ok",
            });
        default:
            return toResponse({
                status: "invalid",
                owner: store.getOwner(),
                message: "desktop lease action is required",
            });
    }
}

// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__("node:fs");
;// ./src/errors.ts


/**
 * Node raises the same `spawn <command> ENOENT` for a missing executable and
 * for a `cwd` that does not exist, so the message alone cannot tell a container
 * that lacks the binary apart from a workspace path the VM never created (for
 * example a repo absent from the environment snapshot it booted from). Record
 * whichever one actually applies.
 */
function annotateSpawnEnoent(error, { command, cwd }) {
    if (error.code !== "ENOENT") {
        return error;
    }
    const detail = (0,external_node_fs_.existsSync)(cwd)
        ? `executable not found on PATH: ${command}`
        : `working directory does not exist: ${cwd}`;
    error.message = `${error.message} (${detail})`;
    return error;
}
function toInternalConnectError(prefix, error) {
    if (error instanceof connect_error/* ConnectError */.T) {
        return error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    let code = esm_code/* Code */.C.Internal;
    if (error instanceof Error) {
        if (error.name === "AbortError") {
            code = esm_code/* Code */.C.Canceled;
        }
        else if (error.name === "TimeoutError") {
            code = esm_code/* Code */.C.DeadlineExceeded;
        }
    }
    return new connect_error/* ConnectError */.T(`${prefix}: ${errorMessage}`, code, undefined, undefined, error);
}
/**
 * Check if an error is caused by the client disconnecting (e.g., due to timeout or abort).
 * This includes errors like ERR_STREAM_DESTROYED which occur when the HTTP response stream
 * is closed by the client while the server is still writing to it.
 */
function isClientDisconnectError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    const code = error.code;
    return (code === "ERR_STREAM_DESTROYED" ||
        code === "ERR_STREAM_PREMATURE_CLOSE" ||
        code === "ECONNRESET" ||
        code === "EPIPE");
}

;// ./src/export-file.ts




const EXPORT_CHUNK_SIZE_BYTES = 64 * 1024;
function assertExportableRegularFile(fileStat) {
    if (!fileStat.isFile()) {
        throw new connect_error/* ConnectError */.T("Only regular files can be exported", esm_code/* Code */.C.InvalidArgument);
    }
    if (BigInt(fileStat.nlink) > BigInt(1)) {
        throw new connect_error/* ConnectError */.T("Hard-linked files cannot be exported", esm_code/* Code */.C.InvalidArgument);
    }
}
function isPathWithinRoot(args) {
    const relativePath = external_node_path_default().relative(args.rootPath, args.targetPath);
    return (relativePath !== "" &&
        relativePath !== ".." &&
        !relativePath.startsWith(`..${(external_node_path_default()).sep}`) &&
        !external_node_path_default().isAbsolute(relativePath));
}
async function getOpenedFilePath(fileDescriptor, fallbackPath) {
    if (false) // removed by dead control flow
{}
    return (0,promises_.realpath)(`/proc/self/fd/${fileDescriptor}`);
}
async function* exportFileChunks(args) {
    const canonicalRootPath = await (0,promises_.realpath)(args.workspaceRootPath);
    if (canonicalRootPath === external_node_path_default().parse(canonicalRootPath).root) {
        throw new connect_error/* ConnectError */.T("Filesystem root cannot be used as an export boundary", esm_code/* Code */.C.PermissionDenied);
    }
    // Startup discovery already canonicalizes existing roots. Resolve relative
    // test/default roots lexically so one workspace disappearing later does not
    // prevent exports from the daemon's other discovered workspaces.
    const authoritativeWorkspaceRootPaths = args.authoritativeWorkspaceRootPaths.map((authoritativeRootPath) => external_node_path_default().resolve(authoritativeRootPath));
    if (!authoritativeWorkspaceRootPaths.includes(canonicalRootPath)) {
        throw new connect_error/* ConnectError */.T("Workspace root is not managed by exec-daemon", esm_code/* Code */.C.PermissionDenied);
    }
    const requestedFilePath = external_node_path_default().isAbsolute(args.filePath)
        ? args.filePath
        : external_node_path_default().resolve(canonicalRootPath, args.filePath);
    const requestedFileStat = await (0,promises_.lstat)(requestedFilePath);
    if (requestedFileStat.isSymbolicLink()) {
        throw new connect_error/* ConnectError */.T("Symbolic links cannot be exported", esm_code/* Code */.C.InvalidArgument);
    }
    assertExportableRegularFile(requestedFileStat);
    const canonicalFilePath = await (0,promises_.realpath)(requestedFilePath);
    if (!isPathWithinRoot({
        rootPath: canonicalRootPath,
        targetPath: canonicalFilePath,
    })) {
        throw new connect_error/* ConnectError */.T("File is outside the workspace", esm_code/* Code */.C.PermissionDenied);
    }
    const fileHandle = await (0,promises_.open)(canonicalFilePath, external_node_fs_.constants.O_RDONLY | external_node_fs_.constants.O_NOFOLLOW | external_node_fs_.constants.O_NONBLOCK);
    try {
        const openedFilePath = await getOpenedFilePath(fileHandle.fd, canonicalFilePath);
        if (!isPathWithinRoot({
            rootPath: canonicalRootPath,
            targetPath: openedFilePath,
        })) {
            throw new connect_error/* ConnectError */.T("File is outside the workspace", esm_code/* Code */.C.PermissionDenied);
        }
        const openedFileStat = await fileHandle.stat({ bigint: true });
        assertExportableRegularFile(openedFileStat);
        const totalBytes = openedFileStat.size;
        yield { type: "metadata", totalBytes };
        let totalBytesRead = BigInt(0);
        while (totalBytesRead < totalBytes) {
            const remainingBytes = totalBytes - totalBytesRead;
            const buffer = Buffer.allocUnsafe(Number(remainingBytes < BigInt(EXPORT_CHUNK_SIZE_BYTES)
                ? remainingBytes
                : BigInt(EXPORT_CHUNK_SIZE_BYTES)));
            const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length);
            if (bytesRead === 0) {
                throw new connect_error/* ConnectError */.T("File ended before its declared size", esm_code/* Code */.C.DataLoss);
            }
            totalBytesRead += BigInt(bytesRead);
            yield {
                type: "chunk",
                contentChunk: new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + bytesRead)),
            };
        }
    }
    finally {
        await fileHandle.close();
    }
}

// EXTERNAL MODULE: external "node:stream"
var external_node_stream_ = __webpack_require__("node:stream");
// EXTERNAL MODULE: external "node:stream/promises"
var external_node_stream_promises_ = __webpack_require__("node:stream/promises");
;// ./src/plugin-install/limits.ts
const PLUGIN_INSTALL_TIMEOUT_MS = 115_000;
const PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS = 45_000;
const PLUGIN_ARTIFACT_MAX_BYTES = 256 * 1024 * 1024;
const PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES = PLUGIN_ARTIFACT_MAX_BYTES;
const PLUGIN_ARTIFACT_MAX_ENTRIES = 65_536;
/** GNU tar (Linux): `-rw-r--r-- user/group 1234 2024-01-15 12:00 path` */
const TAR_VERBOSE_LISTING_GNU_SIZE_PATTERN = /^\S+\s+\S+\/\S+\s+(\d+)\s+\d{4}-\d{2}-\d{2}/;
/** BSD tar (macOS): `-rw-r--r--  0 user group  1234 May 19 12:00 path` */
const TAR_VERBOSE_LISTING_BSD_SIZE_PATTERN = /^[dl-][rwx-]{9}\s+\d+\s+\S+\s+\S+\s+(\d+)\s+/;
function parseTarVerboseListingSize(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
        return null;
    }
    const gnuMatch = trimmed.match(TAR_VERBOSE_LISTING_GNU_SIZE_PATTERN);
    if (gnuMatch !== null) {
        return Number.parseInt(gnuMatch[1], 10);
    }
    const bsdMatch = trimmed.match(TAR_VERBOSE_LISTING_BSD_SIZE_PATTERN);
    if (bsdMatch !== null) {
        return Number.parseInt(bsdMatch[1], 10);
    }
    return null;
}

;// ./src/plugin-install/download.ts





function createPluginArtifactByteLimitTransform(maxBytes) {
    let bytesWritten = 0;
    return new external_node_stream_.Transform({
        transform(chunk, _encoding, callback) {
            const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            if (bytesWritten + chunkBuffer.length > maxBytes) {
                callback(new Error("plugin artifact too large"));
                return;
            }
            bytesWritten += chunkBuffer.length;
            callback(null, chunkBuffer);
        },
    });
}
async function downloadPluginArtifactToFile(params) {
    const response = await params.fetchImpl(params.downloadUrl, {
        method: "GET",
        signal: AbortSignal.timeout(params.timeoutMs),
    });
    if (!response.ok) {
        throw new connect_error/* ConnectError */.T(`artifact download failed with HTTP ${response.status}`, esm_code/* Code */.C.Internal);
    }
    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader !== null) {
        const contentLength = Number.parseInt(contentLengthHeader, 10);
        if (Number.isFinite(contentLength) && contentLength > PLUGIN_ARTIFACT_MAX_BYTES) {
            throw new connect_error/* ConnectError */.T("plugin artifact exceeds size limit", esm_code/* Code */.C.InvalidArgument);
        }
    }
    if (response.body === null) {
        throw new connect_error/* ConnectError */.T("plugin artifact download had no body", esm_code/* Code */.C.Internal);
    }
    const limitedBody = external_node_stream_.Readable.fromWeb(response.body).pipe(createPluginArtifactByteLimitTransform(PLUGIN_ARTIFACT_MAX_BYTES));
    await (0,external_node_stream_promises_.pipeline)(limitedBody, (0,external_node_fs_.createWriteStream)(params.destinationPath, { flags: "wx", mode: 0o666 }));
}

;// ./src/plugin-install/errors.ts

function remainingInstallTimeoutMs(installDeadlineMs) {
    return Math.max(1, installDeadlineMs - Date.now());
}
function remainingPhaseTimeoutMs(phaseDeadlineMs, overallDeadlineMs) {
    return Math.max(1, Math.min(remainingInstallTimeoutMs(phaseDeadlineMs), remainingInstallTimeoutMs(overallDeadlineMs)));
}
function pluginInstallFailureMessage(phase, kind) {
    switch (phase) {
        case "download":
            return kind === "timeout"
                ? "plugin artifact download timed out"
                : "plugin artifact download failed";
        case "filesystem":
            return "plugin artifact install filesystem setup failed";
        case "extraction":
            return kind === "timeout"
                ? "plugin artifact extraction timed out"
                : "plugin artifact extraction failed";
    }
}
function isDownloadTimeoutError(error) {
    return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}
function toPluginInstallConnectError(error, phase) {
    if (error instanceof connect_error/* ConnectError */.T) {
        return error;
    }
    if (error instanceof Error && error.message === "plugin artifact too large") {
        return new connect_error/* ConnectError */.T("plugin artifact exceeds size limit", esm_code/* Code */.C.InvalidArgument);
    }
    const kind = isDownloadTimeoutError(error) ? "timeout" : "failed";
    return new connect_error/* ConnectError */.T(pluginInstallFailureMessage(phase, kind), esm_code/* Code */.C.Internal);
}

;// ./src/plugin-install/paths.ts



const USER_PLUGIN_CACHE_ROOT_SEGMENTS = [".cursor", "plugins", "cache"];
const READONLY_PLUGIN_CACHE_ROOT = external_node_path_default().resolve((external_node_path_default()).sep, "tmp", "cursor-readonly-plugin-cache");
function isPathStrictlyInside(targetPath, rootPath) {
    const relative = external_node_path_default().relative(rootPath, targetPath);
    return relative.length > 0 && !relative.startsWith("..") && !external_node_path_default().isAbsolute(relative);
}
function getAllowedPluginInstallTargetRoots() {
    const homeDir = process.env.HOME?.trim();
    return [
        ...(homeDir !== undefined && homeDir.length > 0
            ? [external_node_path_default().resolve(homeDir, ...USER_PLUGIN_CACHE_ROOT_SEGMENTS)]
            : []),
        READONLY_PLUGIN_CACHE_ROOT,
    ];
}
function isPathEqualOrInside(targetPath, rootPath) {
    const relative = external_node_path_default().relative(rootPath, targetPath);
    return (relative === "" ||
        (relative.length > 0 && !relative.startsWith("..") && !external_node_path_default().isAbsolute(relative)));
}
function isAllowedPluginInstallTargetRoot(targetRoot) {
    if (targetRoot.length === 0 || !external_node_path_default().isAbsolute(targetRoot)) {
        return false;
    }
    const normalized = external_node_path_default().resolve(targetRoot);
    return getAllowedPluginInstallTargetRoots().some((root) => isPathStrictlyInside(normalized, root));
}
function getMatchingAllowedPluginCacheRoot(targetRoot) {
    const allowedRoots = getAllowedPluginInstallTargetRoots();
    const matchingRoot = allowedRoots.find((root) => isPathEqualOrInside(targetRoot, root));
    if (matchingRoot === undefined) {
        throw new connect_error/* ConnectError */.T("target_root is outside the allowed plugin cache directories", esm_code/* Code */.C.InvalidArgument);
    }
    return matchingRoot;
}
async function safeLstat(filePath) {
    try {
        return await promises_default().lstat(filePath);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
}
function getPluginCacheAnchorPath(cacheRoot) {
    const homeDir = process.env.HOME?.trim();
    if (homeDir !== undefined && homeDir.length > 0) {
        const resolvedHome = external_node_path_default().resolve(homeDir);
        if (isPathEqualOrInside(cacheRoot, resolvedHome)) {
            return resolvedHome;
        }
    }
    return external_node_path_default().resolve((external_node_path_default()).sep, "tmp");
}
async function ensureRealDirectoryHierarchy(anchorPath, directoryPath) {
    const relativePath = external_node_path_default().relative(anchorPath, directoryPath);
    if (relativePath.startsWith("..") || (relativePath.length > 0 && external_node_path_default().isAbsolute(relativePath))) {
        throw new connect_error/* ConnectError */.T("plugin install path is outside the allowed anchor directory", esm_code/* Code */.C.Internal);
    }
    const anchorStat = await safeLstat(anchorPath);
    if (anchorStat === null || anchorStat.isSymbolicLink()) {
        throw new connect_error/* ConnectError */.T("plugin install anchor is not a real directory", esm_code/* Code */.C.Internal);
    }
    if (!anchorStat.isDirectory()) {
        throw new connect_error/* ConnectError */.T("plugin install anchor is not a directory", esm_code/* Code */.C.Internal);
    }
    let currentPath = anchorPath;
    for (const part of relativePath.split((external_node_path_default()).sep)) {
        if (part.length === 0 || part === ".") {
            continue;
        }
        currentPath = external_node_path_default().join(currentPath, part);
        let currentStat = await safeLstat(currentPath);
        if (currentStat === null) {
            await promises_default().mkdir(currentPath);
            currentStat = await promises_default().lstat(currentPath);
        }
        if (currentStat.isSymbolicLink()) {
            throw new connect_error/* ConnectError */.T("plugin install path contains a symbolic link", esm_code/* Code */.C.Internal);
        }
        if (!currentStat.isDirectory()) {
            throw new connect_error/* ConnectError */.T("plugin install path parent is not a directory", esm_code/* Code */.C.Internal);
        }
    }
    const anchorRealPath = await promises_default().realpath(anchorPath);
    const directoryRealPath = await promises_default().realpath(directoryPath);
    if (!isPathEqualOrInside(directoryRealPath, anchorRealPath)) {
        throw new connect_error/* ConnectError */.T("plugin install path resolves outside the allowed anchor directory", esm_code/* Code */.C.Internal);
    }
}
async function ensureSafePluginInstallTargetDirectory(targetRoot) {
    const cacheRoot = getMatchingAllowedPluginCacheRoot(targetRoot);
    const anchorPath = getPluginCacheAnchorPath(cacheRoot);
    await ensureRealDirectoryHierarchy(anchorPath, cacheRoot);
    await ensureRealDirectoryHierarchy(cacheRoot, targetRoot);
    const cacheRootRealPath = await promises_default().realpath(cacheRoot);
    const targetRealPath = await promises_default().realpath(targetRoot);
    if (!isPathEqualOrInside(targetRealPath, cacheRootRealPath)) {
        throw new connect_error/* ConnectError */.T("plugin install target resolves outside the allowed plugin cache", esm_code/* Code */.C.Internal);
    }
}
async function resetPluginInstallTargetDirectory(targetRoot) {
    await ensureSafePluginInstallTargetDirectory(targetRoot);
    await promises_default().rm(targetRoot, { recursive: true, force: true });
    await ensureSafePluginInstallTargetDirectory(targetRoot);
}

// EXTERNAL MODULE: external "node:readline"
var external_node_readline_ = __webpack_require__("node:readline");
;// ./src/plugin-install/tar.ts









// Pins the piped-stdout overload so child.stdout is non-null through spawnWorkload.
const spawnWithPipedStdout = external_node_child_process_.spawn;
function recordTarListingLine(line, stats) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
        return;
    }
    const fileType = trimmedLine[0];
    if (fileType === "l") {
        throw new connect_error/* ConnectError */.T("plugin artifact contains symbolic links", esm_code/* Code */.C.InvalidArgument);
    }
    if (fileType !== "-" && fileType !== "d") {
        throw new connect_error/* ConnectError */.T("plugin artifact contains unsupported special files", esm_code/* Code */.C.InvalidArgument);
    }
    stats.entryCount += 1;
    if (stats.entryCount > PLUGIN_ARTIFACT_MAX_ENTRIES) {
        throw new connect_error/* ConnectError */.T("plugin artifact exceeds entry count limit", esm_code/* Code */.C.InvalidArgument);
    }
    const entrySize = parseTarVerboseListingSize(trimmedLine);
    if (entrySize === null) {
        throw new connect_error/* ConnectError */.T("plugin artifact listing has an unrecognized entry", esm_code/* Code */.C.InvalidArgument);
    }
    if (!Number.isFinite(entrySize) || entrySize < 0) {
        throw new connect_error/* ConnectError */.T("plugin artifact listing has an invalid entry size", esm_code/* Code */.C.InvalidArgument);
    }
    stats.totalUncompressedBytes += entrySize;
    if (stats.totalUncompressedBytes > PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES) {
        throw new connect_error/* ConnectError */.T("plugin artifact exceeds uncompressed size limit", esm_code/* Code */.C.InvalidArgument);
    }
}
function assertExtractedEntryCountWithinLimit(entryCount) {
    if (entryCount > PLUGIN_ARTIFACT_MAX_ENTRIES) {
        throw new connect_error/* ConnectError */.T("plugin artifact exceeds entry count limit", esm_code/* Code */.C.InvalidArgument);
    }
}
async function validateTarballBeforeExtraction(params) {
    return await new Promise((resolve, reject) => {
        const child = (0,workload_spawn/* spawnWorkload */.D9)(spawnWithPipedStdout, "tar", ["-tvzf", params.tarballPath], {
            stdio: ["ignore", "pipe", "ignore"],
        });
        const stats = { entryCount: 0, totalUncompressedBytes: 0 };
        const lineReader = (0,external_node_readline_.createInterface)({ input: child.stdout });
        let settled = false;
        let childExitCode = null;
        let lineReaderClosed = false;
        const finish = (error) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            if (error !== undefined) {
                child.kill("SIGKILL");
                reject(error);
                return;
            }
            resolve();
        };
        const tryFinish = () => {
            if (!lineReaderClosed || childExitCode === null) {
                return;
            }
            if (childExitCode === 0) {
                finish();
                return;
            }
            finish(new connect_error/* ConnectError */.T(pluginInstallFailureMessage("extraction", "failed"), esm_code/* Code */.C.Internal));
        };
        const timeout = setTimeout(() => {
            finish(new connect_error/* ConnectError */.T(pluginInstallFailureMessage("extraction", "timeout"), esm_code/* Code */.C.Internal));
        }, params.timeoutMs);
        lineReader.on("line", (line) => {
            try {
                recordTarListingLine(line, stats);
            }
            catch (error) {
                finish(error);
            }
        });
        lineReader.on("close", () => {
            lineReaderClosed = true;
            tryFinish();
        });
        child.on("error", (error) => {
            if (error.code === "ENOENT") {
                finish(new connect_error/* ConnectError */.T(pluginInstallFailureMessage("extraction", "failed"), esm_code/* Code */.C.Internal));
                return;
            }
            finish(error);
        });
        child.on("close", (code) => {
            childExitCode = code ?? 1;
            tryFinish();
        });
    });
}
async function verifyExtractedArtifactPaths(targetRoot) {
    const targetRootRealPath = await promises_default().realpath(targetRoot);
    let extractedBytes = 0;
    let extractedEntryCount = 0;
    const walk = async (currentPath) => {
        const entries = await promises_default().readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            extractedEntryCount += 1;
            assertExtractedEntryCountWithinLimit(extractedEntryCount);
            const entryPath = external_node_path_default().join(currentPath, entry.name);
            const entryStat = await promises_default().lstat(entryPath);
            if (entryStat.isSymbolicLink()) {
                throw new connect_error/* ConnectError */.T("plugin artifact contains symbolic links", esm_code/* Code */.C.Internal);
            }
            if (!entryStat.isFile() && !entryStat.isDirectory()) {
                throw new connect_error/* ConnectError */.T("plugin artifact contains unsupported special files", esm_code/* Code */.C.InvalidArgument);
            }
            const entryRealPath = await promises_default().realpath(entryPath);
            if (!isPathEqualOrInside(entryRealPath, targetRootRealPath)) {
                throw new connect_error/* ConnectError */.T("plugin artifact extraction escaped the install target directory", esm_code/* Code */.C.Internal);
            }
            if (entryStat.isFile()) {
                extractedBytes += entryStat.size;
                if (extractedBytes > PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES) {
                    throw new connect_error/* ConnectError */.T("plugin artifact exceeds uncompressed size limit", esm_code/* Code */.C.InvalidArgument);
                }
            }
            if (entryStat.isDirectory()) {
                await walk(entryPath);
            }
        }
    };
    await walk(targetRoot);
}
function buildExtractTarArgs(tarballPath, targetRoot) {
    const args = ["-xzf", tarballPath, "-C", targetRoot];
    // Cloud-agent VMs run GNU tar; keep anchored extraction there. macOS bsdtar
    // used in local dev/tests does not support these flags — post-extract path
    // verification still runs on every platform.
    if (true) {
        args.push("--no-same-owner", "--anchored");
    }
    return args;
}
async function extractTarball(params) {
    return await new Promise((resolve, reject) => {
        const child = (0,workload_spawn/* spawnWorkload */.D9)(external_node_child_process_.spawn, "tar", buildExtractTarArgs(params.tarballPath, params.targetRoot), {
            stdio: ["ignore", "ignore", "ignore"],
        });
        const timeout = setTimeout(() => {
            child.kill("SIGKILL");
            reject(new connect_error/* ConnectError */.T(pluginInstallFailureMessage("extraction", "timeout"), esm_code/* Code */.C.Internal));
        }, params.timeoutMs);
        child.on("error", (error) => {
            clearTimeout(timeout);
            if (error.code === "ENOENT") {
                resolve(127);
                return;
            }
            reject(error);
        });
        child.on("close", (code) => {
            clearTimeout(timeout);
            resolve(code ?? 1);
        });
    });
}

;// ./src/install-plugin-artifact.ts










const install_plugin_artifact_logger = (0,logger/* createLogger */.h)("exec-daemon-install-plugin");

async function installPluginArtifactFromUrl(ctx, request, deps = {}) {
    const fetchImpl = deps.fetchImpl ?? fetch;
    const trimmedTargetRoot = request.targetRoot.trim();
    if (trimmedTargetRoot.length === 0) {
        throw new connect_error/* ConnectError */.T("target_root is required", esm_code/* Code */.C.InvalidArgument);
    }
    const targetRoot = external_node_path_default().resolve(trimmedTargetRoot);
    if (!isAllowedPluginInstallTargetRoot(targetRoot)) {
        throw new connect_error/* ConnectError */.T("target_root is outside the allowed plugin cache directories", esm_code/* Code */.C.InvalidArgument);
    }
    const downloadUrl = request.downloadUrl.trim();
    if (downloadUrl.length === 0) {
        throw new connect_error/* ConnectError */.T("download_url is required", esm_code/* Code */.C.InvalidArgument);
    }
    const tarballPath = `${targetRoot}.tar.gz`;
    const installDeadlineMs = Date.now() + PLUGIN_INSTALL_TIMEOUT_MS;
    let targetPrepared = false;
    let installSucceeded = false;
    try {
        try {
            await resetPluginInstallTargetDirectory(targetRoot);
            targetPrepared = true;
        }
        catch (error) {
            throw toPluginInstallConnectError(error, "filesystem");
        }
        try {
            await promises_default().rm(tarballPath, { force: true });
            await downloadPluginArtifactToFile({
                fetchImpl,
                downloadUrl,
                destinationPath: tarballPath,
                timeoutMs: remainingInstallTimeoutMs(installDeadlineMs),
            });
        }
        catch (error) {
            throw toPluginInstallConnectError(error, "download");
        }
        const extractionDeadlineMs = Date.now() + PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS;
        try {
            const extractionTimeoutMs = remainingPhaseTimeoutMs(extractionDeadlineMs, installDeadlineMs);
            await validateTarballBeforeExtraction({
                tarballPath,
                timeoutMs: extractionTimeoutMs,
            });
            const exitCode = await extractTarball({
                targetRoot,
                tarballPath,
                timeoutMs: remainingPhaseTimeoutMs(extractionDeadlineMs, installDeadlineMs),
            });
            if (exitCode !== 0) {
                throw new connect_error/* ConnectError */.T(`${pluginInstallFailureMessage("extraction", "failed")} (exit code ${exitCode})`, esm_code/* Code */.C.Internal);
            }
            await verifyExtractedArtifactPaths(targetRoot);
        }
        catch (error) {
            throw toPluginInstallConnectError(error, "extraction");
        }
        install_plugin_artifact_logger.info(ctx, "Installed plugin artifact", {
            artifactDigest: request.artifactDigest,
        });
        installSucceeded = true;
        return new control_service_pb/* InstallPluginArtifactResponse */.wY({});
    }
    catch (error) {
        const connectError = error instanceof connect_error/* ConnectError */.T ? error : toPluginInstallConnectError(error, "download");
        install_plugin_artifact_logger.warn(ctx, "Plugin artifact install failed", {
            artifactDigest: request.artifactDigest,
            errorMessage: connectError.message,
        });
        throw connectError;
    }
    finally {
        await promises_default().rm(tarballPath, { force: true }).catch(() => undefined);
        if (targetPrepared && !installSucceeded) {
            await promises_default().rm(targetRoot, { recursive: true, force: true }).catch(() => undefined);
        }
    }
}

// EXTERNAL MODULE: ./src/managed-environment.ts
var managed_environment = __webpack_require__("./src/managed-environment.ts");
// EXTERNAL MODULE: ./src/mcp-token-storage.ts
var mcp_token_storage = __webpack_require__("./src/mcp-token-storage.ts");
// EXTERNAL MODULE: ./src/secretRedaction.ts
var secretRedaction = __webpack_require__("./src/secretRedaction.ts");
// EXTERNAL MODULE: ./src/workspace-discovery.ts
var workspace_discovery = __webpack_require__("./src/workspace-discovery.ts");
;// ./src/control.ts




















const control_logger = (0,logger/* createLogger */.h)("exec-daemon");
const filesystemLogger = (0,logger/* createLogger */.h)("filesystem");
const BATCH_GET_DIFF_FETCH_TIMEOUT_MS = 30_000;
function createInternalError(prefix, error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const message = `${prefix}: ${errorMessage}${errorStack ? `\n\nStack trace:\n${errorStack}` : ""}`;
    return new connect_error/* ConnectError */.T(message, esm_code/* Code */.C.Internal, undefined, undefined, error);
}
function logFilesystemError(ctx, operation, error) {
    // Never log raw fs errors; Node's messages frequently include absolute paths.
    if (error instanceof connect_error/* ConnectError */.T) {
        filesystemLogger.error(ctx, `${operation} failed`, new Error("ConnectError"), {
            connectCode: error.code,
        });
        return;
    }
    if (error instanceof Error && "code" in error) {
        const nodeError = error;
        filesystemLogger.error(ctx, `${operation} failed`, new Error("FsError"), {
            fsCode: nodeError.code,
        });
        return;
    }
    filesystemLogger.error(ctx, `${operation} failed`, new Error("UnknownError"));
}
async function runControlSpan(ctx, name, fn) {
    const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName(name));
    const span = (0,otel/* getSpan */.fU)(spanCtx);
    try {
        return await fn(spanCtx, span);
    }
    catch (error) {
        span?.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span?.end();
    }
}
function mapFsErrorToConnectError(error, operation) {
    if (error instanceof connect_error/* ConnectError */.T) {
        return error;
    }
    if (error instanceof Error && "code" in error) {
        const nodeError = error;
        switch (nodeError.code) {
            case "ENOENT":
                return new connect_error/* ConnectError */.T(`${operation}: not found`, esm_code/* Code */.C.NotFound);
            case "EACCES":
            case "EPERM":
                return new connect_error/* ConnectError */.T(`${operation}: permission denied`, esm_code/* Code */.C.PermissionDenied);
            case "ENOTDIR":
                return new connect_error/* ConnectError */.T(`${operation}: not a directory`, esm_code/* Code */.C.InvalidArgument);
            case "EISDIR":
                return new connect_error/* ConnectError */.T(`${operation}: is a directory`, esm_code/* Code */.C.InvalidArgument);
            case "ELOOP":
            case "ENAMETOOLONG":
                return new connect_error/* ConnectError */.T(`${operation}: invalid path`, esm_code/* Code */.C.InvalidArgument);
            default:
                return new connect_error/* ConnectError */.T(`${operation} failed`, esm_code/* Code */.C.Internal);
        }
    }
    return new connect_error/* ConnectError */.T(`${operation} failed`, esm_code/* Code */.C.Internal);
}
// Keep in sync with the prefix `githubHandler.ts` (backend) matches to pull the
// detail out of the token-push failure log.
const CLONE_AFTER_TOKEN_REFRESH_FAILED_MESSAGE_PREFIX = "Failed to clone git repositories after token refresh";
const CLONE_AFTER_TOKEN_REFRESH_DETAIL_MAX_CHARS = 500;
/**
 * The RPC error for a failed clone-on-claim hook: the constant prefix the
 * backend groups on, then the hook's own message (which the hook already made
 * credential- and path-free) on one line and capped, so what git said is
 * readable in our logs without the worker's.
 */
function formatCloneAfterTokenRefreshFailure(error) {
    const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
    let detail = raw
        .replace(/:\/\/[^/@\s]+@/g, "://")
        .replace(/\s+/g, " ")
        .trim();
    if (detail.length === 0) {
        return CLONE_AFTER_TOKEN_REFRESH_FAILED_MESSAGE_PREFIX;
    }
    if (detail.length > CLONE_AFTER_TOKEN_REFRESH_DETAIL_MAX_CHARS) {
        detail = `${detail.slice(0, CLONE_AFTER_TOKEN_REFRESH_DETAIL_MAX_CHARS)}…`;
    }
    return `${CLONE_AFTER_TOKEN_REFRESH_FAILED_MESSAGE_PREFIX}: ${detail}`;
}
function getGitOptionsFromGetDiffRequest(request) {
    return {
        ref: request.ref,
        baseRef: request.baseRef,
        mergeBase: request.mergeBase,
        targetPaths: request.targetPaths,
        unifiedContextLines: request.unifiedContextLines ?? 3,
        maxUntrackedFiles: request.maxUntrackedFiles,
        submoduleRecurseDepth: request.submoduleRecurseDepth,
        includeSpaceChanges: request.includeSpaceChanges,
        outputFormat: request.outputFormat ?? utils_pb/* GetDiffRequest_OutputFormat */.ek.FILE_DIFFS,
        computePatchId: request.computePatchId,
        returnHeadSha: request.returnHeadSha,
        maxFilesWithContents: request.maxFilesWithContents,
        maxContentBytes: request.maxContentBytes,
    };
}
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * True when the caller's recorded revisions still describe what a diff would
 * be computed from. A working-tree diff (empty `ref`) also needs the workspace
 * hash to match, since the head sha does not cover uncommitted edits.
 */
function knownRevisionsMatch(item, revisions) {
    if (!item.knownBaseSha || !item.knownHeadSha) {
        return false;
    }
    if (item.knownBaseSha !== revisions.baseSha || item.knownHeadSha !== revisions.headSha) {
        return false;
    }
    if (revisions.workspaceHash === undefined) {
        return true;
    }
    return (item.knownWorkspaceHash !== undefined &&
        item.knownWorkspaceHash !== "" &&
        item.knownWorkspaceHash === revisions.workspaceHash);
}
/**
 * Run an abortable async operation with a timeout. The operation receives an
 * AbortSignal that is aborted when the timeout elapses, so it can cancel any
 * underlying work (e.g. kill a child process) instead of leaving an orphan.
 *
 * Prefer this over `Promise.race`-style timeouts whenever the wrapped work
 * holds external resources (file locks, sockets, subprocesses).
 */
async function withTimeoutAndAbort(run, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await run(controller.signal);
    }
    finally {
        clearTimeout(timer);
    }
}
/**
 * Core exec daemon implementation
 */
class ControlServer {
    gitService;
    remoteAccessService;
    artifactUploadManagerProvider;
    managedEnvironment;
    workspacePaths;
    onReloadAgentSkills;
    onReloadPlugins;
    onLoadMcpServers;
    getComputerUseSupported;
    desktopLeaseStore;
    machineResourceMonitor;
    githubTokenPushConsent;
    secretRedactionState;
    scopedSecretStore;
    onGithubAccessTokenRefreshed;
    onManagedEnvironmentUpdated;
    onPing;
    // Keys that were removed from the managed environment and need to be unset in
    // the restore script until they are re-added. This persists across calls so
    // rapid successive replace calls (e.g., user clicking "save" twice) don't
    // lose the unset commands before a shell command has a chance to run and
    // update the snapshot.
    pendingUnsets = new Set();
    pendingRestores = new Map();
    previousManagedEnvironmentValues = new Map();
    // Run-scoped env overlays keyed by runId, refcounted by holder. Concurrent
    // activities for the same run share one overlay: env is applied for the first
    // holder and the keys are removed only when the last holder releases, so a
    // sibling activity finishing first cannot strip run env mid-run. Holders are
    // stable per-activity ids, so a retried apply re-adds the same holder
    // (idempotent) and cannot leave run env stranded on the VM after the run.
    runScopedOverlays = new Map();
    // Serializes environment updates so concurrent overlay apply/release (and
    // other managed-env writers) cannot interleave their process.env mutations.
    envUpdateChain = Promise.resolve();
    constructor(gitService, remoteAccessService, artifactUploadManagerProvider, options = {}) {
        this.gitService = gitService;
        this.remoteAccessService = remoteAccessService;
        this.artifactUploadManagerProvider = artifactUploadManagerProvider;
        this.workspacePaths = options.workspacePaths ?? [process.cwd()];
        this.onReloadAgentSkills = options.onReloadAgentSkills;
        this.onReloadPlugins = options.onReloadPlugins;
        this.onLoadMcpServers = options.onLoadMcpServers;
        this.getComputerUseSupported = options.getComputerUseSupported;
        this.desktopLeaseStore = options.desktopLeaseStore;
        this.machineResourceMonitor = options.machineResourceMonitor;
        this.managedEnvironment = options.managedEnvironment ?? new managed_environment/* ManagedEnvironment */.R1();
        this.githubTokenPushConsent = options.githubTokenPushConsent;
        this.secretRedactionState = options.secretRedactionState;
        this.scopedSecretStore = options.scopedSecretStore;
        this.onGithubAccessTokenRefreshed = options.onGithubAccessTokenRefreshed;
        this.onManagedEnvironmentUpdated = options.onManagedEnvironmentUpdated;
        this.onPing = options.onPing;
    }
    async ping(ctx, _request) {
        control_logger.debug(ctx, "Ping");
        try {
            await this.onPing?.(ctx);
        }
        catch (error) {
            control_logger.warn(ctx, "onPing hook failed", { error });
        }
        return new control_service_pb/* PingResponse */.eJ({});
    }
    async getCapabilities(ctx, _request) {
        control_logger.debug(ctx, "GetCapabilities");
        return new control_service_pb/* GetCapabilitiesResponse */.y3({
            installPluginArtifactSupported: true,
            computerUseKeyStrokeSupported: true,
            ...(this.getComputerUseSupported !== undefined && {
                computerUseSupported: this.getComputerUseSupported(),
            }),
        });
    }
    async syncScopedSecrets(ctx, request) {
        if (this.scopedSecretStore === undefined) {
            throw new connect_error/* ConnectError */.T("scoped secrets are not enabled on this daemon", esm_code/* Code */.C.Unimplemented);
        }
        if (request.scopeId.length === 0) {
            throw new connect_error/* ConnectError */.T("scope_id is required", esm_code/* Code */.C.InvalidArgument);
        }
        const held = this.scopedSecretStore.revisionOf(request.scopeId);
        if (request.secrets !== undefined) {
            const isStalePush = held !== undefined && request.revision < held;
            if (!isStalePush) {
                try {
                    this.scopedSecretStore.set(request.scopeId, request.revision, request.secrets.values);
                }
                catch (error) {
                    if (error instanceof managed_environment/* ManagedEnvironmentValidationError */._Z) {
                        throw new connect_error/* ConnectError */.T(error.message, esm_code/* Code */.C.InvalidArgument);
                    }
                    throw error;
                }
            }
            control_logger.info(ctx, "SyncScopedSecrets push", {
                scopeId: request.scopeId,
                revision: request.revision,
                heldRevision: held,
                applied: !isStalePush,
                count: Object.keys(request.secrets.values).length,
            });
        }
        const current = this.scopedSecretStore.revisionOf(request.scopeId);
        return new control_service_pb/* SyncScopedSecretsResponse */.qM(current === undefined ? {} : { revision: current });
    }
    desktopLease(_ctx, request) {
        return handleDesktopLease(this.desktopLeaseStore, request);
    }
    async getResourceUsage(_ctx, request) {
        if (this.machineResourceMonitor === undefined) {
            throw new connect_error/* ConnectError */.T("Machine resources are not available on this daemon", esm_code/* Code */.C.Unimplemented);
        }
        return this.machineResourceMonitor.handleGetResourceUsage(request);
    }
    async installPluginArtifact(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.installPluginArtifact", async (spanCtx, span) => {
            span?.setAttribute("plugin.has_artifact_digest", request.artifactDigest.length > 0);
            return await installPluginArtifactFromUrl(spanCtx, request);
        });
    }
    async reloadAgentSkills(ctx, _request) {
        return await runControlSpan(ctx, "exec_daemon.reloadAgentSkills", async (spanCtx) => {
            await this.onReloadAgentSkills?.(spanCtx);
            return new control_service_pb/* ReloadAgentSkillsResponse */.q2({});
        });
    }
    async reloadPlugins(ctx, _request) {
        return await runControlSpan(ctx, "exec_daemon.reloadPlugins", async (spanCtx) => {
            await this.onReloadPlugins?.(spanCtx);
            return new control_service_pb/* ReloadPluginsResponse */.dj({});
        });
    }
    async loadMcpServers(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.loadMcpServers", async (spanCtx) => {
            const loader = this.onLoadMcpServers;
            if (loader === undefined) {
                throw new connect_error/* ConnectError */.T("Session MCP loading is not available on this daemon", esm_code/* Code */.C.Unimplemented);
            }
            const loadedServerNames = await loader(spanCtx, request.mcpConfigJson, {
                removeMissing: request.removeMissing,
            });
            return new control_service_pb/* LoadMcpServersResponse */.I({ loadedServerNames });
        });
    }
    /**
     * Handle simple process exec requests - server-side streaming
     */
    async *exec(ctx, request) {
        // Create a child span for this operation
        const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName("exec_daemon.exec"));
        const span = (0,otel/* getSpan */.fU)(spanCtx);
        try {
            control_logger.debug(spanCtx, "Running command", {
                command: request.command,
                args: request.args,
                cwd: request.cwd,
            });
            const stream = (0,writable_iterable/* createWritableIterable */.Jt)();
            const effectiveCwd = request.cwd || process.cwd();
            if ((0,safe_spawn_cwd/* isSpawnCwdHopActive */.$Y)(effectiveCwd)) {
                (0,otel/* reportEvent */.HF)(spanCtx, safe_spawn_cwd/* SPAWN_CWD_HOP_USED_EVENT */.yo);
                control_logger.info(spanCtx, safe_spawn_cwd/* SPAWN_CWD_HOP_USED_EVENT */.yo, {
                    caller: "exec",
                    ...(0,safe_spawn_cwd/* spawnCwdHopLogFields */.iA)(effectiveCwd),
                });
            }
            const child = (0,workload_spawn/* spawnWorkload */.D9)(external_node_child_process_.spawn, request.command, request.args, {
                env: { ...process.env, ...request.environment },
                // exec has no input channel, so give the child /dev/null for stdin.
                // An open stdin pipe makes tools that read stdin when given no path
                // (e.g. `rg`) block forever, and keeps fd 0 open in background
                // processes, which can delay the `close` event.
                stdio: ["ignore", "pipe", "pipe"],
                cwd: effectiveCwd,
            });
            let streamFinalized = false;
            let stdoutBytes = 0;
            let stdoutPrefix = Buffer.alloc(0);
            const stdoutPrefixLimit = 32;
            function finalizeStream(err) {
                if (streamFinalized)
                    return;
                streamFinalized = true;
                if (err) {
                    stream.throw(err);
                }
                else {
                    stream.close();
                }
            }
            function safeStreamWrite(response) {
                void stream.write(response).catch((writeErr) => {
                    if (isClientDisconnectError(writeErr)) {
                        control_logger.debug(spanCtx, "Stream write failed (client disconnected)");
                    }
                    else {
                        control_logger.debug(spanCtx, "Stream write failed", {
                            error: writeErr instanceof Error ? writeErr.message : String(writeErr),
                        });
                    }
                    finalizeStream();
                });
            }
            child.stdout?.on("data", (data) => {
                stdoutBytes += data.length;
                if (stdoutPrefix.length < stdoutPrefixLimit) {
                    const take = Math.min(data.length, stdoutPrefixLimit - stdoutPrefix.length);
                    stdoutPrefix = Buffer.concat([stdoutPrefix, data.subarray(0, take)]);
                }
                if (streamFinalized)
                    return;
                const response = new control_service_pb/* ExecResponse */.fY({
                    event: {
                        case: "stdoutEvent",
                        value: new control_service_pb/* StdoutEvent */.Em({ data: data.toString() }),
                    },
                });
                safeStreamWrite(response);
            });
            child.stderr?.on("data", (data) => {
                if (streamFinalized)
                    return;
                const response = new control_service_pb/* ExecResponse */.fY({
                    event: {
                        case: "stderrEvent",
                        value: new control_service_pb/* StderrEvent */.LC({ data: data.toString() }),
                    },
                });
                safeStreamWrite(response);
            });
            child.on("close", (code) => {
                if ((0,safe_spawn_cwd/* isSpawnCwdHopCdFailure */.wz)({
                    exitCode: code,
                    stdoutBytes,
                    stdoutPrefix,
                    cwd: effectiveCwd,
                })) {
                    (0,otel/* reportEvent */.HF)(spanCtx, safe_spawn_cwd/* SPAWN_CWD_HOP_CD_FAILED_EVENT */.Gq);
                    control_logger.warn(spanCtx, safe_spawn_cwd/* SPAWN_CWD_HOP_CD_FAILED_EVENT */.Gq, {
                        caller: "exec",
                        ...(0,safe_spawn_cwd/* spawnCwdHopLogFields */.iA)(effectiveCwd),
                    });
                }
                span?.setAttribute("exec.exit_code", code ?? 0);
                span?.end();
                if (streamFinalized)
                    return;
                const response = new control_service_pb/* ExecResponse */.fY({
                    event: {
                        case: "exitEvent",
                        value: new control_service_pb/* ExitEvent */.Bd({ exitCode: code ?? 0 }),
                    },
                });
                void stream.write(response).then(() => finalizeStream(), (writeErr) => {
                    if (!isClientDisconnectError(writeErr)) {
                        control_logger.debug(spanCtx, "Stream write failed on close", {
                            error: writeErr instanceof Error ? writeErr.message : String(writeErr),
                        });
                    }
                    finalizeStream();
                });
            });
            child.on("error", (rawErr) => {
                if ((0,safe_spawn_cwd/* isSpawnCwdHopCdFailedError */.fK)(rawErr, effectiveCwd)) {
                    (0,otel/* reportEvent */.HF)(spanCtx, safe_spawn_cwd/* SPAWN_CWD_HOP_CD_FAILED_EVENT */.Gq);
                    control_logger.warn(spanCtx, safe_spawn_cwd/* SPAWN_CWD_HOP_CD_FAILED_EVENT */.Gq, {
                        caller: "exec",
                        ...(0,safe_spawn_cwd/* spawnCwdHopLogFields */.iA)(effectiveCwd),
                    });
                    span?.recordException(rawErr);
                    span?.end();
                    finalizeStream(rawErr);
                    return;
                }
                const err = annotateSpawnEnoent(rawErr, {
                    command: request.command,
                    cwd: effectiveCwd,
                });
                control_logger.error(spanCtx, "Process spawn error", err);
                span?.recordException(err);
                span?.end();
                finalizeStream(err);
            });
            // Yield from the stream
            yield* stream;
        }
        catch (error) {
            // Client disconnect errors (e.g. timeout on client side) are expected and not worth logging as errors
            if (isClientDisconnectError(error)) {
                control_logger.debug(ctx, "Client disconnected during streaming", {
                    code: error.code,
                });
                span?.end();
                return;
            }
            control_logger.error(spanCtx, "Exec request failed", error);
            span?.recordException(error);
            span?.end();
            throw toInternalConnectError("Exec command failed", error);
        }
    }
    async listDirectory(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.listDirectory", async (spanCtx, span) => {
            const requestPath = request.path || "";
            const includeHidden = request.includeHidden;
            span?.setAttribute("fs.include_hidden", includeHidden);
            try {
                const directoryPath = requestPath.length === 0 ? "." : requestPath;
                const dirents = await (0,promises_.readdir)(directoryPath, { withFileTypes: true });
                const entries = [];
                const visibleDirents = dirents.filter((dirent) => {
                    if (includeHidden)
                        return true;
                    return !dirent.name.startsWith(".");
                });
                const batchSize = 64;
                for (let i = 0; i < visibleDirents.length; i += batchSize) {
                    const batch = visibleDirents.slice(i, i + batchSize);
                    const batchEntries = await Promise.all(batch.map(async (dirent) => {
                        const entryAbsolutePath = external_node_path_default().resolve(directoryPath, dirent.name);
                        let entryType;
                        if (dirent.isSymbolicLink()) {
                            entryType = control_service_pb/* EntryType */.$Y.SYMLINK;
                        }
                        else if (dirent.isDirectory()) {
                            entryType = control_service_pb/* EntryType */.$Y.DIRECTORY;
                        }
                        else {
                            entryType = control_service_pb/* EntryType */.$Y.FILE;
                        }
                        try {
                            const stats = await (0,promises_.lstat)(entryAbsolutePath);
                            return new control_service_pb/* DirectoryEntry */.K4({
                                name: dirent.name,
                                path: entryAbsolutePath,
                                type: entryType,
                                sizeBytes: BigInt(stats.size),
                                modifiedAtUnixMs: BigInt(Math.trunc(stats.mtimeMs)),
                            });
                        }
                        catch (error) {
                            // If the entry disappears between readdir() and lstat(), skip it.
                            if (error instanceof Error && "code" in error) {
                                const nodeError = error;
                                if (nodeError.code === "ENOENT") {
                                    return null;
                                }
                            }
                            throw error;
                        }
                    }));
                    for (const entry of batchEntries) {
                        if (entry)
                            entries.push(entry);
                    }
                }
                entries.sort((a, b) => {
                    const aIsDir = a.type === control_service_pb/* EntryType */.$Y.DIRECTORY;
                    const bIsDir = b.type === control_service_pb/* EntryType */.$Y.DIRECTORY;
                    if (aIsDir && !bIsDir)
                        return -1;
                    if (!aIsDir && bIsDir)
                        return 1;
                    return a.name.localeCompare(b.name);
                });
                span?.setAttribute("fs.entry_count", entries.length);
                return new control_service_pb/* ListDirectoryResponse */.Rz({ entries });
            }
            catch (error) {
                logFilesystemError(spanCtx, "ListDirectory", error);
                throw mapFsErrorToConnectError(error, "ListDirectory");
            }
        });
    }
    /**
     * Read a text file from the filesystem
     */
    async readTextFile(ctx, request) {
        // Create a child span for this operation
        const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName("exec_daemon.readTextFile"));
        const span = (0,otel/* getSpan */.fU)(spanCtx);
        span?.setAttribute("file.path", request.path);
        try {
            control_logger.debug(spanCtx, "Reading file", { path: request.path });
            const content = await (0,promises_.readFile)(request.path, "utf8");
            span?.setAttribute("file.size", content.length);
            const response = new control_service_pb/* ReadTextFileResponse */.vy();
            response.content = content;
            span?.end();
            return response;
        }
        catch (error) {
            control_logger.error(spanCtx, "Read file failed", error, { path: request.path });
            span?.recordException(error);
            span?.end();
            if (error instanceof Error && "code" in error) {
                const nodeError = error;
                if (nodeError.code === "ENOENT") {
                    throw new connect_error/* ConnectError */.T("File not found", esm_code/* Code */.C.NotFound);
                }
                if (nodeError.code === "EACCES") {
                    throw new connect_error/* ConnectError */.T("Permission denied", esm_code/* Code */.C.PermissionDenied);
                }
                if (nodeError.code === "EISDIR") {
                    throw new connect_error/* ConnectError */.T("Path is a directory", esm_code/* Code */.C.InvalidArgument);
                }
            }
            throw createInternalError("Failed to read file", error);
        }
    }
    /**
     * Write a text file to the filesystem
     */
    async writeTextFile(ctx, request) {
        const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName("exec_daemon.writeTextFile"));
        const span = (0,otel/* getSpan */.fU)(spanCtx);
        try {
            control_logger.debug(spanCtx, "Writing file", { path: request.path });
            await (0,promises_.writeFile)(request.path, request.content, "utf8");
            span?.end();
            return new control_service_pb/* WriteTextFileResponse */.eb();
        }
        catch (error) {
            control_logger.error(spanCtx, "Write file failed", error, { path: request.path });
            span?.recordException(error);
            span?.end();
            if (error instanceof Error && "code" in error) {
                const nodeError = error;
                if (nodeError.code === "ENOENT") {
                    throw new connect_error/* ConnectError */.T("Directory not found", esm_code/* Code */.C.NotFound);
                }
                if (nodeError.code === "EACCES") {
                    throw new connect_error/* ConnectError */.T("Permission denied", esm_code/* Code */.C.PermissionDenied);
                }
                if (nodeError.code === "EISDIR") {
                    throw new connect_error/* ConnectError */.T("Path is a directory", esm_code/* Code */.C.InvalidArgument);
                }
            }
            throw createInternalError("Failed to write file", error);
        }
    }
    /**
     * Read a binary file from the filesystem
     */
    async readBinaryFile(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.readBinaryFile", async (spanCtx, span) => {
            try {
                control_logger.debug(spanCtx, "Reading binary file", { path: request.path });
                const content = await (0,promises_.readFile)(request.path);
                span?.setAttribute("file.size", content.length);
                const response = new control_service_pb/* ReadBinaryFileResponse */.TV();
                response.content = new Uint8Array(content);
                return response;
            }
            catch (error) {
                control_logger.error(spanCtx, "Read binary file failed", error, {
                    path: request.path,
                });
                if (error instanceof Error && "code" in error) {
                    const nodeError = error;
                    if (nodeError.code === "ENOENT") {
                        throw new connect_error/* ConnectError */.T("File not found", esm_code/* Code */.C.NotFound);
                    }
                    if (nodeError.code === "EACCES") {
                        throw new connect_error/* ConnectError */.T("Permission denied", esm_code/* Code */.C.PermissionDenied);
                    }
                    if (nodeError.code === "EISDIR") {
                        throw new connect_error/* ConnectError */.T("Path is a directory", esm_code/* Code */.C.InvalidArgument);
                    }
                }
                throw createInternalError("Failed to read binary file", error);
            }
        });
    }
    async *exportFile(ctx, request) {
        const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName("exec_daemon.exportFile"));
        const span = (0,otel/* getSpan */.fU)(spanCtx);
        try {
            for await (const part of exportFileChunks({
                filePath: request.path,
                workspaceRootPath: request.workspaceRootPath,
                authoritativeWorkspaceRootPaths: this.workspacePaths,
            })) {
                if (part.type === "metadata") {
                    span?.setAttribute("file.size", part.totalBytes.toString());
                    yield new control_service_pb/* ExportFileResponse */.o_({
                        payload: {
                            case: "metadata",
                            value: new control_service_pb/* ExportFileMetadata */.mc({
                                totalBytes: part.totalBytes,
                            }),
                        },
                    });
                }
                else {
                    yield new control_service_pb/* ExportFileResponse */.o_({
                        payload: {
                            case: "contentChunk",
                            value: part.contentChunk,
                        },
                    });
                }
            }
        }
        catch (error) {
            span?.recordException(error);
            throw mapFsErrorToConnectError(error, "Export file");
        }
        finally {
            span?.end();
        }
    }
    /**
     * Write a binary file to the filesystem
     */
    async writeBinaryFile(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.writeBinaryFile", async (spanCtx, span) => {
            span?.setAttribute("file.size", request.content.length);
            try {
                control_logger.debug(spanCtx, "Writing binary file", { path: request.path });
                await (0,promises_.writeFile)(request.path, request.content);
                return new control_service_pb/* WriteBinaryFileResponse */.Qp();
            }
            catch (error) {
                control_logger.error(spanCtx, "Write binary file failed", error, {
                    path: request.path,
                });
                if (error instanceof Error && "code" in error) {
                    const nodeError = error;
                    if (nodeError.code === "ENOENT") {
                        throw new connect_error/* ConnectError */.T("Directory not found", esm_code/* Code */.C.NotFound);
                    }
                    if (nodeError.code === "EACCES") {
                        throw new connect_error/* ConnectError */.T("Permission denied", esm_code/* Code */.C.PermissionDenied);
                    }
                    if (nodeError.code === "EISDIR") {
                        throw new connect_error/* ConnectError */.T("Path is a directory", esm_code/* Code */.C.InvalidArgument);
                    }
                }
                throw createInternalError("Failed to write binary file", error);
            }
        });
    }
    /**
     * Get git diff between refs
     */
    async getDiff(ctx, request) {
        // Create a child span for this operation
        const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName("exec_daemon.getDiff"));
        const span = (0,otel/* getSpan */.fU)(spanCtx);
        span?.setAttribute("git.cwd", request.cwd);
        span?.setAttribute("git.base_ref", request.baseRef);
        span?.setAttribute("git.ref", request.ref);
        try {
            control_logger.debug(spanCtx, "Getting git diff", {
                cwd: request.cwd,
                baseRef: request.baseRef,
                ref: request.ref,
            });
            const result = await this.gitService.getDiff(request.cwd, getGitOptionsFromGetDiffRequest(request));
            span?.end();
            return result;
        }
        catch (error) {
            control_logger.error(spanCtx, "Get diff failed", error, { request });
            span?.recordException(error);
            span?.end();
            throw createInternalError("Failed to get diff", error);
        }
    }
    async batchGetDiff(ctx, request) {
        const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName("exec_daemon.batchGetDiff"));
        const span = (0,otel/* getSpan */.fU)(spanCtx);
        span?.setAttribute("batch.item_count", request.items.length);
        try {
            const fetchesByCwd = new Map();
            for (const item of request.items) {
                const diffRequest = item.diffRequest;
                if (diffRequest === undefined) {
                    continue;
                }
                let branches = fetchesByCwd.get(diffRequest.cwd);
                if (branches === undefined) {
                    branches = new Set();
                    fetchesByCwd.set(diffRequest.cwd, branches);
                }
                for (const branch of item.fetchBranches) {
                    branches.add(branch);
                }
            }
            let totalFetches = 0;
            for (const branches of fetchesByCwd.values()) {
                totalFetches += branches.size;
            }
            span?.setAttribute("batch.cwd_count", fetchesByCwd.size);
            span?.setAttribute("batch.fetch_count", totalFetches);
            control_logger.debug(spanCtx, "Running batch get diff", {
                itemCount: request.items.length,
                cwdCount: fetchesByCwd.size,
                fetchCount: totalFetches,
            });
            const fetchedByCwd = new Map();
            const failedByCwd = new Map();
            const fetchErrorsByCwd = new Map();
            // Parallelize across cwds (different repos can fetch concurrently with no
            // contention) but sequential within a cwd to avoid racing on .git locks
            // (refs/heads/<branch>.lock, packed-refs.lock, index.lock).
            await (0,promise_extras/* asyncMapValues */.PH)([...fetchesByCwd.entries()], async ([cwd, branches]) => {
                const fetched = new Set();
                const failed = new Set();
                const errors = new Map();
                for (const branch of branches) {
                    try {
                        await this.fetchBranch({ cwd, branch });
                        fetched.add(branch);
                    }
                    catch (error) {
                        const message = getErrorMessage(error);
                        failed.add(branch);
                        errors.set(branch, message);
                        control_logger.debug(spanCtx, "Batch get diff fetch failed", {
                            branch,
                            error: message,
                        });
                    }
                }
                if (fetched.size > 0)
                    fetchedByCwd.set(cwd, fetched);
                if (failed.size > 0) {
                    failedByCwd.set(cwd, failed);
                    fetchErrorsByCwd.set(cwd, errors);
                }
            }, { max: 4 });
            let totalFetched = 0;
            let totalFailed = 0;
            for (const set of fetchedByCwd.values())
                totalFetched += set.size;
            for (const set of failedByCwd.values())
                totalFailed += set.size;
            span?.setAttribute("batch.fetched_count", totalFetched);
            span?.setAttribute("batch.failed_count", totalFailed);
            const results = [];
            let diffSuccessCount = 0;
            let diffFailureCount = 0;
            let diffUnchangedCount = 0;
            for (let i = 0; i < request.items.length; i++) {
                const item = request.items[i];
                const diffRequest = item.diffRequest;
                if (diffRequest === undefined) {
                    results.push(this.createBatchGetDiffErrorResult({
                        itemIndex: i,
                        fetchedBranches: [],
                        failedBranches: [],
                        kind: control_service_pb/* BatchGetDiffErrorKind */.G3.INTERNAL,
                        message: "Missing diff request",
                    }));
                    diffFailureCount += 1;
                    continue;
                }
                const fetchedBranches = item.fetchBranches.filter((branch) => fetchedByCwd.get(diffRequest.cwd)?.has(branch));
                const failedBranches = item.fetchBranches.filter((branch) => failedByCwd.get(diffRequest.cwd)?.has(branch));
                if (failedBranches.length > 0) {
                    const errors = fetchErrorsByCwd.get(diffRequest.cwd);
                    results.push(this.createBatchGetDiffErrorResult({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        kind: control_service_pb/* BatchGetDiffErrorKind */.G3.FETCH_FAILED,
                        message: failedBranches.map((branch) => errors?.get(branch) ?? branch).join("\n"),
                    }));
                    diffFailureCount += 1;
                    continue;
                }
                const gitOptions = {
                    ...getGitOptionsFromGetDiffRequest(diffRequest),
                    useCatFileBatch: item.useCatFileBatch === true,
                };
                const revisions = await this.resolveDiffRevisionsBestEffort(spanCtx, diffRequest.cwd, gitOptions);
                const resolvedFields = {
                    resolvedBaseSha: revisions?.baseSha,
                    resolvedHeadSha: revisions?.headSha,
                    resolvedWorkspaceHash: revisions?.workspaceHash,
                };
                if (revisions !== undefined && knownRevisionsMatch(item, revisions)) {
                    results.push(new control_service_pb/* BatchGetDiffResult */.p$({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        result: { case: "unchanged", value: new control_service_pb/* BatchGetDiffUnchanged */.tZ() },
                        ...resolvedFields,
                    }));
                    diffUnchangedCount += 1;
                    continue;
                }
                try {
                    const diff = await this.gitService.getDiff(diffRequest.cwd, gitOptions);
                    results.push(new control_service_pb/* BatchGetDiffResult */.p$({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        result: { case: "diff", value: diff },
                        ...resolvedFields,
                    }));
                    diffSuccessCount += 1;
                }
                catch (error) {
                    const message = getErrorMessage(error);
                    control_logger.error(spanCtx, "Batch get diff item failed", error, {
                        itemIndex: i,
                    });
                    results.push(this.createBatchGetDiffErrorResult({
                        itemIndex: i,
                        fetchedBranches,
                        failedBranches,
                        kind: control_service_pb/* BatchGetDiffErrorKind */.G3.DIFF_FAILED,
                        message,
                    }));
                    diffFailureCount += 1;
                }
            }
            span?.setAttribute("batch.diff_success_count", diffSuccessCount);
            span?.setAttribute("batch.diff_failure_count", diffFailureCount);
            span?.setAttribute("batch.diff_unchanged_count", diffUnchangedCount);
            span?.end();
            return new control_service_pb/* BatchGetDiffResponse */.hO({ results });
        }
        catch (error) {
            control_logger.error(spanCtx, "Batch get diff failed", error);
            span?.recordException(error);
            span?.end();
            throw createInternalError("Failed to batch get diff", error);
        }
    }
    /**
     * Resolution failing must never fail the diff: the caller just gets no
     * revisions to record and recomputes next time.
     */
    async resolveDiffRevisionsBestEffort(ctx, cwd, options) {
        try {
            return await this.gitService.resolveDiffRevisions(cwd, options);
        }
        catch (error) {
            control_logger.debug(ctx, "Batch get diff revision resolution failed", {
                cwd,
                error: getErrorMessage(error),
            });
            return undefined;
        }
    }
    async fetchBranch({ cwd, branch }) {
        // Forward the abort signal so a timed-out fetch kills the underlying
        // git process. Otherwise an orphan can hold .git locks
        // (refs/heads/<branch>.lock, packed-refs.lock, index.lock) and break
        // the sequential-within-cwd guarantee in batchGetDiff.
        await withTimeoutAndAbort((signal) => this.gitService.executeGitCommand(cwd, ["fetch", "origin", branch], {
            signal,
        }), BATCH_GET_DIFF_FETCH_TIMEOUT_MS);
    }
    createBatchGetDiffErrorResult(args) {
        return new control_service_pb/* BatchGetDiffResult */.p$({
            itemIndex: args.itemIndex,
            fetchedBranches: args.fetchedBranches,
            failedBranches: args.failedBranches,
            result: {
                case: "error",
                value: new control_service_pb/* BatchGetDiffError */.Eb({
                    kind: args.kind,
                    message: args.message,
                }),
            },
        });
    }
    /**
     * Get workspace changes hash
     */
    async getWorkspaceChangesHash(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.getWorkspaceChangesHash", async (spanCtx, span) => {
            span?.setAttribute("git.has_base_ref", request.baseRef.length > 0);
            try {
                control_logger.debug(spanCtx, "Getting workspace changes hash", {
                    rootPath: request.rootPath,
                    baseRef: request.baseRef,
                });
                const hash = await this.gitService.getWorkspaceChangesHash(request.rootPath, request.baseRef);
                return new control_service_pb/* GetWorkspaceChangesHashResponse */.Y_({ hash });
            }
            catch (error) {
                control_logger.error(spanCtx, "Get workspace changes hash failed", error, {
                    request,
                });
                throw createInternalError("Failed to get workspace changes hash", error);
            }
        });
    }
    /**
     * Refresh access token for GitHub or GitLab
     */
    async refreshGithubAccessToken(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.refreshGithubAccessToken", async (spanCtx, span) => {
            if (this.githubTokenPushConsent === false) {
                throw new connect_error/* ConnectError */.T("Start the worker with --mint-github-token to allow GitHub token pushes", esm_code/* Code */.C.PermissionDenied);
            }
            span?.setAttribute("git.has_repo_url", request.repoUrl !== undefined && request.repoUrl.length > 0);
            try {
                const cloneUsername = request.cloneUsername !== undefined && request.cloneUsername.length > 0
                    ? request.cloneUsername
                    : undefined;
                span?.setAttribute("git.clone_username_requested", cloneUsername !== undefined);
                // If we're refreshing a token just for a specific repo (per-repo auth), we need to discover the workspace paths that may require rewrites because the single global rewrite won't work
                // Host-scoped refreshes that carry a clone username also discover
                // paths: normalizing every same-host embedded remote (multi-repo
                // pods keep them under /agent/repos, not the daemon cwd) is what
                // lets the fresh rewrite apply.
                const workspaceDiscovery = (request.repoUrl !== undefined && request.repoUrl.length > 0) ||
                    cloneUsername !== undefined
                    ? await (0,workspace_discovery/* discoverExecDaemonWorkspacePaths */.MH)(spanCtx, new local_exec_dist/* LocalGitExecutor */.xK7(), process.cwd())
                    : undefined;
                span?.setAttribute("git.workspace_path_count", workspaceDiscovery?.workspacePaths.length ?? 0);
                const refreshStats = await this.gitService.refreshGithubAccessToken(request.githubAccessToken, request.hostname, {
                    repoPaths: workspaceDiscovery?.workspacePaths,
                    repoUrl: request.repoUrl,
                    cloneUsername,
                });
                // Passive telemetry for CS-216-class regressions: which scheme
                // actually landed and whether the stale state was displaced.
                // Queryable per pod in Datadog APM on this span.
                span?.setAttribute("git.applied_clone_username", refreshStats.appliedCloneUsername);
                span?.setAttribute("git.stale_rewrites_displaced", refreshStats.staleRewritesDisplaced);
                span?.setAttribute("git.remotes_normalized", refreshStats.remotesNormalized);
                this.secretRedactionState?.refreshFromEnv(process.env);
            }
            catch (_error) {
                // We keep this error opaque to avoid leaking the access token to clients and logs.
                throw new connect_error/* ConnectError */.T("Failed to refresh access token", esm_code/* Code */.C.Internal);
            }
            if (this.onGithubAccessTokenRefreshed !== undefined) {
                try {
                    await this.onGithubAccessTokenRefreshed();
                }
                catch (error) {
                    // This RPC returns to the backend; the hook contract (see
                    // ControlServerOptions) is that its message is already safe to
                    // forward, so what git said becomes readable in our own logs.
                    throw new connect_error/* ConnectError */.T(formatCloneAfterTokenRefreshFailure(error), esm_code/* Code */.C.Internal);
                }
            }
            return new control_service_pb/* RefreshGithubAccessTokenResponse */.Jm();
        });
    }
    /**
     * Warm cursor server
     */
    async warmRemoteAccessServer(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.warmRemoteAccessServer", async (spanCtx) => {
            try {
                await this.remoteAccessService.warmCursorServer(spanCtx, request.commit, request.port, request.connectionToken);
                return new control_service_pb/* WarmRemoteAccessServerResponse */.Ks();
            }
            catch (error) {
                throw createInternalError("Failed to warm remote access server", error);
            }
        });
    }
    /**
     * Download cursor server binary without starting it
     */
    async downloadCursorServer(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.downloadCursorServer", async (spanCtx, span) => {
            try {
                const alreadyDownloaded = await this.remoteAccessService.downloadCursorServer(spanCtx, request.commit);
                span?.setAttribute("remote.already_downloaded", alreadyDownloaded);
                return new control_service_pb/* DownloadCursorServerResponse */.Nj({ alreadyDownloaded });
            }
            catch (error) {
                throw createInternalError("Failed to download cursor server", error);
            }
        });
    }
    async listArtifacts(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.listArtifacts", async (spanCtx, span) => {
            span?.setAttribute("artifact.extra_path_count", request.extraPaths.length);
            try {
                const { manager, rootKind, artifactsRootPath } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                const responseRootKind = rootKind === "agent_store_backed"
                    ? control_service_pb/* ArtifactRootKind */.v$.AGENT_STORE_BACKED
                    : control_service_pb/* ArtifactRootKind */.v$.LOCAL;
                const extraPaths = request.extraPaths;
                const artifacts = await manager.listArtifacts(spanCtx);
                span?.setAttribute("artifact.existing_count", artifacts.length);
                if (extraPaths.length === 0) {
                    span?.setAttribute("artifact.path_error_count", 0);
                    return new control_service_pb/* ListArtifactsResponse */.pl({
                        artifacts,
                        rootKind: responseRootKind,
                    });
                }
                const existingPathIndexes = new Map();
                const existingStorePathIndexes = new Map();
                for (const [index, artifact] of artifacts.entries()) {
                    const normalizedArtifactPath = (0,cloud_agent_artifact_paths/* normalizeCloudAgentArtifactAbsolutePath */.Yk)(artifact.absolutePath) ?? artifact.absolutePath;
                    existingPathIndexes.set(normalizedArtifactPath, index);
                    const storeRelativePath = (0,cloud_agent_artifact_paths/* toAgentStoreArtifactPath */.rK)({
                        absolutePath: normalizedArtifactPath,
                        artifactsRootPath,
                    })?.storeRelativePath;
                    if (storeRelativePath !== undefined) {
                        existingStorePathIndexes.set(storeRelativePath, index);
                    }
                }
                // Track normalized paths we've already considered (including extra paths)
                // so variants like /foo/./bar don't produce duplicate entries.
                const seenExtraPaths = new Set();
                const extraArtifacts = [];
                const pathErrors = {};
                for (const rawPath of extraPaths) {
                    const normalizedPath = (0,cloud_agent_artifact_paths/* normalizeCloudAgentArtifactAbsolutePath */.Yk)(rawPath);
                    if (normalizedPath === undefined) {
                        pathErrors[rawPath] = new control_service_pb/* ArtifactPathError */.uR({
                            kind: control_service_pb/* ArtifactPathErrorKind */.UL.INVALID_PATH,
                            code: "INVALID_PATH",
                            message: "Invalid artifact path",
                        });
                        continue;
                    }
                    if (seenExtraPaths.has(normalizedPath)) {
                        continue;
                    }
                    seenExtraPaths.add(normalizedPath);
                    const storeRelativePath = (0,cloud_agent_artifact_paths/* toAgentStoreArtifactPath */.rK)({
                        absolutePath: normalizedPath,
                        artifactsRootPath,
                    })?.storeRelativePath;
                    const existingIndex = existingPathIndexes.get(normalizedPath) ??
                        (storeRelativePath === undefined
                            ? undefined
                            : existingStorePathIndexes.get(storeRelativePath));
                    try {
                        const stat = await (0,promises_.lstat)(normalizedPath);
                        if (!stat.isFile()) {
                            if (existingIndex !== undefined) {
                                continue;
                            }
                            pathErrors[normalizedPath] = new control_service_pb/* ArtifactPathError */.uR({
                                kind: control_service_pb/* ArtifactPathErrorKind */.UL.NOT_A_FILE,
                                code: "NOT_A_FILE",
                                message: "Path is not a file",
                            });
                            continue;
                        }
                        const sizeBytes = BigInt(stat.size);
                        const updatedAtUnixMs = BigInt(Math.trunc(stat.mtimeMs));
                        const existing = existingIndex === undefined ? undefined : artifacts[existingIndex];
                        const mtimeDifferenceMs = existing === undefined
                            ? undefined
                            : existing.updatedAtUnixMs >= updatedAtUnixMs
                                ? existing.updatedAtUnixMs - updatedAtUnixMs
                                : updatedAtUnixMs - existing.updatedAtUnixMs;
                        if (existing?.sizeBytes === sizeBytes &&
                            mtimeDifferenceMs !== undefined &&
                            mtimeDifferenceMs <= BigInt(artifactUploads/* ARTIFACT_MTIME_TOLERANCE_MS */.fE)) {
                            continue;
                        }
                        const sourceArtifact = new control_service_pb/* ArtifactUploadMetadata */.b0({
                            absolutePath: normalizedPath,
                            artifactRelativePath: manager.getArtifactRelativePath(normalizedPath),
                            sizeBytes,
                            updatedAtUnixMs,
                            status: control_service_pb/* ArtifactUploadStatus */.M7.NOT_STARTED,
                        });
                        if (existingIndex === undefined) {
                            extraArtifacts.push(sourceArtifact);
                        }
                        else {
                            artifacts[existingIndex] = sourceArtifact;
                        }
                    }
                    catch (error) {
                        if (existingIndex !== undefined) {
                            continue;
                        }
                        if (error instanceof Error && "code" in error) {
                            const nodeError = error;
                            switch (nodeError.code) {
                                case "ENOENT":
                                    pathErrors[normalizedPath] = new control_service_pb/* ArtifactPathError */.uR({
                                        kind: control_service_pb/* ArtifactPathErrorKind */.UL.MISSING,
                                        code: nodeError.code,
                                        message: nodeError.message,
                                    });
                                    continue;
                                case "EACCES":
                                case "EPERM":
                                    pathErrors[normalizedPath] = new control_service_pb/* ArtifactPathError */.uR({
                                        kind: control_service_pb/* ArtifactPathErrorKind */.UL.PERMISSION,
                                        code: nodeError.code,
                                        message: nodeError.message,
                                    });
                                    continue;
                                case "ENOTDIR":
                                case "EISDIR":
                                    pathErrors[normalizedPath] = new control_service_pb/* ArtifactPathError */.uR({
                                        kind: control_service_pb/* ArtifactPathErrorKind */.UL.NOT_A_FILE,
                                        code: nodeError.code,
                                        message: nodeError.message,
                                    });
                                    continue;
                                default:
                                    break;
                            }
                        }
                        logFilesystemError(spanCtx, "listArtifacts extra path stat", error);
                        const err = error instanceof Error ? error : new Error(String(error));
                        pathErrors[normalizedPath] = new control_service_pb/* ArtifactPathError */.uR({
                            kind: control_service_pb/* ArtifactPathErrorKind */.UL.UNKNOWN,
                            code: "UNKNOWN",
                            message: err.message,
                        });
                    }
                }
                span?.setAttribute("artifact.extra_artifact_count", extraArtifacts.length);
                span?.setAttribute("artifact.path_error_count", Object.keys(pathErrors).length);
                return new control_service_pb/* ListArtifactsResponse */.pl({
                    artifacts: [...artifacts, ...extraArtifacts],
                    pathErrors,
                    rootKind: responseRootKind,
                });
            }
            catch (error) {
                control_logger.error(spanCtx, "Failed to list artifacts", error);
                throw createInternalError("Failed to list artifacts", error);
            }
        });
    }
    async uploadArtifacts(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.uploadArtifacts", async (spanCtx, span) => {
            span?.setAttribute("artifact.upload_count", request.uploads.length);
            span?.setAttribute("artifact.wait_for_completion", request.waitForCompletion);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                return await manager.uploadArtifacts(spanCtx, request.uploads, request.waitForCompletion);
            }
            catch (error) {
                control_logger.error(spanCtx, "Failed to start artifact uploads", error);
                throw createInternalError("Failed to start artifact uploads", error);
            }
        });
    }
    async persistArtifactsToAgentStore(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.persistArtifactsToAgentStore", async (spanCtx, span) => {
            span?.setAttribute("artifact.persist_count", request.artifacts.length);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                return await manager.persistArtifactsToAgentStore(spanCtx, request.artifacts);
            }
            catch (error) {
                control_logger.error(spanCtx, "Failed to persist artifacts to Agent Store", error);
                throw createInternalError("Failed to persist artifacts to Agent Store", error);
            }
        });
    }
    async persistArtifactsToParentStore(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.persistArtifactsToParentStore", async (spanCtx, span) => {
            span?.setAttribute("artifact.persist_count", request.artifacts.length);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                return await manager.persistArtifactsToParentStore(spanCtx, request.artifacts);
            }
            catch (error) {
                control_logger.error(spanCtx, "Failed to persist artifacts to parent store", error);
                throw createInternalError("Failed to persist artifacts to parent store", error);
            }
        });
    }
    async restoreArtifacts(ctx, request) {
        return await runControlSpan(ctx, "exec_daemon.restoreArtifacts", async (spanCtx, span) => {
            span?.setAttribute("artifact.restore_count", request.artifacts.length);
            try {
                const { manager, rootKind } = await this.artifactUploadManagerProvider.get(spanCtx);
                span?.setAttribute("artifact.root_kind", rootKind);
                const response = await manager.restoreArtifacts(spanCtx, request.artifacts);
                span?.setAttribute("artifact.restore_result_count", response.results.length);
                return response;
            }
            catch (error) {
                control_logger.error(spanCtx, "Failed to restore artifacts", error);
                throw createInternalError("Failed to restore artifacts", error);
            }
        });
    }
    async getMcpRefreshTokens(ctx, _request) {
        return await runControlSpan(ctx, "exec_daemon.getMcpRefreshTokens", async (spanCtx, span) => {
            try {
                const tokens = (0,mcp_token_storage/* getRefreshedMcpOAuthTokens */.w8)();
                span?.setAttribute("mcp.refresh_token_count", Object.keys(tokens).length);
                const refreshTokens = {};
                for (const [serverUrl, data] of Object.entries(tokens)) {
                    refreshTokens[serverUrl] = data.refreshToken;
                }
                return new control_service_pb/* GetMcpRefreshTokensResponse */.TL({ refreshTokens });
            }
            catch (error) {
                control_logger.error(spanCtx, "Failed to get MCP OAuth tokens", error);
                throw createInternalError("Failed to get MCP OAuth tokens", error);
            }
        });
    }
    withEnvUpdateLock(fn) {
        const result = this.envUpdateChain.then(fn, fn);
        this.envUpdateChain = result.then(() => undefined, () => undefined);
        return result;
    }
    async updateEnvironmentVariables(ctx, request) {
        return this.withEnvUpdateLock(() => this.updateEnvironmentVariablesLocked(ctx, request));
    }
    async tearDownClaimState(ctx, options) {
        if (options.removeGitCredentials) {
            await this.gitService.removeGithubAccessToken();
        }
        await this.withEnvUpdateLock(async () => {
            const allSecretNames = this.managedEnvironment.snapshot()[secretRedaction/* CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR */.gz];
            if (allSecretNames === undefined) {
                return;
            }
            const keysToRemove = new Set((0,comma_separated_names/* parseCommaSeparatedNames */.w)(allSecretNames));
            keysToRemove.add(secretRedaction/* CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR */.gz);
            keysToRemove.add(secretRedaction/* CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR */.l1);
            await this.updateEnvironmentVariablesLocked(ctx, new control_service_pb/* UpdateEnvironmentVariablesRequest */.t3({ env: {} }), [...keysToRemove]);
        });
    }
    async updateEnvironmentVariablesLocked(ctx, request, claimKeysToRemove) {
        return await runControlSpan(ctx, "exec_daemon.updateEnvironmentVariables", async (spanCtx, span) => {
            const envEntries = request.env;
            const replace = request.replace === true;
            const restorePreviousValues = request.restorePreviousValues === true;
            // Run-scoped overlay refcounting by holder (see runScopedOverlays).
            // Return early for the no-op references: a non-first apply or a
            // non-last release. releasedOverlayKeysToRemove is set only on the
            // last release; overlayApplyRunId only on the first apply (recorded
            // after the apply succeeds). Adding/removing holders is idempotent, so
            // a retried apply (same holder) cannot inflate the refcount and strand
            // run env on the VM.
            const overlay = request.runScopedOverlay;
            let releasedOverlayKeysToRemove;
            let overlayApplyRunId;
            if (overlay !== undefined) {
                const existing = this.runScopedOverlays.get(overlay.runId);
                if (overlay.release) {
                    if (existing === undefined) {
                        return new control_service_pb/* UpdateEnvironmentVariablesResponse */.zj({
                            applied: 0,
                            removed: 0,
                        });
                    }
                    existing.holders.delete(overlay.holder);
                    if (existing.holders.size > 0) {
                        return new control_service_pb/* UpdateEnvironmentVariablesResponse */.zj({
                            applied: 0,
                            removed: 0,
                        });
                    }
                    this.runScopedOverlays.delete(overlay.runId);
                    releasedOverlayKeysToRemove = [...existing.keys];
                }
                else if (existing !== undefined) {
                    existing.holders.add(overlay.holder);
                    return new control_service_pb/* UpdateEnvironmentVariablesResponse */.zj({
                        applied: 0,
                        removed: 0,
                    });
                }
                else {
                    overlayApplyRunId = overlay.runId;
                }
            }
            span?.setAttribute("env.requested_count", Object.keys(envEntries).length);
            span?.setAttribute("env.replace", replace);
            span?.setAttribute("env.restore_previous_values", restorePreviousValues);
            if (restorePreviousValues) {
                // Remember the value each updated key currently shadows so teardown
                // can restore it. This must include keys already held by a base
                // (agent/team/user) managed secret: a run-scoped overlay var that
                // shares a name otherwise permanently deletes that base secret when
                // the overlay is removed. The `has` guard keeps the earliest value
                // across repeated applies for the same key.
                for (const key of Object.keys(envEntries)) {
                    if (!this.previousManagedEnvironmentValues.has(key)) {
                        this.previousManagedEnvironmentValues.set(key, process.env[key]);
                    }
                }
            }
            // A non-replace push carries the secret-name manifest of THAT sync
            // pass only, while the secret values it delivered earlier persist
            // (replace:false never removes keys). Overwriting the manifest with a
            // smaller list would orphan previously delivered values: still set in
            // the managed environment, but no longer named by the manifest that
            // tearDownClaimState and redaction trust. Union the incoming manifest
            // with the current one so it always names every delivered key.
            // Replace-mode pushes reset the whole managed set and claim teardown
            // removes the manifest keys, so both still reset the union.
            let effectiveEnvEntries = envEntries;
            if (claimKeysToRemove === undefined &&
                releasedOverlayKeysToRemove === undefined &&
                !replace) {
                const currentManagedEnv = this.managedEnvironment.snapshot();
                for (const manifestKey of [
                    secretRedaction/* CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR */.gz,
                    secretRedaction/* CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR */.l1,
                ]) {
                    const incomingNames = envEntries[manifestKey];
                    if (incomingNames === undefined) {
                        continue;
                    }
                    const mergedNames = [
                        ...new Set([
                            ...(0,comma_separated_names/* parseCommaSeparatedNames */.w)(currentManagedEnv[manifestKey]),
                            ...(0,comma_separated_names/* parseCommaSeparatedNames */.w)(incomingNames),
                        ]),
                    ].join(",");
                    if (mergedNames !== incomingNames) {
                        if (effectiveEnvEntries === envEntries) {
                            effectiveEnvEntries = { ...envEntries };
                        }
                        effectiveEnvEntries[manifestKey] = mergedNames;
                    }
                }
            }
            let update;
            try {
                if (releasedOverlayKeysToRemove !== undefined) {
                    update = this.managedEnvironment.remove(releasedOverlayKeysToRemove);
                }
                else if (claimKeysToRemove !== undefined) {
                    update = this.managedEnvironment.remove(claimKeysToRemove);
                }
                else {
                    update = this.managedEnvironment.apply({
                        env: effectiveEnvEntries,
                        replace,
                    });
                }
            }
            catch (error) {
                if (error instanceof managed_environment/* ManagedEnvironmentValidationError */._Z) {
                    throw new connect_error/* ConnectError */.T(error.message, esm_code/* Code */.C.InvalidArgument);
                }
                throw error;
            }
            if (overlayApplyRunId !== undefined && overlay !== undefined) {
                this.runScopedOverlays.set(overlayApplyRunId, {
                    keys: new Set(Object.keys(envEntries)),
                    holders: new Set([overlay.holder]),
                });
            }
            const nextSecretNamesEnv = update.removedKeys.includes(secretRedaction/* CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR */.l1)
                ? undefined
                : (update.env[secretRedaction/* CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR */.l1] ??
                    process.env[secretRedaction/* CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR */.l1]);
            // Snapshot removed redacted values before mutating process.env. Existing
            // tmux panes can keep old env vars until they are idle enough to refresh.
            this.secretRedactionState?.retainSecretsRemovedByEnvUpdate({
                env: process.env,
                nextSecretNamesEnv,
                removedKeys: update.removedKeys,
            });
            for (const key of update.removedKeys) {
                if (restorePreviousValues && this.previousManagedEnvironmentValues.has(key)) {
                    const previousValue = this.previousManagedEnvironmentValues.get(key);
                    this.previousManagedEnvironmentValues.delete(key);
                    if (previousValue === undefined) {
                        delete process.env[key];
                        this.pendingUnsets.add(key);
                        this.pendingRestores.delete(key);
                    }
                    else {
                        process.env[key] = previousValue;
                        this.pendingRestores.set(key, previousValue);
                        this.pendingUnsets.delete(key);
                    }
                }
                else {
                    delete process.env[key];
                    this.pendingUnsets.add(key);
                    this.pendingRestores.delete(key);
                }
            }
            // If a previously-removed key is being re-added, stop unsetting it.
            for (const key of Object.keys(update.env)) {
                this.pendingUnsets.delete(key);
                this.pendingRestores.delete(key);
            }
            let applied = 0;
            for (const [name, value] of Object.entries(update.env)) {
                process.env[name] = value;
                applied += 1;
            }
            // Build a restore script that re-exports managed env vars after shell state
            // snapshot restore. The shell-exec snapshot-restore mechanism captures all
            // exported env vars via `export -p` and replays them via `eval "$snap"` on
            // each command. This means env vars updated via this RPC would be overwritten
            // by stale values baked into the snapshot.
            //
            // __CURSOR_SANDBOX_ENV_RESTORE is:
            //   - filtered from state dumps (by the CURSOR_SANDBOX grep pattern in
            //     dump_bash_state.ts, dump_zsh_state.ts, dump_zsh_state_light.ts)
            //   - eval'd AFTER snapshot restore in bash.ts, zsh.ts, zsh-light.ts
            //
            // This ensures updated values override stale snapshot values. The same
            // mechanism is used by the sandbox helper (env.rs) to preserve proxy env
            // vars across snapshot restores. It is safe to reuse here because
            // exec-daemon always uses the insecure_none sandbox policy, so the sandbox
            // helper never sets this variable.
            const restoreParts = [];
            // Unset removed keys so the snapshot's declare -x doesn't resurrect them.
            // pendingUnsets persists across calls so that rapid successive replace
            // calls (e.g., user clicking "save" twice) don't lose the unset commands
            // before a shell command runs and updates the snapshot. Unsetting a
            // non-existent variable is a harmless no-op in bash.
            for (const key of this.pendingUnsets) {
                restoreParts.push(`unset ${key}`);
            }
            for (const [key, value] of this.pendingRestores) {
                const escaped = value.replace(/'/g, "'\\''");
                restoreParts.push(`builtin export ${key}='${escaped}'`);
            }
            // Re-export ALL managed env vars (not just the current request's vars), so
            // shell snapshot restore cannot silently revert values from earlier calls.
            for (const [key, value] of this.managedEnvironment.entries()) {
                const escaped = value.replace(/'/g, "'\\''");
                restoreParts.push(`builtin export ${key}='${escaped}'`);
            }
            if (restoreParts.length > 0) {
                process.env[managed_environment/* SANDBOX_ENV_RESTORE_ENV_VAR */.j8] = restoreParts.join("; ");
            }
            else {
                delete process.env[managed_environment/* SANDBOX_ENV_RESTORE_ENV_VAR */.j8];
            }
            this.secretRedactionState?.refreshFromEnv(process.env);
            span?.setAttribute("env.applied_count", applied);
            span?.setAttribute("env.removed_count", update.removed);
            // Log only counts, never values.
            control_logger.info(spanCtx, "Updated exec-daemon environment", {
                requested: Object.keys(envEntries).length,
                applied,
                removed: update.removed,
                replace,
            });
            try {
                // Dependents mirror process.env, so read the effective change back
                // from it: a restored (overlay release) key is re-set, not unset.
                const dependentEnv = {};
                const dependentRemovedKeys = [];
                for (const key of new Set([...update.removedKeys, ...Object.keys(update.env)])) {
                    const value = process.env[key];
                    if (value === undefined) {
                        dependentRemovedKeys.push(key);
                    }
                    else {
                        dependentEnv[key] = value;
                    }
                }
                await this.onManagedEnvironmentUpdated?.(spanCtx, {
                    env: dependentEnv,
                    removedKeys: dependentRemovedKeys,
                });
            }
            catch {
                control_logger.warn(spanCtx, "Failed to refresh managed environment dependents", {
                    requested: Object.keys(envEntries).length,
                    removed: update.removed,
                    replace,
                });
            }
            return new control_service_pb/* UpdateEnvironmentVariablesResponse */.zj({
                applied,
                removed: update.removed,
            });
        });
    }
}

// EXTERNAL MODULE: external "node:crypto"
var external_node_crypto_ = __webpack_require__("node:crypto");
;// ./src/read-file.ts






const READ_FILE_CHUNK_BYTES = 256 * 1024;
const READ_FILE_MAX_BYTES = 256 * 1024 * 1024;
/**
 * Trusted ExecService access, like daemon Read/ReadBinaryFile: paths (including
 * symlinks) are resolved by the OS with the daemon user's filesystem permissions.
 * This is not the workspace-constrained, user-facing ExportFile API.
 */
async function* readFile(ctx, request) {
    const checkCanceled = () => {
        if (ctx.signal.aborted) {
            throw new connect_error/* ConnectError */.T("File read canceled", esm_code/* Code */.C.Canceled);
        }
    };
    checkCanceled();
    if (request.path.length === 0 || request.path.includes("\0")) {
        throw new connect_error/* ConnectError */.T("Invalid file path", esm_code/* Code */.C.InvalidArgument);
    }
    const hardCap = BigInt(READ_FILE_MAX_BYTES);
    const maxBytes = request.maxBytes === BigInt(0) || request.maxBytes > hardCap ? hardCap : request.maxBytes;
    if (maxBytes < BigInt(0)) {
        throw new connect_error/* ConnectError */.T("Invalid byte limit", esm_code/* Code */.C.InvalidArgument);
    }
    try {
        // O_NONBLOCK avoids hanging on a FIFO before fstat rejects it.
        const file = await (0,promises_.open)(request.path, external_node_fs_.constants.O_RDONLY | external_node_fs_.constants.O_NONBLOCK);
        let closePromise;
        const close = () => (closePromise ??= file.close());
        const onAbort = () => {
            // Close even while the generator is suspended at a yield. The finally
            // block also awaits this promise and owns any close error.
            void close().catch(() => { });
        };
        ctx.signal.addEventListener("abort", onAbort, { once: true });
        try {
            checkCanceled();
            const initial = await file.stat({ bigint: true });
            const realPath = await openedPath(file, request.path, initial);
            checkCanceled();
            if (!initial.isFile()) {
                throw new connect_error/* ConnectError */.T("Only regular files can be read", esm_code/* Code */.C.InvalidArgument);
            }
            const start = request.offset < initial.size ? request.offset : initial.size;
            const available = initial.size - start;
            const rangeSize = request.length === BigInt(0) || request.length > available ? available : request.length;
            if (rangeSize > maxBytes) {
                throw new connect_error/* ConnectError */.T("File exceeds byte limit", esm_code/* Code */.C.ResourceExhausted);
            }
            yield new ReadFileResponse({
                payload: {
                    case: "header",
                    value: { size: initial.size, realPath },
                },
            });
            const hash = (0,external_node_crypto_.createHash)("sha256");
            const end = Number(start + rangeSize);
            let position = Number(start);
            while (position < end) {
                checkCanceled();
                const buffer = Buffer.allocUnsafe(Math.min(READ_FILE_CHUNK_BYTES, end - position));
                const { bytesRead } = await file.read(buffer, 0, buffer.length, position);
                checkCanceled();
                if (bytesRead === 0) {
                    throw new connect_error/* ConnectError */.T("File ended before its declared size", esm_code/* Code */.C.DataLoss);
                }
                const chunk = buffer.subarray(0, bytesRead);
                hash.update(chunk);
                position += bytesRead;
                yield new ReadFileResponse({
                    payload: { case: "chunk", value: chunk },
                });
            }
            checkCanceled();
            // Some regular pseudo-files report size zero despite having contents.
            // A stat size alone must not certify that the entire file was transferred.
            if (BigInt(position) === initial.size) {
                const { bytesRead: extraBytes } = await file.read(Buffer.allocUnsafe(1), 0, 1, position);
                checkCanceled();
                if (extraBytes !== 0) {
                    throw new connect_error/* ConnectError */.T("File contains bytes beyond its declared size", esm_code/* Code */.C.DataLoss);
                }
            }
            const final = await file.stat({ bigint: true });
            checkCanceled();
            if (initial.size !== final.size ||
                initial.mtimeNs !== final.mtimeNs ||
                initial.ctimeNs !== final.ctimeNs) {
                throw new connect_error/* ConnectError */.T("File changed during read", esm_code/* Code */.C.DataLoss);
            }
            await close();
            checkCanceled();
            yield new ReadFileResponse({
                payload: {
                    case: "complete",
                    value: {
                        size: BigInt(position) - start,
                        sha256: Uint8Array.from(hash.digest()),
                    },
                },
            });
        }
        finally {
            ctx.signal.removeEventListener("abort", onAbort);
            await close();
        }
    }
    catch (error) {
        checkCanceled();
        if (error instanceof Error && "code" in error) {
            if (error.code === "ENOENT" || error.code === "ENOTDIR") {
                throw new connect_error/* ConnectError */.T("File not found", esm_code/* Code */.C.NotFound);
            }
            if (error.code === "EACCES" || error.code === "EPERM") {
                throw new connect_error/* ConnectError */.T("Permission denied", esm_code/* Code */.C.PermissionDenied);
            }
        }
        throw toInternalConnectError("Read file failed", error);
    }
}
// The header names the file the daemon opened, not what the request path
// resolves to now: a symlink swapped after open would pass a containment
// check on the new target while the bytes come from the first one.
async function openedPath(file, path, opened) {
    const resolved =  true
        ? await (0,promises_.readlink)(`/proc/self/fd/${file.fd}`)
        : 0;
    const named = await (0,promises_.stat)(resolved, { bigint: true });
    if (named.dev !== opened.dev || named.ino !== opened.ino) {
        throw new connect_error/* ConnectError */.T("File changed during open", esm_code/* Code */.C.DataLoss);
    }
    return resolved;
}

;// ./src/exec.ts
var __addDisposableResource = (undefined && undefined.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (undefined && undefined.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});






const exec_logger = (0,logger/* createLogger */.h)("exec-daemon");
function createExecMessageContext(baseCtx, request) {
    const spanName = "exec_daemon.exec.handle";
    const spanContext = request.spanContext;
    const ctx = spanContext !== undefined
        ? (0,otel/* createContextFromSpanContext */.V5)({
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
            traceFlags: spanContext.traceFlags ?? 1,
        }, spanName, baseCtx)
        : (0,otel/* withSpan */.fR)(baseCtx.withName(spanName));
    const span = (0,otel/* getSpan */.fU)(ctx);
    span?.setAttribute("exec.stream_id", request.id);
    span?.setAttribute("exec.message_case", request.message.case ?? "unknown");
    if (request.execId !== undefined && request.execId.length > 0) {
        span?.setAttribute("exec.id", request.execId);
    }
    return {
        ctx,
        span,
        [Symbol.dispose]() {
            span?.end();
        },
    };
}
/**
 * Core exec daemon implementation
 */
class ExecServer {
    controlledExecManager;
    readFile = readFile;
    constructor(_globalContext, // bump
    resourceAccessor) {
        this.controlledExecManager = dist/* SimpleControlledExecManager */.n6O.fromResources(resourceAccessor);
    }
    /**
     * Handle execution requests with automatic context setup and tracing
     */
    async *exec(ctx, request) {
        const env_1 = { stack: [], error: void 0, hasError: false };
        try {
            const isRequestContext = request.message.case === "requestContextArgs";
            const execMessageContext = __addDisposableResource(env_1, createExecMessageContext(ctx, request), false);
            const execCtx = execMessageContext.ctx;
            const startedAt = Date.now();
            try {
                const stream = this.controlledExecManager.handle(execCtx, request);
                for await (const message of stream) {
                    if (message instanceof exec_pb/* ExecClientMessage */.yT) {
                        yield new ExecStreamElement({
                            element: { case: "execClientMessage", value: message },
                        });
                    }
                    else if (message instanceof exec_pb/* ExecClientControlMessage */.$Y) {
                        yield new ExecStreamElement({
                            element: { case: "execClientControlMessage", value: message },
                        });
                    }
                }
                if (isRequestContext) {
                    exec_logger.info(execCtx, "computeRequestContext completed", {
                        id: request.id,
                        durationMs: Date.now() - startedAt,
                    });
                }
            }
            catch (error) {
                // Client disconnect errors (e.g. timeout on client side) are expected and not worth logging as errors
                if (isClientDisconnectError(error)) {
                    exec_logger.debug(execCtx, "Client disconnected during streaming", {
                        code: error.code,
                    });
                    return;
                }
                execMessageContext.span?.recordException(error instanceof Error ? error : new Error(String(error)));
                if (isRequestContext) {
                    exec_logger.error(execCtx, "computeRequestContext failed", error, {
                        id: request.id,
                    });
                }
                exec_logger.error(execCtx, "Request failed", error);
                throw toInternalConnectError("Exec stream failed", error);
            }
        }
        catch (e_1) {
            env_1.error = e_1;
            env_1.hasError = true;
        }
        finally {
            __disposeResources(env_1);
        }
    }
}

;// ./src/pty-host-server.ts




const pty_host_server_logger = (0,logger/* createLogger */.h)("pty-host-server");
/**
 * Implementation of the PtyHostService gRPC service
 */
class PtyHostServer {
    ptyManager;
    constructor(ptyManager) {
        this.ptyManager = ptyManager;
    }
    async spawnPty(ctx, request) {
        pty_host_server_logger.info(ctx, "SpawnPty request", {
            process: request.process,
            cwd: request.cwd,
            cols: request.cols,
            rows: request.rows,
        });
        try {
            const ptyId = this.ptyManager.spawn({
                process: request.process
                    ? { shell: request.process.shell, args: request.process.args }
                    : undefined,
                cwd: request.cwd,
                env: request.env,
                cols: request.cols,
                rows: request.rows,
            });
            return {
                ptyId,
            };
        }
        catch (error) {
            pty_host_server_logger.error(ctx, "Failed to spawn PTY", { error });
            throw new connect_error/* ConnectError */.T(`Failed to spawn PTY: ${error instanceof Error ? error.message : String(error)}`, esm_code/* Code */.C.Internal);
        }
    }
    async *attachPty(ctx, request) {
        pty_host_server_logger.info(ctx, "AttachPty request", {
            ptyId: request.ptyId,
            lastEventId: request.lastEventId,
        });
        // Set up event queue BEFORE attaching to ensure no events are lost.
        // The listener is registered atomically with capturing historical events.
        const eventQueue = [];
        let resolveNext = null;
        const listener = (event) => {
            eventQueue.push(this.convertToPtyEvent(event));
            if (resolveNext) {
                resolveNext();
                resolveNext = null;
            }
        };
        const attachment = this.ptyManager.attach(request.ptyId, listener, request.lastEventId);
        if (!attachment) {
            throw new connect_error/* ConnectError */.T(`PTY not found: ${request.ptyId}`, esm_code/* Code */.C.NotFound);
        }
        const { events } = attachment;
        try {
            // Yield historical events first
            for (const event of events) {
                yield this.convertToPtyEvent(event);
            }
            // Stream new events as they arrive (listener was already capturing them)
            while (true) {
                // Wait for an event to be available
                while (eventQueue.length === 0) {
                    await new Promise((resolve) => {
                        resolveNext = resolve;
                    });
                }
                const event = eventQueue.shift();
                if (event) {
                    yield event;
                    // Check if this is an exit event
                    if (event.data.case === "ptyExited") {
                        break;
                    }
                }
            }
        }
        catch (error) {
            // Client disconnect errors (e.g. timeout on client side) are expected and not worth logging as errors
            if (isClientDisconnectError(error)) {
                pty_host_server_logger.debug(ctx, "Client disconnected during PTY streaming", {
                    ptyId: request.ptyId,
                    code: error.code,
                });
                return;
            }
            throw error;
        }
        finally {
            // Clean up the listener
            this.ptyManager.detach(request.ptyId, listener);
        }
    }
    async sendInput(ctx, request) {
        pty_host_server_logger.debug(ctx, "SendInput request", {
            ptyId: request.ptyId,
            dataLength: request.data.length,
        });
        const success = this.ptyManager.sendInput(request.ptyId, Buffer.from(request.data));
        if (!success) {
            throw new connect_error/* ConnectError */.T(`PTY not found: ${request.ptyId}`, esm_code/* Code */.C.NotFound);
        }
        return { success: true };
    }
    async resizePty(ctx, request) {
        pty_host_server_logger.info(ctx, "ResizePty request", {
            ptyId: request.ptyId,
            cols: request.cols,
            rows: request.rows,
        });
        const success = this.ptyManager.resize(request.ptyId, request.cols, request.rows);
        if (!success) {
            throw new connect_error/* ConnectError */.T(`PTY not found: ${request.ptyId}`, esm_code/* Code */.C.NotFound);
        }
        return { success: true };
    }
    async listPtys(ctx, _request) {
        pty_host_server_logger.debug(ctx, "ListPtys request");
        const ptys = this.ptyManager.list();
        return {
            ptys: ptys.map((pty) => new pty_host_service_pb/* PtyInfo */.I$({
                ptyId: pty.id,
                shell: pty.shell,
                cwd: pty.cwd,
                cols: pty.cols,
                rows: pty.rows,
                pid: pty.pid,
                processArgs: pty.args,
            })),
        };
    }
    async terminatePty(ctx, request) {
        pty_host_server_logger.info(ctx, "TerminatePty request", { ptyId: request.ptyId });
        const success = this.ptyManager.terminate(request.ptyId);
        if (!success) {
            throw new connect_error/* ConnectError */.T(`PTY not found: ${request.ptyId}`, esm_code/* Code */.C.NotFound);
        }
        return { success: true };
    }
    /**
     * Converts internal PtyEvent to protobuf PtyEvent
     */
    convertToPtyEvent(event) {
        if (event.data.type === "data") {
            return new pty_host_service_pb/* PtyEvent */.G({
                eventId: event.eventId,
                data: {
                    case: "ptyData",
                    value: new pty_host_service_pb/* PtyData */.SE({
                        data: new Uint8Array(event.data.data),
                    }),
                },
            });
        }
        return new pty_host_service_pb/* PtyEvent */.G({
            eventId: event.eventId,
            data: {
                case: "ptyExited",
                value: new pty_host_service_pb/* PtyExited */.h2({
                    exitCode: event.data.exitCode,
                    signal: event.data.signal,
                }),
            },
        });
    }
}

// EXTERNAL MODULE: ./src/tmux-session-manager.ts
var tmux_session_manager = __webpack_require__("./src/tmux-session-manager.ts");
;// ./src/tmux-session-server.ts




const tmux_session_server_logger = (0,logger/* createLogger */.h)("tmux-session-server");
function toProtoSession(session) {
    return new tmux_session_service_pb/* TmuxSession */.pk({
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        displayName: session.displayName,
        kind: session.kind,
        cwd: session.cwd,
        shell: session.shell,
        processArgs: session.processArgs,
        createdAtUnixMs: BigInt(session.createdAtUnixMs),
        attachedClientCount: session.attachedClientCount,
    });
}
class TmuxSessionServer {
    tmuxSessionManager;
    constructor(tmuxSessionManager) {
        this.tmuxSessionManager = tmuxSessionManager;
    }
    throwInternalError(args) {
        tmux_session_server_logger.error(args.ctx, args.message, args.details ?? {});
        throw new connect_error/* ConnectError */.T(args.message, esm_code/* Code */.C.Internal);
    }
    async createSession(ctx, request) {
        tmux_session_server_logger.info(ctx, "CreateSession request", {
            sessionName: request.sessionName,
            displayName: request.displayName,
            kind: request.kind,
            cwd: request.cwd,
        });
        if (request.sessionName && !this.tmuxSessionManager.isValidSessionName(request.sessionName)) {
            throw new connect_error/* ConnectError */.T("Invalid tmux session name", esm_code/* Code */.C.InvalidArgument);
        }
        if (request.process && !request.process.shell) {
            throw new connect_error/* ConnectError */.T("Process shell is required", esm_code/* Code */.C.InvalidArgument);
        }
        try {
            const session = await this.tmuxSessionManager.createSession({
                sessionName: request.sessionName,
                displayName: request.displayName,
                kind: request.kind,
                process: request.process
                    ? {
                        shell: request.process.shell,
                        args: request.process.args,
                    }
                    : undefined,
                cwd: request.cwd,
                env: request.env,
            });
            return {
                session: toProtoSession(session),
            };
        }
        catch (error) {
            if (error instanceof tmux_session_manager/* TmuxValidationError */.Ug) {
                tmux_session_server_logger.error(ctx, "Failed to create tmux session", {
                    error: error.message,
                });
                throw new connect_error/* ConnectError */.T(error.message, esm_code/* Code */.C.InvalidArgument);
            }
            if (error instanceof tmux_session_manager/* TmuxSessionAlreadyExistsError */.LE) {
                tmux_session_server_logger.error(ctx, "Failed to create tmux session", {
                    error: error.message,
                });
                throw new connect_error/* ConnectError */.T(error.message, esm_code/* Code */.C.AlreadyExists);
            }
            tmux_session_server_logger.error(ctx, "Failed to create tmux session", {
                sessionName: request.sessionName,
            });
            throw new connect_error/* ConnectError */.T("Failed to create tmux session", esm_code/* Code */.C.Internal);
        }
    }
    async listSessions(ctx, _request) {
        try {
            const sessions = await this.tmuxSessionManager.listSessions();
            return {
                sessions: sessions.map(toProtoSession),
            };
        }
        catch {
            this.throwInternalError({
                ctx,
                message: "Failed to list tmux sessions",
            });
        }
    }
    async killSession(ctx, request) {
        if (!request.sessionId) {
            throw new connect_error/* ConnectError */.T("session_id is required", esm_code/* Code */.C.InvalidArgument);
        }
        const success = await (async () => {
            try {
                return await this.tmuxSessionManager.killSession(request.sessionId);
            }
            catch {
                return this.throwInternalError({
                    ctx,
                    message: "Failed to kill tmux session",
                    details: { sessionId: request.sessionId },
                });
            }
        })();
        if (!success) {
            throw new connect_error/* ConnectError */.T(`Tmux session not found: ${request.sessionId}`, esm_code/* Code */.C.NotFound);
        }
        tmux_session_server_logger.info(ctx, "KillSession request", { sessionId: request.sessionId });
        return {
            success: true,
        };
    }
    async attachSession(ctx, request) {
        if (!request.sessionId) {
            throw new connect_error/* ConnectError */.T("session_id is required", esm_code/* Code */.C.InvalidArgument);
        }
        if (!request.cols) {
            throw new connect_error/* ConnectError */.T("cols is required", esm_code/* Code */.C.InvalidArgument);
        }
        if (!request.rows) {
            throw new connect_error/* ConnectError */.T("rows is required", esm_code/* Code */.C.InvalidArgument);
        }
        const attachment = await (async () => {
            try {
                return await this.tmuxSessionManager.attachSession({
                    sessionId: request.sessionId,
                    cols: request.cols,
                    rows: request.rows,
                });
            }
            catch {
                return this.throwInternalError({
                    ctx,
                    message: "Failed to attach tmux session",
                    details: { sessionId: request.sessionId },
                });
            }
        })();
        if (!attachment) {
            throw new connect_error/* ConnectError */.T(`Tmux session not found: ${request.sessionId}`, esm_code/* Code */.C.NotFound);
        }
        tmux_session_server_logger.info(ctx, "AttachSession request", {
            sessionId: request.sessionId,
            ptyId: attachment.ptyId,
        });
        return {
            ptyId: attachment.ptyId,
            session: toProtoSession(attachment.session),
        };
    }
}

;// ./src/server.ts


















const server_logger = (0,logger/* createLogger */.h)("exec-daemon-server");
function parseWorkspaceRootsHeader(rawHeader) {
    try {
        const parsed = JSON.parse(rawHeader);
        if (!Array.isArray(parsed)) {
            return undefined;
        }
        const workspaceRoots = parsed.filter((root) => typeof root === "string" && root.length > 0);
        return workspaceRoots.length > 0 ? workspaceRoots : undefined;
    }
    catch {
        return undefined;
    }
}
function createExecRequestContext(globalContext, headers) {
    let ctx = (0,core/* createContext */.q6)().with(logger/* loggerKey */._O, globalContext.get(logger/* loggerKey */._O));
    const conversationId = headers.get(dist/* EXEC_CONVERSATION_ID_HEADER */.S5q);
    if (conversationId) {
        ctx = ctx.with(dist/* execConversationIdKey */.FmW, conversationId);
    }
    const requestId = headers.get(dist/* EXEC_REQUEST_ID_HEADER */.sMm);
    if (requestId) {
        ctx = ctx.with(dist/* execRequestIdKey */.dxK, requestId);
    }
    const browserOperationSource = headers.get(dist/* EXEC_BROWSER_OPERATION_SOURCE_HEADER */.LXI);
    if (browserOperationSource === dist/* EXEC_BROWSER_OPERATION_SOURCES */.Kwv.toolCall) {
        ctx = ctx.with(dist/* execBrowserOperationSourceKey */.$mb, browserOperationSource);
    }
    const hookConversationId = headers.get(dist/* EXEC_HOOK_CONVERSATION_ID_HEADER */.OIF);
    if (hookConversationId) {
        ctx = ctx.with(dist/* execHookConversationIdKey */.WWy, hookConversationId);
    }
    const hookGenerationId = headers.get(dist/* EXEC_HOOK_GENERATION_ID_HEADER */.TpB);
    if (hookGenerationId) {
        ctx = ctx.with(dist/* execHookGenerationIdKey */.JT2, hookGenerationId);
    }
    const model = headers.get(dist/* EXEC_HOOK_MODEL_HEADER */.AnR);
    if (model) {
        ctx = ctx.with(dist/* execHookModelKey */.dBo, model);
    }
    const workspaceRootsHeader = headers.get(dist/* EXEC_HOOK_WORKSPACE_ROOTS_HEADER */.s0I);
    if (workspaceRootsHeader) {
        const workspaceRoots = parseWorkspaceRootsHeader(workspaceRootsHeader);
        if (workspaceRoots !== undefined) {
            ctx = ctx.with(dist/* execHookWorkspaceRootsKey */.IjH, workspaceRoots);
        }
    }
    return ctx;
}
function createAuthInterceptor(authToken) {
    return (next) => async (req) => {
        const auth = req.header?.get?.("authorization");
        if (auth !== `Bearer ${authToken}`) {
            throw new connect_error/* ConnectError */.T("Unauthorized", esm_code/* Code */.C.Unauthenticated);
        }
        return await next(req);
    };
}
function createTmuxSessionImplementation(tmuxSessionManager) {
    const tmuxSessionServer = tmuxSessionManager
        ? new TmuxSessionServer(tmuxSessionManager)
        : undefined;
    if (!tmuxSessionServer) {
        return undefined;
    }
    return {
        createSession: tmuxSessionServer.createSession.bind(tmuxSessionServer),
        listSessions: tmuxSessionServer.listSessions.bind(tmuxSessionServer),
        killSession: tmuxSessionServer.killSession.bind(tmuxSessionServer),
        attachSession: tmuxSessionServer.attachSession.bind(tmuxSessionServer),
    };
}
function isManagedEnvironmentRefreshableKind(kind) {
    return kind === tmux_session_service_pb/* TmuxSessionKind */.pz.AGENT_BACKGROUND || kind === tmux_session_service_pb/* TmuxSessionKind */.pz.AGENT_INTERACTIVE;
}
function getSafeRefreshErrorType(reason) {
    if (reason instanceof Error) {
        return reason.name;
    }
    return typeof reason;
}
function createManagedEnvironmentUpdatedHandler(tmuxSessionManager) {
    return async (ctx, args) => {
        // Global environment first: it is what sessions created after this update
        // inherit (see refreshGlobalEnvironment).
        try {
            const globalResult = await tmuxSessionManager.refreshGlobalEnvironment(args);
            server_logger.info(ctx, "Refreshed tmux global environment", {
                serverRunning: globalResult.serverRunning,
                applied: globalResult.applied,
                removed: globalResult.removed,
                failed: globalResult.failed,
            });
        }
        catch (error) {
            server_logger.warn(ctx, "Failed to refresh tmux global environment", {
                errorType: getSafeRefreshErrorType(error),
            });
        }
        const sessions = await tmuxSessionManager.listSessions();
        const refreshableSessions = sessions.filter((session) => isManagedEnvironmentRefreshableKind(session.kind));
        const results = await (0,promise_extras/* asyncMapSettledValues */.up)(refreshableSessions, (session) => tmuxSessionManager.refreshSessionEnvironment({
            sessionName: session.sessionName,
            env: args.env,
            removedKeys: args.removedKeys,
            refreshPaneIfIdle: true,
        }));
        const failed = results.filter((result) => result.status === "rejected");
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === "rejected") {
                const session = refreshableSessions[i];
                server_logger.warn(ctx, "Failed to refresh tmux session environment", {
                    sessionName: session.sessionName,
                    failed: failed.length,
                    succeeded: results.length - failed.length,
                    total: results.length,
                    errorType: getSafeRefreshErrorType(result.reason),
                });
            }
        }
    };
}
/**
 * Create and start the exec daemon server (HTTP)
 * @param globalContext Global context for logging and tracking
 * @param port Port to listen on
 * @param authToken Authentication token for Bearer auth
 * @param resourceAccessor ListableResourceAccessor instance for accessing resources
 * @param gitService GitService instance for git operations
 * @param remoteAccessService RemoteAccessService instance for remote access operations
 * @returns Promise that resolves to a function that stops the server
 */
async function startServer(globalContext, port, authToken, resourceAccessor, gitService, remoteAccessService, artifactUploadManagerProvider, workspacePaths, tmuxSessionManager, secretRedactionState, scopedSecretStore, onReloadAgentSkills, onReloadPlugins, getComputerUseSupported, onLoadMcpServers, desktopLeaseStore, machineResourceMonitor, hooks) {
    const startupCtx = (0,otel/* withSpan */.fR)(globalContext.withName("exec_daemon.server.start_http"));
    const startupSpan = (0,otel/* getSpan */.fU)(startupCtx);
    startupSpan?.setAttribute("server.port", port);
    startupSpan?.setAttribute("server.tmux_enabled", tmuxSessionManager !== undefined);
    server_logger.debug(startupCtx, "Starting ExecDaemon server", { port });
    try {
        // Create daemon instance with the provided resource accessor
        const execServer = new ExecServer(startupCtx, resourceAccessor);
        await artifactUploadManagerProvider.initialize(startupCtx);
        const controlServer = new ControlServer(gitService, remoteAccessService, artifactUploadManagerProvider, {
            workspacePaths,
            onReloadAgentSkills,
            onReloadPlugins,
            onLoadMcpServers,
            getComputerUseSupported,
            desktopLeaseStore,
            machineResourceMonitor,
            managedEnvironment: tmuxSessionManager?.getManagedEnvironment(),
            secretRedactionState,
            scopedSecretStore,
            onManagedEnvironmentUpdated: tmuxSessionManager
                ? createManagedEnvironmentUpdatedHandler(tmuxSessionManager)
                : undefined,
            onPing: hooks?.onPing,
        });
        // Create context-aware service implementations
        const execImplementation = {
            exec: execServer.exec.bind(execServer),
            readFile: execServer.readFile,
        };
        const controlImplementation = {
            ping: controlServer.ping.bind(controlServer),
            getCapabilities: controlServer.getCapabilities.bind(controlServer),
            exec: controlServer.exec.bind(controlServer),
            listDirectory: controlServer.listDirectory.bind(controlServer),
            readTextFile: controlServer.readTextFile.bind(controlServer),
            writeTextFile: controlServer.writeTextFile.bind(controlServer),
            readBinaryFile: controlServer.readBinaryFile.bind(controlServer),
            writeBinaryFile: controlServer.writeBinaryFile.bind(controlServer),
            exportFile: controlServer.exportFile.bind(controlServer),
            getDiff: controlServer.getDiff.bind(controlServer),
            batchGetDiff: controlServer.batchGetDiff.bind(controlServer),
            getWorkspaceChangesHash: controlServer.getWorkspaceChangesHash.bind(controlServer),
            refreshGithubAccessToken: controlServer.refreshGithubAccessToken.bind(controlServer),
            warmRemoteAccessServer: controlServer.warmRemoteAccessServer.bind(controlServer),
            listArtifacts: controlServer.listArtifacts.bind(controlServer),
            uploadArtifacts: controlServer.uploadArtifacts.bind(controlServer),
            persistArtifactsToAgentStore: controlServer.persistArtifactsToAgentStore.bind(controlServer),
            persistArtifactsToParentStore: controlServer.persistArtifactsToParentStore.bind(controlServer),
            restoreArtifacts: controlServer.restoreArtifacts.bind(controlServer),
            getMcpRefreshTokens: controlServer.getMcpRefreshTokens.bind(controlServer),
            updateEnvironmentVariables: controlServer.updateEnvironmentVariables.bind(controlServer),
            syncScopedSecrets: controlServer.syncScopedSecrets.bind(controlServer),
            reloadAgentSkills: controlServer.reloadAgentSkills.bind(controlServer),
            reloadPlugins: controlServer.reloadPlugins.bind(controlServer),
            installPluginArtifact: controlServer.installPluginArtifact.bind(controlServer),
            loadMcpServers: controlServer.loadMcpServers.bind(controlServer),
            desktopLease: controlServer.desktopLease.bind(controlServer),
            getResourceUsage: controlServer.getResourceUsage.bind(controlServer),
        };
        const tmuxSessionImplementation = createTmuxSessionImplementation(tmuxSessionManager);
        // Wrap the implementations to automatically extract context from incoming requests
        const wrappedExecImplementation = createContextExtractingService(execImplementation, {
            extractTraceHeaders: true, // Enable automatic trace context extraction
            extractContext: (headers, _handlerContext) => {
                return createExecRequestContext(startupCtx, headers);
            },
        });
        const wrappedControlImplementation = createContextExtractingService(controlImplementation, {
            extractTraceHeaders: true, // Enable automatic trace context extraction
            extractContext: (headers, _handlerContext) => {
                return createExecRequestContext(startupCtx, headers);
            },
        });
        const wrappedTmuxSessionImplementation = tmuxSessionImplementation
            ? createContextExtractingService(tmuxSessionImplementation, {
                extractTraceHeaders: true,
                extractContext: (_headers, _handlerContext) => {
                    return (0,core/* createContext */.q6)().with(logger/* loggerKey */._O, startupCtx.get(logger/* loggerKey */._O));
                },
            })
            : undefined;
        const handler = (0,esm/* connectNodeAdapter */.aO)({
            routes: (router) => {
                router.service(ExecService, wrappedExecImplementation);
                router.service(ControlService, wrappedControlImplementation);
                if (wrappedTmuxSessionImplementation) {
                    router.service(TmuxSessionService, wrappedTmuxSessionImplementation);
                }
            },
            acceptCompression: [esm/* compressionGzip */.JY],
            requireConnectProtocolHeader: false, // Allow Connect without protocol header
            interceptors: [createAuthInterceptor(authToken)],
        });
        // Create HTTP server
        const server = external_node_http_.createServer(handler);
        // Start listening
        await new Promise((resolve, reject) => {
            server.listen(port, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    server_logger.info(startupCtx, "ExecDaemon server listening", { port });
                    resolve();
                }
            });
        });
        startupSpan?.end();
        // Return closure to stop the server
        return async () => {
            server_logger.debug(globalContext, "Stopping ExecDaemon server", { port });
            await new Promise((resolve) => {
                server.close(() => {
                    server_logger.debug(globalContext, "ExecDaemon server stopped", { port });
                    resolve();
                });
            });
        };
    }
    catch (error) {
        startupSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
        startupSpan?.end();
        throw error;
    }
}
/**
 * Create and start the PTY host WebSocket server
 *
 * @param globalContext Global context for logging and tracking
 * @param port Port to listen on for WebSocket connections
 * @param ptyManager PtyManager instance for managing PTY instances
 * @param machineResourceMonitor When set, also serves
 *   ControlService.GetResourceUsage so a renderer can poll it over the same
 *   WebSocket the Terminal tab uses (no CORS preflight against cursorvm.com)
 * @returns Promise that resolves to a function that stops the server
 */
async function startPtyHostWebSocketServer(globalContext, port, ptyManager, tmuxSessionManager, ptyAuthToken, machineResourceMonitor) {
    const startupCtx = (0,otel/* withSpan */.fR)(globalContext.withName("exec_daemon.server.start_pty_ws"));
    const startupSpan = (0,otel/* getSpan */.fU)(startupCtx);
    startupSpan?.setAttribute("server.port", port);
    startupSpan?.setAttribute("server.tmux_enabled", tmuxSessionManager !== undefined);
    server_logger.debug(startupCtx, "Starting PtyHost WebSocket server", { port });
    try {
        // Create PTY host server
        const ptyHostServer = new PtyHostServer(ptyManager);
        // Create context-aware service implementation for PtyHostService
        const ptyHostImplementation = {
            spawnPty: ptyHostServer.spawnPty.bind(ptyHostServer),
            attachPty: ptyHostServer.attachPty.bind(ptyHostServer),
            sendInput: ptyHostServer.sendInput.bind(ptyHostServer),
            resizePty: ptyHostServer.resizePty.bind(ptyHostServer),
            listPtys: ptyHostServer.listPtys.bind(ptyHostServer),
            terminatePty: ptyHostServer.terminatePty.bind(ptyHostServer),
        };
        const tmuxSessionImplementation = createTmuxSessionImplementation(tmuxSessionManager);
        const wrappedPtyHostImplementation = createContextExtractingService(ptyHostImplementation, {
            extractTraceHeaders: true,
            extractContext: (_headers, _handlerContext) => {
                return (0,core/* createContext */.q6)().with(logger/* loggerKey */._O, startupCtx.get(logger/* loggerKey */._O));
            },
        });
        const wrappedTmuxSessionImplementation = tmuxSessionImplementation
            ? createContextExtractingService(tmuxSessionImplementation, {
                extractTraceHeaders: true,
                extractContext: (_headers, _handlerContext) => {
                    return (0,core/* createContext */.q6)().with(logger/* loggerKey */._O, startupCtx.get(logger/* loggerKey */._O));
                },
            })
            : undefined;
        const wrappedMachineResourcesImplementation = machineResourceMonitor
            ? createContextExtractingService({
                getResourceUsage: async (_ctx, request) => machineResourceMonitor.handleGetResourceUsage(request),
            }, {
                extractTraceHeaders: true,
                extractContext: (_headers, _handlerContext) => {
                    return (0,core/* createContext */.q6)().with(logger/* loggerKey */._O, startupCtx.get(logger/* loggerKey */._O));
                },
            })
            : undefined;
        // Create WebSocket server
        const wss = new wrapper/* WebSocketServer */.zu({ port });
        // Apply the ConnectRPC WebSocket adapter
        connectWebSocketAdapter(wss, {
            routes: (router) => {
                router.service(PtyHostService, wrappedPtyHostImplementation);
                if (wrappedTmuxSessionImplementation) {
                    router.service(TmuxSessionService, wrappedTmuxSessionImplementation);
                }
                if (wrappedMachineResourcesImplementation) {
                    router.service(ControlService, wrappedMachineResourcesImplementation);
                }
            },
            requireConnectProtocolHeader: false,
            interceptors: ptyAuthToken === undefined ? undefined : [createAuthInterceptor(ptyAuthToken)],
            authenticate: ptyAuthToken === undefined ? undefined : createPtyAuthGuard(ptyAuthToken),
        });
        server_logger.info(startupCtx, "PtyHost WebSocket server listening", { port });
        startupSpan?.end();
        // Return closure to stop the server
        return async () => {
            server_logger.debug(globalContext, "Stopping PtyHost WebSocket server", {
                port,
            });
            await new Promise((resolve, reject) => {
                wss.close((err) => {
                    if (err) {
                        server_logger.error(globalContext, "Error stopping PtyHost WebSocket server", { error: err });
                        reject(err);
                    }
                    else {
                        server_logger.debug(globalContext, "PtyHost WebSocket server stopped", {
                            port,
                        });
                        resolve();
                    }
                });
            });
        };
    }
    catch (error) {
        startupSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
        startupSpan?.end();
        throw error;
    }
}
function createPtyAuthGuard(ptyAuthToken) {
    return (request) => {
        const authHeader = request.headers.authorization;
        if (matchesExpectedBearerToken(authHeader, ptyAuthToken)) {
            return true;
        }
        // Browsers cannot set custom headers on WebSocket upgrade requests.
        // Accept the token query param for browser clients while still requiring
        // per-RPC authorization headers via Connect interceptors above.
        const requestUrl = request.url;
        if (typeof requestUrl !== "string") {
            return false;
        }
        try {
            const parsedUrl = new URL(requestUrl, "ws://localhost");
            const tokenParam = parsedUrl.searchParams.get("token");
            return tokenParam === ptyAuthToken;
        }
        catch {
            return false;
        }
    };
}
function matchesExpectedBearerToken(authHeader, expectedToken) {
    if (typeof authHeader === "string") {
        return authHeader === `Bearer ${expectedToken}`;
    }
    if (Array.isArray(authHeader) && authHeader.length === 1) {
        return authHeader[0] === `Bearer ${expectedToken}`;
    }
    return false;
}


/***/ },

};
