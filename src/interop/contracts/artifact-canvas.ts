/** Path and artifact ports from retained agent-core/canvas factories. */
export interface ArtifactPath {
  kind: "artifact" | "extra_path";
  absolutePath: string;
  artifactRootRelativePath: string;
  storeRelativePath: string;
}
export interface CloudAgentArtifactPathsModule {
  KJ(args: { artifactsRootPath: string; storeRelativePath: string }): (ArtifactPath & { kind: "artifact" }) | undefined;
  XJ: "__cursor_internal__";
  Yk(rawPath: string): string | undefined;
  hG: "artifacts";
  kp(args: { artifactsRootPath: string; relativePath: string }): string | undefined;
  rK(args: { artifactsRootPath: string; absolutePath: string }): ArtifactPath | undefined;
  vR(args: { artifactsRootPath: string; absolutePath: string }): string | undefined;
}
export interface CloudCanvasManifest {
  version: 1;
  canvasId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  origin?: { groupChatId: string };
}
export type Parsed<T> = { ok: true; value: T } | { ok: false };
export interface CloudCanvasModule {
  EC: 1;
  IR(bytes: Uint8Array): boolean;
  NH: 5000000;
  Rj: "canvas.bundle.gz";
  Ur: 2000000;
  Wo: 64000;
  Yz(raw: unknown): Parsed<CloudCanvasManifest>;
  _g: "canvas.json";
  n_: "canvas.data.json";
  wz(raw: string): Parsed<string>;
}
export type CanvasSavePath = { kind: "unrelated" } | { kind: "invalid"; reason: string } | { kind: "valid"; canvasId: string; canvasDir: string; canvasesRoot: string };
export interface CanvasShareBundle { version: 1; runtimeEsm: string; userModule: string; }
export interface CanvasShareBundleModule {
  P4(bundleFileName: string): string | undefined;
  VY(fileName: string): boolean;
  dN: 5000000;
  pZ(canvasFileName: string): string | undefined;
  u3(artifactsRoot: string): string;
  xd(options: { runtimeEsm: string; userModule: string }): CanvasShareBundle;
}
export interface CanvasShareArtifactModule {
  buildCanvasShareArtifactFromSource(options: { source: string; canvasPath: string; runtimeDir?: string; kit?: "cursor" | "grok" }): Promise<{ appJs: Uint8Array; userModule: string }>;
  defaultCanvasRuntimeDir(): string;
  defaultCanvasSdkSourceDir(): string;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../agent-core/dist/cloud-agent-artifact-paths.js": CloudAgentArtifactPathsModule;
    "../canvas-shared/dist/cloud-canvas.js": CloudCanvasModule;
    "../canvas-shared/dist/canvas-share-bundle.js": CanvasShareBundleModule;
    "../canvas-server/dist/canvas-share-artifact.js": CanvasShareArtifactModule;
    "../canvas-server/dist/canvas-path-validation.js": { K3(filePath: string, canvasesRoots?: string | readonly string[]): CanvasSavePath };
    "../constants/dist/agent-store-ids.js": {
      EN: "source.canvas.tsx";
      __: RegExp;
      f: "/cursor/stores";
      ur: readonly ["/cursor/stores/user/canvases", "/cursor/stores/automation/canvases"];
    };
    "../constants/dist/agent-store-fuse.js": {
      HH: "/run/agent-store-fuse/pid";
      Xb: "cursor-agent-store-fuse";
      YE: "/run/agent-store-fuse/relaunch-reason";
      _p: "/run/agent-store-fuse/notice-cursor.json";
      rM: "/run/agent-store-fuse/dispatch-wedge-report.json";
      uD: "/run/agent-store-fuse/events.jsonl";
    };
    "./src sync recursive": { (request: string): never; resolve(request: string): never; keys(): []; id: "./src sync recursive" };
  }
}

export interface CanvasDiagnostic {
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  severity: 1 | 2 | 3;
  code?: string;
  message: string;
}
export interface CanvasDiagnosticsProvider {
  bootstrapReady: Promise<{ canvasesDir: string; tsconfigPath: string } | undefined>;
  getDiagnostics(filePath: string): Promise<CanvasDiagnostic[] | undefined>;
  getDiagnosticsSnapshot(filePath: string): Promise<{ diagnostics: CanvasDiagnostic[]; sourceSha256: string } | undefined>;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../canvas-server/dist/canvas-diagnostics-provider.js": {
      WT(options: { canvasesDir: string; sdkSourceDir: string; tsResolveAnchor: string; extraMatchRoot?: string | readonly string[]; getExtraMatchRoots?: () => string | readonly string[] | undefined }): CanvasDiagnosticsProvider;
    };
  }
}
declare module "./vendor.js" {
  interface SetupVendorBindings {
    getProjectDir(projectPath: string): string;
    ensureCanvasSkillSdkMirror(options: { sdkSourceDir: string; skillDir: string }): Promise<boolean>;
  }
}
declare module "./local-exec.js" { interface LocalExecModule { T2h(): string; } }
