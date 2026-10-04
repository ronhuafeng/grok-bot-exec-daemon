import nodeCrypto from "node:crypto";
import nodePath from "node:path";
import { createLogger } from "../interop/vendor/context-logger.js";
import nodeFsPromises from "node:fs/promises";
import { isAgentStoreFuseBackedPath } from "./artifactUploads.js";
import nodeZlib from "node:zlib";
import { classifyStoreCanvasSavePath } from "../interop/vendor/canvas-server-canvas-path-validation.js";
import { CLOUD_CANVAS_SOURCE_BASENAME, CANVAS_STORE_PERSIST_ROOTS } from "../interop/vendor/constants-agent-store-ids.js";
import { CLOUD_CANVAS_SOURCE_MAX_BYTES, isGzipMagic, CLOUD_CANVAS_DATA_BASENAME, CLOUD_CANVAS_PAYLOAD_MAX_BYTES, CLOUD_CANVAS_MANIFEST_BASENAME, parseCloudCanvasManifest, CLOUD_CANVAS_BUNDLE_BASENAME, CLOUD_CANVAS_MANIFEST_VERSION, CLOUD_CANVAS_MANIFEST_MAX_BYTES } from "../interop/vendor/canvas-shared-cloud-canvas.js";
import type { Context } from "../interop/contracts/context.js";
import type { CanvasArtifactBuilder } from "./canvasShareBundle.js";
export type CanvasSaveState = "invalid_path" | "too_large" | "unavailable" | "typecheck_failed" | "compile_failed" | "pending";
export interface CanvasSaveOptions { typecheckOutcome?: Promise<"passed" | "failed" | "unavailable">; }
export interface CanvasSaveResult { saveState: CanvasSaveState; saveDetail?: string; canvasId?: string; title?: string; }
export interface CanvasStoreOptions { ctx: Context; canvasesRoots?: string | readonly string[]; runtimeDir?: string; buildArtifact?: CanvasArtifactBuilder; isFuseBacked?: (root: string) => Promise<boolean>; now?: () => Date; }
export interface ValidatedCanvasSave { canvasId: string; canvasDir: string; canvasesRoot: string; sourcePath: string; source: string; bundleBytes: Uint8Array; compiledAt: Date; generation: number; }

export const logger = createLogger("exec-daemon:canvas-store-persist");
export const SOURCE_BASENAME = CLOUD_CANVAS_SOURCE_BASENAME;
export const TYPECHECK_WAIT_BUDGET_MS = 30000;
export const TITLE_PRAGMA_REGEX = /^\s*\/\/\s*cursor-canvas-title:\s*(.+?)\s*$/m;
export const TITLE_MAX_CHARS = 120;
export const SAVE_DETAIL_MAX_CHARS = 2000;
/** Nudge (not a gate): untitled saves still publish, but the footer teaches
 * the model to set a title via the pragma. */
export const NO_TITLE_PRAGMA_NUDGE = "no title pragma found — the canvas will show as Untitled; add " +
    "`// cursor-canvas-title: <Your Title>` at the top of the source to set one.";
export const MAX_BUNDLE_DECOMPRESSED_BYTES = 20000000;
// Re-exported from the canvas-shared SSOT so the daemon persist path and the
// BOX wire RPC share one numeric source cap. Kept under this local name for
// existing daemon consumers/tests.
export const CANVAS_SOURCE_MAX_BYTES = CLOUD_CANVAS_SOURCE_MAX_BYTES;
/** How far in the future an existing manifest's `updatedAt` may sit and
 * still be carried forward by the monotonic merge. Beyond this the stamp is
 * treated as skew damage and repaired to the local clock — otherwise a
 * far-future stamp would win every merge and never reflect real edits. */
export const MAX_MANIFEST_FUTURE_SKEW_MS = 5 * 60000;
export function errnoCode(error: unknown) {
    return typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
        ? error.code
        : undefined;
}
export function oversizedSourceDetail(sourceBytes: number) {
    return (`canvas source is ${sourceBytes} bytes, over the ` +
        `${CANVAS_SOURCE_MAX_BYTES}-byte source limit. Nothing was published; ` +
        `move large datasets into canvas.data.json or reduce the source size, ` +
        `then save again.`);
}
export function parseCanvasTitlePragma(source: string) {
    const match = TITLE_PRAGMA_REGEX.exec(source);
    const title = match?.[1]?.trim().slice(0, TITLE_MAX_CHARS);
    return title !== undefined && title.length > 0 ? title : undefined;
}
export async function resolveWithinBudget<T, F>(promise: Promise<T>, budgetMs: number, fallback: F): Promise<T | F> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const budget = new Promise<F>((resolve) => {
        timer = setTimeout(() => resolve(fallback), budgetMs);
        timer.unref?.();
    });
    try {
        return await Promise.race([promise.catch(() => fallback), budget]);
    }
    finally {
        if (timer !== undefined) {
            clearTimeout(timer);
        }
    }
}
export function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * Write discipline follows `artifactUploads`' directWrite mode: plain
 * in-place writes whose close is the FUSE object PUT — never a FUSE rename.
 * Publish order is bundle → manifest (manifest-last), and nothing is ever
 * deleted, even on write failure — the last good bundle/manifest stay and
 * readers fail closed on torn content.
 *
 * Cross-writer posture is last-writer-wins: concurrent sessions saving the
 * same canvas converge on whichever publish lands last, and a lost save
 * self-heals on the next edit. In-process ordering is still enforced by
 * accept tickets, so within one daemon an older save never overwrites a
 * newer one.
 */
export class CanvasStorePersist {
    ctx: Context;
    canvasesRoots: string | readonly string[];
    runtimeDir: string | undefined;
    buildArtifactOverride: CanvasArtifactBuilder | undefined;
    isFuseBacked: (root: string) => Promise<boolean>;
    now: () => Date;
    /** Mounts can arrive after daemon boot, so negative probe results are
     * never cached. Positive results are cached per root. */
    fuseKnownAvailable = new Set<string>();
    acceptTickets = new Map<string, number>();
    enqueuedGenerations = new Map<string, number>();
    chains = new Map<string, Promise<void>>();
    titleCache = new Map<string, string>();
    lastFailureDetail = new Map<string, string>();
    inFlight = new Set<Promise<void>>();
    constructor(options: CanvasStoreOptions) {
        this.ctx = options.ctx;
        this.canvasesRoots = options.canvasesRoots ?? CANVAS_STORE_PERSIST_ROOTS;
        this.runtimeDir = options.runtimeDir;
        this.buildArtifactOverride = options.buildArtifact;
        this.isFuseBacked = options.isFuseBacked ?? isAgentStoreFuseBackedPath;
        this.now = options.now ?? (() => new Date());
    }
    beginCanvasSave = (filePath: string, options?: CanvasSaveOptions) => this.begin(filePath, options);
    async settle() {
        while (this.inFlight.size > 0) {
            await Promise.all([...this.inFlight]);
        }
    }
    async begin(filePath: string, options?: CanvasSaveOptions): Promise<CanvasSaveResult | undefined> {
        const store = classifyStoreCanvasSavePath(filePath, this.canvasesRoots);
        if (store.kind === "unrelated") {
            return undefined;
        }
        if (store.kind === "invalid") {
            return { saveState: "invalid_path", saveDetail: store.reason };
        }
        const { canvasId, canvasDir, canvasesRoot } = store;
        const sourcePath = nodePath.join(canvasDir, SOURCE_BASENAME);
        // Ticket before any await, so tickets order by acceptance rather than
        // by how long the awaits below take.
        const generation = this.takeAcceptTicket(canvasId);
        let statBytes: number | undefined;
        try {
            statBytes = (await nodeFsPromises.stat(sourcePath)).size;
        }
        catch {
            // Best-effort early size probe only: a real read problem surfaces as
            // `unavailable` at the readFile below, after the typecheck gate.
        }
        if (statBytes !== undefined && statBytes > CANVAS_SOURCE_MAX_BYTES) {
            return {
                saveState: "too_large",
                saveDetail: oversizedSourceDetail(statBytes),
            };
        }
        if (!(await this.probeFuse(canvasesRoot))) {
            return {
                saveState: "unavailable",
                saveDetail: `${canvasesRoot} is not mounted (not fuse.agent-store); nothing was published`,
            };
        }
        const outcome = await resolveWithinBudget(options?.typecheckOutcome ?? Promise.resolve("passed"), TYPECHECK_WAIT_BUDGET_MS, "unavailable");
        if (outcome === "failed") {
            return {
                saveState: "typecheck_failed",
                saveDetail: "type check failed; nothing was published — fix the errors above and save again",
            };
        }
        if (outcome !== "passed") {
            return {
                saveState: "unavailable",
                saveDetail: "the canvas TypeScript check could not run; nothing was published — save this file again to retry",
            };
        }
        let source: string;
        try {
            source = await nodeFsPromises.readFile(sourcePath, "utf8");
        }
        catch (error) {
            return {
                saveState: "unavailable",
                saveDetail: `could not read canvas source: ${errorMessage(error)}`,
            };
        }
        const sourceBytes = Buffer.byteLength(source, "utf8");
        if (sourceBytes > CANVAS_SOURCE_MAX_BYTES) {
            return {
                saveState: "too_large",
                saveDetail: oversizedSourceDetail(sourceBytes),
            };
        }
        // The cache is only ever written on publish success (and by the
        // manifest fallback, which reads published state). Caching the pragma
        // here, before validation, would let a failed save's title leak into a
        // later save's footer while the written manifest stays untitled.
        const pragmaTitle = parseCanvasTitlePragma(source);
        const title = pragmaTitle ??
            this.titleCache.get(canvasId) ??
            (await this.manifestTitleFallback(canvasId, canvasDir));
        if (this.buildArtifactOverride === undefined && this.runtimeDir === undefined) {
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: "canvas runtime is missing from the daemon bundle; cannot compile",
            });
        }
        let bundleBytes: Uint8Array;
        try {
            const buildArtifact = this.buildArtifactOverride ??
                (await import("../interop/vendor/canvas-server-canvas-share-artifact.js"))
                    .buildCanvasShareArtifactFromSource;
            const artifact = await buildArtifact({
                source,
                canvasPath: sourcePath,
                runtimeDir: this.runtimeDir,
            });
            bundleBytes = artifact.appJs;
        }
        catch (error) {
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: `compile failed: ${errorMessage(error)}`,
            });
        }
        const compiledAt = this.now();
        if (!isGzipMagic(bundleBytes)) {
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: "compiler produced a non-gzip bundle",
            });
        }
        try {
            nodeZlib.gunzipSync(Buffer.from(bundleBytes), {
                maxOutputLength: MAX_BUNDLE_DECOMPRESSED_BYTES,
            });
        }
        catch (error) {
            if (errnoCode(error) === "ERR_BUFFER_TOO_LARGE") {
                return this.syncFailure(canvasId, title, {
                    saveState: "too_large",
                    detail: `compiled bundle exceeds the ${MAX_BUNDLE_DECOMPRESSED_BYTES}-byte ` +
                        `decompressed render limit; nothing was published`,
                });
            }
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: `compiled bundle failed gzip validation: ${errorMessage(error)}`,
            });
        }
        let dataBytes = 0;
        try {
            dataBytes = (await nodeFsPromises.stat(nodePath.join(canvasDir, CLOUD_CANVAS_DATA_BASENAME))).size;
        }
        catch (error) {
            // Absent data file is the normal case; any other stat failure would
            // undercount the payload cap, so fail the save instead of guessing.
            if (errnoCode(error) !== "ENOENT") {
                return {
                    saveState: "unavailable",
                    saveDetail: `could not size ${CLOUD_CANVAS_DATA_BASENAME}: ${errorMessage(error)}`,
                };
            }
        }
        const totalBytes = sourceBytes + bundleBytes.byteLength + dataBytes;
        if (totalBytes > CLOUD_CANVAS_PAYLOAD_MAX_BYTES) {
            return this.syncFailure(canvasId, title, {
                saveState: "too_large",
                detail: `canvas payload too large: source ${sourceBytes}B + bundle ` +
                    `${bundleBytes.byteLength}B + data ${dataBytes}B = ${totalBytes}B ` +
                    `exceeds ${CLOUD_CANVAS_PAYLOAD_MAX_BYTES}B; nothing was published`,
            });
        }
        const validated = {
            canvasId,
            canvasDir,
            canvasesRoot,
            sourcePath,
            source,
            bundleBytes,
            compiledAt,
            generation,
        };
        this.enqueuedGenerations.set(canvasId, Math.max(this.enqueuedGenerations.get(canvasId) ?? 0, generation));
        const chained = (this.chains.get(canvasId) ?? Promise.resolve())
            .then(() => this.publish(validated))
            .catch((error: unknown) => {
            logger.warn(this.ctx, "Canvas store publish crashed", {
                error: errorMessage(error),
            });
        });
        this.chains.set(canvasId, chained);
        this.inFlight.add(chained);
        void chained.finally(() => this.inFlight.delete(chained));
        const lastFailure = this.lastFailureDetail.get(canvasId);
        // The previous-failure echo wins over the title nudge: the failure is
        // the actionable signal, and the nudge resurfaces once it clears.
        const saveDetail = lastFailure !== undefined
            ? `previous save failed: ${lastFailure}`
            : title === undefined
                ? NO_TITLE_PRAGMA_NUDGE
                : undefined;
        return {
            saveState: "pending",
            canvasId,
            title,
            ...(saveDetail !== undefined ? { saveDetail } : {}),
        };
    }
    syncFailure(canvasId: string, title: string | undefined, args: { saveState: CanvasSaveState; detail: string }): CanvasSaveResult {
        const clamped = args.detail.length > SAVE_DETAIL_MAX_CHARS
            ? `${args.detail.slice(0, SAVE_DETAIL_MAX_CHARS)}… [truncated]`
            : args.detail;
        return {
            saveState: args.saveState,
            canvasId,
            title,
            saveDetail: clamped,
        };
    }
    /** Cold-cache fallback for the sync title: the in-memory cache dies with
     * the daemon, but the on-disk manifest survives and publish() carries its
     * title forward — so a pragma-less edit of a titled canvas must not be
     * reported as one that will show as Untitled. Read failures resolve
     * undefined: the canvas is then treated as genuinely untitled. */
    async manifestTitleFallback(canvasId: string, canvasDir: string) {
        let rawManifest: unknown;
        try {
            rawManifest = JSON.parse(await nodeFsPromises.readFile(nodePath.join(canvasDir, CLOUD_CANVAS_MANIFEST_BASENAME), "utf8"));
        }
        catch {
            return this.titleCache.get(canvasId);
        }
        const parsed = parseCloudCanvasManifest(rawManifest);
        const title = parsed.ok ? parsed.value.title : undefined;
        // The read above is unchained: a publish can land (and cache a fresher
        // title) while it is in flight. Prefer whatever is cached by the time
        // the read resolves, and only fill an empty slot — this fallback must
        // never overwrite a title recorded by a successful publish.
        const cached = this.titleCache.get(canvasId);
        if (cached !== undefined) {
            return cached;
        }
        if (title !== undefined) {
            this.titleCache.set(canvasId, title);
        }
        return title;
    }
    async probeFuse(canvasesRoot: string) {
        if (this.fuseKnownAvailable.has(canvasesRoot)) {
            return true;
        }
        const available = await this.isFuseBacked(canvasesRoot).catch(() => false);
        if (available) {
            this.fuseKnownAvailable.add(canvasesRoot);
        }
        return available;
    }
    recordFailure(canvasId: string, detail: string) {
        const clamped = detail.length > SAVE_DETAIL_MAX_CHARS
            ? `${detail.slice(0, SAVE_DETAIL_MAX_CHARS)}… [truncated]`
            : detail;
        this.lastFailureDetail.set(canvasId, clamped);
        logger.warn(this.ctx, "Canvas store publish failed", {
            canvasId,
            detail: clamped,
        });
    }
    takeAcceptTicket(canvasId: string) {
        const ticket = (this.acceptTickets.get(canvasId) ?? 0) + 1;
        this.acceptTickets.set(canvasId, ticket);
        return ticket;
    }
    isStale(canvasId: string, generation: number) {
        return (this.enqueuedGenerations.get(canvasId) ?? 0) > generation;
    }
    async publish(save: ValidatedCanvasSave) {
        const { canvasId, canvasDir, source, bundleBytes, compiledAt, generation } = save;
        if (this.isStale(canvasId, generation)) {
            return;
        }
        // The existing manifest is read only to carry metadata forward
        // (createdAt, title, monotonic updatedAt). Cross-writer content races
        // are last-writer-wins by design.
        const manifestPath = nodePath.join(canvasDir, CLOUD_CANVAS_MANIFEST_BASENAME);
        let rawManifest: unknown;
        try {
            rawManifest = JSON.parse(await nodeFsPromises.readFile(manifestPath, "utf8"));
        }
        catch {
            rawManifest = undefined;
        }
        const parsedExisting = parseCloudCanvasManifest(rawManifest);
        const existing = parsedExisting.ok ? parsedExisting.value : undefined;
        const bundlePath = nodePath.join(canvasDir, CLOUD_CANVAS_BUNDLE_BASENAME);
        try {
            await nodeFsPromises.writeFile(bundlePath, Buffer.from(bundleBytes), {
                mode: 0o666,
            });
        }
        catch (error) {
            this.recordFailure(canvasId, `bundle write failed: ${errorMessage(error)}`);
            return;
        }
        const nowIso = this.now().toISOString();
        const createdAt = existing?.createdAt ?? nowIso;
        let updatedAt = nowIso;
        if (existing !== undefined) {
            const existingUpdatedMs = Date.parse(existing.updatedAt);
            const nowMs = Date.parse(nowIso);
            if (existingUpdatedMs > nowMs && existingUpdatedMs - nowMs <= MAX_MANIFEST_FUTURE_SKEW_MS) {
                updatedAt = existing.updatedAt;
            }
        }
        const pragmaTitle = parseCanvasTitlePragma(source);
        const title = pragmaTitle ?? existing?.title;
        const manifest = {
            version: CLOUD_CANVAS_MANIFEST_VERSION,
            canvasId,
            ...(title !== undefined ? { title } : {}),
            createdAt,
            updatedAt,
            sourceSha256: nodeCrypto.createHash("sha256").update(source, "utf8").digest("hex"),
            compiledAt: compiledAt.toISOString(),
        };
        const manifestText = JSON.stringify(manifest);
        if (!parseCloudCanvasManifest(JSON.parse(manifestText)).ok) {
            this.recordFailure(canvasId, "merged manifest failed shared-schema validation; manifest not written");
            return;
        }
        if (Buffer.byteLength(manifestText, "utf8") > CLOUD_CANVAS_MANIFEST_MAX_BYTES) {
            this.recordFailure(canvasId, `manifest exceeds ${CLOUD_CANVAS_MANIFEST_MAX_BYTES}B; manifest not written`);
            return;
        }
        try {
            await nodeFsPromises.writeFile(manifestPath, manifestText, { mode: 0o666 });
        }
        catch (error) {
            this.recordFailure(canvasId, `manifest write failed: ${errorMessage(error)}`);
            return;
        }
        if (title !== undefined) {
            this.titleCache.set(canvasId, title);
        }
        this.lastFailureDetail.delete(canvasId);
        logger.info(this.ctx, "Persisted store canvas", {
            canvasId,
            canvasesRoot: save.canvasesRoot,
            bundleBytes: bundleBytes.byteLength,
        });
    }
}
export function createCanvasStorePersist(options: CanvasStoreOptions) {
    return new CanvasStorePersist(options);
}
