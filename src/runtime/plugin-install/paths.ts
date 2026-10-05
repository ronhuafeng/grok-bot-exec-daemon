import { ConnectError } from "../../interop/vendor/connect-connect-error.js";
import { Code } from "../../interop/vendor/connect-code.js";
import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
export const USER_PLUGIN_CACHE_ROOT_SEGMENTS = [".cursor", "plugins", "cache"];
export const READONLY_PLUGIN_CACHE_ROOT = nodePath.resolve((nodePath).sep, "tmp", "cursor-readonly-plugin-cache");
export function isPathStrictlyInside(targetPath: string, rootPath: string) {
    const relative = nodePath.relative(rootPath, targetPath);
    return relative.length > 0 && !relative.startsWith("..") && !nodePath.isAbsolute(relative);
}
export function getAllowedPluginInstallTargetRoots() {
    const homeDir = process.env.HOME?.trim();
    return [
        ...(homeDir !== undefined && homeDir.length > 0
            ? [nodePath.resolve(homeDir, ...USER_PLUGIN_CACHE_ROOT_SEGMENTS)]
            : []),
        READONLY_PLUGIN_CACHE_ROOT,
    ];
}
export function isPathEqualOrInside(targetPath: string, rootPath: string) {
    const relative = nodePath.relative(rootPath, targetPath);
    return (relative === "" ||
        (relative.length > 0 && !relative.startsWith("..") && !nodePath.isAbsolute(relative)));
}
export function isAllowedPluginInstallTargetRoot(targetRoot: string) {
    if (targetRoot.length === 0 || !nodePath.isAbsolute(targetRoot)) {
        return false;
    }
    const normalized = nodePath.resolve(targetRoot);
    return getAllowedPluginInstallTargetRoots().some((root) => isPathStrictlyInside(normalized, root));
}
export function getMatchingAllowedPluginCacheRoot(targetRoot: string) {
    const allowedRoots = getAllowedPluginInstallTargetRoots();
    const matchingRoot = allowedRoots.find((root) => isPathEqualOrInside(targetRoot, root));
    if (matchingRoot === undefined) {
        throw new ConnectError("target_root is outside the allowed plugin cache directories", Code.InvalidArgument);
    }
    return matchingRoot;
}
export async function safeLstat(filePath: string) {
    try {
        return await nodeFsPromises.lstat(filePath);
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
        }
        throw error;
    }
}
export function getPluginCacheAnchorPath(cacheRoot: string) {
    const homeDir = process.env.HOME?.trim();
    if (homeDir !== undefined && homeDir.length > 0) {
        const resolvedHome = nodePath.resolve(homeDir);
        if (isPathEqualOrInside(cacheRoot, resolvedHome)) {
            return resolvedHome;
        }
    }
    return nodePath.resolve((nodePath).sep, "tmp");
}
export async function ensureRealDirectoryHierarchy(anchorPath: string, directoryPath: string) {
    const relativePath = nodePath.relative(anchorPath, directoryPath);
    if (relativePath.startsWith("..") || (relativePath.length > 0 && nodePath.isAbsolute(relativePath))) {
        throw new ConnectError("plugin install path is outside the allowed anchor directory", Code.Internal);
    }
    const anchorStat = await safeLstat(anchorPath);
    if (anchorStat === null || anchorStat.isSymbolicLink()) {
        throw new ConnectError("plugin install anchor is not a real directory", Code.Internal);
    }
    if (!anchorStat.isDirectory()) {
        throw new ConnectError("plugin install anchor is not a directory", Code.Internal);
    }
    let currentPath = anchorPath;
    for (const part of relativePath.split((nodePath).sep)) {
        if (part.length === 0 || part === ".") {
            continue;
        }
        currentPath = nodePath.join(currentPath, part);
        let currentStat = await safeLstat(currentPath);
        if (currentStat === null) {
            await nodeFsPromises.mkdir(currentPath);
            currentStat = await nodeFsPromises.lstat(currentPath);
        }
        if (currentStat.isSymbolicLink()) {
            throw new ConnectError("plugin install path contains a symbolic link", Code.Internal);
        }
        if (!currentStat.isDirectory()) {
            throw new ConnectError("plugin install path parent is not a directory", Code.Internal);
        }
    }
    const anchorRealPath = await nodeFsPromises.realpath(anchorPath);
    const directoryRealPath = await nodeFsPromises.realpath(directoryPath);
    if (!isPathEqualOrInside(directoryRealPath, anchorRealPath)) {
        throw new ConnectError("plugin install path resolves outside the allowed anchor directory", Code.Internal);
    }
}
export async function ensureSafePluginInstallTargetDirectory(targetRoot: string) {
    const cacheRoot = getMatchingAllowedPluginCacheRoot(targetRoot);
    const anchorPath = getPluginCacheAnchorPath(cacheRoot);
    await ensureRealDirectoryHierarchy(anchorPath, cacheRoot);
    await ensureRealDirectoryHierarchy(cacheRoot, targetRoot);
    const cacheRootRealPath = await nodeFsPromises.realpath(cacheRoot);
    const targetRealPath = await nodeFsPromises.realpath(targetRoot);
    if (!isPathEqualOrInside(targetRealPath, cacheRootRealPath)) {
        throw new ConnectError("plugin install target resolves outside the allowed plugin cache", Code.Internal);
    }
}
export async function resetPluginInstallTargetDirectory(targetRoot: string) {
    await ensureSafePluginInstallTargetDirectory(targetRoot);
    await nodeFsPromises.rm(targetRoot, { recursive: true, force: true });
    await ensureSafePluginInstallTargetDirectory(targetRoot);
}
