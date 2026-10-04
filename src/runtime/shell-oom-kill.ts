import nodeFs from "node:fs";
import nodeOs from "node:os";
import nodePath from "node:path";
import { shellStreamExecutorResource } from "../interop/vendor/agent-exec.js";
import { createLogger } from "../interop/vendor/context-logger.js";
import { ShellOomKill_Kind, ShellOomKill } from "../interop/vendor/proto-agent-v1-shell-exec-pb.js";
import { getWorkloadPlacement } from "../interop/vendor/utils-workload-spawn.js";
import type { ListableResourceAccessor, Resource, ResourceEntry, ShellStreamExecutor } from "../interop/contracts/agent-exec.js";
import type { Context } from "../interop/contracts/context.js";
import type { agent_v1_ShellStreamExit } from "../interop/contracts/protobuf-generated.js";

export const logger = createLogger("exec-daemon-shell-oom-kill");
export const CGROUP_ROOT = "/sys/fs/cgroup";
/** How bash reports a child that died by SIGKILL: 128 + 9. */
export const SIGKILL_EXIT_CODE = 137;
/** The exit code local-exec reports when the shell itself died by a signal. */
export const SHELL_KILLED_EXIT_CODE = -1;
export function readFileOrUndefined(file: string) {
    try {
        return nodeFs.readFileSync(file, "utf8");
    }
    catch {
        return undefined;
    }
}
export function selfAndAncestors(dir: string) {
    const dirs: string[] = [];
    for (let current = dir; current.startsWith(CGROUP_ROOT); current = nodePath.dirname(current)) {
        dirs.push(current);
    }
    return dirs;
}
/**
 * The cgroup shell commands land in: the workload cgroup when armed
 * (`spawnWorkload`), otherwise this process's own cgroup, which unplaced
 * children inherit.
 */
export function resolveCommandCgroupDir(read: typeof readFileOrUndefined) {
    const placement = getWorkloadPlacement();
    if (placement.kind === "armed") {
        return placement.workloadCgroupDir;
    }
    const entry = read("/proc/self/cgroup")
        ?.split("\n")
        .find((line) => line.startsWith("0::/"));
    return entry === undefined ? undefined : nodePath.join(CGROUP_ROOT, entry.slice("0::".length));
}
export function parseOomKillCount(memoryEvents: string | undefined) {
    const match = memoryEvents === undefined ? null : /^oom_kill (\d+)$/m.exec(memoryEvents);
    return match === null ? undefined : Number(match[1]);
}
/**
 * Nearest cgroup, the command's first, with a readable oom_kill counter. The
 * counter is hierarchical, so an ancestor still counts kills in a cgroup that
 * has no memory controller of its own. The root cgroup has no memory.events,
 * except inside a cgroup namespace where it is the container's cgroup.
 */
export function findMemoryEventsDir(commandCgroupDir: string, read = readFileOrUndefined) {
    return selfAndAncestors(commandCgroupDir).find((dir) => parseOomKillCount(read(nodePath.join(dir, "memory.events"))) !== undefined);
}
export function classifyFailedCommand(exitCode: number, counts: { start: number; end: number } | undefined) {
    if (counts === undefined) {
        return exitCode === SIGKILL_EXIT_CODE ? ShellOomKill_Kind.UNCONFIRMED : undefined;
    }
    if (counts.end <= counts.start) {
        return undefined;
    }
    return exitCode === SIGKILL_EXIT_CODE || exitCode === SHELL_KILLED_EXIT_CODE
        ? ShellOomKill_Kind.COMMAND_KILLED
        : ShellOomKill_Kind.COMMAND_FAILED;
}
/**
 * Relates each failed shell command to the kernel OOM killer: `start()` reads
 * the counter when the command's stream starts, `finish()` reads it again at a
 * failed exit and classifies. Commands share the counter's cgroup, so
 * KIND_COMMAND_FAILED cannot say whose process died.
 */
export interface ShellOomKillProbeOptions {
    platform?: string;
    read?: typeof readFileOrUndefined;
    totalMemoryBytes?: () => bigint;
    commandCgroupDir?: string;
}
export class ShellOomKillProbe {
    platform: string;
    read: typeof readFileOrUndefined;
    totalMemoryBytes: () => bigint;
    commandCgroupDir: string | undefined;
    memoryEventsDir: string | undefined;
    resolved = false;
    constructor(options: ShellOomKillProbeOptions = {}) {
        this.platform = options.platform ?? "linux";
        this.read = options.read ?? readFileOrUndefined;
        this.totalMemoryBytes = options.totalMemoryBytes ?? (() => BigInt(nodeOs.totalmem()));
        this.commandCgroupDir = options.commandCgroupDir;
    }
    start() {
        const dir = this.resolveMemoryEventsDir();
        return dir === undefined ? undefined : this.readCount(dir);
    }
    finish(startCount: number | undefined, exit: Pick<agent_v1_ShellStreamExit, "code" | "aborted">) {
        const exitCode = exit.code | 0;
        if (this.platform === "win32" || exit.aborted || exitCode === 0) {
            return undefined;
        }
        const dir = this.memoryEventsDir;
        const endCount = startCount === undefined || dir === undefined ? undefined : this.readCount(dir);
        const counts = startCount === undefined || endCount === undefined
            ? undefined
            : { start: startCount, end: endCount };
        const kind = classifyFailedCommand(exitCode, counts);
        if (kind === undefined) {
            return undefined;
        }
        return {
            oomKill: new ShellOomKill({ kind, memoryLimitBytes: this.memoryLimitBytes() }),
            ...(counts === undefined
                ? {}
                : { memoryEventsDir: dir, oomKillsDuringCommand: counts.end - counts.start }),
        };
    }
    resolveMemoryEventsDir() {
        if (!this.resolved) {
            this.resolved = true;
            if (this.platform === "linux") {
                this.commandCgroupDir ??= resolveCommandCgroupDir(this.read);
                this.memoryEventsDir =
                    this.commandCgroupDir === undefined
                        ? undefined
                        : findMemoryEventsDir(this.commandCgroupDir, this.read);
            }
        }
        return this.memoryEventsDir;
    }
    readCount(dir: string) {
        return parseOomKillCount(this.read(nodePath.join(dir, "memory.events")));
    }
    memoryLimitBytes() {
        const dirs = this.commandCgroupDir === undefined ? [] : selfAndAncestors(this.commandCgroupDir);
        for (const dir of dirs) {
            const value = this.read(nodePath.join(dir, "memory.max"))?.trim();
            if (value !== undefined && /^\d+$/.test(value)) {
                return BigInt(value);
            }
        }
        return this.totalMemoryBytes();
    }
}
export function oomKillReportingShellStreamExecutor(inner: ShellStreamExecutor | undefined, probe: ShellOomKillProbe): ShellStreamExecutor {
    return {
        async *execute(ctx, args, options) {
            const startCount = probe.start();
            // Missing shell resources historically fail only when the wrapper is iterated.
            // Keep that deferred throw rather than asserting that registration is guaranteed.
            for await (const stream of inner!.execute(ctx, args, options)) {
                if (stream.event.case === "exit") {
                    const exit = stream.event.value;
                    const detection = probe.finish(startCount, exit);
                    if (detection !== undefined) {
                        exit.oomKill = detection.oomKill;
                        logger.warn(ctx, "Shell command OOM kill detected", {
                            kind: ShellOomKill_Kind[detection.oomKill.kind],
                            memoryLimitBytes: detection.oomKill.memoryLimitBytes.toString(),
                            memoryEventsDir: detection.memoryEventsDir,
                            oomKillsDuringCommand: detection.oomKillsDuringCommand,
                            exitCode: exit.code | 0,
                            toolCallId: args.toolCallId,
                        });
                    }
                }
                yield stream;
            }
        },
    };
}
export class ShellOomKillReportingAccessor {
    inner: ListableResourceAccessor;
    probe: ShellOomKillProbe;
    constructor(inner: ListableResourceAccessor, probe: ShellOomKillProbe) {
        this.inner = inner;
        this.probe = probe;
    }
    get<T>(resource: Resource<T>): T | undefined {
        return this.wrap(resource, this.inner.get(resource));
    }
    *entries(): Generator<ResourceEntry> {
        for (const [resource, implementation] of this.inner.entries()) {
            yield [resource, this.wrap(resource, implementation)];
        }
    }
    wrap<T>(resource: Resource<T>, implementation: T | undefined): T | undefined {
        if (resource.symbol !== shellStreamExecutorResource.symbol) {
            return implementation;
        }
        // This globally registered resource symbol identifies the shell implementation
        // in the heterogeneous registry. The association is erased by entries(),
        // so the assertion is deliberately confined to this identity branch.
        return oomKillReportingShellStreamExecutor(implementation as (T & ShellStreamExecutor) | undefined, this.probe) as T & ShellStreamExecutor;
    }
}
/** Sets `oom_kill` on the failed exit of every shell stream the daemon serves. */
export function withShellOomKillReporting(inner: ListableResourceAccessor, probe = new ShellOomKillProbe()) {
    return new ShellOomKillReportingAccessor(inner, probe);
}
