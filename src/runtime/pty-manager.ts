import nodeFs from "node:fs";
import nodePath from "node:path";
import { createLogger } from "../interop/vendor/context-logger.js";
import { spawnWorkload } from "../interop/vendor/utils-workload-spawn.js";
import { spawn as spawnDependency } from "../interop/vendor/node-pty.js";
import { RingBuffer as RingBufferDependency } from "./ring-buffer.js";
import { resolveUnbundledPtyModule } from "../interop/vendor/pty-package-resolution.js";
import type { Context } from "../interop/contracts/context.js";
import type { Pty } from "../interop/contracts/pty.js";
import type { RingBuffer } from "./ring-buffer.js";
import type { PtyHostEvent, PtyHostManagerPort } from "./pty-host-server.js";
export interface PtyInstance {
    id: string;
    pty: Pty;
    shell: string;
    args: string[];
    cwd: string;
    cols: number;
    rows: number;
    eventListeners: Set<(event: PtyHostEvent) => void>;
    eventHistory: RingBuffer<PtyHostEvent>;
    nextEventId: number;
}
export interface PtySpawnHelperOptions {
    platform?: string;
    existsSync?: (path: string) => boolean;
    execPath?: string;
    argv1?: string;
    resolveFromNodeModules?: () => string;
}

export const UNUSED_SPAWN_HELPER_PATH = "spawn-helper-unused";
/** argv[1] is a script path, not a Commander operand like `worker` or `start`. */
export function isScriptPath(value: string | undefined): value is string {
    if (value === undefined || value.length === 0) {
        return false;
    }
    if (nodePath.isAbsolute(value)) {
        return true;
    }
    return value.includes("/") || value.includes("\\") || /\.[cm]?js$/.test(value);
}
export function resolveSpawnHelperFromNodeModules() {
    const platformArch = `${"linux"}-${"x64"}`;
    const modulePath = `@lydell/node-pty-${platformArch}/spawn-helper`;
    return resolveUnbundledPtyModule(modulePath);
}
/**
 * Resolve macOS node-pty `spawn-helper`. Prefer a colocated binary next to
 * `process.execPath` (packaged CLI / worker SEA). `createRequire` is only
 * the unbundled-dev fallback — the worker SEA's node:module facade throws.
 */
export function resolvePtySpawnHelperPath(options: PtySpawnHelperOptions = {}) {
    const platform = options.platform ?? "linux";
    if (platform !== "darwin") {
        return UNUSED_SPAWN_HELPER_PATH;
    }
    const exists = options.existsSync ?? nodeFs.existsSync;
    const execPath = options.execPath ?? process.execPath;
    const argv1 = options.argv1 ?? process.argv[1];
    const candidates = [nodePath.join(nodePath.dirname(execPath), "spawn-helper")];
    if (isScriptPath(argv1)) {
        const nextToScript = nodePath.join(nodePath.dirname(nodePath.resolve(argv1)), "spawn-helper");
        if (!candidates.includes(nextToScript)) {
            candidates.push(nextToScript);
        }
    }
    for (const candidate of candidates) {
        if (exists(candidate)) {
            return candidate;
        }
    }
    return (options.resolveFromNodeModules ?? resolveSpawnHelperFromNodeModules)();
}
export function getSpawnHelperPath() {
    return resolvePtySpawnHelperPath();
}
export const logger = createLogger("pty-manager");
// Maximum number of events to keep in history per PTY instance
// This prevents unbounded memory growth for long-running PTYs
export const MAX_EVENT_HISTORY = 1000;
export const UTF8_LOCALE_ENV = {
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    LC_CTYPE: "C.UTF-8",
};
export function toPtyDataBuffer(data: Buffer | string) {
    return Buffer.isBuffer(data) ? Buffer.from(data) : Buffer.from(data, "utf-8");
}
/**
 * Gets the default shell for the current environment
 */
export function getDefaultShell() {
    if (false) // removed by dead control flow
     { }
    const configuredShell = process.env.SHELL?.trim();
    if (configuredShell && (!nodePath.isAbsolute(configuredShell) || nodeFs.existsSync(configuredShell))) {
        return configuredShell;
    }
    // Cloud agent environments standardize on bash. Falling back to /bin/sh can
    // produce a blank prompt when PS1 is unset, which makes the web terminal look broken.
    if (nodeFs.existsSync("/bin/bash")) {
        return "/bin/bash";
    }
    return "/bin/sh";
}
/**
 * Manages PTY instances for the exec daemon
 */
export class PtyManager implements PtyHostManagerPort {
    ctx;
    maxEventHistory;
    ptys = new Map<string, PtyInstance>();
    nextId = 1;
    constructor(ctx: Context, maxEventHistory = MAX_EVENT_HISTORY) {
        this.ctx = ctx;
        this.maxEventHistory = maxEventHistory;
    }
    /**
     * Spawns a new PTY instance
     */
    spawn(options: Parameters<PtyHostManagerPort["spawn"]>[0]) {
        const id = `pty-${this.nextId++}`;
        const shell = options.process?.shell ?? getDefaultShell();
        const args = options.process?.args ?? [];
        // Default to process.cwd() if cwd is not provided (should be /workspace in cloud agent environment)
        const cwd = options.cwd || process.cwd();
        logger.info(this.ctx, "Spawning PTY", {
            id,
            shell,
            cwd,
            cols: options.cols,
            rows: options.rows,
        });
        const ptyProcess = spawnWorkload(spawnDependency, shell, args, {
            // The patched @lydell/node-pty requires helperPath to be passed explicitly
            ["helperPath"]: getSpawnHelperPath(),
            name: "xterm-256color",
            cols: options.cols,
            rows: options.rows,
            cwd,
            encoding: null,
            env: {
                ...process.env,
                ...UTF8_LOCALE_ENV,
                ...options.env,
            },
        });
        const instance: PtyInstance = {
            id,
            pty: ptyProcess,
            shell,
            args,
            cwd,
            cols: options.cols,
            rows: options.rows,
            eventListeners: new Set<(event: PtyHostEvent) => void>(),
            eventHistory: new RingBufferDependency<PtyHostEvent>(this.maxEventHistory),
            nextEventId: 1,
        };
        // Set up event handlers
        const onData = ptyProcess.onData;
        onData((data) => {
            const event: PtyHostEvent = {
                eventId: `${id}-${instance.nextEventId++}`,
                data: { type: "data", data: toPtyDataBuffer(data) },
            };
            instance.eventHistory.push(event);
            this.notifyListeners(instance, event);
        });
        ptyProcess.onExit((exitInfo) => {
            const event: PtyHostEvent = {
                eventId: `${id}-${instance.nextEventId++}`,
                data: {
                    type: "exit",
                    exitCode: exitInfo.exitCode,
                    signal: exitInfo.signal,
                },
            };
            instance.eventHistory.push(event);
            this.notifyListeners(instance, event);
            logger.info(this.ctx, "PTY exited", {
                id,
                exitCode: exitInfo.exitCode,
                signal: exitInfo.signal,
            });
            // Clean up after a short delay to allow clients to receive the exit event
            setTimeout(() => {
                this.ptys.delete(id);
            }, 5000);
        });
        this.ptys.set(id, instance);
        return id;
    }
    /**
     * Gets a PTY instance by ID
     */
    get(id: string) {
        return this.ptys.get(id);
    }
    /**
     * Attaches to a PTY instance and returns historical events.
     * The provided listener is registered atomically with capturing historical events,
     * ensuring no events are lost between the snapshot and listener registration.
     *
     * @param id - The PTY instance ID
     * @param listener - Callback for new events (registered immediately)
     * @param lastEventId - Optional event ID to resume from
     * @returns Historical events, or undefined if PTY not found
     */
    attach(id: string, listener: (event: PtyHostEvent) => void, lastEventId?: string) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return undefined;
        }
        // Register the listener BEFORE capturing historical events.
        // This ensures any events arriving after this point go to the listener,
        // while events before this point are in the historical snapshot.
        instance.eventListeners.add(listener);
        // Get historical events
        let events: PtyHostEvent[];
        if (lastEventId) {
            // Find events after the specified event ID
            events = instance.eventHistory.sliceAfter((e) => e.eventId === lastEventId);
        }
        else {
            // Get all events
            events = instance.eventHistory.toArray();
        }
        return { events };
    }
    /**
     * Detaches a listener from a PTY instance
     */
    detach(id: string, listener: (event: PtyHostEvent) => void) {
        const instance = this.ptys.get(id);
        if (instance) {
            instance.eventListeners.delete(listener);
        }
    }
    /**
     * Sends input to a PTY instance
     */
    sendInput(id: string, data: Buffer) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return false;
        }
        instance.pty.write(data.toString("utf-8"));
        return true;
    }
    /**
     * Resizes a PTY instance
     */
    resize(id: string, cols: number, rows: number) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return false;
        }
        instance.pty.resize(cols, rows);
        instance.cols = cols;
        instance.rows = rows;
        logger.debug(this.ctx, "PTY resized", { id, cols, rows });
        return true;
    }
    /**
     * Lists all active PTY instances
     */
    list() {
        return Array.from(this.ptys.values()).map((instance) => ({
            id: instance.id,
            shell: instance.shell,
            args: instance.args,
            cwd: instance.cwd,
            cols: instance.cols,
            rows: instance.rows,
            pid: instance.pty.pid,
        }));
    }
    /**
     * Terminates a PTY instance
     */
    terminate(id: string) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return false;
        }
        logger.info(this.ctx, "Terminating PTY", { id });
        instance.pty.kill();
        this.ptys.delete(id);
        return true;
    }
    /**
     * Notifies all listeners of a new event
     */
    notifyListeners(instance: PtyInstance, event: PtyHostEvent) {
        for (const listener of instance.eventListeners) {
            try {
                listener(event);
            }
            catch (error) {
                logger.error(this.ctx, "Error notifying PTY listener", {
                    id: instance.id,
                    error,
                });
            }
        }
    }
    /**
     * Disposes all PTY instances
     */
    dispose() {
        logger.info(this.ctx, "Disposing all PTY instances", {
            count: this.ptys.size,
        });
        for (const instance of this.ptys.values()) {
            try {
                const pid = instance.pty.pid;
                try {
                    instance.pty.kill();
                }
                finally {
                    // pty.kill() signals only the leader. Descendants stay in the
                    // session process group, so signal that group too. Never -1 or 0.
                    if (pid > 1) {
                        try {
                            process.kill(-pid, "SIGTERM");
                        }
                        catch (error) {
                            if (!(error instanceof Error && "code" in error && error.code === "ESRCH")) {
                                throw error;
                            }
                        }
                    }
                }
            }
            catch (error) {
                logger.error(this.ctx, "Error killing PTY during disposal", {
                    id: instance.id,
                    error,
                });
            }
        }
        this.ptys.clear();
    }
}
