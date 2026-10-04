// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../utils/dist/writable-iterable.js");
export const createWritableIterable = dependency["Jt"];
