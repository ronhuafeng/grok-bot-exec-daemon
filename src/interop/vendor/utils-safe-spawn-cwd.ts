// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../utils/dist/safe-spawn-cwd.js");
export const SPAWN_CWD_HOP_ENV_VAR = dependency["Bn"];
export const isSpawnCwdHopActive = dependency["$Y"];
export const SPAWN_CWD_HOP_USED_EVENT = dependency["yo"];
export const spawnCwdHopLogFields = dependency["iA"];
export const isSpawnCwdHopCdFailure = dependency["wz"];
export const SPAWN_CWD_HOP_CD_FAILED_EVENT = dependency["Gq"];
export const isSpawnCwdHopCdFailedError = dependency["fK"];
