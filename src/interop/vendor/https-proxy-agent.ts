// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js");
export const HttpsProxyAgent = dependency["HttpsProxyAgent"];
