// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../context/dist/logger.js");
export const createLogger = dependency["h"];
export const loggerKey = dependency["_O"];
