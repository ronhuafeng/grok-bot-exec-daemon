import nodeChildProcess from "node:child_process";
import nodeFs from "node:fs";
import nodeOs from "node:os";
import nodePath from "node:path";
import { AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE, AGENT_STORE_FUSE_PID_FILE, AGENT_STORE_FUSE_DISPATCH_WEDGE_REPORT_PATH, AGENT_STORE_FUSE_RELAUNCH_REASON_PATH } from "../interop/vendor/constants-agent-store-fuse.js";
import { AGENT_STORE_MOUNT_ROOT } from "../interop/vendor/constants-agent-store-ids.js";
import { createLogger } from "../interop/vendor/context-logger.js";
import { reportEvent as reportEventDependency, withSpan, getSpan, withInheritableAttribute } from "../interop/vendor/context-otel.js";
import { spawnWorkload } from "../interop/vendor/utils-workload-spawn.js";
import type { Context } from "../interop/contracts/context.js";
import type { AttributeValue } from "../interop/contracts/otel.js";
export interface ProbeProcess {
    pid: number;
    unref(): void;
    onceExit(cb: (code: number | null) => void): void;
    onceError?(cb: (error: Error) => void): void;
}
export interface ScheduledProbe { cancel(): void; }
export interface FuseLivenessHost {
    now(): number;
    schedule(ms: number, fn: () => void): ScheduledProbe;
    spawnProbe(args: { probePath: string; cwd: string }): ProbeProcess;
    readFile(path: string): string | undefined;
    processAlive(pid: number): boolean;
    readCmdline(pid: number): string | undefined;
    kill(pid: number, signal: NodeJS.Signals): void;
    abortConnection(mountRoot: string): void;
    renameFile(from: string, to: string): boolean;
    removeFile(path: string): void;
    safeCwd(): string;
    reportEvent(ctx: Context, event: string): void;
    spanFactory(ctx: Context): Context;
}
export interface FuseLivenessOptions {
    killEnabled?: boolean;
    intervalMs?: number;
    deadlineMs?: number;
    failuresBeforeKill?: number;
    killGraceMs?: number;
    maxParkedProbes?: number;
    host?: FuseLivenessHost;
    mountRoot?: string;
    pidFile?: string;
    dispatchWedgeReportPath?: string;
    relaunchReasonPath?: string;
}

export const logger = createLogger("exec-daemon-fuse-liveness");
export const FUSE_LIVENESS_INTERVAL_MS = 60000;
export const FUSE_LIVENESS_DEADLINE_MS = 15000;
export const FUSE_LIVENESS_FAILURES_BEFORE_KILL = 2;
export const FUSE_LIVENESS_KILL_GRACE_MS = 2000;
export const FUSE_LIVENESS_MAX_PARKED_PROBES = 3;
export const FUSE_LIVENESS_PROBE_FAILED_EVENT = "agent_store_fuse.liveness_probe_failed";
export const FUSE_LIVENESS_UNRESPONSIVE_EVENT = "agent_store_fuse.liveness_unresponsive";
export const FUSE_LIVENESS_KILL_EVENT = "agent_store_fuse.liveness_kill";
export const FUSE_LIVENESS_RELAUNCH_EVENT = "agent_store_fuse.relaunch_after_hung_mount";
export const FUSE_LIVENESS_RELAUNCH_REASON = "unresponsive_mount";
export const FUSE_LIVENESS_VERDICT_SPAN = "agent_store_fuse.liveness_verdict";
export const FUSE_LIVENESS_ATTR_CONSECUTIVE_FAILURES = "fuse_liveness.consecutive_failures";
export const FUSE_LIVENESS_ATTR_PARKED_HELPERS = "fuse_liveness.parked_helpers";
/**
 * `deadline` after a miss crosses the threshold; `parked_cap` on a later
 * kill retry.
 */
export const FUSE_LIVENESS_ATTR_TRIGGER = "fuse_liveness.trigger";
export const FUSE_LIVENESS_ATTR_KILL_ENABLED = "fuse_liveness.kill_enabled";
/** False when the pid file no longer names the process that missed the probes. */
export const FUSE_LIVENESS_ATTR_PID_MATCHED = "fuse_liveness.pid_matched";
export const FUSE_LIVENESS_ATTR_WEDGE_REPORT_PRESENT = "fuse_liveness.wedge_report_present";
export function defaultHost(): FuseLivenessHost {
    return {
        now: () => Date.now(),
        schedule(ms, fn) {
            const handle = setTimeout(fn, ms);
            handle.unref();
            return { cancel: () => clearTimeout(handle) };
        },
        spawnProbe({ probePath, cwd }) {
            // Workload cgroup so a D-state lookup cannot pin the daemon room.
            const child = spawnWorkload(nodeChildProcess.spawn, "/bin/sh", ["-c", 'exec test -e "$1"', "asf-liveness", probePath], {
                detached: true,
                stdio: "ignore",
                cwd,
            });
            child.unref();
            return {
                pid: child.pid ?? -1,
                unref: () => {
                    child.unref();
                },
                onceExit(cb) {
                    if (child.exitCode !== null) {
                        cb(child.exitCode);
                        return;
                    }
                    child.once("exit", (code) => {
                        cb(code);
                    });
                },
                onceError(cb) {
                    child.once("error", (error) => {
                        cb(error);
                    });
                },
            };
        },
        readFile(path) {
            try {
                return nodeFs.readFileSync(path, "utf8");
            }
            catch {
                return undefined;
            }
        },
        processAlive(pid) {
            try {
                process.kill(pid, 0);
                return true;
            }
            catch {
                return false;
            }
        },
        readCmdline(pid) {
            try {
                return nodeFs.readFileSync(`/proc/${pid}/cmdline`, "utf8").replaceAll("\0", " ");
            }
            catch {
                return undefined;
            }
        },
        kill(pid, signal) {
            try {
                process.kill(pid, signal);
            }
            catch {
                // Already gone.
            }
        },
        abortConnection(mountRoot) {
            abortFuseConnection(mountRoot);
        },
        renameFile(from, to) {
            try {
                nodeFs.renameSync(from, to);
                return true;
            }
            catch {
                return false;
            }
        },
        removeFile(path) {
            try {
                nodeFs.unlinkSync(path);
            }
            catch {
                // Missing is fine.
            }
        },
        safeCwd: () => nodeOs.tmpdir(),
        reportEvent: reportEventDependency,
        spanFactory(ctx) {
            return withSpan(ctx);
        },
    };
}
export const MOUNTINFO_UNESCAPE: Readonly<Partial<Record<string, string>>> = {
    "011": "\t",
    "012": "\n",
    "040": " ",
    "134": "\\",
};
/** `mountinfo` octal-escapes space, tab, newline, and backslash in paths. */
export function unescapeMountinfoPath(field: string) {
    return field.replace(/\\(\d{3})/g, (match: string, octal: string) => MOUNTINFO_UNESCAPE[octal] ?? match);
}
/**
 * Newest fuse mount_id's minor for `target`. `target` is already resolved;
 * this only parses text — it does not touch the mount.
 */
export function fuseConnectionMinorFromMountinfo(target: string, mountinfo: string) {
    let bestId = Number.NEGATIVE_INFINITY;
    let minor: string | undefined;
    for (const line of mountinfo.split("\n")) {
        const sep = line.indexOf(" - ");
        if (sep === -1) {
            continue;
        }
        const fsType = line.slice(sep + 3).split(" ")[0] ?? "";
        if (fsType !== "fuse" && !fsType.startsWith("fuse.")) {
            continue;
        }
        const fields = line.slice(0, sep).split(" ");
        const mountId = Number.parseInt(fields[0] ?? "", 10);
        const majMin = fields[2];
        const mountPoint = fields[4];
        if (!Number.isFinite(mountId) || majMin === undefined || mountPoint === undefined) {
            continue;
        }
        if (unescapeMountinfoPath(mountPoint) !== target) {
            continue;
        }
        const thisMinor = majMin.split(":")[1];
        if (thisMinor === undefined || thisMinor === "") {
            continue;
        }
        if (minor === undefined || mountId > bestId) {
            bestId = mountId;
            minor = thisMinor;
        }
    }
    return minor;
}
/**
 * Canonicalize only the mount's parent. Stating `mountRoot` itself is a
 * FUSE request and wedges if the daemon is already hung.
 */
export function resolveMountRootForMountinfo(mountRoot: string) {
    const parent = nodePath.dirname(mountRoot);
    const base = nodePath.basename(mountRoot);
    let canon = parent;
    try {
        canon = nodeFs.realpathSync(parent);
    }
    catch {
        // Parent may not exist in tests; keep the given dirname.
    }
    return nodePath.join(canon, base);
}
export function abortFuseConnection(mountRoot: string) {
    const mountinfoPath = process.env.ASF_FUSE_MOUNTINFO ?? "/proc/self/mountinfo";
    let mountinfo: string;
    try {
        mountinfo = nodeFs.readFileSync(mountinfoPath, "utf8");
    }
    catch {
        return;
    }
    const minor = fuseConnectionMinorFromMountinfo(resolveMountRootForMountinfo(mountRoot), mountinfo);
    if (minor === undefined) {
        return;
    }
    try {
        nodeFs.writeFileSync(`/sys/fs/fuse/connections/${minor}/abort`, "1");
    }
    catch {
        // Best-effort; the signal still ran.
    }
}
export function parsePid(raw: string | undefined) {
    if (raw === undefined) {
        return undefined;
    }
    const pid = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(pid) && pid > 1 ? pid : undefined;
}
export function cmdlineMatches(cmdline: string | undefined) {
    return cmdline?.includes(AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE) === true;
}
/**
 * Periodic mount liveness for the in-pod agent-store FUSE.
 *
 * Each tick spawns a detached `test -e` of a unique missing name from a
 * non-mount cwd. Completing within the deadline (any exit) means the kernel
 * got an answer. A helper still running at the deadline is abandoned — a
 * consumed lookup is uninterruptible, so this process must not `wait` it.
 *
 * After {@link FUSE_LIVENESS_FAILURES_BEFORE_KILL} consecutive abandons the
 * pid that failed those probes is signaled, but only when `killEnabled`, the
 * cmdline still names our binary, and the pid file still names that process.
 * A remount mid-deadline does not inherit the predecessor's kill. Each
 * signal is followed by a sysfs abort so a D-state daemon cannot leave
 * `/dev/fuse` open.
 *
 * The parked cap is the set of abandoned helper pids still running.
 * An on-time success resets the failure streak only — it must not drop
 * those slots, or a later exit of an older helper undercounts live
 * D-state lookups. Remount or a dead pid-file FUSE clears the set.
 *
 * Cap-full is not a kill signal. Leftover D-state helpers from hangs that
 * later recovered can fill the set while the mount is answering again.
 * A kill is retried at the cap only after this FUSE pid already reached
 * the consecutive-failure threshold (`killWarranted`).
 *
 * Each deadline miss, and each kill retry at the parked-helper cap, is
 * exported on its own root span. The context passed to start is not their
 * parent: it has no span, so `reportEvent` would drop them.
 */
export class FuseLivenessMonitor {
    killEnabled;
    intervalMs;
    deadlineMs;
    failuresBeforeKill;
    killGraceMs;
    maxParkedProbes;
    host;
    mountRoot;
    pidFile;
    dispatchWedgeReportPath;
    relaunchReasonPath;
    started = false;
    consecutiveFailures = 0;
    parkedHelperPids = new Set<number>();
    /** True after this FUSE pid reached the consecutive-failure kill threshold. */
    killWarranted = false;
    lastLiveFusePid: number | undefined;
    probeGeneration = 0;
    killInFlight = false;
    pending: ScheduledProbe | undefined;
    killGrace: ScheduledProbe | undefined;
    ctx: Context | undefined;
    constructor(options: FuseLivenessOptions = {}) {
        this.killEnabled = options.killEnabled === true;
        this.intervalMs = options.intervalMs ?? FUSE_LIVENESS_INTERVAL_MS;
        this.deadlineMs = options.deadlineMs ?? FUSE_LIVENESS_DEADLINE_MS;
        this.failuresBeforeKill = options.failuresBeforeKill ?? FUSE_LIVENESS_FAILURES_BEFORE_KILL;
        this.killGraceMs = options.killGraceMs ?? FUSE_LIVENESS_KILL_GRACE_MS;
        this.maxParkedProbes = options.maxParkedProbes ?? FUSE_LIVENESS_MAX_PARKED_PROBES;
        this.host = options.host ?? defaultHost();
        this.mountRoot = options.mountRoot ?? AGENT_STORE_MOUNT_ROOT;
        this.pidFile = options.pidFile ?? AGENT_STORE_FUSE_PID_FILE;
        this.dispatchWedgeReportPath =
            options.dispatchWedgeReportPath ?? AGENT_STORE_FUSE_DISPATCH_WEDGE_REPORT_PATH;
        this.relaunchReasonPath = options.relaunchReasonPath ?? AGENT_STORE_FUSE_RELAUNCH_REASON_PATH;
    }
    get isRunning() {
        return this.started;
    }
    get consecutiveFailureCount() {
        return this.consecutiveFailures;
    }
    start(ctx: Context) {
        if (this.started) {
            return;
        }
        this.started = true;
        this.ctx = ctx;
        this.consumeRelaunchReason(ctx);
        this.arm(0, () => this.tick());
    }
    reportRelaunchReason(ctx: Context) {
        this.consumeRelaunchReason(ctx);
    }
    consumeRelaunchReason(ctx: Context) {
        // reportEvent no-ops without a parent span. Claim only when the event
        // can ship, so start/tick with a span-less global context cannot delete
        // the marker before a later ping reports it.
        if (getSpan(ctx) === undefined) {
            return;
        }
        const claimPath = `${this.relaunchReasonPath}.reporting`;
        if (!this.host.renameFile(this.relaunchReasonPath, claimPath)) {
            return;
        }
        const reason = this.host.readFile(claimPath)?.trim() ?? "";
        if (reason === FUSE_LIVENESS_RELAUNCH_REASON) {
            logger.info(ctx, "FUSE was relaunched after an unresponsive mount", {
                reason,
            });
            this.host.reportEvent(ctx, FUSE_LIVENESS_RELAUNCH_EVENT);
        }
        else if (reason.length > 0) {
            logger.warn(ctx, "Ignoring unknown FUSE relaunch reason", {
                reasonLength: reason.length,
            });
        }
        this.host.removeFile(claimPath);
    }
    stop() {
        this.started = false;
        this.probeGeneration += 1;
        this.pending?.cancel();
        this.pending = undefined;
        this.killGrace?.cancel();
        this.killGrace = undefined;
        this.killInFlight = false;
    }
    arm(ms: number, fn: () => void) {
        this.pending?.cancel();
        this.pending = this.host.schedule(ms, fn);
    }
    liveFusePid() {
        const pid = parsePid(this.host.readFile(this.pidFile));
        if (pid === undefined || !this.host.processAlive(pid)) {
            return undefined;
        }
        if (!cmdlineMatches(this.host.readCmdline(pid))) {
            return undefined;
        }
        return pid;
    }
    tick() {
        const ctx = this.ctx;
        if (!this.started || ctx === undefined) {
            return;
        }
        this.consumeRelaunchReason(ctx);
        const pid = this.liveFusePid();
        if (pid === undefined) {
            this.consecutiveFailures = 0;
            this.parkedHelperPids.clear();
            this.killWarranted = false;
            this.lastLiveFusePid = undefined;
            this.arm(this.intervalMs, () => this.tick());
            return;
        }
        if (this.lastLiveFusePid !== undefined && this.lastLiveFusePid !== pid) {
            // Supervised remount rewrote the pid file. Abandoned helpers belong
            // to the previous FUSE and must not latch the probe cap.
            this.consecutiveFailures = 0;
            this.parkedHelperPids.clear();
            this.killWarranted = false;
        }
        this.lastLiveFusePid = pid;
        if (this.parkedHelperPids.size >= this.maxParkedProbes) {
            logger.warn(ctx, "FUSE liveness parked-helper cap reached; skipping spawn", {
                parkedHelpers: this.parkedHelperPids.size,
            });
            // Cap skips new lookups. Retry the kill only if this pid already
            // crossed the consecutive-failure threshold — leftover parked
            // helpers after mixed recoveries are not themselves a kill signal.
            if (this.killEnabled && this.killWarranted && !this.killInFlight) {
                this.withVerdictSpan(ctx, (verdictCtx) => {
                    this.maybeKill(verdictCtx, pid, "parked_cap");
                });
            }
            this.arm(this.intervalMs, () => this.tick());
            return;
        }
        const probePath = `${this.mountRoot}/.cursor-liveness-${process.pid}-${this.host.now()}`;
        let child: ProbeProcess;
        try {
            child = this.host.spawnProbe({
                probePath,
                cwd: this.host.safeCwd(),
            });
        }
        catch (error) {
            logger.warn(ctx, "FUSE liveness helper failed to spawn", { error });
            this.arm(this.intervalMs, () => this.tick());
            return;
        }
        if (child.pid < 2) {
            logger.warn(ctx, "FUSE liveness helper spawned without a pid");
            this.arm(this.intervalMs, () => this.tick());
            return;
        }
        child.unref();
        const generation = ++this.probeGeneration;
        let finished = false;
        const abandonWithoutFailure = () => {
            if (generation !== this.probeGeneration || finished) {
                return;
            }
            finished = true;
            this.arm(this.intervalMs, () => this.tick());
        };
        child.onceError?.(abandonWithoutFailure);
        child.onceExit(() => {
            if (this.parkedHelperPids.delete(child.pid)) {
                // This helper was abandoned. Free only its own slot.
                return;
            }
            if (generation !== this.probeGeneration || finished) {
                return;
            }
            finished = true;
            this.consecutiveFailures = 0;
            this.arm(this.intervalMs, () => this.tick());
        });
        this.arm(this.deadlineMs, () => {
            if (generation !== this.probeGeneration || finished) {
                return;
            }
            finished = true;
            // Drop this helper: a consumed lookup will not die on SIGKILL.
            this.probeGeneration += 1;
            const currentPid = this.liveFusePid();
            if (currentPid !== undefined && currentPid !== pid) {
                // Supervised remount during this deadline. The hung helper is
                // not evidence against the new pid-file process.
                this.consecutiveFailures = 0;
                this.parkedHelperPids.clear();
                this.killWarranted = false;
                this.lastLiveFusePid = currentPid;
                this.arm(this.intervalMs, () => this.tick());
                return;
            }
            this.consecutiveFailures += 1;
            this.parkedHelperPids.add(child.pid);
            logger.warn(ctx, "FUSE liveness helper still running at deadline", {
                consecutiveFailures: this.consecutiveFailures,
                parkedHelpers: this.parkedHelperPids.size,
                helperPid: child.pid,
            });
            this.withVerdictSpan(ctx, (verdictCtx) => {
                const missCtx = withAttributes(verdictCtx, {
                    [FUSE_LIVENESS_ATTR_CONSECUTIVE_FAILURES]: this.consecutiveFailures,
                    [FUSE_LIVENESS_ATTR_PARKED_HELPERS]: this.parkedHelperPids.size,
                });
                this.host.reportEvent(missCtx, FUSE_LIVENESS_PROBE_FAILED_EVENT);
                if (this.consecutiveFailures >= this.failuresBeforeKill) {
                    this.killWarranted = true;
                    this.maybeKill(missCtx, pid, "deadline");
                    this.consecutiveFailures = 0;
                }
            });
            this.arm(this.intervalMs, () => this.tick());
        });
    }
    maybeKill(verdictCtx: Context, targetPid: number, trigger: "parked_cap" | "deadline") {
        if (this.killInFlight) {
            return;
        }
        const pid = this.liveFusePid();
        const wedgeReport = this.host.readFile(this.dispatchWedgeReportPath);
        const attributes = {
            [FUSE_LIVENESS_ATTR_TRIGGER]: trigger,
            [FUSE_LIVENESS_ATTR_KILL_ENABLED]: this.killEnabled,
            [FUSE_LIVENESS_ATTR_PID_MATCHED]: pid === targetPid,
            [FUSE_LIVENESS_ATTR_WEDGE_REPORT_PRESENT]: wedgeReport !== undefined,
            [FUSE_LIVENESS_ATTR_PARKED_HELPERS]: this.parkedHelperPids.size,
        };
        if (pid !== targetPid) {
            logger.warn(verdictCtx, "FUSE liveness threshold reached but pid is not ours", {
                wedgeReport,
            });
            if (pid === undefined) {
                this.host.reportEvent(withAttributes(verdictCtx, attributes), FUSE_LIVENESS_UNRESPONSIVE_EVENT);
            }
            return;
        }
        const ctx = withAttributes(verdictCtx, attributes);
        logger.warn(ctx, "FUSE liveness threshold reached", {
            pid,
            killEnabled: this.killEnabled,
            wedgeReport,
        });
        this.host.reportEvent(ctx, FUSE_LIVENESS_UNRESPONSIVE_EVENT);
        if (!this.killEnabled) {
            return;
        }
        this.host.reportEvent(ctx, FUSE_LIVENESS_KILL_EVENT);
        this.killInFlight = true;
        this.host.kill(pid, "SIGTERM");
        this.host.abortConnection(this.mountRoot);
        this.killGrace?.cancel();
        this.killGrace = this.host.schedule(this.killGraceMs, () => {
            // Re-read the pid file: abortConnection targets the newest mount at
            // mountRoot, so a remount in this window must not get a second abort.
            if (this.liveFusePid() === pid) {
                this.host.kill(pid, "SIGKILL");
                this.host.abortConnection(this.mountRoot);
            }
            this.killInFlight = false;
            this.killGrace = undefined;
        });
    }
    withVerdictSpan(ctx: Context, fn: (ctx: Context) => void) {
        const spanned = this.host.spanFactory(ctx.withName(FUSE_LIVENESS_VERDICT_SPAN));
        try {
            fn(spanned);
        }
        finally {
            getSpan(spanned)?.end();
        }
    }
}
export function withAttributes(ctx: Context, attributes: Readonly<Record<string, AttributeValue>>) {
    let next = ctx;
    for (const [key, value] of Object.entries(attributes)) {
        next = withInheritableAttribute(next, key, value);
    }
    return next;
}
