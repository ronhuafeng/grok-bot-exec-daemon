// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/@connectrpc+connect@1.6.1_patch_hash=c9c7616ccfc0246b19c6537f56676d8501713cb6c94b440d13_c9bdc997d82622067cc922804d7b4f50/node_modules/@connectrpc/connect/dist/esm/router.js");
export const createConnectRouter = dependency["k"];
