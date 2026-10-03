module.exports = {
/***/ "./src/setup.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Sg: () => (/* binding */ EXEC_DAEMON_DATA_DIR_ENV_VAR),
  My: () => (/* binding */ setupDaemon)
});

// UNUSED EXPORTS: DaemonPermissionsService

// EXTERNAL MODULE: external "node:child_process"
var external_node_child_process_ = __webpack_require__("node:child_process");
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
// EXTERNAL MODULE: ../agent-exec/dist/index.js + 56 modules
var dist = __webpack_require__("../agent-exec/dist/index.js");
// EXTERNAL MODULE: ../context/dist/logger.js
var logger = __webpack_require__("../context/dist/logger.js");
// EXTERNAL MODULE: ../context/dist/otel.js
var otel = __webpack_require__("../context/dist/otel.js");
// EXTERNAL MODULE: ../utils/dist/workspace-paths.js
var workspace_paths = __webpack_require__("../utils/dist/workspace-paths.js");
;// ../cursor-config/dist/paths.js
/* unused harmony import specifier */ var createHash;
/* unused harmony import specifier */ var homedir;
/* unused harmony import specifier */ var join;
/* unused harmony import specifier */ var slugifyPath;




function getConfigDir() {
    // Allow explicit override
    const override = process.env.CURSOR_CONFIG_DIR;
    if (override?.trim())
        return override;
    // Respect XDG on *nix if present
    const xdg = process.env.XDG_CONFIG_HOME;
    if (xdg?.trim())
        return join(xdg, "cursor");
    // Fallback: ~/.cursor
    return join(homedir(), ".cursor");
}
function getDataDir() {
    // Allow explicit override
    const override = process.env.CURSOR_DATA_DIR;
    if (override?.trim())
        return override;
    // Default: ~/.cursor
    return (0,external_node_path_.join)((0,external_node_os_.homedir)(), ".cursor");
}
function getProjectsDir() {
    return (0,external_node_path_.join)(getDataDir(), "projects");
}
function getProjectDir(projectPath) {
    return (0,external_node_path_.join)(getProjectsDir(), (0,workspace_paths/* slugifyPath */.r_)(projectPath));
}
const HASH_LENGTH = 7; // SHA-256 first 7 characters
const MAX_SOCKET_PATH_LENGTH = 104; // max socket path length on MacOS
const WINDOWS_SOCK_LENGTH = "worker.sock".length;
const MAX_PREFIX_LENGTH_BEFORE_HASH = MAX_SOCKET_PATH_LENGTH - 1 - HASH_LENGTH - 1 - WINDOWS_SOCK_LENGTH; // full socket path = prefix + "-" + hash + "/" + "worker.sock"
const MAX_FULL_PATH_LENGTH = MAX_SOCKET_PATH_LENGTH - WINDOWS_SOCK_LENGTH - 1; // need to apped "/worker.sock" to the path
function getProjectDirForSocketPath(projectPath) {
    let projectsDir = getProjectsDir();
    if (projectsDir.length > MAX_PREFIX_LENGTH_BEFORE_HASH) {
        // Fall back to ~/.cursor so we don't truncate the project directory
        projectsDir = getDataDir();
        if (projectsDir.length > MAX_PREFIX_LENGTH_BEFORE_HASH) {
            // wtf, this person's home directory is super long!
            // Just try to write to /tmp/.cursor I guess
            // This will probably (almost) never happen
            projectsDir = "/tmp/.cursor";
        }
    }
    const fullPath = join(projectsDir, slugifyPath(projectPath));
    if (fullPath.length > MAX_FULL_PATH_LENGTH) {
        const hash = createHash("sha256").update(fullPath).digest("hex").substring(0, HASH_LENGTH);
        const prefix = fullPath.substring(0, Math.min(MAX_PREFIX_LENGTH_BEFORE_HASH, fullPath.length));
        return `${prefix}-${hash}`;
    }
    return fullPath;
}
function getConfigFilePath() {
    return join(getConfigDir(), "cli-config.json");
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/shell_exec_pb.js
var shell_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/shell_exec_pb.js");
// EXTERNAL MODULE: ../utils/dist/promise-extras.js
var promise_extras = __webpack_require__("../utils/dist/promise-extras.js");
;// ../hooks-exec/dist/agent-store-conflict-accessor.js
/**
 * Per-exec conflict-notice drain wired into the shared resource stack plus
 * fire-and-forget wake-on-write / wake-after-shell.
 *
 * This is the outermost resource-accessor wrapper: it sits *above*
 * {@link ListableHooksResourceAccessor} so that after each executor's
 * `execute` resolves (hooks already ran and pushed their own carriers), it
 * drains the mounted stores' conflict journals and appends one batched
 * `HookAdditionalContext{hook_event_name:"agentStoreConflict"}` to the same
 * `options.hookContextCollector` the exec handler flushes onto the tool
 * result envelope.
 *
 * Draining only happens when a `hookContextCollector` is present *and*
 * delivery is not explicitly opted out via
 * `deliverAgentStoreConflictNotices === false` (controlled/remote sets that
 * when `acceptHookAdditionalContexts` is false). Streaming execs are drained
 * too — foreground Shell streams but still passes a collector + delivery flag,
 * so we drain after the stream completes; collector-less streams degrade to a
 * wake-only `wakeExposedMounts()` that accelerates detection for a later exec.
 *
 * Rejected / aborted execs wake the sync engine but do not peek/ack: the agent
 * only surfaces `hookAdditionalContexts` on successful tool envelopes, so
 * acking on failure would permanently silence notices.
 * Callers with an in-process eager host may set `skipPathWriteDrain` so
 * structured `write` is attributed on the tool result after a forced sync
 * instead of via the post-tool journal drain.
 * Remote / no-host callers should supply `forceWrittenPathBeforeDrain` so
 * the drain awaits one sync round before peeking — wake alone is
 * fire-and-forget and races journal materialization.
 */



function isExecutorLike(impl) {
    return (typeof impl === "object" &&
        impl !== null &&
        "execute" in impl &&
        typeof impl.execute === "function");
}
function isAsyncIterable(value) {
    return (typeof value === "object" &&
        value !== null &&
        Symbol.asyncIterator in value &&
        typeof value[Symbol.asyncIterator] === "function");
}
function isPromiseLike(value) {
    return (typeof value === "object" &&
        value !== null &&
        "then" in value &&
        typeof value.then === "function");
}
/** Duck-type a ShellStream `backgrounded` event (instanceof is brittle across copies). */
function isShellBackgroundedStreamEvent(event) {
    if (typeof event !== "object" || event === null) {
        return false;
    }
    const nested = event.event;
    return nested?.case === "backgrounded";
}
function extractWritePath(args) {
    if (typeof args !== "object" || args === null) {
        return undefined;
    }
    const path = args.path;
    return typeof path === "string" && path.length > 0 ? path : undefined;
}
function wakeBehaviorFor(resourceSymbol) {
    if (resourceSymbol === dist/* writeExecutorResource */.Lnu.symbol ||
        resourceSymbol === dist/* deleteExecutorResource */.RpG.symbol ||
        resourceSymbol === dist/* piWriteExecutorResource */.ohZ.symbol ||
        resourceSymbol === dist/* piEditExecutorResource */.PiX.symbol) {
        return { kind: "path" };
    }
    if (resourceSymbol === dist/* shellExecutorResource */.qkk.symbol ||
        resourceSymbol === dist/* shellStreamExecutorResource */.wve.symbol ||
        resourceSymbol === dist/* backgroundShellExecutorResource */.OkD.symbol ||
        resourceSymbol === dist/* piBashExecutorResource */.TZ.symbol) {
        return { kind: "exposed" };
    }
    return undefined;
}
/** Map a host force outcome onto the write_barrier metric enum. */
function writeBarrierOutcomeFromForce(outcome) {
    return outcome === "synced-path" ? "synced_path" : outcome;
}
/** Default write-barrier bound when the caller omits `writeBarrierTimeoutMs`. */
const DEFAULT_WRITE_BARRIER_TIMEOUT_MS = 2_000;
async function awaitForceWrittenPathBeforeDrain(force, args, wake, options) {
    const report = (event) => {
        try {
            options.onWriteBarrier?.(event);
        }
        catch {
            // ignore
        }
    };
    if (force === undefined || wake?.kind !== "path") {
        return;
    }
    const writtenPath = extractWritePath(args);
    if (writtenPath === undefined) {
        return;
    }
    if (!(options.timeoutMs > 0)) {
        report({ durationMs: 0, outcome: "skipped" });
        return;
    }
    const start = Date.now();
    // Map force resolution/rejection to a value so a post-deadline settle never
    // becomes an unhandled rejection when the timeout wins the race.
    const forceOutcome = force(writtenPath).then((result) => result, () => "error");
    const raced = await Promise.race([
        forceOutcome,
        (0,promise_extras/* delay */.cb)(options.timeoutMs).then(() => "timeout"),
    ]);
    if (raced === "not_store_path") {
        return;
    }
    report({ durationMs: Date.now() - start, outcome: raced });
}
/**
 * Wraps a `ListableResourceAccessor`, decorating every executor's `execute`
 * with a post-invocation conflict-journal drain and a fire-and-forget wake.
 */
class AgentStoreConflictDrainResourceAccessor {
    cacheCarriersForExecId(execId, carriers) {
        // Never let an empty result overwrite a non-empty sibling that already
        // cached real carriers for this execId (concurrent retries after ack).
        const existing = this.carriersByExecId.get(execId);
        if (existing !== undefined && existing.length > 0 && carriers.length === 0) {
            return;
        }
        if (this.carriersByExecId.has(execId)) {
            this.carriersByExecId.delete(execId);
        }
        this.carriersByExecId.set(execId, carriers);
        while (this.carriersByExecId.size > AgentStoreConflictDrainResourceAccessor.CARRIERS_BY_EXEC_ID_MAX) {
            const oldest = this.carriersByExecId.keys().next().value;
            if (oldest === undefined) {
                break;
            }
            this.carriersByExecId.delete(oldest);
        }
    }
    constructor(inner, drain, wake, options) {
        this.inner = inner;
        this.wake = wake;
        /**
         * Re-emit the same notices on execId-cache retries without re-peeking/acking.
         * Cap at 32 entries with FIFO eviction (no external LRU dep — the VS Code
         * nested lockfile for cursor-agent-exec must stay in sync with hooks-exec).
         */
        this.carriersByExecId = new Map();
        /** Single-flight peeks so concurrent same-execId retries share one drain. */
        this.inFlightByExecId = new Map();
        this.resolveDrain = typeof drain === "function" ? drain : (_ctx) => drain;
        this.skipPathWriteDrain = options?.skipPathWriteDrain;
        this.onWakeWrittenPath = options?.onWakeWrittenPath;
        this.forceWrittenPathBeforeDrain = options?.forceWrittenPathBeforeDrain;
        this.writeBarrierTimeoutMs = options?.writeBarrierTimeoutMs ?? DEFAULT_WRITE_BARRIER_TIMEOUT_MS;
        this.resolveWriteBarrierTimeoutMs = options?.resolveWriteBarrierTimeoutMs;
        this.onWriteBarrier = options?.onWriteBarrier;
    }
    resolveTimeoutMs() {
        if (this.resolveWriteBarrierTimeoutMs !== undefined) {
            try {
                const resolved = this.resolveWriteBarrierTimeoutMs();
                if (typeof resolved === "number" && Number.isFinite(resolved)) {
                    return resolved;
                }
            }
            catch {
                // Fall through to the static bound.
            }
        }
        return this.writeBarrierTimeoutMs;
    }
    get(resource) {
        return this.wrapImpl(resource.symbol, this.inner.get(resource));
    }
    *entries() {
        for (const [resource, impl] of this.inner.entries()) {
            yield [resource, this.wrapImpl(resource.symbol, impl)];
        }
    }
    wrapImpl(resourceSymbol, impl) {
        if (!isExecutorLike(impl)) {
            return impl;
        }
        const wake = wakeBehaviorFor(resourceSymbol);
        const resolveDrain = this.resolveDrain;
        const wakeCoordinator = this.wake;
        const skipPathWriteDrain = this.skipPathWriteDrain;
        const forceWrittenPathBeforeDrain = this.forceWrittenPathBeforeDrain;
        const resolveTimeoutMs = () => this.resolveTimeoutMs();
        const onWriteBarrier = this.onWriteBarrier;
        const onWakeWrittenPath = this.onWakeWrittenPath;
        const fireWake = (args, ctx) => {
            if (wake === undefined || wakeCoordinator === undefined) {
                return;
            }
            try {
                if (wake.kind === "path") {
                    const writtenPath = extractWritePath(args);
                    if (writtenPath !== undefined) {
                        wakeCoordinator.wakeForWrittenPath(writtenPath);
                        onWakeWrittenPath?.(writtenPath, ctx);
                    }
                }
                else {
                    wakeCoordinator.wakeExposedMounts();
                }
            }
            catch {
                // Wake is a best-effort latency optimization; never surface it.
            }
        };
        const cacheCarriersForExecId = this.cacheCarriersForExecId.bind(this);
        const carriersByExecId = this.carriersByExecId;
        const inFlightByExecId = this.inFlightByExecId;
        const appendDrain = async (ctx, options) => {
            const collector = options?.hookContextCollector;
            if (collector === undefined) {
                // No collector ⇒ do not peek/ack: a cursor advance without delivery
                // would permanently silence the notice for this session.
                return [];
            }
            // Controlled/remote allocates a collector even when the agent loop will
            // not accept hook contexts; do not consume journals in that case.
            // Local tools leave the flag undefined and still drain.
            if (options?.deliverAgentStoreConflictNotices === false) {
                return [];
            }
            // Empty string is "no id" on the controlled path (proto default); do not
            // share one cache slot across unrelated execs.
            const execId = options?.execId !== undefined && options.execId.length > 0 ? options.execId : undefined;
            if (execId !== undefined) {
                const cached = carriersByExecId.get(execId);
                if (cached !== undefined) {
                    if (cached.length > 0) {
                        collector.push(...cached);
                    }
                    return cached;
                }
                const inFlight = inFlightByExecId.get(execId);
                if (inFlight !== undefined) {
                    const carriers = await inFlight;
                    if (carriers.length > 0) {
                        collector.push(...carriers);
                    }
                    return carriers;
                }
            }
            const runPeek = async (attachTo) => {
                const drain = resolveDrain(ctx);
                let claimedIds = [];
                try {
                    const peeked = await drain.peek();
                    claimedIds = peeked.eventIds;
                    if (peeked.carriers.length > 0) {
                        // Ack only after the carrier is attached so a push failure leaves
                        // the events for a later drain.
                        attachTo.push(...peeked.carriers);
                        drain.ack(peeked.eventIds);
                        if (execId !== undefined) {
                            cacheCarriersForExecId(execId, peeked.carriers);
                        }
                        return peeked.carriers;
                    }
                    else if (claimedIds.length > 0) {
                        // Peek claimed ids but rendered nothing (gap-only / empty notice).
                        // Ack rather than release: the journal cursor already advanced, so
                        // releasing would re-lease the same pending gaps on every later exec.
                        drain.ack(claimedIds);
                    }
                    const empty = [];
                    if (execId !== undefined) {
                        cacheCarriersForExecId(execId, empty);
                    }
                    return empty;
                }
                catch {
                    // Drain is advisory; never fail the tool call on a drain error.
                    // Return claimed-but-unacked events so a later peek can deliver them.
                    if (claimedIds.length > 0) {
                        drain.release(claimedIds);
                    }
                    return [];
                }
            };
            if (execId === undefined) {
                return await runPeek(collector);
            }
            const pending = runPeek(collector);
            inFlightByExecId.set(execId, pending);
            try {
                return await pending;
            }
            finally {
                if (inFlightByExecId.get(execId) === pending) {
                    inFlightByExecId.delete(execId);
                }
            }
        };
        return new Proxy(impl, {
            get: (target, prop, receiver) => {
                if (prop !== "execute") {
                    return Reflect.get(target, prop, receiver);
                }
                return (ctx, args, options) => {
                    const result = target.execute.call(target, ctx, args, options);
                    if (isAsyncIterable(result)) {
                        // Streaming exec (e.g. foreground Shell): wake AND drain. Foreground
                        // shell uses `shellStreamExecutorResource` and passes both a
                        // `hookContextCollector` and `deliverAgentStoreConflictNotices`, so
                        // skipping the drain here would strand store conflicts written by
                        // the shell until a later non-streaming exec. `appendDrain` no-ops
                        // when there is no collector, so collector-less streams stay
                        // wake-only.
                        //
                        // On `backgrounded`, the agent loop returns before reading a
                        // trailing envelope — drain and inject a `hookContext` stream event
                        // *before* yielding `backgrounded` (same pattern as local-exec).
                        return (async function* wrapped() {
                            let drained = false;
                            let failed = false;
                            let completedNormally = false;
                            try {
                                for await (const event of result) {
                                    if (resourceSymbol === dist/* shellStreamExecutorResource */.wve.symbol &&
                                        isShellBackgroundedStreamEvent(event)) {
                                        if (!drained) {
                                            fireWake(args, ctx);
                                            const carriers = await appendDrain(ctx, options);
                                            drained = true;
                                            if (carriers.length > 0) {
                                                yield new shell_exec_pb/* ShellStream */.FI({
                                                    event: {
                                                        case: "hookContext",
                                                        value: new shell_exec_pb/* ShellStreamHookContext */.Ng({
                                                            hookAdditionalContexts: [...carriers],
                                                        }),
                                                    },
                                                });
                                            }
                                        }
                                        yield event;
                                        continue;
                                    }
                                    yield event;
                                }
                                completedNormally = true;
                            }
                            catch (error) {
                                failed = true;
                                throw error;
                            }
                            finally {
                                fireWake(args, ctx);
                                // Only ack after the inner stream exhausts. Thrown iterators and
                                // consumer abort (`return()` on this generator) must not peek/ack
                                // — the agent never reads a trailing envelope or hookContext event.
                                if (!drained && !failed && completedNormally) {
                                    await appendDrain(ctx, options);
                                }
                            }
                        })();
                    }
                    if (isPromiseLike(result)) {
                        return (async () => {
                            try {
                                const value = await result;
                                fireWake(args, ctx);
                                // Eager same-write attribution covers structured `write` only
                                // when the tool meta enabled conflict notices. Keep the per-exec
                                // drain otherwise so notices are not dropped until a later tool.
                                const skipDrain = resourceSymbol === dist/* writeExecutorResource */.Lnu.symbol &&
                                    skipPathWriteDrain?.() === true &&
                                    options?.enableAgentStoreConflictNotices === true;
                                if (!skipDrain) {
                                    // Remote drain: wake alone races journal materialization
                                    // (conflict files often land ~seconds after LocalWrite). Await
                                    // one force-sync of the written mount before peek/ack.
                                    await awaitForceWrittenPathBeforeDrain(forceWrittenPathBeforeDrain, args, wake, {
                                        timeoutMs: resolveTimeoutMs(),
                                        onWriteBarrier,
                                    });
                                    await appendDrain(ctx, options);
                                }
                                return value;
                            }
                            catch (error) {
                                // Wake so detection still accelerates, but do not peek/ack —
                                // failed tools never surface hook contexts to the model.
                                fireWake(args, ctx);
                                throw error;
                            }
                        })();
                    }
                    // Synchronous / unexpected shape: best-effort wake, no drain.
                    fireWake(args, ctx);
                    return result;
                };
            },
        });
    }
}
AgentStoreConflictDrainResourceAccessor.CARRIERS_BY_EXEC_ID_MAX = 32;

// EXTERNAL MODULE: external "node:fs/promises"
var promises_ = __webpack_require__("node:fs/promises");
var promises_default = /*#__PURE__*/__webpack_require__.n(promises_);
;// ../agent-store/sync/dist/paths.js
/* unused harmony import specifier */ var execFileSync;
/* unused harmony import specifier */ var fs;
/* unused harmony import specifier */ var os;
/* unused harmony import specifier */ var path;
/* unused harmony import specifier */ var isReservedAgentStorePathSegment;
/* unused harmony import specifier */ var AGENT_STORE_TMP_DIR_NAME_DEV;
/* unused harmony import specifier */ var AGENT_STORE_TMP_DIR_NAME;
/* unused harmony import specifier */ var parseUserAgentStoreSourceId;
/* unused harmony import specifier */ var parseTeamAgentStoreSourceId;
/* unused harmony import specifier */ var isCloudAgentStoreId;
/* unused harmony import specifier */ var isValidBareUuid;
/* unused harmony import specifier */ var isAgentStoreId;
/* unused harmony import specifier */ var isAgentStoreShareMountKey;
/* unused harmony import specifier */ var isAgentStoreSourceId;
/* unused harmony import specifier */ var AGENT_STORE_FILES_DIR_NAME;
/* unused harmony import specifier */ var AGENT_STORE_SKILLS_DIR_NAME;
/* unused harmony import specifier */ var isPrincipalAgentStoreSourceId;





// Agent-store id classification + the mount-input parser now live in
// `@anysphere/constants` (browser-safe, shared with the Glass renderer).
// Re-export them so existing `@anysphere/agent-store-sync/paths` importers keep
// working unchanged.

const AGENT_STORE_SYNC_DIR_NAME = ".sync";
/**
 * Sibling of each store root, under the stores root. Pin files live here so
 * their directory mtime can record the last foreground open or close without
 * sharing a directory with sync metadata.
 */
const AGENT_STORE_CONTROL_DIR_NAME = ".control";
/**
 * Sibling of the store roots. A root is renamed here before it is deleted,
 * so a crash leaves a whole tree rather than a half-removed one.
 */
const AGENT_STORE_EVICTED_DIR_NAME = ".evicted";
/**
 * Sibling of the store roots. A renamed tree that no longer matches its
 * snapshot is moved here instead of being deleted.
 */
const AGENT_STORE_RECOVERED_DIR_NAME = ".recovered";
/**
 * True when any `/`-separated segment starts with `.cursor`,
 * case-insensitively. Matches the server's
 * `isReservedAgentStorePathSegment` rule used by
 * `presignAgentStoreWrites` to reject a whole write batch.
 */
function isReservedRelPath(relPath) {
    return relPath.split("/").some(isReservedAgentStorePathSegment);
}
/** Append-only conflict event journal under `.sync/`. */
const AGENT_STORE_CONFLICT_EVENTS_FILE_NAME = "conflict-events.jsonl";
/**
 * Durable sidecar for conflict emits whose journal append failed. Persisted
 * under `.sync/` so a pause / dispose / restart does not silently drop a
 * notice whose remote conflict object is already committed (local-sync L1).
 */
const AGENT_STORE_CONFLICT_PENDING_FILE_NAME = "conflict-events.pending.jsonl";
const PRIVATE_DIR_MODE = 0o700;
/**
 * Map product `urlProtocol` / `vscode.env.uriScheme` to the on-disk stores
 * directory name so Cursor Dev does not share locks with shipped Cursor.
 */
function agentStoreTmpDirNameForUrlProtocol(urlProtocol) {
    return urlProtocol === "cursor-dev" ? AGENT_STORE_TMP_DIR_NAME_DEV : AGENT_STORE_TMP_DIR_NAME;
}
function classifyAgentStoreSourceId(sourceId) {
    if (parseUserAgentStoreSourceId(sourceId) !== undefined) {
        return "user";
    }
    if (parseTeamAgentStoreSourceId(sourceId) !== undefined) {
        return "team";
    }
    if (isCloudAgentStoreId(sourceId)) {
        return "cloud";
    }
    if (isValidBareUuid(sourceId)) {
        return "local";
    }
    if (isAgentStoreId(sourceId) || isAgentStoreShareMountKey(sourceId)) {
        return "store";
    }
    return "unknown";
}
/** Build path parts from a resolved store base + agent/mount id. */
function agentStorePathParts(store, agentId) {
    return {
        base: store.base,
        agentId,
        tmpDirName: store.tmpDirName,
    };
}
class AgentStorePathError extends Error {
    constructor({ code, message, failedPath }) {
        super(message);
        this.name = "AgentStorePathError";
        this.code = code;
        this.failedPath = failedPath;
    }
}
function resolveStoreBase(options = {}) {
    const deps = getDeps(options);
    const tmpDirName = agentStoreTmpDirNameForUrlProtocol(options.urlProtocol);
    const override = deps.env.CURSOR_AGENT_STORE_DIR;
    if (override) {
        return {
            base: ensureSecureStoreBase(deps.path.resolve(override), {
                allowChmodExisting: false,
                deps,
            }),
            source: "env_override",
            ephemeralOnLogout: false,
            tmpDirName,
        };
    }
    if (deps.platform === "linux") {
        // The mirror, index, and delete journal are application state, not a
        // cache. Temp/runtime roots may be purged with directories left intact
        // (the files-root inode guard never trips), and a purged mirror whose
        // index survives journals the absences as deletes — local cleanup becomes
        // remote tombstones. Prefer persistent per-user state on Linux.
        for (const candidatePath of linuxPersistentStoreBaseCandidates(deps)) {
            try {
                return {
                    base: ensureSecureStoreBase(candidatePath, {
                        allowChmodExisting: true,
                        deps,
                    }),
                    source: "user_state",
                    ephemeralOnLogout: false,
                    tmpDirName,
                };
            }
            catch (err) {
                // A security refusal on the candidate store base itself (foreign
                // uid, insecure mode, symlinked base) halts resolution: a hostile
                // persistent directory must not be silently routed around.
                // Everything else is an availability failure — a raw fs error
                // (EROFS/EACCES on read-only or absent homes), or a refusal whose
                // failedPath is an *ancestor* (symlinked `~/.local` under
                // stow/chezmoi, world-writable homes on odd mounts). Those are
                // ambient environment facts the pre-persistent temp resolution never
                // examined; the next candidate or the temp fallback avoids the
                // directory entirely.
                if (err instanceof AgentStorePathError && err.failedPath === candidatePath) {
                    throw err;
                }
            }
        }
        // Headless service deployments (HOME unset, HOME=/, read-only home,
        // systemd DynamicUser) cannot host persistent user state. Fall back to
        // the pre-persistent-move temp resolution so store claims that worked
        // before the move keep working — at the cost of durability, which the
        // resolved `source` makes visible to logs and metrics.
        return resolveLinuxTempFallbackStoreBase(deps, tmpDirName);
    }
    if (deps.platform === "darwin") {
        let persistentBase;
        try {
            persistentBase = resolveDarwinPersistentStoreBasePath(deps);
        }
        catch (error) {
            // An indeterminate home/path failure must not switch an installation
            // that may already have an armed persistent mirror back to TMPDIR.
            throw error;
        }
        if (persistentBase === undefined) {
            return resolveDarwinTempStoreBase(deps, tmpDirName);
        }
        // Once the persistent base exists, pin this installation to it: transient
        // I/O or permission errors must fail closed rather than alternate between
        // two independently armed mirrors. Only a confirmed-first-use creation
        // failure may use the pre-move TMPDIR fallback.
        const persistentBaseExisted = tryLstat(persistentBase, deps.fs) !== undefined;
        try {
            return {
                base: ensureSecureStoreBase(persistentBase, {
                    // This is application state, not a temp directory that we repair.
                    // Refuse an existing loose/foreign/symlinked base rather than
                    // adopting content that could have been planted before the move.
                    allowChmodExisting: false,
                    deps,
                }),
                source: "user_state",
                ephemeralOnLogout: false,
                tmpDirName,
            };
        }
        catch (error) {
            if (error instanceof AgentStorePathError || persistentBaseExisted) {
                throw error;
            }
        }
        return resolveDarwinTempStoreBase(deps, tmpDirName);
    }
    if (deps.platform === "win32") {
        return resolveWindowsStoreBase(deps, tmpDirName);
    }
    throw new AgentStorePathError({
        code: "unsupported_platform",
        message: `Unsupported agent store platform: ${deps.platform}`,
    });
}
/**
 * Persistent per-user Linux candidates, most preferred first:
 * `${XDG_STATE_HOME}/cursor/agent-stores`, then
 * `~/.local/state/cursor/agent-stores`. Environments with no usable home
 * (and no absolute `XDG_STATE_HOME`) yield no candidates.
 */
function linuxPersistentStoreBaseCandidates(deps) {
    const candidates = [];
    const xdgStateHome = deps.env.XDG_STATE_HOME?.trim();
    // The XDG base-directory spec requires relative values to be treated as
    // invalid and ignored; resolving one against the CWD would create the
    // mirror inside whatever repository the CLI happens to run from.
    if (xdgStateHome && deps.path.isAbsolute(xdgStateHome)) {
        candidates.push(deps.path.join(deps.path.resolve(xdgStateHome), "cursor", "agent-stores"));
    }
    const home = resolveLinuxHomedir(deps);
    if (home !== undefined) {
        candidates.push(deps.path.join(home, ".local", "state", "cursor", "agent-stores"));
    }
    return candidates;
}
/**
 * Usable Linux home directory, or undefined for service-account shapes.
 * `HOME=/` (systemd DynamicUser, minimal containers) is not a per-user
 * home; treating it as one would create `/.local` on the root filesystem.
 * A relative home (POSIX `os.homedir()` returns `$HOME` verbatim) is
 * ignored for the same reason relative `XDG_STATE_HOME` is: resolving it
 * against the CWD would create the mirror inside whatever working tree the
 * process runs from.
 */
function resolveLinuxHomedir(deps) {
    let rawHome;
    try {
        rawHome = deps.osHomedir().trim();
    }
    catch {
        return undefined;
    }
    if (rawHome.length === 0 || !deps.path.isAbsolute(rawHome)) {
        return undefined;
    }
    const home = deps.path.resolve(rawHome);
    if (deps.path.parse(home).root === home) {
        return undefined;
    }
    return home;
}
/**
 * Pre-persistent-move Linux resolution, kept as the availability fallback
 * for environments with no usable home directory. Matches the historical
 * behavior exactly: `$XDG_RUNTIME_DIR` when it is a secure existing
 * directory (wiped on logout), else a per-uid tmpdir.
 */
function resolveLinuxTempFallbackStoreBase(deps, tmpDirName) {
    const xdgRuntimeDir = deps.env.XDG_RUNTIME_DIR;
    if (xdgRuntimeDir) {
        const resolvedXdg = deps.path.resolve(xdgRuntimeDir);
        if (isExistingSecureDirectory(resolvedXdg, deps)) {
            return {
                base: resolvedXdg,
                source: "temp_fallback",
                ephemeralOnLogout: true,
                tmpDirName,
            };
        }
    }
    const uid = requireCurrentUid(deps);
    return {
        base: ensureSecureStoreBase(deps.path.join(deps.osTmpdir(), `cursor-${uid}`), {
            allowChmodExisting: true,
            deps,
        }),
        source: "temp_fallback",
        ephemeralOnLogout: false,
        tmpDirName,
    };
}
/**
 * Resolve the macOS application-state root without creating it. A missing,
 * empty, or filesystem-root home is treated as unavailable so service-like
 * environments retain the pre-move TMPDIR behavior.
 */
function resolveDarwinPersistentStoreBasePath(deps) {
    let rawHome;
    try {
        rawHome = deps.osHomedir();
    }
    catch {
        return undefined;
    }
    if (rawHome.length === 0) {
        return undefined;
    }
    const home = deps.path.resolve(rawHome);
    if (home === deps.path.parse(home).root) {
        return undefined;
    }
    const homeStat = tryLstat(home, deps.fs);
    if (homeStat === undefined) {
        return undefined;
    }
    assertDirectoryStat(home, homeStat);
    return deps.path.join(home, "Library", "Application Support", "Cursor", "AgentStores");
}
/** Pre-move macOS resolution, retained only as an availability fallback. */
function resolveDarwinTempStoreBase(deps, tmpDirName) {
    // TMPDIR is usually /var/folders/.../T/, but /var itself is a symlink to
    // /private/var on macOS. Resolve to the physical path before walking
    // ancestors for symlink refusal — the /var symlink is OS-provided, not a
    // tmp-hijack vector.
    const tmpdir = resolvePhysicalPath(deps.path.resolve(deps.osTmpdir()), deps);
    return {
        base: assertExistingSecureDirectory(tmpdir, deps),
        source: "tmpdir",
        ephemeralOnLogout: false,
        tmpDirName,
    };
}
/**
 * Best-effort store-base source for telemetry; `"unresolved"` when
 * resolution throws. Never throws; resolution side effects (directory
 * creation) are idempotent with the real resolution that follows.
 */
function probeStoreBaseSource(options = {}) {
    try {
        return resolveStoreBase(options).source;
    }
    catch {
        return "unresolved";
    }
}
/**
 * Windows resolution prefers persistent per-user application state over
 * `%TEMP%`. The scheduled SilentCleanup task / Storage Sense age-reap `%TEMP%`
 * (last access ~7 days) and can unlink store files while leaving directories
 * intact — the files-root inode guard does not trip, and the next sync round
 * journals those absences as deletes. `%LOCALAPPDATA%` is not an OS temp
 * location and Storage Sense does not target it by default.
 */
function resolveWindowsStoreBase(deps, tmpDirName) {
    let storeBaseRefusal;
    for (const candidate of windowsPersistentStoreBaseCandidates(deps)) {
        let candidatePath;
        try {
            candidatePath = candidate();
        }
        catch {
            // The candidate could not even be constructed (no home-directory
            // analog): availability failure by definition.
            continue;
        }
        // Once a persistent base exists, pin this installation to it (matching
        // the darwin resolution): transient I/O, icacls, or ancestor failures on
        // an established mirror must fail closed instead of diverting to another
        // candidate or to `%TEMP%`, where a second independently armed mirror
        // could journal the persistent mirror's files as absences — the exact
        // tombstone hazard this move exists to stop. A raw error on the
        // existence probe itself propagates for the same reason: indeterminate
        // state must not divert an installation that may have an armed mirror.
        const candidateExisted = tryLstat(candidatePath, deps.fs) !== undefined;
        try {
            return {
                base: ensureWindowsStoreBase(candidatePath, deps),
                source: "user_state",
                ephemeralOnLogout: false,
                tmpDirName,
            };
        }
        catch (err) {
            if (candidateExisted) {
                throw err;
            }
            // First use only. Fail closed for a security refusal on the candidate
            // store base itself (an unexpected ACL left by a concurrent re-create,
            // a verify that still refuses right after a reset): a hostile
            // persistent directory must not silently divert the mirror. Everything
            // else is an availability failure — a raw fs error creating the
            // directory (EPERM/EROFS on odd profiles) or a refusal on an *ancestor*
            // (e.g. junction-redirected profile directories, an ambient environment
            // fact the `%TEMP%` resolution never examined) — and falls through to
            // the legacy temp behavior, which avoids the directory entirely.
            if (err instanceof AgentStorePathError &&
                err.code !== "missing_homedir" &&
                err.failedPath === candidatePath) {
                storeBaseRefusal ??= err;
            }
        }
    }
    if (storeBaseRefusal !== undefined) {
        throw storeBaseRefusal;
    }
    // Legacy pre-persistent behavior, kept for profiles that cannot host
    // persistent user state (no absolute %LOCALAPPDATA% and no resolvable
    // profile directory, or an unusable one) so upgrades never hard-fail store
    // resolution that used to succeed. The resolved `source` keeps the
    // degraded, reap-prone mode visible.
    const base = deps.path.resolve(deps.osTmpdir());
    assertNoSymlinkInPath(base, deps);
    assertWindowsStoreAcl(base, deps.windowsAcl);
    return {
        base,
        source: "temp_fallback",
        ephemeralOnLogout: false,
        tmpDirName,
    };
}
/**
 * Persistent per-user candidates, most preferred first:
 * `%LOCALAPPDATA%\Cursor\AgentStores`, then the profile-relative
 * `~\AppData\Local\Cursor\AgentStores`. Candidate thunks may throw (e.g.
 * `missing_homedir`); the caller treats that as "next candidate".
 */
function windowsPersistentStoreBaseCandidates(deps) {
    const candidates = [];
    const localAppData = deps.env.LOCALAPPDATA?.trim();
    // A relative %LOCALAPPDATA% would resolve against the CWD and mirror store
    // content into whatever directory the process happens to run from; ignore
    // it and fall through to the profile-relative candidate.
    if (localAppData && deps.path.isAbsolute(localAppData)) {
        candidates.push(() => deps.path.join(deps.path.resolve(localAppData), "Cursor", "AgentStores"));
    }
    candidates.push(() => deps.path.join(requireHomedir(deps), "AppData", "Local", "Cursor", "AgentStores"));
    return candidates;
}
/** Directory names eligible for source-id-backed force sync. */
function isAgentStoreSourceDirectoryName(dirName) {
    return isAgentStoreSourceId(dirName);
}
function agentStoreRoot({ base, agentId, tmpDirName }) {
    assertAbsoluteStoreBase(base);
    assertSafeAgentId(agentId);
    return path.join(base, tmpDirName ?? AGENT_STORE_TMP_DIR_NAME, agentId);
}
function assertSafeAgentId(agentId) {
    if (agentId.length === 0 ||
        agentId !== agentId.trim() ||
        agentId === "." ||
        agentId === ".." ||
        agentId.includes("\0") ||
        agentId.includes("/") ||
        agentId.includes("\\") ||
        path.posix.isAbsolute(agentId) ||
        path.win32.isAbsolute(agentId)) {
        throw new AgentStorePathError({
            code: "invalid_agent_id",
            message: `Agent id must be a single safe path segment: ${agentId}`,
            failedPath: agentId,
        });
    }
}
function assertAbsoluteStoreBase(base) {
    if (!path.isAbsolute(base)) {
        throw new AgentStorePathError({
            code: "invalid_store_base",
            message: `Agent store base must be absolute: ${base}`,
            failedPath: base,
        });
    }
}
function agentStoreFilesDir(parts) {
    return path.join(agentStoreRoot(parts), AGENT_STORE_FILES_DIR_NAME);
}
/**
 * Single source of truth for a store's skills directory, so nothing else
 * hand-rolls `join(filesDir, "skills")`. The caller supplies the store id in
 * {@link AgentStorePathParts}; this helper does not compute a scope.
 */
function agentStoreSkillsDir(parts) {
    return path.join(agentStoreFilesDir(parts), AGENT_STORE_SKILLS_DIR_NAME);
}
function agentStoreSyncDir(parts) {
    return path.join(agentStoreRoot(parts), AGENT_STORE_SYNC_DIR_NAME);
}
/**
 * `<storesRoot>/.control/<mountKey>`. Pins and the eviction mark for one
 * mount live here, beside the store root rather than inside it, so moving
 * the root does not move them.
 */
function agentStoreControlDir(store, mountKey) {
    assertSafeMountKey(mountKey);
    const root = agentStoreRoot(agentStorePathParts(store, mountKey));
    return path.join(path.dirname(root), AGENT_STORE_CONTROL_DIR_NAME, mountKey);
}
function agentStoreIndexPath(parts) {
    return path.join(agentStoreSyncDir(parts), "index.sqlite");
}
function agentStoreRootIdPath(parts) {
    return path.join(agentStoreSyncDir(parts), "root-id");
}
function agentStoreLockPath(parts) {
    return path.join(agentStoreSyncDir(parts), "sync.lock");
}
function agentStoreOwnerPath(parts) {
    return path.join(agentStoreSyncDir(parts), "owner.json");
}
/**
 * Per-mount metadata at `<sync>/mount.json`. Written after a successful
 * mount; read by `detachMount` to confirm a directory isn't a self mount
 * before `rm -rf`.
 */
function agentStoreMountConfigPath(parts) {
    return path.join(agentStoreSyncDir(parts), "mount.json");
}
function agentStoreConflictEventsPath(parts) {
    return path.join(agentStoreSyncDir(parts), AGENT_STORE_CONFLICT_EVENTS_FILE_NAME);
}
/**
 * Durable pending-emit sidecar (`conflict-events.pending.jsonl`) under
 * `.sync/`. Kept beside {@link agentStoreConflictEventsPath} so both the
 * journal and its sidecar can be symlink-guarded together — the sidecar is
 * `readFileSync`-loaded on construction, so a planted symlink here would be
 * followed unless the caller validates the path first.
 */
function agentStoreConflictPendingEventsPath(parts) {
    return path.join(agentStoreSyncDir(parts), AGENT_STORE_CONFLICT_PENDING_FILE_NAME);
}
function agentStoreTmpDir(parts) {
    return path.join(agentStoreSyncDir(parts), "tmp");
}
/**
 * Accepts an agent store source id, agent store id, or share id and runs the same
 * per-segment safety checks `assertSafeAgentId` does. The controller calls
 * this before any filesystem op touches a mount directory.
 */
function assertSafeMountKey(mountKey) {
    if (!isAgentStoreSourceId(mountKey) &&
        !isPrincipalAgentStoreSourceId(mountKey) &&
        !isAgentStoreId(mountKey) &&
        !isAgentStoreShareMountKey(mountKey)) {
        throw new AgentStorePathError({
            code: "invalid_agent_id",
            message: `Mount key must be an agent store source id, agent store id, or store-<digest> share id: ${mountKey}`,
            failedPath: mountKey,
        });
    }
    assertSafeAgentId(mountKey);
}
/**
 * Refuse `targetPath` if any component of it is a symlink.
 *
 * One `realpathSync.native` settles the common case: if the volume hands back
 * exactly the string we resolved, no component is a symlink (a link anywhere
 * on the path resolves to a different string or fails with `ELOOP`), and we
 * are done. This is on the extension host's synchronous path at store-base
 * resolution, every mount, every lock write and every guarded-path check, so
 * the per-component `lstat` walk below is the fallback, not the default.
 *
 * The walk runs when the spellings disagree or realpath fails. Both are
 * expected: a case-insensitive, case-preserving volume reports the spelling a
 * directory was created with (`Application Support/cursor` on disk, addressed
 * as `Cursor`), which reaches the same inode and must be accepted; a path the
 * caller is about to create fails realpath with `ENOENT`, and only its
 * existing prefix can be checked. A symlinked component is refused and named
 * either way. The string compare alone conflated the first case with a link,
 * which is what #1051901 fixed; the unconditional walk it used instead is
 * what this fast path avoids.
 */
function assertNoSymlinkInPath(targetPath, options = {}) {
    const deps = getDeps(options);
    const resolved = deps.path.resolve(targetPath);
    if (tryNativeRealpath(resolved, deps.fs) === resolved) {
        return;
    }
    const segments = getPathSegments(resolved, deps.path);
    for (const segment of segments) {
        const stat = tryLstat(segment, deps.fs);
        if (!stat) {
            // Only the existing prefix can be checked; callers may be creating the rest.
            return;
        }
        if (stat.isSymbolicLink()) {
            throw new AgentStorePathError({
                code: "symlink_refused",
                message: `Refusing to use symlinked agent store path: ${segment}`,
                failedPath: segment,
            });
        }
    }
}
/**
 * Create every missing directory between a trusted ancestor and `targetDir`
 * (inclusive), refusing to follow a symlinked segment at any point. Replaces
 * `mkdirSync({ recursive: true })`, which can traverse ancestor symlinks and
 * lets a hostile process redirect writes outside the intended store root.
 */
function ensureSecureDirectoryChain(targetDir, options = {}) {
    const deps = getDeps(options);
    const resolvedTarget = deps.path.resolve(targetDir);
    const trustedBase = options.trustedBase !== undefined
        ? deps.path.resolve(options.trustedBase)
        : findTrustedDirectoryAncestor(resolvedTarget, deps);
    if (resolvedTarget === trustedBase) {
        assertRealDirectorySegment(trustedBase, deps);
        return;
    }
    const relative = deps.path.relative(trustedBase, resolvedTarget);
    if (relative.length === 0 || relative.startsWith("..") || deps.path.isAbsolute(relative)) {
        throw new AgentStorePathError({
            code: "invalid_store_base",
            message: `Refusing to create ${resolvedTarget} outside trusted base ${trustedBase}`,
            failedPath: resolvedTarget,
        });
    }
    const segments = relative.split(deps.path.sep).filter((segment) => segment.length > 0);
    let current = trustedBase;
    for (const segment of segments) {
        // Re-verify the parent on every iteration so a hostile process cannot
        // swap a validated directory for a symlink between segment creates.
        assertRealDirectorySegment(current, deps);
        current = deps.path.join(current, segment);
        ensureRealDirectorySegment(current, deps);
    }
}
function setWindowsStoreAcl(targetPath, options = {}) {
    const run = options.execFileSync ?? execFileSync;
    const currentUserSid = readCurrentWindowsUser(options, run).sid;
    const systemSid = options.systemSid ?? "S-1-5-18";
    const administratorsSid = options.administratorsSid ?? "S-1-5-32-544";
    run("icacls", [
        targetPath,
        "/inheritance:r",
        "/grant:r",
        `*${currentUserSid}:(OI)(CI)F`,
        `*${systemSid}:(OI)(CI)F`,
        `*${administratorsSid}:(OI)(CI)F`,
    ]);
}
function assertWindowsStoreAcl(targetPath, options = {}) {
    const run = options.execFileSync ?? execFileSync;
    const currentUser = readCurrentWindowsUser(options, run);
    const systemSid = options.systemSid ?? "S-1-5-18";
    const administratorsSid = options.administratorsSid ?? "S-1-5-32-544";
    const allowed = new Set([
        currentUser.sid.toLowerCase(),
        currentUser.name.toLowerCase(),
        systemSid.toLowerCase(),
        administratorsSid.toLowerCase(),
    ]);
    for (const name of [
        options.systemName ?? readWindowsAccountName(systemSid, run) ?? "NT AUTHORITY\\SYSTEM",
        options.administratorsName ??
            readWindowsAccountName(administratorsSid, run) ??
            "BUILTIN\\Administrators",
    ]) {
        if (name) {
            allowed.add(name.toLowerCase());
        }
    }
    const output = String(run("icacls", [targetPath], { encoding: "utf8" }));
    const allowedPrincipals = parseIcaclsAllowedPrincipals({
        output,
        targetPath,
    });
    if (allowedPrincipals.length === 0) {
        throw new AgentStorePathError({
            code: "acl_refused",
            message: `Could not verify ACL for agent store path: ${targetPath}`,
            failedPath: targetPath,
        });
    }
    for (const principal of allowedPrincipals) {
        if (!allowed.has(principal.toLowerCase())) {
            throw new AgentStorePathError({
                code: "acl_refused",
                message: `Refusing agent store path with unexpected ACL entry: ${principal}`,
                failedPath: targetPath,
            });
        }
    }
}
function parseIcaclsAllowedPrincipals({ output, targetPath, }) {
    const principals = [];
    const permissionPattern = /^(.+):(?:\([^)]+\))*[A-Z]*$/;
    for (const line of output.split(/\r?\n/)) {
        let aclText = line.trim();
        if (aclText.toLowerCase().startsWith(targetPath.toLowerCase())) {
            aclText = aclText.slice(targetPath.length).trimStart();
        }
        if (aclText.toUpperCase().includes("(DENY)")) {
            continue;
        }
        const match = aclText.match(permissionPattern);
        if (match) {
            principals.push(normalizeIcaclsPrincipal(match[1]));
        }
    }
    return principals;
}
function normalizeIcaclsPrincipal(principalText) {
    const principal = principalText.trim();
    if (!principal.includes(":")) {
        return principal.replace(/^\*/, "");
    }
    const match = principal.match(/(\*?S-\d-\d+(?:-\d+)+)$/) ??
        principal.match(/(NT AUTHORITY\\SYSTEM|BUILTIN\\Administrators)$/) ??
        principal.match(/(?:^|\s)([^\s\\:]+\\[^\r\n:]+)$/);
    if (match) {
        return match[1].trim().replace(/^\*/, "");
    }
    const lastSpace = principal.lastIndexOf(" ");
    return principal
        .slice(lastSpace + 1)
        .trim()
        .replace(/^\*/, "");
}
function getDeps(options) {
    return {
        env: options.env ?? process.env,
        fs: options.fs ?? fs,
        geteuid: options.geteuid ?? process.geteuid?.bind(process),
        osHomedir: options.osHomedir ?? os.homedir,
        osTmpdir: options.osTmpdir ?? os.tmpdir,
        path: options.path ?? path,
        platform: options.platform ?? "linux",
        windowsAcl: options.windowsAcl ?? {},
    };
}
function requireHomedir(deps) {
    const home = deps.osHomedir().trim();
    if (home.length === 0) {
        throw new AgentStorePathError({
            code: "missing_homedir",
            message: "Could not determine the current user home directory for agent store path resolution",
        });
    }
    return deps.path.resolve(home);
}
function resolvePhysicalPath(targetPath, deps) {
    const fsModule = deps.fs;
    try {
        if (typeof fsModule.realpathSync === "function") {
            if (typeof fsModule.realpathSync.native === "function") {
                return fsModule.realpathSync.native(targetPath);
            }
            return fsModule.realpathSync(targetPath);
        }
    }
    catch {
        // Fall back to the unresolved path; downstream checks will surface errors.
    }
    return targetPath;
}
/**
 * `realpathSync.native(targetPath)`, or `undefined` when the injected fs has
 * no native realpath or the call fails. Not {@link resolvePhysicalPath}: that
 * returns the input on failure, which here would compare equal and skip the
 * symlink walk on exactly the paths (`ENOENT`, `ELOOP`) that need it.
 */
function tryNativeRealpath(targetPath, fsModule) {
    const realpathSync = fsModule.realpathSync;
    if (typeof realpathSync?.native !== "function") {
        return undefined;
    }
    try {
        return realpathSync.native(targetPath);
    }
    catch {
        return undefined;
    }
}
function isExistingSecureDirectory(targetPath, deps) {
    try {
        assertNoSymlinkInPath(targetPath, deps);
    }
    catch (err) {
        if (err instanceof AgentStorePathError) {
            return false;
        }
        throw err;
    }
    const stat = tryLstat(targetPath, deps.fs);
    if (!stat) {
        return false;
    }
    return statMeetsSecureDirectoryPolicy(targetPath, stat, deps, {
        allowLooseMode: false,
    });
}
function ensureSecureStoreBase(targetPath, { allowChmodExisting, deps }) {
    if (deps.platform === "win32") {
        return ensureWindowsStoreBase(targetPath, deps);
    }
    assertNoSymlinkInPath(targetPath, deps);
    assertStoreBaseAncestorsSafe(targetPath, deps);
    const existing = tryLstat(targetPath, deps.fs);
    if (existing) {
        assertSecureDirectoryStat(targetPath, existing, deps, {
            allowLooseMode: allowChmodExisting,
        });
    }
    deps.fs.mkdirSync(targetPath, { recursive: true, mode: PRIVATE_DIR_MODE });
    if (allowChmodExisting || !existing) {
        deps.fs.chmodSync(targetPath, PRIVATE_DIR_MODE);
    }
    assertStoreBaseAncestorsSafe(targetPath, deps);
    const finalStat = deps.fs.lstatSync(targetPath);
    assertSecureDirectoryStat(targetPath, finalStat, deps, {
        allowLooseMode: false,
    });
    return targetPath;
}
function ensureWindowsStoreBase(targetPath, deps) {
    assertNoSymlinkInPath(targetPath, deps);
    const existing = tryLstat(targetPath, deps.fs);
    if (existing) {
        assertDirectoryStat(targetPath, existing);
        try {
            assertWindowsStoreAcl(targetPath, deps.windowsAcl);
        }
        catch (err) {
            if (!(err instanceof AgentStorePathError)) {
                throw err;
            }
            return repairPartiallyCreatedWindowsStoreBase(targetPath, deps, err);
        }
        return targetPath;
    }
    deps.fs.mkdirSync(targetPath, { recursive: true, mode: PRIVATE_DIR_MODE });
    const finalStat = deps.fs.lstatSync(targetPath);
    assertDirectoryStat(targetPath, finalStat);
    setWindowsStoreAcl(targetPath, deps.windowsAcl);
    assertWindowsStoreAcl(targetPath, deps.windowsAcl);
    return targetPath;
}
/**
 * Self-heal the mkdir/icacls crash wedge. `ensureWindowsStoreBase` creates
 * the store base and then restricts it with icacls; a crash between the two
 * leaves a directory whose ACL check fails on every later launch, wedging
 * store resolution fail-closed forever. Repair must never adopt content an
 * unexpected principal may have planted, so it only proceeds while the
 * directory is still empty: `rmdirSync` is the atomic only-if-empty
 * primitive (the kernel refuses to remove a non-empty directory), and it
 * works even when a partially applied DACL denies everything, because
 * removal needs only the parent's delete-child grant. The directory is then
 * recreated non-recursively — a concurrent re-create surfaces as `EEXIST`
 * and is refused rather than adopted — and the normal icacls set + verify
 * sequence runs on the fresh directory.
 */
function repairPartiallyCreatedWindowsStoreBase(targetPath, deps, refusal) {
    try {
        deps.fs.rmdirSync(targetPath);
        deps.fs.mkdirSync(targetPath, { mode: PRIVATE_DIR_MODE });
    }
    catch {
        throw refusal;
    }
    const stat = deps.fs.lstatSync(targetPath);
    assertDirectoryStat(targetPath, stat);
    setWindowsStoreAcl(targetPath, deps.windowsAcl);
    assertWindowsStoreAcl(targetPath, deps.windowsAcl);
    return targetPath;
}
function assertExistingSecureDirectory(targetPath, deps) {
    assertNoSymlinkInPath(targetPath, deps);
    assertStoreBaseAncestorsSafe(targetPath, deps);
    const stat = deps.fs.lstatSync(targetPath);
    assertSecureDirectoryStat(targetPath, stat, deps, { allowLooseMode: false });
    return targetPath;
}
function assertStoreBaseAncestorsSafe(targetPath, deps) {
    const segments = getPathSegments(deps.path.resolve(targetPath), deps.path);
    for (const segment of segments.slice(0, -1)) {
        const stat = tryLstat(segment, deps.fs);
        if (!stat) {
            continue;
        }
        assertDirectoryStat(segment, stat);
        const isWritableByOtherUsers = (stat.mode & 0o022) !== 0;
        const hasStickyBit = (stat.mode & 0o1000) !== 0;
        if (isWritableByOtherUsers && !hasStickyBit) {
            throw new AgentStorePathError({
                code: "insecure_permissions",
                message: `Agent store parent must not be group/world writable: ${segment}`,
                failedPath: segment,
            });
        }
    }
}
function assertDirectoryStat(targetPath, stat) {
    if (stat.isSymbolicLink()) {
        throw new AgentStorePathError({
            code: "symlink_refused",
            message: `Refusing to use symlinked agent store path: ${targetPath}`,
            failedPath: targetPath,
        });
    }
    if (!stat.isDirectory()) {
        throw new AgentStorePathError({
            code: "not_directory",
            message: `Agent store path is not a directory: ${targetPath}`,
            failedPath: targetPath,
        });
    }
}
function statMeetsSecureDirectoryPolicy(targetPath, stat, deps, options) {
    try {
        assertSecureDirectoryStat(targetPath, stat, deps, options);
        return true;
    }
    catch (err) {
        if (err instanceof AgentStorePathError) {
            return false;
        }
        throw err;
    }
}
function assertSecureDirectoryStat(targetPath, stat, deps, options) {
    assertDirectoryStat(targetPath, stat);
    const uid = requireCurrentUid(deps);
    if (stat.uid !== uid) {
        throw new AgentStorePathError({
            code: "foreign_uid",
            message: `Agent store path is owned by uid ${stat.uid}, expected ${uid}: ${targetPath}`,
            failedPath: targetPath,
        });
    }
    if (!options.allowLooseMode && (stat.mode & 0o077) !== 0) {
        throw new AgentStorePathError({
            code: "insecure_permissions",
            message: `Agent store path must not be group/world accessible: ${targetPath}`,
            failedPath: targetPath,
        });
    }
}
function requireCurrentUid(deps) {
    const uid = deps.geteuid?.();
    if (uid === undefined) {
        throw new AgentStorePathError({
            code: "missing_uid",
            message: "Could not determine current uid for agent store path validation",
        });
    }
    return uid;
}
function findTrustedDirectoryAncestor(targetPath, deps) {
    const segments = getPathSegments(deps.path.resolve(targetPath), deps.path);
    let trusted = segments[0] ?? deps.path.resolve(targetPath);
    for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        const stat = tryLstat(segment, deps.fs);
        if (!stat) {
            break;
        }
        if (stat.isSymbolicLink()) {
            throw new AgentStorePathError({
                code: "symlink_refused",
                message: `Refusing to use symlinked agent store path: ${segment}`,
                failedPath: segment,
            });
        }
        if (!stat.isDirectory()) {
            throw new AgentStorePathError({
                code: "not_directory",
                message: `Agent store path is not a directory: ${segment}`,
                failedPath: segment,
            });
        }
        trusted = segment;
    }
    return trusted;
}
function assertRealDirectorySegment(targetPath, deps) {
    const stat = tryLstat(targetPath, deps.fs);
    if (!stat) {
        throw new AgentStorePathError({
            code: "not_directory",
            message: `Trusted directory does not exist: ${targetPath}`,
            failedPath: targetPath,
        });
    }
    assertDirectoryStat(targetPath, stat);
}
function ensureRealDirectorySegment(targetPath, deps) {
    let stat = tryLstat(targetPath, deps.fs);
    if (!stat) {
        try {
            deps.fs.mkdirSync(targetPath, { mode: PRIVATE_DIR_MODE });
        }
        catch (error) {
            if (!isNodeError(error) || error.code !== "EEXIST") {
                throw error;
            }
        }
        stat = tryLstat(targetPath, deps.fs);
        if (!stat) {
            throw new AgentStorePathError({
                code: "not_directory",
                message: `Failed to create directory: ${targetPath}`,
                failedPath: targetPath,
            });
        }
    }
    assertDirectoryStat(targetPath, stat);
}
function getPathSegments(targetPath, pathModule) {
    const root = pathModule.parse(targetPath).root;
    const rest = targetPath.slice(root.length);
    const parts = rest.split(/[\\/]+/).filter(Boolean);
    const segments = [];
    let current = root;
    if (root) {
        segments.push(root);
    }
    for (const part of parts) {
        current = current === root ? pathModule.join(root, part) : pathModule.join(current, part);
        segments.push(current);
    }
    return segments;
}
function tryLstat(targetPath, fsModule) {
    try {
        return fsModule.lstatSync(targetPath);
    }
    catch (err) {
        if (isNodeError(err) && err.code === "ENOENT") {
            return undefined;
        }
        throw err;
    }
}
/** Memoize the first successful `whoami /user` parse for this runner. */
function createWindowsUserIdentityReader(run) {
    let cached;
    return () => {
        cached ??= readWindowsUserIdentityUncached(run);
        return cached;
    };
}
/** Process-wide whoami; the OS user cannot change during this process. */
const readCurrentWindowsUserIdentity = createWindowsUserIdentityReader(external_node_child_process_.execFileSync);
function readCurrentWindowsUser(options, run) {
    if (options.currentUserName && options.currentUserSid) {
        return { name: options.currentUserName, sid: options.currentUserSid };
    }
    // Injected execFileSync is a test seam; only the real whoami is memoized.
    const identity = options.execFileSync === undefined
        ? readCurrentWindowsUserIdentity()
        : readWindowsUserIdentityUncached(run);
    const name = options.currentUserName ?? identity?.name;
    const sid = options.currentUserSid ?? identity?.sid;
    if (!name || !sid) {
        throw new AgentStorePathError({
            code: "acl_refused",
            message: "Could not determine current Windows user",
        });
    }
    return { name, sid };
}
function readWindowsUserIdentityUncached(run) {
    const fields = String(run("whoami", ["/user", "/fo", "csv", "/nh"], { encoding: "utf8" }))
        .trim()
        .split(",")
        .map((field) => field.replace(/^"|"$/g, ""));
    const name = fields.at(-2);
    const sid = fields.at(-1);
    if (!name || !sid) {
        return undefined;
    }
    return { name, sid };
}
/**
 * Session-lifetime cache of well-known-SID translations, keyed by SID.
 * Populated only for the real `execFileSync` (test seams stay uncached, like
 * {@link readCurrentWindowsUser}). Failures are cached too: a well-known
 * SID's translation cannot change mid-session, and store resolution calls
 * `assertWindowsStoreAcl` several times per resolve — each miss would
 * otherwise synchronously spawn PowerShell again on the extension-host
 * activation path.
 */
const windowsAccountNameCache = new Map();
function readWindowsAccountName(sid, run) {
    if (!isWindowsSid(sid)) {
        return undefined;
    }
    const cacheable = run === execFileSync;
    if (cacheable && windowsAccountNameCache.has(sid)) {
        return windowsAccountNameCache.get(sid);
    }
    const name = readWindowsAccountNameUncached(sid, run);
    if (cacheable) {
        windowsAccountNameCache.set(sid, name);
    }
    return name;
}
function readWindowsAccountNameUncached(sid, run) {
    try {
        const output = String(run("powershell.exe", [
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            // The SID is inlined rather than passed as a trailing argument:
            // `powershell -Command` appends trailing arguments to the command
            // text instead of binding `$args`, which turns the SID into a
            // ParserError on every invocation. `isWindowsSid` has already
            // constrained the value to digits and dashes, so inlining cannot
            // inject.
            `[System.Security.Principal.SecurityIdentifier]::new('${sid}').Translate([System.Security.Principal.NTAccount]).Value`,
        ], 
        // The timeout bounds how long a wedged PowerShell can block the
        // synchronous caller (extension-host activation); on expiry the
        // child is killed, execFileSync throws, and the English-name
        // fallback applies.
        { encoding: "utf8", timeout: 10_000, windowsHide: true })).trim();
        return output.length > 0 && !output.includes("\n") && output.includes("\\")
            ? output
            : undefined;
    }
    catch {
        return undefined;
    }
}
function isWindowsSid(sid) {
    return /^S-\d-\d+(?:-\d+)+$/.test(sid);
}
function isNodeError(err) {
    return err instanceof Error && typeof err.code === "string";
}

;// ../agent-store/sync/dist/conflict-events.js
/* unused harmony import specifier */ var randomUUID;
/* unused harmony import specifier */ var conflict_events_fs;
/* unused harmony import specifier */ var fsp;
/* unused harmony import specifier */ var conflict_events_path;
/* unused harmony import specifier */ var conflict_events_ensureSecureDirectoryChain;
/* unused harmony import specifier */ var conflict_events_AGENT_STORE_SYNC_DIR_NAME;
/* unused harmony import specifier */ var conflict_events_AGENT_STORE_CONFLICT_EVENTS_FILE_NAME;
/* unused harmony import specifier */ var conflict_events_AGENT_STORE_CONFLICT_PENDING_FILE_NAME;
/**
 * Append-only JSONL conflict journal under `.sync/conflict-events.jsonl`.
 *
 * Schema matches the FUSE agent-store writer in `packages/agent-store/fuse`
 * (`v:1`, snake_case kinds, epoch/seq cursors, 4 MiB rotation with a `gap`
 * event, upsert-per-conflict-path dedup after a successful append). Local-sync
 * optional fields (`source`, `remote_only`) are omitted when absent so one
 * reader can drain both journals.
 * Schema matches the FUSE C1 producer (`packages/agent-store/fuse`).
 */





/** Rotate once the journal exceeds this size (matches the FUSE writer). */
const CONFLICT_JOURNAL_ROTATE_BYTES = (/* unused pure expression or super */ null && (4 * 1024 * 1024));
/** Cap on the in-memory upsert dedup set (matches the FUSE writer). */
const MAX_DEDUP_ENTRIES = 65_536;
const EVENT_SCHEMA_VERSION = 1;
const PRIVATE_FILE_MODE = 0o600;
/**
 * Sanitize a journal/pending warn `error` so absolute paths never leave the
 * package. Node/`openNoFollowSync` messages embed `.sync/` paths (including
 * Windows usernames with spaces); CLI/IDE sinks only strip URLs. Drop the
 * raw message and keep `name`/`code` for triage.
 */
function sanitizeConflictJournalWarnError(error) {
    if (!(error instanceof Error)) {
        // Non-Error warn payloads are uncommon; never forward raw strings that
        // may contain workspace paths.
        return typeof error === "string" ? "<redacted>" : error;
    }
    const code = error.code;
    const redacted = new Error(code !== undefined ? `${error.name}: ${code}` : error.name);
    redacted.name = error.name;
    if (code !== undefined) {
        redacted.code = code;
    }
    return redacted;
}
function wrapConflictJournalWarn(warn) {
    return (message, error) => {
        warn(message, sanitizeConflictJournalWarnError(error));
    };
}
/**
 * `O_NOFOLLOW` where the runtime defines it (POSIX), `undefined` on Windows.
 * Captured once so every journal/pending open routes through the same
 * symlink-safe {@link openNoFollowSync} with a consistent flag.
 */
const O_NOFOLLOW_FLAG = external_node_fs_.constants.O_NOFOLLOW;
function emptyCursor() {
    return { journalEpoch: "", seq: 0, lastEventId: "" };
}
function nowMs() {
    return Date.now();
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asString(value) {
    return typeof value === "string" ? value : undefined;
}
function asNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function asBoolean(value) {
    return typeof value === "boolean" ? value : undefined;
}
const KNOWN_KINDS = new Set([
    "write_conflict",
    "create_conflict",
    "truncate_conflict_failed",
    "conflict_fallback_failed",
    "quota_exceeded",
    "gap",
]);
function parseConflictEvent(raw) {
    if (!isRecord(raw)) {
        return undefined;
    }
    const eventId = asString(raw.event_id);
    const journalEpoch = asString(raw.journal_epoch);
    const kindRaw = asString(raw.kind);
    const seq = asNumber(raw.seq);
    const tsMs = asNumber(raw.ts_ms);
    const v = asNumber(raw.v);
    if (eventId === undefined ||
        journalEpoch === undefined ||
        kindRaw === undefined ||
        seq === undefined ||
        tsMs === undefined ||
        v === undefined ||
        !KNOWN_KINDS.has(kindRaw)) {
        return undefined;
    }
    const kind = kindRaw;
    const sourceRaw = asString(raw.source);
    const source = sourceRaw === "local_sync" ? "local_sync" : undefined;
    const remoteOnly = asBoolean(raw.remote_only);
    return {
        v,
        event_id: eventId,
        journal_epoch: journalEpoch,
        seq,
        ts_ms: tsMs,
        kind,
        store_id: asString(raw.store_id),
        original_rel_path: asString(raw.original_rel_path),
        conflict_rel_path: asString(raw.conflict_rel_path),
        original_abs_path: asString(raw.original_abs_path),
        conflict_abs_path: asString(raw.conflict_abs_path),
        preserved_bytes: asNumber(raw.preserved_bytes),
        scope_kind: asString(raw.scope_kind),
        limit_bytes: asNumber(raw.limit_bytes),
        usage_bytes: asNumber(raw.usage_bytes),
        ...(source !== undefined ? { source } : {}),
        ...(remoteOnly === true ? { remote_only: true } : {}),
    };
}
function parseConflictJournalLines(body) {
    const out = [];
    for (const line of body.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
            continue;
        }
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch {
            continue;
        }
        const event = parseConflictEvent(parsed);
        if (event !== undefined) {
            out.push(event);
        }
    }
    return out;
}
function cursorFromRow(row) {
    return {
        journalEpoch: row.journal_epoch,
        seq: row.seq,
        lastEventId: row.event_id,
    };
}
function conflictEventsCursorAfterForeignLeaseBarrier(args) {
    const { events, fullNextCursor, previousCursor, announced, leasedIds, isOwnLease, continuePastForeignLeases = false, } = args;
    if (events.length === 0) {
        return {
            deliverableEvents: [],
            nextCursor: fullNextCursor,
            stoppedAtForeignLease: false,
        };
    }
    const deliverableEvents = [];
    let lastConsumed;
    let stoppedEarly = false;
    for (const event of events) {
        if (announced.has(event.event_id)) {
            lastConsumed = event;
            continue;
        }
        if (leasedIds.has(event.event_id) && !isOwnLease(event.event_id)) {
            if (continuePastForeignLeases) {
                continue;
            }
            stoppedEarly = true;
            break;
        }
        lastConsumed = event;
        deliverableEvents.push(event);
    }
    if (!stoppedEarly) {
        return {
            deliverableEvents,
            nextCursor: fullNextCursor,
            stoppedAtForeignLease: false,
        };
    }
    const nextCursor = lastConsumed !== undefined ? cursorFromRow(lastConsumed) : (previousCursor ?? emptyCursor());
    return {
        deliverableEvents,
        nextCursor,
        stoppedAtForeignLease: true,
    };
}
/**
 * Events after `cursor`. Gap is relative to the unread window; gap-only
 * windows still advance `nextCursor` so rotation is not re-flagged forever.
 */
function selectConflictEventsAfterCursor(events, cursor) {
    const cursorSet = cursor.journalEpoch.length > 0;
    let cutIndex = -1;
    if (cursorSet) {
        for (let i = events.length - 1; i >= 0; i--) {
            const row = events[i];
            if (row === undefined) {
                continue;
            }
            if (row.event_id === cursor.lastEventId ||
                (row.journal_epoch === cursor.journalEpoch && row.seq <= cursor.seq)) {
                cutIndex = i;
                break;
            }
        }
    }
    const newRows = cursorSet ? events.slice(cutIndex + 1) : [...events];
    const gap = newRows.some((row) => row.kind === "gap") ||
        (cursorSet && cutIndex === -1 && events.length > 0);
    const seenIds = new Set();
    const out = [];
    for (const row of newRows) {
        if (row.kind === "gap") {
            continue;
        }
        if (seenIds.has(row.event_id)) {
            continue;
        }
        seenIds.add(row.event_id);
        out.push(row);
    }
    const lastNew = newRows[newRows.length - 1];
    const nextCursor = lastNew !== undefined ? cursorFromRow(lastNew) : cursor;
    return { events: out, nextCursor, gap };
}
/**
 * Shared present-file verdict for {@link isConflictEventUnresolved} and its
 * sync twin. A non-regular file is treated as resolved (nothing to announce);
 * a non-empty file is unresolved. An empty file is unresolved only for a
 * genuine empty-file conflict (`preserved_bytes: 0`); absent preserved size is
 * the cross-client empty resolved marker, and non-zero preserved size means the
 * user truncated a non-empty conflict file to resolve it.
 */
function isPresentConflictUnresolved(isFile, size, event) {
    if (!isFile) {
        // Symlink / non-regular leaf: normally treated as resolved. For
        // `remote_only`, the preserved copy may not be a regular file yet (or a
        // symlink was planted before pull) — stay unresolved so applyResolvedFilter
        // cannot skip the notice while advancing the cursor.
        return event.remote_only === true;
    }
    if (size > 0) {
        return true;
    }
    return event.preserved_bytes === 0;
}
/**
 * Resolved-filter: skip notices whose local conflict file is an empty
 * cross-client resolved marker or absent. For non-`remote_only` events,
 * deleting the preserved conflict file is the universal "I dealt with it"
 * signal (absent ⇒ resolved).
 *
 * `remote_only` marks a conflict whose preserved copy landed only in S3
 * because the local rename failed; the next pull materializes the file
 * locally. Absence for `remote_only` stays unresolved so an incremental
 * drain that runs before (or after a failed) pull does not advance
 * `nextCursor` past the row and permanently skip the notice. After pull,
 * truncate-to-empty is the filter-recognized resolved marker; deletion of
 * a pulled copy does not clear this filter. Duplicate announce after the
 * user deletes a pulled copy is prevented by the session announced/ack
 * ledger, not by this filter.
 *
 * A genuine empty-file conflict records `preserved_bytes: 0`, so its empty
 * conflict file stays unresolved while present. Missing `preserved_bytes`
 * covers cross-client resolved markers; non-zero `preserved_bytes` covers
 * local/FUSE conflicts the user resolved by truncating the file. Transient
 * non-ENOENT stat errors degrade to "unresolved" so we announce a possible
 * duplicate rather than silently losing the notice.
 */
async function isConflictEventUnresolved(event) {
    const conflictAbsPath = event.conflict_abs_path;
    if (conflictAbsPath === undefined || conflictAbsPath.length === 0) {
        // No local conflict path (e.g. conflict_fallback_failed) — still announce.
        return true;
    }
    try {
        // lstat: a symlink at the conflict path is a non-regular leaf (resolved),
        // matching the sync engine's symlink handling. `stat` would follow and
        // treat the target as a regular file.
        const st = await fsp.lstat(conflictAbsPath);
        return isPresentConflictUnresolved(st.isFile(), st.size, event);
    }
    catch (error) {
        if (isEnoent(error)) {
            if (event.remote_only === true) {
                // Not-yet-pulled (or deleted) remote_only: stay unresolved so the
                // drain cursor cannot skip past the row before the file appears.
                return true;
            }
            // Absent file is the resolved marker: the user removed the preserved
            // copy for a non-remote_only conflict.
            return false;
        }
        // Flaky/permission errors: prefer a duplicate over silent loss.
        return true;
    }
}
function isConflictEventUnresolvedSync(event) {
    const conflictAbsPath = event.conflict_abs_path;
    if (conflictAbsPath === undefined || conflictAbsPath.length === 0) {
        return true;
    }
    try {
        const st = conflict_events_fs.lstatSync(conflictAbsPath);
        return isPresentConflictUnresolved(st.isFile(), st.size, event);
    }
    catch (error) {
        if (isEnoent(error)) {
            if (event.remote_only === true) {
                return true;
            }
            return false;
        }
        return true;
    }
}
/** @deprecated Prefer {@link isConflictEventUnresolved}; path-only API. */
async function isConflictFileUnresolved(conflictAbsPath) {
    return isConflictEventUnresolved({ conflict_abs_path: conflictAbsPath });
}
/** @deprecated Prefer {@link isConflictEventUnresolvedSync}; path-only API. */
function isConflictFileUnresolvedSync(conflictAbsPath) {
    return isConflictEventUnresolvedSync({ conflict_abs_path: conflictAbsPath });
}
/** Keep events with `ts_ms` ≥ session start (session-start delivery floor). */
function filterConflictEventsBySessionFloor(events, sessionStartedAtMs) {
    return events.filter((event) => event.ts_ms >= sessionStartedAtMs);
}
async function readConflictEvents(args) {
    const cursor = args.cursor ?? emptyCursor();
    let body;
    try {
        body = await readFileNoFollow(args.journalPath);
    }
    catch (error) {
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "ENOENT") {
            return { events: [], nextCursor: cursor, gap: false };
        }
        throw error;
    }
    const all = parseConflictJournalLines(body);
    let selected = selectConflictEventsAfterCursor(all, cursor);
    if (args.sessionStartedAtMs !== undefined) {
        selected = {
            ...selected,
            events: filterConflictEventsBySessionFloor(selected.events, args.sessionStartedAtMs),
        };
    }
    if (args.applyResolvedFilter === true) {
        const kept = [];
        for (const event of selected.events) {
            if (await isConflictEventUnresolved(event)) {
                kept.push(event);
            }
        }
        selected = { ...selected, events: kept };
    }
    return selected;
}
function eventToJsonLine(event) {
    // Build a plain object so undefined optionals are omitted (JSON.stringify).
    const row = {
        v: event.v,
        event_id: event.event_id,
        journal_epoch: event.journal_epoch,
        seq: event.seq,
        ts_ms: event.ts_ms,
        kind: event.kind,
    };
    if (event.store_id !== undefined) {
        row.store_id = event.store_id;
    }
    if (event.original_rel_path !== undefined) {
        row.original_rel_path = event.original_rel_path;
    }
    if (event.conflict_rel_path !== undefined) {
        row.conflict_rel_path = event.conflict_rel_path;
    }
    if (event.original_abs_path !== undefined) {
        row.original_abs_path = event.original_abs_path;
    }
    if (event.conflict_abs_path !== undefined) {
        row.conflict_abs_path = event.conflict_abs_path;
    }
    if (event.scope_kind !== undefined) {
        row.scope_kind = event.scope_kind;
    }
    if (event.limit_bytes !== undefined) {
        row.limit_bytes = event.limit_bytes;
    }
    if (event.usage_bytes !== undefined) {
        row.usage_bytes = event.usage_bytes;
    }
    if (event.preserved_bytes !== undefined) {
        row.preserved_bytes = event.preserved_bytes;
    }
    if (event.source !== undefined) {
        row.source = event.source;
    }
    if (event.remote_only === true) {
        row.remote_only = true;
    }
    return `${JSON.stringify(row)}\n`;
}
function dedupKeyFor(emit) {
    if (emit.conflictRelPath !== undefined) {
        return `${emit.storeId}\0${emit.conflictRelPath}`;
    }
    if (emit.kind === "truncate_conflict_failed") {
        return `${emit.storeId}\0\0truncate:${emit.originalRelPath}`;
    }
    if (emit.kind === "conflict_fallback_failed") {
        return `${emit.storeId}\0\0fallback:${emit.originalRelPath}`;
    }
    if (emit.kind === "quota_exceeded") {
        const scope = emit.scopeKind ?? "store";
        return `${emit.storeId}\0\0quota:${scope}`;
    }
    return undefined;
}
/**
 * Dedup key for a persisted {@link ConflictEvent}, byte-identical to
 * {@link dedupKeyFor} for the emit that produced it. Used to rebuild the
 * in-memory dedup set from the on-disk journal on construction so a fresh
 * engine re-emitting a durably-queued pending emit that is already in the
 * journal is deduped instead of appending a duplicate row. `gap` rows (and any
 * row missing `store_id`) have no key.
 */
function dedupKeyForEvent(event) {
    if (event.store_id === undefined) {
        return undefined;
    }
    if (event.conflict_rel_path !== undefined) {
        return `${event.store_id}\0${event.conflict_rel_path}`;
    }
    // Quota keys do not include original_rel_path (see {@link dedupKeyFor});
    // check before the pathless early-return so reload rebuild matches emit.
    if (event.kind === "quota_exceeded") {
        const scope = event.scope_kind ?? "store";
        return `${event.store_id}\0\0quota:${scope}`;
    }
    if (event.original_rel_path === undefined) {
        return undefined;
    }
    if (event.kind === "truncate_conflict_failed") {
        return `${event.store_id}\0\0truncate:${event.original_rel_path}`;
    }
    if (event.kind === "conflict_fallback_failed") {
        return `${event.store_id}\0\0fallback:${event.original_rel_path}`;
    }
    return undefined;
}
/**
 * Total dedup key for the durable pending sidecar. Unlike {@link dedupKeyFor}
 * (which returns `undefined` for emits with no natural journal key), this
 * always yields a stable key so a queued retry can never silently collapse two
 * distinct emits — or re-queue the same one twice across a reload.
 */
function pendingConflictEmitKey(emit) {
    return [emit.storeId, emit.kind, emit.originalRelPath, emit.conflictRelPath ?? ""].join("\0");
}
const PENDING_EMIT_KINDS = new Set([
    "write_conflict",
    "create_conflict",
    "truncate_conflict_failed",
    "conflict_fallback_failed",
    "quota_exceeded",
]);
/** Parse one persisted pending-emit row; returns `undefined` for junk lines. */
function parsePendingConflictEmit(raw) {
    if (!isRecord(raw)) {
        return undefined;
    }
    const kind = asString(raw.kind);
    const storeId = asString(raw.storeId);
    const originalRelPath = asString(raw.originalRelPath);
    const originalAbsPath = asString(raw.originalAbsPath);
    if (kind === undefined ||
        storeId === undefined ||
        originalRelPath === undefined ||
        originalAbsPath === undefined ||
        !PENDING_EMIT_KINDS.has(kind)) {
        return undefined;
    }
    const sourceRaw = asString(raw.source);
    const remoteOnly = asBoolean(raw.remoteOnly);
    return {
        kind: kind,
        storeId,
        originalRelPath,
        conflictRelPath: asString(raw.conflictRelPath),
        originalAbsPath,
        conflictAbsPath: asString(raw.conflictAbsPath),
        preservedBytes: asNumber(raw.preservedBytes),
        scopeKind: asString(raw.scopeKind),
        limitBytes: asNumber(raw.limitBytes),
        usageBytes: asNumber(raw.usageBytes),
        ...(sourceRaw === "local_sync" ? { source: "local_sync" } : {}),
        ...(remoteOnly === true ? { remoteOnly: true } : {}),
    };
}
function pendingEmitToJsonLine(emit) {
    const row = {
        kind: emit.kind,
        storeId: emit.storeId,
        originalRelPath: emit.originalRelPath,
        originalAbsPath: emit.originalAbsPath,
    };
    if (emit.conflictRelPath !== undefined) {
        row.conflictRelPath = emit.conflictRelPath;
    }
    if (emit.conflictAbsPath !== undefined) {
        row.conflictAbsPath = emit.conflictAbsPath;
    }
    if (emit.preservedBytes !== undefined) {
        row.preservedBytes = emit.preservedBytes;
    }
    if (emit.scopeKind !== undefined) {
        row.scopeKind = emit.scopeKind;
    }
    if (emit.limitBytes !== undefined) {
        row.limitBytes = emit.limitBytes;
    }
    if (emit.usageBytes !== undefined) {
        row.usageBytes = emit.usageBytes;
    }
    if (emit.source !== undefined) {
        row.source = emit.source;
    }
    if (emit.remoteOnly === true) {
        row.remoteOnly = true;
    }
    return `${JSON.stringify(row)}\n`;
}
/**
 * `fs.openSync` that refuses a symlinked final component even on platforms
 * without `O_NOFOLLOW`. On POSIX the flag is ORed into `baseFlags` so the
 * kernel refuses the leaf atomically. Windows has no `O_NOFOLLOW`
 * (`fs.constants.O_NOFOLLOW` is `undefined`, and `baseFlags | undefined` would
 * silently drop the guard, making the no-follow hardening a no-op), so we
 * `lstat` the target first and refuse a symlink before opening. That lstat is
 * best-effort — it cannot close the TOCTOU race the way `O_NOFOLLOW` does —
 * but it turns the Windows no-op into a real refusal for anything written
 * under `.sync/`.
 *
 * The flags/mode/no-follow arguments are grouped into a single options object
 * because they are all plain numbers and were trivial to transpose in
 * positional form (a swapped `mode`/`nofollowFlag` would silently disable the
 * symlink guard or the private-file mode). `mode` stays required so callers
 * cannot silently fall through to Node's default create mode (`0o666` masked
 * by umask) and lose the private `0o600` journal/pending files this helper
 * exists to protect. `nofollowFlag` is passed explicitly by production callers
 * (the captured {@link O_NOFOLLOW_FLAG}, never defaulted); a test can force the
 * no-`O_NOFOLLOW` (Windows) branch by omitting it or passing `undefined` on a
 * POSIX host, where `fs.constants.O_NOFOLLOW` is a fixed, immutable number that
 * a default argument could not be overridden away from.
 */
function openNoFollowSync(targetPath, options) {
    const { baseFlags, mode, nofollowFlag } = options;
    if (typeof nofollowFlag === "number") {
        return conflict_events_fs.openSync(targetPath, baseFlags | nofollowFlag, mode);
    }
    let existing;
    try {
        existing = conflict_events_fs.lstatSync(targetPath);
    }
    catch (error) {
        if (!isEnoent(error)) {
            throw error;
        }
    }
    if (existing?.isSymbolicLink() === true) {
        const refusal = new Error(`refusing to open symlinked journal path: ${targetPath}`);
        refusal.code = "ELOOP";
        throw refusal;
    }
    return conflict_events_fs.openSync(targetPath, baseFlags, mode);
}
/**
 * Read a journal/pending leaf without following a planted symlink. Missing
 * files surface as ENOENT (same as `readFileSync`); symlink leaves throw
 * ELOOP via {@link openNoFollowSync}.
 */
function readFileNoFollowSync(targetPath) {
    const fd = openNoFollowSync(targetPath, {
        baseFlags: conflict_events_fs.constants.O_RDONLY,
        mode: PRIVATE_FILE_MODE,
        nofollowFlag: O_NOFOLLOW_FLAG,
    });
    try {
        return conflict_events_fs.readFileSync(fd, "utf8");
    }
    finally {
        conflict_events_fs.closeSync(fd);
    }
}
async function readFileNoFollow(targetPath) {
    // Async readers share the sync no-follow open so a planted leaf symlink is
    // refused before any follow-symlink read API can observe the target.
    return readFileNoFollowSync(targetPath);
}
/**
 * Append-only conflict journal with epoch/seq cursors and upsert-per-path
 * dedup. Best-effort: failures warn + count and never propagate.
 */
class ConflictJournal {
    constructor(journalPath, options) {
        this.nextSeq = 1;
        this.appendFailures = 0;
        this.rotations = 0;
        this.emittedConflicts = new Set();
        this.path = journalPath;
        this.epoch = randomUUID();
        this.warn = wrapConflictJournalWarn(options?.warn ??
            ((message, error) => {
                // Package code avoids console.log in shipped paths; callers that
                // care pass a warn hook. Default is silent count-only.
                void message;
                void error;
            }));
        this.hydrateDedupFromDisk();
    }
    /**
     * Seed the in-memory dedup set from the conflicts already on disk. The set is
     * otherwise process-local, so a fresh engine (restart / lock handoff) would
     * re-append a durably-queued pending emit that a previous holder already
     * journaled, producing a duplicate row with a new `event_id`. Rebuilding from
     * the current file makes that re-emit a no-op — while a conflict wiped by a
     * rotation is (correctly) absent here, so it is re-appended rather than lost.
     * Best-effort: a missing/unreadable journal simply yields an empty set.
     */
    hydrateDedupFromDisk() {
        const keys = this.readDedupKeysFromDisk();
        if (keys === undefined) {
            return;
        }
        this.replaceDedupKeys(keys);
    }
    /**
     * Read dedup keys from the on-disk journal.
     * Returns `undefined` when the journal exists but cannot be read (keep the
     * in-memory set). Returns an empty array for a missing journal (ENOENT).
     */
    readDedupKeysFromDisk() {
        let body;
        try {
            body = readFileNoFollowSync(this.path);
        }
        catch (error) {
            if (!isEnoent(error)) {
                this.warn("conflict journal dedup hydrate failed", error);
                return undefined;
            }
            return [];
        }
        const keys = [];
        for (const event of parseConflictJournalLines(body)) {
            const key = dedupKeyForEvent(event);
            if (key === undefined) {
                continue;
            }
            keys.push(key);
        }
        return keys;
    }
    replaceDedupKeys(keys) {
        this.emittedConflicts.clear();
        for (const key of keys) {
            if (this.emittedConflicts.size >= MAX_DEDUP_ENTRIES) {
                this.emittedConflicts.clear();
            }
            this.emittedConflicts.add(key);
        }
    }
    /**
     * Rebuild the in-memory dedup set from the on-disk journal. Call before a
     * pending-sidecar flush after lock handoff so another holder's journaled
     * conflicts are visible as dedup hits instead of duplicate rows. On a
     * non-ENOENT read failure, leave the existing set untouched so a transient
     * I/O error cannot empty dedup and re-append duplicates.
     *
     * @returns `true` when the on-disk journal was read successfully (including
     *   ENOENT → empty set). `false` when the read failed and the prior in-memory
     *   set was kept — callers that strip pending mirrors must not treat that
     *   stale set as authoritative.
     */
    refreshDedupFromDisk() {
        const keys = this.readDedupKeysFromDisk();
        if (keys === undefined) {
            return false;
        }
        this.replaceDedupKeys(keys);
        return true;
    }
    appendFailureCount() {
        return this.appendFailures;
    }
    /**
     * Count of size-triggered rotations (gap rewrites) so far. A rotation wipes
     * every line written before it, so a caller flushing a batch of durably
     * queued emits can detect that an earlier-appended notice was discarded and
     * keep it queued for the next round instead of dropping it.
     */
    rotationCount() {
        return this.rotations;
    }
    /**
     * Whether {@link emit} would be a no-op because this conflict path is
     * already in the in-memory dedup set (journaled earlier this process, or
     * rebuilt from disk). Used by the pending flush so dedup hits are not
     * mistaken for fresh same-round appends.
     */
    wouldDedup(emit) {
        const key = dedupKeyFor(emit);
        return key !== undefined && this.emittedConflicts.has(key);
    }
    /**
     * Best-effort emit. Returns `true` when recorded or already deduped so
     * callers can keep retrying a failed append.
     */
    emit(emit) {
        const key = dedupKeyFor(emit);
        if (key !== undefined && this.emittedConflicts.has(key)) {
            return true;
        }
        try {
            this.appendEmit(emit, key);
            return true;
        }
        catch (error) {
            this.appendFailures += 1;
            this.warn(`conflict journal append failed; sync round still succeeded (failures=${this.appendFailures})`, error);
            return false;
        }
    }
    appendEmit(emit, key) {
        if (key !== undefined && this.emittedConflicts.has(key)) {
            return;
        }
        const parent = conflict_events_path.dirname(this.path);
        if (parent.length > 0) {
            // Refuse ancestor symlinks: recursive mkdir can escape the store root.
            conflict_events_ensureSecureDirectoryChain(parent);
        }
        this.maybeRotateLocked();
        const seq = this.nextSeq;
        const event = {
            v: EVENT_SCHEMA_VERSION,
            event_id: randomUUID(),
            journal_epoch: this.epoch,
            seq,
            ts_ms: nowMs(),
            kind: emit.kind,
            store_id: emit.storeId,
            original_rel_path: emit.originalRelPath,
            conflict_rel_path: emit.conflictRelPath,
            original_abs_path: emit.originalAbsPath,
            conflict_abs_path: emit.conflictAbsPath,
            preserved_bytes: emit.preservedBytes,
            scope_kind: emit.scopeKind,
            limit_bytes: emit.limitBytes,
            usage_bytes: emit.usageBytes,
            ...(emit.source !== undefined ? { source: emit.source } : {}),
            ...(emit.remoteOnly === true ? { remote_only: true } : {}),
        };
        this.writeJsonlLine(event);
        this.nextSeq = seq + 1;
        if (key !== undefined) {
            if (this.emittedConflicts.size >= MAX_DEDUP_ENTRIES) {
                this.emittedConflicts.clear();
            }
            this.emittedConflicts.add(key);
        }
    }
    writeJsonlLine(event) {
        const line = eventToJsonLine(event);
        // Refuse to append through a symlink planted under `.sync/` (O_NOFOLLOW on
        // POSIX; an lstat guard where the flag is unavailable — see helper).
        const fd = openNoFollowSync(this.path, {
            baseFlags: conflict_events_fs.constants.O_WRONLY | conflict_events_fs.constants.O_CREAT | conflict_events_fs.constants.O_APPEND,
            mode: PRIVATE_FILE_MODE,
            nofollowFlag: O_NOFOLLOW_FLAG,
        });
        try {
            try {
                conflict_events_fs.fchmodSync(fd, PRIVATE_FILE_MODE);
            }
            catch {
                // Best-effort mode tighten.
            }
            conflict_events_fs.writeSync(fd, line);
            // Best-effort durability: the row is already written, so a failed or
            // unsupported fsync (FAT32, some virtual filesystems) must NOT abort the
            // append — otherwise `nextSeq` would not advance and the next row would
            // reuse this seq, corrupting the epoch/seq cursor. Matches the pull
            // path's best-effort fsync in sync-engine.
            try {
                conflict_events_fs.fsyncSync(fd);
            }
            catch {
                // Ignore: the write above already landed; durability is best-effort.
            }
        }
        finally {
            conflict_events_fs.closeSync(fd);
        }
    }
    maybeRotateLocked() {
        let size;
        try {
            size = conflict_events_fs.statSync(this.path).size;
        }
        catch (error) {
            if (typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "ENOENT") {
                return;
            }
            // Unknown size — do not wipe a possibly-small journal.
            this.warn("conflict journal metadata failed; skipping rotate", error);
            return;
        }
        if (size < CONFLICT_JOURNAL_ROTATE_BYTES) {
            return;
        }
        try {
            this.forceGapRewriteLocked();
        }
        catch (error) {
            this.warn("conflict journal rotate rewrite failed; appending onto oversized journal", error);
        }
    }
    forceGapRewriteLocked() {
        const seq = this.nextSeq;
        const gap = {
            v: EVENT_SCHEMA_VERSION,
            event_id: randomUUID(),
            journal_epoch: this.epoch,
            seq,
            ts_ms: nowMs(),
            kind: "gap",
        };
        const line = eventToJsonLine(gap);
        const tmp = `${this.path}.rotate-tmp`;
        // Unlink any stale/planted `.rotate-tmp` (possibly a symlink) then create
        // it exclusively and no-follow: plain "w" (O_TRUNC) would happily follow a
        // symlink planted under `.sync/` and write through it, the same hijack the
        // regular append guards against.
        try {
            conflict_events_fs.unlinkSync(tmp);
        }
        catch (error) {
            if (!isEnoent(error)) {
                throw error;
            }
        }
        const fd = openNoFollowSync(tmp, {
            baseFlags: conflict_events_fs.constants.O_WRONLY | conflict_events_fs.constants.O_CREAT | conflict_events_fs.constants.O_EXCL,
            mode: PRIVATE_FILE_MODE,
            nofollowFlag: O_NOFOLLOW_FLAG,
        });
        try {
            try {
                conflict_events_fs.fchmodSync(fd, PRIVATE_FILE_MODE);
            }
            catch {
                // Best-effort.
            }
            conflict_events_fs.writeSync(fd, line);
            try {
                conflict_events_fs.fsyncSync(fd);
            }
            catch {
                // Best-effort durability; the rewrite bytes are already written.
            }
        }
        finally {
            conflict_events_fs.closeSync(fd);
        }
        conflict_events_fs.renameSync(tmp, this.path);
        this.nextSeq = seq + 1;
        this.emittedConflicts.clear();
        this.rotations += 1;
    }
}
/** Derive the journal path beside the local mirror's `.sync/` dir. */
function conflictJournalPathForFilesDir(filesDir) {
    return conflict_events_path.join(conflict_events_path.dirname(conflict_events_path.resolve(filesDir)), conflict_events_AGENT_STORE_SYNC_DIR_NAME, conflict_events_AGENT_STORE_CONFLICT_EVENTS_FILE_NAME);
}
/** Derive the durable pending-emit sidecar path beside the `.sync/` dir. */
function conflictPendingJournalPathForFilesDir(filesDir) {
    return conflict_events_path.join(conflict_events_path.dirname(conflict_events_path.resolve(filesDir)), conflict_events_AGENT_STORE_SYNC_DIR_NAME, conflict_events_AGENT_STORE_CONFLICT_PENDING_FILE_NAME);
}
/**
 * Durable sidecar for conflict emits whose journal append failed. Mirrors an
 * in-memory queue to `conflict-events.pending.jsonl` under `.sync/` so a
 * pause / dispose / process restart does not silently drop a notice whose
 * remote conflict object is already committed. The file is the source of
 * truth: it is loaded on construction, atomically rewritten on every
 * enqueue / dequeue, and re-read via {@link reload} before each flush so a
 * multi-window lock handoff picks up another holder's queue. Best-effort —
 * file errors warn + count and never propagate, and the in-memory cache stays
 * authoritative for the round.
 */
class PendingConflictJournal {
    constructor(pendingPath, options) {
        this.pending = [];
        this.keys = new Set();
        this.persistFailures = 0;
        /**
         * True when the in-memory queue holds emits a persist never managed to write
         * to disk. While dirty, {@link reload} keeps the authoritative in-memory copy
         * instead of clobbering those unpersisted emits with the staler disk file.
         */
        this.dirty = false;
        /**
         * True when construction (or a later load retry) could not read the sidecar
         * (non-ENOENT). While set, {@link persistPending} must not rewrite the file
         * from the empty/partial in-memory queue — that would clobber durable emits
         * that were never loaded.
         */
        this.loadFailed = false;
        this.path = pendingPath;
        this.warn = wrapConflictJournalWarn(options?.warn ??
            ((message, error) => {
                void message;
                void error;
            }));
        const loaded = this.tryReadDisk();
        if (loaded !== undefined) {
            this.pending = loaded.pending;
            this.keys = loaded.keys;
        }
        else {
            this.loadFailed = true;
        }
    }
    size() {
        return this.pending.length;
    }
    isEmpty() {
        return this.pending.length === 0;
    }
    /** Snapshot copy so callers can iterate while mutating the queue. */
    list() {
        return [...this.pending];
    }
    persistFailureCount() {
        return this.persistFailures;
    }
    /**
     * Re-read the sidecar so a newly active engine picks up emits queued by a
     * previous lock holder and drops stale in-memory rows a previous holder
     * already flushed. Disk is normally the source of truth, so its contents
     * replace the in-memory queue.
     *
     * While {@link dirty} (a failed persist left unpersisted emits only in
     * memory) disk cannot simply replace memory — that would drop the
     * not-yet-persisted emits — but the in-memory copy must not be kept
     * verbatim either, or a lock handoff's disk-only emits would be lost every
     * time a persist has ever failed (the flag was previously sticky, so a
     * single failed persist permanently blinded this engine to other holders'
     * queues). Instead the two queues are unioned by dedup key and the merged
     * result re-persisted, so neither side is lost. `dirty` clears only once
     * that rewrite lands; a hard read error (unreadable file) keeps the current
     * queue rather than clobbering it.
     */
    reload() {
        const loaded = this.tryReadDisk();
        if (loaded === undefined) {
            return;
        }
        this.loadFailed = false;
        if (!this.dirty) {
            this.pending = loaded.pending;
            this.keys = loaded.keys;
            return;
        }
        const mergedByKey = new Map();
        for (const emit of loaded.pending) {
            mergedByKey.set(pendingConflictEmitKey(emit), emit);
        }
        // In-memory emits win on key collision: they may carry the
        // not-yet-persisted state this engine is still trying to flush.
        for (const emit of this.pending) {
            mergedByKey.set(pendingConflictEmitKey(emit), emit);
        }
        const merged = [...mergedByKey.values()];
        this.pending = merged;
        this.keys = new Set(mergedByKey.keys());
        // Re-persist the union so the disk-only emits we just absorbed and our
        // unpersisted ones become durable together; stay dirty if it still fails.
        this.dirty = !this.persistPending(merged);
    }
    /** Add an emit (deduped) and durably persist the new queue. */
    enqueue(emit) {
        const key = pendingConflictEmitKey(emit);
        if (this.keys.has(key)) {
            // Key already known — still retry persist when a prior write failed so a
            // rotation-recovery re-enqueue (or any same-key retry) can durably mirror
            // an emit that exists only in memory after a dirty persist.
            if (this.dirty || this.loadFailed) {
                this.dirty = !this.persistPending(this.pending);
            }
            return;
        }
        this.keys.add(key);
        this.pending.push(emit);
        // The in-memory queue already holds the emit; persist best-effort. A
        // failure marks the queue dirty so a later reload keeps this
        // not-yet-persisted emit rather than clobbering it with the disk file.
        this.dirty = !this.persistPending(this.pending);
    }
    /**
     * Replace the whole queue (after a flush attempt drains some emits) and
     * durably persist. The reduced queue is adopted only once the rewrite (or,
     * for an empty queue, the file removal) actually lands; if it fails, the
     * existing — never smaller — queue is kept so the next flush retries the
     * write. Otherwise a failed `removeFile` after a successful journal flush
     * would empty memory while the sidecar still held already-journaled emits,
     * and `isEmpty()` would skip the retry, stranding the stale file for a later
     * engine to re-append.
     */
    replaceAll(emits) {
        const next = [];
        const nextKeys = new Set();
        for (const emit of emits) {
            const key = pendingConflictEmitKey(emit);
            if (nextKeys.has(key)) {
                continue;
            }
            nextKeys.add(key);
            next.push(emit);
        }
        // When construction failed to load the sidecar, persistPending merges
        // disk-only rows into `this.pending` before writing. Do not clobber that
        // merged queue with the caller-supplied `next` afterward.
        const recoveringLoad = this.loadFailed;
        if (this.persistPending(next)) {
            if (!recoveringLoad) {
                this.pending = next;
                this.keys = nextKeys;
            }
            this.dirty = false;
        }
        // On persist failure keep the existing queue: the failed write left disk
        // unchanged, so memory still matches disk and the next flush retries. The
        // journal's dedup set makes the re-emit a no-op, so no duplicate is added.
    }
    tryReadDisk() {
        let body;
        try {
            body = readFileNoFollowSync(this.path);
        }
        catch (error) {
            if (isEnoent(error)) {
                return { pending: [], keys: new Set() };
            }
            this.warn("conflict pending journal load failed", error);
            return undefined;
        }
        const pending = [];
        const keys = new Set();
        for (const line of body.split("\n")) {
            const trimmed = line.trim();
            if (trimmed.length === 0) {
                continue;
            }
            let parsed;
            try {
                parsed = JSON.parse(trimmed);
            }
            catch {
                continue;
            }
            const emit = parsePendingConflictEmit(parsed);
            if (emit === undefined) {
                continue;
            }
            const key = pendingConflictEmitKey(emit);
            if (keys.has(key)) {
                continue;
            }
            keys.add(key);
            pending.push(emit);
        }
        return { pending, keys };
    }
    /**
     * Persist `pending` to disk (or remove the file when empty). Returns whether
     * the write landed. Best-effort — failures warn + count and never propagate,
     * so a failed sidecar write cannot abort the sync round whose remote conflict
     * object already committed.
     */
    persistPending(pending) {
        // Never rewrite from an unloaded queue: a construction-time read failure
        // left memory empty while disk may still hold durable emits.
        if (this.loadFailed) {
            const loaded = this.tryReadDisk();
            if (loaded === undefined) {
                this.persistFailures += 1;
                this.warn(`conflict pending journal persist skipped; sidecar still unreadable ` +
                    `(failures=${this.persistFailures})`, undefined);
                return false;
            }
            this.loadFailed = false;
            // Merge disk with the caller-supplied queue so neither side is lost.
            const mergedByKey = new Map();
            for (const emit of loaded.pending) {
                mergedByKey.set(pendingConflictEmitKey(emit), emit);
            }
            for (const emit of pending) {
                mergedByKey.set(pendingConflictEmitKey(emit), emit);
            }
            const merged = [...mergedByKey.values()];
            this.pending = merged;
            this.keys = new Set(mergedByKey.keys());
            return this.persistPending(merged);
        }
        try {
            if (pending.length === 0) {
                this.removeFile();
                return true;
            }
            const parent = conflict_events_path.dirname(this.path);
            if (parent.length > 0) {
                // Same secure chain as {@link ConflictJournal.appendEmit}: recursive
                // mkdir can follow an ancestor symlink out of the store root.
                conflict_events_ensureSecureDirectoryChain(parent);
            }
            const body = pending.map(pendingEmitToJsonLine).join("");
            this.atomicRewrite(body);
            return true;
        }
        catch (error) {
            this.persistFailures += 1;
            this.warn(`conflict pending journal persist failed (failures=${this.persistFailures})`, error);
            return false;
        }
    }
    atomicRewrite(body) {
        const tmp = `${this.path}.pending-tmp`;
        // Unlink any stale/planted `.pending-tmp` (possibly a symlink) then create
        // it exclusively and no-follow: the same symlink-hijack guard the journal
        // append and rotate paths use for anything written under `.sync/`.
        try {
            conflict_events_fs.unlinkSync(tmp);
        }
        catch (error) {
            if (!isEnoent(error)) {
                throw error;
            }
        }
        const fd = openNoFollowSync(tmp, {
            baseFlags: conflict_events_fs.constants.O_WRONLY | conflict_events_fs.constants.O_CREAT | conflict_events_fs.constants.O_EXCL,
            mode: PENDING_FILE_MODE,
            nofollowFlag: O_NOFOLLOW_FLAG,
        });
        try {
            try {
                conflict_events_fs.fchmodSync(fd, PENDING_FILE_MODE);
            }
            catch {
                // Best-effort mode tighten.
            }
            conflict_events_fs.writeSync(fd, body);
            try {
                conflict_events_fs.fsyncSync(fd);
            }
            catch {
                // Best-effort durability; the bytes are already written.
            }
        }
        finally {
            conflict_events_fs.closeSync(fd);
        }
        conflict_events_fs.renameSync(tmp, this.path);
    }
    removeFile() {
        try {
            conflict_events_fs.unlinkSync(this.path);
        }
        catch (error) {
            if (!isEnoent(error)) {
                throw error;
            }
        }
    }
}
const PENDING_FILE_MODE = 0o600;
function isEnoent(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT");
}

;// ../agent-store/sync/dist/conflict-notice-claim-state.js
/**
 * Shared in-process claim state for agent-store conflict notices.
 *
 * The per-exec journal drain and the turn-end barrier host must share more than
 * the announced ledger: exactly-once delivery needs a single leased-id set and
 * a claim chain so parent/subagent sessions cannot double-deliver the same
 * journal event before either acks it.
 *
 * Journal cursors are deliberately NOT shared. Each drain/host instance carries
 * its own `sessionStartedAtMs` floor; a shared cursor advanced by a newer
 * session's peek would permanently skip journal rows an older session (under a
 * lower floor) still needs to deliver. Cursors therefore stay private per
 * instance — see the `cursors` maps in `AgentStoreConflictDrain` and
 * `AgentStoreConflictNoticeHost`.
 */
/** Cap the shared dedup set so a long session cannot grow it unbounded. */
const MAX_ANNOUNCED_EVENT_IDS = 65_536;
/**
 * When the announced set hits its cap, evict this many of the oldest entries
 * (Set insertion order) rather than clearing the whole set. On
 * `deliverEvents:false` mounts the journal cursor is deliberately not advanced,
 * so the announced ledger is the only anti-redelivery mechanism; clearing it
 * wholesale would make every previously-acked inherited-mount event eligible
 * for redelivery. Dropping just a prefix keeps the most recent acks intact.
 */
const ANNOUNCED_EVICTION_BATCH = Math.max(1, Math.floor(MAX_ANNOUNCED_EVENT_IDS / 8));
function createConflictNoticeClaimState(announcedEventIds) {
    return {
        announced: announcedEventIds ?? new Set(),
        leasedIds: new Set(),
        chain: Promise.resolve(),
    };
}
/**
 * Run `work` on the shared claim chain (the same chain peeks/drains use).
 * Session teardown must use this so `releaseAllLeased` runs only after any
 * in-flight `peekUnlocked` that might still lease into the session being
 * dropped — otherwise those leases stay in process-wide `leasedIds` forever.
 */
async function runOnConflictNoticeClaimChain(claimState, work) {
    const run = claimState.chain.then(() => work());
    const tracked = run.then(() => undefined, () => undefined);
    claimState.chain = tracked;
    return run;
}
/** Ack helper that applies the shared announced-size cap. */
function announceConflictEventIds(announced, eventIds) {
    let count = 0;
    for (const eventId of eventIds) {
        if (eventId.length === 0 || announced.has(eventId)) {
            continue;
        }
        if (announced.size >= MAX_ANNOUNCED_EVENT_IDS) {
            evictOldestAnnounced(announced);
        }
        announced.add(eventId);
        count += 1;
    }
    return count;
}
/** Evict the oldest `ANNOUNCED_EVICTION_BATCH` entries in Set insertion order. */
function evictOldestAnnounced(announced) {
    const toEvict = [];
    for (const eventId of announced) {
        toEvict.push(eventId);
        if (toEvict.length >= ANNOUNCED_EVICTION_BATCH) {
            break;
        }
    }
    for (const eventId of toEvict) {
        announced.delete(eventId);
    }
}

;// ../agent-store/sync/dist/conflict-notice-drain.js
/* unused harmony import specifier */ var conflict_notice_drain_fsp;
/* unused harmony import specifier */ var HookAdditionalContext;
/* unused harmony import specifier */ var conflict_notice_drain_readConflictEvents;
/* unused harmony import specifier */ var conflict_notice_drain_conflictEventsCursorAfterForeignLeaseBarrier;
/* unused harmony import specifier */ var conflict_notice_drain_announceConflictEventIds;
/* unused harmony import specifier */ var renderConflictNotice;
/* unused harmony import specifier */ var MAX_CONFLICT_NOTICE_CHARS;
/**
 * Per-session conflict-notice drain into hook additional-context carriers.
 *
 * Reads mounted-store journals past an in-memory cursor, applies the
 * session-start floor and resolved-filter, dedups by `event_id`, and renders
 * one batched notice. Prefer {@link AgentStoreConflictDrain.peek} /
 * {@link AgentStoreConflictDrain.ack} so the cursor advances only after the
 * carrier is attached. Format-generic (schema-v1 JSONL), so the same drain
 * works for local-sync and FUSE journals — only advertised source paths differ.
 */





/** Carrier `hook_event_name` for local-sync conflict notices. */
const AGENT_STORE_CONFLICT_HOOK_EVENT_NAME = "agentStoreConflict";
// Re-export for callers that previously imported the cap from this module.

/** Build the (0- or 1-element) carrier array for a rendered notice string. */
function buildConflictNoticeCarriers(events) {
    const content = renderConflictNotice(events, {
        maxChars: MAX_CONFLICT_NOTICE_CHARS,
    });
    if (content === undefined || content.length === 0) {
        return [];
    }
    return [
        new HookAdditionalContext({
            hookEventName: AGENT_STORE_CONFLICT_HOOK_EVENT_NAME,
            content,
        }),
    ];
}
async function defaultStatJournal(journalPath) {
    try {
        const st = await conflict_notice_drain_fsp.stat(journalPath);
        return { mtimeMs: st.mtimeMs, size: st.size };
    }
    catch {
        return undefined;
    }
}
/**
 * Per-session drain state: one instance per consuming session. Cursors and the
 * dedup set live in memory only (broadcast semantics — every session drains
 * the shared journal independently and announces each event once to itself).
 */
class AgentStoreConflictDrain {
    constructor(options) {
        this.lastStat = new Map();
        /**
         * Unacked events waiting to be claimed by the next {@link peek}. Entries keep
         * their journal path so a peek only reclaims pending events whose journal is
         * still in the current source refs — a live `createSource` can change which
         * journals this drain reads (e.g. after a chat switch), and a released notice
         * from an out-of-scope journal must not be leased onto an unrelated result.
         */
        this.pending = new Map();
        /** Events claimed by an in-flight peek; hidden from concurrent peeks. */
        this.leased = new Map();
        /** Serialize peek claims so parallel tool drains cannot double-deliver. */
        this.peekChain = Promise.resolve();
        this.sources = options.sources;
        this.quotaNoticesEnabled =
            typeof options.quotaNoticesEnabled === "function"
                ? options.quotaNoticesEnabled
                : () => options.quotaNoticesEnabled === true;
        this.sessionStartedAtMs = options.sessionStartedAtMs;
        this.statJournal = options.statJournal ?? defaultStatJournal;
        this.claimState = options.claimState;
        this.announced =
            options.claimState?.announced ?? options.announcedEventIds ?? new Set();
        this.leasedIds = options.claimState?.leasedIds ?? new Set();
        // Never adopt cursors from the shared claim state: cursors are per-instance
        // so a newer session's peek cannot advance past rows an older session
        // (under a lower `sessionStartedAtMs` floor) still needs.
        this.cursors = new Map();
        this.warn = options.warn ?? (() => { });
    }
    /**
     * Claim fresh events without marking them consumed. Advances the journal
     * cursor and moves events into {@link leased} until {@link ack} or
     * {@link release}, so parallel peeks cannot attach the same notice twice.
     */
    async peek() {
        const chainOwner = this.claimState ?? { chain: this.peekChain };
        const run = chainOwner.chain.then(() => this.peekUnlocked());
        const tracked = run.then(() => undefined, () => undefined);
        chainOwner.chain = tracked;
        if (this.claimState === undefined) {
            this.peekChain = tracked;
        }
        return run;
    }
    async peekUnlocked() {
        const refs = await this.collectRefs();
        const journalPaths = new Set(refs.map((ref) => ref.journalPath));
        for (const ref of refs) {
            const drained = await this.drainOne(ref.journalPath);
            // Park the full drained stream (including suppressed `quota_exceeded`
            // rows) rather than filtering here. `drainOne` has already advanced this
            // journal's cursor past these events via the shared foreign-lease
            // barrier, so dropping quota rows at parking time would lose them
            // permanently if the gate later opens mid-session. Quota suppression is
            // applied at delivery below, where a suppressed row stays parked instead
            // of being consumed.
            for (const event of drained) {
                if (this.leased.has(event.event_id) || this.leasedIds.has(event.event_id)) {
                    continue;
                }
                this.pending.set(event.event_id, {
                    event,
                    journalPath: ref.journalPath,
                });
            }
        }
        // Drop pending entries that another channel (L3/L4) already acked via the
        // shared announced ledger, or leased via the shared claim set.
        for (const eventId of [...this.pending.keys()]) {
            if (this.announced.has(eventId) || this.leasedIds.has(eventId)) {
                this.pending.delete(eventId);
            }
        }
        // Only claim pending events whose journal is in the current source refs,
        // mirroring the host's `mountJournals` filter. A live `createSource` can
        // narrow the journals this drain reads after a chat switch; a pending
        // notice from a now-out-of-scope journal stays parked instead of leaking
        // onto an unrelated conversation's tool result.
        const quotaNoticesEnabled = this.quotaNoticesEnabled();
        const fresh = [];
        for (const [eventId, entry] of [...this.pending]) {
            if (!journalPaths.has(entry.journalPath)) {
                continue;
            }
            // Suppress `quota_exceeded` at delivery only when the gate is off, and
            // leave it parked (do not delete/lease) so it is delivered if the gate
            // later opens. Consuming it here would drop the row from the shared
            // cursor/lease bookkeeping and lose it permanently.
            if (!quotaNoticesEnabled && entry.event.kind === "quota_exceeded") {
                continue;
            }
            this.pending.delete(eventId);
            this.leased.set(eventId, entry);
            this.leasedIds.add(eventId);
            fresh.push(entry);
        }
        if (fresh.length === 0) {
            return { carriers: [], eventIds: [] };
        }
        const events = fresh.map((entry) => entry.event);
        return {
            carriers: buildConflictNoticeCarriers(events),
            eventIds: events.map((event) => event.event_id),
        };
    }
    ack(eventIds) {
        // Only clear shared leasedIds / announce for ids this instance leased.
        // A misrouted or cross-session ack must not drop another conversation's
        // live lease from the process-wide claim state (same ownership gate as
        // {@link release}).
        const owned = eventIds.filter((eventId) => this.leased.has(eventId));
        conflict_notice_drain_announceConflictEventIds(this.announced, owned);
        for (const eventId of owned) {
            this.pending.delete(eventId);
            this.leased.delete(eventId);
            this.leasedIds.delete(eventId);
        }
    }
    release(eventIds) {
        for (const eventId of eventIds) {
            const entry = this.leased.get(eventId);
            if (entry === undefined) {
                continue;
            }
            this.leasedIds.delete(eventId);
            if (this.announced.has(eventId)) {
                this.leased.delete(eventId);
                continue;
            }
            this.pending.set(eventId, entry);
            this.leased.delete(eventId);
        }
    }
    /**
     * Session teardown: drop THIS instance's currently-leased ids from the
     * shared claim state so events it leased but never acked are not stranded in
     * the shared `leasedIds` forever — which would hide them from every other
     * conversation. Cursors are private, so the next session that peeks these
     * journals re-reads and re-delivers those rows.
     *
     * Only ids in this instance's private {@link leased} map are released:
     * `pending` ids were already returned to the pool (their entry left
     * `leasedIds` when it was parked), so another conversation may have leased
     * that id since. Releasing pending here would delete the OTHER instance's
     * live lease from the shared set and let a third peek double-deliver it.
     *
     * Prefer {@link ackAllLeased} when the conversation is abandoned after a
     * possible inject (chat switch): releasing would allow a later session to
     * re-deliver ids the previous turn may already have shown the model.
     */
    releaseAllLeased() {
        this.release([...this.leased.keys()]);
    }
    /**
     * Session teardown for an abandoned conversation: announce every id this
     * instance still leases so a later session cannot re-deliver them. Use when
     * inject may have already succeeded and only ack is racing teardown.
     */
    ackAllLeased() {
        this.ack([...this.leased.keys()]);
    }
    /**
     * Drain all sources and return the batched carrier(s). Best-effort: a
     * failing journal read warns and is skipped, never throwing into the exec
     * path. Returns `[]` when there is nothing new to announce.
     *
     * Marks events consumed immediately — prefer {@link peek}/{@link ack} when
     * the caller attaches carriers to a collector.
     */
    async drain() {
        const peeked = await this.peek();
        this.ack(peeked.eventIds);
        return peeked.carriers;
    }
    async collectRefs() {
        const seen = new Set();
        const out = [];
        for (const source of this.sources) {
            let refs;
            try {
                refs = await source.listJournalRefs();
            }
            catch (error) {
                this.warn("conflict notice source failed", error);
                continue;
            }
            for (const ref of refs) {
                if (ref.journalPath.length === 0 || seen.has(ref.journalPath)) {
                    continue;
                }
                seen.add(ref.journalPath);
                out.push(ref);
            }
        }
        return out;
    }
    async drainOne(journalPath) {
        const cursor = this.cursors.get(journalPath);
        // mtime/size gate: skip the read when nothing changed since the last drain
        // and we already have a cursor for this journal.
        const stat = await this.statJournal(journalPath);
        if (stat === undefined) {
            return [];
        }
        const prev = this.lastStat.get(journalPath);
        if (cursor !== undefined &&
            prev !== undefined &&
            prev.mtimeMs === stat.mtimeMs &&
            prev.size === stat.size) {
            return [];
        }
        let result;
        try {
            result = await conflict_notice_drain_readConflictEvents({
                journalPath,
                cursor,
                sessionStartedAtMs: this.sessionStartedAtMs,
                applyResolvedFilter: true,
            });
        }
        catch (error) {
            // Do NOT advance lastStat on a failed read: leaving it stale keeps the
            // mtime/size gate open so the next drain retries this journal instead
            // of skipping it as unchanged.
            this.warn("conflict journal read failed", error);
            return [];
        }
        const { deliverableEvents, nextCursor, stoppedAtForeignLease } = conflict_notice_drain_conflictEventsCursorAfterForeignLeaseBarrier({
            events: result.events,
            fullNextCursor: result.nextCursor,
            previousCursor: cursor,
            announced: this.announced,
            leasedIds: this.leasedIds,
            isOwnLease: (eventId) => this.leased.has(eventId),
        });
        this.cursors.set(journalPath, nextCursor);
        // Keep the mtime/size gate open while a foreign lease blocks this cursor
        // so the next peek re-reads the journal after the lease is released.
        if (!stoppedAtForeignLease) {
            this.lastStat.set(journalPath, stat);
        }
        return deliverableEvents;
    }
}

;// ../agent-store/sync/dist/conflict-notices.js





;// ../hooks-exec/dist/agent-store-conflict-notice-host.js
/* unused harmony import specifier */ var agent_store_conflict_notice_host_path;
/* unused harmony import specifier */ var agent_store_conflict_notice_host_announceConflictEventIds;
/* unused harmony import specifier */ var agent_store_conflict_notice_host_readConflictEvents;
/* unused harmony import specifier */ var agent_store_conflict_notice_host_conflictEventsCursorAfterForeignLeaseBarrier;
/* unused harmony import specifier */ var agent_store_conflict_notice_host_isConflictEventUnresolved;
/* unused harmony import specifier */ var renderEagerConflictNotice;
/* unused harmony import specifier */ var agent_store_conflict_notice_host_MAX_CONFLICT_NOTICE_CHARS;
/* unused harmony import specifier */ var agent_store_conflict_notice_host_renderConflictNotice;
/* unused harmony import specifier */ var delay;
/**
 * Host implementation of {@link AgentStoreConflictNoticeExecutor}.
 *
 * Bridges the agent-exec surface to the sync-engine journal via a host
 * {@link AgentStoreConflictNoticeDriver}. Shares an in-memory announced-event
 * ledger with the per-exec drain so barrier-injected notices are not
 * re-delivered. Soft timeout never cancels an in-flight sync; a bounded grace
 * wait follows, then the drain proceeds.
 */



const DEFAULT_SYNC_AND_PEEK_TIMEOUT_MS = 5_000;
/**
 * Extra time the barrier waits for a force that missed the soft timeout, so a
 * conflict journaled just after the deadline is still delivered on this call.
 * Bounded on purpose: an unbounded wait here makes the caller's timeout
 * meaningless and lets one slow round hold a tool result open indefinitely.
 */
const DEFAULT_FORCE_GRACE_TIMEOUT_MS = 2_000;
function toNoticeEvent(event) {
    return {
        v: event.v,
        eventId: event.event_id,
        journalEpoch: event.journal_epoch,
        seq: event.seq,
        tsMs: event.ts_ms,
        kind: event.kind,
        ...(event.store_id !== undefined ? { storeId: event.store_id } : {}),
        ...(event.original_rel_path !== undefined ? { originalRelPath: event.original_rel_path } : {}),
        ...(event.conflict_rel_path !== undefined ? { conflictRelPath: event.conflict_rel_path } : {}),
        ...(event.original_abs_path !== undefined ? { originalAbsPath: event.original_abs_path } : {}),
        ...(event.conflict_abs_path !== undefined ? { conflictAbsPath: event.conflict_abs_path } : {}),
        ...(event.preserved_bytes !== undefined ? { preservedBytes: event.preserved_bytes } : {}),
        ...(event.scope_kind !== undefined ? { scopeKind: event.scope_kind } : {}),
        ...(event.limit_bytes !== undefined ? { limitBytes: event.limit_bytes } : {}),
        ...(event.usage_bytes !== undefined ? { usageBytes: event.usage_bytes } : {}),
        ...(event.source !== undefined ? { source: event.source } : {}),
        ...(event.remote_only === true ? { remoteOnly: true } : {}),
    };
}
class AgentStoreConflictNoticeHost {
    constructor(options) {
        /**
         * Unacked peeks: resurfaced on every drain until {@link ack} records them in
         * the shared ledger. Advancing a journal cursor is permanent, so a caller
         * that fails to deliver (e.g. `appendMessages` throws before the barrier
         * acks) must still see the events on the next peek instead of losing them.
         * Entries keep their journal path so a conversation-scoped drain does not
         * surface (or imply ack of) another conversation's pending events.
         */
        this.pending = new Map();
        /**
         * Events returned by a drain but not yet acked. Hidden from concurrent
         * peeks so overlapping barriers cannot double-claim the same notice.
         */
        this.leased = new Map();
        /**
         * Written paths from an eager barrier that timed out before the conflict was
         * journaled. The turn-end barrier (and later eager peeks) retry these so inherited
         * `deliverEvents: false` mounts are not dropped after the in-flight sync
         * eventually lands the event. A later eager barrier for an overlapping path
         * must also use neutral wording: the conflict may belong to the earlier
         * timed-out write (possibly still finishing in the driver), not the
         * write that just ran.
         */
        this.deferredEagerWrittenPaths = new Set();
        /**
         * Write paths from post-tool wake (turn-end inherited-mount rescue only).
         * Kept separate from {@link deferredEagerWrittenPaths} so wake bookkeeping
         * cannot flip eager same-write attribution to neutral wording. Cleared after
         * a successful barrier (or empty-timeout keep for retry) — not used for
         * abort-after-lease; that is {@link deferredForceWrittenPaths}.
         */
        this.deferredWakeWrittenPaths = new Set();
        /**
         * Paths that must re-force inherited (`deliverEvents: false`) mounts after a
         * leased delivery is released/aborted. Folded into turn-end writtenPaths like
         * wake/eager deferrals, but never consulted by
         * {@link shouldUseStrongEagerAttribution}.
         */
        this.deferredForceWrittenPaths = new Set();
        /** Serialize journal drains so concurrent barriers cannot double-claim. */
        this.drainChain = Promise.resolve();
        this.driver = options.driver;
        this.sessionStartedAtMs = options.sessionStartedAtMs;
        this.claimState = options.claimState;
        this.announced =
            options.claimState?.announced ?? options.announcedEventIds ?? new Set();
        this.leasedIds = options.claimState?.leasedIds ?? new Set();
        this.quotaNoticesEnabled =
            typeof options.quotaNoticesEnabled === "function"
                ? options.quotaNoticesEnabled
                : () => options.quotaNoticesEnabled === true;
        // Never adopt cursors from the shared claim state: cursors are per-instance
        // so a newer session's peek cannot advance past rows an older session
        // (under a lower `sessionStartedAtMs` floor) still needs.
        this.cursors = new Map();
        this.defaultTimeoutMs = options.defaultTimeoutMs ?? DEFAULT_SYNC_AND_PEEK_TIMEOUT_MS;
        this.resolveForceGraceTimeoutMs = options.resolveForceGraceTimeoutMs;
        this.warn = options.warn ?? (() => { });
    }
    async execute(_ctx, args, _options) {
        switch (args.op) {
            case "ack":
                return this.ack(args.eventIds);
            case "release":
                return this.release(args.eventIds);
            case "noteDeferredEagerWrittenPaths":
                return this.noteDeferredEagerWrittenPaths(args);
            case "peek":
                return await this.peek(args);
            case "syncAndPeek":
                return await this.syncAndPeek(args);
            default: {
                const _exhaustive = args;
                void _exhaustive;
                return { kind: "failed", error: "unknown op" };
            }
        }
    }
    /**
     * Abort-before-barrier path: remember inherited writtenPaths so the turn-end barrier
     * can still force those journals after the post-tool drain was skipped for the write.
     */
    noteDeferredEagerWrittenPaths(args) {
        const writtenPaths = args.writtenPaths;
        if (writtenPaths.length === 0) {
            return { kind: "noted", count: 0 };
        }
        // Abort-before-barrier notes go into the force-retry set (not the eager
        // strong-attribution set) so a later decorate-path eager notice is not
        // forced to neutral wording solely because the previous barrier aborted.
        const before = this.deferredForceWrittenPaths.size;
        const writtenMountKeys = new Set();
        for (const absPath of writtenPaths) {
            const mountKey = this.driver.resolveMountKeyForPath(absPath);
            if (mountKey !== undefined) {
                writtenMountKeys.add(mountKey);
            }
        }
        const mounts = this.mountsForSyncAndPeek({
            conversationId: args.conversationId,
            eager: true,
            writtenMountKeys,
        });
        this.rememberDeferredForInheritedWrittenPaths(mounts, writtenPaths);
        return {
            kind: "noted",
            count: Math.max(0, this.deferredForceWrittenPaths.size - before),
        };
    }
    ack(eventIds) {
        // Only clear shared leasedIds / announce for ids this instance leased.
        // A misrouted or cross-session ack must not drop another conversation's
        // live lease from the process-wide claim state (same ownership gate as
        // {@link releaseLeased}).
        const owned = eventIds.filter((id) => this.leased.has(id));
        const count = agent_store_conflict_notice_host_announceConflictEventIds(this.announced, owned);
        const ackedOriginalPaths = [];
        for (const id of owned) {
            // Clear deferred retries only once delivery is confirmed. Clearing on
            // lease/rescue would drop the path before turn-end injection; on abort
            // those events release into pending but inherited `deliverEvents: false`
            // journals are not in later conversation-scoped drains.
            const entry = this.leased.get(id) ?? this.pending.get(id);
            const originalAbsPath = entry?.event.original_abs_path;
            if (typeof originalAbsPath === "string" && originalAbsPath.length > 0) {
                ackedOriginalPaths.push(originalAbsPath);
            }
            // Only stop resurfacing an event once it is acked (delivery confirmed).
            this.pending.delete(id);
            this.leased.delete(id);
            this.leasedIds.delete(id);
        }
        this.clearDeferredEagerWrittenPathsMatchingPaths(ackedOriginalPaths);
        this.clearDeferredWakeWrittenPathsMatchingPaths(ackedOriginalPaths);
        this.clearDeferredForceWrittenPathsMatchingPaths(ackedOriginalPaths);
        return { kind: "acked", count };
    }
    release(eventIds) {
        const before = this.leased.size;
        this.releaseLeased(eventIds);
        return { kind: "released", count: Math.max(0, before - this.leased.size) };
    }
    /**
     * Session teardown: drop THIS instance's currently-leased ids from the
     * shared claim state so events it leased but never acked are not stranded in
     * the shared `leasedIds` forever — which would hide them from every other
     * conversation. Cursors are private, so the next session that peeks these
     * journals re-reads and re-delivers those rows.
     *
     * Only ids in this instance's private {@link leased} map are released:
     * `pending` ids were already returned to the pool (their entry left
     * `leasedIds` when it was parked), so another conversation may have leased
     * that id since. Releasing pending here would delete the OTHER instance's
     * live lease from the shared set and let a third peek double-deliver it.
     */
    releaseAllLeased() {
        this.releaseLeased([...this.leased.keys()]);
    }
    /**
     * Abandoned-conversation teardown: announce every id this instance still
     * leases so a later session cannot re-deliver them. Prefer this over
     * {@link releaseAllLeased} when inject may have already succeeded and only
     * ack is racing chat-switch teardown.
     */
    ackAllLeased() {
        this.ack([...this.leased.keys()]);
    }
    /**
     * Remember write paths from the post-tool wake path so turn-end
     * `syncAndPeek` (which may omit `writtenPaths`) still opens inherited
     * `deliverEvents: false` mounts. Uses a wake-only set so it cannot poison
     * eager strong attribution via {@link deferredEagerWrittenPaths}.
     */
    noteDeferredWrittenPaths(writtenPaths) {
        for (const raw of writtenPaths) {
            const resolved = this.resolveWrittenPathForDeferred(raw);
            if (resolved !== undefined) {
                this.deferredWakeWrittenPaths.add(resolved);
            }
        }
    }
    async peek(args) {
        // Scope the drain to the conversation's own mounts, mirroring
        // `syncAndPeek`'s delivery filter. Inherited parents with
        // `deliverEvents: false` are force-only and must not advance the
        // child's cursor or park parent notices into the child's pending set.
        const mounts = this.driver
            .listMounts(args.conversationId)
            .filter((mount) => mount.deliverEvents !== false);
        if (mounts.length === 0) {
            return { kind: "not-applicable" };
        }
        // Lease like the per-exec drain peek: concurrent journal peeks must see the
        // same shared leasedIds set or they would skip past journal rows without
        // ever claiming them. (Cursors stay private per instance.)
        const { events, gap } = await this.drainMounts(mounts, { lease: true });
        // Ack (not strand) an unrenderable batch, mirroring `syncAndPeek`: the
        // cursor already advanced during drain, so a leased gap-only batch left
        // unacked would stay in `leased`/`leasedIds` forever and hide those ids
        // from every other conversation.
        return this.completedOrRelease(events, gap);
    }
    async syncAndPeek(args) {
        const eager = args.eager === true;
        const rememberEagerDeferral = args.rememberEagerDeferral !== false;
        // Turn-end barrier: retry paths from an earlier eager timeout so inherited mounts
        // (the post-tool drain skips them) still get a chance to deliver. Keep rescued
        // events and fall through so dirty/unread conversation mounts are scanned
        // on the same barrier (do not short-circuit on rescue alone).
        let rescuedEvents = [];
        let rescuedGap = false;
        const triedWakePaths = !eager ? [...this.deferredWakeWrittenPaths] : [];
        // Force-retry paths fold into unscoped turn-end barriers. When the caller
        // already scoped writtenPaths (path-attributed sync), only fold force
        // entries that match that scope — otherwise a prior inherited delivery's
        // force backup would re-lease a different path's pending event.
        const forceForTurnEnd = !eager && (args.writtenPaths?.length ?? 0) === 0
            ? [...this.deferredForceWrittenPaths]
            : !eager
                ? [...this.deferredForceWrittenPaths].filter((absPath) => conflictEventMatchesWrittenPaths({ original_abs_path: absPath }, args.writtenPaths ?? []))
                : [];
        const deferredForTurnEnd = uniqueWrittenPaths([
            ...this.deferredEagerWrittenPaths,
            ...forceForTurnEnd,
            ...triedWakePaths,
        ]);
        if (!eager && deferredForTurnEnd.length > 0) {
            const triedPaths = deferredForTurnEnd;
            const rescued = await this.syncAndPeek({
                ...args,
                writtenPaths: triedPaths,
                eager: true,
                // Nested rescue may include wake-only paths. Never promote those into
                // deferredEagerWrittenPaths — that set gates strong "your write"
                // wording. Abort rescue uses deferredForceWrittenPaths instead.
                rememberEagerDeferral: false,
            });
            if ((rescued.kind === "completed" || rescued.kind === "timed-out") &&
                rescued.events.length > 0 &&
                rescued.reminder !== undefined &&
                rescued.reminder.length > 0) {
                // Keep deferred paths until ack: abort/appendMessages failure releases
                // leased events into pending, and inherited mounts need another written
                // path force to resurface. Nested eager syncAndPeek may clear deferred
                // for deliverable mounts when every forced mount synced clean, but
                // retains `deliverEvents: false` paths for turn-end rescue.
                rescuedEvents = [...rescued.events];
                rescuedGap = rescued.kind === "completed" && rescued.gap === true;
            }
        }
        const finish = (result) => {
            // Wake notes are turn-end open-mount rescue only. Keep them when unused
            // (not-applicable) or when a timeout returned nothing so a later barrier
            // can still open the mount. Otherwise drop them — abort-after-lease for
            // inherited deliveries is tracked in deferredForceWrittenPaths, so wake
            // must not stick across clean empty completions.
            if (!eager) {
                const keepWake = result.kind === "not-applicable" ||
                    (result.kind === "timed-out" && result.events.length === 0);
                if (!keepWake) {
                    for (const absPath of triedWakePaths) {
                        this.deferredWakeWrittenPaths.delete(absPath);
                    }
                }
            }
            return this.mergeDeferredRescueIntoBarrier(result, rescuedEvents, rescuedGap);
        };
        // Turn-end barrier: fold still-deferred eager / force / wake paths into
        // writtenPaths so writtenMountKeys / deliveryMounts include inherited
        // mounts even when the nested eager retry timed out empty and
        // args.writtenPaths is empty (turn-end). Without this, deliverEvents:false
        // mounts stay out of the outer drain. Force fold is scope-filtered above.
        const writtenPaths = !eager
            ? uniqueWrittenPaths([
                ...(args.writtenPaths ?? []),
                ...this.deferredEagerWrittenPaths,
                ...forceForTurnEnd,
                ...triedWakePaths,
            ])
            : (args.writtenPaths ?? []);
        const writtenMountKeys = new Set();
        // Match conflict events against the SAME normalized/resolved path the
        // driver uses to resolve mounts (tilde / workspace-relative expansion).
        // Raw caller writtenPaths would not equal the absolute paths journaled in
        // conflict events, so a `deliverEvents: false` mount's writtenPaths filter
        // would drop the very event it was opened (via that writtenPath) to rescue.
        const normalizedWrittenPaths = [];
        for (const absPath of writtenPaths) {
            const mountKey = this.driver.resolveMountKeyForPath(absPath);
            if (mountKey !== undefined) {
                writtenMountKeys.add(mountKey);
            }
            normalizedWrittenPaths.push(this.driver.resolveWrittenPathAbs?.(absPath) ?? absPath);
        }
        // Eager write outside every mount: do not force unrelated dirty mounts.
        if (eager && writtenPaths.length > 0 && writtenMountKeys.size === 0) {
            return finish({ kind: "not-applicable" });
        }
        // Conversation mounts, plus any writtenPath mounts outside that scope
        // (path-attributed peer / inherited writes) for force-only.
        const conversationMounts = this.driver.listMounts(args.conversationId);
        const conversationMountKeys = new Set(conversationMounts.map((mount) => mount.mountKey));
        const mounts = this.mountsForSyncAndPeek({
            conversationId: args.conversationId,
            eager,
            writtenMountKeys,
            conversationMounts,
        });
        if (mounts.length === 0) {
            return finish({ kind: "not-applicable" });
        }
        // Eager: force written mounts only. Turn-end: dirty or written (including
        // out-of-scope writtenPath mounts added above).
        const forceKeys = eager
            ? [...writtenMountKeys]
            : [
                ...new Set([
                    ...mounts
                        .filter((mount) => writtenMountKeys.has(mount.mountKey) || this.safeIsDirty(mount.mountKey))
                        .map((mount) => mount.mountKey),
                    ...writtenMountKeys,
                ]),
            ];
        // Deliver conversation-scoped mounts; inherited parents
        // (`deliverEvents: false`) only when named by writtenPaths. Unscoped
        // extras: allow the same inherited-parent pattern (deliverEvents: false +
        // writtenPaths) so drivers that omit parents from conversation-scoped
        // listMounts still rescue child-authored writes — never deliver peer
        // mounts (deliverEvents unset/true) from another conversation.
        const deliveryMounts = mounts.filter((mount) => {
            if (mount.deliverEvents === false) {
                return writtenMountKeys.has(mount.mountKey);
            }
            return conversationMountKeys.has(mount.mountKey);
        });
        if (forceKeys.length === 0) {
            const drained = await this.drainMounts(deliveryMounts, {
                lease: true,
                advanceCursor: !eager,
                ...(eager
                    ? { parkWrittenPaths: normalizedWrittenPaths }
                    : { restrictInheritedToWrittenPaths: normalizedWrittenPaths }),
            });
            const events = this.scopeDrainedEvents(drained.events, {
                eager,
                writtenPaths: normalizedWrittenPaths,
            });
            // Check deferred before remembering inherited paths for this delivery.
            const useStrongAttribution = this.shouldUseStrongEagerAttribution(eager, writtenPaths);
            // Inherited abort-rescue records into deferredForceWrittenPaths for any
            // delivery (eager or turn-end). Turn-end may open inherited mounts via
            // wake-folded writtenPaths with eager=false; if we only remembered on
            // eager, finish() would clear wake and leave no force backup after release.
            if (events.length > 0) {
                this.rememberDeferredForInheritedWrittenPaths(mounts, writtenPaths);
            }
            // Deferred paths clear on ack (delivery confirmed), not on lease.
            return finish(this.completedOrRelease(events, drained.gap, useStrongAttribution));
        }
        // Hold the shared claim chain across force + drain so teardown cannot
        // drop this host (and ack/release its leases) between force completing
        // and drain leasing into process-wide leasedIds.
        const chainOwner = this.claimState ?? { chain: this.drainChain };
        let releaseClaimHold;
        const claimHold = new Promise((resolve) => {
            releaseClaimHold = resolve;
        });
        const priorClaimWork = chainOwner.chain;
        const heldChain = priorClaimWork.then(() => claimHold);
        chainOwner.chain = heldChain;
        if (this.claimState === undefined) {
            this.drainChain = heldChain;
        }
        // Eager + one written path per mount → path-scoped force when available.
        const eagerForcePathByMount = new Map();
        if (eager) {
            for (const absPath of writtenPaths) {
                const mountKey = this.driver.resolveMountKeyForPath(absPath);
                if (mountKey === undefined) {
                    continue;
                }
                if (eagerForcePathByMount.has(mountKey)) {
                    eagerForcePathByMount.set(mountKey, undefined);
                }
                else {
                    eagerForcePathByMount.set(mountKey, absPath);
                }
            }
        }
        let timedOut = false;
        let outcomes = [];
        let events = [];
        let gap = false;
        const timeoutMs = args.timeoutMs ?? this.defaultTimeoutMs;
        try {
            const forcePromises = forceKeys.map((mountKey) => this.safeForceSyncMount({
                mountKey,
                absPath: eager ? eagerForcePathByMount.get(mountKey) : undefined,
                timeoutMs,
            }));
            const settleAll = Promise.allSettled(forcePromises);
            if (timeoutMs > 0) {
                const raced = await Promise.race([
                    settleAll.then((results) => ({ done: true, results })),
                    delay(timeoutMs).then(() => ({ done: false })),
                ]);
                if (raced.done) {
                    outcomes = raced.results;
                }
                else {
                    // Soft timeout: bounded grace wait, then drain. Do not cancel sync.
                    timedOut = true;
                    const graced = await this.raceForceGrace(settleAll);
                    if (graced !== undefined) {
                        outcomes = graced;
                    }
                }
            }
            else {
                outcomes = await settleAll;
            }
            // Drain only after prior claim-chain work; we already hold the slot via
            // claimHold so we must not re-enter drainMounts (it would deadlock).
            await priorClaimWork;
            const drained = await this.drainMountsUnlocked(deliveryMounts, {
                lease: true,
                advanceCursor: !eager,
                // Eager: park only path matches so non-matches do not leak via pending.
                // Non-eager: restrict inherited `deliverEvents: false` mounts to the
                // writtenPaths so a child cannot steal the parent journal's notices.
                ...(eager
                    ? { parkWrittenPaths: normalizedWrittenPaths }
                    : { restrictInheritedToWrittenPaths: normalizedWrittenPaths }),
            });
            gap = drained.gap;
            events = this.scopeDrainedEvents(drained.events, {
                eager,
                writtenPaths: normalizedWrittenPaths,
            });
        }
        finally {
            releaseClaimHold();
        }
        // Decide wording against deferred paths already remembered by an earlier
        // eager timeout (possibly while this call waited on the driver). Do
        // this before rememberDeferredForInheritedWrittenPaths so a first-success
        // inherited delivery still gets strong same-write attribution.
        const useStrongAttribution = this.shouldUseStrongEagerAttribution(eager, writtenPaths);
        // Delivery from an inherited (`deliverEvents: false`) mount must keep a
        // deferred retry alive: if the caller aborts and `release`s these events
        // instead of acking, the journal drain and later turn-end barriers never
        // re-read those journals on their own, so turn-end rescue needs the
        // written path to force the mount again. Recorded in
        // deferredForceWrittenPaths (not the eager-strong set). Includes turn-end
        // deliveries that opened the mount via wake-folded writtenPaths — finish()
        // clears wake after success, so force must already be armed. ack clears
        // these; release/abort leaves them for the turn-end barrier.
        if (events.length > 0) {
            this.rememberDeferredForInheritedWrittenPaths(mounts, writtenPaths);
        }
        if (timedOut) {
            if (events.length === 0) {
                if (eager && rememberEagerDeferral && writtenPaths.length > 0) {
                    this.rememberDeferredEagerWrittenPaths(writtenPaths);
                }
                return finish({ kind: "timed-out", events: [] });
            }
            const reminder = this.renderReminder(events, useStrongAttribution);
            const deliverable = this.releaseSuppressedQuotaEvents(events);
            if (deliverable.length === 0) {
                if (eager && rememberEagerDeferral && writtenPaths.length > 0) {
                    this.rememberDeferredEagerWrittenPaths(writtenPaths);
                }
                return finish({ kind: "timed-out", events: [] });
            }
            if (reminder === undefined) {
                // Same ack-on-unrenderable rule as {@link completedOrRelease}.
                this.ack(deliverable.map((event) => event.eventId));
                if (eager && rememberEagerDeferral && writtenPaths.length > 0) {
                    this.rememberDeferredEagerWrittenPaths(writtenPaths);
                }
                return finish({ kind: "timed-out", events: [] });
            }
            // Deferred paths clear on ack (delivery confirmed), not on lease.
            return finish({
                kind: "timed-out",
                events: deliverable,
                reminder,
            });
        }
        // Inherited `deliverEvents: false` mounts are force-only for sync; they
        // are not part of barrier success. Only delivery-scoped forced mounts can
        // mark the barrier mount-passive.
        const deliveryScopedForceKeys = new Set(deliveryMounts.map((mount) => mount.mountKey));
        const hasUncheckedForcedMount = forceKeys.some((mountKey, index) => {
            if (!deliveryScopedForceKeys.has(mountKey)) {
                return false;
            }
            const outcome = outcomes[index];
            return (outcome !== undefined &&
                outcome.status === "fulfilled" &&
                (outcome.value === "passive" ||
                    outcome.value === "absent" ||
                    outcome.value === "error" ||
                    outcome.value === "denied"));
        });
        if (events.length === 0 && hasUncheckedForcedMount) {
            if (eager && rememberEagerDeferral && writtenPaths.length > 0) {
                // Engine could not run a round now; keep retrying at the turn-end barrier.
                this.rememberDeferredEagerWrittenPaths(writtenPaths);
            }
            return finish({ kind: "mount-passive" });
        }
        if (events.length === 0 &&
            eager &&
            writtenPaths.length > 0 &&
            outcomes.length > 0 &&
            outcomes.every((outcome) => outcome.status === "fulfilled" && outcome.value === "synced")) {
            // Every written mount synced clean — drop deferred retries for
            // deliverable mounts (case-folded on win32/darwin so a casing mismatch
            // cannot leave a stale entry that forces the mount on every later
            // turn-end barrier). Retain paths under `deliverEvents: false` mounts: the post-tool drain
            // never reads those journals, and a path-compare / pending-flush miss
            // with zero events must not cancel turn-end rescue.
            const retainMountKeys = new Set(mounts.filter((mount) => mount.deliverEvents === false).map((mount) => mount.mountKey));
            this.clearDeferredEagerWrittenPathsMatchingPaths(writtenPaths.map((absPath) => this.resolveWrittenPathForDeferred(absPath) ?? absPath), { retainMountKeys });
        }
        return finish(this.completedOrRelease(events, gap, useStrongAttribution));
    }
    /**
     * Fold events rescued via deferred eager retry into the turn-end barrier
     * result so a successful rescue does not skip dirty/unread mount delivery.
     */
    mergeDeferredRescueIntoBarrier(result, rescued, rescuedGap) {
        if (rescued.length === 0) {
            return result;
        }
        const fromResult = result.kind === "completed" || result.kind === "timed-out" ? result.events : [];
        const seen = new Set();
        const merged = [];
        for (const event of [...rescued, ...fromResult]) {
            if (seen.has(event.eventId)) {
                continue;
            }
            seen.add(event.eventId);
            merged.push(event);
        }
        const gap = rescuedGap || (result.kind === "completed" && result.gap === true);
        return this.completedOrRelease(merged, gap, false);
    }
    /**
     * Same path shape as {@link syncAndPeek}'s `normalizedWrittenPaths` and
     * journal `original_abs_path`, so deferred retries survive ack/clear and
     * match event filters when the caller passed a relative/`~` writtenPath.
     */
    resolveWrittenPathForDeferred(absPath) {
        const trimmed = absPath.trim();
        if (trimmed.length === 0) {
            return undefined;
        }
        return this.driver.resolveWrittenPathAbs?.(trimmed) ?? trimmed;
    }
    rememberDeferredEagerWrittenPaths(writtenPaths) {
        for (const absPath of writtenPaths) {
            const resolved = this.resolveWrittenPathForDeferred(absPath);
            if (resolved !== undefined) {
                this.deferredEagerWrittenPaths.add(resolved);
            }
        }
    }
    clearDeferredWakeWrittenPathsMatchingPaths(writtenPaths) {
        if (this.deferredWakeWrittenPaths.size === 0 || writtenPaths.length === 0) {
            return;
        }
        for (const absPath of [...this.deferredWakeWrittenPaths]) {
            if (conflictEventMatchesWrittenPaths({ original_abs_path: absPath }, writtenPaths)) {
                this.deferredWakeWrittenPaths.delete(absPath);
            }
        }
    }
    rememberDeferredForceWrittenPaths(writtenPaths) {
        for (const absPath of writtenPaths) {
            const resolved = this.resolveWrittenPathForDeferred(absPath);
            if (resolved !== undefined) {
                this.deferredForceWrittenPaths.add(resolved);
            }
        }
    }
    clearDeferredForceWrittenPathsMatchingPaths(writtenPaths) {
        if (this.deferredForceWrittenPaths.size === 0 || writtenPaths.length === 0) {
            return;
        }
        for (const absPath of [...this.deferredForceWrittenPaths]) {
            if (conflictEventMatchesWrittenPaths({ original_abs_path: absPath }, writtenPaths)) {
                this.deferredForceWrittenPaths.delete(absPath);
            }
        }
    }
    /**
     * Strong "your write to…" wording is only safe when this eager barrier is
     * not retrying a path already deferred by an earlier timeout. Otherwise the
     * conflict may belong to that earlier write (still landing in the driver)
     * and must use neutral journal-drain wording.
     */
    shouldUseStrongEagerAttribution(eager, writtenPaths) {
        if (!eager) {
            return false;
        }
        if (writtenPaths.length === 0 || this.deferredEagerWrittenPaths.size === 0) {
            return true;
        }
        const deferred = [...this.deferredEagerWrittenPaths];
        for (const absPath of writtenPaths) {
            const resolved = this.resolveWrittenPathForDeferred(absPath) ?? absPath;
            if (conflictEventMatchesWrittenPaths({ original_abs_path: resolved }, deferred)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Record force-retries for the subset of `writtenPaths` that resolve to
     * inherited (`deliverEvents: false`) mounts among `mounts`. Eager delivery of
     * such a mount's events is only safe if a later turn-end barrier can re-force it: a
     * caller that aborts releases the leased events back into `pending`, but
     * the post-tool drain and conversation-scoped peeks never read `deliverEvents: false`
     * journals, so without a deferred path the conflict is stuck after cancel.
     * Uses {@link deferredForceWrittenPaths} (not the eager-strong set) so abort
     * rescue cannot flip later decorate-path wording to neutral. ack clears the
     * matching force paths (delivery confirmed).
     */
    rememberDeferredForInheritedWrittenPaths(mounts, writtenPaths) {
        if (writtenPaths.length === 0) {
            return;
        }
        const inheritedMountKeys = new Set(mounts.filter((mount) => mount.deliverEvents === false).map((mount) => mount.mountKey));
        if (inheritedMountKeys.size === 0) {
            return;
        }
        const inheritedWrittenPaths = writtenPaths.filter((absPath) => {
            const mountKey = this.driver.resolveMountKeyForPath(absPath);
            return mountKey !== undefined && inheritedMountKeys.has(mountKey);
        });
        this.rememberDeferredForceWrittenPaths(inheritedWrittenPaths);
    }
    /**
     * Drop deferred paths that match `writtenPaths` under compare normalization.
     * Paths whose mount key is in `retainMountKeys` are kept (inherited
     * `deliverEvents: false` mounts still need turn-end rescue).
     */
    clearDeferredEagerWrittenPathsMatchingPaths(writtenPaths, options) {
        if (this.deferredEagerWrittenPaths.size === 0 || writtenPaths.length === 0) {
            return;
        }
        const retainMountKeys = options?.retainMountKeys;
        for (const absPath of [...this.deferredEagerWrittenPaths]) {
            if (!conflictEventMatchesWrittenPaths({ original_abs_path: absPath }, writtenPaths)) {
                continue;
            }
            if (retainMountKeys !== undefined && retainMountKeys.size > 0) {
                const mountKey = this.driver.resolveMountKeyForPath(absPath);
                if (mountKey !== undefined && retainMountKeys.has(mountKey)) {
                    continue;
                }
            }
            this.deferredEagerWrittenPaths.delete(absPath);
        }
    }
    /**
     * Eager peeks drop non-matching events from the response; release any that
     * were leased during drain so they can resurface on a later claim.
     */
    scopeDrainedEvents(drained, args) {
        if (!args.eager) {
            return [...drained];
        }
        const events = filterToWrittenPaths(drained, args.writtenPaths);
        const kept = new Set(events.map((event) => event.eventId));
        const dropped = drained
            .filter((event) => !kept.has(event.eventId))
            .map((event) => event.eventId);
        this.releaseLeased(dropped);
        return events;
    }
    /**
     * Conversation mounts, plus out-of-scope mounts named by writtenPaths
     * (path-attributed peer / inherited writes for eager and turn-end barriers).
     */
    mountsForSyncAndPeek(args) {
        void args.eager;
        const conversationMounts = args.conversationMounts ?? this.driver.listMounts(args.conversationId);
        if (args.writtenMountKeys.size === 0) {
            return [...conversationMounts];
        }
        const known = new Set(conversationMounts.map((mount) => mount.mountKey));
        const missing = [...args.writtenMountKeys].filter((key) => !known.has(key));
        if (missing.length === 0) {
            return [...conversationMounts];
        }
        // Keep driver deliverEvents flags: inherited parents stay false; peer
        // mounts stay deliverable-by-default and are filtered out of delivery
        // via conversationMountKeys in syncAndPeek.
        const extras = this.driver.listMounts().filter((mount) => missing.includes(mount.mountKey));
        return [...conversationMounts, ...extras];
    }
    /** Race in-flight forces against the grace budget; `undefined` on expiry. */
    async raceForceGrace(settleAll) {
        let graceMs;
        try {
            graceMs = this.resolveForceGraceTimeoutMs?.() ?? DEFAULT_FORCE_GRACE_TIMEOUT_MS;
        }
        catch {
            graceMs = DEFAULT_FORCE_GRACE_TIMEOUT_MS;
        }
        if (!Number.isFinite(graceMs) || graceMs <= 0) {
            return undefined;
        }
        return await Promise.race([settleAll, delay(graceMs).then(() => undefined)]);
    }
    safeIsDirty(mountKey) {
        try {
            return this.driver.isMountDirty(mountKey);
        }
        catch (error) {
            this.warn("conflict notice isMountDirty failed", error);
            // Unknown dirtiness: err toward flushing so a pending conflict is not
            // silently missed at the barrier.
            return true;
        }
    }
    /**
     * Force one mount via the driver, mapping throws to `absent`. Prefers a
     * path-scoped force when `absPath` is set and the driver supports it.
     */
    async safeForceSyncMount(args) {
        const { mountKey, absPath, timeoutMs } = args;
        try {
            if (absPath !== undefined && this.driver.forceSyncMountPath !== undefined) {
                return await this.driver.forceSyncMountPath({
                    mountKey,
                    absPath,
                    timeoutMs,
                });
            }
            return await this.driver.forceSyncMount(mountKey);
        }
        catch (error) {
            this.warn("conflict notice forceSyncMount failed", error);
            return "absent";
        }
    }
    async drainMounts(mounts, options) {
        const chainOwner = this.claimState ?? { chain: this.drainChain };
        const run = chainOwner.chain.then(() => this.drainMountsUnlocked(mounts, options));
        const tracked = run.then(() => undefined, () => undefined);
        chainOwner.chain = tracked;
        if (this.claimState === undefined) {
            this.drainChain = tracked;
        }
        return run;
    }
    async drainMountsUnlocked(mounts, options) {
        // Eager peeks leave the cursor unmoved so non-matches stay readable.
        const advanceCursor = options?.advanceCursor !== false;
        const parkWrittenPaths = options?.parkWrittenPaths;
        const restrictInheritedToWrittenPaths = options?.restrictInheritedToWrittenPaths;
        const lease = options?.lease === true;
        let gap = false;
        for (const mount of mounts) {
            const cursor = this.cursors.get(mount.journalPath);
            let result;
            try {
                result = await agent_store_conflict_notice_host_readConflictEvents({
                    journalPath: mount.journalPath,
                    cursor,
                    sessionStartedAtMs: this.sessionStartedAtMs,
                    applyResolvedFilter: true,
                });
            }
            catch (error) {
                this.warn("conflict journal read failed", error);
                continue;
            }
            const restrictedInherited = mount.deliverEvents === false && restrictInheritedToWrittenPaths !== undefined;
            // WrittenPaths-scoped drains (eager park or inherited restrict) must
            // skip foreign-leased rows instead of stopping the scan so a later
            // matching conflict on the same journal remains readable.
            const continuePastForeignLeases = parkWrittenPaths !== undefined || restrictedInherited;
            // Feed the barrier the full event stream (including suppressed
            // quota_exceeded rows) so the shared foreign-lease barrier stays
            // consistent with the per-exec drain, which reads the same journals under
            // the same shared leasedIds/announced sets. Filtering quota rows out of
            // the barrier INPUT would let it advance past a foreign-leased quota row
            // (or miscompute lastConsumed); gate suppression is applied to the
            // barrier OUTPUT below.
            const barrier = agent_store_conflict_notice_host_conflictEventsCursorAfterForeignLeaseBarrier({
                events: result.events,
                fullNextCursor: result.nextCursor,
                previousCursor: cursor,
                announced: this.announced,
                leasedIds: this.leasedIds,
                isOwnLease: (eventId) => this.leased.has(eventId),
                continuePastForeignLeases,
            });
            let deliverableEvents = barrier.deliverableEvents;
            let nextCursor = barrier.nextCursor;
            let mountGap = result.gap;
            // Do NOT cut the cursor before gated quota rows: that stalls every later
            // conflict until the quota gate opens (Bugbot High). Park the full
            // barrier window (including suppressed quota) and suppress quota only at
            // claim time — same pattern as AgentStoreConflictDrain.
            // Advance the persisted cursor only when this drain advances cursors AND
            // the mount's parking is not writtenPaths-restricted. A `deliverEvents:
            // false` inherited/peer mount restricted to writtenPaths shares its
            // journal cursor with the parent's own delivery and with this
            // conversation's other writtenPaths; advancing past non-matching rows
            // here would permanently lose them (they are neither parked nor
            // re-readable by a later drain). Eager drains already pass
            // advanceCursor:false, so their scoped parking is covered by the same
            // guard. `nextCursor` also stops before foreign-leased rows so a later
            // peek can redeliver after the leasing session releases.
            if (advanceCursor && !restrictedInherited) {
                this.cursors.set(mount.journalPath, nextCursor);
            }
            if (mountGap) {
                gap = true;
            }
            // Park fresh events in `pending` rather than returning them straight
            // away: an advanced cursor is permanent, so peek/ack semantics keep an
            // undelivered event visible until it is acked. Park suppressed
            // `quota_exceeded` rows too so a later gate-open reclaim can deliver
            // them (filtering happens at claim time below).
            for (const event of deliverableEvents) {
                if (this.leased.has(event.event_id) || this.leasedIds.has(event.event_id)) {
                    continue;
                }
                if (parkWrittenPaths !== undefined &&
                    !conflictEventMatchesWrittenPaths(event, parkWrittenPaths)) {
                    continue;
                }
                // Inherited/peer parent (`deliverEvents: false`) opened only via a
                // writtenPath: park only events attributable to this conversation's
                // writtenPaths so it cannot steal the parent's own conflict notices
                // from the shared journal. Conversation-scoped mounts are unaffected.
                if (mount.deliverEvents === false &&
                    restrictInheritedToWrittenPaths !== undefined &&
                    !conflictEventMatchesWrittenPaths(event, restrictInheritedToWrittenPaths)) {
                    continue;
                }
                this.pending.set(event.event_id, {
                    event,
                    journalPath: mount.journalPath,
                });
            }
        }
        // Drop pending entries another channel (the per-exec drain) already acked
        // or leased via the shared claim state.
        for (const eventId of [...this.pending.keys()]) {
            if (this.announced.has(eventId) || this.leasedIds.has(eventId)) {
                this.pending.delete(eventId);
            }
        }
        const mountJournals = new Set(mounts.map((mount) => mount.journalPath));
        // Journals delivered by at least one unrestricted (deliverEvents !== false)
        // mount need no path filter. A journal reachable ONLY through a
        // `deliverEvents: false` (writtenPaths-scoped) mount must re-apply the
        // writtenPaths filter when reclaiming pending, not just when parking fresh
        // rows: an entry released back into the pool must not be re-leased by a
        // later syncAndPeek for a DIFFERENT writtenPath on the same inherited
        // mount, which would break path-scoped delivery and steal the parent's
        // notice.
        const unrestrictedJournals = new Set(mounts.filter((mount) => mount.deliverEvents !== false).map((mount) => mount.journalPath));
        const quotaNoticesEnabled = this.quotaNoticesEnabled();
        const claimed = [];
        for (const [eventId, entry] of [...this.pending]) {
            if (!mountJournals.has(entry.journalPath)) {
                continue;
            }
            // Suppress quota at claim time while the gate is off; leave the row
            // parked so a later gate-open peek can deliver it without re-reading
            // past the advanced journal cursor.
            if (!quotaNoticesEnabled && entry.event.kind === "quota_exceeded") {
                continue;
            }
            // Reclaim pending must re-apply the writtenPaths filter for a journal
            // reachable only through a `deliverEvents: false` (writtenPaths-scoped)
            // mount: an entry released back into the pool must not be re-leased by a
            // later syncAndPeek scoped to a DIFFERENT writtenPath on the same
            // inherited mount (that would break path-scoped delivery and steal the
            // parent's notice). Eager scoping is handled by scopeDrainedEvents.
            if (restrictInheritedToWrittenPaths !== undefined &&
                !unrestrictedJournals.has(entry.journalPath) &&
                !conflictEventMatchesWrittenPaths(entry.event, restrictInheritedToWrittenPaths)) {
                continue;
            }
            // Re-check resolved state: parked/eager events can outlive the conflict
            // file (e.g. truncate clears it) and must not keep strong attribution.
            try {
                if (!(await agent_store_conflict_notice_host_isConflictEventUnresolved(entry.event))) {
                    this.pending.delete(eventId);
                    continue;
                }
            }
            catch (error) {
                this.warn("conflict pending resolve-check failed", error);
            }
            if (lease) {
                this.pending.delete(eventId);
                this.leased.set(eventId, entry);
                this.leasedIds.add(eventId);
            }
            claimed.push(toNoticeEvent(entry.event));
        }
        return { events: claimed, gap };
    }
    releaseLeased(eventIds) {
        for (const eventId of eventIds) {
            const entry = this.leased.get(eventId);
            if (entry === undefined) {
                continue;
            }
            this.leased.delete(eventId);
            this.leasedIds.delete(eventId);
            if (!this.announced.has(eventId)) {
                this.pending.set(eventId, entry);
            }
        }
    }
    completedOrRelease(events, gap, eager = false) {
        if (events.length === 0) {
            return { kind: "completed", events: [], gap };
        }
        const reminder = this.renderReminder(events, eager);
        const deliverable = this.releaseSuppressedQuotaEvents(events);
        if (deliverable.length === 0) {
            return { kind: "completed", events: [], gap };
        }
        if (reminder === undefined) {
            // Unrenderable non-quota batch (typically gap-only). Ack rather than
            // release: the journal cursor already advanced during drain, so releasing
            // would re-lease the same pending gaps on every later barrier. The
            // post-tool drain peeks use the same ack-on-empty-carrier rule.
            this.ack(deliverable.map((event) => event.eventId));
            return { kind: "completed", events: [], gap };
        }
        return {
            kind: "completed",
            events: deliverable,
            gap,
            reminder,
        };
    }
    /**
     * When the live gate is off, release any quota_exceeded rows that were
     * claimed while the gate was on (mid-flight flip) so they are not returned
     * or acked without delivery. Claim normally skips them; this covers the
     * race between claim and renderReminder.
     */
    releaseSuppressedQuotaEvents(events) {
        if (this.quotaNoticesEnabled()) {
            return [...events];
        }
        const quotaIds = events
            .filter((event) => event.kind === "quota_exceeded")
            .map((event) => event.eventId);
        if (quotaIds.length === 0) {
            return [...events];
        }
        this.releaseLeased(quotaIds);
        return events.filter((event) => event.kind !== "quota_exceeded");
    }
    renderReminder(events, eager = false) {
        const conflictEvents = events.map((event) => ({
            v: event.v,
            event_id: event.eventId,
            journal_epoch: event.journalEpoch,
            seq: event.seq,
            ts_ms: event.tsMs,
            kind: event.kind,
            ...(event.storeId !== undefined ? { store_id: event.storeId } : {}),
            ...(event.originalRelPath !== undefined ? { original_rel_path: event.originalRelPath } : {}),
            ...(event.conflictRelPath !== undefined ? { conflict_rel_path: event.conflictRelPath } : {}),
            ...(event.originalAbsPath !== undefined ? { original_abs_path: event.originalAbsPath } : {}),
            ...(event.conflictAbsPath !== undefined ? { conflict_abs_path: event.conflictAbsPath } : {}),
            ...(event.preservedBytes !== undefined ? { preserved_bytes: event.preservedBytes } : {}),
            ...(event.scopeKind !== undefined ? { scope_kind: event.scopeKind } : {}),
            ...(event.limitBytes !== undefined ? { limit_bytes: event.limitBytes } : {}),
            ...(event.usageBytes !== undefined ? { usage_bytes: event.usageBytes } : {}),
            ...(event.source !== undefined ? { source: event.source } : {}),
            ...(event.remoteOnly === true ? { remote_only: true } : {}),
        }));
        // Suppress quota_exceeded text when the gate is off. Parking already stops
        // new quota rows from being delivered, but events leased or pending from an
        // earlier open gate reach renderReminder and would otherwise render quota
        // text after the gate closes; the renderer drops them when the flag is off.
        // completedOrRelease releases those suppressed quota rows instead of
        // returning/acking them without delivery.
        const includeQuotaNotices = this.quotaNoticesEnabled();
        return eager
            ? renderEagerConflictNotice(conflictEvents, {
                maxChars: agent_store_conflict_notice_host_MAX_CONFLICT_NOTICE_CHARS,
                includeQuotaNotices,
            })
            : agent_store_conflict_notice_host_renderConflictNotice(conflictEvents, {
                maxChars: agent_store_conflict_notice_host_MAX_CONFLICT_NOTICE_CHARS,
                includeQuotaNotices,
            });
    }
}
/**
 * Absolutize `p` for equality, folding case on win32 and darwin where the
 * default filesystem is case-insensitive. Without the fold, a written path and
 * the journalled `originalAbsPath` that differ only in segment case would miss
 * and drop the eager notice (journal paths come from readdir on-disk case;
 * tool writes use resolvePath of args).
 */
function normalizeWrittenPathForCompare(p) {
    const resolved = agent_store_conflict_notice_host_path.resolve(p);
    return  false
        ? 0
        : resolved;
}
/** Deduplicate written paths using {@link normalizeWrittenPathForCompare}. */
function uniqueWrittenPaths(paths) {
    const seen = new Set();
    const out = [];
    for (const absPath of paths) {
        const trimmed = absPath.trim();
        if (trimmed.length === 0) {
            continue;
        }
        const key = normalizeWrittenPathForCompare(trimmed);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        out.push(trimmed);
    }
    return out;
}
/**
 * Whether a conflict event should be delivered for a mount opened ONLY because
 * a `writtenPath` resolved into it (an inherited/peer parent store with
 * `deliverEvents: false`). Matching is **exact path equality only** (after
 * normalize) — never directory-prefix — so a child/subagent cannot
 * process-wide-ack unrelated parent conflict notices.
 */
function conflictEventMatchesWrittenPaths(event, writtenPaths) {
    if (writtenPaths.length === 0) {
        return false;
    }
    const candidates = [event.original_abs_path, event.conflict_abs_path].filter((candidate) => candidate !== undefined && candidate.length > 0);
    if (candidates.length === 0) {
        return false;
    }
    const normalizedWritten = writtenPaths
        .map((writtenPath) => writtenPath.trim())
        .filter((writtenPath) => writtenPath.length > 0)
        .map(normalizeWrittenPathForCompare);
    if (normalizedWritten.length === 0) {
        return false;
    }
    return candidates.some((candidate) => normalizedWritten.includes(normalizeWrittenPathForCompare(candidate)));
}
/** Filter events to those whose originalAbsPath matches a written path. */
function filterToWrittenPaths(events, writtenPaths) {
    if (writtenPaths.length === 0) {
        return [];
    }
    const normalized = new Set(writtenPaths.map(normalizeWrittenPathForCompare));
    return events.filter((event) => {
        if (event.originalAbsPath === undefined) {
            return false;
        }
        return normalized.has(normalizeWrittenPathForCompare(event.originalAbsPath));
    });
}

// EXTERNAL MODULE: external "node:stream/promises"
var external_node_stream_promises_ = __webpack_require__("node:stream/promises");
;// ../agent-transcript/dist/context-stripping.js
/**
 * Shared helpers for stripping system context tags from conversation messages
 * and extracting user query content.
 *
 * Used by: image description middleware, AFC categorization, conversation
 * transcript utilities, and agent-transcript processing.
 */
/**
 * Tag names that wrap system-injected context (rules, skills, environment
 * info, etc.) and should be stripped from conversation outlines, summaries,
 * and categorization payloads.
 *
 * Some of these tags carry attributes on the opening element (e.g.
 * `<cloud_instructions description="...">`), so consumers must match
 * `<tagName(?:\s[^>]*)?>` rather than just `<tagName>`.
 */
const CONTEXT_TAGS_TO_STRIP = (/* unused pure expression or super */ null && ([
    "user_info",
    "project_layout",
    "rules",
    "always_applied_workspace_rules",
    "agent_requestable_workspace_rules",
    "user_rules",
    "agent_skills",
    "available_skills",
    "cloud_instructions",
    "cloud_task_instructions",
    "open_and_recently_viewed_files",
    "system_reminder",
    "system-reminder",
    // Grok Bot's pinned-section change note, appended inside the human's
    // <user_query> by the harness (grok-bot-harness/runner/frozen-prompt-section).
    "instructions_update",
    "mcp_instructions",
    "mcp_file_system",
    "mcp_file_system_servers",
    "git_status",
    "agent_transcripts",
    "cursor_rules_context",
    "attached_files",
    // Hard-coded (not shared with @anysphere/constants) so legacy
    // `system_notification` payloads are still stripped if the canonical tag ever changes.
    "system_notification",
    "task_notification",
    "agent_notification",
]));
/**
 * Strips all known system context tags and their content from text.
 * Handles optional attributes on opening tags and multiline content.
 */
function stripContextTags(text) {
    return stripTags(text, CONTEXT_TAGS_TO_STRIP);
}
/**
 * Tags that wrap model-only guidance (e.g. Smart Mode reminders appended to
 * tool errors). Stripped from shared chat transcripts so viewers only see the
 * human-readable content. Narrower than `CONTEXT_TAGS_TO_STRIP` so it does
 * not wipe out `<system_notification>` payloads that the snapshot needs to
 * preserve for later filtering at render time.
 */
const SYSTEM_REMINDER_TAGS_TO_STRIP = (/* unused pure expression or super */ null && ([
    "system_reminder",
    "system-reminder",
]));
/**
 * Strips `<system_reminder>` blocks from text shown on shared chat pages.
 * Smart Mode and other agent internals append these for the model; they
 * should not appear in shared transcripts.
 */
function stripSystemReminderTags(text) {
    return stripTags(text, SYSTEM_REMINDER_TAGS_TO_STRIP);
}
function stripTags(text, tags) {
    let result = text;
    for (const tag of tags) {
        const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, "gi");
        result = result.replace(pattern, "");
    }
    return result.replace(/\n{3,}/g, "\n\n").trim();
}
/**
 * Returns true when the text contains at least one `<user_query>` block.
 */
function hasUserQueryTag(text) {
    return /<user_query>[\s\S]*?<\/user_query>/i.test(text);
}
/**
 * Extracts only `<user_query>` content from text, stripping context tags
 * from within. Falls back to full context-tag stripping when no
 * `<user_query>` blocks are present.
 */
function extractUserQueryContent(text) {
    const matches = Array.from(text.matchAll(/<user_query>([\s\S]*?)<\/user_query>/gi));
    if (matches.length === 0) {
        return stripContextTags(text);
    }
    return matches
        .map((match) => stripContextTags(match[1] ?? ""))
        .filter((query) => query.length > 0)
        .join("\n\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
/**
 * Lazily-constructed grapheme segmenter. `Intl.Segmenter` is available in
 * modern Node/browsers; when it's missing we fall back to a surrogate-only
 * boundary check (still enough to avoid malformed UTF-16).
 */
const graphemeSegmenter = (() => {
    const segmenterCtor = globalThis.Intl
        ?.Segmenter;
    return segmenterCtor ? new segmenterCtor(undefined, { granularity: "grapheme" }) : undefined;
})();
function isHighSurrogate(code) {
    return code >= 0xd800 && code <= 0xdbff;
}
function isLowSurrogate(code) {
    return code >= 0xdc00 && code <= 0xdfff;
}
/**
 * Returns the longest prefix of `text` whose UTF-16 length is `<= maxUnits`
 * that ends on a grapheme-cluster boundary (and therefore never bisects a
 * surrogate pair, so an emoji like a country flag is kept whole or dropped
 * whole — never left as a lone high surrogate).
 *
 * Falls back to a surrogate-safe cut (drop a trailing high surrogate) when
 * `Intl.Segmenter` is unavailable.
 */
function sliceHeadSafe(text, maxUnits) {
    if (maxUnits <= 0) {
        return "";
    }
    if (text.length <= maxUnits) {
        return text;
    }
    if (graphemeSegmenter) {
        let out = "";
        for (const { segment } of graphemeSegmenter.segment(text)) {
            if (out.length + segment.length > maxUnits) {
                break;
            }
            out += segment;
        }
        return out;
    }
    const end = isHighSurrogate(text.charCodeAt(maxUnits - 1)) ? maxUnits - 1 : maxUnits;
    return text.slice(0, end);
}
/**
 * Returns the longest suffix of `text` whose UTF-16 length is `<= maxUnits`
 * that starts on a grapheme-cluster boundary (and therefore never starts on a
 * lone low surrogate).
 *
 * Falls back to a surrogate-safe cut (drop a leading low surrogate) when
 * `Intl.Segmenter` is unavailable.
 */
function sliceTailSafe(text, maxUnits) {
    if (maxUnits <= 0) {
        return "";
    }
    if (text.length <= maxUnits) {
        return text;
    }
    if (graphemeSegmenter) {
        const segments = Array.from(graphemeSegmenter.segment(text));
        let out = "";
        for (let i = segments.length - 1; i >= 0; i--) {
            const seg = segments[i].segment;
            if (out.length + seg.length > maxUnits) {
                break;
            }
            out = seg + out;
        }
        return out;
    }
    const start = isLowSurrogate(text.charCodeAt(text.length - maxUnits))
        ? text.length - maxUnits + 1
        : text.length - maxUnits;
    return text.slice(start);
}
/**
 * Truncates text in the middle, preserving the start and end.
 *
 * Cuts on grapheme-cluster boundaries (via {@link sliceHeadSafe} /
 * {@link sliceTailSafe}) rather than raw UTF-16 code units, so truncating
 * through a multi-code-unit character (e.g. a flag emoji, which is two
 * regional-indicator surrogate pairs) can never leave a lone surrogate. A
 * lone surrogate is malformed UTF-16 and crashes downstream tokenizers.
 */
function truncateMiddle(text, maxChars) {
    if (text.length <= maxChars) {
        return text;
    }
    const separator = "...";
    const charsPerSide = Math.max(1, Math.floor((maxChars - separator.length) / 2));
    return `${sliceHeadSafe(text, charsPerSide)}${separator}${sliceTailSafe(text, charsPerSide)}`;
}

;// ../agent-transcript/dist/paths.js

/**
 * Compute the relative path (from the project directory) for a transcript file.
 *
 * Layout:
 * - primary:   `agent-transcripts/<safeId>/<safeId>.<ext>`
 * - subagent (with parent):  `agent-transcripts/<safeParentId>/subagents/<safeChildId>.<ext>`
 * - subagent (no parent — fallback): treated as primary (`agent-transcripts/<safeId>/<safeId>.<ext>`)
 *
 * @returns A POSIX-style relative path such as `agent-transcripts/abc/abc.jsonl`.
 */
function getTranscriptRelativePath(args) {
    const safeId = (0,workspace_paths/* getSafeConversationId */.sh)(args.conversationId);
    if (args.kind === "subagent" && args.parentConversationId) {
        const safeParentId = (0,workspace_paths/* getSafeConversationId */.sh)(args.parentConversationId);
        return `${workspace_paths/* TRANSCRIPTS_SUBDIR */.O2}/${safeParentId}/subagents/${safeId}.${args.ext}`;
    }
    // Primary layout (also used as fallback when subagent has no parent).
    return `${workspace_paths/* TRANSCRIPTS_SUBDIR */.O2}/${safeId}/${safeId}.${args.ext}`;
}
/**
 * Compute the legacy flat relative path for a transcript file.
 *
 * Legacy layout: `agent-transcripts/<safeId>.<ext>`
 *
 * Use this when building candidate lists for backward-compatible reading.
 */
function getLegacyTranscriptRelativePath(args) {
    const safeId = (0,workspace_paths/* getSafeConversationId */.sh)(args.conversationId);
    return `${workspace_paths/* TRANSCRIPTS_SUBDIR */.O2}/${safeId}.${args.ext}`;
}
/**
 * Compute an ordered list of candidate transcript relative paths to probe for a
 * given conversation/subagent.
 *
 * This is intended for callers that need to *read* transcripts from disk while
 * remaining backwards-compatible with the legacy flat layout.
 *
 * Order:
 * - primary: nested first, then legacy flat
 * - subagent (with parent): parent/subagents first, then primary nested, then legacy flat
 */
function getTranscriptProbeRelativePaths(args) {
    const exts = args.exts ?? ["jsonl", "txt"];
    const includeLegacy = args.includeLegacy ?? true;
    const out = [];
    const pushUnique = (p) => {
        if (!out.includes(p))
            out.push(p);
    };
    // Probe in extension-priority order. For each extension:
    // - try the requested layout (primary or parent/subagents)
    // - if subagent-with-parent, also try primary nested (old writers)
    // - optionally try legacy flat
    for (const ext of exts) {
        pushUnique(getTranscriptRelativePath({
            conversationId: args.conversationId,
            ext,
            kind: args.kind,
            parentConversationId: args.parentConversationId,
        }));
        if (args.kind === "subagent" && args.parentConversationId) {
            pushUnique(getTranscriptRelativePath({
                conversationId: args.conversationId,
                ext,
                kind: "primary",
            }));
        }
        if (includeLegacy) {
            pushUnique(getLegacyTranscriptRelativePath({
                conversationId: args.conversationId,
                ext,
            }));
        }
    }
    return out;
}

;// ../agent-transcript/dist/trace-format.js
/* unused harmony import specifier */ var ConversationMessage_MessageType;

var HistoryVisibilityMode;
(function (HistoryVisibilityMode) {
    /** Include all messages (system prompt, first user context message, all conversation). */
    HistoryVisibilityMode["INTERNAL"] = "INTERNAL";
    /** Skip system prompt and first user context message. */
    HistoryVisibilityMode["EXTERNAL"] = "EXTERNAL";
    /**
     * Source already excludes the legacy two-message preamble (system prompt +
     * first user-context message).
     */
    HistoryVisibilityMode["NO_PREAMBLE"] = "NO_PREAMBLE";
})(HistoryVisibilityMode || (HistoryVisibilityMode = {}));
function tryParseJson(str) {
    if (!str)
        return undefined;
    try {
        return JSON.parse(str);
    }
    catch {
        return str;
    }
}
function applyToolCallTimestamps(target, toolResult) {
    const startedAtMs = toolResult.startedAtMs !== undefined ? Number(toolResult.startedAtMs) : undefined;
    const completedAtMs = toolResult.completedAtMs !== undefined ? Number(toolResult.completedAtMs) : undefined;
    if (startedAtMs !== undefined) {
        target.started_at_ms = startedAtMs;
    }
    if (completedAtMs !== undefined) {
        target.completed_at_ms = completedAtMs;
    }
    if (startedAtMs !== undefined && completedAtMs !== undefined) {
        target.duration_ms = completedAtMs - startedAtMs;
    }
}
function extractToolResultContent(toolResult) {
    if (toolResult.content) {
        return tryParseJson(toolResult.content);
    }
    if (toolResult.result?.result) {
        const result = toolResult.result.result;
        if (result.case && result.value !== undefined) {
            return { resultType: result.case, value: result.value };
        }
    }
    return undefined;
}
/**
 * Converts ConversationMessage array to TraceMessage array.
 * For EXTERNAL mode, skips first 2 messages (system context + injected user context).
 */
function convertConversationMessagesToTrace(messages, visibilityMode) {
    const result = [];
    const startIndex = visibilityMode === HistoryVisibilityMode.EXTERNAL ? 2 : 0;
    for (let i = startIndex; i < messages.length; i++) {
        const message = messages[i];
        let role;
        if (i === 0 &&
            visibilityMode === HistoryVisibilityMode.INTERNAL &&
            message.type === ConversationMessage_MessageType.HUMAN) {
            role = "system";
        }
        else {
            switch (message.type) {
                case ConversationMessage_MessageType.HUMAN:
                    role = "user";
                    break;
                case ConversationMessage_MessageType.AI:
                    role = "assistant";
                    break;
                default:
                    role = "unknown";
            }
        }
        const traceMessage = { role };
        if (message.text && message.text.trim().length > 0) {
            traceMessage.text = message.text;
        }
        if (message.thinking?.text && message.thinking.text.trim().length > 0) {
            traceMessage.thinking = message.thinking.text;
        }
        if (message.type === ConversationMessage_MessageType.AI && message.toolResults.length > 0) {
            const toolCalls = [];
            for (const toolResult of message.toolResults) {
                const toolCall = {};
                if (toolResult.toolCallId) {
                    toolCall.tool_call_id = toolResult.toolCallId;
                }
                if (toolResult.toolName) {
                    toolCall.tool_name = toolResult.toolName;
                }
                const argsStr = toolResult.rawArgs || toolResult.args;
                if (argsStr) {
                    toolCall.tool_args = tryParseJson(argsStr);
                }
                applyToolCallTimestamps(toolCall, toolResult);
                toolCalls.push(toolCall);
            }
            if (toolCalls.length > 0) {
                traceMessage.tool_calls = toolCalls;
            }
        }
        result.push(traceMessage);
        // Create separate tool role messages for tool results
        if (message.type === ConversationMessage_MessageType.AI && message.toolResults.length > 0) {
            for (const toolResult of message.toolResults) {
                const toolMessage = { role: "tool" };
                if (toolResult.toolCallId) {
                    toolMessage.tool_call_id = toolResult.toolCallId;
                }
                if (toolResult.toolName) {
                    toolMessage.tool_name = toolResult.toolName;
                }
                const argsStr = toolResult.rawArgs || toolResult.args;
                if (argsStr) {
                    toolMessage.tool_args = tryParseJson(argsStr);
                }
                const resultContent = extractToolResultContent(toolResult);
                if (resultContent !== undefined) {
                    toolMessage.tool_result = resultContent;
                }
                applyToolCallTimestamps(toolMessage, toolResult);
                result.push(toolMessage);
            }
        }
    }
    return result;
}

;// ../agent-transcript/dist/transcript-loader.js
/* unused harmony import specifier */ var hydrateMessages;
/* unused harmony import specifier */ var formatTranscript;
/* unused harmony import specifier */ var formatTranscriptJson;
/* unused harmony import specifier */ var agentModeToString;

/**
 * TranscriptLoader provides a unified interface for loading conversation transcripts
 * from checkpoints and sending them over the wire.
 */
class TranscriptLoader {
    constructor(blobStore, stateReader) {
        this.blobStore = blobStore;
        this.stateReader = stateReader;
    }
    /**
     * List all recent conversations with their metadata
     * @param limit - Maximum number of conversations to return (default: 100)
     * @returns Array of conversation metadata, sorted by lastUpdatedAt (most recent first)
     */
    async listRecentConversations(ctx, limit = 100) {
        const all = await this.stateReader.listConversations(ctx);
        return all.slice(0, limit);
    }
    /**
     * Get the transcript for a specific conversation
     * @param conversationId - The conversation ID
     * @returns The conversation transcript, or undefined if not found
     */
    async getTranscript(ctx, conversationId) {
        const checkpoint = await this.stateReader.getLatestCheckpoint(ctx, conversationId);
        if (!checkpoint) {
            return undefined;
        }
        const messages = await hydrateMessages(ctx, this.blobStore, checkpoint);
        const transcript = formatTranscript(messages);
        const transcriptJson = formatTranscriptJson(messages);
        // Get metadata for lastUpdatedAt
        const metadata = await this.stateReader.listConversations(ctx);
        const conversationMeta = metadata.find((m) => m.conversationId === conversationId);
        return {
            conversationId,
            transcript,
            transcriptJson,
            messages,
            lastUpdatedAt: conversationMeta?.lastUpdatedAt ?? Date.now(),
            mode: agentModeToString(checkpoint.mode),
        };
    }
    /**
     * Get transcripts for multiple conversations
     * @param conversationIds - Array of conversation IDs
     * @returns Map of conversation ID to transcript (only includes successfully loaded transcripts)
     */
    async getTranscripts(ctx, conversationIds) {
        const results = new Map();
        await Promise.all(conversationIds.map(async (id) => {
            const transcript = await this.getTranscript(ctx, id);
            if (transcript) {
                results.set(id, transcript);
            }
        }));
        return results;
    }
    /**
     * Serialize a transcript for sending over the wire
     * @param transcript - The conversation transcript
     * @returns JSON-serializable object ready for network transmission
     */
    serializeForWire(transcript) {
        return {
            conversationId: transcript.conversationId,
            transcript: transcript.transcript,
            transcriptJson: transcript.transcriptJson,
            messageCount: transcript.messages.length,
            lastUpdatedAt: transcript.lastUpdatedAt,
            mode: transcript.mode,
        };
    }
    /**
     * Batch serialize multiple transcripts for sending over the wire
     * @param transcripts - Map of conversation transcripts
     * @returns Array of serialized transcripts
     */
    batchSerializeForWire(transcripts) {
        return Array.from(transcripts.values()).map((t) => this.serializeForWire(t));
    }
}

;// ../agent-transcript/dist/index.js
/* unused harmony import specifier */ var createSpan;
/* unused harmony import specifier */ var withSuppressedChildSpans;
/* unused harmony import specifier */ var AgentMode;
/* unused harmony import specifier */ var ConversationSummaryArchive;
/* unused harmony import specifier */ var TRANSCRIPTS_SUBDIR_FROM_UTILS;
/* unused harmony import specifier */ var getSafeConversationIdFromUtils;
/* unused harmony import specifier */ var dist_stripContextTags;
/* unused harmony import specifier */ var dist_getTranscriptRelativePath;
var __addDisposableResource = (undefined && undefined.__addDisposableResource) || function (env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose, inner;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
            if (async) inner = dispose;
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        if (inner) dispose = function() { try { inner.call(this); } catch (e) { return Promise.reject(e); } };
        env.stack.push({ value: value, dispose: dispose, async: async });
    }
    else if (async) {
        env.stack.push({ async: true });
    }
    return value;
};
var __disposeResources = (undefined && undefined.__disposeResources) || (function (SuppressedError) {
    return function (env) {
        function fail(e) {
            env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
            env.hasError = true;
        }
        var r, s = 0;
        function next() {
            while (r = env.stack.pop()) {
                try {
                    if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
                    if (r.dispose) {
                        var result = r.dispose.call(r.value);
                        if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
                    }
                    else s |= 1;
                }
                catch (e) {
                    fail(e);
                }
            }
            if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
            if (env.hasError) throw env.error;
        }
        return next();
    };
})(typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});





// Re-export from @anysphere/utils for backward compatibility
const TRANSCRIPTS_SUBDIR = (/* unused pure expression or super */ null && (TRANSCRIPTS_SUBDIR_FROM_UTILS));
const getSafeConversationId = (/* unused pure expression or super */ null && (getSafeConversationIdFromUtils));
// Re-export path utilities


/**
 * Maps AgentMode enum to a human-readable mode string.
 */
function dist_agentModeToString(mode) {
    switch (mode) {
        case AgentMode.AGENT:
            return "agent";
        case AgentMode.ASK:
            return "ask";
        case AgentMode.PLAN:
            return "plan";
        case AgentMode.DEBUG:
            return "debug";
        case AgentMode.TRIAGE:
            return "triage";
        case AgentMode.MULTITASK:
            return "multitask";
        case AgentMode.CUSTOM:
            return "custom";
        case AgentMode.UNSPECIFIED:
        case undefined:
            return "agent";
        default: {
            const _exhaustive = mode;
            return "agent";
        }
    }
}
function toHex(bytes) {
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
function jsonReplacer(_key, value) {
    if (value instanceof Uint8Array) {
        return {
            __type: "Uint8Array",
            hex: toHex(value),
        };
    }
    if (typeof value === "bigint") {
        return value.toString();
    }
    return value;
}
function createTranscriptBinaryPlaceholder(byteLength) {
    return `[Binary data omitted from transcript: ${byteLength} bytes]`;
}
function jsonReviver(_key, value) {
    if (value &&
        typeof value === "object" &&
        value.__type === "Uint8Array" &&
        typeof value.hex === "string") {
        const v = value;
        return createTranscriptBinaryPlaceholder(v.hex.length / 2);
    }
    return value;
}
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const SERIALIZED_UINT8_ARRAY_MARKER = '"__type":"Uint8Array"';
const OVERSIZE_TRANSCRIPT_BLOB_THRESHOLD_BYTES = 5_000_000;
function formatBlobSizeMegabytes(bytes) {
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
}
function createOversizeBlobOmittedMessage(blobSizeBytes) {
    return {
        role: "assistant",
        content: `[Oversize transcript blob omitted: ${formatBlobSizeMegabytes(blobSizeBytes)}]`,
    };
}
function createEmptyHydratedBlobIdsResult() {
    return {
        messages: [],
        hydratedBlobCount: 0,
        hydratedBlobBytes: 0,
        largestHydratedBlobBytes: 0,
        totalDeserializeDurationMs: 0,
        omittedOversizeBlobCount: 0,
        omittedOversizeBlobBytes: 0,
        largestOmittedOversizeBlobBytes: 0,
    };
}
class CoreMessageSerde {
    serialize(value) {
        const json = JSON.stringify(value, jsonReplacer);
        return textEncoder.encode(json);
    }
    deserialize(blob) {
        const json = textDecoder.decode(blob);
        // Most transcript blobs are plain JSON without encoded binary payloads.
        // Skip the reviver's full object walk unless the serialized marker is present.
        if (json.includes(SERIALIZED_UINT8_ARRAY_MARKER)) {
            // Transcript consumers only need readable placeholders for binary fields.
            return JSON.parse(json, jsonReviver);
        }
        return JSON.parse(json);
    }
}
const coreMessageSerde = new CoreMessageSerde();
function isSummaryMessage(message) {
    const providerOptions = message.providerOptions;
    return providerOptions?.cursor?.isSummary === true;
}
async function hydrateBlobIds(ctx, blobStore, blobIds) {
    const messages = [];
    let hydratedBlobCount = 0;
    let hydratedBlobBytes = 0;
    let largestHydratedBlobBytes = 0;
    let totalDeserializeDurationMs = 0;
    let omittedOversizeBlobCount = 0;
    let omittedOversizeBlobBytes = 0;
    let largestOmittedOversizeBlobBytes = 0;
    for (const blobId of blobIds) {
        const blob = await blobStore.getBlob(ctx, blobId);
        if (blob) {
            if (blob.length > OVERSIZE_TRANSCRIPT_BLOB_THRESHOLD_BYTES) {
                messages.push(createOversizeBlobOmittedMessage(blob.length));
                omittedOversizeBlobCount++;
                omittedOversizeBlobBytes += blob.length;
                largestOmittedOversizeBlobBytes = Math.max(largestOmittedOversizeBlobBytes, blob.length);
                continue;
            }
            try {
                const deserializeStart = performance.now();
                const message = coreMessageSerde.deserialize(blob);
                const deserializeDurationMs = performance.now() - deserializeStart;
                messages.push(message);
                hydratedBlobCount++;
                hydratedBlobBytes += blob.length;
                largestHydratedBlobBytes = Math.max(largestHydratedBlobBytes, blob.length);
                totalDeserializeDurationMs += deserializeDurationMs;
            }
            catch {
                // Skip messages that fail to deserialize
            }
        }
    }
    return {
        messages,
        hydratedBlobCount,
        hydratedBlobBytes,
        largestHydratedBlobBytes,
        totalDeserializeDurationMs,
        omittedOversizeBlobCount,
        omittedOversizeBlobBytes,
        largestOmittedOversizeBlobBytes,
    };
}
/**
 * Hydrates the full conversation history from a ConversationStateStructure.
 *
 * Reconstructs the complete conversation by:
 * 1. Hydrating archived messages from summary_archive.summarized_messages
 * 2. Hydrating current prompt tail from root_prompt_messages_json
 * 3. Filtering out system messages and summary messages from the tail
 * 4. Concatenating archived + filtered tail
 */
async function dist_hydrateMessages(ctx, blobStore, state) {
    const env_1 = { stack: [], error: void 0, hasError: false };
    try {
        const span = __addDisposableResource(env_1, createSpan(ctx.withName("hydrateSummaryArchives")), false);
        let getBlobCount = 0;
        const quietCtx = withSuppressedChildSpans(span.ctx);
        const allMessages = [];
        let hydratedArchivedBlobCount = 0;
        let hydratedArchivedBlobBytes = 0;
        let largestHydratedArchivedBlobBytes = 0;
        let totalArchivedDeserializeDurationMs = 0;
        let omittedArchivedBlobCount = 0;
        let omittedArchivedBlobBytes = 0;
        let largestOmittedArchivedBlobBytes = 0;
        // 1. Hydrate archived messages from summary_archive (if present)
        const summaryArchives = await Promise.all(state.summaryArchives.map(async (summaryArchiveRef) => {
            getBlobCount++;
            const archiveBlob = await blobStore.getBlob(quietCtx, summaryArchiveRef);
            if (archiveBlob) {
                try {
                    const archive = ConversationSummaryArchive.fromBinary(archiveBlob);
                    getBlobCount += archive.summarizedMessages.length;
                    const archivedMessages = await hydrateBlobIds(quietCtx, blobStore, archive.summarizedMessages);
                    return archivedMessages;
                }
                catch {
                    // Continue without archived messages if deserialization fails
                }
            }
            return createEmptyHydratedBlobIdsResult();
        }));
        // Insert in order.
        for (const archivedMessages of summaryArchives) {
            allMessages.push(...archivedMessages.messages);
            hydratedArchivedBlobCount += archivedMessages.hydratedBlobCount;
            hydratedArchivedBlobBytes += archivedMessages.hydratedBlobBytes;
            largestHydratedArchivedBlobBytes = Math.max(largestHydratedArchivedBlobBytes, archivedMessages.largestHydratedBlobBytes);
            totalArchivedDeserializeDurationMs += archivedMessages.totalDeserializeDurationMs;
            omittedArchivedBlobCount += archivedMessages.omittedOversizeBlobCount;
            omittedArchivedBlobBytes += archivedMessages.omittedOversizeBlobBytes;
            largestOmittedArchivedBlobBytes = Math.max(largestOmittedArchivedBlobBytes, archivedMessages.largestOmittedOversizeBlobBytes);
        }
        span.span.setAttribute("getBlobCount", getBlobCount);
        span.span.setAttribute("hydratedBlobCount", hydratedArchivedBlobCount);
        span.span.setAttribute("hydratedBlobBytes", hydratedArchivedBlobBytes);
        span.span.setAttribute("largestHydratedBlobBytes", largestHydratedArchivedBlobBytes);
        span.span.setAttribute("totalDeserializeDurationMs", totalArchivedDeserializeDurationMs);
        span.span.setAttribute("omittedOversizeBlobCount", omittedArchivedBlobCount);
        span.span.setAttribute("omittedOversizeBlobBytes", omittedArchivedBlobBytes);
        span.span.setAttribute("largestOmittedOversizeBlobBytes", largestOmittedArchivedBlobBytes);
        // 2. Hydrate current prompt messages
        const span2 = __addDisposableResource(env_1, createSpan(ctx.withName("hydratePromptMessages")), false);
        const promptMessages = await hydrateBlobIds(quietCtx, blobStore, state.rootPromptMessagesJson);
        span2.span.setAttribute("getBlobCount", state.rootPromptMessagesJson.length);
        span2.span.setAttribute("hydratedBlobCount", promptMessages.hydratedBlobCount);
        span2.span.setAttribute("hydratedBlobBytes", promptMessages.hydratedBlobBytes);
        span2.span.setAttribute("largestHydratedBlobBytes", promptMessages.largestHydratedBlobBytes);
        span2.span.setAttribute("totalDeserializeDurationMs", promptMessages.totalDeserializeDurationMs);
        span2.span.setAttribute("omittedOversizeBlobCount", promptMessages.omittedOversizeBlobCount);
        span2.span.setAttribute("omittedOversizeBlobBytes", promptMessages.omittedOversizeBlobBytes);
        span2.span.setAttribute("largestOmittedOversizeBlobBytes", promptMessages.largestOmittedOversizeBlobBytes);
        // 3. Filter out system messages and summary messages from prompt
        // These are either system prompts or condensed summaries, not original conversation
        const tailMessages = promptMessages.messages.filter((msg) => msg.role !== "system" && !isSummaryMessage(msg));
        // 4. Concatenate archived + filtered tail
        allMessages.push(...tailMessages);
        return allMessages;
    }
    catch (e_1) {
        env_1.error = e_1;
        env_1.hasError = true;
    }
    finally {
        __disposeResources(env_1);
    }
}
/**
 * Formats tool call arguments in a readable key-value format.
 * For simple objects, shows one key per line with indentation.
 * Falls back to pretty-printed JSON for complex nested structures.
 */
function formatToolArgs(args) {
    if (args === null || args === undefined) {
        return "";
    }
    if (typeof args !== "object") {
        return String(args);
    }
    const obj = args;
    const entries = Object.entries(obj);
    if (entries.length === 0) {
        return "";
    }
    // Format each key-value pair on its own line with indentation
    const lines = entries.map(([key, value]) => {
        let valueStr;
        if (typeof value === "string") {
            // For strings, show them directly (don't add extra quotes)
            valueStr = value;
        }
        else if (typeof value === "object" && value !== null) {
            // For nested objects/arrays, use compact JSON
            valueStr = JSON.stringify(value);
        }
        else {
            valueStr = String(value);
        }
        return `  ${key}: ${valueStr}`;
    });
    return `\n${lines.join("\n")}`;
}
/**
 * Formats a single content part to plain text
 * @param stripTags - Whether to strip XML tags from text content
 */
function formatContentPart(part, stripTags) {
    switch (part.type) {
        case "text":
            return stripTags ? stripXmlTags(part.text) : part.text;
        case "image":
            return "[Image]";
        case "file":
            return part.filename ? `[File: ${part.filename}]` : "[File]";
        case "reasoning":
            return `[Thinking] ${part.text}`;
        case "redacted-reasoning":
            return "[Thinking]";
        case "tool-call":
            return `[Tool call] ${part.toolName}${formatToolArgs(part.args)}`;
        case "tool-result":
            return `[Tool result] ${part.toolName}`;
        default:
            return "";
    }
}
/**
 * Strips all known system context tags and their content from text.
 * Delegates to the shared context-stripping module.
 */
function stripXmlTags(text) {
    return dist_stripContextTags(text);
}
/**
 * Strips hidden thinking tags from model output.
 * These tags are not meant to be user-visible, so they should not be recorded in transcripts.
 */
function stripHiddenThinkingTags(text) {
    // Non-greedy to avoid spanning multiple blocks.
    return text
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
/**
 * Formats message content (string or array of parts) to plain text
 * @param stripTags - Whether to strip XML tags (user_info, rules, open_and_recently_viewed_files) from content
 */
function formatContent(content, stripTags, stripThinkTags) {
    if (content === undefined) {
        return "";
    }
    if (typeof content === "string") {
        const maybeStripped = stripTags ? stripXmlTags(content) : content;
        return stripThinkTags ? stripHiddenThinkingTags(maybeStripped) : maybeStripped;
    }
    return content
        .map((part) => {
        // For structured parts, only text parts can contain <think> tags.
        if (stripThinkTags && part.type === "text") {
            const updatedText = stripHiddenThinkingTags(stripTags ? stripXmlTags(part.text) : part.text);
            return formatContentPart({ ...part, text: updatedText }, false);
        }
        return formatContentPart(part, stripTags);
    })
        .filter(Boolean)
        .join("\n");
}
/**
 * Formats a TranscriptMessage array to a plain-text transcript.
 *
 * - Filters out system messages
 * - Drops leading user info message if first two messages are both from user
 * - Formats each message with role on its own line followed by content
 * - Renders content parts as readable text
 */
function dist_formatTranscript(messages) {
    // Filter out system messages
    let filteredMessages = messages.filter((msg) => msg.role !== "system");
    // If the first two messages are user messages, drop the first one (user info)
    if (filteredMessages.length >= 2 &&
        filteredMessages[0].role === "user" &&
        filteredMessages[1].role === "user") {
        filteredMessages = filteredMessages.slice(1);
    }
    const lines = [];
    for (const message of filteredMessages) {
        // Strip XML tags (user_info, rules) only from user messages
        const stripTags = message.role === "user";
        const stripThinkTags = message.role === "assistant";
        const content = formatContent(message.content, stripTags, stripThinkTags);
        if (content.trim()) {
            // Skip role prefix for tool messages since [Tool result] is self-explanatory
            if (message.role === "tool") {
                lines.push(content);
            }
            else {
                // Role on its own line, then content below
                lines.push(`${message.role}:\n${content}`);
            }
        }
    }
    return lines.join("\n\n");
}
/**
 * Converts a single TranscriptMessage to a JSON-serializable object.
 *
 * Extracts:
 * - role: the message role (user/assistant/tool)
 * - content: text content from string or text/reasoning parts
 * - toolCalls: array of tool calls with toolName and args
 * - toolResult: for tool messages, the tool name (result is not stored)
 *
 * @param stripTags - Whether to strip XML tags (user_info, rules, open_and_recently_viewed_files) from text content
 */
function formatMessageToJson(message, stripTags) {
    const json = {
        role: message.role,
    };
    const content = message.content;
    if (typeof content === "string") {
        const processedText = stripTags ? stripXmlTags(content) : content;
        const maybeStrippedThinking = message.role === "assistant" ? stripHiddenThinkingTags(processedText) : processedText;
        if (maybeStrippedThinking.trim()) {
            json.text = maybeStrippedThinking;
        }
    }
    else if (Array.isArray(content)) {
        // Extract text content from text and reasoning parts
        const textParts = [];
        const thinkingParts = [];
        const toolCalls = [];
        let toolResult;
        for (const part of content) {
            switch (part.type) {
                case "text": {
                    const processedText = stripTags ? stripXmlTags(part.text) : part.text;
                    const maybeStrippedThinking = message.role === "assistant" ? stripHiddenThinkingTags(processedText) : processedText;
                    if (maybeStrippedThinking.trim()) {
                        textParts.push(maybeStrippedThinking);
                    }
                    break;
                }
                case "reasoning":
                    if (part.text.trim()) {
                        thinkingParts.push(part.text);
                    }
                    break;
                case "redacted-reasoning":
                    thinkingParts.push("[REDACTED]");
                    break;
                case "image":
                    textParts.push("[Image]");
                    break;
                case "file":
                    textParts.push(part.filename ? `[File: ${part.filename}]` : "[File]");
                    break;
                case "tool-call":
                    toolCalls.push({
                        toolName: part.toolName,
                        args: part.args,
                    });
                    break;
                case "tool-result":
                    // Only store tool name, ignore the result
                    toolResult = {
                        toolName: part.toolName,
                    };
                    break;
            }
        }
        if (textParts.length > 0) {
            json.text = textParts.join("\n");
        }
        if (thinkingParts.length > 0) {
            json.thinking = thinkingParts.join("\n");
        }
        if (toolCalls.length > 0) {
            json.toolCalls = toolCalls;
        }
        if (toolResult) {
            json.toolResult = toolResult;
        }
    }
    return json;
}
/**
 * Formats a TranscriptMessage array to a pretty-printed JSON array.
 *
 * Each property is on its own line, making it easy to grep for specific
 * values like tool names, file paths, or argument values.
 *
 * - Filters out system messages
 * - Drops leading user info message if first two messages are both from user
 * - Pretty-printed with 2-space indentation
 *
 * Example output:
 * ```json
 * [
 *   {
 *     "role": "user",
 *     "content": "How do I fix this bug?"
 *   },
 *   {
 *     "role": "assistant",
 *     "content": "Let me check...",
 *     "toolCalls": [
 *       {
 *         "toolName": "read_file",
 *         "args": {
 *           "target_file": "src/main.ts"
 *         }
 *       }
 *     ]
 *   }
 * ]
 * ```
 */
function dist_formatTranscriptJson(messages) {
    // Filter out system messages
    let filteredMessages = messages.filter((msg) => msg.role !== "system");
    // If the first two messages are user messages, drop the first one (user info)
    if (filteredMessages.length >= 2 &&
        filteredMessages[0].role === "user" &&
        filteredMessages[1].role === "user") {
        filteredMessages = filteredMessages.slice(1);
    }
    const jsonMessages = [];
    for (const message of filteredMessages) {
        // Strip XML tags (user_info, rules) only from user messages
        const stripTags = message.role === "user";
        const jsonMessage = formatMessageToJson(message, stripTags);
        // Only include messages that have some content
        if (jsonMessage.text ||
            jsonMessage.thinking ||
            jsonMessage.toolCalls ||
            jsonMessage.toolResult) {
            jsonMessages.push(jsonMessage);
        }
    }
    // Keep behavior consistent with text formatting: return empty string when there
    // is nothing meaningful to write so callers can skip writing empty files.
    if (jsonMessages.length === 0) {
        return "";
    }
    return JSON.stringify(jsonMessages, null, 2);
}
function prependOverviewMetadataLine(jsonlContent, overview) {
    const metadataLine = {
        type: "metadata",
        metadata: {
            overview,
        },
    };
    return `${JSON.stringify(metadataLine)}\n${jsonlContent}`;
}
function ensureTrailingNewline(content) {
    return content.endsWith("\n") ? content : `${content}\n`;
}
function formatTurnEndedText(turnEnded) {
    switch (turnEnded.status) {
        case "success":
            return "Turn ended: success.";
        case "error":
            return `Turn ended: error: ${turnEnded.error}`;
        case "aborted":
            return turnEnded.error ? `Turn ended: aborted: ${turnEnded.error}` : "Turn ended: aborted.";
        default: {
            const _exhaustive = turnEnded;
            return _exhaustive;
        }
    }
}
function getTranscriptTerminalMarkers(options) {
    const { turnEnded } = options;
    const textSuffixes = [];
    const jsonFields = {};
    const jsonlLines = [];
    if (turnEnded !== undefined) {
        textSuffixes.push(formatTurnEndedText(turnEnded));
        jsonFields.turnEnded = turnEnded;
        jsonlLines.push(JSON.stringify({
            type: "turn_ended",
            ...turnEnded,
        }));
    }
    return {
        textSuffixes,
        jsonFields,
        jsonlLines,
    };
}
/**
 * Formats a single TranscriptMessage as a JSONL line string (without trailing newline).
 * Returns undefined if the message produces no content (system messages, empty content).
 *
 * Uses Claude Code–compatible shape: { role, message: { content: [...] } }
 */
function formatSingleMessageJsonl(message) {
    if (message.role === "system" || isSummaryMessage(message)) {
        return undefined;
    }
    const stripTags = message.role === "user";
    const jsonMessage = formatMessageToJson(message, stripTags);
    const content = [];
    const textParts = [];
    if (jsonMessage.text) {
        textParts.push(jsonMessage.text);
    }
    if (jsonMessage.thinking) {
        textParts.push(jsonMessage.thinking);
    }
    if (textParts.length > 0) {
        content.push({ type: "text", text: textParts.join("\n\n") });
    }
    if (jsonMessage.toolCalls) {
        for (const call of jsonMessage.toolCalls) {
            content.push({
                type: "tool_use",
                name: call.toolName,
                input: call.args,
            });
        }
    }
    if (content.length === 0) {
        return undefined;
    }
    const line = {
        role: message.role,
        message: { content },
    };
    return JSON.stringify(line);
}
/**
 * Formats a TranscriptMessage array as JSONL (one JSON object per line).
 * Uses Claude Code–compatible shape: { role, message: { content: [{ type: "text", text }] } }
 * so hooks like Ralph loop (jq .message.content | map(select(.type == "text")) | map(.text)) work.
 */
function formatTranscriptJsonl(messages) {
    // Filter system messages first so the "drop leading user-info" check below
    // compares the correct pair of messages.
    let filteredMessages = messages.filter((msg) => msg.role !== "system");
    if (filteredMessages.length >= 2 &&
        filteredMessages[0].role === "user" &&
        filteredMessages[1].role === "user") {
        filteredMessages = filteredMessages.slice(1);
    }
    const lines = [];
    for (const message of filteredMessages) {
        const line = formatSingleMessageJsonl(message);
        if (line) {
            lines.push(line);
        }
    }
    return lines.join("\n");
}
/**
 * Renders a full transcript from a ConversationStateStructure.
 *
 * This is the main API that combines hydration and formatting.
 */
async function renderTranscript(ctx, blobStore, state) {
    const messages = await dist_hydrateMessages(ctx, blobStore, state);
    return dist_formatTranscript(messages);
}
/**
 * TranscriptStore manages writing conversation transcripts.
 *
 * This class is environment-agnostic - it accepts a file writer callback
 * so it can be used in Node.js (with fs), VSCode (with IFileService), etc.
 *
 * Default layout (nested):
 *   {projectDir}/agent-transcripts/<safeId>/<safeId>.<ext>
 *
 * Custom layouts (e.g. subagent paths) can be achieved by providing a
 * `pathResolver` in the options.
 */
class TranscriptStore {
    constructor(projectDir, blobStore, writeFile, options = {}) {
        this.projectDir = projectDir;
        this.blobStore = blobStore;
        this.writeFile = writeFile;
        this.options = {
            writeText: options.writeText ?? true,
            writeJson: options.writeJson ?? false,
            writeJsonl: options.writeJsonl ?? false,
            pathResolver: options.pathResolver,
            appendFile: options.appendFile,
            fallbackToFullWriteOnIncrementalFailure: options.fallbackToFullWriteOnIncrementalFailure ?? true,
        };
    }
    /**
     * Resolve the full file path for a transcript.
     *
     * Delegates to the caller-provided `pathResolver` if one was supplied,
     * otherwise falls back to the default nested layout:
     *   `{projectDir}/agent-transcripts/<safeId>/<safeId>.<ext>`
     */
    resolveFilePath(conversationId, ext) {
        if (this.options.pathResolver) {
            return this.options.pathResolver(conversationId, ext);
        }
        const relPath = dist_getTranscriptRelativePath({
            conversationId,
            ext,
            kind: "primary",
        });
        return `${this.projectDir}/${relPath}`;
    }
    /**
     * Writes a transcript from a ConversationStateStructure (full overwrite).
     *
     * Hydrates all messages from the blob store and rewrites the entire file.
     * For repeated writes during an agent session, prefer `writeFromStateIncremental`
     * which only hydrates and appends new messages.
     *
     * Writes each enabled format (`writeText` / `writeJson` / `writeJsonl`).
     * If `options.overviewFactory` is set, the JSONL output is prefixed with a
     * `{"type":"metadata","metadata":{"overview":"..."}}` header.
     * If `options.turnEnded` is set, each format appends a terminal marker
     * (see `WriteFromStateOptions.turnEnded`) and the file is written even
     * when hydrated messages are empty — otherwise empty transcripts are skipped.
     *
     * Output path is determined by the `pathResolver` option or the default
     * nested layout. Best-effort: errors are logged but not thrown.
     *
     * @returns `true` when the write completed (including the no-op empty case),
     *   `false` when it failed. Callers tracking an append cursor use this to
     *   avoid advancing past content that never reached disk.
     */
    async writeFromStateFull(ctx, state, conversationId, options = {}) {
        const env_2 = { stack: [], error: void 0, hasError: false };
        try {
            const span = __addDisposableResource(env_2, createSpan(ctx.withName("writeFromState")), false);
            try {
                const messages = await dist_hydrateMessages(span.ctx, this.blobStore, state);
                const { overviewFactory } = options;
                const terminalMarkers = getTranscriptTerminalMarkers(options);
                if (messages.length === 0 && terminalMarkers.jsonlLines.length === 0) {
                    return true;
                }
                let formattedConversation;
                if (this.options.writeText || overviewFactory) {
                    formattedConversation = dist_formatTranscript(messages);
                }
                if (this.options.writeText) {
                    const base = formattedConversation ?? "";
                    const textContent = terminalMarkers.textSuffixes.length > 0
                        ? base.trim().length > 0
                            ? `${base}\n\n${terminalMarkers.textSuffixes.join("\n")}`
                            : terminalMarkers.textSuffixes.join("\n")
                        : base;
                    if (textContent.trim()) {
                        await this.writeFile(this.resolveFilePath(conversationId, "txt"), textContent);
                    }
                }
                if (this.options.writeJson) {
                    const jsonContent = dist_formatTranscriptJson(messages);
                    if (jsonContent || terminalMarkers.jsonlLines.length > 0) {
                        const wrapper = {
                            mode: dist_agentModeToString(state.mode),
                            messages: jsonContent ? JSON.parse(jsonContent) : [],
                            ...terminalMarkers.jsonFields,
                        };
                        await this.writeFile(this.resolveFilePath(conversationId, "json"), JSON.stringify(wrapper, null, 2));
                    }
                }
                // JSONL — Claude Code–compatible for stop hooks.
                if (this.options.writeJsonl) {
                    const body = formatTranscriptJsonl(messages);
                    let finalJsonl = [body, ...terminalMarkers.jsonlLines]
                        .filter((line) => line.length > 0)
                        .join("\n");
                    if (finalJsonl && overviewFactory && formattedConversation?.trim()) {
                        try {
                            const overview = await overviewFactory(formattedConversation);
                            const trimmed = overview.trim();
                            if (trimmed) {
                                finalJsonl = prependOverviewMetadataLine(finalJsonl, trimmed);
                            }
                        }
                        catch (overviewError) {
                            console.error("[TranscriptStore] Failed to generate transcript overview:", overviewError);
                        }
                    }
                    if (finalJsonl) {
                        await this.writeFile(this.resolveFilePath(conversationId, "jsonl"), ensureTrailingNewline(finalJsonl));
                    }
                }
                return true;
            }
            catch (error) {
                console.error("[TranscriptStore] Failed to write transcript:", error);
                return false;
            }
        }
        catch (e_2) {
            env_2.error = e_2;
            env_2.hasError = true;
        }
        finally {
            __disposeResources(env_2);
        }
    }
    /**
     * Incrementally appends new messages and terminal markers to a JSONL transcript file.
     *
     * Only hydrates blob IDs beyond `previousRootPromptCount` from the blob store,
     * formats them as JSONL lines, and appends to the existing file. Marker-only
     * writes append directly. This turns each checkpoint write from
     * O(total messages) to O(new messages).
     *
     * Falls back to a full `writeFromState` when:
     * - This is the first write (previousRootPromptCount === 0)
     * - Overview metadata must be prepended (requires a full rewrite)
     * - No appendFile callback is configured
     * - writeText or writeJson are enabled (these formats don't support append)
     *
     * @returns The new rootPromptMessagesJson count after writing, for the caller
     *   to track as the next `previousRootPromptCount`. Returns `0` when the
     *   write could not be persisted (both the append and the full-write fallback
     *   failed) so the caller re-attempts a full rewrite on the next checkpoint
     *   instead of appending past content that never reached disk.
     */
    async writeFromStateIncremental(ctx, state, conversationId, previousRootPromptCount, options = {}) {
        const env_3 = { stack: [], error: void 0, hasError: false };
        try {
            const currentCount = state.rootPromptMessagesJson.length;
            const terminalMarkers = getTranscriptTerminalMarkers(options);
            const hasTerminalMarker = terminalMarkers.jsonlLines.length > 0;
            if (currentCount === previousRootPromptCount &&
                !hasTerminalMarker &&
                !options.overviewFactory) {
                return currentCount;
            }
            const appendFile = this.options.appendFile;
            const canAppend = appendFile &&
                this.options.writeJsonl &&
                !this.options.writeText &&
                !this.options.writeJson &&
                previousRootPromptCount > 0 &&
                currentCount >= previousRootPromptCount &&
                (currentCount > previousRootPromptCount || hasTerminalMarker) &&
                !options.overviewFactory;
            if (!canAppend) {
                const ok = await this.writeFromStateFull(ctx, state, conversationId, options);
                return ok ? currentCount : 0;
            }
            const span = __addDisposableResource(env_3, createSpan(ctx.withName("writeFromStateIncremental")), false);
            if (currentCount === previousRootPromptCount && hasTerminalMarker) {
                try {
                    await appendFile(this.resolveFilePath(conversationId, "jsonl"), ensureTrailingNewline(terminalMarkers.jsonlLines.join("\n")));
                    return currentCount;
                }
                catch (error) {
                    console.error(this.options.fallbackToFullWriteOnIncrementalFailure
                        ? "[TranscriptStore] Failed to append transcript, falling back to full write:"
                        : "[TranscriptStore] Failed to append transcript:", error);
                    if (!this.options.fallbackToFullWriteOnIncrementalFailure) {
                        return 0;
                    }
                    const ok = await this.writeFromStateFull(ctx, state, conversationId, options);
                    return ok ? currentCount : 0;
                }
            }
            try {
                const newBlobIds = state.rootPromptMessagesJson.slice(previousRootPromptCount);
                const newMessages = await hydrateBlobIds(span.ctx, this.blobStore, newBlobIds);
                span.span.setAttribute("hydratedBlobCount", newMessages.hydratedBlobCount);
                span.span.setAttribute("hydratedBlobBytes", newMessages.hydratedBlobBytes);
                span.span.setAttribute("largestHydratedBlobBytes", newMessages.largestHydratedBlobBytes);
                span.span.setAttribute("totalDeserializeDurationMs", newMessages.totalDeserializeDurationMs);
                span.span.setAttribute("omittedOversizeBlobCount", newMessages.omittedOversizeBlobCount);
                span.span.setAttribute("omittedOversizeBlobBytes", newMessages.omittedOversizeBlobBytes);
                span.span.setAttribute("largestOmittedOversizeBlobBytes", newMessages.largestOmittedOversizeBlobBytes);
                const lines = [];
                for (const message of newMessages.messages) {
                    const line = formatSingleMessageJsonl(message);
                    if (line) {
                        lines.push(line);
                    }
                }
                lines.push(...terminalMarkers.jsonlLines);
                if (lines.length > 0) {
                    const content = ensureTrailingNewline(lines.join("\n"));
                    await appendFile(this.resolveFilePath(conversationId, "jsonl"), content);
                }
                return currentCount;
            }
            catch (error) {
                console.error(this.options.fallbackToFullWriteOnIncrementalFailure
                    ? "[TranscriptStore] Failed to append transcript, falling back to full write:"
                    : "[TranscriptStore] Failed to append transcript:", error);
                if (!this.options.fallbackToFullWriteOnIncrementalFailure) {
                    return 0;
                }
                const ok = await this.writeFromStateFull(ctx, state, conversationId, options);
                return ok ? currentCount : 0;
            }
        }
        catch (e_3) {
            env_3.error = e_3;
            env_3.hasError = true;
        }
        finally {
            __disposeResources(env_3);
        }
    }
}



// EXTERNAL MODULE: ../context/dist/core.js
var core = __webpack_require__("../context/dist/core.js");
// EXTERNAL MODULE: ../hooks/dist/index.js + 30 modules
var hooks_dist = __webpack_require__("../hooks/dist/index.js");
;// ../hooks-exec/dist/hook-error-handling.js
/**
 * Error thrown when a hook explicitly denies permission (permission === "deny").
 * When thrown from runPostExecutionHooks, generic-hooks will:
 * 1. Create a rejected result using createRejectedResult(args, reason)
 * 2. Fire postToolUseFailure with reason and failureType "permission_denied"
 * 3. Return the rejected result
 */
class HookDeniedError extends Error {
    constructor(reason) {
        super(`Hook denied: ${reason}`);
        this.failureType = "permission_denied";
        this.name = "HookDeniedError";
        this.reason = reason;
    }
}
/**
 * Error that signals fail-closed behavior due to infrastructure failure.
 * When thrown from runPostExecutionHooks, generic-hooks will:
 * 1. Create a rejected result using createRejectedResult(args, reason)
 * 2. Fire postToolUseFailure with reason and failureType "error"
 * 3. Return the rejected result
 *
 * Use withFailClosed() wrapper to automatically catch and wrap errors.
 */
class FailClosedError extends Error {
    constructor(reason, cause) {
        super(`Hook failed (fail-closed): ${reason}`);
        this.failureType = "error";
        this.name = "FailClosedError";
        this.reason = reason;
        this.cause = cause;
    }
}
/**
 * Wraps an async function to use fail-closed error handling.
 * If the function throws, the error is wrapped in FailClosedError.
 *
 * @param fn - The async function to wrap
 * @param actionDescription - Optional description of the action being performed (e.g., "File read")
 */
async function withFailClosed(fn, actionDescription) {
    try {
        return await fn();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const reason = createHookFailClosedMessage(actionDescription, errorMessage);
        throw new FailClosedError(reason, error);
    }
}
function isHookDeniedError(error) {
    return error instanceof HookDeniedError;
}
/**
 * Suffix to append to hook denial messages to help users understand how to manage hooks.
 */
const HOOK_SETTINGS_HINT = "To view or modify configured hooks, go to Cursor Settings > Hooks.";
/**
 * Note for the agent when a hook denies a tool.
 */
const HOOK_DENIAL_AGENT_NOTE = "Agent note: Do not suggest workarounds to the blocked tool.";
function appendAgentDenialNote(message) {
    if (message.includes(HOOK_DENIAL_AGENT_NOTE)) {
        return message;
    }
    return `${message}\n\n${HOOK_DENIAL_AGENT_NOTE}`;
}
/** User-facing message when blocking because the hook has failClosed: true. */
function formatFailClosedBlockReason(specificFailure) {
    return `Tool blocked because this hook is configured to fail closed (block when it fails). ${specificFailure}`;
}
/**
 * Creates a user-friendly denial message for when a hook blocks an action.
 * Includes the reason (if provided) and instructions for checking hook settings.
 *
 * @param actionDescription - What was blocked (e.g., "Command execution", "File read")
 * @param userMessage - Optional reason from the hook explaining why it was blocked
 */
function createHookDenialMessage(actionDescription, userMessage) {
    const baseMessage = userMessage
        ? `${actionDescription} was blocked by a hook: ${userMessage}`
        : `${actionDescription} was blocked by a hook.`;
    return appendAgentDenialNote(`${baseMessage}\n\n${HOOK_SETTINGS_HINT}`);
}
/**
 * Creates a user-friendly message for when a hook fails and causes fail-closed behavior.
 * This is different from explicit denial - this is when the hook infrastructure itself fails.
 *
 * @param actionDescription - Optional description of what was blocked (e.g., "File read")
 * @param errorMessage - The error message from the hook failure
 */
function createHookFailClosedMessage(actionDescription, errorMessage) {
    const action = actionDescription ?? "Action";
    const errorDetail = errorMessage ? `: ${errorMessage}` : ".";
    const baseMessage = `${action} was blocked because a configured hook failed to execute${errorDetail}

This is a safety measure (fail-closed) - when hooks cannot be evaluated, the action is blocked to prevent potentially unsafe operations.`;
    return `${baseMessage}\n\n${HOOK_SETTINGS_HINT}`;
}
function isFailClosedError(error) {
    return error instanceof FailClosedError;
}
function isBlockingHookError(error) {
    return isHookDeniedError(error) || isFailClosedError(error);
}

;// ../hooks-exec/dist/cli-hooks-executor.js










function isExistingFileSync(candidatePath) {
    try {
        return (0,external_node_fs_.statSync)(candidatePath).isFile();
    }
    catch {
        return false;
    }
}
/**
 * CLI implementation of HookExecutor that executes both command and prompt hooks.
 *
 * This executor:
 * - Loads hooks configuration from multiple sources (enterprise, team, project, user, claude-*)
 * - Executes command hook scripts using TerminalExecutor
 * - Executes prompt hooks via backend LLM (if promptHookClient is provided)
 * - Passes request data via stdin as JSON for command hooks
 * - Parses and validates hook responses
 * - Handles timeouts and errors
 */
class CliHooksExecutor {
    constructor(config, workspacePath, globalContext, shellExecutor, 
    /**
     * Optional client for evaluating prompt-based hooks.
     * If not provided, prompt hooks will be silently skipped.
     */
    promptHookClient, 
    /**
     * Optional promise that resolves when team hooks are loaded and merged.
     * Awaited at the start of executeHookForStep (e.g. ACP path) before first hook run.
     */
    teamHooksReadyPromise, onHookExecution, options) {
        this.workspacePath = workspacePath;
        this.globalContext = globalContext;
        this.shellExecutor = shellExecutor;
        this.promptHookClient = promptHookClient;
        this.onHookExecution = onHookExecution;
        this.options = options;
        this.sessionEnvById = new Map();
        this.sessionUserEmailById = new Map();
        this.activeSessionIdsByConversationId = new Map();
        /**
         * Promises that must settle before hooks execute, so async config merges
         * (team hooks fetch, plugin hooks load) are applied before the first run.
         */
        this.configReadyPromises = [];
        this.config = config;
        if (teamHooksReadyPromise) {
            this.addConfigReadyPromise(teamHooksReadyPromise);
        }
    }
    /**
     * Register an additional promise that executeHookForStep awaits before
     * running hooks. Used to defer hook execution until an async config merge
     * (e.g. plugin hooks loading) has been applied via updateConfig().
     */
    addConfigReadyPromise(promise) {
        // Swallow rejections: a failed merge must not block or fail hook runs.
        this.configReadyPromises.push(promise.catch(() => undefined));
    }
    emitHookExecution(event) {
        const eventWithTransportMode = {
            ...event,
            transportMode: event.transportMode ??
                (event.hookType === "prompt" ? "prompt" : this.getCommandHookPayloadTransportMode()),
        };
        try {
            this.onHookExecution?.(eventWithTransportMode);
        }
        catch {
            // Analytics failures should never affect hook execution.
        }
    }
    getCommandHookPayloadTransportMode() {
        if (this.options?.commandHookPayloadTransport === "stdin") {
            return  false ? 0 : "stdin";
        }
        return "argv_heredoc";
    }
    shouldUseCommandHookDirectStdinTransport() {
        return this.getCommandHookPayloadTransportMode() === "stdin";
    }
    async writeCommandHookStdinPayload(stdin, payload) {
        if (!stdin) {
            throw new Error("Hook stdin transport was requested, but the executor did not provide stdin");
        }
        try {
            stdin.end(Buffer.from(payload, "utf8"));
        }
        catch (error) {
            const errorCode = error instanceof Error && "code" in error ? error.code : undefined;
            if (errorCode === "EPIPE" ||
                errorCode === "ERR_STREAM_DESTROYED" ||
                errorCode === "ERR_STREAM_PREMATURE_CLOSE") {
                return;
            }
            throw error;
        }
        try {
            await (0,external_node_stream_promises_.finished)(stdin);
        }
        catch (error) {
            const errorCode = error instanceof Error && "code" in error ? error.code : undefined;
            if (errorCode === "EPIPE" ||
                errorCode === "ERR_STREAM_DESTROYED" ||
                errorCode === "ERR_STREAM_PREMATURE_CLOSE") {
                return;
            }
            throw error;
        }
    }
    /**
     * Update the hooks configuration at runtime.
     * Used when team hooks sync completes in the background and needs to refresh the config.
     */
    updateConfig(config) {
        this.config = config;
    }
    /**
     * Mark a scoped session as current before its sessionStart hook runs.
     * Bare conversation requests resolve through this mapping, while each
     * epoch's environment remains isolated under its full session id.
     */
    beginSessionEnvironment(scope, options) {
        this.sessionEnvById.delete(scope.sessionId);
        this.sessionUserEmailById.delete(scope.sessionId);
        const activeSessionIds = this.activeSessionIdsByConversationId.get(scope.conversationId) ?? [];
        this.activeSessionIdsByConversationId.set(scope.conversationId, activeSessionIds.filter((sessionId) => sessionId !== scope.sessionId).concat(scope.sessionId));
        const trimmedEmail = options?.userEmail?.trim() ?? "";
        if (trimmedEmail.length > 0) {
            this.sessionUserEmailById.set(scope.sessionId, trimmedEmail);
        }
    }
    /**
     * Update a live session's owner email without resetting its env map.
     * Private-worker duplicate ClaimWorker RPCs can learn the email after the
     * first beginSessionEnvironment (lookup retry / rolling backend upgrade).
     * Empty values are ignored so an older server reclaim cannot wipe it.
     */
    setSessionUserEmail(scope, userEmail) {
        const trimmedEmail = userEmail?.trim() ?? "";
        if (trimmedEmail.length === 0) {
            return;
        }
        this.sessionUserEmailById.set(scope.sessionId, trimmedEmail);
    }
    /**
     * Set session environment variables from sessionStart hook response.
     * These will be merged into the hook environment for all subsequent hook executions.
     */
    setSessionEnvironment(env, scope) {
        if (scope !== undefined) {
            this.sessionEnvById.set(scope.sessionId, {
                ...this.sessionEnvById.get(scope.sessionId),
                ...env,
            });
            return;
        }
        this.sessionEnv = { ...this.sessionEnv, ...env };
    }
    /**
     * Clean up session environment when session ends.
     */
    clearSessionEnvironment(scope) {
        if (scope !== undefined) {
            this.sessionEnvById.delete(scope.sessionId);
            this.sessionUserEmailById.delete(scope.sessionId);
            const remainingSessionIds = (this.activeSessionIdsByConversationId.get(scope.conversationId) ?? []).filter((sessionId) => sessionId !== scope.sessionId);
            if (remainingSessionIds.length === 0) {
                this.activeSessionIdsByConversationId.delete(scope.conversationId);
            }
            else {
                this.activeSessionIdsByConversationId.set(scope.conversationId, remainingSessionIds);
            }
            return;
        }
        this.sessionEnv = undefined;
    }
    /**
     * Prefer the claim-scoped email (private workers multiplex users on one
     * long-lived daemon) and fall back to the process-global context used by
     * hosted pods / interactive CLI.
     */
    resolveUserEmail(request) {
        const { conversation_id: conversationId, session_id: requestSessionId } = request;
        if (requestSessionId !== undefined && this.sessionUserEmailById.has(requestSessionId)) {
            return this.sessionUserEmailById.get(requestSessionId) ?? null;
        }
        if (conversationId !== undefined) {
            const latestSessionId = this.activeSessionIdsByConversationId.get(conversationId)?.at(-1);
            if (latestSessionId !== undefined) {
                const scoped = this.sessionUserEmailById.get(latestSessionId);
                if (scoped !== undefined) {
                    return scoped;
                }
            }
        }
        return this.globalContext.user_email;
    }
    /**
     * Get transcript file path if it exists. Best-effort: only returns path when file is present.
     * Used for CURSOR_TRANSCRIPT_PATH env var and transcript_path in hook payloads (Claude Code compatibility).
     */
    async getTranscriptPathIfExists(conversationId) {
        try {
            const projectDir = (0,workspace_paths/* getProjectPath */.Rv)((0,external_node_os_.homedir)(), this.workspacePath);
            const candidates = getTranscriptProbeRelativePaths({
                conversationId,
                kind: "primary",
            }).map((relPath) => (0,external_node_path_.join)(projectDir, relPath));
            for (const candidatePath of candidates) {
                try {
                    await (0,promises_.access)(candidatePath);
                    return candidatePath;
                }
                catch {
                    // keep scanning
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
    async getSubagentTranscriptPathIfExists(args) {
        const { subagentId, parentConversationId } = args;
        try {
            const projectDir = (0,workspace_paths/* getProjectPath */.Rv)((0,external_node_os_.homedir)(), this.workspacePath);
            const candidates = getTranscriptProbeRelativePaths({
                conversationId: subagentId,
                kind: "subagent",
                parentConversationId,
            }).map((relPath) => (0,external_node_path_.join)(projectDir, relPath));
            for (const candidatePath of candidates) {
                try {
                    await (0,promises_.access)(candidatePath);
                    return candidatePath;
                }
                catch {
                    // keep scanning
                }
            }
            return null;
        }
        catch {
            return null;
        }
    }
    /**
     * Check if there are any hooks configured for a specific step.
     */
    hasHooksForStep(step) {
        const allConfigs = [
            this.config.enterpriseHooks,
            this.config.teamHooks,
            this.config.userHooks,
            this.config.projectHooks,
            this.options?.runtimeHooks,
            this.config.claudeUserHooks,
            this.config.claudeProjectHooks,
            this.config.claudeProjectLocalHooks,
            ...(this.config.pluginHooks ?? []).map((entry) => entry.config),
        ];
        return allConfigs.some((cfg) => {
            const scripts = cfg?.hooks[step];
            return scripts !== undefined && scripts.length > 0;
        });
    }
    hasFailClosedHooksForStep(step, toolName) {
        const configs = [
            this.config.enterpriseHooks,
            this.config.teamHooks,
            this.config.projectHooks,
            this.config.userHooks,
            this.options?.runtimeHooks,
        ];
        for (const config of configs) {
            const scripts = config?.hooks[step];
            if (!scripts)
                continue;
            const matchingScripts = toolName ? (0,hooks_dist/* filterScriptsByMatcher */.Qk)(scripts, toolName) : scripts;
            if (matchingScripts.some((script) => script.failClosed === true)) {
                return true;
            }
        }
        // Plugin hooks execute command scripts only, so only those count toward
        // fail-closed behavior on executor infrastructure errors.
        for (const entry of this.config.pluginHooks ?? []) {
            const scripts = entry.config.hooks[step];
            if (!scripts)
                continue;
            const matchingScripts = toolName ? (0,hooks_dist/* filterScriptsByMatcher */.Qk)(scripts, toolName) : scripts;
            if (matchingScripts.some((script) => (0,hooks_dist/* isCommandHook */.Xz)(script) && script.failClosed === true)) {
                return true;
            }
        }
        return false;
    }
    getCwdForSource(source) {
        const dirs = this.config.configDirs;
        switch (source) {
            case "enterprise":
                return dirs?.enterprise ?? this.workspacePath;
            case "team":
                return dirs?.team ?? this.workspacePath;
            case "project":
            case "claude-project":
            case "claude-project-local":
            case "claude-plugin":
                return this.workspacePath;
            case "user":
                return dirs?.user ?? this.workspacePath;
            case "runtime":
                return this.workspacePath;
            case "claude-user":
                return dirs?.claudeUser ?? this.workspacePath;
            default: {
                const _ = source;
                return this.workspacePath;
            }
        }
    }
    /**
     * Build environment variables for hook execution.
     * These variables are passed to hook scripts via the shell environment.
     */
    buildHookEnvironment(args) {
        const { transcriptPath, sessionId, conversationId, executionEnv } = args;
        const userEmail = this.resolveUserEmail({
            conversation_id: conversationId,
            session_id: sessionId,
        });
        const env = {
            // Core Cursor variables
            CURSOR_PROJECT_DIR: this.workspacePath,
            CURSOR_VERSION: this.globalContext.cursor_version,
            // Optional variables - only set when applicable
            ...(userEmail && {
                CURSOR_USER_EMAIL: userEmail,
            }),
            ...(transcriptPath && { CURSOR_TRANSCRIPT_PATH: transcriptPath }),
            // Claude compatibility - allows hooks written for Claude Code to work
            // Always set to match CURSOR_PROJECT_DIR (even when empty string)
            CLAUDE_PROJECT_DIR: this.workspacePath,
            // Session env vars from sessionStart hooks (merged last to allow overrides)
            ...this.sessionEnv,
            ...(sessionId !== undefined ? this.sessionEnvById.get(sessionId) : undefined),
            // Explicit execution values are host policy and must not be replaced by
            // a sessionStart response (for example, a claim-provided HOME).
            ...executionEnv,
        };
        return env;
    }
    shouldSkipHookDueToLoopLimit(step, script, fullRequest) {
        if (step !== "stop" && step !== "subagentStop") {
            return false;
        }
        const request = step === "stop"
            ? fullRequest
            : fullRequest;
        const loopCount = request.loop_count;
        const limit = script.loop_limit;
        if (limit === null) {
            return false;
        }
        if (limit === undefined) {
            return loopCount >= hooks_dist/* DEFAULT_STOP_HOOK_LOOP_LIMIT */.aX;
        }
        return loopCount >= limit;
    }
    async executeHookForStep(step, request, executionOptions) {
        if (this.configReadyPromises.length > 0) {
            await Promise.all(this.configReadyPromises);
        }
        // Workspace-lifecycle hooks (e.g. workspaceOpen) carry no
        // conversation/session/generation/model identifiers — skip the transcript
        // and session-id derivation, and omit `transcript_path` from the wire
        // payload to match the workbench shape (see cursorHooksService.ts).
        const isLifecycleStep = (0,hooks_dist/* isWorkspaceLifecycleStep */.yW)(step);
        const requestWithSessionContext = request;
        const transcriptPath = isLifecycleStep
            ? null
            : requestWithSessionContext.conversation_id
                ? await this.getTranscriptPathIfExists(requestWithSessionContext.conversation_id)
                : null;
        let agentTranscriptPath;
        if (step === hooks_dist/* HookStep */._E.subagentStop) {
            const subagentRequest = request;
            agentTranscriptPath = subagentRequest.subagent_id
                ? await this.getSubagentTranscriptPathIfExists({
                    subagentId: subagentRequest.subagent_id,
                    parentConversationId: subagentRequest.parent_conversation_id,
                })
                : null;
        }
        // Add global context fields to the request. session_id only applies to
        // session/agent-scoped hooks; workspace-lifecycle hooks omit it and
        // transcript_path entirely.
        const sessionIdForRequest = isLifecycleStep
            ? undefined
            : (requestWithSessionContext.session_id ?? requestWithSessionContext.conversation_id);
        const fullRequest = {
            ...request,
            ...(sessionIdForRequest !== undefined && {
                session_id: sessionIdForRequest,
            }),
            hook_event_name: step,
            cursor_version: this.globalContext.cursor_version,
            workspace_roots: [this.workspacePath],
            user_email: this.resolveUserEmail(requestWithSessionContext),
            ...(!isLifecycleStep && { transcript_path: transcriptPath }),
            ...(step === hooks_dist/* HookStep */._E.subagentStop && {
                agent_transcript_path: agentTranscriptPath ?? null,
            }),
        };
        const toolName = (0,hooks_dist/* extractToolName */.bi)(step, fullRequest);
        // Priority order: enterprise > team > project > user > runtime >
        // claude-project-local > claude-project > claude-user
        const scriptsToExecute = [];
        const addScriptsFromSource = (scripts, source) => {
            if (!scripts)
                return;
            const filtered = (0,hooks_dist/* filterScriptsByMatcher */.Qk)(scripts, toolName);
            const cwd = executionOptions?.cwd ?? this.getCwdForSource(source);
            for (const script of filtered) {
                if ((0,hooks_dist/* isPromptHook */.uu)(script)) {
                    if (this.promptHookClient) {
                        scriptsToExecute.push({
                            type: "prompt",
                            script,
                            source,
                        });
                    }
                }
                else if ((0,hooks_dist/* isCommandHook */.Xz)(script)) {
                    scriptsToExecute.push({
                        type: "command",
                        script,
                        cwd,
                        env: executionOptions?.env,
                        source,
                    });
                }
            }
        };
        addScriptsFromSource(this.config.enterpriseHooks?.hooks[step], "enterprise");
        addScriptsFromSource(this.config.teamHooks?.hooks[step], "team");
        addScriptsFromSource(this.config.projectHooks?.hooks[step], "project");
        addScriptsFromSource(this.config.userHooks?.hooks[step], "user");
        addScriptsFromSource(this.options?.runtimeHooks?.hooks[step], "runtime");
        addScriptsFromSource(this.config.claudeProjectLocalHooks?.hooks[step], "claude-project-local");
        addScriptsFromSource(this.config.claudeProjectHooks?.hooks[step], "claude-project");
        addScriptsFromSource(this.config.claudeUserHooks?.hooks[step], "claude-user");
        // Plugin hooks (command-only; lowest priority — mirrors the IDE's
        // cursorHooksService). Commands were already `${CLAUDE_PLUGIN_ROOT}`-
        // expanded by the plugin loader. stop/subagentStop hooks run in the
        // workspace so they can find state files; everything else runs in the
        // plugin install path. Per-call executionOptions still win so worker
        // lifecycle hooks can pin host HOME / CURSOR_WORKER_* env.
        for (const entry of this.config.pluginHooks ?? []) {
            const scripts = entry.config.hooks[step];
            if (!scripts?.length)
                continue;
            const cwd = executionOptions?.cwd ??
                (step === hooks_dist/* HookStep */._E.stop || step === hooks_dist/* HookStep */._E.subagentStop
                    ? this.workspacePath
                    : entry.installPath);
            const attribution = {
                ...(entry.plugin !== undefined && { plugin: entry.plugin }),
                ...(entry.marketplace !== undefined && {
                    marketplace: entry.marketplace,
                }),
                ...(entry.pluginId !== undefined && { pluginId: entry.pluginId }),
                ...(entry.marketplaceId !== undefined && {
                    marketplaceId: entry.marketplaceId,
                }),
            };
            for (const script of (0,hooks_dist/* filterScriptsByMatcher */.Qk)(scripts, toolName)) {
                if (!(0,hooks_dist/* isCommandHook */.Xz)(script))
                    continue;
                scriptsToExecute.push({
                    type: "command",
                    script,
                    cwd,
                    env: executionOptions?.env,
                    source: "claude-plugin",
                    attribution,
                    pluginInstallPath: entry.installPath,
                });
            }
        }
        if (scriptsToExecute.length === 0) {
            return undefined;
        }
        // Execute all scripts in parallel and merge responses (like Claude Code)
        return this.executeAllAndMerge(step, scriptsToExecute, fullRequest);
    }
    /**
     * Execute all scripts in parallel and merge their responses.
     */
    async executeAllAndMerge(step, scriptsToExecute, fullRequest) {
        // Execute all scripts in parallel
        const executionPromises = scriptsToExecute.map(async (scriptInfo, index) => {
            const { source, attribution } = scriptInfo;
            try {
                if (scriptInfo.type === "prompt") {
                    // Execute prompt hook via backend LLM
                    return this.executePromptHook(step, scriptInfo.script, fullRequest, source, index, attribution);
                }
                else {
                    // Execute command hook via shell
                    return this.executeCommandHook(step, scriptInfo.script, scriptInfo.cwd, scriptInfo.env, fullRequest, source, index, attribution, scriptInfo.pluginInstallPath);
                }
            }
            catch (error) {
                if (scriptInfo.script.failClosed === true) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    const reason = formatFailClosedBlockReason(`Hook execution failed: ${errorMsg}`);
                    const blockResponse = (0,hooks_dist/* createBlockResponse */.FS)(step, reason);
                    if (blockResponse) {
                        return {
                            success: true,
                            data: blockResponse,
                            source,
                            index,
                        };
                    }
                }
                return { success: false, source, index };
            }
        });
        const results = await Promise.all(executionPromises);
        // Collect all valid responses
        const validResponses = [];
        for (const result of results) {
            if (result.success && result.data !== undefined) {
                validResponses.push(result.data);
            }
        }
        // Merge and return
        return (0,hooks_dist/* mergeHookResponses */.wb)(step, validResponses);
    }
    /**
     * Execute a command hook via shell.
     */
    async executeCommandHook(step, script, cwd, env, fullRequest, source, index, attribution, pluginInstallPath) {
        if (this.shouldSkipHookDueToLoopLimit(step, script, fullRequest)) {
            return { success: false, source, index };
        }
        const hookStartTime = Date.now();
        // Recorded once at the top so every analytics emission carries the same
        // payload size, including the silent-failure paths that motivated this
        // field (CLI-381).
        const payloadSizeBytes = Buffer.byteLength(JSON.stringify(fullRequest), "utf8");
        let result;
        try {
            result = await this.executeCommandScript({
                script,
                cwd,
                request: fullRequest,
                env,
                ...(pluginInstallPath !== undefined && { pluginInstallPath }),
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const timedOut = errorMessage.toLowerCase().includes("timed out");
            const latencyMs = Date.now() - hookStartTime;
            const errorClass = timedOut ? "timeout" : "spawn_error";
            if (script.failClosed === true) {
                const reason = formatFailClosedBlockReason(`Hook "${script.command}" execution failed: ${errorMessage}`);
                const blockResponse = (0,hooks_dist/* createBlockResponse */.FS)(step, reason);
                if (blockResponse) {
                    this.emitHookExecution({
                        hookStep: step,
                        hookSource: source,
                        hookType: "command",
                        status: timedOut ? "timeout" : "blocked",
                        latencyMs,
                        payloadSizeBytes,
                        errorClass,
                        failClosed: true,
                        timedOut,
                        ...attribution,
                    });
                    return {
                        success: true,
                        data: blockResponse,
                        source,
                        index,
                    };
                }
            }
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "command",
                status: timedOut ? "timeout" : "failed",
                latencyMs,
                payloadSizeBytes,
                errorClass,
                failClosed: script.failClosed === true,
                timedOut,
                ...attribution,
            });
            return { success: false, source, index };
        }
        // Handle exit code 2 as block decision (matches Claude Code behavior)
        if (result.exitCode === hooks_dist/* HOOK_BLOCK_EXIT_CODE */.LQ) {
            const reason = (0,hooks_dist/* getBlockReason */.Uv)(result.stdout, result.stderr, script.command);
            const blockResponse = (0,hooks_dist/* createBlockResponse */.FS)(step, reason);
            if (blockResponse) {
                this.emitHookExecution({
                    hookStep: step,
                    hookSource: source,
                    hookType: "command",
                    status: "blocked",
                    latencyMs: result.duration,
                    payloadSizeBytes,
                    failClosed: script.failClosed === true,
                    exitCode: result.exitCode,
                    ...attribution,
                });
                return {
                    success: true,
                    data: blockResponse,
                    source,
                    index,
                };
            }
            // For observability hooks, exit code 2 is logged but doesn't create a response
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "command",
                status: "blocked",
                latencyMs: result.duration,
                payloadSizeBytes,
                failClosed: script.failClosed === true,
                exitCode: result.exitCode,
                ...attribution,
            });
            return { success: false, source, index };
        }
        if (result.exitCode !== 0 && result.exitCode !== null) {
            if (script.failClosed === true) {
                const reason = formatFailClosedBlockReason(`Hook "${script.command}" failed with exit code ${result.exitCode}${result.stderr ? `: ${result.stderr.trim()}` : ""}`);
                const blockResponse = (0,hooks_dist/* createBlockResponse */.FS)(step, reason);
                if (blockResponse) {
                    this.emitHookExecution({
                        hookStep: step,
                        hookSource: source,
                        hookType: "command",
                        status: "blocked",
                        latencyMs: result.duration,
                        payloadSizeBytes,
                        errorClass: "exit_nonzero",
                        failClosed: true,
                        exitCode: result.exitCode,
                        ...attribution,
                    });
                    return {
                        success: true,
                        data: blockResponse,
                        source,
                        index,
                    };
                }
            }
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "command",
                status: "failed",
                latencyMs: result.duration,
                payloadSizeBytes,
                errorClass: "exit_nonzero",
                failClosed: script.failClosed === true,
                exitCode: result.exitCode,
                ...attribution,
            });
            return { success: false, source, index };
        }
        const trimmedStdout = result.stdout.trim();
        if (!trimmedStdout) {
            if (script.failClosed === true) {
                const reason = formatFailClosedBlockReason(`Hook "${script.command}" returned no output.`);
                const blockResponse = (0,hooks_dist/* createBlockResponse */.FS)(step, reason);
                if (blockResponse) {
                    this.emitHookExecution({
                        hookStep: step,
                        hookSource: source,
                        hookType: "command",
                        status: "blocked",
                        latencyMs: result.duration,
                        payloadSizeBytes,
                        errorClass: "empty_stdout",
                        failClosed: true,
                        exitCode: result.exitCode ?? undefined,
                        ...attribution,
                    });
                    return {
                        success: true,
                        data: blockResponse,
                        source,
                        index,
                    };
                }
            }
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "command",
                status: "failed",
                latencyMs: result.duration,
                payloadSizeBytes,
                errorClass: "empty_stdout",
                failClosed: script.failClosed === true,
                exitCode: result.exitCode ?? undefined,
                ...attribution,
            });
            return { success: false, source, index };
        }
        const rawResponse = (0,hooks_dist/* parseHookStdoutJson */.x9)(trimmedStdout);
        if (rawResponse === undefined) {
            const invalidJsonDecision = (0,hooks_dist/* getInvalidHookOutputBlockDecision */.Vf)({
                step,
                command: script.command,
                failClosed: script.failClosed === true,
                kind: "invalid_json",
            });
            if (invalidJsonDecision.blockResponse) {
                this.emitHookExecution({
                    hookStep: step,
                    hookSource: source,
                    hookType: "command",
                    status: "blocked",
                    latencyMs: result.duration,
                    payloadSizeBytes,
                    errorClass: "invalid_json",
                    failClosed: script.failClosed === true,
                    exitCode: result.exitCode ?? undefined,
                    ...attribution,
                });
                return {
                    success: true,
                    data: invalidJsonDecision.blockResponse,
                    source,
                    index,
                };
            }
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "command",
                status: "failed",
                latencyMs: result.duration,
                payloadSizeBytes,
                errorClass: "invalid_json",
                failClosed: script.failClosed === true,
                exitCode: result.exitCode ?? undefined,
                ...attribution,
            });
            return { success: false, source, index };
        }
        const validationResult = (0,hooks_dist/* validateAndParseHookResponse */.jO)(step, rawResponse, {
            enableClaudeNestedHookSpecificOutputCompatibility: this.options?.enableClaudeNestedHookSpecificOutputCompatibility,
        });
        if (validationResult.success) {
            const parsed = validationResult.data;
            const isBlocked = parsed.permission === "deny" || parsed.permission === "ask";
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "command",
                status: isBlocked ? "blocked" : "success",
                latencyMs: result.duration,
                payloadSizeBytes,
                failClosed: script.failClosed === true,
                exitCode: result.exitCode ?? undefined,
                ...attribution,
            });
            return {
                success: true,
                data: validationResult.data,
                source,
                index,
            };
        }
        const invalidResponseDecision = (0,hooks_dist/* getInvalidHookOutputBlockDecision */.Vf)({
            step,
            command: script.command,
            failClosed: script.failClosed === true,
            kind: "invalid_response",
        });
        if (invalidResponseDecision.blockResponse) {
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "command",
                status: "blocked",
                latencyMs: result.duration,
                payloadSizeBytes,
                errorClass: "invalid_response",
                failClosed: script.failClosed === true,
                exitCode: result.exitCode ?? undefined,
                ...attribution,
            });
            return {
                success: true,
                data: invalidResponseDecision.blockResponse,
                source,
                index,
            };
        }
        this.emitHookExecution({
            hookStep: step,
            hookSource: source,
            hookType: "command",
            status: "failed",
            latencyMs: result.duration,
            payloadSizeBytes,
            errorClass: "invalid_response",
            failClosed: script.failClosed === true,
            exitCode: result.exitCode ?? undefined,
            ...attribution,
        });
        return { success: false, source, index };
    }
    /**
     * Execute a prompt hook via backend LLM.
     */
    async executePromptHook(step, script, fullRequest, source, index, attribution) {
        if (this.shouldSkipHookDueToLoopLimit(step, script, fullRequest)) {
            return { success: false, source, index };
        }
        if (!this.promptHookClient) {
            // This shouldn't happen since we filter out prompt hooks if no client
            return { success: false, source, index };
        }
        const timeoutMs = (script.timeout ?? hooks_dist/* DEFAULT_HOOK_TIMEOUT_SECONDS */.yB) * 1000;
        const hookStartTime = Date.now();
        const payloadSizeBytes = Buffer.byteLength(JSON.stringify(fullRequest), "utf8");
        // Create a context with timeout for the RPC call
        // Using withTimeoutAndCancel so we can cancel early if needed
        const baseCtx = (0,core/* createContext */.q6)();
        const [ctx, cancel] = baseCtx.withTimeoutAndCancel(timeoutMs);
        try {
            // Strip undefined values from the request - protobuf can't encode undefined
            const sanitizedRequest = JSON.parse(JSON.stringify(fullRequest));
            // Call the prompt hook client with context (handles tracing and cancellation)
            const response = await this.promptHookClient.evaluatePromptHook(ctx, {
                prompt: script.prompt,
                hookInputJson: sanitizedRequest, // Pass sanitized object without undefined values
                modelName: script.model,
            });
            if (response.ok) {
                // Hook allows the action - create appropriate response for this hook step
                const allowResponse = (0,hooks_dist/* createAllowResponse */.D3)(step);
                this.emitHookExecution({
                    hookStep: step,
                    hookSource: source,
                    hookType: "prompt",
                    status: "success",
                    latencyMs: Date.now() - hookStartTime,
                    payloadSizeBytes,
                    failClosed: script.failClosed === true,
                    ...attribution,
                });
                if (allowResponse) {
                    return {
                        success: true,
                        data: allowResponse,
                        source,
                        index,
                    };
                }
                // For observability hooks that don't have an allow response
                return { success: false, source, index };
            }
            else {
                // Hook blocks the action
                const reason = response.reason ?? "Prompt hook blocked this action";
                const blockResponse = (0,hooks_dist/* createBlockResponse */.FS)(step, reason);
                this.emitHookExecution({
                    hookStep: step,
                    hookSource: source,
                    hookType: "prompt",
                    status: "blocked",
                    latencyMs: Date.now() - hookStartTime,
                    payloadSizeBytes,
                    failClosed: script.failClosed === true,
                    ...attribution,
                });
                if (blockResponse) {
                    return {
                        success: true,
                        data: blockResponse,
                        source,
                        index,
                    };
                }
                // For observability hooks that don't have a block response
                return { success: false, source, index };
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            const timedOut = errorMsg.toLowerCase().includes("abort") || errorMsg.toLowerCase().includes("timed out");
            const errorClass = timedOut ? "timeout" : "prompt_error";
            if (script.failClosed === true) {
                const reason = formatFailClosedBlockReason(`Prompt hook failed: ${errorMsg}`);
                const blockResponse = (0,hooks_dist/* createBlockResponse */.FS)(step, reason);
                if (blockResponse) {
                    this.emitHookExecution({
                        hookStep: step,
                        hookSource: source,
                        hookType: "prompt",
                        status: timedOut ? "timeout" : "blocked",
                        latencyMs: Date.now() - hookStartTime,
                        payloadSizeBytes,
                        errorClass,
                        failClosed: true,
                        timedOut,
                        ...attribution,
                    });
                    return {
                        success: true,
                        data: blockResponse,
                        source,
                        index,
                    };
                }
            }
            this.emitHookExecution({
                hookStep: step,
                hookSource: source,
                hookType: "prompt",
                status: timedOut ? "timeout" : "failed",
                latencyMs: Date.now() - hookStartTime,
                payloadSizeBytes,
                errorClass,
                failClosed: script.failClosed === true,
                timedOut,
                ...attribution,
            });
            return { success: false, source, index };
        }
        finally {
            // Cancel the context to clean up any pending operations
            cancel();
        }
    }
    /**
     * Execute a single command hook script via shell.
     */
    async executeCommandScript(options) {
        const { script, cwd, request, env, pluginInstallPath } = options;
        // Use script.timeout or default, convert to ms
        const timeoutMs = (script.timeout ?? hooks_dist/* DEFAULT_HOOK_TIMEOUT_SECONDS */.yB) * 1000;
        const startTime = Date.now();
        const jsonPayload = JSON.stringify(request);
        let tempPayloadDir;
        // Create an AbortController for timeout
        const abortController = new AbortController();
        const timeoutHandle = setTimeout(() => {
            abortController.abort();
        }, timeoutMs);
        try {
            // Build a command that pipes JSON to the hook script
            // Use a heredoc to avoid any escaping issues
            const isWindows = "linux" === "win32";
            const transportMode = this.getCommandHookPayloadTransportMode();
            const useStdinTransport = this.shouldUseCommandHookDirectStdinTransport();
            const hookCommand = isWindows
                ? (0,hooks_dist/* resolveWindowsHookCommandExecutable */.gv)(script.command, {
                    cwd,
                    isFile: isExistingFileSync,
                })
                : script.command;
            let command;
            if (useStdinTransport) {
                command = isWindows ? (0,hooks_dist/* ensureCallOperatorForQuotedPath */.JA)(hookCommand) : hookCommand;
            }
            else if (transportMode === "windows_temp_file") {
                tempPayloadDir = await (0,promises_.mkdtemp)((0,external_node_path_.join)((0,external_node_os_.tmpdir)(), "cursor-hooks-"));
                const tempPayloadPath = (0,external_node_path_.join)(tempPayloadDir, "payload.json");
                await (0,promises_.writeFile)(tempPayloadPath, jsonPayload, {
                    encoding: "utf8",
                    flag: "wx",
                });
                command = (0,hooks_dist/* buildWindowsHookPipelineCommand */.q3)(tempPayloadPath, hookCommand);
            }
            else if (isWindows) {
                // On Windows with PowerShell, invoke the hook command via the call
                // operator so quoted executable paths plus arguments remain valid.
                const escapedJson = jsonPayload.replace(/'/g, "''");
                command = `@'\n${escapedJson}\n'@ | & ${hookCommand}`;
            }
            else {
                // On Unix, use a heredoc
                command = `${script.command} <<'CURSOR_HOOK_EOF'\n${jsonPayload}\nCURSOR_HOOK_EOF`;
            }
            // Build hook environment variables. Lifecycle hooks carry an explicit
            // epoch-qualified session id. Bare tool requests resolve to the current
            // epoch for their conversation without sharing storage across epochs.
            const requestWithTranscriptPath = request;
            const { conversation_id: conversationId, session_id: requestSessionId } = requestWithTranscriptPath;
            const activeSessionIds = conversationId === undefined
                ? undefined
                : this.activeSessionIdsByConversationId.get(conversationId);
            const sessionIdForEnv = requestSessionId !== undefined &&
                (requestSessionId !== conversationId || this.sessionEnvById.has(requestSessionId))
                ? requestSessionId
                : conversationId === undefined
                    ? undefined
                    : (activeSessionIds?.at(-1) ?? conversationId);
            const hookEnv = this.buildHookEnvironment({
                transcriptPath: requestWithTranscriptPath.transcript_path,
                sessionId: sessionIdForEnv,
                conversationId,
                executionEnv: env,
            });
            // Filter out undefined values for the executor
            const envRecord = {};
            for (const [key, value] of Object.entries(hookEnv)) {
                if (value !== undefined) {
                    envRecord[key] = value;
                }
            }
            // For plugin hooks, expose the plugin root so scripts can use
            // $CURSOR_PLUGIN_ROOT / $CLAUDE_PLUGIN_ROOT (IDE parity).
            if (pluginInstallPath !== undefined) {
                envRecord.CURSOR_PLUGIN_ROOT = pluginInstallPath;
                envRecord.CLAUDE_PLUGIN_ROOT = pluginInstallPath;
            }
            // Execute the command using the shell executor
            const ctx = (0,core/* createContext */.q6)();
            let stdout = "";
            let stderr = "";
            let exitCode = null;
            let wroteStdinPayload = false;
            for await (const event of this.shellExecutor.execute(ctx, command, {
                workingDirectory: cwd,
                signal: abortController.signal,
                // Hooks run without sandbox - use insecure_none
                sandboxPolicy: { perUser: { type: "insecure_none" } },
                env: envRecord,
                pipeStdin: useStdinTransport,
            })) {
                switch (event.type) {
                    case "stdin_ready":
                        if (useStdinTransport) {
                            await this.writeCommandHookStdinPayload(event.stdin, jsonPayload);
                            wroteStdinPayload = true;
                        }
                        break;
                    case "stdout":
                        stdout += event.data.toString("utf8");
                        break;
                    case "stderr":
                        stderr += event.data.toString("utf8");
                        break;
                    case "exit":
                        exitCode = event.code;
                        break;
                }
            }
            if (useStdinTransport && !wroteStdinPayload) {
                throw new Error("Hook stdin transport was requested, but the executor did not signal stdin readiness");
            }
            clearTimeout(timeoutHandle);
            const duration = Date.now() - startTime;
            // The shell executor's signal handling SIGKILLs the child on abort
            // and finishes the async-iteration cleanly (exitCode === null). To
            // make `errorClass: "timeout"` reachable in telemetry, surface the
            // abort as a throw so executeCommandHook's catch branch sets the
            // timedOut flag. Without this, abort-driven timeouts fall through
            // to the empty-stdout path and lose the timeout classification.
            if (abortController.signal.aborted) {
                throw new Error(`Hook script timed out after ${timeoutMs}ms`);
            }
            return {
                stdout,
                stderr,
                exitCode,
                duration,
            };
        }
        catch (error) {
            clearTimeout(timeoutHandle);
            const _duration = Date.now() - startTime;
            if (abortController.signal.aborted) {
                throw new Error(`Hook script timed out after ${timeoutMs}ms`);
            }
            throw error;
        }
        finally {
            if (tempPayloadDir) {
                try {
                    await (0,promises_.rm)(tempPayloadDir, { recursive: true, force: true });
                }
                catch {
                    // Cleanup is best-effort and should not mask the hook result.
                }
            }
        }
    }
}

;// ../hooks-exec/dist/config-loader.js



function getEnterpriseHooksPath(plat) {
    const p = plat ?? (0,external_node_os_.platform)();
    switch (p) {
        case "darwin":
            return external_node_path_.join("/Library", "Application Support", "Cursor", "hooks.json");
        case "win32":
            return external_node_path_.join("C:\\", "ProgramData", "Cursor", "hooks.json");
        default:
            return external_node_path_.join("/etc", "cursor", "hooks.json");
    }
}
/**
 * Cloud agents mirror team hooks into a managed per-user directory so the
 * remote exec-daemon can reload them from disk without depending on the
 * workspace checkout.
 */
function getCloudManagedTeamHooksPath(homeDir) {
    return external_node_path_.join(homeDir, ".cursor", "managed", "active-team-hooks", "hooks.json");
}
/**
 * Build HooksConfigPaths for Cursor + Claude Code config locations.
 * Use this instead of manually constructing paths to avoid duplication.
 */
function getHooksConfigPaths(projectDir) {
    return {
        enterpriseConfigPath: getEnterpriseHooksPath(),
        userConfigPath: external_node_path_.join((0,external_node_os_.homedir)(), ".cursor", "hooks.json"),
        projectConfigPath: external_node_path_.join(projectDir, ".cursor", "hooks.json"),
        claudeUserConfigPath: external_node_path_.join((0,external_node_os_.homedir)(), ".claude", "settings.json"),
        claudeProjectConfigPath: external_node_path_.join(projectDir, ".claude", "settings.json"),
        claudeProjectLocalConfigPath: external_node_path_.join(projectDir, ".claude", "settings.local.json"),
    };
}
/**
 * Returns true if any hook config (Cursor or Claude) is present in the loaded config.
 */
function hasAnyHooks(config) {
    const configs = [
        config.enterpriseHooks,
        config.teamHooks,
        config.userHooks,
        config.projectHooks,
        config.claudeUserHooks,
        config.claudeProjectHooks,
        config.claudeProjectLocalHooks,
    ];
    return (configs.some((hookConfig) => hasConfiguredHooks(hookConfig)) ||
        (config.pluginHooks ?? []).some((entry) => hasConfiguredHooks(entry.config)));
}
function hasConfiguredHooks(config) {
    if (!config?.hooks) {
        return false;
    }
    return Object.keys(config.hooks).length > 0;
}
class HooksConfigLoader {
    constructor(fileReader, paths, logger) {
        this.fileReader = fileReader;
        this.paths = paths;
        this.logger = logger || {
            warn: (msg) => console.warn(`[hooks] ${msg}`),
            info: (_msg) => { },
        };
    }
    async load(options = {}) {
        const { loadProjectHooks = true } = options;
        const result = {
            errors: [],
            configDirs: {},
        };
        const addConfigDir = (source, configPath) => {
            result.configDirs[source] = external_node_path_.dirname(configPath);
        };
        const projectConfigPath = this.paths.projectConfigPath ??
            this.paths.claudeProjectConfigPath ??
            this.paths.claudeProjectLocalConfigPath;
        const workspaceRoot = projectConfigPath
            ? external_node_path_.dirname(external_node_path_.dirname(projectConfigPath))
            : undefined;
        const getSymlinkCheckRoot = (configPath, isProjectConfig) => {
            if (!configPath || !workspaceRoot)
                return undefined;
            if (isProjectConfig)
                return workspaceRoot;
            // User/team/enterprise config is user-admitted and may use symlinks.
            // Only scan it when it falls inside the writable workspace.
            const relative = external_node_path_.relative(external_node_path_.resolve(workspaceRoot), external_node_path_.resolve(configPath));
            return relative !== ".." &&
                !relative.startsWith(`..${external_node_path_.sep}`) &&
                !external_node_path_.isAbsolute(relative)
                ? workspaceRoot
                : undefined;
        };
        const loadOne = async (configPath, source, resultKey, configDirKey, parseMessagePrefix, accessMessageLabel, symlinkCheckRoot, parse) => {
            if (!configPath)
                return;
            try {
                const exists = await this.fileReader.exists(configPath);
                if (!exists)
                    return;
                // H1 #3724847 / SECX-2560: project hook config paths below the
                // user-admitted workspace root must not contain symlink aliases.
                if (symlinkCheckRoot && this.fileReader.pathContainsSymlink) {
                    const hasSymlink = await this.fileReader.pathContainsSymlink(configPath, symlinkCheckRoot);
                    if (hasSymlink) {
                        result.errors.push({
                            source,
                            message: `${parseMessagePrefix} at ${configPath}: refusing to load config path that contains a symlink`,
                        });
                        this.logger.warn(`Refusing to load ${accessMessageLabel} config via symlink path: ${configPath}`);
                        return;
                    }
                }
                const content = await this.fileReader.readFile(configPath);
                if (!content)
                    return;
                const { config, error } = parse(content);
                if (config) {
                    result[resultKey] = config;
                    addConfigDir(configDirKey, configPath);
                }
                else if (error) {
                    result.errors.push({
                        source,
                        message: `${parseMessagePrefix} at ${configPath}: ${error}`,
                    });
                }
            }
            catch (err) {
                result.errors.push({
                    source,
                    message: `Error accessing ${accessMessageLabel} config file: ${String(err)}`,
                });
            }
        };
        const cursorDescriptors = [
            {
                path: this.paths.enterpriseConfigPath,
                source: "enterprise",
                resultKey: "enterpriseHooks",
                configDirKey: "enterprise",
                parsePrefix: "Enterprise hooks.json",
                accessLabel: "enterprise",
                symlinkCheckRoot: getSymlinkCheckRoot(this.paths.enterpriseConfigPath, false),
            },
            {
                path: this.paths.teamConfigPath,
                source: "team",
                resultKey: "teamHooks",
                configDirKey: "team",
                parsePrefix: "Team hooks.json",
                accessLabel: "team",
                symlinkCheckRoot: getSymlinkCheckRoot(this.paths.teamConfigPath, false),
            },
            {
                path: this.paths.userConfigPath,
                source: "user",
                resultKey: "userHooks",
                configDirKey: "user",
                parsePrefix: "User hooks.json",
                accessLabel: "user",
                symlinkCheckRoot: getSymlinkCheckRoot(this.paths.userConfigPath, false),
            },
            {
                path: loadProjectHooks ? this.paths.projectConfigPath : undefined,
                source: "project",
                resultKey: "projectHooks",
                configDirKey: "project",
                parsePrefix: "Project hooks.json",
                accessLabel: "project",
                symlinkCheckRoot: getSymlinkCheckRoot(this.paths.projectConfigPath, true),
            },
        ];
        for (const d of cursorDescriptors) {
            await loadOne(d.path, d.source, d.resultKey, d.configDirKey, d.parsePrefix, d.accessLabel, d.symlinkCheckRoot, (c) => this.parseAndValidate(c, d.source));
        }
        const claudeDescriptors = [
            {
                path: this.paths.claudeUserConfigPath,
                source: "claude-user",
                resultKey: "claudeUserHooks",
                configDirKey: "claudeUser",
                label: "user",
                symlinkCheckRoot: getSymlinkCheckRoot(this.paths.claudeUserConfigPath, false),
            },
            {
                path: loadProjectHooks ? this.paths.claudeProjectConfigPath : undefined,
                source: "claude-project",
                resultKey: "claudeProjectHooks",
                configDirKey: "claudeProject",
                label: "project",
                symlinkCheckRoot: getSymlinkCheckRoot(this.paths.claudeProjectConfigPath, true),
            },
            {
                path: loadProjectHooks ? this.paths.claudeProjectLocalConfigPath : undefined,
                source: "claude-project-local",
                resultKey: "claudeProjectLocalHooks",
                configDirKey: "claudeProjectLocal",
                label: "project local",
                symlinkCheckRoot: getSymlinkCheckRoot(this.paths.claudeProjectLocalConfigPath, true),
            },
        ];
        for (const d of claudeDescriptors) {
            await loadOne(d.path, d.source, d.resultKey, d.configDirKey, `Claude ${d.label} settings.json`, `Claude ${d.label}`, d.symlinkCheckRoot, (c) => this.parseClaudeConfig(c, d.source));
        }
        // Deduplicate Claude hooks against Cursor hooks
        this.dedupeClaudeHooksAgainstCursorHooks(result);
        return result;
    }
    getHookKey(script) {
        if ((0,hooks_dist/* isPromptHook */.uu)(script)) {
            return `prompt:${script.prompt}`;
        }
        return `command:${script.command}`;
    }
    dedupeClaudeHooksAgainstCursorHooks(result) {
        const cursorConfigs = [
            result.enterpriseHooks,
            result.teamHooks,
            result.userHooks,
            result.projectHooks,
        ];
        // Build a map of step -> Set of hook keys for Cursor hooks
        const cursorHookKeysByStep = new Map();
        for (const config of cursorConfigs) {
            if (!config?.hooks)
                continue;
            for (const [step, scripts] of Object.entries(config.hooks)) {
                if (!scripts)
                    continue;
                let keySet = cursorHookKeysByStep.get(step);
                if (!keySet) {
                    keySet = new Set();
                    cursorHookKeysByStep.set(step, keySet);
                }
                for (const script of scripts) {
                    keySet.add(this.getHookKey(script));
                }
            }
        }
        // Filter Claude hooks to remove duplicates
        const filterClaudeConfig = (config, source) => {
            if (!config?.hooks)
                return;
            for (const [step, scripts] of Object.entries(config.hooks)) {
                if (!scripts)
                    continue;
                const cursorKeys = cursorHookKeysByStep.get(step);
                if (!cursorKeys || cursorKeys.size === 0)
                    continue;
                const filtered = scripts.filter((script) => {
                    const key = this.getHookKey(script);
                    if (cursorKeys.has(key)) {
                        this.logger.info(`Removed duplicate ${source} hook for ${step}: ${key}`);
                        return false;
                    }
                    return true;
                });
                if (filtered.length !== scripts.length) {
                    config.hooks[step] = filtered;
                }
            }
        };
        filterClaudeConfig(result.claudeUserHooks, "claude-user");
        filterClaudeConfig(result.claudeProjectHooks, "claude-project");
        filterClaudeConfig(result.claudeProjectLocalHooks, "claude-project-local");
    }
    /**
     * Parse and validate a Claude Code settings.json file.
     */
    parseClaudeConfig(configText, _source) {
        try {
            const parsed = JSON.parse(configText);
            if (!(0,hooks_dist/* isClaudeCodeSettingsJson */.DP)(parsed)) {
                return {};
            }
            const claudeHooks = (0,hooks_dist/* extractClaudeHooks */.eg)(parsed);
            if (!claudeHooks || Object.keys(claudeHooks).length === 0) {
                return {};
            }
            const config = (0,hooks_dist/* transformClaudeHooksToConfig */.sl)(claudeHooks, this.logger);
            const validation = (0,hooks_dist/* validateHooksConfig */.RV)(config);
            if (!validation.isValid) {
                return {
                    error: `Invalid transformed config: ${validation.errors.join("; ")}`,
                };
            }
            return { config };
        }
        catch (parseError) {
            return {
                error: `Failed to parse JSON: ${String(parseError)}`,
            };
        }
    }
    parseAndValidate(configText, source) {
        try {
            const config = this.parseJSONC(configText);
            const validation = (0,hooks_dist/* validateHooksConfig */.RV)(config);
            if (!validation.isValid) {
                const message = `Invalid ${source} config: ${validation.errors.join("; ")}`;
                return { error: message };
            }
            const validatedConfig = config;
            if (!validatedConfig.hooks) {
                const message = `Invalid ${source} config: missing 'hooks' property`;
                return { error: message };
            }
            return { config: validatedConfig };
        }
        catch (parseError) {
            const message = `Failed to parse ${source} config JSON: ${String(parseError)}`;
            return { error: message };
        }
    }
    parseJSONC(text) {
        const singleLineCommentRegex = /\/\/.*$/gm;
        let cleaned = text.replace(singleLineCommentRegex, "");
        const multiLineCommentRegex = /\/\*[\s\S]*?\*\//g;
        cleaned = cleaned.replace(multiLineCommentRegex, "");
        return JSON.parse(cleaned);
    }
    static getConfiguredSteps(config) {
        const steps = new Set();
        const allConfigs = [
            config.enterpriseHooks,
            config.teamHooks,
            config.userHooks,
            config.projectHooks,
            config.claudeUserHooks,
            config.claudeProjectHooks,
            config.claudeProjectLocalHooks,
        ];
        for (const hookConfig of allConfigs) {
            if (hookConfig?.hooks) {
                for (const step of Object.keys(hookConfig.hooks)) {
                    steps.add(step);
                }
            }
        }
        for (const entry of config.pluginHooks ?? []) {
            for (const step of Object.keys(entry.config.hooks)) {
                steps.add(step);
            }
        }
        return steps;
    }
}

;// ../hooks-exec/dist/config-tracker.js
/* unused harmony import specifier */ var config_tracker_HooksConfigLoader;

/**
 * Implementation of HooksConfigLease that provides access to a loaded configuration.
 */
class StaticHooksConfigLease {
    constructor(config) {
        this.config = config;
        this.configuredSteps = config_tracker_HooksConfigLoader.getConfiguredSteps(config);
    }
    getConfig() {
        return this.config;
    }
    hasHookForStep(step) {
        return this.configuredSteps.has(step);
    }
    getConfiguredSteps() {
        return new Set(this.configuredSteps);
    }
}
/**
 * No-op implementation of HooksConfigLease for when no hooks are configured.
 */
class NoopHooksConfigLease {
    getConfig() {
        return { errors: [] };
    }
    hasHookForStep(_step) {
        return false;
    }
    getConfiguredSteps() {
        return new Set();
    }
}
/**
 * Mutable implementation of HooksConfigLease that allows runtime config updates.
 * Used for non-blocking team hooks sync where config may be refreshed after startup.
 */
class MutableHooksConfigLeaseImpl {
    constructor(config) {
        this.config = config;
        this.configuredSteps = HooksConfigLoader.getConfiguredSteps(config);
    }
    getConfig() {
        return this.config;
    }
    hasHookForStep(step) {
        return this.configuredSteps.has(step);
    }
    getConfiguredSteps() {
        return new Set(this.configuredSteps);
    }
    setConfig(config) {
        this.config = config;
        this.configuredSteps = HooksConfigLoader.getConfiguredSteps(config);
    }
}

// EXTERNAL MODULE: external "node:perf_hooks"
var external_node_perf_hooks_ = __webpack_require__("node:perf_hooks");
// EXTERNAL MODULE: ../agent-exec/dist/node.js + 2 modules
var node = __webpack_require__("../agent-exec/dist/node.js");
;// ../hooks-carriers/dist/collect.js
/**
 * Carrier collection and mutation helpers. Pure proto manipulation,
 * browser-safe.
 *
 * These move carriers between the in-flight `meta.hookContextCollector`
 * buffer, per-tool exec results, and outbound `ConversationAction`s. The
 * shapes they consume (`{ hookContextCollector }`, `{ hookAdditionalContexts }`,
 * `ConversationAction`) are duck-typed at call sites so this module has no
 * dependency on the agent runtime.
 */
/**
 * Push `contexts` onto the `collector` array if both are non-empty. The
 * stop hook adapter and the tool-call hook collector both rely on this.
 */
function appendHookAdditionalContexts(collector, contexts) {
    if (collector !== undefined && contexts.length > 0) {
        collector.push(...contexts);
    }
}
/**
 * Copy a tool result's `hookAdditionalContexts` into the per-tool-call
 * `meta.hookContextCollector`, then return the result for fluent call sites.
 */
function collectHookContextsFrom(meta, result) {
    appendHookAdditionalContexts(meta.hookContextCollector, result.hookAdditionalContexts);
    return result;
}
/**
 * Attach carriers onto a `ConversationAction`'s
 * `UserMessage.hookAdditionalContexts`. No-op when contexts is empty or
 * the action is not a `userMessageAction`; throws when the action IS a
 * `userMessageAction` but its `userMessage` is unset, since a
 * `userMessageAction` without a `userMessage` is a malformed action
 * shape and silently dropping carriers in that case would lose hook
 * output without surfacing the caller's bug.
 */
function attachHookAdditionalContextsToUserMessageAction(action, contexts) {
    if (contexts.length === 0 || action.action.case !== "userMessageAction") {
        return;
    }
    const userMessage = action.action.value.userMessage;
    if (userMessage === undefined) {
        throw new Error("attachHookAdditionalContextsToUserMessageAction: userMessageAction is missing its UserMessage; cannot attach hook additional contexts.");
    }
    userMessage.hookAdditionalContexts.push(...contexts);
}
/**
 * Append `incoming` carriers onto a copy of `existing` and return the
 * combined array. Used by RequestContext writers that need to splice
 * new sessionStart context onto a result that may already carry sibling
 * events. No deduplication: duplicate event names are preserved so each
 * producer's carriers reach the model.
 */
function concatHookAdditionalContexts(existing, incoming) {
    return [...existing, ...incoming];
}

;// ../hooks-carriers/dist/errors.js
/**
 * Error types thrown by the carrier package.
 *
 * Kept separate from `factories.ts` so producers can `import type
 * { HookAdditionalContextTooLargeError }` for catch-narrowing without
 * pulling in the full factory module graph.
 */

/**
 * Thrown by the carrier factories when a producer attempts to construct a
 * `HookAdditionalContext` whose `content` exceeds
 * {@link HOOK_ADDITIONAL_CONTEXT_MAX_CHARS}. Carriers ride the wire and
 * land in the model prompt; we cap them at construction time so an
 * oversized payload never reaches downstream consumers, the prompt, or
 * disk.
 *
 * Producers catch this near their hook-execution boundary -- script
 * producers fail the hook (and honor `failClosed`); static injectors
 * (sessionStart RequestContext writers, beforeSubmitPrompt UserMessage
 * writers) log and drop the carrier so the request continues.
 */
class HookAdditionalContextTooLargeError extends Error {
    constructor(params) {
        super(`Hook additional_context for ${params.hookEventName} is ${params.actualLength} chars (max ${params.maxLength}).`);
        this.name = "HookAdditionalContextTooLargeError";
        this.hookEventName = params.hookEventName;
        this.actualLength = params.actualLength;
        this.maxLength = params.maxLength;
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/hook_additional_context_pb.js
var hook_additional_context_pb = __webpack_require__("../proto/dist/generated/agent/v1/hook_additional_context_pb.js");
;// ../hooks-carriers/dist/limits.js
/**
 * Size limits enforced at carrier construction time and at the
 * prompt-rendering / spill boundary.
 *
 * These bound the size of carrier `content` payloads. Producers either fit
 * within the inline cap or surface a {@link HookAdditionalContextTooLargeError}
 * from `errors.ts` — spill-to-disk is reserved for the prompt-side helpers
 * (`spillHookAdditionalContextOrInline`) which have a writer in hand.
 */
/**
 * Maximum size of any single carrier's `content` field, in characters.
 *
 * Enforced by the carrier factories in `factories.ts` at construction
 * time. Oversized content rejects synchronously rather than being
 * truncated or persisted somewhere unbounded.
 */
const HOOK_ADDITIONAL_CONTEXT_MAX_CHARS = 10_000;
/**
 * Hard upper bound on hook `additional_context` size at the spill boundary.
 * Content over this is dropped with a structured-log warn rather than written
 * to disk — protects against runaway hooks filling the user's filesystem.
 * 1 MB is a generous ceiling well above any plausible hook output we expect
 * to see; loosening later is a one-line change.
 */
const HOOK_ADDITIONAL_CONTEXT_HARD_MAX_CHARS = 1_000_000;

;// ../hooks-carriers/dist/spec.js
/* unused harmony import specifier */ var HOOK_STEPS_SUPPORTING_ADDITIONAL_CONTEXT;
/**
 * Per-step carrier metadata. The single source of truth for how each
 * `HookStep` translates into a `HookAdditionalContext` carrier on the wire.
 *
 * `undefined` entry === step does not carry `additional_context`. Reading
 * this map (rather than maintaining a parallel `isAdditionalContextHook`
 * list) is what `mergeHookResponses` and `createHookAdditionalContextsForStep`
 * use to stay drift-free.
 *
 * Outbound `hookEventName` is the `HookStep` value itself (camelCase). The
 * inbound Claude validation path is independent and lives in
 * `@anysphere/hooks/normalize.ts` via `CURSOR_STEP_TO_CLAUDE_EVENT`; it owns
 * Anthropic's PascalCase protocol literals separately.
 */

/**
 * Carrier-spec lookup keyed by `HookStep`. Built from the canonical
 * `HOOK_STEPS_SUPPORTING_ADDITIONAL_CONTEXT` set; throws at module init
 * if a supporting step's value is not part of
 * `HookStepAdditionalContextEventName`. This is the boundary check that
 * keeps the runtime set and the type union in lockstep.
 */
const HOOK_STEP_CARRIER_SPECS = Object.fromEntries(Array.from(hooks_dist/* HOOK_STEPS_SUPPORTING_ADDITIONAL_CONTEXT */.Qu).map((step) => {
    if (!isHookStepAdditionalContextEventName(step)) {
        throw new Error(`HOOK_STEPS_SUPPORTING_ADDITIONAL_CONTEXT lists ${step} but ` +
            `HookStepAdditionalContextEventName does not include it. Extend the ` +
            `Extract<> union in spec.ts.`);
    }
    return [step, { hookEventName: step }];
}));
function isHookStepAdditionalContextEventName(step) {
    return (step === hooks_dist/* HookStep */._E.sessionStart ||
        step === hooks_dist/* HookStep */._E.beforeSubmitPrompt ||
        step === hooks_dist/* HookStep */._E.preToolUse ||
        step === hooks_dist/* HookStep */._E.postToolUse ||
        step === hooks_dist/* HookStep */._E.postToolUseFailure);
}
/**
 * Returns true if the given step's response carries an
 * `additional_context: string`. Reads from the same source-of-truth set
 * that `mergeHookResponses` uses, so the two never drift.
 */
function supportsAdditionalContext(step) {
    return HOOK_STEPS_SUPPORTING_ADDITIONAL_CONTEXT.has(step);
}

;// ../hooks-carriers/dist/factories.js
/* unused harmony import specifier */ var factories_HOOK_STEP_CARRIER_SPECS;
/**
 * Carrier construction. One generic factory parameterized over `HookStep`
 * plus a literal-event-name overload for callers that build carriers
 * without a step (e.g. tests that synthesize arbitrary event names).
 *
 * Both factory entries enforce `HOOK_ADDITIONAL_CONTEXT_MAX_CHARS` from
 * `limits.ts` and throw `HookAdditionalContextTooLargeError` from
 * `errors.ts` for oversized payloads. This is the only choke point that
 * bounds the size of carrier content; there is no spill-to-disk path --
 * producers either fit within the cap or surface the throw to their
 * caller (script producers as a hook-execution failure, static injectors
 * as a logged drop).
 */




function normalizeHookAdditionalContext(content) {
    const normalized = content?.trim();
    return normalized !== undefined && normalized.length > 0 ? normalized : undefined;
}
/**
 * Generic per-step carrier factory. Returns a 1-element array when content
 * is non-empty, empty array otherwise. Prefer this entry point over the
 * literal-event-name overload below when a `HookStep` is available.
 *
 * Throws {@link HookAdditionalContextTooLargeError} when content exceeds
 * {@link HOOK_ADDITIONAL_CONTEXT_MAX_CHARS}.
 */
function createHookAdditionalContextsForStep(step, additionalContext) {
    const spec = factories_HOOK_STEP_CARRIER_SPECS[step];
    if (spec === undefined) {
        return [];
    }
    return createHookAdditionalContexts({
        hookEventName: spec.hookEventName,
        additionalContext,
    });
}
/**
 * Lower-level factory that takes a literal event name. Prefer
 * `createHookAdditionalContextsForStep` when you have a `HookStep` in hand
 * -- this overload exists for callers that build carriers without a step
 * (e.g. tests that construct arbitrary event names).
 *
 * Throws {@link HookAdditionalContextTooLargeError} when content exceeds
 * {@link HOOK_ADDITIONAL_CONTEXT_MAX_CHARS}.
 */
function createHookAdditionalContexts({ hookEventName, additionalContext, }) {
    const normalized = normalizeHookAdditionalContext(additionalContext);
    if (normalized === undefined) {
        return [];
    }
    if (normalized.length > HOOK_ADDITIONAL_CONTEXT_MAX_CHARS) {
        throw new HookAdditionalContextTooLargeError({
            hookEventName,
            actualLength: normalized.length,
            maxLength: HOOK_ADDITIONAL_CONTEXT_MAX_CHARS,
        });
    }
    return [
        new hook_additional_context_pb/* HookAdditionalContext */.C({
            hookEventName,
            content: normalized,
        }),
    ];
}

;// ../hooks-carriers/dist/hook-additional-context-render.js
/* unused harmony import specifier */ var sanitizeSystemReminderContent;
/* unused harmony import specifier */ var hook_additional_context_render_HOOK_ADDITIONAL_CONTEXT_MAX_CHARS;


/**
 * Render a hook-provided `additional_context` string as a hidden
 * `<system_reminder>` block. Used by every surface that injects hook context
 * into a prompt or tool result.
 *
 * Returns `undefined` for empty / whitespace-only content and for content
 * over `HOOK_ADDITIONAL_CONTEXT_MAX_CHARS` so callers get a single boolean
 * check on the result. When `onOversize` is supplied it is invoked with the
 * raw length so the surface can log the drop with its own structured logger.
 *
 * Content is run through {@link sanitizeSystemReminderContent} so a
 * hook that reflects attacker-controlled text into `additional_context`
 * cannot inject a literal `</system_reminder>` and escape the wrapper.
 */
function renderHookAdditionalContextSystemReminder(content, onOversize) {
    const normalized = content?.trim();
    if (!normalized) {
        return undefined;
    }
    if (normalized.length > hook_additional_context_render_HOOK_ADDITIONAL_CONTEXT_MAX_CHARS) {
        onOversize?.(normalized.length, hook_additional_context_render_HOOK_ADDITIONAL_CONTEXT_MAX_CHARS);
        return undefined;
    }
    const sanitized = sanitizeSystemReminderContent(normalized);
    return `<system_reminder>\n${sanitized}\n</system_reminder>`;
}

;// ../hooks-carriers/dist/hook-additional-context-spill.js
/* unused harmony import specifier */ var hook_additional_context_spill_renderHookAdditionalContextSystemReminder;
/* unused harmony import specifier */ var hook_additional_context_spill_HOOK_ADDITIONAL_CONTEXT_MAX_CHARS;
/* unused harmony import specifier */ var hook_additional_context_spill_HOOK_ADDITIONAL_CONTEXT_HARD_MAX_CHARS;


/**
 * Three-tier ladder for hook-provided `additional_context`:
 *
 *  - `<= HOOK_ADDITIONAL_CONTEXT_MAX_CHARS`: render inline as a
 *    `<system_reminder>` block (the existing behavior).
 *  - between the inline cap and `HOOK_ADDITIONAL_CONTEXT_HARD_MAX_CHARS`
 *    (when a `spillWriter` is provided): write the full content to a
 *    writer-managed file and return a `<system_reminder>` block that
 *    instructs the model to `Read` the spilled file.
 *  - otherwise: drop with a `reason` the caller can log.
 *
 * Empty / whitespace-only content returns `kind: "empty"` so callers can
 * distinguish "no hook context" from "context was dropped" in logs.
 */
async function spillHookAdditionalContextOrInline(content, opts = {}) {
    const normalized = content?.trim();
    if (!normalized) {
        return { kind: "empty" };
    }
    if (normalized.length <= hook_additional_context_spill_HOOK_ADDITIONAL_CONTEXT_MAX_CHARS) {
        const reminder = hook_additional_context_spill_renderHookAdditionalContextSystemReminder(normalized);
        // The renderer only returns undefined for empty/oversize inputs, neither
        // of which can happen on this branch — the assertion keeps the return
        // type tight without forcing every caller to null-check.
        return { kind: "inline", reminder: reminder };
    }
    if (normalized.length > hook_additional_context_spill_HOOK_ADDITIONAL_CONTEXT_HARD_MAX_CHARS) {
        return {
            kind: "dropped",
            reason: "exceeded_hard_max",
            actualLength: normalized.length,
        };
    }
    if (!opts.spillWriter) {
        return {
            kind: "dropped",
            reason: "no_spill_writer_configured",
            actualLength: normalized.length,
        };
    }
    let absPath;
    try {
        absPath = await opts.spillWriter(normalized);
    }
    catch (error) {
        return {
            kind: "dropped",
            reason: `spill_write_failed: ${error instanceof Error ? error.message : String(error)}`,
            actualLength: normalized.length,
        };
    }
    return {
        kind: "spilled",
        reminder: buildSpillReminder(absPath, normalized.length),
        absPath,
    };
}
function buildSpillReminder(absPath, actualLength) {
    const body = [
        `The beforeSubmitPrompt hook produced ${actualLength} characters of additional context, which exceeds the ${hook_additional_context_spill_HOOK_ADDITIONAL_CONTEXT_MAX_CHARS}-character inline cap.`,
        `The full content has been written to \`${absPath}\`.`,
        `Read that file now before responding so you can incorporate the context.`,
    ].join(" ");
    return `<system_reminder>\n${body}\n</system_reminder>`;
}

;// ../hooks-carriers/dist/render.js
/* unused harmony import specifier */ var render_sanitizeSystemReminderContent;
/**
 * Carrier rendering helpers (browser-safe).
 *
 * The actual prompt-side renderer in
 * `@anysphere/hooks/hook-additional-context-render.ts` calls a single-
 * content variant; this module renders arrays of carriers into the
 * `<system_reminder>` blocks the model sees.
 */

/** Trim and drop empty carrier bodies (no `<system_reminder>` wrapper). */
function renderHookAdditionalContextContents(hookAdditionalContexts) {
    return hookAdditionalContexts
        .map((context) => context.content.trim())
        .filter((content) => content.length > 0);
}
/**
 * Wrap one reminder body in the `<system_reminder>` block the model sees.
 * Returns `undefined` for empty / whitespace-only bodies.
 *
 * The body is run through {@link sanitizeSystemReminderContent} so text that
 * reflects attacker-controlled input (a hook echoing tool output, a tool
 * interpolating a model-chosen name) cannot inject a literal
 * `</system_reminder>` and escape the wrapper on the next turn.
 */
function renderSystemReminderBlock(content) {
    const normalized = content.trim();
    if (normalized.length === 0) {
        return undefined;
    }
    return `<system_reminder>\n${render_sanitizeSystemReminderContent(normalized)}\n</system_reminder>`;
}
/**
 * Render each carrier as a `<system_reminder>` block, dropping empty /
 * whitespace-only entries.
 */
function renderHookAdditionalContextSystemReminders(hookAdditionalContexts) {
    return renderHookAdditionalContextContents(hookAdditionalContexts).flatMap((content) => {
        const block = renderSystemReminderBlock(content);
        return block === undefined ? [] : [block];
    });
}
/**
 * Mutates both buffers in place. `textParts` is the tool-result message's
 * text accumulator; `toolResultContent` is the AI SDK multipart slot
 * rendered alongside it. No-op when contexts is empty.
 */
function appendHookContextRemindersToCoreToolResult(textParts, toolResultContent, contexts) {
    const reminders = renderHookAdditionalContextSystemReminders(contexts);
    for (const text of reminders) {
        textParts.push(text);
        toolResultContent.push({ type: "text", text });
    }
}

;// ../hooks-carriers/dist/index.js
/**
 * `@anysphere/hooks-carriers` -- the data layer between hook execution and
 * prompt rendering.
 *
 * This package owns the carrier proto (`HookAdditionalContext`) and every
 * helper that produces, attaches, merges, or renders carriers. It has zero
 * Node dependencies (only `@anysphere/hooks` for enum constants and
 * `@anysphere/proto` for the wire types) so workbench browser code can
 * import it directly without the `/browser` subentry dance.
 *
 * Architectural shape:
 *
 *   - `spec.ts`     - per-step carrier metadata + the `supportsAdditionalContext`
 *                     boundary check. Outbound `hookEventName` equals the
 *                     `HookStep` value (camelCase); the runtime set
 *                     `HOOK_STEPS_SUPPORTING_ADDITIONAL_CONTEXT` from
 *                     `@anysphere/hooks` is kept in lockstep with the
 *                     `HookStepAdditionalContextEventName` Extract<> union.
 *   - `factories.ts`- one generic factory parameterized over `HookStep` plus
 *                     a literal-event-name overload. Enforces the
 *                     `HOOK_ADDITIONAL_CONTEXT_MAX_CHARS` cap from `limits.ts`,
 *                     throwing `HookAdditionalContextTooLargeError` from
 *                     `errors.ts` for oversized payloads.
 *   - `limits.ts`   - size caps enforced at carrier construction time.
 *   - `errors.ts`   - error types thrown by the carrier factories; importable
 *                     standalone so producers can catch-narrow without
 *                     pulling in factory module graph.
 *   - `collect.ts`  - mutation/collection helpers for moving carriers between
 *                     the in-flight collector, exec results, and outbound
 *                     `ConversationAction`s.
 *   - `render.ts`   - render carriers into the `<system_reminder>` blocks
 *                     the model sees.
 *   - `request-context-executor.ts` - `RequestContextExecutor` decorator that
 *                     injects sessionStart carriers and configured-steps info.
 *
 * `index.ts` is a barrel-only file; it does not own behavior. New helpers go
 * in the module that matches their concern.
 */









;// ../hooks-exec/dist/generic-hooks.js







const generic_hooks_logger = (0,logger/* createLogger */.h)("generic-hooks");
/**
 * Build a carrier array from a hook script's `additional_context`, but
 * swallow {@link HookAdditionalContextTooLargeError} so a misbehaving
 * script (oversize payload) does not crash the per-tool hook helpers.
 * Returns an empty array on drop and logs at warn level so the operator
 * can spot offenders.
 *
 * Post-hook callers (postToolUse, postToolUseFailure) want this lenient
 * behavior because the tool has already executed and the carrier is
 * advisory output -- dropping it is preferable to escalating into a
 * failure path that the tool result cannot represent. The pre-hook
 * caller (preToolUse) uses {@link createHookAdditionalContexts}
 * directly so the throw rides the existing try/catch boundary and
 * `hasFailClosedHooksForStep` gets to choose whether to block the call.
 */
function safeCreateHookAdditionalContextsForPostHook(ctx, toolName, hookEventName, additionalContext) {
    try {
        return createHookAdditionalContexts({
            hookEventName,
            additionalContext,
        });
    }
    catch (error) {
        if (error instanceof HookAdditionalContextTooLargeError) {
            generic_hooks_logger.warn(ctx, `${hookEventName} additional_context exceeded max size; dropping carrier`, {
                toolName,
                hookEventName,
                actualLength: error.actualLength,
                maxLength: error.maxLength,
            });
            return [];
        }
        throw error;
    }
}
/**
 * Rounds a duration in milliseconds to 3 decimal places.
 */
const roundDurationMs = (value) => Math.round(value * 1000) / 1000;
// ============================================================================
// Shared Hook Infrastructure
// ============================================================================
/**
 * Creates hook helper functions for firing postToolUse and postToolUseFailure hooks.
 * Shared between streaming and non-streaming executors.
 */
function createHookHelpers(ctx, hookExecutor, toolName, hookContext) {
    let { toolInput, extraHookFields, hookContextCollector } = hookContext;
    const { baseHookRequest, toolUseId } = hookContext;
    const fireFailureAsync = async (durationMs, errorMessage, failureType, isInterrupt = false) => {
        try {
            const response = await (0,node/* runWithHookAbortSignal */.vv)(ctx.signal, () => hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.postToolUseFailure, {
                ...baseHookRequest,
                tool_name: toolName,
                tool_input: toolInput,
                error_message: errorMessage,
                failure_type: failureType,
                duration: durationMs,
                tool_use_id: toolUseId,
                is_interrupt: isInterrupt,
                ...extraHookFields,
            }));
            appendHookAdditionalContexts(hookContextCollector, safeCreateHookAdditionalContextsForPostHook(ctx, toolName, hooks_dist/* HookStep */._E.postToolUseFailure, response?.additional_context));
        }
        catch (error) {
            generic_hooks_logger.warn(ctx, "postToolUseFailure hook error", {
                toolName,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };
    const fireSuccessAsync = async (durationMs, toolOutput) => {
        try {
            const response = await (0,node/* runWithHookAbortSignal */.vv)(ctx.signal, () => hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.postToolUse, {
                ...baseHookRequest,
                tool_name: toolName,
                tool_input: toolInput,
                tool_output: toolOutput,
                duration: durationMs,
                tool_use_id: toolUseId,
                ...extraHookFields,
            }));
            appendHookAdditionalContexts(hookContextCollector, safeCreateHookAdditionalContextsForPostHook(ctx, toolName, hooks_dist/* HookStep */._E.postToolUse, response?.additional_context));
        }
        catch (error) {
            generic_hooks_logger.warn(ctx, "postToolUse hook error", {
                toolName,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };
    return {
        fireFailureAsync,
        fireSuccessAsync,
        getToolInput: () => toolInput,
        setToolInput: (newInput) => {
            toolInput = newInput;
        },
        setExtraHookFields: (newFields) => {
            extraHookFields = newFields;
            // Also update hookContext so post-execution hook callbacks receive updated values
            hookContext.extraHookFields = newFields;
        },
    };
}
/**
 * Initialize hook context and helpers for executor execution.
 * Shared between streaming and non-streaming executors.
 *
 * The collector is sourced in priority order:
 *   1. `options.hookContextCollector` (the new outer-ToolCall flush path
 *      passed by `InteractionHandler.executeToolCall`),
 *   2. `config.getHookContextCollector?.(args)` (legacy per-args collector
 *      still used by streaming paths that emit an in-stream
 *      `ShellStreamHookContext` event for the consumer to drain),
 *   3. a fresh `[]` (so the wrapper can still push without a NPE; the
 *      contents are dropped if no caller adopts the array).
 *
 * Wrappers no longer attach the collected carriers onto `result.hookAdditionalContexts`
 * because the per-`*Result` proto fields are gone -- the central flush at
 * `InteractionHandler.executeToolCall` now writes them onto the outer
 * `ToolCall.hookAdditionalContexts`.
 */
function initializeHooks(ctx, args, hookExecutor, baseHookRequestExtractor, config, options) {
    const baseHookRequest = baseHookRequestExtractor(ctx);
    const toolUseId = config.getToolCallId?.(args) ?? (0,external_node_crypto_.randomUUID)();
    const extraHookFields = config.getExtraHookFields?.(args) ?? {};
    const hookContext = {
        baseHookRequest,
        toolUseId,
        toolInput: config.createToolInput(args),
        extraHookFields,
        hookContextCollector: options?.hookContextCollector ?? config.getHookContextCollector?.(args) ?? [],
    };
    const helpers = createHookHelpers(ctx, hookExecutor, config.toolName, hookContext);
    return { hookContext, helpers };
}
/**
 * Runs the preToolUse hook and any pre-execution hooks.
 * Returns whether to continue execution or a rejected result.
 */
async function runPreHooks(ctx, args, hookExecutor, hookContext, helpers, config, createRejected, runPreExecutionHooks) {
    const { baseHookRequest, toolUseId, extraHookFields } = hookContext;
    try {
        const preToolUseResponse = await (0,node/* runWithHookAbortSignal */.vv)(ctx.signal, () => hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.preToolUse, {
            ...baseHookRequest,
            tool_name: config.toolName,
            tool_input: helpers.getToolInput(),
            tool_use_id: toolUseId,
            ...extraHookFields,
        }));
        // Apply the script's authoritative decisions BEFORE building the
        // additional_context carrier. createHookAdditionalContexts throws
        // HookAdditionalContextTooLargeError when content exceeds the cap;
        // if we built the carrier first, an oversize payload from a script
        // that ALSO returned `permission: "deny"` would land in the outer
        // catch and (when no fail-closed hook exists) silently allow the
        // tool to run. Deny is sticky -- enforce it first, then attempt the
        // carrier build under its own oversize-tolerant try/catch.
        if (preToolUseResponse?.permission === "deny") {
            const baseReason = preToolUseResponse.user_message || `${config.toolName} blocked by preToolUse hook`;
            const denialMessage = appendAgentDenialNote(baseReason);
            // Still surface the deny response's `additional_context` to the model
            // so the rejected result carries the script's explanation. Same
            // oversize-tolerant pattern as the allow path below.
            try {
                appendHookAdditionalContexts(hookContext.hookContextCollector, createHookAdditionalContexts({
                    hookEventName: hooks_dist/* HookStep */._E.preToolUse,
                    additionalContext: preToolUseResponse.additional_context,
                }));
            }
            catch (carrierError) {
                if (carrierError instanceof HookAdditionalContextTooLargeError) {
                    generic_hooks_logger.warn(ctx, "preToolUse deny additional_context exceeded max size; dropping carrier", {
                        toolName: config.toolName,
                        actualLength: carrierError.actualLength,
                        maxLength: carrierError.maxLength,
                    });
                }
                else {
                    throw carrierError;
                }
            }
            await helpers.fireFailureAsync(0, baseReason, "permission_denied");
            return {
                type: "rejected",
                result: createRejected(args, denialMessage),
                reason: denialMessage,
            };
        }
        if (preToolUseResponse?.updated_input && config.applyUpdatedInput) {
            config.applyUpdatedInput(args, preToolUseResponse.updated_input);
            // Re-create tool input with updated args
            helpers.setToolInput(config.createToolInput(args));
            // Re-compute extra hook fields (e.g., cwd) from updated args
            if (config.getExtraHookFields) {
                helpers.setExtraHookFields(config.getExtraHookFields(args));
            }
        }
        // Allow-path carrier build: deliberately NOT wrapped in a local
        // try/catch. createHookAdditionalContexts throws
        // HookAdditionalContextTooLargeError on oversize content, and we want
        // that throw to ride the outer try/catch boundary so
        // hasFailClosedHooksForStep gets to decide whether to reject the
        // tool call (failClosed step) or log+drop (non-failClosed step).
        // Swallowing it here would silently demote a failClosed-blocked
        // call into a successful one.
        appendHookAdditionalContexts(hookContext.hookContextCollector, createHookAdditionalContexts({
            hookEventName: hooks_dist/* HookStep */._E.preToolUse,
            additionalContext: preToolUseResponse?.additional_context,
        }));
    }
    catch (error) {
        const hasFailClosed = hookExecutor.hasFailClosedHooksForStep?.(hooks_dist/* HookStep */._E.preToolUse, config.toolName) ?? false;
        const isOversize = error instanceof HookAdditionalContextTooLargeError;
        const detailPrefix = isOversize
            ? "preToolUse additional_context exceeded max size"
            : "preToolUse hook failed";
        if (hasFailClosed) {
            const detail = error instanceof Error ? error.message : "preToolUse hook error";
            const reason = formatFailClosedBlockReason(`${detailPrefix}: ${detail}`);
            await helpers.fireFailureAsync(0, reason, "error");
            return { type: "rejected", result: createRejected(args, reason), reason };
        }
        generic_hooks_logger.warn(ctx, isOversize
            ? "preToolUse additional_context exceeded max size; dropping carrier"
            : "preToolUse hook error", {
            toolName: config.toolName,
            error: error instanceof Error ? error.message : String(error),
            ...(isOversize
                ? {
                    actualLength: error.actualLength,
                    maxLength: error.maxLength,
                }
                : {}),
        });
    }
    // Run any pre-execution hooks (e.g., beforeShellExecution)
    if (runPreExecutionHooks) {
        try {
            const rejectedResult = await runPreExecutionHooks({
                ctx,
                args,
                baseHookRequest,
                hookExecutor,
                toolInput: helpers.getToolInput(),
                toolUseId,
                extraHookFields: hookContext.extraHookFields,
            });
            if (rejectedResult !== undefined) {
                // Fire postToolUseFailure for consistency with the throwing approach
                // (HookDeniedError also fires this hook via helpers.fireFailureAsync)
                const reason = "Pre-execution hook returned rejection";
                await helpers.fireFailureAsync(0, reason, "permission_denied");
                return {
                    type: "rejected",
                    result: rejectedResult,
                    reason,
                };
            }
        }
        catch (error) {
            if (isBlockingHookError(error)) {
                await helpers.fireFailureAsync(0, error.reason, error.failureType);
                return {
                    type: "rejected",
                    result: createRejected(args, error.reason),
                    reason: error.reason,
                };
            }
            // Re-throw non-blocking errors (fail-closed for security-sensitive hooks)
            throw error;
        }
    }
    return { type: "continue" };
}
/**
 * Common implementation for getToolCallId that extracts from args.toolCallId.
 */
function getToolCallIdFromArgs(args) {
    return args.toolCallId;
}
// ============================================================================
// Non-Streaming Executor
// ============================================================================
/**
 * Creates an executor wrapper that applies hooks before and after execution.
 *
 * This is a generic implementation that reduces boilerplate by extracting the
 * common hook execution pattern into a reusable function. Each tool only needs
 * to provide a configuration object describing its specific behavior.
 *
 * The execution flow is:
 * 1. Initialize hook context and helpers
 * 2. Execute preToolUse hook
 * 3. Handle denial (return rejected result) or apply updated_input
 * 4. Run optional pre-execution hooks (e.g., beforeShellExecution)
 * 5. Execute the inner executor with timing
 * 6. Run optional post-execution hooks (e.g., beforeReadFile)
 * 7. Fire postToolUse on success or postToolUseFailure on failure
 *
 * @param innerExecutor The wrapped executor that performs the actual operation
 * @param hookExecutor The hook executor for running hooks
 * @param baseHookRequestExtractor Function to extract base hook request fields from context
 * @param config Configuration for this specific tool's hook behavior
 * @returns A new executor that wraps the inner executor with hooks
 */
function createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, config) {
    return {
        async execute(ctx, args, options) {
            const { hookContext, helpers } = initializeHooks(ctx, args, hookExecutor, baseHookRequestExtractor, config, options);
            // Run preToolUse and pre-execution hooks
            let preHooksResult;
            try {
                preHooksResult = (await runPreHooks(ctx, args, hookExecutor, hookContext, helpers, config, config.createRejectedResult, config.runPreExecutionHooks));
            }
            catch (error) {
                config.runCleanup?.(hookContext.toolUseId);
                throw error;
            }
            if (preHooksResult.type === "rejected") {
                // Run cleanup before returning (pre-execution hooks may have stored state)
                config.runCleanup?.(hookContext.toolUseId);
                return preHooksResult.result;
            }
            const executionStartTimeMs = external_node_perf_hooks_.performance.now();
            try {
                const result = await innerExecutor.execute(ctx, args, options);
                const executionDurationMs = roundDurationMs(external_node_perf_hooks_.performance.now() - executionStartTimeMs);
                // Run any post-execution hooks (e.g., afterShellExecution)
                if (config.runPostExecutionHooks) {
                    try {
                        const transformedResult = await config.runPostExecutionHooks({
                            ctx,
                            args,
                            result,
                            baseHookRequest: hookContext.baseHookRequest,
                            hookExecutor,
                            toolInput: helpers.getToolInput(),
                            toolUseId: hookContext.toolUseId,
                            executionDurationMs,
                            extraHookFields: hookContext.extraHookFields,
                        });
                        if (transformedResult !== undefined) {
                            // Transformed success result - fire postToolUse and return
                            await helpers.fireSuccessAsync(executionDurationMs, JSON.stringify(config.createSuccessOutput(args, transformedResult)));
                            // Run cleanup before returning
                            config.runCleanup?.(hookContext.toolUseId);
                            return transformedResult;
                        }
                    }
                    catch (error) {
                        if (isBlockingHookError(error)) {
                            await helpers.fireFailureAsync(executionDurationMs, error.reason, error.failureType);
                            // Run cleanup before returning
                            config.runCleanup?.(hookContext.toolUseId);
                            return config.createRejectedResult(args, error.reason);
                        }
                        generic_hooks_logger.warn(ctx, "postExecutionHooks error", {
                            toolName: config.toolName,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                }
                if (config.isSuccess(result)) {
                    await helpers.fireSuccessAsync(executionDurationMs, JSON.stringify(config.createSuccessOutput(args, result)));
                }
                else {
                    await helpers.fireFailureAsync(executionDurationMs, config.getErrorMessage(result), config.getFailureType?.(result) ?? "error", config.isInterrupt?.(result) ?? false);
                }
                // Run cleanup before returning
                config.runCleanup?.(hookContext.toolUseId);
                return result;
            }
            catch (error) {
                const executionDurationMs = roundDurationMs(external_node_perf_hooks_.performance.now() - executionStartTimeMs);
                await helpers.fireFailureAsync(executionDurationMs, error instanceof Error ? error.message : String(error), "error");
                // Run cleanup before throwing
                config.runCleanup?.(hookContext.toolUseId);
                throw error;
            }
        },
    };
}
// ============================================================================
// Streaming Executor
// ============================================================================
/**
 * Creates a streaming executor wrapper that applies hooks before and after execution.
 *
 * The execution flow is:
 * 1. Initialize hook context and helpers
 * 2. Execute preToolUse hook
 * 3. Handle denial (yield rejected event) or apply updated_input
 * 4. Run optional pre-execution hooks (e.g., beforeShellExecution) (fail-closed)
 * 5. Stream events from the inner executor, collecting results
 * 6. Run optional post-execution hooks (e.g., afterShellExecution)
 * 7. Fire postToolUse on success or postToolUseFailure on failure/abort
 */
function createStreamingExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, config) {
    return {
        async *execute(ctx, args, options) {
            const { hookContext, helpers } = initializeHooks(ctx, args, hookExecutor, baseHookRequestExtractor, config, options);
            // Streaming pre-execution hooks don't return a result, just void or throw
            const streamingPreHookRunner = config.runPreExecutionHooks
                ? async (params) => {
                    await config.runPreExecutionHooks(params);
                    return undefined;
                }
                : undefined;
            // Run preToolUse and pre-execution hooks
            const preHooksResult = await runPreHooks(ctx, args, hookExecutor, hookContext, helpers, config, (a, reason) => config.createRejectedEvent(a, reason), streamingPreHookRunner);
            if (preHooksResult.type === "rejected") {
                yield preHooksResult.result;
                for (const hookEvent of buildHookContextEvents(config, hookContext)) {
                    yield hookEvent;
                }
                return;
            }
            // Execute the inner streaming executor
            const executionStartTimeMs = external_node_perf_hooks_.performance.now();
            const collector = config.createResultCollector();
            let hasError = false;
            try {
                for await (const event of innerExecutor.execute(ctx, args, options)) {
                    collector.onEvent(event);
                    yield event;
                }
            }
            catch (error) {
                hasError = true;
                const executionDurationMs = roundDurationMs(external_node_perf_hooks_.performance.now() - executionStartTimeMs);
                const errorMessage = error instanceof Error ? error.message : String(error);
                await helpers.fireFailureAsync(executionDurationMs, errorMessage, "error");
                for (const hookEvent of buildHookContextEvents(config, hookContext)) {
                    yield hookEvent;
                }
                throw error;
            }
            const executionDurationMs = roundDurationMs(external_node_perf_hooks_.performance.now() - executionStartTimeMs);
            // Run post-execution hooks (e.g., afterShellExecution)
            if (config.runPostExecutionHooks) {
                try {
                    await config.runPostExecutionHooks({
                        ctx,
                        args,
                        baseHookRequest: hookContext.baseHookRequest,
                        hookExecutor,
                        toolInput: helpers.getToolInput(),
                        toolUseId: hookContext.toolUseId,
                        extraHookFields: hookContext.extraHookFields,
                        collector,
                        executionDurationMs,
                    });
                }
                catch (error) {
                    // Log but don't block on post-execution hook errors (fail-open)
                    generic_hooks_logger.warn(ctx, "postExecutionHooks error", {
                        toolName: config.toolName,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            // Fire final hook based on success/abort status. Await so we capture
            // any additional_context the hook returns before emitting the
            // side-channel hookContext event below.
            if (!hasError) {
                if (collector.isAborted()) {
                    await helpers.fireFailureAsync(executionDurationMs, "Command was aborted", "error", true);
                }
                else if (config.isStreamSuccess?.(collector) ?? true) {
                    await helpers.fireSuccessAsync(executionDurationMs, JSON.stringify(config.createSuccessOutput(args, collector)));
                }
                else {
                    const errorMessage = config.getStreamErrorMessage?.(args, collector) ??
                        `Command failed with exit code ${collector.getExitCode()}`;
                    await helpers.fireFailureAsync(executionDurationMs, errorMessage, "error");
                }
            }
            for (const hookEvent of buildHookContextEvents(config, hookContext)) {
                yield hookEvent;
            }
        },
    };
}
/**
 * Helper for streaming wrappers: yield a single side-channel hookContext
 * event carrying every additional_context collected from pre/post/failure
 * hooks during this invocation. The generator's caller (server-side tool
 * consumer) accumulates these into its `meta.hookContextCollector` so they
 * land on the CoreMessage tool-result, matching the batch-tool path.
 *
 * Returns at most one event: an empty collector or a config without
 * `createHookContextEvent` yields nothing. Generator form so the caller
 * stays a `for ... yield` site.
 */
function* buildHookContextEvents(config, hookContext) {
    const contexts = hookContext.hookContextCollector;
    if (!config.createHookContextEvent || contexts === undefined || contexts.length === 0) {
        return;
    }
    yield config.createHookContextEvent(contexts);
}

;// ../hooks-exec/dist/hook-additional-context-spill-node.js
/* unused harmony import specifier */ var hook_additional_context_spill_node_randomUUID;
/* unused harmony import specifier */ var mkdir;
/* unused harmony import specifier */ var writeFile;
/* unused harmony import specifier */ var hook_additional_context_spill_node_join;



/**
 * Build a `node:fs/promises`-backed writer that drops oversized
 * beforeSubmitPrompt hook context into `<agentToolsDir>/<uuid>.txt`. Matches
 * the convention used by `writeToAgentToolsFile` in `@anysphere/agent-exec`
 * — same directory, same extension — so `cleanupOldAgentData` sweeps both
 * sets of files together (on surfaces where that cleanup is wired).
 *
 * Callers are responsible for computing `agentToolsDir` for the current
 * workspace (typically `~/.cursor/projects/<slug>/agent-tools/`).
 */
function createNodeSpillWriter(agentToolsDir) {
    return async (content) => {
        await mkdir(agentToolsDir, { recursive: true });
        const absPath = hook_additional_context_spill_node_join(agentToolsDir, `${hook_additional_context_spill_node_randomUUID()}.txt`);
        await writeFile(absPath, content, { encoding: "utf8", flag: "wx" });
        return absPath;
    };
}

;// ../hooks-exec/dist/safe-config-path.js
/* unused harmony import specifier */ var lstatSync;



/**
 * Returns true if any path component below `trustedRoot` is a symbolic link.
 *
 * Used to refuse loading Cursor/Claude hook configs through symlink aliases
 * (H1 #3724847 / SECX-2560): sandboxed agents can create `.claude -> decoy`
 * and plant `settings.json` in the decoy, bypassing write protection on
 * JSON files under `.claude`.
 *
 * `trustedRoot` itself and its ancestors are intentionally not inspected.
 * Those paths are part of the user-admitted workspace environment and may
 * legitimately contain symlinks (for example, `/tmp` on macOS).
 *
 * Intermediate directory symlinks are not visible via `lstat(finalPath)` alone,
 * so each prefix must be checked independently.
 */
function prefixesBelowTrustedRoot(absolutePath, trustedRoot) {
    const resolved = external_node_path_.resolve(absolutePath);
    const resolvedRoot = external_node_path_.resolve(trustedRoot);
    const relative = external_node_path_.relative(resolvedRoot, resolved);
    if (relative.length === 0 ||
        relative === ".." ||
        relative.startsWith(`..${external_node_path_.sep}`) ||
        external_node_path_.isAbsolute(relative)) {
        return "unsafe";
    }
    const parts = relative.split(external_node_path_.sep).filter((part) => part.length > 0);
    const prefixes = [];
    let current = resolvedRoot;
    for (const part of parts) {
        current = external_node_path_.join(current, part);
        prefixes.push(current);
    }
    return prefixes;
}
function isMissingPathError(err) {
    const code = err.code;
    return code === "ENOENT" || code === "ENOTDIR";
}
async function pathContainsSymlink(absolutePath, trustedRoot) {
    const prefixes = prefixesBelowTrustedRoot(absolutePath, trustedRoot);
    if (prefixes === "unsafe") {
        return true;
    }
    for (const current of prefixes) {
        try {
            const st = await (0,promises_.lstat)(current);
            if (st.isSymbolicLink()) {
                return true;
            }
        }
        catch (err) {
            // Fail closed: missing/unresolvable components are treated as unsafe so
            // callers that already saw exists()===true cannot load through a race
            // or broken symlink chain.
            if (isMissingPathError(err)) {
                return true;
            }
            throw err;
        }
    }
    return false;
}
/** Sync form for sync loaders such as headless disk `hooks.json`. */
function pathContainsSymlinkSync(absolutePath, trustedRoot) {
    const prefixes = prefixesBelowTrustedRoot(absolutePath, trustedRoot);
    if (prefixes === "unsafe") {
        return true;
    }
    for (const current of prefixes) {
        try {
            const st = lstatSync(current);
            if (st.isSymbolicLink()) {
                return true;
            }
        }
        catch (err) {
            if (isMissingPathError(err)) {
                return true;
            }
            throw err;
        }
    }
    return false;
}

;// ../hooks-exec/dist/node-file-reader.js


/**
 * Node.js implementation of FileReader using fs.promises.
 *
 * This implementation reads files from the local filesystem using Node.js APIs.
 */
class NodeFileReader {
    /**
     * Read a file and return its contents as a string.
     * Returns undefined if the file doesn't exist.
     */
    async readFile(path) {
        try {
            const content = await promises_.readFile(path, "utf-8");
            return content;
        }
        catch (error) {
            // Return undefined if file doesn't exist
            if (error?.code === "ENOENT") {
                return undefined;
            }
            // Re-throw other errors
            throw error;
        }
    }
    /**
     * Check if a file exists at the given path.
     */
    async exists(path) {
        try {
            await promises_.access(path);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * True when a path component below `trustedRoot` is a symlink.
     */
    async pathContainsSymlink(path, trustedRoot) {
        return pathContainsSymlink(path, trustedRoot);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/request_context_exec_pb.js + 3 modules
var request_context_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/request_context_exec_pb.js");
;// ../hooks-exec/dist/request-context.js

/**
 * Wraps a RequestContextExecutor to inject hooks additional context into the result.
 *
 * This is used in the CLI path to inject context from sessionStart hooks into
 * the request context that is passed to the agent conversation.
 *
 * The additional context is provided as a promise that resolves when the
 * sessionStart hook completes. This allows the UI to render immediately while
 * the hook runs asynchronously, but ensures the context is available when the
 * first request is made (by awaiting the promise in execute()).
 *
 * When teamHooksReadyPromise is provided, it is awaited before the first request
 * so team hooks are loaded and merged before building request context.
 *
 * When hooksConfigLease is provided, the configured hook steps are injected into
 * the request context so the server can check for hook existence without round trips.
 */
class RequestContextExecutorWithHooksContext {
    constructor(innerExecutor, hooksAdditionalContextPromise, teamHooksReadyPromise, hooksConfigLease) {
        this.innerExecutor = innerExecutor;
        this.hooksAdditionalContextPromise = hooksAdditionalContextPromise;
        this.teamHooksReadyPromise = teamHooksReadyPromise;
        this.hooksConfigLease = hooksConfigLease;
    }
    async execute(ctx, args, options) {
        if (this.teamHooksReadyPromise) {
            await this.teamHooksReadyPromise;
        }
        const result = await this.innerExecutor.execute(ctx, args, options);
        // Await the promise - this blocks until sessionStart hook completes.
        // The promise is already resolved for subsequent requests.
        const hooksAdditionalContext = await this.hooksAdditionalContextPromise;
        // Get configured hook steps if lease is available
        const hooksConfig = this.hooksConfigLease
            ? new request_context_exec_pb/* HooksConfigInfo */.Jy({
                configuredSteps: Array.from(this.hooksConfigLease.getConfiguredSteps()),
            })
            : undefined;
        // Only create new RequestContext if we have something to inject
        if (result.result.case === "success" && (hooksAdditionalContext || hooksConfig)) {
            const requestContext = result.result.value.requestContext;
            const updatedRequestContext = new request_context_exec_pb/* RequestContext */.bb({
                ...requestContext,
                ...(hooksAdditionalContext && { hooksAdditionalContext }),
                ...(hooksConfig && { hooksConfig }),
            });
            return new request_context_exec_pb/* RequestContextResult */._G({
                result: {
                    case: "success",
                    value: new request_context_exec_pb/* RequestContextSuccess */.yW({
                        requestContext: updatedRequestContext,
                        servedFromDiskCache: result.result.value.servedFromDiskCache,
                    }),
                },
            });
        }
        return result;
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js
var background_shell_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/background_shell_exec_pb.js");
// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/sandbox_pb.js
var sandbox_pb = __webpack_require__("../proto/dist/generated/agent/v1/sandbox_pb.js");
;// ../hooks-exec/dist/sandbox.js

/**
 * Check if a sandbox policy indicates sandboxed execution.
 * Sandbox is active if a policy is specified and it's not INSECURE_NONE or UNSPECIFIED.
 */
function isSandboxed(policy) {
    if (!policy) {
        return false;
    }
    return (policy.type !== sandbox_pb/* SandboxPolicy_Type */.vc.INSECURE_NONE &&
        policy.type !== sandbox_pb/* SandboxPolicy_Type */.vc.UNSPECIFIED);
}

;// ../hooks-exec/dist/tool-names.js
/**
 * Tool names for hooks configuration.
 *
 * Note: Some tools have different names depending on the prompt version
 * (e.g., "Shell" vs "run_terminal_cmd"). We use the canonical/latest names here.
 *
 */
const HooksToolName = {
    // File operations
    Read: "Read",
    Write: "Write",
    Delete: "Delete",
    LS: "List",
    // Search
    Grep: "Grep",
    // Shell operations
    /** User-facing shell tool name. All shell executors (streaming, non-streaming, background) use this. */
    Shell: "Shell",
    WriteShellStdin: "WriteShellStdin",
    // Web operations
    /** The simple fetch tool (lowercase "fetch" in agent) */
    Fetch: "Fetch",
    // Diagnostics
    ReadLints: "ReadLints",
    // MCP operations
    ListMcpResources: "ListMcpResources",
    FetchMcpResource: "FetchMcpResource",
    // Computer use
    /** Maps to "computer" in the agent, but we use ComputerUse for clarity in hooks */
    ComputerUse: "ComputerUse",
    // Screen recording
    RecordScreen: "RecordScreen",
};

;// ../hooks-exec/dist/tool-hook-executors/shell-permission.js



// beforeShellExecution permission: "ask" forces a local permission prompt only where
// InteractivePermissionsService and a real PendingDecisionProvider exist (CLI, IDE ext host).
// Exec-daemon currently auto-approves all shell commands via DaemonPermissionsService and
// MockDecisionProvider. Proto transport makes hook state durable across RPC, but does not,
// by itself, create human review in cloud/container execution. Follow-up required:
// fail-closed reject or client-side approval propagation.
async function runBeforeShellExecutionPermissionHook({ hookExecutor, baseHookRequest, toolUseId, command, cwd, sandbox, }) {
    const beforeHookResponse = await hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.beforeShellExecution, {
        ...baseHookRequest,
        command,
        cwd,
        sandbox,
        tool_use_id: toolUseId,
    });
    if (beforeHookResponse?.permission === "deny") {
        const reason = createHookDenialMessage("Command execution", beforeHookResponse.user_message);
        throw new HookDeniedError(reason);
    }
    if (beforeHookResponse?.permission === "ask") {
        return (0,dist/* createForcePromptHookApprovalRequirement */.$bB)(beforeHookResponse.user_message);
    }
    return undefined;
}

;// ../hooks-exec/dist/tool-hook-executors/background-shell.js







/**
 * Hook configuration for the BackgroundShell executor.
 * Includes beforeShellExecution hook and cwd extra field.
 * Note: This is an internal executor, not directly user-facing.
 */
const backgroundShellHooksConfig = {
    toolName: HooksToolName.Shell,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => {
        const cwd = args.workingDirectory || "";
        return {
            command: args.command,
            cwd,
        };
    },
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.command === "string") {
            args.command = updatedInput.command;
        }
        if (typeof updatedInput.cwd === "string") {
            args.workingDirectory = updatedInput.cwd;
        }
    },
    createRejectedResult: (args, reason) => new background_shell_exec_pb/* BackgroundShellSpawnResult */.Lt({
        result: {
            case: "rejected",
            value: new shell_exec_pb/* ShellRejected */.pZ({
                command: args.command,
                workingDirectory: args.workingDirectory,
                reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "error":
                return result.result.value.error || "BackgroundShell error";
            case "rejected":
                return result.result.value.reason || "BackgroundShell rejected";
            case "permissionDenied":
                return "Permission denied";
            case "sandboxUnsupported":
                return `Sandbox policy unsupported on this host: ${result.result.value.reason}`;
            default:
                return "Unknown error";
        }
    },
    createSuccessOutput: (_args, result) => {
        if (result.result.case === "success") {
            return {
                shell_id: result.result.value.shellId,
                pid: result.result.value.pid,
            };
        }
        return { success: true };
    },
    getExtraHookFields: (args) => {
        const cwd = args.workingDirectory || "";
        return { cwd };
    },
    /**
     * Run beforeShellExecution hook before execution.
     * Sandbox is derived from args.sandboxPolicy (same logic as Shell/ShellStream).
     * Throws HookDeniedError if hook denies execution (generic-hooks handles the rest).
     */
    runPreExecutionHooks: async (params) => {
        const { args, baseHookRequest, hookExecutor, toolUseId } = params;
        const cwd = args.workingDirectory || "";
        const sandbox = isSandboxed(args.sandboxPolicy);
        (0,dist/* setShellHookApprovalRequirement */.oAs)(args, await runBeforeShellExecutionPermissionHook({
            hookExecutor,
            baseHookRequest,
            toolUseId,
            command: args.command,
            cwd,
            sandbox,
        }));
        return undefined;
    },
};
/**
 * Wraps a BackgroundShellExecutor to apply hooks before and after background shell spawn.
 */
class BackgroundShellExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, backgroundShellHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}
/**
 * Hook configuration for the WriteShellStdin tool.
 * Doesn't support input modification since it writes to an existing shell.
 * Note: WriteShellStdinArgs doesn't have a toolCallId field.
 */
const writeShellStdinHooksConfig = {
    toolName: HooksToolName.WriteShellStdin,
    // No getToolCallId - WriteShellStdinArgs doesn't have toolCallId
    createToolInput: (args) => ({
        shell_id: args.shellId,
        chars_length: args.chars.length,
    }),
    // No applyUpdatedInput - WriteShellStdin doesn't support input modification
    createRejectedResult: (_args, reason) => new background_shell_exec_pb/* WriteShellStdinResult */.nt({
        result: {
            case: "error",
            value: new background_shell_exec_pb/* WriteShellStdinError */.Gv({
                error: reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        if (result.result.case === "error") {
            return result.result.value.error || "WriteShellStdin error";
        }
        return "Unknown error";
    },
    createSuccessOutput: (args) => ({
        shell_id: args.shellId,
        success: true,
    }),
};
/**
 * Wraps a WriteBackgroundShellStdinExecutor to apply hooks before and after stdin writes.
 */
class WriteBackgroundShellStdinExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, writeShellStdinHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js
var computer_use_tool_pb = __webpack_require__("../proto/dist/generated/agent/v1/computer_use_tool_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/computer-use.js



/**
 * Hook configuration for the computer tool.
 * Note: ComputerUse doesn't support updated_input since it operates on actions.
 */
const computerUseHooksConfig = {
    toolName: HooksToolName.ComputerUse,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        actions_count: args.actions.length,
    }),
    // No applyUpdatedInput - ComputerUse doesn't support input modification
    createRejectedResult: (_args, reason) => new computer_use_tool_pb/* ComputerUseResult */.ks({
        result: {
            case: "error",
            value: new computer_use_tool_pb/* ComputerUseError */.Jb({
                error: reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        if (result.result.case === "error") {
            return result.result.value.error || "ComputerUse error";
        }
        return "Unknown error";
    },
    createSuccessOutput: (_args, result) => {
        if (result.result.case === "success") {
            return {
                action_count: result.result.value.actionCount,
                duration_ms: result.result.value.durationMs,
            };
        }
        return { success: true };
    },
};
/**
 * Wraps a ComputerUseExecutor to apply hooks before and after computer use operations.
 */
class ComputerUseExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, computerUseHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/delete_exec_pb.js
var delete_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/delete_exec_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/delete.js



/**
 * Hook configuration for the Delete tool.
 */
const deleteHooksConfig = {
    toolName: HooksToolName.Delete,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        file_path: args.path,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.file_path === "string") {
            args.path = updatedInput.file_path;
        }
    },
    createRejectedResult: (args, reason) => new delete_exec_pb/* DeleteResult */.Pi({
        result: {
            case: "rejected",
            value: new delete_exec_pb/* DeleteRejected */.iq({
                path: args.path,
                reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "fileNotFound":
                return `File not found: ${result.result.value.path}`;
            case "notFile":
                return `Not a file: ${result.result.value.path}`;
            case "permissionDenied":
                return `Permission denied: ${result.result.value.path}`;
            case "fileBusy":
                return `File busy: ${result.result.value.path}`;
            case "rejected":
                return result.result.value.reason || "Delete rejected";
            case "error":
                return result.result.value.error || "Delete error";
            default:
                return "Unknown error";
        }
    },
    createSuccessOutput: (args) => ({
        file_path: args.path,
        deleted: true,
    }),
};
/**
 * Wraps a DeleteExecutor to apply hooks before and after file delete operations.
 */
class DeleteExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, deleteHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js
var diagnostics_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/diagnostics_exec_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/diagnostics.js



/**
 * Hook configuration for the ReadLints tool (backed by DiagnosticsExecutor).
 */
const diagnosticsHooksConfig = {
    toolName: HooksToolName.ReadLints,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        file_path: args.path,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.file_path === "string") {
            args.path = updatedInput.file_path;
        }
    },
    createRejectedResult: (args, reason) => new diagnostics_exec_pb/* DiagnosticsResult */.Ek({
        result: {
            case: "rejected",
            value: new diagnostics_exec_pb/* DiagnosticsRejected */.J6({
                path: args.path,
                reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "error":
                return result.result.value.error || "Diagnostics error";
            case "rejected":
                return result.result.value.reason || "Diagnostics rejected";
            case "fileNotFound":
                return `File not found: ${result.result.value.path}`;
            case "permissionDenied":
                return `Permission denied: ${result.result.value.path}`;
            default:
                return "Unknown error";
        }
    },
    createSuccessOutput: (args, result) => {
        if (result.result.case === "success") {
            return {
                file_path: args.path,
                diagnostics_count: result.result.value.totalDiagnostics,
            };
        }
        return { file_path: args.path, success: true };
    },
};
/**
 * Wraps a DiagnosticsExecutor to apply hooks before and after diagnostics operations.
 */
class DiagnosticsExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, diagnosticsHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/fetch_exec_pb.js
var fetch_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/fetch_exec_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/fetch.js



/**
 * Hook configuration for the fetch tool.
 */
const fetchHooksConfig = {
    toolName: HooksToolName.Fetch,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        url: args.url,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.url === "string") {
            args.url = updatedInput.url;
        }
    },
    createRejectedResult: (args, reason) => new fetch_exec_pb/* FetchResult */.uN({
        result: {
            case: "error",
            value: new fetch_exec_pb/* FetchError */.fk({
                url: args.url,
                error: reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        if (result.result.case === "error") {
            return result.result.value.error || "Fetch error";
        }
        return "Unknown error";
    },
    createSuccessOutput: (args, result) => {
        if (result.result.case === "success") {
            return {
                url: args.url,
                status_code: result.result.value.statusCode,
                content_length: result.result.value.content.length,
            };
        }
        return { url: args.url, success: true };
    },
};
/**
 * Wraps a FetchExecutor to apply hooks before and after web fetch operations.
 */
class FetchExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, fetchHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/grep_exec_pb.js
var grep_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/grep_exec_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/grep.js



/**
 * Hook configuration for the Grep tool.
 */
const grepHooksConfig = {
    toolName: HooksToolName.Grep,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        pattern: args.pattern,
        file_path: args.path,
        glob: args.glob,
        output_mode: args.outputMode,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.pattern === "string") {
            args.pattern = updatedInput.pattern;
        }
        if (typeof updatedInput.file_path === "string") {
            args.path = updatedInput.file_path;
        }
    },
    createRejectedResult: (_args, reason) => new grep_exec_pb/* GrepResult */.Ud({
        result: {
            case: "error",
            value: new grep_exec_pb/* GrepError */.ts({
                error: reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        if (result.result.case === "error") {
            return result.result.value.error || "Grep error";
        }
        return "Unknown error";
    },
    createSuccessOutput: (args) => ({
        pattern: args.pattern,
        success: true,
    }),
};
/**
 * Wraps a GrepExecutor to apply hooks before and after grep operations.
 */
class GrepExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, grepHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/ls_exec_pb.js
var ls_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/ls_exec_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/ls.js



/**
 * Hook configuration for the LS tool.
 */
const lsHooksConfig = {
    toolName: HooksToolName.LS,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        file_path: args.path,
        ignore: args.ignore,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.file_path === "string") {
            args.path = updatedInput.file_path;
        }
    },
    createRejectedResult: (args, reason) => new ls_exec_pb/* LsResult */.fv({
        result: {
            case: "rejected",
            value: new ls_exec_pb/* LsRejected */.k2({
                path: args.path,
                reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "error":
                return result.result.value.error || "Ls error";
            case "rejected":
                return result.result.value.reason || "Ls rejected";
            case "timeout":
                return "Ls operation timed out";
            default:
                return "Unknown error";
        }
    },
    getFailureType: (result) => (result.result.case === "timeout" ? "timeout" : "error"),
    createSuccessOutput: (args) => ({
        file_path: args.path,
        success: true,
    }),
};
/**
 * Wraps an LsExecutor to apply hooks before and after directory listing operations.
 */
class LsExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, lsHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/mcp_exec_pb.js
var mcp_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/mcp_exec_pb.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/google/protobuf/struct_pb.js
var struct_pb = __webpack_require__("../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/google/protobuf/struct_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/mcp.js







const mcp_logger = (0,logger/* createLogger */.h)("hooks-exec:mcp");



/**
 * Build a carrier from a post-hook script's `additional_context`, swallowing
 * {@link HookAdditionalContextTooLargeError} so an oversize payload from a
 * postToolUse/postToolUseFailure response logs and drops rather than crashing
 * the MCP execute path. Mirrors the helper of the same intent in
 * `generic-hooks.ts`; duplicated here because the MCP executor predates the
 * generic wrapper and does not go through `createHookHelpers`.
 */
function safeBuildPostHookCarrier(ctx, toolName, hookEventName, additionalContext) {
    try {
        return createHookAdditionalContexts({
            hookEventName,
            additionalContext,
        });
    }
    catch (error) {
        if (error instanceof HookAdditionalContextTooLargeError) {
            mcp_logger.warn(ctx, `${hookEventName} additional_context exceeded max size; dropping carrier`, {
                toolName,
                hookEventName,
                actualLength: error.actualLength,
                maxLength: error.maxLength,
            });
            return [];
        }
        throw error;
    }
}
/**
 * Wraps an McpExecutor to apply hooks before and after MCP tool execution.
 *
 * Note: This executor does NOT use createExecutorWithHooks because:
 * - It has MCP-specific hooks (beforeMCPExecution, afterMCPExecution) that
 *   don't fit the generic preToolUse/postToolUse pattern
 * - It handles updated_mcp_tool_output from postToolUse responses
 * - It uses McpPermissionDenied for denied operations (different from rejected)
 * - It needs to construct serverConnectionField from mcpLease
 *
 * As a result, this executor manually handles firePostToolUseFailure calls.
 */
class McpToolExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor, mcpLease, hooksConfigLease) {
        this.innerExecutor = innerExecutor;
        this.hookExecutor = hookExecutor;
        this.baseHookRequestExtractor = baseHookRequestExtractor;
        this.mcpLease = mcpLease;
        this.hooksConfigLease = hooksConfigLease;
    }
    async execute(ctx, args, options) {
        if (args.smartModeApprovalOnly) {
            return this.innerExecutor.execute(ctx, args, options);
        }
        // These hooks see the arguments before `$file:` placeholders are
        // expanded, so a policy on what is sent could not see the file contents.
        if (args.symbolicPathArguments.length > 0 &&
            (this.hooksConfigLease?.hasHookForStep(hooks_dist/* HookStep */._E.preToolUse) === true ||
                this.hooksConfigLease?.hasHookForStep(hooks_dist/* HookStep */._E.beforeMCPExecution) === true)) {
            return new mcp_exec_pb/* McpResult */.iz({
                result: {
                    case: "error",
                    value: new mcp_exec_pb/* McpError */.Nh({
                        error: `"${dist/* SYMBOLIC_PATH_ARGUMENT_PREFIX */.Eyz}" arguments can't be used on this computer: hooks that inspect MCP calls are configured here, and they would not see the file's contents. Read the file and pass its contents instead.`,
                    }),
                },
            });
        }
        const baseHookRequest = this.baseHookRequestExtractor(ctx);
        const toolUseId = (0,external_node_crypto_.randomUUID)();
        // Carrier collector for this tool-call. The outer
        // InteractionHandler.executeToolCall passes its array down via
        // ExecOptions.hookContextCollector; if no collector is provided we
        // allocate a throwaway so the push helpers stay a no-op-friendly
        // sink rather than a `?.push` chain.
        const hookContextCollector = options?.hookContextCollector ?? [];
        let toolInput = Object.fromEntries(Object.entries(args.args).map(([key, value]) => [key, value?.toJson()]));
        const genericToolName = `MCP:${args.toolName}`;
        try {
            const preToolUseResponse = await this.hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.preToolUse, {
                ...baseHookRequest,
                tool_name: genericToolName,
                tool_input: toolInput,
                tool_use_id: toolUseId,
            });
            // Apply deny BEFORE building the carrier (same reasoning as
            // generic-hooks runPreHooks: deny is sticky; an oversize-throw
            // here must not silently demote a denied call into a successful
            // one). Build the deny carrier under an oversize-tolerant catch.
            if (preToolUseResponse?.permission === "deny") {
                const reason = preToolUseResponse.user_message || "MCP tool blocked by preToolUse hook";
                try {
                    appendHookAdditionalContexts(hookContextCollector, createHookAdditionalContexts({
                        hookEventName: hooks_dist/* HookStep */._E.preToolUse,
                        additionalContext: preToolUseResponse.additional_context,
                    }));
                }
                catch (carrierError) {
                    if (carrierError instanceof HookAdditionalContextTooLargeError) {
                        mcp_logger.warn(ctx, "preToolUse deny additional_context exceeded max size; dropping carrier", {
                            toolName: genericToolName,
                            actualLength: carrierError.actualLength,
                            maxLength: carrierError.maxLength,
                        });
                    }
                    else {
                        throw carrierError;
                    }
                }
                await this.firePostToolUseFailureAsync(ctx, baseHookRequest, genericToolName, toolInput, reason, "permission_denied", 0, toolUseId, false, hookContextCollector);
                return new mcp_exec_pb/* McpResult */.iz({
                    result: {
                        case: "permissionDenied",
                        value: new mcp_exec_pb/* McpPermissionDenied */.HQ({
                            error: createHookDenialMessage("MCP tool execution", reason),
                            isReadonly: false,
                        }),
                    },
                });
            }
            if (preToolUseResponse?.updated_input) {
                try {
                    for (const [key, val] of Object.entries(preToolUseResponse.updated_input)) {
                        if (val === undefined)
                            continue;
                        args.args[key] = struct_pb/* Value */.WT.fromJson(val);
                    }
                    toolInput = Object.fromEntries(Object.entries(args.args).map(([key, value]) => [key, value?.toJson()]));
                }
                catch (e) {
                    mcp_logger.warn(ctx, "Failed to merge updated_input for MCP", {
                        error: e instanceof Error ? e.message : String(e),
                    });
                }
            }
            // Allow-path carrier build: deliberately NOT wrapped in a local
            // try/catch so an oversize throw rides the outer catch and
            // hasFailClosedHooksForStep gets to choose whether to block.
            appendHookAdditionalContexts(hookContextCollector, createHookAdditionalContexts({
                hookEventName: hooks_dist/* HookStep */._E.preToolUse,
                additionalContext: preToolUseResponse?.additional_context,
            }));
        }
        catch (e) {
            const hasFailClosed = this.hookExecutor.hasFailClosedHooksForStep?.(hooks_dist/* HookStep */._E.preToolUse, genericToolName) ??
                false;
            const isOversize = e instanceof HookAdditionalContextTooLargeError;
            const detailPrefix = isOversize
                ? "preToolUse additional_context exceeded max size"
                : "preToolUse hook failed";
            if (hasFailClosed) {
                const detail = e instanceof Error ? e.message : "preToolUse hook error";
                const reason = formatFailClosedBlockReason(`${detailPrefix}: ${detail}`);
                await this.firePostToolUseFailureAsync(ctx, baseHookRequest, genericToolName, toolInput, reason, "error", 0, toolUseId, false, hookContextCollector);
                return new mcp_exec_pb/* McpResult */.iz({
                    result: {
                        case: "permissionDenied",
                        value: new mcp_exec_pb/* McpPermissionDenied */.HQ({
                            error: createHookDenialMessage("MCP tool execution", reason),
                            isReadonly: false,
                        }),
                    },
                });
            }
            mcp_logger.warn(ctx, isOversize
                ? "preToolUse additional_context exceeded max size; dropping carrier"
                : "preToolUse hook error in MCP executor", {
                toolName: genericToolName,
                error: e instanceof Error ? e.message : String(e),
                ...(isOversize
                    ? {
                        actualLength: e.actualLength,
                        maxLength: e.maxLength,
                    }
                    : {}),
            });
        }
        const mcpClient = await this.mcpLease?.getClient(ctx, args.providerIdentifier);
        const mcpConfig = mcpClient?.config;
        let serverConnectionField;
        const mcpServerUrl = mcpConfig && "url" in mcpConfig && mcpConfig.url ? mcpConfig.url : undefined;
        if (mcpServerUrl !== undefined) {
            serverConnectionField = { url: mcpServerUrl };
        }
        else if (mcpConfig && "command" in mcpConfig) {
            const commandParts = [mcpConfig.command, ...(mcpConfig.args ?? [])].filter(Boolean);
            serverConnectionField = { command: commandParts.join(" ") };
        }
        else {
            serverConnectionField = { command: args.providerIdentifier };
        }
        const mcpHookIdentityFields = {
            mcp_server_name: args.providerIdentifier,
            ...(mcpServerUrl !== undefined ? { mcp_server_url: mcpServerUrl } : {}),
        };
        const beforeHookRequest = {
            ...baseHookRequest,
            tool_name: args.toolName,
            tool_input: JSON.stringify(toolInput),
            tool_use_id: toolUseId,
            ...mcpHookIdentityFields,
            ...serverConnectionField,
        };
        const beforeHookResponse = await this.hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.beforeMCPExecution, beforeHookRequest);
        if (beforeHookResponse?.permission === "deny") {
            const errorMessage = createHookDenialMessage("MCP tool execution", beforeHookResponse.user_message);
            await this.firePostToolUseFailureAsync(ctx, baseHookRequest, genericToolName, toolInput, errorMessage, "permission_denied", 0, toolUseId, false, hookContextCollector);
            return new mcp_exec_pb/* McpResult */.iz({
                result: {
                    case: "permissionDenied",
                    value: new mcp_exec_pb/* McpPermissionDenied */.HQ({
                        error: errorMessage,
                        isReadonly: false,
                    }),
                },
            });
        }
        const executionStartTimeMs = external_node_perf_hooks_.performance.now();
        try {
            const result = await this.innerExecutor.execute(ctx, args, options);
            const executionDurationMs = roundDurationMs(external_node_perf_hooks_.performance.now() - executionStartTimeMs);
            let resultJson = "{}";
            if (result.result.case === "success") {
                try {
                    const content = result.result.value.content.map((item) => {
                        if (item.content.case === "text") {
                            return { type: "text", text: item.content.value.text };
                        }
                        else if (item.content.case === "image") {
                            return {
                                type: "image",
                                data: Buffer.from(item.content.value.data).toString("base64"),
                                mimeType: item.content.value.mimeType,
                            };
                        }
                        return { type: "unknown" };
                    });
                    resultJson = JSON.stringify({
                        content,
                        isError: result.result.value.isError,
                    });
                }
                catch (e) {
                    mcp_logger.warn(ctx, "Failed to serialize MCP result", {
                        error: e instanceof Error ? e.message : String(e),
                    });
                    resultJson = JSON.stringify({ error: "Failed to serialize result" });
                }
            }
            else if (result.result.case === "error") {
                resultJson = JSON.stringify({ error: result.result.value.error });
            }
            else if (result.result.case === "rejected") {
                resultJson = JSON.stringify({
                    rejected: true,
                    reason: result.result.value.reason,
                });
            }
            else if (result.result.case === "permissionDenied") {
                resultJson = JSON.stringify({
                    permissionDenied: true,
                    error: result.result.value.error,
                });
            }
            const afterHookRequest = {
                ...baseHookRequest,
                tool_name: args.toolName,
                tool_input: JSON.stringify(toolInput),
                result_json: resultJson,
                duration: executionDurationMs,
                tool_use_id: toolUseId,
                ...mcpHookIdentityFields,
            };
            await this.hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.afterMCPExecution, afterHookRequest);
            const postToolUseResponse = await this.firePostToolUse(ctx, baseHookRequest, genericToolName, toolInput, resultJson, executionDurationMs, toolUseId, hookContextCollector);
            // Handle updated_mcp_tool_output if provided
            if (postToolUseResponse?.updated_mcp_tool_output !== undefined) {
                try {
                    const updatedOutput = postToolUseResponse.updated_mcp_tool_output;
                    const contentItems = [];
                    if (typeof updatedOutput === "string") {
                        contentItems.push(new mcp_exec_pb/* McpToolResultContentItem */._Z({
                            content: {
                                case: "text",
                                value: new mcp_exec_pb/* McpTextContent */.zN({ text: updatedOutput }),
                            },
                        }));
                    }
                    else if (typeof updatedOutput === "object" &&
                        updatedOutput !== null &&
                        "content" in updatedOutput &&
                        Array.isArray(updatedOutput.content)) {
                        const contentArray = updatedOutput.content;
                        for (const item of contentArray) {
                            if (typeof item === "object" &&
                                item !== null &&
                                "type" in item &&
                                item.type === "text" &&
                                "text" in item) {
                                contentItems.push(new mcp_exec_pb/* McpToolResultContentItem */._Z({
                                    content: {
                                        case: "text",
                                        value: new mcp_exec_pb/* McpTextContent */.zN({
                                            text: String(item.text),
                                        }),
                                    },
                                }));
                            }
                            else {
                                contentItems.push(new mcp_exec_pb/* McpToolResultContentItem */._Z({
                                    content: {
                                        case: "text",
                                        value: new mcp_exec_pb/* McpTextContent */.zN({
                                            text: JSON.stringify(item),
                                        }),
                                    },
                                }));
                            }
                        }
                    }
                    else {
                        contentItems.push(new mcp_exec_pb/* McpToolResultContentItem */._Z({
                            content: {
                                case: "text",
                                value: new mcp_exec_pb/* McpTextContent */.zN({
                                    text: JSON.stringify(updatedOutput),
                                }),
                            },
                        }));
                    }
                    const isError = typeof updatedOutput === "object" &&
                        updatedOutput !== null &&
                        "isError" in updatedOutput
                        ? Boolean(updatedOutput.isError)
                        : false;
                    return new mcp_exec_pb/* McpResult */.iz({
                        result: {
                            case: "success",
                            value: new mcp_exec_pb/* McpSuccess */.QW({
                                content: contentItems,
                                isError,
                            }),
                        },
                    });
                }
                catch (e) {
                    mcp_logger.warn(ctx, "Failed to process updated_mcp_tool_output", {
                        error: e instanceof Error ? e.message : String(e),
                    });
                    return result;
                }
            }
            return result;
        }
        catch (error) {
            const executionDurationMs = roundDurationMs(external_node_perf_hooks_.performance.now() - executionStartTimeMs);
            const errorMessage = error instanceof Error ? error.message : String(error);
            await this.firePostToolUseFailureAsync(ctx, baseHookRequest, genericToolName, toolInput, errorMessage, "error", executionDurationMs, toolUseId, false, hookContextCollector);
            throw error;
        }
    }
    /**
     * Returns the full postToolUse response (keyed on the fields the caller
     * cares about: `additional_context`, `updated_mcp_tool_output`). The
     * carrier for `additional_context` is pushed onto the per-tool-call
     * `hookContextCollector` here so the caller stays a thin orchestrator.
     *
     * Historic bug: this method previously returned
     * `{ updated_mcp_tool_output?: unknown } | undefined`, which stripped
     * `additional_context` from the response shape and silently dropped
     * MCP `postToolUse` carriers on the floor. EXTY-226 fix.
     */
    async firePostToolUse(ctx, baseHookRequest, toolName, toolInput, toolOutput, duration, toolUseId, hookContextCollector) {
        try {
            const response = await this.hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.postToolUse, {
                ...baseHookRequest,
                tool_name: toolName,
                tool_input: toolInput,
                tool_output: toolOutput,
                duration,
                tool_use_id: toolUseId,
            });
            appendHookAdditionalContexts(hookContextCollector, safeBuildPostHookCarrier(ctx, toolName, hooks_dist/* HookStep */._E.postToolUse, response?.additional_context));
            return response;
        }
        catch (e) {
            mcp_logger.warn(ctx, "postToolUse hook error in MCP executor", {
                error: e instanceof Error ? e.message : String(e),
            });
            return undefined;
        }
    }
    /**
     * Async postToolUseFailure: awaits the hook so we can read `additional_context`
     * off the response and push its carrier into `hookContextCollector`. The
     * fire-and-forget `.catch()` predecessor never captured the response and
     * dropped failure-path `additional_context` on the floor. EXTY-226 fix.
     */
    async firePostToolUseFailureAsync(ctx, baseHookRequest, toolName, toolInput, errorMessage, failureType, duration, toolUseId, isInterrupt, hookContextCollector) {
        try {
            const response = await this.hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.postToolUseFailure, {
                ...baseHookRequest,
                tool_name: toolName,
                tool_input: toolInput,
                error_message: errorMessage,
                failure_type: failureType,
                duration,
                tool_use_id: toolUseId,
                is_interrupt: isInterrupt,
            });
            appendHookAdditionalContexts(hookContextCollector, safeBuildPostHookCarrier(ctx, toolName, hooks_dist/* HookStep */._E.postToolUseFailure, response?.additional_context));
        }
        catch (e) {
            mcp_logger.warn(ctx, "postToolUseFailure hook error in MCP executor", {
                error: e instanceof Error ? e.message : String(e),
            });
        }
    }
}

;// ../hooks-exec/dist/tool-hook-executors/mcp-resources.js



/**
 * Hook configuration for the ListMcpResources tool.
 * Note: ListMcpResourcesExecArgs doesn't have a toolCallId field.
 */
const listMcpResourcesHooksConfig = {
    toolName: HooksToolName.ListMcpResources,
    // No getToolCallId - ListMcpResourcesExecArgs doesn't have toolCallId
    createToolInput: (args) => ({
        server: args.server,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.server === "string") {
            args.server = updatedInput.server;
        }
    },
    createRejectedResult: (_args, reason) => new mcp_exec_pb/* ListMcpResourcesExecResult */.kP({
        result: {
            case: "error",
            value: new mcp_exec_pb/* ListMcpResourcesError */.w2({
                error: reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "error":
                return result.result.value.error || "ListMcpResources error";
            case "rejected":
                return result.result.value.reason || "ListMcpResources rejected";
            default:
                return "Unknown error";
        }
    },
    createSuccessOutput: (_args, result) => {
        if (result.result.case === "success") {
            return {
                resources_count: result.result.value.resources.length,
            };
        }
        return { success: true };
    },
};
/**
 * Wraps a ListMcpResourcesExecutor to apply hooks before and after MCP resource listing.
 */
class ListMcpResourcesExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, listMcpResourcesHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}
/**
 * Hook configuration for the FetchMcpResource tool.
 * Note: ReadMcpResourceExecArgs doesn't have a toolCallId field.
 */
const readMcpResourceHooksConfig = {
    toolName: HooksToolName.FetchMcpResource,
    // No getToolCallId - ReadMcpResourceExecArgs doesn't have toolCallId
    createToolInput: (args) => ({
        server: args.server,
        uri: args.uri,
        download_path: args.downloadPath,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.server === "string") {
            args.server = updatedInput.server;
        }
        if (typeof updatedInput.uri === "string") {
            args.uri = updatedInput.uri;
        }
        if (typeof updatedInput.download_path === "string") {
            args.downloadPath = updatedInput.download_path;
        }
    },
    createRejectedResult: (_args, reason) => new mcp_exec_pb/* ReadMcpResourceExecResult */.ZD({
        result: {
            case: "error",
            value: new mcp_exec_pb/* ReadMcpResourceError */.Jx({
                error: reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "error":
                return result.result.value.error || "ReadMcpResource error";
            case "rejected":
                return result.result.value.reason || "ReadMcpResource rejected";
            case "notFound":
                return "Resource not found";
            default:
                return "Unknown error";
        }
    },
    createSuccessOutput: (args, result) => {
        if (result.result.case === "success") {
            const success = result.result.value;
            return {
                uri: args.uri,
                name: success.name,
                mime_type: success.mimeType,
                download_path: success.downloadPath,
                content_type: success.content.case,
                content_length: success.content.case === "text"
                    ? success.content.value.length
                    : success.content.case === "blob"
                        ? success.content.value.length
                        : undefined,
            };
        }
        return { uri: args.uri, success: true };
    },
};
/**
 * Wraps a ReadMcpResourceExecutor to apply hooks before and after MCP resource reading.
 */
class ReadMcpResourceExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, readMcpResourceHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/read_exec_pb.js
var read_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/read_exec_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/read.js






/**
 * Hook configuration for the Read tool.
 * Includes the beforeReadFile hook that runs after successful reads.
 */
const readHooksConfig = {
    toolName: HooksToolName.Read,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        file_path: args.path,
    }),
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.file_path === "string") {
            args.path = updatedInput.file_path;
        }
    },
    createRejectedResult: (args, reason) => new read_exec_pb/* ReadResult */.sV({
        result: {
            case: "rejected",
            value: new read_exec_pb/* ReadRejected */.f4({
                path: args.path,
                reason,
            }),
        },
    }),
    isSuccess: (result) => result.result.case === "success",
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "error":
                return result.result.value.error || "Read error";
            case "rejected":
                return result.result.value.reason || "Read rejected";
            case "fileNotFound":
                return `File not found: ${result.result.value.path}`;
            case "permissionDenied":
                return `Permission denied: ${result.result.value.path}`;
            case "invalidFile":
                return `Invalid file: ${result.result.value.path}`;
            default:
                return "Unknown error";
        }
    },
    createSuccessOutput: (args, result) => {
        if (result.result.case === "success") {
            const content = result.result.value.output.case === "content" ? result.result.value.output.value : "";
            return { file_path: args.path, content_length: content.length };
        }
        return { file_path: args.path, success: true };
    },
    /**
     * Run beforeReadFile hook after successful read operations.
     * This allows hooks to inspect the file content and potentially block the read.
     * Throws HookDeniedError if the hook denies the read, or FailClosedError if hook infrastructure fails.
     */
    runPostExecutionHooks: async (params) => {
        const { args, result, baseHookRequest, hookExecutor } = params;
        if (result.result.case !== "success") {
            return undefined;
        }
        const content = result.result.value.output.case === "content" ? result.result.value.output.value : "";
        // Fail-closed: hook errors should block the read, not allow content through
        const beforeReadResponse = await withFailClosed(() => hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.beforeReadFile, {
            ...baseHookRequest,
            content,
            file_path: args.path,
            attachments: [],
        }), "File read");
        if (beforeReadResponse?.permission === "deny") {
            const reason = createHookDenialMessage("File read", beforeReadResponse.user_message);
            throw new HookDeniedError(reason);
        }
        return undefined;
    },
};
/**
 * Wraps a ReadExecutor to apply hooks before and after file read operations.
 */
class ReadExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        // `beforeReadFile` inspects the file's text, so a `digest_only` read runs
        // the hooks on the full text and takes the digest afterwards.
        this.wrappedExecutor = new dist/* DigestOnlyReadExecutor */.yJV(createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, readHooksConfig));
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js
var record_screen_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/record_screen_exec_pb.js");
;// ../hooks-exec/dist/tool-hook-executors/record-screen.js



/**
 * Hook configuration for the RecordScreen tool.
 * Note: RecordScreen doesn't support updated_input.
 */
const recordScreenHooksConfig = {
    toolName: HooksToolName.RecordScreen,
    getToolCallId: getToolCallIdFromArgs,
    createToolInput: (args) => ({
        mode: args.mode,
        save_as_filename: args.saveAsFilename,
    }),
    // No applyUpdatedInput - RecordScreen doesn't support input modification
    createRejectedResult: (_args, reason) => new record_screen_exec_pb/* RecordScreenResult */.Tj({
        result: {
            case: "failure",
            value: new record_screen_exec_pb/* RecordScreenFailure */.yH({
                error: reason,
            }),
        },
    }),
    // RecordScreen considers non-failure results as success
    isSuccess: (result) => result.result.case !== "failure",
    getErrorMessage: (result) => {
        if (result.result.case === "failure") {
            return result.result.value.error || "RecordScreen failed";
        }
        return "Unknown error";
    },
    createSuccessOutput: (_args, result) => ({
        result_type: result.result.case,
    }),
};
/**
 * Wraps a RecordScreenExecutor to apply hooks before and after screen recording operations.
 */
class RecordScreenExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, recordScreenHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

;// ../hooks-exec/dist/tool-hook-executors/shell.js







/**
 * Get output from a shell result (success or failure).
 */
function getOutputFromResult(result) {
    if (result.result.case === "success") {
        return result.result.value.stdout + result.result.value.stderr;
    }
    else if (result.result.case === "failure") {
        return result.result.value.stdout + result.result.value.stderr;
    }
    return "";
}
/**
 * Hook configuration for the Shell tool.
 * Includes beforeShellExecution and afterShellExecution hooks.
 */
const shellHooksConfig = {
    toolName: HooksToolName.Shell,
    // Shell generates its own UUID - doesn't use toolCallId from args
    createToolInput: (args) => {
        const cwd = args.workingDirectory || "";
        const timeout = args.timeout;
        return {
            command: args.command,
            cwd,
            ...(typeof timeout === "number" && timeout > 0 && { timeout }),
        };
    },
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.command === "string") {
            args.command = updatedInput.command;
        }
        if (typeof updatedInput.cwd === "string") {
            args.workingDirectory = updatedInput.cwd;
        }
        if (typeof updatedInput.timeout === "number" && updatedInput.timeout >= 0) {
            args.timeout = updatedInput.timeout;
        }
    },
    createRejectedResult: (args, reason) => new shell_exec_pb/* ShellResult */.W4({
        result: {
            case: "rejected",
            value: new shell_exec_pb/* ShellRejected */.pZ({
                command: args.command,
                workingDirectory: args.workingDirectory,
                reason,
            }),
        },
    }),
    isSuccess: (result) => {
        // Consider success and non-aborted failure as "success" for postToolUse purposes
        // Only timeout, spawnError, and aborted failures trigger postToolUseFailure
        if (result.result.case === "success") {
            return true;
        }
        if (result.result.case === "failure" && !result.result.value.aborted) {
            return true;
        }
        return false;
    },
    getErrorMessage: (result) => {
        switch (result.result.case) {
            case "timeout":
                return `Command timed out after ${result.result.value.timeoutMs}ms`;
            case "spawnError":
                return result.result.value.error || "Failed to spawn command";
            case "failure":
                if (result.result.value.aborted) {
                    return "Command was aborted";
                }
                return "Command failed";
            case "rejected":
                return result.result.value.reason || "Command rejected";
            default:
                return "Unknown error";
        }
    },
    getFailureType: (result) => {
        if (result.result.case === "timeout") {
            return "timeout";
        }
        return "error";
    },
    isInterrupt: (result) => {
        // An aborted failure is an interrupt (e.g., user cancelled the command)
        return result.result.case === "failure" && result.result.value.aborted === true;
    },
    createSuccessOutput: (_args, result) => {
        const output = getOutputFromResult(result);
        const exitCode = result.result.case === "success" ? 0 : 1;
        return { output, exitCode };
    },
    getExtraHookFields: (args) => {
        const cwd = args.workingDirectory || "";
        return { cwd };
    },
    /**
     * Run beforeShellExecution hook before execution.
     * Throws HookDeniedError if hook denies execution (generic-hooks handles the rest).
     */
    runPreExecutionHooks: async (params) => {
        const { args, baseHookRequest, hookExecutor, toolUseId } = params;
        const cwd = args.workingDirectory || "";
        (0,dist/* setShellHookApprovalRequirement */.oAs)(args, await runBeforeShellExecutionPermissionHook({
            hookExecutor,
            baseHookRequest,
            toolUseId,
            command: args.command,
            cwd,
            sandbox: isSandboxed(args.requestedSandboxPolicy),
        }));
        return undefined;
    },
    /**
     * Run afterShellExecution hook after execution.
     */
    runPostExecutionHooks: async (params) => {
        const { args, result, baseHookRequest, hookExecutor, executionDurationMs, toolUseId } = params;
        const output = getOutputFromResult(result);
        await hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.afterShellExecution, {
            ...baseHookRequest,
            command: args.command,
            output,
            duration: executionDurationMs,
            sandbox: isSandboxed(args.requestedSandboxPolicy),
            tool_use_id: toolUseId,
        });
        // afterShellExecution doesn't block, just notify
        return undefined;
    },
};
/**
 * Wraps a ShellExecutor to apply hooks before and after shell command execution.
 */
class ShellExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, shellHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

;// ../hooks-exec/dist/tool-hook-executors/shell-stream.js







/**
 * Result collector for shell stream events.
 * Tracks stdout/stderr output and exit status during streaming.
 */
class ShellStreamResultCollector {
    constructor() {
        this.output = "";
    }
    onEvent(event) {
        if (event.event.case === "stdout") {
            this.output += event.event.value.data;
        }
        else if (event.event.case === "stderr") {
            this.output += event.event.value.data;
        }
        else if (event.event.case === "exit") {
            this.exitEvent = event.event.value;
        }
    }
    getOutput() {
        return this.output;
    }
    isAborted() {
        return this.exitEvent?.aborted ?? false;
    }
    getExitCode() {
        return this.exitEvent?.code ?? 0;
    }
}
/**
 * Hook configuration for the ShellStream tool.
 * Includes beforeShellExecution and afterShellExecution hooks.
 */
const shellStreamHooksConfig = {
    toolName: HooksToolName.Shell,
    // Shell stream generates its own UUID - doesn't use toolCallId from args
    createToolInput: (args) => {
        const cwd = args.workingDirectory || "";
        const timeout = args.timeout;
        return {
            command: args.command,
            cwd,
            ...(typeof timeout === "number" && timeout > 0 && { timeout }),
        };
    },
    applyUpdatedInput: (args, updatedInput) => {
        if (typeof updatedInput.command === "string") {
            args.command = updatedInput.command;
        }
        if (typeof updatedInput.cwd === "string") {
            args.workingDirectory = updatedInput.cwd;
        }
        if (typeof updatedInput.timeout === "number" && updatedInput.timeout >= 0) {
            args.timeout = updatedInput.timeout;
        }
    },
    createRejectedEvent: (args, reason) => new shell_exec_pb/* ShellStream */.FI({
        event: {
            case: "rejected",
            value: new shell_exec_pb/* ShellRejected */.pZ({
                command: args.command,
                workingDirectory: args.workingDirectory,
                reason,
            }),
        },
    }),
    createHookContextEvent: (contexts) => new shell_exec_pb/* ShellStream */.FI({
        event: {
            case: "hookContext",
            value: new shell_exec_pb/* ShellStreamHookContext */.Ng({
                hookAdditionalContexts: [...contexts],
            }),
        },
    }),
    getExtraHookFields: (args) => {
        const cwd = args.workingDirectory || "";
        return { cwd };
    },
    createResultCollector: () => new ShellStreamResultCollector(),
    createSuccessOutput: (_args, collector) => ({
        output: collector.getOutput(),
        exitCode: collector.getExitCode(),
    }),
    isStreamSuccess: (collector) => collector.getExitCode() === 0,
    getStreamErrorMessage: (_args, collector) => {
        const output = collector.getOutput().trim();
        return output || `Command failed with exit code ${collector.getExitCode()}`;
    },
    /**
     * Run beforeShellExecution hook before execution.
     * Throws HookDeniedError if hook denies execution.
     */
    runPreExecutionHooks: async (params) => {
        const { args, baseHookRequest, hookExecutor, toolUseId } = params;
        const cwd = args.workingDirectory || "";
        const sandbox = isSandboxed(args.requestedSandboxPolicy);
        (0,dist/* setShellHookApprovalRequirement */.oAs)(args, await runBeforeShellExecutionPermissionHook({
            hookExecutor,
            baseHookRequest,
            toolUseId,
            command: args.command,
            cwd,
            sandbox,
        }));
    },
    /**
     * Run afterShellExecution hook after streaming completes.
     */
    runPostExecutionHooks: async (params) => {
        const { args, baseHookRequest, hookExecutor, collector, executionDurationMs, toolUseId } = params;
        const sandbox = isSandboxed(args.requestedSandboxPolicy);
        await hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.afterShellExecution, {
            ...baseHookRequest,
            command: args.command,
            output: collector.getOutput(),
            duration: executionDurationMs,
            sandbox,
            tool_use_id: toolUseId,
        });
        // afterShellExecution doesn't block, just notify
    },
};
/**
 * Wraps a ShellStreamExecutor to apply hooks before and after shell command execution.
 */
class ShellStreamExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        this.wrappedExecutor = createStreamingExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, shellStreamHooksConfig);
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}

// EXTERNAL MODULE: ../proto/dist/generated/agent/v1/write_exec_pb.js
var write_exec_pb = __webpack_require__("../proto/dist/generated/agent/v1/write_exec_pb.js");
// EXTERNAL MODULE: ../utils/dist/encoding.js + 1 modules
var encoding = __webpack_require__("../utils/dist/encoding.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/diff@8.0.3/node_modules/diff/libesm/patch/create.js + 2 modules
var create = __webpack_require__("../../node_modules/.pnpm/diff@8.0.3/node_modules/diff/libesm/patch/create.js");
;// ../hooks-exec/dist/tool-hook-executors/write.js







/**
 * Size threshold for computing diff hunks vs skipping old_string entirely.
 * For files larger than this, we skip capturing old content to avoid memory issues.
 * This matches the threshold used elsewhere in the codebase (256KB).
 */
const DIFF_SIZE_THRESHOLD_BYTES = 256 * 1024;
/**
 * Computes edit hunks from a diff between old and new content.
 * This is much more memory-efficient than storing both full contents,
 * as it only keeps the actual changed portions.
 *
 * @returns Array of edit hunks, each containing the old and new strings for that hunk
 */
function computeEditHunks(oldContent, newContent) {
    const patch = (0,create/* structuredPatch */.YB)("", "", oldContent, newContent, "", "", {
        context: 0, // No context lines - just the changes
    });
    if (patch.hunks.length === 0) {
        // No changes detected - this shouldn't happen in practice since we're
        // comparing before/after a write, but handle gracefully
        return [];
    }
    return patch.hunks.map((hunk) => {
        const oldLines = [];
        const newLines = [];
        for (const line of hunk.lines) {
            if (line.startsWith("-")) {
                oldLines.push(line.slice(1));
            }
            else if (line.startsWith("+")) {
                newLines.push(line.slice(1));
            }
            // Context lines (starting with " ") are skipped since we set context: 0
        }
        return {
            old_string: oldLines.join("\n"),
            new_string: newLines.join("\n"),
        };
    });
}
/**
 * Creates the WriteExecutor hooks configuration.
 * Uses a state map to pass content between pre-execution and post-execution hooks.
 */
function createWriteHooksConfig(hookExecutor, preWriteStateMap) {
    return {
        toolName: HooksToolName.Write,
        getToolCallId: getToolCallIdFromArgs,
        createToolInput: (args) => ({
            file_path: args.path,
            content: args.fileText,
        }),
        applyUpdatedInput: (args, updatedInput) => {
            if (typeof updatedInput.file_path === "string") {
                args.path = updatedInput.file_path;
            }
            // Note: content updates would require more complex handling
        },
        createRejectedResult: (args, reason) => new write_exec_pb/* WriteResult */.v3({
            result: {
                case: "error",
                value: new write_exec_pb/* WriteError */.QM({
                    path: args.path,
                    error: reason,
                }),
            },
        }),
        isSuccess: (result) => result.result.case === "success",
        getErrorMessage: (result) => {
            if (result.result.case === "error") {
                return result.result.value.error || "Write error";
            }
            return "Unknown error";
        },
        createSuccessOutput: (args) => ({
            file_path: args.path,
            success: true,
        }),
        /**
         * Read file content before write for use in afterFileEdit hook.
         */
        runPreExecutionHooks: async (params) => {
            const { args, toolUseId } = params;
            // Read file content before the write operation for diff computation.
            // For memory efficiency, we skip reading large files.
            let contentBeforeWrite;
            let fileTooLarge = false;
            try {
                const stats = await (0,promises_.stat)(args.path);
                if (stats.size > DIFF_SIZE_THRESHOLD_BYTES) {
                    fileTooLarge = true;
                }
                else {
                    contentBeforeWrite = await (0,encoding/* readText */.yR)(args.path);
                }
            }
            catch (_error) {
                // File doesn't exist yet
            }
            // Store state for post-execution hook
            preWriteStateMap.set(toolUseId, { contentBeforeWrite, fileTooLarge });
            return undefined;
        },
        /**
         * Clean up state stored by runPreExecutionHooks.
         * Called in all cases: success, failure, or exception.
         */
        runCleanup: (toolUseId) => {
            preWriteStateMap.delete(toolUseId);
        },
        /**
         * Execute afterFileEdit hook and optionally re-read file content.
         */
        runPostExecutionHooks: async (params) => {
            const { args, result, baseHookRequest, toolUseId } = params;
            // Retrieve pre-write state (cleanup is handled by runCleanup)
            const preWriteState = preWriteStateMap.get(toolUseId);
            if (result.result.case !== "success") {
                return undefined;
            }
            const { contentBeforeWrite, fileTooLarge } = preWriteState ?? {
                fileTooLarge: false,
            };
            // Compute efficient edit representation
            let edits;
            if (fileTooLarge) {
                // For large files, send empty old_string to avoid memory issues
                edits = [{ old_string: "", new_string: args.fileText }];
            }
            else if (contentBeforeWrite === undefined) {
                // New file creation - no old content
                edits = [{ old_string: "", new_string: args.fileText }];
            }
            else if (contentBeforeWrite === args.fileText) {
                // No actual changes
                edits = [];
            }
            else {
                // Compute diff hunks
                edits = computeEditHunks(contentBeforeWrite, args.fileText);
            }
            const afterHookRequest = {
                ...baseHookRequest,
                file_path: args.path,
                edits,
            };
            const afterHookResponse = await hookExecutor.executeHookForStep(hooks_dist/* HookStep */._E.afterFileEdit, afterHookRequest);
            // If hook returned a response and returnFileContentAfterWrite is requested,
            // re-read the file to get potentially modified content
            if (args.returnFileContentAfterWrite && afterHookResponse !== undefined) {
                const resolvedPath = result.result.value.path;
                try {
                    const fileContentAfterHook = await (0,encoding/* readText */.yR)(resolvedPath);
                    const updatedLines = (0,encoding/* countLines */.lt)(fileContentAfterHook);
                    const updatedSize = Buffer.byteLength(fileContentAfterHook, "utf8");
                    return new write_exec_pb/* WriteResult */.v3({
                        result: {
                            case: "success",
                            value: new write_exec_pb/* WriteSuccess */.j6({
                                ...result.result.value,
                                fileContentAfterWrite: fileContentAfterHook,
                                linesCreated: updatedLines,
                                fileSize: updatedSize,
                            }),
                        },
                    });
                }
                catch (_error) {
                    // If reading fails after the hook, return original result
                    return undefined;
                }
            }
            return undefined;
        },
    };
}
/**
 * Wraps a WriteExecutor to apply hooks before and after file write operations.
 */
class WriteExecutorWithHooks {
    constructor(innerExecutor, hookExecutor, baseHookRequestExtractor) {
        // Map to store pre-write state between pre-execution and post-execution hooks
        const preWriteStateMap = new Map();
        this.wrappedExecutor = createExecutorWithHooks(innerExecutor, hookExecutor, baseHookRequestExtractor, createWriteHooksConfig(hookExecutor, preWriteStateMap));
    }
    execute(ctx, args, options) {
        return this.wrappedExecutor.execute(ctx, args, options);
    }
}
// Export for testing


;// ../hooks-exec/dist/tool-hook-executors/index.js
// Tool hook executors - wrappers that apply hooks to tool execution















;// ../hooks-exec/dist/resource-accessor.js
/* unused harmony import specifier */ var hookExecutorResource;
/* unused harmony import specifier */ var LocalHookExecutorImpl;
/* unused harmony import specifier */ var shellExecutorResource;
/* unused harmony import specifier */ var shellStreamExecutorResource;
/* unused harmony import specifier */ var writeExecutorResource;
/* unused harmony import specifier */ var mcpExecutorResource;
/* unused harmony import specifier */ var readExecutorResource;
/* unused harmony import specifier */ var redactedReadExecutorResource;
/* unused harmony import specifier */ var lsExecutorResource;
/* unused harmony import specifier */ var grepExecutorResource;
/* unused harmony import specifier */ var fetchExecutorResource;
/* unused harmony import specifier */ var deleteExecutorResource;
/* unused harmony import specifier */ var diagnosticsExecutorResource;
/* unused harmony import specifier */ var listMcpResourcesExecutorResource;
/* unused harmony import specifier */ var readMcpResourceExecutorResource;
/* unused harmony import specifier */ var backgroundShellExecutorResource;
/* unused harmony import specifier */ var writeBackgroundShellInputExecutorResource;
/* unused harmony import specifier */ var computerUseExecutorResource;
/* unused harmony import specifier */ var recordScreenExecutorResource;
/* unused harmony import specifier */ var requestContextExecutorResource;
/* unused harmony import specifier */ var resource_accessor_RequestContextExecutorWithHooksContext;
/* unused harmony import specifier */ var resource_accessor_ShellExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_ShellStreamExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_WriteExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_McpToolExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_ReadExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_LsExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_GrepExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_FetchExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_DeleteExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_DiagnosticsExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_ListMcpResourcesExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_ReadMcpResourceExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_BackgroundShellExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_WriteBackgroundShellStdinExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_ComputerUseExecutorWithHooks;
/* unused harmony import specifier */ var resource_accessor_RecordScreenExecutorWithHooks;



/**
 * A ResourceAccessor that wraps another ResourceAccessor and applies hooks
 * to shell, shellstream, and write operations.
 *
 * This acts as middleware, intercepting resource access and wrapping the
 * executors with hook-aware versions.
 */
class HooksResourceAccessor {
    constructor(innerAccessor, hookExecutor, baseHookRequestExtractor, mcpLease, hooksAdditionalContextPromise, teamHooksReadyPromise, hooksConfigLease) {
        this.innerAccessor = innerAccessor;
        this.hookExecutor = hookExecutor;
        this.baseHookRequestExtractor = baseHookRequestExtractor;
        this.mcpLease = mcpLease;
        this.hooksAdditionalContextPromise = hooksAdditionalContextPromise;
        this.teamHooksReadyPromise = teamHooksReadyPromise;
        this.hooksConfigLease = hooksConfigLease;
    }
    get(resource) {
        if (resource.symbol === hookExecutorResource.symbol) {
            return new LocalHookExecutorImpl(this.hookExecutor);
        }
        const innerImpl = this.innerAccessor.get(resource);
        // Wrap shell executor with hooks
        if (resource.symbol === shellExecutorResource.symbol) {
            return new resource_accessor_ShellExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap shell stream executor with hooks
        if (resource.symbol === shellStreamExecutorResource.symbol) {
            return new resource_accessor_ShellStreamExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap write executor with hooks
        if (resource.symbol === writeExecutorResource.symbol) {
            return new resource_accessor_WriteExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap MCP executor with hooks
        if (resource.symbol === mcpExecutorResource.symbol) {
            return new resource_accessor_McpToolExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor, this.mcpLease, this.hooksConfigLease);
        }
        // Wrap read executors with hooks (default and redacted)
        if (resource.symbol === readExecutorResource.symbol ||
            resource.symbol === redactedReadExecutorResource.symbol) {
            return new resource_accessor_ReadExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap ls executor with hooks
        if (resource.symbol === lsExecutorResource.symbol) {
            return new resource_accessor_LsExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap grep executor with hooks
        if (resource.symbol === grepExecutorResource.symbol) {
            return new resource_accessor_GrepExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap fetch executor with hooks
        if (resource.symbol === fetchExecutorResource.symbol) {
            return new resource_accessor_FetchExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap delete executor with hooks
        if (resource.symbol === deleteExecutorResource.symbol) {
            return new resource_accessor_DeleteExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap diagnostics executor with hooks
        if (resource.symbol === diagnosticsExecutorResource.symbol) {
            return new resource_accessor_DiagnosticsExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap list MCP resources executor with hooks
        if (resource.symbol === listMcpResourcesExecutorResource.symbol) {
            return new resource_accessor_ListMcpResourcesExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap read MCP resource executor with hooks
        if (resource.symbol === readMcpResourceExecutorResource.symbol) {
            return new resource_accessor_ReadMcpResourceExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap background shell executor with hooks
        if (resource.symbol === backgroundShellExecutorResource.symbol) {
            return new resource_accessor_BackgroundShellExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap write background shell stdin executor with hooks
        if (resource.symbol === writeBackgroundShellInputExecutorResource.symbol) {
            return new resource_accessor_WriteBackgroundShellStdinExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap computer use executor with hooks
        if (resource.symbol === computerUseExecutorResource.symbol) {
            return new resource_accessor_ComputerUseExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap record screen executor with hooks
        if (resource.symbol === recordScreenExecutorResource.symbol) {
            return new resource_accessor_RecordScreenExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap request context executor to inject hooks additional context and hooks config
        if (resource.symbol === requestContextExecutorResource.symbol &&
            (this.hooksAdditionalContextPromise || this.hooksConfigLease)) {
            return new resource_accessor_RequestContextExecutorWithHooksContext(innerImpl, this.hooksAdditionalContextPromise ?? Promise.resolve(undefined), this.teamHooksReadyPromise, this.hooksConfigLease);
        }
        // For all other resources, return the inner implementation as-is
        return innerImpl;
    }
}
/**
 * A ListableResourceAccessor that wraps another ListableResourceAccessor and applies hooks
 * to shell, shellstream, mcp, and write operations.
 *
 * This acts as middleware, intercepting resource access and wrapping the
 * executors with hook-aware versions, while also providing the ability to
 * enumerate all resources.
 */
class ListableHooksResourceAccessor {
    constructor(innerAccessor, hookExecutor, baseHookRequestExtractor, mcpLease, hooksAdditionalContextPromise, teamHooksReadyPromise, hooksConfigLease) {
        this.innerAccessor = innerAccessor;
        this.hookExecutor = hookExecutor;
        this.baseHookRequestExtractor = baseHookRequestExtractor;
        this.mcpLease = mcpLease;
        this.hooksAdditionalContextPromise = hooksAdditionalContextPromise;
        this.teamHooksReadyPromise = teamHooksReadyPromise;
        this.hooksConfigLease = hooksConfigLease;
    }
    get(resource) {
        if (resource.symbol === dist/* hookExecutorResource */.bob.symbol) {
            return new dist/* LocalHookExecutorImpl */.gl4(this.hookExecutor);
        }
        const innerImpl = this.innerAccessor.get(resource);
        // Wrap shell executor with hooks
        if (resource.symbol === dist/* shellExecutorResource */.qkk.symbol) {
            return new ShellExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap shell stream executor with hooks
        if (resource.symbol === dist/* shellStreamExecutorResource */.wve.symbol) {
            return new ShellStreamExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap write executor with hooks
        if (resource.symbol === dist/* writeExecutorResource */.Lnu.symbol) {
            return new WriteExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap MCP executor with hooks
        if (resource.symbol === dist/* mcpExecutorResource */.Yib.symbol) {
            return new McpToolExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor, this.mcpLease, this.hooksConfigLease);
        }
        // Wrap read executors with hooks (default and redacted)
        if (resource.symbol === dist/* readExecutorResource */._As.symbol ||
            resource.symbol === dist/* redactedReadExecutorResource */.Mfc.symbol) {
            return new ReadExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap ls executor with hooks
        if (resource.symbol === dist/* lsExecutorResource */.bL4.symbol) {
            return new LsExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap grep executor with hooks
        if (resource.symbol === dist/* grepExecutorResource */.u8v.symbol) {
            return new GrepExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap fetch executor with hooks
        if (resource.symbol === dist/* fetchExecutorResource */.IGA.symbol) {
            return new FetchExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap delete executor with hooks
        if (resource.symbol === dist/* deleteExecutorResource */.RpG.symbol) {
            return new DeleteExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap diagnostics executor with hooks
        if (resource.symbol === dist/* diagnosticsExecutorResource */.w4j.symbol) {
            return new DiagnosticsExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap list MCP resources executor with hooks
        if (resource.symbol === dist/* listMcpResourcesExecutorResource */.rn8.symbol) {
            return new ListMcpResourcesExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap read MCP resource executor with hooks
        if (resource.symbol === dist/* readMcpResourceExecutorResource */.mlu.symbol) {
            return new ReadMcpResourceExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap background shell executor with hooks
        if (resource.symbol === dist/* backgroundShellExecutorResource */.OkD.symbol) {
            return new BackgroundShellExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap write background shell stdin executor with hooks
        if (resource.symbol === dist/* writeBackgroundShellInputExecutorResource */.TQC.symbol) {
            return new WriteBackgroundShellStdinExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap computer use executor with hooks
        if (resource.symbol === dist/* computerUseExecutorResource */.iZk.symbol) {
            return new ComputerUseExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap record screen executor with hooks
        if (resource.symbol === dist/* recordScreenExecutorResource */.pq5.symbol) {
            return new RecordScreenExecutorWithHooks(innerImpl, this.hookExecutor, this.baseHookRequestExtractor);
        }
        // Wrap request context executor to inject hooks additional context and hooks config
        if (resource.symbol === dist/* requestContextExecutorResource */.MZM.symbol &&
            (this.hooksAdditionalContextPromise || this.hooksConfigLease)) {
            return new RequestContextExecutorWithHooksContext(innerImpl, this.hooksAdditionalContextPromise ?? Promise.resolve(undefined), this.teamHooksReadyPromise, this.hooksConfigLease);
        }
        // For all other resources, return the inner implementation as-is
        return innerImpl;
    }
    *entries() {
        // Iterate through all entries from the inner accessor
        for (const [resource, implementation] of this.innerAccessor.entries()) {
            // Wrap the implementation if it's one of the hooked resources
            if (resource.symbol === dist/* shellExecutorResource */.qkk.symbol) {
                yield [
                    resource,
                    new ShellExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* shellStreamExecutorResource */.wve.symbol) {
                yield [
                    resource,
                    new ShellStreamExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* writeExecutorResource */.Lnu.symbol) {
                yield [
                    resource,
                    new WriteExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* mcpExecutorResource */.Yib.symbol) {
                yield [
                    resource,
                    new McpToolExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor, this.mcpLease, this.hooksConfigLease),
                ];
            }
            else if (resource.symbol === dist/* readExecutorResource */._As.symbol ||
                resource.symbol === dist/* redactedReadExecutorResource */.Mfc.symbol) {
                yield [
                    resource,
                    new ReadExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* lsExecutorResource */.bL4.symbol) {
                yield [
                    resource,
                    new LsExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* grepExecutorResource */.u8v.symbol) {
                yield [
                    resource,
                    new GrepExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* fetchExecutorResource */.IGA.symbol) {
                yield [
                    resource,
                    new FetchExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* deleteExecutorResource */.RpG.symbol) {
                yield [
                    resource,
                    new DeleteExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* diagnosticsExecutorResource */.w4j.symbol) {
                yield [
                    resource,
                    new DiagnosticsExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* listMcpResourcesExecutorResource */.rn8.symbol) {
                yield [
                    resource,
                    new ListMcpResourcesExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* readMcpResourceExecutorResource */.mlu.symbol) {
                yield [
                    resource,
                    new ReadMcpResourceExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* backgroundShellExecutorResource */.OkD.symbol) {
                yield [
                    resource,
                    new BackgroundShellExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* writeBackgroundShellInputExecutorResource */.TQC.symbol) {
                yield [
                    resource,
                    new WriteBackgroundShellStdinExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* computerUseExecutorResource */.iZk.symbol) {
                yield [
                    resource,
                    new ComputerUseExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* recordScreenExecutorResource */.pq5.symbol) {
                yield [
                    resource,
                    new RecordScreenExecutorWithHooks(implementation, this.hookExecutor, this.baseHookRequestExtractor),
                ];
            }
            else if (resource.symbol === dist/* requestContextExecutorResource */.MZM.symbol &&
                (this.hooksAdditionalContextPromise || this.hooksConfigLease)) {
                yield [
                    resource,
                    new RequestContextExecutorWithHooksContext(implementation, this.hooksAdditionalContextPromise ?? Promise.resolve(undefined), this.teamHooksReadyPromise, this.hooksConfigLease),
                ];
            }
            else {
                // For all other resources, yield the inner implementation as-is
                yield [resource, implementation];
            }
        }
        yield [
            dist/* hookExecutorResource */.bob,
            new dist/* LocalHookExecutorImpl */.gl4(this.hookExecutor),
        ];
    }
}

;// ../hooks-exec/dist/index.js















// EXTERNAL MODULE: ../local-exec/dist/index.js + 151 modules
var local_exec_dist = __webpack_require__("../local-exec/dist/index.js");
// EXTERNAL MODULE: ../mcp-agent-exec/dist/index.js + 59 modules
var mcp_agent_exec_dist = __webpack_require__("../mcp-agent-exec/dist/index.js");
// EXTERNAL MODULE: ../secrets-exec/dist/index.js + 10 modules
var secrets_exec_dist = __webpack_require__("../secrets-exec/dist/index.js");
// EXTERNAL MODULE: ../shell-exec/dist/index.js + 28 modules
var shell_exec_dist = __webpack_require__("../shell-exec/dist/index.js");
// EXTERNAL MODULE: ../utils/dist/find-executable.js
var find_executable = __webpack_require__("../utils/dist/find-executable.js");
// EXTERNAL MODULE: ../utils/dist/workload-spawn.js
var workload_spawn = __webpack_require__("../utils/dist/workload-spawn.js");
;// ./src/agent-store-skills.ts


/**
 * How long a single mount probe may take before the turn stops waiting on it.
 * A FUSE whose server has died can hang path lookup indefinitely, and this
 * probe runs on the way into a turn's request context.
 */
const AGENT_STORE_SKILLS_MOUNT_PROBE_TIMEOUT_MS = 1_000;
/**
 * Skill discovery roots contributed by a mounted Agent Store. The path
 * is supplied by the launcher rather than derived here, since that is what
 * decides the FUSE mount root. Absent means no root, so it fails closed.
 */
function resolveAgentStoreSkillRoots(agentStoreSkillsDir) {
    const values = agentStoreSkillsDir === undefined
        ? []
        : typeof agentStoreSkillsDir === "string"
            ? [agentStoreSkillsDir]
            : agentStoreSkillsDir;
    const out = [];
    const seen = new Set();
    for (const raw of values) {
        const trimmed = raw.trim();
        if (trimmed === "" || seen.has(trimmed)) {
            continue;
        }
        seen.add(trimmed);
        out.push(trimmed);
    }
    return out;
}
async function probeAgentStoreMount(dir) {
    try {
        const stats = await (0,promise_extras/* withTimeout */.wj)((0,promises_.stat)(dir), AGENT_STORE_SKILLS_MOUNT_PROBE_TIMEOUT_MS);
        return stats.isDirectory() ? "mounted" : "absent";
    }
    catch (error) {
        return error instanceof promise_extras/* TimeoutError */.MU ? "unresponsive" : "absent";
    }
}
/**
 * Watches for the Agent Store skills roots to appear, and reloads each one the
 * first time it does.
 *
 * The daemon builds its skill list at startup, before the FUSE mount lands,
 * and a directory walk cannot tell "not mounted yet" from "empty" — the walker
 * reads a missing root as no skills — so that first empty answer is what every
 * later turn would serve. Checking here, on the way into each turn's request
 * context, keeps the pod self-healing: whichever turn first sees the mount
 * gets the skills, with no delivery-time orchestration to miss a resume or a
 * daemon restart.
 *
 * A root is probed until it appears and reloaded exactly once. An unmount
 * followed by a remount is not re-detected, the same exposure a pod already
 * has when its FUSE dies mid-session.
 */
function createAgentStoreSkillsMountLatch(args) {
    const pending = new Set(args.roots);
    if (pending.size === 0) {
        return async () => { };
    }
    const probeMount = args.probeMount ?? probeAgentStoreMount;
    // Turns can overlap, and both would otherwise probe and reload the same
    // root. Sharing the in-flight probe makes the reload happen once.
    let inFlight;
    const probePending = async () => {
        const appeared = [];
        for (const root of [...pending]) {
            const result = await probeMount(root);
            if (result === "mounted") {
                appeared.push(root);
                continue;
            }
            if (result === "unresponsive") {
                // Stop asking. The probe that timed out is still holding a threadpool
                // thread, and a mount this broken will not start answering because we
                // asked again next turn.
                pending.delete(root);
                args.onUnresponsive?.(root);
            }
        }
        if (appeared.length === 0) {
            return;
        }
        for (const root of appeared) {
            pending.delete(root);
        }
        args.reloadRoots(appeared);
        args.onReloaded?.(appeared);
    };
    return async () => {
        if (pending.size === 0) {
            return;
        }
        inFlight ??= probePending().finally(() => {
            inFlight = undefined;
        });
        await inFlight;
    };
}

// EXTERNAL MODULE: ./src/artifactUploads.ts
var artifactUploads = __webpack_require__("./src/artifactUploads.ts");
// EXTERNAL MODULE: external "node:url"
var external_node_url_ = __webpack_require__("node:url");
// EXTERNAL MODULE: ../canvas-server/dist/canvas-diagnostics-provider.js + 1 modules
var canvas_diagnostics_provider = __webpack_require__("../canvas-server/dist/canvas-diagnostics-provider.js");
// EXTERNAL MODULE: ../canvas-server/dist/canvas-skill-types-section.js
var canvas_skill_types_section = __webpack_require__("../canvas-server/dist/canvas-skill-types-section.js");
;// ../canvas-server/dist/canvas-skill-sdk-mirror.js
/* unused harmony import specifier */ var readdirSync;
/* unused harmony import specifier */ var readFileSync;
/* unused harmony import specifier */ var canvas_skill_sdk_mirror_join;
/* unused harmony import specifier */ var defaultCanvasSkillTypesSdkSourceDir;




/**
 * The staged `<kit>/canvas/*.d.ts` files (no `*.test.d.ts`), sorted by name.
 * Omit `sdkSourceDir` to read this package's `dist/sdk`. Throws when the tree
 * is missing.
 */
function readCanvasSkillSdkFiles(options) {
    const canvasDir = canvas_skill_sdk_mirror_join(options.sdkSourceDir ?? defaultCanvasSkillTypesSdkSourceDir(), options.kit, "canvas");
    return readdirSync(canvasDir)
        .filter((name) => name.endsWith(".d.ts") && !name.endsWith(".test.d.ts"))
        .sort()
        .map((name) => ({ name, content: readFileSync(canvas_skill_sdk_mirror_join(canvasDir, name), "utf8") }));
}
/**
 * Copy the public `cursor/canvas` SDK declarations next to the canvas skill
 * so the model can read `~/.cursor/skills-cursor/canvas/sdk/*.d.ts`.
 * The diagnostics provider still bootstraps the full SDK tree (including
 * `@types/react`) into the canvases dir — this mirror is discoverability only.
 */
async function ensureCanvasSkillSdkMirror(options) {
    const sourceDir = (0,external_node_path_.join)(options.sdkSourceDir, "cursor", "canvas");
    const mirrorDir = (0,external_node_path_.join)(options.skillDir, "sdk");
    try {
        await (0,promises_.access)(sourceDir);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
    await (0,promises_.mkdir)(options.skillDir, { recursive: true });
    await (0,promises_.rm)(mirrorDir, { recursive: true, force: true });
    await (0,promises_.cp)(sourceDir, mirrorDir, {
        force: true,
        recursive: true,
    });
    return true;
}
//# sourceMappingURL=canvas-skill-sdk-mirror.js.map
// EXTERNAL MODULE: ../canvas-shared/dist/canvas-share-bundle.js
var canvas_share_bundle = __webpack_require__("../canvas-shared/dist/canvas-share-bundle.js");
;// ./src/canvasShareBundle.ts








const canvasShareBundle_logger = (0,logger/* createLogger */.h)("exec-daemon:canvas-share-bundle");
/** Per dest-path generation so a slower older compile cannot overwrite a newer gzip. */
const persistGenerations = new Map();
const RUNTIME_FILENAME = "canvas-runtime.esm.js";
/**
 * Directory of this module at runtime. Prefer `__dirname`: the packaged CJS
 * bundle sees the VM path of `index.js`, where `build-package.ts` copies
 * `canvas-runtime/`. `import.meta.url` is webpack-baked to the build machine.
 */
function moduleDirname() {
    if (typeof __dirname === "string" && __dirname.length > 0) {
        return __dirname;
    }
    try {
        return external_node_path_default().dirname((0,external_node_url_.fileURLToPath)("file:///workdir/packages/exec-daemon/src/canvasShareBundle.ts"));
    }
    catch {
        return process.cwd();
    }
}
/** True when `filePath` is the directory or a descendant (no `..` escape). */
function isPathInsideDir(args) {
    const resolvedFile = external_node_path_default().resolve(args.filePath);
    const resolvedDir = external_node_path_default().resolve(args.dir);
    return resolvedFile === resolvedDir || resolvedFile.startsWith(resolvedDir + (external_node_path_default()).sep);
}
/** Locate the packaged canvas runtime ESM used to lock the preview environment. */
function resolveCanvasRuntimeDir(here = moduleDirname()) {
    const candidates = [external_node_path_default().join(here, "canvas-runtime")];
    try {
        const require = /* createRequire() */ undefined;
        const canvasServerEntry = /*require.resolve*/("../canvas-server/dist/index.js?8178");
        candidates.push(external_node_path_default().join(external_node_path_default().dirname(canvasServerEntry), "runtime"));
    }
    catch {
        // Bundled hosts copy the runtime next to the daemon instead.
    }
    return candidates.find((dir) => external_node_fs_.existsSync(external_node_path_default().join(dir, RUNTIME_FILENAME)));
}
function canvasShareBundleArtifactAbsolutePath(args) {
    const bundleFileName = (0,canvas_share_bundle/* canvasSourceBasenameToShareBundleFileName */.pZ)(external_node_path_default().basename(args.canvasPath));
    if (bundleFileName === undefined) {
        return undefined;
    }
    return `${(0,canvas_share_bundle/* agentCanvasPreviewPrefix */.u3)(args.artifactsRoot)}${bundleFileName}`;
}
function canvasShareBundleDestDir(artifactsRoot) {
    return (0,canvas_share_bundle/* agentCanvasPreviewPrefix */.u3)(artifactsRoot).slice(0, -1);
}
function isNotFoundError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT");
}
async function removeFileIfPresent(filePath) {
    try {
        await promises_.unlink(filePath);
    }
    catch (error) {
        if (!isNotFoundError(error)) {
            throw error;
        }
    }
}
/**
 * Drop preview gzips whose matching `.canvas.tsx` is gone (delete / rename).
 * Compile failures must not call this for the current dest — last-good stays.
 */
async function removeStaleCanvasShareBundles(args) {
    const destDir = canvasShareBundleDestDir(args.artifactsRoot);
    let names;
    try {
        names = await promises_.readdir(destDir);
    }
    catch (error) {
        if (isNotFoundError(error)) {
            return;
        }
        throw error;
    }
    await Promise.all(names.map(async (name) => {
        if (!(0,canvas_share_bundle/* isCanvasShareBundleFileName */.VY)(name)) {
            return;
        }
        const sourceBasename = (0,canvas_share_bundle/* canvasShareBundleFileNameToSourceBasename */.P4)(name);
        if (sourceBasename === undefined) {
            return;
        }
        const sourcePath = external_node_path_default().join(args.canvasesDir, sourceBasename);
        try {
            await promises_.access(sourcePath);
        }
        catch (error) {
            if (isNotFoundError(error)) {
                await removeFileIfPresent(external_node_path_default().join(destDir, name));
            }
        }
    }));
}
/**
 * Compile a managed `.canvas.tsx` into the gzip v1 share bundle and write it
 * under the artifacts root (`canvases/<name>.canvas.bundle.gz`). On FUSE pods
 * that root is the current agent's store artifacts dir, so the write is the
 * persist. Best-effort: missing runtime or compile errors skip the write.
 */
async function persistCanvasShareBundle(args) {
    const destPath = canvasShareBundleArtifactAbsolutePath({
        canvasPath: args.canvasPath,
        artifactsRoot: args.artifactsRoot,
    });
    if (destPath === undefined) {
        return undefined;
    }
    const generation = (persistGenerations.get(destPath) ?? 0) + 1;
    persistGenerations.set(destPath, generation);
    const runtimeDir = args.runtimeDir ?? resolveCanvasRuntimeDir();
    if (args.buildArtifact === undefined && runtimeDir === undefined) {
        canvasShareBundle_logger.warn(args.ctx, "Canvas runtime ESM missing; skipping share-bundle persist");
        return undefined;
    }
    const canvasesDir = external_node_path_default().dirname(args.canvasPath);
    let source;
    try {
        source = await promises_.readFile(args.canvasPath, "utf8");
    }
    catch (error) {
        if (isNotFoundError(error)) {
            await removeFileIfPresent(destPath);
            await removeStaleCanvasShareBundles({
                canvasesDir,
                artifactsRoot: args.artifactsRoot,
            });
            return undefined;
        }
        canvasShareBundle_logger.warn(args.ctx, "Failed to read canvas source for share bundle", {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
    if (source.trim() === "") {
        await removeFileIfPresent(destPath);
        return undefined;
    }
    let appJs;
    try {
        const buildArtifact = args.buildArtifact ??
            (await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, "../canvas-server/dist/canvas-share-artifact.js")))
                .buildCanvasShareArtifactFromSource;
        const artifact = await buildArtifact({
            source,
            canvasPath: args.canvasPath,
            runtimeDir,
        });
        appJs = artifact.appJs;
    }
    catch (error) {
        canvasShareBundle_logger.warn(args.ctx, "Canvas share-bundle compile failed", {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
    if (persistGenerations.get(destPath) !== generation) {
        return undefined;
    }
    const destDir = external_node_path_default().dirname(destPath);
    const tempPath = external_node_path_default().join(destDir, `.${external_node_path_default().basename(destPath)}.${(0,external_node_crypto_.randomUUID)()}.tmp`);
    try {
        await promises_.mkdir(destDir, { recursive: true });
        await promises_.writeFile(tempPath, Buffer.from(appJs));
        if (persistGenerations.get(destPath) !== generation) {
            try {
                await promises_.unlink(tempPath);
            }
            catch {
                // Best-effort cleanup of the superseded temp file.
            }
            return undefined;
        }
        await promises_.rename(tempPath, destPath);
    }
    catch (error) {
        try {
            await promises_.unlink(tempPath);
        }
        catch {
            // Best-effort cleanup of the temp file.
        }
        canvasShareBundle_logger.warn(args.ctx, "Failed to persist canvas share bundle", {
            error: error instanceof Error ? error.message : String(error),
        });
        return undefined;
    }
    try {
        await removeStaleCanvasShareBundles({
            canvasesDir,
            artifactsRoot: args.artifactsRoot,
        });
    }
    catch (error) {
        canvasShareBundle_logger.warn(args.ctx, "Failed to remove stale canvas share bundles", {
            error: error instanceof Error ? error.message : String(error),
        });
    }
    canvasShareBundle_logger.info(args.ctx, "Persisted canvas share bundle", {
        artifactName: external_node_path_default().basename(destPath),
        bytes: appJs.byteLength,
    });
    return destPath;
}

// EXTERNAL MODULE: external "node:zlib"
var external_node_zlib_ = __webpack_require__("node:zlib");
// EXTERNAL MODULE: ../canvas-server/dist/canvas-path-validation.js
var canvas_path_validation = __webpack_require__("../canvas-server/dist/canvas-path-validation.js");
// EXTERNAL MODULE: ../constants/dist/agent-store-ids.js
var agent_store_ids = __webpack_require__("../constants/dist/agent-store-ids.js");
// EXTERNAL MODULE: ../canvas-shared/dist/cloud-canvas.js
var cloud_canvas = __webpack_require__("../canvas-shared/dist/cloud-canvas.js");
;// ./src/canvasStorePersist.ts








const canvasStorePersist_logger = (0,logger/* createLogger */.h)("exec-daemon:canvas-store-persist");

const SOURCE_BASENAME = agent_store_ids/* CLOUD_CANVAS_SOURCE_BASENAME */.EN;
const TYPECHECK_WAIT_BUDGET_MS = 30_000;
const TITLE_PRAGMA_REGEX = /^\s*\/\/\s*cursor-canvas-title:\s*(.+?)\s*$/m;
const TITLE_MAX_CHARS = 120;
const SAVE_DETAIL_MAX_CHARS = 2000;
/** Nudge (not a gate): untitled saves still publish, but the footer teaches
 * the model to set a title via the pragma. */
const NO_TITLE_PRAGMA_NUDGE = "no title pragma found — the canvas will show as Untitled; add " +
    "`// cursor-canvas-title: <Your Title>` at the top of the source to set one.";
const MAX_BUNDLE_DECOMPRESSED_BYTES = 20_000_000;
// Re-exported from the canvas-shared SSOT so the daemon persist path and the
// BOX wire RPC share one numeric source cap. Kept under this local name for
// existing daemon consumers/tests.
const CANVAS_SOURCE_MAX_BYTES = cloud_canvas/* CLOUD_CANVAS_SOURCE_MAX_BYTES */.Ur;
/** How far in the future an existing manifest's `updatedAt` may sit and
 * still be carried forward by the monotonic merge. Beyond this the stamp is
 * treated as skew damage and repaired to the local clock — otherwise a
 * far-future stamp would win every merge and never reflect real edits. */
const MAX_MANIFEST_FUTURE_SKEW_MS = 5 * 60_000;
function errnoCode(error) {
    return typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
        ? error.code
        : undefined;
}
function oversizedSourceDetail(sourceBytes) {
    return (`canvas source is ${sourceBytes} bytes, over the ` +
        `${CANVAS_SOURCE_MAX_BYTES}-byte source limit. Nothing was published; ` +
        `move large datasets into canvas.data.json or reduce the source size, ` +
        `then save again.`);
}
function parseCanvasTitlePragma(source) {
    const match = TITLE_PRAGMA_REGEX.exec(source);
    const title = match?.[1]?.trim().slice(0, TITLE_MAX_CHARS);
    return title !== undefined && title.length > 0 ? title : undefined;
}
async function resolveWithinBudget(promise, budgetMs, fallback) {
    let timer;
    const budget = new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallback), budgetMs);
        timer.unref?.();
    });
    try {
        return await Promise.race([promise.catch(() => fallback), budget]);
    }
    finally {
        if (timer !== undefined) {
            clearTimeout(timer);
        }
    }
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
/**
 * Write discipline follows `artifactUploads`' directWrite mode: plain
 * in-place writes whose close is the FUSE object PUT — never a FUSE rename.
 * Publish order is bundle → manifest (manifest-last), and nothing is ever
 * deleted, even on write failure — the last good bundle/manifest stay and
 * readers fail closed on torn content.
 *
 * Cross-writer posture is last-writer-wins: concurrent sessions saving the
 * same canvas converge on whichever publish lands last, and a lost save
 * self-heals on the next edit. In-process ordering is still enforced by
 * accept tickets, so within one daemon an older save never overwrites a
 * newer one.
 */
class CanvasStorePersist {
    ctx;
    canvasesRoots;
    runtimeDir;
    buildArtifactOverride;
    isFuseBacked;
    now;
    /** Mounts can arrive after daemon boot, so negative probe results are
     * never cached. Positive results are cached per root. */
    fuseKnownAvailable = new Set();
    acceptTickets = new Map();
    enqueuedGenerations = new Map();
    chains = new Map();
    titleCache = new Map();
    lastFailureDetail = new Map();
    inFlight = new Set();
    constructor(options) {
        this.ctx = options.ctx;
        this.canvasesRoots = options.canvasesRoots ?? agent_store_ids/* CANVAS_STORE_PERSIST_ROOTS */.ur;
        this.runtimeDir = options.runtimeDir;
        this.buildArtifactOverride = options.buildArtifact;
        this.isFuseBacked = options.isFuseBacked ?? artifactUploads/* isAgentStoreFuseBackedPath */.PM;
        this.now = options.now ?? (() => new Date());
    }
    beginCanvasSave = (filePath, options) => this.begin(filePath, options);
    async settle() {
        while (this.inFlight.size > 0) {
            await Promise.all([...this.inFlight]);
        }
    }
    async begin(filePath, options) {
        const store = (0,canvas_path_validation/* classifyStoreCanvasSavePath */.K3)(filePath, this.canvasesRoots);
        if (store.kind === "unrelated") {
            return undefined;
        }
        if (store.kind === "invalid") {
            return { saveState: "invalid_path", saveDetail: store.reason };
        }
        const { canvasId, canvasDir, canvasesRoot } = store;
        const sourcePath = external_node_path_default().join(canvasDir, SOURCE_BASENAME);
        // Ticket before any await, so tickets order by acceptance rather than
        // by how long the awaits below take.
        const generation = this.takeAcceptTicket(canvasId);
        let statBytes;
        try {
            statBytes = (await promises_.stat(sourcePath)).size;
        }
        catch {
            // Best-effort early size probe only: a real read problem surfaces as
            // `unavailable` at the readFile below, after the typecheck gate.
        }
        if (statBytes !== undefined && statBytes > CANVAS_SOURCE_MAX_BYTES) {
            return {
                saveState: "too_large",
                saveDetail: oversizedSourceDetail(statBytes),
            };
        }
        if (!(await this.probeFuse(canvasesRoot))) {
            return {
                saveState: "unavailable",
                saveDetail: `${canvasesRoot} is not mounted (not fuse.agent-store); nothing was published`,
            };
        }
        const outcome = await resolveWithinBudget(options?.typecheckOutcome ?? Promise.resolve("passed"), TYPECHECK_WAIT_BUDGET_MS, "unavailable");
        if (outcome === "failed") {
            return {
                saveState: "typecheck_failed",
                saveDetail: "type check failed; nothing was published — fix the errors above and save again",
            };
        }
        if (outcome !== "passed") {
            return {
                saveState: "unavailable",
                saveDetail: "the canvas TypeScript check could not run; nothing was published — save this file again to retry",
            };
        }
        let source;
        try {
            source = await promises_.readFile(sourcePath, "utf8");
        }
        catch (error) {
            return {
                saveState: "unavailable",
                saveDetail: `could not read canvas source: ${errorMessage(error)}`,
            };
        }
        const sourceBytes = Buffer.byteLength(source, "utf8");
        if (sourceBytes > CANVAS_SOURCE_MAX_BYTES) {
            return {
                saveState: "too_large",
                saveDetail: oversizedSourceDetail(sourceBytes),
            };
        }
        // The cache is only ever written on publish success (and by the
        // manifest fallback, which reads published state). Caching the pragma
        // here, before validation, would let a failed save's title leak into a
        // later save's footer while the written manifest stays untitled.
        const pragmaTitle = parseCanvasTitlePragma(source);
        const title = pragmaTitle ??
            this.titleCache.get(canvasId) ??
            (await this.manifestTitleFallback(canvasId, canvasDir));
        if (this.buildArtifactOverride === undefined && this.runtimeDir === undefined) {
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: "canvas runtime is missing from the daemon bundle; cannot compile",
            });
        }
        let bundleBytes;
        try {
            const buildArtifact = this.buildArtifactOverride ??
                (await Promise.resolve(/* import() */).then(__webpack_require__.bind(__webpack_require__, "../canvas-server/dist/canvas-share-artifact.js")))
                    .buildCanvasShareArtifactFromSource;
            const artifact = await buildArtifact({
                source,
                canvasPath: sourcePath,
                runtimeDir: this.runtimeDir,
            });
            bundleBytes = artifact.appJs;
        }
        catch (error) {
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: `compile failed: ${errorMessage(error)}`,
            });
        }
        const compiledAt = this.now();
        if (!(0,cloud_canvas/* isGzipMagic */.IR)(bundleBytes)) {
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: "compiler produced a non-gzip bundle",
            });
        }
        try {
            (0,external_node_zlib_.gunzipSync)(Buffer.from(bundleBytes), {
                maxOutputLength: MAX_BUNDLE_DECOMPRESSED_BYTES,
            });
        }
        catch (error) {
            if (errnoCode(error) === "ERR_BUFFER_TOO_LARGE") {
                return this.syncFailure(canvasId, title, {
                    saveState: "too_large",
                    detail: `compiled bundle exceeds the ${MAX_BUNDLE_DECOMPRESSED_BYTES}-byte ` +
                        `decompressed render limit; nothing was published`,
                });
            }
            return this.syncFailure(canvasId, title, {
                saveState: "compile_failed",
                detail: `compiled bundle failed gzip validation: ${errorMessage(error)}`,
            });
        }
        let dataBytes = 0;
        try {
            dataBytes = (await promises_.stat(external_node_path_default().join(canvasDir, cloud_canvas/* CLOUD_CANVAS_DATA_BASENAME */.n_))).size;
        }
        catch (error) {
            // Absent data file is the normal case; any other stat failure would
            // undercount the payload cap, so fail the save instead of guessing.
            if (errnoCode(error) !== "ENOENT") {
                return {
                    saveState: "unavailable",
                    saveDetail: `could not size ${cloud_canvas/* CLOUD_CANVAS_DATA_BASENAME */.n_}: ${errorMessage(error)}`,
                };
            }
        }
        const totalBytes = sourceBytes + bundleBytes.byteLength + dataBytes;
        if (totalBytes > cloud_canvas/* CLOUD_CANVAS_PAYLOAD_MAX_BYTES */.NH) {
            return this.syncFailure(canvasId, title, {
                saveState: "too_large",
                detail: `canvas payload too large: source ${sourceBytes}B + bundle ` +
                    `${bundleBytes.byteLength}B + data ${dataBytes}B = ${totalBytes}B ` +
                    `exceeds ${cloud_canvas/* CLOUD_CANVAS_PAYLOAD_MAX_BYTES */.NH}B; nothing was published`,
            });
        }
        const validated = {
            canvasId,
            canvasDir,
            canvasesRoot,
            sourcePath,
            source,
            bundleBytes,
            compiledAt,
            generation,
        };
        this.enqueuedGenerations.set(canvasId, Math.max(this.enqueuedGenerations.get(canvasId) ?? 0, generation));
        const chained = (this.chains.get(canvasId) ?? Promise.resolve())
            .then(() => this.publish(validated))
            .catch((error) => {
            canvasStorePersist_logger.warn(this.ctx, "Canvas store publish crashed", {
                error: errorMessage(error),
            });
        });
        this.chains.set(canvasId, chained);
        this.inFlight.add(chained);
        void chained.finally(() => this.inFlight.delete(chained));
        const lastFailure = this.lastFailureDetail.get(canvasId);
        // The previous-failure echo wins over the title nudge: the failure is
        // the actionable signal, and the nudge resurfaces once it clears.
        const saveDetail = lastFailure !== undefined
            ? `previous save failed: ${lastFailure}`
            : title === undefined
                ? NO_TITLE_PRAGMA_NUDGE
                : undefined;
        return {
            saveState: "pending",
            canvasId,
            title,
            ...(saveDetail !== undefined ? { saveDetail } : {}),
        };
    }
    syncFailure(canvasId, title, args) {
        const clamped = args.detail.length > SAVE_DETAIL_MAX_CHARS
            ? `${args.detail.slice(0, SAVE_DETAIL_MAX_CHARS)}… [truncated]`
            : args.detail;
        return {
            saveState: args.saveState,
            canvasId,
            title,
            saveDetail: clamped,
        };
    }
    /** Cold-cache fallback for the sync title: the in-memory cache dies with
     * the daemon, but the on-disk manifest survives and publish() carries its
     * title forward — so a pragma-less edit of a titled canvas must not be
     * reported as one that will show as Untitled. Read failures resolve
     * undefined: the canvas is then treated as genuinely untitled. */
    async manifestTitleFallback(canvasId, canvasDir) {
        let rawManifest;
        try {
            rawManifest = JSON.parse(await promises_.readFile(external_node_path_default().join(canvasDir, cloud_canvas/* CLOUD_CANVAS_MANIFEST_BASENAME */._g), "utf8"));
        }
        catch {
            return this.titleCache.get(canvasId);
        }
        const parsed = (0,cloud_canvas/* parseCloudCanvasManifest */.Yz)(rawManifest);
        const title = parsed.ok ? parsed.value.title : undefined;
        // The read above is unchained: a publish can land (and cache a fresher
        // title) while it is in flight. Prefer whatever is cached by the time
        // the read resolves, and only fill an empty slot — this fallback must
        // never overwrite a title recorded by a successful publish.
        const cached = this.titleCache.get(canvasId);
        if (cached !== undefined) {
            return cached;
        }
        if (title !== undefined) {
            this.titleCache.set(canvasId, title);
        }
        return title;
    }
    async probeFuse(canvasesRoot) {
        if (this.fuseKnownAvailable.has(canvasesRoot)) {
            return true;
        }
        const available = await this.isFuseBacked(canvasesRoot).catch(() => false);
        if (available) {
            this.fuseKnownAvailable.add(canvasesRoot);
        }
        return available;
    }
    recordFailure(canvasId, detail) {
        const clamped = detail.length > SAVE_DETAIL_MAX_CHARS
            ? `${detail.slice(0, SAVE_DETAIL_MAX_CHARS)}… [truncated]`
            : detail;
        this.lastFailureDetail.set(canvasId, clamped);
        canvasStorePersist_logger.warn(this.ctx, "Canvas store publish failed", {
            canvasId,
            detail: clamped,
        });
    }
    takeAcceptTicket(canvasId) {
        const ticket = (this.acceptTickets.get(canvasId) ?? 0) + 1;
        this.acceptTickets.set(canvasId, ticket);
        return ticket;
    }
    isStale(canvasId, generation) {
        return (this.enqueuedGenerations.get(canvasId) ?? 0) > generation;
    }
    async publish(save) {
        const { canvasId, canvasDir, source, bundleBytes, compiledAt, generation } = save;
        if (this.isStale(canvasId, generation)) {
            return;
        }
        // The existing manifest is read only to carry metadata forward
        // (createdAt, title, monotonic updatedAt). Cross-writer content races
        // are last-writer-wins by design.
        const manifestPath = external_node_path_default().join(canvasDir, cloud_canvas/* CLOUD_CANVAS_MANIFEST_BASENAME */._g);
        let rawManifest;
        try {
            rawManifest = JSON.parse(await promises_.readFile(manifestPath, "utf8"));
        }
        catch {
            rawManifest = undefined;
        }
        const parsedExisting = (0,cloud_canvas/* parseCloudCanvasManifest */.Yz)(rawManifest);
        const existing = parsedExisting.ok ? parsedExisting.value : undefined;
        const bundlePath = external_node_path_default().join(canvasDir, cloud_canvas/* CLOUD_CANVAS_BUNDLE_BASENAME */.Rj);
        try {
            await promises_.writeFile(bundlePath, Buffer.from(bundleBytes), {
                mode: 0o666,
            });
        }
        catch (error) {
            this.recordFailure(canvasId, `bundle write failed: ${errorMessage(error)}`);
            return;
        }
        const nowIso = this.now().toISOString();
        const createdAt = existing?.createdAt ?? nowIso;
        let updatedAt = nowIso;
        if (existing !== undefined) {
            const existingUpdatedMs = Date.parse(existing.updatedAt);
            const nowMs = Date.parse(nowIso);
            if (existingUpdatedMs > nowMs && existingUpdatedMs - nowMs <= MAX_MANIFEST_FUTURE_SKEW_MS) {
                updatedAt = existing.updatedAt;
            }
        }
        const pragmaTitle = parseCanvasTitlePragma(source);
        const title = pragmaTitle ?? existing?.title;
        const manifest = {
            version: cloud_canvas/* CLOUD_CANVAS_MANIFEST_VERSION */.EC,
            canvasId,
            ...(title !== undefined ? { title } : {}),
            createdAt,
            updatedAt,
            sourceSha256: (0,external_node_crypto_.createHash)("sha256").update(source, "utf8").digest("hex"),
            compiledAt: compiledAt.toISOString(),
        };
        const manifestText = JSON.stringify(manifest);
        if (!(0,cloud_canvas/* parseCloudCanvasManifest */.Yz)(JSON.parse(manifestText)).ok) {
            this.recordFailure(canvasId, "merged manifest failed shared-schema validation; manifest not written");
            return;
        }
        if (Buffer.byteLength(manifestText, "utf8") > cloud_canvas/* CLOUD_CANVAS_MANIFEST_MAX_BYTES */.Wo) {
            this.recordFailure(canvasId, `manifest exceeds ${cloud_canvas/* CLOUD_CANVAS_MANIFEST_MAX_BYTES */.Wo}B; manifest not written`);
            return;
        }
        try {
            await promises_.writeFile(manifestPath, manifestText, { mode: 0o666 });
        }
        catch (error) {
            this.recordFailure(canvasId, `manifest write failed: ${errorMessage(error)}`);
            return;
        }
        if (title !== undefined) {
            this.titleCache.set(canvasId, title);
        }
        this.lastFailureDetail.delete(canvasId);
        canvasStorePersist_logger.info(this.ctx, "Persisted store canvas", {
            canvasId,
            canvasesRoot: save.canvasesRoot,
            bundleBytes: bundleBytes.byteLength,
        });
    }
}
function createCanvasStorePersist(options) {
    return new CanvasStorePersist(options);
}

;// ./src/canvasDiagnostics.ts











const canvasDiagnostics_logger = (0,logger/* createLogger */.h)("exec-daemon:canvas");
/**
 * Directory of this module at runtime.
 *
 * Prefer `__dirname`. webpack.package.config.cjs sets `node.__dirname:
 * false`, so the packaged CJS bundle sees the VM path of `index.js` —
 * the same directory `build-package.ts` copies `agent-sdk/` and
 * `node_modules/typescript` into. Do not lead with `import.meta.url`:
 * webpack bakes that to the build-machine source path, and
 * `CanvasDiagnosticsProviderOptions.tsResolveAnchor` documents the same
 * trap. Unbundled ESM (vitest / tsx) has no `__dirname` and falls
 * through to `import.meta.url`.
 */
function resolveExecDaemonRuntimeDir() {
    if (typeof __dirname === "string" && __dirname.length > 0) {
        return __dirname;
    }
    try {
        return external_node_path_default().dirname((0,external_node_url_.fileURLToPath)("file:///workdir/packages/exec-daemon/src/canvasDiagnostics.ts"));
    }
    catch {
        return process.cwd();
    }
}
/** Locate the staged canvas SDK tree (`cursor/`, `@types/react/`, version marker). */
function resolveCanvasSdkSourceDir(here = resolveExecDaemonRuntimeDir()) {
    const candidates = [external_node_path_default().join(here, "agent-sdk")];
    try {
        const require = /* createRequire() */ undefined;
        const canvasServerEntry = require.resolve("@anysphere/canvas-server");
        candidates.push(external_node_path_default().join(external_node_path_default().dirname(canvasServerEntry), "sdk"));
    }
    catch {
        // Bundled hosts copy the SDK next to the daemon instead.
    }
    return candidates.find((dir) => external_node_fs_.existsSync(external_node_path_default().join(dir, "cursor")));
}
/**
 * Best-effort canvas diagnostics + skill SDK mirror for cloud/private-worker
 * exec-daemon. Missing SDK assets disable diagnostics; they do not fail setup.
 */
function setupExecDaemonCanvasDiagnostics(args) {
    const runtimeDir = resolveExecDaemonRuntimeDir();
    const sdkSourceDir = resolveCanvasSdkSourceDir(runtimeDir);
    if (sdkSourceDir === undefined) {
        canvasDiagnostics_logger.warn(args.ctx, "Canvas SDK source missing; skipping canvas diagnostics");
        return undefined;
    }
    const canvasesDir = external_node_path_default().join(getProjectDir(args.workspacePath), "canvases");
    const skillDir = external_node_path_default().join((0,local_exec_dist/* getBuiltinSkillsDir */.T2h)(), "canvas");
    const remirrorSkillSdk = async () => {
        try {
            await ensureCanvasSkillSdkMirror({ sdkSourceDir, skillDir });
        }
        catch (error) {
            canvasDiagnostics_logger.warn(args.ctx, "Canvas skill SDK mirror failed", {
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };
    void remirrorSkillSdk();
    const enableStoreCanvasPersist = args.enableStoreCanvasPersist === true;
    const provider = (0,canvas_diagnostics_provider/* createCanvasDiagnosticsProvider */.WT)({
        canvasesDir,
        sdkSourceDir,
        // Unbundled: exec-daemon/src walks up to packages/exec-daemon/node_modules/typescript.
        // Packaged: build-package.ts copies typescript next to the bundle as node_modules/typescript.
        tsResolveAnchor: runtimeDir,
        extraMatchRoot: enableStoreCanvasPersist ? agent_store_ids/* CANVAS_STORE_PERSIST_ROOTS */.ur : undefined,
    });
    void provider.bootstrapReady.then((result) => {
        if (result === undefined) {
            canvasDiagnostics_logger.error(args.ctx, "Canvas SDK source missing from exec-daemon bundle");
        }
        else {
            canvasDiagnostics_logger.info(args.ctx, "Canvas diagnostics provider ready");
        }
    }, (error) => {
        canvasDiagnostics_logger.warn(args.ctx, "Canvas dir bootstrap failed", {
            error: error instanceof Error ? error.message : String(error),
        });
    });
    // Search next to the packaged index.js first — same dir as agent-sdk/.
    const canvasRuntimeDir = resolveCanvasRuntimeDir(runtimeDir);
    const artifactsRoot = args.artifactsRoot;
    const getCanvasDiagnostics = (filePath) => {
        // Preview compile must not sit on the diagnostics RPC (the agent races
        // it against a timeout). Kick the agent-store write in parallel; portal
        // shows the artifact once FUSE has the gzip.
        if (artifactsRoot !== undefined &&
            artifactsRoot.length > 0 &&
            isPathInsideDir({ filePath, dir: canvasesDir })) {
            void persistCanvasShareBundle({
                ctx: args.ctx,
                canvasPath: filePath,
                artifactsRoot,
                runtimeDir: canvasRuntimeDir,
            });
        }
        return provider.getDiagnostics(filePath);
    };
    if (!enableStoreCanvasPersist) {
        return {
            getCanvasDiagnostics,
            remirrorSkillSdk,
        };
    }
    const storePersist = createCanvasStorePersist({
        ctx: args.ctx,
        runtimeDir: canvasRuntimeDir,
    });
    return {
        getCanvasDiagnostics,
        remirrorSkillSdk,
        beginCanvasSave: storePersist.beginCanvasSave,
    };
}

;// ./src/canvasPreviewPersistRoot.ts


const CURSOR_CONVERSATION_ID_ENV = "CURSOR_CONVERSATION_ID";
/**
 * Keep in sync with `AGENT_STORE_MOUNT_ROOT` /
 * `AGENT_STORE_SELF_MOUNT_NAME` / `isAgentStoreSourceId` in
 * `packages/constants/src/agent-store-ids.ts`. Duplicated so the published
 * daemon bundle does not take a runtime `@anysphere/constants` dependency.
 */
const AGENT_STORE_MOUNT_ROOT = "/cursor/stores";
const AGENT_STORE_SELF_MOUNT_NAME = "self";
const CLOUD_AGENT_STORE_ID_PATTERN = /^bc-(?:[0-9a-z][0-9a-z-]*-)?[0-9a-f]{8}-[0-9a-f]{4}-[1-57][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BARE_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-57][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isCanvasPreviewStoreSourceId(sourceId) {
    return CLOUD_AGENT_STORE_ID_PATTERN.test(sourceId) || BARE_UUID_PATTERN.test(sourceId);
}
function normalizeAbsolutePath(value) {
    return value.replace(/\\/g, "/").replace(/\/+$/, "");
}
/**
 * Persist destination for VM-built canvas preview gzips.
 *
 * When the current conversation's store is on `fuse.agent-store`, write under
 * that store's `artifacts/` directory (the real `/cursor/stores/<id>/artifacts`
 * path, not `/opt/cursor/artifacts` or `/cursor/stores/self`). Private workers
 * and pods without FUSE keep `fallbackArtifactsRoot`.
 */
async function resolveCanvasPreviewPersistArtifactsRoot(args) {
    const mountRoot = normalizeAbsolutePath(args.agentStoreMountRoot ?? AGENT_STORE_MOUNT_ROOT);
    const isFuseBacked = args.isFuseBacked ?? artifactUploads/* isAgentStoreFuseBackedPath */.PM;
    const realpath = args.realpath ?? ((p) => promises_.realpath(p));
    const conversationId = (args.conversationId ??
        process.env[CURSOR_CONVERSATION_ID_ENV] ??
        "").trim();
    if (isCanvasPreviewStoreSourceId(conversationId)) {
        const storeArtifacts = `${mountRoot}/${conversationId}/artifacts`;
        if (await isFuseBacked(storeArtifacts)) {
            return storeArtifacts;
        }
    }
    const selfArtifacts = `${mountRoot}/${AGENT_STORE_SELF_MOUNT_NAME}/artifacts`;
    try {
        const resolved = normalizeAbsolutePath(await realpath(selfArtifacts));
        const prefix = `${mountRoot}/`;
        if (!resolved.startsWith(prefix)) {
            return args.fallbackArtifactsRoot;
        }
        const mountKey = resolved.slice(prefix.length).split("/")[0];
        if (mountKey !== undefined &&
            isCanvasPreviewStoreSourceId(mountKey) &&
            (await isFuseBacked(resolved))) {
            return resolved;
        }
    }
    catch {
        // `/cursor/stores/self` is a convenience alias and is often missing.
    }
    return args.fallbackArtifactsRoot;
}

// EXTERNAL MODULE: external "node:util"
var external_node_util_ = __webpack_require__("node:util");
var external_node_util_default = /*#__PURE__*/__webpack_require__.n(external_node_util_);
// EXTERNAL MODULE: ../cursor-plugins/dist/index.js + 42 modules
var cursor_plugins_dist = __webpack_require__("../cursor-plugins/dist/index.js");
;// ./src/cloud-plugins-service.ts




const log = (0,external_node_util_.debuglog)("exec-daemon-cloud-plugins");
const CLOUD_PLUGIN_MANIFEST_FILENAME = ".cloud-plugin-manifest.json";
class CloudPluginsService {
    userHomeDirectory;
    plugins = [];
    loadPromise;
    loadedOnce = false;
    // Starts true: the manifest has not been read yet, so the empty set is short
    // of whatever the pod was provisioned with rather than a pod given none.
    pluginSetIncomplete = true;
    constructor(userHomeDirectory) {
        this.userHomeDirectory = userHomeDirectory;
        void this.reload();
    }
    async getAllEnabledPlugins() {
        await this.ensureLoaded();
        if (this.plugins.length === 0 && this.loadedOnce) {
            await this.reload();
        }
        return [...this.plugins];
    }
    getLoadFailures() {
        return [];
    }
    isPluginSetIncomplete() {
        return this.pluginSetIncomplete;
    }
    async reload() {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        this.loadPromise = this.load()
            .then((plugins) => {
            this.plugins = plugins;
            this.loadedOnce = true;
            // A missing manifest reaches here too, and that genuinely means the pod
            // was provisioned with no plugins rather than that we failed to see any.
            this.pluginSetIncomplete = false;
            return plugins;
        })
            .catch((error) => {
            log("Failed to load cloud plugins: %o", error);
            this.plugins = [];
            this.loadedOnce = true;
            this.pluginSetIncomplete = true;
            return [];
        })
            .finally(() => {
            this.loadPromise = undefined;
        });
        return this.loadPromise;
    }
    async ensureLoaded() {
        if (this.loadPromise) {
            await this.loadPromise;
            return;
        }
        if (!this.loadedOnce) {
            await this.reload();
        }
    }
    async load() {
        const cacheRoot = (0,external_node_path_.join)(this.userHomeDirectory, ".cursor", cursor_plugins_dist/* PLUGINS_CACHE_ROOT */.n8G);
        const manifest = await this.loadManifest(cacheRoot);
        if (manifest === undefined) {
            return [];
        }
        return (0,cursor_plugins_dist/* loadPluginsFromCloudManifest */.Zc4)(manifest, cacheRoot, {
            log: (message) => log("%s", message),
        });
    }
    async loadManifest(cacheRoot) {
        try {
            const content = await (0,promises_.readFile)((0,external_node_path_.join)(cacheRoot, CLOUD_PLUGIN_MANIFEST_FILENAME), "utf-8");
            const parsed = JSON.parse(content);
            if (!Array.isArray(parsed.plugins)) {
                return undefined;
            }
            return parsed;
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return undefined;
            }
            throw error;
        }
    }
}

;// ./src/computerUseExecutorSetup.ts
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


const computerUseExecutorSetup_logger = (0,logger/* createLogger */.h)("exec-daemon");
function computerUseExecutorHasInputEventLogger(executor) {
    return "setInputEventLogger" in executor;
}
const defaultComputerUseSetupDeps = {
    isX11Installed: local_exec_dist/* isX11Installed */.PDU,
    waitForDisplay: local_exec_dist/* waitForDisplay */.JtE,
    detectDisplaySync: local_exec_dist/* detectDisplaySync */.L_j,
    platform: "linux",
    isMacSidecarInstalled: () => local_exec_dist/* MacComputerUseRPCClient */.Sap.isInstalled(),
};
function buildX11ExecutorForDisplay(deps, display, api) {
    const { width, height } = deps.detectDisplaySync(display).display;
    return new local_exec_dist/* X11ComputerUseExecutor */.iTV({
        displayNum: (0,local_exec_dist/* parseDisplayNum */.c6U)(display),
        display,
        resolution: (0,local_exec_dist/* resolutionConfigForDisplay */.WZL)(width, height, api?.width, api?.height),
    });
}
async function buildExecDaemonComputerUseExecutor(ctx, args, deps = defaultComputerUseSetupDeps) {
    const { isComputerUseEnabled, lazyComputerUseInit, display, xdpyinfoPath, apiWidth, apiHeight } = args;
    if (!isComputerUseEnabled) {
        computerUseExecutorSetup_logger.info(ctx, "computer_use_init_result", {
            outcome: "disabled_by_flag",
            display,
            xdpyinfoPath,
        });
        return undefined;
    }
    const computerUseInitStartMs = Date.now();
    if (deps.platform === "darwin") {
        if (!deps.isMacSidecarInstalled()) {
            computerUseExecutorSetup_logger.warn(ctx, "macOS computer use sidecar was not found. Install Cursor Computer Use and grant Accessibility and Screen Recording. This worker will not advertise computer-use support.", { display });
            computerUseExecutorSetup_logger.info(ctx, "computer_use_init_result", {
                outcome: "mac_sidecar_not_found",
                durationMs: Date.now() - computerUseInitStartMs,
                display,
            });
            return undefined;
        }
        const macExecutor = new local_exec_dist/* MacRemoteComputerUseExecutor */.p$J();
        computerUseExecutorSetup_logger.info(ctx, "Computer use enabled - MacRemoteComputerUseExecutor registered", { display });
        computerUseExecutorSetup_logger.info(ctx, "computer_use_init_result", {
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
        computerUseExecutorSetup_logger.info(ctx, "X11 is not installed (xdpyinfo not found) - skipping computer use setup", {
            display,
        });
        computerUseExecutorSetup_logger.info(ctx, "computer_use_init_result", {
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
        const lazyExecutor = new local_exec_dist/* LazyX11ComputerUseExecutor */.Wy$({
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
        computerUseExecutorSetup_logger.info(ctx, "Computer use enabled - lazy X11ComputerUseExecutor registered", { display });
        computerUseExecutorSetup_logger.info(ctx, "computer_use_init_result", {
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
        computerUseExecutorSetup_logger.info(ctx, "Waiting for X11 display to become available", {
            display,
            xdpyinfoPath,
        });
        await deps.waitForDisplay(display);
        computerUseExecutorSetup_logger.info(ctx, "X11 display is ready", {
            display,
            waitDurationMs: Date.now() - computerUseInitStartMs,
        });
        const executor = buildX11ExecutorForDisplay(deps, display, {
            width: apiWidth,
            height: apiHeight,
        });
        computerUseExecutorSetup_logger.info(ctx, "Computer use enabled - X11ComputerUseExecutor created", {
            display,
        });
        computerUseExecutorSetup_logger.info(ctx, "computer_use_init_result", {
            outcome: "ready",
            durationMs: Date.now() - computerUseInitStartMs,
            display,
        });
        return executor;
    }
    catch (error) {
        computerUseExecutorSetup_logger.error(ctx, "Failed to detect display for computer use - disabling", error);
        computerUseExecutorSetup_logger.warn(ctx, "computer_use_init_result", {
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

;// ./src/dedupe-agent-skill-rules.ts
/**
 * Drop the `agentFetched` skill rules that duplicate `RequestContext.agentSkills`.
 *
 * On a cloud-agent VM, skills must stay in the cursor-rules merge: their
 * `getAllCursorRules()` is the only source of always-apply skills (emitted as
 * `global` rules) and plugin `rules/` entries, neither of which appears in
 * `agentSkills`. But the same services ALSO emit an `agentFetched` `CursorRule`
 * carrying the same `SKILL.md` body for every non-always-apply skill, so that
 * body would be serialized twice into the per-turn, blob-stored request context.
 *
 * The match is intentionally narrow — `agentFetched` rules whose path is in
 * `agentSkills`. Always-apply skills (`global` rules) and plugin `rules/`
 * entries are not `agentFetched` / not in `agentSkills`, so they are preserved.
 *
 * This mirrors the IDE's `removeDuplicatedAgentSkillRulesForRequestContext` in
 * `workbenchRequestContextExecutor.ts` (#131956): the IDE applies the same
 * filter in its own request-context executor, so the cloud applies it in its own
 * wiring (this decorator) rather than in the shared `LocalRequestContextExecutor`.
 */
function removeDuplicatedAgentSkillRules(rules, agentSkills) {
    const agentSkillPaths = new Set(agentSkills.map((skill) => skill.fullPath).filter((path) => path.length > 0));
    if (agentSkillPaths.size === 0) {
        return rules;
    }
    return rules.filter((rule) => rule.type?.type.case !== "agentFetched" || !agentSkillPaths.has(rule.fullPath));
}
/**
 * Cloud-agent-only `CursorRulesService` decorator that strips the duplicated
 * `agentFetched` skill rules (see {@link removeDuplicatedAgentSkillRules}) from
 * the rules fed into the request context, leaving the wrapped service — used by
 * other consumers such as the resource provider — untouched.
 *
 * Only `getAllCursorRules` is transformed; `reload`/`dispose`/`onDidChangeRules`
 * forward to the inner service so its lifecycle and change notifications are
 * preserved.
 */
function withDeduplicatedAgentSkillRules(inner, getAgentSkills) {
    return {
        async getAllCursorRules(ctx) {
            const [rules, agentSkills] = await Promise.all([
                inner.getAllCursorRules(ctx),
                getAgentSkills(ctx),
            ]);
            return removeDuplicatedAgentSkillRules(rules, agentSkills);
        },
        reload(ctx) {
            inner.reload(ctx);
        },
        dispose() {
            inner.dispose();
        },
        onDidChangeRules(callback) {
            return inner.onDidChangeRules(callback);
        },
    };
}

// EXTERNAL MODULE: ./src/git.ts + 3 modules
var git = __webpack_require__("./src/git.ts");
;// ./src/global-hook-context.ts
/**
 * Hosted cloud-agent pods inject this when `cloud_agent_user_email_env_var`
 * is on. Private workers do not have it at daemon startup (the owner is only
 * known at ClaimWorker time); they override per claim instead.
 */
const EXEC_DAEMON_USER_EMAIL_ENV_VAR = "CURSOR_CLOUD_AGENT_USER_EMAIL_ADDRESS";
function resolveExecDaemonGlobalHookContext(args) {
    const env = args?.env ?? process.env;
    const envEmail = env[EXEC_DAEMON_USER_EMAIL_ENV_VAR]?.trim() ?? "";
    const explicitEmail = args?.userEmail?.trim() ?? "";
    return {
        cursor_version: args?.cursorVersion ?? "1.0.0",
        user_email: explicitEmail.length > 0 ? explicitEmail : envEmail.length > 0 ? envEmail : null,
    };
}

;// ./src/lazy-mcp-client.ts
class LazyMcpClient {
    serverName;
    config;
    loadClient;
    onLoaded;
    timeoutMs;
    client;
    inFlight;
    error;
    closed = false;
    constructor(serverName, config, loadClient, onLoaded, timeoutMs) {
        this.serverName = serverName;
        this.config = config;
        this.loadClient = loadClient;
        this.onLoaded = onLoaded;
        this.timeoutMs = timeoutMs;
    }
    async ensureLoaded(ctx) {
        if (this.closed) {
            throw new Error(`MCP server is closed: ${this.serverName}`);
        }
        if (this.client !== undefined) {
            return this.client;
        }
        if (this.inFlight === undefined) {
            const load = this.loadClient(ctx);
            let timedOut = false;
            let cleanedUp = false;
            const closeLoadedClient = async (client) => {
                if (!cleanedUp) {
                    cleanedUp = true;
                    await client.close?.();
                }
            };
            const timeout = new Promise((_resolve, reject) => {
                const handle = setTimeout(() => {
                    timedOut = true;
                    reject(new Error(`MCP server load timed out after ${this.timeoutMs}ms: ${this.serverName}`));
                }, this.timeoutMs);
                load.finally(() => clearTimeout(handle)).catch(() => { });
            });
            load
                .then(async (client) => {
                if (timedOut || this.closed) {
                    await closeLoadedClient(client);
                }
            })
                .catch(() => { });
            this.inFlight = Promise.race([load, timeout])
                .then(async (client) => {
                if (this.closed) {
                    await closeLoadedClient(client);
                    throw new Error(`MCP server is closed: ${this.serverName}`);
                }
                this.client = client;
                this.error = undefined;
                this.onLoaded();
                return client;
            })
                .catch((error) => {
                this.error = error instanceof Error ? error.message : String(error);
                throw error;
            })
                .finally(() => {
                this.inFlight = undefined;
            });
        }
        return await this.inFlight;
    }
    async getTools(ctx) {
        return this.client?.getTools(ctx) ?? [];
    }
    async callTool(ctx, name, args, toolCallId, elicitationProvider) {
        const client = await this.ensureLoaded(ctx);
        return await client.callTool(ctx, name, args, toolCallId, elicitationProvider);
    }
    async getInstructions(ctx) {
        return await this.client?.getInstructions(ctx);
    }
    async getState(ctx) {
        if (this.client !== undefined) {
            return await this.client.getState(ctx);
        }
        // Prefer loading over a stale error while a retry is in flight so kick-only
        // listings and status follow-ups see the active load instead of the prior
        // failure.
        if (this.inFlight !== undefined) {
            return { kind: "loading" };
        }
        if (this.error !== undefined) {
            return { kind: "error", message: this.error };
        }
        return { kind: "loading" };
    }
    async listResources(ctx) {
        return await (await this.ensureLoaded(ctx)).listResources(ctx);
    }
    async readResource(ctx, args) {
        return await (await this.ensureLoaded(ctx)).readResource(ctx, args);
    }
    async listPrompts(ctx) {
        return (await this.client?.listPrompts(ctx)) ?? [];
    }
    async getPrompt(ctx, name, args) {
        return await (await this.ensureLoaded(ctx)).getPrompt(ctx, name, args);
    }
    async close() {
        this.closed = true;
        await this.inFlight?.catch(() => { });
        await this.client?.close?.();
        this.client = undefined;
    }
}

// EXTERNAL MODULE: ./src/logger.ts
var src_logger = __webpack_require__("./src/logger.ts");
// EXTERNAL MODULE: ./src/comma-separated-names.ts
var comma_separated_names = __webpack_require__("./src/comma-separated-names.ts");
// EXTERNAL MODULE: ./src/managed-environment.ts
var managed_environment = __webpack_require__("./src/managed-environment.ts");
// EXTERNAL MODULE: ./src/secretRedaction.ts
var secretRedaction = __webpack_require__("./src/secretRedaction.ts");
;// ./src/mcp-cloud-env.ts




/**
 * Cursor credentials that authenticate the daemon itself. Cursor issued them to
 * the daemon rather than the user provisioning them, so they are not the
 * workload's to hand out.
 */
const WITHHELD_CREDENTIAL_NAMES = secretRedaction/* ALWAYS_REDACTED_ENV_SECRET_NAMES */.hK;
/**
 * Never forwarded to a stdio MCP server, whatever the value.
 *
 * {@link SANDBOX_ENV_RESTORE_ENV_VAR} is here because it serializes the whole
 * managed environment as shell exports, so forwarding it would restate every
 * credential withheld above under a name that does not look like a credential.
 * It is also purely a daemon-internal shell-snapshot mechanism, so an MCP child
 * loses nothing by not having it.
 */
const DAEMON_ONLY_ENV_NAMES = new Set([
    ...WITHHELD_CREDENTIAL_NAMES,
    managed_environment/* SANDBOX_ENV_RESTORE_ENV_VAR */.j8,
]);
function createCloudMcpInjectedSecretAccessor(args) {
    return (name) => {
        const allowedNames = new Set((0,comma_separated_names/* parseCommaSeparatedNames */.w)(args.secretNamesEnv ?? process.env[secretRedaction/* CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR */.l1]));
        return allowedNames.has(name) ? args.secretAccessor(name) : undefined;
    };
}
/**
 * Expands only the `env` map of one command-based (stdio) server; remote /
 * env-less servers are returned unchanged.
 */
function expandCloudMcpStdioServerEnvOnly(serverConfig, runtimeLookup) {
    if (!("command" in serverConfig) || serverConfig.env === undefined) {
        return serverConfig;
    }
    return {
        ...serverConfig,
        env: (0,mcp_agent_exec_dist/* expandLocalEnvMap */.Ds)(serverConfig.env, runtimeLookup),
    };
}
/**
 * Layers the daemon's own environment underneath one stdio server's `env`;
 * remote / non-command servers are returned unchanged.
 *
 * Cloud stdio MCP servers run inside the agent's container, so users expect
 * them to see what the agent's shell commands see. The MCP SDK instead spawns
 * stdio children with a minimal default environment plus whatever the server
 * config spells out, so environment variables provisioned onto the pod never
 * reach a server that did not name them one by one.
 *
 * Explicit `env` entries still win. {@link WITHHELD_CREDENTIAL_NAMES} are held
 * back, as is any variable carrying one of their values, so the daemon's own
 * credentials cannot reach a server under either their own name or another.
 *
 * Apply this AFTER {@link expandCloudMcpStdioServerEnvOnly}: expansion must
 * only ever run over values the MCP config actually spelled out, never over
 * inherited values that happen to contain `${...}`.
 */
function withInheritedExecDaemonEnv(serverConfig, processEnv = process.env) {
    if (!("command" in serverConfig)) {
        return serverConfig;
    }
    // Filtering by name alone is not enough: a variable that embeds a withheld
    // credential hands it over just the same, whatever that variable is called.
    // Dropping carriers by value covers the aggregates that exist today and any
    // added later. A degenerate credential value would withhold far more than
    // intended, so skip empty ones; over-withholding otherwise is the safe way to
    // be wrong.
    const withheldValues = WITHHELD_CREDENTIAL_NAMES.map((name) => processEnv[name]).filter((value) => value !== undefined && value !== "");
    const inheritedEnv = {};
    for (const [name, value] of Object.entries(processEnv)) {
        if (value === undefined || DAEMON_ONLY_ENV_NAMES.has(name)) {
            continue;
        }
        if (withheldValues.some((withheld) => value.includes(withheld))) {
            continue;
        }
        inheritedEnv[name] = value;
    }
    return {
        ...serverConfig,
        env: { ...inheritedEnv, ...serverConfig.env },
    };
}
function expandCloudMcpStdioEnvOnly(config, runtimeLookup) {
    return {
        mcpServers: Object.fromEntries(Object.entries(config.mcpServers).map(([serverName, serverConfig]) => [
            serverName,
            expandCloudMcpStdioServerEnvOnly(serverConfig, runtimeLookup),
        ])),
    };
}

// EXTERNAL MODULE: ./src/mcp-token-storage.ts
var mcp_token_storage = __webpack_require__("./src/mcp-token-storage.ts");
;// ./src/orbit/browser-operation.ts
/**
 * Stable namespace prefixes persisted in Orbit.
 */
const BROWSER_OPERATION_NAMESPACES = {
    sandBrowser: "sand_browser",
    playwrightMcp: "playwright_mcp",
};
/**
 * Encodes optional detail fields as Orbit's JSON object.
 */
function operationOutcome(status, detail) {
    return detail === undefined
        ? { status }
        : {
            status,
            detailJson: JSON.stringify(detail),
        };
}
const SAND_BOX_CDP_PORT_BASE = 9222;
/**
 * Maps Sand browser window `N` to loopback CDP port `9222 + N`.
 */
function sandBoxCdpEndpoint(windowIndex) {
    return { host: "127.0.0.1", port: SAND_BOX_CDP_PORT_BASE + windowIndex };
}

;// ./src/orbit/playwright-mcp.ts

const PLAYWRIGHT_SERVER = /^playwright(?:-proxy)?-w([1-9]\d*)$/;
const PLAYWRIGHT_TOOL = /^browser_[a-z0-9_]+$/;
function mcpOutcome(result) {
    switch (result.result.case) {
        case "success":
            return result.result.value.isError
                ? operationOutcome("failed", { reason: "tool_error" })
                : operationOutcome("completed");
        case "error":
            return operationOutcome("failed", { reason: "mcp_error" });
        case "rejected":
            return operationOutcome("failed", { reason: "rejected" });
        case "permissionDenied":
            return operationOutcome("failed", { reason: "permission_denied" });
        case "toolNotFound":
            return operationOutcome("failed", { reason: "tool_not_found" });
        case "serverNotFound":
            return operationOutcome("failed", { reason: "server_not_found" });
        case "approved":
            return operationOutcome("failed", { reason: "unexpected_approval" });
        case undefined:
            return operationOutcome("failed", { reason: "missing_result" });
        default:
            return operationOutcome("failed", { reason: "unknown_result" });
    }
}
/**
 * Recognizes a managed Playwright MCP execution and normalizes it for Orbit.
 */
function recognizePlaywrightMcpOperation(args) {
    if (args.smartModeApprovalOnly || !PLAYWRIGHT_TOOL.test(args.toolName)) {
        return undefined;
    }
    if (args.serverIdentifier.length > 0 &&
        args.providerIdentifier.length > 0 &&
        args.serverIdentifier !== args.providerIdentifier) {
        return undefined;
    }
    const serverIdentifier = args.serverIdentifier || args.providerIdentifier;
    const match = PLAYWRIGHT_SERVER.exec(serverIdentifier);
    if (match === null || args.name !== `${serverIdentifier}-${args.toolName}`) {
        return undefined;
    }
    const windowIndex = Number(match[1]);
    if (!Number.isSafeInteger(windowIndex)) {
        return undefined;
    }
    const cdpEndpoint = sandBoxCdpEndpoint(windowIndex);
    if (cdpEndpoint.port > 65_535) {
        return undefined;
    }
    const argumentsValue = Object.fromEntries(Object.entries(args.args).map(([name, value]) => [name, value.toJson()]));
    return {
        cdpEndpoint,
        request: {
            name: `${BROWSER_OPERATION_NAMESPACES.playwrightMcp}.${args.toolName}`,
            argumentsJson: JSON.stringify(argumentsValue),
        },
        outcomeOf: mcpOutcome,
    };
}

// EXTERNAL MODULE: external "node:buffer"
var external_node_buffer_ = __webpack_require__("node:buffer");
;// ./src/orbit/sand-browser-driver.ts



const DRIVER_RESULT_MARKER = "__SAND_BROWSER_RESULT__";
const DRIVER_COMMAND = /^node \/tmp\/\.sand-browser\/driver-[0-9a-f]{16}\.mjs ([A-Za-z0-9+/]+={0,2})$/;
const OPERATION_NAME = /^[a-z][a-z0-9_]*$/;
// Bounds observer-side base64 decoding and JSON parsing before shell execution.
const MAX_ENCODED_REQUEST_CHARS = 256 * 1024;
function sand_browser_driver_isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseRequest(command) {
    const encoded = DRIVER_COMMAND.exec(command)?.[1];
    if (encoded === undefined ||
        encoded.length > MAX_ENCODED_REQUEST_CHARS ||
        encoded.length % 4 !== 0) {
        return undefined;
    }
    try {
        const parsed = JSON.parse(external_node_buffer_.Buffer.from(encoded, "base64").toString("utf8"));
        return sand_browser_driver_isRecord(parsed) ? parsed : undefined;
    }
    catch {
        return undefined;
    }
}
function driverOutcome(op, stdout) {
    const lines = stdout.split("\n");
    for (let index = lines.length - 1; index >= 0; index--) {
        const line = lines[index] ?? "";
        const markerIndex = line.indexOf(DRIVER_RESULT_MARKER);
        if (markerIndex < 0) {
            continue;
        }
        try {
            const parsed = JSON.parse(line.slice(markerIndex + DRIVER_RESULT_MARKER.length));
            if (!sand_browser_driver_isRecord(parsed)) {
                continue;
            }
            if (typeof parsed["ok"] !== "boolean") {
                return operationOutcome("failed", { reason: "protocol_invalid" });
            }
            if (parsed["ok"]) {
                return op === "screenshot" && parsed["screenshot"] !== true
                    ? operationOutcome("failed", { reason: "screenshot_missing" })
                    : operationOutcome("completed");
            }
            const reason = parsed["infra"] === true ? "driver_infra_error" : "driver_error";
            return operationOutcome("failed", { reason });
        }
        catch {
            return operationOutcome("failed", { reason: "protocol_invalid" });
        }
    }
    return operationOutcome("failed", { reason: "protocol_invalid" });
}
function shellOutcome(op, result) {
    switch (result.result.case) {
        case "success":
            return driverOutcome(op, result.result.value.stdout);
        case "failure": {
            const failure = result.result.value;
            if (failure.aborted && failure.abortReason === shell_exec_pb/* ShellAbortReason */.Lv.USER_ABORT) {
                return operationOutcome("cancelled", { reason: "user_abort" });
            }
            if (failure.aborted && failure.abortReason === shell_exec_pb/* ShellAbortReason */.Lv.TIMEOUT) {
                return operationOutcome("failed", { reason: "timeout" });
            }
            return operationOutcome("failed", {
                reason: "shell_failure",
                exit_code: failure.exitCode,
            });
        }
        case "timeout":
            return operationOutcome("failed", { reason: "timeout" });
        case "rejected":
            return operationOutcome("failed", { reason: "rejected" });
        case "spawnError":
            return operationOutcome("failed", { reason: "spawn_error" });
        case "permissionDenied":
            return operationOutcome("failed", { reason: "permission_denied" });
        case undefined:
            return operationOutcome("failed", { reason: "missing_result" });
        default:
            return operationOutcome("failed", { reason: "unknown_result" });
    }
}
/**
 * Recognizes a managed Sand browser-driver execution and normalizes it for Orbit.
 */
function recognizeSandBrowserDriverOperation(args) {
    const request = parseRequest(args.command);
    if (request === undefined) {
        return undefined;
    }
    const op = request["op"];
    const display = request["display"];
    const cdpPort = request["cdpPort"];
    if (typeof op !== "string" ||
        !OPERATION_NAME.test(op) ||
        typeof display !== "number" ||
        !Number.isSafeInteger(display) ||
        display < 1 ||
        typeof cdpPort !== "number" ||
        cdpPort > 65_535) {
        return undefined;
    }
    const cdpEndpoint = sandBoxCdpEndpoint(display);
    if (cdpPort !== cdpEndpoint.port) {
        return undefined;
    }
    const argumentsValue = { ...request };
    delete argumentsValue["op"];
    delete argumentsValue["display"];
    delete argumentsValue["cdpPort"];
    delete argumentsValue["screenshotPath"];
    return {
        cdpEndpoint,
        request: {
            name: `${BROWSER_OPERATION_NAMESPACES.sandBrowser}.${op}`,
            argumentsJson: JSON.stringify(argumentsValue),
        },
        outcomeOf: (result) => shellOutcome(op, result),
    };
}

;// ./src/orbit/operation-reporting.ts





function operationSource(ctx, toolCallId) {
    const conversationId = ctx.get(dist/* execConversationIdKey */.FmW);
    const requestId = ctx.get(dist/* execRequestIdKey */.dxK);
    if (conversationId === undefined ||
        conversationId.length === 0 ||
        requestId === undefined ||
        requestId.length === 0 ||
        toolCallId.length === 0) {
        return undefined;
    }
    return {
        kind: "toolCall",
        conversationId,
        requestId,
        toolCallId,
    };
}
async function reportOperation(reporter, ctx, operationUuid, operation, source, execute) {
    let shouldEnd;
    try {
        const admission = await reporter.startOperation({
            operationUuid,
            cdpEndpoint: operation.cdpEndpoint,
            source,
            request: operation.request,
        }, { signal: ctx.signal });
        shouldEnd = admission.kind === "admitted";
    }
    catch {
        // A Start failure is admission-ambiguous: its response may have been lost.
        shouldEnd = true;
    }
    let outcome = operationOutcome("failed", { reason: "executor_error" });
    try {
        const result = await execute();
        try {
            outcome = operation.outcomeOf(result);
        }
        catch {
            outcome = operationOutcome("failed", { reason: "outcome_unavailable" });
        }
        return result;
    }
    catch (error) {
        if (ctx.canceled) {
            outcome = operationOutcome("cancelled", { reason: "request_cancelled" });
        }
        throw error;
    }
    finally {
        if (shouldEnd) {
            try {
                // Do not pass ctx.signal: cancellation still requires a bounded End attempt.
                await reporter.endOperation({
                    operationUuid,
                    outcome,
                });
            }
            catch {
                // Reporting must not replace the executor's result or error.
            }
        }
    }
}
function recognizeFailOpen(recognize) {
    try {
        return recognize();
    }
    catch {
        return undefined;
    }
}
function reportingExecute(execute, recognize, reporter) {
    return (ctx, args, options) => {
        const run = () => execute(ctx, args, options);
        if (ctx.canceled ||
            ctx.get(dist/* execBrowserOperationSourceKey */.$mb) !== dist/* EXEC_BROWSER_OPERATION_SOURCES */.Kwv.toolCall) {
            return run();
        }
        const source = operationSource(ctx, args.toolCallId);
        if (source === undefined) {
            return run();
        }
        const operation = recognizeFailOpen(() => recognize(args));
        if (operation === undefined) {
            return run();
        }
        let operationUuid;
        try {
            operationUuid = (0,external_node_crypto_.randomUUID)();
        }
        catch {
            return run();
        }
        return reportOperation(reporter, ctx, operationUuid, operation, source, run);
    };
}
function reportingShellExecutor(inner, reporter) {
    return {
        execute: reportingExecute(inner.execute.bind(inner), (args) => recognizeSandBrowserDriverOperation(args), reporter),
    };
}
function reportingMcpExecutor(inner, reporter) {
    const execute = reportingExecute(inner.execute.bind(inner), recognizePlaywrightMcpOperation, reporter);
    const isBackendRouted = inner.isBackendRouted?.bind(inner);
    return isBackendRouted === undefined ? { execute } : { execute, isBackendRouted };
}
class OrbitOperationReportingAccessor {
    inner;
    reporter;
    constructor(inner, reporter) {
        this.inner = inner;
        this.reporter = reporter;
    }
    get(resource) {
        return this.wrap(resource, this.inner.get(resource));
    }
    *entries() {
        for (const [resource, implementation] of this.inner.entries()) {
            yield [resource, this.wrap(resource, implementation)];
        }
    }
    wrap(resource, implementation) {
        if (resource.symbol === dist/* shellExecutorResource */.qkk.symbol) {
            return reportingShellExecutor(implementation, this.reporter);
        }
        if (resource.symbol === dist/* mcpExecutorResource */.Yib.symbol) {
            return reportingMcpExecutor(implementation, this.reporter);
        }
        return implementation;
    }
}
/**
 * Decorates shell and MCP executors with fail-open Orbit operation reporting.
 */
function withOrbitOperationReporting(inner, reporter) {
    return new OrbitOperationReportingAccessor(inner, reporter);
}

// EXTERNAL MODULE: ../../node_modules/.pnpm/@lydell+node-pty@1.1.0_patch_hash=8cc7c6b3b59e47c0436b0f2bbb89cec1ced0f8ac0beadc41a2d07016bef0ea46/node_modules/@lydell/node-pty/index.js
var node_pty = __webpack_require__("../../node_modules/.pnpm/@lydell+node-pty@1.1.0_patch_hash=8cc7c6b3b59e47c0436b0f2bbb89cec1ced0f8ac0beadc41a2d07016bef0ea46/node_modules/@lydell/node-pty/index.js");
// EXTERNAL MODULE: ./src/ring-buffer.ts
var ring_buffer = __webpack_require__("./src/ring-buffer.ts");
;// ./src/pty-manager.ts







const UNUSED_SPAWN_HELPER_PATH = "spawn-helper-unused";
/** argv[1] is a script path, not a Commander operand like `worker` or `start`. */
function isScriptPath(value) {
    if (value === undefined || value.length === 0) {
        return false;
    }
    if (external_node_path_default().isAbsolute(value)) {
        return true;
    }
    return value.includes("/") || value.includes("\\") || /\.[cm]?js$/.test(value);
}
function resolveSpawnHelperFromNodeModules() {
    const require = /* createRequire() */ undefined;
    const platformArch = `${"linux"}-${"x64"}`;
    const modulePath = `@lydell/node-pty-${platformArch}/spawn-helper`;
    // Function constructor so webpack will not statically analyze require.resolve.
    const resolve = new Function("require", "path", "return require.resolve(path)");
    return resolve(__webpack_require__("./src sync recursive"), modulePath);
}
/**
 * Resolve macOS node-pty `spawn-helper`. Prefer a colocated binary next to
 * `process.execPath` (packaged CLI / worker SEA). `createRequire` is only
 * the unbundled-dev fallback — the worker SEA's node:module facade throws.
 */
function resolvePtySpawnHelperPath(options = {}) {
    const platform = options.platform ?? "linux";
    if (platform !== "darwin") {
        return UNUSED_SPAWN_HELPER_PATH;
    }
    const exists = options.existsSync ?? external_node_fs_.existsSync;
    const execPath = options.execPath ?? process.execPath;
    const argv1 = options.argv1 ?? process.argv[1];
    const candidates = [external_node_path_default().join(external_node_path_default().dirname(execPath), "spawn-helper")];
    if (isScriptPath(argv1)) {
        const nextToScript = external_node_path_default().join(external_node_path_default().dirname(external_node_path_default().resolve(argv1)), "spawn-helper");
        if (!candidates.includes(nextToScript)) {
            candidates.push(nextToScript);
        }
    }
    for (const candidate of candidates) {
        if (exists(candidate)) {
            return candidate;
        }
    }
    return (options.resolveFromNodeModules ?? resolveSpawnHelperFromNodeModules)();
}
function getSpawnHelperPath() {
    return resolvePtySpawnHelperPath();
}
const pty_manager_logger = (0,logger/* createLogger */.h)("pty-manager");
// Maximum number of events to keep in history per PTY instance
// This prevents unbounded memory growth for long-running PTYs
const MAX_EVENT_HISTORY = 1000;
const UTF8_LOCALE_ENV = {
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    LC_CTYPE: "C.UTF-8",
};
function toPtyDataBuffer(data) {
    return Buffer.isBuffer(data) ? Buffer.from(data) : Buffer.from(data, "utf-8");
}
/**
 * Gets the default shell for the current environment
 */
function getDefaultShell() {
    if (false) // removed by dead control flow
{}
    const configuredShell = process.env.SHELL?.trim();
    if (configuredShell && (!external_node_path_default().isAbsolute(configuredShell) || (0,external_node_fs_.existsSync)(configuredShell))) {
        return configuredShell;
    }
    // Cloud agent environments standardize on bash. Falling back to /bin/sh can
    // produce a blank prompt when PS1 is unset, which makes the web terminal look broken.
    if ((0,external_node_fs_.existsSync)("/bin/bash")) {
        return "/bin/bash";
    }
    return "/bin/sh";
}
/**
 * Manages PTY instances for the exec daemon
 */
class PtyManager {
    ctx;
    maxEventHistory;
    ptys = new Map();
    nextId = 1;
    constructor(ctx, maxEventHistory = MAX_EVENT_HISTORY) {
        this.ctx = ctx;
        this.maxEventHistory = maxEventHistory;
    }
    /**
     * Spawns a new PTY instance
     */
    spawn(options) {
        const id = `pty-${this.nextId++}`;
        const shell = options.process?.shell ?? getDefaultShell();
        const args = options.process?.args ?? [];
        // Default to process.cwd() if cwd is not provided (should be /workspace in cloud agent environment)
        const cwd = options.cwd || process.cwd();
        pty_manager_logger.info(this.ctx, "Spawning PTY", {
            id,
            shell,
            cwd,
            cols: options.cols,
            rows: options.rows,
        });
        const ptyProcess = (0,workload_spawn/* spawnWorkload */.D9)(node_pty/* spawn */.cH, shell, args, {
            // The patched @lydell/node-pty requires helperPath to be passed explicitly
            ["helperPath"]: getSpawnHelperPath(),
            name: "xterm-256color",
            cols: options.cols,
            rows: options.rows,
            cwd,
            encoding: null,
            env: {
                ...process.env,
                ...UTF8_LOCALE_ENV,
                ...options.env,
            },
        });
        const instance = {
            id,
            pty: ptyProcess,
            shell,
            args,
            cwd,
            cols: options.cols,
            rows: options.rows,
            eventListeners: new Set(),
            eventHistory: new ring_buffer/* RingBuffer */.N(this.maxEventHistory),
            nextEventId: 1,
        };
        // Set up event handlers
        const onData = ptyProcess.onData;
        onData((data) => {
            const event = {
                eventId: `${id}-${instance.nextEventId++}`,
                data: { type: "data", data: toPtyDataBuffer(data) },
            };
            instance.eventHistory.push(event);
            this.notifyListeners(instance, event);
        });
        ptyProcess.onExit((exitInfo) => {
            const event = {
                eventId: `${id}-${instance.nextEventId++}`,
                data: {
                    type: "exit",
                    exitCode: exitInfo.exitCode,
                    signal: exitInfo.signal,
                },
            };
            instance.eventHistory.push(event);
            this.notifyListeners(instance, event);
            pty_manager_logger.info(this.ctx, "PTY exited", {
                id,
                exitCode: exitInfo.exitCode,
                signal: exitInfo.signal,
            });
            // Clean up after a short delay to allow clients to receive the exit event
            setTimeout(() => {
                this.ptys.delete(id);
            }, 5000);
        });
        this.ptys.set(id, instance);
        return id;
    }
    /**
     * Gets a PTY instance by ID
     */
    get(id) {
        return this.ptys.get(id);
    }
    /**
     * Attaches to a PTY instance and returns historical events.
     * The provided listener is registered atomically with capturing historical events,
     * ensuring no events are lost between the snapshot and listener registration.
     *
     * @param id - The PTY instance ID
     * @param listener - Callback for new events (registered immediately)
     * @param lastEventId - Optional event ID to resume from
     * @returns Historical events, or undefined if PTY not found
     */
    attach(id, listener, lastEventId) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return undefined;
        }
        // Register the listener BEFORE capturing historical events.
        // This ensures any events arriving after this point go to the listener,
        // while events before this point are in the historical snapshot.
        instance.eventListeners.add(listener);
        // Get historical events
        let events;
        if (lastEventId) {
            // Find events after the specified event ID
            events = instance.eventHistory.sliceAfter((e) => e.eventId === lastEventId);
        }
        else {
            // Get all events
            events = instance.eventHistory.toArray();
        }
        return { events };
    }
    /**
     * Detaches a listener from a PTY instance
     */
    detach(id, listener) {
        const instance = this.ptys.get(id);
        if (instance) {
            instance.eventListeners.delete(listener);
        }
    }
    /**
     * Sends input to a PTY instance
     */
    sendInput(id, data) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return false;
        }
        instance.pty.write(data.toString("utf-8"));
        return true;
    }
    /**
     * Resizes a PTY instance
     */
    resize(id, cols, rows) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return false;
        }
        instance.pty.resize(cols, rows);
        instance.cols = cols;
        instance.rows = rows;
        pty_manager_logger.debug(this.ctx, "PTY resized", { id, cols, rows });
        return true;
    }
    /**
     * Lists all active PTY instances
     */
    list() {
        return Array.from(this.ptys.values()).map((instance) => ({
            id: instance.id,
            shell: instance.shell,
            args: instance.args,
            cwd: instance.cwd,
            cols: instance.cols,
            rows: instance.rows,
            pid: instance.pty.pid,
        }));
    }
    /**
     * Terminates a PTY instance
     */
    terminate(id) {
        const instance = this.ptys.get(id);
        if (!instance) {
            return false;
        }
        pty_manager_logger.info(this.ctx, "Terminating PTY", { id });
        instance.pty.kill();
        this.ptys.delete(id);
        return true;
    }
    /**
     * Notifies all listeners of a new event
     */
    notifyListeners(instance, event) {
        for (const listener of instance.eventListeners) {
            try {
                listener(event);
            }
            catch (error) {
                pty_manager_logger.error(this.ctx, "Error notifying PTY listener", {
                    id: instance.id,
                    error,
                });
            }
        }
    }
    /**
     * Disposes all PTY instances
     */
    dispose() {
        pty_manager_logger.info(this.ctx, "Disposing all PTY instances", {
            count: this.ptys.size,
        });
        for (const instance of this.ptys.values()) {
            try {
                instance.pty.kill();
            }
            catch (error) {
                pty_manager_logger.error(this.ctx, "Error killing PTY during disposal", {
                    id: instance.id,
                    error,
                });
            }
        }
        this.ptys.clear();
    }
}

;// ./src/read-only-bare/repository.ts



const execFileAsync = (0,external_node_util_.promisify)(external_node_child_process_.execFile);
// Pins the buffer-encoding overload so stdout/stderr stay Buffers through spawnWorkload.
const execFileBufferAsync = execFileAsync;
const spawnWithPipedStdio = external_node_child_process_.spawn;
const repository_textDecoder = new TextDecoder("utf-8", { fatal: false });
/**
 * Recognize stderr patterns that mean "the requested object/path doesn't
 * exist in this tree", as opposed to a real operational failure (timeout,
 * corruption, missing fetch). Used by `readFile` / `stat` / `listFiles` so
 * they all classify failures consistently.
 */
function isObjectMissingStderr(stderr) {
    return /does not exist|not a valid object name|not a blob|not a tree|exists on disk, but not in/i.test(stderr);
}
function collectProcessOutput(command, args, options) {
    return new Promise((resolve) => {
        const child = (0,workload_spawn/* spawnWorkload */.D9)(spawnWithPipedStdio, command, args, {
            windowsHide: true,
        });
        const stdoutChunks = [];
        const stderrChunks = [];
        let stdoutBytes = 0;
        let stderrBytes = 0;
        let timedOut = false;
        let stdinErrored = false;
        let settled = false;
        const finish = (exitCode) => {
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
        child.stdout.on("data", (chunk) => {
            if (stdoutBytes < options.maxBuffer) {
                const remaining = options.maxBuffer - stdoutBytes;
                const captured = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
                stdoutChunks.push(captured);
                stdoutBytes += captured.length;
            }
        });
        child.stderr.on("data", (chunk) => {
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
async function runGitInBareRepo(bareRepoPath, args, options) {
    const full = ["-C", bareRepoPath, ...args];
    try {
        const { stdout, stderr } = await (0,workload_spawn/* spawnWorkload */.D9)(execFileBufferAsync, "git", full, {
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
        const e = err;
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
class VmDaemonBareGitRepository {
    bareRepoPath;
    getActiveTreeSha;
    constructor(bareRepoPath, getActiveTreeSha) {
        this.bareRepoPath = bareRepoPath;
        this.getActiveTreeSha = getActiveTreeSha;
    }
    getTreeSha() {
        return this.getActiveTreeSha();
    }
    async readFile(_ctx, repoRelativePath) {
        const sha = this.getTreeSha();
        const spec = repoRelativePath === "" ? sha : `${sha}:${repoRelativePath}`;
        const out = await this.runPlumbing(_ctx, ["cat-file", "-p", spec], 30_000, 16 * 1024 * 1024);
        if (out.exitCode === 0) {
            return out.stdout;
        }
        const stderr = repository_textDecoder.decode(out.stderr).trim();
        if (isObjectMissingStderr(stderr)) {
            return undefined;
        }
        // Operational failure (timeout, permission, repo corruption, OOM, …):
        // surface as an error rather than silently masquerading as not-found.
        throw new Error(`git cat-file failed (exit ${out.exitCode}) for ${spec}: ${stderr.slice(-512) || "(no stderr)"}`);
    }
    async readFiles(_ctx, repoRelativePaths) {
        const uniquePaths = [...new Set(repoRelativePaths)];
        const result = new Map();
        if (uniquePaths.length === 0) {
            return result;
        }
        const sha = this.getTreeSha();
        const specs = uniquePaths.map((path) => (path === "" ? sha : `${sha}:${path}`));
        const out = await collectProcessOutput("git", ["-C", this.bareRepoPath, "cat-file", "--batch"], {
            input: `${specs.join("\n")}\n`,
            timeoutMs: 30_000,
            maxBuffer: 64 * 1024 * 1024,
        });
        if (out.exitCode !== 0) {
            throw new Error(`git cat-file --batch failed (exit ${out.exitCode}): ${repository_textDecoder.decode(out.stderr).trim().slice(-512) || "(no stderr)"}`);
        }
        let offset = 0;
        for (let i = 0; i < specs.length; i++) {
            const path = uniquePaths[i];
            const newline = out.stdout.indexOf(0x0a, offset);
            if (newline === -1) {
                throw new Error("git cat-file --batch produced truncated header");
            }
            const header = repository_textDecoder.decode(out.stdout.subarray(offset, newline));
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
    async stat(_ctx, repoRelativePath) {
        const sha = this.getTreeSha();
        const spec = repoRelativePath === "" ? sha : `${sha}:${repoRelativePath}`;
        const out = await this.runPlumbing(_ctx, ["cat-file", "-t", spec], 15_000);
        if (out.exitCode !== 0) {
            const stderr = repository_textDecoder.decode(out.stderr).trim();
            if (isObjectMissingStderr(stderr)) {
                return "missing";
            }
            // Operational failure (timeout, repo corruption, etc.). Surface as
            // an error rather than silently reporting "missing"
            throw new Error(`git cat-file -t failed (exit ${out.exitCode}) for ${spec}: ${stderr.slice(-512) || "(no stderr)"}`);
        }
        const type = repository_textDecoder.decode(out.stdout).trim();
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
    async listFiles(_ctx, repoRelativePrefix) {
        const sha = this.getTreeSha();
        const prefix = repoRelativePrefix.replace(/^\/+/, "").replace(/\/+$/, "");
        const args = prefix === ""
            ? ["ls-tree", "-r", "-z", "--name-only", sha]
            : ["ls-tree", "-r", "-z", "--name-only", sha, "--", prefix];
        const out = await this.runPlumbing(_ctx, args, 30_000, 32 * 1024 * 1024);
        if (out.exitCode !== 0) {
            const stderr = repository_textDecoder.decode(out.stderr).trim();
            if (isObjectMissingStderr(stderr)) {
                return [];
            }
            // Same reasoning as `stat` above: don't mask operational failures
            // (timeout, corruption, invalid pinned SHA) as "no files".
            throw new Error(`git ls-tree failed (exit ${out.exitCode}) for ${sha}${prefix === "" ? "" : ` -- ${prefix}`}: ${stderr.slice(-512) || "(no stderr)"}`);
        }
        return repository_textDecoder.decode(out.stdout).split("\0").filter(Boolean);
    }
    async runGit(_ctx, args, timeoutMs) {
        return this.runPlumbing(_ctx, args, timeoutMs);
    }
    async runPlumbing(_ctx, args, timeoutMs = 15_000, maxBuffer = 32 * 1024 * 1024) {
        return runGitInBareRepo(this.bareRepoPath, args, { timeoutMs, maxBuffer });
    }
}

;// ./src/read-only-bare/request-context.ts












const request_context_execFileAsync = (0,external_node_util_.promisify)(external_node_child_process_.execFile);
const emptyPluginsService = {
    async getAllEnabledPlugins() {
        return [];
    },
    getLoadFailures() {
        return [];
    },
    isPluginSetIncomplete() {
        // This service serves no plugins by design, so the empty set is the whole
        // truth rather than the part of it we managed to read.
        return false;
    },
    async reload() {
        return [];
    },
};
const MAX_CACHED_REQUEST_CONTEXT_EXECUTORS = 64;
const READ_ONLY_PLUGIN_MANIFEST_FILENAME = "manifest.json";
const CANONICAL_FULL_POD_PLUGIN_CACHE_ROOT = external_node_path_default().posix.join("/home/cursor", ".cursor", cursor_plugins_dist/* PLUGINS_CACHE_ROOT */.n8G);
function mapRequiredPathBetweenRoots(args) {
    const normalizedPath = external_node_path_default().posix.normalize(args.path);
    const normalizedSourceRoot = external_node_path_default().posix.normalize(args.sourceRoot);
    const normalizedTargetRoot = external_node_path_default().posix.normalize(args.targetRoot);
    if (normalizedPath === normalizedSourceRoot) {
        return normalizedTargetRoot;
    }
    if (normalizedPath.startsWith(`${normalizedSourceRoot}/`)) {
        return external_node_path_default().posix.join(normalizedTargetRoot, normalizedPath.slice(normalizedSourceRoot.length + 1));
    }
    throw new Error(`Expected plugin path ${normalizedPath} to be inside ${normalizedSourceRoot}`);
}
function mapOptionalPathBetweenRoots(args) {
    if (args.path === undefined) {
        return undefined;
    }
    return mapRequiredPathBetweenRoots({
        path: args.path,
        sourceRoot: args.sourceRoot,
        targetRoot: args.targetRoot,
    });
}
function canonicalizeReadOnlyPluginPaths(args) {
    return args.plugins.map((plugin) => {
        const installPath = mapRequiredPathBetweenRoots({
            path: plugin.installPath,
            sourceRoot: args.cacheRoot,
            targetRoot: CANONICAL_FULL_POD_PLUGIN_CACHE_ROOT,
        });
        const hooks = plugin.hooks !== undefined &&
            "sourcePath" in plugin.hooks &&
            plugin.hooks.sourcePath !== undefined
            ? {
                ...plugin.hooks,
                sourcePath: mapOptionalPathBetweenRoots({
                    path: plugin.hooks.sourcePath,
                    sourceRoot: args.cacheRoot,
                    targetRoot: CANONICAL_FULL_POD_PLUGIN_CACHE_ROOT,
                }) ?? plugin.hooks.sourcePath,
            }
            : plugin.hooks;
        return { ...plugin, installPath, hooks };
    });
}
class ReadOnlyPluginCacheService {
    cacheRoot;
    loadPromise;
    plugins = [];
    failures = [];
    // Starts true: the manifest has not been read yet, so the empty set is short
    // of whatever the cache holds rather than a cache that holds nothing.
    pluginSetIncomplete = true;
    constructor(cacheRoot) {
        this.cacheRoot = cacheRoot;
    }
    async getAllEnabledPlugins() {
        await this.ensureLoaded();
        return [...this.plugins];
    }
    getLoadFailures() {
        return [...this.failures];
    }
    isPluginSetIncomplete() {
        return this.pluginSetIncomplete;
    }
    async reload() {
        this.loadPromise = undefined;
        this.plugins = [];
        this.failures = [];
        this.pluginSetIncomplete = true;
        return await this.ensureLoaded();
    }
    async ensureLoaded() {
        if (this.loadPromise === undefined) {
            const pending = this.load();
            pending.catch(() => {
                if (this.loadPromise === pending) {
                    this.loadPromise = undefined;
                }
            });
            this.loadPromise = pending;
        }
        return await this.loadPromise;
    }
    async load() {
        const manifestPath = external_node_path_default().join(this.cacheRoot, READ_ONLY_PLUGIN_MANIFEST_FILENAME);
        let manifest;
        try {
            manifest = JSON.parse(await (0,promises_.readFile)(manifestPath, "utf8"));
        }
        catch (error) {
            this.failures = [
                {
                    pluginName: "read-only plugin cache manifest",
                    errorMessage: error instanceof Error ? error.message : String(error),
                    errorType: "manifest",
                },
            ];
            throw error;
        }
        const failures = [];
        const plugins = await (0,cursor_plugins_dist/* loadPluginsFromCloudManifest */.Zc4)(manifest, this.cacheRoot, {
            log(message) {
                failures.push({
                    pluginName: "read-only plugin cache",
                    errorMessage: message,
                    errorType: "unknown",
                });
            },
        });
        this.plugins = canonicalizeReadOnlyPluginPaths({
            plugins,
            cacheRoot: this.cacheRoot,
        });
        this.failures = failures;
        this.pluginSetIncomplete = false;
        return this.plugins;
    }
}
function requestContextErrorResult(error) {
    return new request_context_exec_pb/* RequestContextResult */._G({
        result: {
            case: "error",
            value: new request_context_exec_pb/* RequestContextError */.nf({ error }),
        },
    });
}
function cacheKeyForSha(args) {
    return `${args.sha}\0${args.pluginCacheRoot ?? ""}`;
}
async function isGitAncestor(args) {
    try {
        await (0,workload_spawn/* spawnWorkload */.D9)(request_context_execFileAsync, "git", [
            "-C",
            args.bareRepoPath,
            "merge-base",
            "--is-ancestor",
            args.ancestorSha,
            args.descendantSha,
        ], { encoding: "utf8", timeout: 5_000, windowsHide: true });
        return true;
    }
    catch (error) {
        if (error !== null && typeof error === "object" && "code" in error && error.code === 1) {
            return false;
        }
        return false;
    }
}
/**
 * In-process `LocalRequestContextExecutor` for exec-daemon on the
 * multi-tenant read-only shared pod: same bare-git rule/skill path as
 * the hybrid request context, but with local `git` against the on-VM bare
 * mirror and the same MCP state accessor as the main daemon
 * (Observable lease).
 */
function createReadOnlyVmDaemonBareRequestContextExecutor(args) {
    const innerBySha = new Map();
    const warmInnerPromises = new WeakSet();
    async function buildInner(initCtx, pinnedTreeSha, pluginCacheRoot) {
        const runtimeRef = new local_exec_dist/* BareGitWorkspaceRuntimeRef */.bR2();
        const resolveContext = (agentCtx, fromRef) => fromRef ?? agentCtx;
        const repository = new VmDaemonBareGitRepository(args.bareRepoPath, () => pinnedTreeSha);
        const gitExecutor = new local_exec_dist/* BareGitWorkspaceGitExecutor */.TlW(repository, args.workspacePath, runtimeRef, resolveContext);
        const workspaceFs = new local_exec_dist/* BareGitWorkspaceFilesystem */.ZNu(repository, args.workspacePath, runtimeRef, resolveContext);
        const bareGitExtensibilityService = new local_exec_dist/* BareGitExtensibilityService */.Z1t(args.workspacePath, workspaceFs);
        const importThirdPartyPlugins = false;
        const pluginsService = pluginCacheRoot !== undefined && pluginCacheRoot.length > 0
            ? new ReadOnlyPluginCacheService(pluginCacheRoot)
            : emptyPluginsService;
        const pluginSkillsService = new local_exec_dist/* CursorPluginsAgentSkillsService */.Rxj(initCtx, () => ({ importThirdPartyPlugins }), undefined, pluginsService);
        const cursorRulesService = new local_exec_dist/* MergedCursorRulesService */.Px0([bareGitExtensibilityService, pluginSkillsService], () => local_exec_dist/* NO_AGENT_STORE_SKILLS */.$3f);
        const mergedAgentSkillsService = new local_exec_dist/* MergedAgentSkillsService */.NB([bareGitExtensibilityService, pluginSkillsService], () => [], () => ({
            workspacePaths: [args.workspacePath],
            userHomeDirectory: (0,external_node_os_.homedir)(),
            agentStoreSkillsDirs: [],
        }));
        const requestContextCursorRulesService = withDeduplicatedAgentSkillRules(cursorRulesService, (ctx) => mergedAgentSkillsService.getAllAgentSkills(ctx));
        const cloudRulesService = new local_exec_dist/* MergedCloudRulesService */.M10([
            {
                workspacePath: args.workspacePath,
                service: bareGitExtensibilityService,
            },
        ]);
        const pluginSubagentsService = new local_exec_dist/* CursorPluginsSubagentsService */._Ji(() => ({ importThirdPartyPlugins }), pluginsService);
        const bareGitSubagents = {
            getAllSubagents: () => bareGitExtensibilityService.getAllSubagents(),
            reload: () => bareGitExtensibilityService.reloadSubagents(),
        };
        const subagentsService = new local_exec_dist/* MergedSubagentsService */.o_K([bareGitSubagents, pluginSubagentsService]);
        const createLocalRequestContextExecutor = args.localRequestContextExecutorFactory ?? ((factory) => factory());
        return {
            executor: await createLocalRequestContextExecutor(() => new local_exec_dist/* LocalRequestContextExecutor */.d2r(requestContextCursorRulesService, cloudRulesService, subagentsService, {
                async getCodebaseReference() {
                    return undefined;
                },
            }, { executeIndexedGrep: undefined }, args.mcpStateAccessor, gitExecutor, [args.workspacePath], {
                ...args.options,
                getAgentSkills: async (ctx) => {
                    let skills = await mergedAgentSkillsService.getAllAgentSkills(ctx);
                    if (args.filterModelDisabledSkills === true) {
                        skills = skills.filter(dist/* shouldIncludeAgentSkillInRequestContext */.X_3);
                    }
                    return args.stripAgentSkillContent === true
                        ? (0,dist/* stripAgentSkillContentForRequestContext */.tx6)(skills, {
                            preservePluginSkillContent: true,
                        })
                        : skills;
                },
            })),
            runtimeRef,
        };
    }
    function getInner(ctx, args) {
        const { sha, pluginCacheRoot } = args;
        const cacheKey = cacheKeyForSha({ sha, pluginCacheRoot });
        const cached = innerBySha.get(cacheKey);
        if (cached !== undefined) {
            // Refresh insertion order so the oldest unused SHA is evicted first.
            innerBySha.delete(cacheKey);
            innerBySha.set(cacheKey, cached);
            return cached.promise;
        }
        const pending = buildInner(ctx, sha, pluginCacheRoot);
        const entry = {
            promise: pending,
            sha,
            cachedAtMs: Date.now(),
        };
        innerBySha.set(cacheKey, entry);
        void pending.then(() => {
            const current = innerBySha.get(cacheKey);
            if (current?.promise === pending) {
                warmInnerPromises.add(pending);
            }
        }, () => {
            if (innerBySha.get(cacheKey)?.promise === pending) {
                innerBySha.delete(cacheKey);
            }
        });
        if (innerBySha.size > MAX_CACHED_REQUEST_CONTEXT_EXECUTORS) {
            const oldestKey = innerBySha.keys().next().value;
            if (oldestKey !== undefined) {
                innerBySha.delete(oldestKey);
            }
        }
        return pending;
    }
    async function executeRequestContextWithInner(ctx, execArgs, sha, innerPromise) {
        try {
            const { executor, runtimeRef } = await innerPromise;
            const pinnedArgs = execArgs.clone();
            pinnedArgs.readOnlyPinnedTreeSha = sha;
            return await runtimeRef.runWith(ctx, () => executor.execute(ctx, pinnedArgs));
        }
        catch (error) {
            return requestContextErrorResult(error instanceof Error ? error.message : String(error));
        }
    }
    async function getMostRecentCachedAncestorSha(args) {
        const warmCandidates = [];
        for (const [cacheKey, entry] of innerBySha) {
            if (entry.sha === args.sha) {
                continue;
            }
            if (!warmInnerPromises.has(entry.promise)) {
                continue;
            }
            if (cacheKey !==
                cacheKeyForSha({
                    sha: entry.sha,
                    pluginCacheRoot: args.pluginCacheRoot,
                })) {
                continue;
            }
            warmCandidates.push(entry);
        }
        if (warmCandidates.length === 0) {
            return undefined;
        }
        const probeResults = await (0,promise_extras/* asyncMapValues */.PH)(warmCandidates, async (entry) => {
            const isAncestor = await isGitAncestor({
                bareRepoPath: args.bareRepoPath,
                ancestorSha: entry.sha,
                descendantSha: args.sha,
            });
            return isAncestor ? entry : undefined;
        }, { max: MAX_CACHED_REQUEST_CONTEXT_EXECUTORS });
        const ancestralHits = new Set(probeResults
            .filter((hit) => hit !== undefined)
            .map((hit) => hit.sha));
        if (ancestralHits.size === 0) {
            return undefined;
        }
        let mostRecentHit;
        for (const entry of innerBySha.values()) {
            if (!ancestralHits.has(entry.sha)) {
                continue;
            }
            if (mostRecentHit === undefined || entry.cachedAtMs > mostRecentHit.cachedAtMs) {
                mostRecentHit = entry;
            }
        }
        return mostRecentHit?.sha;
    }
    return {
        async execute(ctx, execArgs) {
            const withSha = execArgs;
            const sha = withSha.readOnlyPinnedTreeSha;
            if (sha === undefined || sha === "") {
                // Surface as a normal `RequestContextResult` error rather than
                // throwing — callers consume the discriminated `result` union and
                // a raw throw becomes an unhandled rejection on the request-
                // context path. Mirrors the try/catch wrapping in
                // `LocalRequestContextExecutor.execute`.
                return requestContextErrorResult("readOnlyPinnedTreeSha is required for read-only VM request context (exec-daemon)");
            }
            const pluginCacheRoot = withSha.readOnlyPluginCacheRoot;
            const targetCacheKey = cacheKeyForSha({ sha, pluginCacheRoot });
            const cachedTarget = innerBySha.get(targetCacheKey);
            if (cachedTarget !== undefined && warmInnerPromises.has(cachedTarget.promise)) {
                return await executeRequestContextWithInner(ctx, execArgs, sha, cachedTarget.promise);
            }
            const ancestorSha = await getMostRecentCachedAncestorSha({
                sha,
                pluginCacheRoot,
                bareRepoPath: args.bareRepoPath,
            });
            if (ancestorSha !== undefined) {
                // Start warming the target SHA in the background without affecting
                // ancestor selection LRU order.
                void getInner(ctx, { sha, pluginCacheRoot });
                return await executeRequestContextWithInner(ctx, execArgs, ancestorSha, getInner(ctx, { sha: ancestorSha, pluginCacheRoot }));
            }
            return await executeRequestContextWithInner(ctx, execArgs, sha, getInner(ctx, { sha, pluginCacheRoot }));
        },
    };
}

;// ../recording-renderer/dist/config.js
/**
 * Centralized configuration for planning and rendering.
 *
 * These values are consumed by the render plan generator so that
 * timing and motion heuristics live in one place.
 */
const DEFAULT_RENDERER_CONFIG = {
    timing: {
        preActionPaddingMs: 800, // More approach time before clicks (was 400)
        postActionPaddingMs: 600,
        minGapMs: 800,
        zoomInLeadMs: 300,
        zoomOutDelayMs: 2000, // Stay zoomed 2s after last click
        zoomMaxGapMs: 4000, // Stay zoomed between clicks up to 4s apart
        // Agents can wait minutes between actions; don't let that render as a huge pause.
        maxGapOutputMs: 2000,
        speedMultiplier: 8,
    },
    motion: {
        // MotionStyle.MELLOW (enum value 2)
        defaultCursorStyle: 2,
    },
    safety: {
        alignmentToleranceMs: 750,
        maxRenderDurationMs: undefined,
    },
};

;// ../recording-renderer/dist/preprocessing/types.js
/**
 * Type definitions for recording preprocessing.
 *
 * Self-contained types - no external proto dependencies.
 */
// =============================================================================
// ENUMS
// =============================================================================
var CursorType;
(function (CursorType) {
    CursorType[CursorType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    CursorType[CursorType["ARROW"] = 1] = "ARROW";
    CursorType[CursorType["POINTER"] = 2] = "POINTER";
    CursorType[CursorType["TEXT"] = 3] = "TEXT";
    CursorType[CursorType["WAIT"] = 4] = "WAIT";
    CursorType[CursorType["CROSSHAIR"] = 5] = "CROSSHAIR";
    CursorType[CursorType["MOVE"] = 6] = "MOVE";
    CursorType[CursorType["RESIZE_NS"] = 7] = "RESIZE_NS";
    CursorType[CursorType["RESIZE_EW"] = 8] = "RESIZE_EW";
    CursorType[CursorType["RESIZE_NWSE"] = 9] = "RESIZE_NWSE";
    CursorType[CursorType["RESIZE_NESW"] = 10] = "RESIZE_NESW";
    CursorType[CursorType["NOT_ALLOWED"] = 11] = "NOT_ALLOWED";
    CursorType[CursorType["GRAB"] = 12] = "GRAB";
    CursorType[CursorType["GRABBING"] = 13] = "GRABBING";
})(CursorType || (CursorType = {}));
var MotionStyle;
(function (MotionStyle) {
    MotionStyle[MotionStyle["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    MotionStyle[MotionStyle["SLOW"] = 1] = "SLOW";
    MotionStyle[MotionStyle["MELLOW"] = 2] = "MELLOW";
    MotionStyle[MotionStyle["QUICK"] = 3] = "QUICK";
    MotionStyle[MotionStyle["RAPID"] = 4] = "RAPID";
})(MotionStyle || (MotionStyle = {}));
var IdleClassification;
(function (IdleClassification) {
    IdleClassification[IdleClassification["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    IdleClassification[IdleClassification["LOADING_WAIT"] = 1] = "LOADING_WAIT";
    IdleClassification[IdleClassification["VIEWING_RESULT"] = 2] = "VIEWING_RESULT";
    IdleClassification[IdleClassification["THINKING_PAUSE"] = 3] = "THINKING_PAUSE";
    IdleClassification[IdleClassification["LONG_OPERATION"] = 4] = "LONG_OPERATION";
})(IdleClassification || (IdleClassification = {}));
var ClickType;
(function (ClickType) {
    ClickType[ClickType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    ClickType[ClickType["SINGLE"] = 1] = "SINGLE";
    ClickType[ClickType["DOUBLE"] = 2] = "DOUBLE";
    ClickType[ClickType["TRIPLE"] = 3] = "TRIPLE";
    ClickType[ClickType["RIGHT"] = 4] = "RIGHT";
    ClickType[ClickType["MIDDLE"] = 5] = "MIDDLE";
})(ClickType || (ClickType = {}));
var KeystrokeEventType;
(function (KeystrokeEventType) {
    KeystrokeEventType[KeystrokeEventType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    KeystrokeEventType[KeystrokeEventType["KEY_COMBO"] = 1] = "KEY_COMBO";
    KeystrokeEventType[KeystrokeEventType["KEY_SINGLE"] = 2] = "KEY_SINGLE";
    KeystrokeEventType[KeystrokeEventType["TEXT_TYPED"] = 3] = "TEXT_TYPED";
})(KeystrokeEventType || (KeystrokeEventType = {}));
var MouseButton;
(function (MouseButton) {
    MouseButton[MouseButton["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    MouseButton[MouseButton["LEFT"] = 1] = "LEFT";
    MouseButton[MouseButton["RIGHT"] = 2] = "RIGHT";
    MouseButton[MouseButton["MIDDLE"] = 3] = "MIDDLE";
    MouseButton[MouseButton["BACK"] = 4] = "BACK";
    MouseButton[MouseButton["FORWARD"] = 5] = "FORWARD";
})(MouseButton || (MouseButton = {}));
// Keep in sync with `schema/agent/v1/computer_use_tool.proto` ScrollDirection.
var ScrollDirection;
(function (ScrollDirection) {
    ScrollDirection[ScrollDirection["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    ScrollDirection[ScrollDirection["UP"] = 1] = "UP";
    ScrollDirection[ScrollDirection["DOWN"] = 2] = "DOWN";
    ScrollDirection[ScrollDirection["LEFT"] = 3] = "LEFT";
    ScrollDirection[ScrollDirection["RIGHT"] = 4] = "RIGHT";
})(ScrollDirection || (ScrollDirection = {}));
const SPRING_CONFIGS = {
    [MotionStyle.UNSPECIFIED]: { tension: 170, friction: 26, mass: 1 },
    [MotionStyle.SLOW]: { tension: 120, friction: 30, mass: 1.2 },
    [MotionStyle.MELLOW]: { tension: 170, friction: 26, mass: 1 },
    [MotionStyle.QUICK]: { tension: 280, friction: 24, mass: 0.8 },
    [MotionStyle.RAPID]: { tension: 400, friction: 30, mass: 0.5 },
};
const DEFAULT_PREPROCESSING_CONFIG = {
    zoomImportanceThreshold: 60,
    minZoomIntervalMs: 1500,
    maxZoomsPerMinute: 8,
    targetZoomDensity: 0.3,
    speedUpLoadingWaits: true,
    speedUpThinkingPauses: true,
    preserveViewingResults: true,
    minSpeedupDurationMs: 1000,
    cursorStyle: MotionStyle.MELLOW,
    showClickEffects: true,
    showKeystrokes: true,
};

;// ../recording-renderer/dist/preprocessing/analysis/click-effects.js
/* unused harmony import specifier */ var click_effects_ClickType;
/**
 * Click effect keyframe generation.
 *
 * Extracts all click locations from input events for rendering
 * visual feedback (ripple effects).
 */

/**
 * Generate click effect keyframes from input events.
 */
function generateClickEffects(events) {
    const effects = [];
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const { action } = event.action;
        // Handle drag events - create keyframes at start and end
        if (action.case === "drag") {
            const dragAction = action.value;
            // Per proto spec, drag path must have at least 2 points
            if (dragAction.path.length < 2) {
                continue;
            }
            const startCoord = dragAction.path[0];
            const endCoord = dragAction.path[dragAction.path.length - 1];
            // Drag start
            effects.push({
                videoTimestampMs: event.executionTimestampMs - event.commandDurationMs,
                x: startCoord.x,
                y: startCoord.y,
                clickType: ClickType.SINGLE,
                actionIndex: i,
                hasModifiers: false,
            });
            // Drag end - use UNSPECIFIED so it doesn't trigger click depress
            effects.push({
                videoTimestampMs: event.executionTimestampMs,
                x: endCoord.x,
                y: endCoord.y,
                clickType: ClickType.UNSPECIFIED, // Won't trigger depress animation
                actionIndex: i,
                hasModifiers: false,
            });
            continue;
        }
        if (action.case !== "click") {
            continue;
        }
        const clickAction = action.value;
        // Determine click type
        let clickType;
        if (clickAction.count >= 3) {
            clickType = ClickType.TRIPLE;
        }
        else if (clickAction.count === 2) {
            clickType = ClickType.DOUBLE;
        }
        else if (clickAction.button === MouseButton.RIGHT) {
            clickType = ClickType.RIGHT;
        }
        else if (clickAction.button === MouseButton.MIDDLE) {
            clickType = ClickType.MIDDLE;
        }
        else {
            clickType = ClickType.SINGLE;
        }
        // Determine position
        let x;
        let y;
        if (clickAction.coordinate) {
            x = clickAction.coordinate.x;
            y = clickAction.coordinate.y;
        }
        else {
            // Use position after the action (cursor was already at position)
            x = event.positionAfter.x;
            y = event.positionAfter.y;
        }
        // Check for modifier keys
        const hasModifiers = !!clickAction.modifierKeys;
        effects.push({
            videoTimestampMs: event.executionTimestampMs,
            x,
            y,
            clickType,
            actionIndex: i,
            hasModifiers,
        });
    }
    return effects;
}
/**
 * Filter click effects to only include important ones.
 */
function filterClickEffects(effects, minIntervalMs = 200) {
    if (effects.length === 0)
        return [];
    const filtered = [];
    let lastTimestamp = -Infinity;
    for (const effect of effects) {
        // Skip clicks that are too close together (rapid navigation)
        if (effect.videoTimestampMs - lastTimestamp < minIntervalMs) {
            // But keep double/triple clicks
            if (effect.clickType !== click_effects_ClickType.DOUBLE && effect.clickType !== click_effects_ClickType.TRIPLE) {
                continue;
            }
        }
        filtered.push(effect);
        lastTimestamp = effect.videoTimestampMs;
    }
    return filtered;
}
/**
 * Get click statistics for a recording.
 */
function getClickStatistics(effects) {
    const stats = {
        total: effects.length,
        single: 0,
        double: 0,
        triple: 0,
        right: 0,
        middle: 0,
        withModifiers: 0,
    };
    for (const effect of effects) {
        switch (effect.clickType) {
            case click_effects_ClickType.SINGLE:
                stats.single++;
                break;
            case click_effects_ClickType.DOUBLE:
                stats.double++;
                break;
            case click_effects_ClickType.TRIPLE:
                stats.triple++;
                break;
            case click_effects_ClickType.RIGHT:
                stats.right++;
                break;
            case click_effects_ClickType.MIDDLE:
                stats.middle++;
                break;
            default:
                break;
        }
        if (effect.hasModifiers) {
            stats.withModifiers++;
        }
    }
    return stats;
}

;// ../recording-renderer/dist/preprocessing/analysis/click-importance.js
/**
 * Click importance scoring algorithm.
 *
 * Determines how important each click is for deciding whether to zoom/emphasize.
 * Higher scores = more important = more likely to zoom.
 */

const DEFAULT_CONFIG = {
    rapidClickThresholdMs: 500,
    sameAreaThresholdPx: 50,
    edgeMarginPx: 100,
    idleThresholdMs: 3000,
};
/**
 * Calculate importance score for a click (0-100).
 */
function calculateClickImportance(factors, config = DEFAULT_CONFIG) {
    let score = 50; // Base score
    // === Click type bonuses ===
    if (factors.clickType === ClickType.DOUBLE) {
        score += 25; // Double-clicks are often significant actions
    }
    if (factors.clickType === ClickType.TRIPLE) {
        score += 20; // Triple-clicks (select all) are intentional
    }
    if (factors.clickType === ClickType.RIGHT) {
        score += 15; // Right-clicks open context menus
    }
    if (factors.hasModifiers) {
        score += 20; // Modifier+click = intentional action
    }
    // === Temporal context ===
    // Rapid clicking = less important (user is navigating)
    if (factors.timeSinceLastClickMs < config.rapidClickThresholdMs) {
        score -= 25;
    }
    // After a pause = more intentional
    if (factors.timeSinceLastClickMs > config.idleThresholdMs) {
        score += 15;
    }
    // === Spatial context ===
    // Same area as last click = repetitive
    if (factors.distanceFromLastClick < config.sameAreaThresholdPx) {
        score -= 15;
    }
    // Screen edges often have navigation
    if (factors.isNearScreenEdge) {
        score -= 20;
    }
    // === Sequence context ===
    // First action after idle = important
    if (factors.isFirstAfterIdle) {
        score += 25;
    }
    // Click then type = form field interaction, important
    if (factors.isFollowedByTyping) {
        score += 30;
    }
    return Math.max(0, Math.min(100, score));
}
/**
 * Analyze all clicks in a recording and assign importance scores.
 */
function analyzeClickImportance(clickEffects, events, videoWidth, videoHeight, config = DEFAULT_CONFIG) {
    const scoredClicks = [];
    let lastClickTime = 0;
    let lastClickX = 0;
    let lastClickY = 0;
    let lastNonClickEventTime = 0;
    for (let i = 0; i < clickEffects.length; i++) {
        const click = clickEffects[i];
        const actionIndex = click.actionIndex;
        const event = events[actionIndex];
        if (!event) {
            scoredClicks.push(click);
            continue;
        }
        // Check if followed by typing
        const nextEvent = events[actionIndex + 1];
        const isFollowedByTyping = nextEvent?.action.action.case === "type" || nextEvent?.action.action.case === "key";
        // Calculate distance from last click
        const distanceFromLastClick = Math.sqrt((click.x - lastClickX) ** 2 + (click.y - lastClickY) ** 2);
        // Check if near screen edge
        const isNearScreenEdge = click.x < config.edgeMarginPx ||
            click.x > videoWidth - config.edgeMarginPx ||
            click.y < config.edgeMarginPx ||
            click.y > videoHeight - config.edgeMarginPx;
        // Check if first action after significant idle
        const isFirstAfterIdle = event.executionTimestampMs - lastNonClickEventTime > config.idleThresholdMs;
        const factors = {
            clickType: click.clickType,
            hasModifiers: click.hasModifiers,
            timeSinceLastClickMs: event.executionTimestampMs - lastClickTime,
            distanceFromLastClick,
            isNearScreenEdge,
            isFirstAfterIdle,
            isFollowedByTyping,
            videoWidth,
            videoHeight,
        };
        const importance = calculateClickImportance(factors, config);
        // Create a new click effect with the importance score in context
        scoredClicks.push({
            ...click,
            // Note: We don't have an importance field in the type, so we'll use this
            // in the zoom candidate generation instead
        });
        // Update tracking variables
        lastClickTime = event.executionTimestampMs;
        lastClickX = click.x;
        lastClickY = click.y;
        lastNonClickEventTime = event.executionTimestampMs;
    }
    return scoredClicks;
}
/**
 * Get importance score for a specific click (for zoom candidate generation).
 */
function getClickImportanceScore(clickIndex, clickEffects, events, videoWidth, videoHeight, config = DEFAULT_CONFIG) {
    if (clickIndex >= clickEffects.length) {
        return 50; // Default score
    }
    const click = clickEffects[clickIndex];
    const event = events[click.actionIndex];
    if (!event) {
        return 50;
    }
    // Find previous click
    let lastClickTime = 0;
    let lastClickX = 0;
    let lastClickY = 0;
    let lastNonClickEventTime = 0;
    for (let i = 0; i < clickIndex; i++) {
        const prevClick = clickEffects[i];
        const prevEvent = events[prevClick.actionIndex];
        if (prevEvent) {
            lastClickTime = prevEvent.executionTimestampMs;
            lastClickX = prevClick.x;
            lastClickY = prevClick.y;
            lastNonClickEventTime = prevEvent.executionTimestampMs;
        }
    }
    // Check if followed by typing
    const nextEvent = events[click.actionIndex + 1];
    const isFollowedByTyping = nextEvent?.action.action.case === "type" || nextEvent?.action.action.case === "key";
    const distanceFromLastClick = Math.sqrt((click.x - lastClickX) ** 2 + (click.y - lastClickY) ** 2);
    const isNearScreenEdge = click.x < config.edgeMarginPx ||
        click.x > videoWidth - config.edgeMarginPx ||
        click.y < config.edgeMarginPx ||
        click.y > videoHeight - config.edgeMarginPx;
    const isFirstAfterIdle = event.executionTimestampMs - lastNonClickEventTime > config.idleThresholdMs;
    const factors = {
        clickType: click.clickType,
        hasModifiers: click.hasModifiers,
        timeSinceLastClickMs: event.executionTimestampMs - lastClickTime,
        distanceFromLastClick,
        isNearScreenEdge,
        isFirstAfterIdle,
        isFollowedByTyping,
        videoWidth,
        videoHeight,
    };
    return calculateClickImportance(factors, config);
}

;// ../recording-renderer/dist/preprocessing/analysis/cursor-path.js
/**
 * Cursor path generation with natural arc motion and multiple easing styles.
 *
 * Instead of tracking raw cursor samples, we generate idealized cursor paths
 * using Bezier curves between known waypoints (action start/end positions).
 */

const FRAME_RATE = 30; // 30 fps for cursor animation
/**
 * Bezier easing functions for different motion styles.
 */
const EASING_FUNCTIONS = {
    0: (t) => t, // UNSPECIFIED - linear
    1: (t) => cubicBezier(0.25, 0.1, 0.25, 1.0, t), // SLOW - ease
    2: (t) => cubicBezier(0.42, 0.0, 0.58, 1.0, t), // MELLOW - ease-in-out
    3: (t) => cubicBezier(0.0, 0.0, 0.2, 1.0, t), // QUICK - ease-out
    4: (t) => cubicBezier(0.4, 0.0, 0.2, 1.0, t), // RAPID - material standard
};
/**
 * Cubic Bezier curve evaluation.
 * Based on WebKit's implementation.
 */
function cubicBezier(x1, y1, x2, y2, t) {
    // Newton-Raphson iteration to find t for given x
    const EPSILON = 1e-6;
    let x = t;
    for (let i = 0; i < 8; i++) {
        const currentX = bezierValue(x1, x2, x);
        const currentSlope = bezierSlope(x1, x2, x);
        if (Math.abs(currentX - t) < EPSILON) {
            break;
        }
        if (Math.abs(currentSlope) < EPSILON) {
            break;
        }
        x = x - (currentX - t) / currentSlope;
    }
    return bezierValue(y1, y2, x);
}
function bezierValue(p1, p2, t) {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * t * p1 + 3 * oneMinusT * t * t * p2 + t * t * t;
}
function bezierSlope(p1, p2, t) {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * p1 + 6 * oneMinusT * t * (p2 - p1) + 3 * t * t * (1 - p2);
}
/**
 * Generate cursor paths for all motion styles from input events.
 */
function generateAllCursorPaths(events, videoDurationMs, videoWidth, videoHeight) {
    const paths = new Map();
    const styles = [1, 2, 3, 4]; // SLOW, MELLOW, QUICK, RAPID
    for (const style of styles) {
        const keyframes = generateCursorPath(events, videoDurationMs, videoWidth, videoHeight, style);
        paths.set(style, keyframes);
    }
    return paths;
}
/**
 * Generate a cursor path for a specific motion style.
 */
function generateCursorPath(events, videoDurationMs, videoWidth, videoHeight, style) {
    if (events.length === 0) {
        // No events - generate a static cursor at center
        const centerX = Math.floor(videoWidth / 2);
        const centerY = Math.floor(videoHeight / 2);
        return generateStaticPath(centerX, centerY, videoDurationMs);
    }
    const keyframes = [];
    const easing = EASING_FUNCTIONS[style] ?? EASING_FUNCTIONS[2];
    // Start with initial position (before first event)
    let currentPos = events[0].positionBefore;
    let currentTime = 0;
    let currentCursorType = CursorType.ARROW;
    // Generate path from start to first event
    if (events[0].executionTimestampMs > 0) {
        const startKeyframes = generateSegment({ x: currentPos.x, y: currentPos.y }, { x: currentPos.x, y: currentPos.y }, 0, events[0].executionTimestampMs, currentCursorType, easing, videoWidth, videoHeight);
        keyframes.push(...startKeyframes);
        currentTime = events[0].executionTimestampMs;
    }
    // Generate paths between events
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const nextEvent = events[i + 1];
        // Generate motion to this action's target position
        const targetPos = event.positionAfter;
        const segmentDuration = Math.max(50, // Minimum 50ms for any motion
        event.commandDurationMs || 100);
        const segmentKeyframes = generateSegment(currentPos, targetPos, currentTime, currentTime + segmentDuration, event.cursorTypeAfter, easing, videoWidth, videoHeight);
        keyframes.push(...segmentKeyframes);
        currentPos = targetPos;
        currentTime += segmentDuration;
        currentCursorType = event.cursorTypeAfter;
        // Generate idle segment until next event (or end of video)
        const nextEventTime = nextEvent?.executionTimestampMs ?? videoDurationMs;
        const idleDuration = nextEventTime - currentTime;
        if (idleDuration > 0) {
            const idleKeyframes = generateSegment(currentPos, currentPos, currentTime, currentTime + idleDuration, currentCursorType, easing, videoWidth, videoHeight);
            keyframes.push(...idleKeyframes);
            currentTime += idleDuration;
        }
    }
    return keyframes;
}
/**
 * Generate keyframes for a path segment using quadratic Bezier with arc.
 */
function generateSegment(from, to, startMs, endMs, cursorType, easing, videoWidth, videoHeight) {
    const keyframes = [];
    const durationMs = endMs - startMs;
    if (durationMs <= 0) {
        return [];
    }
    const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
    // If no movement, just generate static keyframes
    if (distance < 1) {
        const numFrames = Math.max(1, Math.ceil((durationMs / 1000) * FRAME_RATE));
        for (let i = 0; i <= numFrames; i++) {
            const t = i / numFrames;
            keyframes.push({
                videoTimestampMs: Math.round(startMs + t * durationMs),
                x: from.x,
                y: from.y,
                cursorType,
                velocity: 0,
            });
        }
        return keyframes;
    }
    // Calculate arc control point for natural motion
    const arcIntensity = distance > 200 ? 0.15 : 0.05;
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    // Perpendicular vector for arc
    const perpX = -(to.y - from.y);
    const perpY = to.x - from.x;
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
    // Arc direction: curve away from screen center
    const screenCenterX = videoWidth / 2;
    const screenCenterY = videoHeight / 2;
    const arcSign = (midX - screenCenterX) * perpX + (midY - screenCenterY) * perpY > 0 ? 1 : -1;
    const controlPoint = {
        x: midX + (perpX / perpLength) * distance * arcIntensity * arcSign,
        y: midY + (perpY / perpLength) * distance * arcIntensity * arcSign,
    };
    // Generate keyframes at frame rate
    const numFrames = Math.max(1, Math.ceil((durationMs / 1000) * FRAME_RATE));
    let prevX = from.x;
    let prevY = from.y;
    let prevTime = startMs;
    for (let i = 0; i <= numFrames; i++) {
        const t = i / numFrames;
        const eased = easing(t);
        // Quadratic Bezier: P = (1-t)²P0 + 2(1-t)tP1 + t²P2
        const oneMinusEased = 1 - eased;
        const x = oneMinusEased * oneMinusEased * from.x +
            2 * oneMinusEased * eased * controlPoint.x +
            eased * eased * to.x;
        const y = oneMinusEased * oneMinusEased * from.y +
            2 * oneMinusEased * eased * controlPoint.y +
            eased * eased * to.y;
        const currentTime = startMs + t * durationMs;
        const timeDelta = (currentTime - prevTime) / 1000; // Convert to seconds
        // Calculate velocity (pixels per second)
        let velocity = 0;
        if (timeDelta > 0) {
            const dx = x - prevX;
            const dy = y - prevY;
            velocity = Math.sqrt(dx * dx + dy * dy) / timeDelta;
        }
        keyframes.push({
            videoTimestampMs: Math.round(currentTime),
            x: Math.round(x),
            y: Math.round(y),
            cursorType,
            velocity,
        });
        prevX = x;
        prevY = y;
        prevTime = currentTime;
    }
    return keyframes;
}
/**
 * Generate a static cursor path (no movement).
 */
function generateStaticPath(x, y, durationMs) {
    const keyframes = [];
    const numFrames = Math.max(1, Math.ceil((durationMs / 1000) * FRAME_RATE));
    for (let i = 0; i <= numFrames; i++) {
        const t = i / numFrames;
        keyframes.push({
            videoTimestampMs: Math.round(t * durationMs),
            x,
            y,
            cursorType: CursorType.ARROW,
            velocity: 0,
        });
    }
    return keyframes;
}

;// ../recording-renderer/dist/preprocessing/analysis/zoom-candidates.js
/**
 * Zoom candidate generation for all actions.
 *
 * Generates potential zoom targets for every action in the recording,
 * with context-aware zoom levels and timing.
 */

const DEFAULT_ZOOM_CONFIG = {
    defaultZoom: 1.3,
    clickZoom: 1.5,
    doubleClickZoom: 1.8,
    typeZoom: 1.6,
    scrollZoom: 1.2,
    dragZoom: 1.1,
    zoomDurationMs: 2000,
    zoomPaddingMs: 500,
};
/**
 * Get action type string from an event.
 */
function getActionType(event) {
    const { action } = event.action;
    switch (action.case) {
        case "click":
            if (action.value.count >= 3)
                return "triple_click";
            if (action.value.count === 2)
                return "double_click";
            return "click";
        case "mouseMove":
            return "mouse_move";
        case "mouseDown":
            return "mouse_down";
        case "mouseUp":
            return "mouse_up";
        case "drag":
            return "drag";
        case "scroll":
            return "scroll";
        case "type":
            return "type";
        case "key":
            return "key";
        case "wait":
            return "wait";
        case "screenshot":
            return "screenshot";
        case "cursorPosition":
            return "cursor_position";
        default:
            return "unknown";
    }
}
/**
 * Get suggested zoom level for an action type.
 */
function getZoomForActionType(actionType, config = DEFAULT_ZOOM_CONFIG) {
    switch (actionType) {
        case "triple_click":
        case "double_click":
            return config.doubleClickZoom;
        case "click":
            return config.clickZoom;
        case "type":
        case "key":
            return config.typeZoom;
        case "scroll":
            return config.scrollZoom;
        case "drag":
            return config.dragZoom;
        default:
            return config.defaultZoom;
    }
}
/**
 * Generate zoom candidates for all actions in the recording.
 */
function generateZoomCandidates(events, clickEffects, videoWidth, videoHeight, config = DEFAULT_ZOOM_CONFIG) {
    const candidates = [];
    // Create a map of action index to click index for importance lookup
    const actionToClickMap = new Map();
    clickEffects.forEach((click, idx) => {
        actionToClickMap.set(click.actionIndex, idx);
    });
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const actionType = getActionType(event);
        // Skip actions that don't need zoom candidates
        if (actionType === "wait" ||
            actionType === "screenshot" ||
            actionType === "cursor_position" ||
            actionType === "mouse_move") {
            continue;
        }
        // Determine zoom center and level
        const centerX = event.positionAfter.x;
        const centerY = event.positionAfter.y;
        const suggestedZoom = getZoomForActionType(actionType, config);
        // Build context description
        const contextParts = [];
        contextParts.push(`Action: ${actionType}`);
        if (actionType === "type") {
            // Type assertion needed because proto oneof union typing
            const value = event.action.action.value;
            const text = value?.text ?? "";
            const preview = text.length > 20 ? `${text.slice(0, 20)}...` : text;
            contextParts.push(`Text: "${preview}"`);
        }
        if (actionType === "key") {
            // Type assertion needed because proto oneof union typing
            const value = event.action.action.value;
            const key = value?.key ?? "";
            contextParts.push(`Key: ${key}`);
        }
        const context = contextParts.join("; ");
        // Calculate importance score
        let importanceScore = 50; // Default
        // For clicks, use the click importance algorithm
        const clickIndex = actionToClickMap.get(i);
        if (clickIndex !== undefined) {
            importanceScore = getClickImportanceScore(clickIndex, clickEffects, events, videoWidth, videoHeight);
        }
        else {
            // For non-click actions, base importance on action type
            switch (actionType) {
                case "type":
                    importanceScore = 70; // Typing is usually important
                    break;
                case "key": {
                    // Check if it's a special key combo
                    // Type assertion needed because proto oneof union typing
                    const keyValue = event.action.action.value;
                    const key = keyValue?.key ?? "";
                    if (key.includes("+")) {
                        importanceScore = 80; // Key combos are often important
                    }
                    else if (key.toLowerCase() === "return" || key.toLowerCase() === "enter") {
                        importanceScore = 75; // Enter is often significant
                    }
                    else {
                        importanceScore = 60;
                    }
                    break;
                }
                case "scroll":
                    importanceScore = 40; // Scrolling is usually navigation
                    break;
                case "drag":
                    importanceScore = 65; // Drags can be important
                    break;
                default:
                    importanceScore = 50;
            }
        }
        // Calculate timing
        const startMs = Math.max(0, event.executionTimestampMs - config.zoomPaddingMs);
        const endMs = event.executionTimestampMs + config.zoomDurationMs;
        candidates.push({
            startMs,
            endMs,
            centerX,
            centerY,
            suggestedZoom,
            actionType,
            actionIndex: i,
            importanceScore,
            context,
        });
    }
    // Handle scroll sequences - combine consecutive scrolls into one candidate
    const consolidatedCandidates = consolidateScrollCandidates(candidates);
    return consolidatedCandidates;
}
/**
 * Consolidate consecutive scroll actions into single zoom candidates.
 */
function consolidateScrollCandidates(candidates) {
    const result = [];
    let currentScrollSequence = [];
    for (const candidate of candidates) {
        if (candidate.actionType === "scroll") {
            currentScrollSequence.push(candidate);
        }
        else {
            // Flush any pending scroll sequence
            if (currentScrollSequence.length > 0) {
                result.push(mergeScrollSequence(currentScrollSequence));
                currentScrollSequence = [];
            }
            result.push(candidate);
        }
    }
    // Flush final scroll sequence
    if (currentScrollSequence.length > 0) {
        result.push(mergeScrollSequence(currentScrollSequence));
    }
    return result;
}
/**
 * Merge a sequence of scroll candidates into one.
 */
function mergeScrollSequence(scrolls) {
    if (scrolls.length === 1) {
        return scrolls[0];
    }
    const firstScroll = scrolls[0];
    const lastScroll = scrolls[scrolls.length - 1];
    // Use the position of the first scroll as center
    return {
        startMs: firstScroll.startMs,
        endMs: lastScroll.endMs,
        centerX: firstScroll.centerX,
        centerY: firstScroll.centerY,
        suggestedZoom: 1.2, // Lower zoom for scroll sequences
        actionType: "scroll_sequence",
        actionIndex: firstScroll.actionIndex,
        importanceScore: Math.min(50, firstScroll.importanceScore), // Lower importance
        context: `Scroll sequence: ${scrolls.length} scrolls`,
    };
}
/**
 * Filter candidates to ensure they don't overlap too much.
 */
function filterOverlappingCandidates(candidates, minIntervalMs) {
    if (candidates.length === 0)
        return [];
    // Sort by importance (descending) then by time
    const sorted = [...candidates].sort((a, b) => {
        if (a.importanceScore !== b.importanceScore) {
            return b.importanceScore - a.importanceScore;
        }
        return a.startMs - b.startMs;
    });
    const selected = [];
    for (const candidate of sorted) {
        // Check if this candidate overlaps with any already selected
        const overlaps = selected.some((existing) => {
            const gap = Math.min(Math.abs(candidate.startMs - existing.endMs), Math.abs(existing.startMs - candidate.endMs));
            return gap < minIntervalMs;
        });
        if (!overlaps) {
            selected.push(candidate);
        }
    }
    // Sort back by time
    return selected.sort((a, b) => a.startMs - b.startMs);
}

;// ../recording-renderer/dist/preprocessing/analysis/idle-classifier.js
/**
 * Idle period detection and classification.
 *
 * Detects periods of inactivity and classifies them for appropriate
 * speed adjustment (loading wait vs viewing result vs thinking pause).
 */


const idle_classifier_DEFAULT_CONFIG = {
    minIdleDurationMs: 500, // Minimum 500ms to consider as idle
    loadingWaitThresholdMs: 1000, // Gaps after clicks are often loading
    viewingResultMinMs: 500, // Minimum time to view a result
    viewingResultMaxMs: 3000, // Maximum viewing time before it's a pause
    thinkingPauseThresholdMs: 5000, // Long pauses are thinking
    longOperationThresholdMs: 10000, // Very long waits are operations
    defaultSpeedupFactor: 2.0, // 2x speed for generic idle
    loadingSpeedupFactor: 4.0, // 4x speed for loading waits
    thinkingSpeedupFactor: 3.0, // 3x speed for thinking pauses
};
/**
 * Detect and classify idle periods in the recording.
 */
function detectIdlePeriods(events, videoDurationMs, config = idle_classifier_DEFAULT_CONFIG) {
    const idlePeriods = [];
    if (events.length === 0) {
        // Entire video is idle
        if (videoDurationMs >= config.minIdleDurationMs) {
            idlePeriods.push({
                startMs: 0,
                endMs: videoDurationMs,
                durationMs: videoDurationMs,
                classification: IdleClassification.LONG_OPERATION,
                suggestedSpeed: config.defaultSpeedupFactor,
                precedingActionType: "none",
                followingActionType: "none",
            });
        }
        return idlePeriods;
    }
    // Check for idle period at the start
    const firstEventTime = events[0].executionTimestampMs;
    if (firstEventTime >= config.minIdleDurationMs) {
        const classification = classifyIdlePeriod(firstEventTime, "none", getActionType(events[0]), config);
        idlePeriods.push({
            startMs: 0,
            endMs: firstEventTime,
            durationMs: firstEventTime,
            classification: classification.classification,
            suggestedSpeed: classification.suggestedSpeed,
            precedingActionType: "none",
            followingActionType: getActionType(events[0]),
        });
    }
    // Check for idle periods between events
    for (let i = 0; i < events.length - 1; i++) {
        const currentEvent = events[i];
        const nextEvent = events[i + 1];
        // Calculate gap between events
        // Account for command duration
        const currentEndTime = currentEvent.executionTimestampMs + (currentEvent.commandDurationMs || 0);
        const nextStartTime = nextEvent.executionTimestampMs;
        const gapMs = nextStartTime - currentEndTime;
        if (gapMs >= config.minIdleDurationMs) {
            const precedingAction = getActionType(currentEvent);
            const followingAction = getActionType(nextEvent);
            const classification = classifyIdlePeriod(gapMs, precedingAction, followingAction, config);
            idlePeriods.push({
                startMs: currentEndTime,
                endMs: nextStartTime,
                durationMs: gapMs,
                classification: classification.classification,
                suggestedSpeed: classification.suggestedSpeed,
                precedingActionType: precedingAction,
                followingActionType: followingAction,
            });
        }
    }
    // Check for idle period at the end
    const lastEvent = events[events.length - 1];
    const lastEventEndTime = lastEvent.executionTimestampMs + (lastEvent.commandDurationMs || 0);
    const endGapMs = videoDurationMs - lastEventEndTime;
    if (endGapMs >= config.minIdleDurationMs) {
        const classification = classifyIdlePeriod(endGapMs, getActionType(lastEvent), "none", config);
        idlePeriods.push({
            startMs: lastEventEndTime,
            endMs: videoDurationMs,
            durationMs: endGapMs,
            classification: classification.classification,
            suggestedSpeed: classification.suggestedSpeed,
            precedingActionType: getActionType(lastEvent),
            followingActionType: "none",
        });
    }
    return idlePeriods;
}
/**
 * Classify an idle period based on context.
 */
function classifyIdlePeriod(durationMs, precedingAction, followingAction, config) {
    // Very long operations (e.g., waiting for builds, downloads)
    if (durationMs >= config.longOperationThresholdMs) {
        return {
            classification: IdleClassification.LONG_OPERATION,
            suggestedSpeed: config.loadingSpeedupFactor,
        };
    }
    // After click, before screenshot = waiting for UI response (loading)
    if ((precedingAction === "click" ||
        precedingAction === "double_click" ||
        precedingAction === "triple_click") &&
        (followingAction === "screenshot" || followingAction === "none")) {
        return {
            classification: IdleClassification.LOADING_WAIT,
            suggestedSpeed: config.loadingSpeedupFactor,
        };
    }
    // After screenshot = viewing the result (preserve this)
    if (precedingAction === "screenshot") {
        if (durationMs >= config.viewingResultMinMs && durationMs <= config.viewingResultMaxMs) {
            return {
                classification: IdleClassification.VIEWING_RESULT,
                suggestedSpeed: 1.0, // Don't speed up viewing
            };
        }
    }
    // Between typing actions = thinking pause
    if ((precedingAction === "type" || precedingAction === "key") &&
        (followingAction === "type" || followingAction === "key")) {
        if (durationMs >= config.thinkingPauseThresholdMs) {
            return {
                classification: IdleClassification.THINKING_PAUSE,
                suggestedSpeed: config.thinkingSpeedupFactor,
            };
        }
    }
    // Long gap after any action that's not viewing
    if (durationMs >= config.thinkingPauseThresholdMs) {
        return {
            classification: IdleClassification.THINKING_PAUSE,
            suggestedSpeed: config.thinkingSpeedupFactor,
        };
    }
    // Default to loading wait for medium-length gaps after interactions
    if (durationMs >= config.loadingWaitThresholdMs &&
        (precedingAction === "click" ||
            precedingAction === "type" ||
            precedingAction === "key" ||
            precedingAction === "scroll")) {
        return {
            classification: IdleClassification.LOADING_WAIT,
            suggestedSpeed: config.loadingSpeedupFactor,
        };
    }
    // Short gaps that don't fit other categories
    return {
        classification: IdleClassification.VIEWING_RESULT,
        suggestedSpeed: 1.0, // Preserve short natural pauses
    };
}
/**
 * Calculate total time that can be saved through speedups.
 */
function calculatePotentialTimeSavings(idlePeriods) {
    let totalIdleMs = 0;
    let potentialSavingsMs = 0;
    for (const period of idlePeriods) {
        totalIdleMs += period.durationMs;
        if (period.suggestedSpeed > 1.0) {
            const originalDuration = period.durationMs;
            const newDuration = originalDuration / period.suggestedSpeed;
            potentialSavingsMs += originalDuration - newDuration;
        }
    }
    return { totalIdleMs, potentialSavingsMs };
}

;// ../recording-renderer/dist/preprocessing/analysis/keystroke-overlay.js
/* unused harmony import specifier */ var keystroke_overlay_KeystrokeEventType;
/**
 * Keystroke overlay generation.
 *
 * Extracts keyboard events for on-screen display during video playback.
 */

const keystroke_overlay_DEFAULT_CONFIG = {
    displayDurationMs: 1500, // Show for 1.5 seconds
    maxTextLength: 30, // Truncate long text
    combineTypingThresholdMs: 500, // Combine rapid typing within 500ms
};
/**
 * Special key display mappings.
 */
const KEY_DISPLAY_MAP = {
    Return: "↵ Enter",
    Enter: "↵ Enter",
    Tab: "⇥ Tab",
    Escape: "⎋ Esc",
    BackSpace: "⌫",
    Delete: "⌦ Del",
    space: "␣ Space",
    plus: "+",
    KP_Add: "+",
    minus: "-",
    KP_Subtract: "-",
    equal: "=",
    KP_Equal: "=",
    KP_Multiply: "*",
    KP_Divide: "/",
    KP_Decimal: ".",
    KP_Separator: ",",
    comma: ",",
    period: ".",
    slash: "/",
    backslash: "\\",
    semicolon: ";",
    apostrophe: "'",
    grave: "`",
    bracketleft: "[",
    bracketright: "]",
    underscore: "_",
    less: "<",
    greater: ">",
    question: "?",
    colon: ":",
    quotedbl: '"',
    bar: "|",
    braceleft: "{",
    braceright: "}",
    asciitilde: "~",
    Up: "↑",
    Down: "↓",
    Left: "←",
    Right: "→",
    Home: "⇱ Home",
    End: "⇲ End",
    Page_Up: "⇞ PgUp",
    Page_Down: "⇟ PgDn",
    F1: "F1",
    F2: "F2",
    F3: "F3",
    F4: "F4",
    F5: "F5",
    F6: "F6",
    F7: "F7",
    F8: "F8",
    F9: "F9",
    F10: "F10",
    F11: "F11",
    F12: "F12",
};
/**
 * Modifier key display mappings.
 */
const MODIFIER_MAP = {
    ctrl: "^",
    control: "^",
    alt: "⌥",
    shift: "⇧",
    super: "⌘",
    meta: "⌘",
    cmd: "⌘",
    command: "⌘",
};
/**
 * Generate keystroke events for overlay display.
 */
function generateKeystrokeEvents(events, config = keystroke_overlay_DEFAULT_CONFIG) {
    const keystrokeEvents = [];
    let pendingTypedText = null;
    function getActionStartMs(event) {
        const durationMsRaw = event.commandDurationMs;
        const durationMs = Math.max(0, Number.isFinite(durationMsRaw) ? durationMsRaw : 0);
        return Math.max(0, event.executionTimestampMs - durationMs);
    }
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const { action } = event.action;
        const actionStartMs = getActionStartMs(event);
        if (action.case === "type") {
            const text = action.value.text;
            // Combine with pending typed text if within threshold
            if (pendingTypedText &&
                actionStartMs - pendingTypedText.endMs < config.combineTypingThresholdMs) {
                pendingTypedText.text += text;
                pendingTypedText.endMs = event.executionTimestampMs;
            }
            else {
                // Flush pending typed text
                if (pendingTypedText) {
                    keystrokeEvents.push(createTypedTextEvent(pendingTypedText, config));
                }
                pendingTypedText = {
                    text,
                    startMs: actionStartMs,
                    endMs: event.executionTimestampMs,
                    actionIndex: i,
                };
            }
        }
        else if (action.case === "key") {
            // Flush pending typed text first
            if (pendingTypedText) {
                keystrokeEvents.push(createTypedTextEvent(pendingTypedText, config));
                pendingTypedText = null;
            }
            const keyString = action.value.key;
            const keystrokeEvent = createKeyEvent(keyString, actionStartMs, i, config);
            if (keystrokeEvent) {
                keystrokeEvents.push(keystrokeEvent);
            }
        }
        else {
            // Flush pending typed text on any non-keyboard action
            if (pendingTypedText) {
                keystrokeEvents.push(createTypedTextEvent(pendingTypedText, config));
                pendingTypedText = null;
            }
        }
    }
    // Flush any remaining typed text
    if (pendingTypedText) {
        keystrokeEvents.push(createTypedTextEvent(pendingTypedText, config));
    }
    return keystrokeEvents;
}
/**
 * Create a typed text keystroke event.
 */
function createTypedTextEvent(pending, config) {
    let displayText = pending.text;
    // Truncate long text
    if (displayText.length > config.maxTextLength) {
        displayText = `${displayText.slice(0, config.maxTextLength)}...`;
    }
    // Escape special characters for display
    displayText = displayText.replace(/\n/g, "↵").replace(/\t/g, "⇥");
    return {
        videoTimestampMs: pending.startMs,
        displayText: `"${displayText}"`,
        eventType: KeystrokeEventType.TEXT_TYPED,
        displayDurationMs: config.displayDurationMs,
        actionIndex: pending.actionIndex,
    };
}
/**
 * Create a key press keystroke event.
 */
function createKeyEvent(keyString, timestampMs, actionIndex, config) {
    const displayText = formatKeyCombo(keyString);
    // Skip if it's just a single character (handled by type events)
    if (displayText.length === 1 && /^[a-zA-Z0-9]$/.test(displayText)) {
        return null;
    }
    const eventType = keyString.includes("+")
        ? KeystrokeEventType.KEY_COMBO
        : KeystrokeEventType.KEY_SINGLE;
    return {
        videoTimestampMs: timestampMs,
        displayText,
        eventType,
        displayDurationMs: config.displayDurationMs,
        actionIndex,
    };
}
/**
 * Format a key combination for display.
 * Converts xdotool-style key strings to user-friendly format.
 *
 * Examples:
 * - "ctrl+c" → "⌃C"
 * - "ctrl+shift+s" → "⌃⇧S"
 * - "Return" → "↵ Enter"
 * - "F5" → "F5"
 */
function formatKeyCombo(keyString) {
    const parts = keyString.split("+");
    const modifiers = [];
    let mainKey = "";
    for (const part of parts) {
        const partLower = part.toLowerCase();
        if (MODIFIER_MAP[partLower]) {
            modifiers.push(MODIFIER_MAP[partLower]);
        }
        else {
            // This is the main key
            mainKey = KEY_DISPLAY_MAP[part] ?? part.toUpperCase();
        }
    }
    if (modifiers.length === 0) {
        return mainKey;
    }
    // Join modifiers and key
    return `${modifiers.join("")}${mainKey}`;
}
/**
 * Filter keystroke events to reduce visual clutter.
 */
function filterKeystrokeEvents(events, minIntervalMs = 100) {
    if (events.length === 0)
        return [];
    const filtered = [];
    let lastTimestamp = -Infinity;
    for (const event of events) {
        // Always include key combos
        if (event.eventType === keystroke_overlay_KeystrokeEventType.KEY_COMBO) {
            filtered.push(event);
            lastTimestamp = event.videoTimestampMs;
            continue;
        }
        // Skip events too close together
        if (event.videoTimestampMs - lastTimestamp < minIntervalMs) {
            continue;
        }
        filtered.push(event);
        lastTimestamp = event.videoTimestampMs;
    }
    return filtered;
}

;// ../recording-renderer/dist/preprocessing/analysis/zoom-windows.js
/**
 * Zoom window computation.
 *
 * Computes continuous zoom periods from click effects.
 * The key insight: don't zoom out just to zoom back in.
 * If clicks are close together, stay zoomed the whole time.
 */
const zoom_windows_DEFAULT_CONFIG = {
    maxGapToStayZoomed: 15000, // 15 seconds - stay zoomed if more clicks coming
    zoomOutDelay: 2000,
    zoomInLead: 500,
    zoomLevel: 1.4,
};
/**
 * Compute zoom windows from click effects.
 *
 * Groups clicks that are close together into continuous zoom windows.
 * Only creates separate windows when there's a genuinely long gap.
 */
function computeZoomWindows(clickEffects, config = zoom_windows_DEFAULT_CONFIG) {
    if (clickEffects.length === 0) {
        return [];
    }
    const sorted = [...clickEffects].sort((a, b) => a.videoTimestampMs - b.videoTimestampMs);
    const windows = [];
    let currentWindow = null;
    for (let i = 0; i < sorted.length; i++) {
        const click = sorted[i];
        const prevClick = i > 0 ? sorted[i - 1] : null;
        if (!currentWindow) {
            // Start a new window
            currentWindow = {
                startMs: Math.max(0, click.videoTimestampMs - config.zoomInLead),
                endMs: click.videoTimestampMs + config.zoomOutDelay,
                focusPoints: [
                    {
                        timeMs: click.videoTimestampMs,
                        x: click.x,
                        y: click.y,
                    },
                ],
                zoomLevel: config.zoomLevel,
            };
        }
        else if (prevClick) {
            const gap = click.videoTimestampMs - prevClick.videoTimestampMs;
            if (gap <= config.maxGapToStayZoomed) {
                // Gap is small - extend the current window
                currentWindow.endMs = click.videoTimestampMs + config.zoomOutDelay;
                currentWindow.focusPoints.push({
                    timeMs: click.videoTimestampMs,
                    x: click.x,
                    y: click.y,
                });
            }
            else {
                // Gap is large - close current window and start new one
                windows.push(currentWindow);
                currentWindow = {
                    startMs: Math.max(0, click.videoTimestampMs - config.zoomInLead),
                    endMs: click.videoTimestampMs + config.zoomOutDelay,
                    focusPoints: [
                        {
                            timeMs: click.videoTimestampMs,
                            x: click.x,
                            y: click.y,
                        },
                    ],
                    zoomLevel: config.zoomLevel,
                };
            }
        }
    }
    // Don't forget the last window
    if (currentWindow) {
        windows.push(currentWindow);
    }
    // Post-process: merge windows that are too close together
    // ZoomContainer uses 600ms for both zoom-in and zoom-out
    // Windows need enough gap for: zoom-out + zoom-in = 1200ms
    // Add some buffer for visual clarity
    const ZOOM_IN_DURATION = 600;
    const ZOOM_OUT_DURATION = 600;
    const MIN_GAP_BETWEEN_WINDOWS = ZOOM_IN_DURATION + ZOOM_OUT_DURATION + 200; // 1400ms
    const mergedWindows = [];
    for (const window of windows) {
        if (mergedWindows.length === 0) {
            mergedWindows.push(window);
            continue;
        }
        const lastWindow = mergedWindows[mergedWindows.length - 1];
        const gap = window.startMs - lastWindow.endMs;
        if (gap < MIN_GAP_BETWEEN_WINDOWS) {
            // Merge: extend last window to include this one
            lastWindow.endMs = window.endMs;
            lastWindow.focusPoints.push(...window.focusPoints);
        }
        else {
            mergedWindows.push(window);
        }
    }
    return mergedWindows;
}
/**
 * Get the zoom state at a specific time.
 * Returns null if not in any zoom window.
 */
function getZoomStateAtTime(windows, timeMs) {
    for (const window of windows) {
        if (timeMs >= window.startMs && timeMs <= window.endMs) {
            // Find the appropriate focus point
            const points = window.focusPoints;
            // Before first point - use first point
            if (timeMs <= points[0].timeMs) {
                return {
                    zoomLevel: window.zoomLevel,
                    focusX: points[0].x,
                    focusY: points[0].y,
                };
            }
            // After last point - use last point
            if (timeMs >= points[points.length - 1].timeMs) {
                const last = points[points.length - 1];
                return {
                    zoomLevel: window.zoomLevel,
                    focusX: last.x,
                    focusY: last.y,
                };
            }
            // Between points - interpolate
            for (let i = 0; i < points.length - 1; i++) {
                const curr = points[i];
                const next = points[i + 1];
                if (timeMs >= curr.timeMs && timeMs <= next.timeMs) {
                    const progress = (timeMs - curr.timeMs) / (next.timeMs - curr.timeMs);
                    // Smooth easing
                    const eased = progress * progress * (3 - 2 * progress); // smoothstep
                    return {
                        zoomLevel: window.zoomLevel,
                        focusX: curr.x + (next.x - curr.x) * eased,
                        focusY: curr.y + (next.y - curr.y) * eased,
                    };
                }
            }
        }
    }
    return null;
}

;// ../recording-renderer/dist/preprocessing/analysis/index.js
/**
 * Analysis phase exports.
 *
 * These modules generate all candidates and pre-computed data
 * for the decision layer to select from.
 */








;// ../recording-renderer/dist/preprocessing/index.js
/* unused harmony import specifier */ var preprocessing_IdleClassification;
/* unused harmony import specifier */ var preprocessing_DEFAULT_PREPROCESSING_CONFIG;
/**
 * Recording preprocessing.
 *
 * Analyzes input events and generates rendering decisions:
 * - Cursor paths with various motion styles
 * - Zoom windows for camera focus
 * - Click effects and keystroke overlays
 * - Idle period speedups
 */




/**
 * Run analysis on input events to generate all candidates.
 */
function runAnalysis(events, options) {
    const { videoPath, videoDurationMs, videoWidth, videoHeight } = options;
    const clickEffects = generateClickEffects(events);
    const cursorPaths = generateAllCursorPaths(events, videoDurationMs, videoWidth, videoHeight);
    const zoomCandidates = generateZoomCandidates(events, clickEffects, videoWidth, videoHeight);
    const idlePeriods = detectIdlePeriods(events, videoDurationMs);
    const keystrokeEvents = generateKeystrokeEvents(events);
    return {
        videoPath,
        videoDurationMs,
        videoWidth,
        videoHeight,
        actionCount: events.length,
        zoomCandidates,
        idlePeriods,
        clickEffects,
        keystrokeEvents,
        cursorPaths,
    };
}
// =============================================================================
// DECISIONS
// =============================================================================
/**
 * Select which zoom candidates to use based on importance and rhythm.
 */
function selectZooms(candidates, videoDurationMs, config) {
    if (candidates.length === 0) {
        return [];
    }
    // Filter by importance threshold
    const eligible = candidates.filter((c) => c.importanceScore >= config.zoomImportanceThreshold);
    if (eligible.length === 0) {
        return [];
    }
    // Calculate target number of zooms
    const videoDurationMinutes = videoDurationMs / 60000;
    const targetZooms = Math.round(videoDurationMinutes * config.maxZoomsPerMinute * config.targetZoomDensity);
    // If we have fewer candidates than target, use all eligible with interval constraint
    if (eligible.length <= targetZooms) {
        return applyMinimumInterval(eligible, candidates, config.minZoomIntervalMs);
    }
    // Sort by importance (descending) and greedily select with interval constraint
    const sorted = [...eligible].sort((a, b) => b.importanceScore - a.importanceScore);
    const selected = [];
    const selectedTimes = [];
    for (const candidate of sorted) {
        if (selected.length >= targetZooms) {
            break;
        }
        const tooClose = selectedTimes.some((time) => Math.abs(candidate.startMs - time) < config.minZoomIntervalMs);
        if (!tooClose) {
            selected.push(candidate);
            selectedTimes.push(candidate.startMs);
        }
    }
    // Sort by time and convert to selections
    return selected
        .sort((a, b) => a.startMs - b.startMs)
        .map((candidate) => ({
        candidateIndex: candidates.indexOf(candidate),
    }));
}
function applyMinimumInterval(eligible, allCandidates, minIntervalMs) {
    const sorted = [...eligible].sort((a, b) => a.startMs - b.startMs);
    const selected = [];
    let lastTime = -Infinity;
    for (const candidate of sorted) {
        if (candidate.startMs - lastTime >= minIntervalMs) {
            selected.push({
                candidateIndex: allCandidates.indexOf(candidate),
            });
            lastTime = candidate.startMs;
        }
    }
    return selected;
}
/**
 * Select which idle periods to speed up.
 */
function selectSpeedups(idlePeriods, config) {
    const selections = [];
    for (let i = 0; i < idlePeriods.length; i++) {
        const period = idlePeriods[i];
        if (period.durationMs < config.minSpeedupDurationMs) {
            continue;
        }
        switch (period.classification) {
            case preprocessing_IdleClassification.LOADING_WAIT:
                if (config.speedUpLoadingWaits) {
                    selections.push({ candidateIndex: i });
                }
                break;
            case preprocessing_IdleClassification.THINKING_PAUSE:
                if (config.speedUpThinkingPauses) {
                    selections.push({ candidateIndex: i });
                }
                break;
            case preprocessing_IdleClassification.LONG_OPERATION:
                selections.push({ candidateIndex: i });
                break;
            case preprocessing_IdleClassification.VIEWING_RESULT:
                if (!config.preserveViewingResults) {
                    selections.push({ candidateIndex: i, speedOverride: 1.5 });
                }
                break;
            default:
                if (period.suggestedSpeed > 1.0) {
                    selections.push({ candidateIndex: i });
                }
                break;
        }
    }
    return selections;
}
/**
 * Make all preprocessing decisions.
 */
function makeDecisions(input, config = preprocessing_DEFAULT_PREPROCESSING_CONFIG) {
    return {
        cursorStyle: config.cursorStyle,
        selectedZooms: selectZooms(input.zoomCandidates, input.videoDurationMs, config),
        selectedSpeedups: selectSpeedups(input.idlePeriods, config),
        showClickEffects: config.showClickEffects,
        selectedClickEffects: [], // Empty = all
        showKeystrokes: config.showKeystrokes,
    };
}
// =============================================================================
// FULL PIPELINE
// =============================================================================
/**
 * Run the full preprocessing pipeline (analysis + decisions).
 */
function runPreprocessing(events, options, config = preprocessing_DEFAULT_PREPROCESSING_CONFIG) {
    const input = runAnalysis(events, options);
    const output = makeDecisions(input, config);
    return { input, output };
}
/**
 * Create a RecordingDataPackage from preprocessing results.
 */
function createRecordingDataPackage(rawVideoPath, durationMs, displayWidth, displayHeight, apiWidth, apiHeight, recordingStartEpochMs, events, decisionInput, decisionOutput, polishedVideoPath) {
    const cursorPathsArray = Array.from(decisionInput.cursorPaths.entries()).map(([style, keyframes]) => ({
        style,
        keyframes,
    }));
    return {
        rawVideoPath,
        durationMs,
        displayWidth,
        displayHeight,
        apiWidth,
        apiHeight,
        recordingStartEpochMs,
        inputEvents: events,
        cursorPaths: cursorPathsArray,
        zoomCandidates: decisionInput.zoomCandidates,
        idlePeriods: decisionInput.idlePeriods,
        clickEffects: decisionInput.clickEffects,
        keystrokeEvents: decisionInput.keystrokeEvents,
        decisionInput,
        decisionOutput,
        polishedVideoPath,
    };
}

;// ../recording-renderer/dist/utils/playback-segments.js
/**
 * Playback segments for JS-based speed control.
 *
 * No preprocessing - all speed manipulation happens at render time via Remotion's playbackRate.
 * This guarantees cursor and video are always in sync (same time mapping).
 *
 * Each gap gets a constant playback rate calculated from its length.
 * Action segments always play at 1x.
 */
const DEFAULT_PLAYBACK_CONFIG = {
    preActionPaddingMs: 600,
    postActionPaddingMs: 400,
    targetGapOutputMs: 1200,
    maxGapOutputMs: 2000,
    maxPlaybackRate: 8, // Screen Studio-style: speed up idle periods more
    minGapToSpeedUp: 800,
};
function trimPlaybackSegments(segments, maxOutputDurationMs) {
    if (!Number.isFinite(maxOutputDurationMs) || maxOutputDurationMs <= 0) {
        return [];
    }
    const trimmed = [];
    for (const segment of segments) {
        if (segment.outputStartMs >= maxOutputDurationMs) {
            break;
        }
        if (segment.outputEndMs <= maxOutputDurationMs) {
            trimmed.push(segment);
            continue;
        }
        const outputStartMs = segment.outputStartMs;
        const outputEndMs = maxOutputDurationMs;
        const outputDurationMs = outputEndMs - outputStartMs;
        const sourceDurationMs = outputDurationMs * segment.playbackRate;
        const sourceStartMs = segment.sourceStartMs;
        const sourceEndMs = sourceStartMs + sourceDurationMs;
        trimmed.push({
            ...segment,
            sourceEndMs,
            sourceDurationMs,
            outputEndMs,
            outputDurationMs,
        });
        break;
    }
    return trimmed;
}
/**
 * Trim playback segments from the **start** of the output timeline and shift to 0.
 *
 * This is useful when we want to drop an initial lead-in (e.g. recording starts
 * before the first real user action) without re-encoding the source video.
 *
 * `trimOutputStartMs` is expressed in **output** time, not source time.
 */
function trimPlaybackSegmentsStart(segments, trimOutputStartMs) {
    if (!Number.isFinite(trimOutputStartMs) || trimOutputStartMs <= 0) {
        return [...segments];
    }
    if (segments.length === 0) {
        return [];
    }
    const last = segments[segments.length - 1];
    if (trimOutputStartMs >= last.outputEndMs) {
        return [];
    }
    const shifted = [];
    for (const seg of segments) {
        if (seg.outputEndMs <= trimOutputStartMs) {
            continue;
        }
        if (seg.outputStartMs < trimOutputStartMs) {
            // Truncate the segment start in output space, and map to source space.
            const keptOutputStartMs = trimOutputStartMs;
            const keptOutputEndMs = seg.outputEndMs;
            const keptOutputDurationMs = keptOutputEndMs - keptOutputStartMs;
            const keptSourceStartMs = seg.sourceStartMs + (keptOutputStartMs - seg.outputStartMs) * seg.playbackRate;
            const keptSourceEndMs = seg.sourceEndMs;
            const keptSourceDurationMs = keptSourceEndMs - keptSourceStartMs;
            shifted.push({
                ...seg,
                sourceStartMs: keptSourceStartMs,
                sourceEndMs: keptSourceEndMs,
                sourceDurationMs: keptSourceDurationMs,
                outputStartMs: 0,
                outputEndMs: keptOutputDurationMs,
                outputDurationMs: keptOutputDurationMs,
            });
            continue;
        }
        shifted.push({
            ...seg,
            outputStartMs: seg.outputStartMs - trimOutputStartMs,
            outputEndMs: seg.outputEndMs - trimOutputStartMs,
        });
    }
    if (shifted.length > 0) {
        shifted[0] = { ...shifted[0], outputStartMs: 0 };
    }
    return shifted;
}
function trimPlaybackPlan(plan, maxOutputDurationMs) {
    const outputDurationMs = Math.min(plan.outputDurationMs, maxOutputDurationMs);
    return {
        ...plan,
        outputDurationMs,
        segments: trimPlaybackSegments(plan.segments, outputDurationMs),
    };
}
/**
 * Create playback segments from action timestamps.
 *
 * Actions define points where we want 1x playback.
 * Gaps between actions get sped up based on their duration.
 */
function createPlaybackSegments(actionTimestampsMs, sourceDurationMs, config = DEFAULT_PLAYBACK_CONFIG) {
    const sorted = [...actionTimestampsMs].sort((a, b) => a - b);
    if (sorted.length === 0) {
        // No actions - single segment at 1x
        return {
            segments: [
                {
                    type: "action",
                    sourceStartMs: 0,
                    sourceEndMs: sourceDurationMs,
                    sourceDurationMs: sourceDurationMs,
                    outputStartMs: 0,
                    outputEndMs: sourceDurationMs,
                    outputDurationMs: sourceDurationMs,
                    playbackRate: 1,
                },
            ],
            outputDurationMs: sourceDurationMs,
            sourceDurationMs,
        };
    }
    // Build action windows (regions to keep at 1x)
    const actionWindows = [];
    for (const timestamp of sorted) {
        const start = Math.max(0, timestamp - config.preActionPaddingMs);
        const end = Math.min(sourceDurationMs, timestamp + config.postActionPaddingMs);
        // Merge with previous window if overlapping
        if (actionWindows.length > 0) {
            const last = actionWindows[actionWindows.length - 1];
            if (start <= last.end) {
                last.end = Math.max(last.end, end);
                continue;
            }
        }
        actionWindows.push({ start, end });
    }
    // Convert to segments with timing
    const segments = [];
    let outputTime = 0;
    let lastSourceEnd = 0;
    const maxGapOutputMs = Number.isFinite(config.maxGapOutputMs) && config.maxGapOutputMs > 0
        ? config.maxGapOutputMs
        : Number.POSITIVE_INFINITY;
    for (const window of actionWindows) {
        // Gap before this action window
        if (window.start > lastSourceEnd) {
            const gapSourceDuration = window.start - lastSourceEnd;
            // Calculate playback rate for this gap
            let playbackRate = 1;
            let gapOutputDuration = gapSourceDuration;
            if (gapSourceDuration > config.minGapToSpeedUp) {
                // Calculate rate to achieve target output duration
                const idealRate = gapSourceDuration / config.targetGapOutputMs;
                const minRateToSatisfyMaxWait = maxGapOutputMs === Number.POSITIVE_INFINITY ? 0 : gapSourceDuration / maxGapOutputMs;
                const effectiveMaxPlaybackRate = Math.max(config.maxPlaybackRate, minRateToSatisfyMaxWait);
                playbackRate = Math.min(idealRate, effectiveMaxPlaybackRate);
                gapOutputDuration = gapSourceDuration / playbackRate;
            }
            segments.push({
                type: "gap",
                sourceStartMs: lastSourceEnd,
                sourceEndMs: window.start,
                sourceDurationMs: gapSourceDuration,
                outputStartMs: outputTime,
                outputEndMs: outputTime + gapOutputDuration,
                outputDurationMs: gapOutputDuration,
                playbackRate,
            });
            outputTime += gapOutputDuration;
        }
        // Action window (1x)
        const actionDuration = window.end - window.start;
        segments.push({
            type: "action",
            sourceStartMs: window.start,
            sourceEndMs: window.end,
            sourceDurationMs: actionDuration,
            outputStartMs: outputTime,
            outputEndMs: outputTime + actionDuration,
            outputDurationMs: actionDuration,
            playbackRate: 1,
        });
        outputTime += actionDuration;
        lastSourceEnd = window.end;
    }
    // Trailing gap after last action
    if (lastSourceEnd < sourceDurationMs) {
        const gapSourceDuration = sourceDurationMs - lastSourceEnd;
        let playbackRate = 1;
        let gapOutputDuration = gapSourceDuration;
        if (gapSourceDuration > config.minGapToSpeedUp) {
            const idealRate = gapSourceDuration / config.targetGapOutputMs;
            const minRateToSatisfyMaxWait = maxGapOutputMs === Number.POSITIVE_INFINITY ? 0 : gapSourceDuration / maxGapOutputMs;
            const effectiveMaxPlaybackRate = Math.max(config.maxPlaybackRate, minRateToSatisfyMaxWait);
            playbackRate = Math.min(idealRate, effectiveMaxPlaybackRate);
            gapOutputDuration = gapSourceDuration / playbackRate;
        }
        segments.push({
            type: "gap",
            sourceStartMs: lastSourceEnd,
            sourceEndMs: sourceDurationMs,
            sourceDurationMs: gapSourceDuration,
            outputStartMs: outputTime,
            outputEndMs: outputTime + gapOutputDuration,
            outputDurationMs: gapOutputDuration,
            playbackRate,
        });
        outputTime += gapOutputDuration;
    }
    return {
        segments,
        outputDurationMs: outputTime,
        sourceDurationMs,
    };
}
/**
 * Map output time to source time.
 * This is the core function that keeps video and cursor in sync.
 */
function outputToSourceTime(outputTimeMs, segments) {
    for (const seg of segments) {
        if (outputTimeMs >= seg.outputStartMs && outputTimeMs <= seg.outputEndMs) {
            // We're in this segment
            const outputOffset = outputTimeMs - seg.outputStartMs;
            const sourceOffset = outputOffset * seg.playbackRate;
            return seg.sourceStartMs + sourceOffset;
        }
    }
    // Past end - return source duration
    if (segments.length > 0) {
        const lastSeg = segments[segments.length - 1];
        return lastSeg.sourceEndMs;
    }
    return outputTimeMs; // Fallback: 1:1 mapping
}
/**
 * Map source time to output time.
 * Useful for remapping source timestamps (like click effects) to output time.
 */
function sourceToOutputTime(sourceTimeMs, segments) {
    for (const seg of segments) {
        if (sourceTimeMs >= seg.sourceStartMs && sourceTimeMs <= seg.sourceEndMs) {
            // We're in this segment
            const sourceOffset = sourceTimeMs - seg.sourceStartMs;
            const outputOffset = sourceOffset / seg.playbackRate;
            return seg.outputStartMs + outputOffset;
        }
    }
    // Past end - return output duration
    if (segments.length > 0) {
        const lastSeg = segments[segments.length - 1];
        return lastSeg.outputEndMs;
    }
    return sourceTimeMs; // Fallback: 1:1 mapping
}
/**
 * Get the segment containing a given output time.
 */
function getSegmentAtOutputTime(outputTimeMs, segments) {
    for (const seg of segments) {
        if (outputTimeMs >= seg.outputStartMs && outputTimeMs < seg.outputEndMs) {
            return seg;
        }
    }
    // Check last segment (inclusive end)
    if (segments.length > 0) {
        const lastSeg = segments[segments.length - 1];
        if (outputTimeMs <= lastSeg.outputEndMs) {
            return lastSeg;
        }
    }
    return null;
}

;// ../recording-renderer/dist/plan/recording-data.js
function parseRecordingDataFileFromJson(rawJson, recordingDataPath) {
    let parsedJson;
    try {
        parsedJson = JSON.parse(rawJson);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`recording-data.json is not valid JSON at ${recordingDataPath}: ${message}`);
    }
    const data = parsedJson;
    const inputEvents = data.inputEvents.map((event) => ({
        executionTimestampMs: event.executionTimestampMs,
        action: { action: event.action.action },
        commandDurationMs: event.commandDurationMs,
        positionBefore: event.positionBefore,
        positionAfter: event.positionAfter,
        cursorTypeAfter: event.cursorTypeAfter,
    }));
    return {
        version: data.version,
        durationMs: data.durationMs,
        displayWidth: data.displayWidth,
        displayHeight: data.displayHeight,
        apiWidth: data.apiWidth,
        apiHeight: data.apiHeight,
        recordingStartEpochMs: data.recordingStartEpochMs,
        ffmpegStartedEpochMs: data.ffmpegStartedEpochMs,
        eventToVideoOffsetMs: data.eventToVideoOffsetMs,
        inputEvents,
    };
}

;// ../recording-renderer/dist/plan/generate-render-plan.js








function parseMotionStyle(value) {
    if (typeof value === "number" && Object.values(MotionStyle).includes(value)) {
        return value;
    }
    return MotionStyle.MELLOW;
}
function hashConfig(config) {
    return external_node_crypto_.hash("sha256", JSON.stringify(config), "hex");
}
function isMeaningfulPlaybackAction(event) {
    const actionCase = event.action.action.case;
    switch (actionCase) {
        case "click":
        case "type":
        case "key":
        case "scroll":
        case "drag":
        case "mouseDown":
        case "mouseUp":
            return true;
        case "wait":
        case "screenshot":
        case "cursorPosition":
        case undefined:
            return false;
        case "mouseMove":
            return true;
        default: {
            // Keep this exhaustive so we notice new action types.
            const _exhaustive = actionCase;
            return _exhaustive;
        }
    }
}
function clampMs(valueMs, minMs, maxMs) {
    if (!Number.isFinite(valueMs))
        return minMs;
    return Math.min(maxMs, Math.max(minMs, valueMs));
}
/**
 * Build cursor keyframes from **recorded** input events.
 *
 * Important: the recorder uses `-draw_mouse 0`, so the OS cursor is NOT captured.
 * Cursor motion in the polished output must be reconstructed from the event stream.
 *
 * We intentionally avoid generating a fully synthetic Bezier/arced path here.
 * Instead we emit **anchor points** (timestamps + coordinates) from the actual tool actions
 * (including `mouseMove` / `hover_at`), and let the renderer apply Screen Studio-style
 * easing/anticipation between anchors.
 */
function buildCursorKeyframesFromRecordedEvents(events, sourceDurationMs) {
    if (events.length === 0)
        return [];
    if (!Number.isFinite(sourceDurationMs) || sourceDurationMs <= 0)
        return [];
    const sortedEvents = [...events].sort((a, b) => a.executionTimestampMs - b.executionTimestampMs);
    const keyframes = [];
    // Anchor cursor start at time 0 so the renderer can animate into the first action.
    const firstEvent = sortedEvents[0];
    keyframes.push({
        videoTimestampMs: 0,
        x: firstEvent.positionBefore.x,
        y: firstEvent.positionBefore.y,
        cursorType: CursorType.ARROW,
        velocity: 0,
    });
    for (const event of sortedEvents) {
        const actionCase = event.action.action.case;
        // Only include pointer-relevant anchors; including key/type would create lots of
        // near-duplicate anchors that would shrink movement gaps and kill lead-up easing.
        if (actionCase !== "click" &&
            actionCase !== "mouseMove" &&
            actionCase !== "drag" &&
            actionCase !== "scroll" &&
            actionCase !== "mouseDown" &&
            actionCase !== "mouseUp") {
            continue;
        }
        const endMs = clampMs(event.executionTimestampMs, 0, sourceDurationMs);
        const cursorTypeAfter = event.cursorTypeAfter ?? CursorType.ARROW;
        // Drag: use the recorded drag path start/end coordinates as anchors.
        if (actionCase === "drag") {
            const durationMsRaw = event.commandDurationMs;
            const durationMs = Math.max(0, Number.isFinite(durationMsRaw) ? durationMsRaw : 0);
            const startMs = clampMs(endMs - durationMs, 0, sourceDurationMs);
            const action = event.action.action;
            if (action.case !== "drag") {
                continue;
            }
            const pathPoints = action.value.path;
            if (pathPoints.length >= 2) {
                const start = pathPoints[0];
                const end = pathPoints[pathPoints.length - 1];
                keyframes.push({
                    videoTimestampMs: Math.round(startMs),
                    x: start.x,
                    y: start.y,
                    cursorType: cursorTypeAfter,
                    velocity: 0,
                });
                keyframes.push({
                    videoTimestampMs: Math.round(endMs),
                    x: end.x,
                    y: end.y,
                    cursorType: cursorTypeAfter,
                    velocity: 0,
                });
            }
            else {
                // Fallback to positionBefore/After if path is missing.
                keyframes.push({
                    videoTimestampMs: Math.round(startMs),
                    x: event.positionBefore.x,
                    y: event.positionBefore.y,
                    cursorType: cursorTypeAfter,
                    velocity: 0,
                });
                keyframes.push({
                    videoTimestampMs: Math.round(endMs),
                    x: event.positionAfter.x,
                    y: event.positionAfter.y,
                    cursorType: cursorTypeAfter,
                    velocity: 0,
                });
            }
            continue;
        }
        // Default: anchor at the cursor position after the action completes.
        keyframes.push({
            videoTimestampMs: Math.round(endMs),
            x: event.positionAfter.x,
            y: event.positionAfter.y,
            cursorType: cursorTypeAfter,
            velocity: 0,
        });
    }
    // Sort and dedupe by timestamp (keep last), then remove consecutive duplicates.
    keyframes.sort((a, b) => a.videoTimestampMs - b.videoTimestampMs);
    const dedupedByTime = [];
    for (const kf of keyframes) {
        const last = dedupedByTime[dedupedByTime.length - 1];
        if (last && last.videoTimestampMs === kf.videoTimestampMs) {
            dedupedByTime[dedupedByTime.length - 1] = kf;
        }
        else {
            dedupedByTime.push(kf);
        }
    }
    const deduped = [];
    for (const kf of dedupedByTime) {
        const last = deduped[deduped.length - 1];
        if (last && last.x === kf.x && last.y === kf.y && last.cursorType === kf.cursorType) {
            continue;
        }
        deduped.push(kf);
    }
    return deduped;
}
function getVideoDurationMs(videoPath) {
    const result = (0,external_node_child_process_.execFileSync)("ffprobe", [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        videoPath,
    ], { encoding: "utf-8" });
    const durationSec = parseFloat(result.trim());
    if (!Number.isFinite(durationSec) || durationSec < 0) {
        throw new Error(`Invalid duration from ffprobe for ${videoPath}: "${result.trim()}"`);
    }
    return Math.floor(durationSec * 1000);
}
function getVideoDimensions(videoPath) {
    const output = (0,external_node_child_process_.execFileSync)("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "csv=p=0:s=x",
        videoPath,
    ], { encoding: "utf-8" })
        .trim()
        .split("x")
        .map((v) => parseInt(v, 10));
    const [width, height] = output;
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        throw new Error(`Failed to get video dimensions from ${videoPath}: got width=${width}, height=${height}`);
    }
    if (width <= 0 || height <= 0) {
        throw new Error(`Invalid video dimensions from ${videoPath}: ${width}x${height}`);
    }
    return { width, height };
}
/**
 * Find the recording-data.json file in the recording directory.
 */
async function findRecordingDataPath(recordingDir) {
    const recordingDataPath = external_node_path_.join(recordingDir, "recording-data.json");
    await promises_.access(recordingDataPath, promises_.constants.R_OK);
    return recordingDataPath;
}
/**
 * Find the video file to use for plan generation.
 *
 * Prefers source videos over proxies, so the Rust renderer can:
 * 1. Select the best proxy based on output resolution
 * 2. Generate proxies on-demand from the original source if needed
 *
 * Falls back to proxies if no source video exists.
 */
async function findVideoPath(recordingDir) {
    const candidates = [
        // Prefer source videos (so Rust can generate appropriate proxy)
        external_node_path_.join(recordingDir, "recording_full.mp4"),
        external_node_path_.join(recordingDir, "recording.mp4"),
        // Fallback to proxies if no source exists
        external_node_path_.join(recordingDir, "recording_render_proxy_full.mp4"),
        external_node_path_.join(recordingDir, "recording_render_proxy_1080p.mp4"),
    ];
    for (const candidate of candidates) {
        try {
            await promises_.access(candidate, promises_.constants.R_OK);
            return candidate;
        }
        catch {
            // Continue to next candidate
        }
    }
    throw new Error(`No video file found. Searched:\n${candidates.map((c) => `  - ${c}`).join("\n")}`);
}
async function generateRenderPlan(options, config = DEFAULT_RENDERER_CONFIG) {
    const { sessionDir, maxDurationMs, fps = 60 } = options;
    // Files are in sessionDir/recording/ subdirectory
    const recordingDir = external_node_path_.join(sessionDir, "recording");
    const recordingDataPath = await findRecordingDataPath(recordingDir);
    const videoFilePath = await findVideoPath(recordingDir);
    const warnings = [];
    const raw = await promises_.readFile(recordingDataPath, "utf-8");
    const recordingData = parseRecordingDataFileFromJson(raw, recordingDataPath);
    // Get video metadata
    const actualVideoDurationMs = getVideoDurationMs(videoFilePath);
    const actualDims = getVideoDimensions(videoFilePath);
    const sourceDurationMs = Math.min(recordingData.durationMs, actualVideoDurationMs);
    if (Math.abs(recordingData.durationMs - actualVideoDurationMs) > 1000) {
        warnings.push(`Video duration mismatch: metadata=${recordingData.durationMs}ms ffprobe=${actualVideoDurationMs}ms`);
    }
    const apiWidth = recordingData.apiWidth;
    const apiHeight = recordingData.apiHeight;
    const videoWidth = actualDims.width;
    const videoHeight = actualDims.height;
    if (videoWidth !== recordingData.displayWidth || videoHeight !== recordingData.displayHeight) {
        warnings.push(`Video dimensions differ from metadata: metadata=${recordingData.displayWidth}x${recordingData.displayHeight} actual=${videoWidth}x${videoHeight}`);
    }
    const scaleX = videoWidth / apiWidth;
    const scaleY = videoHeight / apiHeight;
    // Process input events
    const normalizedEvents = recordingData.inputEvents;
    // Use eventToVideoOffsetMs from metadata
    const videoStartOffsetMs = recordingData.eventToVideoOffsetMs ?? 0;
    if (videoStartOffsetMs > 0) {
        warnings.push(`Adjusting event timestamps by ${videoStartOffsetMs}ms for video sync`);
    }
    const offsetCorrectedEvents = normalizedEvents.map((event) => ({
        ...event,
        executionTimestampMs: Math.max(0, event.executionTimestampMs - videoStartOffsetMs),
    }));
    const boundedEvents = offsetCorrectedEvents.filter((event) => event.executionTimestampMs <= sourceDurationMs);
    if (boundedEvents.length !== offsetCorrectedEvents.length) {
        warnings.push(`Dropped ${offsetCorrectedEvents.length - boundedEvents.length} events beyond video duration`);
    }
    // Run analysis to extract click effects and keystrokes
    const decisionInput = runAnalysis(boundedEvents, {
        videoPath: videoFilePath,
        videoDurationMs: sourceDurationMs,
        videoWidth,
        videoHeight,
    });
    const playbackConfig = {
        ...DEFAULT_PLAYBACK_CONFIG,
        preActionPaddingMs: config.timing.preActionPaddingMs,
        postActionPaddingMs: config.timing.postActionPaddingMs,
        maxGapOutputMs: config.timing.maxGapOutputMs,
        maxPlaybackRate: config.timing.speedMultiplier,
        minGapToSpeedUp: config.timing.minGapMs,
    };
    // Scale click effects to video coordinates
    const scaledClickEffects = decisionInput.clickEffects.map((effect) => ({
        ...effect,
        x: effect.x * scaleX,
        y: effect.y * scaleY,
    }));
    // Create playback segments from all "meaningful" action timestamps (not just clicks).
    // This improves both speed control and trimming when the first action isn't a click.
    const actionTimestampsMs = boundedEvents
        .filter(isMeaningfulPlaybackAction)
        .map((e) => e.executionTimestampMs);
    const playbackPlan = createPlaybackSegments(actionTimestampsMs, sourceDurationMs, playbackConfig);
    // Trim leading dead-air in output timeline (skip rendering before first real action).
    let trimSourceStartMs = 0;
    if (actionTimestampsMs.length > 0) {
        const firstActionMs = Math.min(...actionTimestampsMs);
        trimSourceStartMs = Math.max(0, firstActionMs - playbackConfig.preActionPaddingMs);
    }
    const outputTrimStartMs = trimSourceStartMs > 0 ? sourceToOutputTime(trimSourceStartMs, playbackPlan.segments) : 0;
    if (trimSourceStartMs > 0 && outputTrimStartMs > 0) {
        warnings.push(`Trimmed leading idle: sourceStart=${Math.round(trimSourceStartMs)}ms (outputStart=${Math.round(outputTrimStartMs)}ms)`);
    }
    let outputDurationMs = playbackPlan.outputDurationMs;
    let segments = playbackPlan.segments;
    if (outputTrimStartMs > 0) {
        segments = trimPlaybackSegmentsStart(segments, outputTrimStartMs);
        outputDurationMs = segments.length > 0 ? segments[segments.length - 1].outputEndMs : 0;
    }
    if (maxDurationMs) {
        outputDurationMs = Math.min(outputDurationMs, maxDurationMs);
        segments = trimPlaybackSegments(segments, outputDurationMs);
        outputDurationMs = segments.length > 0 ? segments[segments.length - 1].outputEndMs : 0;
    }
    // Remap click effects and keystrokes to output time, with the trim applied.
    const remappedClickEffects = scaledClickEffects
        .map((effect) => ({
        ...effect,
        videoTimestampMs: sourceToOutputTime(effect.videoTimestampMs, playbackPlan.segments) - outputTrimStartMs,
    }))
        .filter((effect) => effect.videoTimestampMs >= 0 && effect.videoTimestampMs <= outputDurationMs);
    const remappedKeystrokes = decisionInput.keystrokeEvents
        .map((event) => ({
        ...event,
        videoTimestampMs: sourceToOutputTime(event.videoTimestampMs, playbackPlan.segments) - outputTrimStartMs,
    }))
        .filter((event) => event.videoTimestampMs >= 0 && event.videoTimestampMs <= outputDurationMs);
    const cursorStyle = parseMotionStyle(config.motion.defaultCursorStyle);
    // Remap cursor path keyframes (source->output time mapping + scale to video coordinates).
    // We include only the selected cursor style to keep the plan JSON small.
    const remappedCursorPaths = new Map();
    {
        const keyframes = buildCursorKeyframesFromRecordedEvents(boundedEvents, sourceDurationMs);
        const remapped = keyframes
            .map((kf) => ({
            ...kf,
            x: kf.x * scaleX,
            y: kf.y * scaleY,
            videoTimestampMs: sourceToOutputTime(kf.videoTimestampMs, playbackPlan.segments) - outputTrimStartMs,
        }))
            .filter((kf) => kf.videoTimestampMs >= 0 && kf.videoTimestampMs <= outputDurationMs);
        remappedCursorPaths.set(cursorStyle, remapped);
    }
    // Compute zoom windows from remapped click effects
    const zoomWindows = computeZoomWindows(remappedClickEffects, {
        maxGapToStayZoomed: config.timing.zoomMaxGapMs,
        zoomOutDelay: config.timing.zoomOutDelayMs,
        zoomInLead: config.timing.zoomInLeadMs,
        zoomLevel: 1.4,
    });
    return {
        video: {
            inputVideoPath: videoFilePath,
            sourceDurationMs,
            outputDurationMs,
            width: videoWidth,
            height: videoHeight,
            fps,
            configHash: hashConfig(config),
        },
        playback: {
            segments,
            outputDurationMs,
        },
        tracks: {
            clickEffects: remappedClickEffects,
            keystrokeEvents: remappedKeystrokes,
            zoomWindows,
            cursorStyle,
        },
        decisionInput: {
            videoPath: videoFilePath,
            videoDurationMs: outputDurationMs,
            videoWidth,
            videoHeight,
            actionCount: boundedEvents.length,
            zoomCandidates: [],
            idlePeriods: decisionInput.idlePeriods,
            clickEffects: remappedClickEffects,
            keystrokeEvents: remappedKeystrokes,
            cursorPaths: remappedCursorPaths,
            zoomWindows,
        },
        decisions: {
            cursorStyle,
            selectedZooms: [],
            selectedSpeedups: [],
            showClickEffects: true,
            selectedClickEffects: remappedClickEffects.map((_, index) => index),
            showKeystrokes: true,
            cuts: trimSourceStartMs > 0
                ? [
                    {
                        startMs: 0,
                        endMs: trimSourceStartMs,
                        reason: "trim_leading_idle",
                    },
                ]
                : undefined,
        },
        diagnostics: {
            warnings,
            errors: [],
        },
    };
}

// EXTERNAL MODULE: ../polished-renderer/index.js
var polished_renderer = __webpack_require__("../polished-renderer/index.js");
;// ../recording-renderer/dist/render.js






const BRAND_TAG_DURATION_SECONDS = 2;
// Background color from the marketing-nav logo animation asset (avoid two-tone blacks).
const BRAND_TAG_BACKGROUND_COLOR = "0x12100a";
// Render the logo animation as a small centered mark (fraction of output height).
const BRAND_TAG_LOGO_HEIGHT_FRACTION = 0.2;
const CURSOR_BRAND_TAG_KIND = "cursor_brand_tag_v1";
const CURSOR_BRAND_TAG_POSITION = "end";
const CURSOR_BRAND_TAG_DURATION_MS = BRAND_TAG_DURATION_SECONDS * 1000;
function render_jsonReplacer(_key, value) {
    if (value instanceof Map) {
        return Object.fromEntries(value.entries());
    }
    return value;
}
function elapsedMs(startNs) {
    const deltaNs = process.hrtime.bigint() - startNs;
    return Number(deltaNs) / 1e6;
}
async function renderFromPlan(options) {
    const { plan, outputVideoPath, maxDurationMs, outputWidth, sessionDir, includeBrandTag = false, } = options;
    const overallStart = process.hrtime.bigint();
    const recordingDir = external_node_path_.join(sessionDir, "recording");
    const planPath = external_node_path_.join(recordingDir, "render-plan.json");
    external_node_fs_.mkdirSync(recordingDir, { recursive: true });
    const adjustedPlan = applyMaxDuration(plan, maxDurationMs);
    external_node_fs_.writeFileSync(planPath, JSON.stringify(adjustedPlan, render_jsonReplacer, 2), "utf8");
    const nativeStart = process.hrtime.bigint();
    const metricsPath = external_node_path_.join(recordingDir, `${external_node_path_.basename(outputVideoPath)}.polished-renderer-metrics.json`);
    await (0,polished_renderer/* renderFromPlanNative */.t)({
        sessionDir,
        planPath,
        outputPath: outputVideoPath,
        outputWidth: outputWidth !== undefined && outputWidth > 0 ? outputWidth : undefined,
        proxyMode: "auto",
        metricsJson: metricsPath,
        realtime: false,
    });
    if (!external_node_fs_.existsSync(outputVideoPath)) {
        throw new Error(`polished-renderer completed but output missing: ${outputVideoPath}`);
    }
    const stat = external_node_fs_.statSync(outputVideoPath);
    if (stat.size <= 0) {
        throw new Error(`polished-renderer completed but output is empty: ${outputVideoPath}`);
    }
    let metrics;
    let metricsError;
    try {
        const raw = external_node_fs_.readFileSync(metricsPath, "utf8");
        metrics = JSON.parse(raw);
    }
    catch (err) {
        metricsError = err instanceof Error ? err.message : String(err);
    }
    // Native renderer timing should only cover polished-renderer execution.
    const nativeWallMs = elapsedMs(nativeStart);
    if (includeBrandTag) {
        const output = metrics?.output;
        const meta = output &&
            Number.isFinite(output.width) &&
            Number.isFinite(output.height) &&
            Number.isFinite(output.fps)
            ? {
                width: output.width,
                height: output.height,
                fps: output.fps,
            }
            : undefined;
        await appendCursorBrandTag({
            outputVideoPath,
            outputMeta: meta,
        });
    }
    const timings = {
        wallMs: nativeWallMs,
        binary: "napi:@anysphere/polished-renderer",
        metricsPath,
        metrics,
        metricsError,
    };
    return {
        totalMs: elapsedMs(overallStart),
        timings,
    };
}
function applyMaxDuration(plan, maxDurationMs) {
    if (!maxDurationMs)
        return plan;
    const nextOutputDurationMs = Math.min(plan.playback.outputDurationMs, maxDurationMs);
    return {
        ...plan,
        video: {
            ...plan.video,
            outputDurationMs: Math.min(plan.video.outputDurationMs, nextOutputDurationMs),
        },
        playback: {
            ...plan.playback,
            segments: trimPlaybackSegments(plan.playback.segments, nextOutputDurationMs),
            outputDurationMs: nextOutputDurationMs,
        },
    };
}
function getBundledBrandTagAssetPath() {
    // Works from both `src/` (bun) and `dist/` (node) entrypoints:
    // `../assets/...` resolves to the package root's assets folder.
    return (0,external_node_url_.fileURLToPath)(new URL(/* asset import */ __webpack_require__("../recording-renderer/assets/brand-tag/logo-dark-theme.mp4"), __webpack_require__.b));
}
function probeVideoMeta(videoPath) {
    const raw = (0,external_node_child_process_.execFileSync)("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,avg_frame_rate",
        "-of",
        "json",
        videoPath,
    ], { encoding: "utf8" });
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (err) {
        throw new Error(`ffprobe returned non-JSON for ${videoPath}: ${err instanceof Error ? err.message : String(err)}`);
    }
    const data = parsed;
    const stream = data.streams?.[0];
    const width = Number(stream?.width);
    const height = Number(stream?.height);
    const fps = parseFrameRate(stream?.avg_frame_rate);
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        throw new Error(`ffprobe missing width/height for ${videoPath}: ${raw.trim()}`);
    }
    if (!Number.isFinite(fps) || fps <= 0) {
        throw new Error(`ffprobe missing fps for ${videoPath}: ${raw.trim()}`);
    }
    return { width, height, fps };
}
function parseFrameRate(value) {
    if (!value)
        return NaN;
    const trimmed = value.trim();
    if (trimmed.length === 0)
        return NaN;
    if (!trimmed.includes("/")) {
        const direct = Number.parseFloat(trimmed);
        return Number.isFinite(direct) ? direct : NaN;
    }
    const [numStr, denStr] = trimmed.split("/");
    const num = Number.parseFloat(numStr);
    const den = Number.parseFloat(denStr);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0)
        return NaN;
    return num / den;
}
async function runFfmpeg(args, label) {
    await new Promise((resolve, reject) => {
        const child = (0,external_node_child_process_.spawn)("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], {
            stdio: ["ignore", "ignore", "pipe"],
        });
        let stderr = "";
        child.stderr?.on("data", (chunk) => {
            stderr += chunk.toString();
        });
        child.once("error", (err) => {
            reject(new Error(`ffmpeg ${label} failed to start: ${err.message}`));
        });
        child.once("close", (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`ffmpeg ${label} exited with code ${code}: ${stderr.trim()}`));
            }
        });
    });
}
function escapeConcatFilePath(p) {
    // ffmpeg concat demuxer list file supports single-quoted strings, but escaping
    // quotes inside the path is inconsistent across builds. Treat it as unsupported.
    if (p.includes("'")) {
        throw new Error(`ffmpeg concat list paths cannot contain single quotes: ${p}`);
    }
    return p;
}
async function appendCursorBrandTag(options) {
    const { outputVideoPath, outputMeta } = options;
    const meta = outputMeta ?? probeVideoMeta(outputVideoPath);
    const width = Math.round(meta.width);
    const height = Math.round(meta.height);
    const fps = meta.fps;
    const logoTargetHeight = toEven(Math.max(2, Math.round(height * BRAND_TAG_LOGO_HEIGHT_FRACTION)));
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
        throw new Error(`Invalid output dimensions for brand tag: ${width}x${height}`);
    }
    if (!Number.isFinite(fps) || fps <= 0) {
        throw new Error(`Invalid output fps for brand tag: ${fps}`);
    }
    const assetPath = getBundledBrandTagAssetPath();
    if (!external_node_fs_.existsSync(assetPath)) {
        throw new Error(`Brand tag asset missing at ${assetPath}`);
    }
    const base = external_node_path_.basename(outputVideoPath, external_node_path_.extname(outputVideoPath));
    const outputDir = external_node_path_.dirname(outputVideoPath);
    const outroPath = external_node_path_.join(outputDir, `${base}.cursor_brand_outro.mp4`);
    const concatListPath = external_node_path_.join(outputDir, `${base}.cursor_brand_concat.txt`);
    const tmpOutputPath = external_node_path_.join(outputDir, `${base}.cursor_brand_tmp.mp4`);
    const backupPath = external_node_path_.join(outputDir, `${base}.pre_brand_tag.mp4`);
    try {
        // 1) Render brand tag outro clip (exactly 2.00s, scaled/padded to match output).
        // The source asset is the marketing-nav logo animation clip.
        const vf = [
            `tpad=stop_mode=clone:stop_duration=${BRAND_TAG_DURATION_SECONDS}`,
            `trim=duration=${BRAND_TAG_DURATION_SECONDS}`,
            "setpts=PTS-STARTPTS",
            `fps=${fps}`,
            `scale=-2:${logoTargetHeight}:flags=lanczos`,
            `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:${BRAND_TAG_BACKGROUND_COLOR}`,
            "format=yuv420p",
        ].join(",");
        await runFfmpeg([
            "-y",
            "-i",
            assetPath,
            "-an",
            "-vf",
            vf,
            "-c:v",
            "libx264",
            "-profile:v",
            "high",
            "-bf",
            "0",
            "-tag:v",
            "avc1",
            "-pix_fmt",
            "yuv420p",
            "-crf",
            "20",
            "-preset",
            "veryfast",
            "-movflags",
            "+faststart+use_metadata_tags",
            "-metadata",
            "comment=Made with Cursor",
            "-metadata",
            "encoder=Cursor Polished Renderer",
            outroPath,
        ], "brand-outro");
        if (!external_node_fs_.existsSync(outroPath) || external_node_fs_.statSync(outroPath).size <= 0) {
            throw new Error(`Brand outro render produced no output at ${outroPath}`);
        }
        // 2) Concatenate rendered content + outro without re-encoding.
        // We keep this in the same directory to avoid cross-device rename issues.
        external_node_fs_.writeFileSync(concatListPath, `file '${escapeConcatFilePath(outputVideoPath)}'\nfile '${escapeConcatFilePath(outroPath)}'\n`, "utf8");
        await runFfmpeg([
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            concatListPath,
            "-c",
            "copy",
            "-movflags",
            "+faststart+use_metadata_tags",
            "-metadata",
            "comment=Made with Cursor",
            "-metadata",
            "encoder=Cursor Polished Renderer",
            "-metadata",
            `cursor_brand_tag_kind=${CURSOR_BRAND_TAG_KIND}`,
            "-metadata",
            `cursor_brand_tag_duration_ms=${CURSOR_BRAND_TAG_DURATION_MS}`,
            "-metadata",
            `cursor_brand_tag_position=${CURSOR_BRAND_TAG_POSITION}`,
            tmpOutputPath,
        ], "brand-concat");
        if (!external_node_fs_.existsSync(tmpOutputPath) || external_node_fs_.statSync(tmpOutputPath).size <= 0) {
            throw new Error(`Brand concat produced no output at ${tmpOutputPath}`);
        }
        // 3) Replace output atomically (keep a short-lived backup for rollback safety).
        try {
            external_node_fs_.renameSync(outputVideoPath, backupPath);
            external_node_fs_.renameSync(tmpOutputPath, outputVideoPath);
        }
        catch (err) {
            // Best-effort rollback.
            try {
                if (external_node_fs_.existsSync(backupPath) && !external_node_fs_.existsSync(outputVideoPath)) {
                    external_node_fs_.renameSync(backupPath, outputVideoPath);
                }
            }
            catch {
                // ignore
            }
            throw err;
        }
        // Backup cleanup should never fail an otherwise successful render.
        safeUnlink(backupPath);
    }
    finally {
        // Best-effort cleanup for temporary render artifacts, regardless of which
        // step failed (outro render, concat list write, concat render, or rename).
        safeUnlink(concatListPath);
        safeUnlink(outroPath);
        safeUnlink(tmpOutputPath);
    }
}
function safeUnlink(p) {
    try {
        if (external_node_fs_.existsSync(p)) {
            external_node_fs_.unlinkSync(p);
        }
    }
    catch {
        // ignore best-effort cleanup errors
    }
}
function toEven(value) {
    if (!Number.isFinite(value))
        return 2;
    const n = Math.max(2, Math.round(value));
    return n % 2 === 0 ? n : n + 1;
}

;// ../recording-renderer/dist/index.js
/**
 * Recording renderer package.
 *
 * Single-artifact architecture: generate a RenderPlan, then render it.
 *
 * Usage:
 *   const plan = await generateRenderPlan(options);
 *   await renderFromPlan({ plan, outputVideoPath });
 */
// Config

// Core API

// Analysis functions

// Types

// Render

// Playback segments


;// ./src/recording-renderer.ts

class ExecDaemonPolishedRecordingRenderer {
    assertAvailable() { }
    async renderRecordingSession(options) {
        const plan = await generateRenderPlan({
            sessionDir: options.stagingSessionDir,
            fps: options.fps,
        }, DEFAULT_RENDERER_CONFIG);
        if (plan.diagnostics.errors.length > 0) {
            throw new Error(`Plan generation failed: ${plan.diagnostics.errors.join(", ")}`);
        }
        await renderFromPlan({
            plan,
            outputVideoPath: options.outputVideoPath,
            outputWidth: 0,
            sessionDir: options.stagingSessionDir,
            includeBrandTag: options.includeBrandTag,
        });
    }
}

;// external "node:https"
const external_node_https_namespaceObject = require("node:https");
var external_node_https_default = /*#__PURE__*/__webpack_require__.n(external_node_https_namespaceObject);
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/connect-error.js
var connect_error = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/connect-error.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/code.js
var code = __webpack_require__("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/code.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js
var https_proxy_agent_dist = __webpack_require__("../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js");
;// ./src/remoteAccess.ts











const remoteAccess_execFileAsync = external_node_util_default().promisify(external_node_child_process_.execFile);
// Pins the string-encoding overload so stdout/stderr stay strings through spawnWorkload.
const execFileUtf8Async = remoteAccess_execFileAsync;
const remoteAccess_spawnWithPipedStdio = external_node_child_process_.spawn;
const remoteAccess_logger = (0,logger/* createLogger */.h)("exec-daemon-remote-access");
const EXTENSIONS_DIR = (0,external_node_path_.join)(process.env.HOME ?? "", ".cursor-server/extensions");
const PROXY_URL = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY;
const PROXY_AGENT = PROXY_URL !== undefined && PROXY_URL.length > 0
    ? new https_proxy_agent_dist.HttpsProxyAgent(PROXY_URL) // NB: this may cause issues? https://github.com/oven-sh/bun/issues/15499
    : undefined;
const WARM_CURSOR_SERVER_INITIAL_BACKOFF_MS = 100;
const WARM_CURSOR_SERVER_MAX_BACKOFF_MS = 250;
const WARM_CURSOR_SERVER_MAX_TOTAL_POLL_MS = 30_000;
function getWarmCursorServerBackoffMs(retryCount) {
    return Math.min(WARM_CURSOR_SERVER_INITIAL_BACKOFF_MS * 2 ** retryCount, WARM_CURSOR_SERVER_MAX_BACKOFF_MS);
}
function getWarmCursorServerMaxRetries(totalPollMs) {
    let retries = 0;
    let totalDelayMs = 0;
    while (totalDelayMs < totalPollMs) {
        totalDelayMs += getWarmCursorServerBackoffMs(retries);
        retries++;
    }
    return retries;
}
const WARM_CURSOR_SERVER_MAX_RETRIES = getWarmCursorServerMaxRetries(WARM_CURSOR_SERVER_MAX_TOTAL_POLL_MS);
class PromiseLock {
    isLocked = false;
    queue = [];
    async acquire() {
        return new Promise((resolve) => {
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
const CURSOR_SERVER_CONNECTION_TOKEN_FILE = "connection-token";
/**
 * Prepare the connection-token argument for a cursor-server spawn. For `file`
 * delivery the token is written to `<commitDir>/connection-token` with mode
 * 0600 (tightened even if a looser file already exists there, which
 * `writeFile`'s mode alone would not do) and without a trailing newline, the
 * form `--connection-token-file` reads verbatim.
 */
async function prepareCursorServerConnectionTokenArg(args) {
    if (args.delivery === "argv") {
        return {
            arg: `--connection-token=${args.connectionToken}`,
            cleanup: async () => { },
        };
    }
    const tokenFile = external_node_path_default().join(args.commitDir, CURSOR_SERVER_CONNECTION_TOKEN_FILE);
    await promises_default().mkdir(args.commitDir, { recursive: true });
    await promises_default().writeFile(tokenFile, args.connectionToken, {
        encoding: "utf8",
        mode: 0o600,
    });
    await promises_default().chmod(tokenFile, 0o600);
    return {
        arg: `--connection-token-file=${tokenFile}`,
        cleanup: async () => {
            await promises_default().rm(tokenFile, { force: true }).catch(() => { });
        },
    };
}
/**
 * Thrown by `warmCursorServer` under `existingServerOnPort: "ignore"` when the
 * server answering on the port after the spawn is not the one it spawned: a
 * sibling cursor-server of the same build bound the port first. The caller
 * picks another port; nothing on this one is touched.
 */
class CursorServerPortHeldError extends Error {
    port;
    constructor(port, detail) {
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
async function assertCursorServerHoldsToken(args) {
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
async function loopbackListenerOwner(args) {
    if (false) // removed by dead control flow
{}
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
async function listeningSocketInodes(port) {
    const wantedPort = port.toString(16).toUpperCase().padStart(4, "0");
    const inodes = new Set();
    for (const table of ["/proc/net/tcp", "/proc/net/tcp6"]) {
        const contents = await promises_default().readFile(table, "utf8").catch(() => "");
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
async function processTree(root) {
    const entries = await promises_default().readdir("/proc").catch(() => []);
    const pids = entries.filter((entry) => /^\d+$/.test(entry)).map(Number);
    const parents = await (0,promise_extras/* asyncMapValues */.PH)(pids, readParentPid, { max: 32 });
    const childrenByParent = new Map();
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
async function readParentPid(pid) {
    const stat = await promises_default().readFile(`/proc/${pid}/stat`, "latin1").catch(() => undefined);
    // The comm field is parenthesised and may contain spaces; ppid is the
    // first field after it.
    const afterComm = stat?.slice(stat.lastIndexOf(")") + 2);
    const ppid = Number(afterComm?.split(" ")[1]);
    return Number.isInteger(ppid) ? ppid : undefined;
}
async function ownsSocketInode(pid, inodes) {
    const fds = await promises_default().readdir(`/proc/${pid}/fd`).catch(() => []);
    for (const fd of fds) {
        const target = await promises_default().readlink(`/proc/${pid}/fd/${fd}`).catch(() => undefined);
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
function killSpawnedProcess(pid) {
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
class RemoteAccessService {
    commitLocks = new Map();
    downloadCommitLocks = new Map();
    // TODO: support for installing extensions
    /**
     * Downloads the cursor server for the specified commit without starting it.
     * Returns true if it was already downloaded, false if a fresh download occurred.
     *
     * @param commit The commit hash of the cursor server to download
     */
    async downloadCursorServer(ctx, commit) {
        const { serverPath } = this.getServerPath(commit);
        // Check if already downloaded
        try {
            const accessMode =  false ? 0 : (promises_default()).constants.X_OK;
            await promises_default().access(serverPath, accessMode);
            remoteAccess_logger.info(ctx, "Cursor server already downloaded", { commit });
            return true;
        }
        catch {
            // Not downloaded yet, proceed
        }
        try {
            remoteAccess_logger.debug(ctx, "Downloading cursor server (download-only)", {
                commit,
            });
            const downloadStart = Date.now();
            await this.downloadCursorServer_(ctx, commit);
            remoteAccess_logger.info(ctx, "Cursor server download-only completed", {
                commit,
                durationMs: Date.now() - downloadStart,
            });
            return false;
        }
        catch (e) {
            remoteAccess_logger.error(ctx, "Failed to download cursor server (download-only)", e, {
                commit,
            });
            throw new connect_error/* ConnectError */.T("Failed to download cursor server", code/* Code */.C.Internal);
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
    async warmCursorServer(ctx, commit, port, connectionToken, options) {
        const bindHost = options?.host ?? "0.0.0.0";
        const tokenDelivery = options?.connectionTokenDelivery ?? "argv";
        const existingServerOnPort = options?.existingServerOnPort ?? "reuse-or-kill";
        if (connectionToken.length < 10) {
            throw new connect_error/* ConnectError */.T("Connection token is too short", code/* Code */.C.InvalidArgument);
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
                remoteAccess_logger.debug(ctx, "Ensuring cursor server is downloaded", { commit });
                const downloadStart = Date.now();
                await this.downloadCursorServer_(ctx, commit);
                remoteAccess_logger.debug(ctx, "Cursor server download check completed", {
                    commit,
                    durationMs: Date.now() - downloadStart,
                });
            }
            catch (e) {
                remoteAccess_logger.error(ctx, "Failed to download cursor server", e, {
                    commit,
                });
                throw new connect_error/* ConnectError */.T("Failed to download cursor server", code/* Code */.C.Internal);
            }
            if (existingServerOnPort === "reuse-or-kill") {
                // First we try querying the port's /version endpoint. If that works, then we are good to go
                const versionUrl = `http://localhost:${port}/version`; // pragma: allowlist secret
                try {
                    remoteAccess_logger.debug(ctx, "Checking if server is already running", {
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
                    remoteAccess_logger.debug(ctx, "Server check completed", {
                        durationMs: Date.now() - checkStart,
                    });
                    const version = await versionResponse.text();
                    if (version.trim() === commit) {
                        // Verify the connection token hash matches
                        remoteAccess_logger.debug(ctx, "Verifying connection token hash", { commit });
                        const verifyStart = Date.now();
                        const tokenHashMatches = await this.verifyConnectionTokenHash(commit, connectionToken);
                        remoteAccess_logger.debug(ctx, "Token verification completed", {
                            durationMs: Date.now() - verifyStart,
                            matches: tokenHashMatches,
                        });
                        if (tokenHashMatches) {
                            // this is awesome!
                            remoteAccess_logger.info(ctx, "Cursor server is already running with correct connection token. Good to go!", { commit, port });
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
            const serverProcess = (0,workload_spawn/* spawnWorkload */.D9)(external_node_child_process_.spawn, 
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
                let lastError = null;
                while (retryCount < maxRetries) {
                    const backoffMs = getWarmCursorServerBackoffMs(retryCount); // 100ms, 200ms, then capped at 250ms
                    remoteAccess_logger.debug(ctx, `Waiting ${backoffMs}ms before attempt ${retryCount + 1}/${maxRetries} to verify cursor server`, { commit, port, retryCount, maxRetries, backoffMs });
                    // Wait with exponential backoff
                    await new Promise((resolve) => setTimeout(resolve, backoffMs));
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
                        remoteAccess_logger.info(ctx, `Successfully started cursor server at http://localhost:${port} on attempt ${retryCount + 1}`, { commit, port, retryCount });
                        return { spawnedPid: serverProcess.pid };
                    }
                    catch (e) {
                        if (e instanceof CursorServerPortHeldError) {
                            throw e;
                        }
                        lastError = e instanceof Error ? e : new Error(String(e));
                        remoteAccess_logger.error(ctx, `Attempt ${retryCount + 1}/${maxRetries} to verify cursor server failed: ${lastError.message}`, lastError, { commit, port, retryCount, maxRetries });
                        retryCount++;
                    }
                }
                // If we've exhausted all retries, throw the last error
                remoteAccess_logger.error(ctx, "Failed to verify cursor server is running after all retry attempts", lastError, { commit, port });
                throw new connect_error/* ConnectError */.T("Failed to start cursor server after multiple attempts", code/* Code */.C.Internal);
            }
            catch (e) {
                remoteAccess_logger.error(ctx, "Failed to verify cursor server is running", e, {
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
                throw new connect_error/* ConnectError */.T("Failed to start cursor server", code/* Code */.C.Internal);
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
    getServerPath(commit) {
        const homeDir = external_node_os_default().homedir();
        const serverDataDir = `${homeDir}/.cursor-server`;
        const binDir = `${serverDataDir}/bin`;
        const serverPath = `${binDir}/${commit}/bin/cursor-server`;
        return { serverPath, binDir };
    }
    /**
     * Stores a hash of the connection token for security verification
     */
    async storeConnectionTokenHash(commit, connectionToken) {
        const { binDir } = this.getServerPath(commit);
        const tokenHash = (0,external_node_crypto_.createHash)("sha256").update(connectionToken).digest("hex");
        await promises_default().writeFile(`${binDir}/${commit}/connection-token-hash`, tokenHash, "utf8");
    }
    /**
     * Verifies if the provided connection token matches the stored hash
     */
    async verifyConnectionTokenHash(commit, connectionToken) {
        const { binDir } = this.getServerPath(commit);
        try {
            const storedHash = await promises_default().readFile(`${binDir}/${commit}/connection-token-hash`, "utf8");
            const currentHash = (0,external_node_crypto_.createHash)("sha256").update(connectionToken).digest("hex");
            return storedHash.trim() === currentHash;
        }
        catch (_e) {
            return false;
        }
    }
    /**
     * Gets the process ID listening on a specific port
     */
    async getPidListeningOnPort(ctx, port) {
        const platform = external_node_os_default().platform();
        try {
            if (platform === "darwin") {
                try {
                    // Try lsof first on macOS
                    remoteAccess_logger.debug(ctx, "Checking lsof for listening process", { port });
                    const startTime = Date.now();
                    const { stdout } = await (0,workload_spawn/* spawnWorkload */.D9)(execFileUtf8Async, "lsof", ["-i", `:${port}`, "-s", "TCP:LISTEN", "-t"], { encoding: "utf8" });
                    remoteAccess_logger.debug(ctx, "lsof check completed", {
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
                    remoteAccess_logger.debug(ctx, "Checking lsof with -Q flag", { port });
                    const startTime = Date.now();
                    const { stdout } = await (0,workload_spawn/* spawnWorkload */.D9)(execFileUtf8Async, "lsof", ["-i", `:${port}`, "-s", "TCP:LISTEN", "-t", "-Q"], { encoding: "utf8" });
                    remoteAccess_logger.debug(ctx, "lsof -Q check completed", {
                        port,
                        durationMs: Date.now() - startTime,
                    });
                    const pid = parseInt(stdout.trim(), 10);
                    return Number.isNaN(pid) ? null : pid;
                }
                catch {
                    try {
                        // Try ss if lsof fails
                        remoteAccess_logger.debug(ctx, "Checking ss for listening process", { port });
                        const startTime = Date.now();
                        const { stdout } = await (0,workload_spawn/* spawnWorkload */.D9)(execFileUtf8Async, "ss", ["-lptn", "sport", "=", `:${port}`], { encoding: "utf8" });
                        remoteAccess_logger.debug(ctx, "ss check completed", {
                            port,
                            durationMs: Date.now() - startTime,
                        });
                        const match = stdout.match(/pid=(\d+)/);
                        return match ? parseInt(match[1], 10) : null;
                    }
                    catch {
                        // Final fallback: check /proc/net/tcp
                        remoteAccess_logger.debug(ctx, "Reading /proc/net/tcp");
                        const startTime = Date.now();
                        const procTcp = await promises_default().readFile("/proc/net/tcp", "utf8");
                        remoteAccess_logger.debug(ctx, "/proc/net/tcp read completed", {
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
                                    const procEntries = await promises_default().readdir("/proc", {
                                        withFileTypes: true,
                                    });
                                    for (const procEntry of procEntries) {
                                        if (!procEntry.isDirectory() || !/^\d+$/.test(procEntry.name)) {
                                            continue;
                                        }
                                        try {
                                            const fdRoot = `/proc/${procEntry.name}/fd`;
                                            const fdNames = await promises_default().readdir(fdRoot);
                                            for (const fdName of fdNames) {
                                                const target = await promises_default().readlink(external_node_path_default().join(fdRoot, fdName)).catch(() => "");
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
                remoteAccess_logger.debug(ctx, "Checking netstat on Windows", { port });
                const startTime = Date.now();
                const { stdout } = await (0,workload_spawn/* spawnWorkload */.D9)(execFileUtf8Async, "netstat", ["-ano"], {
                    encoding: "utf8",
                });
                remoteAccess_logger.debug(ctx, "netstat check completed", {
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
            remoteAccess_logger.error(ctx, `Failed to get PID for port ${port}.`, error, {
                port,
            });
            throw error;
        }
    }
    /**
     * Kills the server process running on the specified port
     */
    async killServerOnPort(ctx, port, reason) {
        remoteAccess_logger.debug(ctx, "Getting PID listening on port", { port });
        const startTime = Date.now();
        const pid = await this.getPidListeningOnPort(ctx, port);
        remoteAccess_logger.debug(ctx, "Got PID", {
            port,
            pid,
            durationMs: Date.now() - startTime,
        });
        if (pid !== null) {
            remoteAccess_logger.debug(ctx, `Cursor server is running at pid ${pid} for port ${port}, but ${reason}. Killing it!`, { port, pid, reason });
            try {
                remoteAccess_logger.debug(ctx, "Killing process", { pid });
                const killStart = Date.now();
                process.kill(pid, "SIGKILL");
                remoteAccess_logger.debug(ctx, "Process killed", {
                    pid,
                    durationMs: Date.now() - killStart,
                });
                remoteAccess_logger.debug(ctx, `Cursor server killed.`, { port, pid });
            }
            catch (e) {
                remoteAccess_logger.error(ctx, "Failed to kill cursor server.", e, {
                    port,
                    pid,
                });
            }
        }
        else {
            remoteAccess_logger.debug(ctx, `Cursor server is not running on port ${port}.`, {
                port,
            });
        }
    }
    /**
     * Downloads the cursor server for the specified commit if not already downloaded
     *
     * @param commit The commit hash of the cursor server to download
     */
    async downloadCursorServer_(ctx, commit) {
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
            const osValue = external_node_os_default().platform();
            const archValue = external_node_os_default().arch();
            const url = `https://cursor.blob.core.windows.net/remote-releases/${commit}/vscode-reh-${osValue}-${archValue}.tar.gz`;
            // Get the user's home directory
            const homeDir = external_node_os_default().homedir();
            const serverDataDir = `${homeDir}/.cursor-server`;
            const binDir = `${serverDataDir}/bin`;
            const finalDir = external_node_path_default().join(binDir, commit); // Use path.join for safe path construction
            const uuid = crypto.randomUUID();
            const tempDir = `${finalDir}-dirty-${uuid}`;
            // Create necessary directories
            await promises_default().mkdir(serverDataDir, { recursive: true });
            await promises_default().mkdir(binDir, { recursive: true });
            // Check if server is already downloaded
            remoteAccess_logger.debug(ctx, "Checking if server already exists", { finalDir });
            const startCheck = Date.now();
            if (await promises_default().access(finalDir)
                .then(() => true)
                .catch(() => false)) {
                remoteAccess_logger.info(ctx, "Server already exists", {
                    finalDir,
                    durationMs: Date.now() - startCheck,
                });
                return;
            }
            // Clean up any existing dirty directory from previous failed attempts
            try {
                await promises_default().rm(tempDir, { recursive: true, force: true });
            }
            catch (_e) {
                // Ignore errors if directory doesn't exist
            }
            try {
                // Stream download directly into tar extraction to avoid extra disk IO
                remoteAccess_logger.debug(ctx, "Starting server download and extraction", {
                    url,
                    tempDir,
                });
                const downloadStart = Date.now();
                const extractStart = Date.now();
                await promises_default().mkdir(tempDir, { recursive: true });
                await new Promise((resolve, reject) => {
                    const tar = (0,workload_spawn/* spawnWorkload */.D9)(remoteAccess_spawnWithPipedStdio, "tar", ["-xzf", "-", "--strip-components", "1", "-C", tempDir], {});
                    let settled = false;
                    let extractTimeout;
                    let request;
                    const fail = (err) => {
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
                            remoteAccess_logger.info(ctx, "Server package extracted successfully", {
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
                    tar.stderr.on("data", (data) => {
                        remoteAccess_logger.error(ctx, `Tar stderr: ${data}`, { data: data.toString() });
                    });
                    tar.stdin.on("error", (err) => {
                        if (err.code === "EPIPE") {
                            return;
                        }
                        fail(err);
                    });
                    request = external_node_https_default().get(url, { agent: PROXY_AGENT }, (response) => {
                        if (response.statusCode !== 200) {
                            response.resume();
                            fail(new Error(`Failed to download: ${response.statusCode}`));
                            return;
                        }
                        response.on("end", () => {
                            remoteAccess_logger.info(ctx, "Server package downloaded successfully", {
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
                const tempServerPath = external_node_path_default().join(tempDir, "bin", "cursor-server");
                // Make the server executable (no-op on Windows where NTFS lacks Unix permission bits)
                if (true) {
                    await promises_default().chmod(tempServerPath, 0o755);
                }
                // Verify the server exists (and is executable on Unix)
                try {
                    const accessMode =  false ? 0 : (promises_default()).constants.X_OK;
                    await promises_default().access(tempServerPath, accessMode);
                }
                catch (_e) {
                    throw new Error(`Server binary is not accessible at ${tempServerPath}`);
                }
                // Move the temporary directory to the final location
                try {
                    remoteAccess_logger.debug(ctx, "Moving server to final location", {
                        tempDir,
                        finalDir,
                    });
                    const moveStart = Date.now();
                    await promises_default().rename(tempDir, finalDir);
                    remoteAccess_logger.info(ctx, "Server moved to final location", {
                        durationMs: Date.now() - moveStart,
                    });
                }
                catch (e) {
                    // If rename fails, try to clean up the temporary directory
                    try {
                        await promises_default().rm(tempDir, { recursive: true, force: true });
                    }
                    catch (cleanupError) {
                        remoteAccess_logger.error(ctx, "Failed to clean up temporary directory", cleanupError, {
                            tempDir,
                        });
                    }
                    throw e;
                }
                remoteAccess_logger.debug(ctx, `Successfully downloaded server at ${finalDir}`, {
                    commit,
                    finalDir,
                });
            }
            catch (error) {
                // Clean up temp directory if it exists
                try {
                    await promises_default().rm(tempDir, { recursive: true, force: true });
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

// EXTERNAL MODULE: ./src/request-context-disk-cache.ts
var request_context_disk_cache = __webpack_require__("./src/request-context-disk-cache.ts");
;// ./src/scoped-secrets.ts

class ScopedSecretStore {
    onValuesAdded;
    byScope = new Map();
    everSeenNames = new Set();
    constructor(onValuesAdded) {
        this.onValuesAdded = onValuesAdded;
    }
    /**
     * Replaces the scope's values; `revision` is the server's counter for them.
     * Same name rules as the managed environment: a name under the
     * `CURSOR_SANDBOX` filter would ride into the restore script, so it is
     * refused here before the server's validation is trusted.
     */
    set(scopeId, revision, secrets) {
        (0,managed_environment/* validateManagedEnvironmentNames */.tr)(secrets);
        const copy = {};
        const values = [];
        for (const [name, value] of Object.entries(secrets)) {
            copy[name] = value;
            values.push(value);
            this.everSeenNames.add(name);
        }
        this.byScope.set(scopeId, { revision, secrets: Object.freeze(copy) });
        this.onValuesAdded(values);
    }
    get(scopeId) {
        return this.byScope.get(scopeId)?.secrets;
    }
    revisionOf(scopeId) {
        return this.byScope.get(scopeId)?.revision;
    }
    /**
     * The per-command env for a scope: every name ever held is present (as
     * `undefined`, meaning unset) and the scope's own values are set on top.
     * Undefined when the store has never held anything, so the wrapper can leave
     * args untouched on hosts that never receive scoped secrets.
     */
    requestScopedEnvFor(scopeId) {
        if (this.everSeenNames.size === 0) {
            return undefined;
        }
        const env = {};
        for (const name of this.everSeenNames) {
            env[name] = undefined;
        }
        const own = scopeId === undefined ? undefined : this.byScope.get(scopeId);
        if (own !== undefined) {
            Object.assign(env, own.secrets);
        }
        return env;
    }
}
class ScopedSecretsShellCoreExecutor {
    innerExecutor;
    store;
    constructor(innerExecutor, store) {
        this.innerExecutor = innerExecutor;
        this.store = store;
    }
    execute(ctx, args) {
        const requestScopedEnv = this.store.requestScopedEnvFor(args.secretScopeId);
        if (requestScopedEnv === undefined) {
            return this.innerExecutor.execute(ctx, args);
        }
        return this.innerExecutor.execute(ctx, {
            ...args,
            requestScopedEnv: { ...requestScopedEnv, ...args.requestScopedEnv },
        });
    }
    async getCwd(conversationId) {
        return this.innerExecutor.getCwd(conversationId);
    }
    getWorkspacePath() {
        return this.innerExecutor.getWorkspacePath();
    }
}

;// ./src/shell-oom-kill.ts







const shell_oom_kill_logger = (0,logger/* createLogger */.h)("exec-daemon-shell-oom-kill");
const CGROUP_ROOT = "/sys/fs/cgroup";
/** How bash reports a child that died by SIGKILL: 128 + 9. */
const SIGKILL_EXIT_CODE = 137;
/** The exit code local-exec reports when the shell itself died by a signal. */
const SHELL_KILLED_EXIT_CODE = -1;
function readFileOrUndefined(file) {
    try {
        return (0,external_node_fs_.readFileSync)(file, "utf8");
    }
    catch {
        return undefined;
    }
}
function selfAndAncestors(dir) {
    const dirs = [];
    for (let current = dir; current.startsWith(CGROUP_ROOT); current = external_node_path_default().dirname(current)) {
        dirs.push(current);
    }
    return dirs;
}
/**
 * The cgroup shell commands land in: the workload cgroup when armed
 * (`spawnWorkload`), otherwise this process's own cgroup, which unplaced
 * children inherit.
 */
function resolveCommandCgroupDir(read) {
    const placement = (0,workload_spawn/* getWorkloadPlacement */.NG)();
    if (placement.kind === "armed") {
        return placement.workloadCgroupDir;
    }
    const entry = read("/proc/self/cgroup")
        ?.split("\n")
        .find((line) => line.startsWith("0::/"));
    return entry === undefined ? undefined : external_node_path_default().join(CGROUP_ROOT, entry.slice("0::".length));
}
function parseOomKillCount(memoryEvents) {
    const match = memoryEvents === undefined ? null : /^oom_kill (\d+)$/m.exec(memoryEvents);
    return match === null ? undefined : Number(match[1]);
}
/**
 * Nearest cgroup, the command's first, with a readable oom_kill counter. The
 * counter is hierarchical, so an ancestor still counts kills in a cgroup that
 * has no memory controller of its own. The root cgroup has no memory.events,
 * except inside a cgroup namespace where it is the container's cgroup.
 */
function findMemoryEventsDir(commandCgroupDir, read = readFileOrUndefined) {
    return selfAndAncestors(commandCgroupDir).find((dir) => parseOomKillCount(read(external_node_path_default().join(dir, "memory.events"))) !== undefined);
}
function classifyFailedCommand(exitCode, counts) {
    if (counts === undefined) {
        return exitCode === SIGKILL_EXIT_CODE ? shell_exec_pb/* ShellOomKill_Kind */.R_.UNCONFIRMED : undefined;
    }
    if (counts.end <= counts.start) {
        return undefined;
    }
    return exitCode === SIGKILL_EXIT_CODE || exitCode === SHELL_KILLED_EXIT_CODE
        ? shell_exec_pb/* ShellOomKill_Kind */.R_.COMMAND_KILLED
        : shell_exec_pb/* ShellOomKill_Kind */.R_.COMMAND_FAILED;
}
/**
 * Relates each failed shell command to the kernel OOM killer: `start()` reads
 * the counter when the command's stream starts, `finish()` reads it again at a
 * failed exit and classifies. Commands share the counter's cgroup, so
 * KIND_COMMAND_FAILED cannot say whose process died.
 */
class ShellOomKillProbe {
    platform;
    read;
    totalMemoryBytes;
    commandCgroupDir;
    memoryEventsDir;
    resolved = false;
    constructor(options = {}) {
        this.platform = options.platform ?? "linux";
        this.read = options.read ?? readFileOrUndefined;
        this.totalMemoryBytes = options.totalMemoryBytes ?? (() => BigInt(external_node_os_default().totalmem()));
        this.commandCgroupDir = options.commandCgroupDir;
    }
    start() {
        const dir = this.resolveMemoryEventsDir();
        return dir === undefined ? undefined : this.readCount(dir);
    }
    finish(startCount, exit) {
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
            oomKill: new shell_exec_pb/* ShellOomKill */.iH({ kind, memoryLimitBytes: this.memoryLimitBytes() }),
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
    readCount(dir) {
        return parseOomKillCount(this.read(external_node_path_default().join(dir, "memory.events")));
    }
    memoryLimitBytes() {
        const dirs = this.commandCgroupDir === undefined ? [] : selfAndAncestors(this.commandCgroupDir);
        for (const dir of dirs) {
            const value = this.read(external_node_path_default().join(dir, "memory.max"))?.trim();
            if (value !== undefined && /^\d+$/.test(value)) {
                return BigInt(value);
            }
        }
        return this.totalMemoryBytes();
    }
}
function oomKillReportingShellStreamExecutor(inner, probe) {
    return {
        async *execute(ctx, args, options) {
            const startCount = probe.start();
            for await (const stream of inner.execute(ctx, args, options)) {
                if (stream.event.case === "exit") {
                    const exit = stream.event.value;
                    const detection = probe.finish(startCount, exit);
                    if (detection !== undefined) {
                        exit.oomKill = detection.oomKill;
                        shell_oom_kill_logger.warn(ctx, "Shell command OOM kill detected", {
                            kind: shell_exec_pb/* ShellOomKill_Kind */.R_[detection.oomKill.kind],
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
class ShellOomKillReportingAccessor {
    inner;
    probe;
    constructor(inner, probe) {
        this.inner = inner;
        this.probe = probe;
    }
    get(resource) {
        return this.wrap(resource, this.inner.get(resource));
    }
    *entries() {
        for (const [resource, implementation] of this.inner.entries()) {
            yield [resource, this.wrap(resource, implementation)];
        }
    }
    wrap(resource, implementation) {
        if (resource.symbol !== dist/* shellStreamExecutorResource */.wve.symbol) {
            return implementation;
        }
        return oomKillReportingShellStreamExecutor(implementation, this.probe);
    }
}
/** Sets `oom_kill` on the failed exit of every shell stream the daemon serves. */
function withShellOomKillReporting(inner, probe = new ShellOomKillProbe()) {
    return new ShellOomKillReportingAccessor(inner, probe);
}

;// ./src/webp-codec-startup.ts
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


const webp_codec_startup_logger = (0,logger/* createLogger */.h)("exec-daemon");
function registerExecDaemonWebpCodec(ctx) {
    const registration = (0,local_exec_dist/* registerLocalWebpCodec */.Zu2)();
    if (registration.registered) {
        webp_codec_startup_logger.info(ctx, "webp_codec.startup", { registered: true });
        return registration;
    }
    webp_codec_startup_logger.error(ctx, "webp_codec.startup.unavailable", {
        registered: false,
        reason: registration.reason,
        platform: "linux",
        arch: "x64",
    });
    return registration;
}

;// ./src/setup.ts
/**
 * Shared setup logic for exec-daemon that can be used by both the standalone daemon
 * and bridge mode in agent-cli
 */





































const execDaemonLogger = (0,logger/* createLogger */.h)("exec-daemon");
// Pins the string-encoding overload so output stays a string through spawnWorkload.
const execFileSyncUtf8 = external_node_child_process_.execFileSync;
const EXEC_DAEMON_DATA_DIR_ENV_VAR = "CURSOR_EXEC_DAEMON_DATA_DIR";
// Hard upper bound on a single `loadServer` + `getTools` call for a
// session-scoped stdio MCP server. Covers both the SDK's own 60s per-RPC
// timeout (initialize + listTools) plus a small margin for spawn / stderr
// drain so a truly stuck child process (hung OAuth, wedged npx download,
// etc.) is surfaced as an error instead of pinning the per-server entry in
// `inFlightSessionMcpLoads` for the life of the daemon.
const SESSION_MCP_LOAD_TIMEOUT_MS = 90_000;
/**
 * Checks if a command exists and is executable.
 * Uses findActualExecutable which handles PATH search and Windows extension
 * resolution (.exe, .cmd, .bat) cross-platform.
 */
function validateExecutable(command, ctx) {
    const resolved = (0,find_executable/* findActualExecutable */.E)(command, []);
    const resolvedPath = resolved.cmd;
    try {
        const mode =  false ? 0 : external_node_fs_.constants.X_OK;
        external_node_fs_.accessSync(resolvedPath, mode);
    }
    catch {
        const msg = `Binary not found: '${command}' is not a valid executable or not in PATH`;
        execDaemonLogger.error(ctx, msg);
        process.stderr.write(`${msg}\n`);
        process.exit(1);
    }
}
function resolveExecutablePath(command) {
    try {
        const executablePath = (0,workload_spawn/* spawnWorkload */.D9)(execFileSyncUtf8, "which", [command], {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 500,
        }).trim();
        return executablePath.length > 0 ? executablePath : undefined;
    }
    catch {
        return undefined;
    }
}
function shouldUseWorldWritableDirs(dir) {
    const resolved = external_node_path_default().resolve(dir);
    const optCursorRoot = external_node_path_default().resolve("/opt/cursor");
    return resolved === optCursorRoot || resolved.startsWith(`${optCursorRoot}${(external_node_path_default()).sep}`);
}
function summarizeUnknownError(error) {
    if (error instanceof Error) {
        return {
            errorForLogger: error,
            metadata: {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack,
                errorCause: error.cause === undefined
                    ? undefined
                    : error.cause instanceof Error
                        ? `${error.cause.name}: ${error.cause.message}`
                        : (0,src_logger/* safeJsonStringify */.h)(error.cause),
            },
        };
    }
    return {
        metadata: {
            errorType: typeof error,
            errorValue: (0,src_logger/* safeJsonStringify */.h)(error),
        },
    };
}
function hashSensitiveLogValue(value) {
    return (0,external_node_crypto_.createHash)("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}
function getMcpServerLogMetadata(serverConfig) {
    if ("command" in serverConfig) {
        return {
            transport: "stdio",
            commandHash: hashSensitiveLogValue(serverConfig.command),
            cwdHash: serverConfig.cwd === undefined ? undefined : hashSensitiveLogValue(serverConfig.cwd),
            envKeys: Object.keys(serverConfig.env ?? {}),
        };
    }
    return {
        transport: "http",
        urlHash: hashSensitiveLogValue(serverConfig.url),
        headerKeys: Object.keys(serverConfig.headers ?? {}),
        hasAuth: serverConfig.auth !== undefined,
    };
}
function countConfiguredHooks(hookConfig) {
    return Object.values(hookConfig?.hooks ?? {}).reduce((total, hooksForStep) => total + hooksForStep.length, 0);
}
function summarizeHooksConfigForLogging(hooksConfig) {
    return {
        hasAnyHooks: hasAnyHooks(hooksConfig),
        configuredSteps: [...HooksConfigLoader.getConfiguredSteps(hooksConfig)].sort(),
        errorCount: hooksConfig.errors.length,
        errorSources: [
            ...new Set(hooksConfig.errors.map((error) => {
                switch (error.source) {
                    case "claude-user":
                        return "thirdParty-user";
                    case "claude-project":
                        return "thirdParty-project";
                    case "claude-project-local":
                        return "thirdParty-project-local";
                    default:
                        return error.source;
                }
            })),
        ],
        hookCountsBySource: {
            enterprise: countConfiguredHooks(hooksConfig.enterpriseHooks),
            team: countConfiguredHooks(hooksConfig.teamHooks),
            user: countConfiguredHooks(hooksConfig.userHooks),
            project: countConfiguredHooks(hooksConfig.projectHooks),
            thirdPartyUser: countConfiguredHooks(hooksConfig.claudeUserHooks),
            thirdPartyProject: countConfiguredHooks(hooksConfig.claudeProjectHooks),
            thirdPartyProjectLocal: countConfiguredHooks(hooksConfig.claudeProjectLocalHooks),
        },
    };
}
function ensureDirWithDataDirPolicy(params) {
    const { dir, globalContext, successLogMessage, failureLogMessage, mode } = params;
    try {
        external_node_fs_.mkdirSync(dir, { recursive: true, mode });
        external_node_fs_.chmodSync(dir, mode);
        execDaemonLogger.info(globalContext, successLogMessage);
    }
    catch (mkdirError) {
        execDaemonLogger.error(globalContext, failureLogMessage, {
            error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
        });
    }
}
async function runSetupStepSpan(ctx, name, fn) {
    const spanCtx = (0,otel/* withSpan */.fR)(ctx.withName(name));
    const span = (0,otel/* getSpan */.fU)(spanCtx);
    try {
        return await fn(spanCtx);
    }
    catch (error) {
        span?.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span?.end();
    }
}
class MockDiagnosticsProvider {
    async open(_ctx, _uri) {
        // No-op for mock
    }
    async getDiagnostics(_ctx, _uri) {
        return [];
    }
}
class MockCodebaseReferenceProvider {
    async getCodebaseReference() {
        return undefined; // No codebase reference in daemon mode
    }
}
class MockDecisionProvider {
    async requestApproval() {
        return { approved: true }; // Always approve for daemon mode
    }
}
/**
 * Simple token storage for daemon mode - doesn't persist tokens
 */
class NoOpTokenStorage {
    async loadTokens(_identifier) {
        return undefined; // No OAuth tokens in daemon mode
    }
    async saveTokens(_identifier, _tokens) {
        // No-op in daemon mode
    }
    async loadClientInformation(_identifier) {
        return undefined; // No OAuth client info in daemon mode
    }
    async saveClientInformation(_identifier, _clientInfo) {
        // No-op in daemon mode
    }
    async clearTokens(_identifier) {
        // No-op in daemon mode
    }
}
class DaemonPermissionsService {
    _defaultPolicy;
    constructor(defaultPolicy) {
        this._defaultPolicy = defaultPolicy ?? { type: "insecure_none" };
    }
    shouldBlockRead(_filePath) {
        return Promise.resolve(false);
    }
    shouldBlockWrite(_ctx, _filePath, _newContents) {
        return Promise.resolve(false);
    }
    shouldBlockShellCommand(_ctx, _command, _options, requestedPolicy) {
        const effective = requestedPolicy ?? this._defaultPolicy;
        const merged = this._mergeWithDefault(effective);
        return Promise.resolve({ kind: "allow", policy: merged });
    }
    isShellCommandFullyAllowlisted(_ctx, _command, _options) {
        return Promise.resolve(false);
    }
    isMcpFullyAllowlisted(_ctx, _options) {
        return Promise.resolve(false);
    }
    isWebFetchFullyAllowlisted(_ctx, _options) {
        return Promise.resolve(false);
    }
    shouldEnforceShellInvariantBlocks(_ctx, _options, _requestedPolicy) {
        return Promise.resolve({ kind: "allow" });
    }
    _mergeWithDefault(requested) {
        if (requested.type === "insecure_none" || this._defaultPolicy.type === "insecure_none") {
            return requested;
        }
        const mergedNetwork = (0,shell_exec_dist/* isAllowAllNetworkByPolicy */._B)(requested.networkPolicy)
            ? (0,shell_exec_dist/* networkAllowAllPolicy */.T6)()
            : (0,shell_exec_dist/* mergeNetworkPolicies */.fZ)(this._defaultPolicy.networkPolicy, requested.networkPolicy);
        const mergedReadonlyPaths = (0,shell_exec_dist/* mergePathsUnion */.s9)(this._defaultPolicy.additionalReadonlyPaths, requested.additionalReadonlyPaths);
        if (requested.type === "workspace_readwrite" &&
            this._defaultPolicy.type === "workspace_readwrite") {
            const mergedReadwritePaths = (0,shell_exec_dist/* mergePathsUnion */.s9)(this._defaultPolicy.additionalReadwritePaths, requested.additionalReadwritePaths);
            return {
                ...requested,
                additionalReadonlyPaths: mergedReadonlyPaths.length > 0 ? mergedReadonlyPaths : undefined,
                additionalReadwritePaths: mergedReadwritePaths.length > 0 ? mergedReadwritePaths : undefined,
                networkPolicy: mergedNetwork,
            };
        }
        return {
            ...requested,
            additionalReadonlyPaths: mergedReadonlyPaths.length > 0 ? mergedReadonlyPaths : undefined,
            networkPolicy: mergedNetwork,
        };
    }
    shouldBlockMcp(_ctx, _args) {
        return Promise.resolve(false);
    }
    addToAllowList(_ctx, _kind, _value) {
        return Promise.resolve();
    }
    addToDenyList(_ctx, _kind, _value) {
        return Promise.resolve();
    }
}
/**
 * Set up all the required dependencies for exec-daemon
 */
async function setupDaemon(options) {
    const { globalContext, workspacePaths, logLevel, isBrowserEnabled = false, isCursorSelfControlEnabled = false, isCloudRulesEnabled = false, isComputerUseEnabled = false, lazyComputerUseInit = false, computerUseApiWidth, computerUseApiHeight, desktopLeaseEnforce = false, isSecretRedactionEnabled = false, isRecordScreenEnabled = false, agentStoreConflictNoticesEnabled = false, agentStoreQuotaNoticesEnabled = false, isGenerateImageEnabled = false, isMcpMetaToolEnabled = true, stripAgentSkillContent = false, filterModelDisabledSkills = false, agentStoreSkillsDir, getDynamicAgentStoreSkillRoots, isMcpMetaToolSlimDescriptors = false, mcpInputSchemaJson = false, isSandboxEnabled = false, sandboxPolicyJson, 
    // Ideally this should sync based on the user's settings
    getThirdPartyExtensibilityEnabled = () => true, chromeExecutablePath, mcpConfig: mcpConfigJson, httpMcpToolsFile, gitService: providedGitService, surface = "cloud", dataDir, projectDir, readOnlyBareMode: readOnlyBareModeOption = false, readOnlyBareRepoPath: readOnlyBareRepoPathOption = "/workspace/readonly-pod-bare.git", disableRequestContextDiskCache = false, includePluginsInRequestContext = true, exposeMcpFileSystemForSessionMcp = false, } = options;
    const workspacePath = workspacePaths[0];
    if (workspacePath === undefined) {
        throw new Error("setupDaemon requires at least one workspace path");
    }
    const resolvedDataDir = dataDir ?? process.env[EXEC_DAEMON_DATA_DIR_ENV_VAR];
    const resolvedLogsDir = resolvedDataDir ? external_node_path_default().join(resolvedDataDir, "logs") : local_exec_dist/* LOGS_DIR */.c6e;
    const resolvedArtifactsDir = (0,artifactUploads/* resolveArtifactsRootPath */.VO)(resolvedDataDir);
    const artifactRootResolver = options.artifactRootResolver ??
        (() => ({
            artifactsRootPath: resolvedArtifactsDir,
            rootKind: "local",
        }));
    const artifactUploadManagerProvider = new artifactUploads/* ArtifactUploadManagerProvider */.cB({
        resolveRoot: artifactRootResolver,
        detectAgentStoreBackedAlias: options.artifactRootResolver === undefined && resolvedDataDir === undefined,
    });
    const getArtifactsFolder = (ctx) => artifactRootResolver(ctx).artifactsRootPath;
    const resolvedRecordingStagingDir = resolvedDataDir
        ? external_node_path_default().join(resolvedDataDir, "recording-staging")
        : local_exec_dist/* RECORDING_STAGING_DIR */.OhU;
    const cloudMcpSecretAccessor = createCloudMcpInjectedSecretAccessor({
        secretAccessor: (name) => process.env[name],
    });
    const dirCreateMode = shouldUseWorldWritableDirs(resolvedDataDir ?? resolvedLogsDir)
        ? 0o777
        : 0o700;
    // Set up git service (use provided or create new), remote access service, and pty manager
    const gitService = providedGitService ?? new git/* GitService */.Y8(globalContext);
    const remoteAccessService = new RemoteAccessService();
    const ptyManager = new PtyManager(globalContext);
    // Parse MCP config from option (non-encrypted, so passed via CLI)
    let mcpConfig;
    await runSetupStepSpan(globalContext, "exec_daemon.setup.parse_mcp_config", async (spanCtx) => {
        if (mcpConfigJson) {
            try {
                const parsed = JSON.parse(mcpConfigJson);
                if (Object.keys(parsed).length > 0) {
                    const parsedConfig = mcp_agent_exec_dist/* mcpConfigSchema */.Vh.parse(parsed);
                    mcpConfig = (0,mcp_agent_exec_dist/* expandMcpConfigForCloudRuntime */.N5)(parsedConfig, () => undefined);
                }
            }
            catch (error) {
                execDaemonLogger.error(spanCtx, "Failed to parse MCP config", error);
            }
        }
    });
    const mcpConfigSummary = {
        hasMcpConfig: mcpConfig !== undefined,
        serverNames: Object.keys(mcpConfig?.mcpServers ?? {}),
        stdioServerCount: Object.values(mcpConfig?.mcpServers ?? {}).filter((config) => "command" in config).length,
        httpServerCount: Object.values(mcpConfig?.mcpServers ?? {}).filter((config) => "url" in config)
            .length,
    };
    // Keep a stable metadata directory for transcripts and other daemon state.
    const resolvedProjectDir = projectDir ?? getProjectDir(workspacePath);
    execDaemonLogger.info(globalContext, "Starting exec-daemon", {
        logLevel,
        workspacePath,
        projectDir: resolvedProjectDir,
        browserEnabled: isBrowserEnabled,
        cursorSelfControlEnabled: isCursorSelfControlEnabled,
        mcpConfigSummary,
        cloudRulesEnabled: isCloudRulesEnabled,
        computerUseEnabled: isComputerUseEnabled,
        secretRedactionEnabled: isSecretRedactionEnabled,
        recordScreenEnabled: isRecordScreenEnabled,
        orbitOperationReportingEnabled: options.orbitOperationReporter !== undefined,
        chromeExecutablePath: chromeExecutablePath,
    });
    const gitExecutor = new local_exec_dist/* LocalGitExecutor */.xK7();
    execDaemonLogger.info(globalContext, "Resolved exec-daemon workspaces", {
        workspacePath,
        workspacePaths,
    });
    // Set up all the required dependencies
    const decisionProvider = new MockDecisionProvider();
    // FileChangeTracker is unused in exec-daemon (no IDE file watchers), but
    // LocalResourceProvider requires one. Use the first discovered workspace
    // rather than the raw daemon cwd which may be /agent (not a git repo).
    const fileChangeTracker = new local_exec_dist/* FileChangeTracker */.$1H(workspacePath);
    validateExecutable((0,shell_exec_dist/* getRipgrepBinaryPath */.Ko)(), globalContext); // fail hard if ripgrep cannot be found, so we don't silently fail to load Cursor rules
    const ignoreService = new local_exec_dist/* LazyIgnoreService */.E1e(gitExecutor, undefined);
    // Validate ffmpeg availability (optional - executor will handle errors gracefully if missing)
    // If screen recording is enabled, check for ffmpeg and warn if not found
    if (isRecordScreenEnabled) {
        const ffmpegResolved = (0,find_executable/* findActualExecutable */.E)("ffmpeg", []);
        const ffmpegMode =  false ? 0 : external_node_fs_.constants.X_OK;
        let ffmpegMissing = false;
        try {
            external_node_fs_.accessSync(ffmpegResolved.cmd, ffmpegMode);
        }
        catch {
            ffmpegMissing = true;
        }
        if (ffmpegMissing) {
            execDaemonLogger.warn(globalContext, "ffmpeg not found in PATH - screen recording will not work. Please install ffmpeg to use the recordScreen tool.");
        }
        const artifactsDir = options.recordScreenArtifactsDir ?? resolvedArtifactsDir;
        const stagingDir = resolvedRecordingStagingDir;
        for (const dir of [artifactsDir, stagingDir]) {
            ensureDirWithDataDirPolicy({
                dir,
                globalContext,
                successLogMessage: `Recording directory created/verified: ${dir}`,
                failureLogMessage: `Failed to create recording directory ${dir} - screen recording may not work`,
                mode: dirCreateMode,
            });
        }
    }
    if (options.isGenerateImageEnabled) {
        const artifactsAssetsDir = external_node_path_default().join(resolvedArtifactsDir, "assets");
        ensureDirWithDataDirPolicy({
            dir: artifactsAssetsDir,
            globalContext,
            successLogMessage: `Artifacts assets directory created/verified: ${artifactsAssetsDir}`,
            failureLogMessage: `Failed to create artifacts assets directory ${artifactsAssetsDir} - generated images may not work`,
            mode: dirCreateMode,
        });
    }
    ensureDirWithDataDirPolicy({
        dir: resolvedLogsDir,
        globalContext,
        successLogMessage: `Logs directory created/verified: ${resolvedLogsDir}`,
        failureLogMessage: `Failed to create logs directory ${resolvedLogsDir} - debug subagent logging may not work`,
        mode: dirCreateMode,
    });
    // Eagerly create the terminals directory: the agent's prompt advertises it
    // from the very first turn (as RequestContextEnv.terminalsFolder), but it is
    // otherwise only created lazily when a shell first backgrounds
    // (FileLoggingShellFactory), and on cloud VMs nothing else creates it.
    // Agents that inspect the advertised path at startup hit ENOENT, conclude
    // the path is wrong, and waste turns hunting for the "real" location
    // (CPROD-905). Plain default-mode mkdir (not ensureDirWithDataDirPolicy,
    // whose chmod would diverge from the lazy writer's default-mode mkdir);
    // best-effort — on failure the lazy path still applies.
    try {
        await external_node_fs_.promises.mkdir(external_node_path_default().join(resolvedProjectDir, "terminals"), {
            recursive: true,
        });
    }
    catch (mkdirError) {
        execDaemonLogger.warn(globalContext, `Failed to create terminals directory under ${resolvedProjectDir} - the prompt-advertised terminals folder may not exist until a shell backgrounds`, {
            error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
        });
    }
    const diagnosticsProvider = new MockDiagnosticsProvider();
    const codebaseReferenceProvider = new MockCodebaseReferenceProvider();
    const mcpManager = new mcp_agent_exec_dist/* McpManager */.i9({});
    if (mcpConfig !== undefined) {
        const configuredMcpServers = mcpConfig.mcpServers;
        await runSetupStepSpan(globalContext, "exec_daemon.setup.load_static_mcp_servers", async (spanCtx) => {
            execDaemonLogger.info(spanCtx, "Exec-daemon received MCP config", {
                ...mcpConfigSummary,
                transports: Object.fromEntries(Object.entries(configuredMcpServers).map(([name, cfg]) => [
                    name,
                    "command" in cfg ? "stdio" : "url" in cfg ? "http" : "unknown",
                ])),
            });
            for (const [serverName, serverConfig] of Object.entries(configuredMcpServers)) {
                if (!("command" in serverConfig)) {
                    continue;
                }
                const loadConfiguredClient = async (ctx) => {
                    // Expand stdio env at spawn time: warm-fork secret injection via
                    // UpdateEnvironmentVariables can land after daemon startup. The
                    // daemon's own env is layered in at the same point, for the same
                    // reason.
                    const spawnServerConfig = withInheritedExecDaemonEnv(expandCloudMcpStdioServerEnvOnly(serverConfig, cloudMcpSecretAccessor));
                    const client = await (0,mcp_agent_exec_dist/* loadServer */.qV)(ctx, serverName, spawnServerConfig, (0,mcp_token_storage/* createEphemeralScopedTokenStorage */.Iw)());
                    execDaemonLogger.info(ctx, "Exec-daemon MCP server loaded", {
                        serverName,
                    });
                    return client;
                };
                if (!isMcpMetaToolEnabled) {
                    try {
                        mcpManager.setClient(serverName, await loadConfiguredClient(spanCtx));
                    }
                    catch (error) {
                        const { errorForLogger, metadata: errorMetadata } = summarizeUnknownError(error);
                        execDaemonLogger.error(spanCtx, "Exec-daemon MCP server failed to start", errorForLogger, {
                            serverName,
                            ...getMcpServerLogMetadata(serverConfig),
                            ...errorMetadata,
                            stderrTail: (0,mcp_agent_exec_dist/* getMcpStdioStderrTail */.S2)(error),
                        });
                    }
                    continue;
                }
                let lazyClient;
                lazyClient = new LazyMcpClient(serverName, serverConfig, loadConfiguredClient, () => {
                    if (mcpManager.getClient(serverName) === lazyClient) {
                        mcpManager.setClient(serverName, lazyClient);
                    }
                }, SESSION_MCP_LOAD_TIMEOUT_MS);
                mcpManager.setClient(serverName, lazyClient);
            }
        });
    }
    const initialNestedExtensibilityResults = workspacePaths.map((currentWorkspacePath) => {
        const service = new local_exec_dist/* NestedExtensibilityService */.IK_(currentWorkspacePath, gitExecutor, external_node_os_default().homedir(), getThirdPartyExtensibilityEnabled);
        return service.discover(globalContext);
    });
    // Set up cursor rules services across all discovered workspaces.
    const localCursorRulesServices = workspacePaths.map((currentWorkspacePath, idx) => new local_exec_dist/* LocalCursorRulesService */.KOV(globalContext, gitExecutor, currentWorkspacePath, true, // loadNestedRules
    getThirdPartyExtensibilityEnabled, undefined, // No file watching in exec-daemon
    undefined, initialNestedExtensibilityResults[idx]));
    const launcherAgentStoreSkillRoots = resolveAgentStoreSkillRoots(agentStoreSkillsDir);
    // A provider rather than the resolved list, because a private worker's roots
    // are not knowable at startup: its store mounts per claim, under a path that
    // depends on which owner claimed the worker.
    const getAgentStoreSkillRoots = () => getDynamicAgentStoreSkillRoots === undefined
        ? launcherAgentStoreSkillRoots
        : resolveAgentStoreSkillRoots([
            ...launcherAgentStoreSkillRoots,
            ...getDynamicAgentStoreSkillRoots(),
        ]);
    // Discovery and dedupe must read the same roots, or a store skill is surfaced
    // that dedupe does not recognise and tiers under the wrong scope.
    const agentStoreSkillsContext = () => ({
        userHomeDirectory: external_node_os_default().homedir(),
        agentStoreSkillsDirs: getAgentStoreSkillRoots(),
    });
    // Set up agent skills service for the caller's execution surface.
    const agentSkillsService = new local_exec_dist/* AgentSkillsCursorRulesService */.EVC(globalContext, workspacePaths, external_node_os_default().homedir(), gitExecutor, true, // loadNestedSkills — same as LocalCursorRulesService nested flag
    undefined, // No file watching in exec-daemon
    getThirdPartyExtensibilityEnabled, undefined, surface, initialNestedExtensibilityResults, getAgentStoreSkillRoots);
    const importThirdPartyPlugins = false;
    const pluginsService = new CloudPluginsService(external_node_os_default().homedir());
    const pluginSkillsService = new local_exec_dist/* CursorPluginsAgentSkillsService */.Rxj(globalContext, () => ({ importThirdPartyPlugins }), undefined, // No file watching in exec-daemon
    pluginsService);
    // Skill services must stay in this merge: their `getAllCursorRules()` is the
    // only source of always-apply skills (`global` rules) and plugin `rules/`
    // entries, neither of which appears in `RequestContext.agentSkills`.
    const cursorRulesService = new local_exec_dist/* MergedCursorRulesService */.Px0([...localCursorRulesServices, agentSkillsService, pluginSkillsService], agentStoreSkillsContext);
    const mergedAgentSkillsService = new local_exec_dist/* MergedAgentSkillsService */.NB([agentSkillsService, pluginSkillsService], () => [], () => ({
        workspacePaths,
        ...agentStoreSkillsContext(),
    }));
    const requestContextCursorRulesService = withDeduplicatedAgentSkillRules(cursorRulesService, (ctx) => mergedAgentSkillsService.getAllAgentSkills(ctx));
    // Only create cloud rules service if explicitly enabled
    const cloudRulesService = isCloudRulesEnabled
        ? new local_exec_dist/* MergedCloudRulesService */.M10(workspacePaths.map((currentWorkspacePath) => ({
            workspacePath: currentWorkspacePath,
            service: new local_exec_dist/* LocalCloudRulesService */.TCT(globalContext, currentWorkspacePath, undefined),
        })))
        : undefined;
    // Set up subagents service
    const pluginSubagentsService = new local_exec_dist/* CursorPluginsSubagentsService */._Ji(() => ({ importThirdPartyPlugins }), pluginsService);
    const localSubagentsServices = workspacePaths.map((currentWorkspacePath) => new local_exec_dist/* LocalSubagentsService */.VzO(currentWorkspacePath, getThirdPartyExtensibilityEnabled));
    const subagentsService = new local_exec_dist/* MergedSubagentsService */.o_K([
        ...localSubagentsServices,
        pluginSubagentsService,
    ]);
    // Repo hooks should always resolve from the actual workspace root to match
    // desktop / VS Code behavior; metadata dir remains only for daemon state.
    const hooksProjectPath = workspacePath;
    const stdioMcpLease = new mcp_agent_exec_dist/* ManagerMcpLease */.uz(mcpManager);
    let refreshMcpState;
    const ensureMcpServersLoaded = async (ctx, serverIdentifiers, options) => {
        const wait = options?.wait !== false;
        // Load in parallel and isolate per-server failures: a single spawn/
        // handshake error must not skip (or serialize behind) the rest of the
        // set — otherwise later lazy clients stay forever in `loading`
        // (settings "Starting") until a later listing happens to name them first.
        const loadOne = async (serverIdentifier) => {
            const client = mcpManager.getClient(serverIdentifier) ??
                Object.values(mcpManager.getClients()).find((candidate) => candidate.serverName === serverIdentifier);
            if (!(client instanceof LazyMcpClient)) {
                return;
            }
            try {
                await client.ensureLoaded(ctx);
            }
            catch (error) {
                execDaemonLogger.warn(ctx, "Failed to load session MCP server", {
                    serverName: serverIdentifier,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    stderrTail: (0,mcp_agent_exec_dist/* getMcpStdioStderrTail */.S2)(error),
                });
            }
        };
        if (!wait) {
            // Kick every load, then return so the caller can snapshot "loading"
            // status immediately. Refresh MCP state once the batch settles so
            // subsequent reads see connected/error without another ensureLoaded.
            void (0,promise_extras/* asyncMapSettledValues */.up)([...serverIdentifiers], loadOne, {
                max: Math.max(serverIdentifiers.length, 1),
            })
                .then(async () => {
                if (serverIdentifiers.length > 0) {
                    await refreshMcpState?.(ctx);
                }
            })
                .catch((error) => {
                execDaemonLogger.warn(ctx, "Failed to refresh MCP state after kick-only load", {
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            });
            return;
        }
        try {
            await (0,promise_extras/* asyncMapSettledValues */.up)([...serverIdentifiers], loadOne, {
                max: Math.max(serverIdentifiers.length, 1),
            });
        }
        finally {
            if (serverIdentifiers.length > 0) {
                await refreshMcpState?.(ctx);
            }
        }
    };
    const sessionMcpRegistered = new Set();
    // Each registered server's serialized config, so a later push with a CHANGED
    // command/args/env replaces the client instead of silently keeping the old
    // process configuration (callers like the Sand box treat every push as the
    // full desired config, including in-place edits).
    const sessionMcpConfigJsons = new Map();
    const sessionMcpRegistrations = new Map();
    let lastRegisteredConfigHash;
    let onSessionMcpServersLoaded;
    const loadSessionMcpServers = async (ctx, configJson, options) => {
        const loadedServerNames = [];
        // The hash covers the config alone, so a repeat call after a non-reconcile
        // load could still have removals to apply — skip the dedupe when
        // removeMissing is set (the per-server checks keep re-adds cheap).
        const configHash = (0,external_node_crypto_.createHash)("sha256").update(configJson).digest("hex");
        if (lastRegisteredConfigHash === configHash &&
            options?.initialize !== true &&
            options?.removeMissing !== true) {
            return loadedServerNames;
        }
        let allConfiguredServerNames;
        try {
            const parsed = JSON.parse(configJson);
            const config = (0,mcp_agent_exec_dist/* expandMcpConfigForCloudRuntime */.N5)(mcp_agent_exec_dist/* mcpConfigSchema */.Vh.parse(parsed), () => undefined);
            allConfiguredServerNames = Object.keys(config.mcpServers);
            for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
                const serverConfigJson = JSON.stringify(serverConfig);
                const existingRegistration = sessionMcpRegistrations.get(serverName);
                if (existingRegistration !== undefined) {
                    await existingRegistration;
                }
                // Already registered with the SAME config → untouched. A changed
                // config falls through and re-registers, replacing (and closing) the
                // previous client.
                if (sessionMcpRegistered.has(serverName) &&
                    sessionMcpConfigJsons.get(serverName) === serverConfigJson) {
                    continue;
                }
                const registration = (async () => {
                    const previousClient = mcpManager.getClient(serverName);
                    let lazyClient;
                    lazyClient = new LazyMcpClient(serverName, serverConfig, async (loadCtx) => {
                        // Expand stdio env and inherit the daemon's env at spawn time
                        // (see loadConfiguredClient).
                        const spawnServerConfig = withInheritedExecDaemonEnv(expandCloudMcpStdioServerEnvOnly(serverConfig, cloudMcpSecretAccessor));
                        return await (0,mcp_agent_exec_dist/* loadServer */.qV)(loadCtx, serverName, spawnServerConfig, (0,mcp_token_storage/* createEphemeralScopedTokenStorage */.Iw)());
                    }, () => {
                        if (mcpManager.getClient(serverName) === lazyClient) {
                            mcpManager.setClient(serverName, lazyClient);
                        }
                    }, SESSION_MCP_LOAD_TIMEOUT_MS);
                    mcpManager.setClient(serverName, lazyClient);
                    sessionMcpRegistered.add(serverName);
                    sessionMcpConfigJsons.set(serverName, serverConfigJson);
                    loadedServerNames.push(serverName);
                    try {
                        await previousClient?.close?.();
                    }
                    catch (error) {
                        execDaemonLogger.warn(ctx, "Failed to close replaced MCP client", {
                            serverName,
                            errorMessage: error instanceof Error ? error.message : String(error),
                        });
                    }
                })();
                sessionMcpRegistrations.set(serverName, registration);
                try {
                    await registration;
                }
                finally {
                    if (sessionMcpRegistrations.get(serverName) === registration) {
                        sessionMcpRegistrations.delete(serverName);
                    }
                }
            }
        }
        catch (error) {
            execDaemonLogger.error(ctx, "Failed to parse MCP config for session", error instanceof Error ? error : undefined);
        }
        // Reconcile removals: session-registered servers absent from the desired
        // config are closed + deregistered. Guarded on a successfully parsed
        // config so a malformed payload can never wipe every session server, and
        // scoped to `sessionMcpRegistered` so static --mcp-config servers are
        // never removed.
        const removedServerNames = [];
        if (options?.removeMissing === true && allConfiguredServerNames !== undefined) {
            const desiredServerNames = new Set(allConfiguredServerNames);
            for (const serverName of [...sessionMcpRegistered]) {
                if (desiredServerNames.has(serverName)) {
                    continue;
                }
                const existing = mcpManager.getClient(serverName);
                mcpManager.deleteClient(serverName);
                sessionMcpRegistered.delete(serverName);
                sessionMcpConfigJsons.delete(serverName);
                removedServerNames.push(serverName);
                try {
                    await existing?.close?.();
                }
                catch (error) {
                    execDaemonLogger.warn(ctx, "Failed to close removed session MCP client", {
                        serverName,
                        errorMessage: error instanceof Error ? error.message : String(error),
                    });
                }
            }
            if (removedServerNames.length > 0) {
                execDaemonLogger.info(ctx, "Removed session MCP servers", {
                    removedServerNames,
                });
            }
        }
        const allServersRegistered = allConfiguredServerNames?.every((name) => sessionMcpRegistered.has(name)) === true;
        if (!isMcpMetaToolEnabled || options?.initialize === true) {
            await ensureMcpServersLoaded(ctx, allConfiguredServerNames ?? []);
        }
        if (allServersRegistered) {
            lastRegisteredConfigHash = configHash;
        }
        if ((loadedServerNames.length > 0 || removedServerNames.length > 0) &&
            onSessionMcpServersLoaded) {
            await onSessionMcpServersLoaded(ctx);
        }
        return loadedServerNames;
    };
    let httpMcpLease;
    const httpMcpToolsJson = httpMcpToolsFile
        ? await (async () => {
            try {
                return await external_node_fs_.promises.readFile(httpMcpToolsFile, "utf-8");
            }
            catch (error) {
                execDaemonLogger.error(globalContext, "Failed to read HTTP MCP tools file", {
                    path: httpMcpToolsFile,
                    error,
                });
                return undefined;
            }
        })()
        : undefined;
    if (httpMcpToolsJson) {
        try {
            const httpTools = JSON.parse(httpMcpToolsJson);
            if (httpTools.length > 0) {
                httpMcpLease = new local_exec_dist/* StaticMcpLease */.J2t(httpTools.map(dist/* buildNamedMcpToolDefinitionFromFileContent */.uvp));
                execDaemonLogger.info(globalContext, "Parsed HTTP MCP tools for file system discovery", {
                    toolCount: httpTools.length,
                    source: "file",
                });
            }
        }
        catch (error) {
            execDaemonLogger.error(globalContext, "Failed to parse HTTP MCP tools JSON", error);
        }
    }
    const mcpLeaseForDiscovery = httpMcpLease
        ? new local_exec_dist/* CombinedMcpLease */.cND([stdioMcpLease, httpMcpLease])
        : stdioMcpLease;
    let mcpFileSystemWriter;
    const hasConfiguredMcpServers = mcpConfigSummary.serverNames.length > 0;
    const shouldExposeMcpFileSystem = httpMcpLease || hasConfiguredMcpServers || exposeMcpFileSystemForSessionMcp;
    if (shouldExposeMcpFileSystem) {
        // Exec daemon currently keeps the default MCP auth/status copy fallback from
        // local-exec. VSCode can override this copy via dynamic config.
        mcpFileSystemWriter = new local_exec_dist/* McpFileSystemWriter */.x7h(mcpLeaseForDiscovery, resolvedProjectDir, {
            loggerBackend: globalContext.get(logger/* loggerKey */._O),
            exposeVirtualMcpAuthTool: false,
        });
    }
    const mcpLease = stdioMcpLease;
    const grepProvider = {
        executeIndexedGrep: undefined,
    };
    let sandboxEnabled = false;
    if (isSandboxEnabled) {
        sandboxEnabled = (0,shell_exec_dist/* isSandboxSupported */.K3)(undefined, {
            cwd: workspacePath,
            ctx: globalContext,
        });
        if (!sandboxEnabled) {
            execDaemonLogger.warn(globalContext, "Sandbox was requested but is not supported in this environment. Continuing with sandbox disabled.");
        }
    }
    // Set up permissions service with sandbox policies
    const defaultSandboxPolicy = (() => {
        if (!sandboxEnabled) {
            return { type: "insecure_none" };
        }
        if (sandboxPolicyJson !== undefined) {
            try {
                const sandboxPolicy = (0,shell_exec_dist/* parseSandboxPolicyJson */.$6)(JSON.parse(sandboxPolicyJson));
                return (0,shell_exec_dist/* resolvePolicyPaths */.l7)(sandboxPolicy, workspacePath);
            }
            catch (error) {
                execDaemonLogger.error(globalContext, "Failed to parse sandbox policy, using default policy", { error });
            }
        }
        return {
            type: "workspace_readwrite",
        };
    })();
    const permissionsService = new DaemonPermissionsService(defaultSandboxPolicy);
    const hooksConfigPaths = getHooksConfigPaths(hooksProjectPath);
    hooksConfigPaths.teamConfigPath = getCloudManagedTeamHooksPath(external_node_os_default().homedir());
    const fileReader = new NodeFileReader();
    const loadHooksConfig = async () => {
        const configLoader = new HooksConfigLoader(fileReader, hooksConfigPaths);
        return await configLoader.load();
    };
    const hooksConfig = await loadHooksConfig();
    const hooksConfigLease = new MutableHooksConfigLeaseImpl(hooksConfig);
    const execDaemonTerminalExecutor = (0,shell_exec_dist/* createDefaultTerminalExecutor */.Fn)();
    const hooksTerminalExecutor = (0,shell_exec_dist/* createNaiveTerminalExecutor */.fi)();
    // Build the computer-use executor. See computerUseExecutorSetup.ts for the
    // lazy-vs-eager init modes.
    const computerUseDisplay = (0,local_exec_dist/* getDisplay */.pvL)(options.recordScreenDisplay);
    const xdpyinfoPath = resolveExecutablePath("xdpyinfo");
    let computerUseExecutor;
    await runSetupStepSpan(globalContext, "exec_daemon.setup.init_computer_use", async (spanCtx) => {
        execDaemonLogger.info(spanCtx, "computer_use_startup_config", {
            computerUseEnabled: isComputerUseEnabled,
            lazyComputerUseInit,
            computerUseApiWidth,
            computerUseApiHeight,
            recordScreenEnabled: isRecordScreenEnabled,
            recordScreenDisplayOption: options.recordScreenDisplay,
            resolvedDisplay: computerUseDisplay,
            displayEnv: process.env.DISPLAY,
            hasXdpyinfo: xdpyinfoPath !== undefined,
            xdpyinfoPath,
        });
        computerUseExecutor = await buildExecDaemonComputerUseExecutor(spanCtx, {
            isComputerUseEnabled,
            lazyComputerUseInit,
            display: computerUseDisplay,
            xdpyinfoPath,
            apiWidth: computerUseApiWidth,
            apiHeight: computerUseApiHeight,
        });
    });
    // Only an X11 desktop can be shared with a human; Mac computer use has no
    // lease, so its RPC answers Unimplemented and clients fall back.
    const x11ComputerUseExecutor = computerUseExecutor !== undefined && computerUseExecutorHasInputEventLogger(computerUseExecutor)
        ? computerUseExecutor
        : undefined;
    const desktopLeaseStore = x11ComputerUseExecutor === undefined
        ? undefined
        : new local_exec_dist/* DesktopLeaseStore */.eI$({
            enforce: desktopLeaseEnforce,
            releaseHeldInput: () => x11ComputerUseExecutor.releaseHeldInput(),
        });
    execDaemonLogger.info(globalContext, "loading resource provider", {
        computerUseEnabled: isComputerUseEnabled,
        computerUseRunning: computerUseExecutor !== undefined,
        desktopLeaseEnforce,
    });
    let secretRedactionState;
    if (isSecretRedactionEnabled) {
        await (0,secretRedaction/* refreshCachedGitAuthTokens */.wM)();
        secretRedactionState = new secretRedaction/* SecretRedactionState */.LK();
        secretRedactionState.refreshFromEnv(process.env);
    }
    const lazySecretReader = secretRedactionState
        ? () => secretRedactionState.getRedactor()
        : undefined;
    // Scoped secrets ride the redaction switch: a value the daemon can inject is
    // always one it can redact.
    const scopedSecretStore = secretRedactionState
        ? new ScopedSecretStore((values) => secretRedactionState.retainSecretValues(values, process.env))
        : undefined;
    const polishedRecordingRenderer = isRecordScreenEnabled
        ? new ExecDaemonPolishedRecordingRenderer()
        : undefined;
    const sharedMcpStateAccessor = new local_exec_dist/* ObservableMcpStateAccessor */.aZ7(mcpLeaseForDiscovery);
    if (shouldExposeMcpFileSystem) {
        await sharedMcpStateAccessor.refreshNow(globalContext);
    }
    refreshMcpState = async (ctx) => {
        await sharedMcpStateAccessor.refreshNow(ctx);
    };
    onSessionMcpServersLoaded = async (ctx) => {
        await sharedMcpStateAccessor.refreshNow(ctx);
    };
    const readOnlyBareMode = readOnlyBareModeOption;
    const readOnlyBareRepoPath = readOnlyBareRepoPathOption.trim();
    // Read-only bare mode currently runs request-context against a single
    // bare mirror, which can only represent one repo. If the daemon
    // discovered multiple workspaces, sibling repos would silently disappear
    // from rules / skills / codebase resolution — fail loud instead so the
    // caller knows multi-root isn't supported on this path yet.
    if (readOnlyBareMode && workspacePaths.length > 1) {
        throw new Error(`--read-only-bare-mode does not support multi-root workspaces (got ${workspacePaths.length}: ${workspacePaths.join(", ")})`);
    }
    const projectAgentSkillsForRequestContext = (skills) => {
        let projected = skills;
        if (filterModelDisabledSkills) {
            projected = projected.filter(dist/* shouldIncludeAgentSkillInRequestContext */.X_3);
        }
        if (stripAgentSkillContent) {
            projected = (0,dist/* stripAgentSkillContentForRequestContext */.tx6)(projected, {
                preservePluginSkillContent: true,
            });
        }
        return projected;
    };
    // Request-context options shared by the full executor and the dynamic-only
    // executor (everything except the static workspace providers and agent skills,
    // which differ between the two).
    const sharedRequestContextOptions = {
        projectDir: resolvedProjectDir,
        getSandboxEnabled: () => sandboxEnabled,
        getSandboxSupported: () => sandboxEnabled,
        getMcpFileSystemOptions: mcpFileSystemWriter
            ? async (ctx, options) => mcpFileSystemWriter.getMcpFileSystemOptions(ctx, options)
            : undefined,
        mcpMetaToolEnabled: isMcpMetaToolEnabled,
        mcpMetaToolSlimDescriptors: isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors,
        mcpInputSchemaJson,
        getArtifactsFolder,
        secretRedactionEnabled: !!lazySecretReader,
        getComputerUseSupported: () => computerUseExecutor !== undefined,
    };
    // Filesystem-only static services (no plugin content). The env-build prebuild
    // bakes from these so the on-disk cache is plugin-free: cloud plugins are
    // provisioned per-agent at runtime, after the snapshot, and the runtime daemon
    // merges them on top of the baked baseline. Baking plugin content here would
    // double-count it once an agent's plugins are installed.
    const filesystemAgentSkillsService = new local_exec_dist/* MergedAgentSkillsService */.NB([agentSkillsService], () => [], () => ({
        workspacePaths,
        ...agentStoreSkillsContext(),
    }));
    const filesystemRequestContextCursorRulesService = withDeduplicatedAgentSkillRules(new local_exec_dist/* MergedCursorRulesService */.Px0([...localCursorRulesServices, agentSkillsService], agentStoreSkillsContext), (ctx) => filesystemAgentSkillsService.getAllAgentSkills(ctx));
    const filesystemSubagentsService = new local_exec_dist/* MergedSubagentsService */.o_K(localSubagentsServices);
    // The full executor scans the workspace for the static request context (rules,
    // skills, subagents, codebase ref, cloud rule). Used directly by the env-build
    // prebuild (filesystem-only, so the baked cache is plugin-free) and as the
    // runtime cache-miss fallback (with live plugins merged, matching the cache-hit
    // path); built lazily there so the rescan never runs on the cache-hit path.
    const buildFullRequestContextExecutor = (includePlugins) => {
        const executor = new local_exec_dist/* LocalRequestContextExecutor */.d2r(includePlugins
            ? requestContextCursorRulesService
            : filesystemRequestContextCursorRulesService, cloudRulesService, includePlugins ? subagentsService : filesystemSubagentsService, codebaseReferenceProvider, grepProvider, sharedMcpStateAccessor, gitExecutor, workspacePaths, {
            ...sharedRequestContextOptions,
            getAgentSkills: async (ctx) => projectAgentSkillsForRequestContext(await (includePlugins ? mergedAgentSkillsService : filesystemAgentSkillsService).getAllAgentSkills(ctx)),
        });
        // Always-apply skills reach a turn as cursor rules, which the executor
        // memoizes for the process lifetime because the daemon runs no file
        // watcher. The skill catalog changes without a file edit when an Agent
        // Store root is reloaded — the mount latch below and `reloadAgentSkills`
        // both do that — so subscribe to the catalog itself rather than to either
        // trigger. `_loaded` is already swapped when this fires, so the recompute
        // reads the new catalog. Plugin rules are memoized the same way and have
        // their own reload (`reloadPlugins`), so they get their own subscription
        // rather than relying on the merged service's fan-out order. Each service
        // notifies directly and synchronously; the merged rules service coalesces
        // by a second, which a turn inside that second would notice.
        const invalidate = () => executor.invalidateGlobalCache();
        agentSkillsService.onDidChangeRules(invalidate);
        pluginSkillsService.onDidChangeRules(invalidate);
        return executor;
    };
    const baseRequestContextExecutor = readOnlyBareMode
        ? createReadOnlyVmDaemonBareRequestContextExecutor({
            workspacePath,
            bareRepoPath: readOnlyBareRepoPath,
            mcpStateAccessor: sharedMcpStateAccessor,
            stripAgentSkillContent,
            filterModelDisabledSkills,
            options: {
                projectDir: resolvedProjectDir,
                getSandboxEnabled: () => sandboxEnabled,
                getSandboxSupported: () => sandboxEnabled,
                getMcpFileSystemOptions: mcpFileSystemWriter
                    ? async (ctx, options) => mcpFileSystemWriter.getMcpFileSystemOptions(ctx, options)
                    : undefined,
                mcpMetaToolEnabled: isMcpMetaToolEnabled,
                mcpMetaToolSlimDescriptors: isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors,
                mcpInputSchemaJson,
                getArtifactsFolder,
                secretRedactionEnabled: !!lazySecretReader,
                getComputerUseSupported: () => computerUseExecutor !== undefined,
            },
        })
        : disableRequestContextDiskCache
            ? // No disk cache: recompute from the live workspace. The prebuild drops
                // plugins here so the baked cache is plugin-free; a worker keeps them,
                // since its plugins are provisioned live and nothing merges them later.
                buildFullRequestContextExecutor(includePluginsInRequestContext)
            : new request_context_disk_cache/* DiskBackedRequestContextExecutor */.vs({
                createFullExecutor: () => buildFullRequestContextExecutor(true),
                read: (ctx) => (0,request_context_disk_cache/* readRequestContextDiskCache */.gc)(ctx, request_context_disk_cache/* REQUEST_CONTEXT_DISK_CACHE_PATH */.Tk),
                getPluginRules: (ctx) => pluginSkillsService.getAllCursorRules(ctx),
                getPluginAgentSkills: (ctx) => pluginSkillsService.getAllAgentSkills(ctx),
                getPluginSubagents: () => pluginSubagentsService.getAllSubagents(),
                dedupeRules: removeDuplicatedAgentSkillRules,
                updateBaked: async (ctx, requestContext) => {
                    // Snapshot bakes can predate strip/filter flags; re-apply so fat
                    // skill catalogs never cross the exec RPC on a disk-cache hit.
                    requestContext.agentSkills = projectAgentSkillsForRequestContext(requestContext.agentSkills);
                    const mcpState = await sharedMcpStateAccessor.getState(ctx);
                    const slimMcp = isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors;
                    const legacyMcp = (0,local_exec_dist/* buildLegacyMcpRequestContextFields */.bXp)(mcpState, {
                        internalBrowserProvidersOnly: slimMcp,
                        inputSchemaJson: mcpInputSchemaJson,
                    });
                    requestContext.tools = legacyMcp.tools;
                    requestContext.mcpInstructions = legacyMcp.mcpInstructions;
                    requestContext.mcpMetaToolOptions = isMcpMetaToolEnabled
                        ? (0,local_exec_dist/* buildMcpMetaToolOptions */.a0x)(mcpState, {
                            slimDescriptors: slimMcp,
                            inputSchemaJson: mcpInputSchemaJson,
                        })
                        : undefined;
                    requestContext.mcpFileSystemOptions =
                        await mcpFileSystemWriter?.getMcpFileSystemOptions(ctx);
                    // The baked env carries the artifacts folder from env-build time.
                    // Re-resolve so a request-scoped folder (private workers) or a
                    // differing runtime data dir never serves a stale baked value.
                    if (requestContext.env !== undefined) {
                        requestContext.env.artifactsFolder = getArtifactsFolder(ctx);
                    }
                },
            });
    // The store mount lands after the daemon's startup scan, so every turn
    // re-checks for it and reloads that root the first time it is there. Wrapping
    // the shared executor rather than the full one covers the disk-cache hit too.
    // Launcher roots only: dynamic roots come and go with their claim, and the
    // launcher reloads the catalog at those boundaries instead of probing here.
    const ensureAgentStoreSkillsDiscovered = createAgentStoreSkillsMountLatch({
        roots: launcherAgentStoreSkillRoots,
        reloadRoots: () => agentSkillsService.reloadSkillRoots(),
        onReloaded: (roots) => {
            execDaemonLogger.info(globalContext, "Agent store skills mount found", {
                roots,
            });
        },
        onUnresponsive: (root) => {
            execDaemonLogger.warn(globalContext, "Agent store skills mount did not respond; giving up on discovering it", { root });
        },
    });
    const sharedRequestContextExecutor = {
        execute: async (ctx, args, options) => {
            await ensureAgentStoreSkillsDiscovered();
            return await baseRequestContextExecutor.execute(ctx, args, options);
        },
    };
    // Create the LocalResourceProvider
    const resourceProviderCtx = (0,otel/* withSpan */.fR)(globalContext.withName("exec_daemon.setup.create_resource_provider"));
    const resourceProviderSpan = (0,otel/* getSpan */.fU)(resourceProviderCtx);
    try {
        const agentStoreConflictDrainer = new local_exec_dist/* AgentStoreConflictJournalDrainer */.tou({
            enabled: agentStoreConflictNoticesEnabled,
            // Boolean CLI snapshot (not a live getter): cloud has no in-pod Statsig.
            // Backend turn-start / turn-end drains refresh via include_quota_notices
            // on AgentStoreConflictArgs so hook carriers flip with the live gate.
            // IDE and private-worker pass live gate readers instead.
            includeQuotaNotices: agentStoreQuotaNoticesEnabled,
        });
        const canvasPreviewArtifactsRoot = surface === "cloud"
            ? await resolveCanvasPreviewPersistArtifactsRoot({
                fallbackArtifactsRoot: resolvedArtifactsDir,
            })
            : undefined;
        const canvasDiagnostics = setupExecDaemonCanvasDiagnostics({
            ctx: resourceProviderCtx,
            workspacePath,
            // Gzip preview persist is cloud-only. Prefer the FUSE self-store
            // artifacts dir so the write does not depend on /opt/cursor/artifacts.
            artifactsRoot: canvasPreviewArtifactsRoot,
            enableStoreCanvasPersist: surface === "cloud",
        });
        // The Read and MCP executors below resize images in this process, so the
        // WebP codec must be registered before the first oversized .webp arrives.
        registerExecDaemonWebpCodec(resourceProviderCtx);
        const baseResources = new local_exec_dist/* LocalResourceProvider */.DvK({
            pendingDecisionStore: decisionProvider,
            fileChangeTracker,
            gitExecutor,
            ignoreService,
            grepProvider,
            permissionsService,
            workspacePaths,
            diagnosticsProvider,
            getCanvasDiagnostics: canvasDiagnostics?.getCanvasDiagnostics,
            beginCanvasSave: canvasDiagnostics?.beginCanvasSave,
            mcpLease,
            mcpStateAccessor: sharedMcpStateAccessor,
            ensureMcpServersLoaded,
            cursorRulesService,
            cloudRulesService,
            subagentsService,
            repositoryProvider: codebaseReferenceProvider,
            projectDir: resolvedProjectDir,
            sharedRequestContextExecutor,
            shellManager: undefined,
            _sandboxPolicyResolver: undefined,
            _defaultSandboxPolicy: defaultSandboxPolicy,
            mcpFileOutputThresholdBytes: undefined,
            terminalExecutor: execDaemonTerminalExecutor,
            getSandboxEnabled: () => sandboxEnabled,
            getSandboxSupported: () => sandboxEnabled,
            computerUseExecutor: computerUseExecutor !== undefined && desktopLeaseStore !== undefined
                ? (0,local_exec_dist/* gateComputerUseExecutor */.f8t)(desktopLeaseStore, computerUseExecutor)
                : computerUseExecutor,
            enableRecordScreen: isRecordScreenEnabled,
            recordScreenArtifactsDir: options.recordScreenArtifactsDir ?? resolvedArtifactsDir,
            recordScreenDisplay: (0,local_exec_dist/* getDisplay */.pvL)(options.recordScreenDisplay),
            polishedRecordingRenderer,
            getArtifactsFolder,
            secretRedactionEnabled: !!lazySecretReader,
            registerRedactedReadExecutor: !!lazySecretReader,
            shellCoreWrapper: lazySecretReader && scopedSecretStore
                ? (executor) => new secrets_exec_dist/* RedactingShellCoreExecutor */.sR(new ScopedSecretsShellCoreExecutor(executor, scopedSecretStore), lazySecretReader)
                : undefined,
            shellExtraEnvProvider: options.shellExtraEnvProvider,
            getMountedAgentStores: options.getMountedAgentStores,
            // Provide MCP file system options for agent discovery (when enabled)
            getMcpFileSystemOptions: mcpFileSystemWriter
                ? async (ctx, options) => mcpFileSystemWriter.getMcpFileSystemOptions(ctx, options)
                : undefined,
            mcpMetaToolEnabled: isMcpMetaToolEnabled,
            mcpMetaToolSlimDescriptors: isMcpMetaToolEnabled && isMcpMetaToolSlimDescriptors,
            mcpInputSchemaJson,
            getAgentSkills: async (ctx) => projectAgentSkillsForRequestContext(await mergedAgentSkillsService.getAllAgentSkills(ctx)),
            agentStoreConflictDrainer,
        });
        execDaemonLogger.info(resourceProviderCtx, "resource provider loaded", {
            hooksConfig,
        });
        // Wire up InputEventLogger between screen recorder and computer-use executor
        if (isRecordScreenEnabled && isComputerUseEnabled && computerUseExecutor) {
            const activeComputerUseExecutor = computerUseExecutor;
            const recordScreenExecutor = baseResources.getRecordScreenExecutor();
            if (recordScreenExecutor &&
                computerUseExecutorHasInputEventLogger(activeComputerUseExecutor)) {
                // When recording starts, connect the InputEventLogger to the X11Executor
                recordScreenExecutor.setOnRecordingStarted((logger) => {
                    execDaemonLogger.info(resourceProviderCtx, "Recording started, connecting InputEventLogger to X11Executor");
                    activeComputerUseExecutor.setInputEventLogger(logger);
                });
                // When recording stops, disconnect the logger
                recordScreenExecutor.setOnRecordingStopped(() => {
                    execDaemonLogger.info(resourceProviderCtx, "Recording stopped, disconnecting InputEventLogger from X11Executor");
                    activeComputerUseExecutor.setInputEventLogger(undefined);
                });
                execDaemonLogger.info(resourceProviderCtx, "InputEventLogger wiring configured for polished recordings");
            }
        }
        // Always create hook executor and wrap with ListableHooksResourceAccessor to ensure
        // the hook executor resource is registered. This prevents the chat from hanging
        // when the backend sends hook execution requests. The executor will no-op if no
        // hooks are configured for a given step.
        const globalHookContext = resolveExecDaemonGlobalHookContext({
            cursorVersion: "1.0.0",
            userEmail: options.userEmail,
        });
        const hookExecutor = new CliHooksExecutor(hooksConfig, hooksProjectPath, globalHookContext, hooksTerminalExecutor, options.promptHookClient, undefined, undefined, {
            enableClaudeNestedHookSpecificOutputCompatibility: options.enableClaudeNestedHookSpecificOutputCompatibility,
            commandHookPayloadTransport: options.commandHookPayloadTransport,
            runtimeHooks: options.runtimeHooks,
        });
        execDaemonLogger.info(resourceProviderCtx, "Exec-daemon loaded hook executor", {
            hasUserHooks: !!hooksConfig.userHooks,
            hasProjectHooks: !!hooksConfig.projectHooks,
        });
        const oomKillResources = withShellOomKillReporting(baseResources);
        const redactedResources = lazySecretReader
            ? new secrets_exec_dist/* RedactingResourceAccessor */.DA(oomKillResources, lazySecretReader, new Set([
                dist/* grepExecutorResource */.u8v.symbol,
                dist/* redactedReadExecutorResource */.Mfc.symbol,
                dist/* mcpExecutorResource */.Yib.symbol,
                dist/* readMcpResourceExecutorResource */.mlu.symbol,
            ]))
            : oomKillResources;
        const orbitReportingResources = options.orbitOperationReporter === undefined
            ? redactedResources
            : withOrbitOperationReporting(redactedResources, options.orbitOperationReporter);
        const resources = new local_exec_dist/* AgentStoreConflictDrainAccessor */.yJf(new ListableHooksResourceAccessor(orbitReportingResources, hookExecutor, (ctx) => ({
            conversation_id: ctx.get(dist/* execHookConversationIdKey */.WWy) ?? "",
            generation_id: ctx.get(dist/* execHookGenerationIdKey */.JT2) ?? "",
            model: ctx.get(dist/* execHookModelKey */.dBo) ?? "unknown",
        }), mcpLease, undefined, undefined, hooksConfigLease), agentStoreConflictDrainer);
        execDaemonLogger.info(resourceProviderCtx, "Exec-daemon loaded resources", {
            resourceCount: [...resources.entries()].length,
        });
        return {
            resources,
            gitService,
            remoteAccessService,
            requestContextExecutor: sharedRequestContextExecutor,
            ptyManager,
            artifactUploadManagerProvider,
            hookExecutor,
            mcpFileSystemWriter,
            secretRedactionState,
            scopedSecretStore,
            reloadAgentSkills: async (ctx) => {
                try {
                    const reloadedHooksConfig = await loadHooksConfig();
                    hooksConfigLease.setConfig(reloadedHooksConfig);
                    hookExecutor.updateConfig(reloadedHooksConfig);
                    execDaemonLogger.info(ctx, "Reloaded hook configuration summary", {
                        ...summarizeHooksConfigForLogging(reloadedHooksConfig),
                    });
                }
                catch (error) {
                    execDaemonLogger.warn(ctx, "Failed to reload hook configuration; keeping previous hooks config", {
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
                mergedAgentSkillsService.reload(ctx);
                await canvasDiagnostics?.remirrorSkillSdk();
            },
            // `reloadSkillRoots` re-reads the provider and reconciles the settled
            // snapshot against it, so a departed root is dropped without being named.
            reloadAgentStoreSkills: () => agentSkillsService.reloadSkillRoots(),
            reloadPlugins: async (ctx) => {
                await pluginsService.reload();
                mergedAgentSkillsService.reload(ctx);
                await subagentsService.reload();
            },
            getComputerUseSupported: () => computerUseExecutor !== undefined,
            desktopLeaseStore,
            loadSessionMcpServers,
            closeMcpClients: () => mcpManager.closeAllClients(),
        };
    }
    catch (error) {
        resourceProviderSpan?.recordException(error instanceof Error ? error : new Error(String(error)));
        execDaemonLogger.error(resourceProviderCtx, "error creating resource provider", {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
    finally {
        resourceProviderSpan?.end();
    }
}


/***/ },

};
