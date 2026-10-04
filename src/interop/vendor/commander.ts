// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/@commander-js+extra-typings@14.0.0_commander@15.0.0/node_modules/@commander-js/extra-typings/esm.mjs");
export const Command = dependency["uB"];
export const Option = dependency["c$"];
