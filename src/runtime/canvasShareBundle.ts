import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodePath from "node:path";
import { createLogger } from "../interop/vendor/context-logger.js";
import nodeFsPromises from "node:fs/promises";
import nodeUrl from "node:url";
import { canvasSourceBasenameToShareBundleFileName, agentCanvasPreviewPrefix, isCanvasShareBundleFileName, canvasShareBundleFileNameToSourceBasename } from "../interop/vendor/canvas-shared-canvas-share-bundle.js";
import { runtimeRoot } from "./runtime-location.js";
import type { Context } from "../interop/contracts/context.js";
export type CanvasArtifactBuilder = (args: { source: string; canvasPath: string; runtimeDir?: string }) => Promise<{ appJs: Uint8Array }>;
export interface CanvasShareOptions { ctx: Context; canvasPath: string; artifactsRoot: string; runtimeDir?: string; buildArtifact?: CanvasArtifactBuilder; }

export const logger = createLogger("exec-daemon:canvas-share-bundle");
/** Per dest-path generation so a slower older compile cannot overwrite a newer gzip. */
export const persistGenerations = new Map<string, number>();
export const RUNTIME_FILENAME = "canvas-runtime.esm.js";
/** Resolve assets from the installed root, independent of this module or cwd. */
export function moduleDirname(): string { return runtimeRoot; }
/** True when `filePath` is the directory or a descendant (no `..` escape). */
export function isPathInsideDir(args: { filePath: string; dir: string }) {
    const resolvedFile = nodePath.resolve(args.filePath);
    const resolvedDir = nodePath.resolve(args.dir);
    return resolvedFile === resolvedDir || resolvedFile.startsWith(resolvedDir + (nodePath).sep);
}
/** Locate the packaged canvas runtime ESM used to lock the preview environment. */
export function resolveCanvasRuntimeDir(here = moduleDirname()) {
    const candidates = [nodePath.join(here, "canvas-runtime")];
    try {
        const require = /* createRequire() */ undefined;
        const canvasServerEntry = /*require.resolve*/ ("../canvas-server/dist/index.js?8178");
        candidates.push(nodePath.join(nodePath.dirname(canvasServerEntry), "runtime"));
    }
    catch {
        // Bundled hosts copy the runtime next to the daemon instead.
    }
    return candidates.find((dir) => nodeFs.existsSync(nodePath.join(dir, RUNTIME_FILENAME)));
}
export function canvasShareBundleArtifactAbsolutePath(args: { canvasPath: string; artifactsRoot: string }) {
    const bundleFileName = canvasSourceBasenameToShareBundleFileName(nodePath.basename(args.canvasPath));
    if (bundleFileName === undefined) {
        return undefined;
    }
    return `${agentCanvasPreviewPrefix(args.artifactsRoot)}${bundleFileName}`;
}
export function canvasShareBundleDestDir(artifactsRoot: string) {
    return agentCanvasPreviewPrefix(artifactsRoot).slice(0, -1);
}
export function isNotFoundError(error: unknown) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT");
}
export async function removeFileIfPresent(filePath: string) {
    try {
        await nodeFsPromises.unlink(filePath);
    }
    catch (error) {
        if (!isNotFoundError(error)) {
            throw error;
        }
    }
}
/**
 * Drop preview gzips whose matching `.canvas.tsx` is gone (delete / rename).
 * Compile failures must not call this for the current dest — last-good stays.
 */
export async function removeStaleCanvasShareBundles(args: { canvasesDir: string; artifactsRoot: string }) {
    const destDir = canvasShareBundleDestDir(args.artifactsRoot);
    let names: string[];
    try {
        names = await nodeFsPromises.readdir(destDir);
    }
    catch (error) {
        if (isNotFoundError(error)) {
            return;
        }
        throw error;
    }
    await Promise.all(names.map(async (name) => {
        if (!isCanvasShareBundleFileName(name)) {
            return;
        }
        const sourceBasename = canvasShareBundleFileNameToSourceBasename(name);
        if (sourceBasename === undefined) {
            return;
        }
        const sourcePath = nodePath.join(args.canvasesDir, sourceBasename);
        try {
            await nodeFsPromises.access(sourcePath);
        }
        catch (error) {
            if (isNotFoundError(error)) {
                await removeFileIfPresent(nodePath.join(destDir, name));
            }
        }
    }));
}
/**
 * Compile a managed `.canvas.tsx` into the gzip v1 share bundle and write it
 * under the artifacts root (`canvases/<name>.canvas.bundle.gz`). On FUSE pods
 * that root is the current agent's store artifacts dir, so the write is the
 * persist. Best-effort: missing runtime or compile errors skip the write.
 */
export async function persistCanvasShareBundle(args: CanvasShareOptions) {
    const destPath = canvasShareBundleArtifactAbsolutePath({
        canvasPath: args.canvasPath,
        artifactsRoot: args.artifactsRoot,
    });
    if (destPath === undefined) {
        return undefined;
    }
    const generation = (persistGenerations.get(destPath) ?? 0) + 1;
    persistGenerations.set(destPath, generation);
    const runtimeDir = args.runtimeDir ?? resolveCanvasRuntimeDir();
    if (args.buildArtifact === undefined && runtimeDir === undefined) {
        logger.warn(args.ctx, "Canvas runtime ESM missing; skipping share-bundle persist");
        return undefined;
    }
    const canvasesDir = nodePath.dirname(args.canvasPath);
    let source: string;
    try {
        source = await nodeFsPromises.readFile(args.canvasPath, "utf8");
    }
    catch (error) {
        if (isNotFoundError(error)) {
            await removeFileIfPresent(destPath);
            await removeStaleCanvasShareBundles({
                canvasesDir,
                artifactsRoot: args.artifactsRoot,
            });
            return undefined;
        }
        logger.warn(args.ctx, "Failed to read canvas source for share bundle", {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
    if (source.trim() === "") {
        await removeFileIfPresent(destPath);
        return undefined;
    }
    let appJs: Uint8Array;
    try {
        const buildArtifact = args.buildArtifact ??
            (await import("../interop/vendor/canvas-server-canvas-share-artifact.js"))
                .buildCanvasShareArtifactFromSource;
        const artifact = await buildArtifact({
            source,
            canvasPath: args.canvasPath,
            runtimeDir,
        });
        appJs = artifact.appJs;
    }
    catch (error) {
        logger.warn(args.ctx, "Canvas share-bundle compile failed", {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
    if (persistGenerations.get(destPath) !== generation) {
        return undefined;
    }
    const destDir = nodePath.dirname(destPath);
    const tempPath = nodePath.join(destDir, `.${nodePath.basename(destPath)}.${nodeCrypto.randomUUID()}.tmp`);
    try {
        await nodeFsPromises.mkdir(destDir, { recursive: true });
        await nodeFsPromises.writeFile(tempPath, Buffer.from(appJs));
        if (persistGenerations.get(destPath) !== generation) {
            try {
                await nodeFsPromises.unlink(tempPath);
            }
            catch {
                // Best-effort cleanup of the superseded temp file.
            }
            return undefined;
        }
        await nodeFsPromises.rename(tempPath, destPath);
    }
    catch (error) {
        try {
            await nodeFsPromises.unlink(tempPath);
        }
        catch {
            // Best-effort cleanup of the temp file.
        }
        logger.warn(args.ctx, "Failed to persist canvas share bundle", {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
    try {
        await removeStaleCanvasShareBundles({
            canvasesDir,
            artifactsRoot: args.artifactsRoot,
        });
    }
    catch (error) {
        logger.warn(args.ctx, "Failed to remove stale canvas share bundles", {
            error: error instanceof Error ? error.message : String(error),
        });
    }
    logger.info(args.ctx, "Persisted canvas share bundle", {
        artifactName: nodePath.basename(destPath),
        bytes: appJs.byteLength,
    });
    return destPath;
}
