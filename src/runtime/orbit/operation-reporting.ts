import nodeCrypto from "node:crypto";
import { execConversationIdKey, execRequestIdKey, execBrowserOperationSourceKey, EXEC_BROWSER_OPERATION_SOURCES, shellExecutorResource, mcpExecutorResource } from "../../interop/vendor/agent-exec.js";
import { operationOutcome } from "./browser-operation.js";
import { recognizePlaywrightMcpOperation } from "./playwright-mcp.js";
import { recognizeSandBrowserDriverOperation } from "./sand-browser-driver.js";
import type { Context } from "../../interop/contracts/context.js";
import type { Executor, ListableResourceAccessor, Resource, ResourceEntry } from "../../interop/contracts/agent-exec.js";
import type { OperationSource, OrbitOperationReporter } from "../../interop/contracts/orbit.js";
import type { agent_v1_ShellArgs, agent_v1_ShellResult, agent_v1_McpArgs, agent_v1_McpResult } from "../../interop/contracts/protobuf-generated.js";
import type { BrowserOperation } from "./browser-operation.js";
export type ReportingShellExecutor = Executor<agent_v1_ShellArgs, agent_v1_ShellResult>;
export interface ReportingMcpExecutor extends Executor<agent_v1_McpArgs, agent_v1_McpResult> { isBackendRouted?(providerIdentifier: string): boolean; }

export function operationSource(ctx: Context, toolCallId: string): OperationSource | undefined {
    const conversationId = ctx.get(execConversationIdKey);
    const requestId = ctx.get(execRequestIdKey);
    if (conversationId === undefined ||
        conversationId.length === 0 ||
        requestId === undefined ||
        requestId.length === 0 ||
        toolCallId.length === 0) {
        return undefined;
    }
    return {
        kind: "toolCall",
        conversationId,
        requestId,
        toolCallId,
    };
}
export async function reportOperation<Result>(reporter: OrbitOperationReporter, ctx: Context, operationUuid: string, operation: BrowserOperation<Result>, source: OperationSource, execute: () => Promise<Result>): Promise<Result> {
    let shouldEnd: boolean;
    try {
        const admission = await reporter.startOperation({
            operationUuid,
            cdpEndpoint: operation.cdpEndpoint,
            source,
            request: operation.request,
        }, { signal: ctx.signal });
        shouldEnd = admission.kind === "admitted";
    }
    catch {
        // A Start failure is admission-ambiguous: its response may have been lost.
        shouldEnd = true;
    }
    let outcome = operationOutcome("failed", { reason: "executor_error" });
    try {
        const result = await execute();
        try {
            outcome = operation.outcomeOf(result);
        }
        catch {
            outcome = operationOutcome("failed", { reason: "outcome_unavailable" });
        }
        return result;
    }
    catch (error) {
        if (ctx.canceled) {
            outcome = operationOutcome("cancelled", { reason: "request_cancelled" });
        }
        throw error;
    }
    finally {
        if (shouldEnd) {
            try {
                // Do not pass ctx.signal: cancellation still requires a bounded End attempt.
                await reporter.endOperation({
                    operationUuid,
                    outcome,
                });
            }
            catch {
                // Reporting must not replace the executor's result or error.
            }
        }
    }
}
export function recognizeFailOpen<T>(recognize: () => T): T | undefined {
    try {
        return recognize();
    }
    catch {
        return undefined;
    }
}
export function reportingExecute<Args extends { toolCallId: string }, Result>(execute: Executor<Args, Result>["execute"], recognize: (args: Args) => BrowserOperation<Result> | undefined, reporter: OrbitOperationReporter): Executor<Args, Result>["execute"] {
    return (ctx, args, options) => {
        const run = () => execute(ctx, args, options);
        if (ctx.canceled ||
            ctx.get(execBrowserOperationSourceKey) !== EXEC_BROWSER_OPERATION_SOURCES.toolCall) {
            return run();
        }
        const source = operationSource(ctx, args.toolCallId);
        if (source === undefined) {
            return run();
        }
        const operation = recognizeFailOpen(() => recognize(args));
        if (operation === undefined) {
            return run();
        }
        let operationUuid: ReturnType<typeof nodeCrypto.randomUUID>;
        try {
            operationUuid = nodeCrypto.randomUUID();
        }
        catch {
            return run();
        }
        return reportOperation(reporter, ctx, operationUuid, operation, source, run);
    };
}
export function reportingShellExecutor(inner: ReportingShellExecutor | undefined, reporter: OrbitOperationReporter): ReportingShellExecutor {
    return {
        execute: reportingExecute(inner!.execute.bind(inner), (args) => recognizeSandBrowserDriverOperation(args), reporter),
    };
}
export function reportingMcpExecutor(inner: ReportingMcpExecutor | undefined, reporter: OrbitOperationReporter): ReportingMcpExecutor {
    const execute = reportingExecute(inner!.execute.bind(inner), recognizePlaywrightMcpOperation, reporter);
    const isBackendRouted = inner!.isBackendRouted?.bind(inner);
    return isBackendRouted === undefined ? { execute } : { execute, isBackendRouted };
}
export class OrbitOperationReportingAccessor implements ListableResourceAccessor {
    inner: ListableResourceAccessor;
    reporter: OrbitOperationReporter;
    constructor(inner: ListableResourceAccessor, reporter: OrbitOperationReporter) {
        this.inner = inner;
        this.reporter = reporter;
    }
    get<T>(resource: Resource<T>): T | undefined {
        return this.wrap(resource, this.inner.get(resource)) as T | undefined;
    }
    *entries(): IterableIterator<ResourceEntry> {
        for (const [resource, implementation] of this.inner.entries()) {
            yield [resource, this.wrap(resource, implementation)];
        }
    }
    // A resource's unique symbol binds its implementation type. Preserve the
    // original missing-resource throw when decorating shell/MCP; do not add a guard.
    wrap(resource: Resource<unknown>, implementation: unknown): unknown {
        if (resource.symbol === shellExecutorResource.symbol) {
            return reportingShellExecutor(implementation as ReportingShellExecutor | undefined, this.reporter);
        }
        if (resource.symbol === mcpExecutorResource.symbol) {
            return reportingMcpExecutor(implementation as ReportingMcpExecutor | undefined, this.reporter);
        }
        return implementation;
    }
}
/**
 * Decorates shell and MCP executors with fail-open Orbit operation reporting.
 */
export function withOrbitOperationReporting(inner: ListableResourceAccessor, reporter: OrbitOperationReporter) {
    return new OrbitOperationReportingAccessor(inner, reporter);
}
