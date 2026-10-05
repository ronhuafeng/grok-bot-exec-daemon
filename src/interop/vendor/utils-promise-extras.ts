// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../utils/dist/promise-extras.js");
export const asyncMapValues = dependency["PH"];
export const asyncMapSettledValues = dependency["up"];
export const withTimeout = dependency["wj"];
export const TimeoutError = dependency["MU"];
