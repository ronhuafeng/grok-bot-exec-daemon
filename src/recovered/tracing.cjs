module.exports = {
/***/ "./src/tracing.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Hu: () => (/* binding */ initTracing),
  HO: () => (/* binding */ shutdownTracing)
});

// UNUSED EXPORTS: buildResource

// EXTERNAL MODULE: external "node:os"
var external_node_os_ = __webpack_require__("node:os");
var external_node_os_default = /*#__PURE__*/__webpack_require__.n(external_node_os_);
// EXTERNAL MODULE: ../context/dist/logger.js
var logger = __webpack_require__("../context/dist/logger.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag-api.js
var diag_api = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag-api.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/types.js
var types = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/types.js");
// EXTERNAL MODULE: ../../node_modules/.pnpm/@opentelemetry+exporter-trace-otlp-proto@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/exporter-trace-otlp-proto/build/esm/platform/node/OTLPTraceExporter.js
var OTLPTraceExporter = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+exporter-trace-otlp-proto@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/exporter-trace-otlp-proto/build/esm/platform/node/OTLPTraceExporter.js");
;// ../../node_modules/.pnpm/@opentelemetry+resources@2.6.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/utils.js
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */
const isPromiseLike = (val) => {
    return (val !== null &&
        typeof val === 'object' &&
        typeof val.then === 'function');
};
//# sourceMappingURL=utils.js.map
;// ../../node_modules/.pnpm/@opentelemetry+resources@2.6.1_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/resources/build/esm/ResourceImpl.js
/* unused harmony import specifier */ var SDK_INFO;
/* unused harmony import specifier */ var ATTR_SERVICE_NAME;
/* unused harmony import specifier */ var ATTR_TELEMETRY_SDK_LANGUAGE;
/* unused harmony import specifier */ var ATTR_TELEMETRY_SDK_NAME;
/* unused harmony import specifier */ var ATTR_TELEMETRY_SDK_VERSION;
/* unused harmony import specifier */ var defaultServiceName;
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */





class ResourceImpl {
    _rawAttributes;
    _asyncAttributesPending = false;
    _schemaUrl;
    _memoizedAttributes;
    static FromAttributeList(attributes, options) {
        const res = new ResourceImpl({}, options);
        res._rawAttributes = guardedRawAttributes(attributes);
        res._asyncAttributesPending =
            attributes.filter(([_, val]) => isPromiseLike(val)).length > 0;
        return res;
    }
    constructor(
    /**
     * A dictionary of attributes with string keys and values that provide
     * information about the entity as numbers, strings or booleans
     * TODO: Consider to add check/validation on attributes.
     */
    resource, options) {
        const attributes = resource.attributes ?? {};
        this._rawAttributes = Object.entries(attributes).map(([k, v]) => {
            if (isPromiseLike(v)) {
                // side-effect
                this._asyncAttributesPending = true;
            }
            return [k, v];
        });
        this._rawAttributes = guardedRawAttributes(this._rawAttributes);
        this._schemaUrl = validateSchemaUrl(options?.schemaUrl);
    }
    get asyncAttributesPending() {
        return this._asyncAttributesPending;
    }
    async waitForAsyncAttributes() {
        if (!this.asyncAttributesPending) {
            return;
        }
        for (let i = 0; i < this._rawAttributes.length; i++) {
            const [k, v] = this._rawAttributes[i];
            this._rawAttributes[i] = [k, isPromiseLike(v) ? await v : v];
        }
        this._asyncAttributesPending = false;
    }
    get attributes() {
        if (this.asyncAttributesPending) {
            diag_api/* diag */.s.error('Accessing resource attributes before async attributes settled');
        }
        if (this._memoizedAttributes) {
            return this._memoizedAttributes;
        }
        const attrs = {};
        for (const [k, v] of this._rawAttributes) {
            if (isPromiseLike(v)) {
                diag_api/* diag */.s.debug(`Unsettled resource attribute ${k} skipped`);
                continue;
            }
            if (v != null) {
                attrs[k] ??= v;
            }
        }
        // only memoize output if all attributes are settled
        if (!this._asyncAttributesPending) {
            this._memoizedAttributes = attrs;
        }
        return attrs;
    }
    getRawAttributes() {
        return this._rawAttributes;
    }
    get schemaUrl() {
        return this._schemaUrl;
    }
    merge(resource) {
        if (resource == null)
            return this;
        // Order is important
        // Spec states incoming attributes override existing attributes
        const mergedSchemaUrl = mergeSchemaUrl(this, resource);
        const mergedOptions = mergedSchemaUrl
            ? { schemaUrl: mergedSchemaUrl }
            : undefined;
        return ResourceImpl.FromAttributeList([...resource.getRawAttributes(), ...this.getRawAttributes()], mergedOptions);
    }
}
function resourceFromAttributes(attributes, options) {
    return ResourceImpl.FromAttributeList(Object.entries(attributes), options);
}
function resourceFromDetectedResource(detectedResource, options) {
    return new ResourceImpl(detectedResource, options);
}
function emptyResource() {
    return resourceFromAttributes({});
}
function defaultResource() {
    return resourceFromAttributes({
        [ATTR_SERVICE_NAME]: defaultServiceName(),
        [ATTR_TELEMETRY_SDK_LANGUAGE]: SDK_INFO[ATTR_TELEMETRY_SDK_LANGUAGE],
        [ATTR_TELEMETRY_SDK_NAME]: SDK_INFO[ATTR_TELEMETRY_SDK_NAME],
        [ATTR_TELEMETRY_SDK_VERSION]: SDK_INFO[ATTR_TELEMETRY_SDK_VERSION],
    });
}
function guardedRawAttributes(attributes) {
    return attributes.map(([k, v]) => {
        if (isPromiseLike(v)) {
            return [
                k,
                v.catch(err => {
                    diag_api/* diag */.s.debug('promise rejection for resource attribute: %s - %s', k, err);
                    return undefined;
                }),
            ];
        }
        return [k, v];
    });
}
function validateSchemaUrl(schemaUrl) {
    if (typeof schemaUrl === 'string' || schemaUrl === undefined) {
        return schemaUrl;
    }
    diag_api/* diag */.s.warn('Schema URL must be string or undefined, got %s. Schema URL will be ignored.', schemaUrl);
    return undefined;
}
function mergeSchemaUrl(old, updating) {
    const oldSchemaUrl = old?.schemaUrl;
    const updatingSchemaUrl = updating?.schemaUrl;
    const isOldEmpty = oldSchemaUrl === undefined || oldSchemaUrl === '';
    const isUpdatingEmpty = updatingSchemaUrl === undefined || updatingSchemaUrl === '';
    if (isOldEmpty) {
        return updatingSchemaUrl;
    }
    if (isUpdatingEmpty) {
        return oldSchemaUrl;
    }
    if (oldSchemaUrl === updatingSchemaUrl) {
        return oldSchemaUrl;
    }
    diag_api/* diag */.s.warn('Schema URL merge conflict: old resource has "%s", updating resource has "%s". Resulting resource will have undefined Schema URL.', oldSchemaUrl, updatingSchemaUrl);
    return undefined;
}
//# sourceMappingURL=ResourceImpl.js.map
// EXTERNAL MODULE: ../../node_modules/.pnpm/@opentelemetry+sdk-node@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-node/build/src/index.js
var src = __webpack_require__("../../node_modules/.pnpm/@opentelemetry+sdk-node@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-node/build/src/index.js");
;// ./src/tracing.ts
/**
 * OpenTelemetry tracing initialization for exec-daemon.
 * Adapted from @anysphere/agent-cli/src/tracing.ts for the pod environment.
 *
 * Since exec-daemon runs inside an untrusted pod, traces are sent to the
 * backend's /v1/traces endpoint which forwards them to Datadog.
 */






// Avoid re-initializing if some caller imported this twice.
let initialized = false;
let sdk;
// Logger for tracing module
const tracing_logger = (0,logger/* createLogger */.h)("exec-daemon-tracing");
/**
 * Initialize OpenTelemetry tracing for exec-daemon.
 * Must be called early in the daemon startup, before any spans are created.
 */
function initTracing(options) {
    const { ctx } = options;
    tracing_logger.info(ctx, "initTracing called", {
        traceEndpoint: options.traceEndpoint,
        hasAuthToken: !!options.authToken,
    });
    if (initialized) {
        tracing_logger.warn(ctx, "Tracing already initialized, skipping");
        return;
    }
    // Set up OTEL diagnostics to log via our logger for debugging
    // Note: We don't log the args because OTEL passes complex objects with circular references
    const otelDiagLogger = {
        verbose: (message, ..._args) => {
            tracing_logger.info(ctx, `[OTEL-VERBOSE] ${message}`);
        },
        debug: (message, ..._args) => {
            tracing_logger.info(ctx, `[OTEL-DEBUG] ${message}`);
        },
        info: (message, ..._args) => {
            tracing_logger.info(ctx, `[OTEL-INFO] ${message}`);
        },
        warn: (message, ..._args) => {
            tracing_logger.warn(ctx, `[OTEL-WARN] ${message}`);
        },
        error: (message, ..._args) => {
            tracing_logger.error(ctx, `[OTEL-ERROR] ${message}`);
        },
    };
    diag_api/* diag */.s.setLogger(otelDiagLogger, types/* DiagLogLevel */.u.DEBUG);
    tracing_logger.info(ctx, "OTEL diagnostics enabled at DEBUG level");
    // Build the OTLP exporter
    let exporter;
    try {
        tracing_logger.info(ctx, "Creating OTLP exporter...");
        exporter = createExporter(ctx, options);
        tracing_logger.info(ctx, "OTLP exporter created successfully");
    }
    catch (e) {
        tracing_logger.error(ctx, "Failed to create OTLP exporter", e);
        return;
    }
    // Build a resource with environment attributes
    tracing_logger.info(ctx, "Building resource attributes...");
    const resource = buildResource(options);
    tracing_logger.info(ctx, "Resource built", {
        attributeKeys: Object.keys(resource.attributes),
    });
    tracing_logger.info(ctx, "Creating NodeSDK...");
    sdk = new src/* NodeSDK */.P({
        autoDetectResources: false,
        traceExporter: exporter,
        resource,
    });
    try {
        tracing_logger.info(ctx, "Starting NodeSDK...");
        sdk.start();
        tracing_logger.info(ctx, "NodeSDK started successfully - tracing is now active");
        initialized = true;
    }
    catch (err) {
        tracing_logger.error(ctx, "Failed to start NodeSDK", err);
    }
}
/**
 * Gracefully shutdown the OpenTelemetry SDK.
 * Should be called during daemon shutdown to flush pending spans.
 */
async function shutdownTracing(ctx) {
    if (ctx) {
        tracing_logger.info(ctx, "shutdownTracing called", { sdkExists: !!sdk });
    }
    if (sdk) {
        try {
            if (ctx) {
                tracing_logger.info(ctx, "Shutting down NodeSDK (this will flush pending spans)...");
            }
            await sdk.shutdown();
            if (ctx) {
                tracing_logger.info(ctx, "NodeSDK shutdown complete");
            }
        }
        catch (err) {
            if (ctx) {
                tracing_logger.error(ctx, "Error during NodeSDK shutdown", err);
            }
        }
    }
    else if (ctx) {
        tracing_logger.warn(ctx, "No SDK to shutdown");
    }
}
function buildResource(options) {
    const platform = external_node_os_default().platform();
    const arch = external_node_os_default().arch();
    const osRelease = external_node_os_default().release();
    const nodeVersion = process.version;
    const serviceVersion = options.serviceVersion ?? "unknown";
    const hostname = external_node_os_default().hostname();
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
function createExporter(ctx, options) {
    const { traceEndpoint, authToken, insecure } = options;
    // Build HTTP headers for authentication
    const headers = {
        authorization: `Bearer ${authToken}`,
        "x-ghost-mode": "false",
        "x-cursor-client-version": "exec-daemon",
    };
    // Construct the complete URL with /v1/traces path for OTLP HTTP
    const traceUrl = `${traceEndpoint}/v1/traces`;
    tracing_logger.info(ctx, "Creating OTLPTraceExporter", {
        url: traceUrl,
        headersKeys: Object.keys(headers),
        insecure: insecure ?? false,
    });
    // For local development with self-signed certs, skip SSL verification
    const exporterOptions = {
        url: traceUrl,
        headers,
    };
    if (insecure === true) {
        tracing_logger.warn(ctx, "SSL certificate verification disabled for trace endpoint");
        exporterOptions.httpAgentOptions = {
            rejectUnauthorized: false,
        };
    }
    const exporter = new OTLPTraceExporter/* OTLPTraceExporter */.Q(exporterOptions);
    tracing_logger.info(ctx, "OTLPTraceExporter created");
    return exporter;
}


/***/ },

};
