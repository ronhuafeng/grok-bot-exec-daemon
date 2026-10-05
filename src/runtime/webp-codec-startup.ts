import { createLogger } from "../interop/vendor/context-logger.js";
import { registerLocalWebpCodec } from "../interop/vendor/local-exec.js";
import type { Context } from "../interop/contracts/context.js";

/**
 * Registers the bundled WebP codec for this daemon process and logs the
 * outcome.
 *
 * The agent loop's image resizing for Read and MCP results runs here, on the
 * pod, not in the server driving the loop: `LocalReadExecutor` fits every
 * image into the shared byte and dimension caps before it answers, and for
 * WebP that step needs a codec registered with `@anysphere/utils`
 * (`registerWebpCodec`). The backend registers its own when it builds a
 * session and the IDE extension host registers at activation; a daemon that
 * registers none answers every oversized `.webp` Read with a `ReadResult`
 * error naming the missing registration, which the loop reports as a failed
 * tool call.
 *
 * The codec is the jsquash wasm `@anysphere/local-exec` already ships for Mac
 * computer-use screenshots (`node_modules/@jsquash/webp` and
 * `mac-webp-runtime.cjs` beside the packaged bundle). Registration probes
 * those assets first, so a bundle that lost them logs the reason and keeps the
 * codec-less behavior instead of failing at first use.
 */
export const logger = createLogger("exec-daemon");
export function registerExecDaemonWebpCodec(ctx: Context) {
    const registration = registerLocalWebpCodec();
    if (registration.registered) {
        logger.info(ctx, "webp_codec.startup", { registered: true });
        return registration;
    }
    logger.error(ctx, "webp_codec.startup.unavailable", {
        registered: false,
        reason: registration.reason,
        platform: "linux",
        arch: "x64",
    });
    return registration;
}
