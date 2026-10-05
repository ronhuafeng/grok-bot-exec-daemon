import { loadVendorModule } from "./loader.js";
/** Preserve the installed snapshot's missing-package resolution result. This is
 * intentionally not Node's live package resolver and does not enable macOS. */
export function resolveUnbundledPtyModule(modulePath: string): never {
  return loadVendorModule("./src sync recursive").resolve(modulePath);
}
