module.exports = {
/***/ "./src/startup-traceparent.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   t1: () => (/* binding */ withStartupTraceparent)
/* harmony export */ });
/* unused harmony exports EXEC_DAEMON_STARTUP_TRACEPARENT_ENV_VAR, parseTraceparentHeader */
/* harmony import */ var _anysphere_context__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../context/dist/otel.js");
/* harmony import */ var _opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js");


// Keep in sync with @anysphere/constants. exec-daemon avoids importing that
// package so the standalone bundled daemon does not gain another workspace dep.
const EXEC_DAEMON_STARTUP_TRACEPARENT_ENV_VAR = "EXEC_DAEMON_STARTUP_TRACEPARENT";
function parseTraceparentHeader(traceparent) {
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
function withStartupTraceparent(ctx, env = process.env) {
    const startupTraceparent = env[EXEC_DAEMON_STARTUP_TRACEPARENT_ENV_VAR];
    if (startupTraceparent === undefined || startupTraceparent.length === 0) {
        return { ctx, status: "missing" };
    }
    const parsed = parseTraceparentHeader(startupTraceparent);
    if (parsed === undefined) {
        return { ctx, status: "invalid" };
    }
    return {
        ctx: ctx.with(_anysphere_context__WEBPACK_IMPORTED_MODULE_0__/* .SPAN_KEY */ .Rm, _opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__/* .trace */ .u.wrapSpanContext({
            traceId: parsed.traceId,
            spanId: parsed.spanId,
            traceFlags: parsed.traceFlags,
            isRemote: true,
        })),
        status: "applied",
    };
}


/***/ },

};
