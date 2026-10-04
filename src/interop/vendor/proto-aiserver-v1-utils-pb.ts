// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../proto/dist/generated/aiserver/v1/utils_pb.js");
export const FileDiff = dependency["QP"];
export const FileDiff_Chunk = dependency["Ei"];
export const GitDiff = dependency["o$"];
export const GitDiff_DiffType = dependency["Wf"];
export const GetDiffRequest_OutputFormat = dependency["ek"];
export const GetDiffResponse = dependency["df"];
