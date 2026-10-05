
import type { Context } from "../interop/contracts/context.js";
import type { McpClient, McpClientState, McpServerConfig } from "../interop/contracts/mcp.js";

export class LazyMcpClient {
    serverName: string;
    config: McpServerConfig;
    loadClient: (ctx: Context) => Promise<McpClient>;
    onLoaded: () => void;
    timeoutMs: number;
    client: McpClient | undefined;
    inFlight: Promise<McpClient> | undefined;
    error: string | undefined;
    closed = false;
    constructor(serverName: string, config: McpServerConfig, loadClient: (ctx: Context) => Promise<McpClient>, onLoaded: () => void, timeoutMs: number) {
        this.serverName = serverName;
        this.config = config;
        this.loadClient = loadClient;
        this.onLoaded = onLoaded;
        this.timeoutMs = timeoutMs;
    }
    async ensureLoaded(ctx: Context): Promise<McpClient> {
        if (this.closed) {
            throw new Error(`MCP server is closed: ${this.serverName}`);
        }
        if (this.client !== undefined) {
            return this.client;
        }
        if (this.inFlight === undefined) {
            const load = this.loadClient(ctx);
            let timedOut = false;
            let cleanedUp = false;
            const closeLoadedClient = async (client: McpClient) => {
                if (!cleanedUp) {
                    cleanedUp = true;
                    await client.close?.();
                }
            };
            const timeout = new Promise<never>((_resolve, reject) => {
                const handle = setTimeout(() => {
                    timedOut = true;
                    reject(new Error(`MCP server load timed out after ${this.timeoutMs}ms: ${this.serverName}`));
                }, this.timeoutMs);
                load.finally(() => clearTimeout(handle)).catch(() => { });
            });
            load
                .then(async (client) => {
                if (timedOut || this.closed) {
                    await closeLoadedClient(client);
                }
            })
                .catch(() => { });
            this.inFlight = Promise.race([load, timeout])
                .then(async (client) => {
                if (this.closed) {
                    await closeLoadedClient(client);
                    throw new Error(`MCP server is closed: ${this.serverName}`);
                }
                this.client = client;
                this.error = undefined;
                this.onLoaded();
                return client;
            })
                .catch((error: unknown) => {
                this.error = error instanceof Error ? error.message : String(error);
                throw error;
            })
                .finally(() => {
                this.inFlight = undefined;
            });
        }
        return await this.inFlight;
    }
    async getTools(ctx: Context) {
        return this.client?.getTools(ctx) ?? [];
    }
    async callTool(ctx: Context, name: string, args: Parameters<McpClient["callTool"]>[2], toolCallId: string | undefined, elicitationProvider: Parameters<McpClient["callTool"]>[4]) {
        const client = await this.ensureLoaded(ctx);
        return await client.callTool(ctx, name, args, toolCallId, elicitationProvider);
    }
    async getInstructions(ctx: Context) {
        return await this.client?.getInstructions(ctx);
    }
    async getState(ctx: Context): Promise<McpClientState> {
        if (this.client !== undefined) {
            return await this.client.getState(ctx);
        }
        // Prefer loading over a stale error while a retry is in flight so kick-only
        // listings and status follow-ups see the active load instead of the prior
        // failure.
        if (this.inFlight !== undefined) {
            return { kind: "loading" };
        }
        if (this.error !== undefined) {
            return { kind: "error", message: this.error };
        }
        return { kind: "loading" };
    }
    async listResources(ctx: Context) {
        return await (await this.ensureLoaded(ctx)).listResources(ctx);
    }
    async readResource(ctx: Context, args: Parameters<McpClient["readResource"]>[1]) {
        return await (await this.ensureLoaded(ctx)).readResource(ctx, args);
    }
    async listPrompts(ctx: Context) {
        return (await this.client?.listPrompts(ctx)) ?? [];
    }
    async getPrompt(ctx: Context, name: string, args: Parameters<McpClient["getPrompt"]>[2]) {
        return await (await this.ensureLoaded(ctx)).getPrompt(ctx, name, args);
    }
    async close() {
        this.closed = true;
        await this.inFlight?.catch(() => { });
        await this.client?.close?.();
        this.client = undefined;
    }
}
