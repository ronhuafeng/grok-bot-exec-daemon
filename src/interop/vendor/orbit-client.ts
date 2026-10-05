// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../orbit-client/dist/index.js");
export const createOrbitOperationReporter = dependency["nz"];
