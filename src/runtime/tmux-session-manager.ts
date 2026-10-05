import nodeChildProcess from "node:child_process";
import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodePath from "node:path";
import nodeUtil from "node:util";
import { createLogger } from "../interop/vendor/context-logger.js";
import { TmuxSessionKind } from "../interop/vendor/proto-agent-v1-tmux-session-service-pb.js";
import { resetOomScoreAdjBeforeExec } from "../interop/vendor/utils-oom-score-adj.js";
import { getWorkloadPlacement, spawnWorkload, WORKLOAD_CGROUP_ENV_VAR } from "../interop/vendor/utils-workload-spawn.js";
import { ManagedEnvironment as ManagedEnvironmentDependency, ENV_NAME_PATTERN, CURSOR_SANDBOX_ENV_NAME_PATTERN } from "./managed-environment.js";
import { SPAWN_CWD_HOP_ENV_VAR } from "../interop/vendor/utils-safe-spawn-cwd.js";
import type { Context } from "../interop/contracts/context.js";
import type { ExecFileOptionsWithStringEncoding, PromiseWithChild } from "node:child_process";
import type { ManagedEnvironment } from "./managed-environment.js";
import type { agent_v1_TmuxSessionKind } from "../interop/contracts/protobuf-generated.js";
export interface TmuxSessionMetadata {
    displayName: string;
    kind: agent_v1_TmuxSessionKind;
    cwd: string;
    shell: string;
    processArgs: string[];
}
export interface TmuxProcess { shell: string; args?: string[]; }
export interface TmuxCreateSessionArgs {
    sessionName?: string;
    displayName?: string;
    kind: agent_v1_TmuxSessionKind;
    cwd?: string;
    process?: TmuxProcess;
    env?: Readonly<Record<string, string>>;
}
export interface TmuxEnvironmentUpdate {
    env: Readonly<Record<string, string>>;
    removedKeys?: Iterable<string>;
}
export interface TmuxSessionEnvironmentUpdate extends TmuxEnvironmentUpdate {
    sessionName: string;
    refreshPaneIfIdle?: boolean;
}
export interface TmuxPtyManager {
    spawn(args: { process: TmuxProcess; cwd: string; env: Record<string, string>; cols: number; rows: number }): string;
}
export type ExecTmux = (tmuxArgs: string[], env?: NodeJS.ProcessEnv) => Promise<string>;
export interface TmuxSessionManagerArgs {
    managedEnvironment?: ManagedEnvironment;
    tmuxBinaryPath?: string;
    tmuxConfigPath?: string;
    execTmux?: ExecTmux;
    workspacePath: string;
    ptyManager: TmuxPtyManager;
    globalContext: Context;
}

export const execFileAsync = nodeUtil.promisify(nodeChildProcess.execFile);
// Pins the string-encoding overload so stdout/stderr stay strings through spawnWorkload.
export const execFileUtf8Async: (file: string, args: readonly string[], options: ExecFileOptionsWithStringEncoding) => PromiseWithChild<{ stdout: string; stderr: string }> = execFileAsync;
export const logger = createLogger("tmux-session-manager");
export const SESSION_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
/**
 * Resolves the tmux client argv that spawnWorkload should exec.
 *
 * Armed placement already resets oom_score_adj in the child before exec.
 * Direct placement only resets the client pid from the parent, which loses
 * the race against tmux's daemonized server tree (SAND-2741). Wrap with
 * resetOomScoreAdjBeforeExec on that path so the server forks at 0.
 */
export function resolveTmuxClientSpawn(tmuxBinaryPath: string, fullArgs: readonly string[], placementKind = getWorkloadPlacement().kind) {
    if (placementKind === "armed") {
        return { command: tmuxBinaryPath, args: [...fullArgs] };
    }
    return resetOomScoreAdjBeforeExec(tmuxBinaryPath, fullArgs);
}
export const DEFAULT_COLS = 80;
export const DEFAULT_ROWS = 24;
export const TMUX_UTF8_FLAG = "-u";
export const UTF8_LOCALE_ENV = {
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    LC_CTYPE: "C.UTF-8",
};
/** tmux -F format: pipe avoids ambiguity if session_name ever contained a tab */
export const LIST_SESSIONS_FORMAT = "#{session_name}|#{session_created}|#{session_attached}";
export const REFRESHABLE_SHELL_COMMANDS = new Set<string>(["bash", "zsh", "sh", "ksh"]);
export function packageRootFromImportMetaUrl(importMetaUrl: string) {
    return nodePath.resolve(nodePath.dirname(new URL(importMetaUrl).pathname), "..");
}
export function getExecutableBundledDir() {
    const argv1 = process.argv[1];
    if (!argv1) {
        return undefined;
    }
    return nodePath.dirname(nodePath.resolve(argv1));
}
export function resolveFirstExistingPath(candidates: readonly (string | undefined)[]) {
    for (const candidate of candidates) {
        if (candidate && nodeFs.existsSync(candidate)) {
            return candidate;
        }
    }
    return undefined;
}
export function resolveTmuxBinaryPath(args: { importMetaUrl: string; tmuxBinaryPath?: string }) {
    const packageRoot = packageRootFromImportMetaUrl(args.importMetaUrl);
    const bundledDir = getExecutableBundledDir();
    return (resolveFirstExistingPath([
        args.tmuxBinaryPath,
        process.env.EXEC_DAEMON_TMUX_PATH,
        bundledDir ? nodePath.join(bundledDir, "tmux") : undefined,
        "/exec-daemon/tmux",
        // Dev: `node dist/index.js` — tmux lives in dist-package next to package root
        bundledDir ? nodePath.join(bundledDir, "..", "dist-package", "tmux") : undefined,
        nodePath.join(packageRoot, "dist-package", "tmux"),
    ]) ?? "tmux");
}
export function resolveTmuxConfigPath(args: { importMetaUrl: string; tmuxConfigPath?: string }) {
    const packageRoot = packageRootFromImportMetaUrl(args.importMetaUrl);
    const bundledDir = getExecutableBundledDir();
    return resolveFirstExistingPath([
        args.tmuxConfigPath,
        process.env.EXEC_DAEMON_TMUX_CONF_PATH,
        bundledDir ? nodePath.join(bundledDir, "tmux.portal.conf") : undefined,
        "/exec-daemon/tmux.portal.conf",
        bundledDir ? nodePath.join(bundledDir, "..", "tmux.portal.conf") : undefined,
        bundledDir ? nodePath.join(bundledDir, "..", "dist-package", "tmux.portal.conf") : undefined,
        nodePath.join(packageRoot, "tmux.portal.conf"),
        nodePath.join(packageRoot, "dist-package", "tmux.portal.conf"),
    ]);
}
export function parseTmuxSessionLines(stdout: string) {
    return stdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
        const [sessionName = "", createdSeconds = "0", attachedClients = "0"] = line.split("|");
        const createdAtUnixMs = (Number.parseInt(createdSeconds, 10) || 0) * 1000;
        return {
            sessionName,
            createdAtUnixMs,
            attachedClientCount: Number.parseInt(attachedClients, 10) || 0,
        };
    })
        .filter((session) => session.sessionName.length > 0);
}
export function toExactSessionTarget(sessionName: string) {
    return `=${sessionName}`;
}
export function toExactSessionPaneTarget(sessionName: string) {
    return `${toExactSessionTarget(sessionName)}:`;
}
export function buildTmuxGlobalArgs(tmuxConfigPath: string | undefined) {
    return tmuxConfigPath ? [TMUX_UTF8_FLAG, "-f", tmuxConfigPath] : [TMUX_UTF8_FLAG];
}
export function shellSingleQuote(value: string) {
    return `'${value.replace(/'/g, "'\\''")}'`;
}
export function buildShellEnvironmentRefreshCommand(args: { tmuxBinaryPath: string; tmuxConfigPath?: string; sessionName: string }) {
    const commandParts = [shellSingleQuote(args.tmuxBinaryPath)];
    if (args.tmuxConfigPath) {
        commandParts.push("-f", shellSingleQuote(args.tmuxConfigPath));
    }
    commandParts.push("show-environment", "-s", "-t", shellSingleQuote(toExactSessionTarget(args.sessionName)));
    return `eval "$(${commandParts.join(" ")})"`;
}
export class TmuxError extends Error {
    constructor(message: string, cause?: unknown) {
        super(message, { cause });
        this.name = new.target.name;
    }
}
export class TmuxCommandError extends TmuxError {
    stderr;
    constructor({ message, stderr, cause }: { message: string; stderr?: string; cause?: unknown }) {
        super(message, cause);
        this.stderr = stderr;
    }
}
export class TmuxNoServerError extends TmuxCommandError {
}
/** The tmux client was killed by the execTmux timeout (wedged tmux server). */
export class TmuxCommandTimeoutError extends TmuxCommandError {
}
export class TmuxSessionNotFoundError extends TmuxCommandError {
}
export class TmuxValidationError extends TmuxError {
}
export class TmuxSessionAlreadyExistsError extends TmuxError {
}
export function getTmuxExecErrorDetails(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stderr = typeof error === "object" &&
        error !== null &&
        "stderr" in error &&
        typeof error.stderr === "string"
        ? error.stderr
        : undefined;
    return {
        message,
        stderr,
        normalizedDetails: [message, stderr ?? ""].join("\n").toLowerCase(),
    };
}
/**
 * execFile kills the child on timeout (`killed: true`). maxBuffer overruns
 * also kill the child, so exclude them by message.
 */
export function isTimeoutKill(error: unknown, normalizedDetails: string) {
    return (typeof error === "object" &&
        error !== null &&
        "killed" in error &&
        error.killed === true &&
        !normalizedDetails.includes("maxbuffer"));
}
export function classifyTmuxExecError(error: unknown) {
    if (error instanceof TmuxCommandError) {
        return error;
    }
    const { message, stderr, normalizedDetails } = getTmuxExecErrorDetails(error);
    if (normalizedDetails.includes("no server running") ||
        normalizedDetails.includes("failed to connect to server") ||
        normalizedDetails.includes("error connecting to")) {
        return new TmuxNoServerError({ message, stderr, cause: error });
    }
    if (isTimeoutKill(error, normalizedDetails)) {
        return new TmuxCommandTimeoutError({ message, stderr, cause: error });
    }
    if (normalizedDetails.includes("session not found") ||
        normalizedDetails.includes("can't find session")) {
        return new TmuxSessionNotFoundError({ message, stderr, cause: error });
    }
    return error instanceof Error ? error : new Error(message);
}
export class TmuxSessionManager {
    sessionMetadata = new Map<string, TmuxSessionMetadata>();
    /**
     * Keys whose last global sync did not verifiably reach a tmux server.
     * Retried before the next session creation; cleared when a retry confirms
     * no server exists (the fork that follows inherits process.env).
     */
    pendingGlobalSyncKeys = new Set<string>();
    /**
     * Serializes global-env refreshes, the pending-key retry, and
     * `new-session`, so a session never inherits a half-applied update and a
     * retry never writes stale values over a newer refresh.
     */
    globalEnvSyncChain = Promise.resolve();
    managedEnvironment;
    tmuxBinaryPath;
    tmuxConfigPath;
    execTmux: ExecTmux;
    constructor(args: TmuxSessionManagerArgs) {
        this.managedEnvironment = args.managedEnvironment ?? new ManagedEnvironmentDependency();
        this.tmuxBinaryPath = resolveTmuxBinaryPath({
            importMetaUrl: "file:///workdir/packages/exec-daemon/src/tmux-session-manager.ts",
            tmuxBinaryPath: args.tmuxBinaryPath,
        });
        this.tmuxConfigPath = resolveTmuxConfigPath({
            importMetaUrl: "file:///workdir/packages/exec-daemon/src/tmux-session-manager.ts",
            tmuxConfigPath: args.tmuxConfigPath,
        });
        const execTmux: ExecTmux = args.execTmux ??
            (async (tmuxArgs, env) => {
                const fullArgs = [...buildTmuxGlobalArgs(this.tmuxConfigPath), ...tmuxArgs];
                // The first client command forks the tmux *server*, which daemonizes
                // and then forks every session, pane, and workload. spawnWorkload
                // places the child in the workload cgroup when armed (and that shim
                // also resets oom_score_adj before exec). On the unarmed path it
                // only resets the client pid from the parent — too late for tmux —
                // so resolveTmuxClientSpawn keeps SAND-2741's before-exec wrap.
                const wrapped = resolveTmuxClientSpawn(this.tmuxBinaryPath, fullArgs);
                const result = await spawnWorkload(execFileUtf8Async, wrapped.command, wrapped.args, {
                    env,
                    maxBuffer: 10 * 1024 * 1024,
                    // All calls here are short-lived tmux client commands; a wedged
                    // tmux server must not hang callers (env refreshes hold the
                    // env-update lock). new-session gets a longer bound: it does the
                    // most work (server fork + shell spawn on a possibly loaded box),
                    // and killing the client can leave the server-side create to
                    // finish anyway, surfacing a confusing AlreadyExists on retry.
                    timeout: tmuxArgs[0] === "new-session" ? 30000 : 10000,
                });
                return result.stdout;
            });
        this.execTmux = async (tmuxArgs, env) => {
            try {
                return await execTmux(tmuxArgs, env);
            }
            catch (error) {
                throw classifyTmuxExecError(error);
            }
        };
        this.workspacePath = args.workspacePath;
        this.ptyManager = args.ptyManager;
        this.globalContext = args.globalContext;
    }
    workspacePath;
    ptyManager;
    globalContext;
    isValidSessionName(sessionName: string) {
        return SESSION_NAME_PATTERN.test(sessionName);
    }
    getManagedEnvironment() {
        return this.managedEnvironment;
    }
    generateSessionName() {
        return `tmux-${nodeCrypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    }
    async hasSession(sessionName: string) {
        try {
            await this.execTmux(["has-session", "-t", toExactSessionTarget(sessionName)]);
            return true;
        }
        catch (error) {
            if (error instanceof TmuxNoServerError || error instanceof TmuxSessionNotFoundError) {
                return false;
            }
            throw error;
        }
    }
    createSessionRecord(args: { sessionName: string; createdAtUnixMs: number; attachedClientCount: number }) {
        const metadata = this.sessionMetadata.get(args.sessionName);
        return {
            sessionId: args.sessionName,
            sessionName: args.sessionName,
            displayName: metadata?.displayName ?? args.sessionName,
            kind: metadata?.kind ?? TmuxSessionKind.UNSPECIFIED,
            cwd: metadata?.cwd ?? "",
            shell: metadata?.shell ?? "",
            processArgs: metadata?.processArgs ?? [],
            createdAtUnixMs: args.createdAtUnixMs,
            attachedClientCount: args.attachedClientCount,
        };
    }
    validateEnvNames(names: Iterable<string>) {
        for (const name of names) {
            if (!ENV_NAME_PATTERN.test(name) ||
                CURSOR_SANDBOX_ENV_NAME_PATTERN.test(name) ||
                name === WORKLOAD_CGROUP_ENV_VAR ||
                name === SPAWN_CWD_HOP_ENV_VAR) {
                throw new TmuxValidationError(`Invalid environment variable name: ${name}`);
            }
        }
    }
    async createSession(args: TmuxCreateSessionArgs) {
        const sessionName = args.sessionName ?? this.generateSessionName();
        if (!this.isValidSessionName(sessionName)) {
            throw new TmuxValidationError(`Invalid tmux session name: ${sessionName}`);
        }
        if (await this.hasSession(sessionName)) {
            throw new TmuxSessionAlreadyExistsError(`Tmux session already exists: ${sessionName}`);
        }
        const cwd = args.cwd || this.workspacePath;
        if (args.env !== undefined) {
            this.validateEnvNames(Object.keys(args.env));
        }
        const processArgs = args.process?.args ?? [];
        const metadata = {
            displayName: args.displayName || sessionName,
            kind: args.kind,
            cwd,
            shell: args.process?.shell ?? "",
            processArgs,
        };
        // Everything env-derived runs on the sync chain so the session cannot
        // fork/join a server mid-refresh or use inputs staler than the refresh
        // it queued behind.
        await this.withGlobalEnvSyncLock(async () => {
            // Re-sync keys a running server may have missed before creating a
            // session that would inherit the gap.
            await this.retryPendingGlobalSyncLocked();
            // Only locale + per-request env ride on `-e` argv; the managed env
            // reaches sessions via the server global env (see
            // refreshGlobalEnvironment). C.UTF-8 entries are defaults: managed
            // locale vars override them, per-request env overrides both.
            const managedSnapshot = this.managedEnvironment.snapshot();
            const localeEnv: Record<string, string> = { ...UTF8_LOCALE_ENV };
            for (const key of Object.keys(UTF8_LOCALE_ENV)) {
                const managedValue = managedSnapshot[key];
                if (managedValue !== undefined) {
                    localeEnv[key] = managedValue;
                }
            }
            const sessionEnv = {
                ...localeEnv,
                ...(args.env ?? {}),
            };
            const tmuxArgs = [
                "new-session",
                "-d",
                "-s",
                sessionName,
                "-c",
                cwd,
                ...Object.entries(sessionEnv).flatMap(([name, value]) => ["-e", `${name}=${value}`]),
                ...(args.process ? ["--", args.process.shell, ...processArgs] : []),
            ];
            // The spawn env seeds a forked server's global environment, so it
            // holds only env every future session should inherit — never the
            // per-request env, which is session-scoped via `-e`. The snapshot
            // guarantees managed additions even standalone; removals rely on the
            // process.env mirror in control.ts (a spread cannot delete keys).
            await this.execTmux(tmuxArgs, {
                ...process.env,
                ...managedSnapshot,
                ...localeEnv,
            });
        });
        this.sessionMetadata.set(sessionName, metadata);
        logger.info(this.globalContext, "Created tmux session", {
            sessionName,
            kind: args.kind,
            cwd,
        });
        const session = await this.getSession(sessionName);
        if (!session) {
            throw new TmuxError(`Tmux session was created but not found: ${sessionName}`);
        }
        return session;
    }
    async listSessions() {
        let stdout: string;
        try {
            stdout = await this.execTmux(["list-sessions", "-F", LIST_SESSIONS_FORMAT]);
        }
        catch (error) {
            if (error instanceof TmuxNoServerError) {
                return [];
            }
            throw error;
        }
        const sessions = parseTmuxSessionLines(stdout).map((session) => this.createSessionRecord(session));
        sessions.sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs);
        return sessions;
    }
    async getSession(sessionId: string) {
        const sessions = await this.listSessions();
        return sessions.find((session) => session.sessionId === sessionId);
    }
    async killSession(sessionId: string) {
        if (!(await this.hasSession(sessionId))) {
            return false;
        }
        await this.execTmux(["kill-session", "-t", toExactSessionTarget(sessionId)]);
        this.sessionMetadata.delete(sessionId);
        logger.info(this.globalContext, "Killed tmux session", { sessionId });
        return true;
    }
    async refreshSessionEnvironment(args: TmuxSessionEnvironmentUpdate) {
        const sessionName = args.sessionName;
        if (!this.isValidSessionName(sessionName)) {
            throw new TmuxValidationError(`Invalid tmux session name: ${sessionName}`);
        }
        this.validateEnvNames(Object.keys(args.env));
        const removedKeys = Array.from(args.removedKeys ?? []);
        this.validateEnvNames(removedKeys);
        if (!(await this.hasSession(sessionName))) {
            return {
                sessionExists: false,
                applied: 0,
                removed: 0,
                refreshedPane: false,
            };
        }
        const targetSession = toExactSessionTarget(sessionName);
        for (const key of removedKeys) {
            await this.execTmux(["set-environment", "-r", "-t", targetSession, key]);
        }
        for (const [name, value] of Object.entries(args.env)) {
            await this.execTmux(["set-environment", "-t", targetSession, name, value]);
        }
        const refreshedPane = args.refreshPaneIfIdle === true
            ? await this.refreshShellPaneFromSessionEnvironment(sessionName)
            : false;
        logger.info(this.globalContext, "Refreshed tmux session environment", {
            applied: Object.keys(args.env).length,
            removed: removedKeys.length,
            refreshedPane,
        });
        return {
            sessionExists: true,
            applied: Object.keys(args.env).length,
            removed: removedKeys.length,
            refreshedPane,
        };
    }
    /**
     * Sync a managed-environment update into the tmux server's *global*
     * environment, one `set-environment -g` per key. This is how the managed
     * env reaches new sessions: it never rides on `new-session -e` argv, whose
     * ~160KB command-size limit made large secret sets break the web terminal
     * ("command too long"). Per-key failures are skipped so one bad key cannot
     * block the rest; no running server is a success no-op (the next fork
     * inherits this process's already-updated env).
     */
    async refreshGlobalEnvironment(args: TmuxEnvironmentUpdate) {
        return this.withGlobalEnvSyncLock(() => this.refreshGlobalEnvironmentLocked(args));
    }
    withGlobalEnvSyncLock<T>(fn: () => T | PromiseLike<T>): Promise<T> {
        const result = this.globalEnvSyncChain.then(fn, fn);
        this.globalEnvSyncChain = result.then(() => undefined, () => undefined);
        return result;
    }
    async refreshGlobalEnvironmentLocked(args: TmuxEnvironmentUpdate) {
        this.validateEnvNames(Object.keys(args.env));
        const removedKeys = Array.from(args.removedKeys ?? []);
        this.validateEnvNames(removedKeys);
        const operations: { key: string; value?: string }[] = [
            ...removedKeys.map((key) => ({ key })),
            ...Object.entries(args.env).map(([key, value]) => ({ key, value })),
        ];
        let applied = 0;
        let removed = 0;
        const failedKeys: string[] = [];
        let serverRunning = true;
        for (const [index, operation] of operations.entries()) {
            const { key, value } = operation;
            try {
                if (value === undefined) {
                    await this.execTmux(["set-environment", "-g", "-u", key]);
                    removed += 1;
                }
                else {
                    await this.execTmux(["set-environment", "-g", key, value]);
                    applied += 1;
                }
                this.pendingGlobalSyncKeys.delete(key);
            }
            catch (error) {
                if (error instanceof TmuxNoServerError) {
                    // "No server" can race a concurrent fork that captured the
                    // pre-update spawn env, so keep the keys pending; the pre-fork
                    // retry heals that server or confirms no server and clears them.
                    serverRunning = false;
                    for (const rest of operations.slice(index)) {
                        this.pendingGlobalSyncKeys.add(rest.key);
                    }
                    break;
                }
                failedKeys.push(key);
                this.pendingGlobalSyncKeys.add(key);
                if (error instanceof TmuxCommandTimeoutError) {
                    // A wedged server would time out every key; bail after one timeout
                    // and mark the rest pending. Rotate the timed-out key behind the
                    // skipped ones so a bad key cannot starve their retries.
                    for (const rest of operations.slice(index + 1)) {
                        this.pendingGlobalSyncKeys.add(rest.key);
                    }
                    this.pendingGlobalSyncKeys.delete(key);
                    this.pendingGlobalSyncKeys.add(key);
                    break;
                }
            }
        }
        if (failedKeys.length > 0) {
            // Log variable names only, never values.
            logger.warn(this.globalContext, "Failed to set some tmux global environment variables", {
                failedKeys,
                applied,
                removed,
            });
        }
        return {
            serverRunning,
            applied,
            removed,
            failed: failedKeys.length,
        };
    }
    /**
     * Re-sync pending keys so a new session cannot persistently miss managed
     * env. Must run under the global-env sync lock. Values mirror process.env
     * (managed snapshot only as standalone fallback), so a failed
     * overlay-release restore is re-set, never unset. A confirmed no-server
     * result clears the set: the caller forks a server that inherits
     * process.env under this same lock.
     */
    async retryPendingGlobalSyncLocked() {
        if (this.pendingGlobalSyncKeys.size === 0) {
            return;
        }
        const managed = this.managedEnvironment.snapshot();
        const env: Record<string, string> = {};
        const removedKeys: string[] = [];
        for (const key of this.pendingGlobalSyncKeys) {
            const value = process.env[key] ?? managed[key];
            if (value === undefined) {
                removedKeys.push(key);
            }
            else {
                env[key] = value;
            }
        }
        const result = await this.refreshGlobalEnvironmentLocked({
            env,
            removedKeys,
        });
        if (!result.serverRunning) {
            this.pendingGlobalSyncKeys.clear();
        }
    }
    async refreshShellPaneFromSessionEnvironment(sessionName: string) {
        const targetPane = toExactSessionPaneTarget(sessionName);
        const paneCommand = (await this.execTmux(["display-message", "-p", "-t", targetPane, "#{pane_current_command}"])).trim();
        const normalizedPaneCommand = nodePath.basename(paneCommand);
        if (!REFRESHABLE_SHELL_COMMANDS.has(normalizedPaneCommand)) {
            logger.info(this.globalContext, "Skipped tmux pane environment refresh because pane is busy", {});
            return false;
        }
        const refreshCommand = buildShellEnvironmentRefreshCommand({
            tmuxBinaryPath: this.tmuxBinaryPath,
            tmuxConfigPath: this.tmuxConfigPath,
            sessionName,
        });
        await this.execTmux(["send-keys", "-l", "-t", targetPane, refreshCommand]);
        await this.execTmux(["send-keys", "-t", targetPane, "C-m"]);
        return true;
    }
    async attachSession(args: { sessionId: string; cols?: number; rows?: number }) {
        const session = await this.getSession(args.sessionId);
        if (!session) {
            return undefined;
        }
        const ptyId = this.ptyManager.spawn({
            process: {
                shell: this.tmuxBinaryPath,
                args: [
                    ...buildTmuxGlobalArgs(this.tmuxConfigPath),
                    "attach-session",
                    "-t",
                    toExactSessionTarget(session.sessionName),
                ],
            },
            cwd: session.cwd || this.workspacePath,
            env: {},
            cols: args.cols && args.cols > 0 ? args.cols : DEFAULT_COLS,
            rows: args.rows && args.rows > 0 ? args.rows : DEFAULT_ROWS,
        });
        logger.info(this.globalContext, "Attached tmux session", {
            sessionId: args.sessionId,
            ptyId,
        });
        return {
            ptyId,
            session,
        };
    }
    /**
     * Stop the tmux server started by this manager. `execTmux` uses the daemon
     * environment, including `TMUX_TMPDIR`, so servers on other sockets are untouched.
     * A server that never started is a no-op.
     */
    async dispose() {
        try {
            await this.execTmux(["kill-server"]);
        }
        catch (error) {
            if (error instanceof TmuxNoServerError) {
                return;
            }
            throw error;
        }
    }
}
