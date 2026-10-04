
import type { Context, LogEntry, LogLevel } from "../interop/contracts/context.js";

// Log level priority mapping
export const LOG_LEVEL_PRIORITY = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
export function normalizeLogLevel(value: string | undefined) {
    if (value === undefined) {
        return undefined;
    }
    const normalized = value.toLowerCase();
    return normalized in LOG_LEVEL_PRIORITY ? normalized : undefined;
}
/**
 * JSON.stringify wrapped in try/catch so it never throws.
 * Falls back to String() on circular references or any other serialization error.
 */
export function safeJsonStringify(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }
    try {
        return JSON.stringify(value) ?? String(value);
    }
    catch {
        return String(value);
    }
}
/**
 * Custom logger backend that supports LOG_LEVEL environment variable filtering.
 * All serialization is circular-reference safe, and the log method itself is
 * wrapped so that it can never throw — preventing logging from crashing the daemon.
 */
export class FilteredLoggerBackend {
    minLevel: string;
    constructor(minLevel?: LogLevel) {
        this.minLevel = minLevel ?? normalizeLogLevel(process.env.LOG_LEVEL) ?? "info";
    }
    setMinLevel(minLevel?: LogLevel) {
        this.minLevel = minLevel ?? normalizeLogLevel(process.env.LOG_LEVEL) ?? "info";
    }
    getMinLevel() {
        return this.minLevel;
    }
    log(_ctx: Context, entry: LogEntry) {
        // The legacy normalizer uses `in`, including inherited names. Keep its
        // raw lookup/comparison behavior; the assertion adds no validation/coercion.
        if (LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[this.minLevel as keyof typeof LOG_LEVEL_PRIORITY]) {
            return;
        }
        try {
            const elements: (string | Error)[] = [entry.level.toUpperCase(), entry.message];
            if (entry.metadata && Object.keys(entry.metadata).length > 0) {
                elements.push(safeJsonStringify(entry.metadata));
            }
            if (entry.error) {
                const error = entry.error instanceof Error ? entry.error : new Error(String(entry.error));
                elements.push(error);
            }
            if (entry.level === "warn" || entry.level === "error") {
                console.error(...elements);
            }
            else {
                console.log(...elements);
            }
        }
        catch {
            // Last-resort fallback: the logger must never crash the process.
            try {
                console.error("ERROR [FilteredLoggerBackend] Failed to format log entry:", entry.message);
            }
            catch {
                // Truly nothing we can do.
            }
        }
    }
}
