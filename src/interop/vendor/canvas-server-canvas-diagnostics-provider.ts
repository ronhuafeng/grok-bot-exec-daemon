// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../canvas-server/dist/canvas-diagnostics-provider.js");
export const createCanvasDiagnosticsProvider = dependency["WT"];
