// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../../node_modules/.pnpm/@opentelemetry+exporter-trace-otlp-proto@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/exporter-trace-otlp-proto/build/esm/platform/node/OTLPTraceExporter.js");
export const OTLPTraceExporter = dependency["Q"];
