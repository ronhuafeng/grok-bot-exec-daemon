import nodePath from "node:path";
/**
 * Debian/Ubuntu-style default PATH used when the daemon process has none.
 *
 * Warm-fork `exec_daemon_restart_only` (CHAR-941) can relaunch exec-daemon with
 * an empty/missing PATH. `ControlServer.exec` uses `shell: false`, so bare
 * commands (`mkdir`, `sh`, `bash`, `git`) then fail with ENOENT. Keep this in
 * sync with anyrun isod/pod-daemon defaults.
 */
export const DEFAULT_SYSTEM_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin";
/**
 * Directory containing the bundled exec-daemon runtime binaries (`node`, `npx`, `rg`, …).
 * In cloud VMs this is `/exec-daemon`; locally it is `dist-package` after build-package.
 */
export function getExecDaemonBundleDir() {
    return nodePath.dirname(process.execPath);
}
/**
 * Bundled binaries that stay off PATH unless the launcher opts in, so rollout of a
 * new tool is a backend gate rather than a redeploy. Holds `origin` (the Origin CLI).
 */
export function getExecDaemonGatedToolsDir() {
    return nodePath.join(getExecDaemonBundleDir(), "tools");
}
/**
 * Backfill a usable system PATH when the process env has none.
 * No-op on Windows (cloud VMs are Linux) and when PATH is already non-empty.
 */
export function ensureSystemPath(env = process.env) {
    if (false) // removed by dead control flow
     { }
    const pathKey = resolvePathKey(env);
    const current = env[pathKey];
    if (current !== undefined && current.trim() !== "") {
        return;
    }
    env[pathKey] = DEFAULT_SYSTEM_PATH;
}
/**
 * Prepend the bundled tool directory to PATH so stdio MCP configs can spawn `npx`
 * (and other shims colocated with the bundled `node`) without relying on nvm/bash profile.
 * Also guarantees a system PATH when the daemon was launched with none (CHAR-941).
 */
export function prependExecDaemonBundleToPath(env = process.env) {
    ensureSystemPath(env);
    prependDirToPath(getExecDaemonBundleDir(), env);
}
/**
 * Expose the gated tools directory, making `origin` resolvable to agent shells.
 * Called from the serve action rather than module load, because the launcher
 * flag that enables it is only known after argument parsing.
 */
export function prependExecDaemonGatedToolsToPath(env = process.env) {
    ensureSystemPath(env);
    prependDirToPath(getExecDaemonGatedToolsDir(), env);
}
export function resolvePathKey(env: NodeJS.ProcessEnv) {
    return "Path" in env && env.Path !== undefined && env.Path !== "" ? "Path" : "PATH";
}
export function prependDirToPath(dir: string, env: NodeJS.ProcessEnv) {
    const pathKey = resolvePathKey(env);
    const delimiter = (false ? 0 : ":") as ":";
    const segments = (env[pathKey] ?? "").split(delimiter).filter(Boolean);
    if (segments.includes(dir)) {
        return;
    }
    env[pathKey] = segments.length > 0 ? `${dir}${delimiter}${segments.join(delimiter)}` : dir;
}
