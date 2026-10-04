// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../git-core/dist/generated-file-detection.js");
export const checkFilesGenerated = dependency["zM"];
