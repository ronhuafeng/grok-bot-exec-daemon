import { createLogger } from "../interop/vendor/context-logger.js";
import { InstallPluginArtifactResponse } from "../interop/vendor/proto-agent-v1-control-service-pb.js";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import { PLUGIN_INSTALL_TIMEOUT_MS, PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS } from "./plugin-install/limits.js";
import { downloadPluginArtifactToFile } from "./plugin-install/download.js";
import { toPluginInstallConnectError, remainingInstallTimeoutMs, remainingPhaseTimeoutMs, pluginInstallFailureMessage } from "./plugin-install/errors.js";
import { isAllowedPluginInstallTargetRoot, resetPluginInstallTargetDirectory } from "./plugin-install/paths.js";
import { validateTarballBeforeExtraction, extractTarball, verifyExtractedArtifactPaths } from "./plugin-install/tar.js";
import type { Context } from "../interop/contracts/context.js";
import type { agent_v1_InstallPluginArtifactRequest } from "../interop/contracts/protobuf-generated.js";

export const logger = createLogger("exec-daemon-install-plugin");
export async function installPluginArtifactFromUrl(ctx: Context, request: agent_v1_InstallPluginArtifactRequest, deps: { fetchImpl?: typeof fetch } = {}) {
    const fetchImpl = deps.fetchImpl ?? fetch;
    const trimmedTargetRoot = request.targetRoot.trim();
    if (trimmedTargetRoot.length === 0) {
        throw new ConnectError("target_root is required", Code.InvalidArgument);
    }
    const targetRoot = nodePath.resolve(trimmedTargetRoot);
    if (!isAllowedPluginInstallTargetRoot(targetRoot)) {
        throw new ConnectError("target_root is outside the allowed plugin cache directories", Code.InvalidArgument);
    }
    const downloadUrl = request.downloadUrl.trim();
    if (downloadUrl.length === 0) {
        throw new ConnectError("download_url is required", Code.InvalidArgument);
    }
    const tarballPath = `${targetRoot}.tar.gz`;
    const installDeadlineMs = Date.now() + PLUGIN_INSTALL_TIMEOUT_MS;
    let targetPrepared = false;
    let installSucceeded = false;
    try {
        try {
            await resetPluginInstallTargetDirectory(targetRoot);
            targetPrepared = true;
        }
        catch (error) {
            throw toPluginInstallConnectError(error, "filesystem");
        }
        try {
            await nodeFsPromises.rm(tarballPath, { force: true });
            await downloadPluginArtifactToFile({
                fetchImpl,
                downloadUrl,
                destinationPath: tarballPath,
                timeoutMs: remainingInstallTimeoutMs(installDeadlineMs),
            });
        }
        catch (error) {
            throw toPluginInstallConnectError(error, "download");
        }
        const extractionDeadlineMs = Date.now() + PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS;
        try {
            const extractionTimeoutMs = remainingPhaseTimeoutMs(extractionDeadlineMs, installDeadlineMs);
            await validateTarballBeforeExtraction({
                tarballPath,
                timeoutMs: extractionTimeoutMs,
            });
            const exitCode = await extractTarball({
                targetRoot,
                tarballPath,
                timeoutMs: remainingPhaseTimeoutMs(extractionDeadlineMs, installDeadlineMs),
            });
            if (exitCode !== 0) {
                throw new ConnectError(`${pluginInstallFailureMessage("extraction", "failed")} (exit code ${exitCode})`, Code.Internal);
            }
            await verifyExtractedArtifactPaths(targetRoot);
        }
        catch (error) {
            throw toPluginInstallConnectError(error, "extraction");
        }
        logger.info(ctx, "Installed plugin artifact", {
            artifactDigest: request.artifactDigest,
        });
        installSucceeded = true;
        return new InstallPluginArtifactResponse({});
    }
    catch (error) {
        const connectError = error instanceof ConnectError ? error : toPluginInstallConnectError(error, "download");
        logger.warn(ctx, "Plugin artifact install failed", {
            artifactDigest: request.artifactDigest,
            errorMessage: connectError.message,
        });
        throw connectError;
    }
    finally {
        await nodeFsPromises.rm(tarballPath, { force: true }).catch(() => undefined);
        if (targetPrepared && !installSucceeded) {
            await nodeFsPromises.rm(targetRoot, { recursive: true, force: true }).catch(() => undefined);
        }
    }
}
