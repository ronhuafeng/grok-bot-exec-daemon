import type { JsonValue } from "./protobuf-runtime.js";
import type { McpConfig } from "./mcp.js";
/** Raw JSON ingestion, not an assertion that the manifest entries are valid.
 * The preserved loader rejects malformed source fields before constructing identifiers. */
export type RawCloudPluginManifest = JsonValue;
export interface PluginSkill {
  path: string;
  name: string;
  description?: string;
  globs?: string[];
  alwaysApply: boolean;
  content: string;
  environments?: string[];
  disabledEnvironments?: string[];
}
export interface PluginAgent {
  path: string;
  name: string;
  description?: string;
  tools?: string[];
  model: string;
  prompt: string;
  permissionMode: "readonly" | "default";
}
export interface PluginCommand { path: string; name: string; description?: string; argumentHint?: string; content: string; }
export interface PluginContent {
  identifier: { source: "cursor-first-party" | "cursor-third-party"; sourceInfo: { name: string; version: string; marketplace: string } };
  installPath: string;
  displayName?: string;
  description?: string;
  authorName?: string;
  logoUrl?: string;
  version?: string;
  homepage?: string;
  repository?: string;
  skills: PluginSkill[];
  rules: PluginSkill[];
  agents: PluginAgent[];
  commands: PluginCommand[];
  capabilities: "canvas"[];
  mcpConfig?: McpConfig & { mcpServerSourcePaths?: Record<string, string> };
  /** Hook config is only forwarded at this boundary; sourcePath is the owned field. */
  hooks?: { config: object; sourcePath?: string } | { error: { source: string; message: string } };
}
export interface CursorPluginsModule {
  n8G: "plugins/cache";
  Zc4(manifest: RawCloudPluginManifest, cacheRoot: string, options?: { log?: (message: string) => void }): Promise<PluginContent[]>;
}
declare module "../modules.js" {
  interface ExternalModules { "../cursor-plugins/dist/index.js": CursorPluginsModule; }
}
