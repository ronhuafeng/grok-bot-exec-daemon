// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../utils/dist/workload-spawn.js");
export const spawnWorkload = dependency["D9"];
export const getWorkloadPlacement = dependency["NG"];
export const WORKLOAD_CGROUP_ENV_VAR = dependency["ZH"];
