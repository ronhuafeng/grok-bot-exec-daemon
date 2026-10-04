// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../mcp-agent-exec/dist/index.js");
export const expandLocalEnvMap = dependency["Ds"];
export const mcpConfigSchema = dependency["Vh"];
export const expandMcpConfigForCloudRuntime = dependency["N5"];
export const McpManager = dependency["i9"];
export const loadServer = dependency["qV"];
export const getMcpStdioStderrTail = dependency["S2"];
export const ManagerMcpLease = dependency["uz"];
