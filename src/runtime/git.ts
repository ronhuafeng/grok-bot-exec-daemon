import nodeChildProcess from "node:child_process";
import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import nodeUtil from "node:util";
import { createLogger } from "../interop/vendor/context-logger.js";
import { checkFilesGenerated } from "../interop/vendor/git-core-generated-file-detection.js";
import { parseDiff } from "../interop/vendor/local-exec.js";
import { FileDiff, FileDiff_Chunk, GitDiff, GitDiff_DiffType, GetDiffRequest_OutputFormat, GetDiffResponse } from "../interop/vendor/proto-aiserver-v1-utils-pb.js";
import { buildRepoUrlForAuthRefresh, trimRemotePath, parseOriginRepoCloneUrlParts, normalizeRepoUrlForAuthLookup, getBoundedRepoAuthPathname } from "../interop/vendor/utils-repo-url.js";
import { spawnWorkload } from "../interop/vendor/utils-workload-spawn.js";
import { parseCatFileBatchCheck, CatFileBatchOutputParser } from "./cat-file-batch.js";
import { parseRawDiffZ, numstatBigFileThreshold, parseNumstatZ } from "./git-name-status.js";
import { refreshCachedGitAuthTokens } from "./secretRedaction.js";
import { removeManagedGitCredentials, KNOWN_GIT_CLONE_USERNAMES, recordManagedGitAuthScopeMarker, removeTokenizedInsteadOfRewrites, getGhConfigPaths, markGhConfigManaged } from "./managed-git-credentials.js";
import type { Context, LogMetadata } from "../interop/contracts/context.js";
import type { ExecFileOptionsWithStringEncoding, PromiseWithChild, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams } from "node:child_process";
import type { aiserver_v1_FileDiff, aiserver_v1_GetDiffRequest, aiserver_v1_GetDiffResponse, aiserver_v1_GetDiffResponse_SubmoduleDiff } from "../interop/contracts/protobuf-generated.js";
import type { ProtoMessage, MessageInit } from "../interop/contracts/protobuf-runtime.js";
import type { GitAuthScope } from "./managed-git-credentials.js";
export type GitDiffRequest = Omit<aiserver_v1_GetDiffRequest, keyof ProtoMessage | "cwd" | "committedOnly"> & { useCatFileBatch?: boolean };
export type ParsedFileDiff = ReturnType<typeof import("../interop/vendor/local-exec.js").parseDiff>[number];
export interface GitVersion { major: number; minor: number; patch: number; }
export interface GitSubmodule { path: string; absPath: string; currentRef: string; }
export interface GitCommandOptions {
    useNoOptionalLocks?: boolean;
    shouldNotTrimOutput?: boolean;
    ignoreErrors?: boolean;
    signal?: AbortSignal;
}
export interface GitAuthRefreshOptions {
    cloneUsername?: string;
    repoUrl?: string;
    repoPaths?: string[];
    verbose?: boolean;
}
export interface GitAuthRefreshResult {
    appliedCloneUsername: string;
    staleRewritesDisplaced: number;
    remotesNormalized: number;
}
export interface GitUntrackedFile { path: string; contents: string; }

export const execFileAsync = nodeUtil.promisify(nodeChildProcess.execFile);
// Pins the string-encoding overload so stdout/stderr stay strings through spawnWorkload.
export const execFileUtf8Async: (file: string, args: readonly string[], options: ExecFileOptionsWithStringEncoding) => PromiseWithChild<{ stdout: string; stderr: string }> = execFileAsync;
export const spawnWithPipedStdio: (command: string, args: readonly string[], options: SpawnOptionsWithoutStdio) => ChildProcessWithoutNullStreams = nodeChildProcess.spawn;
export const canonicalizeUrl = (url: string | URL) => {
    try {
        return new URL(url);
    }
    catch (_e) {
        return new URL(`https://${url}`);
    }
};
export const logger = createLogger("exec-daemon-git");
export function fileDiffToProtoDiff(fileDiff: ParsedFileDiff) {
    const d = new FileDiff({
        from: fileDiff.from,
        to: fileDiff.to,
        chunks: fileDiff.chunks.map((diffChunk) => new FileDiff_Chunk({
            content: diffChunk.content,
            lines: diffChunk.changes.map((l) => l.content),
            oldStart: diffChunk.oldStart,
            oldLines: diffChunk.oldLines,
            newStart: diffChunk.newStart,
            newLines: diffChunk.newLines,
        })),
    });
    d.added = fileDiff.additions;
    d.removed = fileDiff.deletions;
    return d;
}
export function serializeUntrackedFilesForPatchId(untrackedFiles: readonly GitUntrackedFile[]) {
    const lines: string[] = [];
    for (const untrackedFile of untrackedFiles) {
        const fileLines = untrackedFile.contents.split("\n");
        const numLines = fileLines.length;
        lines.push(`diff --git a/${untrackedFile.path} b/${untrackedFile.path}`);
        lines.push("--- /dev/null");
        lines.push(`+++ b/${untrackedFile.path}`);
        lines.push(`@@ -0,0 +1${numLines === 1 ? "" : `,${numLines}`} @@`);
        lines.push(...fileLines.map((line) => `+${line}`));
    }
    return lines.join("\n");
}
export function appendDiffForPatchId(...diffs: string[]) {
    const nonEmptyDiffs = diffs.filter((diff) => diff.length > 0);
    if (nonEmptyDiffs.length === 0) {
        return "";
    }
    return `${nonEmptyDiffs.join("\n")}\n`;
}
export function parseGitDiff(input: string) {
    const files = parseDiff(input);
    return new GitDiff({
        diffs: files.map((fileDiff) => fileDiffToProtoDiff(fileDiff)),
        diffType: GitDiff_DiffType.UNSPECIFIED,
    });
}
// `writeGhHostsYml` only ever writes the `github.com:` credential slot, so the
// legacy host-scoped gh bootstrap must only run for github.com refreshes.
// Origin (and other providers) also refresh with the `x-access-token` clone
// username, so without this host check an Origin `cao_` token would clobber
// gh's github.com credential slot. See OriginHandler's GitHub-mirror auth.
export function isGhHostsYmlHostname(hostname: string) {
    return hostname.toLowerCase() === "github.com";
}
export function getRepoScopedGitAuthConfig(args: { repoUrl: string; hostname: string; authScheme: string; accessToken: string }) {
    const repoUrl = new URL(buildRepoUrlForAuthRefresh(args.repoUrl, args.hostname));
    const pathname = trimRemotePath(repoUrl.pathname);
    if (pathname === "") {
        // An empty path would end the prefix at the host with no trailing slash, so
        // it would also match `https://<host>.evil.com/...` and hand the token to a
        // different host. A repo URL with no path cannot identify a repo anyway.
        throw new Error("Repo-scoped git auth requires a repository path in --repo-url");
    }
    // Origin serves one repo at both `/git/<owner>/<repo>` and `/<owner>/<repo>`.
    // Anchor the token on the legacy path, the only shape the load balancer routes
    // today, and rewrite both shapes onto it so either remote authenticates.
    const originParts = parseOriginRepoCloneUrlParts(args.repoUrl);
    if (originParts !== undefined &&
        originParts.hostname.toLowerCase() === args.hostname.toLowerCase()) {
        const rootPathname = `/${originParts.owner}/${originParts.name}`;
        const legacyPathname = `/git${rootPathname}`;
        return {
            authenticatedPrefix: `https://${args.authScheme}:${args.accessToken}@${args.hostname}${legacyPathname}`,
            pathname: legacyPathname,
            insteadOfPathnames: [legacyPathname, rootPathname],
        };
    }
    return {
        // Use the normalized no-.git repo path as the prefix. Git's insteadOf
        // appends the unmatched suffix, so one rule covers repo, repo.git, and
        // repo.git/.
        //
        // A repo-scoped rule may coexist with a host-scoped one for the same host:
        // git prefers the longest match, and each refresh's cleanup pattern is
        // anchored to its own key, so neither clobbers the other. Cross-org GitHub
        // workspaces rely on that (host-scoped primary owner, repo-scoped for the
        // rest). The prefix is not path-bounded, so a same-host repo whose path
        // extends another's (`org/foo` vs `org/foobar`) matches the shorter rule and
        // is authenticated with a token not scoped to it, which fails the clone
        // rather than authenticating it as the wrong repo.
        authenticatedPrefix: `https://${args.authScheme}:${args.accessToken}@${args.hostname}${pathname}`,
        pathname,
        insteadOfPathnames: [pathname],
    };
}
export function getGitAuthRefreshScopeKey(hostname: string, repoUrl: string | undefined) {
    if (repoUrl === undefined) {
        return `host:${hostname}`;
    }
    // Repo-scoped refreshes for the same host must not collapse into one another:
    // GitLab project access tokens are valid for one repo, not the whole host.
    return `repo:${normalizeRepoUrlForAuthLookup(buildRepoUrlForAuthRefresh(repoUrl, hostname))}`;
}
// NOTE:
// currently this code is very much copied from contextProviders/git.ts
// in theory instead of doing this we could call into that code. but it relies on the vscode being alive which is an assumption i would prefer not to have to make
// instead we copy code here. perhaps a bad decision; we will see
/**
 * Service for handling Git operations
 */
export class GitService {
    ctx;
    constructor(ctx: Context) {
        this.ctx = ctx;
    }
    // Cache for ongoing getWorkspaceChangesHash request
    workspaceChangesHashPromises = new Map<string, Promise<string>>();
    submoduleCache: GitSubmodule[] | undefined;
    // Dedupe identical refreshes, but let a newer token for the same scope queue
    // behind the current write. Otherwise token rotation can lose the newer token.
    // The clone username is part of the identity: the same token applied under a
    // different scheme writes different config, and coalescing across schemes
    // would swallow a kill-switch revert (or a fix-enabling refresh) until the
    // next token rotation.
    refreshTokenPromisesByScope = new Map<string, { accessToken: string; cloneUsername?: string; promise: Promise<GitAuthRefreshResult> }>();
    refreshTokenQueue: Promise<void | GitAuthRefreshResult> = Promise.resolve();
    managedGitAuthScopes = new Map<string, GitAuthScope>();
    // Git version cache
    cachedGitVersion = new Map<string, { isInitialized: boolean; payload: GitVersion }>();
    async getGitVersion(cwd: string) {
        const cacheKey = cwd;
        if (this.cachedGitVersion.has(cacheKey)) {
            const res = this.cachedGitVersion.get(cacheKey);
            if (res?.payload === undefined) {
                throw new Error("Git version is undefined");
            }
            else {
                return res.payload;
            }
        }
        else {
            const version = await this.getGitVersionUncached(cwd);
            this.cachedGitVersion.set(cacheKey, {
                isInitialized: true,
                payload: version,
            });
            return version;
        }
    }
    async getGitVersionUncached(cwd: string) {
        try {
            logger.debug(this.ctx, "Getting git version", { cwd });
            const startTime = Date.now();
            const { stdout } = await spawnWorkload(execFileUtf8Async, "git", ["--version"], {
                cwd,
                encoding: "utf8",
                maxBuffer: 50 * 1024 * 1024,
            });
            logger.debug(this.ctx, "Got git version", {
                cwd,
                durationMs: Date.now() - startTime,
            });
            const match = stdout.trim().match(/git version (\d+)\.(\d+)\.(\d+)/);
            if (match) {
                return {
                    major: parseInt(match[1], 10),
                    minor: parseInt(match[2], 10),
                    patch: parseInt(match[3], 10),
                };
            }
        }
        catch (error) {
            logger.error(this.ctx, `Failed to get git version`, error, {
                cwd,
            });
        }
        // Default to a safe version if we can't determine it
        return { major: 2, minor: 9, patch: 0 };
    }
    supportsNoOptionalLocks(version: GitVersion) {
        // --no-optional-locks was introduced in git 2.15.2
        return (version.major > 2 ||
            (version.major === 2 && version.minor > 15) ||
            (version.major === 2 && version.minor === 15 && version.patch >= 2));
    }
    /**
     * Check if a ref looks like a remote ref (e.g., origin/main, upstream/develop)
     */
    isRemoteRef(ref: string) {
        return /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_/-]+$/.test(ref);
    }
    isCommitHash(ref: string) {
        return /^[a-f0-9]{40}$/.test(ref);
    }
    async getSubmodulesPotentiallyCached(rootPath: string) {
        if (this.submoduleCache) {
            return this.submoduleCache;
        }
        logger.debug(this.ctx, "Getting submodule status", { rootPath });
        const startTime = Date.now();
        const { stdout } = await spawnWorkload(execFileUtf8Async, "git", ["submodule", "status"], {
            cwd: rootPath,
            encoding: "utf8",
            maxBuffer: 50 * 1024 * 1024,
        });
        logger.debug(this.ctx, "Got submodule status", {
            rootPath,
            durationMs: Date.now() - startTime,
        });
        const submodules = stdout
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .map((line) => {
            const match = line.trim().match(/^[\s+-]?([a-f0-9]+)\s+(.+?)(?:\s+\(.+\))?$/);
            if (!match)
                return null;
            const commit = match[1];
            const p = match[2];
            const absPath = nodePath.join(rootPath, p);
            return {
                path: p,
                absPath,
                currentRef: commit,
            };
        })
            .filter((item) => item !== null);
        this.submoduleCache = submodules;
        return submodules;
    }
    /**
     * TODO: we will remove this and compute a hash from the diffs themselves.
     * Lightweight hash of workspace state. This is intentionally cheap: we only look at the list
     * of changed files (tracked, staged, untracked) plus HEAD commit and submodule heads.
     */
    async getWorkspaceChangesHash(rootPath: string, baseRef: string) {
        const existingPromise = this.workspaceChangesHashPromises.get(rootPath);
        if (existingPromise) {
            logger.debug(this.ctx, "Returning cached workspace changes hash promise", { rootPath });
            return existingPromise;
        }
        logger.debug(this.ctx, "Computing workspace changes hash", { rootPath });
        const startTime = Date.now();
        const promise = (async () => {
            // Get git version once at the start
            const gitVersion = await this.getGitVersion(rootPath);
            const useNoOptionalLocks = this.supportsNoOptionalLocks(gitVersion);
            // Helper to run git commands and return stdout
            const runGit = async (args: string[], cwd: string) => {
                try {
                    const gitArgs: string[] = [];
                    if (useNoOptionalLocks) {
                        gitArgs.push("--no-optional-locks");
                    }
                    gitArgs.push(...args);
                    const { stdout } = await spawnWorkload(execFileUtf8Async, "git", gitArgs, {
                        cwd,
                        encoding: "utf8",
                        maxBuffer: 50 * 1024 * 1024,
                    });
                    return stdout.trim();
                }
                catch (_e) {
                    // Best effort – if command fails, treat as empty so that hash still works.
                    return "";
                }
            };
            let hash = "";
            const headCommit = await runGit(["rev-parse", "HEAD"], rootPath);
            const status = await runGit(["status", "--porcelain"], rootPath);
            hash += headCommit;
            hash += status;
            if (baseRef.length > 0 && !this.isCommitHash(baseRef)) {
                try {
                    const baseCommit = await runGit(["rev-parse", baseRef], rootPath);
                    hash += baseCommit;
                }
                catch (e) {
                    logger.error(this.ctx, `Failed to parse ${baseRef}`, e, {
                        rootPath,
                        baseRef,
                    });
                }
            }
            const submodules = await this.getSubmodulesPotentiallyCached(rootPath);
            for (const submodule of submodules) {
                const submoduleHeadCommit = await runGit(["rev-parse", "HEAD"], submodule.absPath);
                const submoduleStatus = await runGit(["status", "--porcelain"], submodule.absPath);
                hash += submoduleHeadCommit;
                hash += submoduleStatus;
            }
            // do a super cheap hash (djb2 variant)
            let cheapHash = 5381;
            for (let i = 0; i < hash.length; i++) {
                cheapHash = (cheapHash << 5) + cheapHash + hash.charCodeAt(i); // cheapHash * 33 + char
                cheapHash = cheapHash & 0xffffffff; // force to 32 bits
            }
            hash = cheapHash.toString(16);
            return hash;
        })();
        this.workspaceChangesHashPromises.set(rootPath, promise);
        try {
            return await promise;
        }
        finally {
            logger.debug(this.ctx, "Workspace changes hash computation completed", {
                rootPath,
                durationMs: Date.now() - startTime,
            });
            this.workspaceChangesHashPromises.delete(rootPath);
        }
    }
    async getGitRoot(cwd: string) {
        const output = await this.executeGitCommandStable(cwd, ["rev-parse", "--show-toplevel"]);
        return output.trim();
    }
    async resolveDiffRevisions(rootPath: string, options: Pick<GitDiffRequest, "baseRef" | "ref" | "mergeBase">) {
        const gitVersion = await this.getGitVersion(rootPath);
        const useNoOptionalLocks = this.supportsNoOptionalLocks(gitVersion);
        const revParse = async (rev: string) => (await this.executeGitCommandStable(rootPath, ["rev-parse", "--verify", `${rev}^{commit}`], {
            useNoOptionalLocks,
        })).trim();
        // Same base/head selection as getBranchDiffRaw in getDiff.
        const base = options.baseRef.length > 0 ? options.baseRef : await this.getDefaultBranch({ cwd: rootPath });
        const head = options.ref.length > 0 ? options.ref : "HEAD";
        const baseSha = options.mergeBase
            ? (await this.executeGitCommandStable(rootPath, ["merge-base", base, head], {
                useNoOptionalLocks,
            })).trim()
            : await revParse(base);
        const headSha = await revParse(head);
        if (options.ref.length > 0) {
            return { baseSha, headSha };
        }
        return {
            baseSha,
            headSha,
            workspaceHash: await this.getWorkspaceChangesHash(rootPath, base),
        };
    }
    async getDiff(rootPath: string, request: GitDiffRequest): Promise<aiserver_v1_GetDiffResponse> {
        // Check git version once at the start to determine if --no-optional-locks is supported.
        // This prevents lock contention when multiple getDiff calls run in parallel.
        const gitVersion = await this.getGitVersion(rootPath);
        const useNoOptionalLocks = this.supportsNoOptionalLocks(gitVersion);
        logger.debug(this.ctx, "Getting diff", {
            cwd: rootPath,
            baseRef: request.baseRef,
            ref: request.ref,
            format: request.outputFormat,
            useNoOptionalLocks,
        });
        const startTime = Date.now();
        const format = (() => {
            switch (request.outputFormat) {
                case GetDiffRequest_OutputFormat.NAME_STATUS:
                    return GetDiffRequest_OutputFormat.NAME_STATUS;
                case GetDiffRequest_OutputFormat.NAME_STATUS_AND_NUMSTAT:
                    return GetDiffRequest_OutputFormat.NAME_STATUS_AND_NUMSTAT;
                case GetDiffRequest_OutputFormat.FILE_DIFFS:
                    return GetDiffRequest_OutputFormat.FILE_DIFFS;
                case GetDiffRequest_OutputFormat.DIFFS_WITH_BEFORE_AND_AFTER:
                    return GetDiffRequest_OutputFormat.DIFFS_WITH_BEFORE_AND_AFTER;
                default:
                    return GetDiffRequest_OutputFormat.FILE_DIFFS;
            }
        })();
        const submoduleDiffs: MessageInit<aiserver_v1_GetDiffResponse_SubmoduleDiff>[] = [];
        if (request.submoduleRecurseDepth > 0) {
            const submodules = await this.getSubmodules(rootPath);
            const res = await Promise.allSettled(submodules.map(async (submodule) => {
                // Check if submodule is initialized by trying to get its git root
                const submodulePath = nodePath.join(rootPath, submodule);
                const root = await this.getGitRoot(submodulePath);
                if (root !== submodulePath) {
                    // not initialized, we should throw!
                    throw new Error(`Submodule ${submodule} is not initialized. Please initialize it first.`);
                }
                const d = await this.getDiff(submodulePath, {
                    ...request,
                    // for submodules, we base ref to HEAD
                    baseRef: "HEAD",
                    targetPaths: request.targetPaths.map((p) => nodePath.relative(submodule, p)),
                    submoduleRecurseDepth: request.submoduleRecurseDepth - 1,
                });
                return {
                    relativePath: submodule,
                    diff: d,
                };
            }));
            for (let i = 0; i < res.length; i++) {
                const submoduleDiff = res[i];
                if (submoduleDiff.status === "fulfilled") {
                    const d = submoduleDiff.value;
                    submoduleDiffs.push(...d.diff.submoduleDiffs.map((innerD) => ({
                        relativePath: nodePath.join(d.relativePath, innerD.relativePath),
                        diff: innerD.diff,
                        errored: false,
                    })));
                    submoduleDiffs.push({
                        relativePath: d.relativePath,
                        diff: d.diff.diff,
                        errored: false,
                    });
                }
                else {
                    submoduleDiffs.push({
                        relativePath: nodePath.join(rootPath, submodules[i]),
                        diff: new GitDiff(),
                        errored: true,
                    });
                }
            }
        }
        if (format === GetDiffRequest_OutputFormat.DIFFS_WITH_BEFORE_AND_AFTER &&
            (request.maxFilesWithContents !== undefined || request.maxContentBytes !== undefined) &&
            request.ref.length > 0) {
            const namesOnly = await this.listChangedFilesIfOverCap(rootPath, request, useNoOptionalLocks);
            if (namesOnly !== undefined) {
                logger.debug(this.ctx, "Diff over the contents cap; names and numstat only", {
                    cwd: rootPath,
                    durationMs: Date.now() - startTime,
                    numDiffs: namesOnly.diffs.length,
                    maxFilesWithContents: request.maxFilesWithContents,
                    maxContentBytes: request.maxContentBytes,
                });
                return new GetDiffResponse({ diff: namesOnly, submoduleDiffs });
            }
        }
        const getBranchDiffRaw = async () => {
            let base = request.baseRef.length > 0
                ? request.baseRef
                : await this.getDefaultBranch({ cwd: rootPath });
            if (request.mergeBase) {
                base = (await this.executeGitCommandStable(rootPath, ["merge-base", base, request.ref.length > 0 ? request.ref : "HEAD"], { useNoOptionalLocks })).trim();
            }
            const opts = ["diff", "--no-color"];
            if (!request.includeSpaceChanges) {
                opts.push("--ignore-space-change");
            }
            if (request.unifiedContextLines !== undefined) {
                opts.push(`-U${request.unifiedContextLines}`);
            }
            opts.push(base);
            if (request.ref.length > 0) {
                opts.push(request.ref);
            }
            if (request.targetPaths.length > 0) {
                opts.push("--"); // Add separator before the target path
                opts.push(...request.targetPaths);
            }
            return this.executeGitCommandStable(rootPath, opts, {
                shouldNotTrimOutput: true,
                useNoOptionalLocks,
            });
        };
        const getUntrackedFiles = async () => {
            const untrackedFilesOut = await this.executeGitCommandStable(rootPath, ["ls-files", "--others", "--exclude-standard"], { useNoOptionalLocks });
            let untrackedFiles = untrackedFilesOut.split("\n").filter((file) => file.trim());
            if (untrackedFiles.length > request.maxUntrackedFiles) {
                untrackedFiles = untrackedFiles.slice(0, request.maxUntrackedFiles);
            }
            return Promise.all(untrackedFiles.map(async (file) => {
                try {
                    const filePath = file.trim();
                    const content = await nodeFsPromises.readFile(nodePath.join(rootPath, filePath), "utf8");
                    return {
                        contents: content,
                        path: filePath,
                    };
                }
                catch (_e) {
                    return undefined;
                }
            })).then((files) => files.filter((file) => file !== undefined));
        };
        const diffRaw = await getBranchDiffRaw();
        const diff = parseGitDiff(diffRaw);
        let untrackedFilesForPatchId: GitUntrackedFile[] = [];
        if (request.maxUntrackedFiles > 0) {
            const untrackedFiles = await getUntrackedFiles();
            untrackedFilesForPatchId = untrackedFiles;
            for (const untrackedFile of untrackedFiles) {
                // exit code is 1 for untracked files, so we ignore errors
                const untrackedDiffRaw = await this.executeGitCommandStable(rootPath, ["diff", "--no-color", "--no-index", "/dev/null", untrackedFile.path], { ignoreErrors: true, useNoOptionalLocks });
                const untrackedDiff = parseGitDiff(untrackedDiffRaw);
                diff.diffs.push(...untrackedDiff.diffs);
            }
        }
        // right now, we don't actually call the real name status and numstat, even though we should
        // please someone who wants to spend a lot of time testing do this!
        if (format !== GetDiffRequest_OutputFormat.FILE_DIFFS) {
            for (const fileDiff of diff.diffs) {
                fileDiff.chunks = [];
            }
        }
        diff.diffs = diff.diffs.filter((d) => !submoduleDiffs.some((s) => s.relativePath === d.to));
        // Populate before and after file contents when requested
        if (format === GetDiffRequest_OutputFormat.DIFFS_WITH_BEFORE_AND_AFTER) {
            // Determine the actual base ref to use
            let base = request.baseRef.length > 0
                ? request.baseRef
                : await this.getDefaultBranch({ cwd: rootPath });
            if (request.mergeBase) {
                base = (await this.executeGitCommandStable(rootPath, ["merge-base", base, request.ref.length > 0 ? request.ref : "HEAD"], { useNoOptionalLocks })).trim();
            }
            const targetRef = request.ref.length > 0 ? request.ref : "HEAD";
            const populatedWithCatFile = request.useCatFileBatch === true && request.ref.length > 0
                ? await this.populateFileContentsWithCatFileBatch(rootPath, diff.diffs, {
                    base,
                    targetRef,
                    useNoOptionalLocks,
                })
                : false;
            // Nothing left to read per file once the batch reader filled them.
            const diffsForGitShow = populatedWithCatFile ? [] : diff.diffs;
            // Populate before and after contents for each file
            await Promise.all(diffsForGitShow.map(async (fileDiff) => {
                try {
                    // Get before file contents
                    if (fileDiff.from !== "/dev/null") {
                        try {
                            const beforeContents = await this.executeGitCommandStable(rootPath, ["show", `${base}:${fileDiff.from}`], { shouldNotTrimOutput: true, useNoOptionalLocks });
                            fileDiff.beforeFileContents = beforeContents;
                        }
                        catch (_e) {
                            // File might not exist in base ref, that's okay
                            fileDiff.beforeFileContents = "";
                        }
                    }
                    else {
                        // New file
                        fileDiff.beforeFileContents = "";
                    }
                    // Get after file contents
                    if (fileDiff.to !== "/dev/null") {
                        if (request.ref.length > 0) {
                            // When diffing against a specific ref, read from that ref to
                            // avoid leaking working directory changes in after_file_contents.
                            try {
                                const afterContents = await this.executeGitCommandStable(rootPath, ["show", `${targetRef}:${fileDiff.to}`], { shouldNotTrimOutput: true, useNoOptionalLocks });
                                fileDiff.afterFileContents = afterContents;
                            }
                            catch (_e) {
                                // File doesn't exist at targetRef
                                fileDiff.afterFileContents = "";
                            }
                        }
                        else {
                            // Working tree diff: read from the current file system first
                            try {
                                const filePath = nodePath.join(rootPath, fileDiff.to);
                                const content = await nodeFsPromises.readFile(filePath, "utf8");
                                fileDiff.afterFileContents = content;
                            }
                            catch (_e) {
                                // Fallback to git show (file might be staged but not on disk)
                                try {
                                    const afterContents = await this.executeGitCommandStable(rootPath, ["show", `${targetRef}:${fileDiff.to}`], { shouldNotTrimOutput: true, useNoOptionalLocks });
                                    fileDiff.afterFileContents = afterContents;
                                }
                                catch (_gitShowError) {
                                    fileDiff.afterFileContents = "";
                                }
                            }
                        }
                    }
                    else {
                        // Deleted file
                        fileDiff.afterFileContents = "";
                    }
                }
                catch (error) {
                    logger.error(this.ctx, `Error fetching file contents for ${fileDiff.to}:`, error, {
                        fileDiff,
                    });
                    // Continue without setting the contents
                }
            }));
        }
        // Check which files are generated using GitHub's exact detection logic:
        // 1. .gitattributes linguist-generated attribute (highest priority)
        // 2. Path-based heuristics (lock files, vendor directories, etc.)
        // 3. Content-based heuristics (minified files, generated code markers, etc.)
        const allFilePaths = diff.diffs
            .map((d) => (d.to !== "/dev/null" ? d.to : d.from))
            .filter((p) => p !== undefined);
        const refForContent = request.ref.length > 0 ? request.ref : "HEAD";
        // Build a map from file path to fileDiff for quick lookup
        const fileDiffMap = new Map<string, aiserver_v1_FileDiff>();
        for (const fileDiff of diff.diffs) {
            const filePath = fileDiff.to !== "/dev/null" ? fileDiff.to : fileDiff.from;
            if (filePath) {
                fileDiffMap.set(filePath, fileDiff);
            }
        }
        const generatedResults = await checkFilesGenerated({
            repoRoot: rootPath,
            filePaths: allFilePaths,
            getContent: async (filePath) => {
                const fileDiff = fileDiffMap.get(filePath);
                if (!fileDiff) {
                    return undefined;
                }
                try {
                    // If we already have the content from earlier fetch, use it
                    if (fileDiff.afterFileContents !== undefined) {
                        return fileDiff.afterFileContents;
                    }
                    // Otherwise fetch it from git
                    if (fileDiff.to && fileDiff.to !== "/dev/null") {
                        return await this.executeGitCommandStable(rootPath, ["show", `${refForContent}:${fileDiff.to}`], { shouldNotTrimOutput: true, useNoOptionalLocks });
                    }
                }
                catch {
                    // File might not exist in git yet (untracked) or other error
                }
                return undefined;
            },
        });
        // Apply the results to the file diffs
        let numGeneratedFiles = 0;
        for (const [filePath, result] of generatedResults) {
            const fileDiff = fileDiffMap.get(filePath);
            if (fileDiff) {
                fileDiff.isGenerated = result.isGenerated;
                if (result.isGenerated) {
                    numGeneratedFiles++;
                }
            }
        }
        const patchId = request.computePatchId === true
            ? await this.computeStablePatchId(rootPath, {
                useNoOptionalLocks,
                diff: appendDiffForPatchId(diffRaw, serializeUntrackedFilesForPatchId(untrackedFilesForPatchId)),
            })
            : undefined;
        const headSha = request.returnHeadSha === true
            ? (await this.executeGitCommandStable(rootPath, ["rev-parse", "HEAD"], {
                useNoOptionalLocks,
            })).trim()
            : undefined;
        const hasUncommittedChanges = request.returnHeadSha === true
            ? (await this.executeGitCommandStable(rootPath, ["status", "--porcelain=v1", "--untracked-files=all"], { useNoOptionalLocks })).trim().length > 0
            : undefined;
        const response = new GetDiffResponse({
            diff: diff,
            submoduleDiffs: submoduleDiffs,
            patchId,
            headSha,
            hasUncommittedChanges,
        });
        logger.debug(this.ctx, "Diff computation completed", {
            cwd: rootPath,
            durationMs: Date.now() - startTime,
            numDiffs: diff?.diffs.length ?? 0,
            numSubmoduleDiffs: submoduleDiffs.length,
            numGeneratedFiles,
        });
        return response;
    }
    cachedDefaultBranch = new Map<string, { isInitialized: boolean; payload: string }>();
    async getDefaultBranch(options: { cwd: string; withoutOrigin?: boolean }) {
        // TODO: probably need to cache by the root CWD
        // so first translate cwd -> root cwd, then go root cwd -> default branch
        const cwd = options.cwd;
        const cacheKey = options.withoutOrigin ? `${cwd}-without-origin` : cwd;
        if (this.cachedDefaultBranch.has(cacheKey)) {
            const res = this.cachedDefaultBranch.get(cacheKey);
            if (res?.payload === undefined) {
                throw new Error("Default branch is undefined");
            }
            else {
                return res.payload;
            }
        }
        else {
            let defaultBranch = await this.getDefaultBranchUncached(options);
            if (options?.withoutOrigin) {
                defaultBranch = defaultBranch.replace(/^origin\//, "");
            }
            this.cachedDefaultBranch.set(cacheKey, {
                isInitialized: true,
                payload: defaultBranch,
            });
            return defaultBranch;
        }
    }
    async getDefaultBranchUncached(options: { cwd: string; withoutOrigin?: boolean }) {
        const cwd = options.cwd;
        let defaultBranch: string | undefined;
        // Method 0: Check the symbolic ref
        if (!defaultBranch) {
            try {
                defaultBranch = await this.executeGitCommandStable(cwd, [
                    "symbolic-ref",
                    "--short",
                    "refs/remotes/origin/HEAD",
                ]);
                if (defaultBranch)
                    return defaultBranch.trim();
            }
            catch (error) {
                logger.error(this.ctx, "failed to get symbolic ref", error);
                // if this fails, continue to the next method
            }
        }
        const commonDefaultBranches = ["main", "master", "develop"];
        // Method 1: Read from .git/HEAD
        // this is bad, I think just always says what branch you're on?
        try {
            const headFilePath = nodePath.join(cwd, ".git", "HEAD");
            const headContent = await nodeFsPromises.readFile(headFilePath, "utf8");
            const match = headContent.trim().match(/^ref: refs\/heads\/(.*)$/);
            const branchName = match?.[1]?.trim();
            if (branchName && commonDefaultBranches.includes(branchName)) {
                const commonDefaultBranch = `origin/${branchName}`;
                // check if the branch exists
                try {
                    await this.executeGitCommandStable(cwd, ["rev-parse", "--verify", commonDefaultBranch]);
                    defaultBranch = commonDefaultBranch;
                    logger.debug(this.ctx, `Picked default branch from method 1.`, {});
                    return defaultBranch.trim();
                }
                catch {
                    // branch doesn't exist, try the next one
                }
            }
        }
        catch (error) {
            logger.error(this.ctx, "failed to read .git/HEAD", error);
            // if this fails, continue to the next method
        }
        // Method 2: Check for common default branch names
        for (const branch of commonDefaultBranches) {
            try {
                const branchName = `origin/${branch}`;
                await this.executeGitCommandStable(cwd, [`rev-parse`, `--verify`, branchName]);
                defaultBranch = branchName;
                return defaultBranch.trim();
            }
            catch {
                // branch doesn't exist, try the next one
            }
        }
        // Method 3: Get the first branch from remote
        try {
            const branches = await this.executeGitCommandStable(cwd, ["branch", "-r"]);
            // find the first starting with origin
            const firstOriginBranch = branches.split("\n").find((branch) => branch.startsWith("origin/"));
            if (firstOriginBranch) {
                defaultBranch = firstOriginBranch;
                return defaultBranch.trim();
            }
        }
        catch (error) {
            logger.error(this.ctx, "failed to get branches from remote", error);
        }
        // Method 4: Get git config --get init.defaultBranch
        try {
            const defaultBranch = await this.executeGitCommandStable(cwd, [
                "config",
                "--get",
                "init.defaultBranch",
            ]);
            if (defaultBranch)
                return defaultBranch.trim();
        }
        catch (error) {
            logger.error(this.ctx, "failed to get default branch from git config", error);
        }
        throw new Error("Could not determine default branch");
    }
    // Helper methods for getDiff
    async executeGitCommandStable(cwd: string, args: string[], options: GitCommandOptions = {}) {
        // Prepend --no-optional-locks if requested to prevent lock contention
        // when running multiple git commands in parallel
        const finalArgs = options.useNoOptionalLocks === true ? ["--no-optional-locks", ...args] : args;
        logger.debug(this.ctx, "Executing git command", {
            cwd,
            args: finalArgs.join(" "),
        });
        const startTime = Date.now();
        // Use spawn to avoid shell interpretation of special characters in file paths
        // (e.g., [, ], (, ), @, etc. would be interpreted by a shell).
        // The signal is forwarded to spawn so abort kills the child (default SIGTERM),
        // which is required for callers wrapping this in a timeout to avoid orphaned
        // git processes holding .git locks.
        const result = await new Promise<string>((resolve, reject) => {
            const gitProcess = spawnWorkload(spawnWithPipedStdio, "git", finalArgs, {
                cwd,
                signal: options.signal,
            });
            let stdout = "";
            let stderr = "";
            gitProcess.stdout.on("data", (data: Buffer) => {
                stdout += data.toString();
            });
            gitProcess.stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
            });
            gitProcess.on("close", (code) => {
                if (code === 0 || options.ignoreErrors) {
                    // When ignoreErrors is true, return stdout even if command failed
                    // This is needed for commands like `git diff --no-index` which returns
                    // exit code 1 when there are differences (expected for untracked files)
                    resolve(stdout);
                }
                else if (options.signal?.aborted === true) {
                    reject(new Error("Timed out"));
                }
                else {
                    reject(new Error(`Git command failed with code ${code}: ${stderr}`));
                }
            });
            gitProcess.on("error", (error) => {
                if (options.ignoreErrors) {
                    resolve(stdout);
                }
                else if (error.name === "AbortError") {
                    reject(new Error("Timed out"));
                }
                else {
                    reject(error);
                }
            });
        });
        logger.debug(this.ctx, "Git command completed", {
            cwd,
            args: args.join(" "),
            durationMs: Date.now() - startTime,
        });
        if (!options.shouldNotTrimOutput) {
            return result.trim();
        }
        else {
            return result;
        }
    }
    /**
     * Two cheap `git diff` runs (`--raw`, then `--numstat`) in place of the
     * patch and every content read when the change count exceeds
     * `maxFilesWithContents` or the changed blobs total more than
     * `maxContentBytes`. Returns undefined when neither is exceeded, and the
     * normal path runs.
     *
     * Blob sizes come from `cat-file --batch-check` on the ids the raw listing
     * already names, so sizing resolves no paths and reads no contents. Under a
     * byte cap both runs also skip rename detection, which reads every candidate
     * pair, and numstat counts files too large for the budget as binary, so the
     * answer reads at most `maxContentBytes` however large the diff is.
     */
    async listChangedFilesIfOverCap(rootPath: string, request: GitDiffRequest, useNoOptionalLocks: boolean) {
        const { maxFilesWithContents, maxContentBytes } = request;
        const { baseSha, headSha } = await this.resolveDiffRevisions(rootPath, request);
        const diffArgs = (mode: string) => [
            "diff",
            mode,
            "-z",
            ...(mode === "--raw" ? ["--no-abbrev"] : []),
            ...(maxContentBytes !== undefined ? ["--no-renames"] : []),
            ...(request.includeSpaceChanges ? [] : ["--ignore-space-change"]),
            baseSha,
            headSha,
            ...(request.targetPaths.length > 0 ? ["--", ...request.targetPaths] : []),
        ];
        const entries = parseRawDiffZ(await this.executeGitCommandStable(rootPath, diffArgs("--raw"), {
            shouldNotTrimOutput: true,
            useNoOptionalLocks,
        }));
        let blobBytes: Map<string, number> | undefined;
        if (maxContentBytes !== undefined) {
            try {
                blobBytes = await this.readBlobSizes(rootPath, entries, useNoOptionalLocks);
            }
            catch (error) {
                logger.warn(this.ctx, "cat-file --batch-check failed; diffing without the byte cap", {
                    cwd: rootPath,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        const bytesOf = (blob: string | undefined) => blob === undefined ? 0 : (blobBytes?.get(blob) ?? 0);
        const overFileCap = maxFilesWithContents !== undefined && entries.length > maxFilesWithContents;
        const overByteCap = maxContentBytes !== undefined &&
            blobBytes !== undefined &&
            entries.reduce((sum, entry) => sum + bytesOf(entry.fromBlob) + bytesOf(entry.toBlob), 0) >
                maxContentBytes;
        if (!overFileCap && !overByteCap) {
            return undefined;
        }
        const numstatArgs = diffArgs("--numstat");
        if (maxContentBytes !== undefined && blobBytes !== undefined) {
            const bigFileThreshold = numstatBigFileThreshold(entries.map((entry) => ({
                fromBytes: bytesOf(entry.fromBlob),
                toBytes: bytesOf(entry.toBlob),
            })), maxContentBytes);
            numstatArgs.unshift("-c", `core.bigFileThreshold=${bigFileThreshold}`);
        }
        const counts = parseNumstatZ(await this.executeGitCommandStable(rootPath, numstatArgs, {
            shouldNotTrimOutput: true,
            useNoOptionalLocks,
        }));
        return new GitDiff({
            diffs: entries.map((entry) => {
                const numstat = counts.get(entry.to !== "/dev/null" ? entry.to : entry.from);
                return new FileDiff({
                    from: entry.from,
                    to: entry.to,
                    added: numstat?.added ?? 0,
                    removed: numstat?.removed ?? 0,
                });
            }),
            diffType: GitDiff_DiffType.UNSPECIFIED,
            fileContentsOmitted: true,
        });
    }
    /**
     * Sizes of the blobs the entries name, by id, read from object headers
     * alone. Rejects unless every blob is sized, so a missing object cannot
     * pass for zero bytes.
     */
    async readBlobSizes(cwd: string, entries: ReturnType<typeof parseRawDiffZ>, useNoOptionalLocks: boolean): Promise<Map<string, number>> {
        const ids = [
            ...new Set<string>(entries.flatMap((entry) => [entry.fromBlob, entry.toBlob].filter((id) => id !== undefined))),
        ];
        if (ids.length === 0) {
            return new Map<string, number>();
        }
        const args = useNoOptionalLocks
            ? ["--no-optional-locks", "cat-file", "--batch-check"]
            : ["cat-file", "--batch-check"];
        return new Promise<Map<string, number>>((resolve, reject) => {
            const gitProcess = spawnWorkload(spawnWithPipedStdio, "git", args, { cwd });
            let stdout = "";
            let stderr = "";
            gitProcess.stdout.on("data", (data: Buffer) => {
                stdout += data.toString();
            });
            gitProcess.stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
            });
            // If git dies before draining stdin the write fails with EPIPE; the
            // close handler already reports the exit code.
            gitProcess.stdin.on("error", () => { });
            gitProcess.on("error", reject);
            gitProcess.on("close", (code) => {
                const sizes = code === 0 ? parseCatFileBatchCheck(stdout) : undefined;
                if (sizes === undefined) {
                    reject(new Error(`git cat-file --batch-check failed with code ${code}: ${stderr}`));
                }
                else if (sizes.size < ids.length) {
                    reject(new Error(`git cat-file --batch-check sized ${sizes.size} of ${ids.length} blobs`));
                }
                else {
                    resolve(sizes);
                }
            });
            gitProcess.stdin.end(`${ids.join("\n")}\n`);
        });
    }
    /**
     * Fills before/after contents for a committed-ref diff with one
     * `git cat-file --batch` process. Returns false, leaving the diffs
     * untouched, when the batch cannot be used or fails; the caller then runs
     * the per-file `git show` path. Both paths read raw blobs: `git show
     * <rev>:<path>` applies textconv only with an explicit `--textconv`, and
     * plain `cat-file --batch` never does.
     */
    async populateFileContentsWithCatFileBatch(rootPath: string, diffs: aiserver_v1_FileDiff[], options: { base: string; targetRef: string; useNoOptionalLocks: boolean }) {
        const specs: string[] = [];
        const specIndex = new Map<string, number>();
        const requestSpec = (rev: string, filePath: string) => {
            if (filePath === "/dev/null") {
                return undefined;
            }
            const spec = `${rev}:${filePath}`;
            if (!specIndex.has(spec)) {
                specIndex.set(spec, specs.length);
                specs.push(spec);
            }
            return spec;
        };
        const wanted = diffs.map((fileDiff) => ({
            fileDiff,
            before: requestSpec(options.base, fileDiff.from),
            after: requestSpec(options.targetRef, fileDiff.to),
        }));
        // One spec per input line, so a path containing a newline cannot be asked for.
        if (specs.some((spec) => spec.includes("\n"))) {
            return false;
        }
        const startTime = Date.now();
        let contents: (string | undefined)[];
        try {
            contents =
                specs.length === 0
                    ? []
                    : await this.readBlobsWithCatFileBatch(rootPath, specs, options.useNoOptionalLocks);
        }
        catch (error) {
            logger.warn(this.ctx, "cat-file --batch read failed; falling back to per-file git show", {
                cwd: rootPath,
                specCount: specs.length,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
        // A missing object yields "" exactly like the failed `git show` did.
        // Every defined spec was inserted into specIndex by requestSpec above.
        const contentFor = (spec: string | undefined) => spec === undefined ? "" : (contents[specIndex.get(spec)!] ?? "");
        for (const { fileDiff, before, after } of wanted) {
            fileDiff.beforeFileContents = contentFor(before);
            fileDiff.afterFileContents = contentFor(after);
        }
        logger.debug(this.ctx, "Read diff contents with cat-file --batch", {
            cwd: rootPath,
            specCount: specs.length,
            durationMs: Date.now() - startTime,
        });
        return true;
    }
    readBlobsWithCatFileBatch(cwd: string, specs: string[], useNoOptionalLocks: boolean): Promise<(string | undefined)[]> {
        const args = useNoOptionalLocks
            ? ["--no-optional-locks", "cat-file", "--batch"]
            : ["cat-file", "--batch"];
        return new Promise<(string | undefined)[]>((resolve, reject) => {
            const parser = new CatFileBatchOutputParser(specs.length);
            const gitProcess = spawnWorkload(spawnWithPipedStdio, "git", args, {
                cwd,
            });
            let stderr = "";
            let parseError: unknown;
            gitProcess.stdout.on("data", (data: Buffer) => {
                if (parseError !== undefined) {
                    return;
                }
                try {
                    parser.push(data);
                }
                catch (error) {
                    parseError = error;
                    gitProcess.kill();
                }
            });
            gitProcess.stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
            });
            // If git dies before draining stdin the write fails with EPIPE; the
            // close handler already reports the exit code.
            gitProcess.stdin.on("error", () => { });
            gitProcess.on("error", reject);
            gitProcess.on("close", (code) => {
                if (parseError !== undefined) {
                    reject(parseError);
                }
                else if (code !== 0) {
                    reject(new Error(`git cat-file --batch failed with code ${code}: ${stderr}`));
                }
                else {
                    try {
                        resolve(parser.finish());
                    }
                    catch (error) {
                        reject(error);
                    }
                }
            });
            gitProcess.stdin.end(`${specs.join("\n")}\n`);
        });
    }
    async computeStablePatchId(cwd: string, options: { diff: string; useNoOptionalLocks: boolean }) {
        if (options.diff.length === 0) {
            return undefined;
        }
        const finalArgs = options.useNoOptionalLocks === true
            ? ["--no-optional-locks", "patch-id", "--stable"]
            : ["patch-id", "--stable"];
        const output = await new Promise<string>((resolve, reject) => {
            const gitProcess = spawnWorkload(spawnWithPipedStdio, "git", finalArgs, {
                cwd,
            });
            let stdout = "";
            let stderr = "";
            gitProcess.stdout.on("data", (data: Buffer) => {
                stdout += data.toString();
            });
            gitProcess.stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
            });
            gitProcess.on("close", (code) => {
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    reject(new Error(`git patch-id failed with code ${code}: ${stderr}`));
                }
            });
            gitProcess.on("error", reject);
            gitProcess.stdin.end(options.diff);
        });
        return output.trim().split(/\s+/)[0] || undefined;
    }
    async executeGitCommandStableWithArray(cwd: string, args: string[]) {
        // Use spawn to avoid shell interpretation of arguments
        return new Promise<string>((resolve, reject) => {
            const gitProcess = spawnWorkload(spawnWithPipedStdio, "git", args, {
                cwd,
            });
            let stdout = "";
            let stderr = "";
            gitProcess.stdout.on("data", (data: Buffer) => {
                stdout += data.toString();
            });
            gitProcess.stderr.on("data", (data: Buffer) => {
                stderr += data.toString();
            });
            gitProcess.on("close", (code) => {
                if (code === 0) {
                    resolve(stdout.trim());
                }
                else {
                    reject(new Error(`Git command failed with code ${code}: ${stderr}`));
                }
            });
            gitProcess.on("error", (error) => {
                reject(error);
            });
        });
    }
    async getSubmodules(cwd: string) {
        try {
            const { stdout } = await spawnWorkload(execFileUtf8Async, "git", ["config", "--file", ".gitmodules", "--get-regexp", "path"], { cwd, encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
            return stdout
                .split("\n")
                .map((line) => /^\S+\s+(.*)$/.exec(line.trim())?.[1])
                .filter((submodulePath): submodulePath is string => {
                return submodulePath !== undefined && submodulePath.length > 0;
            });
        }
        catch (error) {
            logger.error(this.ctx, "Error getting submodules", error);
            return [];
        }
    }
    async getGitFileBlameWithRelativePath(relativePath: string, rootPath: string, numCommits = 10) {
        try {
            logger.debug(this.ctx, "Getting git file blame", {
                relativePath,
                rootPath,
                numCommits,
            });
            const startTime = Date.now();
            // Use git log to get commit information for the specific file
            const args = [
                "log",
                `-n${numCommits}`,
                "--pretty=format:%H|%an|%ad|%s", // Hash|Author|Date|Subject
                "--date=iso",
                "--follow", // Follow file renames
                "--",
                relativePath,
            ];
            const output = await this.executeGitCommandStableWithArray(rootPath, args);
            if (!output.trim()) {
                return undefined;
            }
            const commits: { commit: string; author: string; date: string; message: string }[] = [];
            const lines = output.trim().split("\n");
            for (const line of lines) {
                if (!line.trim())
                    continue;
                const parts = line.split("|");
                if (parts.length >= 4) {
                    commits.push({
                        commit: parts[0].trim(),
                        author: parts[1].trim(),
                        date: parts[2].trim(),
                        message: parts.slice(3).join("|").trim(), // Rejoin in case message contains |
                    });
                }
            }
            const result = commits.length > 0 ? { commits } : undefined;
            logger.debug(this.ctx, "Git file blame completed", {
                relativePath,
                durationMs: Date.now() - startTime,
                numCommits: commits.length,
            });
            return result;
        }
        catch (error) {
            logger.error(this.ctx, `Failed to get git blame`, error, {
                relativePath,
            });
            return undefined;
        }
    }
    async getCommitInfo(rootPath: string, commitHash: string) {
        try {
            // Use git show to get commit information
            const output = await this.executeGitCommandStable(rootPath, [
                "show",
                "-m",
                '--format="%H|%an|%ad|%s"',
                "--date=iso",
                "--no-patch",
                commitHash,
            ]);
            if (!output.trim()) {
                return undefined;
            }
            const parts = output.trim().split("|");
            if (parts.length >= 4) {
                return {
                    commit: parts[0].trim(),
                    author: parts[1].trim(),
                    date: parts[2].trim(),
                    message: parts.slice(3).join("|").trim(),
                };
            }
        }
        catch (error) {
            logger.error(this.ctx, "Failed to get commit info", error, {
                commitHash,
            });
        }
        return undefined;
    }
    async getCommitChangedFiles(rootPath: string, commitHash: string) {
        try {
            // Use git diff-tree to get list of changed files
            const output = await this.executeGitCommandStable(rootPath, [
                "diff-tree",
                "--no-commit-id",
                "--name-only",
                "-r",
                commitHash,
            ]);
            return output.split("\n").filter((file) => file.trim().length > 0);
        }
        catch (error) {
            logger.error(this.ctx, "Failed to get commit changed files", error, {
                commitHash,
            });
            return [];
        }
    }
    async getCommitDiff(rootPath: string, commitHash: string, context = 3) {
        try {
            // Use git show to get the diff for a specific commit
            const output = await this.executeGitCommandStable(rootPath, ["show", "--no-merges", "--format=", `--unified=${context}`, commitHash], { shouldNotTrimOutput: true });
            return output;
        }
        catch (error) {
            logger.error(this.ctx, "Failed to get commit diff", error, {
                commitHash,
            });
            return "";
        }
    }
    async executeGitCommand(rootPath: string, args: string[], options?: GitCommandOptions) {
        return this.executeGitCommandStable(rootPath, args, options);
    }
    async refreshGithubAccessToken(accessToken: string, hostname: string, options: GitAuthRefreshOptions = {}) {
        const scopeKey = getGitAuthRefreshScopeKey(hostname, options.repoUrl);
        const existingRefresh = this.refreshTokenPromisesByScope.get(scopeKey);
        if (existingRefresh !== undefined &&
            existingRefresh.accessToken === accessToken &&
            existingRefresh.cloneUsername === options.cloneUsername) {
            return existingRefresh.promise;
        }
        const runRefresh = () => this.refreshGithubAccessTokenImpl(accessToken, hostname, options);
        const refreshPromise = this.refreshTokenQueue.then(runRefresh, runRefresh);
        this.refreshTokenQueue = refreshPromise.catch(() => { });
        this.refreshTokenPromisesByScope.set(scopeKey, {
            accessToken,
            cloneUsername: options.cloneUsername,
            promise: refreshPromise,
        });
        try {
            return await refreshPromise;
        }
        finally {
            if (this.refreshTokenPromisesByScope.get(scopeKey)?.promise === refreshPromise) {
                this.refreshTokenPromisesByScope.delete(scopeKey);
            }
        }
    }
    async removeGithubAccessToken() {
        const runRemoval = () => this.removeGithubAccessTokenImpl();
        const removalPromise = this.refreshTokenQueue.then(runRemoval, runRemoval);
        this.refreshTokenQueue = removalPromise.catch(() => { });
        try {
            await removalPromise;
        }
        catch {
            logger.warn(this.ctx, "Failed to remove GitHub access token state; continuing");
        }
    }
    async removeGithubAccessTokenImpl() {
        await removeManagedGitCredentials(this.ctx, {
            inMemoryScopes: [...this.managedGitAuthScopes.values()],
        });
        this.managedGitAuthScopes.clear();
    }
    async refreshGithubAccessTokenImpl(accessToken: string, hostname: string, options: GitAuthRefreshOptions = {}) {
        const verbose = options.verbose === true;
        const sanitizeForLogging = (value: unknown): unknown => {
            if (typeof value === "string") {
                return value.split(accessToken).join("[REDACTED_GIT_TOKEN]");
            }
            if (value instanceof Error) {
                return sanitizeForLogging(value.stack ?? value.message);
            }
            return value;
        };
        const logVerbose = (step: string, metadata?: LogMetadata) => {
            if (!verbose) {
                return;
            }
            logger.info(this.ctx, "refresh-git-token verbose", {
                step,
                hostname,
                ...metadata,
            });
        };
        const runStep = async <T>(step: string, fn: () => T | PromiseLike<T>, metadata?: LogMetadata): Promise<T> => {
            const startTime = Date.now();
            logVerbose(`${step}.started`, metadata);
            try {
                const result = await fn();
                logVerbose(`${step}.finished`, {
                    ...metadata,
                    duration_ms: Date.now() - startTime,
                });
                return result;
            }
            catch (error) {
                logVerbose(`${step}.failed`, {
                    ...metadata,
                    duration_ms: Date.now() - startTime,
                    error: sanitizeForLogging(error),
                });
                throw error;
            }
        };
        const requestedCloneUsername = options.cloneUsername;
        // Allowlist membership, not a charset check: the username lands in a URL
        // prefix and a git-config regexp, and only usernames with a redaction
        // spec (the source of KNOWN_GIT_CLONE_USERNAMES) may be written into git
        // config, or the paired token would not be redacted from transcripts.
        const requestedCloneUsernameIsValid = requestedCloneUsername !== undefined &&
            KNOWN_GIT_CLONE_USERNAMES.includes(requestedCloneUsername);
        const authScheme = requestedCloneUsernameIsValid ? requestedCloneUsername : "x-access-token";
        if (requestedCloneUsername !== undefined && !requestedCloneUsernameIsValid) {
            // Deliberately omit the rejected value: it is not a known username, so
            // treat it as potentially sensitive.
            logger.warn(this.ctx, "Rejected unknown clone username in git token refresh; falling back to x-access-token", { hostname });
        }
        let staleRewritesDisplaced = 0;
        let remotesNormalized = 0;
        const repoAuthConfig = options.repoUrl !== undefined
            ? getRepoScopedGitAuthConfig({
                repoUrl: options.repoUrl,
                hostname,
                authScheme,
                accessToken,
            })
            : undefined;
        this.managedGitAuthScopes.set(getGitAuthRefreshScopeKey(hostname, options.repoUrl), {
            hostname,
            pathname: repoAuthConfig?.pathname,
        });
        await runStep("record-managed-scope-marker", () => recordManagedGitAuthScopeMarker(this.ctx, {
            hostname,
            pathname: repoAuthConfig?.pathname,
        }));
        const authenticatedPrefix = repoAuthConfig?.authenticatedPrefix ?? `https://${authScheme}:${accessToken}@${hostname}/`;
        logVerbose("refresh.started", { authScheme });
        // First, get all existing token-based URL configurations
        staleRewritesDisplaced = await runStep("git-config-remove-existing-token-urls", () => removeTokenizedInsteadOfRewrites(this.ctx, {
            hostname,
            pathname: repoAuthConfig?.pathname,
        }), { authScheme });
        // Configure git to use the new token for all common URL variants.
        // Use the no-shell exec-file helper so URL-derived values like
        // authenticatedPrefix and the insteadOf paths cannot be reinterpreted as
        // shell metacharacters.
        const insteadOfKey = `url.${authenticatedPrefix}.insteadOf`;
        // One rule per clone spelling, for every path shape that must reach this
        // token. Git's insteadOf appends the unmatched suffix, so each entry also
        // covers the `.git` and `.git/` forms.
        const insteadOfRewrites = (repoAuthConfig?.insteadOfPathnames ?? ["/"]).flatMap((insteadOfPath) => {
            const scpPath = insteadOfPath.replace(/^\/+/, "");
            return [
                { variant: "https", url: `https://${hostname}${insteadOfPath}` },
                { variant: "scp", url: `git@${hostname}:${scpPath}` },
                { variant: "ssh", url: `ssh://git@${hostname}${insteadOfPath}` },
                {
                    variant: "git+ssh",
                    url: `git+ssh://git@${hostname}${insteadOfPath}`,
                },
                { variant: "ssh-22", url: `ssh://git@${hostname}:22${insteadOfPath}` },
                {
                    variant: "git+ssh-22",
                    url: `git+ssh://git@${hostname}:22${insteadOfPath}`,
                },
            ];
        });
        for (const [index, rewrite] of insteadOfRewrites.entries()) {
            const isFirstRewrite = index === 0;
            await runStep(isFirstRewrite ? "git-config-set-https-instead-of" : "git-config-add-instead-of", () => spawnWorkload(execFileAsync, "git", ["config", "--global", ...(isFirstRewrite ? [] : ["--add"]), insteadOfKey, rewrite.url], { maxBuffer: 50 * 1024 * 1024 }), { variant: rewrite.variant });
        }
        logger.debug(this.ctx, "Successfully refreshed access token in git config.", { hostname });
        await runStep("refresh-cached-git-auth-tokens", () => refreshCachedGitAuthTokens());
        // Preserve the legacy host-scoped gh bootstrap, but repo-scoped
        // refreshes must not clobber gh auth for a different primary repo.
        // Any requested non-GitHub username (valid or rejected) means the token
        // belongs to another provider and must not clobber gh's github.com slot.
        // The hostname must also be github.com: providers like Origin refresh with
        // the `x-access-token` username against their own host, and their token is
        // not a valid github.com credential.
        if (options.repoUrl === undefined &&
            isGhHostsYmlHostname(hostname) &&
            (requestedCloneUsername === undefined || requestedCloneUsername === "x-access-token")) {
            await runStep("write-gh-hosts-yml", () => this.writeGhHostsYml(accessToken));
        }
        // as a legacy measure, we remove all the old token-based auths. in theory this should be gone when we properly configure a global access token in the devcontainer cloning step. but for now we keep this here to make things work
        const remoteCleanupTargets = options.repoPaths !== undefined && options.repoPaths.length > 0
            ? [...new Set<string>(options.repoPaths)]
            : [undefined];
        for (const repoPath of remoteCleanupTargets) {
            const normalizedForPath = await runStep("remove-tokenized-remote-urls", () => this.removeTokenizedRemoteUrls(hostname, repoPath, {
                repoUrl: options.repoUrl,
            }), { repoPath });
            remotesNormalized += normalizedForPath;
        }
        logVerbose("refresh.finished");
        // Passive observability only: counts of work this refresh already did.
        // "Which scheme landed and did it displace the stale state" is the
        // signal CS-216 lacked; control.ts exports these as span attributes.
        return {
            appliedCloneUsername: authScheme,
            staleRewritesDisplaced,
            remotesNormalized,
        };
    }
    async removeTokenizedRemoteUrls(hostname: string, repoPath: string | undefined, options: { repoUrl?: string } = {}) {
        let stdout: string;
        try {
            const args = repoPath === undefined ? ["remote", "-v"] : ["-C", repoPath, "remote", "-v"];
            const result = await spawnWorkload(execFileUtf8Async, "git", args, {
                maxBuffer: 50 * 1024 * 1024,
            });
            stdout = result.stdout;
        }
        catch (error) {
            // Remote URL cleanup is a best-effort legacy migration. In multi-repo
            // Cloud Agents the daemon cwd is /agent, which is intentionally not a repo.
            logger.debug(this.ctx, "Skipping tokenized remote URL cleanup because git remotes could not be listed.", {
                repoPath,
                error: error instanceof Error ? error.message : String(error),
                hostname,
            });
            return 0;
        }
        const lines = stdout.split("\n").filter((line) => line.trim());
        // In repo-scoped mode, only normalize the matching workspace remote. A
        // tokenized remote for another GitLab repo must keep its own token until
        // that repo's refresh runs.
        const normalizedTargetRepoUrl = options.repoUrl !== undefined
            ? normalizeRepoUrlForAuthLookup(buildRepoUrlForAuthRefresh(options.repoUrl, hostname))
            : undefined;
        // `git remote -v` lists fetch and push lines per remote; count each
        // remote once.
        const normalizedRemoteNames = new Set<string>();
        for (const line of lines) {
            const [remoteName, url] = line.split(/\s+/);
            if (!url)
                continue;
            const isHttpRemote = /^https?:\/\//i.test(url);
            const hasKnownAuthMarker = url.includes("x-access-token") || url.includes("oauth2");
            if (!isHttpRemote && !hasKnownAuthMarker) {
                continue;
            }
            try {
                const urlObj = canonicalizeUrl(url);
                if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
                    continue;
                }
                const hasAuthUserInfo = urlObj.username.length > 0 || urlObj.password.length > 0;
                if (!hasAuthUserInfo) {
                    continue;
                }
                const matchesHostname = urlObj.host === hostname;
                if (!matchesHostname) {
                    continue;
                }
                if (normalizedTargetRepoUrl !== undefined) {
                    const normalizedRemoteUrl = normalizeRepoUrlForAuthLookup(buildRepoUrlForAuthRefresh(urlObj, hostname));
                    if (normalizedRemoteUrl !== normalizedTargetRepoUrl) {
                        continue;
                    }
                }
                const repoUrlPath = urlObj.pathname;
                const newUrl = normalizedTargetRepoUrl === undefined
                    ? `https://${hostname}${repoUrlPath}`
                    : `https://${hostname}${getBoundedRepoAuthPathname(repoUrlPath)}`;
                const args = repoPath === undefined
                    ? ["remote", "set-url", remoteName, newUrl]
                    : ["-C", repoPath, "remote", "set-url", remoteName, newUrl];
                await spawnWorkload(execFileAsync, "git", args, {
                    maxBuffer: 50 * 1024 * 1024,
                });
                normalizedRemoteNames.add(remoteName);
                logger.debug(this.ctx, "Successfully updated remote URL.", {
                    remoteName,
                    repoPath,
                    hostname,
                });
            }
            catch (parseError) {
                logger.warn(this.ctx, "Failed to parse or update remote URL, skipping update.", {
                    remoteName,
                    repoPath,
                    error: parseError instanceof Error ? parseError.message : String(parseError),
                    hostname,
                });
            }
        }
        return normalizedRemoteNames.size;
    }
    /**
     * Keep gh CLI authenticated by writing ~/.config/gh/{hosts,config}.yml.
     *
     * IMPORTANT: we write the **already-migrated** multi-account `hosts.yml`
     * layout plus a `config.yml` with `version: "1"`, instead of the legacy
     * single-account format. This is deliberate, not cosmetic:
     *
     * On the read-only shared pod, the virtual shell bind-mounts `~/.config/gh`
     * into the bwrap sandbox **read-only** and points `GH_CONFIG_DIR` at it. If
     * gh sees a legacy/unversioned config it runs its config migration and tries
     * to rewrite the dir, which fails on the read-only bind with:
     *   `failed to write config after migration: ... read-only file system`.
     * Writing the post-migration format with the matching schema `version` makes
     * gh skip the migration entirely, so nothing is written at runtime.
     *
     * The `version: "1"` value is gh's config schema version and is COUPLED to
     * the gh version we bundle for cloud-agent pods. The bundled gh is pinned in
     * `.buildkite/pipelines/exec_daemon/Dockerfile` (`GH_VERSION`). Do NOT bump
     * gh past a release that introduces a newer config migration without updating
     * this format + version to match, or the read-only pod's gh will start
     * failing again. See the "read-only pod e2e (real anyrun)" test in
     * `backend/server/src/cloud-agent/cloudAgentTemporalReadOnlyPod.suite.ts` for
     * the regression check against the dev cluster.
     */
    async writeGhHostsYml(token: string) {
        try {
            const { ghDir, hostsPath, configPath } = getGhConfigPaths();
            await nodeFsPromises.mkdir(ghDir, { recursive: true });
            // Multi-account ("migrated") hosts.yml. The active user's token lives
            // under `users.<user>.oauth_token`; the top-level keys mirror what gh
            // itself writes after migrating.
            const hostsContent = `github.com:
    user: cursor
    git_protocol: https
    oauth_token: ${token}
    users:
        cursor:
            oauth_token: ${token}
`;
            // Schema version marker that tells gh the config is already migrated.
            const configContent = `version: "1"
telemetry: disabled
`;
            await this.writeGhConfigFile(hostsPath, hostsContent);
            await this.writeGhConfigFile(configPath, configContent);
            // Write-then-mark: a crash between the two leaves an unmarked token
            // file (cleaned by the next claim's overwrite or expiry) rather than a
            // marked-but-untouched operator file that teardown would delete.
            await markGhConfigManaged(this.ctx);
        }
        catch (e) {
            logger.error(this.ctx, "exec-daemon-gh: Failed to write gh config; continuing", e);
        }
    }
    async writeGhConfigFile(targetPath: string, content: string) {
        const tmpPath = `${targetPath}.tmp`;
        await nodeFsPromises.writeFile(tmpPath, content, { mode: 0o600 }); // overwrite existing file
        await nodeFsPromises.rename(tmpPath, targetPath);
    }
}
