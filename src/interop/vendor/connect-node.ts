// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/@connectrpc+connect-node@1.6.1_patch_hash=5af812e0fa98d57d4268dc76827544673e2390a1c7193_62a3b3b4c8b16dc586e31982becdd4cf/node_modules/@connectrpc/connect-node/dist/esm/index.js");
export const connectNodeAdapter = dependency["aO"];
export const compressionGzip = dependency["JY"];
