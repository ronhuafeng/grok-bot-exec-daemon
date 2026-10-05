// Exact retained private values from the installed tracing dependency closure.
import { loadPrivateModule } from "./loader.js";

const dependency = loadPrivateModule("tracing");
export const resourceFromAttributes = dependency.resourceFromAttributes;
