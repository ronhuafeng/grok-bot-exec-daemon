import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import nodeFs from "node:fs";
/**
 * Node raises the same `spawn <command> ENOENT` for a missing executable and
 * for a `cwd` that does not exist, so the message alone cannot tell a container
 * that lacks the binary apart from a workspace path the VM never created (for
 * example a repo absent from the environment snapshot it booted from). Record
 * whichever one actually applies.
 */
export function annotateSpawnEnoent<T extends NodeJS.ErrnoException>(error: T, { command, cwd }: { command: string; cwd: string }): T {
    if (error.code !== "ENOENT") {
        return error;
    }
    const detail = nodeFs.existsSync(cwd)
        ? `executable not found on PATH: ${command}`
        : `working directory does not exist: ${cwd}`;
    error.message = `${error.message} (${detail})`;
    return error;
}
export function toInternalConnectError(prefix: string, error: unknown) {
    if (error instanceof ConnectError) {
        return error;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    let code = Code.Internal;
    if (error instanceof Error) {
        if (error.name === "AbortError") {
            code = Code.Canceled;
        }
        else if (error.name === "TimeoutError") {
            code = Code.DeadlineExceeded;
        }
    }
    return new ConnectError(`${prefix}: ${errorMessage}`, code, undefined, undefined, error);
}
/**
 * Check if an error is caused by the client disconnecting (e.g., due to timeout or abort).
 * This includes errors like ERR_STREAM_DESTROYED which occur when the HTTP response stream
 * is closed by the client while the server is still writing to it.
 */
export function isClientDisconnectError(error: unknown): error is NodeJS.ErrnoException & { code: "ERR_STREAM_DESTROYED" | "ERR_STREAM_PREMATURE_CLOSE" | "ECONNRESET" | "EPIPE" } {
    if (!(error instanceof Error)) {
        return false;
    }
    const code = (error as NodeJS.ErrnoException).code;
    return (code === "ERR_STREAM_DESTROYED" ||
        code === "ERR_STREAM_PREMATURE_CLOSE" ||
        code === "ECONNRESET" ||
        code === "EPIPE");
}
