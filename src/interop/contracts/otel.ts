import type { Context, ContextKey } from "./context.js";
/** OpenTelemetry attribute payload, as consumed by the retained context/otel adapter. */
export type AttributeValue = string | number | boolean | readonly (string | null | undefined)[] | readonly (number | null | undefined)[] | readonly (boolean | null | undefined)[];
export type Attributes = Readonly<Record<string, AttributeValue | undefined>>;
export type TimeInput = number | Date | [number, number];
export interface TraceState { serialize(): string; }
export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  isRemote?: boolean;
  traceState?: TraceState;
}
export interface Span {
  spanContext(): SpanContext;
  setAttribute(key: string, value: AttributeValue): this;
  setAttributes(attributes: Attributes): this;
  addEvent(name: string, attributesOrStartTime?: Attributes | TimeInput, startTime?: TimeInput): this;
  setStatus(status: { code: number; message?: string }): this;
  updateName(name: string): this;
  end(endTime?: TimeInput): void;
  isRecording(): boolean;
  /** Raw telemetry ingress: the retained SDK checks string/truthiness, then reads
   * exception-like properties. It returns no value; invalid getters may still throw. */
  recordException(exception: unknown, time?: TimeInput): void;
}
export interface SpanOptions {
  attributes?: Attributes;
  kind?: number;
  startTime?: TimeInput;
  root?: boolean;
  links?: readonly { context: SpanContext; attributes?: Attributes }[];
}
export interface DisposableSpan {
  readonly ctx: Context;
  readonly span: Span;
  [Symbol.dispose](): void;
}
export interface ContextOtelModule {
  HF(ctx: Context, name: string): void;
  Mf(ctx: Context, key: string, value: AttributeValue): Context;
  Rm: ContextKey<Span | undefined>;
  V5(spanContext: Pick<SpanContext, "traceId" | "spanId" | "traceFlags">, name?: string, existingContext?: Context): Context;
  VI(ctx: Context, options?: SpanOptions): DisposableSpan;
  fR(ctx: Context, options?: SpanOptions): Context;
  fU(ctx: Context): Span | undefined;
  mJ(ctx: Context): { traceId: string; spanId: string; traceFlags: number; traceState?: string } | undefined;
}
export interface TraceApi {
  wrapSpanContext(context: SpanContext): Span;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../context/dist/otel.js": ContextOtelModule;
    "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/trace-api.js": { u: TraceApi };
  }
}

import type { AgentOptions as HttpsAgentOptions } from "node:https";
export interface TelemetryResource { readonly attributes: Attributes; }
export interface ReadableSpan {
  readonly name: string;
  readonly kind: number;
  spanContext(): SpanContext;
  readonly startTime: [number, number];
  readonly endTime: [number, number];
  readonly status: { code: number; message?: string };
  readonly attributes: Attributes;
  readonly events: readonly { name: string; time: [number, number]; attributes?: Attributes }[];
  readonly links: readonly { context: SpanContext; attributes?: Attributes }[];
  readonly duration: [number, number];
  readonly ended: boolean;
  readonly resource: TelemetryResource;
  readonly instrumentationScope: { name: string; version?: string; schemaUrl?: string };
}
export interface TraceExporter {
  export(spans: ReadableSpan[], resultCallback: (result: { code: number; error?: Error }) => void): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}
export interface OtlpExporterOptions {
  url?: string;
  headers?: Record<string, string>;
  httpAgentOptions?: HttpsAgentOptions;
}
export interface NodeTelemetrySdk { start(): void; shutdown(): Promise<void>; }
export interface DiagLogger {
  verbose(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
declare module "./vendor.js" {
  interface TracingVendorBindings { resourceFromAttributes(attributes: Attributes): TelemetryResource; }
}
declare module "../modules.js" {
  interface ExternalModules {
    "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag-api.js": { s: { setLogger(logger: DiagLogger, logLevel?: number): boolean } };
    "../../node_modules/.pnpm/@opentelemetry+api@1.9.0/node_modules/@opentelemetry/api/build/esm/diag/types.js": { u: { readonly NONE: 0; readonly ERROR: 30; readonly WARN: 50; readonly INFO: 60; readonly DEBUG: 70; readonly VERBOSE: 80; readonly ALL: 9999 } };
    "../../node_modules/.pnpm/@opentelemetry+exporter-trace-otlp-proto@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/exporter-trace-otlp-proto/build/esm/platform/node/OTLPTraceExporter.js": { Q: new (options?: OtlpExporterOptions) => TraceExporter };
    "../../node_modules/.pnpm/@opentelemetry+sdk-node@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/sdk-node/build/src/index.js": { P: new (options?: { autoDetectResources?: boolean; traceExporter?: TraceExporter; resource?: TelemetryResource }) => NodeTelemetrySdk };
  }
}
