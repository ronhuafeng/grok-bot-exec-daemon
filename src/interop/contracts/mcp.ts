import type { Context } from "./context.js";
import type { JsonValue } from "./protobuf-runtime.js";
/** Exact transport alternatives from the retained mcp-config Zod schema. */
export interface McpStdioServerConfig {
  type?: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  envFile?: string;
  cwd?: string;
  enabledTools?: string[];
}
export interface McpRemoteServerConfig {
  type?: "http" | "sse";
  url: string;
  headers?: Record<string, string>;
  auth?: { CLIENT_ID: string; CLIENT_SECRET?: string; scopes?: string[] };
  tls?: { caBundle: string };
  placement?: "server" | "client";
  enabledTools?: string[];
}
export type McpServerConfig = McpStdioServerConfig | McpRemoteServerConfig;
export interface McpConfig { mcpServers: Record<string, McpServerConfig>; }
export type JsonObject = { [key: string]: JsonValue };
export interface McpAnnotations { audience?: ("user" | "assistant")[]; priority?: number; lastModified?: string; }
export interface McpTextContent { type: "text"; text: string; annotations?: McpAnnotations; _meta?: JsonObject; }
export interface McpImageContent { type: "image"; data: string; mimeType: string; annotations?: McpAnnotations; _meta?: JsonObject; }
export interface McpAudioContent { type: "audio"; data: string; mimeType: string; annotations?: McpAnnotations; _meta?: JsonObject; }
export type McpResourceContents = { uri: string; mimeType?: string; _meta?: JsonObject } & ({ text: string } | { blob: string });
export interface McpResource { uri: string; name: string; title?: string; description?: string; mimeType?: string; size?: number; annotations?: McpAnnotations; _meta?: JsonObject; }
export type McpContent = McpTextContent | McpImageContent | McpAudioContent | (McpResource & { type: "resource_link" }) | { type: "resource"; resource: McpResourceContents; annotations?: McpAnnotations; _meta?: JsonObject };
export interface McpTool {
  name: string;
  title?: string;
  description?: string;
  inputSchema: { type: "object"; properties?: JsonObject; required?: string[] };
  outputSchema?: { type: "object"; properties?: JsonObject; required?: string[] };
  annotations?: { title?: string; readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
  _meta?: JsonObject;
}
export interface McpPrompt { name: string; description?: string; arguments?: { name: string; description?: string; required?: boolean }[]; }
export interface McpPromptResult { messages: { role: "user" | "assistant"; content: (McpTextContent | McpImageContent)[] }[]; }
export interface McpCallToolResult { content: McpContent[]; isError: boolean; structuredContent?: JsonObject; }
export interface ElicitationProvider {
  elicit(request: { message: string; requestedSchema: { type: "object"; properties: JsonObject; required?: string[] } }): Promise<{ action: "accept" | "decline" | "cancel"; content?: JsonObject }>;
}
export type McpClientState = { kind: "ready" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "requires_authentication"; url: string; callback(code: string): Promise<void> };
export interface McpClient {
  readonly serverName: string;
  readonly config: McpServerConfig;
  getTools(ctx: Context): Promise<McpTool[]>;
  callTool(ctx: Context, name: string, args: JsonObject, toolCallId: string | undefined, elicitationProvider: ElicitationProvider | undefined): Promise<McpCallToolResult>;
  getInstructions(ctx: Context): Promise<string | undefined>;
  getState(ctx: Context): Promise<McpClientState>;
  listResources(ctx: Context): Promise<{ resources: McpResource[] }>;
  readResource(ctx: Context, args: { uri: string }): Promise<{ contents: McpResourceContents[] }>;
  listPrompts(ctx: Context): Promise<McpPrompt[]>;
  getPrompt(ctx: Context, name: string, args: Record<string, string> | undefined): Promise<McpPromptResult>;
  close?(): Promise<void>;
}
export interface McpAgentExecModule {
  Ds(raw: Record<string, string> | undefined, runtimeLookup: (name: string) => string | undefined): Record<string, string>;
}
declare module "../modules.js" {
  interface ExternalModules { "../mcp-agent-exec/dist/index.js": McpAgentExecModule; }
}
