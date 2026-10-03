module.exports = {
/***/ "./src/machine-resources.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Up: () => (/* binding */ MachineResourceMonitor)
});

// UNUSED EXPORTS: LinuxCgroupProbe, MACHINE_RESOURCE_HISTORY_CAPACITY, OsHostProbe, cgroupWorkingSetBytes, findCgroupMemoryLimit, findPodCgroupDir, resolveOwnCgroupDir, resolveWorkloadUsageDir

// EXTERNAL MODULE: external "node:crypto"
var external_node_crypto_ = __webpack_require__("node:crypto");
// EXTERNAL MODULE: external "node:fs"
var external_node_fs_ = __webpack_require__("node:fs");
// EXTERNAL MODULE: external "node:os"
var external_node_os_ = __webpack_require__("node:os");
var external_node_os_default = /*#__PURE__*/__webpack_require__.n(external_node_os_);
// EXTERNAL MODULE: external "node:path"
var external_node_path_ = __webpack_require__("node:path");
var external_node_path_default = /*#__PURE__*/__webpack_require__.n(external_node_path_);
// EXTERNAL MODULE: ../context/dist/logger.js
var logger = __webpack_require__("../context/dist/logger.js");
// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/control_service_pb.js
var control_service_pb = __webpack_require__("../proto/dist/generated/agent/v1/control_service_pb.js");
// EXTERNAL MODULE: ../utils/dist/workload-spawn.js
var workload_spawn = __webpack_require__("../utils/dist/workload-spawn.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/connect-error.js
var connect_error = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/connect-error.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/code.js
var code = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/code.js");
// EXTERNAL MODULE: external "node:child_process"
var external_node_child_process_ = __webpack_require__("node:child_process");
;// ./src/darwin-memory.ts
/* unused harmony import specifier */ var execFileSync;

const VM_STAT_PATH = "/usr/bin/vm_stat";
const VM_STAT_TIMEOUT_MS = 2_000;
const PAGE_SIZE_PATTERN = /page size of (\d+) bytes/;
function readCounter(lines, label) {
    const prefix = `${label}:`;
    const line = lines.find((candidate) => candidate.startsWith(prefix));
    if (line === undefined) {
        return undefined;
    }
    const digits = line.slice(prefix.length).trim().replace(/\.$/, "");
    return /^\d+$/.test(digits) ? Number(digits) : undefined;
}
/**
 * Parse `vm_stat` output. Undefined when the header or any counter the
 * arithmetic depends on is missing, so a caller falls back rather than
 * computing from zeros.
 */
function parseDarwinVmStat(output) {
    const lines = output.split("\n").map((line) => line.trim());
    const pageSize = Number(lines[0]?.match(PAGE_SIZE_PATTERN)?.[1]);
    if (!Number.isFinite(pageSize) || pageSize <= 0) {
        return undefined;
    }
    const required = {
        free: readCounter(lines, "Pages free"),
        active: readCounter(lines, "Pages active"),
        inactive: readCounter(lines, "Pages inactive"),
        speculative: readCounter(lines, "Pages speculative"),
        wired: readCounter(lines, "Pages wired down"),
        purgeable: readCounter(lines, "Pages purgeable"),
        compressor: readCounter(lines, "Pages occupied by compressor"),
    };
    for (const value of Object.values(required)) {
        if (value === undefined) {
            return undefined;
        }
    }
    return {
        pageSizeBytes: pageSize,
        free: required.free,
        active: required.active,
        inactive: required.inactive,
        speculative: required.speculative,
        wired: required.wired,
        purgeable: required.purgeable,
        compressor: required.compressor,
        fileBacked: readCounter(lines, "File-backed pages"),
        anonymous: readCounter(lines, "Anonymous pages"),
    };
}
/**
 * Memory in use the way Activity Monitor's "Memory Used" counts it: wired +
 * compressed + app memory, where app memory is the anonymous pages less the
 * purgeable ones the kernel can drop on demand. Everything else (free pages,
 * the file cache including its speculative read-ahead, purgeable pages) is
 * available: it is the macOS analogue of Linux's `MemAvailable`, and of the
 * cgroup working set that subtracts `inactive_file`. `os.freemem()` only
 * counts free pages, so after any large file read it reports a nearly full
 * machine that is nothing of the kind.
 *
 * A release that does not print the anonymous/file-backed split falls back to
 * counting free + inactive + speculative + purgeable pages as available; that
 * over-credits inactive anonymous pages, but it is still far closer than free
 * pages alone.
 */
function darwinMemoryFromVmStat(stat, totalBytes) {
    const pageSize = BigInt(stat.pageSizeBytes);
    let usedBytes;
    if (stat.anonymous !== undefined) {
        const appPages = Math.max(0, stat.anonymous - stat.purgeable);
        usedBytes = BigInt(stat.wired + stat.compressor + appPages) * pageSize;
    }
    else {
        const availablePages = stat.free + stat.inactive + stat.speculative + stat.purgeable;
        usedBytes = totalBytes - BigInt(availablePages) * pageSize;
    }
    if (usedBytes < BigInt(0)) {
        usedBytes = BigInt(0);
    }
    if (usedBytes > totalBytes) {
        usedBytes = totalBytes;
    }
    return { usedBytes, availableBytes: totalBytes - usedBytes };
}
function runVmStat() {
    return execFileSync(VM_STAT_PATH, [], {
        encoding: "utf8",
        timeout: VM_STAT_TIMEOUT_MS,
        stdio: ["ignore", "pipe", "ignore"],
    });
}
const DEFAULT_TTL_MS = 1_000;
/**
 * A memoised reader over `vm_stat`. Undefined when the tool is missing, times
 * out, or prints something the parser does not recognise, so the caller can
 * fall back to the `os` figures instead of reporting zeros.
 */
function createDarwinMemoryReader(options) {
    const run = options.runVmStat ?? runVmStat;
    const now = options.now ?? Date.now;
    const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    let cached;
    return () => {
        const atMs = now();
        if (cached !== undefined && atMs - cached.atMs < ttlMs) {
            return cached.reading;
        }
        let reading;
        try {
            const stat = parseDarwinVmStat(run());
            reading = stat === undefined ? undefined : darwinMemoryFromVmStat(stat, options.totalBytes());
        }
        catch {
            reading = undefined;
        }
        cached = { atMs, reading };
        return reading;
    };
}

// EXTERNAL MODULE: ./src/ring-buffer.ts
var ring_buffer = __webpack_require__("./src/ring-buffer.ts");
;// ./src/machine-resources.ts
/* unused harmony import specifier */ var os;
/* unused harmony import specifier */ var ResourceScope;
/* unused harmony import specifier */ var machine_resources_createDarwinMemoryReader;










const machine_resources_logger = (0,logger/* createLogger */.h)("exec-daemon-machine-resources");
const MACHINE_RESOURCE_SAMPLE_INTERVAL_MS = 5_000;
/** 15 minutes of 5 s samples. */
const MACHINE_RESOURCE_HISTORY_CAPACITY = 180;
/** `<epoch>:<seq>`: the minting monitor instance and the first unseen sample. */
const CURSOR_PATTERN = /^([A-Za-z0-9_-]+):(\d+)$/;
/**
 * used / limit at or above this for two samples ⇒ HIGH; at or below the clear
 * ratio for two ⇒ back to NONE. The rule reads the same `memory_used_bytes`
 * the tab shows, so the percentage and the pressure state cannot disagree.
 * It is not `memory_available_bytes`: on a pod the virtio balloon shrinks
 * `MemAvailable` by however much the host has reclaimed (half the VM on this
 * fleet), while the guest still gets those pages back on demand
 * (`deflate_on_oom`), so a low `MemAvailable` is not pressure.
 */
const PRESSURE_HIGH_USED_RATIO = 0.9;
const PRESSURE_CLEAR_USED_RATIO = 0.8;
const PRESSURE_CONSECUTIVE_SAMPLES = 2;
const CGROUP_ROOT = "/sys/fs/cgroup";
function readMemInfo() {
    let totalBytes = BigInt(0);
    let availableBytes = BigInt(0);
    for (const line of (0,external_node_fs_.readFileSync)("/proc/meminfo", "utf8").split("\n")) {
        if (line.startsWith("MemTotal:")) {
            totalBytes = parseMemInfoKb(line);
        }
        else if (line.startsWith("MemAvailable:")) {
            availableBytes = parseMemInfoKb(line);
        }
    }
    return { totalBytes, availableBytes };
}
function parseMemInfoKb(line) {
    const digits = line.replace(/[^0-9]/g, "");
    return digits.length === 0 ? BigInt(0) : BigInt(digits) * BigInt(1024);
}
function readProcStatCpu() {
    const [user = 0, nice = 0, system = 0, idle = 0, iowait = 0, irq = 0, softirq = 0, steal = 0] = ((0,external_node_fs_.readFileSync)("/proc/stat", "utf8").split("\n", 1)[0] ?? "")
        .trim()
        .split(/\s+/)
        .slice(1)
        .map(Number);
    const busy = user + nice + system + irq + softirq + steal;
    return { busy, total: busy + idle + iowait };
}
function readOsCpu() {
    let busy = 0;
    let idle = 0;
    for (const cpu of os.cpus()) {
        busy += cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq;
        idle += cpu.times.idle;
    }
    return { busy, total: busy + idle };
}
function readDiskFor(workspacePath) {
    const stats = (0,external_node_fs_.statfsSync)(workspacePath, { bigint: true });
    const limitBytes = stats.blocks * stats.bsize;
    return { usedBytes: limitBytes - stats.bfree * stats.bsize, limitBytes };
}
function readCgroupFile(dir, name) {
    try {
        return (0,external_node_fs_.readFileSync)(external_node_path_default().join(dir, name), "utf8").trim();
    }
    catch {
        return undefined;
    }
}
function readCgroupBytes(dir, name) {
    const value = readCgroupFile(dir, name);
    return value === undefined || !/^\d+$/.test(value) ? undefined : BigInt(value);
}
/** One `<key> <bytes>` row of the cgroup's memory.stat. */
function readCgroupStatBytes(dir, key) {
    const row = readCgroupFile(dir, "memory.stat")
        ?.split("\n")
        .find((line) => line.startsWith(`${key} `));
    const value = row?.slice(key.length + 1);
    return value === undefined || !/^\d+$/.test(value) ? undefined : BigInt(value);
}
/**
 * The cgroup's working set: `memory.current` less the file cache the kernel
 * would reclaim first (`inactive_file`), the figure Kubernetes uses for OOM
 * proximity. A build or test run that fills the page cache does not read as
 * memory in use.
 */
function cgroupWorkingSetBytes(dir, read = { bytes: readCgroupBytes, statBytes: readCgroupStatBytes }) {
    const current = read.bytes(dir, "memory.current") ?? BigInt(0);
    const inactiveFile = read.statBytes(dir, "inactive_file") ?? BigInt(0);
    return current > inactiveFile ? current - inactiveFile : BigInt(0);
}
/** The cgroup v2 directory this process is in, from `/proc/self/cgroup`. */
function resolveOwnCgroupDir(procSelfCgroup = (0,external_node_fs_.readFileSync)("/proc/self/cgroup", "utf8")) {
    const entry = procSelfCgroup.split("\n").find((line) => line.startsWith("0::/"));
    if (entry === undefined) {
        return undefined;
    }
    return external_node_path_default().join(CGROUP_ROOT, entry.slice("0::".length));
}
function cgroupAncestors(dir) {
    const dirs = [];
    for (let current = dir; current.startsWith(CGROUP_ROOT) && current !== CGROUP_ROOT; current = external_node_path_default().dirname(current)) {
        dirs.push(current);
    }
    return dirs;
}
/** Nearest cgroup (self first, then ancestors) whose memory.max is a number. */
function findCgroupMemoryLimit(ownDir, readBytes = readCgroupBytes) {
    for (const dir of cgroupAncestors(ownDir)) {
        const limitBytes = readBytes(dir, "memory.max");
        if (limitBytes !== undefined) {
            return { dir, limitBytes };
        }
    }
    return undefined;
}
/** The pod-level cgroup (`pod-<id>`) above this process, when there is one. */
function findPodCgroupDir(ownDir) {
    return cgroupAncestors(ownDir)
        .reverse()
        .find((dir) => external_node_path_default().basename(dir).startsWith("pod-"));
}
function readCgroupCpuLimitMcores(dir) {
    const value = readCgroupFile(dir, "cpu.max");
    if (value === undefined) {
        return undefined;
    }
    const [quota, period] = value.split(/\s+/);
    if (quota === undefined || quota === "max") {
        return undefined;
    }
    const periodUs = Number(period ?? "100000");
    const quotaUs = Number(quota);
    if (!(quotaUs > 0) || !(periodUs > 0)) {
        return undefined;
    }
    return Math.round((quotaUs / periodUs) * 1000);
}
function nprocMcores() {
    return external_node_os_default().availableParallelism() * 1000;
}
/**
 * The workload cgroup the daemon moves agent processes into, when it is not
 * under the cgroup being sampled. cgroup v2 `memory.current` counts
 * descendants only, so a sibling room's memory would otherwise be missing
 * from the used figure while the copy says it measures the agent's container.
 */
function resolveWorkloadUsageDir(usageDir, placement = (0,workload_spawn/* getWorkloadPlacement */.NG)()) {
    if (placement.kind !== "armed") {
        return undefined;
    }
    const relative = external_node_path_default().relative(usageDir, placement.workloadCgroupDir);
    const inside = relative !== ".." && !relative.startsWith("../");
    return inside ? undefined : placement.workloadCgroupDir;
}
class LinuxCgroupProbe {
    workspacePath;
    usageDir;
    workloadDir;
    readBytes;
    readStatBytes;
    readMemInfo;
    scope;
    memoryLimitBytes;
    cpuLimitMcores;
    constructor(options) {
        this.workspacePath = options.workspacePath;
        this.usageDir = options.usageDir;
        this.workloadDir = options.workloadDir;
        this.scope = options.scope;
        this.memoryLimitBytes = options.memoryLimitBytes;
        this.cpuLimitMcores = options.cpuLimitMcores;
        this.readBytes = options.readBytes ?? readCgroupBytes;
        this.readStatBytes = options.readStatBytes ?? readCgroupStatBytes;
        this.readMemInfo = options.readMemInfo ?? readMemInfo;
    }
    readMemory() {
        const readers = { bytes: this.readBytes, statBytes: this.readStatBytes };
        const sampledBytes = cgroupWorkingSetBytes(this.usageDir, readers);
        const workloadBytes = this.workloadDir === undefined ? BigInt(0) : cgroupWorkingSetBytes(this.workloadDir, readers);
        const usedBytes = sampledBytes + workloadBytes;
        // Transparency only, not the pressure input: on a pod the balloon has
        // taken this out of MemAvailable without taking it away from the guest.
        const hostAvailableBytes = this.readMemInfo().availableBytes;
        if (this.scope !== control_service_pb/* ResourceScope */.r.CONTAINER) {
            return { usedBytes, availableBytes: hostAvailableBytes };
        }
        // A cgroup cap is hit long before the host runs out, so headroom is the
        // smaller of what the cgroup and the host still have. The cap governs
        // only the sampled cgroup, so an outside workload room does not eat it.
        const cgroupAvailableBytes = this.memoryLimitBytes > sampledBytes ? this.memoryLimitBytes - sampledBytes : BigInt(0);
        return {
            usedBytes,
            availableBytes: cgroupAvailableBytes < hostAvailableBytes ? cgroupAvailableBytes : hostAvailableBytes,
        };
    }
    readCpu() {
        return readProcStatCpu();
    }
    readDisk() {
        return readDiskFor(this.workspacePath);
    }
}
class LinuxHostProbe {
    workspacePath;
    memoryLimitBytes;
    scope = control_service_pb/* ResourceScope */.r.HOST;
    cpuLimitMcores = nprocMcores();
    constructor(workspacePath, memoryLimitBytes) {
        this.workspacePath = workspacePath;
        this.memoryLimitBytes = memoryLimitBytes;
    }
    readMemory() {
        const { totalBytes, availableBytes } = readMemInfo();
        return { usedBytes: totalBytes - availableBytes, availableBytes };
    }
    readCpu() {
        return readProcStatCpu();
    }
    readDisk() {
        return readDiskFor(this.workspacePath);
    }
}
function defaultOsHostProbeReads() {
    return {
        platform: "linux",
        totalBytes: () => BigInt(os.totalmem()),
        freeBytes: () => BigInt(os.freemem()),
    };
}
/**
 * Whole-machine reads on a platform without cgroups (macOS, Windows). On
 * macOS `os.freemem()` is only the free page count, so a file cache warmed
 * by a clone or a build reads as memory in use; used comes from `vm_stat`
 * there (see `darwinMemoryFromVmStat`), with `os.freemem()` as the fallback
 * when the tool cannot be read.
 */
class OsHostProbe {
    workspacePath;
    reads;
    scope = ResourceScope.HOST;
    memoryLimitBytes;
    cpuLimitMcores = nprocMcores();
    readDarwinMemory;
    constructor(workspacePath, reads = defaultOsHostProbeReads()) {
        this.workspacePath = workspacePath;
        this.reads = reads;
        this.memoryLimitBytes = reads.totalBytes();
        this.readDarwinMemory =
            reads.platform === "darwin"
                ? machine_resources_createDarwinMemoryReader({
                    totalBytes: () => this.memoryLimitBytes,
                    ...(reads.runVmStat === undefined ? {} : { runVmStat: reads.runVmStat }),
                })
                : undefined;
    }
    readMemory() {
        const darwin = this.readDarwinMemory?.();
        if (darwin !== undefined) {
            return darwin;
        }
        const availableBytes = this.reads.freeBytes();
        return {
            usedBytes: this.memoryLimitBytes - availableBytes,
            availableBytes,
        };
    }
    readCpu() {
        return readOsCpu();
    }
    readDisk() {
        return readDiskFor(this.workspacePath);
    }
}
/**
 * Pick the reads for this machine. A cgroup memory.max anywhere above the
 * daemon makes it a CONTAINER measured at that cgroup; otherwise a pod is
 * measured at its `pod-*` cgroup against guest MemTotal and a worker reports
 * whole-machine numbers.
 */
function createMachineResourceProbe(ctx, workspacePath, environment) {
    if (false) // removed by dead control flow
{}
    const ownDir = resolveOwnCgroupDir();
    const cgroupLimit = ownDir === undefined ? undefined : findCgroupMemoryLimit(ownDir);
    if (cgroupLimit !== undefined) {
        return new LinuxCgroupProbe({
            workspacePath,
            usageDir: cgroupLimit.dir,
            workloadDir: resolveLoggedWorkloadUsageDir(ctx, cgroupLimit.dir),
            scope: control_service_pb/* ResourceScope */.r.CONTAINER,
            memoryLimitBytes: cgroupLimit.limitBytes,
            cpuLimitMcores: readCgroupCpuLimitMcores(cgroupLimit.dir) ?? nprocMcores(),
        });
    }
    const memTotalBytes = readMemInfo().totalBytes;
    if (environment === "pod" && ownDir !== undefined) {
        const usageDir = findPodCgroupDir(ownDir) ?? ownDir;
        return new LinuxCgroupProbe({
            workspacePath,
            usageDir,
            workloadDir: resolveLoggedWorkloadUsageDir(ctx, usageDir),
            scope: control_service_pb/* ResourceScope */.r.POD_VM,
            memoryLimitBytes: memTotalBytes,
            cpuLimitMcores: nprocMcores(),
        });
    }
    return new LinuxHostProbe(workspacePath, memTotalBytes);
}
function resolveLoggedWorkloadUsageDir(ctx, usageDir) {
    const workloadDir = resolveWorkloadUsageDir(usageDir);
    if (workloadDir !== undefined) {
        machine_resources_logger.warn(ctx, "Workload cgroup is outside the sampled cgroup; memory used counts both, headroom follows the sampled cgroup's limit", { usageDir, workloadDir });
    }
    return workloadDir;
}
function cpuUsedMcores(counters, cpuLimitMcores) {
    const total = counters.current.total - counters.previous.total;
    if (total <= 0) {
        return 0;
    }
    const busy = Math.max(0, counters.current.busy - counters.previous.busy);
    return Math.min(cpuLimitMcores, Math.round((busy / total) * cpuLimitMcores));
}
/**
 * The 5 s sampler behind ControlService.GetResourceUsage. Samples land in a
 * 15-minute ring buffer that callers read on demand, continuing from an
 * opaque cursor. `start()` is called only when the launcher enabled machine
 * resources (the pod start flag, or a worker claim); until then getUsage()
 * reports nothing and the RPC answers FailedPrecondition.
 */
class MachineResourceMonitor {
    options;
    history = new ring_buffer/* RingBuffer */.N(MACHINE_RESOURCE_HISTORY_CAPACITY);
    epoch = (0,external_node_crypto_.randomBytes)(6).toString("base64url");
    /** Never reset, so cursors stay valid across stop()/start(). */
    sampleCount = 0;
    intervalMs;
    now;
    probe;
    limits;
    previousCpu;
    timer;
    pressure = control_service_pb/* ResourcePressure */.u7.NONE;
    pressureStreak = 0;
    constructor(options) {
        this.options = options;
        this.intervalMs = options.intervalMs ?? MACHINE_RESOURCE_SAMPLE_INTERVAL_MS;
        this.now = options.now ?? Date.now;
    }
    get isRunning() {
        return this.timer !== undefined;
    }
    start(ctx) {
        if (this.timer !== undefined) {
            return;
        }
        const probe = this.options.probe ??
            createMachineResourceProbe(ctx, this.options.workspacePath, this.options.environment);
        this.probe = probe;
        this.limits = new control_service_pb/* ResourceLimits */.vF({
            scope: probe.scope,
            memoryLimitBytes: probe.memoryLimitBytes,
            cpuLimitMcores: probe.cpuLimitMcores,
            diskLimitBytes: probe.readDisk().limitBytes,
            workspacePath: this.options.workspacePath,
            displayLabel: this.options.displayLabel,
        });
        this.previousCpu = probe.readCpu();
        machine_resources_logger.info(ctx, "Machine resource sampler started", {
            scope: control_service_pb/* ResourceScope */.r[probe.scope],
            memoryLimitBytes: probe.memoryLimitBytes.toString(),
            cpuLimitMcores: probe.cpuLimitMcores,
            intervalMs: this.intervalMs,
        });
        this.timer = setInterval(() => this.sample(), this.intervalMs);
        this.timer.unref();
        this.sample();
    }
    stop() {
        if (this.timer !== undefined) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
    /**
     * Undefined until `start()` has run; the RPC maps that to FailedPrecondition.
     * Throws InvalidArgument for a cursor this daemon never minted.
     */
    getUsage(cursor = "", omitHistory = false) {
        if (this.limits === undefined) {
            return undefined;
        }
        const samples = this.history.toArray();
        const oldestSeq = this.sampleCount - samples.length;
        const fromSeq = this.resolveCursor(cursor, oldestSeq);
        return new control_service_pb/* GetResourceUsageResponse */.RE({
            limits: this.limits,
            current: samples.at(-1),
            history: omitHistory ? [] : samples.slice(fromSeq - oldestSeq),
            nextCursor: `${this.epoch}:${this.sampleCount}`,
        });
    }
    /**
     * A cursor from another instance, or older than the buffer, restarts the
     * caller from the oldest retained sample rather than failing it.
     */
    resolveCursor(cursor, oldestSeq) {
        if (cursor === "") {
            return oldestSeq;
        }
        const match = CURSOR_PATTERN.exec(cursor);
        if (match === null) {
            throw new connect_error/* ConnectError */.T("Malformed resource usage cursor", code/* Code */.C.InvalidArgument);
        }
        const [, epoch, seqDigits] = match;
        const seq = Number(seqDigits);
        if (epoch !== this.epoch || seq < oldestSeq || seq > this.sampleCount) {
            return oldestSeq;
        }
        return seq;
    }
    /** ControlService.GetResourceUsage, shared by the HTTP and PTY WebSocket routers. */
    handleGetResourceUsage(request) {
        const usage = this.getUsage(request.cursor, request.omitHistory);
        if (usage === undefined) {
            throw new connect_error/* ConnectError */.T("Machine resources are not enabled on this machine", code/* Code */.C.FailedPrecondition);
        }
        return usage;
    }
    sample() {
        const probe = this.probe;
        if (probe === undefined || this.previousCpu === undefined) {
            return undefined;
        }
        const memory = probe.readMemory();
        const cpu = probe.readCpu();
        const disk = probe.readDisk();
        this.evaluatePressure(memory.usedBytes, probe.memoryLimitBytes);
        const sample = new control_service_pb/* ResourceSample */.JZ({
            sampledAtMs: BigInt(this.now()),
            memoryUsedBytes: memory.usedBytes,
            memoryAvailableBytes: memory.availableBytes,
            cpuUsedMcores: cpuUsedMcores({ previous: this.previousCpu, current: cpu }, probe.cpuLimitMcores),
            diskUsedBytes: disk.usedBytes,
            pressure: this.pressure,
        });
        this.previousCpu = cpu;
        this.sampleCount += 1;
        this.history.push(sample);
        return sample;
    }
    /**
     * Hysteresis: two samples past a threshold flip the state; anything else
     * resets the streak. The state rides on every sample as `pressure`; clients
     * derive their alerts from the transitions they see between polls.
     */
    evaluatePressure(usedBytes, limitBytes) {
        if (limitBytes <= BigInt(0)) {
            return;
        }
        const usedRatio = Number(usedBytes) / Number(limitBytes);
        const crossing = this.pressure === control_service_pb/* ResourcePressure */.u7.NONE
            ? usedRatio >= PRESSURE_HIGH_USED_RATIO
            : usedRatio <= PRESSURE_CLEAR_USED_RATIO;
        if (!crossing) {
            this.pressureStreak = 0;
            return;
        }
        this.pressureStreak += 1;
        if (this.pressureStreak < PRESSURE_CONSECUTIVE_SAMPLES) {
            return;
        }
        this.pressureStreak = 0;
        this.pressure =
            this.pressure === control_service_pb/* ResourcePressure */.u7.NONE ? control_service_pb/* ResourcePressure */.u7.HIGH : control_service_pb/* ResourcePressure */.u7.NONE;
    }
}


/***/ },

};
