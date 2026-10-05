import nodeFs from "node:fs";
import nodePath from "node:path";
import { createLogger } from "../interop/vendor/context-logger.js";
import { getBuiltinSkillsDir } from "../interop/vendor/local-exec.js";
import nodeUrl from "node:url";
import { createCanvasDiagnosticsProvider } from "../interop/vendor/canvas-server-canvas-diagnostics-provider.js";
import { resolveCanvasRuntimeDir, isPathInsideDir, persistCanvasShareBundle } from "./canvasShareBundle.js";
import { CANVAS_STORE_PERSIST_ROOTS } from "../interop/vendor/constants-agent-store-ids.js";
import { createCanvasStorePersist } from "./canvasStorePersist.js";
import { runtimeRoot } from "./runtime-location.js";
import { getProjectDir, ensureCanvasSkillSdkMirror } from "../interop/vendor/setup-private.js";
import type { Context } from "../interop/contracts/context.js";
export interface CanvasDiagnosticsOptions { ctx: Context; workspacePath: string; artifactsRoot?: string; enableStoreCanvasPersist?: boolean; }

export const logger = createLogger("exec-daemon:canvas");
/** Resolve assets from the installed root, independent of this module or cwd. */
export function resolveExecDaemonRuntimeDir(): string { return runtimeRoot; }
/** Locate the staged canvas SDK tree (`cursor/`, `@types/react/`, version marker). */
export function resolveCanvasSdkSourceDir(here = resolveExecDaemonRuntimeDir()) {
    const candidates = [nodePath.join(here, "agent-sdk")];
    return candidates.find((dir) => nodeFs.existsSync(nodePath.join(dir, "cursor")));
}
/**
 * Best-effort canvas diagnostics + skill SDK mirror for cloud/private-worker
 * exec-daemon. Missing SDK assets disable diagnostics; they do not fail setup.
 */
export function setupExecDaemonCanvasDiagnostics(args: CanvasDiagnosticsOptions) {
    const runtimeDir = resolveExecDaemonRuntimeDir();
    const sdkSourceDir = resolveCanvasSdkSourceDir(runtimeDir);
    if (sdkSourceDir === undefined) {
        logger.warn(args.ctx, "Canvas SDK source missing; skipping canvas diagnostics");
        return undefined;
    }
    const canvasesDir = nodePath.join(getProjectDir(args.workspacePath), "canvases");
    const skillDir = nodePath.join(getBuiltinSkillsDir(), "canvas");
    const remirrorSkillSdk = async () => {
        try {
            await ensureCanvasSkillSdkMirror({ sdkSourceDir, skillDir });
        }
        catch (error) {
            logger.warn(args.ctx, "Canvas skill SDK mirror failed", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };
    void remirrorSkillSdk();
    const enableStoreCanvasPersist = args.enableStoreCanvasPersist === true;
    const provider = createCanvasDiagnosticsProvider({
        canvasesDir,
        sdkSourceDir,
        // Unbundled: exec-daemon/src walks up to packages/exec-daemon/node_modules/typescript.
        // Packaged: build-package.ts copies typescript next to the bundle as node_modules/typescript.
        tsResolveAnchor: runtimeDir,
        extraMatchRoot: enableStoreCanvasPersist ? CANVAS_STORE_PERSIST_ROOTS : undefined,
    });
    void provider.bootstrapReady.then((result) => {
        if (result === undefined) {
            logger.error(args.ctx, "Canvas SDK source missing from exec-daemon bundle");
        }
        else {
            logger.info(args.ctx, "Canvas diagnostics provider ready");
        }
    }, (error: unknown) => {
        logger.warn(args.ctx, "Canvas dir bootstrap failed", {
            error: error instanceof Error ? error.message : String(error),
        });
    });
    // Search next to the packaged index.js first — same dir as agent-sdk/.
    const canvasRuntimeDir = resolveCanvasRuntimeDir(runtimeDir);
    const artifactsRoot = args.artifactsRoot;
    const getCanvasDiagnostics = (filePath: string) => {
        // Preview compile must not sit on the diagnostics RPC (the agent races
        // it against a timeout). Kick the agent-store write in parallel; portal
        // shows the artifact once FUSE has the gzip.
        if (artifactsRoot !== undefined &&
            artifactsRoot.length > 0 &&
            isPathInsideDir({ filePath, dir: canvasesDir })) {
            void persistCanvasShareBundle({
                ctx: args.ctx,
                canvasPath: filePath,
                artifactsRoot,
                runtimeDir: canvasRuntimeDir,
            });
        }
        return provider.getDiagnostics(filePath);
    };
    if (!enableStoreCanvasPersist) {
        return {
            getCanvasDiagnostics,
            remirrorSkillSdk,
        };
    }
    const storePersist = createCanvasStorePersist({
        ctx: args.ctx,
        runtimeDir: canvasRuntimeDir,
    });
    return {
        getCanvasDiagnostics,
        remirrorSkillSdk,
        beginCanvasSave: storePersist.beginCanvasSave,
    };
}
