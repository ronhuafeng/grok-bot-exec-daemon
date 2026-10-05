import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import { findGitRoot } from "../interop/vendor/local-exec.js";
import type { Context } from "../interop/contracts/context.js";

export const DEFAULT_EXEC_DAEMON_REPOS_ROOT = "/agent/repos";
export const EXEC_DAEMON_REPOS_ROOT_ENV_VAR = "CURSOR_EXEC_DAEMON_REPOS_ROOT";
export async function canonicalizePath(pathToNormalize: string) {
    const resolvedPath = nodePath.resolve(pathToNormalize);
    try {
        return await nodeFsPromises.realpath(resolvedPath);
    }
    catch {
        return resolvedPath;
    }
}
/**
 * Discovers workspace roots for exec-daemon. When `/agent/repos` exists, we
 * treat each direct child git repo as an additional workspace while keeping the
 * daemon's primary cwd first for stable rule precedence.
 */
export async function discoverExecDaemonWorkspacePaths(ctx: Context, gitExecutor: Parameters<typeof import("../interop/vendor/local-exec.js").findGitRoot>[1], workspacePath: string, options: { reposRoot?: string } = {}) {
    const defaultWorkspacePath = await canonicalizePath(workspacePath);
    const reposRoot = await canonicalizePath(options.reposRoot ??
        process.env[EXEC_DAEMON_REPOS_ROOT_ENV_VAR] ??
        DEFAULT_EXEC_DAEMON_REPOS_ROOT);
    try {
        const reposRootStats = await nodeFsPromises.stat(reposRoot);
        if (!reposRootStats.isDirectory()) {
            return {
                workspacePaths: [defaultWorkspacePath],
                usesReposRoot: false,
            };
        }
    }
    catch {
        return {
            workspacePaths: [defaultWorkspacePath],
            usesReposRoot: false,
        };
    }
    let repoEntries: string[] = [];
    try {
        repoEntries = await nodeFsPromises.readdir(reposRoot);
    }
    catch {
        return {
            workspacePaths: [defaultWorkspacePath],
            usesReposRoot: false,
        };
    }
    const candidateRepoPaths = (await Promise.all(repoEntries.map(async (entry) => {
        const candidatePath = await canonicalizePath(nodePath.join(reposRoot, entry));
        try {
            const candidateStats = await nodeFsPromises.stat(candidatePath);
            return candidateStats.isDirectory() ? candidatePath : undefined;
        }
        catch {
            return undefined;
        }
    }))).filter((candidatePath) => candidatePath !== undefined);
    const discoveredRepoRoots = (await Promise.all(candidateRepoPaths.map(async (candidatePath) => {
        const gitRoot = await findGitRoot(ctx, gitExecutor, candidatePath);
        if (gitRoot === null) {
            return undefined;
        }
        const resolvedGitRoot = nodePath.resolve(gitRoot);
        return resolvedGitRoot === candidatePath ? candidatePath : undefined;
    }))).filter((candidatePath) => candidatePath !== undefined);
    const preferredWorkspacePath = await canonicalizePath((await findGitRoot(ctx, gitExecutor, defaultWorkspacePath)) ?? defaultWorkspacePath);
    const fallbackWorkspacePath = discoveredRepoRoots.length > 0 ? preferredWorkspacePath : defaultWorkspacePath;
    const orderedWorkspacePaths = [
        fallbackWorkspacePath,
        ...[...new Set<string>(discoveredRepoRoots)]
            .filter((repoPath) => repoPath !== fallbackWorkspacePath)
            .sort((left, right) => left.localeCompare(right)),
    ];
    return {
        workspacePaths: [...new Set<string>(orderedWorkspacePaths)],
        usesReposRoot: true,
    };
}
