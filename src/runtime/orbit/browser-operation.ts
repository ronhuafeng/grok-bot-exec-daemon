
import type { OperationOutcome, OrbitEndpoint } from "../../interop/contracts/orbit.js";
import type { JsonValue } from "../../interop/contracts/protobuf-runtime.js";
export interface BrowserOperation<Result> { cdpEndpoint: OrbitEndpoint; request: { name: string; argumentsJson?: string }; outcomeOf(result: Result): OperationOutcome; }

/**
 * Stable namespace prefixes persisted in Orbit.
 */
export const BROWSER_OPERATION_NAMESPACES = {
    sandBrowser: "sand_browser",
    playwrightMcp: "playwright_mcp",
};
/**
 * Encodes optional detail fields as Orbit's JSON object.
 */
export function operationOutcome(status: OperationOutcome["status"], detail?: JsonValue): OperationOutcome {
    return detail === undefined
        ? { status }
        : {
            status,
            detailJson: JSON.stringify(detail),
        };
}
export const SAND_BOX_CDP_PORT_BASE = 9222;
/**
 * Maps Sand browser window `N` to loopback CDP port `9222 + N`.
 */
export function sandBoxCdpEndpoint(windowIndex: number) {
    return { host: "127.0.0.1", port: SAND_BOX_CDP_PORT_BASE + windowIndex };
}
