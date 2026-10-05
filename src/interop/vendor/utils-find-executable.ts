// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../utils/dist/find-executable.js");
export const findActualExecutable = dependency["E"];
