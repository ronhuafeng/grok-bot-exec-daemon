import nodeFsPromises from "node:fs/promises";
import { isAgentStoreFuseBackedPath } from "./artifactUploads.js";
export const CURSOR_CONVERSATION_ID_ENV = "CURSOR_CONVERSATION_ID";
/**
 * Keep in sync with `AGENT_STORE_MOUNT_ROOT` /
 * `AGENT_STORE_SELF_MOUNT_NAME` / `isAgentStoreSourceId` in
 * `packages/constants/src/agent-store-ids.ts`. Duplicated so the published
 * daemon bundle does not take a runtime `@anysphere/constants` dependency.
 */
export const AGENT_STORE_MOUNT_ROOT = "/cursor/stores";
export const AGENT_STORE_SELF_MOUNT_NAME = "self";
export const CLOUD_AGENT_STORE_ID_PATTERN = /^bc-(?:[0-9a-z][0-9a-z-]*-)?[0-9a-f]{8}-[0-9a-f]{4}-[1-57][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const BARE_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-57][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isCanvasPreviewStoreSourceId(sourceId: string) {
    return CLOUD_AGENT_STORE_ID_PATTERN.test(sourceId) || BARE_UUID_PATTERN.test(sourceId);
}
export function normalizeAbsolutePath(value: string) {
    return value.replace(/\\/g, "/").replace(/\/+$/, "");
}
/**
 * Persist destination for VM-built canvas preview gzips.
 *
 * When the current conversation's store is on `fuse.agent-store`, write under
 * that store's `artifacts/` directory (the real `/cursor/stores/<id>/artifacts`
 * path, not `/opt/cursor/artifacts` or `/cursor/stores/self`). Private workers
 * and pods without FUSE keep `fallbackArtifactsRoot`.
 */
export async function resolveCanvasPreviewPersistArtifactsRoot(args: {
    fallbackArtifactsRoot: string;
    agentStoreMountRoot?: string;
    conversationId?: string;
    isFuseBacked?: (path: string) => Promise<boolean>;
    realpath?: (path: string) => Promise<string>;
}) {
    const mountRoot = normalizeAbsolutePath(args.agentStoreMountRoot ?? AGENT_STORE_MOUNT_ROOT);
    const isFuseBacked = args.isFuseBacked ?? isAgentStoreFuseBackedPath;
    const realpath = args.realpath ?? ((p: string) => nodeFsPromises.realpath(p));
    const conversationId = (args.conversationId ??
        process.env[CURSOR_CONVERSATION_ID_ENV] ??
        "").trim();
    if (isCanvasPreviewStoreSourceId(conversationId)) {
        const storeArtifacts = `${mountRoot}/${conversationId}/artifacts`;
        if (await isFuseBacked(storeArtifacts)) {
            return storeArtifacts;
        }
    }
    const selfArtifacts = `${mountRoot}/${AGENT_STORE_SELF_MOUNT_NAME}/artifacts`;
    try {
        const resolved = normalizeAbsolutePath(await realpath(selfArtifacts));
        const prefix = `${mountRoot}/`;
        if (!resolved.startsWith(prefix)) {
            return args.fallbackArtifactsRoot;
        }
        const mountKey = resolved.slice(prefix.length).split("/")[0];
        if (mountKey !== undefined &&
            isCanvasPreviewStoreSourceId(mountKey) &&
            (await isFuseBacked(resolved))) {
            return resolved;
        }
    }
    catch {
        // `/cursor/stores/self` is a convenience alias and is often missing.
    }
    return args.fallbackArtifactsRoot;
}
