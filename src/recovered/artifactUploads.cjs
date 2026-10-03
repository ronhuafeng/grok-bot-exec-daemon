module.exports = {
/***/ "./src/artifactUploads.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PM: () => (/* binding */ isAgentStoreFuseBackedPath),
/* harmony export */   VO: () => (/* binding */ resolveArtifactsRootPath),
/* harmony export */   cB: () => (/* binding */ ArtifactUploadManagerProvider),
/* harmony export */   fE: () => (/* binding */ ARTIFACT_MTIME_TOLERANCE_MS)
/* harmony export */ });
/* unused harmony exports DEFAULT_ARTIFACTS_ROOT, DEFAULT_AGENT_STORE_ARTIFACTS_PATH, DEFAULT_PARENT_AGENT_STORE_ARTIFACTS_PATH, classifyArtifactRootKind, ArtifactUploadManager, createConstantArtifactUploadManagerProvider */
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("node:crypto");
/* harmony import */ var node_crypto__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_crypto__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("node:fs");
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(node_fs__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("node:fs/promises");
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(node_fs_promises__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("node:os");
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(node_os__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("node:path");
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var node_stream__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("node:stream");
/* harmony import */ var node_stream__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(node_stream__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var node_stream_promises__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("node:stream/promises");
/* harmony import */ var node_stream_promises__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(node_stream_promises__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("../agent-core/dist/cloud-agent-artifact-paths.js");
/* harmony import */ var _anysphere_context__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("../context/dist/logger.js");
/* harmony import */ var _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("../proto/dist/generated/agent/v1/control_service_pb.js");
/* harmony import */ var _anysphere_utils__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("../utils/dist/path-utils.js");
/* harmony import */ var _anysphere_utils__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__("../utils/dist/promise-extras.js");











const logger = (0,_anysphere_context__WEBPACK_IMPORTED_MODULE_8__/* .createLogger */ .h)("exec-daemon-artifacts");
const DEFAULT_ARTIFACTS_ROOT = "/opt/cursor/artifacts";
function resolveArtifactsRootPath(dataDir) {
    return dataDir ? node_path__WEBPACK_IMPORTED_MODULE_4___default().join(dataDir, "artifacts") : DEFAULT_ARTIFACTS_ROOT;
}
const DEFAULT_AGENT_STORE_ARTIFACTS_PATH = "/cursor/stores/self/artifacts";
const DEFAULT_PARENT_AGENT_STORE_ARTIFACTS_PATH = "/cursor/stores/parent/artifacts";
const AGENT_STORE_FILESYSTEM_TYPE = "fuse.agent-store";
const PROC_SELF_MOUNTINFO_PATH = "/proc/self/mountinfo";
// State file is for debugging only - exec-daemon starts fresh each time and
// immediately overwrites any existing state file.
const ARTIFACT_STATE_SUBDIR = ".cursor";
const ARTIFACT_STATE_FILENAME = "exec-daemon-artifacts.json";
const ARTIFACT_RESTORE_DOWNLOAD_TIMEOUT_MS = 60_000;
const ARTIFACT_MTIME_TOLERANCE_MS = 1;
function isMissingPathError(error) {
    const code = error.code;
    return code === "ENOENT" || code === "ENOTDIR";
}
function decodeMountInfoPath(encodedPath) {
    const mountInfoEscapes = {
        "011": "\t",
        "012": "\n",
        "040": " ",
        "134": "\\",
    };
    return encodedPath.replace(/\\(011|012|040|134)/g, (match, encodedCharacter) => mountInfoEscapes[encodedCharacter] ?? match);
}
function isPathBackedByAgentStoreMount(targetPath, mountInfo) {
    const resolvedTargetPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(targetPath);
    let closestMountPathLength = -1;
    let closestFilesystemType;
    for (const line of mountInfo.split("\n")) {
        const fields = line.trim().split(/\s+/);
        const separatorIndex = fields.indexOf("-");
        const encodedMountPath = fields[4];
        const filesystemType = fields[separatorIndex + 1];
        if (separatorIndex < 0 || encodedMountPath === undefined || filesystemType === undefined) {
            continue;
        }
        const mountPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(decodeMountInfoPath(encodedMountPath));
        if ((0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_10__/* .isPathWithin */ .ZU)({ basePath: mountPath, targetPath: resolvedTargetPath }) &&
            mountPath.length > closestMountPathLength) {
            closestMountPathLength = mountPath.length;
            closestFilesystemType = filesystemType;
        }
    }
    return closestFilesystemType === AGENT_STORE_FILESYSTEM_TYPE;
}
/** True when `targetPath` is on a `fuse.agent-store` mount. Fail closed. */
async function isAgentStoreFuseBackedPath(targetPath, options = {}) {
    const readMountInfo = options.readMountInfo ?? (() => node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().readFile(PROC_SELF_MOUNTINFO_PATH, "utf8"));
    try {
        const mountInfo = await readMountInfo();
        return isPathBackedByAgentStoreMount(targetPath, mountInfo);
    }
    catch {
        return false;
    }
}
async function validateArtifactRootPath(options) {
    const { artifactsRootPath, expectedAgentStoreArtifactsPath, readMountInfo } = options;
    let rootLstat;
    try {
        rootLstat = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().lstat(artifactsRootPath);
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            return "missing";
        }
        throw error;
    }
    if (!rootLstat.isSymbolicLink()) {
        if (!rootLstat.isDirectory()) {
            throw new Error("Artifact root is not a directory");
        }
        return "local";
    }
    let mountInfo;
    try {
        mountInfo = await readMountInfo();
    }
    catch {
        throw new Error("Artifact root agent-store mount could not be verified");
    }
    if (!isPathBackedByAgentStoreMount(expectedAgentStoreArtifactsPath, mountInfo)) {
        throw new Error("Artifact root target is not backed by a fuse.agent-store mount");
    }
    let expectedTargetStat;
    try {
        expectedTargetStat = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().stat(expectedAgentStoreArtifactsPath);
    }
    catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") {
            throw new Error("Artifact root symlink is dangling");
        }
        throw error;
    }
    if (!expectedTargetStat.isDirectory()) {
        throw new Error("Artifact root target is not a directory");
    }
    // Read after mount and target validation so the link is checked immediately
    // before any state or subdirectory creation.
    const linkTarget = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().readlink(artifactsRootPath);
    if (node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(node_path__WEBPACK_IMPORTED_MODULE_4___default().dirname(artifactsRootPath), linkTarget) !== expectedAgentStoreArtifactsPath) {
        throw new Error("Artifact root symlink does not target the expected agent-store artifacts directory");
    }
    return "agent_store_backed";
}
/**
 * Classify an artifact root as Agent Store backed only when it is the exact
 * expected alias on a verified fuse.agent-store mount. Detection failures are
 * deliberately local fallbacks; artifact operations perform strict validation.
 */
async function classifyArtifactRootKind(artifactsRootPath, validationOptions = {}) {
    const expectedAgentStoreArtifactsPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(validationOptions.expectedAgentStoreArtifactsPath ?? DEFAULT_AGENT_STORE_ARTIFACTS_PATH);
    const readMountInfo = validationOptions.readMountInfo ?? (() => node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().readFile(PROC_SELF_MOUNTINFO_PATH, "utf8"));
    try {
        const rootKind = await validateArtifactRootPath({
            artifactsRootPath: node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(artifactsRootPath),
            expectedAgentStoreArtifactsPath,
            readMountInfo,
        });
        return rootKind === "agent_store_backed" ? "agent_store_backed" : "local";
    }
    catch {
        return "local";
    }
}
class ArtifactUploadManager {
    artifactsDir;
    rootKind;
    parentStore;
    stateFilePath;
    stagingDir;
    expectedAgentStoreArtifactsPath;
    readMountInfo;
    stateLoaded = false;
    state = {};
    inFlightUploads = new Map();
    isPersistingState = false;
    pendingPersistPayload = null;
    /**
     * Per-path mutex that serializes the cancel → stat → start critical section
     * in uploadArtifacts. Without this, multiple concurrent callers for the same
     * path can all pass the cancel loop and start parallel uploads.
     */
    pathMutexes = new Map();
    constructor(ctx, options = {}) {
        const artifactsRootPath = options.artifactsRootPath ?? DEFAULT_ARTIFACTS_ROOT;
        const validationOptions = options.validationOptions ?? {};
        logger.info(ctx, "Artifacts: setting up artifact upload manager", {
            artifactsRootPath,
            rootKind: options.rootKind ?? "local",
            parentStoreArtifactsPath: options.parentStore?.artifactsPath,
        });
        this.artifactsDir = node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(artifactsRootPath);
        this.rootKind = options.rootKind ?? "local";
        this.parentStore =
            options.parentStore === undefined
                ? undefined
                : {
                    artifactsPath: node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(options.parentStore.artifactsPath),
                    requireFuseMount: options.parentStore.requireFuseMount,
                };
        if (this.rootKind === "agent_store_backed") {
            this.stateFilePath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join((0,node_os__WEBPACK_IMPORTED_MODULE_3__.tmpdir)(), `cursor-exec-daemon-artifacts-${(0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomUUID)()}.json`);
            this.stagingDir = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.artifactsDir, _anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .AGENT_STORE_INTERNAL_ROOT_DIRECTORY */ .XJ, "staging");
        }
        else {
            this.stagingDir = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.artifactsDir, ARTIFACT_STATE_SUBDIR);
            this.stateFilePath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.stagingDir, ARTIFACT_STATE_FILENAME);
        }
        this.expectedAgentStoreArtifactsPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(validationOptions.expectedAgentStoreArtifactsPath ?? DEFAULT_AGENT_STORE_ARTIFACTS_PATH);
        this.readMountInfo =
            validationOptions.readMountInfo ?? (() => node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().readFile(PROC_SELF_MOUNTINFO_PATH, "utf8"));
    }
    /**
     * Identity used for upload state, the per-path mutex, and the in-flight
     * map. Key on the durable store path so an out-of-root artifact and the
     * flattened copy that `listArtifacts` reports back resolve to the same
     * entry. Paths the store cannot represent keep their own identity.
     */
    artifactIdentity(absolutePath) {
        const storeRelativePath = (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .toAgentStoreArtifactPath */ .rK)({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        })?.storeRelativePath;
        if (storeRelativePath !== undefined) {
            return storeRelativePath;
        }
        return this.sanitizeAbsolutePath(absolutePath) ?? absolutePath;
    }
    getState(absolutePath) {
        return this.state[this.artifactIdentity(absolutePath)];
    }
    /**
     * Portable name for an artifact under this root, or undefined when the root
     * cannot move and its absolute paths are already stable.
     */
    getArtifactRelativePath(absolutePath) {
        if (this.rootKind !== "agent_store_backed" ||
            this.artifactsDir === node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(DEFAULT_ARTIFACTS_ROOT)) {
            return undefined;
        }
        const sanitizedPath = this.sanitizeAbsolutePath(absolutePath);
        return sanitizedPath === undefined
            ? undefined
            : (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .toArtifactRelativePath */ .vR)({
                absolutePath: sanitizedPath,
                artifactsRootPath: this.artifactsDir,
            });
    }
    async listArtifacts(ctx) {
        logger.info(ctx, "Artifacts: Listing artifacts");
        const files = await this.readArtifactsFromDisk(ctx);
        return files.map((file) => {
            const identity = this.artifactIdentity(file.absolutePath);
            const persisted = this.state[identity];
            let effectiveStatus = persisted?.status ?? _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.NOT_STARTED;
            // Detect mutable artifacts: if the file has been modified since it was
            // last uploaded or since the current upload started (different mtime or
            // size), reset status so it gets re-uploaded. This covers both COMPLETED
            // (file changed after upload) and IN_PROGRESS (file changed during upload)
            // so we don't wait for a stale upload to finish before re-uploading.
            if ((effectiveStatus === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.COMPLETED ||
                effectiveStatus === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.IN_PROGRESS) &&
                persisted !== undefined &&
                this.hasFileChangedSinceUpload(persisted, file)) {
                logger.info(ctx, "Artifacts: File changed since last upload, marking for re-upload", {
                    absolutePath: file.absolutePath,
                    currentMtimeMs: file.updatedAtUnixMs,
                    currentSizeBytes: file.sizeBytes,
                    uploadedMtimeMs: persisted.uploadedFileMtimeMs,
                    uploadedSizeBytes: persisted.uploadedFileSizeBytes,
                    previousStatus: effectiveStatus,
                });
                effectiveStatus = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.NOT_STARTED;
            }
            // When status is reset to NOT_STARTED due to file change, report
            // bytesUploaded as 0 to keep metadata internally consistent.
            const needsReupload = effectiveStatus === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.NOT_STARTED &&
                (persisted?.status === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.COMPLETED ||
                    persisted?.status === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.IN_PROGRESS);
            return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadMetadata */ .b0({
                absolutePath: file.absolutePath,
                artifactRelativePath: file.artifactRelativePath,
                sizeBytes: BigInt(file.sizeBytes),
                updatedAtUnixMs: BigInt(file.updatedAtUnixMs),
                status: effectiveStatus,
                bytesUploaded: BigInt(needsReupload ? 0 : (persisted?.bytesUploaded ?? 0)),
                lastError: persisted?.lastError ?? "",
                uploadAttempts: persisted?.uploadAttempts ?? 0,
                lastStartedAtUnixMs: BigInt(persisted?.lastStartedAtUnixMs ?? 0),
                lastFinishedAtUnixMs: BigInt(persisted?.lastFinishedAtUnixMs ?? 0),
                uploadId: persisted?.uploadId ?? "",
            });
        });
    }
    /**
     * Persists an out-of-root artifact in Agent Store. Upload instructions keep
     * citing the source path while durable listings use its under-root identity.
     *
     * Returns true only when it writes or refreshes the durable copy.
     */
    async persistExtraPathToAgentStore(ctx, rawAbsolutePath) {
        if (this.rootKind !== "agent_store_backed") {
            return false;
        }
        const absolutePath = this.sanitizeAbsolutePath(rawAbsolutePath);
        if (absolutePath === undefined) {
            throw new Error("Invalid artifact path");
        }
        const encoded = (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .toAgentStoreArtifactPath */ .rK)({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            throw new Error("Artifact path is invalid or reserved");
        }
        if (encoded.kind === "artifact") {
            return false;
        }
        const destinationPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.artifactsDir, encoded.artifactRootRelativePath);
        const tempPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.stagingDir, `extra-path-${(0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomUUID)()}.tmp`);
        const writeMode = (await this.isSelfArtifactsRootFuseBacked())
            ? "directWrite"
            : "stageAndRename";
        const wrote = await this.withPathMutex(encoded.absolutePath, () => this.copyToDurableDestination({
            sourcePath: encoded.absolutePath,
            destinationPath,
            tempPath,
            writeMode,
            ensureDirectory: (dir) => this.ensureArtifactDirectory(dir),
            beforeStaging: () => this.cancelInFlightUpload(ctx, {
                absolutePath: encoded.absolutePath,
                reason: "persisting a newer store copy",
            }),
        }));
        if (wrote) {
            logger.info(ctx, "Artifacts: persisted extra path to agent store");
        }
        return wrote;
    }
    /**
     * True when this manager's own artifacts root writes land on a live
     * `fuse.agent-store` mount (pods). Private-worker claim roots report
     * `agent_store_backed` too, but they are plain local sync directories where
     * rename works and staging keeps concurrent readers from seeing partial
     * files — those keep the staged write. Checked per persist, mirroring
     * {@link assertParentStoreMountLive}: mount state can change under a
     * long-lived daemon.
     */
    async isSelfArtifactsRootFuseBacked() {
        if (this.rootKind !== "agent_store_backed") {
            return false;
        }
        try {
            const mountInfo = await this.readMountInfo();
            return isPathBackedByAgentStoreMount(this.expectedAgentStoreArtifactsPath, mountInfo);
        }
        catch {
            return false;
        }
    }
    /**
     * Copy `sourcePath` to `destinationPath` with the safety discipline shared
     * by every durable persist: O_NOFOLLOW open (symlink refusal), an
     * unchanged-size/mtime idempotency short-circuit, and a torn-write re-stat
     * before publishing. Callers hold the path mutex.
     *
     * Publication depends on the target:
     *
     * - `stageAndRename` (plain directories: private-worker peer/claim sync
     *   dirs): bytes land in a hidden staging file next to the destination and
     *   an atomic rename publishes them, so a concurrent reader of the
     *   destination never observes a partial file.
     * - `directWrite` (live `fuse.agent-store` targets): the destination is
     *   written in place. On the FUSE the whole body becomes visible as one
     *   object PUT when the stream closes, so the write is already atomic —
     *   and staging + rename is IMPOSSIBLE there: BCS hides the
     *   `__cursor_internal__` staging namespace from every listing
     *   (`isReservedAgentStoreListingRelPath`), and the FUSE resolves a rename
     *   source through those listings, so the rename of a staged file always
     *   fails with ENOENT while the staged upload leaks as an invisible
     *   object. If the source mutates mid-copy, the fresh (possibly torn)
     *   destination copy is removed best-effort before rejecting, so a
     *   rejected batch does not leave a torn durable copy that store-first
     *   readers would prefer over the legacy upload.
     *
     * Returns true only when it writes or refreshes the durable copy.
     */
    async copyToDurableDestination(args) {
        const source = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().open(args.sourcePath, node_fs__WEBPACK_IMPORTED_MODULE_1__.constants.O_RDONLY | node_fs__WEBPACK_IMPORTED_MODULE_1__.constants.O_NOFOLLOW | node_fs__WEBPACK_IMPORTED_MODULE_1__.constants.O_NONBLOCK)
            .catch((error) => {
            if (error instanceof Error && "code" in error && error.code === "ELOOP") {
                throw new Error("Artifact path is not a regular file");
            }
            throw error;
        });
        const stageAndRename = args.writeMode === "stageAndRename";
        try {
            const sourceStat = await source.stat();
            if (!sourceStat.isFile()) {
                throw new Error("Artifact path is not a regular file");
            }
            const destinationStat = await this.safeLstat(args.destinationPath);
            if (destinationStat?.isFile() &&
                destinationStat.size === sourceStat.size &&
                Math.abs(destinationStat.mtimeMs - sourceStat.mtimeMs) <= ARTIFACT_MTIME_TOLERANCE_MS) {
                return false;
            }
            if (stageAndRename) {
                await args.ensureDirectory(node_path__WEBPACK_IMPORTED_MODULE_4___default().dirname(args.tempPath));
            }
            await args.beforeStaging?.();
            if (!stageAndRename) {
                await args.ensureDirectory(node_path__WEBPACK_IMPORTED_MODULE_4___default().dirname(args.destinationPath));
            }
            const writePath = stageAndRename ? args.tempPath : args.destinationPath;
            try {
                await (0,node_stream_promises__WEBPACK_IMPORTED_MODULE_6__.pipeline)(source.createReadStream({ autoClose: false }), (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.createWriteStream)(writePath, {
                    // Overwrite the destination in direct mode: persists refresh the
                    // durable copy, and store-object mtimes are PUT times, so the
                    // idempotency check above rarely dedupes FUSE targets.
                    flags: stageAndRename ? "wx" : "w",
                    mode: 0o666,
                }));
                const finalSourceStat = await source.stat();
                if (!finalSourceStat.isFile() ||
                    finalSourceStat.size !== sourceStat.size ||
                    finalSourceStat.mtimeMs !== sourceStat.mtimeMs) {
                    throw new Error("Artifact changed while it was being persisted");
                }
                // Source-mtime fidelity where the target honors it (and the
                // idempotency dedupe with it); on a real store mount the object's
                // mtime is the PUT time and this is an accepted no-op.
                await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().utimes(writePath, sourceStat.atime, sourceStat.mtime);
            }
            catch (error) {
                if (!stageAndRename) {
                    // The failed/torn direct write may already be durable (the FUSE
                    // PUTs the buffered body when the stream closes, even on destroy).
                    // The destination path is listing-visible, so unlike the staged
                    // temp it CAN be removed.
                    await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().rm(args.destinationPath, { force: true }).catch(() => { });
                }
                throw error;
            }
            if (stageAndRename) {
                await args.ensureDirectory(node_path__WEBPACK_IMPORTED_MODULE_4___default().dirname(args.destinationPath));
                await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().rename(args.tempPath, args.destinationPath);
            }
            return true;
        }
        finally {
            await source.close();
            if (stageAndRename) {
                await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().rm(args.tempPath, { force: true });
            }
        }
    }
    /**
     * Persists a cited artifact into the PARENT store mount, for subagents
     * whose artifact storage owner is the parent rather than this machine's
     * own store. Unlike {@link persistExtraPathToAgentStore}, in-root files
     * are copied too — see `PersistArtifactsToParentStore` in
     * `control_service.proto`. The destination key reuses the same
     * artifacts-root-relative encoding, so the copy lands exactly where the
     * server-side read resolution computes the cited path. The caller asserts
     * mount liveness first (see {@link persistArtifactsToParentStore}).
     *
     * Returns true only when it writes or refreshes the durable copy.
     */
    async persistExtraPathToParentStore(ctx, rawAbsolutePath) {
        const parentStore = this.parentStore;
        if (parentStore === undefined) {
            throw new Error("Parent store mount is not configured");
        }
        const absolutePath = this.sanitizeAbsolutePath(rawAbsolutePath);
        if (absolutePath === undefined) {
            throw new Error("Invalid artifact path");
        }
        const encoded = (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .toAgentStoreArtifactPath */ .rK)({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            throw new Error("Artifact path is invalid or reserved");
        }
        const destinationPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(parentStore.artifactsPath, encoded.artifactRootRelativePath);
        // Worker peer mounts are plain directories: stage inside the parent
        // mount so the final rename never crosses filesystems, with the reserved
        // internal directory keeping the temp out of listings. Pod FUSE mounts
        // (`requireFuseMount`) write the destination directly instead — see
        // {@link copyToDurableDestination}: the FUSE cannot rename a file BCS
        // hides from listings, so the staged rename always fails ENOENT there.
        const stagingDir = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(parentStore.artifactsPath, _anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .AGENT_STORE_INTERNAL_ROOT_DIRECTORY */ .XJ, "staging");
        const tempPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(stagingDir, `parent-persist-${(0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomUUID)()}.tmp`);
        const wrote = await this.withPathMutex(`parent\0${encoded.absolutePath}`, () => this.copyToDurableDestination({
            sourcePath: encoded.absolutePath,
            destinationPath,
            tempPath,
            writeMode: parentStore.requireFuseMount ? "directWrite" : "stageAndRename",
            ensureDirectory: (dir) => this.ensureParentStoreDirectory(parentStore.artifactsPath, dir),
        }));
        if (wrote) {
            logger.info(ctx, "Artifacts: persisted cited path to parent store");
        }
        return wrote;
    }
    /**
     * Symlink-safe directory creation rooted at the PARENT store's artifacts
     * dir — the parent-target counterpart of {@link ensureArtifactDirectory},
     * whose containment check is deliberately pinned to this machine's own
     * root. The caller asserts mount liveness first; the artifacts dir itself
     * may still be absent because stores do not persist empty directories.
     */
    async ensureParentStoreDirectory(parentArtifactsPath, destinationDir) {
        if (!(0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_10__/* .isPathWithin */ .ZU)({
            basePath: parentArtifactsPath,
            targetPath: destinationDir,
        })) {
            throw new Error("Artifact destination is outside the parent store artifacts root");
        }
        await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().mkdir(parentArtifactsPath, { recursive: true });
        const rootStat = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().lstat(parentArtifactsPath);
        if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
            throw new Error("Parent store artifacts root is not a directory");
        }
        await this.ensureDirectoryWithin({
            basePath: parentArtifactsPath,
            destinationDir,
            messages: {
                containsSymlink: "Artifact destination contains a symbolic link",
                parentNotDirectory: "Artifact destination parent is not a directory",
                resolvesOutside: "Artifact destination resolves outside the parent store artifacts root",
            },
        });
    }
    /**
     * Segment-by-segment directory creation below an already-validated base:
     * refuses symlinks and non-directories on the way down, then re-checks
     * containment on fully resolved paths. Callers validate the base itself
     * first (store-alias validation for this machine's artifacts root, mount
     * liveness plus a plain-directory check for the parent store root).
     */
    async ensureDirectoryWithin(args) {
        const relativePath = node_path__WEBPACK_IMPORTED_MODULE_4___default().relative(args.basePath, args.destinationDir);
        let currentPath = args.basePath;
        for (const part of relativePath.split((node_path__WEBPACK_IMPORTED_MODULE_4___default().sep))) {
            if (part.length === 0 || part === ".") {
                continue;
            }
            currentPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(currentPath, part);
            let currentStat = await this.safeLstat(currentPath);
            if (currentStat === null) {
                try {
                    await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().mkdir(currentPath);
                }
                catch (error) {
                    if (error.code !== "EEXIST") {
                        throw error;
                    }
                }
                currentStat = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().lstat(currentPath);
            }
            if (currentStat.isSymbolicLink()) {
                throw new Error(args.messages.containsSymlink);
            }
            if (!currentStat.isDirectory()) {
                throw new Error(args.messages.parentNotDirectory);
            }
        }
        const rootRealPath = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().realpath(args.basePath);
        const destinationDirRealPath = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().realpath(args.destinationDir);
        if (!(0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_10__/* .isPathWithin */ .ZU)({
            basePath: rootRealPath,
            targetPath: destinationDirRealPath,
        })) {
            throw new Error(args.messages.resolvesOutside);
        }
    }
    /**
     * Parent persistence must never plant files into a plain directory that a
     * dead mount left behind. Pod named mounts are validated as live
     * `fuse.agent-store` mounts; worker peer mounts are local sync directories,
     * so existence is the only meaningful check.
     */
    async assertParentStoreMountLive(parentStore) {
        const filesRoot = node_path__WEBPACK_IMPORTED_MODULE_4___default().dirname(parentStore.artifactsPath);
        const rootStat = await this.safeStat(filesRoot);
        if (rootStat?.isDirectory() !== true) {
            throw new Error("Parent store mount is not available");
        }
        if (parentStore.requireFuseMount) {
            const mountInfo = await this.readMountInfo();
            if (!isPathBackedByAgentStoreMount(parentStore.artifactsPath, mountInfo)) {
                throw new Error("Parent store mount is not agent-store backed");
            }
        }
    }
    /**
     * Check whether a file on disk has changed since it was last uploaded,
     * by comparing (mtimeMs, size) against the snapshot captured at upload start.
     */
    hasFileChangedSinceUpload(persisted, currentFile) {
        // If we don't have the uploaded file stat (pre-existing state from before
        // mutable artifact support), we can't determine if it changed. Treat as
        // unchanged to preserve backward compatibility.
        if (persisted.uploadedFileMtimeMs === undefined ||
            persisted.uploadedFileSizeBytes === undefined) {
            return false;
        }
        return (currentFile.updatedAtUnixMs !== persisted.uploadedFileMtimeMs ||
            currentFile.sizeBytes !== persisted.uploadedFileSizeBytes);
    }
    isSlackOnlyInstruction(instruction) {
        return !instruction.uploadUrl && Boolean(instruction.slackUploadUrl);
    }
    async persistArtifactsToAgentStore(ctx, artifacts) {
        const results = await this.persistArtifactBatch(ctx, artifacts, {
            staticRejection: this.rootKind !== "agent_store_backed"
                ? "Artifacts root is not agent-store backed"
                : undefined,
            persist: (persistCtx, absolutePath) => this.persistExtraPathToAgentStore(persistCtx, absolutePath),
            logPersistFailure: (logCtx, errorMessage) => {
                logger.warn(logCtx, "Artifacts: failed to persist artifact", {
                    error: errorMessage,
                });
            },
        });
        return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactsToAgentStoreResponse */ .sK({ results });
    }
    /**
     * Persists cited files into the machine's mounted PARENT store — the
     * artifact storage owner's store for cross-machine subagents. Unlike
     * {@link persistArtifactsToAgentStore}, this never requires this machine's
     * own artifacts root to be store-backed (the parent mount's liveness is
     * what matters, checked once per batch), and in-root files are copied too:
     * durable in the child's own store is still the wrong store for the
     * storage owner's reads.
     */
    async persistArtifactsToParentStore(ctx, artifacts) {
        const results = await this.persistArtifactBatch(ctx, artifacts, {
            staticRejection: await this.resolveParentStoreRejection(),
            persist: (persistCtx, absolutePath) => this.persistExtraPathToParentStore(persistCtx, absolutePath),
            logPersistFailure: (logCtx, errorMessage) => {
                logger.warn(logCtx, "Artifacts: failed to persist artifact to parent store", {
                    error: errorMessage,
                });
            },
        });
        // A FUSE unmount leaves a plain directory that mkdir and copy write into
        // without error, so a "successful" copy is only trustworthy if the mount
        // outlived it: re-verify liveness and reject the whole batch otherwise
        // (the caller keeps legacy uploads). Checking before the copy instead
        // cannot close this — the mount can die between check and copy — and a
        // false rejection here only costs a redundant legacy upload.
        if (results.some((result) => result.status === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreStatus */ .Cg.PERSISTED)) {
            const postBatchRejection = await this.resolveParentStoreRejection();
            if (postBatchRejection !== undefined) {
                logger.warn(ctx, "Artifacts: parent store mount died during persistence; rejecting batch", {
                    error: postBatchRejection,
                });
                return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactsToParentStoreResponse */ .f({
                    results: results.map((result) => new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreResult */ .pj({
                        absolutePath: result.absolutePath,
                        status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreStatus */ .Cg.REJECTED,
                        message: postBatchRejection,
                    })),
                });
            }
        }
        return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactsToParentStoreResponse */ .f({ results });
    }
    /**
     * Mount liveness is validated once per batch in each direction (each check
     * reads and parses mountinfo, so per-file checks are wasteful without
     * closing the check-to-copy race anyway).
     */
    async resolveParentStoreRejection() {
        const parentStore = this.parentStore;
        if (parentStore === undefined) {
            return "Parent store mount is not configured";
        }
        try {
            await this.assertParentStoreMountLive(parentStore);
            return undefined;
        }
        catch (error) {
            return error instanceof Error ? error.message : String(error);
        }
    }
    async persistArtifactBatch(ctx, artifacts, args) {
        return await (0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_11__/* .asyncMapValues */ .PH)(artifacts, async (artifact) => {
            const absolutePath = this.sanitizeAbsolutePath(artifact.absolutePath) ?? artifact.absolutePath;
            if (artifact.artifactRelativePath !== undefined &&
                this.getArtifactRelativePath(artifact.absolutePath) !== artifact.artifactRelativePath) {
                return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreResult */ .pj({
                    absolutePath,
                    status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreStatus */ .Cg.REJECTED,
                    message: "Artifact relative path does not match its absolute path",
                });
            }
            if (args.staticRejection !== undefined) {
                return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreResult */ .pj({
                    absolutePath,
                    status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreStatus */ .Cg.REJECTED,
                    message: args.staticRejection,
                });
            }
            try {
                await args.persist(ctx, artifact.absolutePath);
                return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreResult */ .pj({
                    absolutePath,
                    status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreStatus */ .Cg.PERSISTED,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                args.logPersistFailure(ctx, message);
                return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreResult */ .pj({
                    absolutePath,
                    status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .PersistArtifactToAgentStoreStatus */ .Cg.REJECTED,
                    message,
                });
            }
        }, { max: 4 });
    }
    async uploadArtifacts(ctx, uploads, waitForCompletion) {
        const s3Uploads = [];
        const slackOnlyUploads = [];
        const noOpResults = [];
        for (const u of uploads) {
            if (u.artifactRelativePath !== undefined &&
                this.getArtifactRelativePath(u.absolutePath) !== u.artifactRelativePath) {
                noOpResults.push(new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchResult */ .TT({
                    absolutePath: this.sanitizeAbsolutePath(u.absolutePath) ?? u.absolutePath,
                    status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED,
                    message: "Artifact relative path does not match its absolute path",
                    slackFileId: u.slackFileId,
                }));
                continue;
            }
            if (this.isSlackOnlyInstruction(u)) {
                slackOnlyUploads.push(u);
            }
            else if (u.uploadUrl) {
                s3Uploads.push(u);
            }
            else {
                const absolutePath = this.sanitizeAbsolutePath(u.absolutePath) ?? u.absolutePath;
                noOpResults.push(new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchResult */ .TT({
                    absolutePath,
                    status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED,
                    message: "No upload URL or Slack upload URL provided",
                    slackFileId: u.slackFileId,
                }));
            }
        }
        logger.info(ctx, "Artifacts: starting artifact uploads", {
            s3Count: s3Uploads.length,
            slackOnlyCount: slackOnlyUploads.length,
            waitForCompletion: waitForCompletion ?? false,
        });
        // Listing is read-only. Persist an extra path to the durable store only
        // after the backend authorizes its upload with an S3 or Slack URL.
        const authorizedPaths = [
            ...new Set([...s3Uploads, ...slackOnlyUploads].map((upload) => upload.absolutePath)),
        ];
        const blockedUploadIdentities = new Set();
        await (0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_11__/* .asyncMapValues */ .PH)(authorizedPaths, async (absolutePath) => {
            try {
                await this.persistExtraPathToAgentStore(ctx, absolutePath);
            }
            catch (error) {
                const sanitizedPath = this.sanitizeAbsolutePath(absolutePath) ?? absolutePath;
                try {
                    const durableCopyPath = this.getArtifactRootDestinationPath(sanitizedPath);
                    const [sourceStat, durableCopy] = await Promise.all([
                        this.safeLstat(sanitizedPath),
                        durableCopyPath === undefined
                            ? Promise.resolve(null)
                            : this.safeLstat(durableCopyPath),
                    ]);
                    if (durableCopy?.isFile() === true && sourceStat !== null) {
                        blockedUploadIdentities.add(this.artifactIdentity(sanitizedPath));
                        logger.warn(ctx, "Artifacts: extra-path persistence failed; keeping the existing store copy", {
                            error: error instanceof Error ? error.message : String(error),
                        });
                        return;
                    }
                    logger.warn(ctx, "Artifacts: extra-path persistence failed; uploading from the source path", {
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
                catch (statError) {
                    blockedUploadIdentities.add(this.artifactIdentity(sanitizedPath));
                    logger.warn(ctx, "Artifacts: extra-path persistence failed; skipping upload after a status check error", {
                        error: error instanceof Error ? error.message : String(error),
                        statError: statError instanceof Error ? statError.message : String(statError),
                    });
                }
            }
        }, { max: 4 });
        const blockedResults = [];
        const rejectBlockedUploads = (uploads) => {
            const kept = [];
            for (const upload of uploads) {
                const sanitizedPath = this.sanitizeAbsolutePath(upload.absolutePath) ?? upload.absolutePath;
                if (blockedUploadIdentities.has(this.artifactIdentity(sanitizedPath))) {
                    blockedResults.push(new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchResult */ .TT({
                        absolutePath: sanitizedPath,
                        status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED,
                        message: "Failed to persist the durable artifact copy",
                        slackFileId: upload.slackFileId,
                    }));
                    continue;
                }
                kept.push(upload);
            }
            return kept;
        };
        const [s3Results, slackOnlyResults] = await Promise.all([
            this.processS3Uploads(ctx, rejectBlockedUploads(s3Uploads), waitForCompletion),
            this.processSlackOnlyUploads(ctx, rejectBlockedUploads(slackOnlyUploads)),
        ]);
        const results = [...s3Results, ...slackOnlyResults, ...noOpResults, ...blockedResults];
        // Coalesce and log all errors together
        const errors = results.filter((r) => r.status === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED);
        if (errors.length > 0) {
            logger.error(ctx, `Artifacts: Failed to dispatch ${errors.length} artifact upload(s)`, new Error(`Multiple upload dispatch failures: ${errors
                .map((e) => `${e.absolutePath}: ${e.message}`)
                .join("; ")}`), {
                errors: errors.map((e) => ({
                    absolutePath: e.absolutePath,
                    message: e.message,
                })),
            });
        }
        logger.info(ctx, "Artifacts: finished uploading artifacts", { results });
        return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .UploadArtifactsResponse */ .Ce({ results });
    }
    async restoreArtifacts(ctx, artifacts) {
        const results = await (0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_11__/* .asyncMapValues */ .PH)(artifacts, async (artifact) => this.restoreArtifact(ctx, artifact), { max: 4 });
        return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactsResponse */ .pt({ results });
    }
    async restoreArtifact(ctx, artifact) {
        const absolutePath = this.sanitizeAbsolutePath(artifact.absolutePath);
        if (absolutePath === undefined) {
            return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.REJECTED,
                errorMessage: "Invalid artifact path",
            });
        }
        // A relative path is what lets a reclaimed agent restore under its own
        // root; the producer's absolute path points at a root it no longer has.
        const destinationPath = artifact.artifactRelativePath !== undefined
            ? this.getRelativeDestinationPath(artifact.artifactRelativePath)
            : this.getArtifactRootDestinationPath(absolutePath);
        if (destinationPath === undefined) {
            return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.REJECTED,
                errorMessage: "Artifact path is outside the artifact root",
            });
        }
        if (artifact.downloadUrl.trim().length === 0) {
            return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.REJECTED,
                errorMessage: "Missing artifact download URL",
            });
        }
        const existing = await this.safeLstat(destinationPath);
        if (existing !== null) {
            if (existing.isFile()) {
                return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                    status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.SKIPPED_ALREADY_EXISTS,
                });
            }
            return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.REJECTED,
                errorMessage: "Artifact path exists and is not a file",
            });
        }
        const destinationDir = node_path__WEBPACK_IMPORTED_MODULE_4___default().dirname(destinationPath);
        const tempPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.stagingDir, `artifact-restore-${(0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomUUID)()}.tmp`);
        try {
            await this.ensureArtifactDirectory(this.stagingDir);
            await this.downloadArtifactToFile(ctx, artifact.downloadUrl, tempPath);
            await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().chmod(tempPath, 0o666);
            await this.ensureArtifactDirectory(destinationDir);
            try {
                await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().copyFile(tempPath, destinationPath, node_fs__WEBPACK_IMPORTED_MODULE_1__.constants.COPYFILE_EXCL);
            }
            catch (copyError) {
                if (copyError instanceof Error &&
                    "code" in copyError &&
                    copyError.code === "EEXIST") {
                    await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().rm(tempPath, { force: true }).catch(() => { });
                    return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                        status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.SKIPPED_ALREADY_EXISTS,
                    });
                }
                throw copyError;
            }
            await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().rm(tempPath, { force: true }).catch(() => { });
            const requestedMtimeMs = Number(artifact.updatedAtUnixMs);
            if (Number.isFinite(requestedMtimeMs) && requestedMtimeMs > 0) {
                const mtime = new Date(requestedMtimeMs);
                await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().utimes(destinationPath, mtime, mtime);
            }
            const stat = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().stat(destinationPath);
            await this.updateState(ctx, destinationPath, {
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.COMPLETED,
                bytesUploaded: stat.size,
                uploadAttempts: 1,
                lastError: "",
                lastStartedAtUnixMs: Date.now(),
                lastFinishedAtUnixMs: Date.now(),
                uploadId: `restored-${(0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomUUID)()}`,
                uploadedFileMtimeMs: Math.trunc(stat.mtimeMs),
                uploadedFileSizeBytes: stat.size,
            });
            return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.RESTORED,
            });
        }
        catch (error) {
            await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().rm(tempPath, { force: true }).catch(() => { });
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(ctx, "Artifacts: failed to restore artifact", {
                absolutePath,
                message,
            });
            return new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .RestoreArtifactResult */ .QW({
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactRestoreStatus */ .zb.REJECTED,
                errorMessage: message,
            });
        }
    }
    getRelativeDestinationPath(relativePath) {
        if ((0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .fromArtifactRelativePath */ .kp)({
            relativePath,
            artifactsRootPath: this.artifactsDir,
        }) === undefined) {
            return undefined;
        }
        // The codec validates portable syntax. Build the filesystem path from the
        // native root so Windows casing and separators continue to match it.
        return node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.artifactsDir, relativePath);
    }
    getArtifactRootDestinationPath(absolutePath) {
        const encoded = (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .toAgentStoreArtifactPath */ .rK)({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            return undefined;
        }
        return node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.artifactsDir, encoded.artifactRootRelativePath);
    }
    async ensureArtifactDirectory(destinationDir) {
        if (!(0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_10__/* .isPathWithin */ .ZU)({
            basePath: this.artifactsDir,
            targetPath: destinationDir,
        })) {
            throw new Error("Artifact destination is outside the artifact root");
        }
        const rootExists = await this.validateArtifactRoot();
        if (!rootExists) {
            await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().mkdir(this.artifactsDir, { recursive: true });
            const createdRootStat = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().lstat(this.artifactsDir);
            if (createdRootStat.isSymbolicLink() || !createdRootStat.isDirectory()) {
                throw new Error("Artifact root is not a local directory");
            }
        }
        await this.ensureDirectoryWithin({
            basePath: this.artifactsDir,
            destinationDir,
            messages: {
                containsSymlink: "Artifact restore destination contains a symbolic link",
                parentNotDirectory: "Artifact restore destination parent is not a directory",
                resolvesOutside: "Artifact restore destination resolves outside the artifact root",
            },
        });
    }
    /**
     * Validate an existing artifact root without creating through it.
     *
     * A local directory is always allowed. A root symlink is allowed only when
     * its direct destination is the configured agent-store artifacts path and
     * that path's closest mount is fuse.agent-store.
     */
    async validateArtifactRoot() {
        return ((await validateArtifactRootPath({
            artifactsRootPath: this.artifactsDir,
            expectedAgentStoreArtifactsPath: this.expectedAgentStoreArtifactsPath,
            readMountInfo: this.readMountInfo,
        })) !== "missing");
    }
    async downloadArtifactToFile(ctx, downloadUrl, destinationPath) {
        const response = await fetch(downloadUrl, {
            signal: AbortSignal.timeout(ARTIFACT_RESTORE_DOWNLOAD_TIMEOUT_MS),
        });
        if (!response.ok) {
            throw new Error(`Artifact download failed with status ${response.status} ${response.statusText}`);
        }
        if (response.body === null) {
            throw new Error("Artifact download response had no body");
        }
        const responseBody = response.body;
        await (0,node_stream_promises__WEBPACK_IMPORTED_MODULE_6__.pipeline)(node_stream__WEBPACK_IMPORTED_MODULE_5__.Readable.fromWeb(responseBody), (0,node_fs__WEBPACK_IMPORTED_MODULE_1__.createWriteStream)(destinationPath, { flags: "wx", mode: 0o666 }));
        logger.info(ctx, "Artifacts: restored artifact file", { destinationPath });
    }
    /**
     * Process S3 uploads through the existing stateful pipeline with
     * per-path mutex, cancellation, and persisted state tracking.
     */
    async processS3Uploads(ctx, uploads, waitForCompletion) {
        if (uploads.length === 0) {
            return [];
        }
        const uploadPromises = uploads.map(async (instruction) => {
            const absolutePath = this.sanitizeAbsolutePath(instruction.absolutePath);
            const dispatch = new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchResult */ .TT({
                absolutePath: absolutePath ?? instruction.absolutePath,
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.UNSPECIFIED,
                message: "",
                slackFileId: instruction.slackFileId,
            });
            if (absolutePath === undefined) {
                dispatch.status = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED;
                dispatch.message = "Invalid artifact path";
                return dispatch;
            }
            const uploadIdentity = this.artifactIdentity(absolutePath);
            try {
                // The cancel → stat → start sequence must be atomic per path.
                // Without the mutex, multiple concurrent callers can all exit
                // the cancel step, await freshStat (yielding), and each start
                // an upload before any of them register in the map.
                await this.withPathMutex(absolutePath, async () => {
                    // Cancel any in-flight upload for this path so we upload the
                    // latest version. Only one caller holds the mutex at a time,
                    // so a simple if (not while) is sufficient — no other caller
                    // can create a new entry between our check and our set.
                    await this.cancelInFlightUpload(ctx, {
                        absolutePath,
                        reason: "starting a replacement upload",
                    });
                    // Open inside the mutex so the stat and streams are pinned to one
                    // inode even if normalization atomically replaces the path later.
                    const readPath = await this.resolveArtifactReadPath(absolutePath);
                    const s3ReadHandle = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().open(readPath, node_fs__WEBPACK_IMPORTED_MODULE_1__.constants.O_RDONLY);
                    let freshStat;
                    let slackReadHandle;
                    try {
                        freshStat = await s3ReadHandle.stat();
                        if (!freshStat.isFile()) {
                            await s3ReadHandle.close();
                            dispatch.status = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED;
                            dispatch.message = "File removed during upload supersede";
                            return;
                        }
                        slackReadHandle = instruction.slackUploadUrl
                            ? await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().open(readPath, node_fs__WEBPACK_IMPORTED_MODULE_1__.constants.O_RDONLY)
                            : undefined;
                    }
                    catch (error) {
                        await Promise.allSettled([
                            s3ReadHandle.close(),
                            slackReadHandle?.close() ?? Promise.resolve(),
                        ]);
                        throw error;
                    }
                    const abortController = new AbortController();
                    const uploadPromise = this.performUpload(ctx, {
                        absolutePath,
                        readPath,
                        s3ReadHandle,
                        slackReadHandle,
                        fileSize: freshStat.size,
                        fileMtimeMs: Math.trunc(freshStat.mtimeMs),
                        instruction,
                        signal: abortController.signal,
                    }).finally(() => {
                        const current = this.inFlightUploads.get(uploadIdentity);
                        if (current?.abortController === abortController) {
                            this.inFlightUploads.delete(uploadIdentity);
                        }
                    });
                    this.inFlightUploads.set(uploadIdentity, {
                        promise: uploadPromise,
                        abortController,
                    });
                });
                if (dispatch.status === _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.UNSPECIFIED) {
                    dispatch.status = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.ACCEPTED;
                }
                return dispatch;
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                dispatch.status = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED;
                dispatch.message = err.message;
                return dispatch;
            }
        });
        const results = await Promise.all(uploadPromises);
        const hasSlackUploads = uploads.some((u) => u.slackUploadUrl);
        if (hasSlackUploads) {
            const inFlightPromises = Array.from(this.inFlightUploads.values()).map((entry) => entry.promise);
            if (inFlightPromises.length > 0) {
                logger.info(ctx, "Artifacts: Waiting for S3+Slack uploads to complete", {
                    count: inFlightPromises.length,
                });
                await Promise.allSettled(inFlightPromises);
                logger.info(ctx, "Artifacts: All S3+Slack uploads completed");
            }
        }
        else if (waitForCompletion) {
            const batchIdentities = new Set(uploads.flatMap((u) => {
                const absolutePath = this.sanitizeAbsolutePath(u.absolutePath);
                return absolutePath === undefined ? [] : [this.artifactIdentity(absolutePath)];
            }));
            const batchPromises = Array.from(this.inFlightUploads.entries())
                .filter(([identity]) => batchIdentities.has(identity))
                .map(([, entry]) => entry.promise);
            if (batchPromises.length > 0) {
                logger.info(ctx, "Artifacts: Waiting for batch uploads to complete", {
                    count: batchPromises.length,
                });
                await Promise.allSettled(batchPromises);
                logger.info(ctx, "Artifacts: Batch uploads completed");
            }
        }
        return results;
    }
    /**
     * Process Slack-only uploads through a stateless pipeline. Each upload opens
     * a file handle first, pinning its bytes without serializing network calls.
     */
    async processSlackOnlyUploads(ctx, uploads) {
        if (uploads.length === 0) {
            return [];
        }
        logger.info(ctx, "Artifacts: processing Slack-only uploads", {
            count: uploads.length,
            paths: uploads.map((u) => u.absolutePath),
        });
        const results = await Promise.all(uploads.map(async (instruction) => {
            const absolutePath = this.sanitizeAbsolutePath(instruction.absolutePath);
            const dispatch = new _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchResult */ .TT({
                absolutePath: absolutePath ?? instruction.absolutePath,
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.UNSPECIFIED,
                message: "",
                slackFileId: instruction.slackFileId,
            });
            if (absolutePath === undefined) {
                dispatch.status = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED;
                dispatch.message = "Invalid artifact path";
                return dispatch;
            }
            try {
                await this.performSlackOnlyUpload(ctx, absolutePath, instruction);
                dispatch.status = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.ACCEPTED;
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                dispatch.status = _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadDispatchStatus */ .i1.REJECTED;
                dispatch.message = err.message;
                logger.warn(ctx, "Artifacts: Slack-only upload failed", {
                    absolutePath,
                    error: err.message,
                });
            }
            return dispatch;
        }));
        return results;
    }
    async performSlackOnlyUpload(ctx, absolutePath, instruction) {
        const readPath = await this.resolveArtifactReadPath(absolutePath);
        const readHandle = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().open(readPath, node_fs__WEBPACK_IMPORTED_MODULE_1__.constants.O_RDONLY);
        try {
            const fileStat = await readHandle.stat();
            if (!fileStat.isFile()) {
                throw new Error("File not found or not a file");
            }
            await this.uploadToSlack(ctx, readHandle, readPath, fileStat.size, instruction);
        }
        finally {
            await readHandle.close();
        }
    }
    async performUpload(ctx, args) {
        const { absolutePath, readPath, s3ReadHandle, slackReadHandle, fileSize, fileMtimeMs, instruction, signal, } = args;
        const uploadId = (0,node_crypto__WEBPACK_IMPORTED_MODULE_0__.randomUUID)();
        try {
            logger.info(ctx, "Starting artifact upload", {
                uploadId,
                hasSlackUpload: Boolean(instruction.slackUploadUrl),
                preUploadMtimeMs: fileMtimeMs,
                preUploadSizeBytes: fileSize,
            });
            await this.updateState(ctx, absolutePath, {
                status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.IN_PROGRESS,
                bytesUploaded: 0,
                uploadAttempts: (this.getState(absolutePath)?.uploadAttempts ?? 0) + 1,
                lastError: "",
                lastStartedAtUnixMs: Date.now(),
                uploadId,
                // Record the file stat that matches the bytes we are uploading so
                // listArtifacts() can detect if the file changes after this upload.
                uploadedFileMtimeMs: fileMtimeMs,
                uploadedFileSizeBytes: fileSize,
            });
            const s3Promise = this.uploadToS3(ctx, s3ReadHandle, readPath, fileSize, instruction, signal);
            const slackPromise = instruction.slackUploadUrl && slackReadHandle !== undefined
                ? this.uploadToSlack(ctx, slackReadHandle, readPath, fileSize, instruction, signal).catch((slackError) => {
                    if (signal?.aborted) {
                        return;
                    }
                    const err = slackError instanceof Error ? slackError : new Error(String(slackError));
                    logger.warn(ctx, "Artifacts: Slack upload failed (non-critical)", {
                        absolutePath,
                        uploadId,
                        slackFileId: instruction.slackFileId,
                        error: err.message,
                        errorName: err.name,
                        errorCode: err.code,
                        errorCause: err.cause instanceof Error
                            ? err.cause.message
                            : err.cause != null
                                ? String(err.cause)
                                : undefined,
                        errorStack: err.stack,
                    });
                })
                : Promise.resolve();
            try {
                await s3Promise;
                // If the upload was aborted after S3 completed (e.g. the file changed
                // and a replacement upload is about to start), skip the COMPLETED state
                // update — the replacement upload owns the state now.
                if (signal?.aborted) {
                    logger.info(ctx, "Artifacts: Upload cancelled after S3 completed (superseded)", {
                        absolutePath,
                        uploadId,
                    });
                }
                else {
                    await this.updateState(ctx, absolutePath, {
                        status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.COMPLETED,
                        bytesUploaded: fileSize,
                        uploadAttempts: this.getState(absolutePath)?.uploadAttempts ?? 1,
                        lastStartedAtUnixMs: this.getState(absolutePath)?.lastStartedAtUnixMs ?? 0,
                        lastFinishedAtUnixMs: Date.now(),
                        lastError: "",
                        uploadId,
                        // Record the file stat that matches the bytes we uploaded so
                        // listArtifacts() can detect if the file has since been modified.
                        uploadedFileMtimeMs: fileMtimeMs,
                        uploadedFileSizeBytes: fileSize,
                    });
                    logger.info(ctx, "Artifacts: Artifact upload complete", {
                        absolutePath,
                        uploadId,
                        sizeBytes: fileSize,
                        hadSlackUpload: Boolean(instruction.slackUploadUrl),
                    });
                }
            }
            catch (error) {
                // If this upload was aborted (because a newer upload replaced it),
                // don't overwrite state — the replacement upload owns it now.
                if (signal?.aborted) {
                    logger.info(ctx, "Artifacts: Upload cancelled (superseded)", {
                        absolutePath,
                        uploadId,
                    });
                }
                else {
                    const message = error instanceof Error ? error.message : String(error);
                    logger.error(ctx, "Artifact upload failed", error, {
                        absolutePath,
                        uploadId,
                    });
                    await this.updateState(ctx, absolutePath, {
                        status: _anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__/* .ArtifactUploadStatus */ .M7.FAILED,
                        bytesUploaded: 0,
                        uploadAttempts: this.getState(absolutePath)?.uploadAttempts ?? 1,
                        lastStartedAtUnixMs: this.getState(absolutePath)?.lastStartedAtUnixMs ?? 0,
                        lastFinishedAtUnixMs: Date.now(),
                        lastError: message,
                        uploadId,
                    });
                }
            }
            await slackPromise;
        }
        finally {
            await Promise.allSettled([
                s3ReadHandle.close(),
                slackReadHandle?.close() ?? Promise.resolve(),
            ]);
        }
    }
    async uploadToS3(ctx, readHandle, absolutePath, fileSize, instruction, signal) {
        const headers = new Headers();
        if (instruction.headers) {
            for (const [key, value] of Object.entries(instruction.headers)) {
                headers.set(key, value);
            }
        }
        if (instruction.contentType && !headers.has("content-type")) {
            headers.set("content-type", instruction.contentType);
        }
        if (!headers.has("content-length")) {
            headers.set("content-length", String(fileSize));
        }
        // Bound the read stream to exactly fileSize bytes so the body
        // matches the Content-Length header even if the file is mutated
        // concurrently.  If the file shrank, the short read will cause an
        // S3 error, which is the correct behaviour (retry with fresh stat).
        const readStreamOpts = fileSize > 0 ? { start: 0, end: fileSize - 1 } : undefined;
        const body = node_stream__WEBPACK_IMPORTED_MODULE_5__.Readable.toWeb(readHandle.createReadStream({
            ...readStreamOpts,
            autoClose: false,
        }));
        const response = await fetch(instruction.uploadUrl, {
            method: instruction.method || "PUT",
            headers,
            body,
            duplex: "half",
            signal,
        });
        if (!response.ok) {
            throw new Error(`S3 upload failed with status ${response.status} ${response.statusText}`);
        }
        logger.info(ctx, "Artifacts: S3 upload complete", { absolutePath });
    }
    async uploadToSlack(ctx, readHandle, absolutePath, fileSize, instruction, signal) {
        if (!instruction.slackUploadUrl) {
            return;
        }
        logger.info(ctx, "Artifacts: Starting Slack upload", {
            absolutePath,
            slackFileId: instruction.slackFileId,
        });
        const readStreamOpts = fileSize > 0 ? { start: 0, end: fileSize - 1 } : undefined;
        const body = node_stream__WEBPACK_IMPORTED_MODULE_5__.Readable.toWeb(readHandle.createReadStream({
            ...readStreamOpts,
            autoClose: false,
        }));
        const response = await fetch(instruction.slackUploadUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
                "Content-Length": String(fileSize),
            },
            body,
            duplex: "half",
            signal,
        });
        if (!response.ok) {
            const responseBody = await response.text().catch(() => "<unavailable response body>");
            throw new Error(`Slack upload failed with status ${response.status} ${response.statusText} and body: ${responseBody.slice(0, 300)}`);
        }
        logger.info(ctx, "Artifacts: Slack upload complete", {
            absolutePath,
            slackFileId: instruction.slackFileId,
        });
    }
    async readArtifactsFromDisk(ctx) {
        const entries = [];
        const exists = await this.validateArtifactRoot();
        if (!exists) {
            return entries;
        }
        await this.walkArtifacts(ctx, "", entries);
        logger.info(ctx, "Artifacts: Walked artifacts", {
            artifactCount: entries.length,
        });
        return entries;
    }
    async walkArtifacts(ctx, relativeDir, entries) {
        const absoluteDir = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.artifactsDir, relativeDir);
        const dirEntries = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().readdir(absoluteDir, { withFileTypes: true });
        for (const entry of dirEntries) {
            const entryRelativePath = node_path__WEBPACK_IMPORTED_MODULE_4___default().posix.join(relativeDir, entry.name);
            const entryAbsolutePath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(absoluteDir, entry.name);
            if (entry.isDirectory()) {
                await this.walkArtifacts(ctx, entryRelativePath, entries);
            }
            else if (entry.isFile()) {
                // Skip the artifact state file
                if (entryAbsolutePath === this.stateFilePath) {
                    continue;
                }
                const stat = await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().stat(entryAbsolutePath);
                let artifactAbsolutePath = entryAbsolutePath;
                if (this.rootKind === "agent_store_backed") {
                    const decodedPath = (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .fromAgentStoreArtifactPath */ .KJ)({
                        storeRelativePath: node_path__WEBPACK_IMPORTED_MODULE_4___default().posix.join(_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .AGENT_STORE_ARTIFACTS_PREFIX */ .hG, entryRelativePath),
                        artifactsRootPath: this.artifactsDir,
                    });
                    if (decodedPath === undefined) {
                        logger.warn(ctx, "Artifacts: skipping invalid agent-store artifact path");
                        continue;
                    }
                    artifactAbsolutePath = decodedPath.absolutePath;
                }
                entries.push({
                    absolutePath: artifactAbsolutePath,
                    artifactRelativePath: this.getArtifactRelativePath(artifactAbsolutePath),
                    sizeBytes: stat.size,
                    updatedAtUnixMs: Math.trunc(stat.mtimeMs),
                });
            }
        }
    }
    sanitizeAbsolutePath(absolutePath) {
        return (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .normalizeCloudAgentArtifactAbsolutePath */ .Yk)(absolutePath);
    }
    /**
     * Store-backed managers read durable bytes through the stable artifact-root
     * alias. Prefer a live external source when its metadata differs from the
     * durable copy, such as after a failed refresh.
     */
    async resolveArtifactReadPath(absolutePath) {
        if (this.rootKind !== "agent_store_backed") {
            return absolutePath;
        }
        const encoded = (0,_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__/* .toAgentStoreArtifactPath */ .rK)({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            return absolutePath;
        }
        const storePath = node_path__WEBPACK_IMPORTED_MODULE_4___default().join(this.artifactsDir, encoded.artifactRootRelativePath);
        const storeStat = await this.safeStat(storePath);
        if (!storeStat?.isFile()) {
            return absolutePath;
        }
        if (encoded.kind === "artifact") {
            return storePath;
        }
        const sourceStat = await this.safeLstat(absolutePath);
        if (sourceStat?.isFile() &&
            (sourceStat.size !== storeStat.size ||
                Math.abs(sourceStat.mtimeMs - storeStat.mtimeMs) > ARTIFACT_MTIME_TOLERANCE_MS)) {
            return absolutePath;
        }
        return storePath;
    }
    /**
     * Initialize the artifact upload manager. Must be called once at startup.
     * This starts fresh with empty state and overwrites any existing state file.
     */
    async initialize(ctx) {
        if (this.stateLoaded) {
            return;
        }
        logger.info(ctx, "Artifacts: initializing fresh artifact upload state", {
            stateFilePath: this.stateFilePath,
        });
        this.state = {};
        await this.persistState(ctx);
        this.stateLoaded = true;
    }
    /**
     * Wait for all currently in-flight uploads to settle (resolve or reject).
     * Useful for tests and graceful shutdown.
     */
    async waitForInFlightUploads() {
        const promises = Array.from(this.inFlightUploads.values()).map((entry) => entry.promise);
        await Promise.allSettled(promises);
    }
    async cancelInFlightUpload(ctx, args) {
        const { absolutePath, reason } = args;
        const existing = this.inFlightUploads.get(this.artifactIdentity(absolutePath));
        if (existing === undefined) {
            return;
        }
        logger.info(ctx, "Artifacts: Cancelling stale in-flight upload", {
            reason,
        });
        existing.abortController.abort();
        await existing.promise.catch(() => { });
    }
    /**
     * Acquire an async mutex for the given path. Callers for the same path are
     * serialized (FIFO); different paths don't block each other. The mutex is
     * released when `fn` settles.
     */
    async withPathMutex(absolutePath, fn) {
        const identity = this.artifactIdentity(absolutePath);
        const prev = this.pathMutexes.get(identity) ?? Promise.resolve();
        let releaseMutex;
        const mutexPromise = new Promise((resolve) => {
            releaseMutex = resolve;
        });
        // Chain after any previous holder — subsequent callers will chain after us.
        this.pathMutexes.set(identity, mutexPromise);
        try {
            await prev;
            return await fn();
        }
        finally {
            releaseMutex();
            // Clean up if we're the last in the chain.
            if (this.pathMutexes.get(identity) === mutexPromise) {
                this.pathMutexes.delete(identity);
            }
        }
    }
    async updateState(ctx, absolutePath, update) {
        const identity = this.artifactIdentity(absolutePath);
        this.state[identity] = {
            ...this.state[identity],
            ...update,
        };
        await this.persistState(ctx);
    }
    async persistState(ctx) {
        const payload = {
            version: 1,
            artifacts: { ...this.state },
        };
        this.pendingPersistPayload = payload;
        if (this.isPersistingState) {
            return;
        }
        this.isPersistingState = true;
        try {
            // Flush all pending payloads sequentially. If additional updates arrive
            // while a write is in progress, they will be coalesced into the latest
            // payload and written after the current write completes.
            // eslint-disable-next-line no-constant-condition
            while (this.pendingPersistPayload !== null) {
                const nextPayload = this.pendingPersistPayload;
                this.pendingPersistPayload = null;
                const dir = node_path__WEBPACK_IMPORTED_MODULE_4___default().dirname(this.stateFilePath);
                if (this.rootKind === "agent_store_backed") {
                    await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().mkdir(dir, { recursive: true });
                }
                else {
                    await this.ensureArtifactDirectory(dir);
                }
                await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().writeFile(this.stateFilePath, JSON.stringify(nextPayload, null, 2), "utf8");
            }
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(ctx, "Artifacts: Failed to persist state", err, {
                stateFilePath: this.stateFilePath,
            });
        }
        finally {
            this.isPersistingState = false;
        }
    }
    async safeStat(filePath) {
        try {
            return await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().stat(filePath);
        }
        catch (error) {
            if (isMissingPathError(error)) {
                return null;
            }
            throw error;
        }
    }
    async safeLstat(filePath) {
        try {
            return await node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default().lstat(filePath);
        }
        catch (error) {
            if (isMissingPathError(error)) {
                return null;
            }
            throw error;
        }
    }
}
/**
 * Resolves one artifact root per request context and owns one upload manager
 * per resolved root. Keeping manager state root-scoped preserves upload
 * cancellation, mutex, and persisted-state semantics when workers start
 * selecting claim-specific roots.
 */
class ArtifactUploadManagerProvider {
    resolveRoot;
    validationOptions;
    detectAgentStoreBackedAlias;
    entries = new Map();
    inFlightDetectedAliasGets = new Map();
    constructor(options) {
        this.resolveRoot = options.resolveRoot;
        this.validationOptions = options.validationOptions ?? {};
        this.detectAgentStoreBackedAlias = options.detectAgentStoreBackedAlias ?? false;
    }
    async get(ctx) {
        const resolution = this.resolveRoot(ctx);
        const artifactsRootPath = node_path__WEBPACK_IMPORTED_MODULE_4___default().resolve(resolution.artifactsRootPath);
        if (!this.detectAgentStoreBackedAlias) {
            return await this.getOrCreate(ctx, {
                artifactsRootPath,
                rootKind: resolution.rootKind,
                parentStore: resolution.parentStore,
            });
        }
        const inFlightKey = artifactsRootPath;
        const existingGet = this.inFlightDetectedAliasGets.get(inFlightKey);
        if (existingGet !== undefined) {
            return await existingGet;
        }
        const getPromise = this.classifyAndGet(ctx, artifactsRootPath);
        this.inFlightDetectedAliasGets.set(inFlightKey, getPromise);
        try {
            return await getPromise;
        }
        finally {
            // Keep only concurrent callers coalesced so a later call can detect
            // Agent Store activation and select the newly classified manager.
            if (this.inFlightDetectedAliasGets.get(inFlightKey) === getPromise) {
                this.inFlightDetectedAliasGets.delete(inFlightKey);
            }
        }
    }
    async classifyAndGet(ctx, artifactsRootPath) {
        const rootKind = await classifyArtifactRootKind(artifactsRootPath, this.validationOptions);
        return await this.getOrCreate(ctx, {
            artifactsRootPath,
            rootKind,
            // A pod whose root aliases the store also carries the FUSE `parent`
            // named mount when one was delivered; persistence validates liveness
            // per call, so a pod without the mount rejects instead of misplacing.
            parentStore: rootKind === "agent_store_backed"
                ? {
                    artifactsPath: DEFAULT_PARENT_AGENT_STORE_ARTIFACTS_PATH,
                    requireFuseMount: true,
                }
                : undefined,
        });
    }
    async getOrCreate(ctx, resolution) {
        const { artifactsRootPath, rootKind, parentStore } = resolution;
        const cacheKey = [
            rootKind,
            artifactsRootPath,
            parentStore?.artifactsPath ?? "",
            String(parentStore?.requireFuseMount ?? false),
        ].join("\0");
        let entry = this.entries.get(cacheKey);
        if (entry === undefined) {
            const manager = new ArtifactUploadManager(ctx, {
                artifactsRootPath,
                rootKind,
                parentStore,
                validationOptions: this.validationOptions,
            });
            entry = {
                manager,
                initialization: manager.initialize(ctx),
            };
            this.entries.set(cacheKey, entry);
        }
        try {
            await entry.initialization;
        }
        catch (error) {
            if (this.entries.get(cacheKey) === entry) {
                this.entries.delete(cacheKey);
            }
            throw error;
        }
        return {
            artifactsRootPath,
            rootKind,
            manager: entry.manager,
        };
    }
    async initialize(ctx) {
        await this.get(ctx);
    }
    async waitForInFlightUploads() {
        const entries = Array.from(this.entries.values());
        await (0,_anysphere_utils__WEBPACK_IMPORTED_MODULE_11__/* .asyncMapSettledValues */ .up)(entries, async (entry) => {
            try {
                await entry.initialization;
            }
            finally {
                await entry.manager.waitForInFlightUploads();
            }
        }, { max: 4 });
    }
}
function createConstantArtifactUploadManagerProvider(options = {}) {
    const artifactsRootPath = options.artifactsRootPath ?? DEFAULT_ARTIFACTS_ROOT;
    const rootKind = options.rootKind ?? "local";
    return new ArtifactUploadManagerProvider({
        resolveRoot: () => ({ artifactsRootPath, rootKind }),
        validationOptions: options.validationOptions,
    });
}


/***/ },

};
