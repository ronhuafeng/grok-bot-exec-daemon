import type { Context, LoggerBackend } from "./context.js";
import type { McpClient, McpConfig, McpServerConfig, McpCallToolResult, ElicitationProvider, JsonObject, McpTool } from "./mcp.js";
import type { NamedMcpTool, McpStateAccessor } from "./request-context.js";
import type { agent_v1_McpFileSystemOptions, agent_v1_McpInstructions } from "./protobuf-generated.js";
export interface Disposable { dispose(): void; }
export interface ElicitationProviderFactory { createProvider(serverName: string, toolName: string, toolCallId: string | undefined): ElicitationProvider; }
export interface McpToolSet {
  getTools(): NamedMcpTool[];
  execute(name: string, args: JsonObject, toolCallId?: string, elicitationFactory?: ElicitationProviderFactory): Promise<McpCallToolResult>;
}
export interface McpManager {
  getClients(): Record<string, McpClient>;
  getClient(name: string): McpClient | undefined;
  setClient(name: string, client: McpClient): void;
  deleteClient(name: string): void;
  closeAllClients(): Promise<void>;
  onDidChange(listener: () => void): () => void;
  getToolSet(ctx: Context): Promise<McpToolSet>;
  getInstructions(ctx: Context): Promise<agent_v1_McpInstructions[]>;
}
export interface McpLeaseChange { serverIdentifiers?: readonly string[]; reason?: string; }
export interface McpLease {
  getTools(ctx: Context): Promise<NamedMcpTool[]>;
  getToolsForServers(ctx: Context, identifiers: readonly string[]): Promise<NamedMcpTool[]>;
  getClients(ctx: Context): Promise<Record<string, McpClient>>;
  getClient(ctx: Context, name: string): Promise<McpClient | undefined>;
  getInstructions(ctx: Context): Promise<agent_v1_McpInstructions[]>;
  getToolSet(ctx: Context): Promise<McpToolSet>;
  onDidChange(listener: (event: McpLeaseChange | undefined) => void): Disposable;
}
export interface ManagerMcpLease extends McpLease {
  reconcileSelection(ctx: Context, changes: { added: readonly string[]; removed: readonly string[] }, loadClient: (ctx: Context, identifier: string) => Promise<McpClient>): Promise<void>;
}
export interface OAuthTokens { access_token: string; token_type: string; refresh_token?: string; expires_in?: number; scope?: string; }
export interface OAuthClientInformation { client_id: string; client_secret?: string; redirect_uris?: string[]; }
export interface ScopedMcpTokenStorage {
  loadTokens(): Promise<OAuthTokens | undefined>;
  saveTokens(tokens: OAuthTokens): Promise<void>;
  loadClientInformation(): Promise<OAuthClientInformation | undefined>;
  saveClientInformation(client: OAuthClientInformation): Promise<void>;
}
export interface McpMiddleware {
  load(ctx: Context, serverName: string, config: McpServerConfig, configPath: string, next: (ctx: Context, config: McpServerConfig) => Promise<McpClient>): Promise<McpClient>;
}
export interface McpFileSystemWriter {
  getMcpFileSystemOptions(ctx: Context, options?: { timeoutMs?: number }): Promise<agent_v1_McpFileSystemOptions | undefined>;
  dispose(): void;
}
export interface ObservableMcpStateAccessor extends McpStateAccessor {
  refreshNow(ctx: Context): Promise<void>;
  onDidChange(listener: () => void): Disposable;
  dispose(): void;
}
export interface McpToolFileContent {
  serverIdentifier: string; serverName: string; name: string; qualifiedName?: string;
  description?: string; arguments?: McpTool["inputSchema"]; outputSchema?: McpTool["outputSchema"];
  plugin?: string; marketplace?: string; pluginId?: string; marketplaceId?: string;
}
declare module "./mcp.js" {
  interface McpAgentExecModule {
    Vh: { parse(input: unknown): McpConfig };
    N5(config: McpConfig, runtimeLookup?: (name: string) => string | undefined): McpConfig;
    i9: new (clients: Record<string, McpClient>, elicitationFactory?: ElicitationProviderFactory) => McpManager;
    uz: new (manager: McpManager) => ManagerMcpLease;
    qV(ctx: Context, serverName: string, config: McpServerConfig, tokenStorage: ScopedMcpTokenStorage, settings?: { middlewares: McpMiddleware[]; configPath: string }, authRedirectUrlGenerator?: (serverName: string) => string): Promise<McpClient>;
    S2(error: unknown): string | undefined;
  }
}
declare module "./local-exec.js" {
  interface LocalExecModule {
    J2t: new (tools: NamedMcpTool[], instructions?: agent_v1_McpInstructions[]) => McpLease;
    cND: new (leases: McpLease[]) => McpLease;
    aZ7: new (lease: McpLease) => ObservableMcpStateAccessor;
    x7h: new (lease: McpLease, projectDir: string, options?: { loggerBackend?: LoggerBackend; debounceMs?: number; exposeVirtualMcpAuthTool?: boolean; alwaysExposeVirtualMcpAuthTool?: boolean }) => McpFileSystemWriter;
  }
}
declare module "./agent-exec.js" {
  interface AgentExecModule { uvp(tool: McpToolFileContent): NamedMcpTool; }
}
