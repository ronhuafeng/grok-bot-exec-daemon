import { loadVendorModule } from "./loader.js";
const dependency = loadVendorModule("../canvas-server/dist/canvas-share-artifact.js");
export const buildCanvasShareArtifactFromSource = dependency.buildCanvasShareArtifactFromSource;
