import type { ControlServiceDescriptor, ExecServiceDescriptor, PtyHostServiceDescriptor, TmuxSessionServiceDescriptor } from "./protobuf-generated.js";
import type { ContextExtractedImplementation, ContextExtractionOptions } from "./connect.js";
import type { agent_v1_ReadFileResponse, agent_v1_ExecStreamElement, agent_v1_ReadFileRequest } from "./protobuf-generated.js";
/** Structural contract for the renderer's actual configuration and the portion of the
 * generated plan consumed at the daemon boundary. The plan is passed back unchanged. */
export interface RendererConfig {
  timing: { preActionPaddingMs: number; postActionPaddingMs: number; minGapMs: number; zoomInLeadMs: number; zoomOutDelayMs: number; zoomMaxGapMs: number; maxGapOutputMs: number; speedMultiplier: number };
  motion: { defaultCursorStyle: number };
  safety: { alignmentToleranceMs: number; maxRenderDurationMs?: number };
}
export interface RenderPlan { diagnostics: { errors: string[]; warnings: string[] }; }
export interface SetupVendorBindings {
  DEFAULT_RENDERER_CONFIG: RendererConfig;
  generateRenderPlan(options: { sessionDir: string; fps?: number; maxDurationMs?: number }, config?: RendererConfig): Promise<RenderPlan>;
  renderFromPlan(options: { plan: RenderPlan; outputVideoPath: string; outputWidth: number; sessionDir: string; includeBrandTag?: boolean; maxDurationMs?: number }): Promise<void>;
}
export interface ServerVendorBindings {
  ControlService: ControlServiceDescriptor;
  ExecService: ExecServiceDescriptor;
  PtyHostService: PtyHostServiceDescriptor;
  TmuxSessionService: TmuxSessionServiceDescriptor;
  createContextExtractingService<I extends object>(implementation: I, options?: ContextExtractionOptions): ContextExtractedImplementation<I>;
  ReadFileResponse: typeof agent_v1_ReadFileResponse;
  ReadFileRequest: typeof agent_v1_ReadFileRequest;
  ExecStreamElement: typeof agent_v1_ExecStreamElement;
}
export interface TracingVendorBindings {}
declare module "../modules.js" {
  interface VendorBindings {
    "./src/setup.ts": SetupVendorBindings;
    "./src/server.ts": ServerVendorBindings;
    "./src/tracing.ts": TracingVendorBindings;
  }
}
