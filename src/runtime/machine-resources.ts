import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodeOs from "node:os";
import nodePath from "node:path";
import { createLogger } from "../interop/vendor/context-logger.js";
import { ResourceScope, ResourcePressure, ResourceLimits, GetResourceUsageResponse, ResourceSample } from "../interop/vendor/proto-agent-v1-control-service-pb.js";
import { getWorkloadPlacement } from "../interop/vendor/utils-workload-spawn.js";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import { RingBuffer } from "./ring-buffer.js";
import type { Context } from "../interop/contracts/context.js";
import type { agent_v1_ResourceLimits, agent_v1_ResourceSample, agent_v1_ResourceScope, agent_v1_GetResourceUsageRequest } from "../interop/contracts/protobuf-generated.js";
export interface CpuCounters { busy: number; total: number; }
export interface MachineResourceProbe {
    scope: agent_v1_ResourceScope;
    memoryLimitBytes: bigint;
    cpuLimitMcores: number;
    readMemory(): { usedBytes: bigint; availableBytes: bigint };
    readCpu(): CpuCounters;
    readDisk(): { usedBytes: bigint; limitBytes: bigint };
}
export interface LinuxCgroupProbeOptions {
    workspacePath: string;
    usageDir: string;
    workloadDir?: string;
    scope: agent_v1_ResourceScope;
    memoryLimitBytes: bigint;
    cpuLimitMcores: number;
    readBytes?: typeof readCgroupBytes;
    readStatBytes?: typeof readCgroupStatBytes;
    readMemInfo?: typeof readMemInfo;
}
export interface MachineResourceMonitorOptions {
    workspacePath: string;
    environment: string;
    displayLabel?: string;
    intervalMs?: number;
    now?: () => number;
    probe?: MachineResourceProbe;
}
export const logger = createLogger("exec-daemon-machine-resources");
export const MACHINE_RESOURCE_SAMPLE_INTERVAL_MS = 5000;
/** 15 minutes of 5 s samples. */
export const MACHINE_RESOURCE_HISTORY_CAPACITY = 180;
/** `<epoch>:<seq>`: the minting monitor instance and the first unseen sample. */
export const CURSOR_PATTERN = /^([A-Za-z0-9_-]+):(\d+)$/;
/**
 * used / limit at or above this for two samples ⇒ HIGH; at or below the clear
 * ratio for two ⇒ back to NONE. The rule reads the same `memory_used_bytes`
 * the tab shows, so the percentage and the pressure state cannot disagree.
 * It is not `memory_available_bytes`: on a pod the virtio balloon shrinks
 * `MemAvailable` by however much the host has reclaimed (half the VM on this
 * fleet), while the guest still gets those pages back on demand
 * (`deflate_on_oom`), so a low `MemAvailable` is not pressure.
 */
export const PRESSURE_HIGH_USED_RATIO = 0.9;
export const PRESSURE_CLEAR_USED_RATIO = 0.8;
export const PRESSURE_CONSECUTIVE_SAMPLES = 2;
export const CGROUP_ROOT = "/sys/fs/cgroup";
export function readMemInfo() {
    let totalBytes = BigInt(0);
    let availableBytes = BigInt(0);
    for (const line of nodeFs.readFileSync("/proc/meminfo", "utf8").split("\n")) {
        if (line.startsWith("MemTotal:")) {
            totalBytes = parseMemInfoKb(line);
        }
        else if (line.startsWith("MemAvailable:")) {
            availableBytes = parseMemInfoKb(line);
        }
    }
    return { totalBytes, availableBytes };
}
export function parseMemInfoKb(line: string) {
    const digits = line.replace(/[^0-9]/g, "");
    return digits.length === 0 ? BigInt(0) : BigInt(digits) * BigInt(1024);
}
export function readProcStatCpu() {
    const [user = 0, nice = 0, system = 0, idle = 0, iowait = 0, irq = 0, softirq = 0, steal = 0] = (nodeFs.readFileSync("/proc/stat", "utf8").split("\n", 1)[0] ?? "")
        .trim()
        .split(/\s+/)
        .slice(1)
        .map(Number);
    const busy = user + nice + system + irq + softirq + steal;
    return { busy, total: busy + idle + iowait };
}
export function readDiskFor(workspacePath: string) {
    const stats = nodeFs.statfsSync(workspacePath, { bigint: true });
    const limitBytes = stats.blocks * stats.bsize;
    return { usedBytes: limitBytes - stats.bfree * stats.bsize, limitBytes };
}
export function readCgroupFile(dir: string, name: string) {
    try {
        return nodeFs.readFileSync(nodePath.join(dir, name), "utf8").trim();
    }
    catch {
        return undefined;
    }
}
export function readCgroupBytes(dir: string, name: string) {
    const value = readCgroupFile(dir, name);
    return value === undefined || !/^\d+$/.test(value) ? undefined : BigInt(value);
}
/** One `<key> <bytes>` row of the cgroup's memory.stat. */
export function readCgroupStatBytes(dir: string, key: string) {
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
export function cgroupWorkingSetBytes(dir: string, read = { bytes: readCgroupBytes, statBytes: readCgroupStatBytes }) {
    const current = read.bytes(dir, "memory.current") ?? BigInt(0);
    const inactiveFile = read.statBytes(dir, "inactive_file") ?? BigInt(0);
    return current > inactiveFile ? current - inactiveFile : BigInt(0);
}
/** The cgroup v2 directory this process is in, from `/proc/self/cgroup`. */
export function resolveOwnCgroupDir(procSelfCgroup = nodeFs.readFileSync("/proc/self/cgroup", "utf8")) {
    const entry = procSelfCgroup.split("\n").find((line) => line.startsWith("0::/"));
    if (entry === undefined) {
        return undefined;
    }
    return nodePath.join(CGROUP_ROOT, entry.slice("0::".length));
}
export function cgroupAncestors(dir: string) {
    const dirs: string[] = [];
    for (let current = dir; current.startsWith(CGROUP_ROOT) && current !== CGROUP_ROOT; current = nodePath.dirname(current)) {
        dirs.push(current);
    }
    return dirs;
}
/** Nearest cgroup (self first, then ancestors) whose memory.max is a number. */
export function findCgroupMemoryLimit(ownDir: string, readBytes = readCgroupBytes) {
    for (const dir of cgroupAncestors(ownDir)) {
        const limitBytes = readBytes(dir, "memory.max");
        if (limitBytes !== undefined) {
            return { dir, limitBytes };
        }
    }
    return undefined;
}
/** The pod-level cgroup (`pod-<id>`) above this process, when there is one. */
export function findPodCgroupDir(ownDir: string) {
    return cgroupAncestors(ownDir)
        .reverse()
        .find((dir) => nodePath.basename(dir).startsWith("pod-"));
}
export function readCgroupCpuLimitMcores(dir: string) {
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
export function nprocMcores() {
    return nodeOs.availableParallelism() * 1000;
}
/**
 * The workload cgroup the daemon moves agent processes into, when it is not
 * under the cgroup being sampled. cgroup v2 `memory.current` counts
 * descendants only, so a sibling room's memory would otherwise be missing
 * from the used figure while the copy says it measures the agent's container.
 */
export function resolveWorkloadUsageDir(usageDir: string, placement = getWorkloadPlacement()) {
    if (placement.kind !== "armed") {
        return undefined;
    }
    const relative = nodePath.relative(usageDir, placement.workloadCgroupDir);
    const inside = relative !== ".." && !relative.startsWith("../");
    return inside ? undefined : placement.workloadCgroupDir;
}
export class LinuxCgroupProbe {
    workspacePath;
    usageDir;
    workloadDir;
    readBytes;
    readStatBytes;
    readMemInfo;
    scope;
    memoryLimitBytes;
    cpuLimitMcores;
    constructor(options: LinuxCgroupProbeOptions) {
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
        if (this.scope !== ResourceScope.CONTAINER) {
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
export class LinuxHostProbe {
    workspacePath;
    memoryLimitBytes;
    scope = ResourceScope.HOST;
    cpuLimitMcores = nprocMcores();
    constructor(workspacePath: string, memoryLimitBytes: bigint) {
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
/**
 * Pick the reads for this machine. A cgroup memory.max anywhere above the
 * daemon makes it a CONTAINER measured at that cgroup; otherwise a pod is
 * measured at its `pod-*` cgroup against guest MemTotal and a worker reports
 * whole-machine numbers.
 */
export function createMachineResourceProbe(ctx: Context, workspacePath: string, environment: string) {
    if (false) // removed by dead control flow
     { }
    const ownDir = resolveOwnCgroupDir();
    const cgroupLimit = ownDir === undefined ? undefined : findCgroupMemoryLimit(ownDir);
    if (cgroupLimit !== undefined) {
        return new LinuxCgroupProbe({
            workspacePath,
            usageDir: cgroupLimit.dir,
            workloadDir: resolveLoggedWorkloadUsageDir(ctx, cgroupLimit.dir),
            scope: ResourceScope.CONTAINER,
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
            scope: ResourceScope.POD_VM,
            memoryLimitBytes: memTotalBytes,
            cpuLimitMcores: nprocMcores(),
        });
    }
    return new LinuxHostProbe(workspacePath, memTotalBytes);
}
export function resolveLoggedWorkloadUsageDir(ctx: Context, usageDir: string) {
    const workloadDir = resolveWorkloadUsageDir(usageDir);
    if (workloadDir !== undefined) {
        logger.warn(ctx, "Workload cgroup is outside the sampled cgroup; memory used counts both, headroom follows the sampled cgroup's limit", { usageDir, workloadDir });
    }
    return workloadDir;
}
export function cpuUsedMcores(counters: { current: CpuCounters; previous: CpuCounters }, cpuLimitMcores: number) {
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
export class MachineResourceMonitor {
    options;
    history = new RingBuffer<agent_v1_ResourceSample>(MACHINE_RESOURCE_HISTORY_CAPACITY);
    epoch = nodeCrypto.randomBytes(6).toString("base64url");
    /** Never reset, so cursors stay valid across stop()/start(). */
    sampleCount = 0;
    intervalMs;
    now;
    probe: MachineResourceProbe | undefined;
    limits: agent_v1_ResourceLimits | undefined;
    previousCpu: CpuCounters | undefined;
    timer: NodeJS.Timeout | undefined;
    pressure = ResourcePressure.NONE;
    pressureStreak = 0;
    constructor(options: MachineResourceMonitorOptions) {
        this.options = options;
        this.intervalMs = options.intervalMs ?? MACHINE_RESOURCE_SAMPLE_INTERVAL_MS;
        this.now = options.now ?? Date.now;
    }
    get isRunning() {
        return this.timer !== undefined;
    }
    start(ctx: Context) {
        if (this.timer !== undefined) {
            return;
        }
        const probe = this.options.probe ??
            createMachineResourceProbe(ctx, this.options.workspacePath, this.options.environment);
        this.probe = probe;
        this.limits = new ResourceLimits({
            scope: probe.scope,
            memoryLimitBytes: probe.memoryLimitBytes,
            cpuLimitMcores: probe.cpuLimitMcores,
            diskLimitBytes: probe.readDisk().limitBytes,
            workspacePath: this.options.workspacePath,
            displayLabel: this.options.displayLabel,
        });
        this.previousCpu = probe.readCpu();
        logger.info(ctx, "Machine resource sampler started", {
            scope: ResourceScope[probe.scope],
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
        return new GetResourceUsageResponse({
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
    resolveCursor(cursor: string, oldestSeq: number) {
        if (cursor === "") {
            return oldestSeq;
        }
        const match = CURSOR_PATTERN.exec(cursor);
        if (match === null) {
            throw new ConnectError("Malformed resource usage cursor", Code.InvalidArgument);
        }
        const [, epoch, seqDigits] = match;
        const seq = Number(seqDigits);
        if (epoch !== this.epoch || seq < oldestSeq || seq > this.sampleCount) {
            return oldestSeq;
        }
        return seq;
    }
    /** ControlService.GetResourceUsage, shared by the HTTP and PTY WebSocket routers. */
    handleGetResourceUsage(request: agent_v1_GetResourceUsageRequest) {
        const usage = this.getUsage(request.cursor, request.omitHistory);
        if (usage === undefined) {
            throw new ConnectError("Machine resources are not enabled on this machine", Code.FailedPrecondition);
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
        const sample = new ResourceSample({
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
    evaluatePressure(usedBytes: bigint, limitBytes: bigint) {
        if (limitBytes <= BigInt(0)) {
            return;
        }
        const usedRatio = Number(usedBytes) / Number(limitBytes);
        const crossing = this.pressure === ResourcePressure.NONE
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
            this.pressure === ResourcePressure.NONE ? ResourcePressure.HIGH : ResourcePressure.NONE;
    }
}
