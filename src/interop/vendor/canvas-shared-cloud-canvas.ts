// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../canvas-shared/dist/cloud-canvas.js");
export const CLOUD_CANVAS_SOURCE_MAX_BYTES = dependency["Ur"];
export const isGzipMagic = dependency["IR"];
export const CLOUD_CANVAS_DATA_BASENAME = dependency["n_"];
export const CLOUD_CANVAS_PAYLOAD_MAX_BYTES = dependency["NH"];
export const CLOUD_CANVAS_MANIFEST_BASENAME = dependency["_g"];
export const parseCloudCanvasManifest = dependency["Yz"];
export const CLOUD_CANVAS_BUNDLE_BASENAME = dependency["Rj"];
export const CLOUD_CANVAS_MANIFEST_VERSION = dependency["EC"];
export const CLOUD_CANVAS_MANIFEST_MAX_BYTES = dependency["Wo"];
