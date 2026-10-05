import nodeChildProcess from "node:child_process";
import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import nodeUtil from "node:util";
import { createLogger } from "../interop/vendor/context-logger.js";
import { spawnWorkload } from "../interop/vendor/utils-workload-spawn.js";
import nodeOs from "node:os";
import { SYNTHETIC_GIT_AUTH_USERNAMES, refreshCachedGitAuthTokens } from "./secretRedaction.js";
import type { Context } from "../interop/contracts/context.js";
import type { ExecFileOptionsWithStringEncoding, PromiseWithChild } from "node:child_process";
export interface GitAuthScope { hostname: string; pathname?: string; }

/**
 * Managed claim-credential state on a self-hosted worker or VM host, and its
 * teardown.
 *
 * The backend push path (`RefreshGithubAccessToken`) delivers short-lived
 * run-owner tokens into durable per-OS-user state: tokenized `insteadOf`
 * rewrites in the global git config and the gh CLI config under
 * `~/.config/gh`. Every such write records a durable, token-free marker in
 * the global git config:
 *
 * - `cursor.managedauthrewritescope` records each rewrite scope (hostname
 *   plus optional pathname) the daemon installed, so teardown removes exactly
 *   what a refresh wrote — never operator-installed rewrites for unmanaged
 *   hosts — and survives process restarts, letting a boot sweep clean
 *   rewrites orphaned by a SIGKILL.
 * - `cursor.managedghconfig` records that the daemon overwrote the gh config
 *   files wholesale. Teardown deletes those files only when the marker is
 *   set (an operator's own gh login on a host where no claim ever pushed is
 *   never touched) and deletes rather than restores, because the write
 *   already destroyed the prior contents; gh regenerates defaults on next
 *   use.
 *
 * `removeManagedGitCredentials` is the single teardown entry point, invoked
 * at claim end (release, reset, graceful stop) and by the worker's boot
 * sweep. It is marker-scoped and idempotent, but the markers do not record
 * which process wrote them: on a host where the Cloud Agent VM platform or
 * another worker pushed credentials, it removes theirs too. Workers that
 * never opted into credential delivery therefore skip it.
 */
export const execFileAsync = nodeUtil.promisify(nodeChildProcess.execFile);
// Pins the string-encoding overload so stdout/stderr stay strings through spawnWorkload.
export const execFileUtf8Async: (file: string, args: readonly string[], options: ExecFileOptionsWithStringEncoding) => PromiseWithChild<{ stdout: string; stderr: string }> = execFileAsync;
export const logger = createLogger("exec-daemon-managed-git-credentials");
// Sourced from the redaction specs so every username we may write into git
// config is also one whose token gets redacted from transcripts.
export const KNOWN_GIT_CLONE_USERNAMES = SYNTHETIC_GIT_AUTH_USERNAMES;
export const MANAGED_GIT_AUTH_SCOPE_MARKER_KEY = "cursor.managedauthrewritescope";
export const MANAGED_GH_CONFIG_MARKER_KEY = "cursor.managedghconfig";
/**
 * `git config --get*` exits 1 when no key matches; `--unset-all` exits 5 when
 * there is nothing to unset. Both are expected idempotent no-op outcomes.
 */
export const GIT_CONFIG_EXIT_CODE = {
    KEY_NOT_FOUND: 1,
    NOTHING_TO_UNSET: 5,
};
export function hasGitConfigExitCode(error: unknown, expectedCode: number) {
    return error instanceof Error && "code" in error && error.code === expectedCode;
}
export function getGhConfigPaths() {
    const ghDir = nodePath.join(nodeOs.homedir(), ".config", "gh");
    return {
        ghDir,
        hostsPath: nodePath.join(ghDir, "hosts.yml"),
        configPath: nodePath.join(ghDir, "config.yml"),
    };
}
export function escapeGitConfigRegexp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function getTokenizedInsteadOfKeyPattern(scope: GitAuthScope) {
    const authSchemePattern = `(${KNOWN_GIT_CLONE_USERNAMES.map(escapeGitConfigRegexp).join("|")})`;
    const escapedHostname = escapeGitConfigRegexp(scope.hostname);
    if (scope.pathname === undefined) {
        return `^url\\.https://${authSchemePattern}:.*@${escapedHostname}/\\.insteadof$`;
    }
    const pathVariants = [scope.pathname, `${scope.pathname}.git`, `${scope.pathname}.git/`]
        .map(escapeGitConfigRegexp)
        .join("|");
    return `^url\\.https://${authSchemePattern}:.*@${escapedHostname}(${pathVariants})\\.insteadof$`;
}
// The marker stores only the scope (hostname plus optional pathname), never
// tokens. A pathname always starts with "/", so the encoding is unambiguous.
export function encodeGitAuthScopeMarker(scope: GitAuthScope) {
    return `${scope.hostname}${scope.pathname ?? ""}`;
}
export function decodeGitAuthScopeMarker(value: string) {
    const slashIndex = value.indexOf("/");
    if (slashIndex === -1) {
        return { hostname: value };
    }
    return {
        hostname: value.slice(0, slashIndex),
        pathname: value.slice(slashIndex),
    };
}
export async function readManagedGitAuthScopeMarkers(ctx: Context) {
    try {
        const { stdout } = await spawnWorkload(execFileUtf8Async, "git", ["config", "--global", "--get-all", MANAGED_GIT_AUTH_SCOPE_MARKER_KEY], { maxBuffer: 50 * 1024 * 1024 });
        return stdout
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map(decodeGitAuthScopeMarker);
    }
    catch (error) {
        if (!hasGitConfigExitCode(error, GIT_CONFIG_EXIT_CODE.KEY_NOT_FOUND)) {
            logger.warn(ctx, "Failed to read managed git auth scope markers; continuing");
        }
        return [];
    }
}
export async function recordManagedGitAuthScopeMarker(ctx: Context, scope: GitAuthScope) {
    const encoded = encodeGitAuthScopeMarker(scope);
    try {
        const existing = (await readManagedGitAuthScopeMarkers(ctx)).map(encodeGitAuthScopeMarker);
        if (existing.includes(encoded)) {
            return;
        }
        await spawnWorkload(execFileAsync, "git", ["config", "--global", "--add", MANAGED_GIT_AUTH_SCOPE_MARKER_KEY, encoded], { maxBuffer: 50 * 1024 * 1024 });
    }
    catch {
        // Best-effort: teardown falls back to the in-memory scope map.
        logger.warn(ctx, "Failed to record managed git auth scope marker; continuing", {
            hostname: scope.hostname,
        });
    }
}
export async function clearManagedGitAuthScopeMarkers(ctx: Context) {
    try {
        await spawnWorkload(execFileAsync, "git", ["config", "--global", "--unset-all", MANAGED_GIT_AUTH_SCOPE_MARKER_KEY], { maxBuffer: 50 * 1024 * 1024 });
    }
    catch (error) {
        if (!hasGitConfigExitCode(error, GIT_CONFIG_EXIT_CODE.NOTHING_TO_UNSET)) {
            logger.warn(ctx, "Failed to clear managed git auth scope markers; continuing");
        }
    }
}
/**
 * Removes every tokenized `insteadOf` rewrite for a managed scope, across all
 * known clone-username schemes. Shared by the refresh path (displacing stale
 * rewrites before installing a fresh token) and claim teardown.
 */
export async function removeTokenizedInsteadOfRewrites(ctx: Context, scope: GitAuthScope) {
    let stdout: string;
    try {
        const result = await spawnWorkload(execFileUtf8Async, "git", ["config", "--global", "--get-regexp", getTokenizedInsteadOfKeyPattern(scope)], { maxBuffer: 50 * 1024 * 1024 });
        stdout = result.stdout;
    }
    catch (error) {
        if (hasGitConfigExitCode(error, GIT_CONFIG_EXIT_CODE.KEY_NOT_FOUND)) {
            logger.debug(ctx, "No token-based URL configurations found for managed scope", {
                hostname: scope.hostname,
            });
        }
        else {
            logger.warn(ctx, "Failed to inspect token-based URL configurations; continuing", {
                hostname: scope.hostname,
            });
        }
        return 0;
    }
    const keys = new Set<string>(stdout
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => {
        const separatorIndex = line.indexOf(" ");
        return separatorIndex === -1 ? line : line.slice(0, separatorIndex);
    }));
    let removed = 0;
    for (const key of keys) {
        try {
            await spawnWorkload(execFileAsync, "git", ["config", "--global", "--unset-all", key], {
                maxBuffer: 50 * 1024 * 1024,
            });
            removed += 1;
        }
        catch {
            logger.warn(ctx, "Failed to remove token-based URL configuration; continuing", {
                hostname: scope.hostname,
            });
        }
    }
    return removed;
}
export async function markGhConfigManaged(ctx: Context) {
    try {
        await spawnWorkload(execFileAsync, "git", ["config", "--global", MANAGED_GH_CONFIG_MARKER_KEY, "true"], {});
    }
    catch {
        // Best-effort: without the marker, teardown skips the gh files and the
        // token ages out with its <=1h expiry.
        logger.warn(ctx, "Failed to record managed gh config marker; continuing");
    }
}
export async function removeManagedGhConfig(ctx: Context) {
    try {
        // Exit code 1 means the marker is absent: no Cursor process for this OS
        // user wrote gh config, so the files are operator-owned and must not be
        // touched.
        await spawnWorkload(execFileAsync, "git", ["config", "--global", "--get", MANAGED_GH_CONFIG_MARKER_KEY], {});
    }
    catch (error) {
        if (!hasGitConfigExitCode(error, GIT_CONFIG_EXIT_CODE.KEY_NOT_FOUND)) {
            logger.warn(ctx, "Failed to read managed gh config marker; continuing");
        }
        return;
    }
    // Delete the files BEFORE clearing the marker: if a deletion fails or the
    // process dies mid-teardown, the surviving marker makes the next teardown
    // (or boot sweep) retry the removal instead of skipping token files that
    // are still on disk.
    const { hostsPath, configPath } = getGhConfigPaths();
    await Promise.all([hostsPath, configPath].flatMap((target) => [
        nodeFsPromises.rm(target, { force: true }),
        nodeFsPromises.rm(`${target}.tmp`, { force: true }),
    ]));
    try {
        await spawnWorkload(execFileAsync, "git", ["config", "--global", "--unset-all", MANAGED_GH_CONFIG_MARKER_KEY], {});
    }
    catch (error) {
        if (!hasGitConfigExitCode(error, GIT_CONFIG_EXIT_CODE.NOTHING_TO_UNSET)) {
            logger.warn(ctx, "Failed to clear managed gh config marker; continuing");
        }
    }
}
/**
 * Claim teardown for pushed git and gh credentials. Removes the tokenized
 * rewrites for every marker-recorded scope (unioned with the caller's
 * in-memory scopes, which cover a refresh whose marker write failed), clears
 * the markers, refreshes the redaction cache, and deletes the daemon-written
 * gh config. No fallback scope: when neither source records a push, teardown
 * does not touch host git config.
 */
export async function removeManagedGitCredentials(ctx: Context, args: { inMemoryScopes: Iterable<GitAuthScope> }) {
    logger.info(ctx, "Removing pushed git and gh credentials");
    const scopesByMarker = new Map<string, GitAuthScope>();
    for (const scope of [...(await readManagedGitAuthScopeMarkers(ctx)), ...args.inMemoryScopes]) {
        scopesByMarker.set(encodeGitAuthScopeMarker(scope), scope);
    }
    let removedRewrites = 0;
    for (const scope of scopesByMarker.values()) {
        removedRewrites += await removeTokenizedInsteadOfRewrites(ctx, scope);
    }
    await clearManagedGitAuthScopeMarkers(ctx);
    try {
        await refreshCachedGitAuthTokens();
    }
    catch {
        logger.warn(ctx, "Failed to refresh cached git auth after credential removal; continuing");
    }
    try {
        await removeManagedGhConfig(ctx);
    }
    catch {
        logger.warn(ctx, "Failed to remove managed gh config; continuing");
    }
    logger.info(ctx, "Finished removing pushed git and gh credentials", {
        removedRewrites,
    });
}
