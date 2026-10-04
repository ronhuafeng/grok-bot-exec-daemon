import { operationOutcome, sandBoxCdpEndpoint, BROWSER_OPERATION_NAMESPACES } from "./browser-operation.js";
import type { agent_v1_McpArgs, agent_v1_McpResult } from "../../interop/contracts/protobuf-generated.js";
import type { BrowserOperation } from "./browser-operation.js";

export const PLAYWRIGHT_SERVER = /^playwright(?:-proxy)?-w([1-9]\d*)$/;
export const PLAYWRIGHT_TOOL = /^browser_[a-z0-9_]+$/;
export function mcpOutcome(result: agent_v1_McpResult) {
    switch (result.result.case) {
        case "success":
            return result.result.value.isError
                ? operationOutcome("failed", { reason: "tool_error" })
                : operationOutcome("completed");
        case "error":
            return operationOutcome("failed", { reason: "mcp_error" });
        case "rejected":
            return operationOutcome("failed", { reason: "rejected" });
        case "permissionDenied":
            return operationOutcome("failed", { reason: "permission_denied" });
        case "toolNotFound":
            return operationOutcome("failed", { reason: "tool_not_found" });
        case "serverNotFound":
            return operationOutcome("failed", { reason: "server_not_found" });
        case "approved":
            return operationOutcome("failed", { reason: "unexpected_approval" });
        case undefined:
            return operationOutcome("failed", { reason: "missing_result" });
        default:
            return operationOutcome("failed", { reason: "unknown_result" });
    }
}
/**
 * Recognizes a managed Playwright MCP execution and normalizes it for Orbit.
 */
export function recognizePlaywrightMcpOperation(args: agent_v1_McpArgs): BrowserOperation<agent_v1_McpResult> | undefined {
    if (args.smartModeApprovalOnly || !PLAYWRIGHT_TOOL.test(args.toolName)) {
        return undefined;
    }
    if (args.serverIdentifier.length > 0 &&
        args.providerIdentifier.length > 0 &&
        args.serverIdentifier !== args.providerIdentifier) {
        return undefined;
    }
    const serverIdentifier = args.serverIdentifier || args.providerIdentifier;
    const match = PLAYWRIGHT_SERVER.exec(serverIdentifier);
    if (match === null || args.name !== `${serverIdentifier}-${args.toolName}`) {
        return undefined;
    }
    const windowIndex = Number(match[1]);
    if (!Number.isSafeInteger(windowIndex)) {
        return undefined;
    }
    const cdpEndpoint = sandBoxCdpEndpoint(windowIndex);
    if (cdpEndpoint.port > 65535) {
        return undefined;
    }
    const argumentsValue = Object.fromEntries(Object.entries(args.args).map(([name, value]) => [name, value.toJson()]));
    return {
        cdpEndpoint,
        request: {
            name: `${BROWSER_OPERATION_NAMESPACES.playwrightMcp}.${args.toolName}`,
            argumentsJson: JSON.stringify(argumentsValue),
        },
        outcomeOf: mcpOutcome,
    };
}
