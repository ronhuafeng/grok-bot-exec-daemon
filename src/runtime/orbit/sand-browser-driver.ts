import { ShellAbortReason } from "../../interop/vendor/proto-agent-v1-shell-exec-pb.js";
import { operationOutcome, sandBoxCdpEndpoint, BROWSER_OPERATION_NAMESPACES } from "./browser-operation.js";
import nodeBuffer from "node:buffer";
import type { agent_v1_ShellArgs, agent_v1_ShellResult } from "../../interop/contracts/protobuf-generated.js";
import type { BrowserOperation } from "./browser-operation.js";

export const DRIVER_RESULT_MARKER = "__SAND_BROWSER_RESULT__";
export const DRIVER_COMMAND = /^node \/tmp\/\.sand-browser\/driver-[0-9a-f]{16}\.mjs ([A-Za-z0-9+/]+={0,2})$/;
export const OPERATION_NAME = /^[a-z][a-z0-9_]*$/;
// Bounds observer-side base64 decoding and JSON parsing before shell execution.
export const MAX_ENCODED_REQUEST_CHARS = 256 * 1024;
export function sand_browser_driver_isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseRequest(command: string) {
    const encoded = DRIVER_COMMAND.exec(command)?.[1];
    if (encoded === undefined ||
        encoded.length > MAX_ENCODED_REQUEST_CHARS ||
        encoded.length % 4 !== 0) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(nodeBuffer.Buffer.from(encoded, "base64").toString("utf8"));
        return sand_browser_driver_isRecord(parsed) ? parsed : undefined;
    }
    catch {
        return undefined;
    }
}
export function driverOutcome(op: string, stdout: string) {
    const lines = stdout.split("\n");
    for (let index = lines.length - 1; index >= 0; index--) {
        const line = lines[index] ?? "";
        const markerIndex = line.indexOf(DRIVER_RESULT_MARKER);
        if (markerIndex < 0) {
            continue;
        }
        try {
            const parsed: unknown = JSON.parse(line.slice(markerIndex + DRIVER_RESULT_MARKER.length));
            if (!sand_browser_driver_isRecord(parsed)) {
                continue;
            }
            if (typeof parsed["ok"] !== "boolean") {
                return operationOutcome("failed", { reason: "protocol_invalid" });
            }
            if (parsed["ok"]) {
                return op === "screenshot" && parsed["screenshot"] !== true
                    ? operationOutcome("failed", { reason: "screenshot_missing" })
                    : operationOutcome("completed");
            }
            const reason = parsed["infra"] === true ? "driver_infra_error" : "driver_error";
            return operationOutcome("failed", { reason });
        }
        catch {
            return operationOutcome("failed", { reason: "protocol_invalid" });
        }
    }
    return operationOutcome("failed", { reason: "protocol_invalid" });
}
export function shellOutcome(op: string, result: agent_v1_ShellResult) {
    switch (result.result.case) {
        case "success":
            return driverOutcome(op, result.result.value.stdout);
        case "failure": {
            const failure = result.result.value;
            if (failure.aborted && failure.abortReason === ShellAbortReason.USER_ABORT) {
                return operationOutcome("cancelled", { reason: "user_abort" });
            }
            if (failure.aborted && failure.abortReason === ShellAbortReason.TIMEOUT) {
                return operationOutcome("failed", { reason: "timeout" });
            }
            return operationOutcome("failed", {
                reason: "shell_failure",
                exit_code: failure.exitCode,
            });
        }
        case "timeout":
            return operationOutcome("failed", { reason: "timeout" });
        case "rejected":
            return operationOutcome("failed", { reason: "rejected" });
        case "spawnError":
            return operationOutcome("failed", { reason: "spawn_error" });
        case "permissionDenied":
            return operationOutcome("failed", { reason: "permission_denied" });
        case undefined:
            return operationOutcome("failed", { reason: "missing_result" });
        default:
            return operationOutcome("failed", { reason: "unknown_result" });
    }
}
/**
 * Recognizes a managed Sand browser-driver execution and normalizes it for Orbit.
 */
export function recognizeSandBrowserDriverOperation(args: agent_v1_ShellArgs): BrowserOperation<agent_v1_ShellResult> | undefined {
    const request = parseRequest(args.command);
    if (request === undefined) {
        return undefined;
    }
    const op = request["op"];
    const display = request["display"];
    const cdpPort = request["cdpPort"];
    if (typeof op !== "string" ||
        !OPERATION_NAME.test(op) ||
        typeof display !== "number" ||
        !Number.isSafeInteger(display) ||
        display < 1 ||
        typeof cdpPort !== "number" ||
        cdpPort > 65535) {
        return undefined;
    }
    const cdpEndpoint = sandBoxCdpEndpoint(display);
    if (cdpPort !== cdpEndpoint.port) {
        return undefined;
    }
    const argumentsValue = { ...request };
    delete argumentsValue["op"];
    delete argumentsValue["display"];
    delete argumentsValue["cdpPort"];
    delete argumentsValue["screenshotPath"];
    return {
        cdpEndpoint,
        request: {
            name: `${BROWSER_OPERATION_NAMESPACES.sandBrowser}.${op}`,
            argumentsJson: JSON.stringify(argumentsValue),
        },
        outcomeOf: (result) => shellOutcome(op, result),
    };
}
