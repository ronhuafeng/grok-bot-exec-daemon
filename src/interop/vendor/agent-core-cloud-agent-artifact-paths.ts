// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../agent-core/dist/cloud-agent-artifact-paths.js");
export const AGENT_STORE_INTERNAL_ROOT_DIRECTORY = dependency["XJ"];
export const toAgentStoreArtifactPath = dependency["rK"];
export const toArtifactRelativePath = dependency["vR"];
export const fromArtifactRelativePath = dependency["kp"];
export const fromAgentStoreArtifactPath = dependency["KJ"];
export const AGENT_STORE_ARTIFACTS_PREFIX = dependency["hG"];
export const normalizeCloudAgentArtifactAbsolutePath = dependency["Yk"];
