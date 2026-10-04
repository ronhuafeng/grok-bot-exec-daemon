// Named exports of the pinned installed dependency. See docs/provenance.md.
import { loadVendorModule } from "./loader.js";

const dependency = loadVendorModule("../agent-exec/dist/index.js");
export const SimpleControlledExecManager = dependency["n6O"];
export const EXEC_CONVERSATION_ID_HEADER = dependency["S5q"];
export const execConversationIdKey = dependency["FmW"];
export const EXEC_REQUEST_ID_HEADER = dependency["sMm"];
export const execRequestIdKey = dependency["dxK"];
export const EXEC_BROWSER_OPERATION_SOURCE_HEADER = dependency["LXI"];
export const EXEC_BROWSER_OPERATION_SOURCES = dependency["Kwv"];
export const execBrowserOperationSourceKey = dependency["$mb"];
export const EXEC_HOOK_CONVERSATION_ID_HEADER = dependency["OIF"];
export const execHookConversationIdKey = dependency["WWy"];
export const EXEC_HOOK_GENERATION_ID_HEADER = dependency["TpB"];
export const execHookGenerationIdKey = dependency["JT2"];
export const EXEC_HOOK_MODEL_HEADER = dependency["AnR"];
export const execHookModelKey = dependency["dBo"];
export const EXEC_HOOK_WORKSPACE_ROOTS_HEADER = dependency["s0I"];
export const execHookWorkspaceRootsKey = dependency["IjH"];
export const shellExecutorResource = dependency["qkk"];
export const mcpExecutorResource = dependency["Yib"];
export const shouldIncludeAgentSkillInRequestContext = dependency["X_3"];
export const stripAgentSkillContentForRequestContext = dependency["tx6"];
export const shellStreamExecutorResource = dependency["wve"];
export const buildNamedMcpToolDefinitionFromFileContent = dependency["uvp"];
export const grepExecutorResource = dependency["u8v"];
export const redactedReadExecutorResource = dependency["Mfc"];
export const readMcpResourceExecutorResource = dependency["mlu"];
