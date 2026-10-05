// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/@opentelemetry+sdk-node@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-node/build/src/index.js");
export const NodeSDK = dependency["P"];
