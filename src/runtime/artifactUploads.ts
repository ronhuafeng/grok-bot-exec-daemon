import nodeCrypto from "node:crypto";
import nodeFs from "node:fs";
import nodeFsPromises from "node:fs/promises";
import nodeOs from "node:os";
import nodePath from "node:path";
import nodeStream from "node:stream";
import nodeStreamPromises from "node:stream/promises";
import { AGENT_STORE_INTERNAL_ROOT_DIRECTORY, toAgentStoreArtifactPath, toArtifactRelativePath, fromArtifactRelativePath, fromAgentStoreArtifactPath, AGENT_STORE_ARTIFACTS_PREFIX, normalizeCloudAgentArtifactAbsolutePath } from "../interop/vendor/agent-core-cloud-agent-artifact-paths.js";
import { createLogger } from "../interop/vendor/context-logger.js";
import { ArtifactUploadStatus, ArtifactUploadMetadata, PersistArtifactsToAgentStoreResponse, PersistArtifactToAgentStoreStatus, PersistArtifactsToParentStoreResponse, PersistArtifactToAgentStoreResult, ArtifactUploadDispatchResult, ArtifactUploadDispatchStatus, UploadArtifactsResponse, RestoreArtifactsResponse, RestoreArtifactResult, ArtifactRestoreStatus } from "../interop/vendor/proto-agent-v1-control-service-pb.js";
import { isPathWithin } from "../interop/vendor/utils-path-utils.js";
import { asyncMapValues, asyncMapSettledValues } from "../interop/vendor/utils-promise-extras.js";
import type { Context } from "../interop/contracts/context.js";
import type { FileHandle } from "node:fs/promises";
import type { ProtoMessage } from "../interop/contracts/protobuf-runtime.js";
import type { agent_v1_ArtifactUploadInstruction, agent_v1_ArtifactUploadStatus, agent_v1_ArtifactUploadDispatchResult, agent_v1_RestoreArtifactInstruction, agent_v1_PersistArtifactToAgentStoreInstruction } from "../interop/contracts/protobuf-generated.js";
export type ArtifactUploadInstruction = Omit<agent_v1_ArtifactUploadInstruction, keyof ProtoMessage>;
export type RestoreArtifactInstruction = Omit<agent_v1_RestoreArtifactInstruction, keyof ProtoMessage>;
export type PersistArtifactInstruction = Omit<agent_v1_PersistArtifactToAgentStoreInstruction, keyof ProtoMessage>;
export type ArtifactRootKind = "local" | "agent_store_backed";
export interface ArtifactParentStore { artifactsPath: string; requireFuseMount: boolean; }
export interface ArtifactValidationOptions {
    expectedAgentStoreArtifactsPath?: string;
    readMountInfo?: () => string | Promise<string>;
}
export interface ArtifactUploadManagerOptions {
    artifactsRootPath?: string;
    rootKind?: ArtifactRootKind;
    validationOptions?: ArtifactValidationOptions;
    parentStore?: ArtifactParentStore;
}
export interface ArtifactFileEntry {
    absolutePath: string;
    artifactRelativePath?: string;
    sizeBytes: number;
    updatedAtUnixMs: number;
}
export interface ArtifactUploadState {
    status: agent_v1_ArtifactUploadStatus;
    bytesUploaded: number;
    uploadAttempts: number;
    lastError: string;
    lastStartedAtUnixMs: number;
    lastFinishedAtUnixMs?: number;
    uploadId: string;
    uploadedFileMtimeMs?: number;
    uploadedFileSizeBytes?: number;
}
export interface ArtifactStatePayload {
    version: number;
    artifacts: { [identity: string]: ArtifactUploadState | undefined };
}
export interface ArtifactCopyArgs {
    sourcePath: string;
    destinationPath: string;
    tempPath: string;
    writeMode: "directWrite" | "stageAndRename";
    ensureDirectory(dir: string): Promise<void>;
    beforeStaging?(): Promise<void>;
}
export interface ArtifactPersistBatchArgs {
    staticRejection?: string;
    persist(ctx: Context, absolutePath: string): Promise<boolean>;
    logPersistFailure(ctx: Context, errorMessage: string): void;
}
export interface PerformArtifactUploadArgs {
    absolutePath: string;
    readPath: string;
    s3ReadHandle: FileHandle;
    slackReadHandle?: FileHandle;
    fileSize: number;
    fileMtimeMs: number;
    instruction: ArtifactUploadInstruction;
    signal?: AbortSignal;
}
export interface ArtifactRootResolution {
    artifactsRootPath: string;
    rootKind: ArtifactRootKind;
    parentStore?: ArtifactParentStore;
}
export interface ArtifactManagerResolution {
    artifactsRootPath: string;
    rootKind: ArtifactRootKind;
    manager: ArtifactUploadManager;
}
export interface ArtifactUploadManagerProviderOptions {
    resolveRoot(ctx: Context): ArtifactRootResolution;
    validationOptions?: ArtifactValidationOptions;
    detectAgentStoreBackedAlias?: boolean;
}

export const logger = createLogger("exec-daemon-artifacts");
export const DEFAULT_ARTIFACTS_ROOT = "/opt/cursor/artifacts";
export function resolveArtifactsRootPath(dataDir: string | undefined) {
    return dataDir ? nodePath.join(dataDir, "artifacts") : DEFAULT_ARTIFACTS_ROOT;
}
export const DEFAULT_AGENT_STORE_ARTIFACTS_PATH = "/cursor/stores/self/artifacts";
export const DEFAULT_PARENT_AGENT_STORE_ARTIFACTS_PATH = "/cursor/stores/parent/artifacts";
export const AGENT_STORE_FILESYSTEM_TYPE = "fuse.agent-store";
export const PROC_SELF_MOUNTINFO_PATH = "/proc/self/mountinfo";
// State file is for debugging only - exec-daemon starts fresh each time and
// immediately overwrites any existing state file.
export const ARTIFACT_STATE_SUBDIR = ".cursor";
export const ARTIFACT_STATE_FILENAME = "exec-daemon-artifacts.json";
export const ARTIFACT_RESTORE_DOWNLOAD_TIMEOUT_MS = 60000;
export const ARTIFACT_MTIME_TOLERANCE_MS = 1;
export function isMissingPathError(error: unknown) {
    // Called only with rejections from Node fs stat/lstat operations below.
    const code = (error as NodeJS.ErrnoException).code;
    return code === "ENOENT" || code === "ENOTDIR";
}
export function decodeMountInfoPath(encodedPath: string) {
    const mountInfoEscapes = {
        "011": "\t",
        "012": "\n",
        "040": " ",
        "134": "\\",
    };
    return encodedPath.replace(/\\(011|012|040|134)/g, (match: string, encodedCharacter: "011" | "012" | "040" | "134") => mountInfoEscapes[encodedCharacter] ?? match);
}
export function isPathBackedByAgentStoreMount(targetPath: string, mountInfo: string) {
    const resolvedTargetPath = nodePath.resolve(targetPath);
    let closestMountPathLength = -1;
    let closestFilesystemType: string | undefined;
    for (const line of mountInfo.split("\n")) {
        const fields = line.trim().split(/\s+/);
        const separatorIndex = fields.indexOf("-");
        const encodedMountPath = fields[4];
        const filesystemType = fields[separatorIndex + 1];
        if (separatorIndex < 0 || encodedMountPath === undefined || filesystemType === undefined) {
            continue;
        }
        const mountPath = nodePath.resolve(decodeMountInfoPath(encodedMountPath));
        if (isPathWithin({ basePath: mountPath, targetPath: resolvedTargetPath }) &&
            mountPath.length > closestMountPathLength) {
            closestMountPathLength = mountPath.length;
            closestFilesystemType = filesystemType;
        }
    }
    return closestFilesystemType === AGENT_STORE_FILESYSTEM_TYPE;
}
/** True when `targetPath` is on a `fuse.agent-store` mount. Fail closed. */
export async function isAgentStoreFuseBackedPath(targetPath: string, options: Pick<ArtifactValidationOptions, "readMountInfo"> = {}) {
    const readMountInfo = options.readMountInfo ?? (() => nodeFsPromises.readFile(PROC_SELF_MOUNTINFO_PATH, "utf8"));
    try {
        const mountInfo = await readMountInfo();
        return isPathBackedByAgentStoreMount(targetPath, mountInfo);
    }
    catch {
        return false;
    }
}
export async function validateArtifactRootPath(options: { artifactsRootPath: string; expectedAgentStoreArtifactsPath: string; readMountInfo: () => string | Promise<string> }) {
    const { artifactsRootPath, expectedAgentStoreArtifactsPath, readMountInfo } = options;
    let rootLstat: import("node:fs").Stats;
    try {
        rootLstat = await nodeFsPromises.lstat(artifactsRootPath);
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
    let mountInfo: string;
    try {
        mountInfo = await readMountInfo();
    }
    catch {
        throw new Error("Artifact root agent-store mount could not be verified");
    }
    if (!isPathBackedByAgentStoreMount(expectedAgentStoreArtifactsPath, mountInfo)) {
        throw new Error("Artifact root target is not backed by a fuse.agent-store mount");
    }
    let expectedTargetStat: import("node:fs").Stats;
    try {
        expectedTargetStat = await nodeFsPromises.stat(expectedAgentStoreArtifactsPath);
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
    const linkTarget = await nodeFsPromises.readlink(artifactsRootPath);
    if (nodePath.resolve(nodePath.dirname(artifactsRootPath), linkTarget) !== expectedAgentStoreArtifactsPath) {
        throw new Error("Artifact root symlink does not target the expected agent-store artifacts directory");
    }
    return "agent_store_backed";
}
/**
 * Classify an artifact root as Agent Store backed only when it is the exact
 * expected alias on a verified fuse.agent-store mount. Detection failures are
 * deliberately local fallbacks; artifact operations perform strict validation.
 */
export async function classifyArtifactRootKind(artifactsRootPath: string, validationOptions: ArtifactValidationOptions = {}): Promise<ArtifactRootKind> {
    const expectedAgentStoreArtifactsPath = nodePath.resolve(validationOptions.expectedAgentStoreArtifactsPath ?? DEFAULT_AGENT_STORE_ARTIFACTS_PATH);
    const readMountInfo = validationOptions.readMountInfo ?? (() => nodeFsPromises.readFile(PROC_SELF_MOUNTINFO_PATH, "utf8"));
    try {
        const rootKind = await validateArtifactRootPath({
            artifactsRootPath: nodePath.resolve(artifactsRootPath),
            expectedAgentStoreArtifactsPath,
            readMountInfo,
        });
        return rootKind === "agent_store_backed" ? "agent_store_backed" : "local";
    }
    catch {
        return "local";
    }
}
export class ArtifactUploadManager {
    artifactsDir;
    rootKind;
    parentStore;
    stateFilePath;
    stagingDir;
    expectedAgentStoreArtifactsPath;
    readMountInfo;
    stateLoaded = false;
    state: { [identity: string]: ArtifactUploadState | undefined } = {};
    inFlightUploads = new Map<string, { promise: Promise<void>; abortController: AbortController }>();
    isPersistingState = false;
    pendingPersistPayload: ArtifactStatePayload | null = null;
    /**
     * Per-path mutex that serializes the cancel → stat → start critical section
     * in uploadArtifacts. Without this, multiple concurrent callers for the same
     * path can all pass the cancel loop and start parallel uploads.
     */
    pathMutexes = new Map<string, Promise<void>>();
    constructor(ctx: Context, options: ArtifactUploadManagerOptions = {}) {
        const artifactsRootPath = options.artifactsRootPath ?? DEFAULT_ARTIFACTS_ROOT;
        const validationOptions = options.validationOptions ?? {};
        logger.info(ctx, "Artifacts: setting up artifact upload manager", {
            artifactsRootPath,
            rootKind: options.rootKind ?? "local",
            parentStoreArtifactsPath: options.parentStore?.artifactsPath,
        });
        this.artifactsDir = nodePath.resolve(artifactsRootPath);
        this.rootKind = options.rootKind ?? "local";
        this.parentStore =
            options.parentStore === undefined
                ? undefined
                : {
                    artifactsPath: nodePath.resolve(options.parentStore.artifactsPath),
                    requireFuseMount: options.parentStore.requireFuseMount,
                };
        if (this.rootKind === "agent_store_backed") {
            this.stateFilePath = nodePath.join(nodeOs.tmpdir(), `cursor-exec-daemon-artifacts-${nodeCrypto.randomUUID()}.json`);
            this.stagingDir = nodePath.join(this.artifactsDir, AGENT_STORE_INTERNAL_ROOT_DIRECTORY, "staging");
        }
        else {
            this.stagingDir = nodePath.join(this.artifactsDir, ARTIFACT_STATE_SUBDIR);
            this.stateFilePath = nodePath.join(this.stagingDir, ARTIFACT_STATE_FILENAME);
        }
        this.expectedAgentStoreArtifactsPath = nodePath.resolve(validationOptions.expectedAgentStoreArtifactsPath ?? DEFAULT_AGENT_STORE_ARTIFACTS_PATH);
        this.readMountInfo =
            validationOptions.readMountInfo ?? (() => nodeFsPromises.readFile(PROC_SELF_MOUNTINFO_PATH, "utf8"));
    }
    /**
     * Identity used for upload state, the per-path mutex, and the in-flight
     * map. Key on the durable store path so an out-of-root artifact and the
     * flattened copy that `listArtifacts` reports back resolve to the same
     * entry. Paths the store cannot represent keep their own identity.
     */
    artifactIdentity(absolutePath: string) {
        const storeRelativePath = toAgentStoreArtifactPath({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        })?.storeRelativePath;
        if (storeRelativePath !== undefined) {
            return storeRelativePath;
        }
        return this.sanitizeAbsolutePath(absolutePath) ?? absolutePath;
    }
    getState(absolutePath: string) {
        return this.state[this.artifactIdentity(absolutePath)];
    }
    /**
     * Portable name for an artifact under this root, or undefined when the root
     * cannot move and its absolute paths are already stable.
     */
    getArtifactRelativePath(absolutePath: string) {
        if (this.rootKind !== "agent_store_backed" ||
            this.artifactsDir === nodePath.resolve(DEFAULT_ARTIFACTS_ROOT)) {
            return undefined;
        }
        const sanitizedPath = this.sanitizeAbsolutePath(absolutePath);
        return sanitizedPath === undefined
            ? undefined
            : toArtifactRelativePath({
                absolutePath: sanitizedPath,
                artifactsRootPath: this.artifactsDir,
            });
    }
    async listArtifacts(ctx: Context) {
        logger.info(ctx, "Artifacts: Listing artifacts");
        const files = await this.readArtifactsFromDisk(ctx);
        return files.map((file) => {
            const identity = this.artifactIdentity(file.absolutePath);
            const persisted = this.state[identity];
            let effectiveStatus = persisted?.status ?? ArtifactUploadStatus.NOT_STARTED;
            // Detect mutable artifacts: if the file has been modified since it was
            // last uploaded or since the current upload started (different mtime or
            // size), reset status so it gets re-uploaded. This covers both COMPLETED
            // (file changed after upload) and IN_PROGRESS (file changed during upload)
            // so we don't wait for a stale upload to finish before re-uploading.
            if ((effectiveStatus === ArtifactUploadStatus.COMPLETED ||
                effectiveStatus === ArtifactUploadStatus.IN_PROGRESS) &&
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
                effectiveStatus = ArtifactUploadStatus.NOT_STARTED;
            }
            // When status is reset to NOT_STARTED due to file change, report
            // bytesUploaded as 0 to keep metadata internally consistent.
            const needsReupload = effectiveStatus === ArtifactUploadStatus.NOT_STARTED &&
                (persisted?.status === ArtifactUploadStatus.COMPLETED ||
                    persisted?.status === ArtifactUploadStatus.IN_PROGRESS);
            return new ArtifactUploadMetadata({
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
    async persistExtraPathToAgentStore(ctx: Context, rawAbsolutePath: string) {
        if (this.rootKind !== "agent_store_backed") {
            return false;
        }
        const absolutePath = this.sanitizeAbsolutePath(rawAbsolutePath);
        if (absolutePath === undefined) {
            throw new Error("Invalid artifact path");
        }
        const encoded = toAgentStoreArtifactPath({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            throw new Error("Artifact path is invalid or reserved");
        }
        if (encoded.kind === "artifact") {
            return false;
        }
        const destinationPath = nodePath.join(this.artifactsDir, encoded.artifactRootRelativePath);
        const tempPath = nodePath.join(this.stagingDir, `extra-path-${nodeCrypto.randomUUID()}.tmp`);
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
    async copyToDurableDestination(args: ArtifactCopyArgs) {
        const source = await nodeFsPromises.open(args.sourcePath, nodeFs.constants.O_RDONLY | nodeFs.constants.O_NOFOLLOW | nodeFs.constants.O_NONBLOCK)
            .catch((error: unknown) => {
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
                await args.ensureDirectory(nodePath.dirname(args.tempPath));
            }
            await args.beforeStaging?.();
            if (!stageAndRename) {
                await args.ensureDirectory(nodePath.dirname(args.destinationPath));
            }
            const writePath = stageAndRename ? args.tempPath : args.destinationPath;
            try {
                await nodeStreamPromises.pipeline(source.createReadStream({ autoClose: false }), nodeFs.createWriteStream(writePath, {
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
                await nodeFsPromises.utimes(writePath, sourceStat.atime, sourceStat.mtime);
            }
            catch (error) {
                if (!stageAndRename) {
                    // The failed/torn direct write may already be durable (the FUSE
                    // PUTs the buffered body when the stream closes, even on destroy).
                    // The destination path is listing-visible, so unlike the staged
                    // temp it CAN be removed.
                    await nodeFsPromises.rm(args.destinationPath, { force: true }).catch(() => { });
                }
                throw error;
            }
            if (stageAndRename) {
                await args.ensureDirectory(nodePath.dirname(args.destinationPath));
                await nodeFsPromises.rename(args.tempPath, args.destinationPath);
            }
            return true;
        }
        finally {
            await source.close();
            if (stageAndRename) {
                await nodeFsPromises.rm(args.tempPath, { force: true });
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
    async persistExtraPathToParentStore(ctx: Context, rawAbsolutePath: string) {
        const parentStore = this.parentStore;
        if (parentStore === undefined) {
            throw new Error("Parent store mount is not configured");
        }
        const absolutePath = this.sanitizeAbsolutePath(rawAbsolutePath);
        if (absolutePath === undefined) {
            throw new Error("Invalid artifact path");
        }
        const encoded = toAgentStoreArtifactPath({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            throw new Error("Artifact path is invalid or reserved");
        }
        const destinationPath = nodePath.join(parentStore.artifactsPath, encoded.artifactRootRelativePath);
        // Worker peer mounts are plain directories: stage inside the parent
        // mount so the final rename never crosses filesystems, with the reserved
        // internal directory keeping the temp out of listings. Pod FUSE mounts
        // (`requireFuseMount`) write the destination directly instead — see
        // {@link copyToDurableDestination}: the FUSE cannot rename a file BCS
        // hides from listings, so the staged rename always fails ENOENT there.
        const stagingDir = nodePath.join(parentStore.artifactsPath, AGENT_STORE_INTERNAL_ROOT_DIRECTORY, "staging");
        const tempPath = nodePath.join(stagingDir, `parent-persist-${nodeCrypto.randomUUID()}.tmp`);
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
    async ensureParentStoreDirectory(parentArtifactsPath: string, destinationDir: string) {
        if (!isPathWithin({
            basePath: parentArtifactsPath,
            targetPath: destinationDir,
        })) {
            throw new Error("Artifact destination is outside the parent store artifacts root");
        }
        await nodeFsPromises.mkdir(parentArtifactsPath, { recursive: true });
        const rootStat = await nodeFsPromises.lstat(parentArtifactsPath);
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
    async ensureDirectoryWithin(args: { basePath: string; destinationDir: string; messages: { containsSymlink: string; parentNotDirectory: string; resolvesOutside: string } }) {
        const relativePath = nodePath.relative(args.basePath, args.destinationDir);
        let currentPath = args.basePath;
        for (const part of relativePath.split((nodePath.sep))) {
            if (part.length === 0 || part === ".") {
                continue;
            }
            currentPath = nodePath.join(currentPath, part);
            let currentStat = await this.safeLstat(currentPath);
            if (currentStat === null) {
                try {
                    await nodeFsPromises.mkdir(currentPath);
                }
                catch (error) {
                    // This catch receives the rejection from Node fs.mkdir directly.
                    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
                        throw error;
                    }
                }
                currentStat = await nodeFsPromises.lstat(currentPath);
            }
            if (currentStat.isSymbolicLink()) {
                throw new Error(args.messages.containsSymlink);
            }
            if (!currentStat.isDirectory()) {
                throw new Error(args.messages.parentNotDirectory);
            }
        }
        const rootRealPath = await nodeFsPromises.realpath(args.basePath);
        const destinationDirRealPath = await nodeFsPromises.realpath(args.destinationDir);
        if (!isPathWithin({
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
    async assertParentStoreMountLive(parentStore: ArtifactParentStore) {
        const filesRoot = nodePath.dirname(parentStore.artifactsPath);
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
    hasFileChangedSinceUpload(persisted: ArtifactUploadState, currentFile: Pick<ArtifactFileEntry, "sizeBytes" | "updatedAtUnixMs">) {
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
    isSlackOnlyInstruction(instruction: ArtifactUploadInstruction) {
        return !instruction.uploadUrl && Boolean(instruction.slackUploadUrl);
    }
    async persistArtifactsToAgentStore(ctx: Context, artifacts: readonly PersistArtifactInstruction[]) {
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
        return new PersistArtifactsToAgentStoreResponse({ results });
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
    async persistArtifactsToParentStore(ctx: Context, artifacts: readonly PersistArtifactInstruction[]) {
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
        if (results.some((result) => result.status === PersistArtifactToAgentStoreStatus.PERSISTED)) {
            const postBatchRejection = await this.resolveParentStoreRejection();
            if (postBatchRejection !== undefined) {
                logger.warn(ctx, "Artifacts: parent store mount died during persistence; rejecting batch", {
                    error: postBatchRejection,
                });
                return new PersistArtifactsToParentStoreResponse({
                    results: results.map((result) => new PersistArtifactToAgentStoreResult({
                        absolutePath: result.absolutePath,
                        status: PersistArtifactToAgentStoreStatus.REJECTED,
                        message: postBatchRejection,
                    })),
                });
            }
        }
        return new PersistArtifactsToParentStoreResponse({ results });
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
    async persistArtifactBatch(ctx: Context, artifacts: readonly PersistArtifactInstruction[], args: ArtifactPersistBatchArgs) {
        return await asyncMapValues(artifacts, async (artifact) => {
            const absolutePath = this.sanitizeAbsolutePath(artifact.absolutePath) ?? artifact.absolutePath;
            if (artifact.artifactRelativePath !== undefined &&
                this.getArtifactRelativePath(artifact.absolutePath) !== artifact.artifactRelativePath) {
                return new PersistArtifactToAgentStoreResult({
                    absolutePath,
                    status: PersistArtifactToAgentStoreStatus.REJECTED,
                    message: "Artifact relative path does not match its absolute path",
                });
            }
            if (args.staticRejection !== undefined) {
                return new PersistArtifactToAgentStoreResult({
                    absolutePath,
                    status: PersistArtifactToAgentStoreStatus.REJECTED,
                    message: args.staticRejection,
                });
            }
            try {
                await args.persist(ctx, artifact.absolutePath);
                return new PersistArtifactToAgentStoreResult({
                    absolutePath,
                    status: PersistArtifactToAgentStoreStatus.PERSISTED,
                });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                args.logPersistFailure(ctx, message);
                return new PersistArtifactToAgentStoreResult({
                    absolutePath,
                    status: PersistArtifactToAgentStoreStatus.REJECTED,
                    message,
                });
            }
        }, { max: 4 });
    }
    async uploadArtifacts(ctx: Context, uploads: readonly ArtifactUploadInstruction[], waitForCompletion?: boolean) {
        const s3Uploads: ArtifactUploadInstruction[] = [];
        const slackOnlyUploads: ArtifactUploadInstruction[] = [];
        const noOpResults: agent_v1_ArtifactUploadDispatchResult[] = [];
        for (const u of uploads) {
            if (u.artifactRelativePath !== undefined &&
                this.getArtifactRelativePath(u.absolutePath) !== u.artifactRelativePath) {
                noOpResults.push(new ArtifactUploadDispatchResult({
                    absolutePath: this.sanitizeAbsolutePath(u.absolutePath) ?? u.absolutePath,
                    status: ArtifactUploadDispatchStatus.REJECTED,
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
                noOpResults.push(new ArtifactUploadDispatchResult({
                    absolutePath,
                    status: ArtifactUploadDispatchStatus.REJECTED,
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
            ...new Set<string>([...s3Uploads, ...slackOnlyUploads].map((upload) => upload.absolutePath)),
        ];
        const blockedUploadIdentities = new Set<string>();
        await asyncMapValues(authorizedPaths, async (absolutePath) => {
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
        const blockedResults: agent_v1_ArtifactUploadDispatchResult[] = [];
        const rejectBlockedUploads = (uploads: readonly ArtifactUploadInstruction[]) => {
            const kept: ArtifactUploadInstruction[] = [];
            for (const upload of uploads) {
                const sanitizedPath = this.sanitizeAbsolutePath(upload.absolutePath) ?? upload.absolutePath;
                if (blockedUploadIdentities.has(this.artifactIdentity(sanitizedPath))) {
                    blockedResults.push(new ArtifactUploadDispatchResult({
                        absolutePath: sanitizedPath,
                        status: ArtifactUploadDispatchStatus.REJECTED,
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
        const errors = results.filter((r) => r.status === ArtifactUploadDispatchStatus.REJECTED);
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
        return new UploadArtifactsResponse({ results });
    }
    async restoreArtifacts(ctx: Context, artifacts: readonly RestoreArtifactInstruction[]) {
        const results = await asyncMapValues(artifacts, async (artifact) => this.restoreArtifact(ctx, artifact), { max: 4 });
        return new RestoreArtifactsResponse({ results });
    }
    async restoreArtifact(ctx: Context, artifact: RestoreArtifactInstruction) {
        const absolutePath = this.sanitizeAbsolutePath(artifact.absolutePath);
        if (absolutePath === undefined) {
            return new RestoreArtifactResult({
                status: ArtifactRestoreStatus.REJECTED,
                errorMessage: "Invalid artifact path",
            });
        }
        // A relative path is what lets a reclaimed agent restore under its own
        // root; the producer's absolute path points at a root it no longer has.
        const destinationPath = artifact.artifactRelativePath !== undefined
            ? this.getRelativeDestinationPath(artifact.artifactRelativePath)
            : this.getArtifactRootDestinationPath(absolutePath);
        if (destinationPath === undefined) {
            return new RestoreArtifactResult({
                status: ArtifactRestoreStatus.REJECTED,
                errorMessage: "Artifact path is outside the artifact root",
            });
        }
        if (artifact.downloadUrl.trim().length === 0) {
            return new RestoreArtifactResult({
                status: ArtifactRestoreStatus.REJECTED,
                errorMessage: "Missing artifact download URL",
            });
        }
        const existing = await this.safeLstat(destinationPath);
        if (existing !== null) {
            if (existing.isFile()) {
                return new RestoreArtifactResult({
                    status: ArtifactRestoreStatus.SKIPPED_ALREADY_EXISTS,
                });
            }
            return new RestoreArtifactResult({
                status: ArtifactRestoreStatus.REJECTED,
                errorMessage: "Artifact path exists and is not a file",
            });
        }
        const destinationDir = nodePath.dirname(destinationPath);
        const tempPath = nodePath.join(this.stagingDir, `artifact-restore-${nodeCrypto.randomUUID()}.tmp`);
        try {
            await this.ensureArtifactDirectory(this.stagingDir);
            await this.downloadArtifactToFile(ctx, artifact.downloadUrl, tempPath);
            await nodeFsPromises.chmod(tempPath, 0o666);
            await this.ensureArtifactDirectory(destinationDir);
            try {
                await nodeFsPromises.copyFile(tempPath, destinationPath, nodeFs.constants.COPYFILE_EXCL);
            }
            catch (copyError) {
                if (copyError instanceof Error &&
                    "code" in copyError &&
                    copyError.code === "EEXIST") {
                    await nodeFsPromises.rm(tempPath, { force: true }).catch(() => { });
                    return new RestoreArtifactResult({
                        status: ArtifactRestoreStatus.SKIPPED_ALREADY_EXISTS,
                    });
                }
                throw copyError;
            }
            await nodeFsPromises.rm(tempPath, { force: true }).catch(() => { });
            const requestedMtimeMs = Number(artifact.updatedAtUnixMs);
            if (Number.isFinite(requestedMtimeMs) && requestedMtimeMs > 0) {
                const mtime = new Date(requestedMtimeMs);
                await nodeFsPromises.utimes(destinationPath, mtime, mtime);
            }
            const stat = await nodeFsPromises.stat(destinationPath);
            await this.updateState(ctx, destinationPath, {
                status: ArtifactUploadStatus.COMPLETED,
                bytesUploaded: stat.size,
                uploadAttempts: 1,
                lastError: "",
                lastStartedAtUnixMs: Date.now(),
                lastFinishedAtUnixMs: Date.now(),
                uploadId: `restored-${nodeCrypto.randomUUID()}`,
                uploadedFileMtimeMs: Math.trunc(stat.mtimeMs),
                uploadedFileSizeBytes: stat.size,
            });
            return new RestoreArtifactResult({
                status: ArtifactRestoreStatus.RESTORED,
            });
        }
        catch (error) {
            await nodeFsPromises.rm(tempPath, { force: true }).catch(() => { });
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(ctx, "Artifacts: failed to restore artifact", {
                absolutePath,
                message,
            });
            return new RestoreArtifactResult({
                status: ArtifactRestoreStatus.REJECTED,
                errorMessage: message,
            });
        }
    }
    getRelativeDestinationPath(relativePath: string) {
        if (fromArtifactRelativePath({
            relativePath,
            artifactsRootPath: this.artifactsDir,
        }) === undefined) {
            return undefined;
        }
        // The codec validates portable syntax. Build the filesystem path from the
        // native root so Windows casing and separators continue to match it.
        return nodePath.join(this.artifactsDir, relativePath);
    }
    getArtifactRootDestinationPath(absolutePath: string) {
        const encoded = toAgentStoreArtifactPath({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            return undefined;
        }
        return nodePath.join(this.artifactsDir, encoded.artifactRootRelativePath);
    }
    async ensureArtifactDirectory(destinationDir: string) {
        if (!isPathWithin({
            basePath: this.artifactsDir,
            targetPath: destinationDir,
        })) {
            throw new Error("Artifact destination is outside the artifact root");
        }
        const rootExists = await this.validateArtifactRoot();
        if (!rootExists) {
            await nodeFsPromises.mkdir(this.artifactsDir, { recursive: true });
            const createdRootStat = await nodeFsPromises.lstat(this.artifactsDir);
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
    async downloadArtifactToFile(ctx: Context, downloadUrl: string, destinationPath: string) {
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
        await nodeStreamPromises.pipeline(nodeStream.Readable.fromWeb(responseBody), nodeFs.createWriteStream(destinationPath, { flags: "wx", mode: 0o666 }));
        logger.info(ctx, "Artifacts: restored artifact file", { destinationPath });
    }
    /**
     * Process S3 uploads through the existing stateful pipeline with
     * per-path mutex, cancellation, and persisted state tracking.
     */
    async processS3Uploads(ctx: Context, uploads: readonly ArtifactUploadInstruction[], waitForCompletion?: boolean) {
        if (uploads.length === 0) {
            return [];
        }
        const uploadPromises = uploads.map(async (instruction) => {
            const absolutePath = this.sanitizeAbsolutePath(instruction.absolutePath);
            const dispatch = new ArtifactUploadDispatchResult({
                absolutePath: absolutePath ?? instruction.absolutePath,
                status: ArtifactUploadDispatchStatus.UNSPECIFIED,
                message: "",
                slackFileId: instruction.slackFileId,
            });
            if (absolutePath === undefined) {
                dispatch.status = ArtifactUploadDispatchStatus.REJECTED;
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
                    const s3ReadHandle = await nodeFsPromises.open(readPath, nodeFs.constants.O_RDONLY);
                    let freshStat: import("node:fs").Stats;
                    let slackReadHandle: FileHandle | undefined;
                    try {
                        freshStat = await s3ReadHandle.stat();
                        if (!freshStat.isFile()) {
                            await s3ReadHandle.close();
                            dispatch.status = ArtifactUploadDispatchStatus.REJECTED;
                            dispatch.message = "File removed during upload supersede";
                            return;
                        }
                        slackReadHandle = instruction.slackUploadUrl
                            ? await nodeFsPromises.open(readPath, nodeFs.constants.O_RDONLY)
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
                if (dispatch.status === ArtifactUploadDispatchStatus.UNSPECIFIED) {
                    dispatch.status = ArtifactUploadDispatchStatus.ACCEPTED;
                }
                return dispatch;
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                dispatch.status = ArtifactUploadDispatchStatus.REJECTED;
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
            const batchIdentities = new Set<string>(uploads.flatMap((u) => {
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
    async processSlackOnlyUploads(ctx: Context, uploads: readonly ArtifactUploadInstruction[]) {
        if (uploads.length === 0) {
            return [];
        }
        logger.info(ctx, "Artifacts: processing Slack-only uploads", {
            count: uploads.length,
            paths: uploads.map((u) => u.absolutePath),
        });
        const results = await Promise.all(uploads.map(async (instruction) => {
            const absolutePath = this.sanitizeAbsolutePath(instruction.absolutePath);
            const dispatch = new ArtifactUploadDispatchResult({
                absolutePath: absolutePath ?? instruction.absolutePath,
                status: ArtifactUploadDispatchStatus.UNSPECIFIED,
                message: "",
                slackFileId: instruction.slackFileId,
            });
            if (absolutePath === undefined) {
                dispatch.status = ArtifactUploadDispatchStatus.REJECTED;
                dispatch.message = "Invalid artifact path";
                return dispatch;
            }
            try {
                await this.performSlackOnlyUpload(ctx, absolutePath, instruction);
                dispatch.status = ArtifactUploadDispatchStatus.ACCEPTED;
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                dispatch.status = ArtifactUploadDispatchStatus.REJECTED;
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
    async performSlackOnlyUpload(ctx: Context, absolutePath: string, instruction: ArtifactUploadInstruction) {
        const readPath = await this.resolveArtifactReadPath(absolutePath);
        const readHandle = await nodeFsPromises.open(readPath, nodeFs.constants.O_RDONLY);
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
    async performUpload(ctx: Context, args: PerformArtifactUploadArgs) {
        const { absolutePath, readPath, s3ReadHandle, slackReadHandle, fileSize, fileMtimeMs, instruction, signal, } = args;
        const uploadId = nodeCrypto.randomUUID();
        try {
            logger.info(ctx, "Starting artifact upload", {
                uploadId,
                hasSlackUpload: Boolean(instruction.slackUploadUrl),
                preUploadMtimeMs: fileMtimeMs,
                preUploadSizeBytes: fileSize,
            });
            await this.updateState(ctx, absolutePath, {
                status: ArtifactUploadStatus.IN_PROGRESS,
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
                ? this.uploadToSlack(ctx, slackReadHandle, readPath, fileSize, instruction, signal).catch((slackError: unknown) => {
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
                        errorCode: (err as Error & { code?: unknown }).code,
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
                        status: ArtifactUploadStatus.COMPLETED,
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
                        status: ArtifactUploadStatus.FAILED,
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
    async uploadToS3(ctx: Context, readHandle: FileHandle, absolutePath: string, fileSize: number, instruction: ArtifactUploadInstruction, signal?: AbortSignal) {
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
        const body = nodeStream.Readable.toWeb(readHandle.createReadStream({
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
    async uploadToSlack(ctx: Context, readHandle: FileHandle, absolutePath: string, fileSize: number, instruction: ArtifactUploadInstruction, signal?: AbortSignal) {
        if (!instruction.slackUploadUrl) {
            return;
        }
        logger.info(ctx, "Artifacts: Starting Slack upload", {
            absolutePath,
            slackFileId: instruction.slackFileId,
        });
        const readStreamOpts = fileSize > 0 ? { start: 0, end: fileSize - 1 } : undefined;
        const body = nodeStream.Readable.toWeb(readHandle.createReadStream({
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
    async readArtifactsFromDisk(ctx: Context) {
        const entries: ArtifactFileEntry[] = [];
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
    async walkArtifacts(ctx: Context, relativeDir: string, entries: ArtifactFileEntry[]): Promise<void> {
        const absoluteDir = nodePath.join(this.artifactsDir, relativeDir);
        const dirEntries = await nodeFsPromises.readdir(absoluteDir, { withFileTypes: true });
        for (const entry of dirEntries) {
            const entryRelativePath = nodePath.posix.join(relativeDir, entry.name);
            const entryAbsolutePath = nodePath.join(absoluteDir, entry.name);
            if (entry.isDirectory()) {
                await this.walkArtifacts(ctx, entryRelativePath, entries);
            }
            else if (entry.isFile()) {
                // Skip the artifact state file
                if (entryAbsolutePath === this.stateFilePath) {
                    continue;
                }
                const stat = await nodeFsPromises.stat(entryAbsolutePath);
                let artifactAbsolutePath = entryAbsolutePath;
                if (this.rootKind === "agent_store_backed") {
                    const decodedPath = fromAgentStoreArtifactPath({
                        storeRelativePath: nodePath.posix.join(AGENT_STORE_ARTIFACTS_PREFIX, entryRelativePath),
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
    sanitizeAbsolutePath(absolutePath: string) {
        return normalizeCloudAgentArtifactAbsolutePath(absolutePath);
    }
    /**
     * Store-backed managers read durable bytes through the stable artifact-root
     * alias. Prefer a live external source when its metadata differs from the
     * durable copy, such as after a failed refresh.
     */
    async resolveArtifactReadPath(absolutePath: string) {
        if (this.rootKind !== "agent_store_backed") {
            return absolutePath;
        }
        const encoded = toAgentStoreArtifactPath({
            absolutePath,
            artifactsRootPath: this.artifactsDir,
        });
        if (encoded === undefined) {
            return absolutePath;
        }
        const storePath = nodePath.join(this.artifactsDir, encoded.artifactRootRelativePath);
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
    async initialize(ctx: Context) {
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
    async cancelInFlightUpload(ctx: Context, args: { absolutePath: string; reason: string }) {
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
    async withPathMutex<T>(absolutePath: string, fn: () => T | PromiseLike<T>): Promise<T> {
        const identity = this.artifactIdentity(absolutePath);
        const prev = this.pathMutexes.get(identity) ?? Promise.resolve();
        // The Promise constructor invokes its executor synchronously.
        let releaseMutex!: () => void;
        const mutexPromise = new Promise<void>((resolve) => {
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
    async updateState(ctx: Context, absolutePath: string, update: ArtifactUploadState) {
        const identity = this.artifactIdentity(absolutePath);
        this.state[identity] = {
            ...this.state[identity],
            ...update,
        };
        await this.persistState(ctx);
    }
    async persistState(ctx: Context) {
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
                const dir = nodePath.dirname(this.stateFilePath);
                if (this.rootKind === "agent_store_backed") {
                    await nodeFsPromises.mkdir(dir, { recursive: true });
                }
                else {
                    await this.ensureArtifactDirectory(dir);
                }
                await nodeFsPromises.writeFile(this.stateFilePath, JSON.stringify(nextPayload, null, 2), "utf8");
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
    async safeStat(filePath: string) {
        try {
            return await nodeFsPromises.stat(filePath);
        }
        catch (error) {
            if (isMissingPathError(error)) {
                return null;
            }
            throw error;
        }
    }
    async safeLstat(filePath: string) {
        try {
            return await nodeFsPromises.lstat(filePath);
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
export class ArtifactUploadManagerProvider {
    resolveRoot;
    validationOptions;
    detectAgentStoreBackedAlias;
    entries = new Map<string, { manager: ArtifactUploadManager; initialization: Promise<void> }>();
    inFlightDetectedAliasGets = new Map<string, Promise<ArtifactManagerResolution>>();
    constructor(options: ArtifactUploadManagerProviderOptions) {
        this.resolveRoot = options.resolveRoot;
        this.validationOptions = options.validationOptions ?? {};
        this.detectAgentStoreBackedAlias = options.detectAgentStoreBackedAlias ?? false;
    }
    async get(ctx: Context): Promise<ArtifactManagerResolution> {
        const resolution = this.resolveRoot(ctx);
        const artifactsRootPath = nodePath.resolve(resolution.artifactsRootPath);
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
    async classifyAndGet(ctx: Context, artifactsRootPath: string) {
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
    async getOrCreate(ctx: Context, resolution: ArtifactRootResolution) {
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
    async initialize(ctx: Context) {
        await this.get(ctx);
    }
    async waitForInFlightUploads() {
        const entries = Array.from(this.entries.values());
        await asyncMapSettledValues(entries, async (entry) => {
            try {
                await entry.initialization;
            }
            finally {
                await entry.manager.waitForInFlightUploads();
            }
        }, { max: 4 });
    }
}
export function createConstantArtifactUploadManagerProvider(options: ArtifactUploadManagerOptions = {}) {
    const artifactsRootPath = options.artifactsRootPath ?? DEFAULT_ARTIFACTS_ROOT;
    const rootKind = options.rootKind ?? "local";
    return new ArtifactUploadManagerProvider({
        resolveRoot: () => ({ artifactsRootPath, rootKind }),
        validationOptions: options.validationOptions,
    });
}
