export interface GeneratedFileResult {
  isGenerated: boolean;
  source: "gitattributes" | "path-heuristic" | "content-heuristic" | "none";
}
export interface GeneratedFileDetectionModule {
  zM(options: { repoRoot: string; filePaths: readonly string[]; getContent?: (path: string) => Promise<string | undefined> }): Promise<Map<string, GeneratedFileResult>>;
}
declare module "../modules.js" {
  interface ExternalModules { "../git-core/dist/generated-file-detection.js": GeneratedFileDetectionModule; }
}
