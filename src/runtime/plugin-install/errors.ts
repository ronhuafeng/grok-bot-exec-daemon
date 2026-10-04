import { ConnectError } from "../../interop/vendor/connect-connect-error.js";
import { Code } from "../../interop/vendor/connect-code.js";
export type PluginInstallPhase = "download" | "filesystem" | "extraction";
export function remainingInstallTimeoutMs(installDeadlineMs: number) {
    return Math.max(1, installDeadlineMs - Date.now());
}
export function remainingPhaseTimeoutMs(phaseDeadlineMs: number, overallDeadlineMs: number) {
    return Math.max(1, Math.min(remainingInstallTimeoutMs(phaseDeadlineMs), remainingInstallTimeoutMs(overallDeadlineMs)));
}
export function pluginInstallFailureMessage(phase: PluginInstallPhase, kind: "timeout" | "failed") {
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
export function isDownloadTimeoutError(error: unknown) {
    return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}
export function toPluginInstallConnectError(error: unknown, phase: PluginInstallPhase) {
    if (error instanceof ConnectError) {
        return error;
    }
    if (error instanceof Error && error.message === "plugin artifact too large") {
        return new ConnectError("plugin artifact exceeds size limit", Code.InvalidArgument);
    }
    const kind = isDownloadTimeoutError(error) ? "timeout" : "failed";
    return new ConnectError(pluginInstallFailureMessage(phase, kind), Code.Internal);
}
