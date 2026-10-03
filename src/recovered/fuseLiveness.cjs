module.exports = {
/***/ "./src/fuseLiveness.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Hj: () => (/* binding */ FuseLivenessMonitor)
/* harmony export */ });
/* unused harmony exports FUSE_LIVENESS_INTERVAL_MS, FUSE_LIVENESS_DEADLINE_MS, FUSE_LIVENESS_FAILURES_BEFORE_KILL, FUSE_LIVENESS_KILL_GRACE_MS, FUSE_LIVENESS_MAX_PARKED_PROBES, FUSE_LIVENESS_PROBE_FAILED_EVENT, FUSE_LIVENESS_UNRESPONSIVE_EVENT, FUSE_LIVENESS_KILL_EVENT, FUSE_LIVENESS_RELAUNCH_EVENT, FUSE_LIVENESS_RELAUNCH_REASON, FUSE_LIVENESS_VERDICT_SPAN, FUSE_LIVENESS_ATTR_CONSECUTIVE_FAILURES, FUSE_LIVENESS_ATTR_PARKED_HELPERS, FUSE_LIVENESS_ATTR_TRIGGER, FUSE_LIVENESS_ATTR_KILL_ENABLED, FUSE_LIVENESS_ATTR_PID_MATCHED, FUSE_LIVENESS_ATTR_WEDGE_REPORT_PRESENT, unescapeMountinfoPath, fuseConnectionMinorFromMountinfo, resolveMountRootForMountinfo */
/* harmony import */ var node_child_process__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("node:child_process");
/* harmony import */ var node_child_process__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_child_process__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("node:fs");
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(node_fs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("node:os");
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(node_os__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("node:path");
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _anysphere_constants__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("../constants/dist/agent-store-fuse.js");
/* harmony import */ var _anysphere_constants__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("../constants/dist/agent-store-ids.js");
/* harmony import */ var _anysphere_context__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("../context/dist/logger.js");
/* harmony import */ var _anysphere_context__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("../context/dist/otel.js");
/* harmony import */ var _anysphere_utils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("../utils/dist/workload-spawn.js");







const logger = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_6__/* .createLogger */ .h)("exec-daemon-fuse-liveness");
const FUSE_LIVENESS_INTERVAL_MS = 60_000;
const FUSE_LIVENESS_DEADLINE_MS = 15_000;
const FUSE_LIVENESS_FAILURES_BEFORE_KILL = 2;
const FUSE_LIVENESS_KILL_GRACE_MS = 2_000;
const FUSE_LIVENESS_MAX_PARKED_PROBES = 3;
const FUSE_LIVENESS_PROBE_FAILED_EVENT = "agent_store_fuse.liveness_probe_failed";
const FUSE_LIVENESS_UNRESPONSIVE_EVENT = "agent_store_fuse.liveness_unresponsive";
const FUSE_LIVENESS_KILL_EVENT = "agent_store_fuse.liveness_kill";
const FUSE_LIVENESS_RELAUNCH_EVENT = "agent_store_fuse.relaunch_after_hung_mount";
const FUSE_LIVENESS_RELAUNCH_REASON = "unresponsive_mount";
const FUSE_LIVENESS_VERDICT_SPAN = "agent_store_fuse.liveness_verdict";
const FUSE_LIVENESS_ATTR_CONSECUTIVE_FAILURES = "fuse_liveness.consecutive_failures";
const FUSE_LIVENESS_ATTR_PARKED_HELPERS = "fuse_liveness.parked_helpers";
/**
 * `deadline` after a miss crosses the threshold; `parked_cap` on a later
 * kill retry.
 */
const FUSE_LIVENESS_ATTR_TRIGGER = "fuse_liveness.trigger";
const FUSE_LIVENESS_ATTR_KILL_ENABLED = "fuse_liveness.kill_enabled";
/** False when the pid file no longer names the process that missed the probes. */
const FUSE_LIVENESS_ATTR_PID_MATCHED = "fuse_liveness.pid_matched";
const FUSE_LIVENESS_ATTR_WEDGE_REPORT_PRESENT = "fuse_liveness.wedge_report_present";
function defaultHost() {
    return {
        now: () => Date.now(),
        schedule(ms, fn) {
            const handle = setTimeout(fn, ms);
            handle.unref();
            return { cancel: () => clearTimeout(handle) };
        },
        spawnProbe({ probePath, cwd }) {
            // Workload cgroup so a D-state lookup cannot pin the daemon room.
            const child = (0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_8__/* .spawnWorkload */ .D9)(node_child_process__WEBPACK_IMPORTED_MODULE_0__.spawn, "/bin/sh", ["-c", 'exec test -e "$1"', "asf-liveness", probePath], {
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
                return (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.readFileSync)(path, "utf8");
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
                return (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.readFileSync)(`/proc/${pid}/cmdline`, "utf8").replaceAll("\0", " ");
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
                (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.renameSync)(from, to);
                return true;
            }
            catch {
                return false;
            }
        },
        removeFile(path) {
            try {
                (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.unlinkSync)(path);
            }
            catch {
                // Missing is fine.
            }
        },
        safeCwd: () => node_os__WEBPACK_IMPORTED_MODULE_2___default().tmpdir(),
        reportEvent: _anysphere_context__WEBPACK_IMPORTED_MODULE_7__/* .reportEvent */ .HF,
        spanFactory(ctx) {
            return (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_7__/* .withSpan */ .fR)(ctx);
        },
    };
}
const MOUNTINFO_UNESCAPE = {
    "011": "\t",
    "012": "\n",
    "040": " ",
    "134": "\\",
};
/** `mountinfo` octal-escapes space, tab, newline, and backslash in paths. */
function unescapeMountinfoPath(field) {
    return field.replace(/\\(\d{3})/g, (match, octal) => MOUNTINFO_UNESCAPE[octal] ?? match);
}
/**
 * Newest fuse mount_id's minor for `target`. `target` is already resolved;
 * this only parses text — it does not touch the mount.
 */
function fuseConnectionMinorFromMountinfo(target, mountinfo) {
    let bestId = Number.NEGATIVE_INFINITY;
    let minor;
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
function resolveMountRootForMountinfo(mountRoot) {
    const parent = node_path__WEBPACK_IMPORTED_MODULE_3___default().dirname(mountRoot);
    const base = node_path__WEBPACK_IMPORTED_MODULE_3___default().basename(mountRoot);
    let canon = parent;
    try {
        canon = (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.realpathSync)(parent);
    }
    catch {
        // Parent may not exist in tests; keep the given dirname.
    }
    return node_path__WEBPACK_IMPORTED_MODULE_3___default().join(canon, base);
}
function abortFuseConnection(mountRoot) {
    const mountinfoPath = process.env.ASF_FUSE_MOUNTINFO ?? "/proc/self/mountinfo";
    let mountinfo;
    try {
        mountinfo = (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.readFileSync)(mountinfoPath, "utf8");
    }
    catch {
        return;
    }
    const minor = fuseConnectionMinorFromMountinfo(resolveMountRootForMountinfo(mountRoot), mountinfo);
    if (minor === undefined) {
        return;
    }
    try {
        (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.writeFileSync)(`/sys/fs/fuse/connections/${minor}/abort`, "1");
    }
    catch {
        // Best-effort; the signal still ran.
    }
}
function parsePid(raw) {
    if (raw === undefined) {
        return undefined;
    }
    const pid = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(pid) && pid > 1 ? pid : undefined;
}
function cmdlineMatches(cmdline) {
    return cmdline?.includes(_anysphere_constants__WEBPACK_IMPORTED_MODULE_4__/* .AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE */ .Xb) === true;
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
class FuseLivenessMonitor {
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
    parkedHelperPids = new Set();
    /** True after this FUSE pid reached the consecutive-failure kill threshold. */
    killWarranted = false;
    lastLiveFusePid;
    probeGeneration = 0;
    killInFlight = false;
    pending;
    killGrace;
    ctx;
    constructor(options = {}) {
        this.killEnabled = options.killEnabled === true;
        this.intervalMs = options.intervalMs ?? FUSE_LIVENESS_INTERVAL_MS;
        this.deadlineMs = options.deadlineMs ?? FUSE_LIVENESS_DEADLINE_MS;
        this.failuresBeforeKill = options.failuresBeforeKill ?? FUSE_LIVENESS_FAILURES_BEFORE_KILL;
        this.killGraceMs = options.killGraceMs ?? FUSE_LIVENESS_KILL_GRACE_MS;
        this.maxParkedProbes = options.maxParkedProbes ?? FUSE_LIVENESS_MAX_PARKED_PROBES;
        this.host = options.host ?? defaultHost();
        this.mountRoot = options.mountRoot ?? _anysphere_constants__WEBPACK_IMPORTED_MODULE_5__/* .AGENT_STORE_MOUNT_ROOT */ .f;
        this.pidFile = options.pidFile ?? _anysphere_constants__WEBPACK_IMPORTED_MODULE_4__/* .AGENT_STORE_FUSE_PID_FILE */ .HH;
        this.dispatchWedgeReportPath =
            options.dispatchWedgeReportPath ?? _anysphere_constants__WEBPACK_IMPORTED_MODULE_4__/* .AGENT_STORE_FUSE_DISPATCH_WEDGE_REPORT_PATH */ .rM;
        this.relaunchReasonPath = options.relaunchReasonPath ?? _anysphere_constants__WEBPACK_IMPORTED_MODULE_4__/* .AGENT_STORE_FUSE_RELAUNCH_REASON_PATH */ .YE;
    }
    get isRunning() {
        return this.started;
    }
    get consecutiveFailureCount() {
        return this.consecutiveFailures;
    }
    start(ctx) {
        if (this.started) {
            return;
        }
        this.started = true;
        this.ctx = ctx;
        this.consumeRelaunchReason(ctx);
        this.arm(0, () => this.tick());
    }
    reportRelaunchReason(ctx) {
        this.consumeRelaunchReason(ctx);
    }
    consumeRelaunchReason(ctx) {
        // reportEvent no-ops without a parent span. Claim only when the event
        // can ship, so start/tick with a span-less global context cannot delete
        // the marker before a later ping reports it.
        if ((0,_anysphere_context__WEBPACK_IMPORTED_MODULE_7__/* .getSpan */ .fU)(ctx) === undefined) {
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
    arm(ms, fn) {
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
        let child;
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
    maybeKill(verdictCtx, targetPid, trigger) {
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
    withVerdictSpan(ctx, fn) {
        const spanned = this.host.spanFactory(ctx.withName(FUSE_LIVENESS_VERDICT_SPAN));
        try {
            fn(spanned);
        }
        finally {
            (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_7__/* .getSpan */ .fU)(spanned)?.end();
        }
    }
}
function withAttributes(ctx, attributes) {
    let next = ctx;
    for (const [key, value] of Object.entries(attributes)) {
        next = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_7__/* .withInheritableAttribute */ .Mf)(next, key, value);
    }
    return next;
}


/***/ },

};
