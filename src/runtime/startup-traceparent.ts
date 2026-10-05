import { SPAN_KEY } from "../interop/vendor/context-otel.js";
import { trace } from "../interop/vendor/otel-trace-api.js";
import type { Context } from "../interop/contracts/context.js";

// Keep in sync with @anysphere/constants. exec-daemon avoids importing that
// package so the standalone bundled daemon does not gain another workspace dep.
export const EXEC_DAEMON_STARTUP_TRACEPARENT_ENV_VAR = "EXEC_DAEMON_STARTUP_TRACEPARENT";
export function parseTraceparentHeader(traceparent: string) {
    const parts = traceparent.split("-");
    if (parts.length !== 4) {
        return undefined;
    }
    const [version, traceId, spanId, flags] = parts;
    if (version !== "00" ||
        traceId === undefined ||
        spanId === undefined ||
        flags === undefined ||
        !/^[0-9a-f]{32}$/.test(traceId) ||
        !/^[0-9a-f]{16}$/.test(spanId) ||
        !/^[0-9a-f]{2}$/.test(flags) ||
        traceId === "00000000000000000000000000000000" ||
        spanId === "0000000000000000") {
        return undefined;
    }
    return {
        traceId,
        spanId,
        traceFlags: parseInt(flags, 16),
    };
}
export function withStartupTraceparent(ctx: Context, env = process.env): { ctx: Context; status: "missing" | "invalid" | "applied" } {
    const startupTraceparent = env[EXEC_DAEMON_STARTUP_TRACEPARENT_ENV_VAR];
    if (startupTraceparent === undefined || startupTraceparent.length === 0) {
        return { ctx, status: "missing" };
    }
    const parsed = parseTraceparentHeader(startupTraceparent);
    if (parsed === undefined) {
        return { ctx, status: "invalid" };
    }
    return {
        ctx: ctx.with(SPAN_KEY, trace.wrapSpanContext({
            traceId: parsed.traceId,
            spanId: parsed.spanId,
            traceFlags: parsed.traceFlags,
            isRemote: true,
        })),
        status: "applied",
    };
}
