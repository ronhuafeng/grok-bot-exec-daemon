import { SimpleControlledExecManager } from "../interop/vendor/agent-exec.js";
import { createLogger } from "../interop/vendor/context-logger.js";
import { createContextFromSpanContext, withSpan, getSpan } from "../interop/vendor/context-otel.js";
import { ExecClientMessage, ExecClientControlMessage } from "../interop/vendor/proto-agent-v1-exec-pb.js";
import { isClientDisconnectError, toInternalConnectError } from "./errors.js";
import { readFile } from "./read-file.js";
import { ExecStreamElement } from "../interop/vendor/server-private.js";
import type { Context } from "../interop/contracts/context.js";
import type { ControlledExecManager, ListableResourceAccessor } from "../interop/contracts/agent-exec.js";
import type { agent_v1_ExecServerMessage } from "../interop/contracts/protobuf-generated.js";

/** Existing compiler helper state; disposal results are intentionally only awaited. */
export type ExecDisposeMethod = (this: unknown) => unknown;
export interface ExecDisposeEntry { value?: unknown; dispose?: ExecDisposeMethod; async: boolean; }
export interface ExecDisposeEnvironment { stack: ExecDisposeEntry[]; error: unknown; hasError: boolean; }
export type ExecSuppressedErrorConstructor = new (error: unknown, suppressed: unknown, message?: string) => Error;

// Unresolved runtime binding: SuppressedError

export var __addDisposableResource = false || function <T>(env: ExecDisposeEnvironment, value: T, async: boolean): T {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function")
            throw new TypeError("Object expected.");
        var dispose: unknown, inner: unknown;
        if (async) {
            if (!Symbol.asyncDispose)
                throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = (value as { [Symbol.asyncDispose]?: unknown })[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose)
                throw new TypeError("Symbol.dispose is not defined.");
            dispose = (value as { [Symbol.dispose]?: unknown })[Symbol.dispose];
            if (async)
                inner = dispose;
        }
        if (typeof dispose !== "function")
            throw new TypeError("Object not disposable.");
        if (inner)
            dispose = function (this: unknown) { try {
                (inner as ExecDisposeMethod).call(this);
            }
            catch (e) {
                return Promise.reject(e);
            } };
        env.stack.push({ value: value, dispose: dispose as ExecDisposeMethod, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
export var __disposeResources = false || (function (SuppressedError: ExecSuppressedErrorConstructor) {
    return function (env: ExecDisposeEnvironment): void | Promise<void> {
        function fail(e: unknown) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r: ExecDisposeEntry | undefined, s = 0;
        function next(): void | Promise<void> {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1)
                        return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async)
                            return s |= 2, Promise.resolve(result).then(next, function (e: unknown) { fail(e); return next(); });
                    }
                    else
                        s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1)
                return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError)
                throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error: unknown, suppressed: unknown, message?: string) {
    var e = new Error(message) as Error & { error?: unknown; suppressed?: unknown };
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
} as ExecSuppressedErrorConstructor & ((error: unknown, suppressed: unknown, message?: string) => Error));
export const logger = createLogger("exec-daemon");
export function createExecMessageContext(baseCtx: Context, request: agent_v1_ExecServerMessage) {
    const spanName = "exec_daemon.exec.handle";
    const spanContext = request.spanContext;
    const ctx = spanContext !== undefined
        ? createContextFromSpanContext({
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
            traceFlags: spanContext.traceFlags ?? 1,
        }, spanName, baseCtx)
        : withSpan(baseCtx.withName(spanName));
    const span = getSpan(ctx);
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
export class ExecServer {
    controlledExecManager: ControlledExecManager;
    readFile = readFile;
    constructor(_globalContext: Context, // bump
    resourceAccessor: ListableResourceAccessor) {
        this.controlledExecManager = SimpleControlledExecManager.fromResources(resourceAccessor);
    }
    /**
     * Handle execution requests with automatic context setup and tracing
     */
    async *exec(ctx: Context, request: agent_v1_ExecServerMessage) {
        const env_1: ExecDisposeEnvironment = { stack: [], error: void 0, hasError: false };
        try {
            const isRequestContext = request.message.case === "requestContextArgs";
            const execMessageContext = __addDisposableResource(env_1, createExecMessageContext(ctx, request), false);
            const execCtx = execMessageContext.ctx;
            const startedAt = Date.now();
            try {
                const stream = this.controlledExecManager.handle(execCtx, request);
                for await (const message of stream) {
                    if (message instanceof ExecClientMessage) {
                        yield new ExecStreamElement({
                            element: { case: "execClientMessage", value: message },
                        });
                    }
                    else if (message instanceof ExecClientControlMessage) {
                        yield new ExecStreamElement({
                            element: { case: "execClientControlMessage", value: message },
                        });
                    }
                }
                if (isRequestContext) {
                    logger.info(execCtx, "computeRequestContext completed", {
                        id: request.id,
                        durationMs: Date.now() - startedAt,
                    });
                }
            }
            catch (error) {
                // Client disconnect errors (e.g. timeout on client side) are expected and not worth logging as errors
                if (isClientDisconnectError(error)) {
                    logger.debug(execCtx, "Client disconnected during streaming", {
                        code: error.code,
                    });
                    return;
                }
                execMessageContext.span?.recordException(error instanceof Error ? error : new Error(String(error)));
                if (isRequestContext) {
                    logger.error(execCtx, "computeRequestContext failed", error, {
                        id: request.id,
                    });
                }
                logger.error(execCtx, "Request failed", error);
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
