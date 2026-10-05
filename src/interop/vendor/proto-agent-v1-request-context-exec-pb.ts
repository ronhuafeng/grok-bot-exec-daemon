// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../proto/dist/generated/agent/v1/request_context_exec_pb.js");
export const RequestContextArgs = dependency["_K"];
export const RequestContext = dependency["bb"];
export const RequestContextResult = dependency["_G"];
export const RequestContextSuccess = dependency["yW"];
export const RequestContextError = dependency["nf"];
