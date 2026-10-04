export interface OrbitEndpoint { host: string; port: number; }
export type OperationSource =
  | { kind: "toolCall"; conversationId: string; requestId: string; toolCallId: string }
  | { kind: "userAction"; conversationId: string; requestId: string; actionKind: string; actionId: string };
export interface OperationOutcome { status: "completed" | "failed" | "cancelled"; detailJson?: string; }
export type OperationAdmission = { kind: "admitted" } | { kind: "notCaptured"; reason: "noCapture" | "captureEnded" | "overloaded" | "unknownOperation" | number };
export interface OrbitOperationReporter {
  startOperation(params: { operationUuid: string; cdpEndpoint: OrbitEndpoint; source: OperationSource; request: { name: string; argumentsJson?: string } }, callOptions?: { signal?: AbortSignal }): Promise<OperationAdmission>;
  endOperation(params: { operationUuid: string; outcome: OperationOutcome; result?: ({ kind: "json"; value: string } | { kind: "raw"; value: Uint8Array }) & { truncated?: boolean } }, callOptions?: { signal?: AbortSignal }): Promise<OperationAdmission>;
  close(): void;
}
declare module "../modules.js" { interface ExternalModules { "../orbit-client/dist/index.js": { nz(options: { socketPath: string }): OrbitOperationReporter }; } }
