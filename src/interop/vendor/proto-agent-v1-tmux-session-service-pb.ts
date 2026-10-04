// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../proto/dist/generated/agent/v1/tmux_session_service_pb.js");
export const TmuxSession = dependency["pk"];
export const TmuxSessionKind = dependency["pz"];
