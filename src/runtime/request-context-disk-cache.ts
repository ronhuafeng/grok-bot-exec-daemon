import nodeFsPromises from "node:fs/promises";
import nodePath from "node:path";
import { createLogger } from "../interop/vendor/context-logger.js";
import { RequestContext, RequestContextResult, RequestContextSuccess } from "../interop/vendor/proto-agent-v1-request-context-exec-pb.js";
import type { Context } from "../interop/contracts/context.js";

export type CachedRequestContext = InstanceType<typeof import("../interop/vendor/proto-agent-v1-request-context-exec-pb.js").RequestContext>;
export type CachedRequestContextResult = InstanceType<typeof import("../interop/vendor/proto-agent-v1-request-context-exec-pb.js").RequestContextResult>;
export type DedupeCachedRules = (rules: CachedRequestContext["rules"], skills: CachedRequestContext["agentSkills"]) => CachedRequestContext["rules"];
export interface CachedPluginContent {
    agentSkills: CachedRequestContext["agentSkills"];
    rules: CachedRequestContext["rules"];
    subagents: CachedRequestContext["customSubagents"];
    dedupeRules: DedupeCachedRules;
}
export interface FullRequestContextExecutor<Args extends { useCached?: boolean }, Options> {
    execute(ctx: Context, args: Args, options: Options): Promise<CachedRequestContextResult>;
}
export interface DiskBackedRequestContextOptions<Args extends { useCached?: boolean }, Options> {
    read(ctx: Context): Promise<CachedRequestContext | undefined>;
    createFullExecutor(): FullRequestContextExecutor<Args, Options>;
    getPluginRules(ctx: Context): Promise<CachedRequestContext["rules"]>;
    getPluginAgentSkills(ctx: Context): Promise<CachedRequestContext["agentSkills"]>;
    getPluginSubagents(): Promise<CachedRequestContext["customSubagents"]>;
    dedupeRules: DedupeCachedRules;
    updateBaked?(ctx: Context, requestContext: CachedRequestContext): Promise<void>;
}
export const logger = createLogger("exec-daemon:request-context-disk-cache");
/**
 * Bump when the baked-vs-live split changes in a way that an older snapshot's
 * cache would feed wrong data into a newer daemon. A reader that sees a
 * different version ignores the cache and recomputes live, so a stale snapshot
 * never serves malformed data.
 */
export const REQUEST_CONTEXT_DISK_CACHE_VERSION = 1;
export const REQUEST_CONTEXT_DISK_CACHE_FILENAME = "request-context-cache.json";
export const REQUEST_CONTEXT_DISK_CACHE_PATH = "/opt/cursor/.exec-daemon/request-context-cache.json";
/**
 * Atomically write the whole computed `RequestContext` to disk (temp file +
 * rename) so a reader never observes a partially-written file even if the build
 * is interrupted mid-write.
 */
export async function writeRequestContextDiskCache(ctx: Context, filePath: string, requestContext: CachedRequestContext) {
    await nodeFsPromises.mkdir(nodePath.dirname(filePath), { recursive: true });
    const serialized = {
        version: REQUEST_CONTEXT_DISK_CACHE_VERSION,
        builtAtMs: Date.now(),
        requestContext: requestContext.toJson(),
    };
    const tmpPath = `${filePath}.tmp-${process.pid}`;
    await nodeFsPromises.writeFile(tmpPath, JSON.stringify(serialized), "utf8");
    await nodeFsPromises.rename(tmpPath, filePath);
    logger.info(ctx, "Wrote request-context disk cache", {
        filePath,
        ruleCount: requestContext.rules.length,
        agentSkillCount: requestContext.agentSkills.length,
        customSubagentCount: requestContext.customSubagents.length,
        repositoryInfoCount: requestContext.repositoryInfo.length,
        hasCloudRule: requestContext.cloudRule !== undefined && requestContext.cloudRule.length > 0,
    });
}
/**
 * Read and validate the baked `RequestContext`. Returns `undefined` (never
 * throws) when the file is absent, unreadable, malformed, or written by an
 * incompatible version, so the caller transparently falls back to computing the
 * request context live.
 */
export async function readRequestContextDiskCache(ctx: Context, filePath: string): Promise<CachedRequestContext | undefined> {
    let raw: string;
    try {
        raw = await nodeFsPromises.readFile(filePath, "utf8");
    }
    catch (error) {
        // Logged (not silent) so a miss can be told apart from a hit, and an
        // unexpected errno (e.g. a writer/reader data-dir mismatch) from a
        // genuinely-absent bake (ENOENT on a snapshot that never baked).
        logger.info(ctx, "Request-context disk cache not read", {
            filePath,
            // Only an optional errno property is observed; rejection values are otherwise opaque.
            code: (error as { code?: unknown } | null | undefined)?.code,
        });
        return undefined;
    }
    try {
        // JSON parsing guarantees a JSON value. The legacy object-property reads are
        // inside this try/catch, so null or malformed shapes retain the same miss path.
        const parsed: unknown = JSON.parse(raw);
        if ((parsed as { version?: unknown }).version !== REQUEST_CONTEXT_DISK_CACHE_VERSION) {
            logger.warn(ctx, "Ignoring request-context disk cache: version mismatch", {
                filePath,
                found: (parsed as { version?: unknown }).version,
                expected: REQUEST_CONTEXT_DISK_CACHE_VERSION,
            });
            return undefined;
        }
        if (typeof (parsed as { requestContext?: unknown }).requestContext !== "object" || (parsed as { requestContext?: unknown }).requestContext === null) {
            logger.warn(ctx, "Ignoring request-context disk cache: missing requestContext", { filePath });
            return undefined;
        }
        return RequestContext.fromJson((parsed as {
            requestContext: Parameters<typeof import("../interop/vendor/proto-agent-v1-request-context-exec-pb.js").RequestContext["fromJson"]>[0];
        }).requestContext, {
            ignoreUnknownFields: true,
        });
    }
    catch (error) {
        logger.warn(ctx, "Ignoring request-context disk cache: parse failed", {
            filePath,
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
}
/**
 * Merge the live plugin-provisioned static content (rules, agent skills,
 * subagents) on top of the snapshot-baked baseline, mutating `target` in place.
 *
 * The baked baseline is plugin-free: cloud plugins are materialized per-agent at
 * runtime, after the snapshot, so the env build that produced the cache never
 * saw them. Plugins are therefore the only static content not provisioned ahead
 * of time, and merging them here is what keeps a baked context correct once an
 * agent's plugins are installed.
 */
export function mergeBakedStaticIntoRequestContext(target: CachedRequestContext, baked: CachedRequestContext, plugins: CachedPluginContent) {
    const agentSkills = [...baked.agentSkills, ...plugins.agentSkills];
    target.agentSkills = agentSkills;
    target.rules = plugins.dedupeRules([...baked.rules, ...plugins.rules], agentSkills);
    target.customSubagents = [...baked.customSubagents, ...plugins.subagents];
    target.repositoryInfo = baked.repositoryInfo;
    if (baked.cloudRule !== undefined && baked.cloudRule.length > 0) {
        target.cloudRule = baked.cloudRule;
    }
}
/**
 * Request-context executor that optionally serves the whole snapshot-baked
 * context when the caller sets `RequestContextArgs.useCached` (intended for the
 * cold first turn after an env-build snapshot). Otherwise falls through to the
 * full (pre-disk-cache) executor with its in-process caches.
 *
 * When serving the bake, live plugin content is still merged on top because
 * plugins are materialized per-agent after the snapshot. The full executor is
 * also constructed on a successful cache hit so its caches warm while the bake
 * is served, keeping the next non-cached call fast.
 *
 * Callers must not set `useCached` on later turns: workspace-mutating fields
 * (e.g. git status) would go stale.
 */
export class DiskBackedRequestContextExecutor<Args extends { useCached?: boolean }, Options> {
    options: DiskBackedRequestContextOptions<Args, Options>;
    fullExecutor: FullRequestContextExecutor<Args, Options> | undefined;
    constructor(options: DiskBackedRequestContextOptions<Args, Options>) {
        this.options = options;
    }
    async execute(ctx: Context, args: Args, options: Options): Promise<CachedRequestContextResult> {
        if (args.useCached === true) {
            const baked = await this.options.read(ctx).catch(() => undefined);
            if (baked !== undefined) {
                logger.info(ctx, "Serving request-context from disk cache (hit)", {
                    ruleCount: baked.rules.length,
                    agentSkillCount: baked.agentSkills.length,
                    customSubagentCount: baked.customSubagents.length,
                    repositoryInfoCount: baked.repositoryInfo.length,
                });
                // Warm the full executor in the background for subsequent non-cached calls.
                this.getFullExecutor();
                return this.serveBaked(ctx, baked);
            }
            logger.info(ctx, "Request-context disk cache miss; computing live", {});
        }
        return this.getFullExecutor().execute(ctx, args, options);
    }
    /**
     * Serve the whole baked context, merging live plugin-provisioned static
     * content on top. Clones the baked context so the memoized instance is never
     * mutated.
     */
    async serveBaked(ctx: Context, baked: CachedRequestContext): Promise<CachedRequestContextResult> {
        const [rules, agentSkills, subagents] = await Promise.all([
            this.options.getPluginRules(ctx).catch(() => []),
            this.options.getPluginAgentSkills(ctx).catch(() => []),
            this.options.getPluginSubagents().catch(() => []),
        ]);
        const requestContext = baked.clone();
        mergeBakedStaticIntoRequestContext(requestContext, baked, {
            rules,
            agentSkills,
            subagents,
            dedupeRules: this.options.dedupeRules,
        });
        await this.options.updateBaked?.(ctx, requestContext);
        return new RequestContextResult({
            result: {
                case: "success",
                value: new RequestContextSuccess({
                    requestContext,
                    servedFromDiskCache: true,
                }),
            },
        });
    }
    getFullExecutor() {
        if (this.fullExecutor === undefined) {
            this.fullExecutor = this.options.createFullExecutor();
        }
        return this.fullExecutor;
    }
}
