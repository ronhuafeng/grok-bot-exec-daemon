// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../context/dist/otel.js");
export const reportEvent = dependency["HF"];
export const withSpan = dependency["fR"];
export const getSpan = dependency["fU"];
export const withInheritableAttribute = dependency["Mf"];
export const createContextFromSpanContext = dependency["V5"];
export const SPAN_KEY = dependency["Rm"];
