// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../proto/dist/generated/agent/v1/exec_pb.js");
export const ExecClientMessage = dependency["yT"];
export const ExecClientControlMessage = dependency["$Y"];
