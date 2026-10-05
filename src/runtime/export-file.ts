import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import nodeFs from "node:fs";
export const EXPORT_CHUNK_SIZE_BYTES = 64 * 1024;
export function assertExportableRegularFile(fileStat: import("node:fs").Stats | import("node:fs").BigIntStats) {
    if (!fileStat.isFile()) {
        throw new ConnectError("Only regular files can be exported", Code.InvalidArgument);
    }
    if (BigInt(fileStat.nlink) > BigInt(1)) {
        throw new ConnectError("Hard-linked files cannot be exported", Code.InvalidArgument);
    }
}
export function isPathWithinRoot(args: { rootPath: string; targetPath: string }) {
    const relativePath = nodePath.relative(args.rootPath, args.targetPath);
    return (relativePath !== "" &&
        relativePath !== ".." &&
        !relativePath.startsWith(`..${(nodePath).sep}`) &&
        !nodePath.isAbsolute(relativePath));
}
export async function getOpenedFilePath(fileDescriptor: number, fallbackPath: string) {
    if (false) // removed by dead control flow
     { }
    return nodeFsPromises.realpath(`/proc/self/fd/${fileDescriptor}`);
}
export type ExportFileChunk = { type: "metadata"; totalBytes: bigint } | { type: "chunk"; contentChunk: Uint8Array };
export async function* exportFileChunks(args: { workspaceRootPath: string; authoritativeWorkspaceRootPaths: readonly string[]; filePath: string }): AsyncGenerator<ExportFileChunk> {
    const canonicalRootPath = await nodeFsPromises.realpath(args.workspaceRootPath);
    if (canonicalRootPath === nodePath.parse(canonicalRootPath).root) {
        throw new ConnectError("Filesystem root cannot be used as an export boundary", Code.PermissionDenied);
    }
    // Startup discovery already canonicalizes existing roots. Resolve relative
    // test/default roots lexically so one workspace disappearing later does not
    // prevent exports from the daemon's other discovered workspaces.
    const authoritativeWorkspaceRootPaths = args.authoritativeWorkspaceRootPaths.map((authoritativeRootPath) => nodePath.resolve(authoritativeRootPath));
    if (!authoritativeWorkspaceRootPaths.includes(canonicalRootPath)) {
        throw new ConnectError("Workspace root is not managed by exec-daemon", Code.PermissionDenied);
    }
    const requestedFilePath = nodePath.isAbsolute(args.filePath)
        ? args.filePath
        : nodePath.resolve(canonicalRootPath, args.filePath);
    const requestedFileStat = await nodeFsPromises.lstat(requestedFilePath);
    if (requestedFileStat.isSymbolicLink()) {
        throw new ConnectError("Symbolic links cannot be exported", Code.InvalidArgument);
    }
    assertExportableRegularFile(requestedFileStat);
    const canonicalFilePath = await nodeFsPromises.realpath(requestedFilePath);
    if (!isPathWithinRoot({
        rootPath: canonicalRootPath,
        targetPath: canonicalFilePath,
    })) {
        throw new ConnectError("File is outside the workspace", Code.PermissionDenied);
    }
    const fileHandle = await nodeFsPromises.open(canonicalFilePath, nodeFs.constants.O_RDONLY | nodeFs.constants.O_NOFOLLOW | nodeFs.constants.O_NONBLOCK);
    try {
        const openedFilePath = await getOpenedFilePath(fileHandle.fd, canonicalFilePath);
        if (!isPathWithinRoot({
            rootPath: canonicalRootPath,
            targetPath: openedFilePath,
        })) {
            throw new ConnectError("File is outside the workspace", Code.PermissionDenied);
        }
        const openedFileStat = await fileHandle.stat({ bigint: true });
        assertExportableRegularFile(openedFileStat);
        const totalBytes = openedFileStat.size;
        yield { type: "metadata", totalBytes };
        let totalBytesRead = BigInt(0);
        while (totalBytesRead < totalBytes) {
            const remainingBytes = totalBytes - totalBytesRead;
            const buffer = Buffer.allocUnsafe(Number(remainingBytes < BigInt(EXPORT_CHUNK_SIZE_BYTES)
                ? remainingBytes
                : BigInt(EXPORT_CHUNK_SIZE_BYTES)));
            const { bytesRead } = await fileHandle.read(buffer, 0, buffer.length);
            if (bytesRead === 0) {
                throw new ConnectError("File ended before its declared size", Code.DataLoss);
            }
            totalBytesRead += BigInt(bytesRead);
            yield {
                type: "chunk",
                contentChunk: new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + bytesRead)),
            };
        }
    }
    finally {
        await fileHandle.close();
    }
}
