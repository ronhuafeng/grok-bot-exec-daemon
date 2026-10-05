// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../utils/dist/repo-url.js");
export const buildRepoUrlForAuthRefresh = dependency["Wo"];
export const trimRemotePath = dependency["A9"];
export const parseOriginRepoCloneUrlParts = dependency["UG"];
export const normalizeRepoUrlForAuthLookup = dependency["gT"];
export const getBoundedRepoAuthPathname = dependency["Ol"];
