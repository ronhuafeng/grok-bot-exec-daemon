import { createLogger } from "../interop/vendor/context-logger.js";
import { isX11Installed as isX11InstalledDependency, waitForDisplay as waitForDisplayDependency, detectDisplaySync as detectDisplaySyncDependency, MacComputerUseRPCClient, X11ComputerUseExecutor as X11ComputerUseExecutorDependency, parseDisplayNum, resolutionConfigForDisplay, MacRemoteComputerUseExecutor, LazyX11ComputerUseExecutor } from "../interop/vendor/local-exec.js";
import type { Context } from "../interop/contracts/context.js";
import type { BuiltinComputerUseExecutor, X11ComputerUseExecutor } from "../interop/contracts/computer-use.js";

export interface ComputerUseSetupArgs {
    isComputerUseEnabled: boolean;
    lazyComputerUseInit: boolean;
    display: string;
    xdpyinfoPath?: string;
    apiWidth?: number;
    apiHeight?: number;
}
export interface ComputerUseSetupDeps {
    isX11Installed: typeof import("../interop/vendor/local-exec.js").isX11Installed;
    waitForDisplay: typeof import("../interop/vendor/local-exec.js").waitForDisplay;
    detectDisplaySync: typeof import("../interop/vendor/local-exec.js").detectDisplaySync;
    platform: NodeJS.Platform;
    isMacSidecarInstalled(): boolean;
}

/**
 * Builds the exec-daemon's computer-use executor.
 *
 * Both launchers (Sand's start-exec-daemon.sh and the cloud-agent podConfig)
 * pass `--computer-use-lazy-init`: the daemon can start before the desktop is
 * up, and the eager one-shot wait-for-display would otherwise lose that race
 * and leave `computerUseExecutorResource` unregistered for the daemon's whole
 * life — every Computer action failing with "No handler found for server
 * message of type computerUseArgs" even once the desktop is healthy. The lazy
 * path registers the executor immediately and initializes X11 on first use,
 * failing soft with a retryable error while the desktop is still coming up.
 *
 * The flag-off default keeps the eager path (wait once at startup, disable on
 * timeout) for launchers that predate the flag.
 *
 * On macOS (`platform === "darwin"`), `--computer-use` registers
 * MacRemoteComputerUseExecutor when the Cursor Computer Use sidecar is
 * discoverable. Missing sidecar fail-softs (no executor, no advertisement)
 * and never takes the X11 path.
 */
export const logger = createLogger("exec-daemon");
// This capability test is restricted to instances produced by the three
// retained built-in constructors below; it is not a validator for arbitrary objects.
export function computerUseExecutorHasInputEventLogger(executor: BuiltinComputerUseExecutor): executor is X11ComputerUseExecutor {
    return "setInputEventLogger" in executor;
}
export const defaultComputerUseSetupDeps: ComputerUseSetupDeps = {
    isX11Installed: isX11InstalledDependency,
    waitForDisplay: waitForDisplayDependency,
    detectDisplaySync: detectDisplaySyncDependency,
    platform: "linux",
    isMacSidecarInstalled: () => MacComputerUseRPCClient.isInstalled(),
};
export function buildX11ExecutorForDisplay(deps: ComputerUseSetupDeps, display: string, api?: { width?: number; height?: number }) {
    const { width, height } = deps.detectDisplaySync(display).display;
    return new X11ComputerUseExecutorDependency({
        displayNum: parseDisplayNum(display),
        display,
        resolution: resolutionConfigForDisplay(width, height, api?.width, api?.height),
    });
}
export async function buildExecDaemonComputerUseExecutor(ctx: Context, args: ComputerUseSetupArgs, deps: ComputerUseSetupDeps = defaultComputerUseSetupDeps) {
    const { isComputerUseEnabled, lazyComputerUseInit, display, xdpyinfoPath, apiWidth, apiHeight } = args;
    if (!isComputerUseEnabled) {
        logger.info(ctx, "computer_use_init_result", {
            outcome: "disabled_by_flag",
            display,
            xdpyinfoPath,
        });
        return undefined;
    }
    const computerUseInitStartMs = Date.now();
    if (deps.platform === "darwin") {
        if (!deps.isMacSidecarInstalled()) {
            logger.warn(ctx, "macOS computer use sidecar was not found. Install Cursor Computer Use and grant Accessibility and Screen Recording. This worker will not advertise computer-use support.", { display });
            logger.info(ctx, "computer_use_init_result", {
                outcome: "mac_sidecar_not_found",
                durationMs: Date.now() - computerUseInitStartMs,
                display,
            });
            return undefined;
        }
        const macExecutor = new MacRemoteComputerUseExecutor();
        logger.info(ctx, "Computer use enabled - MacRemoteComputerUseExecutor registered", { display });
        logger.info(ctx, "computer_use_init_result", {
            outcome: "registered_lazy",
            display,
            executor: "mac_remote",
        });
        return macExecutor;
    }
    // X11 not installed at all is the only case with genuinely no desktop to
    // drive, in BOTH modes: skip immediately (identical to the pre-existing eager
    // behavior).
    if (!deps.isX11Installed()) {
        logger.info(ctx, "X11 is not installed (xdpyinfo not found) - skipping computer use setup", {
            display,
        });
        logger.info(ctx, "computer_use_init_result", {
            outcome: "x11_not_installed",
            durationMs: Date.now() - computerUseInitStartMs,
            display,
            xdpyinfoPath,
        });
        return undefined;
    }
    // Lazy path (see file header): register immediately, initialize X11 on
    // first use.
    if (lazyComputerUseInit) {
        const lazyExecutor = new LazyX11ComputerUseExecutor({
            display,
            initialize: async (displayToInit, readyTimeoutMs) => {
                await deps.waitForDisplay(displayToInit, readyTimeoutMs);
                return buildX11ExecutorForDisplay(deps, displayToInit, {
                    width: apiWidth,
                    height: apiHeight,
                });
            },
        });
        // Best-effort background warm-up: never blocks startup, and a slow/absent
        // desktop just defers init to the first Computer action, which retries.
        lazyExecutor.prime(ctx);
        logger.info(ctx, "Computer use enabled - lazy X11ComputerUseExecutor registered", { display });
        logger.info(ctx, "computer_use_init_result", {
            outcome: "registered_lazy",
            display,
            xdpyinfoPath,
        });
        return lazyExecutor;
    }
    // Eager path (flag-off default): wait for the display, then build the X11
    // executor; disable computer-use if it never appears.
    try {
        // We do not wait for desktop-init.sh to finish, so we need to wait for the
        // display to become available to prevent a race condition.
        logger.info(ctx, "Waiting for X11 display to become available", {
            display,
            xdpyinfoPath,
        });
        await deps.waitForDisplay(display);
        logger.info(ctx, "X11 display is ready", {
            display,
            waitDurationMs: Date.now() - computerUseInitStartMs,
        });
        const executor = buildX11ExecutorForDisplay(deps, display, {
            width: apiWidth,
            height: apiHeight,
        });
        logger.info(ctx, "Computer use enabled - X11ComputerUseExecutor created", {
            display,
        });
        logger.info(ctx, "computer_use_init_result", {
            outcome: "ready",
            durationMs: Date.now() - computerUseInitStartMs,
            display,
        });
        return executor;
    }
    catch (error) {
        logger.error(ctx, "Failed to detect display for computer use - disabling", error);
        logger.warn(ctx, "computer_use_init_result", {
            outcome: "wait_for_display_failed",
            durationMs: Date.now() - computerUseInitStartMs,
            display,
            xdpyinfoPath,
            errorName: error instanceof Error ? error.name : undefined,
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
}
