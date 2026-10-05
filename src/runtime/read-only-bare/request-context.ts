import nodeChildProcess from "node:child_process";
import nodeOs from "node:os";
import nodePath from "node:path";
import { shouldIncludeAgentSkillInRequestContext, stripAgentSkillContentForRequestContext } from "../../interop/vendor/agent-exec.js";
import { asyncMapValues } from "../../interop/vendor/utils-promise-extras.js";
import nodeFsPromises from "node:fs/promises";
import { RequestContextResult, RequestContextError } from "../../interop/vendor/proto-agent-v1-request-context-exec-pb.js";
import { BareGitWorkspaceRuntimeRef, BareGitWorkspaceGitExecutor, BareGitWorkspaceFilesystem, BareGitExtensibilityService, CursorPluginsAgentSkillsService, MergedCursorRulesService, NO_AGENT_STORE_SKILLS, MergedAgentSkillsService, MergedCloudRulesService, CursorPluginsSubagentsService, MergedSubagentsService, LocalRequestContextExecutor } from "../../interop/vendor/local-exec.js";
import { spawnWorkload } from "../../interop/vendor/utils-workload-spawn.js";
import nodeUtil from "node:util";
import { PLUGINS_CACHE_ROOT, loadPluginsFromCloudManifest } from "../../interop/vendor/cursor-plugins.js";
import { withDeduplicatedAgentSkillRules } from "../dedupe-agent-skill-rules.js";
import { VmDaemonBareGitRepository } from "./repository.js";
import type { JsonValue } from "../../interop/contracts/protobuf-runtime.js";
import type { Context } from "../../interop/contracts/context.js";
import type { PluginContent } from "../../interop/contracts/cursor-plugins.js";
import type { agent_v1_RequestContextArgs } from "../../interop/contracts/protobuf-generated.js";
export interface ReadOnlyPluginFailure { pluginName: string; errorMessage: string; errorType: "manifest" | "unknown"; }
export interface BareCacheKey { sha: string; pluginCacheRoot?: string; }
export type BareLocalRequestContextExecutor = Pick<InstanceType<typeof import("../../interop/vendor/local-exec.js").LocalRequestContextExecutor>, "execute">;
export interface BareRequestContextInner {
    executor: BareLocalRequestContextExecutor;
    runtimeRef: InstanceType<typeof import("../../interop/vendor/local-exec.js").BareGitWorkspaceRuntimeRef>;
}
export interface BareRequestContextCacheEntry {
    promise: Promise<BareRequestContextInner>;
    sha: string;
    cachedAtMs: number;
}
export interface BareRequestContextExecutorOptions {
    bareRepoPath: string;
    workspacePath: string;
    mcpStateAccessor: ConstructorParameters<typeof import("../../interop/vendor/local-exec.js").LocalRequestContextExecutor>[5];
    options?: ConstructorParameters<typeof import("../../interop/vendor/local-exec.js").LocalRequestContextExecutor>[8];
    filterModelDisabledSkills?: boolean;
    stripAgentSkillContent?: boolean;
    localRequestContextExecutorFactory?: (factory: () => BareLocalRequestContextExecutor) => BareLocalRequestContextExecutor | Promise<BareLocalRequestContextExecutor>;
}

export const execFileAsync = nodeUtil.promisify(nodeChildProcess.execFile);
export const emptyPluginsService = {
    async getAllEnabledPlugins(): Promise<PluginContent[]> {
        return [];
    },
    getLoadFailures(): ReadOnlyPluginFailure[] {
        return [];
    },
    isPluginSetIncomplete() {
        // This service serves no plugins by design, so the empty set is the whole
        // truth rather than the part of it we managed to read.
        return false;
    },
    async reload(): Promise<PluginContent[]> {
        return [];
    },
};
export const MAX_CACHED_REQUEST_CONTEXT_EXECUTORS = 64;
export const READ_ONLY_PLUGIN_MANIFEST_FILENAME = "manifest.json";
export const CANONICAL_FULL_POD_PLUGIN_CACHE_ROOT = nodePath.posix.join("/home/cursor", ".cursor", PLUGINS_CACHE_ROOT);
export function mapRequiredPathBetweenRoots(args: { path: string; sourceRoot: string; targetRoot: string }) {
    const normalizedPath = nodePath.posix.normalize(args.path);
    const normalizedSourceRoot = nodePath.posix.normalize(args.sourceRoot);
    const normalizedTargetRoot = nodePath.posix.normalize(args.targetRoot);
    if (normalizedPath === normalizedSourceRoot) {
        return normalizedTargetRoot;
    }
    if (normalizedPath.startsWith(`${normalizedSourceRoot}/`)) {
        return nodePath.posix.join(normalizedTargetRoot, normalizedPath.slice(normalizedSourceRoot.length + 1));
    }
    throw new Error(`Expected plugin path ${normalizedPath} to be inside ${normalizedSourceRoot}`);
}
export function mapOptionalPathBetweenRoots(args: { path?: string; sourceRoot: string; targetRoot: string }) {
    if (args.path === undefined) {
        return undefined;
    }
    return mapRequiredPathBetweenRoots({
        path: args.path,
        sourceRoot: args.sourceRoot,
        targetRoot: args.targetRoot,
    });
}
export function canonicalizeReadOnlyPluginPaths(args: { plugins: readonly PluginContent[]; cacheRoot: string }): PluginContent[] {
    return args.plugins.map((plugin) => {
        const installPath = mapRequiredPathBetweenRoots({
            path: plugin.installPath,
            sourceRoot: args.cacheRoot,
            targetRoot: CANONICAL_FULL_POD_PLUGIN_CACHE_ROOT,
        });
        const hooks = plugin.hooks !== undefined &&
            "sourcePath" in plugin.hooks &&
            plugin.hooks.sourcePath !== undefined
            ? {
                ...plugin.hooks,
                sourcePath: mapOptionalPathBetweenRoots({
                    path: plugin.hooks.sourcePath,
                    sourceRoot: args.cacheRoot,
                    targetRoot: CANONICAL_FULL_POD_PLUGIN_CACHE_ROOT,
                }) ?? plugin.hooks.sourcePath,
            }
            : plugin.hooks;
        return { ...plugin, installPath, hooks };
    });
}
export class ReadOnlyPluginCacheService {
    cacheRoot;
    loadPromise: Promise<PluginContent[]> | undefined;
    plugins: PluginContent[] = [];
    failures: ReadOnlyPluginFailure[] = [];
    // Starts true: the manifest has not been read yet, so the empty set is short
    // of whatever the cache holds rather than a cache that holds nothing.
    pluginSetIncomplete = true;
    constructor(cacheRoot: string) {
        this.cacheRoot = cacheRoot;
    }
    async getAllEnabledPlugins() {
        await this.ensureLoaded();
        return [...this.plugins];
    }
    getLoadFailures() {
        return [...this.failures];
    }
    isPluginSetIncomplete() {
        return this.pluginSetIncomplete;
    }
    async reload() {
        this.loadPromise = undefined;
        this.plugins = [];
        this.failures = [];
        this.pluginSetIncomplete = true;
        return await this.ensureLoaded();
    }
    async ensureLoaded() {
        if (this.loadPromise === undefined) {
            const pending = this.load();
            pending.catch(() => {
                if (this.loadPromise === pending) {
                    this.loadPromise = undefined;
                }
            });
            this.loadPromise = pending;
        }
        return await this.loadPromise;
    }
    async load() {
        const manifestPath = nodePath.join(this.cacheRoot, READ_ONLY_PLUGIN_MANIFEST_FILENAME);
        let manifest: unknown;
        try {
            manifest = JSON.parse(await nodeFsPromises.readFile(manifestPath, "utf8"));
        }
        catch (error) {
            this.failures = [
                {
                    pluginName: "read-only plugin cache manifest",
                    errorMessage: error instanceof Error ? error.message : String(error),
                    errorType: "manifest",
                },
            ];
            throw error;
        }
        const failures: ReadOnlyPluginFailure[] = [];
        // Native JSON.parse without a reviver establishes JSON values only; it
        // does not establish a valid manifest root or entries. The loader still
        // receives malformed JSON shapes and rejects them exactly as before.
        const plugins = await loadPluginsFromCloudManifest(manifest as JsonValue, this.cacheRoot, {
            log(message) {
                failures.push({
                    pluginName: "read-only plugin cache",
                    errorMessage: message,
                    errorType: "unknown",
                });
            },
        });
        this.plugins = canonicalizeReadOnlyPluginPaths({
            plugins,
            cacheRoot: this.cacheRoot,
        });
        this.failures = failures;
        this.pluginSetIncomplete = false;
        return this.plugins;
    }
}
export function requestContextErrorResult(error: string) {
    return new RequestContextResult({
        result: {
            case: "error",
            value: new RequestContextError({ error }),
        },
    });
}
export function cacheKeyForSha(args: BareCacheKey) {
    return `${args.sha}\0${args.pluginCacheRoot ?? ""}`;
}
export async function isGitAncestor(args: { bareRepoPath: string; ancestorSha: string; descendantSha: string }) {
    try {
        await spawnWorkload(execFileAsync, "git", [
            "-C",
            args.bareRepoPath,
            "merge-base",
            "--is-ancestor",
            args.ancestorSha,
            args.descendantSha,
        ], { encoding: "utf8", timeout: 5000, windowsHide: true });
        return true;
    }
    catch (error) {
        if (error !== null && typeof error === "object" && "code" in error && error.code === 1) {
            return false;
        }
        return false;
    }
}
/**
 * In-process `LocalRequestContextExecutor` for exec-daemon on the
 * multi-tenant read-only shared pod: same bare-git rule/skill path as
 * the hybrid request context, but with local `git` against the on-VM bare
 * mirror and the same MCP state accessor as the main daemon
 * (Observable lease).
 */
export function createReadOnlyVmDaemonBareRequestContextExecutor(args: BareRequestContextExecutorOptions): BareLocalRequestContextExecutor {
    const innerBySha = new Map<string, BareRequestContextCacheEntry>();
    const warmInnerPromises = new WeakSet<Promise<BareRequestContextInner>>();
    async function buildInner(initCtx: Context, pinnedTreeSha: string, pluginCacheRoot: string | undefined): Promise<BareRequestContextInner> {
        const runtimeRef = new BareGitWorkspaceRuntimeRef();
        const resolveContext = (agentCtx: Context, fromRef: Context | undefined) => fromRef ?? agentCtx;
        const repository = new VmDaemonBareGitRepository(args.bareRepoPath, () => pinnedTreeSha);
        const gitExecutor = new BareGitWorkspaceGitExecutor(repository, args.workspacePath, runtimeRef, resolveContext);
        const workspaceFs = new BareGitWorkspaceFilesystem(repository, args.workspacePath, runtimeRef, resolveContext);
        const bareGitExtensibilityService = new BareGitExtensibilityService(args.workspacePath, workspaceFs);
        const importThirdPartyPlugins = false;
        const pluginsService = pluginCacheRoot !== undefined && pluginCacheRoot.length > 0
            ? new ReadOnlyPluginCacheService(pluginCacheRoot)
            : emptyPluginsService;
        const pluginSkillsService = new CursorPluginsAgentSkillsService(initCtx, () => ({ importThirdPartyPlugins }), undefined, pluginsService);
        const cursorRulesService = new MergedCursorRulesService([bareGitExtensibilityService, pluginSkillsService], () => NO_AGENT_STORE_SKILLS);
        const mergedAgentSkillsService = new MergedAgentSkillsService([bareGitExtensibilityService, pluginSkillsService], () => [], () => ({
            workspacePaths: [args.workspacePath],
            userHomeDirectory: nodeOs.homedir(),
            agentStoreSkillsDirs: [],
        }));
        const requestContextCursorRulesService = withDeduplicatedAgentSkillRules(cursorRulesService, (ctx) => mergedAgentSkillsService.getAllAgentSkills(ctx));
        const cloudRulesService = new MergedCloudRulesService([
            {
                workspacePath: args.workspacePath,
                service: bareGitExtensibilityService,
            },
        ]);
        const pluginSubagentsService = new CursorPluginsSubagentsService(() => ({ importThirdPartyPlugins }), pluginsService);
        const bareGitSubagents = {
            getAllSubagents: () => bareGitExtensibilityService.getAllSubagents(),
            reload: () => bareGitExtensibilityService.reloadSubagents(),
        };
        const subagentsService = new MergedSubagentsService([bareGitSubagents, pluginSubagentsService]);
        const createLocalRequestContextExecutor = args.localRequestContextExecutorFactory ?? ((factory: () => BareLocalRequestContextExecutor) => factory());
        return {
            executor: await createLocalRequestContextExecutor(() => new LocalRequestContextExecutor(requestContextCursorRulesService, cloudRulesService, subagentsService, {
                async getCodebaseReference() {
                    return undefined;
                },
            }, { executeIndexedGrep: undefined }, args.mcpStateAccessor, gitExecutor, [args.workspacePath], {
                ...args.options,
                getAgentSkills: async (ctx: Context) => {
                    let skills = await mergedAgentSkillsService.getAllAgentSkills(ctx);
                    if (args.filterModelDisabledSkills === true) {
                        skills = skills.filter(shouldIncludeAgentSkillInRequestContext);
                    }
                    return args.stripAgentSkillContent === true
                        ? stripAgentSkillContentForRequestContext(skills, {
                            preservePluginSkillContent: true,
                        })
                        : skills;
                },
            })),
            runtimeRef,
        };
    }
    function getInner(ctx: Context, args: BareCacheKey) {
        const { sha, pluginCacheRoot } = args;
        const cacheKey = cacheKeyForSha({ sha, pluginCacheRoot });
        const cached = innerBySha.get(cacheKey);
        if (cached !== undefined) {
            // Refresh insertion order so the oldest unused SHA is evicted first.
            innerBySha.delete(cacheKey);
            innerBySha.set(cacheKey, cached);
            return cached.promise;
        }
        const pending = buildInner(ctx, sha, pluginCacheRoot);
        const entry = {
            promise: pending,
            sha,
            cachedAtMs: Date.now(),
        };
        innerBySha.set(cacheKey, entry);
        void pending.then(() => {
            const current = innerBySha.get(cacheKey);
            if (current?.promise === pending) {
                warmInnerPromises.add(pending);
            }
        }, () => {
            if (innerBySha.get(cacheKey)?.promise === pending) {
                innerBySha.delete(cacheKey);
            }
        });
        if (innerBySha.size > MAX_CACHED_REQUEST_CONTEXT_EXECUTORS) {
            const oldestKey = innerBySha.keys().next().value;
            if (oldestKey !== undefined) {
                innerBySha.delete(oldestKey);
            }
        }
        return pending;
    }
    async function executeRequestContextWithInner(ctx: Context, execArgs: agent_v1_RequestContextArgs, sha: string, innerPromise: Promise<BareRequestContextInner>) {
        try {
            const { executor, runtimeRef } = await innerPromise;
            const pinnedArgs = execArgs.clone();
            pinnedArgs.readOnlyPinnedTreeSha = sha;
            return await runtimeRef.runWith(ctx, () => executor.execute(ctx, pinnedArgs));
        }
        catch (error) {
            return requestContextErrorResult(error instanceof Error ? error.message : String(error));
        }
    }
    async function getMostRecentCachedAncestorSha(args: BareCacheKey & { bareRepoPath: string }) {
        const warmCandidates: BareRequestContextCacheEntry[] = [];
        for (const [cacheKey, entry] of innerBySha) {
            if (entry.sha === args.sha) {
                continue;
            }
            if (!warmInnerPromises.has(entry.promise)) {
                continue;
            }
            if (cacheKey !==
                cacheKeyForSha({
                    sha: entry.sha,
                    pluginCacheRoot: args.pluginCacheRoot,
                })) {
                continue;
            }
            warmCandidates.push(entry);
        }
        if (warmCandidates.length === 0) {
            return undefined;
        }
        const probeResults = await asyncMapValues(warmCandidates, async (entry) => {
            const isAncestor = await isGitAncestor({
                bareRepoPath: args.bareRepoPath,
                ancestorSha: entry.sha,
                descendantSha: args.sha,
            });
            return isAncestor ? entry : undefined;
        }, { max: MAX_CACHED_REQUEST_CONTEXT_EXECUTORS });
        const ancestralHits = new Set<string>(probeResults
            .filter((hit) => hit !== undefined)
            .map((hit) => hit.sha));
        if (ancestralHits.size === 0) {
            return undefined;
        }
        let mostRecentHit: BareRequestContextCacheEntry | undefined;
        for (const entry of innerBySha.values()) {
            if (!ancestralHits.has(entry.sha)) {
                continue;
            }
            if (mostRecentHit === undefined || entry.cachedAtMs > mostRecentHit.cachedAtMs) {
                mostRecentHit = entry;
            }
        }
        return mostRecentHit?.sha;
    }
    return {
        async execute(ctx: Context, execArgs: agent_v1_RequestContextArgs) {
            const withSha = execArgs;
            const sha = withSha.readOnlyPinnedTreeSha;
            if (sha === undefined || sha === "") {
                // Surface as a normal `RequestContextResult` error rather than
                // throwing — callers consume the discriminated `result` union and
                // a raw throw becomes an unhandled rejection on the request-
                // context path. Mirrors the try/catch wrapping in
                // `LocalRequestContextExecutor.execute`.
                return requestContextErrorResult("readOnlyPinnedTreeSha is required for read-only VM request context (exec-daemon)");
            }
            const pluginCacheRoot = withSha.readOnlyPluginCacheRoot;
            const targetCacheKey = cacheKeyForSha({ sha, pluginCacheRoot });
            const cachedTarget = innerBySha.get(targetCacheKey);
            if (cachedTarget !== undefined && warmInnerPromises.has(cachedTarget.promise)) {
                return await executeRequestContextWithInner(ctx, execArgs, sha, cachedTarget.promise);
            }
            const ancestorSha = await getMostRecentCachedAncestorSha({
                sha,
                pluginCacheRoot,
                bareRepoPath: args.bareRepoPath,
            });
            if (ancestorSha !== undefined) {
                // Start warming the target SHA in the background without affecting
                // ancestor selection LRU order.
                void getInner(ctx, { sha, pluginCacheRoot });
                return await executeRequestContextWithInner(ctx, execArgs, ancestorSha, getInner(ctx, { sha: ancestorSha, pluginCacheRoot }));
            }
            return await executeRequestContextWithInner(ctx, execArgs, sha, getInner(ctx, { sha, pluginCacheRoot }));
        },
    };
}
