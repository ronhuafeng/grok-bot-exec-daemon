import nodeOs from "node:os";
import { createLogger } from "../interop/vendor/context-logger.js";
import { diag } from "../interop/vendor/otel-diag-api.js";
import { DiagLogLevel } from "../interop/vendor/otel-types.js";
import { OTLPTraceExporter as OTLPTraceExporterDependency } from "../interop/vendor/otel-trace-exporter.js";
import { NodeSDK } from "../interop/vendor/otel-node-sdk.js";
import { resourceFromAttributes } from "../interop/vendor/tracing-private.js";
import type { Context } from "../interop/contracts/context.js";

export interface TracingOptions {
  ctx: Context;
  traceEndpoint: string;
  authToken: string;
  insecure?: boolean;
  serviceVersion?: string;
  traceAttributes?: Record<string, string>;
}
interface ExporterOptions {
  url: string;
  headers: Record<string, string>;
  httpAgentOptions?: { rejectUnauthorized: boolean };
}

/**
 * OpenTelemetry tracing initialization for exec-daemon.
 * Adapted from @anysphere/agent-cli/src/tracing.ts for the pod environment.
 *
 * Since exec-daemon runs inside an untrusted pod, traces are sent to the
 * backend's /v1/traces endpoint which forwards them to Datadog.
 */
// Avoid re-initializing if some caller imported this twice.
export let initialized = false;
export let sdk: InstanceType<typeof NodeSDK> | undefined;
// Logger for tracing module
export const logger = createLogger("exec-daemon-tracing");
/**
 * Initialize OpenTelemetry tracing for exec-daemon.
 * Must be called early in the daemon startup, before any spans are created.
 */
export function initTracing(options: TracingOptions) {
    const { ctx } = options;
    logger.info(ctx, "initTracing called", {
        traceEndpoint: options.traceEndpoint,
        hasAuthToken: !!options.authToken,
    });
    if (initialized) {
        logger.warn(ctx, "Tracing already initialized, skipping");
        return;
    }
    // Set up OTEL diagnostics to log via our logger for debugging
    // Note: We don't log the args because OTEL passes complex objects with circular references
    const otelDiagLogger = {
        verbose: (message: string, ..._args: unknown[]) => {
            logger.info(ctx, `[OTEL-VERBOSE] ${message}`);
        },
        debug: (message: string, ..._args: unknown[]) => {
            logger.info(ctx, `[OTEL-DEBUG] ${message}`);
        },
        info: (message: string, ..._args: unknown[]) => {
            logger.info(ctx, `[OTEL-INFO] ${message}`);
        },
        warn: (message: string, ..._args: unknown[]) => {
            logger.warn(ctx, `[OTEL-WARN] ${message}`);
        },
        error: (message: string, ..._args: unknown[]) => {
            logger.error(ctx, `[OTEL-ERROR] ${message}`);
        },
    };
    diag.setLogger(otelDiagLogger, DiagLogLevel.DEBUG);
    logger.info(ctx, "OTEL diagnostics enabled at DEBUG level");
    // Build the OTLP exporter
    let exporter: ReturnType<typeof createExporter>;
    try {
        logger.info(ctx, "Creating OTLP exporter...");
        exporter = createExporter(ctx, options);
        logger.info(ctx, "OTLP exporter created successfully");
    }
    catch (e) {
        logger.error(ctx, "Failed to create OTLP exporter", e);
        return;
    }
    // Build a resource with environment attributes
    logger.info(ctx, "Building resource attributes...");
    const resource = buildResource(options);
    logger.info(ctx, "Resource built", {
        attributeKeys: Object.keys(resource.attributes),
    });
    logger.info(ctx, "Creating NodeSDK...");
    sdk = new NodeSDK({
        autoDetectResources: false,
        traceExporter: exporter,
        resource,
    });
    try {
        logger.info(ctx, "Starting NodeSDK...");
        sdk.start();
        logger.info(ctx, "NodeSDK started successfully - tracing is now active");
        initialized = true;
    }
    catch (err) {
        logger.error(ctx, "Failed to start NodeSDK", err);
    }
}
/**
 * Gracefully shutdown the OpenTelemetry SDK.
 * Should be called during daemon shutdown to flush pending spans.
 */
export async function shutdownTracing(ctx?: Context) {
    if (ctx) {
        logger.info(ctx, "shutdownTracing called", { sdkExists: !!sdk });
    }
    if (sdk) {
        try {
            if (ctx) {
                logger.info(ctx, "Shutting down NodeSDK (this will flush pending spans)...");
            }
            await sdk.shutdown();
            if (ctx) {
                logger.info(ctx, "NodeSDK shutdown complete");
            }
        }
        catch (err) {
            if (ctx) {
                logger.error(ctx, "Error during NodeSDK shutdown", err);
            }
        }
    }
    else if (ctx) {
        logger.warn(ctx, "No SDK to shutdown");
    }
}
export function buildResource(options: Pick<TracingOptions, "serviceVersion" | "traceAttributes">) {
    const platform = nodeOs.platform();
    const arch = nodeOs.arch();
    const osRelease = nodeOs.release();
    const nodeVersion = process.version;
    const serviceVersion = options.serviceVersion ?? "unknown";
    const hostname = nodeOs.hostname();
    // Build semantic resource attributes
    const resource = resourceFromAttributes({
        "service.name": "exec-daemon",
        "service.version": serviceVersion,
        "host.name": hostname,
        "os.type": platform,
        "os.version": osRelease,
        "process.runtime.name": "node",
        "process.runtime.version": nodeVersion,
        "client.os.platform": platform,
        "client.os.release": osRelease,
        "client.arch": arch,
        "client.node.version": nodeVersion,
        "deployment.environment": "pod",
        ...(options.traceAttributes ?? {}),
    });
    return resource;
}
export function createExporter(ctx: Context, options: Pick<TracingOptions, "traceEndpoint" | "authToken" | "insecure">) {
    const { traceEndpoint, authToken, insecure } = options;
    // Build HTTP headers for authentication
    const headers = {
        authorization: `Bearer ${authToken}`,
        "x-ghost-mode": "false",
        "x-cursor-client-version": "exec-daemon",
    };
    // Construct the complete URL with /v1/traces path for OTLP HTTP
    const traceUrl = `${traceEndpoint}/v1/traces`;
    logger.info(ctx, "Creating OTLPTraceExporter", {
        url: traceUrl,
        headersKeys: Object.keys(headers),
        insecure: insecure ?? false,
    });
    // For local development with self-signed certs, skip SSL verification
    const exporterOptions: ExporterOptions = {
        url: traceUrl,
        headers,
    };
    if (insecure === true) {
        logger.warn(ctx, "SSL certificate verification disabled for trace endpoint");
        exporterOptions.httpAgentOptions = {
            rejectUnauthorized: false,
        };
    }
    const exporter = new OTLPTraceExporterDependency(exporterOptions);
    logger.info(ctx, "OTLPTraceExporter created");
    return exporter;
}
