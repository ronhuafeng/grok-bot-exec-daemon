// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../shell-exec/dist/index.js");
export const configureRipgrepPath = dependency["J"];
export const configureSandboxPrereqs = dependency["St"];
export const isAllowAllNetworkByPolicy = dependency["_B"];
export const networkAllowAllPolicy = dependency["T6"];
export const mergeNetworkPolicies = dependency["fZ"];
export const mergePathsUnion = dependency["s9"];
export const getRipgrepBinaryPath = dependency["Ko"];
export const isSandboxSupported = dependency["K3"];
export const parseSandboxPolicyJson = dependency["$6"];
export const resolvePolicyPaths = dependency["l7"];
export const createDefaultTerminalExecutor = dependency["Fn"];
export const createNaiveTerminalExecutor = dependency["fi"];
