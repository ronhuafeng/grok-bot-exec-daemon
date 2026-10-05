// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../proto/dist/generated/agent/v1/shell_exec_pb.js");
export const ShellAbortReason = dependency["Lv"];
export const ShellOomKill_Kind = dependency["R_"];
export const ShellOomKill = dependency["iH"];
