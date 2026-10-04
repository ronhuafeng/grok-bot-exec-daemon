import type { Context, Logger } from "../interop/contracts/context.js";
import type { JsonValue } from "../interop/contracts/protobuf-runtime.js";
import type { McpToolFileContent } from "../interop/contracts/mcp-services.js";
import type { SandboxPolicy, ValidatedSandboxPolicyInput } from "../interop/contracts/shell.js";
/** Validates only the shallow fields consumed from a parsed HTTP MCP tool file.
 * Native JSON.parse without a reviver establishes the JsonValue input provenance.
 * Unknown fields and schema keywords are retained, and valid values are not copied. */
export function assertHttpMcpToolsJson(value: JsonValue): asserts value is JsonValue & McpToolFileContent[] {
    if (!Array.isArray(value)) {
        throw new Error("Invalid HTTP MCP tools: expected array");
    }
    const entries: unknown[] = value;
    for (const [index, entry] of entries.entries()) {
        if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
            throw new Error(`Invalid HTTP MCP tool ${index}: expected object`);
        }
        const tool = entry as Record<string, unknown>;
        for (const field of ["serverIdentifier", "serverName", "name"] as const) {
            if (typeof tool[field] !== "string") {
                throw new Error(`Invalid HTTP MCP tool ${index}.${field}: expected string`);
            }
        }
        for (const field of ["qualifiedName", "description", "plugin", "marketplace", "pluginId", "marketplaceId"] as const) {
            if (tool[field] !== undefined && typeof tool[field] !== "string") {
                throw new Error(`Invalid HTTP MCP tool ${index}.${field}: expected string`);
            }
        }
        for (const field of ["arguments", "outputSchema"] as const) {
            const value = tool[field];
            if (value === undefined) {
                continue;
            }
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                throw new Error(`Invalid HTTP MCP tool ${index}.${field}: expected object schema`);
            }
            const schema = value as Record<string, unknown>;
            if (schema.type !== "object") {
                throw new Error(`Invalid HTTP MCP tool ${index}.${field}.type: expected object`);
            }
            if (schema.properties !== undefined &&
                (typeof schema.properties !== "object" || schema.properties === null || Array.isArray(schema.properties))) {
                throw new Error(`Invalid HTTP MCP tool ${index}.${field}.properties: expected object`);
            }
            if (schema.required !== undefined &&
                (!Array.isArray(schema.required) || !schema.required.every((item: unknown) => typeof item === "string"))) {
                throw new Error(`Invalid HTTP MCP tool ${index}.${field}.required: expected array of strings`);
            }
        }
    }
}
/** The preserved shell package's private pure validator, with type-only changes.
 * Keep its erased body identical; conversion and sanitization remain in the parser. */
export function validateSandboxPolicyJson(value: unknown): string | undefined {
    if (typeof value !== "object" || value === null) {
        return "Expected an object";
    }
    const json = value as Record<string, unknown>;
    // Validate type field
    if (json.type !== undefined) {
        const validTypes = ["insecure_none", "workspace_readwrite", "workspace_readonly"];
        if (typeof json.type !== "string" || !validTypes.includes(json.type)) {
            return `Invalid type: expected one of ${validTypes.join(", ")}`;
        }
    }
    // Validate boolean fields
    const booleanFields = [
        "networkAccess",
        "networkPolicyStrict",
        "disableTmpWrite",
        "enableSharedBuildCache",
        "captureDenies",
    ];
    for (const field of booleanFields) {
        if (json[field] !== undefined && typeof json[field] !== "boolean") {
            return `Invalid ${field}: expected boolean`;
        }
    }
    // Validate string fields
    const stringFields = ["debugOutputDir"];
    for (const field of stringFields) {
        if (json[field] !== undefined && typeof json[field] !== "string") {
            return `Invalid ${field}: expected string`;
        }
    }
    // Validate string array fields
    const stringArrayFields = [
        "additionalReadwritePaths",
        "additionalReadonlyPaths",
        "additionalReadPaths",
    ];
    for (const field of stringArrayFields) {
        if (json[field] !== undefined) {
            if (!Array.isArray(json[field])) {
                return `Invalid ${field}: expected array`;
            }
            const arr: unknown[] = json[field];
            if (!arr.every((item) => typeof item === "string")) {
                return `Invalid ${field}: expected array of strings`;
            }
        }
    }
    if (json.readBoundary !== undefined &&
        json.readBoundary !== "system" &&
        json.readBoundary !== "workspace") {
        return 'Invalid readBoundary: expected "system" or "workspace"';
    }
    // Validate networkPolicy
    if (json.networkPolicy !== undefined) {
        if (typeof json.networkPolicy !== "object" || json.networkPolicy === null) {
            return "Invalid networkPolicy: expected object";
        }
        const np = json.networkPolicy as Record<string, unknown>;
        if (np.default !== undefined && np.default !== "allow" && np.default !== "deny") {
            return 'Invalid networkPolicy.default: expected "allow" or "deny"';
        }
        if (np.allow !== undefined && !Array.isArray(np.allow)) {
            return "Invalid networkPolicy.allow: expected array";
        }
        if (np.deny !== undefined && !Array.isArray(np.deny)) {
            return "Invalid networkPolicy.deny: expected array";
        }
    }
    return undefined;
}
/** JSON ingress only: preserves validation, conversion, lease creation and existing logged fallback. */
export function createHttpMcpLeaseFromJson<TTool, TLease>(httpMcpToolsJson: string | undefined, ports: {
    globalContext: Context;
    execDaemonLogger: Pick<Logger, "info" | "error">;
    buildNamedMcpToolDefinitionFromFileContent(tool: McpToolFileContent): TTool;
    createLease(tools: TTool[]): TLease;
}): TLease | undefined {
    const { globalContext, execDaemonLogger, buildNamedMcpToolDefinitionFromFileContent, createLease } = ports;
    let httpMcpLease: TLease | undefined;
    if (httpMcpToolsJson) {
        try {
            const httpTools: JsonValue = JSON.parse(httpMcpToolsJson);
            assertHttpMcpToolsJson(httpTools);
            if (httpTools.length > 0) {
                httpMcpLease = createLease(httpTools.map(buildNamedMcpToolDefinitionFromFileContent));
                execDaemonLogger.info(globalContext, "Parsed HTTP MCP tools for file system discovery", {
                    toolCount: httpTools.length,
                    source: "file",
                });
            }
        }
        catch (error) {
            execDaemonLogger.error(globalContext, "Failed to parse HTTP MCP tools JSON", error);
        }
    }
    return httpMcpLease;
}
/** JSON ingress only: keeps disabled/default policies and the original catch boundary. */
export function resolveSandboxPolicyFromJson(sandboxPolicyJson: string | undefined, ports: {
    sandboxEnabled: boolean;
    workspacePath: string;
    globalContext: Context;
    execDaemonLogger: Pick<Logger, "error">;
    parseSandboxPolicyJson(input: ValidatedSandboxPolicyInput): SandboxPolicy;
    resolvePolicyPaths(policy: SandboxPolicy, workspacePath: string): SandboxPolicy;
}): SandboxPolicy {
    const { sandboxEnabled, workspacePath, globalContext, execDaemonLogger, parseSandboxPolicyJson, resolvePolicyPaths } = ports;
    if (!sandboxEnabled) {
        return { type: "insecure_none" };
    }
    if (sandboxPolicyJson !== undefined) {
        try {
            const sandboxPolicyValue: JsonValue = JSON.parse(sandboxPolicyJson);
            const sandboxPolicyValidationError = validateSandboxPolicyJson(sandboxPolicyValue);
            if (sandboxPolicyValidationError !== undefined) {
                throw new Error(sandboxPolicyValidationError);
            }
            // Native JSON.parse without a reviver establishes JSON provenance;
            // the exact preserved validator above establishes the accepted fields.
            const sandboxPolicy = parseSandboxPolicyJson(sandboxPolicyValue as ValidatedSandboxPolicyInput);
            return resolvePolicyPaths(sandboxPolicy, workspacePath);
        }
        catch (error) {
            execDaemonLogger.error(globalContext, "Failed to parse sandbox policy, using default policy", { error });
        }
    }
    return {
        type: "workspace_readwrite",
    };
}
