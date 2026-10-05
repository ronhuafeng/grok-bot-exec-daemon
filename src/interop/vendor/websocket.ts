// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/ws@8.21.3/node_modules/ws/wrapper.mjs");
export const WebSocketServer = dependency["zu"];
