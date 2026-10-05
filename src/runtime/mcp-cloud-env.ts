import { expandLocalEnvMap } from "../interop/vendor/mcp-agent-exec.js";
import { parseCommaSeparatedNames } from "./comma-separated-names.js";
import { SANDBOX_ENV_RESTORE_ENV_VAR } from "./managed-environment.js";
import { ALWAYS_REDACTED_ENV_SECRET_NAMES, CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR } from "./secretRedaction.js";
import type { McpConfig, McpServerConfig } from "../interop/contracts/mcp.js";

/**
 * Cursor credentials that authenticate the daemon itself. Cursor issued them to
 * the daemon rather than the user provisioning them, so they are not the
 * workload's to hand out.
 */
export const WITHHELD_CREDENTIAL_NAMES = ALWAYS_REDACTED_ENV_SECRET_NAMES;
/**
 * Never forwarded to a stdio MCP server, whatever the value.
 *
 * {@link SANDBOX_ENV_RESTORE_ENV_VAR} is here because it serializes the whole
 * managed environment as shell exports, so forwarding it would restate every
 * credential withheld above under a name that does not look like a credential.
 * It is also purely a daemon-internal shell-snapshot mechanism, so an MCP child
 * loses nothing by not having it.
 */
export const DAEMON_ONLY_ENV_NAMES = new Set<string>([
    ...WITHHELD_CREDENTIAL_NAMES,
    SANDBOX_ENV_RESTORE_ENV_VAR,
]);
export function createCloudMcpInjectedSecretAccessor(args: { secretNamesEnv?: string; secretAccessor: (name: string) => string | undefined }) {
    return (name: string) => {
        const allowedNames = new Set<string>(parseCommaSeparatedNames(args.secretNamesEnv ?? process.env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR]));
        return allowedNames.has(name) ? args.secretAccessor(name) : undefined;
    };
}
/**
 * Expands only the `env` map of one command-based (stdio) server; remote /
 * env-less servers are returned unchanged.
 */
export function expandCloudMcpStdioServerEnvOnly(serverConfig: McpServerConfig, runtimeLookup: (name: string) => string | undefined): McpServerConfig {
    if (!("command" in serverConfig) || serverConfig.env === undefined) {
        return serverConfig;
    }
    return {
        ...serverConfig,
        env: expandLocalEnvMap(serverConfig.env, runtimeLookup),
    };
}
/**
 * Layers the daemon's own environment underneath one stdio server's `env`;
 * remote / non-command servers are returned unchanged.
 *
 * Cloud stdio MCP servers run inside the agent's container, so users expect
 * them to see what the agent's shell commands see. The MCP SDK instead spawns
 * stdio children with a minimal default environment plus whatever the server
 * config spells out, so environment variables provisioned onto the pod never
 * reach a server that did not name them one by one.
 *
 * Explicit `env` entries still win. {@link WITHHELD_CREDENTIAL_NAMES} are held
 * back, as is any variable carrying one of their values, so the daemon's own
 * credentials cannot reach a server under either their own name or another.
 *
 * Apply this AFTER {@link expandCloudMcpStdioServerEnvOnly}: expansion must
 * only ever run over values the MCP config actually spelled out, never over
 * inherited values that happen to contain `${...}`.
 */
export function withInheritedExecDaemonEnv(serverConfig: McpServerConfig, processEnv = process.env) {
    if (!("command" in serverConfig)) {
        return serverConfig;
    }
    // Filtering by name alone is not enough: a variable that embeds a withheld
    // credential hands it over just the same, whatever that variable is called.
    // Dropping carriers by value covers the aggregates that exist today and any
    // added later. A degenerate credential value would withhold far more than
    // intended, so skip empty ones; over-withholding otherwise is the safe way to
    // be wrong.
    const withheldValues = WITHHELD_CREDENTIAL_NAMES.map((name) => processEnv[name]).filter((value): value is string => value !== undefined && value !== "");
    const inheritedEnv: Record<string, string> = {};
    for (const [name, value] of Object.entries(processEnv)) {
        if (value === undefined || DAEMON_ONLY_ENV_NAMES.has(name)) {
            continue;
        }
        if (withheldValues.some((withheld) => value.includes(withheld))) {
            continue;
        }
        inheritedEnv[name] = value;
    }
    return {
        ...serverConfig,
        env: { ...inheritedEnv, ...serverConfig.env },
    };
}
export function expandCloudMcpStdioEnvOnly(config: McpConfig, runtimeLookup: (name: string) => string | undefined): McpConfig {
    return {
        mcpServers: Object.fromEntries(Object.entries(config.mcpServers).map(([serverName, serverConfig]) => [
            serverName,
            expandCloudMcpStdioServerEnvOnly(serverConfig, runtimeLookup),
        ])),
    };
}
