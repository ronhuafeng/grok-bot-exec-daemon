// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../utils/dist/oom-score-adj.js");
export const resetOomScoreAdjBeforeExec = dependency["W"];
