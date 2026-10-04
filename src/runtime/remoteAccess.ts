import nodeChildProcess from "node:child_process";
import nodeCrypto from "node:crypto";
import nodeOs from "node:os";
import nodePath from "node:path";
import { createLogger } from "../interop/vendor/context-logger.js";
import { asyncMapValues } from "../interop/vendor/utils-promise-extras.js";
import nodeFsPromises from "node:fs/promises";
import { spawnWorkload } from "../interop/vendor/utils-workload-spawn.js";
import nodeUtil from "node:util";
import nodeHttps from "node:https";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import { HttpsProxyAgent as HttpsProxyAgentDependency } from "../interop/vendor/https-proxy-agent.js";
import type { Context } from "../interop/contracts/context.js";
import type { ExecFileOptionsWithStringEncoding, PromiseWithChild, SpawnOptionsWithoutStdio, ChildProcessWithoutNullStreams } from "node:child_process";
import type { ClientRequest } from "node:http";
export interface WarmCursorServerOptions {
    host?: string;
    connectionTokenDelivery?: "argv" | "file";
    existingServerOnPort?: "reuse-or-kill" | "ignore";
}

export const execFileAsync = nodeUtil.promisify(nodeChildProcess.execFile);
// Pins the string-encoding overload so stdout/stderr stay strings through spawnWorkload.
export const execFileUtf8Async: (file: string, args: readonly string[], options: ExecFileOptionsWithStringEncoding) => PromiseWithChild<{ stdout: string; stderr: string }> = execFileAsync;
export const spawnWithPipedStdio: (command: string, args: readonly string[], options: SpawnOptionsWithoutStdio) => ChildProcessWithoutNullStreams = nodeChildProcess.spawn;
export const logger = createLogger("exec-daemon-remote-access");
export const EXTENSIONS_DIR = nodePath.join(process.env.HOME ?? "", ".cursor-server/extensions");
export const PROXY_URL = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
export const PROXY_AGENT = PROXY_URL !== undefined && PROXY_URL.length > 0
    ? new HttpsProxyAgentDependency(PROXY_URL) // NB: this may cause issues? https://github.com/oven-sh/bun/issues/15499
    : undefined;
export const WARM_CURSOR_SERVER_INITIAL_BACKOFF_MS = 100;
export const WARM_CURSOR_SERVER_MAX_BACKOFF_MS = 250;
export const WARM_CURSOR_SERVER_MAX_TOTAL_POLL_MS = 30000;
export function getWarmCursorServerBackoffMs(retryCount: number) {
    return Math.min(WARM_CURSOR_SERVER_INITIAL_BACKOFF_MS * 2 ** retryCount, WARM_CURSOR_SERVER_MAX_BACKOFF_MS);
}
export function getWarmCursorServerMaxRetries(totalPollMs: number) {
    let retries = 0;
    let totalDelayMs = 0;
    while (totalDelayMs < totalPollMs) {
        totalDelayMs += getWarmCursorServerBackoffMs(retries);
        retries++;
    }
    return retries;
}
export const WARM_CURSOR_SERVER_MAX_RETRIES = getWarmCursorServerMaxRetries(WARM_CURSOR_SERVER_MAX_TOTAL_POLL_MS);
export class PromiseLock {
    isLocked = false;
    queue: (() => void)[] = [];
    async acquire() {
        return new Promise<() => void>((resolve) => {
            if (!this.isLocked) {
                this.isLocked = true;
                resolve(this.release.bind(this));
            }
            else {
                this.queue.push(() => {
                    this.isLocked = true;
                    resolve(this.release.bind(this));
                });
            }
        });
    }
    release() {
        this.isLocked = false;
        const next = this.queue.shift();
        if (next) {
            next();
        }
    }
}
/** Name of the token file, next to the build's `connection-token-hash`. */
export const CURSOR_SERVER_CONNECTION_TOKEN_FILE = "connection-token";
/**
 * Prepare the connection-token argument for a cursor-server spawn. For `file`
 * delivery the token is written to `<commitDir>/connection-token` with mode
 * 0600 (tightened even if a looser file already exists there, which
 * `writeFile`'s mode alone would not do) and without a trailing newline, the
 * form `--connection-token-file` reads verbatim.
 */
export async function prepareCursorServerConnectionTokenArg(args: { delivery: "argv" | "file"; connectionToken: string; commitDir: string }) {
    if (args.delivery === "argv") {
        return {
            arg: `--connection-token=${args.connectionToken}`,
            cleanup: async () => { },
        };
    }
    const tokenFile = nodePath.join(args.commitDir, CURSOR_SERVER_CONNECTION_TOKEN_FILE);
    await nodeFsPromises.mkdir(args.commitDir, { recursive: true });
    await nodeFsPromises.writeFile(tokenFile, args.connectionToken, {
        encoding: "utf8",
        mode: 0o600,
    });
    await nodeFsPromises.chmod(tokenFile, 0o600);
    return {
        arg: `--connection-token-file=${tokenFile}`,
        cleanup: async () => {
            await nodeFsPromises.rm(tokenFile, { force: true }).catch(() => { });
        },
    };
}
/**
 * Thrown by `warmCursorServer` under `existingServerOnPort: "ignore"` when the
 * server answering on the port after the spawn is not the one it spawned: a
 * sibling cursor-server of the same build bound the port first. The caller
 * picks another port; nothing on this one is touched.
 */
export class CursorServerPortHeldError extends Error {
    port;
    constructor(port: number, detail: string) {
        super(`port ${port} is held by another cursor-server: ${detail}`);
        this.port = port;
        this.name = "CursorServerPortHeldError";
    }
}
/**
 * Throws {@link CursorServerPortHeldError} unless the cursor-server on `port`
 * holds `connectionToken`. `/version` answers anyone, so a sibling server of
 * the same build on the port passes the version check; every other route
 * requires the token as `tkn` and answers 403 without it, so a missing `path`
 * is a 400 from the wanted server and a 403 from any other. A connection
 * failure propagates for the caller to retry.
 */
export async function assertCursorServerHoldsToken(args: { port: number; connectionToken: string; timeoutMs: number }) {
    const response = await fetch(`http://127.0.0.1:${args.port}/vscode-remote-resource?tkn=${encodeURIComponent(args.connectionToken)}`, { method: "GET", signal: AbortSignal.timeout(args.timeoutMs) });
    await response.body?.cancel();
    if (response.status === 403) {
        throw new CursorServerPortHeldError(args.port, "it answers /version with this build but refuses this server's token");
    }
}
/**
 * Who holds the LISTEN socket on loopback `port`, read from `/proc`: the
 * tree of processes under `pid`, some other process, or nobody (the listener
 * is already gone). The token check above cannot tell a spawn from a
 * same-build sibling once siblings of one OS user share the install's token,
 * and a sibling that bound the port first answers every HTTP probe while the
 * spawn is still starting; the socket's owner can. Only Linux has
 * `/proc/net/tcp`; elsewhere the spawn is taken at its word, as before.
 */
export async function loopbackListenerOwner(args: { port: number; pid: number }) {
    if (false) // removed by dead control flow
     { }
    const inodes = await listeningSocketInodes(args.port);
    if (inodes.size === 0) {
        return "unseen";
    }
    for (const pid of await processTree(args.pid)) {
        if (await ownsSocketInode(pid, inodes)) {
            return "spawn";
        }
    }
    return "other";
}
/** Inodes of every LISTEN socket bound to `port`, from `/proc/net/tcp{,6}`. */
export async function listeningSocketInodes(port: number) {
    const wantedPort = port.toString(16).toUpperCase().padStart(4, "0");
    const inodes = new Set<string>();
    for (const table of ["/proc/net/tcp", "/proc/net/tcp6"]) {
        const contents = await nodeFsPromises.readFile(table, "utf8").catch(() => "");
        for (const line of contents.split("\n").slice(1)) {
            const fields = line.trim().split(/\s+/);
            // sl local_address rem_address st ... inode
            if (fields.length < 10 || fields[3] !== "0A") {
                continue;
            }
            if (fields[1].endsWith(`:${wantedPort}`)) {
                inodes.add(fields[9]);
            }
        }
    }
    return inodes;
}
/** `root` and every process descending from it, by `/proc/<pid>/stat` ppid. */
export async function processTree(root: number) {
    const entries = await nodeFsPromises.readdir("/proc").catch(() => []);
    const pids = entries.filter((entry) => /^\d+$/.test(entry)).map(Number);
    const parents = await asyncMapValues(pids, readParentPid, { max: 32 });
    const childrenByParent = new Map<number, number[]>();
    pids.forEach((pid, i) => {
        const ppid = parents[i];
        if (ppid !== undefined) {
            childrenByParent.set(ppid, [...(childrenByParent.get(ppid) ?? []), pid]);
        }
    });
    const tree = [root];
    for (let i = 0; i < tree.length; i++) {
        tree.push(...(childrenByParent.get(tree[i]) ?? []));
    }
    return tree;
}
export async function readParentPid(pid: number) {
    const stat = await nodeFsPromises.readFile(`/proc/${pid}/stat`, "latin1").catch(() => undefined);
    // The comm field is parenthesised and may contain spaces; ppid is the
    // first field after it.
    const afterComm = stat?.slice(stat.lastIndexOf(")") + 2);
    const ppid = Number(afterComm?.split(" ")[1]);
    return Number.isInteger(ppid) ? ppid : undefined;
}
export async function ownsSocketInode(pid: number, inodes: ReadonlySet<string>) {
    const fds = await nodeFsPromises.readdir(`/proc/${pid}/fd`).catch(() => []);
    for (const fd of fds) {
        const target = await nodeFsPromises.readlink(`/proc/${pid}/fd/${fd}`).catch(() => undefined);
        const inode = target?.match(/^socket:\[(\d+)\]$/)?.[1];
        if (inode !== undefined && inodes.has(inode)) {
            return true;
        }
    }
    return false;
}
/**
 * Stop a cursor-server this call spawned. The spawn is detached, so the pid
 * leads a process group holding the launcher script and the node server it
 * forks; the group is signalled so the server does not outlive the launcher.
 */
export function killSpawnedProcess(pid: number | undefined) {
    if (pid === undefined) {
        return;
    }
    try {
        process.kill(-pid, "SIGKILL");
    }
    catch {
        // Already gone.
    }
}
/**
 * Service for handling remote access functionality (i.e. "Open VM" button in the desktop client)
 * Relies on downloading a binary called "Cursor Server" at a version compatible with the client trying to connect to the VM.
 */
export class RemoteAccessService {
    commitLocks = new Map<string, PromiseLock>();
    downloadCommitLocks = new Map<string, PromiseLock>();
    // TODO: support for installing extensions
    /**
     * Downloads the cursor server for the specified commit without starting it.
     * Returns true if it was already downloaded, false if a fresh download occurred.
     *
     * @param commit The commit hash of the cursor server to download
     */
    async downloadCursorServer(ctx: Context, commit: string) {
        const { serverPath } = this.getServerPath(commit);
        // Check if already downloaded
        try {
            const accessMode = false ? 0 : (nodeFsPromises).constants.X_OK;
            await nodeFsPromises.access(serverPath, accessMode);
            logger.info(ctx, "Cursor server already downloaded", { commit });
            return true;
        }
        catch {
            // Not downloaded yet, proceed
        }
        try {
            logger.debug(ctx, "Downloading cursor server (download-only)", {
                commit,
            });
            const downloadStart = Date.now();
            await this.downloadCursorServer_(ctx, commit);
            logger.info(ctx, "Cursor server download-only completed", {
                commit,
                durationMs: Date.now() - downloadStart,
            });
            return false;
        }
        catch (e) {
            logger.error(ctx, "Failed to download cursor server (download-only)", e, {
                commit,
            });
            throw new ConnectError("Failed to download cursor server", Code.Internal);
        }
    }
    /**
     * Warms up the cursor server for the specified commit
     *
     * @param commit The commit hash of the cursor server
     * @param port The port to run the cursor server on
     * @param connectionToken The connection token for authentication
     * @param options.host Interface the server binds. Cursor-hosted machines
     *   expose the port through the pod network and keep the `0.0.0.0` default;
     *   a self-hosted worker passes `127.0.0.1` so the server is reachable only
     *   through the worker's own outbound stream.
     * @param options.connectionTokenDelivery How the server learns its token;
     *   defaults to `argv`. A self-hosted worker passes `file` so the token
     *   never appears in the process's command line.
     * @param options.existingServerOnPort What to do about a listener already
     *   on the port before starting. `reuse-or-kill` (the default): probe the
     *   port, reuse a server already answering with this commit and token, and
     *   SIGKILL whatever else holds the port — right on a Cursor-hosted
     *   machine, which is single-tenant and uses a fixed port, so anything on
     *   it is a stale cursor-server. A self-hosted worker passes `ignore`: it
     *   allocates a fresh port per start and remembers its own servers, so a
     *   listener there is never a server it can reuse, and on a host shared by
     *   several workers it may be a sibling's healthy server or an unrelated
     *   process that must never be killed. If the port really is taken, the
     *   spawned server fails to bind and the start fails verification instead;
     *   a sibling server of the same build, which would pass the version check
     *   for it, is told apart by the token (another OS user) or by the owner
     *   of the listening socket (the same user, sharing the install's token)
     *   and refused with {@link CursorServerPortHeldError}.
     */
    async warmCursorServer(ctx: Context, commit: string, port: number, connectionToken: string, options?: WarmCursorServerOptions) {
        const bindHost = options?.host ?? "0.0.0.0";
        const tokenDelivery = options?.connectionTokenDelivery ?? "argv";
        const existingServerOnPort = options?.existingServerOnPort ?? "reuse-or-kill";
        if (connectionToken.length < 10) {
            throw new ConnectError("Connection token is too short", Code.InvalidArgument);
        }
        let lock = this.commitLocks.get(commit);
        if (!lock) {
            lock = new PromiseLock();
            this.commitLocks.set(commit, lock);
        }
        // Wait for any existing lock to be released
        const releaseLock = await lock.acquire();
        try {
            try {
                logger.debug(ctx, "Ensuring cursor server is downloaded", { commit });
                const downloadStart = Date.now();
                await this.downloadCursorServer_(ctx, commit);
                logger.debug(ctx, "Cursor server download check completed", {
                    commit,
                    durationMs: Date.now() - downloadStart,
                });
            }
            catch (e) {
                logger.error(ctx, "Failed to download cursor server", e, {
                    commit,
                });
                throw new ConnectError("Failed to download cursor server", Code.Internal);
            }
            if (existingServerOnPort === "reuse-or-kill") {
                // First we try querying the port's /version endpoint. If that works, then we are good to go
                const versionUrl = `http://localhost:${port}/version`; // pragma: allowlist secret
                try {
                    logger.debug(ctx, "Checking if server is already running", {
                        versionUrl,
                    });
                    const checkStart = Date.now();
                    const versionResponse = await fetch(versionUrl, {
                        method: "GET",
                        // we initially had this timeout be 100ms, but that was too short and caused the server to be killed in certain cases when it shouldn't be
                        // a killed server is very bad! since it kills existing connections
                        // so instead we just use a long timeout, which trades off a bit of time in the cold start case for reliability when connected
                        signal: AbortSignal.timeout(1000), // 1000ms timeout
                    });
                    logger.debug(ctx, "Server check completed", {
                        durationMs: Date.now() - checkStart,
                    });
                    const version = await versionResponse.text();
                    if (version.trim() === commit) {
                        // Verify the connection token hash matches
                        logger.debug(ctx, "Verifying connection token hash", { commit });
                        const verifyStart = Date.now();
                        const tokenHashMatches = await this.verifyConnectionTokenHash(commit, connectionToken);
                        logger.debug(ctx, "Token verification completed", {
                            durationMs: Date.now() - verifyStart,
                            matches: tokenHashMatches,
                        });
                        if (tokenHashMatches) {
                            // this is awesome!
                            logger.info(ctx, "Cursor server is already running with correct connection token. Good to go!", { commit, port });
                            return { spawnedPid: undefined };
                        }
                        else {
                            throw new Error(`Connection token hash mismatch: expected ${commit}, got ${version.trim()}`);
                        }
                    }
                    else {
                        throw new Error(`Version mismatch: expected ${commit}, got ${version.trim()}`);
                    }
                }
                catch (e) {
                    const message = e instanceof Error ? e.message : String(e);
                    await this.killServerOnPort(ctx, port, message);
                }
            }
            // Now we should start it!
            // It should run in the background, even if we restart the vm-daemon process
            const { serverPath, binDir } = this.getServerPath(commit);
            // Store the connection token hash before starting the server
            await this.storeConnectionTokenHash(commit, connectionToken);
            const tokenArg = await prepareCursorServerConnectionTokenArg({
                commitDir: `${binDir}/${commit}`,
                connectionToken,
                delivery: tokenDelivery,
            });
            // Start the server detached from parent process
            const serverProcess = spawnWorkload(nodeChildProcess.spawn, 
            // prettier-ignore
            serverPath, // nosemgrep: detect-child-process
            [
                `--host=${bindHost}`,
                `--port=${port}`,
                tokenArg.arg,
                `--extensions-dir=${EXTENSIONS_DIR}`,
            ], {
                detached: true,
                stdio: "ignore",
                // Use this to see the logs:
                // stdio: ["ignore", "inherit", "inherit"],
                cwd: binDir,
            });
            // Unref the process so parent can exit independently
            serverProcess.unref();
            // Verify the server is running by checking the version endpoint with
            // exponential backoff.
            try {
                const maxRetries = WARM_CURSOR_SERVER_MAX_RETRIES;
                let retryCount = 0;
                let lastError: Error | null = null;
                while (retryCount < maxRetries) {
                    const backoffMs = getWarmCursorServerBackoffMs(retryCount); // 100ms, 200ms, then capped at 250ms
                    logger.debug(ctx, `Waiting ${backoffMs}ms before attempt ${retryCount + 1}/${maxRetries} to verify cursor server`, { commit, port, retryCount, maxRetries, backoffMs });
                    // Wait with exponential backoff
                    await new Promise<void>((resolve) => setTimeout(resolve, backoffMs));
                    try {
                        const versionResponse = await fetch(`http://localhost:${port}/version`, {
                            method: "GET",
                            headers: {
                                "Connection-Token": connectionToken,
                            },
                            signal: AbortSignal.timeout(backoffMs),
                        });
                        if (!versionResponse.ok) {
                            throw new Error(`Server responded with status ${versionResponse.status}`);
                        }
                        const version = await versionResponse.text();
                        if (version.trim() !== commit) {
                            throw new Error(`Version mismatch: expected ${commit}, got ${version.trim()}`);
                        }
                        if (existingServerOnPort === "ignore") {
                            // The port was not probed before the spawn, so a sibling
                            // server of this build may be the one answering: one of
                            // another OS user fails the token check, one of the same user
                            // holds the install's token and is told apart by the socket's
                            // owner.
                            await assertCursorServerHoldsToken({
                                port,
                                connectionToken,
                                timeoutMs: backoffMs,
                            });
                            const owner = serverProcess.pid === undefined
                                ? "other"
                                : await loopbackListenerOwner({
                                    pid: serverProcess.pid,
                                    port,
                                });
                            if (owner !== "spawn") {
                                throw new CursorServerPortHeldError(port, owner === "unseen"
                                    ? "no listening socket for the port is visible in /proc/net/tcp"
                                    : "the listening socket is held by a process outside this spawn");
                            }
                        }
                        logger.info(ctx, `Successfully started cursor server at http://localhost:${port} on attempt ${retryCount + 1}`, { commit, port, retryCount });
                        return { spawnedPid: serverProcess.pid };
                    }
                    catch (e) {
                        if (e instanceof CursorServerPortHeldError) {
                            throw e;
                        }
                        lastError = e instanceof Error ? e : new Error(String(e));
                        logger.error(ctx, `Attempt ${retryCount + 1}/${maxRetries} to verify cursor server failed: ${lastError.message}`, lastError, { commit, port, retryCount, maxRetries });
                        retryCount++;
                    }
                }
                // If we've exhausted all retries, throw the last error
                logger.error(ctx, "Failed to verify cursor server is running after all retry attempts", lastError, { commit, port });
                throw new ConnectError("Failed to start cursor server after multiple attempts", Code.Internal);
            }
            catch (e) {
                logger.error(ctx, "Failed to verify cursor server is running", e, {
                    commit,
                    port,
                });
                if (existingServerOnPort === "ignore") {
                    // The caller never learns this pid, so a server that came up late
                    // (or is still starting) would outlive every record of it. It is
                    // our own spawn, so signalling it by pid is safe; a child that
                    // already exited (it lost the port) makes this a no-op.
                    killSpawnedProcess(serverProcess.pid);
                }
                if (e instanceof CursorServerPortHeldError) {
                    throw e;
                }
                throw new ConnectError("Failed to start cursor server", Code.Internal);
            }
            finally {
                // The server read the token file at startup; remove it whether or
                // not it came up.
                await tokenArg.cleanup();
            }
        }
        finally {
            // Release the lock when we're done
            releaseLock();
        }
    }
    /**
     * Gets the local path for a cursor server of the specified commit
     *
     * @param commit The commit hash of the cursor server
     */
    getServerPath(commit: string) {
        const homeDir = nodeOs.homedir();
        const serverDataDir = `${homeDir}/.cursor-server`;
        const binDir = `${serverDataDir}/bin`;
        const serverPath = `${binDir}/${commit}/bin/cursor-server`;
        return { serverPath, binDir };
    }
    /**
     * Stores a hash of the connection token for security verification
     */
    async storeConnectionTokenHash(commit: string, connectionToken: string) {
        const { binDir } = this.getServerPath(commit);
        const tokenHash = nodeCrypto.createHash("sha256").update(connectionToken).digest("hex");
        await nodeFsPromises.writeFile(`${binDir}/${commit}/connection-token-hash`, tokenHash, "utf8");
    }
    /**
     * Verifies if the provided connection token matches the stored hash
     */
    async verifyConnectionTokenHash(commit: string, connectionToken: string) {
        const { binDir } = this.getServerPath(commit);
        try {
            const storedHash = await nodeFsPromises.readFile(`${binDir}/${commit}/connection-token-hash`, "utf8");
            const currentHash = nodeCrypto.createHash("sha256").update(connectionToken).digest("hex");
            return storedHash.trim() === currentHash;
        }
        catch (_e) {
            return false;
        }
    }
    /**
     * Gets the process ID listening on a specific port
     */
    async getPidListeningOnPort(ctx: Context, port: number) {
        const platform = nodeOs.platform();
        try {
            if (platform === "darwin") {
                try {
                    // Try lsof first on macOS
                    logger.debug(ctx, "Checking lsof for listening process", { port });
                    const startTime = Date.now();
                    const { stdout } = await spawnWorkload(execFileUtf8Async, "lsof", ["-i", `:${port}`, "-s", "TCP:LISTEN", "-t"], { encoding: "utf8" });
                    logger.debug(ctx, "lsof check completed", {
                        port,
                        durationMs: Date.now() - startTime,
                    });
                    const pid = parseInt(stdout.trim(), 10);
                    return Number.isNaN(pid) ? null : pid;
                }
                catch {
                    // on macos lsof returns exit code 1 if no process is listening on the port
                    return null;
                }
            }
            else if (platform === "linux") {
                try {
                    // Try lsof first on Linux
                    logger.debug(ctx, "Checking lsof with -Q flag", { port });
                    const startTime = Date.now();
                    const { stdout } = await spawnWorkload(execFileUtf8Async, "lsof", ["-i", `:${port}`, "-s", "TCP:LISTEN", "-t", "-Q"], { encoding: "utf8" });
                    logger.debug(ctx, "lsof -Q check completed", {
                        port,
                        durationMs: Date.now() - startTime,
                    });
                    const pid = parseInt(stdout.trim(), 10);
                    return Number.isNaN(pid) ? null : pid;
                }
                catch {
                    try {
                        // Try ss if lsof fails
                        logger.debug(ctx, "Checking ss for listening process", { port });
                        const startTime = Date.now();
                        const { stdout } = await spawnWorkload(execFileUtf8Async, "ss", ["-lptn", "sport", "=", `:${port}`], { encoding: "utf8" });
                        logger.debug(ctx, "ss check completed", {
                            port,
                            durationMs: Date.now() - startTime,
                        });
                        const match = stdout.match(/pid=(\d+)/);
                        return match ? parseInt(match[1], 10) : null;
                    }
                    catch {
                        // Final fallback: check /proc/net/tcp
                        logger.debug(ctx, "Reading /proc/net/tcp");
                        const startTime = Date.now();
                        const procTcp = await nodeFsPromises.readFile("/proc/net/tcp", "utf8");
                        logger.debug(ctx, "/proc/net/tcp read completed", {
                            durationMs: Date.now() - startTime,
                        });
                        const hexPort = port.toString(16).padStart(4, "0").toUpperCase();
                        const lines = procTcp.split("\n");
                        for (const line of lines) {
                            // Format: sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
                            if (line.includes(`:${hexPort} `) && line.includes(" 0A ")) {
                                // 0A is TCP_LISTEN
                                const parts = line.trim().split(/\s+/);
                                // Ensure we have enough parts and inode is a number
                                if (parts.length >= 10) {
                                    const inode = parts[9];
                                    if (!/^\d+$/.test(inode))
                                        continue;
                                    // Find the process that has this socket open without a
                                    // shell pipeline, which would interpolate procfs names.
                                    const procEntries = await nodeFsPromises.readdir("/proc", {
                                        withFileTypes: true,
                                    });
                                    for (const procEntry of procEntries) {
                                        if (!procEntry.isDirectory() || !/^\d+$/.test(procEntry.name)) {
                                            continue;
                                        }
                                        try {
                                            const fdRoot = `/proc/${procEntry.name}/fd`;
                                            const fdNames = await nodeFsPromises.readdir(fdRoot);
                                            for (const fdName of fdNames) {
                                                const target = await nodeFsPromises.readlink(nodePath.join(fdRoot, fdName)).catch(() => "");
                                                if (target === `socket:[${inode}]`) {
                                                    return parseInt(procEntry.name, 10);
                                                }
                                            }
                                        }
                                        catch { }
                                    }
                                }
                            }
                        }
                        return null;
                    }
                }
            }
            else if (platform === "win32") {
                // Windows using netstat
                logger.debug(ctx, "Checking netstat on Windows", { port });
                const startTime = Date.now();
                const { stdout } = await spawnWorkload(execFileUtf8Async, "netstat", ["-ano"], {
                    encoding: "utf8",
                });
                logger.debug(ctx, "netstat check completed", {
                    port,
                    durationMs: Date.now() - startTime,
                });
                for (const line of stdout.split("\n")) {
                    const fields = line.trim().split(/\s+/);
                    const localAddress = fields[1];
                    const state = fields[3];
                    const pid = fields[4];
                    if (localAddress?.endsWith(`:${port}`) === true &&
                        state === "LISTENING" &&
                        pid !== undefined &&
                        /^\d+$/.test(pid)) {
                        return parseInt(pid, 10);
                    }
                }
                return null;
            }
            else {
                throw new Error(`Unsupported platform: ${platform}`);
            }
        }
        catch (error) {
            logger.error(ctx, `Failed to get PID for port ${port}.`, error, {
                port,
            });
            throw error;
        }
    }
    /**
     * Kills the server process running on the specified port
     */
    async killServerOnPort(ctx: Context, port: number, reason: string) {
        logger.debug(ctx, "Getting PID listening on port", { port });
        const startTime = Date.now();
        const pid = await this.getPidListeningOnPort(ctx, port);
        logger.debug(ctx, "Got PID", {
            port,
            pid,
            durationMs: Date.now() - startTime,
        });
        if (pid !== null) {
            logger.debug(ctx, `Cursor server is running at pid ${pid} for port ${port}, but ${reason}. Killing it!`, { port, pid, reason });
            try {
                logger.debug(ctx, "Killing process", { pid });
                const killStart = Date.now();
                process.kill(pid, "SIGKILL");
                logger.debug(ctx, "Process killed", {
                    pid,
                    durationMs: Date.now() - killStart,
                });
                logger.debug(ctx, `Cursor server killed.`, { port, pid });
            }
            catch (e) {
                logger.error(ctx, "Failed to kill cursor server.", e, {
                    port,
                    pid,
                });
            }
        }
        else {
            logger.debug(ctx, `Cursor server is not running on port ${port}.`, {
                port,
            });
        }
    }
    /**
     * Downloads the cursor server for the specified commit if not already downloaded
     *
     * @param commit The commit hash of the cursor server to download
     */
    async downloadCursorServer_(ctx: Context, commit: string) {
        let lock = this.downloadCommitLocks.get(commit);
        if (!lock) {
            lock = new PromiseLock();
            this.downloadCommitLocks.set(commit, lock);
        }
        // Wait for any existing lock to be released
        const releaseLock = await lock.acquire();
        try {
            // Validate commit parameter to prevent path traversal and URL manipulation
            if (!commit || !/^[a-zA-Z0-9\-_.]+$/.test(commit)) {
                throw new Error("Invalid commit format");
            }
            const osValue = nodeOs.platform();
            const archValue = nodeOs.arch();
            const url = `https://cursor.blob.core.windows.net/remote-releases/${commit}/vscode-reh-${osValue}-${archValue}.tar.gz`;
            // Get the user's home directory
            const homeDir = nodeOs.homedir();
            const serverDataDir = `${homeDir}/.cursor-server`;
            const binDir = `${serverDataDir}/bin`;
            const finalDir = nodePath.join(binDir, commit); // Use path.join for safe path construction
            const uuid = crypto.randomUUID();
            const tempDir = `${finalDir}-dirty-${uuid}`;
            // Create necessary directories
            await nodeFsPromises.mkdir(serverDataDir, { recursive: true });
            await nodeFsPromises.mkdir(binDir, { recursive: true });
            // Check if server is already downloaded
            logger.debug(ctx, "Checking if server already exists", { finalDir });
            const startCheck = Date.now();
            if (await nodeFsPromises.access(finalDir)
                .then(() => true)
                .catch(() => false)) {
                logger.info(ctx, "Server already exists", {
                    finalDir,
                    durationMs: Date.now() - startCheck,
                });
                return;
            }
            // Clean up any existing dirty directory from previous failed attempts
            try {
                await nodeFsPromises.rm(tempDir, { recursive: true, force: true });
            }
            catch (_e) {
                // Ignore errors if directory doesn't exist
            }
            try {
                // Stream download directly into tar extraction to avoid extra disk IO
                logger.debug(ctx, "Starting server download and extraction", {
                    url,
                    tempDir,
                });
                const downloadStart = Date.now();
                const extractStart = Date.now();
                await nodeFsPromises.mkdir(tempDir, { recursive: true });
                await new Promise<void>((resolve, reject) => {
                    const tar = spawnWorkload(spawnWithPipedStdio, "tar", ["-xzf", "-", "--strip-components", "1", "-C", tempDir], {});
                    let settled = false;
                    let extractTimeout: NodeJS.Timeout | undefined;
                    let request: ClientRequest | undefined;
                    const fail = (err: Error) => {
                        if (settled) {
                            return;
                        }
                        settled = true;
                        if (extractTimeout !== undefined) {
                            clearTimeout(extractTimeout);
                        }
                        request?.destroy(err);
                        tar.kill();
                        reject(err);
                    };
                    tar.on("close", (code) => {
                        if (extractTimeout !== undefined) {
                            clearTimeout(extractTimeout);
                        }
                        if (settled) {
                            return;
                        }
                        if (code === 0) {
                            settled = true;
                            logger.info(ctx, "Server package extracted successfully", {
                                tempDir,
                                durationMs: Date.now() - extractStart,
                            });
                            resolve();
                        }
                        else {
                            fail(new Error(`tar exited with code ${code}`));
                        }
                    });
                    tar.on("error", (err) => {
                        fail(err);
                    });
                    tar.stderr.on("data", (data: Buffer) => {
                        logger.error(ctx, `Tar stderr: ${data}`, { data: data.toString() });
                    });
                    tar.stdin.on("error", (err: NodeJS.ErrnoException) => {
                        if (err.code === "EPIPE") {
                            return;
                        }
                        fail(err);
                    });
                    request = nodeHttps.get(url, { agent: PROXY_AGENT }, (response) => {
                        if (response.statusCode !== 200) {
                            response.resume();
                            fail(new Error(`Failed to download: ${response.statusCode}`));
                            return;
                        }
                        response.on("end", () => {
                            logger.info(ctx, "Server package downloaded successfully", {
                                durationMs: Date.now() - downloadStart,
                            });
                            extractTimeout = setTimeout(() => {
                                fail(new Error("Tar extraction timed out after 60 seconds"));
                            }, 60000);
                        });
                        response.on("error", fail);
                        response.pipe(tar.stdin);
                    });
                    request.on("error", fail);
                });
                const tempServerPath = nodePath.join(tempDir, "bin", "cursor-server");
                // Make the server executable (no-op on Windows where NTFS lacks Unix permission bits)
                if (true) {
                    await nodeFsPromises.chmod(tempServerPath, 0o755);
                }
                // Verify the server exists (and is executable on Unix)
                try {
                    const accessMode = false ? 0 : (nodeFsPromises).constants.X_OK;
                    await nodeFsPromises.access(tempServerPath, accessMode);
                }
                catch (_e) {
                    throw new Error(`Server binary is not accessible at ${tempServerPath}`);
                }
                // Move the temporary directory to the final location
                try {
                    logger.debug(ctx, "Moving server to final location", {
                        tempDir,
                        finalDir,
                    });
                    const moveStart = Date.now();
                    await nodeFsPromises.rename(tempDir, finalDir);
                    logger.info(ctx, "Server moved to final location", {
                        durationMs: Date.now() - moveStart,
                    });
                }
                catch (e) {
                    // If rename fails, try to clean up the temporary directory
                    try {
                        await nodeFsPromises.rm(tempDir, { recursive: true, force: true });
                    }
                    catch (cleanupError) {
                        logger.error(ctx, "Failed to clean up temporary directory", cleanupError, {
                            tempDir,
                        });
                    }
                    throw e;
                }
                logger.debug(ctx, `Successfully downloaded server at ${finalDir}`, {
                    commit,
                    finalDir,
                });
            }
            catch (error) {
                // Clean up temp directory if it exists
                try {
                    await nodeFsPromises.rm(tempDir, { recursive: true, force: true });
                }
                catch (_e) {
                    // Ignore errors if directory doesn't exist
                }
                throw error;
            }
        }
        finally {
            releaseLock();
        }
    }
}
