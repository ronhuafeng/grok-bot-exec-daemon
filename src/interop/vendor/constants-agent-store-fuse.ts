// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../constants/dist/agent-store-fuse.js");
export const AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE = dependency["Xb"];
export const AGENT_STORE_FUSE_PID_FILE = dependency["HH"];
export const AGENT_STORE_FUSE_DISPATCH_WEDGE_REPORT_PATH = dependency["rM"];
export const AGENT_STORE_FUSE_RELAUNCH_REASON_PATH = dependency["YE"];
