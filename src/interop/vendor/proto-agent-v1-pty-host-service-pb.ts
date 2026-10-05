// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../proto/dist/generated/agent/v1/pty_host_service_pb.js");
export const PtyInfo = dependency["I$"];
export const PtyEvent = dependency["G"];
export const PtyData = dependency["SE"];
export const PtyExited = dependency["h2"];
