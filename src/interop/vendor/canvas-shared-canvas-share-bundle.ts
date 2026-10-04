// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../canvas-shared/dist/canvas-share-bundle.js");
export const canvasSourceBasenameToShareBundleFileName = dependency["pZ"];
export const agentCanvasPreviewPrefix = dependency["u3"];
export const isCanvasShareBundleFileName = dependency["VY"];
export const canvasShareBundleFileNameToSourceBasename = dependency["P4"];
