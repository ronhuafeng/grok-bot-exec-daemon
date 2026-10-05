// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../canvas-server/dist/canvas-path-validation.js");
export const classifyStoreCanvasSavePath = dependency["K3"];
