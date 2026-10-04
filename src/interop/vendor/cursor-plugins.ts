// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../cursor-plugins/dist/index.js");
export const PLUGINS_CACHE_ROOT = dependency["n8G"];
export const loadPluginsFromCloudManifest = dependency["Zc4"];
