import nodeChildProcess from "node:child_process";
import { spawnWorkload } from "../../interop/vendor/utils-workload-spawn.js";
import nodeUtil from "node:util";
import type { Context } from "../../interop/contracts/context.js";
import type { ExecFileOptionsWithBufferEncoding, PromiseWithChild, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams, ExecFileException } from "node:child_process";
export interface BareGitOutput { exitCode: number; stdout: Buffer; stderr: Buffer; }
export interface BareGitProcessOptions { timeoutMs: number; maxBuffer: number; input?: string; }

export const execFileAsync = nodeUtil.promisify(nodeChildProcess.execFile);
// Pins the buffer-encoding overload so stdout/stderr stay Buffers through spawnWorkload.
export const execFileBufferAsync: (file: string, args: readonly string[], options: ExecFileOptionsWithBufferEncoding) => PromiseWithChild<{ stdout: Buffer; stderr: Buffer }> = execFileAsync;
export const spawnWithPipedStdio: (command: string, args: readonly string[], options: SpawnOptionsWithoutStdio) => ChildProcessWithoutNullStreams = nodeChildProcess.spawn;
export const textDecoder = new TextDecoder("utf-8", { fatal: false });
/**
 * Recognize stderr patterns that mean "the requested object/path doesn't
 * exist in this tree", as opposed to a real operational failure (timeout,
 * corruption, missing fetch). Used by `readFile` / `stat` / `listFiles` so
 * they all classify failures consistently.
 */
export function isObjectMissingStderr(stderr: string) {
    return /does not exist|not a valid object name|not a blob|not a tree|exists on disk, but not in/i.test(stderr);
}
export function collectProcessOutput(command: string, args: readonly string[], options: BareGitProcessOptions) {
    return new Promise<BareGitOutput>((resolve) => {
        const child = spawnWorkload(spawnWithPipedStdio, command, args, {
            windowsHide: true,
        });
        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let timedOut = false;
        let stdinErrored = false;
        let settled = false;
        const finish = (exitCode: number) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            resolve({
                exitCode,
                stdout: Buffer.concat(stdoutChunks, stdoutBytes),
                stderr: Buffer.concat(stderrChunks, stderrBytes),
            });
        };
        const timeout = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, options.timeoutMs);
        child.stdout.on("data", (chunk: Buffer) => {
            if (stdoutBytes < options.maxBuffer) {
                const remaining = options.maxBuffer - stdoutBytes;
                const captured = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
                stdoutChunks.push(captured);
                stdoutBytes += captured.length;
            }
        });
        child.stderr.on("data", (chunk: Buffer) => {
            if (stderrBytes < options.maxBuffer) {
                const remaining = options.maxBuffer - stderrBytes;
                const captured = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
                stderrChunks.push(captured);
                stderrBytes += captured.length;
            }
        });
        child.on("error", () => finish(1));
        child.stdin.on("error", () => {
            // The child may exit before consuming the full batch input. Without a
            // handler, Node treats EPIPE on stdin as an uncaught stream error.
            stdinErrored = true;
        });
        child.on("close", (code) => finish(timedOut || stdinErrored ? 1 : (code ?? 1)));
        child.stdin.end(options.input ?? "");
    });
}
export async function runGitInBareRepo(bareRepoPath: string, args: readonly string[], options: BareGitProcessOptions): Promise<BareGitOutput> {
    const full = ["-C", bareRepoPath, ...args];
    try {
        const { stdout, stderr } = await spawnWorkload(execFileBufferAsync, "git", full, {
            timeout: options.timeoutMs,
            maxBuffer: options.maxBuffer,
            encoding: null,
            windowsHide: true,
        });
        return {
            exitCode: 0,
            stdout,
            stderr,
        };
    }
    catch (err) {
        // The rejection is from the fixed Buffer-encoding execFile invocation above.
        const e = err as ExecFileException & { status?: unknown; stdout?: Buffer; stderr?: Buffer };
        return {
            exitCode: typeof e.status === "number" ? e.status : typeof e.code === "number" ? e.code : 1,
            stdout: e.stdout ?? Buffer.alloc(0),
            stderr: e.stderr ?? Buffer.alloc(0),
        };
    }
}
/**
 * In-process read-only access to a bare repository on the same machine as
 * exec-daemon (e.g. read-only multi-tenant shared pod). Tree reads are scoped
 * with {@code getActiveTreeSha} so each request can use a different commit
 * without the backend making per-file VM round-trips.
 */
export class VmDaemonBareGitRepository {
    bareRepoPath;
    getActiveTreeSha;
    constructor(bareRepoPath: string, getActiveTreeSha: () => string) {
        this.bareRepoPath = bareRepoPath;
        this.getActiveTreeSha = getActiveTreeSha;
    }
    getTreeSha() {
        return this.getActiveTreeSha();
    }
    async readFile(_ctx: Context, repoRelativePath: string) {
        const sha = this.getTreeSha();
        const spec = repoRelativePath === "" ? sha : `${sha}:${repoRelativePath}`;
        const out = await this.runPlumbing(_ctx, ["cat-file", "-p", spec], 30000, 16 * 1024 * 1024);
        if (out.exitCode === 0) {
            return out.stdout;
        }
        const stderr = textDecoder.decode(out.stderr).trim();
        if (isObjectMissingStderr(stderr)) {
            return undefined;
        }
        // Operational failure (timeout, permission, repo corruption, OOM, …):
        // surface as an error rather than silently masquerading as not-found.
        throw new Error(`git cat-file failed (exit ${out.exitCode}) for ${spec}: ${stderr.slice(-512) || "(no stderr)"}`);
    }
    async readFiles(_ctx: Context, repoRelativePaths: readonly string[]) {
        const uniquePaths = [...new Set<string>(repoRelativePaths)];
        const result = new Map<string, Buffer | undefined>();
        if (uniquePaths.length === 0) {
            return result;
        }
        const sha = this.getTreeSha();
        const specs = uniquePaths.map((path) => (path === "" ? sha : `${sha}:${path}`));
        const out = await collectProcessOutput("git", ["-C", this.bareRepoPath, "cat-file", "--batch"], {
            input: `${specs.join("\n")}\n`,
            timeoutMs: 30000,
            maxBuffer: 64 * 1024 * 1024,
        });
        if (out.exitCode !== 0) {
            throw new Error(`git cat-file --batch failed (exit ${out.exitCode}): ${textDecoder.decode(out.stderr).trim().slice(-512) || "(no stderr)"}`);
        }
        let offset = 0;
        for (let i = 0; i < specs.length; i++) {
            const path = uniquePaths[i];
            const newline = out.stdout.indexOf(0x0a, offset);
            if (newline === -1) {
                throw new Error("git cat-file --batch produced truncated header");
            }
            const header = textDecoder.decode(out.stdout.subarray(offset, newline));
            offset = newline + 1;
            if (header.endsWith(" missing")) {
                result.set(path, undefined);
                continue;
            }
            const match = / (blob|tree|commit|tag) (\d+)$/.exec(header);
            if (match === null) {
                throw new Error(`git cat-file --batch produced malformed header: ${header}`);
            }
            const kind = match[1];
            const size = Number(match[2]);
            if (!Number.isSafeInteger(size) || size < 0) {
                throw new Error(`git cat-file --batch produced invalid size: ${header}`);
            }
            const end = offset + size;
            if (end > out.stdout.length) {
                throw new Error("git cat-file --batch produced truncated body");
            }
            result.set(path, kind === "blob" ? out.stdout.subarray(offset, end) : undefined);
            offset = end;
            if (out.stdout[offset] === 0x0a) {
                offset++;
            }
        }
        return result;
    }
    async stat(_ctx: Context, repoRelativePath: string) {
        const sha = this.getTreeSha();
        const spec = repoRelativePath === "" ? sha : `${sha}:${repoRelativePath}`;
        const out = await this.runPlumbing(_ctx, ["cat-file", "-t", spec], 15000);
        if (out.exitCode !== 0) {
            const stderr = textDecoder.decode(out.stderr).trim();
            if (isObjectMissingStderr(stderr)) {
                return "missing";
            }
            // Operational failure (timeout, repo corruption, etc.). Surface as
            // an error rather than silently reporting "missing"
            throw new Error(`git cat-file -t failed (exit ${out.exitCode}) for ${spec}: ${stderr.slice(-512) || "(no stderr)"}`);
        }
        const type = textDecoder.decode(out.stdout).trim();
        if (type === "blob") {
            return "file";
        }
        // `tree` for the root of a tree-ish ref, `commit` for the root of a
        // commit-ish ref, `tag` for an annotated-tag ref (rare in our flow but
        // possible if a caller pins to a tag SHA). All three resolve to "the
        // workspace root is a directory" — git auto-dereferences these for
        // non-root paths (`<sha>:path` works on commit / tag / tree alike) so
        // we only ever see the non-`blob` cases at root.
        if (type === "tree" || type === "commit" || type === "tag") {
            return "directory";
        }
        return "missing";
    }
    async listFiles(_ctx: Context, repoRelativePrefix: string) {
        const sha = this.getTreeSha();
        const prefix = repoRelativePrefix.replace(/^\/+/, "").replace(/\/+$/, "");
        const args = prefix === ""
            ? ["ls-tree", "-r", "-z", "--name-only", sha]
            : ["ls-tree", "-r", "-z", "--name-only", sha, "--", prefix];
        const out = await this.runPlumbing(_ctx, args, 30000, 32 * 1024 * 1024);
        if (out.exitCode !== 0) {
            const stderr = textDecoder.decode(out.stderr).trim();
            if (isObjectMissingStderr(stderr)) {
                return [];
            }
            // Same reasoning as `stat` above: don't mask operational failures
            // (timeout, corruption, invalid pinned SHA) as "no files".
            throw new Error(`git ls-tree failed (exit ${out.exitCode}) for ${sha}${prefix === "" ? "" : ` -- ${prefix}`}: ${stderr.slice(-512) || "(no stderr)"}`);
        }
        return textDecoder.decode(out.stdout).split("\0").filter(Boolean);
    }
    async runGit(_ctx: Context, args: readonly string[], timeoutMs?: number) {
        return this.runPlumbing(_ctx, args, timeoutMs);
    }
    async runPlumbing(_ctx: Context, args: readonly string[], timeoutMs = 15000, maxBuffer = 32 * 1024 * 1024) {
        return runGitInBareRepo(this.bareRepoPath, args, { timeoutMs, maxBuffer });
    }
}
