import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import nodeFsPromises from "node:fs/promises";
import nodeFs from "node:fs";
import { toInternalConnectError } from "./errors.js";
import nodeCrypto from "node:crypto";
import { ReadFileResponse } from "../interop/vendor/server-private.js";
import type { Context } from "../interop/contracts/context.js";

export const READ_FILE_CHUNK_BYTES = 256 * 1024;
export const READ_FILE_MAX_BYTES = 256 * 1024 * 1024;
/**
 * Trusted ExecService access, like daemon Read/ReadBinaryFile: paths (including
 * symlinks) are resolved by the OS with the daemon user's filesystem permissions.
 * This is not the workspace-constrained, user-facing ExportFile API.
 */
export async function* readFile(ctx: Context, request: { path: string; maxBytes: bigint; offset: bigint; length: bigint }): AsyncGenerator<InstanceType<typeof ReadFileResponse>> {
    const checkCanceled = () => {
        if (ctx.signal.aborted) {
            throw new ConnectError("File read canceled", Code.Canceled);
        }
    };
    checkCanceled();
    if (request.path.length === 0 || request.path.includes("\0")) {
        throw new ConnectError("Invalid file path", Code.InvalidArgument);
    }
    const hardCap = BigInt(READ_FILE_MAX_BYTES);
    const maxBytes = request.maxBytes === BigInt(0) || request.maxBytes > hardCap ? hardCap : request.maxBytes;
    if (maxBytes < BigInt(0)) {
        throw new ConnectError("Invalid byte limit", Code.InvalidArgument);
    }
    try {
        // O_NONBLOCK avoids hanging on a FIFO before fstat rejects it.
        const file = await nodeFsPromises.open(request.path, nodeFs.constants.O_RDONLY | nodeFs.constants.O_NONBLOCK);
        let closePromise: Promise<void> | undefined;
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
                throw new ConnectError("Only regular files can be read", Code.InvalidArgument);
            }
            const start = request.offset < initial.size ? request.offset : initial.size;
            const available = initial.size - start;
            const rangeSize = request.length === BigInt(0) || request.length > available ? available : request.length;
            if (rangeSize > maxBytes) {
                throw new ConnectError("File exceeds byte limit", Code.ResourceExhausted);
            }
            yield new ReadFileResponse({
                payload: {
                    case: "header",
                    value: { size: initial.size, realPath },
                },
            });
            const hash = nodeCrypto.createHash("sha256");
            const end = Number(start + rangeSize);
            let position = Number(start);
            while (position < end) {
                checkCanceled();
                const buffer = Buffer.allocUnsafe(Math.min(READ_FILE_CHUNK_BYTES, end - position));
                const { bytesRead } = await file.read(buffer, 0, buffer.length, position);
                checkCanceled();
                if (bytesRead === 0) {
                    throw new ConnectError("File ended before its declared size", Code.DataLoss);
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
                    throw new ConnectError("File contains bytes beyond its declared size", Code.DataLoss);
                }
            }
            const final = await file.stat({ bigint: true });
            checkCanceled();
            if (initial.size !== final.size ||
                initial.mtimeNs !== final.mtimeNs ||
                initial.ctimeNs !== final.ctimeNs) {
                throw new ConnectError("File changed during read", Code.DataLoss);
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
                throw new ConnectError("File not found", Code.NotFound);
            }
            if (error.code === "EACCES" || error.code === "EPERM") {
                throw new ConnectError("Permission denied", Code.PermissionDenied);
            }
        }
        throw toInternalConnectError("Read file failed", error);
    }
}
// The header names the file the daemon opened, not what the request path
// resolves to now: a symlink swapped after open would pass a containment
// check on the new target while the bytes come from the first one.
export async function openedPath(file: import("node:fs/promises").FileHandle, path: string, opened: import("node:fs").BigIntStats) {
    const resolved = (true
        ? await nodeFsPromises.readlink(`/proc/self/fd/${file.fd}`)
        : 0) as string;
    const named = await nodeFsPromises.stat(resolved, { bigint: true });
    if (named.dev !== opened.dev || named.ino !== opened.ino) {
        throw new ConnectError("File changed during open", Code.DataLoss);
    }
    return resolved;
}
