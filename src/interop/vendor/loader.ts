import { createRequire } from "node:module";
import type { ExternalModules, VendorBindings } from "../modules.js";

interface Capsule {
  readonly runtimeRoot: string;
  loadVendor(id: string): unknown;
  loadPrivate(name: "server" | "setup" | "tracing"): unknown;
}

const value: unknown = createRequire(import.meta.url)("../../../vendor.cjs");
if (
  typeof value !== "object" || value === null ||
  !("runtimeRoot" in value) || typeof value.runtimeRoot !== "string" ||
  !("loadVendor" in value) || typeof value.loadVendor !== "function" ||
  !("loadPrivate" in value) || typeof value.loadPrivate !== "function"
) {
  throw new TypeError("Invalid generated vendor capsule");
}

// The pinned extractor owns these foreign signatures. Keep unknown values and
// source-backed assertions at this one boundary, rather than throughout features.
const capsule = value as Capsule;
export const runtimeRoot = capsule.runtimeRoot;

type VendorModuleId = Exclude<keyof ExternalModules, `node:${string}` | `./src/${string}`>;
export function loadVendorModule<K extends VendorModuleId>(id: K): ExternalModules[K] {
  return capsule.loadVendor(id) as ExternalModules[K];
}

type PrivateModules = {
  server: VendorBindings["./src/server.ts"];
  setup: VendorBindings["./src/setup.ts"];
  tracing: VendorBindings["./src/tracing.ts"];
};
export function loadPrivateModule<K extends keyof PrivateModules>(name: K): PrivateModules[K] {
  return capsule.loadPrivate(name) as PrivateModules[K];
}
