import { withTimeout, TimeoutError } from "../interop/vendor/utils-promise-extras.js";
import nodeFsPromises from "node:fs/promises";
/**
 * How long a single mount probe may take before the turn stops waiting on it.
 * A FUSE whose server has died can hang path lookup indefinitely, and this
 * probe runs on the way into a turn's request context.
 */
export const AGENT_STORE_SKILLS_MOUNT_PROBE_TIMEOUT_MS = 1000;
/**
 * Skill discovery roots contributed by a mounted Agent Store. The path
 * is supplied by the launcher rather than derived here, since that is what
 * decides the FUSE mount root. Absent means no root, so it fails closed.
 */
export function resolveAgentStoreSkillRoots(agentStoreSkillsDir: string | readonly string[] | undefined) {
    const values = agentStoreSkillsDir === undefined
        ? []
        : typeof agentStoreSkillsDir === "string"
            ? [agentStoreSkillsDir]
            : agentStoreSkillsDir;
    const out: string[] = [];
    const seen = new Set<string>();
    for (const raw of values) {
        const trimmed = raw.trim();
        if (trimmed === "" || seen.has(trimmed)) {
            continue;
        }
        seen.add(trimmed);
        out.push(trimmed);
    }
    return out;
}
export async function probeAgentStoreMount(dir: string): Promise<"mounted" | "absent" | "unresponsive"> {
    try {
        const stats = await withTimeout(nodeFsPromises.stat(dir), AGENT_STORE_SKILLS_MOUNT_PROBE_TIMEOUT_MS);
        return stats.isDirectory() ? "mounted" : "absent";
    }
    catch (error) {
        return error instanceof TimeoutError ? "unresponsive" : "absent";
    }
}
/**
 * Watches for the Agent Store skills roots to appear, and reloads each one the
 * first time it does.
 *
 * The daemon builds its skill list at startup, before the FUSE mount lands,
 * and a directory walk cannot tell "not mounted yet" from "empty" — the walker
 * reads a missing root as no skills — so that first empty answer is what every
 * later turn would serve. Checking here, on the way into each turn's request
 * context, keeps the pod self-healing: whichever turn first sees the mount
 * gets the skills, with no delivery-time orchestration to miss a resume or a
 * daemon restart.
 *
 * A root is probed until it appears and reloaded exactly once. An unmount
 * followed by a remount is not re-detected, the same exposure a pod already
 * has when its FUSE dies mid-session.
 */
export function createAgentStoreSkillsMountLatch(args: {
    roots: readonly string[];
    probeMount?: typeof probeAgentStoreMount;
    reloadRoots(roots: string[]): void;
    onUnresponsive?(root: string): void;
    onReloaded?(roots: string[]): void;
}) {
    const pending = new Set<string>(args.roots);
    if (pending.size === 0) {
        return async () => { };
    }
    const probeMount = args.probeMount ?? probeAgentStoreMount;
    // Turns can overlap, and both would otherwise probe and reload the same
    // root. Sharing the in-flight probe makes the reload happen once.
    let inFlight: Promise<void> | undefined;
    const probePending = async () => {
        const appeared: string[] = [];
        for (const root of [...pending]) {
            const result = await probeMount(root);
            if (result === "mounted") {
                appeared.push(root);
                continue;
            }
            if (result === "unresponsive") {
                // Stop asking. The probe that timed out is still holding a threadpool
                // thread, and a mount this broken will not start answering because we
                // asked again next turn.
                pending.delete(root);
                args.onUnresponsive?.(root);
            }
        }
        if (appeared.length === 0) {
            return;
        }
        for (const root of appeared) {
            pending.delete(root);
        }
        args.reloadRoots(appeared);
        args.onReloaded?.(appeared);
    };
    return async () => {
        if (pending.size === 0) {
            return;
        }
        inFlight ??= probePending().finally(() => {
            inFlight = undefined;
        });
        await inFlight;
    };
}
