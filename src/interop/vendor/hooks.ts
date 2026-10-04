// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../hooks/dist/index.js");
export const getCommandHookPayloadTransport = dependency["S6"];
