import { ConnectError } from "../../interop/vendor/connect-connect-error.js";
import { Code } from "../../interop/vendor/connect-code.js";
import nodeChildProcess from "node:child_process";
import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import { spawnWorkload } from "../../interop/vendor/utils-workload-spawn.js";
import { PLUGIN_ARTIFACT_MAX_ENTRIES, parseTarVerboseListingSize, PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES } from "./limits.js";
import { pluginInstallFailureMessage } from "./errors.js";
import { isPathEqualOrInside } from "./paths.js";
import nodeReadline from "node:readline";
// Pins the piped-stdout overload so child.stdout is non-null through spawnWorkload.
export const spawnWithPipedStdout: (
    command: string,
    args: readonly string[],
    options: import("node:child_process").SpawnOptionsWithStdioTuple<"ignore", "pipe", "ignore">
) => import("node:child_process").ChildProcessByStdio<null, import("node:stream").Readable, null> = nodeChildProcess.spawn;
export function recordTarListingLine(line: string, stats: { entryCount: number; totalUncompressedBytes: number }) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) {
        return;
    }
    const fileType = trimmedLine[0];
    if (fileType === "l") {
        throw new ConnectError("plugin artifact contains symbolic links", Code.InvalidArgument);
    }
    if (fileType !== "-" && fileType !== "d") {
        throw new ConnectError("plugin artifact contains unsupported special files", Code.InvalidArgument);
    }
    stats.entryCount += 1;
    if (stats.entryCount > PLUGIN_ARTIFACT_MAX_ENTRIES) {
        throw new ConnectError("plugin artifact exceeds entry count limit", Code.InvalidArgument);
    }
    const entrySize = parseTarVerboseListingSize(trimmedLine);
    if (entrySize === null) {
        throw new ConnectError("plugin artifact listing has an unrecognized entry", Code.InvalidArgument);
    }
    if (!Number.isFinite(entrySize) || entrySize < 0) {
        throw new ConnectError("plugin artifact listing has an invalid entry size", Code.InvalidArgument);
    }
    stats.totalUncompressedBytes += entrySize;
    if (stats.totalUncompressedBytes > PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES) {
        throw new ConnectError("plugin artifact exceeds uncompressed size limit", Code.InvalidArgument);
    }
}
export function assertExtractedEntryCountWithinLimit(entryCount: number) {
    if (entryCount > PLUGIN_ARTIFACT_MAX_ENTRIES) {
        throw new ConnectError("plugin artifact exceeds entry count limit", Code.InvalidArgument);
    }
}
export async function validateTarballBeforeExtraction(params: { tarballPath: string; timeoutMs: number }) {
    return await new Promise<void>((resolve, reject) => {
        const child = spawnWorkload(spawnWithPipedStdout, "tar", ["-tvzf", params.tarballPath], {
            stdio: ["ignore", "pipe", "ignore"],
        });
        const stats = { entryCount: 0, totalUncompressedBytes: 0 };
        const lineReader = nodeReadline.createInterface({ input: child.stdout });
        let settled = false;
        let childExitCode: number | null = null;
        let lineReaderClosed = false;
        const finish = (error?: unknown) => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timeout);
            if (error !== undefined) {
                child.kill("SIGKILL");
                reject(error);
                return;
            }
            resolve();
        };
        const tryFinish = () => {
            if (!lineReaderClosed || childExitCode === null) {
                return;
            }
            if (childExitCode === 0) {
                finish();
                return;
            }
            finish(new ConnectError(pluginInstallFailureMessage("extraction", "failed"), Code.Internal));
        };
        const timeout = setTimeout(() => {
            finish(new ConnectError(pluginInstallFailureMessage("extraction", "timeout"), Code.Internal));
        }, params.timeoutMs);
        lineReader.on("line", (line) => {
            try {
                recordTarListingLine(line, stats);
            }
            catch (error) {
                finish(error);
            }
        });
        lineReader.on("close", () => {
            lineReaderClosed = true;
            tryFinish();
        });
        child.on("error", (error) => {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                finish(new ConnectError(pluginInstallFailureMessage("extraction", "failed"), Code.Internal));
                return;
            }
            finish(error);
        });
        child.on("close", (code) => {
            childExitCode = code ?? 1;
            tryFinish();
        });
    });
}
export async function verifyExtractedArtifactPaths(targetRoot: string) {
    const targetRootRealPath = await nodeFsPromises.realpath(targetRoot);
    let extractedBytes = 0;
    let extractedEntryCount = 0;
    const walk = async (currentPath: string): Promise<void> => {
        const entries = await nodeFsPromises.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            extractedEntryCount += 1;
            assertExtractedEntryCountWithinLimit(extractedEntryCount);
            const entryPath = nodePath.join(currentPath, entry.name);
            const entryStat = await nodeFsPromises.lstat(entryPath);
            if (entryStat.isSymbolicLink()) {
                throw new ConnectError("plugin artifact contains symbolic links", Code.Internal);
            }
            if (!entryStat.isFile() && !entryStat.isDirectory()) {
                throw new ConnectError("plugin artifact contains unsupported special files", Code.InvalidArgument);
            }
            const entryRealPath = await nodeFsPromises.realpath(entryPath);
            if (!isPathEqualOrInside(entryRealPath, targetRootRealPath)) {
                throw new ConnectError("plugin artifact extraction escaped the install target directory", Code.Internal);
            }
            if (entryStat.isFile()) {
                extractedBytes += entryStat.size;
                if (extractedBytes > PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES) {
                    throw new ConnectError("plugin artifact exceeds uncompressed size limit", Code.InvalidArgument);
                }
            }
            if (entryStat.isDirectory()) {
                await walk(entryPath);
            }
        }
    };
    await walk(targetRoot);
}
export function buildExtractTarArgs(tarballPath: string, targetRoot: string) {
    const args = ["-xzf", tarballPath, "-C", targetRoot];
    // Cloud-agent VMs run GNU tar; keep anchored extraction there. macOS bsdtar
    // used in local dev/tests does not support these flags — post-extract path
    // verification still runs on every platform.
    if (true) {
        args.push("--no-same-owner", "--anchored");
    }
    return args;
}
export async function extractTarball(params: { tarballPath: string; targetRoot: string; timeoutMs: number }) {
    return await new Promise<number>((resolve, reject) => {
        const child = spawnWorkload(nodeChildProcess.spawn, "tar", buildExtractTarArgs(params.tarballPath, params.targetRoot), {
            stdio: ["ignore", "ignore", "ignore"],
        });
        const timeout = setTimeout(() => {
            child.kill("SIGKILL");
            reject(new ConnectError(pluginInstallFailureMessage("extraction", "timeout"), Code.Internal));
        }, params.timeoutMs);
        child.on("error", (error) => {
            clearTimeout(timeout);
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                resolve(127);
                return;
            }
            reject(error);
        });
        child.on("close", (code) => {
            clearTimeout(timeout);
            resolve(code ?? 1);
        });
    });
}
