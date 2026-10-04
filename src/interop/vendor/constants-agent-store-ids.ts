// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../constants/dist/agent-store-ids.js");
export const AGENT_STORE_MOUNT_ROOT = dependency["f"];
export const CLOUD_CANVAS_SOURCE_BASENAME = dependency["EN"];
export const CANVAS_STORE_PERSIST_ROOTS = dependency["ur"];
