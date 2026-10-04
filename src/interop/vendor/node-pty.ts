// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/@lydell+node-pty@1.1.0_patch_hash=8cc7c6b3b59e47c0436b0f2bbb89cec1ced0f8ac0beadc41a2d07016bef0ea46/node_modules/@lydell/node-pty/index.js");
export const spawn = dependency["cH"];
