// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../secrets-exec/dist/index.js");
export const SecretRedactor = dependency["pE"];
export const RedactingShellCoreExecutor = dependency["sR"];
export const RedactingResourceAccessor = dependency["DA"];
