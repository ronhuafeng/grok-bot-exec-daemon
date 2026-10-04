/** Generated from retained protobuf descriptors in vendor/exec-daemon-runtime/index.js.
 * Regenerate with tools/generate-proto-contracts.ts. No original declarations were available. */
import type { ProtoMessage, MessageInit, BinaryReadOptions, JsonReadOptions, JsonValue } from "./protobuf-runtime.js";

/** agent.v1.AfterAgentResponseRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_AfterAgentResponseRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AfterAgentResponseRequestQuery>);
  static readonly typeName: "agent.v1.AfterAgentResponseRequestQuery";
  text: string;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  inputTokens?: bigint;
  outputTokens?: bigint;
  cacheReadTokens?: bigint;
  cacheWriteTokens?: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AfterAgentResponseRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AfterAgentResponseRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AfterAgentResponseRequestQuery;
  static equals(a: agent_v1_AfterAgentResponseRequestQuery | MessageInit<agent_v1_AfterAgentResponseRequestQuery> | undefined, b: agent_v1_AfterAgentResponseRequestQuery | MessageInit<agent_v1_AfterAgentResponseRequestQuery> | undefined): boolean;
}

/** agent.v1.AfterAgentResponseRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_AfterAgentResponseRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AfterAgentResponseRequestResponse>);
  static readonly typeName: "agent.v1.AfterAgentResponseRequestResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AfterAgentResponseRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AfterAgentResponseRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AfterAgentResponseRequestResponse;
  static equals(a: agent_v1_AfterAgentResponseRequestResponse | MessageInit<agent_v1_AfterAgentResponseRequestResponse> | undefined, b: agent_v1_AfterAgentResponseRequestResponse | MessageInit<agent_v1_AfterAgentResponseRequestResponse> | undefined): boolean;
}

/** agent.v1.AfterAgentThoughtRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_AfterAgentThoughtRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AfterAgentThoughtRequestQuery>);
  static readonly typeName: "agent.v1.AfterAgentThoughtRequestQuery";
  text: string;
  durationMs?: bigint;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AfterAgentThoughtRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AfterAgentThoughtRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AfterAgentThoughtRequestQuery;
  static equals(a: agent_v1_AfterAgentThoughtRequestQuery | MessageInit<agent_v1_AfterAgentThoughtRequestQuery> | undefined, b: agent_v1_AfterAgentThoughtRequestQuery | MessageInit<agent_v1_AfterAgentThoughtRequestQuery> | undefined): boolean;
}

/** agent.v1.AfterAgentThoughtRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_AfterAgentThoughtRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AfterAgentThoughtRequestResponse>);
  static readonly typeName: "agent.v1.AfterAgentThoughtRequestResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AfterAgentThoughtRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AfterAgentThoughtRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AfterAgentThoughtRequestResponse;
  static equals(a: agent_v1_AfterAgentThoughtRequestResponse | MessageInit<agent_v1_AfterAgentThoughtRequestResponse> | undefined, b: agent_v1_AfterAgentThoughtRequestResponse | MessageInit<agent_v1_AfterAgentThoughtRequestResponse> | undefined): boolean;
}

/** agent.v1.AgentSkill; source: ../proto/dist/generated/agent/v1/agent_skills_pb.js */
export declare class agent_v1_AgentSkill extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AgentSkill>);
  static readonly typeName: "agent.v1.AgentSkill";
  fullPath: string;
  content: string;
  description: string;
  parseError?: string;
  environments: string[];
  disabledEnvironments: string[];
  gitRemoteOrigin?: string;
  disableModelInvocation: boolean;
  plugin?: string;
  marketplace?: string;
  pluginId?: string;
  marketplaceId?: string;
  globs: string[];
  scopedTo: string[];
  argumentHint: string;
  disableUserInvocation: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AgentSkill;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AgentSkill;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AgentSkill;
  static equals(a: agent_v1_AgentSkill | MessageInit<agent_v1_AgentSkill> | undefined, b: agent_v1_AgentSkill | MessageInit<agent_v1_AgentSkill> | undefined): boolean;
}

/** agent.v1.AgentStoreConflictArgs; source: ../proto/dist/generated/agent/v1/agent_store_conflict_exec_pb.js */
export declare class agent_v1_AgentStoreConflictArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AgentStoreConflictArgs>);
  static readonly typeName: "agent.v1.AgentStoreConflictArgs";
  cursor?: agent_v1_AgentStoreConflictCursor;
  advance?: boolean;
  includeQuotaNotices?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AgentStoreConflictArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AgentStoreConflictArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AgentStoreConflictArgs;
  static equals(a: agent_v1_AgentStoreConflictArgs | MessageInit<agent_v1_AgentStoreConflictArgs> | undefined, b: agent_v1_AgentStoreConflictArgs | MessageInit<agent_v1_AgentStoreConflictArgs> | undefined): boolean;
}

/** agent.v1.AgentStoreConflictCursor; source: ../proto/dist/generated/agent/v1/agent_store_conflict_exec_pb.js */
export declare class agent_v1_AgentStoreConflictCursor extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AgentStoreConflictCursor>);
  static readonly typeName: "agent.v1.AgentStoreConflictCursor";
  journalEpoch: string;
  seq: bigint;
  lastEventId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AgentStoreConflictCursor;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AgentStoreConflictCursor;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AgentStoreConflictCursor;
  static equals(a: agent_v1_AgentStoreConflictCursor | MessageInit<agent_v1_AgentStoreConflictCursor> | undefined, b: agent_v1_AgentStoreConflictCursor | MessageInit<agent_v1_AgentStoreConflictCursor> | undefined): boolean;
}

/** agent.v1.AgentStoreConflictError; source: ../proto/dist/generated/agent/v1/agent_store_conflict_exec_pb.js */
export declare class agent_v1_AgentStoreConflictError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AgentStoreConflictError>);
  static readonly typeName: "agent.v1.AgentStoreConflictError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AgentStoreConflictError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AgentStoreConflictError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AgentStoreConflictError;
  static equals(a: agent_v1_AgentStoreConflictError | MessageInit<agent_v1_AgentStoreConflictError> | undefined, b: agent_v1_AgentStoreConflictError | MessageInit<agent_v1_AgentStoreConflictError> | undefined): boolean;
}

/** agent.v1.AgentStoreConflictEvent; source: ../proto/dist/generated/agent/v1/agent_store_conflict_exec_pb.js */
export declare class agent_v1_AgentStoreConflictEvent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AgentStoreConflictEvent>);
  static readonly typeName: "agent.v1.AgentStoreConflictEvent";
  v: number;
  eventId: string;
  journalEpoch: string;
  seq: bigint;
  tsMs: bigint;
  kind: string;
  storeId?: string;
  originalRelPath?: string;
  conflictRelPath?: string;
  originalAbsPath?: string;
  conflictAbsPath?: string;
  preservedBytes?: bigint;
  scopeKind?: string;
  limitBytes?: bigint;
  usageBytes?: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AgentStoreConflictEvent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AgentStoreConflictEvent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AgentStoreConflictEvent;
  static equals(a: agent_v1_AgentStoreConflictEvent | MessageInit<agent_v1_AgentStoreConflictEvent> | undefined, b: agent_v1_AgentStoreConflictEvent | MessageInit<agent_v1_AgentStoreConflictEvent> | undefined): boolean;
}

/** agent.v1.AgentStoreConflictResult; source: ../proto/dist/generated/agent/v1/agent_store_conflict_exec_pb.js */
export declare class agent_v1_AgentStoreConflictResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AgentStoreConflictResult>);
  static readonly typeName: "agent.v1.AgentStoreConflictResult";
  result: { case: "success"; value: agent_v1_AgentStoreConflictSuccess } | { case: "error"; value: agent_v1_AgentStoreConflictError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AgentStoreConflictResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AgentStoreConflictResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AgentStoreConflictResult;
  static equals(a: agent_v1_AgentStoreConflictResult | MessageInit<agent_v1_AgentStoreConflictResult> | undefined, b: agent_v1_AgentStoreConflictResult | MessageInit<agent_v1_AgentStoreConflictResult> | undefined): boolean;
}

/** agent.v1.AgentStoreConflictSuccess; source: ../proto/dist/generated/agent/v1/agent_store_conflict_exec_pb.js */
export declare class agent_v1_AgentStoreConflictSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AgentStoreConflictSuccess>);
  static readonly typeName: "agent.v1.AgentStoreConflictSuccess";
  events: agent_v1_AgentStoreConflictEvent[];
  nextCursor?: agent_v1_AgentStoreConflictCursor;
  gap: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AgentStoreConflictSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AgentStoreConflictSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AgentStoreConflictSuccess;
  static equals(a: agent_v1_AgentStoreConflictSuccess | MessageInit<agent_v1_AgentStoreConflictSuccess> | undefined, b: agent_v1_AgentStoreConflictSuccess | MessageInit<agent_v1_AgentStoreConflictSuccess> | undefined): boolean;
}

/** agent.v1.ApiKeyCredentials; source: ../proto/dist/generated/agent/v1/requested_model_pb.js */
export declare class agent_v1_ApiKeyCredentials extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ApiKeyCredentials>);
  static readonly typeName: "agent.v1.ApiKeyCredentials";
  apiKey: string;
  baseUrl?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ApiKeyCredentials;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ApiKeyCredentials;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ApiKeyCredentials;
  static equals(a: agent_v1_ApiKeyCredentials | MessageInit<agent_v1_ApiKeyCredentials> | undefined, b: agent_v1_ApiKeyCredentials | MessageInit<agent_v1_ApiKeyCredentials> | undefined): boolean;
}

/** agent.v1.ArtifactPathError; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ArtifactPathError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ArtifactPathError>);
  static readonly typeName: "agent.v1.ArtifactPathError";
  kind: agent_v1_ArtifactPathErrorKind;
  code: string;
  message: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ArtifactPathError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ArtifactPathError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ArtifactPathError;
  static equals(a: agent_v1_ArtifactPathError | MessageInit<agent_v1_ArtifactPathError> | undefined, b: agent_v1_ArtifactPathError | MessageInit<agent_v1_ArtifactPathError> | undefined): boolean;
}

/** agent.v1.ArtifactPathErrorKind; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_ArtifactPathErrorKind {
  "UNSPECIFIED" = 0,
  "MISSING" = 1,
  "PERMISSION" = 2,
  "NOT_A_FILE" = 3,
  "INVALID_PATH" = 4,
  "UNKNOWN" = 5,
}

/** agent.v1.ArtifactRestoreStatus; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_ArtifactRestoreStatus {
  "UNSPECIFIED" = 0,
  "RESTORED" = 1,
  "SKIPPED_ALREADY_EXISTS" = 2,
  "REJECTED" = 3,
}

/** agent.v1.ArtifactRootKind; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_ArtifactRootKind {
  "UNSPECIFIED" = 0,
  "LOCAL" = 1,
  "AGENT_STORE_BACKED" = 2,
}

/** agent.v1.ArtifactUploadDispatchResult; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ArtifactUploadDispatchResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ArtifactUploadDispatchResult>);
  static readonly typeName: "agent.v1.ArtifactUploadDispatchResult";
  absolutePath: string;
  status: agent_v1_ArtifactUploadDispatchStatus;
  message: string;
  slackFileId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ArtifactUploadDispatchResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ArtifactUploadDispatchResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ArtifactUploadDispatchResult;
  static equals(a: agent_v1_ArtifactUploadDispatchResult | MessageInit<agent_v1_ArtifactUploadDispatchResult> | undefined, b: agent_v1_ArtifactUploadDispatchResult | MessageInit<agent_v1_ArtifactUploadDispatchResult> | undefined): boolean;
}

/** agent.v1.ArtifactUploadDispatchStatus; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_ArtifactUploadDispatchStatus {
  "UNSPECIFIED" = 0,
  "ACCEPTED" = 1,
  "REJECTED" = 2,
  "SKIPPED_ALREADY_IN_PROGRESS" = 3,
}

/** agent.v1.ArtifactUploadInstruction; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ArtifactUploadInstruction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ArtifactUploadInstruction>);
  static readonly typeName: "agent.v1.ArtifactUploadInstruction";
  absolutePath: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  contentType?: string;
  slackUploadUrl?: string;
  slackFileId?: string;
  artifactRelativePath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ArtifactUploadInstruction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ArtifactUploadInstruction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ArtifactUploadInstruction;
  static equals(a: agent_v1_ArtifactUploadInstruction | MessageInit<agent_v1_ArtifactUploadInstruction> | undefined, b: agent_v1_ArtifactUploadInstruction | MessageInit<agent_v1_ArtifactUploadInstruction> | undefined): boolean;
}

/** agent.v1.ArtifactUploadMetadata; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ArtifactUploadMetadata extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ArtifactUploadMetadata>);
  static readonly typeName: "agent.v1.ArtifactUploadMetadata";
  absolutePath: string;
  sizeBytes: bigint;
  updatedAtUnixMs: bigint;
  status: agent_v1_ArtifactUploadStatus;
  bytesUploaded: bigint;
  lastError: string;
  uploadAttempts: number;
  lastStartedAtUnixMs: bigint;
  lastFinishedAtUnixMs: bigint;
  uploadId: string;
  artifactRelativePath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ArtifactUploadMetadata;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ArtifactUploadMetadata;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ArtifactUploadMetadata;
  static equals(a: agent_v1_ArtifactUploadMetadata | MessageInit<agent_v1_ArtifactUploadMetadata> | undefined, b: agent_v1_ArtifactUploadMetadata | MessageInit<agent_v1_ArtifactUploadMetadata> | undefined): boolean;
}

/** agent.v1.ArtifactUploadStatus; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_ArtifactUploadStatus {
  "UNSPECIFIED" = 0,
  "NOT_STARTED" = 1,
  "IN_PROGRESS" = 2,
  "COMPLETED" = 3,
  "FAILED" = 4,
}

/** agent.v1.AttachPtyRequest; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_AttachPtyRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AttachPtyRequest>);
  static readonly typeName: "agent.v1.AttachPtyRequest";
  ptyId: string;
  lastEventId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AttachPtyRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AttachPtyRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AttachPtyRequest;
  static equals(a: agent_v1_AttachPtyRequest | MessageInit<agent_v1_AttachPtyRequest> | undefined, b: agent_v1_AttachPtyRequest | MessageInit<agent_v1_AttachPtyRequest> | undefined): boolean;
}

/** agent.v1.AttachTmuxSessionRequest; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_AttachTmuxSessionRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AttachTmuxSessionRequest>);
  static readonly typeName: "agent.v1.AttachTmuxSessionRequest";
  sessionId: string;
  cols: number;
  rows: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AttachTmuxSessionRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AttachTmuxSessionRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AttachTmuxSessionRequest;
  static equals(a: agent_v1_AttachTmuxSessionRequest | MessageInit<agent_v1_AttachTmuxSessionRequest> | undefined, b: agent_v1_AttachTmuxSessionRequest | MessageInit<agent_v1_AttachTmuxSessionRequest> | undefined): boolean;
}

/** agent.v1.AttachTmuxSessionResponse; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_AttachTmuxSessionResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AttachTmuxSessionResponse>);
  static readonly typeName: "agent.v1.AttachTmuxSessionResponse";
  ptyId: string;
  session?: agent_v1_TmuxSession;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AttachTmuxSessionResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AttachTmuxSessionResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AttachTmuxSessionResponse;
  static equals(a: agent_v1_AttachTmuxSessionResponse | MessageInit<agent_v1_AttachTmuxSessionResponse> | undefined, b: agent_v1_AttachTmuxSessionResponse | MessageInit<agent_v1_AttachTmuxSessionResponse> | undefined): boolean;
}

/** agent.v1.AzureCredentials; source: ../proto/dist/generated/agent/v1/requested_model_pb.js */
export declare class agent_v1_AzureCredentials extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_AzureCredentials>);
  static readonly typeName: "agent.v1.AzureCredentials";
  apiKey: string;
  baseUrl: string;
  deployment: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_AzureCredentials;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_AzureCredentials;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_AzureCredentials;
  static equals(a: agent_v1_AzureCredentials | MessageInit<agent_v1_AzureCredentials> | undefined, b: agent_v1_AzureCredentials | MessageInit<agent_v1_AzureCredentials> | undefined): boolean;
}

/** agent.v1.BackgroundShellSpawnArgs; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_BackgroundShellSpawnArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BackgroundShellSpawnArgs>);
  static readonly typeName: "agent.v1.BackgroundShellSpawnArgs";
  command: string;
  workingDirectory: string;
  toolCallId: string;
  parsingResult?: agent_v1_ShellCommandParsingResult;
  sandboxPolicy?: agent_v1_SandboxPolicy;
  enableWriteShellStdinTool: boolean;
  description?: string;
  classifierResult?: agent_v1_CommandClassifierResult;
  outputNotification?: agent_v1_ShellOutputNotificationConfig;
  smartModeApproval?: agent_v1_SmartModeApproval;
  hookApprovalRequirement?: agent_v1_ShellHookApprovalRequirement;
  skipApproval: boolean;
  conversationId?: string;
  adminCommandDenylist: string[];
  requestId?: string;
  suppressStdinLogging: boolean;
  secretScopeId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BackgroundShellSpawnArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnArgs;
  static equals(a: agent_v1_BackgroundShellSpawnArgs | MessageInit<agent_v1_BackgroundShellSpawnArgs> | undefined, b: agent_v1_BackgroundShellSpawnArgs | MessageInit<agent_v1_BackgroundShellSpawnArgs> | undefined): boolean;
}

/** agent.v1.BackgroundShellSpawnError; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_BackgroundShellSpawnError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BackgroundShellSpawnError>);
  static readonly typeName: "agent.v1.BackgroundShellSpawnError";
  command: string;
  workingDirectory: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BackgroundShellSpawnError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnError;
  static equals(a: agent_v1_BackgroundShellSpawnError | MessageInit<agent_v1_BackgroundShellSpawnError> | undefined, b: agent_v1_BackgroundShellSpawnError | MessageInit<agent_v1_BackgroundShellSpawnError> | undefined): boolean;
}

/** agent.v1.BackgroundShellSpawnResult; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_BackgroundShellSpawnResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BackgroundShellSpawnResult>);
  static readonly typeName: "agent.v1.BackgroundShellSpawnResult";
  result: { case: "success"; value: agent_v1_BackgroundShellSpawnSuccess } | { case: "error"; value: agent_v1_BackgroundShellSpawnError } | { case: "rejected"; value: agent_v1_ShellRejected } | { case: "permissionDenied"; value: agent_v1_ShellPermissionDenied } | { case: "sandboxUnsupported"; value: agent_v1_ShellSandboxUnsupported } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BackgroundShellSpawnResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnResult;
  static equals(a: agent_v1_BackgroundShellSpawnResult | MessageInit<agent_v1_BackgroundShellSpawnResult> | undefined, b: agent_v1_BackgroundShellSpawnResult | MessageInit<agent_v1_BackgroundShellSpawnResult> | undefined): boolean;
}

/** agent.v1.BackgroundShellSpawnSuccess; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_BackgroundShellSpawnSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BackgroundShellSpawnSuccess>);
  static readonly typeName: "agent.v1.BackgroundShellSpawnSuccess";
  shellId: number;
  command: string;
  workingDirectory: string;
  pid?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BackgroundShellSpawnSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BackgroundShellSpawnSuccess;
  static equals(a: agent_v1_BackgroundShellSpawnSuccess | MessageInit<agent_v1_BackgroundShellSpawnSuccess> | undefined, b: agent_v1_BackgroundShellSpawnSuccess | MessageInit<agent_v1_BackgroundShellSpawnSuccess> | undefined): boolean;
}

/** agent.v1.BatchGetDiffError; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_BatchGetDiffError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BatchGetDiffError>);
  static readonly typeName: "agent.v1.BatchGetDiffError";
  kind: agent_v1_BatchGetDiffErrorKind;
  message: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BatchGetDiffError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BatchGetDiffError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BatchGetDiffError;
  static equals(a: agent_v1_BatchGetDiffError | MessageInit<agent_v1_BatchGetDiffError> | undefined, b: agent_v1_BatchGetDiffError | MessageInit<agent_v1_BatchGetDiffError> | undefined): boolean;
}

/** agent.v1.BatchGetDiffErrorKind; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_BatchGetDiffErrorKind {
  "UNSPECIFIED" = 0,
  "FETCH_FAILED" = 1,
  "DIFF_FAILED" = 2,
  "UNAUTHENTICATED" = 3,
  "NOT_FOUND" = 4,
  "INTERNAL" = 5,
}

/** agent.v1.BatchGetDiffItem; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_BatchGetDiffItem extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BatchGetDiffItem>);
  static readonly typeName: "agent.v1.BatchGetDiffItem";
  diffRequest?: aiserver_v1_GetDiffRequest;
  fetchBranches: string[];
  knownBaseSha?: string;
  knownHeadSha?: string;
  knownWorkspaceHash?: string;
  useCatFileBatch?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BatchGetDiffItem;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BatchGetDiffItem;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BatchGetDiffItem;
  static equals(a: agent_v1_BatchGetDiffItem | MessageInit<agent_v1_BatchGetDiffItem> | undefined, b: agent_v1_BatchGetDiffItem | MessageInit<agent_v1_BatchGetDiffItem> | undefined): boolean;
}

/** agent.v1.BatchGetDiffRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_BatchGetDiffRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BatchGetDiffRequest>);
  static readonly typeName: "agent.v1.BatchGetDiffRequest";
  items: agent_v1_BatchGetDiffItem[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BatchGetDiffRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BatchGetDiffRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BatchGetDiffRequest;
  static equals(a: agent_v1_BatchGetDiffRequest | MessageInit<agent_v1_BatchGetDiffRequest> | undefined, b: agent_v1_BatchGetDiffRequest | MessageInit<agent_v1_BatchGetDiffRequest> | undefined): boolean;
}

/** agent.v1.BatchGetDiffResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_BatchGetDiffResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BatchGetDiffResponse>);
  static readonly typeName: "agent.v1.BatchGetDiffResponse";
  results: agent_v1_BatchGetDiffResult[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BatchGetDiffResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BatchGetDiffResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BatchGetDiffResponse;
  static equals(a: agent_v1_BatchGetDiffResponse | MessageInit<agent_v1_BatchGetDiffResponse> | undefined, b: agent_v1_BatchGetDiffResponse | MessageInit<agent_v1_BatchGetDiffResponse> | undefined): boolean;
}

/** agent.v1.BatchGetDiffResult; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_BatchGetDiffResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BatchGetDiffResult>);
  static readonly typeName: "agent.v1.BatchGetDiffResult";
  itemIndex: number;
  fetchedBranches: string[];
  failedBranches: string[];
  resolvedBaseSha?: string;
  resolvedHeadSha?: string;
  resolvedWorkspaceHash?: string;
  result: { case: "diff"; value: aiserver_v1_GetDiffResponse } | { case: "error"; value: agent_v1_BatchGetDiffError } | { case: "unchanged"; value: agent_v1_BatchGetDiffUnchanged } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BatchGetDiffResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BatchGetDiffResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BatchGetDiffResult;
  static equals(a: agent_v1_BatchGetDiffResult | MessageInit<agent_v1_BatchGetDiffResult> | undefined, b: agent_v1_BatchGetDiffResult | MessageInit<agent_v1_BatchGetDiffResult> | undefined): boolean;
}

/** agent.v1.BatchGetDiffUnchanged; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_BatchGetDiffUnchanged extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BatchGetDiffUnchanged>);
  static readonly typeName: "agent.v1.BatchGetDiffUnchanged";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BatchGetDiffUnchanged;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BatchGetDiffUnchanged;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BatchGetDiffUnchanged;
  static equals(a: agent_v1_BatchGetDiffUnchanged | MessageInit<agent_v1_BatchGetDiffUnchanged> | undefined, b: agent_v1_BatchGetDiffUnchanged | MessageInit<agent_v1_BatchGetDiffUnchanged> | undefined): boolean;
}

/** agent.v1.BedrockCredentials; source: ../proto/dist/generated/agent/v1/requested_model_pb.js */
export declare class agent_v1_BedrockCredentials extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BedrockCredentials>);
  static readonly typeName: "agent.v1.BedrockCredentials";
  accessKey: string;
  secretKey: string;
  region: string;
  sessionToken?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BedrockCredentials;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BedrockCredentials;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BedrockCredentials;
  static equals(a: agent_v1_BedrockCredentials | MessageInit<agent_v1_BedrockCredentials> | undefined, b: agent_v1_BedrockCredentials | MessageInit<agent_v1_BedrockCredentials> | undefined): boolean;
}

/** agent.v1.BeforeSubmitPromptAttachment; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_BeforeSubmitPromptAttachment extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BeforeSubmitPromptAttachment>);
  static readonly typeName: "agent.v1.BeforeSubmitPromptAttachment";
  type: string;
  filePath: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BeforeSubmitPromptAttachment;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BeforeSubmitPromptAttachment;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BeforeSubmitPromptAttachment;
  static equals(a: agent_v1_BeforeSubmitPromptAttachment | MessageInit<agent_v1_BeforeSubmitPromptAttachment> | undefined, b: agent_v1_BeforeSubmitPromptAttachment | MessageInit<agent_v1_BeforeSubmitPromptAttachment> | undefined): boolean;
}

/** agent.v1.BeforeSubmitPromptRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_BeforeSubmitPromptRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BeforeSubmitPromptRequestQuery>);
  static readonly typeName: "agent.v1.BeforeSubmitPromptRequestQuery";
  prompt: string;
  attachments: agent_v1_BeforeSubmitPromptAttachment[];
  composerMode?: string;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BeforeSubmitPromptRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BeforeSubmitPromptRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BeforeSubmitPromptRequestQuery;
  static equals(a: agent_v1_BeforeSubmitPromptRequestQuery | MessageInit<agent_v1_BeforeSubmitPromptRequestQuery> | undefined, b: agent_v1_BeforeSubmitPromptRequestQuery | MessageInit<agent_v1_BeforeSubmitPromptRequestQuery> | undefined): boolean;
}

/** agent.v1.BeforeSubmitPromptRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_BeforeSubmitPromptRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_BeforeSubmitPromptRequestResponse>);
  static readonly typeName: "agent.v1.BeforeSubmitPromptRequestResponse";
  continue?: boolean;
  userMessage?: string;
  additionalContext?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_BeforeSubmitPromptRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_BeforeSubmitPromptRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_BeforeSubmitPromptRequestResponse;
  static equals(a: agent_v1_BeforeSubmitPromptRequestResponse | MessageInit<agent_v1_BeforeSubmitPromptRequestResponse> | undefined, b: agent_v1_BeforeSubmitPromptRequestResponse | MessageInit<agent_v1_BeforeSubmitPromptRequestResponse> | undefined): boolean;
}

/** agent.v1.CallFrame; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_CallFrame extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CallFrame>);
  static readonly typeName: "agent.v1.CallFrame";
  functionName?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CallFrame;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CallFrame;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CallFrame;
  static equals(a: agent_v1_CallFrame | MessageInit<agent_v1_CallFrame> | undefined, b: agent_v1_CallFrame | MessageInit<agent_v1_CallFrame> | undefined): boolean;
}

/** agent.v1.CanvasDiagnosticsArgs; source: ../proto/dist/generated/agent/v1/canvas_diagnostics_exec_pb.js */
export declare class agent_v1_CanvasDiagnosticsArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CanvasDiagnosticsArgs>);
  static readonly typeName: "agent.v1.CanvasDiagnosticsArgs";
  path: string;
  toolCallId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CanvasDiagnosticsArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsArgs;
  static equals(a: agent_v1_CanvasDiagnosticsArgs | MessageInit<agent_v1_CanvasDiagnosticsArgs> | undefined, b: agent_v1_CanvasDiagnosticsArgs | MessageInit<agent_v1_CanvasDiagnosticsArgs> | undefined): boolean;
}

/** agent.v1.CanvasDiagnosticsError; source: ../proto/dist/generated/agent/v1/canvas_diagnostics_exec_pb.js */
export declare class agent_v1_CanvasDiagnosticsError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CanvasDiagnosticsError>);
  static readonly typeName: "agent.v1.CanvasDiagnosticsError";
  path: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CanvasDiagnosticsError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsError;
  static equals(a: agent_v1_CanvasDiagnosticsError | MessageInit<agent_v1_CanvasDiagnosticsError> | undefined, b: agent_v1_CanvasDiagnosticsError | MessageInit<agent_v1_CanvasDiagnosticsError> | undefined): boolean;
}

/** agent.v1.CanvasDiagnosticsResult; source: ../proto/dist/generated/agent/v1/canvas_diagnostics_exec_pb.js */
export declare class agent_v1_CanvasDiagnosticsResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CanvasDiagnosticsResult>);
  static readonly typeName: "agent.v1.CanvasDiagnosticsResult";
  canvasId?: string;
  title?: string;
  saveState?: string;
  saveDetail?: string;
  result: { case: "success"; value: agent_v1_CanvasDiagnosticsSuccess } | { case: "error"; value: agent_v1_CanvasDiagnosticsError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CanvasDiagnosticsResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsResult;
  static equals(a: agent_v1_CanvasDiagnosticsResult | MessageInit<agent_v1_CanvasDiagnosticsResult> | undefined, b: agent_v1_CanvasDiagnosticsResult | MessageInit<agent_v1_CanvasDiagnosticsResult> | undefined): boolean;
}

/** agent.v1.CanvasDiagnosticsSuccess; source: ../proto/dist/generated/agent/v1/canvas_diagnostics_exec_pb.js */
export declare class agent_v1_CanvasDiagnosticsSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CanvasDiagnosticsSuccess>);
  static readonly typeName: "agent.v1.CanvasDiagnosticsSuccess";
  path: string;
  diagnostics: agent_v1_Diagnostic[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CanvasDiagnosticsSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CanvasDiagnosticsSuccess;
  static equals(a: agent_v1_CanvasDiagnosticsSuccess | MessageInit<agent_v1_CanvasDiagnosticsSuccess> | undefined, b: agent_v1_CanvasDiagnosticsSuccess | MessageInit<agent_v1_CanvasDiagnosticsSuccess> | undefined): boolean;
}

/** agent.v1.ClickAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ClickAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ClickAction>);
  static readonly typeName: "agent.v1.ClickAction";
  coordinate?: agent_v1_Coordinate;
  button: agent_v1_MouseButton;
  count: number;
  modifierKeys?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ClickAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ClickAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ClickAction;
  static equals(a: agent_v1_ClickAction | MessageInit<agent_v1_ClickAction> | undefined, b: agent_v1_ClickAction | MessageInit<agent_v1_ClickAction> | undefined): boolean;
}

/** agent.v1.ClientContinuationConfig; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ClientContinuationConfig extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ClientContinuationConfig>);
  static readonly typeName: "agent.v1.ClientContinuationConfig";
  idleThreshold: number;
  maxLoops: number;
  nudgeMessage: string;
  escapeMessageTemplate: string;
  collectBackgroundChildren: boolean;
  childrenCompletedMessageTemplate: string;
  continuationRoundDelayMs: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ClientContinuationConfig;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ClientContinuationConfig;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ClientContinuationConfig;
  static equals(a: agent_v1_ClientContinuationConfig | MessageInit<agent_v1_ClientContinuationConfig> | undefined, b: agent_v1_ClientContinuationConfig | MessageInit<agent_v1_ClientContinuationConfig> | undefined): boolean;
}

/** agent.v1.CommandClassifierResult; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_CommandClassifierResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CommandClassifierResult>);
  static readonly typeName: "agent.v1.CommandClassifierResult";
  commands: agent_v1_CommandClassifierResult_ClassifiedCommand[];
  suggestedSandboxMode: agent_v1_CommandClassifierResult_SuggestedSandboxMode;
  classificationFailed: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CommandClassifierResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CommandClassifierResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CommandClassifierResult;
  static equals(a: agent_v1_CommandClassifierResult | MessageInit<agent_v1_CommandClassifierResult> | undefined, b: agent_v1_CommandClassifierResult | MessageInit<agent_v1_CommandClassifierResult> | undefined): boolean;
}

/** agent.v1.CommandClassifierResult.ClassifiedCommand; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_CommandClassifierResult_ClassifiedCommand extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CommandClassifierResult_ClassifiedCommand>);
  static readonly typeName: "agent.v1.CommandClassifierResult.ClassifiedCommand";
  name: string;
  arguments: string[];
  suggestedAllowlistEntry?: string;
  subcommandTokens: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CommandClassifierResult_ClassifiedCommand;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CommandClassifierResult_ClassifiedCommand;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CommandClassifierResult_ClassifiedCommand;
  static equals(a: agent_v1_CommandClassifierResult_ClassifiedCommand | MessageInit<agent_v1_CommandClassifierResult_ClassifiedCommand> | undefined, b: agent_v1_CommandClassifierResult_ClassifiedCommand | MessageInit<agent_v1_CommandClassifierResult_ClassifiedCommand> | undefined): boolean;
}

/** agent.v1.CommandClassifierResult.SuggestedSandboxMode; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare enum agent_v1_CommandClassifierResult_SuggestedSandboxMode {
  "UNSPECIFIED" = 0,
  "SANDBOX" = 1,
  "NO_SANDBOX" = 2,
  "UNDETERMINED" = 3,
}

/** agent.v1.ComputerUseAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ComputerUseAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ComputerUseAction>);
  static readonly typeName: "agent.v1.ComputerUseAction";
  action: { case: "mouseMove"; value: agent_v1_MouseMoveAction } | { case: "click"; value: agent_v1_ClickAction } | { case: "mouseDown"; value: agent_v1_MouseDownAction } | { case: "mouseUp"; value: agent_v1_MouseUpAction } | { case: "drag"; value: agent_v1_DragAction } | { case: "scroll"; value: agent_v1_ScrollAction } | { case: "type"; value: agent_v1_TypeAction } | { case: "key"; value: agent_v1_KeyAction } | { case: "wait"; value: agent_v1_WaitAction } | { case: "screenshot"; value: agent_v1_ScreenshotAction } | { case: "cursorPosition"; value: agent_v1_CursorPositionAction } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ComputerUseAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ComputerUseAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ComputerUseAction;
  static equals(a: agent_v1_ComputerUseAction | MessageInit<agent_v1_ComputerUseAction> | undefined, b: agent_v1_ComputerUseAction | MessageInit<agent_v1_ComputerUseAction> | undefined): boolean;
}

/** agent.v1.ComputerUseArgs; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ComputerUseArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ComputerUseArgs>);
  static readonly typeName: "agent.v1.ComputerUseArgs";
  toolCallId: string;
  actions: agent_v1_ComputerUseAction[];
  description?: string;
  bindUnmappedCharacters?: boolean;
  desktopLeaseActorId?: string;
  screenshotSettleMs?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ComputerUseArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ComputerUseArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ComputerUseArgs;
  static equals(a: agent_v1_ComputerUseArgs | MessageInit<agent_v1_ComputerUseArgs> | undefined, b: agent_v1_ComputerUseArgs | MessageInit<agent_v1_ComputerUseArgs> | undefined): boolean;
}

/** agent.v1.ComputerUseError; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ComputerUseError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ComputerUseError>);
  static readonly typeName: "agent.v1.ComputerUseError";
  error: string;
  actionCount: number;
  durationMs: number;
  log?: string;
  screenshot?: string;
  screenshotPath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ComputerUseError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ComputerUseError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ComputerUseError;
  static equals(a: agent_v1_ComputerUseError | MessageInit<agent_v1_ComputerUseError> | undefined, b: agent_v1_ComputerUseError | MessageInit<agent_v1_ComputerUseError> | undefined): boolean;
}

/** agent.v1.ComputerUseResult; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ComputerUseResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ComputerUseResult>);
  static readonly typeName: "agent.v1.ComputerUseResult";
  result: { case: "success"; value: agent_v1_ComputerUseSuccess } | { case: "error"; value: agent_v1_ComputerUseError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ComputerUseResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ComputerUseResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ComputerUseResult;
  static equals(a: agent_v1_ComputerUseResult | MessageInit<agent_v1_ComputerUseResult> | undefined, b: agent_v1_ComputerUseResult | MessageInit<agent_v1_ComputerUseResult> | undefined): boolean;
}

/** agent.v1.ComputerUseSuccess; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ComputerUseSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ComputerUseSuccess>);
  static readonly typeName: "agent.v1.ComputerUseSuccess";
  actionCount: number;
  durationMs: number;
  screenshot?: string;
  log?: string;
  screenshotPath?: string;
  cursorPosition?: agent_v1_Coordinate;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ComputerUseSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ComputerUseSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ComputerUseSuccess;
  static equals(a: agent_v1_ComputerUseSuccess | MessageInit<agent_v1_ComputerUseSuccess> | undefined, b: agent_v1_ComputerUseSuccess | MessageInit<agent_v1_ComputerUseSuccess> | undefined): boolean;
}

/** agent.v1.ConversationSearchArgs; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ConversationSearchArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ConversationSearchArgs>);
  static readonly typeName: "agent.v1.ConversationSearchArgs";
  query: string;
  toolCallId: string;
  limit?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ConversationSearchArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ConversationSearchArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ConversationSearchArgs;
  static equals(a: agent_v1_ConversationSearchArgs | MessageInit<agent_v1_ConversationSearchArgs> | undefined, b: agent_v1_ConversationSearchArgs | MessageInit<agent_v1_ConversationSearchArgs> | undefined): boolean;
}

/** agent.v1.ConversationSearchError; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ConversationSearchError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ConversationSearchError>);
  static readonly typeName: "agent.v1.ConversationSearchError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ConversationSearchError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ConversationSearchError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ConversationSearchError;
  static equals(a: agent_v1_ConversationSearchError | MessageInit<agent_v1_ConversationSearchError> | undefined, b: agent_v1_ConversationSearchError | MessageInit<agent_v1_ConversationSearchError> | undefined): boolean;
}

/** agent.v1.ConversationSearchHit; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ConversationSearchHit extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ConversationSearchHit>);
  static readonly typeName: "agent.v1.ConversationSearchHit";
  conversationId: string;
  title: string;
  source: agent_v1_ConversationSearchSource;
  updatedAtMs: bigint;
  snippet?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ConversationSearchHit;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ConversationSearchHit;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ConversationSearchHit;
  static equals(a: agent_v1_ConversationSearchHit | MessageInit<agent_v1_ConversationSearchHit> | undefined, b: agent_v1_ConversationSearchHit | MessageInit<agent_v1_ConversationSearchHit> | undefined): boolean;
}

/** agent.v1.ConversationSearchResult; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ConversationSearchResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ConversationSearchResult>);
  static readonly typeName: "agent.v1.ConversationSearchResult";
  result: { case: "success"; value: agent_v1_ConversationSearchSuccess } | { case: "error"; value: agent_v1_ConversationSearchError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ConversationSearchResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ConversationSearchResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ConversationSearchResult;
  static equals(a: agent_v1_ConversationSearchResult | MessageInit<agent_v1_ConversationSearchResult> | undefined, b: agent_v1_ConversationSearchResult | MessageInit<agent_v1_ConversationSearchResult> | undefined): boolean;
}

/** agent.v1.ConversationSearchSource; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare enum agent_v1_ConversationSearchSource {
  "UNSPECIFIED" = 0,
  "LOCAL" = 1,
  "CLOUD_CACHE" = 2,
}

/** agent.v1.ConversationSearchSuccess; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ConversationSearchSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ConversationSearchSuccess>);
  static readonly typeName: "agent.v1.ConversationSearchSuccess";
  hits: agent_v1_ConversationSearchHit[];
  truncated: boolean;
  partial: boolean;
  rebuilding: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ConversationSearchSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ConversationSearchSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ConversationSearchSuccess;
  static equals(a: agent_v1_ConversationSearchSuccess | MessageInit<agent_v1_ConversationSearchSuccess> | undefined, b: agent_v1_ConversationSearchSuccess | MessageInit<agent_v1_ConversationSearchSuccess> | undefined): boolean;
}

/** agent.v1.Coordinate; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_Coordinate extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_Coordinate>);
  static readonly typeName: "agent.v1.Coordinate";
  x: number;
  y: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_Coordinate;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_Coordinate;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_Coordinate;
  static equals(a: agent_v1_Coordinate | MessageInit<agent_v1_Coordinate> | undefined, b: agent_v1_Coordinate | MessageInit<agent_v1_Coordinate> | undefined): boolean;
}

/** agent.v1.CreateTmuxSessionRequest; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_CreateTmuxSessionRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CreateTmuxSessionRequest>);
  static readonly typeName: "agent.v1.CreateTmuxSessionRequest";
  sessionName?: string;
  displayName: string;
  kind: agent_v1_TmuxSessionKind;
  process?: agent_v1_Process;
  cwd: string;
  env: Record<string, string>;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CreateTmuxSessionRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CreateTmuxSessionRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CreateTmuxSessionRequest;
  static equals(a: agent_v1_CreateTmuxSessionRequest | MessageInit<agent_v1_CreateTmuxSessionRequest> | undefined, b: agent_v1_CreateTmuxSessionRequest | MessageInit<agent_v1_CreateTmuxSessionRequest> | undefined): boolean;
}

/** agent.v1.CreateTmuxSessionResponse; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_CreateTmuxSessionResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CreateTmuxSessionResponse>);
  static readonly typeName: "agent.v1.CreateTmuxSessionResponse";
  session?: agent_v1_TmuxSession;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CreateTmuxSessionResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CreateTmuxSessionResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CreateTmuxSessionResponse;
  static equals(a: agent_v1_CreateTmuxSessionResponse | MessageInit<agent_v1_CreateTmuxSessionResponse> | undefined, b: agent_v1_CreateTmuxSessionResponse | MessageInit<agent_v1_CreateTmuxSessionResponse> | undefined): boolean;
}

/** agent.v1.CursorPositionAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_CursorPositionAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CursorPositionAction>);
  static readonly typeName: "agent.v1.CursorPositionAction";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CursorPositionAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CursorPositionAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CursorPositionAction;
  static equals(a: agent_v1_CursorPositionAction | MessageInit<agent_v1_CursorPositionAction> | undefined, b: agent_v1_CursorPositionAction | MessageInit<agent_v1_CursorPositionAction> | undefined): boolean;
}

/** agent.v1.CursorRule; source: ../proto/dist/generated/agent/v1/cursor_rules_pb.js */
export declare class agent_v1_CursorRule extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CursorRule>);
  static readonly typeName: "agent.v1.CursorRule";
  fullPath: string;
  content: string;
  type?: agent_v1_CursorRuleType;
  source: agent_v1_CursorRuleSource;
  gitRemoteOrigin?: string;
  parseError?: string;
  environments: string[];
  disabledEnvironments: string[];
  plugin?: string;
  marketplace?: string;
  pluginId?: string;
  marketplaceId?: string;
  scopedTo: string[];
  frontmatter: string;
  isRequired?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CursorRule;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CursorRule;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CursorRule;
  static equals(a: agent_v1_CursorRule | MessageInit<agent_v1_CursorRule> | undefined, b: agent_v1_CursorRule | MessageInit<agent_v1_CursorRule> | undefined): boolean;
}

/** agent.v1.CursorRuleSource; source: ../proto/dist/generated/agent/v1/cursor_rules_pb.js */
export declare enum agent_v1_CursorRuleSource {
  "UNSPECIFIED" = 0,
  "TEAM" = 1,
  "USER" = 2,
}

/** agent.v1.CursorRuleType; source: ../proto/dist/generated/agent/v1/cursor_rules_pb.js */
export declare class agent_v1_CursorRuleType extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CursorRuleType>);
  static readonly typeName: "agent.v1.CursorRuleType";
  type: { case: "global"; value: agent_v1_CursorRuleTypeGlobal } | { case: "fileGlobbed"; value: agent_v1_CursorRuleTypeFileGlobs } | { case: "agentFetched"; value: agent_v1_CursorRuleTypeAgentFetched } | { case: "manuallyAttached"; value: agent_v1_CursorRuleTypeManuallyAttached } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CursorRuleType;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CursorRuleType;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CursorRuleType;
  static equals(a: agent_v1_CursorRuleType | MessageInit<agent_v1_CursorRuleType> | undefined, b: agent_v1_CursorRuleType | MessageInit<agent_v1_CursorRuleType> | undefined): boolean;
}

/** agent.v1.CursorRuleTypeAgentFetched; source: ../proto/dist/generated/agent/v1/cursor_rules_pb.js */
export declare class agent_v1_CursorRuleTypeAgentFetched extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CursorRuleTypeAgentFetched>);
  static readonly typeName: "agent.v1.CursorRuleTypeAgentFetched";
  description: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CursorRuleTypeAgentFetched;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CursorRuleTypeAgentFetched;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CursorRuleTypeAgentFetched;
  static equals(a: agent_v1_CursorRuleTypeAgentFetched | MessageInit<agent_v1_CursorRuleTypeAgentFetched> | undefined, b: agent_v1_CursorRuleTypeAgentFetched | MessageInit<agent_v1_CursorRuleTypeAgentFetched> | undefined): boolean;
}

/** agent.v1.CursorRuleTypeFileGlobs; source: ../proto/dist/generated/agent/v1/cursor_rules_pb.js */
export declare class agent_v1_CursorRuleTypeFileGlobs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CursorRuleTypeFileGlobs>);
  static readonly typeName: "agent.v1.CursorRuleTypeFileGlobs";
  globs: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CursorRuleTypeFileGlobs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CursorRuleTypeFileGlobs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CursorRuleTypeFileGlobs;
  static equals(a: agent_v1_CursorRuleTypeFileGlobs | MessageInit<agent_v1_CursorRuleTypeFileGlobs> | undefined, b: agent_v1_CursorRuleTypeFileGlobs | MessageInit<agent_v1_CursorRuleTypeFileGlobs> | undefined): boolean;
}

/** agent.v1.CursorRuleTypeGlobal; source: ../proto/dist/generated/agent/v1/cursor_rules_pb.js */
export declare class agent_v1_CursorRuleTypeGlobal extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CursorRuleTypeGlobal>);
  static readonly typeName: "agent.v1.CursorRuleTypeGlobal";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CursorRuleTypeGlobal;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CursorRuleTypeGlobal;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CursorRuleTypeGlobal;
  static equals(a: agent_v1_CursorRuleTypeGlobal | MessageInit<agent_v1_CursorRuleTypeGlobal> | undefined, b: agent_v1_CursorRuleTypeGlobal | MessageInit<agent_v1_CursorRuleTypeGlobal> | undefined): boolean;
}

/** agent.v1.CursorRuleTypeManuallyAttached; source: ../proto/dist/generated/agent/v1/cursor_rules_pb.js */
export declare class agent_v1_CursorRuleTypeManuallyAttached extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CursorRuleTypeManuallyAttached>);
  static readonly typeName: "agent.v1.CursorRuleTypeManuallyAttached";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CursorRuleTypeManuallyAttached;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CursorRuleTypeManuallyAttached;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CursorRuleTypeManuallyAttached;
  static equals(a: agent_v1_CursorRuleTypeManuallyAttached | MessageInit<agent_v1_CursorRuleTypeManuallyAttached> | undefined, b: agent_v1_CursorRuleTypeManuallyAttached | MessageInit<agent_v1_CursorRuleTypeManuallyAttached> | undefined): boolean;
}

/** agent.v1.CustomSubagent; source: ../proto/dist/generated/agent/v1/subagents_pb.js */
export declare class agent_v1_CustomSubagent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_CustomSubagent>);
  static readonly typeName: "agent.v1.CustomSubagent";
  fullPath: string;
  name: string;
  description: string;
  tools: string[];
  model: string;
  prompt: string;
  permissionMode: agent_v1_CustomSubagentPermissionMode;
  isBackground: boolean;
  plugin?: string;
  marketplace?: string;
  pluginId?: string;
  marketplaceId?: string;
  forceDefaultModel: boolean;
  source?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_CustomSubagent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_CustomSubagent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_CustomSubagent;
  static equals(a: agent_v1_CustomSubagent | MessageInit<agent_v1_CustomSubagent> | undefined, b: agent_v1_CustomSubagent | MessageInit<agent_v1_CustomSubagent> | undefined): boolean;
}

/** agent.v1.CustomSubagentPermissionMode; source: ../proto/dist/generated/agent/v1/subagents_pb.js */
export declare enum agent_v1_CustomSubagentPermissionMode {
  "UNSPECIFIED" = 0,
  "DEFAULT" = 1,
  "READONLY" = 2,
  "AGENT_ONLY" = 3,
}

/** agent.v1.DebugModeConfig; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_DebugModeConfig extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DebugModeConfig>);
  static readonly typeName: "agent.v1.DebugModeConfig";
  logPath: string;
  serverEndpoint: string;
  sessionId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DebugModeConfig;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DebugModeConfig;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DebugModeConfig;
  static equals(a: agent_v1_DebugModeConfig | MessageInit<agent_v1_DebugModeConfig> | undefined, b: agent_v1_DebugModeConfig | MessageInit<agent_v1_DebugModeConfig> | undefined): boolean;
}

/** agent.v1.DeleteArgs; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteArgs>);
  static readonly typeName: "agent.v1.DeleteArgs";
  path: string;
  toolCallId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteArgs;
  static equals(a: agent_v1_DeleteArgs | MessageInit<agent_v1_DeleteArgs> | undefined, b: agent_v1_DeleteArgs | MessageInit<agent_v1_DeleteArgs> | undefined): boolean;
}

/** agent.v1.DeleteError; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteError>);
  static readonly typeName: "agent.v1.DeleteError";
  path: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteError;
  static equals(a: agent_v1_DeleteError | MessageInit<agent_v1_DeleteError> | undefined, b: agent_v1_DeleteError | MessageInit<agent_v1_DeleteError> | undefined): boolean;
}

/** agent.v1.DeleteFileBusy; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteFileBusy extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteFileBusy>);
  static readonly typeName: "agent.v1.DeleteFileBusy";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteFileBusy;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteFileBusy;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteFileBusy;
  static equals(a: agent_v1_DeleteFileBusy | MessageInit<agent_v1_DeleteFileBusy> | undefined, b: agent_v1_DeleteFileBusy | MessageInit<agent_v1_DeleteFileBusy> | undefined): boolean;
}

/** agent.v1.DeleteFileNotFound; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteFileNotFound extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteFileNotFound>);
  static readonly typeName: "agent.v1.DeleteFileNotFound";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteFileNotFound;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteFileNotFound;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteFileNotFound;
  static equals(a: agent_v1_DeleteFileNotFound | MessageInit<agent_v1_DeleteFileNotFound> | undefined, b: agent_v1_DeleteFileNotFound | MessageInit<agent_v1_DeleteFileNotFound> | undefined): boolean;
}

/** agent.v1.DeleteNotFile; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteNotFile extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteNotFile>);
  static readonly typeName: "agent.v1.DeleteNotFile";
  path: string;
  actualType: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteNotFile;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteNotFile;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteNotFile;
  static equals(a: agent_v1_DeleteNotFile | MessageInit<agent_v1_DeleteNotFile> | undefined, b: agent_v1_DeleteNotFile | MessageInit<agent_v1_DeleteNotFile> | undefined): boolean;
}

/** agent.v1.DeletePermissionDenied; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeletePermissionDenied extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeletePermissionDenied>);
  static readonly typeName: "agent.v1.DeletePermissionDenied";
  path: string;
  clientVisibleError: string;
  isReadonly: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeletePermissionDenied;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeletePermissionDenied;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeletePermissionDenied;
  static equals(a: agent_v1_DeletePermissionDenied | MessageInit<agent_v1_DeletePermissionDenied> | undefined, b: agent_v1_DeletePermissionDenied | MessageInit<agent_v1_DeletePermissionDenied> | undefined): boolean;
}

/** agent.v1.DeleteRejected; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteRejected>);
  static readonly typeName: "agent.v1.DeleteRejected";
  path: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteRejected;
  static equals(a: agent_v1_DeleteRejected | MessageInit<agent_v1_DeleteRejected> | undefined, b: agent_v1_DeleteRejected | MessageInit<agent_v1_DeleteRejected> | undefined): boolean;
}

/** agent.v1.DeleteResult; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteResult>);
  static readonly typeName: "agent.v1.DeleteResult";
  result: { case: "success"; value: agent_v1_DeleteSuccess } | { case: "fileNotFound"; value: agent_v1_DeleteFileNotFound } | { case: "notFile"; value: agent_v1_DeleteNotFile } | { case: "permissionDenied"; value: agent_v1_DeletePermissionDenied } | { case: "fileBusy"; value: agent_v1_DeleteFileBusy } | { case: "rejected"; value: agent_v1_DeleteRejected } | { case: "error"; value: agent_v1_DeleteError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteResult;
  static equals(a: agent_v1_DeleteResult | MessageInit<agent_v1_DeleteResult> | undefined, b: agent_v1_DeleteResult | MessageInit<agent_v1_DeleteResult> | undefined): boolean;
}

/** agent.v1.DeleteSuccess; source: ../proto/dist/generated/agent/v1/delete_exec_pb.js */
export declare class agent_v1_DeleteSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DeleteSuccess>);
  static readonly typeName: "agent.v1.DeleteSuccess";
  path: string;
  deletedFile: string;
  fileSize: bigint;
  prevContent: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DeleteSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DeleteSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DeleteSuccess;
  static equals(a: agent_v1_DeleteSuccess | MessageInit<agent_v1_DeleteSuccess> | undefined, b: agent_v1_DeleteSuccess | MessageInit<agent_v1_DeleteSuccess> | undefined): boolean;
}

/** agent.v1.DesktopLeaseAcquire; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DesktopLeaseAcquire extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DesktopLeaseAcquire>);
  static readonly typeName: "agent.v1.DesktopLeaseAcquire";
  actorId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DesktopLeaseAcquire;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DesktopLeaseAcquire;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DesktopLeaseAcquire;
  static equals(a: agent_v1_DesktopLeaseAcquire | MessageInit<agent_v1_DesktopLeaseAcquire> | undefined, b: agent_v1_DesktopLeaseAcquire | MessageInit<agent_v1_DesktopLeaseAcquire> | undefined): boolean;
}

/** agent.v1.DesktopLeaseActorKind; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_DesktopLeaseActorKind {
  "UNSPECIFIED" = 0,
  "HUMAN" = 1,
  "AGENT" = 2,
}

/** agent.v1.DesktopLeaseGetState; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DesktopLeaseGetState extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DesktopLeaseGetState>);
  static readonly typeName: "agent.v1.DesktopLeaseGetState";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DesktopLeaseGetState;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DesktopLeaseGetState;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DesktopLeaseGetState;
  static equals(a: agent_v1_DesktopLeaseGetState | MessageInit<agent_v1_DesktopLeaseGetState> | undefined, b: agent_v1_DesktopLeaseGetState | MessageInit<agent_v1_DesktopLeaseGetState> | undefined): boolean;
}

/** agent.v1.DesktopLeaseOwner; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DesktopLeaseOwner extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DesktopLeaseOwner>);
  static readonly typeName: "agent.v1.DesktopLeaseOwner";
  kind: agent_v1_DesktopLeaseActorKind;
  actorId: string;
  expiresAtUnixMs: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DesktopLeaseOwner;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DesktopLeaseOwner;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DesktopLeaseOwner;
  static equals(a: agent_v1_DesktopLeaseOwner | MessageInit<agent_v1_DesktopLeaseOwner> | undefined, b: agent_v1_DesktopLeaseOwner | MessageInit<agent_v1_DesktopLeaseOwner> | undefined): boolean;
}

/** agent.v1.DesktopLeaseRelease; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DesktopLeaseRelease extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DesktopLeaseRelease>);
  static readonly typeName: "agent.v1.DesktopLeaseRelease";
  actorId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DesktopLeaseRelease;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DesktopLeaseRelease;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DesktopLeaseRelease;
  static equals(a: agent_v1_DesktopLeaseRelease | MessageInit<agent_v1_DesktopLeaseRelease> | undefined, b: agent_v1_DesktopLeaseRelease | MessageInit<agent_v1_DesktopLeaseRelease> | undefined): boolean;
}

/** agent.v1.DesktopLeaseRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DesktopLeaseRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DesktopLeaseRequest>);
  static readonly typeName: "agent.v1.DesktopLeaseRequest";
  action: { case: "acquire"; value: agent_v1_DesktopLeaseAcquire } | { case: "release"; value: agent_v1_DesktopLeaseRelease } | { case: "getState"; value: agent_v1_DesktopLeaseGetState } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DesktopLeaseRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DesktopLeaseRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DesktopLeaseRequest;
  static equals(a: agent_v1_DesktopLeaseRequest | MessageInit<agent_v1_DesktopLeaseRequest> | undefined, b: agent_v1_DesktopLeaseRequest | MessageInit<agent_v1_DesktopLeaseRequest> | undefined): boolean;
}

/** agent.v1.DesktopLeaseResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DesktopLeaseResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DesktopLeaseResponse>);
  static readonly typeName: "agent.v1.DesktopLeaseResponse";
  status: agent_v1_DesktopLeaseStatus;
  owner?: agent_v1_DesktopLeaseOwner;
  message: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DesktopLeaseResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DesktopLeaseResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DesktopLeaseResponse;
  static equals(a: agent_v1_DesktopLeaseResponse | MessageInit<agent_v1_DesktopLeaseResponse> | undefined, b: agent_v1_DesktopLeaseResponse | MessageInit<agent_v1_DesktopLeaseResponse> | undefined): boolean;
}

/** agent.v1.DesktopLeaseStatus; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_DesktopLeaseStatus {
  "UNSPECIFIED" = 0,
  "OK" = 1,
  "BUSY" = 2,
  "INVALID_REQUEST" = 3,
}

/** agent.v1.Diagnostic; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_Diagnostic extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_Diagnostic>);
  static readonly typeName: "agent.v1.Diagnostic";
  severity: agent_v1_DiagnosticSeverity;
  range?: agent_v1_Range;
  message: string;
  source: string;
  code: string;
  isStale: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_Diagnostic;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_Diagnostic;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_Diagnostic;
  static equals(a: agent_v1_Diagnostic | MessageInit<agent_v1_Diagnostic> | undefined, b: agent_v1_Diagnostic | MessageInit<agent_v1_Diagnostic> | undefined): boolean;
}

/** agent.v1.DiagnosticsArgs; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_DiagnosticsArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DiagnosticsArgs>);
  static readonly typeName: "agent.v1.DiagnosticsArgs";
  path: string;
  toolCallId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DiagnosticsArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DiagnosticsArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DiagnosticsArgs;
  static equals(a: agent_v1_DiagnosticsArgs | MessageInit<agent_v1_DiagnosticsArgs> | undefined, b: agent_v1_DiagnosticsArgs | MessageInit<agent_v1_DiagnosticsArgs> | undefined): boolean;
}

/** agent.v1.DiagnosticsError; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_DiagnosticsError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DiagnosticsError>);
  static readonly typeName: "agent.v1.DiagnosticsError";
  path: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DiagnosticsError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DiagnosticsError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DiagnosticsError;
  static equals(a: agent_v1_DiagnosticsError | MessageInit<agent_v1_DiagnosticsError> | undefined, b: agent_v1_DiagnosticsError | MessageInit<agent_v1_DiagnosticsError> | undefined): boolean;
}

/** agent.v1.DiagnosticSeverity; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare enum agent_v1_DiagnosticSeverity {
  "UNSPECIFIED" = 0,
  "ERROR" = 1,
  "WARNING" = 2,
  "INFORMATION" = 3,
  "HINT" = 4,
}

/** agent.v1.DiagnosticsFileNotFound; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_DiagnosticsFileNotFound extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DiagnosticsFileNotFound>);
  static readonly typeName: "agent.v1.DiagnosticsFileNotFound";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DiagnosticsFileNotFound;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DiagnosticsFileNotFound;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DiagnosticsFileNotFound;
  static equals(a: agent_v1_DiagnosticsFileNotFound | MessageInit<agent_v1_DiagnosticsFileNotFound> | undefined, b: agent_v1_DiagnosticsFileNotFound | MessageInit<agent_v1_DiagnosticsFileNotFound> | undefined): boolean;
}

/** agent.v1.DiagnosticsPermissionDenied; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_DiagnosticsPermissionDenied extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DiagnosticsPermissionDenied>);
  static readonly typeName: "agent.v1.DiagnosticsPermissionDenied";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DiagnosticsPermissionDenied;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DiagnosticsPermissionDenied;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DiagnosticsPermissionDenied;
  static equals(a: agent_v1_DiagnosticsPermissionDenied | MessageInit<agent_v1_DiagnosticsPermissionDenied> | undefined, b: agent_v1_DiagnosticsPermissionDenied | MessageInit<agent_v1_DiagnosticsPermissionDenied> | undefined): boolean;
}

/** agent.v1.DiagnosticsRejected; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_DiagnosticsRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DiagnosticsRejected>);
  static readonly typeName: "agent.v1.DiagnosticsRejected";
  path: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DiagnosticsRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DiagnosticsRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DiagnosticsRejected;
  static equals(a: agent_v1_DiagnosticsRejected | MessageInit<agent_v1_DiagnosticsRejected> | undefined, b: agent_v1_DiagnosticsRejected | MessageInit<agent_v1_DiagnosticsRejected> | undefined): boolean;
}

/** agent.v1.DiagnosticsResult; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_DiagnosticsResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DiagnosticsResult>);
  static readonly typeName: "agent.v1.DiagnosticsResult";
  result: { case: "success"; value: agent_v1_DiagnosticsSuccess } | { case: "error"; value: agent_v1_DiagnosticsError } | { case: "rejected"; value: agent_v1_DiagnosticsRejected } | { case: "fileNotFound"; value: agent_v1_DiagnosticsFileNotFound } | { case: "permissionDenied"; value: agent_v1_DiagnosticsPermissionDenied } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DiagnosticsResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DiagnosticsResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DiagnosticsResult;
  static equals(a: agent_v1_DiagnosticsResult | MessageInit<agent_v1_DiagnosticsResult> | undefined, b: agent_v1_DiagnosticsResult | MessageInit<agent_v1_DiagnosticsResult> | undefined): boolean;
}

/** agent.v1.DiagnosticsSuccess; source: ../proto/dist/generated/agent/v1/diagnostics_exec_pb.js */
export declare class agent_v1_DiagnosticsSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DiagnosticsSuccess>);
  static readonly typeName: "agent.v1.DiagnosticsSuccess";
  path: string;
  diagnostics: agent_v1_Diagnostic[];
  totalDiagnostics: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DiagnosticsSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DiagnosticsSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DiagnosticsSuccess;
  static equals(a: agent_v1_DiagnosticsSuccess | MessageInit<agent_v1_DiagnosticsSuccess> | undefined, b: agent_v1_DiagnosticsSuccess | MessageInit<agent_v1_DiagnosticsSuccess> | undefined): boolean;
}

/** agent.v1.DirectoryEntry; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DirectoryEntry extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DirectoryEntry>);
  static readonly typeName: "agent.v1.DirectoryEntry";
  name: string;
  path: string;
  type: agent_v1_EntryType;
  sizeBytes: bigint;
  modifiedAtUnixMs: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DirectoryEntry;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DirectoryEntry;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DirectoryEntry;
  static equals(a: agent_v1_DirectoryEntry | MessageInit<agent_v1_DirectoryEntry> | undefined, b: agent_v1_DirectoryEntry | MessageInit<agent_v1_DirectoryEntry> | undefined): boolean;
}

/** agent.v1.DownloadCursorServerRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DownloadCursorServerRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DownloadCursorServerRequest>);
  static readonly typeName: "agent.v1.DownloadCursorServerRequest";
  commit: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DownloadCursorServerRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DownloadCursorServerRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DownloadCursorServerRequest;
  static equals(a: agent_v1_DownloadCursorServerRequest | MessageInit<agent_v1_DownloadCursorServerRequest> | undefined, b: agent_v1_DownloadCursorServerRequest | MessageInit<agent_v1_DownloadCursorServerRequest> | undefined): boolean;
}

/** agent.v1.DownloadCursorServerResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_DownloadCursorServerResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DownloadCursorServerResponse>);
  static readonly typeName: "agent.v1.DownloadCursorServerResponse";
  alreadyDownloaded: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DownloadCursorServerResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DownloadCursorServerResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DownloadCursorServerResponse;
  static equals(a: agent_v1_DownloadCursorServerResponse | MessageInit<agent_v1_DownloadCursorServerResponse> | undefined, b: agent_v1_DownloadCursorServerResponse | MessageInit<agent_v1_DownloadCursorServerResponse> | undefined): boolean;
}

/** agent.v1.DragAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_DragAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_DragAction>);
  static readonly typeName: "agent.v1.DragAction";
  path: agent_v1_Coordinate[];
  button: agent_v1_MouseButton;
  modifierKeys?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_DragAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_DragAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_DragAction;
  static equals(a: agent_v1_DragAction | MessageInit<agent_v1_DragAction> | undefined, b: agent_v1_DragAction | MessageInit<agent_v1_DragAction> | undefined): boolean;
}

/** agent.v1.EntryType; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_EntryType {
  "UNSPECIFIED" = 0,
  "FILE" = 1,
  "DIRECTORY" = 2,
  "SYMLINK" = 3,
}

/** agent.v1.ExecClientControlMessage; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecClientControlMessage extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecClientControlMessage>);
  static readonly typeName: "agent.v1.ExecClientControlMessage";
  message: { case: "streamClose"; value: agent_v1_ExecClientStreamClose } | { case: "throw"; value: agent_v1_ExecClientThrow } | { case: "heartbeat"; value: agent_v1_ExecClientHeartbeat } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecClientControlMessage;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecClientControlMessage;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecClientControlMessage;
  static equals(a: agent_v1_ExecClientControlMessage | MessageInit<agent_v1_ExecClientControlMessage> | undefined, b: agent_v1_ExecClientControlMessage | MessageInit<agent_v1_ExecClientControlMessage> | undefined): boolean;
}

/** agent.v1.ExecClientHeartbeat; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecClientHeartbeat extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecClientHeartbeat>);
  static readonly typeName: "agent.v1.ExecClientHeartbeat";
  id: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecClientHeartbeat;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecClientHeartbeat;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecClientHeartbeat;
  static equals(a: agent_v1_ExecClientHeartbeat | MessageInit<agent_v1_ExecClientHeartbeat> | undefined, b: agent_v1_ExecClientHeartbeat | MessageInit<agent_v1_ExecClientHeartbeat> | undefined): boolean;
}

/** agent.v1.ExecClientMessage; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecClientMessage extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecClientMessage>);
  static readonly typeName: "agent.v1.ExecClientMessage";
  id: number;
  execId: string;
  localExecutionTimeMs?: number;
  hookAdditionalContexts: agent_v1_HookAdditionalContext[];
  message: { case: "shellResult"; value: agent_v1_ShellResult } | { case: "writeResult"; value: agent_v1_WriteResult } | { case: "deleteResult"; value: agent_v1_DeleteResult } | { case: "grepResult"; value: agent_v1_GrepResult } | { case: "readResult"; value: agent_v1_ReadResult } | { case: "redactedReadResult"; value: agent_v1_ReadResult } | { case: "lsResult"; value: agent_v1_LsResult } | { case: "diagnosticsResult"; value: agent_v1_DiagnosticsResult } | { case: "requestContextResult"; value: agent_v1_RequestContextResult } | { case: "mcpResult"; value: agent_v1_McpResult } | { case: "shellStream"; value: agent_v1_ShellStream } | { case: "backgroundShellSpawnResult"; value: agent_v1_BackgroundShellSpawnResult } | { case: "listMcpResourcesExecResult"; value: agent_v1_ListMcpResourcesExecResult } | { case: "readMcpResourceExecResult"; value: agent_v1_ReadMcpResourceExecResult } | { case: "mcpStateExecResult"; value: agent_v1_McpStateExecResult } | { case: "fetchResult"; value: agent_v1_FetchResult } | { case: "recordScreenResult"; value: agent_v1_RecordScreenResult } | { case: "computerUseResult"; value: agent_v1_ComputerUseResult } | { case: "writeShellStdinResult"; value: agent_v1_WriteShellStdinResult } | { case: "executeHookResult"; value: agent_v1_ExecuteHookResult } | { case: "subagentResult"; value: agent_v1_SubagentResult } | { case: "forceBackgroundShellResult"; value: agent_v1_ForceBackgroundShellResult } | { case: "forceBackgroundSubagentResult"; value: agent_v1_ForceBackgroundSubagentResult } | { case: "subagentAwaitResult"; value: agent_v1_SubagentAwaitResult } | { case: "smartModeClassifierResult"; value: agent_v1_SmartModeClassifierResult } | { case: "canvasDiagnosticsResult"; value: agent_v1_CanvasDiagnosticsResult } | { case: "shellAllowlistPrecheckResult"; value: agent_v1_ShellAllowlistPrecheckResult } | { case: "mcpAllowlistPrecheckResult"; value: agent_v1_McpAllowlistPrecheckResult } | { case: "webFetchAllowlistPrecheckResult"; value: agent_v1_WebFetchAllowlistPrecheckResult } | { case: "gitDiffResponse"; value: aiserver_v1_GetDiffResponse } | { case: "piReadResult"; value: agent_v1_PiReadExecResult } | { case: "piBashResult"; value: agent_v1_PiBashExecResult } | { case: "piEditResult"; value: agent_v1_PiEditExecResult } | { case: "piWriteResult"; value: agent_v1_PiWriteExecResult } | { case: "piGrepResult"; value: agent_v1_PiGrepExecResult } | { case: "piFindResult"; value: agent_v1_PiFindExecResult } | { case: "piLsResult"; value: agent_v1_PiLsExecResult } | { case: "conversationSearchResult"; value: agent_v1_ConversationSearchResult } | { case: "agentStoreConflictResult"; value: agent_v1_AgentStoreConflictResult } | { case: "miniSweAgentBashResult"; value: agent_v1_ShellResult } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecClientMessage;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecClientMessage;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecClientMessage;
  static equals(a: agent_v1_ExecClientMessage | MessageInit<agent_v1_ExecClientMessage> | undefined, b: agent_v1_ExecClientMessage | MessageInit<agent_v1_ExecClientMessage> | undefined): boolean;
}

/** agent.v1.ExecClientStreamClose; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecClientStreamClose extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecClientStreamClose>);
  static readonly typeName: "agent.v1.ExecClientStreamClose";
  id: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecClientStreamClose;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecClientStreamClose;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecClientStreamClose;
  static equals(a: agent_v1_ExecClientStreamClose | MessageInit<agent_v1_ExecClientStreamClose> | undefined, b: agent_v1_ExecClientStreamClose | MessageInit<agent_v1_ExecClientStreamClose> | undefined): boolean;
}

/** agent.v1.ExecClientThrow; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecClientThrow extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecClientThrow>);
  static readonly typeName: "agent.v1.ExecClientThrow";
  id: number;
  error: string;
  stackTrace?: string;
  errorCode?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecClientThrow;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecClientThrow;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecClientThrow;
  static equals(a: agent_v1_ExecClientThrow | MessageInit<agent_v1_ExecClientThrow> | undefined, b: agent_v1_ExecClientThrow | MessageInit<agent_v1_ExecClientThrow> | undefined): boolean;
}

/** agent.v1.ExecRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ExecRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecRequest>);
  static readonly typeName: "agent.v1.ExecRequest";
  command: string;
  cwd?: string;
  args: string[];
  environment: Record<string, string>;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecRequest;
  static equals(a: agent_v1_ExecRequest | MessageInit<agent_v1_ExecRequest> | undefined, b: agent_v1_ExecRequest | MessageInit<agent_v1_ExecRequest> | undefined): boolean;
}

/** agent.v1.ExecResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ExecResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecResponse>);
  static readonly typeName: "agent.v1.ExecResponse";
  event: { case: "stdoutEvent"; value: agent_v1_StdoutEvent } | { case: "stderrEvent"; value: agent_v1_StderrEvent } | { case: "exitEvent"; value: agent_v1_ExitEvent } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecResponse;
  static equals(a: agent_v1_ExecResponse | MessageInit<agent_v1_ExecResponse> | undefined, b: agent_v1_ExecResponse | MessageInit<agent_v1_ExecResponse> | undefined): boolean;
}

/** agent.v1.ExecServerAbort; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecServerAbort extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecServerAbort>);
  static readonly typeName: "agent.v1.ExecServerAbort";
  id: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecServerAbort;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecServerAbort;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecServerAbort;
  static equals(a: agent_v1_ExecServerAbort | MessageInit<agent_v1_ExecServerAbort> | undefined, b: agent_v1_ExecServerAbort | MessageInit<agent_v1_ExecServerAbort> | undefined): boolean;
}

/** agent.v1.ExecServerControlMessage; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecServerControlMessage extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecServerControlMessage>);
  static readonly typeName: "agent.v1.ExecServerControlMessage";
  message: { case: "abort"; value: agent_v1_ExecServerAbort } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecServerControlMessage;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecServerControlMessage;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecServerControlMessage;
  static equals(a: agent_v1_ExecServerControlMessage | MessageInit<agent_v1_ExecServerControlMessage> | undefined, b: agent_v1_ExecServerControlMessage | MessageInit<agent_v1_ExecServerControlMessage> | undefined): boolean;
}

/** agent.v1.ExecServerMessage; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecServerMessage extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecServerMessage>);
  static readonly typeName: "agent.v1.ExecServerMessage";
  id: number;
  execId: string;
  machineId?: string;
  spanContext?: agent_v1_SpanContext;
  acceptHookAdditionalContexts?: boolean;
  message: { case: "shellArgs"; value: agent_v1_ShellArgs } | { case: "writeArgs"; value: agent_v1_WriteArgs } | { case: "deleteArgs"; value: agent_v1_DeleteArgs } | { case: "grepArgs"; value: agent_v1_GrepArgs } | { case: "readArgs"; value: agent_v1_ReadArgs } | { case: "redactedReadArgs"; value: agent_v1_ReadArgs } | { case: "lsArgs"; value: agent_v1_LsArgs } | { case: "diagnosticsArgs"; value: agent_v1_DiagnosticsArgs } | { case: "requestContextArgs"; value: agent_v1_RequestContextArgs } | { case: "mcpArgs"; value: agent_v1_McpArgs } | { case: "shellStreamArgs"; value: agent_v1_ShellArgs } | { case: "backgroundShellSpawnArgs"; value: agent_v1_BackgroundShellSpawnArgs } | { case: "listMcpResourcesExecArgs"; value: agent_v1_ListMcpResourcesExecArgs } | { case: "readMcpResourceExecArgs"; value: agent_v1_ReadMcpResourceExecArgs } | { case: "mcpStateExecArgs"; value: agent_v1_McpStateExecArgs } | { case: "fetchArgs"; value: agent_v1_FetchArgs } | { case: "recordScreenArgs"; value: agent_v1_RecordScreenArgs } | { case: "computerUseArgs"; value: agent_v1_ComputerUseArgs } | { case: "writeShellStdinArgs"; value: agent_v1_WriteShellStdinArgs } | { case: "executeHookArgs"; value: agent_v1_ExecuteHookArgs } | { case: "subagentArgs"; value: agent_v1_SubagentArgs } | { case: "forceBackgroundShellArgs"; value: agent_v1_ForceBackgroundShellArgs } | { case: "forceBackgroundSubagentArgs"; value: agent_v1_ForceBackgroundSubagentArgs } | { case: "subagentAwaitArgs"; value: agent_v1_SubagentAwaitArgs } | { case: "smartModeClassifierArgs"; value: agent_v1_SmartModeClassifierArgs } | { case: "canvasDiagnosticsArgs"; value: agent_v1_CanvasDiagnosticsArgs } | { case: "shellAllowlistPrecheckArgs"; value: agent_v1_ShellAllowlistPrecheckArgs } | { case: "mcpAllowlistPrecheckArgs"; value: agent_v1_McpAllowlistPrecheckArgs } | { case: "webFetchAllowlistPrecheckArgs"; value: agent_v1_WebFetchAllowlistPrecheckArgs } | { case: "gitDiffRequest"; value: aiserver_v1_GetDiffRequest } | { case: "piReadArgs"; value: agent_v1_PiReadExecArgs } | { case: "piBashArgs"; value: agent_v1_PiBashExecArgs } | { case: "piEditArgs"; value: agent_v1_PiEditExecArgs } | { case: "piWriteArgs"; value: agent_v1_PiWriteExecArgs } | { case: "piGrepArgs"; value: agent_v1_PiGrepExecArgs } | { case: "piFindArgs"; value: agent_v1_PiFindExecArgs } | { case: "piLsArgs"; value: agent_v1_PiLsExecArgs } | { case: "miniSweAgentBashArgs"; value: agent_v1_ShellArgs } | { case: "conversationSearchArgs"; value: agent_v1_ConversationSearchArgs } | { case: "agentStoreConflictArgs"; value: agent_v1_AgentStoreConflictArgs } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecServerMessage;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecServerMessage;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecServerMessage;
  static equals(a: agent_v1_ExecServerMessage | MessageInit<agent_v1_ExecServerMessage> | undefined, b: agent_v1_ExecServerMessage | MessageInit<agent_v1_ExecServerMessage> | undefined): boolean;
}

/** agent.v1.ExecStreamElement; source: ./src/server.ts */
export declare class agent_v1_ExecStreamElement extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecStreamElement>);
  static readonly typeName: "agent.v1.ExecStreamElement";
  element: { case: "execClientMessage"; value: agent_v1_ExecClientMessage } | { case: "execClientControlMessage"; value: agent_v1_ExecClientControlMessage } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecStreamElement;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecStreamElement;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecStreamElement;
  static equals(a: agent_v1_ExecStreamElement | MessageInit<agent_v1_ExecStreamElement> | undefined, b: agent_v1_ExecStreamElement | MessageInit<agent_v1_ExecStreamElement> | undefined): boolean;
}

/** agent.v1.ExecuteHookArgs; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecuteHookArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecuteHookArgs>);
  static readonly typeName: "agent.v1.ExecuteHookArgs";
  request?: agent_v1_ExecuteHookRequest;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecuteHookArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecuteHookArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecuteHookArgs;
  static equals(a: agent_v1_ExecuteHookArgs | MessageInit<agent_v1_ExecuteHookArgs> | undefined, b: agent_v1_ExecuteHookArgs | MessageInit<agent_v1_ExecuteHookArgs> | undefined): boolean;
}

/** agent.v1.ExecuteHookRequest; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecuteHookRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecuteHookRequest>);
  static readonly typeName: "agent.v1.ExecuteHookRequest";
  request: { case: "preCompact"; value: agent_v1_PreCompactRequestQuery } | { case: "subagentStart"; value: agent_v1_SubagentStartRequestQuery } | { case: "subagentStop"; value: agent_v1_SubagentStopRequestQuery } | { case: "preToolUse"; value: agent_v1_PreToolUseRequestQuery } | { case: "postToolUse"; value: agent_v1_PostToolUseRequestQuery } | { case: "postToolUseFailure"; value: agent_v1_PostToolUseFailureRequestQuery } | { case: "beforeSubmitPrompt"; value: agent_v1_BeforeSubmitPromptRequestQuery } | { case: "afterAgentResponse"; value: agent_v1_AfterAgentResponseRequestQuery } | { case: "afterAgentThought"; value: agent_v1_AfterAgentThoughtRequestQuery } | { case: "stop"; value: agent_v1_StopRequestQuery } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecuteHookRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecuteHookRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecuteHookRequest;
  static equals(a: agent_v1_ExecuteHookRequest | MessageInit<agent_v1_ExecuteHookRequest> | undefined, b: agent_v1_ExecuteHookRequest | MessageInit<agent_v1_ExecuteHookRequest> | undefined): boolean;
}

/** agent.v1.ExecuteHookResponse; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecuteHookResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecuteHookResponse>);
  static readonly typeName: "agent.v1.ExecuteHookResponse";
  response: { case: "preCompact"; value: agent_v1_PreCompactRequestResponse } | { case: "subagentStart"; value: agent_v1_SubagentStartRequestResponse } | { case: "subagentStop"; value: agent_v1_SubagentStopRequestResponse } | { case: "preToolUse"; value: agent_v1_PreToolUseRequestResponse } | { case: "postToolUse"; value: agent_v1_PostToolUseRequestResponse } | { case: "postToolUseFailure"; value: agent_v1_PostToolUseFailureRequestResponse } | { case: "beforeSubmitPrompt"; value: agent_v1_BeforeSubmitPromptRequestResponse } | { case: "afterAgentResponse"; value: agent_v1_AfterAgentResponseRequestResponse } | { case: "afterAgentThought"; value: agent_v1_AfterAgentThoughtRequestResponse } | { case: "stop"; value: agent_v1_StopRequestResponse } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecuteHookResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecuteHookResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecuteHookResponse;
  static equals(a: agent_v1_ExecuteHookResponse | MessageInit<agent_v1_ExecuteHookResponse> | undefined, b: agent_v1_ExecuteHookResponse | MessageInit<agent_v1_ExecuteHookResponse> | undefined): boolean;
}

/** agent.v1.ExecuteHookResult; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExecuteHookResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExecuteHookResult>);
  static readonly typeName: "agent.v1.ExecuteHookResult";
  response?: agent_v1_ExecuteHookResponse;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExecuteHookResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExecuteHookResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExecuteHookResult;
  static equals(a: agent_v1_ExecuteHookResult | MessageInit<agent_v1_ExecuteHookResult> | undefined, b: agent_v1_ExecuteHookResult | MessageInit<agent_v1_ExecuteHookResult> | undefined): boolean;
}

/** agent.v1.ExitEvent; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ExitEvent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExitEvent>);
  static readonly typeName: "agent.v1.ExitEvent";
  exitCode: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExitEvent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExitEvent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExitEvent;
  static equals(a: agent_v1_ExitEvent | MessageInit<agent_v1_ExitEvent> | undefined, b: agent_v1_ExitEvent | MessageInit<agent_v1_ExitEvent> | undefined): boolean;
}

/** agent.v1.ExportFileMetadata; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ExportFileMetadata extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExportFileMetadata>);
  static readonly typeName: "agent.v1.ExportFileMetadata";
  totalBytes: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExportFileMetadata;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExportFileMetadata;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExportFileMetadata;
  static equals(a: agent_v1_ExportFileMetadata | MessageInit<agent_v1_ExportFileMetadata> | undefined, b: agent_v1_ExportFileMetadata | MessageInit<agent_v1_ExportFileMetadata> | undefined): boolean;
}

/** agent.v1.ExportFileRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ExportFileRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExportFileRequest>);
  static readonly typeName: "agent.v1.ExportFileRequest";
  path: string;
  workspaceRootPath: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExportFileRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExportFileRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExportFileRequest;
  static equals(a: agent_v1_ExportFileRequest | MessageInit<agent_v1_ExportFileRequest> | undefined, b: agent_v1_ExportFileRequest | MessageInit<agent_v1_ExportFileRequest> | undefined): boolean;
}

/** agent.v1.ExportFileResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ExportFileResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExportFileResponse>);
  static readonly typeName: "agent.v1.ExportFileResponse";
  payload: { case: "contentChunk"; value: Uint8Array } | { case: "metadata"; value: agent_v1_ExportFileMetadata } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExportFileResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExportFileResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExportFileResponse;
  static equals(a: agent_v1_ExportFileResponse | MessageInit<agent_v1_ExportFileResponse> | undefined, b: agent_v1_ExportFileResponse | MessageInit<agent_v1_ExportFileResponse> | undefined): boolean;
}

/** agent.v1.ExtraContextEntry; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ExtraContextEntry extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ExtraContextEntry>);
  static readonly typeName: "agent.v1.ExtraContextEntry";
  dataOrBlobId: { case: "data"; value: string } | { case: "blobId"; value: Uint8Array } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ExtraContextEntry;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ExtraContextEntry;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ExtraContextEntry;
  static equals(a: agent_v1_ExtraContextEntry | MessageInit<agent_v1_ExtraContextEntry> | undefined, b: agent_v1_ExtraContextEntry | MessageInit<agent_v1_ExtraContextEntry> | undefined): boolean;
}

/** agent.v1.FetchArgs; source: ../proto/dist/generated/agent/v1/fetch_exec_pb.js */
export declare class agent_v1_FetchArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_FetchArgs>);
  static readonly typeName: "agent.v1.FetchArgs";
  url: string;
  toolCallId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_FetchArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_FetchArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_FetchArgs;
  static equals(a: agent_v1_FetchArgs | MessageInit<agent_v1_FetchArgs> | undefined, b: agent_v1_FetchArgs | MessageInit<agent_v1_FetchArgs> | undefined): boolean;
}

/** agent.v1.FetchError; source: ../proto/dist/generated/agent/v1/fetch_exec_pb.js */
export declare class agent_v1_FetchError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_FetchError>);
  static readonly typeName: "agent.v1.FetchError";
  url: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_FetchError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_FetchError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_FetchError;
  static equals(a: agent_v1_FetchError | MessageInit<agent_v1_FetchError> | undefined, b: agent_v1_FetchError | MessageInit<agent_v1_FetchError> | undefined): boolean;
}

/** agent.v1.FetchResult; source: ../proto/dist/generated/agent/v1/fetch_exec_pb.js */
export declare class agent_v1_FetchResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_FetchResult>);
  static readonly typeName: "agent.v1.FetchResult";
  result: { case: "success"; value: agent_v1_FetchSuccess } | { case: "error"; value: agent_v1_FetchError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_FetchResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_FetchResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_FetchResult;
  static equals(a: agent_v1_FetchResult | MessageInit<agent_v1_FetchResult> | undefined, b: agent_v1_FetchResult | MessageInit<agent_v1_FetchResult> | undefined): boolean;
}

/** agent.v1.FetchSuccess; source: ../proto/dist/generated/agent/v1/fetch_exec_pb.js */
export declare class agent_v1_FetchSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_FetchSuccess>);
  static readonly typeName: "agent.v1.FetchSuccess";
  url: string;
  content: string;
  statusCode: number;
  contentType: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_FetchSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_FetchSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_FetchSuccess;
  static equals(a: agent_v1_FetchSuccess | MessageInit<agent_v1_FetchSuccess> | undefined, b: agent_v1_FetchSuccess | MessageInit<agent_v1_FetchSuccess> | undefined): boolean;
}

/** agent.v1.ForceBackgroundShellArgs; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ForceBackgroundShellArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ForceBackgroundShellArgs>);
  static readonly typeName: "agent.v1.ForceBackgroundShellArgs";
  toolCallId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ForceBackgroundShellArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ForceBackgroundShellArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ForceBackgroundShellArgs;
  static equals(a: agent_v1_ForceBackgroundShellArgs | MessageInit<agent_v1_ForceBackgroundShellArgs> | undefined, b: agent_v1_ForceBackgroundShellArgs | MessageInit<agent_v1_ForceBackgroundShellArgs> | undefined): boolean;
}

/** agent.v1.ForceBackgroundShellResult; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ForceBackgroundShellResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ForceBackgroundShellResult>);
  static readonly typeName: "agent.v1.ForceBackgroundShellResult";
  status: agent_v1_ForceBackgroundShellStatus;
  shellResult?: agent_v1_ShellResult;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ForceBackgroundShellResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ForceBackgroundShellResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ForceBackgroundShellResult;
  static equals(a: agent_v1_ForceBackgroundShellResult | MessageInit<agent_v1_ForceBackgroundShellResult> | undefined, b: agent_v1_ForceBackgroundShellResult | MessageInit<agent_v1_ForceBackgroundShellResult> | undefined): boolean;
}

/** agent.v1.ForceBackgroundShellStatus; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare enum agent_v1_ForceBackgroundShellStatus {
  "UNSPECIFIED" = 0,
  "ACCEPTED" = 1,
  "NOT_FOUND" = 2,
}

/** agent.v1.ForceBackgroundSubagentArgs; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ForceBackgroundSubagentArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ForceBackgroundSubagentArgs>);
  static readonly typeName: "agent.v1.ForceBackgroundSubagentArgs";
  toolCallId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ForceBackgroundSubagentArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ForceBackgroundSubagentArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ForceBackgroundSubagentArgs;
  static equals(a: agent_v1_ForceBackgroundSubagentArgs | MessageInit<agent_v1_ForceBackgroundSubagentArgs> | undefined, b: agent_v1_ForceBackgroundSubagentArgs | MessageInit<agent_v1_ForceBackgroundSubagentArgs> | undefined): boolean;
}

/** agent.v1.ForceBackgroundSubagentResult; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_ForceBackgroundSubagentResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ForceBackgroundSubagentResult>);
  static readonly typeName: "agent.v1.ForceBackgroundSubagentResult";
  status: agent_v1_ForceBackgroundSubagentStatus;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ForceBackgroundSubagentResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ForceBackgroundSubagentResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ForceBackgroundSubagentResult;
  static equals(a: agent_v1_ForceBackgroundSubagentResult | MessageInit<agent_v1_ForceBackgroundSubagentResult> | undefined, b: agent_v1_ForceBackgroundSubagentResult | MessageInit<agent_v1_ForceBackgroundSubagentResult> | undefined): boolean;
}

/** agent.v1.ForceBackgroundSubagentStatus; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare enum agent_v1_ForceBackgroundSubagentStatus {
  "UNSPECIFIED" = 0,
  "ACCEPTED" = 1,
  "NOT_FOUND" = 2,
}

/** agent.v1.GetCapabilitiesRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetCapabilitiesRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetCapabilitiesRequest>);
  static readonly typeName: "agent.v1.GetCapabilitiesRequest";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetCapabilitiesRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetCapabilitiesRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetCapabilitiesRequest;
  static equals(a: agent_v1_GetCapabilitiesRequest | MessageInit<agent_v1_GetCapabilitiesRequest> | undefined, b: agent_v1_GetCapabilitiesRequest | MessageInit<agent_v1_GetCapabilitiesRequest> | undefined): boolean;
}

/** agent.v1.GetCapabilitiesResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetCapabilitiesResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetCapabilitiesResponse>);
  static readonly typeName: "agent.v1.GetCapabilitiesResponse";
  computerUseSupported?: boolean;
  installPluginArtifactSupported?: boolean;
  computerUseKeyStrokeSupported?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetCapabilitiesResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetCapabilitiesResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetCapabilitiesResponse;
  static equals(a: agent_v1_GetCapabilitiesResponse | MessageInit<agent_v1_GetCapabilitiesResponse> | undefined, b: agent_v1_GetCapabilitiesResponse | MessageInit<agent_v1_GetCapabilitiesResponse> | undefined): boolean;
}

/** agent.v1.GetMcpRefreshTokensRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetMcpRefreshTokensRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetMcpRefreshTokensRequest>);
  static readonly typeName: "agent.v1.GetMcpRefreshTokensRequest";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetMcpRefreshTokensRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetMcpRefreshTokensRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetMcpRefreshTokensRequest;
  static equals(a: agent_v1_GetMcpRefreshTokensRequest | MessageInit<agent_v1_GetMcpRefreshTokensRequest> | undefined, b: agent_v1_GetMcpRefreshTokensRequest | MessageInit<agent_v1_GetMcpRefreshTokensRequest> | undefined): boolean;
}

/** agent.v1.GetMcpRefreshTokensResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetMcpRefreshTokensResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetMcpRefreshTokensResponse>);
  static readonly typeName: "agent.v1.GetMcpRefreshTokensResponse";
  refreshTokens: Record<string, string>;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetMcpRefreshTokensResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetMcpRefreshTokensResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetMcpRefreshTokensResponse;
  static equals(a: agent_v1_GetMcpRefreshTokensResponse | MessageInit<agent_v1_GetMcpRefreshTokensResponse> | undefined, b: agent_v1_GetMcpRefreshTokensResponse | MessageInit<agent_v1_GetMcpRefreshTokensResponse> | undefined): boolean;
}

/** agent.v1.GetResourceUsageRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetResourceUsageRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetResourceUsageRequest>);
  static readonly typeName: "agent.v1.GetResourceUsageRequest";
  cursor: string;
  omitHistory: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetResourceUsageRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetResourceUsageRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetResourceUsageRequest;
  static equals(a: agent_v1_GetResourceUsageRequest | MessageInit<agent_v1_GetResourceUsageRequest> | undefined, b: agent_v1_GetResourceUsageRequest | MessageInit<agent_v1_GetResourceUsageRequest> | undefined): boolean;
}

/** agent.v1.GetResourceUsageResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetResourceUsageResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetResourceUsageResponse>);
  static readonly typeName: "agent.v1.GetResourceUsageResponse";
  limits?: agent_v1_ResourceLimits;
  current?: agent_v1_ResourceSample;
  history: agent_v1_ResourceSample[];
  nextCursor: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetResourceUsageResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetResourceUsageResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetResourceUsageResponse;
  static equals(a: agent_v1_GetResourceUsageResponse | MessageInit<agent_v1_GetResourceUsageResponse> | undefined, b: agent_v1_GetResourceUsageResponse | MessageInit<agent_v1_GetResourceUsageResponse> | undefined): boolean;
}

/** agent.v1.GetWorkspaceChangesHashRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetWorkspaceChangesHashRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetWorkspaceChangesHashRequest>);
  static readonly typeName: "agent.v1.GetWorkspaceChangesHashRequest";
  rootPath: string;
  baseRef: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetWorkspaceChangesHashRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetWorkspaceChangesHashRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetWorkspaceChangesHashRequest;
  static equals(a: agent_v1_GetWorkspaceChangesHashRequest | MessageInit<agent_v1_GetWorkspaceChangesHashRequest> | undefined, b: agent_v1_GetWorkspaceChangesHashRequest | MessageInit<agent_v1_GetWorkspaceChangesHashRequest> | undefined): boolean;
}

/** agent.v1.GetWorkspaceChangesHashResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_GetWorkspaceChangesHashResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GetWorkspaceChangesHashResponse>);
  static readonly typeName: "agent.v1.GetWorkspaceChangesHashResponse";
  hash: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GetWorkspaceChangesHashResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GetWorkspaceChangesHashResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GetWorkspaceChangesHashResponse;
  static equals(a: agent_v1_GetWorkspaceChangesHashResponse | MessageInit<agent_v1_GetWorkspaceChangesHashResponse> | undefined, b: agent_v1_GetWorkspaceChangesHashResponse | MessageInit<agent_v1_GetWorkspaceChangesHashResponse> | undefined): boolean;
}

/** agent.v1.GitRepoInfo; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_GitRepoInfo extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GitRepoInfo>);
  static readonly typeName: "agent.v1.GitRepoInfo";
  path: string;
  status: string;
  branchName: string;
  remoteUrl?: string;
  previousBranchIsAncestor?: boolean;
  isOriginBacked?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GitRepoInfo;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GitRepoInfo;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GitRepoInfo;
  static equals(a: agent_v1_GitRepoInfo | MessageInit<agent_v1_GitRepoInfo> | undefined, b: agent_v1_GitRepoInfo | MessageInit<agent_v1_GitRepoInfo> | undefined): boolean;
}

/** agent.v1.GrepArgs; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepArgs>);
  static readonly typeName: "agent.v1.GrepArgs";
  pattern: string;
  path?: string;
  glob?: string;
  outputMode?: string;
  contextBefore?: number;
  contextAfter?: number;
  context?: number;
  caseInsensitive?: boolean;
  type?: string;
  headLimit?: number;
  multiline?: boolean;
  sort?: string;
  sortAscending?: boolean;
  toolCallId: string;
  sandboxPolicy?: agent_v1_SandboxPolicy;
  offset?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepArgs;
  static equals(a: agent_v1_GrepArgs | MessageInit<agent_v1_GrepArgs> | undefined, b: agent_v1_GrepArgs | MessageInit<agent_v1_GrepArgs> | undefined): boolean;
}

/** agent.v1.GrepContentMatch; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepContentMatch extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepContentMatch>);
  static readonly typeName: "agent.v1.GrepContentMatch";
  lineNumber: number;
  content: string;
  contentTruncated: boolean;
  isContextLine: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepContentMatch;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepContentMatch;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepContentMatch;
  static equals(a: agent_v1_GrepContentMatch | MessageInit<agent_v1_GrepContentMatch> | undefined, b: agent_v1_GrepContentMatch | MessageInit<agent_v1_GrepContentMatch> | undefined): boolean;
}

/** agent.v1.GrepContentResult; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepContentResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepContentResult>);
  static readonly typeName: "agent.v1.GrepContentResult";
  matches: agent_v1_GrepFileMatch[];
  totalLines: number;
  totalMatchedLines: number;
  clientTruncated: boolean;
  ripgrepTruncated: boolean;
  headLimitApplied?: number;
  offsetApplied?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepContentResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepContentResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepContentResult;
  static equals(a: agent_v1_GrepContentResult | MessageInit<agent_v1_GrepContentResult> | undefined, b: agent_v1_GrepContentResult | MessageInit<agent_v1_GrepContentResult> | undefined): boolean;
}

/** agent.v1.GrepCountResult; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepCountResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepCountResult>);
  static readonly typeName: "agent.v1.GrepCountResult";
  counts: agent_v1_GrepFileCount[];
  totalFiles: number;
  totalMatches: number;
  clientTruncated: boolean;
  ripgrepTruncated: boolean;
  headLimitApplied?: number;
  offsetApplied?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepCountResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepCountResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepCountResult;
  static equals(a: agent_v1_GrepCountResult | MessageInit<agent_v1_GrepCountResult> | undefined, b: agent_v1_GrepCountResult | MessageInit<agent_v1_GrepCountResult> | undefined): boolean;
}

/** agent.v1.GrepError; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepError>);
  static readonly typeName: "agent.v1.GrepError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepError;
  static equals(a: agent_v1_GrepError | MessageInit<agent_v1_GrepError> | undefined, b: agent_v1_GrepError | MessageInit<agent_v1_GrepError> | undefined): boolean;
}

/** agent.v1.GrepFileCount; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepFileCount extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepFileCount>);
  static readonly typeName: "agent.v1.GrepFileCount";
  file: string;
  count: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepFileCount;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepFileCount;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepFileCount;
  static equals(a: agent_v1_GrepFileCount | MessageInit<agent_v1_GrepFileCount> | undefined, b: agent_v1_GrepFileCount | MessageInit<agent_v1_GrepFileCount> | undefined): boolean;
}

/** agent.v1.GrepFileMatch; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepFileMatch extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepFileMatch>);
  static readonly typeName: "agent.v1.GrepFileMatch";
  file: string;
  matches: agent_v1_GrepContentMatch[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepFileMatch;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepFileMatch;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepFileMatch;
  static equals(a: agent_v1_GrepFileMatch | MessageInit<agent_v1_GrepFileMatch> | undefined, b: agent_v1_GrepFileMatch | MessageInit<agent_v1_GrepFileMatch> | undefined): boolean;
}

/** agent.v1.GrepFilesResult; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepFilesResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepFilesResult>);
  static readonly typeName: "agent.v1.GrepFilesResult";
  files: string[];
  totalFiles: number;
  clientTruncated: boolean;
  ripgrepTruncated: boolean;
  headLimitApplied?: number;
  offsetApplied?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepFilesResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepFilesResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepFilesResult;
  static equals(a: agent_v1_GrepFilesResult | MessageInit<agent_v1_GrepFilesResult> | undefined, b: agent_v1_GrepFilesResult | MessageInit<agent_v1_GrepFilesResult> | undefined): boolean;
}

/** agent.v1.GrepResult; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepResult>);
  static readonly typeName: "agent.v1.GrepResult";
  result: { case: "success"; value: agent_v1_GrepSuccess } | { case: "error"; value: agent_v1_GrepError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepResult;
  static equals(a: agent_v1_GrepResult | MessageInit<agent_v1_GrepResult> | undefined, b: agent_v1_GrepResult | MessageInit<agent_v1_GrepResult> | undefined): boolean;
}

/** agent.v1.GrepSuccess; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepSuccess>);
  static readonly typeName: "agent.v1.GrepSuccess";
  pattern: string;
  path: string;
  outputMode: string;
  workspaceResults: Record<string, agent_v1_GrepUnionResult>;
  activeEditorResult?: agent_v1_GrepUnionResult;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepSuccess;
  static equals(a: agent_v1_GrepSuccess | MessageInit<agent_v1_GrepSuccess> | undefined, b: agent_v1_GrepSuccess | MessageInit<agent_v1_GrepSuccess> | undefined): boolean;
}

/** agent.v1.GrepUnionResult; source: ../proto/dist/generated/agent/v1/grep_exec_pb.js */
export declare class agent_v1_GrepUnionResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_GrepUnionResult>);
  static readonly typeName: "agent.v1.GrepUnionResult";
  result: { case: "count"; value: agent_v1_GrepCountResult } | { case: "files"; value: agent_v1_GrepFilesResult } | { case: "content"; value: agent_v1_GrepContentResult } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_GrepUnionResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_GrepUnionResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_GrepUnionResult;
  static equals(a: agent_v1_GrepUnionResult | MessageInit<agent_v1_GrepUnionResult> | undefined, b: agent_v1_GrepUnionResult | MessageInit<agent_v1_GrepUnionResult> | undefined): boolean;
}

/** agent.v1.HookAdditionalContext; source: ../proto/dist/generated/agent/v1/hook_additional_context_pb.js */
export declare class agent_v1_HookAdditionalContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_HookAdditionalContext>);
  static readonly typeName: "agent.v1.HookAdditionalContext";
  hookEventName: string;
  content: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_HookAdditionalContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_HookAdditionalContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_HookAdditionalContext;
  static equals(a: agent_v1_HookAdditionalContext | MessageInit<agent_v1_HookAdditionalContext> | undefined, b: agent_v1_HookAdditionalContext | MessageInit<agent_v1_HookAdditionalContext> | undefined): boolean;
}

/** agent.v1.HooksConfigInfo; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_HooksConfigInfo extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_HooksConfigInfo>);
  static readonly typeName: "agent.v1.HooksConfigInfo";
  configuredSteps: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_HooksConfigInfo;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_HooksConfigInfo;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_HooksConfigInfo;
  static equals(a: agent_v1_HooksConfigInfo | MessageInit<agent_v1_HooksConfigInfo> | undefined, b: agent_v1_HooksConfigInfo | MessageInit<agent_v1_HooksConfigInfo> | undefined): boolean;
}

/** agent.v1.InstallPluginArtifactRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_InstallPluginArtifactRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InstallPluginArtifactRequest>);
  static readonly typeName: "agent.v1.InstallPluginArtifactRequest";
  downloadUrl: string;
  targetRoot: string;
  artifactDigest: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InstallPluginArtifactRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InstallPluginArtifactRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InstallPluginArtifactRequest;
  static equals(a: agent_v1_InstallPluginArtifactRequest | MessageInit<agent_v1_InstallPluginArtifactRequest> | undefined, b: agent_v1_InstallPluginArtifactRequest | MessageInit<agent_v1_InstallPluginArtifactRequest> | undefined): boolean;
}

/** agent.v1.InstallPluginArtifactResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_InstallPluginArtifactResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InstallPluginArtifactResponse>);
  static readonly typeName: "agent.v1.InstallPluginArtifactResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InstallPluginArtifactResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InstallPluginArtifactResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InstallPluginArtifactResponse;
  static equals(a: agent_v1_InstallPluginArtifactResponse | MessageInit<agent_v1_InstallPluginArtifactResponse> | undefined, b: agent_v1_InstallPluginArtifactResponse | MessageInit<agent_v1_InstallPluginArtifactResponse> | undefined): boolean;
}

/** agent.v1.InvocationContext; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext>);
  static readonly typeName: "agent.v1.InvocationContext";
  data: { case: "slackThread"; value: agent_v1_InvocationContext_SlackThread } | { case: "githubPr"; value: agent_v1_InvocationContext_GithubPR } | { case: "ideState"; value: agent_v1_InvocationContext_IdeState } | { case: "microsoftTeamsThread"; value: agent_v1_InvocationContext_MicrosoftTeamsThread } | { case: "blobId"; value: Uint8Array } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext;
  static equals(a: agent_v1_InvocationContext | MessageInit<agent_v1_InvocationContext> | undefined, b: agent_v1_InvocationContext | MessageInit<agent_v1_InvocationContext> | undefined): boolean;
}

/** agent.v1.InvocationContext.GithubPR; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext_GithubPR extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext_GithubPR>);
  static readonly typeName: "agent.v1.InvocationContext.GithubPR";
  title: string;
  description: string;
  comments: string;
  ciFailures?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext_GithubPR;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext_GithubPR;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext_GithubPR;
  static equals(a: agent_v1_InvocationContext_GithubPR | MessageInit<agent_v1_InvocationContext_GithubPR> | undefined, b: agent_v1_InvocationContext_GithubPR | MessageInit<agent_v1_InvocationContext_GithubPR> | undefined): boolean;
}

/** agent.v1.InvocationContext.IdeState; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext_IdeState extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext_IdeState>);
  static readonly typeName: "agent.v1.InvocationContext.IdeState";
  visibleFiles: agent_v1_InvocationContext_IdeState_File[];
  recentlyViewedFiles: agent_v1_InvocationContext_IdeState_File[];
  currentlyViewedPrs: agent_v1_InvocationContext_IdeState_ViewedPullRequest[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext_IdeState;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState;
  static equals(a: agent_v1_InvocationContext_IdeState | MessageInit<agent_v1_InvocationContext_IdeState> | undefined, b: agent_v1_InvocationContext_IdeState | MessageInit<agent_v1_InvocationContext_IdeState> | undefined): boolean;
}

/** agent.v1.InvocationContext.IdeState.File; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext_IdeState_File extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext_IdeState_File>);
  static readonly typeName: "agent.v1.InvocationContext.IdeState.File";
  path: string;
  relativePath?: string;
  cursorPosition?: agent_v1_InvocationContext_IdeState_File_CursorPosition;
  totalLines: number;
  activeCommand?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext_IdeState_File;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState_File;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState_File;
  static equals(a: agent_v1_InvocationContext_IdeState_File | MessageInit<agent_v1_InvocationContext_IdeState_File> | undefined, b: agent_v1_InvocationContext_IdeState_File | MessageInit<agent_v1_InvocationContext_IdeState_File> | undefined): boolean;
}

/** agent.v1.InvocationContext.IdeState.File.CursorPosition; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext_IdeState_File_CursorPosition extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext_IdeState_File_CursorPosition>);
  static readonly typeName: "agent.v1.InvocationContext.IdeState.File.CursorPosition";
  line: number;
  text: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext_IdeState_File_CursorPosition;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState_File_CursorPosition;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState_File_CursorPosition;
  static equals(a: agent_v1_InvocationContext_IdeState_File_CursorPosition | MessageInit<agent_v1_InvocationContext_IdeState_File_CursorPosition> | undefined, b: agent_v1_InvocationContext_IdeState_File_CursorPosition | MessageInit<agent_v1_InvocationContext_IdeState_File_CursorPosition> | undefined): boolean;
}

/** agent.v1.InvocationContext.IdeState.ViewedPullRequest; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext_IdeState_ViewedPullRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext_IdeState_ViewedPullRequest>);
  static readonly typeName: "agent.v1.InvocationContext.IdeState.ViewedPullRequest";
  number: number;
  url: string;
  title?: string;
  folderPath?: string;
  summaryJson?: string;
  description?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext_IdeState_ViewedPullRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState_ViewedPullRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext_IdeState_ViewedPullRequest;
  static equals(a: agent_v1_InvocationContext_IdeState_ViewedPullRequest | MessageInit<agent_v1_InvocationContext_IdeState_ViewedPullRequest> | undefined, b: agent_v1_InvocationContext_IdeState_ViewedPullRequest | MessageInit<agent_v1_InvocationContext_IdeState_ViewedPullRequest> | undefined): boolean;
}

/** agent.v1.InvocationContext.MicrosoftTeamsThread; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext_MicrosoftTeamsThread extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext_MicrosoftTeamsThread>);
  static readonly typeName: "agent.v1.InvocationContext.MicrosoftTeamsThread";
  thread: string;
  channelName?: string;
  teamName?: string;
  channelDescription?: string;
  teamDescription?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext_MicrosoftTeamsThread;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext_MicrosoftTeamsThread;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext_MicrosoftTeamsThread;
  static equals(a: agent_v1_InvocationContext_MicrosoftTeamsThread | MessageInit<agent_v1_InvocationContext_MicrosoftTeamsThread> | undefined, b: agent_v1_InvocationContext_MicrosoftTeamsThread | MessageInit<agent_v1_InvocationContext_MicrosoftTeamsThread> | undefined): boolean;
}

/** agent.v1.InvocationContext.SlackThread; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_InvocationContext_SlackThread extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_InvocationContext_SlackThread>);
  static readonly typeName: "agent.v1.InvocationContext.SlackThread";
  thread: string;
  channelName?: string;
  channelPurpose?: string;
  channelTopic?: string;
  senderName?: string;
  senderId?: string;
  senderType?: string;
  isDirectlyAddressed?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_InvocationContext_SlackThread;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_InvocationContext_SlackThread;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_InvocationContext_SlackThread;
  static equals(a: agent_v1_InvocationContext_SlackThread | MessageInit<agent_v1_InvocationContext_SlackThread> | undefined, b: agent_v1_InvocationContext_SlackThread | MessageInit<agent_v1_InvocationContext_SlackThread> | undefined): boolean;
}

/** agent.v1.KeyAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_KeyAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_KeyAction>);
  static readonly typeName: "agent.v1.KeyAction";
  key: string;
  holdDurationMs?: number;
  stroke: agent_v1_KeyStroke;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_KeyAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_KeyAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_KeyAction;
  static equals(a: agent_v1_KeyAction | MessageInit<agent_v1_KeyAction> | undefined, b: agent_v1_KeyAction | MessageInit<agent_v1_KeyAction> | undefined): boolean;
}

/** agent.v1.KeyStroke; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare enum agent_v1_KeyStroke {
  "UNSPECIFIED" = 0,
  "TAP" = 1,
  "DOWN" = 2,
  "UP" = 3,
}

/** agent.v1.KillTmuxSessionRequest; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_KillTmuxSessionRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_KillTmuxSessionRequest>);
  static readonly typeName: "agent.v1.KillTmuxSessionRequest";
  sessionId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_KillTmuxSessionRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_KillTmuxSessionRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_KillTmuxSessionRequest;
  static equals(a: agent_v1_KillTmuxSessionRequest | MessageInit<agent_v1_KillTmuxSessionRequest> | undefined, b: agent_v1_KillTmuxSessionRequest | MessageInit<agent_v1_KillTmuxSessionRequest> | undefined): boolean;
}

/** agent.v1.KillTmuxSessionResponse; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_KillTmuxSessionResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_KillTmuxSessionResponse>);
  static readonly typeName: "agent.v1.KillTmuxSessionResponse";
  success: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_KillTmuxSessionResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_KillTmuxSessionResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_KillTmuxSessionResponse;
  static equals(a: agent_v1_KillTmuxSessionResponse | MessageInit<agent_v1_KillTmuxSessionResponse> | undefined, b: agent_v1_KillTmuxSessionResponse | MessageInit<agent_v1_KillTmuxSessionResponse> | undefined): boolean;
}

/** agent.v1.ListArtifactsRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ListArtifactsRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListArtifactsRequest>);
  static readonly typeName: "agent.v1.ListArtifactsRequest";
  extraPaths: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListArtifactsRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListArtifactsRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListArtifactsRequest;
  static equals(a: agent_v1_ListArtifactsRequest | MessageInit<agent_v1_ListArtifactsRequest> | undefined, b: agent_v1_ListArtifactsRequest | MessageInit<agent_v1_ListArtifactsRequest> | undefined): boolean;
}

/** agent.v1.ListArtifactsResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ListArtifactsResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListArtifactsResponse>);
  static readonly typeName: "agent.v1.ListArtifactsResponse";
  artifacts: agent_v1_ArtifactUploadMetadata[];
  pathErrors: Record<string, agent_v1_ArtifactPathError>;
  rootKind: agent_v1_ArtifactRootKind;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListArtifactsResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListArtifactsResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListArtifactsResponse;
  static equals(a: agent_v1_ListArtifactsResponse | MessageInit<agent_v1_ListArtifactsResponse> | undefined, b: agent_v1_ListArtifactsResponse | MessageInit<agent_v1_ListArtifactsResponse> | undefined): boolean;
}

/** agent.v1.ListDirectoryRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ListDirectoryRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListDirectoryRequest>);
  static readonly typeName: "agent.v1.ListDirectoryRequest";
  path: string;
  includeHidden: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListDirectoryRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListDirectoryRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListDirectoryRequest;
  static equals(a: agent_v1_ListDirectoryRequest | MessageInit<agent_v1_ListDirectoryRequest> | undefined, b: agent_v1_ListDirectoryRequest | MessageInit<agent_v1_ListDirectoryRequest> | undefined): boolean;
}

/** agent.v1.ListDirectoryResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ListDirectoryResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListDirectoryResponse>);
  static readonly typeName: "agent.v1.ListDirectoryResponse";
  entries: agent_v1_DirectoryEntry[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListDirectoryResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListDirectoryResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListDirectoryResponse;
  static equals(a: agent_v1_ListDirectoryResponse | MessageInit<agent_v1_ListDirectoryResponse> | undefined, b: agent_v1_ListDirectoryResponse | MessageInit<agent_v1_ListDirectoryResponse> | undefined): boolean;
}

/** agent.v1.ListMcpResourcesError; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ListMcpResourcesError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListMcpResourcesError>);
  static readonly typeName: "agent.v1.ListMcpResourcesError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListMcpResourcesError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListMcpResourcesError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListMcpResourcesError;
  static equals(a: agent_v1_ListMcpResourcesError | MessageInit<agent_v1_ListMcpResourcesError> | undefined, b: agent_v1_ListMcpResourcesError | MessageInit<agent_v1_ListMcpResourcesError> | undefined): boolean;
}

/** agent.v1.ListMcpResourcesExecArgs; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ListMcpResourcesExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListMcpResourcesExecArgs>);
  static readonly typeName: "agent.v1.ListMcpResourcesExecArgs";
  server?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListMcpResourcesExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListMcpResourcesExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListMcpResourcesExecArgs;
  static equals(a: agent_v1_ListMcpResourcesExecArgs | MessageInit<agent_v1_ListMcpResourcesExecArgs> | undefined, b: agent_v1_ListMcpResourcesExecArgs | MessageInit<agent_v1_ListMcpResourcesExecArgs> | undefined): boolean;
}

/** agent.v1.ListMcpResourcesExecResult; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ListMcpResourcesExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListMcpResourcesExecResult>);
  static readonly typeName: "agent.v1.ListMcpResourcesExecResult";
  result: { case: "success"; value: agent_v1_ListMcpResourcesSuccess } | { case: "error"; value: agent_v1_ListMcpResourcesError } | { case: "rejected"; value: agent_v1_ListMcpResourcesRejected } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListMcpResourcesExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListMcpResourcesExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListMcpResourcesExecResult;
  static equals(a: agent_v1_ListMcpResourcesExecResult | MessageInit<agent_v1_ListMcpResourcesExecResult> | undefined, b: agent_v1_ListMcpResourcesExecResult | MessageInit<agent_v1_ListMcpResourcesExecResult> | undefined): boolean;
}

/** agent.v1.ListMcpResourcesExecResult.McpResource; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ListMcpResourcesExecResult_McpResource extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListMcpResourcesExecResult_McpResource>);
  static readonly typeName: "agent.v1.ListMcpResourcesExecResult.McpResource";
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  server: string;
  annotations: Record<string, string>;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListMcpResourcesExecResult_McpResource;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListMcpResourcesExecResult_McpResource;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListMcpResourcesExecResult_McpResource;
  static equals(a: agent_v1_ListMcpResourcesExecResult_McpResource | MessageInit<agent_v1_ListMcpResourcesExecResult_McpResource> | undefined, b: agent_v1_ListMcpResourcesExecResult_McpResource | MessageInit<agent_v1_ListMcpResourcesExecResult_McpResource> | undefined): boolean;
}

/** agent.v1.ListMcpResourcesRejected; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ListMcpResourcesRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListMcpResourcesRejected>);
  static readonly typeName: "agent.v1.ListMcpResourcesRejected";
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListMcpResourcesRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListMcpResourcesRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListMcpResourcesRejected;
  static equals(a: agent_v1_ListMcpResourcesRejected | MessageInit<agent_v1_ListMcpResourcesRejected> | undefined, b: agent_v1_ListMcpResourcesRejected | MessageInit<agent_v1_ListMcpResourcesRejected> | undefined): boolean;
}

/** agent.v1.ListMcpResourcesSuccess; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ListMcpResourcesSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListMcpResourcesSuccess>);
  static readonly typeName: "agent.v1.ListMcpResourcesSuccess";
  resources: agent_v1_ListMcpResourcesExecResult_McpResource[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListMcpResourcesSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListMcpResourcesSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListMcpResourcesSuccess;
  static equals(a: agent_v1_ListMcpResourcesSuccess | MessageInit<agent_v1_ListMcpResourcesSuccess> | undefined, b: agent_v1_ListMcpResourcesSuccess | MessageInit<agent_v1_ListMcpResourcesSuccess> | undefined): boolean;
}

/** agent.v1.ListPtysRequest; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_ListPtysRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListPtysRequest>);
  static readonly typeName: "agent.v1.ListPtysRequest";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListPtysRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListPtysRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListPtysRequest;
  static equals(a: agent_v1_ListPtysRequest | MessageInit<agent_v1_ListPtysRequest> | undefined, b: agent_v1_ListPtysRequest | MessageInit<agent_v1_ListPtysRequest> | undefined): boolean;
}

/** agent.v1.ListPtysResponse; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_ListPtysResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListPtysResponse>);
  static readonly typeName: "agent.v1.ListPtysResponse";
  ptys: agent_v1_PtyInfo[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListPtysResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListPtysResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListPtysResponse;
  static equals(a: agent_v1_ListPtysResponse | MessageInit<agent_v1_ListPtysResponse> | undefined, b: agent_v1_ListPtysResponse | MessageInit<agent_v1_ListPtysResponse> | undefined): boolean;
}

/** agent.v1.ListTmuxSessionsRequest; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_ListTmuxSessionsRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListTmuxSessionsRequest>);
  static readonly typeName: "agent.v1.ListTmuxSessionsRequest";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListTmuxSessionsRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListTmuxSessionsRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListTmuxSessionsRequest;
  static equals(a: agent_v1_ListTmuxSessionsRequest | MessageInit<agent_v1_ListTmuxSessionsRequest> | undefined, b: agent_v1_ListTmuxSessionsRequest | MessageInit<agent_v1_ListTmuxSessionsRequest> | undefined): boolean;
}

/** agent.v1.ListTmuxSessionsResponse; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_ListTmuxSessionsResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ListTmuxSessionsResponse>);
  static readonly typeName: "agent.v1.ListTmuxSessionsResponse";
  sessions: agent_v1_TmuxSession[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ListTmuxSessionsResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ListTmuxSessionsResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ListTmuxSessionsResponse;
  static equals(a: agent_v1_ListTmuxSessionsResponse | MessageInit<agent_v1_ListTmuxSessionsResponse> | undefined, b: agent_v1_ListTmuxSessionsResponse | MessageInit<agent_v1_ListTmuxSessionsResponse> | undefined): boolean;
}

/** agent.v1.LoadMcpServersRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_LoadMcpServersRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LoadMcpServersRequest>);
  static readonly typeName: "agent.v1.LoadMcpServersRequest";
  mcpConfigJson: string;
  removeMissing: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LoadMcpServersRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LoadMcpServersRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LoadMcpServersRequest;
  static equals(a: agent_v1_LoadMcpServersRequest | MessageInit<agent_v1_LoadMcpServersRequest> | undefined, b: agent_v1_LoadMcpServersRequest | MessageInit<agent_v1_LoadMcpServersRequest> | undefined): boolean;
}

/** agent.v1.LoadMcpServersResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_LoadMcpServersResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LoadMcpServersResponse>);
  static readonly typeName: "agent.v1.LoadMcpServersResponse";
  loadedServerNames: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LoadMcpServersResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LoadMcpServersResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LoadMcpServersResponse;
  static equals(a: agent_v1_LoadMcpServersResponse | MessageInit<agent_v1_LoadMcpServersResponse> | undefined, b: agent_v1_LoadMcpServersResponse | MessageInit<agent_v1_LoadMcpServersResponse> | undefined): boolean;
}

/** agent.v1.LsArgs; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsArgs>);
  static readonly typeName: "agent.v1.LsArgs";
  path: string;
  ignore: string[];
  toolCallId: string;
  sandboxPolicy?: agent_v1_SandboxPolicy;
  timeoutMs?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsArgs;
  static equals(a: agent_v1_LsArgs | MessageInit<agent_v1_LsArgs> | undefined, b: agent_v1_LsArgs | MessageInit<agent_v1_LsArgs> | undefined): boolean;
}

/** agent.v1.LsDirectoryTreeNode; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsDirectoryTreeNode extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsDirectoryTreeNode>);
  static readonly typeName: "agent.v1.LsDirectoryTreeNode";
  absPath: string;
  childrenDirs: agent_v1_LsDirectoryTreeNode[];
  childrenFiles: agent_v1_LsDirectoryTreeNode_File[];
  childrenWereProcessed: boolean;
  fullSubtreeExtensionCounts: Record<string, number>;
  numFiles: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsDirectoryTreeNode;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsDirectoryTreeNode;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsDirectoryTreeNode;
  static equals(a: agent_v1_LsDirectoryTreeNode | MessageInit<agent_v1_LsDirectoryTreeNode> | undefined, b: agent_v1_LsDirectoryTreeNode | MessageInit<agent_v1_LsDirectoryTreeNode> | undefined): boolean;
}

/** agent.v1.LsDirectoryTreeNode.File; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsDirectoryTreeNode_File extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsDirectoryTreeNode_File>);
  static readonly typeName: "agent.v1.LsDirectoryTreeNode.File";
  name: string;
  terminalMetadata?: agent_v1_TerminalMetadata;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsDirectoryTreeNode_File;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsDirectoryTreeNode_File;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsDirectoryTreeNode_File;
  static equals(a: agent_v1_LsDirectoryTreeNode_File | MessageInit<agent_v1_LsDirectoryTreeNode_File> | undefined, b: agent_v1_LsDirectoryTreeNode_File | MessageInit<agent_v1_LsDirectoryTreeNode_File> | undefined): boolean;
}

/** agent.v1.LsError; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsError>);
  static readonly typeName: "agent.v1.LsError";
  path: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsError;
  static equals(a: agent_v1_LsError | MessageInit<agent_v1_LsError> | undefined, b: agent_v1_LsError | MessageInit<agent_v1_LsError> | undefined): boolean;
}

/** agent.v1.LsRejected; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsRejected>);
  static readonly typeName: "agent.v1.LsRejected";
  path: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsRejected;
  static equals(a: agent_v1_LsRejected | MessageInit<agent_v1_LsRejected> | undefined, b: agent_v1_LsRejected | MessageInit<agent_v1_LsRejected> | undefined): boolean;
}

/** agent.v1.LsResult; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsResult>);
  static readonly typeName: "agent.v1.LsResult";
  result: { case: "success"; value: agent_v1_LsSuccess } | { case: "error"; value: agent_v1_LsError } | { case: "rejected"; value: agent_v1_LsRejected } | { case: "timeout"; value: agent_v1_LsTimeout } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsResult;
  static equals(a: agent_v1_LsResult | MessageInit<agent_v1_LsResult> | undefined, b: agent_v1_LsResult | MessageInit<agent_v1_LsResult> | undefined): boolean;
}

/** agent.v1.LsSuccess; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsSuccess>);
  static readonly typeName: "agent.v1.LsSuccess";
  directoryTreeRoot?: agent_v1_LsDirectoryTreeNode;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsSuccess;
  static equals(a: agent_v1_LsSuccess | MessageInit<agent_v1_LsSuccess> | undefined, b: agent_v1_LsSuccess | MessageInit<agent_v1_LsSuccess> | undefined): boolean;
}

/** agent.v1.LsTimeout; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_LsTimeout extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_LsTimeout>);
  static readonly typeName: "agent.v1.LsTimeout";
  directoryTreeRoot?: agent_v1_LsDirectoryTreeNode;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_LsTimeout;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_LsTimeout;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_LsTimeout;
  static equals(a: agent_v1_LsTimeout | MessageInit<agent_v1_LsTimeout> | undefined, b: agent_v1_LsTimeout | MessageInit<agent_v1_LsTimeout> | undefined): boolean;
}

/** agent.v1.MatchedInstalledPlugin; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_MatchedInstalledPlugin extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_MatchedInstalledPlugin>);
  static readonly typeName: "agent.v1.MatchedInstalledPlugin";
  displayName: string;
  description: string;
  matchedKeyword: string;
  skills: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  subagents: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  hooks: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  rules: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  commands: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  mcpServers: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_MatchedInstalledPlugin;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_MatchedInstalledPlugin;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_MatchedInstalledPlugin;
  static equals(a: agent_v1_MatchedInstalledPlugin | MessageInit<agent_v1_MatchedInstalledPlugin> | undefined, b: agent_v1_MatchedInstalledPlugin | MessageInit<agent_v1_MatchedInstalledPlugin> | undefined): boolean;
}

/** agent.v1.McpAllowlistPrecheckArgs; source: ../proto/dist/generated/agent/v1/mcp_allowlist_precheck_exec_pb.js */
export declare class agent_v1_McpAllowlistPrecheckArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpAllowlistPrecheckArgs>);
  static readonly typeName: "agent.v1.McpAllowlistPrecheckArgs";
  providerIdentifier: string;
  toolName: string;
  toolCallId?: string;
  annotationsJson?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpAllowlistPrecheckArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpAllowlistPrecheckArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpAllowlistPrecheckArgs;
  static equals(a: agent_v1_McpAllowlistPrecheckArgs | MessageInit<agent_v1_McpAllowlistPrecheckArgs> | undefined, b: agent_v1_McpAllowlistPrecheckArgs | MessageInit<agent_v1_McpAllowlistPrecheckArgs> | undefined): boolean;
}

/** agent.v1.McpAllowlistPrecheckResult; source: ../proto/dist/generated/agent/v1/mcp_allowlist_precheck_exec_pb.js */
export declare class agent_v1_McpAllowlistPrecheckResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpAllowlistPrecheckResult>);
  static readonly typeName: "agent.v1.McpAllowlistPrecheckResult";
  allowlisted: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpAllowlistPrecheckResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpAllowlistPrecheckResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpAllowlistPrecheckResult;
  static equals(a: agent_v1_McpAllowlistPrecheckResult | MessageInit<agent_v1_McpAllowlistPrecheckResult> | undefined, b: agent_v1_McpAllowlistPrecheckResult | MessageInit<agent_v1_McpAllowlistPrecheckResult> | undefined): boolean;
}

/** agent.v1.McpApproved; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpApproved extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpApproved>);
  static readonly typeName: "agent.v1.McpApproved";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpApproved;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpApproved;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpApproved;
  static equals(a: agent_v1_McpApproved | MessageInit<agent_v1_McpApproved> | undefined, b: agent_v1_McpApproved | MessageInit<agent_v1_McpApproved> | undefined): boolean;
}

/** agent.v1.McpArgs; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpArgs>);
  static readonly typeName: "agent.v1.McpArgs";
  name: string;
  args: Record<string, google_protobuf_Value>;
  toolCallId: string;
  providerIdentifier: string;
  toolName: string;
  smartModeApproval?: agent_v1_SmartModeApproval;
  smartModeApprovalOnly: boolean;
  skipApproval: boolean;
  serverIdentifier: string;
  symbolicPathArguments: agent_v1_McpSymbolicPathArgument[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpArgs;
  static equals(a: agent_v1_McpArgs | MessageInit<agent_v1_McpArgs> | undefined, b: agent_v1_McpArgs | MessageInit<agent_v1_McpArgs> | undefined): boolean;
}

/** agent.v1.McpDescriptor; source: ../proto/dist/generated/agent/v1/mcp_pb.js */
export declare class agent_v1_McpDescriptor extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpDescriptor>);
  static readonly typeName: "agent.v1.McpDescriptor";
  serverName: string;
  serverIdentifier: string;
  folderPath?: string;
  serverUseInstructions?: string;
  tools: agent_v1_McpToolDescriptor[];
  plugin?: string;
  marketplace?: string;
  pluginDbId?: string;
  marketplaceId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpDescriptor;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpDescriptor;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpDescriptor;
  static equals(a: agent_v1_McpDescriptor | MessageInit<agent_v1_McpDescriptor> | undefined, b: agent_v1_McpDescriptor | MessageInit<agent_v1_McpDescriptor> | undefined): boolean;
}

/** agent.v1.McpError; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpError>);
  static readonly typeName: "agent.v1.McpError";
  error: string;
  needsAuth?: boolean;
  recovery?: agent_v1_McpRecovery;
  httpStatus?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpError;
  static equals(a: agent_v1_McpError | MessageInit<agent_v1_McpError> | undefined, b: agent_v1_McpError | MessageInit<agent_v1_McpError> | undefined): boolean;
}

/** agent.v1.McpFileSystemOptions; source: ../proto/dist/generated/agent/v1/mcp_pb.js */
export declare class agent_v1_McpFileSystemOptions extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpFileSystemOptions>);
  static readonly typeName: "agent.v1.McpFileSystemOptions";
  enabled: boolean;
  workspaceProjectDir: string;
  mcpDescriptors: agent_v1_McpDescriptor[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpFileSystemOptions;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpFileSystemOptions;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpFileSystemOptions;
  static equals(a: agent_v1_McpFileSystemOptions | MessageInit<agent_v1_McpFileSystemOptions> | undefined, b: agent_v1_McpFileSystemOptions | MessageInit<agent_v1_McpFileSystemOptions> | undefined): boolean;
}

/** agent.v1.McpImageContent; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpImageContent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpImageContent>);
  static readonly typeName: "agent.v1.McpImageContent";
  data: Uint8Array;
  mimeType: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpImageContent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpImageContent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpImageContent;
  static equals(a: agent_v1_McpImageContent | MessageInit<agent_v1_McpImageContent> | undefined, b: agent_v1_McpImageContent | MessageInit<agent_v1_McpImageContent> | undefined): boolean;
}

/** agent.v1.McpInstructions; source: ../proto/dist/generated/agent/v1/mcp_pb.js */
export declare class agent_v1_McpInstructions extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpInstructions>);
  static readonly typeName: "agent.v1.McpInstructions";
  serverName: string;
  instructions: string;
  serverIdentifier: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpInstructions;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpInstructions;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpInstructions;
  static equals(a: agent_v1_McpInstructions | MessageInit<agent_v1_McpInstructions> | undefined, b: agent_v1_McpInstructions | MessageInit<agent_v1_McpInstructions> | undefined): boolean;
}

/** agent.v1.McpMetaToolOptions; source: ../proto/dist/generated/agent/v1/mcp_pb.js */
export declare class agent_v1_McpMetaToolOptions extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpMetaToolOptions>);
  static readonly typeName: "agent.v1.McpMetaToolOptions";
  enabled: boolean;
  mcpDescriptors: agent_v1_McpDescriptor[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpMetaToolOptions;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpMetaToolOptions;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpMetaToolOptions;
  static equals(a: agent_v1_McpMetaToolOptions | MessageInit<agent_v1_McpMetaToolOptions> | undefined, b: agent_v1_McpMetaToolOptions | MessageInit<agent_v1_McpMetaToolOptions> | undefined): boolean;
}

/** agent.v1.McpPermissionDenied; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpPermissionDenied extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpPermissionDenied>);
  static readonly typeName: "agent.v1.McpPermissionDenied";
  error: string;
  isReadonly: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpPermissionDenied;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpPermissionDenied;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpPermissionDenied;
  static equals(a: agent_v1_McpPermissionDenied | MessageInit<agent_v1_McpPermissionDenied> | undefined, b: agent_v1_McpPermissionDenied | MessageInit<agent_v1_McpPermissionDenied> | undefined): boolean;
}

/** agent.v1.McpRecovery; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpRecovery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpRecovery>);
  static readonly typeName: "agent.v1.McpRecovery";
  outcome: agent_v1_McpRecovery_Outcome;
  freshInputSchemaJson?: string;
  availableTools: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpRecovery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpRecovery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpRecovery;
  static equals(a: agent_v1_McpRecovery | MessageInit<agent_v1_McpRecovery> | undefined, b: agent_v1_McpRecovery | MessageInit<agent_v1_McpRecovery> | undefined): boolean;
}

/** agent.v1.McpRecovery.Outcome; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare enum agent_v1_McpRecovery_Outcome {
  "UNSPECIFIED" = 0,
  "CHANGED" = 1,
  "REMOVED" = 2,
  "UNCHANGED" = 3,
  "REFRESH_FAILED" = 4,
}

/** agent.v1.McpRefreshPolicy; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare enum agent_v1_McpRefreshPolicy {
  "UNSPECIFIED" = 0,
  "FORCE_IF_MISSING" = 1,
  "FORCE" = 2,
}

/** agent.v1.McpRejected; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpRejected>);
  static readonly typeName: "agent.v1.McpRejected";
  reason: string;
  isReadonly: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpRejected;
  static equals(a: agent_v1_McpRejected | MessageInit<agent_v1_McpRejected> | undefined, b: agent_v1_McpRejected | MessageInit<agent_v1_McpRejected> | undefined): boolean;
}

/** agent.v1.McpResult; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpResult>);
  static readonly typeName: "agent.v1.McpResult";
  result: { case: "success"; value: agent_v1_McpSuccess } | { case: "error"; value: agent_v1_McpError } | { case: "rejected"; value: agent_v1_McpRejected } | { case: "permissionDenied"; value: agent_v1_McpPermissionDenied } | { case: "toolNotFound"; value: agent_v1_McpToolNotFound } | { case: "serverNotFound"; value: agent_v1_McpServerNotFound } | { case: "approved"; value: agent_v1_McpApproved } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpResult;
  static equals(a: agent_v1_McpResult | MessageInit<agent_v1_McpResult> | undefined, b: agent_v1_McpResult | MessageInit<agent_v1_McpResult> | undefined): boolean;
}

/** agent.v1.McpServerNotFound; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpServerNotFound extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpServerNotFound>);
  static readonly typeName: "agent.v1.McpServerNotFound";
  name: string;
  availableServers: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpServerNotFound;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpServerNotFound;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpServerNotFound;
  static equals(a: agent_v1_McpServerNotFound | MessageInit<agent_v1_McpServerNotFound> | undefined, b: agent_v1_McpServerNotFound | MessageInit<agent_v1_McpServerNotFound> | undefined): boolean;
}

/** agent.v1.McpStateError; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpStateError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpStateError>);
  static readonly typeName: "agent.v1.McpStateError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpStateError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpStateError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpStateError;
  static equals(a: agent_v1_McpStateError | MessageInit<agent_v1_McpStateError> | undefined, b: agent_v1_McpStateError | MessageInit<agent_v1_McpStateError> | undefined): boolean;
}

/** agent.v1.McpStateExecArgs; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpStateExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpStateExecArgs>);
  static readonly typeName: "agent.v1.McpStateExecArgs";
  serverIdentifiers: string[];
  kickOnly: boolean;
  refreshPolicy?: agent_v1_McpRefreshPolicy;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpStateExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpStateExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpStateExecArgs;
  static equals(a: agent_v1_McpStateExecArgs | MessageInit<agent_v1_McpStateExecArgs> | undefined, b: agent_v1_McpStateExecArgs | MessageInit<agent_v1_McpStateExecArgs> | undefined): boolean;
}

/** agent.v1.McpStateExecResult; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpStateExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpStateExecResult>);
  static readonly typeName: "agent.v1.McpStateExecResult";
  result: { case: "success"; value: agent_v1_McpStateSuccess } | { case: "error"; value: agent_v1_McpStateError } | { case: "rejected"; value: agent_v1_McpStateRejected } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpStateExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpStateExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpStateExecResult;
  static equals(a: agent_v1_McpStateExecResult | MessageInit<agent_v1_McpStateExecResult> | undefined, b: agent_v1_McpStateExecResult | MessageInit<agent_v1_McpStateExecResult> | undefined): boolean;
}

/** agent.v1.McpStateRejected; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpStateRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpStateRejected>);
  static readonly typeName: "agent.v1.McpStateRejected";
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpStateRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpStateRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpStateRejected;
  static equals(a: agent_v1_McpStateRejected | MessageInit<agent_v1_McpStateRejected> | undefined, b: agent_v1_McpStateRejected | MessageInit<agent_v1_McpStateRejected> | undefined): boolean;
}

/** agent.v1.McpStateServer; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpStateServer extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpStateServer>);
  static readonly typeName: "agent.v1.McpStateServer";
  serverName: string;
  serverIdentifier: string;
  plugin?: string;
  marketplace?: string;
  tools: agent_v1_McpToolDefinition[];
  instructions: agent_v1_McpInstructions[];
  status?: string;
  errorMessage?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpStateServer;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpStateServer;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpStateServer;
  static equals(a: agent_v1_McpStateServer | MessageInit<agent_v1_McpStateServer> | undefined, b: agent_v1_McpStateServer | MessageInit<agent_v1_McpStateServer> | undefined): boolean;
}

/** agent.v1.McpStateSuccess; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpStateSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpStateSuccess>);
  static readonly typeName: "agent.v1.McpStateSuccess";
  servers: agent_v1_McpStateServer[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpStateSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpStateSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpStateSuccess;
  static equals(a: agent_v1_McpStateSuccess | MessageInit<agent_v1_McpStateSuccess> | undefined, b: agent_v1_McpStateSuccess | MessageInit<agent_v1_McpStateSuccess> | undefined): boolean;
}

/** agent.v1.McpSuccess; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpSuccess>);
  static readonly typeName: "agent.v1.McpSuccess";
  content: agent_v1_McpToolResultContentItem[];
  isError: boolean;
  structuredContent?: google_protobuf_Struct;
  systemReminders: agent_v1_SystemReminder[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpSuccess;
  static equals(a: agent_v1_McpSuccess | MessageInit<agent_v1_McpSuccess> | undefined, b: agent_v1_McpSuccess | MessageInit<agent_v1_McpSuccess> | undefined): boolean;
}

/** agent.v1.McpSymbolicPathArgument; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpSymbolicPathArgument extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpSymbolicPathArgument>);
  static readonly typeName: "agent.v1.McpSymbolicPathArgument";
  path: string;
  sha256: string;
  sizeBytes: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpSymbolicPathArgument;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpSymbolicPathArgument;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpSymbolicPathArgument;
  static equals(a: agent_v1_McpSymbolicPathArgument | MessageInit<agent_v1_McpSymbolicPathArgument> | undefined, b: agent_v1_McpSymbolicPathArgument | MessageInit<agent_v1_McpSymbolicPathArgument> | undefined): boolean;
}

/** agent.v1.McpTextContent; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpTextContent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpTextContent>);
  static readonly typeName: "agent.v1.McpTextContent";
  text: string;
  outputLocation?: agent_v1_OutputLocation;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpTextContent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpTextContent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpTextContent;
  static equals(a: agent_v1_McpTextContent | MessageInit<agent_v1_McpTextContent> | undefined, b: agent_v1_McpTextContent | MessageInit<agent_v1_McpTextContent> | undefined): boolean;
}

/** agent.v1.McpToolDefinition; source: ../proto/dist/generated/agent/v1/mcp_pb.js */
export declare class agent_v1_McpToolDefinition extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpToolDefinition>);
  static readonly typeName: "agent.v1.McpToolDefinition";
  name: string;
  providerIdentifier: string;
  toolName: string;
  description: string;
  inputSchema?: google_protobuf_Value;
  inputSchemaJson?: string;
  outputSchemaJson?: string;
  annotationsJson?: string;
  metaJson?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpToolDefinition;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpToolDefinition;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpToolDefinition;
  static equals(a: agent_v1_McpToolDefinition | MessageInit<agent_v1_McpToolDefinition> | undefined, b: agent_v1_McpToolDefinition | MessageInit<agent_v1_McpToolDefinition> | undefined): boolean;
}

/** agent.v1.McpToolDescriptor; source: ../proto/dist/generated/agent/v1/mcp_pb.js */
export declare class agent_v1_McpToolDescriptor extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpToolDescriptor>);
  static readonly typeName: "agent.v1.McpToolDescriptor";
  toolName: string;
  definitionPath?: string;
  description?: string;
  inputSchema?: google_protobuf_Value;
  inputSchemaJson?: string;
  annotationsJson?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpToolDescriptor;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpToolDescriptor;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpToolDescriptor;
  static equals(a: agent_v1_McpToolDescriptor | MessageInit<agent_v1_McpToolDescriptor> | undefined, b: agent_v1_McpToolDescriptor | MessageInit<agent_v1_McpToolDescriptor> | undefined): boolean;
}

/** agent.v1.McpToolNotFound; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpToolNotFound extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpToolNotFound>);
  static readonly typeName: "agent.v1.McpToolNotFound";
  name: string;
  availableTools: string[];
  recovery?: agent_v1_McpRecovery;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpToolNotFound;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpToolNotFound;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpToolNotFound;
  static equals(a: agent_v1_McpToolNotFound | MessageInit<agent_v1_McpToolNotFound> | undefined, b: agent_v1_McpToolNotFound | MessageInit<agent_v1_McpToolNotFound> | undefined): boolean;
}

/** agent.v1.McpToolResultContentItem; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_McpToolResultContentItem extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_McpToolResultContentItem>);
  static readonly typeName: "agent.v1.McpToolResultContentItem";
  content: { case: "text"; value: agent_v1_McpTextContent } | { case: "image"; value: agent_v1_McpImageContent } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_McpToolResultContentItem;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_McpToolResultContentItem;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_McpToolResultContentItem;
  static equals(a: agent_v1_McpToolResultContentItem | MessageInit<agent_v1_McpToolResultContentItem> | undefined, b: agent_v1_McpToolResultContentItem | MessageInit<agent_v1_McpToolResultContentItem> | undefined): boolean;
}

/** agent.v1.MountedAgentStore; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_MountedAgentStore extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_MountedAgentStore>);
  static readonly typeName: "agent.v1.MountedAgentStore";
  path: string;
  kind: agent_v1_MountedAgentStoreKind;
  alias?: string;
  readOnly: boolean;
  inheritedFromPath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_MountedAgentStore;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_MountedAgentStore;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_MountedAgentStore;
  static equals(a: agent_v1_MountedAgentStore | MessageInit<agent_v1_MountedAgentStore> | undefined, b: agent_v1_MountedAgentStore | MessageInit<agent_v1_MountedAgentStore> | undefined): boolean;
}

/** agent.v1.MountedAgentStoreKind; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare enum agent_v1_MountedAgentStoreKind {
  "UNSPECIFIED" = 0,
  "SELF" = 1,
  "PEER" = 2,
  "SHARE" = 3,
  "PRINCIPAL" = 4,
}

/** agent.v1.MouseButton; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare enum agent_v1_MouseButton {
  "UNSPECIFIED" = 0,
  "LEFT" = 1,
  "RIGHT" = 2,
  "MIDDLE" = 3,
  "BACK" = 4,
  "FORWARD" = 5,
}

/** agent.v1.MouseDownAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_MouseDownAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_MouseDownAction>);
  static readonly typeName: "agent.v1.MouseDownAction";
  button: agent_v1_MouseButton;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_MouseDownAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_MouseDownAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_MouseDownAction;
  static equals(a: agent_v1_MouseDownAction | MessageInit<agent_v1_MouseDownAction> | undefined, b: agent_v1_MouseDownAction | MessageInit<agent_v1_MouseDownAction> | undefined): boolean;
}

/** agent.v1.MouseMoveAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_MouseMoveAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_MouseMoveAction>);
  static readonly typeName: "agent.v1.MouseMoveAction";
  coordinate?: agent_v1_Coordinate;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_MouseMoveAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_MouseMoveAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_MouseMoveAction;
  static equals(a: agent_v1_MouseMoveAction | MessageInit<agent_v1_MouseMoveAction> | undefined, b: agent_v1_MouseMoveAction | MessageInit<agent_v1_MouseMoveAction> | undefined): boolean;
}

/** agent.v1.MouseUpAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_MouseUpAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_MouseUpAction>);
  static readonly typeName: "agent.v1.MouseUpAction";
  button: agent_v1_MouseButton;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_MouseUpAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_MouseUpAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_MouseUpAction;
  static equals(a: agent_v1_MouseUpAction | MessageInit<agent_v1_MouseUpAction> | undefined, b: agent_v1_MouseUpAction | MessageInit<agent_v1_MouseUpAction> | undefined): boolean;
}

/** agent.v1.NetworkPolicy; source: ../proto/dist/generated/agent/v1/sandbox_pb.js */
export declare class agent_v1_NetworkPolicy extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_NetworkPolicy>);
  static readonly typeName: "agent.v1.NetworkPolicy";
  version?: number;
  defaultAction?: agent_v1_NetworkPolicy_DefaultAction;
  deny: string[];
  allow: string[];
  logging?: agent_v1_NetworkPolicyLoggingConfig;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_NetworkPolicy;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_NetworkPolicy;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_NetworkPolicy;
  static equals(a: agent_v1_NetworkPolicy | MessageInit<agent_v1_NetworkPolicy> | undefined, b: agent_v1_NetworkPolicy | MessageInit<agent_v1_NetworkPolicy> | undefined): boolean;
}

/** agent.v1.NetworkPolicy.DefaultAction; source: ../proto/dist/generated/agent/v1/sandbox_pb.js */
export declare enum agent_v1_NetworkPolicy_DefaultAction {
  "UNSPECIFIED" = 0,
  "ALLOW" = 1,
  "DENY" = 2,
}

/** agent.v1.NetworkPolicyLoggingConfig; source: ../proto/dist/generated/agent/v1/sandbox_pb.js */
export declare class agent_v1_NetworkPolicyLoggingConfig extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_NetworkPolicyLoggingConfig>);
  static readonly typeName: "agent.v1.NetworkPolicyLoggingConfig";
  decisionLogPath?: string;
  logFormat?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_NetworkPolicyLoggingConfig;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_NetworkPolicyLoggingConfig;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_NetworkPolicyLoggingConfig;
  static equals(a: agent_v1_NetworkPolicyLoggingConfig | MessageInit<agent_v1_NetworkPolicyLoggingConfig> | undefined, b: agent_v1_NetworkPolicyLoggingConfig | MessageInit<agent_v1_NetworkPolicyLoggingConfig> | undefined): boolean;
}

/** agent.v1.OutputLocation; source: ../proto/dist/generated/agent/v1/utils_pb.js */
export declare class agent_v1_OutputLocation extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_OutputLocation>);
  static readonly typeName: "agent.v1.OutputLocation";
  filePath: string;
  sizeBytes: bigint;
  lineCount: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_OutputLocation;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_OutputLocation;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_OutputLocation;
  static equals(a: agent_v1_OutputLocation | MessageInit<agent_v1_OutputLocation> | undefined, b: agent_v1_OutputLocation | MessageInit<agent_v1_OutputLocation> | undefined): boolean;
}

/** agent.v1.PackageType; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare enum agent_v1_PackageType {
  "UNSPECIFIED" = 0,
  "CURSOR_PROJECT" = 1,
  "CURSOR_PERSONAL" = 2,
  "CLAUDE_SKILL" = 3,
  "CLAUDE_PLUGIN" = 4,
}

/** agent.v1.PermissionsAutoRunInstructions; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_PermissionsAutoRunInstructions extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PermissionsAutoRunInstructions>);
  static readonly typeName: "agent.v1.PermissionsAutoRunInstructions";
  allowInstructions: string[];
  blockInstructions: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PermissionsAutoRunInstructions;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PermissionsAutoRunInstructions;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PermissionsAutoRunInstructions;
  static equals(a: agent_v1_PermissionsAutoRunInstructions | MessageInit<agent_v1_PermissionsAutoRunInstructions> | undefined, b: agent_v1_PermissionsAutoRunInstructions | MessageInit<agent_v1_PermissionsAutoRunInstructions> | undefined): boolean;
}

/** agent.v1.PersistArtifactsToAgentStoreRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PersistArtifactsToAgentStoreRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PersistArtifactsToAgentStoreRequest>);
  static readonly typeName: "agent.v1.PersistArtifactsToAgentStoreRequest";
  artifacts: agent_v1_PersistArtifactToAgentStoreInstruction[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PersistArtifactsToAgentStoreRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PersistArtifactsToAgentStoreRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PersistArtifactsToAgentStoreRequest;
  static equals(a: agent_v1_PersistArtifactsToAgentStoreRequest | MessageInit<agent_v1_PersistArtifactsToAgentStoreRequest> | undefined, b: agent_v1_PersistArtifactsToAgentStoreRequest | MessageInit<agent_v1_PersistArtifactsToAgentStoreRequest> | undefined): boolean;
}

/** agent.v1.PersistArtifactsToAgentStoreResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PersistArtifactsToAgentStoreResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PersistArtifactsToAgentStoreResponse>);
  static readonly typeName: "agent.v1.PersistArtifactsToAgentStoreResponse";
  results: agent_v1_PersistArtifactToAgentStoreResult[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PersistArtifactsToAgentStoreResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PersistArtifactsToAgentStoreResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PersistArtifactsToAgentStoreResponse;
  static equals(a: agent_v1_PersistArtifactsToAgentStoreResponse | MessageInit<agent_v1_PersistArtifactsToAgentStoreResponse> | undefined, b: agent_v1_PersistArtifactsToAgentStoreResponse | MessageInit<agent_v1_PersistArtifactsToAgentStoreResponse> | undefined): boolean;
}

/** agent.v1.PersistArtifactsToParentStoreRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PersistArtifactsToParentStoreRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PersistArtifactsToParentStoreRequest>);
  static readonly typeName: "agent.v1.PersistArtifactsToParentStoreRequest";
  artifacts: agent_v1_PersistArtifactToAgentStoreInstruction[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PersistArtifactsToParentStoreRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PersistArtifactsToParentStoreRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PersistArtifactsToParentStoreRequest;
  static equals(a: agent_v1_PersistArtifactsToParentStoreRequest | MessageInit<agent_v1_PersistArtifactsToParentStoreRequest> | undefined, b: agent_v1_PersistArtifactsToParentStoreRequest | MessageInit<agent_v1_PersistArtifactsToParentStoreRequest> | undefined): boolean;
}

/** agent.v1.PersistArtifactsToParentStoreResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PersistArtifactsToParentStoreResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PersistArtifactsToParentStoreResponse>);
  static readonly typeName: "agent.v1.PersistArtifactsToParentStoreResponse";
  results: agent_v1_PersistArtifactToAgentStoreResult[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PersistArtifactsToParentStoreResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PersistArtifactsToParentStoreResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PersistArtifactsToParentStoreResponse;
  static equals(a: agent_v1_PersistArtifactsToParentStoreResponse | MessageInit<agent_v1_PersistArtifactsToParentStoreResponse> | undefined, b: agent_v1_PersistArtifactsToParentStoreResponse | MessageInit<agent_v1_PersistArtifactsToParentStoreResponse> | undefined): boolean;
}

/** agent.v1.PersistArtifactToAgentStoreInstruction; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PersistArtifactToAgentStoreInstruction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PersistArtifactToAgentStoreInstruction>);
  static readonly typeName: "agent.v1.PersistArtifactToAgentStoreInstruction";
  absolutePath: string;
  artifactRelativePath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PersistArtifactToAgentStoreInstruction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PersistArtifactToAgentStoreInstruction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PersistArtifactToAgentStoreInstruction;
  static equals(a: agent_v1_PersistArtifactToAgentStoreInstruction | MessageInit<agent_v1_PersistArtifactToAgentStoreInstruction> | undefined, b: agent_v1_PersistArtifactToAgentStoreInstruction | MessageInit<agent_v1_PersistArtifactToAgentStoreInstruction> | undefined): boolean;
}

/** agent.v1.PersistArtifactToAgentStoreResult; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PersistArtifactToAgentStoreResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PersistArtifactToAgentStoreResult>);
  static readonly typeName: "agent.v1.PersistArtifactToAgentStoreResult";
  absolutePath: string;
  status: agent_v1_PersistArtifactToAgentStoreStatus;
  message: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PersistArtifactToAgentStoreResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PersistArtifactToAgentStoreResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PersistArtifactToAgentStoreResult;
  static equals(a: agent_v1_PersistArtifactToAgentStoreResult | MessageInit<agent_v1_PersistArtifactToAgentStoreResult> | undefined, b: agent_v1_PersistArtifactToAgentStoreResult | MessageInit<agent_v1_PersistArtifactToAgentStoreResult> | undefined): boolean;
}

/** agent.v1.PersistArtifactToAgentStoreStatus; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_PersistArtifactToAgentStoreStatus {
  "UNSPECIFIED" = 0,
  "PERSISTED" = 1,
  "REJECTED" = 2,
}

/** agent.v1.PiBashExecArgs; source: ../proto/dist/generated/agent/v1/pi_bash_exec_pb.js */
export declare class agent_v1_PiBashExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiBashExecArgs>);
  static readonly typeName: "agent.v1.PiBashExecArgs";
  command: string;
  timeout?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiBashExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiBashExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiBashExecArgs;
  static equals(a: agent_v1_PiBashExecArgs | MessageInit<agent_v1_PiBashExecArgs> | undefined, b: agent_v1_PiBashExecArgs | MessageInit<agent_v1_PiBashExecArgs> | undefined): boolean;
}

/** agent.v1.PiBashExecError; source: ../proto/dist/generated/agent/v1/pi_bash_exec_pb.js */
export declare class agent_v1_PiBashExecError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiBashExecError>);
  static readonly typeName: "agent.v1.PiBashExecError";
  error: string;
  truncation?: agent_v1_PiTruncation;
  fullOutputPath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiBashExecError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiBashExecError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiBashExecError;
  static equals(a: agent_v1_PiBashExecError | MessageInit<agent_v1_PiBashExecError> | undefined, b: agent_v1_PiBashExecError | MessageInit<agent_v1_PiBashExecError> | undefined): boolean;
}

/** agent.v1.PiBashExecResult; source: ../proto/dist/generated/agent/v1/pi_bash_exec_pb.js */
export declare class agent_v1_PiBashExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiBashExecResult>);
  static readonly typeName: "agent.v1.PiBashExecResult";
  result: { case: "success"; value: agent_v1_PiBashExecSuccess } | { case: "error"; value: agent_v1_PiBashExecError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiBashExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiBashExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiBashExecResult;
  static equals(a: agent_v1_PiBashExecResult | MessageInit<agent_v1_PiBashExecResult> | undefined, b: agent_v1_PiBashExecResult | MessageInit<agent_v1_PiBashExecResult> | undefined): boolean;
}

/** agent.v1.PiBashExecSuccess; source: ../proto/dist/generated/agent/v1/pi_bash_exec_pb.js */
export declare class agent_v1_PiBashExecSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiBashExecSuccess>);
  static readonly typeName: "agent.v1.PiBashExecSuccess";
  output: string;
  truncation?: agent_v1_PiTruncation;
  fullOutputPath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiBashExecSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiBashExecSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiBashExecSuccess;
  static equals(a: agent_v1_PiBashExecSuccess | MessageInit<agent_v1_PiBashExecSuccess> | undefined, b: agent_v1_PiBashExecSuccess | MessageInit<agent_v1_PiBashExecSuccess> | undefined): boolean;
}

/** agent.v1.PiEditExecArgs; source: ../proto/dist/generated/agent/v1/pi_edit_exec_pb.js */
export declare class agent_v1_PiEditExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiEditExecArgs>);
  static readonly typeName: "agent.v1.PiEditExecArgs";
  path: string;
  edits: agent_v1_PiEditReplacement[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiEditExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiEditExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiEditExecArgs;
  static equals(a: agent_v1_PiEditExecArgs | MessageInit<agent_v1_PiEditExecArgs> | undefined, b: agent_v1_PiEditExecArgs | MessageInit<agent_v1_PiEditExecArgs> | undefined): boolean;
}

/** agent.v1.PiEditExecError; source: ../proto/dist/generated/agent/v1/pi_edit_exec_pb.js */
export declare class agent_v1_PiEditExecError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiEditExecError>);
  static readonly typeName: "agent.v1.PiEditExecError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiEditExecError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiEditExecError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiEditExecError;
  static equals(a: agent_v1_PiEditExecError | MessageInit<agent_v1_PiEditExecError> | undefined, b: agent_v1_PiEditExecError | MessageInit<agent_v1_PiEditExecError> | undefined): boolean;
}

/** agent.v1.PiEditExecRejected; source: ../proto/dist/generated/agent/v1/pi_edit_exec_pb.js */
export declare class agent_v1_PiEditExecRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiEditExecRejected>);
  static readonly typeName: "agent.v1.PiEditExecRejected";
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiEditExecRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiEditExecRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiEditExecRejected;
  static equals(a: agent_v1_PiEditExecRejected | MessageInit<agent_v1_PiEditExecRejected> | undefined, b: agent_v1_PiEditExecRejected | MessageInit<agent_v1_PiEditExecRejected> | undefined): boolean;
}

/** agent.v1.PiEditExecResult; source: ../proto/dist/generated/agent/v1/pi_edit_exec_pb.js */
export declare class agent_v1_PiEditExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiEditExecResult>);
  static readonly typeName: "agent.v1.PiEditExecResult";
  result: { case: "success"; value: agent_v1_PiEditExecSuccess } | { case: "error"; value: agent_v1_PiEditExecError } | { case: "rejected"; value: agent_v1_PiEditExecRejected } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiEditExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiEditExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiEditExecResult;
  static equals(a: agent_v1_PiEditExecResult | MessageInit<agent_v1_PiEditExecResult> | undefined, b: agent_v1_PiEditExecResult | MessageInit<agent_v1_PiEditExecResult> | undefined): boolean;
}

/** agent.v1.PiEditExecSuccess; source: ../proto/dist/generated/agent/v1/pi_edit_exec_pb.js */
export declare class agent_v1_PiEditExecSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiEditExecSuccess>);
  static readonly typeName: "agent.v1.PiEditExecSuccess";
  output: string;
  diff: string;
  patch: string;
  firstChangedLine?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiEditExecSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiEditExecSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiEditExecSuccess;
  static equals(a: agent_v1_PiEditExecSuccess | MessageInit<agent_v1_PiEditExecSuccess> | undefined, b: agent_v1_PiEditExecSuccess | MessageInit<agent_v1_PiEditExecSuccess> | undefined): boolean;
}

/** agent.v1.PiEditReplacement; source: ../proto/dist/generated/agent/v1/pi_edit_exec_pb.js */
export declare class agent_v1_PiEditReplacement extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiEditReplacement>);
  static readonly typeName: "agent.v1.PiEditReplacement";
  oldText: string;
  newText: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiEditReplacement;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiEditReplacement;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiEditReplacement;
  static equals(a: agent_v1_PiEditReplacement | MessageInit<agent_v1_PiEditReplacement> | undefined, b: agent_v1_PiEditReplacement | MessageInit<agent_v1_PiEditReplacement> | undefined): boolean;
}

/** agent.v1.PiFindExecArgs; source: ../proto/dist/generated/agent/v1/pi_find_exec_pb.js */
export declare class agent_v1_PiFindExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiFindExecArgs>);
  static readonly typeName: "agent.v1.PiFindExecArgs";
  pattern: string;
  path?: string;
  limit?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiFindExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiFindExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiFindExecArgs;
  static equals(a: agent_v1_PiFindExecArgs | MessageInit<agent_v1_PiFindExecArgs> | undefined, b: agent_v1_PiFindExecArgs | MessageInit<agent_v1_PiFindExecArgs> | undefined): boolean;
}

/** agent.v1.PiFindExecError; source: ../proto/dist/generated/agent/v1/pi_find_exec_pb.js */
export declare class agent_v1_PiFindExecError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiFindExecError>);
  static readonly typeName: "agent.v1.PiFindExecError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiFindExecError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiFindExecError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiFindExecError;
  static equals(a: agent_v1_PiFindExecError | MessageInit<agent_v1_PiFindExecError> | undefined, b: agent_v1_PiFindExecError | MessageInit<agent_v1_PiFindExecError> | undefined): boolean;
}

/** agent.v1.PiFindExecResult; source: ../proto/dist/generated/agent/v1/pi_find_exec_pb.js */
export declare class agent_v1_PiFindExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiFindExecResult>);
  static readonly typeName: "agent.v1.PiFindExecResult";
  result: { case: "success"; value: agent_v1_PiFindExecSuccess } | { case: "error"; value: agent_v1_PiFindExecError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiFindExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiFindExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiFindExecResult;
  static equals(a: agent_v1_PiFindExecResult | MessageInit<agent_v1_PiFindExecResult> | undefined, b: agent_v1_PiFindExecResult | MessageInit<agent_v1_PiFindExecResult> | undefined): boolean;
}

/** agent.v1.PiFindExecSuccess; source: ../proto/dist/generated/agent/v1/pi_find_exec_pb.js */
export declare class agent_v1_PiFindExecSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiFindExecSuccess>);
  static readonly typeName: "agent.v1.PiFindExecSuccess";
  output: string;
  truncation?: agent_v1_PiTruncation;
  resultLimitReached?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiFindExecSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiFindExecSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiFindExecSuccess;
  static equals(a: agent_v1_PiFindExecSuccess | MessageInit<agent_v1_PiFindExecSuccess> | undefined, b: agent_v1_PiFindExecSuccess | MessageInit<agent_v1_PiFindExecSuccess> | undefined): boolean;
}

/** agent.v1.PiGrepExecArgs; source: ../proto/dist/generated/agent/v1/pi_grep_exec_pb.js */
export declare class agent_v1_PiGrepExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiGrepExecArgs>);
  static readonly typeName: "agent.v1.PiGrepExecArgs";
  pattern: string;
  path?: string;
  glob?: string;
  ignoreCase?: boolean;
  literal?: boolean;
  context?: number;
  limit?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiGrepExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiGrepExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiGrepExecArgs;
  static equals(a: agent_v1_PiGrepExecArgs | MessageInit<agent_v1_PiGrepExecArgs> | undefined, b: agent_v1_PiGrepExecArgs | MessageInit<agent_v1_PiGrepExecArgs> | undefined): boolean;
}

/** agent.v1.PiGrepExecError; source: ../proto/dist/generated/agent/v1/pi_grep_exec_pb.js */
export declare class agent_v1_PiGrepExecError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiGrepExecError>);
  static readonly typeName: "agent.v1.PiGrepExecError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiGrepExecError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiGrepExecError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiGrepExecError;
  static equals(a: agent_v1_PiGrepExecError | MessageInit<agent_v1_PiGrepExecError> | undefined, b: agent_v1_PiGrepExecError | MessageInit<agent_v1_PiGrepExecError> | undefined): boolean;
}

/** agent.v1.PiGrepExecResult; source: ../proto/dist/generated/agent/v1/pi_grep_exec_pb.js */
export declare class agent_v1_PiGrepExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiGrepExecResult>);
  static readonly typeName: "agent.v1.PiGrepExecResult";
  result: { case: "success"; value: agent_v1_PiGrepExecSuccess } | { case: "error"; value: agent_v1_PiGrepExecError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiGrepExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiGrepExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiGrepExecResult;
  static equals(a: agent_v1_PiGrepExecResult | MessageInit<agent_v1_PiGrepExecResult> | undefined, b: agent_v1_PiGrepExecResult | MessageInit<agent_v1_PiGrepExecResult> | undefined): boolean;
}

/** agent.v1.PiGrepExecSuccess; source: ../proto/dist/generated/agent/v1/pi_grep_exec_pb.js */
export declare class agent_v1_PiGrepExecSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiGrepExecSuccess>);
  static readonly typeName: "agent.v1.PiGrepExecSuccess";
  output: string;
  truncation?: agent_v1_PiTruncation;
  matchLimitReached?: number;
  linesTruncated: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiGrepExecSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiGrepExecSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiGrepExecSuccess;
  static equals(a: agent_v1_PiGrepExecSuccess | MessageInit<agent_v1_PiGrepExecSuccess> | undefined, b: agent_v1_PiGrepExecSuccess | MessageInit<agent_v1_PiGrepExecSuccess> | undefined): boolean;
}

/** agent.v1.PiLsExecArgs; source: ../proto/dist/generated/agent/v1/pi_ls_exec_pb.js */
export declare class agent_v1_PiLsExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiLsExecArgs>);
  static readonly typeName: "agent.v1.PiLsExecArgs";
  path?: string;
  limit?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiLsExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiLsExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiLsExecArgs;
  static equals(a: agent_v1_PiLsExecArgs | MessageInit<agent_v1_PiLsExecArgs> | undefined, b: agent_v1_PiLsExecArgs | MessageInit<agent_v1_PiLsExecArgs> | undefined): boolean;
}

/** agent.v1.PiLsExecError; source: ../proto/dist/generated/agent/v1/pi_ls_exec_pb.js */
export declare class agent_v1_PiLsExecError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiLsExecError>);
  static readonly typeName: "agent.v1.PiLsExecError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiLsExecError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiLsExecError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiLsExecError;
  static equals(a: agent_v1_PiLsExecError | MessageInit<agent_v1_PiLsExecError> | undefined, b: agent_v1_PiLsExecError | MessageInit<agent_v1_PiLsExecError> | undefined): boolean;
}

/** agent.v1.PiLsExecResult; source: ../proto/dist/generated/agent/v1/pi_ls_exec_pb.js */
export declare class agent_v1_PiLsExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiLsExecResult>);
  static readonly typeName: "agent.v1.PiLsExecResult";
  result: { case: "success"; value: agent_v1_PiLsExecSuccess } | { case: "error"; value: agent_v1_PiLsExecError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiLsExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiLsExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiLsExecResult;
  static equals(a: agent_v1_PiLsExecResult | MessageInit<agent_v1_PiLsExecResult> | undefined, b: agent_v1_PiLsExecResult | MessageInit<agent_v1_PiLsExecResult> | undefined): boolean;
}

/** agent.v1.PiLsExecSuccess; source: ../proto/dist/generated/agent/v1/pi_ls_exec_pb.js */
export declare class agent_v1_PiLsExecSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiLsExecSuccess>);
  static readonly typeName: "agent.v1.PiLsExecSuccess";
  output: string;
  truncation?: agent_v1_PiTruncation;
  entryLimitReached?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiLsExecSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiLsExecSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiLsExecSuccess;
  static equals(a: agent_v1_PiLsExecSuccess | MessageInit<agent_v1_PiLsExecSuccess> | undefined, b: agent_v1_PiLsExecSuccess | MessageInit<agent_v1_PiLsExecSuccess> | undefined): boolean;
}

/** agent.v1.PingRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PingRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PingRequest>);
  static readonly typeName: "agent.v1.PingRequest";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PingRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PingRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PingRequest;
  static equals(a: agent_v1_PingRequest | MessageInit<agent_v1_PingRequest> | undefined, b: agent_v1_PingRequest | MessageInit<agent_v1_PingRequest> | undefined): boolean;
}

/** agent.v1.PingResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_PingResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PingResponse>);
  static readonly typeName: "agent.v1.PingResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PingResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PingResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PingResponse;
  static equals(a: agent_v1_PingResponse | MessageInit<agent_v1_PingResponse> | undefined, b: agent_v1_PingResponse | MessageInit<agent_v1_PingResponse> | undefined): boolean;
}

/** agent.v1.PiReadExecArgs; source: ../proto/dist/generated/agent/v1/pi_read_exec_pb.js */
export declare class agent_v1_PiReadExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiReadExecArgs>);
  static readonly typeName: "agent.v1.PiReadExecArgs";
  path: string;
  offset?: number;
  limit?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiReadExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiReadExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiReadExecArgs;
  static equals(a: agent_v1_PiReadExecArgs | MessageInit<agent_v1_PiReadExecArgs> | undefined, b: agent_v1_PiReadExecArgs | MessageInit<agent_v1_PiReadExecArgs> | undefined): boolean;
}

/** agent.v1.PiReadExecError; source: ../proto/dist/generated/agent/v1/pi_read_exec_pb.js */
export declare class agent_v1_PiReadExecError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiReadExecError>);
  static readonly typeName: "agent.v1.PiReadExecError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiReadExecError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiReadExecError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiReadExecError;
  static equals(a: agent_v1_PiReadExecError | MessageInit<agent_v1_PiReadExecError> | undefined, b: agent_v1_PiReadExecError | MessageInit<agent_v1_PiReadExecError> | undefined): boolean;
}

/** agent.v1.PiReadExecResult; source: ../proto/dist/generated/agent/v1/pi_read_exec_pb.js */
export declare class agent_v1_PiReadExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiReadExecResult>);
  static readonly typeName: "agent.v1.PiReadExecResult";
  result: { case: "success"; value: agent_v1_PiReadExecSuccess } | { case: "error"; value: agent_v1_PiReadExecError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiReadExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiReadExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiReadExecResult;
  static equals(a: agent_v1_PiReadExecResult | MessageInit<agent_v1_PiReadExecResult> | undefined, b: agent_v1_PiReadExecResult | MessageInit<agent_v1_PiReadExecResult> | undefined): boolean;
}

/** agent.v1.PiReadExecSuccess; source: ../proto/dist/generated/agent/v1/pi_read_exec_pb.js */
export declare class agent_v1_PiReadExecSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiReadExecSuccess>);
  static readonly typeName: "agent.v1.PiReadExecSuccess";
  output: string;
  truncation?: agent_v1_PiTruncation;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiReadExecSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiReadExecSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiReadExecSuccess;
  static equals(a: agent_v1_PiReadExecSuccess | MessageInit<agent_v1_PiReadExecSuccess> | undefined, b: agent_v1_PiReadExecSuccess | MessageInit<agent_v1_PiReadExecSuccess> | undefined): boolean;
}

/** agent.v1.PiTruncation; source: ../proto/dist/generated/agent/v1/pi_common_pb.js */
export declare class agent_v1_PiTruncation extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiTruncation>);
  static readonly typeName: "agent.v1.PiTruncation";
  truncated: boolean;
  truncatedBy: string;
  totalLines: number;
  outputLines: number;
  outputBytes: number;
  maxLines?: number;
  maxBytes?: number;
  firstLineExceedsLimit: boolean;
  lastLinePartial: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiTruncation;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiTruncation;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiTruncation;
  static equals(a: agent_v1_PiTruncation | MessageInit<agent_v1_PiTruncation> | undefined, b: agent_v1_PiTruncation | MessageInit<agent_v1_PiTruncation> | undefined): boolean;
}

/** agent.v1.PiWriteExecArgs; source: ../proto/dist/generated/agent/v1/pi_write_exec_pb.js */
export declare class agent_v1_PiWriteExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiWriteExecArgs>);
  static readonly typeName: "agent.v1.PiWriteExecArgs";
  path: string;
  content: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiWriteExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiWriteExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiWriteExecArgs;
  static equals(a: agent_v1_PiWriteExecArgs | MessageInit<agent_v1_PiWriteExecArgs> | undefined, b: agent_v1_PiWriteExecArgs | MessageInit<agent_v1_PiWriteExecArgs> | undefined): boolean;
}

/** agent.v1.PiWriteExecError; source: ../proto/dist/generated/agent/v1/pi_write_exec_pb.js */
export declare class agent_v1_PiWriteExecError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiWriteExecError>);
  static readonly typeName: "agent.v1.PiWriteExecError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiWriteExecError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiWriteExecError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiWriteExecError;
  static equals(a: agent_v1_PiWriteExecError | MessageInit<agent_v1_PiWriteExecError> | undefined, b: agent_v1_PiWriteExecError | MessageInit<agent_v1_PiWriteExecError> | undefined): boolean;
}

/** agent.v1.PiWriteExecRejected; source: ../proto/dist/generated/agent/v1/pi_write_exec_pb.js */
export declare class agent_v1_PiWriteExecRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiWriteExecRejected>);
  static readonly typeName: "agent.v1.PiWriteExecRejected";
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiWriteExecRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiWriteExecRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiWriteExecRejected;
  static equals(a: agent_v1_PiWriteExecRejected | MessageInit<agent_v1_PiWriteExecRejected> | undefined, b: agent_v1_PiWriteExecRejected | MessageInit<agent_v1_PiWriteExecRejected> | undefined): boolean;
}

/** agent.v1.PiWriteExecResult; source: ../proto/dist/generated/agent/v1/pi_write_exec_pb.js */
export declare class agent_v1_PiWriteExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiWriteExecResult>);
  static readonly typeName: "agent.v1.PiWriteExecResult";
  result: { case: "success"; value: agent_v1_PiWriteExecSuccess } | { case: "error"; value: agent_v1_PiWriteExecError } | { case: "rejected"; value: agent_v1_PiWriteExecRejected } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiWriteExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiWriteExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiWriteExecResult;
  static equals(a: agent_v1_PiWriteExecResult | MessageInit<agent_v1_PiWriteExecResult> | undefined, b: agent_v1_PiWriteExecResult | MessageInit<agent_v1_PiWriteExecResult> | undefined): boolean;
}

/** agent.v1.PiWriteExecSuccess; source: ../proto/dist/generated/agent/v1/pi_write_exec_pb.js */
export declare class agent_v1_PiWriteExecSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PiWriteExecSuccess>);
  static readonly typeName: "agent.v1.PiWriteExecSuccess";
  output: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PiWriteExecSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PiWriteExecSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PiWriteExecSuccess;
  static equals(a: agent_v1_PiWriteExecSuccess | MessageInit<agent_v1_PiWriteExecSuccess> | undefined, b: agent_v1_PiWriteExecSuccess | MessageInit<agent_v1_PiWriteExecSuccess> | undefined): boolean;
}

/** agent.v1.Position; source: ../proto/dist/generated/agent/v1/utils_pb.js */
export declare class agent_v1_Position extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_Position>);
  static readonly typeName: "agent.v1.Position";
  line: number;
  column: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_Position;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_Position;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_Position;
  static equals(a: agent_v1_Position | MessageInit<agent_v1_Position> | undefined, b: agent_v1_Position | MessageInit<agent_v1_Position> | undefined): boolean;
}

/** agent.v1.PostToolUseFailureRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PostToolUseFailureRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PostToolUseFailureRequestQuery>);
  static readonly typeName: "agent.v1.PostToolUseFailureRequestQuery";
  toolName: string;
  toolInput?: google_protobuf_Struct;
  errorMessage: string;
  failureType: string;
  durationMs: bigint;
  toolUseId: string;
  isInterrupt: boolean;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  parentToolCallId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PostToolUseFailureRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PostToolUseFailureRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PostToolUseFailureRequestQuery;
  static equals(a: agent_v1_PostToolUseFailureRequestQuery | MessageInit<agent_v1_PostToolUseFailureRequestQuery> | undefined, b: agent_v1_PostToolUseFailureRequestQuery | MessageInit<agent_v1_PostToolUseFailureRequestQuery> | undefined): boolean;
}

/** agent.v1.PostToolUseFailureRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PostToolUseFailureRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PostToolUseFailureRequestResponse>);
  static readonly typeName: "agent.v1.PostToolUseFailureRequestResponse";
  additionalContext?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PostToolUseFailureRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PostToolUseFailureRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PostToolUseFailureRequestResponse;
  static equals(a: agent_v1_PostToolUseFailureRequestResponse | MessageInit<agent_v1_PostToolUseFailureRequestResponse> | undefined, b: agent_v1_PostToolUseFailureRequestResponse | MessageInit<agent_v1_PostToolUseFailureRequestResponse> | undefined): boolean;
}

/** agent.v1.PostToolUseRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PostToolUseRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PostToolUseRequestQuery>);
  static readonly typeName: "agent.v1.PostToolUseRequestQuery";
  toolName: string;
  toolInput?: google_protobuf_Struct;
  toolOutput: string;
  durationMs: bigint;
  toolUseId: string;
  cwd?: string;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  parentToolCallId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PostToolUseRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PostToolUseRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PostToolUseRequestQuery;
  static equals(a: agent_v1_PostToolUseRequestQuery | MessageInit<agent_v1_PostToolUseRequestQuery> | undefined, b: agent_v1_PostToolUseRequestQuery | MessageInit<agent_v1_PostToolUseRequestQuery> | undefined): boolean;
}

/** agent.v1.PostToolUseRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PostToolUseRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PostToolUseRequestResponse>);
  static readonly typeName: "agent.v1.PostToolUseRequestResponse";
  additionalContext?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PostToolUseRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PostToolUseRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PostToolUseRequestResponse;
  static equals(a: agent_v1_PostToolUseRequestResponse | MessageInit<agent_v1_PostToolUseRequestResponse> | undefined, b: agent_v1_PostToolUseRequestResponse | MessageInit<agent_v1_PostToolUseRequestResponse> | undefined): boolean;
}

/** agent.v1.PreCompactRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PreCompactRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PreCompactRequestQuery>);
  static readonly typeName: "agent.v1.PreCompactRequestQuery";
  trigger: string;
  contextUsagePercent: number;
  contextTokens: bigint;
  contextWindowSize: bigint;
  messageCount: number;
  messagesToCompact: number;
  isFirstCompaction: boolean;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PreCompactRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PreCompactRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PreCompactRequestQuery;
  static equals(a: agent_v1_PreCompactRequestQuery | MessageInit<agent_v1_PreCompactRequestQuery> | undefined, b: agent_v1_PreCompactRequestQuery | MessageInit<agent_v1_PreCompactRequestQuery> | undefined): boolean;
}

/** agent.v1.PreCompactRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PreCompactRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PreCompactRequestResponse>);
  static readonly typeName: "agent.v1.PreCompactRequestResponse";
  userMessage?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PreCompactRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PreCompactRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PreCompactRequestResponse;
  static equals(a: agent_v1_PreCompactRequestResponse | MessageInit<agent_v1_PreCompactRequestResponse> | undefined, b: agent_v1_PreCompactRequestResponse | MessageInit<agent_v1_PreCompactRequestResponse> | undefined): boolean;
}

/** agent.v1.PrecomputedHumanChange; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_PrecomputedHumanChange extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PrecomputedHumanChange>);
  static readonly typeName: "agent.v1.PrecomputedHumanChange";
  path: string;
  renderedDiffs: agent_v1_PrecomputedHumanChangeRenderedDiff[];
  isNewFile: boolean;
  isDeletedFile: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PrecomputedHumanChange;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PrecomputedHumanChange;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PrecomputedHumanChange;
  static equals(a: agent_v1_PrecomputedHumanChange | MessageInit<agent_v1_PrecomputedHumanChange> | undefined, b: agent_v1_PrecomputedHumanChange | MessageInit<agent_v1_PrecomputedHumanChange> | undefined): boolean;
}

/** agent.v1.PrecomputedHumanChangeRenderedDiff; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_PrecomputedHumanChangeRenderedDiff extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PrecomputedHumanChangeRenderedDiff>);
  static readonly typeName: "agent.v1.PrecomputedHumanChangeRenderedDiff";
  startLineNumber: number;
  endLineNumberExclusive: number;
  beforeContextLines: string[];
  removedLines: string[];
  addedLines: string[];
  afterContextLines: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PrecomputedHumanChangeRenderedDiff;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PrecomputedHumanChangeRenderedDiff;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PrecomputedHumanChangeRenderedDiff;
  static equals(a: agent_v1_PrecomputedHumanChangeRenderedDiff | MessageInit<agent_v1_PrecomputedHumanChangeRenderedDiff> | undefined, b: agent_v1_PrecomputedHumanChangeRenderedDiff | MessageInit<agent_v1_PrecomputedHumanChangeRenderedDiff> | undefined): boolean;
}

/** agent.v1.PreToolUseRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PreToolUseRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PreToolUseRequestQuery>);
  static readonly typeName: "agent.v1.PreToolUseRequestQuery";
  toolName: string;
  toolInput?: google_protobuf_Struct;
  toolUseId: string;
  cwd?: string;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  parentToolCallId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PreToolUseRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PreToolUseRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PreToolUseRequestQuery;
  static equals(a: agent_v1_PreToolUseRequestQuery | MessageInit<agent_v1_PreToolUseRequestQuery> | undefined, b: agent_v1_PreToolUseRequestQuery | MessageInit<agent_v1_PreToolUseRequestQuery> | undefined): boolean;
}

/** agent.v1.PreToolUseRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_PreToolUseRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PreToolUseRequestResponse>);
  static readonly typeName: "agent.v1.PreToolUseRequestResponse";
  permission?: string;
  userMessage?: string;
  agentMessage?: string;
  updatedInput?: string;
  additionalContext?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PreToolUseRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PreToolUseRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PreToolUseRequestResponse;
  static equals(a: agent_v1_PreToolUseRequestResponse | MessageInit<agent_v1_PreToolUseRequestResponse> | undefined, b: agent_v1_PreToolUseRequestResponse | MessageInit<agent_v1_PreToolUseRequestResponse> | undefined): boolean;
}

/** agent.v1.Process; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_Process extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_Process>);
  static readonly typeName: "agent.v1.Process";
  shell: string;
  args: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_Process;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_Process;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_Process;
  static equals(a: agent_v1_Process | MessageInit<agent_v1_Process> | undefined, b: agent_v1_Process | MessageInit<agent_v1_Process> | undefined): boolean;
}

/** agent.v1.PromptUploadRef; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_PromptUploadRef extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PromptUploadRef>);
  static readonly typeName: "agent.v1.PromptUploadRef";
  uploadId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PromptUploadRef;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PromptUploadRef;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PromptUploadRef;
  static equals(a: agent_v1_PromptUploadRef | MessageInit<agent_v1_PromptUploadRef> | undefined, b: agent_v1_PromptUploadRef | MessageInit<agent_v1_PromptUploadRef> | undefined): boolean;
}

/** agent.v1.PtyData; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_PtyData extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PtyData>);
  static readonly typeName: "agent.v1.PtyData";
  data: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PtyData;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PtyData;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PtyData;
  static equals(a: agent_v1_PtyData | MessageInit<agent_v1_PtyData> | undefined, b: agent_v1_PtyData | MessageInit<agent_v1_PtyData> | undefined): boolean;
}

/** agent.v1.PtyEvent; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_PtyEvent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PtyEvent>);
  static readonly typeName: "agent.v1.PtyEvent";
  eventId: string;
  data: { case: "ptyData"; value: agent_v1_PtyData } | { case: "ptyExited"; value: agent_v1_PtyExited } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PtyEvent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PtyEvent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PtyEvent;
  static equals(a: agent_v1_PtyEvent | MessageInit<agent_v1_PtyEvent> | undefined, b: agent_v1_PtyEvent | MessageInit<agent_v1_PtyEvent> | undefined): boolean;
}

/** agent.v1.PtyExited; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_PtyExited extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PtyExited>);
  static readonly typeName: "agent.v1.PtyExited";
  exitCode: number;
  signal?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PtyExited;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PtyExited;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PtyExited;
  static equals(a: agent_v1_PtyExited | MessageInit<agent_v1_PtyExited> | undefined, b: agent_v1_PtyExited | MessageInit<agent_v1_PtyExited> | undefined): boolean;
}

/** agent.v1.PtyInfo; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_PtyInfo extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_PtyInfo>);
  static readonly typeName: "agent.v1.PtyInfo";
  ptyId: string;
  shell: string;
  cwd: string;
  cols: number;
  rows: number;
  pid: number;
  processArgs: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_PtyInfo;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_PtyInfo;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_PtyInfo;
  static equals(a: agent_v1_PtyInfo | MessageInit<agent_v1_PtyInfo> | undefined, b: agent_v1_PtyInfo | MessageInit<agent_v1_PtyInfo> | undefined): boolean;
}

/** agent.v1.Range; source: ../proto/dist/generated/agent/v1/utils_pb.js */
export declare class agent_v1_Range extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_Range>);
  static readonly typeName: "agent.v1.Range";
  start?: agent_v1_Position;
  end?: agent_v1_Position;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_Range;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_Range;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_Range;
  static equals(a: agent_v1_Range | MessageInit<agent_v1_Range> | undefined, b: agent_v1_Range | MessageInit<agent_v1_Range> | undefined): boolean;
}

/** agent.v1.ReadArgs; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadArgs>);
  static readonly typeName: "agent.v1.ReadArgs";
  path: string;
  toolCallId: string;
  offset?: number;
  limit?: number;
  encodingHint?: string;
  digestOnly?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadArgs;
  static equals(a: agent_v1_ReadArgs | MessageInit<agent_v1_ReadArgs> | undefined, b: agent_v1_ReadArgs | MessageInit<agent_v1_ReadArgs> | undefined): boolean;
}

/** agent.v1.ReadBinaryFileRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReadBinaryFileRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadBinaryFileRequest>);
  static readonly typeName: "agent.v1.ReadBinaryFileRequest";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadBinaryFileRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadBinaryFileRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadBinaryFileRequest;
  static equals(a: agent_v1_ReadBinaryFileRequest | MessageInit<agent_v1_ReadBinaryFileRequest> | undefined, b: agent_v1_ReadBinaryFileRequest | MessageInit<agent_v1_ReadBinaryFileRequest> | undefined): boolean;
}

/** agent.v1.ReadBinaryFileResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReadBinaryFileResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadBinaryFileResponse>);
  static readonly typeName: "agent.v1.ReadBinaryFileResponse";
  content: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadBinaryFileResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadBinaryFileResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadBinaryFileResponse;
  static equals(a: agent_v1_ReadBinaryFileResponse | MessageInit<agent_v1_ReadBinaryFileResponse> | undefined, b: agent_v1_ReadBinaryFileResponse | MessageInit<agent_v1_ReadBinaryFileResponse> | undefined): boolean;
}

/** agent.v1.ReadError; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadError>);
  static readonly typeName: "agent.v1.ReadError";
  path: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadError;
  static equals(a: agent_v1_ReadError | MessageInit<agent_v1_ReadError> | undefined, b: agent_v1_ReadError | MessageInit<agent_v1_ReadError> | undefined): boolean;
}

/** agent.v1.ReadFileComplete; source: ./src/server.ts */
export declare class agent_v1_ReadFileComplete extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadFileComplete>);
  static readonly typeName: "agent.v1.ReadFileComplete";
  size: bigint;
  sha256: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadFileComplete;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadFileComplete;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadFileComplete;
  static equals(a: agent_v1_ReadFileComplete | MessageInit<agent_v1_ReadFileComplete> | undefined, b: agent_v1_ReadFileComplete | MessageInit<agent_v1_ReadFileComplete> | undefined): boolean;
}

/** agent.v1.ReadFileHeader; source: ./src/server.ts */
export declare class agent_v1_ReadFileHeader extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadFileHeader>);
  static readonly typeName: "agent.v1.ReadFileHeader";
  size: bigint;
  realPath: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadFileHeader;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadFileHeader;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadFileHeader;
  static equals(a: agent_v1_ReadFileHeader | MessageInit<agent_v1_ReadFileHeader> | undefined, b: agent_v1_ReadFileHeader | MessageInit<agent_v1_ReadFileHeader> | undefined): boolean;
}

/** agent.v1.ReadFileNotFound; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadFileNotFound extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadFileNotFound>);
  static readonly typeName: "agent.v1.ReadFileNotFound";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadFileNotFound;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadFileNotFound;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadFileNotFound;
  static equals(a: agent_v1_ReadFileNotFound | MessageInit<agent_v1_ReadFileNotFound> | undefined, b: agent_v1_ReadFileNotFound | MessageInit<agent_v1_ReadFileNotFound> | undefined): boolean;
}

/** agent.v1.ReadFileRequest; source: ./src/server.ts */
export declare class agent_v1_ReadFileRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadFileRequest>);
  static readonly typeName: "agent.v1.ReadFileRequest";
  path: string;
  maxBytes: bigint;
  offset: bigint;
  length: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadFileRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadFileRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadFileRequest;
  static equals(a: agent_v1_ReadFileRequest | MessageInit<agent_v1_ReadFileRequest> | undefined, b: agent_v1_ReadFileRequest | MessageInit<agent_v1_ReadFileRequest> | undefined): boolean;
}

/** agent.v1.ReadFileResponse; source: ./src/server.ts */
export declare class agent_v1_ReadFileResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadFileResponse>);
  static readonly typeName: "agent.v1.ReadFileResponse";
  payload: { case: "header"; value: agent_v1_ReadFileHeader } | { case: "chunk"; value: Uint8Array } | { case: "complete"; value: agent_v1_ReadFileComplete } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadFileResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadFileResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadFileResponse;
  static equals(a: agent_v1_ReadFileResponse | MessageInit<agent_v1_ReadFileResponse> | undefined, b: agent_v1_ReadFileResponse | MessageInit<agent_v1_ReadFileResponse> | undefined): boolean;
}

/** agent.v1.ReadInvalidFile; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadInvalidFile extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadInvalidFile>);
  static readonly typeName: "agent.v1.ReadInvalidFile";
  path: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadInvalidFile;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadInvalidFile;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadInvalidFile;
  static equals(a: agent_v1_ReadInvalidFile | MessageInit<agent_v1_ReadInvalidFile> | undefined, b: agent_v1_ReadInvalidFile | MessageInit<agent_v1_ReadInvalidFile> | undefined): boolean;
}

/** agent.v1.ReadMcpResourceError; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ReadMcpResourceError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadMcpResourceError>);
  static readonly typeName: "agent.v1.ReadMcpResourceError";
  uri: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadMcpResourceError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadMcpResourceError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadMcpResourceError;
  static equals(a: agent_v1_ReadMcpResourceError | MessageInit<agent_v1_ReadMcpResourceError> | undefined, b: agent_v1_ReadMcpResourceError | MessageInit<agent_v1_ReadMcpResourceError> | undefined): boolean;
}

/** agent.v1.ReadMcpResourceExecArgs; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ReadMcpResourceExecArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadMcpResourceExecArgs>);
  static readonly typeName: "agent.v1.ReadMcpResourceExecArgs";
  server: string;
  uri: string;
  downloadPath?: string;
  toolCallId: string;
  smartModeApproval?: agent_v1_SmartModeApproval;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadMcpResourceExecArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadMcpResourceExecArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadMcpResourceExecArgs;
  static equals(a: agent_v1_ReadMcpResourceExecArgs | MessageInit<agent_v1_ReadMcpResourceExecArgs> | undefined, b: agent_v1_ReadMcpResourceExecArgs | MessageInit<agent_v1_ReadMcpResourceExecArgs> | undefined): boolean;
}

/** agent.v1.ReadMcpResourceExecResult; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ReadMcpResourceExecResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadMcpResourceExecResult>);
  static readonly typeName: "agent.v1.ReadMcpResourceExecResult";
  result: { case: "success"; value: agent_v1_ReadMcpResourceSuccess } | { case: "error"; value: agent_v1_ReadMcpResourceError } | { case: "rejected"; value: agent_v1_ReadMcpResourceRejected } | { case: "notFound"; value: agent_v1_ReadMcpResourceNotFound } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadMcpResourceExecResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadMcpResourceExecResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadMcpResourceExecResult;
  static equals(a: agent_v1_ReadMcpResourceExecResult | MessageInit<agent_v1_ReadMcpResourceExecResult> | undefined, b: agent_v1_ReadMcpResourceExecResult | MessageInit<agent_v1_ReadMcpResourceExecResult> | undefined): boolean;
}

/** agent.v1.ReadMcpResourceNotFound; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ReadMcpResourceNotFound extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadMcpResourceNotFound>);
  static readonly typeName: "agent.v1.ReadMcpResourceNotFound";
  uri: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadMcpResourceNotFound;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadMcpResourceNotFound;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadMcpResourceNotFound;
  static equals(a: agent_v1_ReadMcpResourceNotFound | MessageInit<agent_v1_ReadMcpResourceNotFound> | undefined, b: agent_v1_ReadMcpResourceNotFound | MessageInit<agent_v1_ReadMcpResourceNotFound> | undefined): boolean;
}

/** agent.v1.ReadMcpResourceRejected; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ReadMcpResourceRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadMcpResourceRejected>);
  static readonly typeName: "agent.v1.ReadMcpResourceRejected";
  uri: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadMcpResourceRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadMcpResourceRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadMcpResourceRejected;
  static equals(a: agent_v1_ReadMcpResourceRejected | MessageInit<agent_v1_ReadMcpResourceRejected> | undefined, b: agent_v1_ReadMcpResourceRejected | MessageInit<agent_v1_ReadMcpResourceRejected> | undefined): boolean;
}

/** agent.v1.ReadMcpResourceSuccess; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_ReadMcpResourceSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadMcpResourceSuccess>);
  static readonly typeName: "agent.v1.ReadMcpResourceSuccess";
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  annotations: Record<string, string>;
  downloadPath?: string;
  outputLocation?: agent_v1_OutputLocation;
  metaJson?: string;
  content: { case: "text"; value: string } | { case: "blob"; value: Uint8Array } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadMcpResourceSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadMcpResourceSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadMcpResourceSuccess;
  static equals(a: agent_v1_ReadMcpResourceSuccess | MessageInit<agent_v1_ReadMcpResourceSuccess> | undefined, b: agent_v1_ReadMcpResourceSuccess | MessageInit<agent_v1_ReadMcpResourceSuccess> | undefined): boolean;
}

/** agent.v1.ReadPermissionDenied; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadPermissionDenied extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadPermissionDenied>);
  static readonly typeName: "agent.v1.ReadPermissionDenied";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadPermissionDenied;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadPermissionDenied;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadPermissionDenied;
  static equals(a: agent_v1_ReadPermissionDenied | MessageInit<agent_v1_ReadPermissionDenied> | undefined, b: agent_v1_ReadPermissionDenied | MessageInit<agent_v1_ReadPermissionDenied> | undefined): boolean;
}

/** agent.v1.ReadRejected; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadRejected>);
  static readonly typeName: "agent.v1.ReadRejected";
  path: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadRejected;
  static equals(a: agent_v1_ReadRejected | MessageInit<agent_v1_ReadRejected> | undefined, b: agent_v1_ReadRejected | MessageInit<agent_v1_ReadRejected> | undefined): boolean;
}

/** agent.v1.ReadResult; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadResult>);
  static readonly typeName: "agent.v1.ReadResult";
  result: { case: "success"; value: agent_v1_ReadSuccess } | { case: "error"; value: agent_v1_ReadError } | { case: "rejected"; value: agent_v1_ReadRejected } | { case: "fileNotFound"; value: agent_v1_ReadFileNotFound } | { case: "permissionDenied"; value: agent_v1_ReadPermissionDenied } | { case: "invalidFile"; value: agent_v1_ReadInvalidFile } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadResult;
  static equals(a: agent_v1_ReadResult | MessageInit<agent_v1_ReadResult> | undefined, b: agent_v1_ReadResult | MessageInit<agent_v1_ReadResult> | undefined): boolean;
}

/** agent.v1.ReadSuccess; source: ../proto/dist/generated/agent/v1/read_exec_pb.js */
export declare class agent_v1_ReadSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadSuccess>);
  static readonly typeName: "agent.v1.ReadSuccess";
  path: string;
  totalLines: number;
  fileSize: bigint;
  truncated: boolean;
  outputBlobId?: Uint8Array;
  rangeApplied: boolean;
  sha256?: string;
  sizeBytes?: bigint;
  output: { case: "content"; value: string } | { case: "data"; value: Uint8Array } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadSuccess;
  static equals(a: agent_v1_ReadSuccess | MessageInit<agent_v1_ReadSuccess> | undefined, b: agent_v1_ReadSuccess | MessageInit<agent_v1_ReadSuccess> | undefined): boolean;
}

/** agent.v1.ReadTextFileRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReadTextFileRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadTextFileRequest>);
  static readonly typeName: "agent.v1.ReadTextFileRequest";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadTextFileRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadTextFileRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadTextFileRequest;
  static equals(a: agent_v1_ReadTextFileRequest | MessageInit<agent_v1_ReadTextFileRequest> | undefined, b: agent_v1_ReadTextFileRequest | MessageInit<agent_v1_ReadTextFileRequest> | undefined): boolean;
}

/** agent.v1.ReadTextFileResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReadTextFileResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReadTextFileResponse>);
  static readonly typeName: "agent.v1.ReadTextFileResponse";
  content: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReadTextFileResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReadTextFileResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReadTextFileResponse;
  static equals(a: agent_v1_ReadTextFileResponse | MessageInit<agent_v1_ReadTextFileResponse> | undefined, b: agent_v1_ReadTextFileResponse | MessageInit<agent_v1_ReadTextFileResponse> | undefined): boolean;
}

/** agent.v1.RecentAgent; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_RecentAgent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecentAgent>);
  static readonly typeName: "agent.v1.RecentAgent";
  name: string;
  path: string;
  overview?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecentAgent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecentAgent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecentAgent;
  static equals(a: agent_v1_RecentAgent | MessageInit<agent_v1_RecentAgent> | undefined, b: agent_v1_RecentAgent | MessageInit<agent_v1_RecentAgent> | undefined): boolean;
}

/** agent.v1.RecentAgentsContext; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_RecentAgentsContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecentAgentsContext>);
  static readonly typeName: "agent.v1.RecentAgentsContext";
  recentAgents: agent_v1_RecentAgent[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecentAgentsContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecentAgentsContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecentAgentsContext;
  static equals(a: agent_v1_RecentAgentsContext | MessageInit<agent_v1_RecentAgentsContext> | undefined, b: agent_v1_RecentAgentsContext | MessageInit<agent_v1_RecentAgentsContext> | undefined): boolean;
}

/** agent.v1.RecentlyAddedPlugin; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RecentlyAddedPlugin extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecentlyAddedPlugin>);
  static readonly typeName: "agent.v1.RecentlyAddedPlugin";
  displayName: string;
  description: string;
  skills: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  subagents: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  hooks: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  rules: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  commands: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor[];
  mcpServers: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecentlyAddedPlugin;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecentlyAddedPlugin;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecentlyAddedPlugin;
  static equals(a: agent_v1_RecentlyAddedPlugin | MessageInit<agent_v1_RecentlyAddedPlugin> | undefined, b: agent_v1_RecentlyAddedPlugin | MessageInit<agent_v1_RecentlyAddedPlugin> | undefined): boolean;
}

/** agent.v1.RecentlyAddedPlugin.CapabilityDescriptor; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RecentlyAddedPlugin_CapabilityDescriptor extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecentlyAddedPlugin_CapabilityDescriptor>);
  static readonly typeName: "agent.v1.RecentlyAddedPlugin.CapabilityDescriptor";
  name: string;
  description: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecentlyAddedPlugin_CapabilityDescriptor;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecentlyAddedPlugin_CapabilityDescriptor;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecentlyAddedPlugin_CapabilityDescriptor;
  static equals(a: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor | MessageInit<agent_v1_RecentlyAddedPlugin_CapabilityDescriptor> | undefined, b: agent_v1_RecentlyAddedPlugin_CapabilityDescriptor | MessageInit<agent_v1_RecentlyAddedPlugin_CapabilityDescriptor> | undefined): boolean;
}

/** agent.v1.RecordingMode; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare enum agent_v1_RecordingMode {
  "UNSPECIFIED" = 0,
  "START_RECORDING" = 1,
  "SAVE_RECORDING" = 2,
  "DISCARD_RECORDING" = 3,
}

/** agent.v1.RecordScreenArgs; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare class agent_v1_RecordScreenArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecordScreenArgs>);
  static readonly typeName: "agent.v1.RecordScreenArgs";
  mode: agent_v1_RecordingMode;
  toolCallId: string;
  saveAsFilename?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecordScreenArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecordScreenArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecordScreenArgs;
  static equals(a: agent_v1_RecordScreenArgs | MessageInit<agent_v1_RecordScreenArgs> | undefined, b: agent_v1_RecordScreenArgs | MessageInit<agent_v1_RecordScreenArgs> | undefined): boolean;
}

/** agent.v1.RecordScreenDiscardSuccess; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare class agent_v1_RecordScreenDiscardSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecordScreenDiscardSuccess>);
  static readonly typeName: "agent.v1.RecordScreenDiscardSuccess";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecordScreenDiscardSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecordScreenDiscardSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecordScreenDiscardSuccess;
  static equals(a: agent_v1_RecordScreenDiscardSuccess | MessageInit<agent_v1_RecordScreenDiscardSuccess> | undefined, b: agent_v1_RecordScreenDiscardSuccess | MessageInit<agent_v1_RecordScreenDiscardSuccess> | undefined): boolean;
}

/** agent.v1.RecordScreenFailure; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare class agent_v1_RecordScreenFailure extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecordScreenFailure>);
  static readonly typeName: "agent.v1.RecordScreenFailure";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecordScreenFailure;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecordScreenFailure;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecordScreenFailure;
  static equals(a: agent_v1_RecordScreenFailure | MessageInit<agent_v1_RecordScreenFailure> | undefined, b: agent_v1_RecordScreenFailure | MessageInit<agent_v1_RecordScreenFailure> | undefined): boolean;
}

/** agent.v1.RecordScreenResult; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare class agent_v1_RecordScreenResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecordScreenResult>);
  static readonly typeName: "agent.v1.RecordScreenResult";
  result: { case: "startSuccess"; value: agent_v1_RecordScreenStartSuccess } | { case: "saveSuccess"; value: agent_v1_RecordScreenSaveSuccess } | { case: "discardSuccess"; value: agent_v1_RecordScreenDiscardSuccess } | { case: "failure"; value: agent_v1_RecordScreenFailure } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecordScreenResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecordScreenResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecordScreenResult;
  static equals(a: agent_v1_RecordScreenResult | MessageInit<agent_v1_RecordScreenResult> | undefined, b: agent_v1_RecordScreenResult | MessageInit<agent_v1_RecordScreenResult> | undefined): boolean;
}

/** agent.v1.RecordScreenSaveSuccess; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare class agent_v1_RecordScreenSaveSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecordScreenSaveSuccess>);
  static readonly typeName: "agent.v1.RecordScreenSaveSuccess";
  path: string;
  recordingDurationMs: bigint;
  requestedFilePathRejectedReason?: agent_v1_RequestedFilePathRejectedReason;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecordScreenSaveSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecordScreenSaveSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecordScreenSaveSuccess;
  static equals(a: agent_v1_RecordScreenSaveSuccess | MessageInit<agent_v1_RecordScreenSaveSuccess> | undefined, b: agent_v1_RecordScreenSaveSuccess | MessageInit<agent_v1_RecordScreenSaveSuccess> | undefined): boolean;
}

/** agent.v1.RecordScreenStartSuccess; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare class agent_v1_RecordScreenStartSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RecordScreenStartSuccess>);
  static readonly typeName: "agent.v1.RecordScreenStartSuccess";
  wasPriorRecordingCancelled: boolean;
  wasSaveAsFilenameIgnored: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RecordScreenStartSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RecordScreenStartSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RecordScreenStartSuccess;
  static equals(a: agent_v1_RecordScreenStartSuccess | MessageInit<agent_v1_RecordScreenStartSuccess> | undefined, b: agent_v1_RecordScreenStartSuccess | MessageInit<agent_v1_RecordScreenStartSuccess> | undefined): boolean;
}

/** agent.v1.RefreshGithubAccessTokenRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_RefreshGithubAccessTokenRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RefreshGithubAccessTokenRequest>);
  static readonly typeName: "agent.v1.RefreshGithubAccessTokenRequest";
  githubAccessToken: string;
  hostname: string;
  repoUrl?: string;
  cloneUsername?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RefreshGithubAccessTokenRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RefreshGithubAccessTokenRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RefreshGithubAccessTokenRequest;
  static equals(a: agent_v1_RefreshGithubAccessTokenRequest | MessageInit<agent_v1_RefreshGithubAccessTokenRequest> | undefined, b: agent_v1_RefreshGithubAccessTokenRequest | MessageInit<agent_v1_RefreshGithubAccessTokenRequest> | undefined): boolean;
}

/** agent.v1.RefreshGithubAccessTokenResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_RefreshGithubAccessTokenResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RefreshGithubAccessTokenResponse>);
  static readonly typeName: "agent.v1.RefreshGithubAccessTokenResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RefreshGithubAccessTokenResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RefreshGithubAccessTokenResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RefreshGithubAccessTokenResponse;
  static equals(a: agent_v1_RefreshGithubAccessTokenResponse | MessageInit<agent_v1_RefreshGithubAccessTokenResponse> | undefined, b: agent_v1_RefreshGithubAccessTokenResponse | MessageInit<agent_v1_RefreshGithubAccessTokenResponse> | undefined): boolean;
}

/** agent.v1.ReloadAgentSkillsRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReloadAgentSkillsRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReloadAgentSkillsRequest>);
  static readonly typeName: "agent.v1.ReloadAgentSkillsRequest";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReloadAgentSkillsRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReloadAgentSkillsRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReloadAgentSkillsRequest;
  static equals(a: agent_v1_ReloadAgentSkillsRequest | MessageInit<agent_v1_ReloadAgentSkillsRequest> | undefined, b: agent_v1_ReloadAgentSkillsRequest | MessageInit<agent_v1_ReloadAgentSkillsRequest> | undefined): boolean;
}

/** agent.v1.ReloadAgentSkillsResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReloadAgentSkillsResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReloadAgentSkillsResponse>);
  static readonly typeName: "agent.v1.ReloadAgentSkillsResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReloadAgentSkillsResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReloadAgentSkillsResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReloadAgentSkillsResponse;
  static equals(a: agent_v1_ReloadAgentSkillsResponse | MessageInit<agent_v1_ReloadAgentSkillsResponse> | undefined, b: agent_v1_ReloadAgentSkillsResponse | MessageInit<agent_v1_ReloadAgentSkillsResponse> | undefined): boolean;
}

/** agent.v1.ReloadPluginsRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReloadPluginsRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReloadPluginsRequest>);
  static readonly typeName: "agent.v1.ReloadPluginsRequest";
  reloadTargets: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReloadPluginsRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReloadPluginsRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReloadPluginsRequest;
  static equals(a: agent_v1_ReloadPluginsRequest | MessageInit<agent_v1_ReloadPluginsRequest> | undefined, b: agent_v1_ReloadPluginsRequest | MessageInit<agent_v1_ReloadPluginsRequest> | undefined): boolean;
}

/** agent.v1.ReloadPluginsResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ReloadPluginsResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ReloadPluginsResponse>);
  static readonly typeName: "agent.v1.ReloadPluginsResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ReloadPluginsResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ReloadPluginsResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ReloadPluginsResponse;
  static equals(a: agent_v1_ReloadPluginsResponse | MessageInit<agent_v1_ReloadPluginsResponse> | undefined, b: agent_v1_ReloadPluginsResponse | MessageInit<agent_v1_ReloadPluginsResponse> | undefined): boolean;
}

/** agent.v1.RepositoryIndexingInfo; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RepositoryIndexingInfo extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RepositoryIndexingInfo>);
  static readonly typeName: "agent.v1.RepositoryIndexingInfo";
  relativeWorkspacePath: string;
  remoteUrls: string[];
  remoteNames: string[];
  repoName: string;
  repoOwner: string;
  isTracked: boolean;
  isLocal: boolean;
  orthogonalTransformSeed?: number;
  workspaceUri: string;
  pathEncryptionKey: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RepositoryIndexingInfo;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RepositoryIndexingInfo;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RepositoryIndexingInfo;
  static equals(a: agent_v1_RepositoryIndexingInfo | MessageInit<agent_v1_RepositoryIndexingInfo> | undefined, b: agent_v1_RepositoryIndexingInfo | MessageInit<agent_v1_RepositoryIndexingInfo> | undefined): boolean;
}

/** agent.v1.RequestContext; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RequestContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestContext>);
  static readonly typeName: "agent.v1.RequestContext";
  rules: agent_v1_CursorRule[];
  env?: agent_v1_RequestContextEnv;
  repositoryInfo: agent_v1_RepositoryIndexingInfo[];
  tools: agent_v1_McpToolDefinition[];
  conversationNotesListing?: string;
  sharedNotesListing?: string;
  gitRepos: agent_v1_GitRepoInfo[];
  projectLayouts: agent_v1_LsDirectoryTreeNode[];
  mcpInstructions: agent_v1_McpInstructions[];
  debugModeConfig?: agent_v1_DebugModeConfig;
  cloudRule?: string;
  webSearchEnabled?: boolean;
  skillOptions?: agent_v1_SkillOptions;
  repositoryInfoShouldQueryProd?: boolean;
  fileContents: Record<string, string>;
  userIntentSummary?: string;
  customSubagents: agent_v1_CustomSubagent[];
  mcpFileSystemOptions?: agent_v1_McpFileSystemOptions;
  webFetchEnabled?: boolean;
  hooksAdditionalContext?: string;
  commitAttributionMessage?: string;
  prAttributionMessage?: string;
  hooksConfig?: agent_v1_HooksConfigInfo;
  agentSkills: agent_v1_AgentSkill[];
  precomputedHumanChanges: agent_v1_PrecomputedHumanChange[];
  recentlyAddedPlugin?: agent_v1_RecentlyAddedPlugin;
  supportsMcpAuth?: boolean;
  gitRepoInfoComplete?: boolean;
  mcpMetaToolOptions?: agent_v1_McpMetaToolOptions;
  readLintsEnabled?: boolean;
  mcpInfoComplete?: boolean;
  nonFileRules: agent_v1_CursorRule[];
  matchedInstalledPlugin?: agent_v1_MatchedInstalledPlugin;
  rulesInfoComplete?: boolean;
  envInfoComplete?: boolean;
  repositoryInfoComplete?: boolean;
  customSubagentsInfoComplete?: boolean;
  agentSkillsInfoComplete?: boolean;
  mcpFileSystemInfoComplete?: boolean;
  gitStatusInfoComplete?: boolean;
  userPermissionsAutoRun?: agent_v1_PermissionsAutoRunInstructions;
  projectPermissionsAutoRun?: agent_v1_PermissionsAutoRunInstructions;
  adminPermissionsAutoRun?: agent_v1_PermissionsAutoRunInstructions;
  disabledTeamRules: string[];
  searchConversationsEnabled?: boolean;
  sendMessageEnabled?: boolean;
  adminCommandDenylist: string[];
  systemPromptOverride?: agent_v1_SystemPromptSpec;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestContext;
  static equals(a: agent_v1_RequestContext | MessageInit<agent_v1_RequestContext> | undefined, b: agent_v1_RequestContext | MessageInit<agent_v1_RequestContext> | undefined): boolean;
}

/** agent.v1.RequestContextArgs; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RequestContextArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestContextArgs>);
  static readonly typeName: "agent.v1.RequestContextArgs";
  notesSessionId?: string;
  workspaceId?: string;
  readOnlyPinnedTreeSha?: string;
  readOnlyPluginCacheRoot?: string;
  useCached?: boolean;
  waitForWorkspaceCache?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestContextArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestContextArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestContextArgs;
  static equals(a: agent_v1_RequestContextArgs | MessageInit<agent_v1_RequestContextArgs> | undefined, b: agent_v1_RequestContextArgs | MessageInit<agent_v1_RequestContextArgs> | undefined): boolean;
}

/** agent.v1.RequestContextEnv; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RequestContextEnv extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestContextEnv>);
  static readonly typeName: "agent.v1.RequestContextEnv";
  osVersion: string;
  workspacePaths: string[];
  shell: string;
  sandboxEnabled: boolean;
  terminalsFolder: string;
  agentSharedNotesFolder: string;
  agentConversationNotesFolder: string;
  timeZone: string;
  projectFolder: string;
  agentTranscriptsFolder: string;
  artifactsFolder?: string;
  sandboxSupported?: boolean;
  sandboxNetworkHasDefaults?: boolean;
  sandboxNetworkExplicitAllowlist: string[];
  secretRedactionEnabled?: boolean;
  computerUseSupported?: boolean;
  isWorkingDirHomeDir?: boolean;
  processWorkingDirectory?: string;
  smartModeClassifierAutoModeEnabled?: boolean;
  devForceNextSmartModeClassifierBlockToken?: string;
  devDelayNextSmartModeClassifierToken?: string;
  mountedAgentStores: agent_v1_MountedAgentStore[];
  userAgentStoreWebContext?: agent_v1_UserAgentStoreWebContext;
  devMockPromptTime?: google_protobuf_Timestamp;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestContextEnv;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestContextEnv;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestContextEnv;
  static equals(a: agent_v1_RequestContextEnv | MessageInit<agent_v1_RequestContextEnv> | undefined, b: agent_v1_RequestContextEnv | MessageInit<agent_v1_RequestContextEnv> | undefined): boolean;
}

/** agent.v1.RequestContextError; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RequestContextError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestContextError>);
  static readonly typeName: "agent.v1.RequestContextError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestContextError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestContextError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestContextError;
  static equals(a: agent_v1_RequestContextError | MessageInit<agent_v1_RequestContextError> | undefined, b: agent_v1_RequestContextError | MessageInit<agent_v1_RequestContextError> | undefined): boolean;
}

/** agent.v1.RequestContextRejected; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RequestContextRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestContextRejected>);
  static readonly typeName: "agent.v1.RequestContextRejected";
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestContextRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestContextRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestContextRejected;
  static equals(a: agent_v1_RequestContextRejected | MessageInit<agent_v1_RequestContextRejected> | undefined, b: agent_v1_RequestContextRejected | MessageInit<agent_v1_RequestContextRejected> | undefined): boolean;
}

/** agent.v1.RequestContextResult; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RequestContextResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestContextResult>);
  static readonly typeName: "agent.v1.RequestContextResult";
  result: { case: "success"; value: agent_v1_RequestContextSuccess } | { case: "error"; value: agent_v1_RequestContextError } | { case: "rejected"; value: agent_v1_RequestContextRejected } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestContextResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestContextResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestContextResult;
  static equals(a: agent_v1_RequestContextResult | MessageInit<agent_v1_RequestContextResult> | undefined, b: agent_v1_RequestContextResult | MessageInit<agent_v1_RequestContextResult> | undefined): boolean;
}

/** agent.v1.RequestContextSuccess; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_RequestContextSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestContextSuccess>);
  static readonly typeName: "agent.v1.RequestContextSuccess";
  requestContext?: agent_v1_RequestContext;
  servedFromDiskCache?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestContextSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestContextSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestContextSuccess;
  static equals(a: agent_v1_RequestContextSuccess | MessageInit<agent_v1_RequestContextSuccess> | undefined, b: agent_v1_RequestContextSuccess | MessageInit<agent_v1_RequestContextSuccess> | undefined): boolean;
}

/** agent.v1.RequestedFilePathRejectedReason; source: ../proto/dist/generated/agent/v1/record_screen_exec_pb.js */
export declare enum agent_v1_RequestedFilePathRejectedReason {
  "UNSPECIFIED" = 0,
  "SLASHES_NOT_ALLOWED" = 1,
}

/** agent.v1.RequestedModel.ModelParameterValue; source: ../proto/dist/generated/agent/v1/requested_model_pb.js */
export declare class agent_v1_RequestedModel_ModelParameterValue extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RequestedModel_ModelParameterValue>);
  static readonly typeName: "agent.v1.RequestedModel.ModelParameterValue";
  id: string;
  value: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RequestedModel_ModelParameterValue;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RequestedModel_ModelParameterValue;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RequestedModel_ModelParameterValue;
  static equals(a: agent_v1_RequestedModel_ModelParameterValue | MessageInit<agent_v1_RequestedModel_ModelParameterValue> | undefined, b: agent_v1_RequestedModel_ModelParameterValue | MessageInit<agent_v1_RequestedModel_ModelParameterValue> | undefined): boolean;
}

/** agent.v1.ResizePtyRequest; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_ResizePtyRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ResizePtyRequest>);
  static readonly typeName: "agent.v1.ResizePtyRequest";
  ptyId: string;
  cols: number;
  rows: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ResizePtyRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ResizePtyRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ResizePtyRequest;
  static equals(a: agent_v1_ResizePtyRequest | MessageInit<agent_v1_ResizePtyRequest> | undefined, b: agent_v1_ResizePtyRequest | MessageInit<agent_v1_ResizePtyRequest> | undefined): boolean;
}

/** agent.v1.ResizePtyResponse; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_ResizePtyResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ResizePtyResponse>);
  static readonly typeName: "agent.v1.ResizePtyResponse";
  success: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ResizePtyResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ResizePtyResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ResizePtyResponse;
  static equals(a: agent_v1_ResizePtyResponse | MessageInit<agent_v1_ResizePtyResponse> | undefined, b: agent_v1_ResizePtyResponse | MessageInit<agent_v1_ResizePtyResponse> | undefined): boolean;
}

/** agent.v1.ResourceLimits; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ResourceLimits extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ResourceLimits>);
  static readonly typeName: "agent.v1.ResourceLimits";
  scope: agent_v1_ResourceScope;
  memoryLimitBytes: bigint;
  cpuLimitMcores: number;
  diskLimitBytes: bigint;
  workspacePath: string;
  displayLabel?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ResourceLimits;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ResourceLimits;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ResourceLimits;
  static equals(a: agent_v1_ResourceLimits | MessageInit<agent_v1_ResourceLimits> | undefined, b: agent_v1_ResourceLimits | MessageInit<agent_v1_ResourceLimits> | undefined): boolean;
}

/** agent.v1.ResourcePressure; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_ResourcePressure {
  "UNSPECIFIED" = 0,
  "NONE" = 1,
  "HIGH" = 2,
}

/** agent.v1.ResourceSample; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ResourceSample extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ResourceSample>);
  static readonly typeName: "agent.v1.ResourceSample";
  sampledAtMs: bigint;
  memoryUsedBytes: bigint;
  memoryAvailableBytes: bigint;
  cpuUsedMcores: number;
  diskUsedBytes: bigint;
  pressure: agent_v1_ResourcePressure;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ResourceSample;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ResourceSample;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ResourceSample;
  static equals(a: agent_v1_ResourceSample | MessageInit<agent_v1_ResourceSample> | undefined, b: agent_v1_ResourceSample | MessageInit<agent_v1_ResourceSample> | undefined): boolean;
}

/** agent.v1.ResourceScope; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare enum agent_v1_ResourceScope {
  "UNSPECIFIED" = 0,
  "POD_VM" = 1,
  "CONTAINER" = 2,
  "HOST" = 3,
}

/** agent.v1.RestoreArtifactInstruction; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_RestoreArtifactInstruction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RestoreArtifactInstruction>);
  static readonly typeName: "agent.v1.RestoreArtifactInstruction";
  absolutePath: string;
  downloadUrl: string;
  updatedAtUnixMs: bigint;
  artifactRelativePath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RestoreArtifactInstruction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RestoreArtifactInstruction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RestoreArtifactInstruction;
  static equals(a: agent_v1_RestoreArtifactInstruction | MessageInit<agent_v1_RestoreArtifactInstruction> | undefined, b: agent_v1_RestoreArtifactInstruction | MessageInit<agent_v1_RestoreArtifactInstruction> | undefined): boolean;
}

/** agent.v1.RestoreArtifactResult; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_RestoreArtifactResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RestoreArtifactResult>);
  static readonly typeName: "agent.v1.RestoreArtifactResult";
  status: agent_v1_ArtifactRestoreStatus;
  errorMessage: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RestoreArtifactResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RestoreArtifactResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RestoreArtifactResult;
  static equals(a: agent_v1_RestoreArtifactResult | MessageInit<agent_v1_RestoreArtifactResult> | undefined, b: agent_v1_RestoreArtifactResult | MessageInit<agent_v1_RestoreArtifactResult> | undefined): boolean;
}

/** agent.v1.RestoreArtifactsRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_RestoreArtifactsRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RestoreArtifactsRequest>);
  static readonly typeName: "agent.v1.RestoreArtifactsRequest";
  artifacts: agent_v1_RestoreArtifactInstruction[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RestoreArtifactsRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RestoreArtifactsRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RestoreArtifactsRequest;
  static equals(a: agent_v1_RestoreArtifactsRequest | MessageInit<agent_v1_RestoreArtifactsRequest> | undefined, b: agent_v1_RestoreArtifactsRequest | MessageInit<agent_v1_RestoreArtifactsRequest> | undefined): boolean;
}

/** agent.v1.RestoreArtifactsResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_RestoreArtifactsResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RestoreArtifactsResponse>);
  static readonly typeName: "agent.v1.RestoreArtifactsResponse";
  results: agent_v1_RestoreArtifactResult[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RestoreArtifactsResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RestoreArtifactsResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RestoreArtifactsResponse;
  static equals(a: agent_v1_RestoreArtifactsResponse | MessageInit<agent_v1_RestoreArtifactsResponse> | undefined, b: agent_v1_RestoreArtifactsResponse | MessageInit<agent_v1_RestoreArtifactsResponse> | undefined): boolean;
}

/** agent.v1.RunScopedOverlay; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_RunScopedOverlay extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_RunScopedOverlay>);
  static readonly typeName: "agent.v1.RunScopedOverlay";
  runId: string;
  release: boolean;
  holder: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_RunScopedOverlay;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_RunScopedOverlay;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_RunScopedOverlay;
  static equals(a: agent_v1_RunScopedOverlay | MessageInit<agent_v1_RunScopedOverlay> | undefined, b: agent_v1_RunScopedOverlay | MessageInit<agent_v1_RunScopedOverlay> | undefined): boolean;
}

/** agent.v1.SandboxPolicy; source: ../proto/dist/generated/agent/v1/sandbox_pb.js */
export declare class agent_v1_SandboxPolicy extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SandboxPolicy>);
  static readonly typeName: "agent.v1.SandboxPolicy";
  type: agent_v1_SandboxPolicy_Type;
  networkAccess?: boolean;
  additionalReadwritePaths: string[];
  additionalReadonlyPaths: string[];
  debugOutputDir?: string;
  disableTmpWrite?: boolean;
  allowlistEscalated?: boolean;
  enableSharedBuildCache?: boolean;
  networkPolicy?: agent_v1_NetworkPolicy;
  networkPolicyStrict?: boolean;
  captureDenies?: boolean;
  skipStatsigDefaults?: boolean;
  readBoundary: agent_v1_SandboxPolicy_ReadBoundaryMode;
  additionalReadPaths: string[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SandboxPolicy;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SandboxPolicy;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SandboxPolicy;
  static equals(a: agent_v1_SandboxPolicy | MessageInit<agent_v1_SandboxPolicy> | undefined, b: agent_v1_SandboxPolicy | MessageInit<agent_v1_SandboxPolicy> | undefined): boolean;
}

/** agent.v1.SandboxPolicy.ReadBoundaryMode; source: ../proto/dist/generated/agent/v1/sandbox_pb.js */
export declare enum agent_v1_SandboxPolicy_ReadBoundaryMode {
  "UNSPECIFIED" = 0,
  "SYSTEM" = 1,
  "WORKSPACE" = 2,
}

/** agent.v1.SandboxPolicy.Type; source: ../proto/dist/generated/agent/v1/sandbox_pb.js */
export declare enum agent_v1_SandboxPolicy_Type {
  "UNSPECIFIED" = 0,
  "INSECURE_NONE" = 1,
  "WORKSPACE_READWRITE" = 2,
  "WORKSPACE_READONLY" = 3,
}

/** agent.v1.ScopedSecretValues; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_ScopedSecretValues extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ScopedSecretValues>);
  static readonly typeName: "agent.v1.ScopedSecretValues";
  values: Record<string, string>;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ScopedSecretValues;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ScopedSecretValues;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ScopedSecretValues;
  static equals(a: agent_v1_ScopedSecretValues | MessageInit<agent_v1_ScopedSecretValues> | undefined, b: agent_v1_ScopedSecretValues | MessageInit<agent_v1_ScopedSecretValues> | undefined): boolean;
}

/** agent.v1.ScreenshotAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ScreenshotAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ScreenshotAction>);
  static readonly typeName: "agent.v1.ScreenshotAction";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ScreenshotAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ScreenshotAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ScreenshotAction;
  static equals(a: agent_v1_ScreenshotAction | MessageInit<agent_v1_ScreenshotAction> | undefined, b: agent_v1_ScreenshotAction | MessageInit<agent_v1_ScreenshotAction> | undefined): boolean;
}

/** agent.v1.ScrollAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_ScrollAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ScrollAction>);
  static readonly typeName: "agent.v1.ScrollAction";
  coordinate?: agent_v1_Coordinate;
  direction: agent_v1_ScrollDirection;
  amount: number;
  modifierKeys?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ScrollAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ScrollAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ScrollAction;
  static equals(a: agent_v1_ScrollAction | MessageInit<agent_v1_ScrollAction> | undefined, b: agent_v1_ScrollAction | MessageInit<agent_v1_ScrollAction> | undefined): boolean;
}

/** agent.v1.ScrollDirection; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare enum agent_v1_ScrollDirection {
  "UNSPECIFIED" = 0,
  "UP" = 1,
  "DOWN" = 2,
  "LEFT" = 3,
  "RIGHT" = 4,
}

/** agent.v1.SelectedAgenticGitAction; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitAction>);
  static readonly typeName: "agent.v1.SelectedAgenticGitAction";
  branchContext?: agent_v1_SelectedGitBranchContext;
  pathToTemplateFile?: string;
  pathToTemplateDir?: string;
  params: { case: "commitParams"; value: agent_v1_SelectedAgenticGitActionCommitParams } | { case: "commitAndPushParams"; value: agent_v1_SelectedAgenticGitActionCommitParams } | { case: "pushParams"; value: agent_v1_SelectedAgenticGitActionPushParams } | { case: "createPrParams"; value: agent_v1_SelectedAgenticGitActionPushParams } | { case: "createPrWithChangesParams"; value: agent_v1_SelectedAgenticGitActionCommitParams } | { case: "fixMergeConflictsParams"; value: agent_v1_SelectedAgenticGitActionFixMergeConflictsParams } | { case: "babysitPrInCloudParams"; value: agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams } | { case: "applyLocallyParams"; value: agent_v1_SelectedAgenticGitActionPullLocallyParams } | { case: "checkoutBranchParams"; value: agent_v1_SelectedAgenticGitActionPullLocallyParams } | { case: "createBranchAndCommitParams"; value: agent_v1_SelectedAgenticGitActionCommitParams } | { case: "createBranchCommitAndPushParams"; value: agent_v1_SelectedAgenticGitActionCommitParams } | { case: "updateBranchParams"; value: agent_v1_SelectedAgenticGitActionUpdateBranchParams } | { case: "createBranchParams"; value: agent_v1_SelectedAgenticGitActionCreateBranchParams } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitAction;
  static equals(a: agent_v1_SelectedAgenticGitAction | MessageInit<agent_v1_SelectedAgenticGitAction> | undefined, b: agent_v1_SelectedAgenticGitAction | MessageInit<agent_v1_SelectedAgenticGitAction> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitActionBabysitPrInCloudParams; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams>);
  static readonly typeName: "agent.v1.SelectedAgenticGitActionBabysitPrInCloudParams";
  baseBranch?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams;
  static equals(a: agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams | MessageInit<agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams> | undefined, b: agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams | MessageInit<agent_v1_SelectedAgenticGitActionBabysitPrInCloudParams> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitActionCommitParams; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitActionCommitParams extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitActionCommitParams>);
  static readonly typeName: "agent.v1.SelectedAgenticGitActionCommitParams";
  filesToCommit: string[];
  filesToExcludeFromCommit: string[];
  shouldStageAllChanges: boolean;
  createPrDraft?: boolean;
  filesToCommitWithStatus: agent_v1_SelectedAgenticGitFileWithStatus[];
  filesToExcludeFromCommitWithStatus: agent_v1_SelectedAgenticGitFileWithStatus[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitActionCommitParams;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionCommitParams;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionCommitParams;
  static equals(a: agent_v1_SelectedAgenticGitActionCommitParams | MessageInit<agent_v1_SelectedAgenticGitActionCommitParams> | undefined, b: agent_v1_SelectedAgenticGitActionCommitParams | MessageInit<agent_v1_SelectedAgenticGitActionCommitParams> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitActionCreateBranchParams; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitActionCreateBranchParams extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitActionCreateBranchParams>);
  static readonly typeName: "agent.v1.SelectedAgenticGitActionCreateBranchParams";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitActionCreateBranchParams;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionCreateBranchParams;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionCreateBranchParams;
  static equals(a: agent_v1_SelectedAgenticGitActionCreateBranchParams | MessageInit<agent_v1_SelectedAgenticGitActionCreateBranchParams> | undefined, b: agent_v1_SelectedAgenticGitActionCreateBranchParams | MessageInit<agent_v1_SelectedAgenticGitActionCreateBranchParams> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitActionFixMergeConflictsParams; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitActionFixMergeConflictsParams extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitActionFixMergeConflictsParams>);
  static readonly typeName: "agent.v1.SelectedAgenticGitActionFixMergeConflictsParams";
  baseBranch?: string;
  prUrl?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitActionFixMergeConflictsParams;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionFixMergeConflictsParams;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionFixMergeConflictsParams;
  static equals(a: agent_v1_SelectedAgenticGitActionFixMergeConflictsParams | MessageInit<agent_v1_SelectedAgenticGitActionFixMergeConflictsParams> | undefined, b: agent_v1_SelectedAgenticGitActionFixMergeConflictsParams | MessageInit<agent_v1_SelectedAgenticGitActionFixMergeConflictsParams> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitActionPullLocallyParams; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitActionPullLocallyParams extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitActionPullLocallyParams>);
  static readonly typeName: "agent.v1.SelectedAgenticGitActionPullLocallyParams";
  remoteBranch: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitActionPullLocallyParams;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionPullLocallyParams;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionPullLocallyParams;
  static equals(a: agent_v1_SelectedAgenticGitActionPullLocallyParams | MessageInit<agent_v1_SelectedAgenticGitActionPullLocallyParams> | undefined, b: agent_v1_SelectedAgenticGitActionPullLocallyParams | MessageInit<agent_v1_SelectedAgenticGitActionPullLocallyParams> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitActionPushParams; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitActionPushParams extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitActionPushParams>);
  static readonly typeName: "agent.v1.SelectedAgenticGitActionPushParams";
  filesToPush: string[];
  createPrDraft?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitActionPushParams;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionPushParams;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionPushParams;
  static equals(a: agent_v1_SelectedAgenticGitActionPushParams | MessageInit<agent_v1_SelectedAgenticGitActionPushParams> | undefined, b: agent_v1_SelectedAgenticGitActionPushParams | MessageInit<agent_v1_SelectedAgenticGitActionPushParams> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitActionUpdateBranchParams; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitActionUpdateBranchParams extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitActionUpdateBranchParams>);
  static readonly typeName: "agent.v1.SelectedAgenticGitActionUpdateBranchParams";
  baseBranch?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitActionUpdateBranchParams;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionUpdateBranchParams;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitActionUpdateBranchParams;
  static equals(a: agent_v1_SelectedAgenticGitActionUpdateBranchParams | MessageInit<agent_v1_SelectedAgenticGitActionUpdateBranchParams> | undefined, b: agent_v1_SelectedAgenticGitActionUpdateBranchParams | MessageInit<agent_v1_SelectedAgenticGitActionUpdateBranchParams> | undefined): boolean;
}

/** agent.v1.SelectedAgenticGitFileWithStatus; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedAgenticGitFileWithStatus extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedAgenticGitFileWithStatus>);
  static readonly typeName: "agent.v1.SelectedAgenticGitFileWithStatus";
  path: string;
  status?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedAgenticGitFileWithStatus;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedAgenticGitFileWithStatus;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedAgenticGitFileWithStatus;
  static equals(a: agent_v1_SelectedAgenticGitFileWithStatus | MessageInit<agent_v1_SelectedAgenticGitFileWithStatus> | undefined, b: agent_v1_SelectedAgenticGitFileWithStatus | MessageInit<agent_v1_SelectedAgenticGitFileWithStatus> | undefined): boolean;
}

/** agent.v1.SelectedBrowser; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedBrowser extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedBrowser>);
  static readonly typeName: "agent.v1.SelectedBrowser";
  browserId: string;
  url: string;
  pageTitle?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedBrowser;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedBrowser;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedBrowser;
  static equals(a: agent_v1_SelectedBrowser | MessageInit<agent_v1_SelectedBrowser> | undefined, b: agent_v1_SelectedBrowser | MessageInit<agent_v1_SelectedBrowser> | undefined): boolean;
}

/** agent.v1.SelectedCodeSelection; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedCodeSelection extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedCodeSelection>);
  static readonly typeName: "agent.v1.SelectedCodeSelection";
  content: string;
  path: string;
  relativePath?: string;
  range?: agent_v1_Range;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedCodeSelection;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedCodeSelection;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedCodeSelection;
  static equals(a: agent_v1_SelectedCodeSelection | MessageInit<agent_v1_SelectedCodeSelection> | undefined, b: agent_v1_SelectedCodeSelection | MessageInit<agent_v1_SelectedCodeSelection> | undefined): boolean;
}

/** agent.v1.SelectedConsoleLog; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedConsoleLog extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedConsoleLog>);
  static readonly typeName: "agent.v1.SelectedConsoleLog";
  message: string;
  timestamp: number;
  level: string;
  clientName: string;
  sessionId: string;
  stackTrace?: agent_v1_StackTrace;
  objectDataJson?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedConsoleLog;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedConsoleLog;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedConsoleLog;
  static equals(a: agent_v1_SelectedConsoleLog | MessageInit<agent_v1_SelectedConsoleLog> | undefined, b: agent_v1_SelectedConsoleLog | MessageInit<agent_v1_SelectedConsoleLog> | undefined): boolean;
}

/** agent.v1.SelectedContext; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedContext>);
  static readonly typeName: "agent.v1.SelectedContext";
  selectedImages: agent_v1_SelectedImage[];
  invocationContext?: agent_v1_InvocationContext;
  extraContext: string[];
  extraContextEntries: agent_v1_ExtraContextEntry[];
  files: agent_v1_SelectedFile[];
  codeSelections: agent_v1_SelectedCodeSelection[];
  terminals: agent_v1_SelectedTerminal[];
  terminalSelections: agent_v1_SelectedTerminalSelection[];
  folders: agent_v1_SelectedFolder[];
  externalLinks: agent_v1_SelectedExternalLink[];
  cursorRules: agent_v1_SelectedCursorRule[];
  gitDiff?: agent_v1_SelectedGitDiff;
  gitDiffFromBranchToMain?: agent_v1_SelectedGitDiffFromBranchToMain;
  cursorCommands: agent_v1_SelectedCursorCommand[];
  documentations: agent_v1_SelectedDocumentation[];
  uiElements: agent_v1_SelectedUIElement[];
  consoleLogs: agent_v1_SelectedConsoleLog[];
  gitCommits: agent_v1_SelectedGitCommit[];
  pastChats: agent_v1_SelectedPastChat[];
  gitPrDiffSelections: agent_v1_SelectedGitPRDiffSelection[];
  selectedPullRequests: agent_v1_SelectedPullRequest[];
  selectedSubagents: agent_v1_SelectedSubagent[];
  selectedVideos: agent_v1_SelectedVideo[];
  selectedBrowsers: agent_v1_SelectedBrowser[];
  selectedDocuments: agent_v1_SelectedDocument[];
  selectedSkills: agent_v1_AgentSkill[];
  recentAgentsContext?: agent_v1_RecentAgentsContext;
  selectedAgenticGitAction?: agent_v1_SelectedAgenticGitAction;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedContext;
  static equals(a: agent_v1_SelectedContext | MessageInit<agent_v1_SelectedContext> | undefined, b: agent_v1_SelectedContext | MessageInit<agent_v1_SelectedContext> | undefined): boolean;
}

/** agent.v1.SelectedCursorCommand; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedCursorCommand extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedCursorCommand>);
  static readonly typeName: "agent.v1.SelectedCursorCommand";
  name: string;
  content: string;
  pluginCapability?: agent_v1_SelectedPluginCapabilityRef;
  fullPath?: string;
  displayName?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedCursorCommand;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedCursorCommand;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedCursorCommand;
  static equals(a: agent_v1_SelectedCursorCommand | MessageInit<agent_v1_SelectedCursorCommand> | undefined, b: agent_v1_SelectedCursorCommand | MessageInit<agent_v1_SelectedCursorCommand> | undefined): boolean;
}

/** agent.v1.SelectedCursorRule; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedCursorRule extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedCursorRule>);
  static readonly typeName: "agent.v1.SelectedCursorRule";
  rule?: agent_v1_CursorRule;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedCursorRule;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedCursorRule;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedCursorRule;
  static equals(a: agent_v1_SelectedCursorRule | MessageInit<agent_v1_SelectedCursorRule> | undefined, b: agent_v1_SelectedCursorRule | MessageInit<agent_v1_SelectedCursorRule> | undefined): boolean;
}

/** agent.v1.SelectedDocument; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedDocument extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedDocument>);
  static readonly typeName: "agent.v1.SelectedDocument";
  uuid: string;
  filename: string;
  mimeType: string;
  path: string;
  dataOrBlobId: { case: "blobId"; value: Uint8Array } | { case: "data"; value: Uint8Array } | { case: "blobIdWithData"; value: agent_v1_SelectedDocument_BlobIdWithData } | { case: "promptUploadRef"; value: agent_v1_PromptUploadRef } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedDocument;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedDocument;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedDocument;
  static equals(a: agent_v1_SelectedDocument | MessageInit<agent_v1_SelectedDocument> | undefined, b: agent_v1_SelectedDocument | MessageInit<agent_v1_SelectedDocument> | undefined): boolean;
}

/** agent.v1.SelectedDocument.BlobIdWithData; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedDocument_BlobIdWithData extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedDocument_BlobIdWithData>);
  static readonly typeName: "agent.v1.SelectedDocument.BlobIdWithData";
  blobId: Uint8Array;
  data: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedDocument_BlobIdWithData;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedDocument_BlobIdWithData;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedDocument_BlobIdWithData;
  static equals(a: agent_v1_SelectedDocument_BlobIdWithData | MessageInit<agent_v1_SelectedDocument_BlobIdWithData> | undefined, b: agent_v1_SelectedDocument_BlobIdWithData | MessageInit<agent_v1_SelectedDocument_BlobIdWithData> | undefined): boolean;
}

/** agent.v1.SelectedDocumentation; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedDocumentation extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedDocumentation>);
  static readonly typeName: "agent.v1.SelectedDocumentation";
  docId: string;
  name: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedDocumentation;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedDocumentation;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedDocumentation;
  static equals(a: agent_v1_SelectedDocumentation | MessageInit<agent_v1_SelectedDocumentation> | undefined, b: agent_v1_SelectedDocumentation | MessageInit<agent_v1_SelectedDocumentation> | undefined): boolean;
}

/** agent.v1.SelectedExternalLink; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedExternalLink extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedExternalLink>);
  static readonly typeName: "agent.v1.SelectedExternalLink";
  url: string;
  uuid: string;
  pdfContent?: string;
  isPdf?: boolean;
  filename?: string;
  blobId?: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedExternalLink;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedExternalLink;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedExternalLink;
  static equals(a: agent_v1_SelectedExternalLink | MessageInit<agent_v1_SelectedExternalLink> | undefined, b: agent_v1_SelectedExternalLink | MessageInit<agent_v1_SelectedExternalLink> | undefined): boolean;
}

/** agent.v1.SelectedFile; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedFile extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedFile>);
  static readonly typeName: "agent.v1.SelectedFile";
  content: string;
  path: string;
  relativePath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedFile;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedFile;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedFile;
  static equals(a: agent_v1_SelectedFile | MessageInit<agent_v1_SelectedFile> | undefined, b: agent_v1_SelectedFile | MessageInit<agent_v1_SelectedFile> | undefined): boolean;
}

/** agent.v1.SelectedFolder; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedFolder extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedFolder>);
  static readonly typeName: "agent.v1.SelectedFolder";
  path: string;
  relativePath?: string;
  directoryTree?: agent_v1_LsDirectoryTreeNode;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedFolder;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedFolder;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedFolder;
  static equals(a: agent_v1_SelectedFolder | MessageInit<agent_v1_SelectedFolder> | undefined, b: agent_v1_SelectedFolder | MessageInit<agent_v1_SelectedFolder> | undefined): boolean;
}

/** agent.v1.SelectedGitBranchContext; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedGitBranchContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedGitBranchContext>);
  static readonly typeName: "agent.v1.SelectedGitBranchContext";
  currentBranch?: string;
  baseBranch?: string;
  agentBranchPrefix?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedGitBranchContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedGitBranchContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedGitBranchContext;
  static equals(a: agent_v1_SelectedGitBranchContext | MessageInit<agent_v1_SelectedGitBranchContext> | undefined, b: agent_v1_SelectedGitBranchContext | MessageInit<agent_v1_SelectedGitBranchContext> | undefined): boolean;
}

/** agent.v1.SelectedGitCommit; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedGitCommit extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedGitCommit>);
  static readonly typeName: "agent.v1.SelectedGitCommit";
  sha: string;
  message: string;
  description?: string;
  diff: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedGitCommit;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedGitCommit;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedGitCommit;
  static equals(a: agent_v1_SelectedGitCommit | MessageInit<agent_v1_SelectedGitCommit> | undefined, b: agent_v1_SelectedGitCommit | MessageInit<agent_v1_SelectedGitCommit> | undefined): boolean;
}

/** agent.v1.SelectedGitDiff; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedGitDiff extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedGitDiff>);
  static readonly typeName: "agent.v1.SelectedGitDiff";
  content: string;
  fullContentLengthCharCount: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedGitDiff;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedGitDiff;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedGitDiff;
  static equals(a: agent_v1_SelectedGitDiff | MessageInit<agent_v1_SelectedGitDiff> | undefined, b: agent_v1_SelectedGitDiff | MessageInit<agent_v1_SelectedGitDiff> | undefined): boolean;
}

/** agent.v1.SelectedGitDiffFromBranchToMain; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedGitDiffFromBranchToMain extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedGitDiffFromBranchToMain>);
  static readonly typeName: "agent.v1.SelectedGitDiffFromBranchToMain";
  content: string;
  fullContentLengthCharCount: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedGitDiffFromBranchToMain;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedGitDiffFromBranchToMain;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedGitDiffFromBranchToMain;
  static equals(a: agent_v1_SelectedGitDiffFromBranchToMain | MessageInit<agent_v1_SelectedGitDiffFromBranchToMain> | undefined, b: agent_v1_SelectedGitDiffFromBranchToMain | MessageInit<agent_v1_SelectedGitDiffFromBranchToMain> | undefined): boolean;
}

/** agent.v1.SelectedGitPRDiffSelection; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedGitPRDiffSelection extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedGitPRDiffSelection>);
  static readonly typeName: "agent.v1.SelectedGitPRDiffSelection";
  prUrl: string;
  filePath: string;
  startLine: number;
  endLine: number;
  diffContent?: string;
  blobId?: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedGitPRDiffSelection;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedGitPRDiffSelection;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedGitPRDiffSelection;
  static equals(a: agent_v1_SelectedGitPRDiffSelection | MessageInit<agent_v1_SelectedGitPRDiffSelection> | undefined, b: agent_v1_SelectedGitPRDiffSelection | MessageInit<agent_v1_SelectedGitPRDiffSelection> | undefined): boolean;
}

/** agent.v1.SelectedImage; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedImage extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedImage>);
  static readonly typeName: "agent.v1.SelectedImage";
  uuid: string;
  path: string;
  dimension?: agent_v1_SelectedImage_Dimension;
  mimeType: string;
  dataOrBlobId: { case: "blobId"; value: Uint8Array } | { case: "data"; value: Uint8Array } | { case: "blobIdWithData"; value: agent_v1_SelectedImage_BlobIdWithData } | { case: "promptUploadRef"; value: agent_v1_PromptUploadRef } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedImage;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedImage;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedImage;
  static equals(a: agent_v1_SelectedImage | MessageInit<agent_v1_SelectedImage> | undefined, b: agent_v1_SelectedImage | MessageInit<agent_v1_SelectedImage> | undefined): boolean;
}

/** agent.v1.SelectedImage.BlobIdWithData; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedImage_BlobIdWithData extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedImage_BlobIdWithData>);
  static readonly typeName: "agent.v1.SelectedImage.BlobIdWithData";
  blobId: Uint8Array;
  data: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedImage_BlobIdWithData;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedImage_BlobIdWithData;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedImage_BlobIdWithData;
  static equals(a: agent_v1_SelectedImage_BlobIdWithData | MessageInit<agent_v1_SelectedImage_BlobIdWithData> | undefined, b: agent_v1_SelectedImage_BlobIdWithData | MessageInit<agent_v1_SelectedImage_BlobIdWithData> | undefined): boolean;
}

/** agent.v1.SelectedImage.Dimension; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedImage_Dimension extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedImage_Dimension>);
  static readonly typeName: "agent.v1.SelectedImage.Dimension";
  width: number;
  height: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedImage_Dimension;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedImage_Dimension;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedImage_Dimension;
  static equals(a: agent_v1_SelectedImage_Dimension | MessageInit<agent_v1_SelectedImage_Dimension> | undefined, b: agent_v1_SelectedImage_Dimension | MessageInit<agent_v1_SelectedImage_Dimension> | undefined): boolean;
}

/** agent.v1.SelectedPastChat; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedPastChat extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedPastChat>);
  static readonly typeName: "agent.v1.SelectedPastChat";
  agentId: string;
  name: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedPastChat;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedPastChat;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedPastChat;
  static equals(a: agent_v1_SelectedPastChat | MessageInit<agent_v1_SelectedPastChat> | undefined, b: agent_v1_SelectedPastChat | MessageInit<agent_v1_SelectedPastChat> | undefined): boolean;
}

/** agent.v1.SelectedPluginCapabilityRef; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedPluginCapabilityRef extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedPluginCapabilityRef>);
  static readonly typeName: "agent.v1.SelectedPluginCapabilityRef";
  pluginId: string;
  capabilityType: agent_v1_SelectedPluginCapabilityType;
  sourcePath: string;
  snapshotToken: string;
  resolvedCommitSha?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedPluginCapabilityRef;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedPluginCapabilityRef;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedPluginCapabilityRef;
  static equals(a: agent_v1_SelectedPluginCapabilityRef | MessageInit<agent_v1_SelectedPluginCapabilityRef> | undefined, b: agent_v1_SelectedPluginCapabilityRef | MessageInit<agent_v1_SelectedPluginCapabilityRef> | undefined): boolean;
}

/** agent.v1.SelectedPluginCapabilityType; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare enum agent_v1_SelectedPluginCapabilityType {
  "UNSPECIFIED" = 0,
  "COMMAND" = 1,
  "SKILL" = 2,
  "SUBAGENT" = 3,
}

/** agent.v1.SelectedPullRequest; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedPullRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedPullRequest>);
  static readonly typeName: "agent.v1.SelectedPullRequest";
  number: number;
  url: string;
  title?: string;
  folderPath: string;
  summaryJson?: string;
  description?: string;
  blobId?: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedPullRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedPullRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedPullRequest;
  static equals(a: agent_v1_SelectedPullRequest | MessageInit<agent_v1_SelectedPullRequest> | undefined, b: agent_v1_SelectedPullRequest | MessageInit<agent_v1_SelectedPullRequest> | undefined): boolean;
}

/** agent.v1.SelectedSubagent; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedSubagent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedSubagent>);
  static readonly typeName: "agent.v1.SelectedSubagent";
  name: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedSubagent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedSubagent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedSubagent;
  static equals(a: agent_v1_SelectedSubagent | MessageInit<agent_v1_SelectedSubagent> | undefined, b: agent_v1_SelectedSubagent | MessageInit<agent_v1_SelectedSubagent> | undefined): boolean;
}

/** agent.v1.SelectedTerminal; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedTerminal extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedTerminal>);
  static readonly typeName: "agent.v1.SelectedTerminal";
  content: string;
  title?: string;
  path?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedTerminal;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedTerminal;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedTerminal;
  static equals(a: agent_v1_SelectedTerminal | MessageInit<agent_v1_SelectedTerminal> | undefined, b: agent_v1_SelectedTerminal | MessageInit<agent_v1_SelectedTerminal> | undefined): boolean;
}

/** agent.v1.SelectedTerminalSelection; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedTerminalSelection extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedTerminalSelection>);
  static readonly typeName: "agent.v1.SelectedTerminalSelection";
  content: string;
  title?: string;
  path?: string;
  range?: agent_v1_Range;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedTerminalSelection;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedTerminalSelection;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedTerminalSelection;
  static equals(a: agent_v1_SelectedTerminalSelection | MessageInit<agent_v1_SelectedTerminalSelection> | undefined, b: agent_v1_SelectedTerminalSelection | MessageInit<agent_v1_SelectedTerminalSelection> | undefined): boolean;
}

/** agent.v1.SelectedUIElement; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedUIElement extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedUIElement>);
  static readonly typeName: "agent.v1.SelectedUIElement";
  element: string;
  xpath: string;
  textContent: string;
  extra: string;
  component?: string;
  componentPropsJson?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedUIElement;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedUIElement;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedUIElement;
  static equals(a: agent_v1_SelectedUIElement | MessageInit<agent_v1_SelectedUIElement> | undefined, b: agent_v1_SelectedUIElement | MessageInit<agent_v1_SelectedUIElement> | undefined): boolean;
}

/** agent.v1.SelectedVideo; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedVideo extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedVideo>);
  static readonly typeName: "agent.v1.SelectedVideo";
  uuid: string;
  path: string;
  fps?: number;
  mimeType: string;
  filename: string;
  materializeToFilesystem: boolean;
  dataOrBlobId: { case: "blobId"; value: Uint8Array } | { case: "data"; value: Uint8Array } | { case: "blobIdWithData"; value: agent_v1_SelectedVideo_BlobIdWithData } | { case: "signedUrl"; value: agent_v1_SelectedVideo_SignedUrl } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedVideo;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedVideo;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedVideo;
  static equals(a: agent_v1_SelectedVideo | MessageInit<agent_v1_SelectedVideo> | undefined, b: agent_v1_SelectedVideo | MessageInit<agent_v1_SelectedVideo> | undefined): boolean;
}

/** agent.v1.SelectedVideo.BlobIdWithData; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedVideo_BlobIdWithData extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedVideo_BlobIdWithData>);
  static readonly typeName: "agent.v1.SelectedVideo.BlobIdWithData";
  blobId: Uint8Array;
  data: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedVideo_BlobIdWithData;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedVideo_BlobIdWithData;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedVideo_BlobIdWithData;
  static equals(a: agent_v1_SelectedVideo_BlobIdWithData | MessageInit<agent_v1_SelectedVideo_BlobIdWithData> | undefined, b: agent_v1_SelectedVideo_BlobIdWithData | MessageInit<agent_v1_SelectedVideo_BlobIdWithData> | undefined): boolean;
}

/** agent.v1.SelectedVideo.SignedUrl; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SelectedVideo_SignedUrl extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SelectedVideo_SignedUrl>);
  static readonly typeName: "agent.v1.SelectedVideo.SignedUrl";
  url: string;
  key: string;
  expiresAtUnixMs: bigint;
  refreshAfterUnixMs: bigint;
  conversationId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SelectedVideo_SignedUrl;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SelectedVideo_SignedUrl;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SelectedVideo_SignedUrl;
  static equals(a: agent_v1_SelectedVideo_SignedUrl | MessageInit<agent_v1_SelectedVideo_SignedUrl> | undefined, b: agent_v1_SelectedVideo_SignedUrl | MessageInit<agent_v1_SelectedVideo_SignedUrl> | undefined): boolean;
}

/** agent.v1.SendInputRequest; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_SendInputRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SendInputRequest>);
  static readonly typeName: "agent.v1.SendInputRequest";
  ptyId: string;
  data: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SendInputRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SendInputRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SendInputRequest;
  static equals(a: agent_v1_SendInputRequest | MessageInit<agent_v1_SendInputRequest> | undefined, b: agent_v1_SendInputRequest | MessageInit<agent_v1_SendInputRequest> | undefined): boolean;
}

/** agent.v1.SendInputResponse; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_SendInputResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SendInputResponse>);
  static readonly typeName: "agent.v1.SendInputResponse";
  success: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SendInputResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SendInputResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SendInputResponse;
  static equals(a: agent_v1_SendInputResponse | MessageInit<agent_v1_SendInputResponse> | undefined, b: agent_v1_SendInputResponse | MessageInit<agent_v1_SendInputResponse> | undefined): boolean;
}

/** agent.v1.ShellAbortReason; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare enum agent_v1_ShellAbortReason {
  "UNSPECIFIED" = 0,
  "USER_ABORT" = 1,
  "TIMEOUT" = 2,
}

/** agent.v1.ShellAllowlistPrecheckArgs; source: ../proto/dist/generated/agent/v1/shell_allowlist_precheck_exec_pb.js */
export declare class agent_v1_ShellAllowlistPrecheckArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellAllowlistPrecheckArgs>);
  static readonly typeName: "agent.v1.ShellAllowlistPrecheckArgs";
  command: string;
  workingDirectory: string;
  parsingResult?: agent_v1_ShellCommandParsingResult;
  classifierResult?: agent_v1_CommandClassifierResult;
  toolCallId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellAllowlistPrecheckArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellAllowlistPrecheckArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellAllowlistPrecheckArgs;
  static equals(a: agent_v1_ShellAllowlistPrecheckArgs | MessageInit<agent_v1_ShellAllowlistPrecheckArgs> | undefined, b: agent_v1_ShellAllowlistPrecheckArgs | MessageInit<agent_v1_ShellAllowlistPrecheckArgs> | undefined): boolean;
}

/** agent.v1.ShellAllowlistPrecheckResult; source: ../proto/dist/generated/agent/v1/shell_allowlist_precheck_exec_pb.js */
export declare class agent_v1_ShellAllowlistPrecheckResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellAllowlistPrecheckResult>);
  static readonly typeName: "agent.v1.ShellAllowlistPrecheckResult";
  allowlisted: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellAllowlistPrecheckResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellAllowlistPrecheckResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellAllowlistPrecheckResult;
  static equals(a: agent_v1_ShellAllowlistPrecheckResult | MessageInit<agent_v1_ShellAllowlistPrecheckResult> | undefined, b: agent_v1_ShellAllowlistPrecheckResult | MessageInit<agent_v1_ShellAllowlistPrecheckResult> | undefined): boolean;
}

/** agent.v1.ShellArgs; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellArgs>);
  static readonly typeName: "agent.v1.ShellArgs";
  command: string;
  workingDirectory: string;
  timeout: number;
  toolCallId: string;
  simpleCommands: string[];
  hasInputRedirect: boolean;
  hasOutputRedirect: boolean;
  parsingResult?: agent_v1_ShellCommandParsingResult;
  requestedSandboxPolicy?: agent_v1_SandboxPolicy;
  fileOutputThresholdBytes?: bigint;
  isBackground: boolean;
  skipApproval: boolean;
  timeoutBehavior: agent_v1_TimeoutBehavior;
  hardTimeout?: number;
  description?: string;
  classifierResult?: agent_v1_CommandClassifierResult;
  closeStdin: boolean;
  outputNotification?: agent_v1_ShellOutputNotificationConfig;
  smartModeApproval?: agent_v1_SmartModeApproval;
  hookApprovalRequirement?: agent_v1_ShellHookApprovalRequirement;
  conversationId?: string;
  adminCommandDenylist: string[];
  requestId?: string;
  secretScopeId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellArgs;
  static equals(a: agent_v1_ShellArgs | MessageInit<agent_v1_ShellArgs> | undefined, b: agent_v1_ShellArgs | MessageInit<agent_v1_ShellArgs> | undefined): boolean;
}

/** agent.v1.ShellBackgroundReason; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare enum agent_v1_ShellBackgroundReason {
  "UNSPECIFIED" = 0,
  "TIMEOUT" = 1,
  "USER_REQUEST" = 2,
}

/** agent.v1.ShellCommandParsingResult; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellCommandParsingResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellCommandParsingResult>);
  static readonly typeName: "agent.v1.ShellCommandParsingResult";
  parsingFailed: boolean;
  executableCommands: agent_v1_ShellCommandParsingResult_ExecutableCommand[];
  hasRedirects: boolean;
  hasCommandSubstitution: boolean;
  allRedirectsAreDevNull?: boolean;
  redirects: agent_v1_ShellCommandParsingResult_Redirect[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellCommandParsingResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult;
  static equals(a: agent_v1_ShellCommandParsingResult | MessageInit<agent_v1_ShellCommandParsingResult> | undefined, b: agent_v1_ShellCommandParsingResult | MessageInit<agent_v1_ShellCommandParsingResult> | undefined): boolean;
}

/** agent.v1.ShellCommandParsingResult.ExecutableCommand; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellCommandParsingResult_ExecutableCommand extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellCommandParsingResult_ExecutableCommand>);
  static readonly typeName: "agent.v1.ShellCommandParsingResult.ExecutableCommand";
  name: string;
  args: agent_v1_ShellCommandParsingResult_ExecutableCommandArg[];
  fullText: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellCommandParsingResult_ExecutableCommand;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult_ExecutableCommand;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult_ExecutableCommand;
  static equals(a: agent_v1_ShellCommandParsingResult_ExecutableCommand | MessageInit<agent_v1_ShellCommandParsingResult_ExecutableCommand> | undefined, b: agent_v1_ShellCommandParsingResult_ExecutableCommand | MessageInit<agent_v1_ShellCommandParsingResult_ExecutableCommand> | undefined): boolean;
}

/** agent.v1.ShellCommandParsingResult.ExecutableCommandArg; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellCommandParsingResult_ExecutableCommandArg extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellCommandParsingResult_ExecutableCommandArg>);
  static readonly typeName: "agent.v1.ShellCommandParsingResult.ExecutableCommandArg";
  type: string;
  value: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellCommandParsingResult_ExecutableCommandArg;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult_ExecutableCommandArg;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult_ExecutableCommandArg;
  static equals(a: agent_v1_ShellCommandParsingResult_ExecutableCommandArg | MessageInit<agent_v1_ShellCommandParsingResult_ExecutableCommandArg> | undefined, b: agent_v1_ShellCommandParsingResult_ExecutableCommandArg | MessageInit<agent_v1_ShellCommandParsingResult_ExecutableCommandArg> | undefined): boolean;
}

/** agent.v1.ShellCommandParsingResult.Redirect; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellCommandParsingResult_Redirect extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellCommandParsingResult_Redirect>);
  static readonly typeName: "agent.v1.ShellCommandParsingResult.Redirect";
  operator: string;
  destinationFds: number[];
  targetNodeType: string;
  targetText?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellCommandParsingResult_Redirect;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult_Redirect;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellCommandParsingResult_Redirect;
  static equals(a: agent_v1_ShellCommandParsingResult_Redirect | MessageInit<agent_v1_ShellCommandParsingResult_Redirect> | undefined, b: agent_v1_ShellCommandParsingResult_Redirect | MessageInit<agent_v1_ShellCommandParsingResult_Redirect> | undefined): boolean;
}

/** agent.v1.ShellFailure; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellFailure extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellFailure>);
  static readonly typeName: "agent.v1.ShellFailure";
  command: string;
  workingDirectory: string;
  exitCode: number;
  signal: string;
  stdout: string;
  stderr: string;
  executionTime: number;
  outputLocation?: agent_v1_OutputLocation;
  interleavedOutput?: string;
  abortReason?: agent_v1_ShellAbortReason;
  aborted: boolean;
  localExecutionTimeMs?: number;
  outputHead?: string;
  outputTail?: string;
  elidedChars?: number;
  oomKill?: agent_v1_ShellOomKill;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellFailure;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellFailure;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellFailure;
  static equals(a: agent_v1_ShellFailure | MessageInit<agent_v1_ShellFailure> | undefined, b: agent_v1_ShellFailure | MessageInit<agent_v1_ShellFailure> | undefined): boolean;
}

/** agent.v1.ShellHookApprovalRequirement; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellHookApprovalRequirement extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellHookApprovalRequirement>);
  static readonly typeName: "agent.v1.ShellHookApprovalRequirement";
  kind: agent_v1_ShellHookApprovalRequirement_Kind;
  reason?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellHookApprovalRequirement;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellHookApprovalRequirement;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellHookApprovalRequirement;
  static equals(a: agent_v1_ShellHookApprovalRequirement | MessageInit<agent_v1_ShellHookApprovalRequirement> | undefined, b: agent_v1_ShellHookApprovalRequirement | MessageInit<agent_v1_ShellHookApprovalRequirement> | undefined): boolean;
}

/** agent.v1.ShellHookApprovalRequirement.Kind; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare enum agent_v1_ShellHookApprovalRequirement_Kind {
  "UNSPECIFIED" = 0,
  "FORCE_PROMPT" = 1,
}

/** agent.v1.ShellOomKill; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellOomKill extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellOomKill>);
  static readonly typeName: "agent.v1.ShellOomKill";
  kind: agent_v1_ShellOomKill_Kind;
  memoryLimitBytes: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellOomKill;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellOomKill;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellOomKill;
  static equals(a: agent_v1_ShellOomKill | MessageInit<agent_v1_ShellOomKill> | undefined, b: agent_v1_ShellOomKill | MessageInit<agent_v1_ShellOomKill> | undefined): boolean;
}

/** agent.v1.ShellOomKill.Kind; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare enum agent_v1_ShellOomKill_Kind {
  "UNSPECIFIED" = 0,
  "COMMAND_KILLED" = 1,
  "COMMAND_FAILED" = 2,
  "UNCONFIRMED" = 3,
}

/** agent.v1.ShellOutputNotificationConfig; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellOutputNotificationConfig extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellOutputNotificationConfig>);
  static readonly typeName: "agent.v1.ShellOutputNotificationConfig";
  pattern: string;
  reason: string;
  debounce?: number;
  notificationLimit?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellOutputNotificationConfig;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellOutputNotificationConfig;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellOutputNotificationConfig;
  static equals(a: agent_v1_ShellOutputNotificationConfig | MessageInit<agent_v1_ShellOutputNotificationConfig> | undefined, b: agent_v1_ShellOutputNotificationConfig | MessageInit<agent_v1_ShellOutputNotificationConfig> | undefined): boolean;
}

/** agent.v1.ShellPermissionDenied; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellPermissionDenied extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellPermissionDenied>);
  static readonly typeName: "agent.v1.ShellPermissionDenied";
  command: string;
  workingDirectory: string;
  error: string;
  isReadonly: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellPermissionDenied;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellPermissionDenied;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellPermissionDenied;
  static equals(a: agent_v1_ShellPermissionDenied | MessageInit<agent_v1_ShellPermissionDenied> | undefined, b: agent_v1_ShellPermissionDenied | MessageInit<agent_v1_ShellPermissionDenied> | undefined): boolean;
}

/** agent.v1.ShellRejected; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellRejected>);
  static readonly typeName: "agent.v1.ShellRejected";
  command: string;
  workingDirectory: string;
  reason: string;
  isReadonly: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellRejected;
  static equals(a: agent_v1_ShellRejected | MessageInit<agent_v1_ShellRejected> | undefined, b: agent_v1_ShellRejected | MessageInit<agent_v1_ShellRejected> | undefined): boolean;
}

/** agent.v1.ShellResult; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellResult>);
  static readonly typeName: "agent.v1.ShellResult";
  sandboxPolicy?: agent_v1_SandboxPolicy;
  isBackground?: boolean;
  terminalsFolder?: string;
  pid?: number;
  result: { case: "success"; value: agent_v1_ShellSuccess } | { case: "failure"; value: agent_v1_ShellFailure } | { case: "timeout"; value: agent_v1_ShellTimeout } | { case: "rejected"; value: agent_v1_ShellRejected } | { case: "spawnError"; value: agent_v1_ShellSpawnError } | { case: "permissionDenied"; value: agent_v1_ShellPermissionDenied } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellResult;
  static equals(a: agent_v1_ShellResult | MessageInit<agent_v1_ShellResult> | undefined, b: agent_v1_ShellResult | MessageInit<agent_v1_ShellResult> | undefined): boolean;
}

/** agent.v1.ShellSandboxUnsupported; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellSandboxUnsupported extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellSandboxUnsupported>);
  static readonly typeName: "agent.v1.ShellSandboxUnsupported";
  command: string;
  workingDirectory: string;
  sandboxPolicyType: string;
  reason: string;
  isReadonly: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellSandboxUnsupported;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellSandboxUnsupported;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellSandboxUnsupported;
  static equals(a: agent_v1_ShellSandboxUnsupported | MessageInit<agent_v1_ShellSandboxUnsupported> | undefined, b: agent_v1_ShellSandboxUnsupported | MessageInit<agent_v1_ShellSandboxUnsupported> | undefined): boolean;
}

/** agent.v1.ShellSpawnError; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellSpawnError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellSpawnError>);
  static readonly typeName: "agent.v1.ShellSpawnError";
  command: string;
  workingDirectory: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellSpawnError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellSpawnError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellSpawnError;
  static equals(a: agent_v1_ShellSpawnError | MessageInit<agent_v1_ShellSpawnError> | undefined, b: agent_v1_ShellSpawnError | MessageInit<agent_v1_ShellSpawnError> | undefined): boolean;
}

/** agent.v1.ShellStream; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellStream extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellStream>);
  static readonly typeName: "agent.v1.ShellStream";
  event: { case: "stdout"; value: agent_v1_ShellStreamStdout } | { case: "stderr"; value: agent_v1_ShellStreamStderr } | { case: "exit"; value: agent_v1_ShellStreamExit } | { case: "start"; value: agent_v1_ShellStreamStart } | { case: "rejected"; value: agent_v1_ShellRejected } | { case: "permissionDenied"; value: agent_v1_ShellPermissionDenied } | { case: "backgrounded"; value: agent_v1_ShellStreamBackgrounded } | { case: "hookContext"; value: agent_v1_ShellStreamHookContext } | { case: "sandboxUnsupported"; value: agent_v1_ShellSandboxUnsupported } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellStream;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellStream;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellStream;
  static equals(a: agent_v1_ShellStream | MessageInit<agent_v1_ShellStream> | undefined, b: agent_v1_ShellStream | MessageInit<agent_v1_ShellStream> | undefined): boolean;
}

/** agent.v1.ShellStreamBackgrounded; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellStreamBackgrounded extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellStreamBackgrounded>);
  static readonly typeName: "agent.v1.ShellStreamBackgrounded";
  shellId: number;
  command: string;
  workingDirectory: string;
  pid?: number;
  msToWait?: number;
  reason?: agent_v1_ShellBackgroundReason;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellStreamBackgrounded;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellStreamBackgrounded;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellStreamBackgrounded;
  static equals(a: agent_v1_ShellStreamBackgrounded | MessageInit<agent_v1_ShellStreamBackgrounded> | undefined, b: agent_v1_ShellStreamBackgrounded | MessageInit<agent_v1_ShellStreamBackgrounded> | undefined): boolean;
}

/** agent.v1.ShellStreamExit; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellStreamExit extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellStreamExit>);
  static readonly typeName: "agent.v1.ShellStreamExit";
  code: number;
  cwd: string;
  outputLocation?: agent_v1_OutputLocation;
  aborted: boolean;
  abortReason?: agent_v1_ShellAbortReason;
  localExecutionTimeMs?: number;
  oomKill?: agent_v1_ShellOomKill;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellStreamExit;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellStreamExit;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellStreamExit;
  static equals(a: agent_v1_ShellStreamExit | MessageInit<agent_v1_ShellStreamExit> | undefined, b: agent_v1_ShellStreamExit | MessageInit<agent_v1_ShellStreamExit> | undefined): boolean;
}

/** agent.v1.ShellStreamHookContext; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellStreamHookContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellStreamHookContext>);
  static readonly typeName: "agent.v1.ShellStreamHookContext";
  hookAdditionalContexts: agent_v1_HookAdditionalContext[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellStreamHookContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellStreamHookContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellStreamHookContext;
  static equals(a: agent_v1_ShellStreamHookContext | MessageInit<agent_v1_ShellStreamHookContext> | undefined, b: agent_v1_ShellStreamHookContext | MessageInit<agent_v1_ShellStreamHookContext> | undefined): boolean;
}

/** agent.v1.ShellStreamStart; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellStreamStart extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellStreamStart>);
  static readonly typeName: "agent.v1.ShellStreamStart";
  sandboxPolicy?: agent_v1_SandboxPolicy;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellStreamStart;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellStreamStart;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellStreamStart;
  static equals(a: agent_v1_ShellStreamStart | MessageInit<agent_v1_ShellStreamStart> | undefined, b: agent_v1_ShellStreamStart | MessageInit<agent_v1_ShellStreamStart> | undefined): boolean;
}

/** agent.v1.ShellStreamStderr; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellStreamStderr extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellStreamStderr>);
  static readonly typeName: "agent.v1.ShellStreamStderr";
  data: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellStreamStderr;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellStreamStderr;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellStreamStderr;
  static equals(a: agent_v1_ShellStreamStderr | MessageInit<agent_v1_ShellStreamStderr> | undefined, b: agent_v1_ShellStreamStderr | MessageInit<agent_v1_ShellStreamStderr> | undefined): boolean;
}

/** agent.v1.ShellStreamStdout; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellStreamStdout extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellStreamStdout>);
  static readonly typeName: "agent.v1.ShellStreamStdout";
  data: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellStreamStdout;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellStreamStdout;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellStreamStdout;
  static equals(a: agent_v1_ShellStreamStdout | MessageInit<agent_v1_ShellStreamStdout> | undefined, b: agent_v1_ShellStreamStdout | MessageInit<agent_v1_ShellStreamStdout> | undefined): boolean;
}

/** agent.v1.ShellSuccess; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellSuccess>);
  static readonly typeName: "agent.v1.ShellSuccess";
  command: string;
  workingDirectory: string;
  exitCode: number;
  signal: string;
  stdout: string;
  stderr: string;
  executionTime: number;
  outputLocation?: agent_v1_OutputLocation;
  shellId?: number;
  interleavedOutput?: string;
  pid?: number;
  msToWait?: number;
  localExecutionTimeMs?: number;
  backgroundReason?: agent_v1_ShellBackgroundReason;
  outputHead?: string;
  outputTail?: string;
  elidedChars?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellSuccess;
  static equals(a: agent_v1_ShellSuccess | MessageInit<agent_v1_ShellSuccess> | undefined, b: agent_v1_ShellSuccess | MessageInit<agent_v1_ShellSuccess> | undefined): boolean;
}

/** agent.v1.ShellTimeout; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare class agent_v1_ShellTimeout extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_ShellTimeout>);
  static readonly typeName: "agent.v1.ShellTimeout";
  command: string;
  workingDirectory: string;
  timeoutMs: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_ShellTimeout;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_ShellTimeout;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_ShellTimeout;
  static equals(a: agent_v1_ShellTimeout | MessageInit<agent_v1_ShellTimeout> | undefined, b: agent_v1_ShellTimeout | MessageInit<agent_v1_ShellTimeout> | undefined): boolean;
}

/** agent.v1.SkillDescriptor; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_SkillDescriptor extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SkillDescriptor>);
  static readonly typeName: "agent.v1.SkillDescriptor";
  name: string;
  description: string;
  folderPath: string;
  enabled: boolean;
  parseError?: string;
  readmeFilePath: string;
  packageType: agent_v1_PackageType;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SkillDescriptor;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SkillDescriptor;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SkillDescriptor;
  static equals(a: agent_v1_SkillDescriptor | MessageInit<agent_v1_SkillDescriptor> | undefined, b: agent_v1_SkillDescriptor | MessageInit<agent_v1_SkillDescriptor> | undefined): boolean;
}

/** agent.v1.SkillOptions; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_SkillOptions extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SkillOptions>);
  static readonly typeName: "agent.v1.SkillOptions";
  skillDescriptors: agent_v1_SkillDescriptor[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SkillOptions;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SkillOptions;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SkillOptions;
  static equals(a: agent_v1_SkillOptions | MessageInit<agent_v1_SkillOptions> | undefined, b: agent_v1_SkillOptions | MessageInit<agent_v1_SkillOptions> | undefined): boolean;
}

/** agent.v1.SmartModeApproval; source: ../proto/dist/generated/agent/v1/utils_pb.js */
export declare class agent_v1_SmartModeApproval extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeApproval>);
  static readonly typeName: "agent.v1.SmartModeApproval";
  requestId: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeApproval;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeApproval;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeApproval;
  static equals(a: agent_v1_SmartModeApproval | MessageInit<agent_v1_SmartModeApproval> | undefined, b: agent_v1_SmartModeApproval | MessageInit<agent_v1_SmartModeApproval> | undefined): boolean;
}

/** agent.v1.SmartModeClassifierAppliedRule; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SmartModeClassifierAppliedRule extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeClassifierAppliedRule>);
  static readonly typeName: "agent.v1.SmartModeClassifierAppliedRule";
  effect: agent_v1_SmartModeClassifierRuleEffect;
  text: string;
  source: agent_v1_SmartModeClassifierRuleSource;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeClassifierAppliedRule;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeClassifierAppliedRule;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeClassifierAppliedRule;
  static equals(a: agent_v1_SmartModeClassifierAppliedRule | MessageInit<agent_v1_SmartModeClassifierAppliedRule> | undefined, b: agent_v1_SmartModeClassifierAppliedRule | MessageInit<agent_v1_SmartModeClassifierAppliedRule> | undefined): boolean;
}

/** agent.v1.SmartModeClassifierArgs; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SmartModeClassifierArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeClassifierArgs>);
  static readonly typeName: "agent.v1.SmartModeClassifierArgs";
  toolCallId: string;
  parentConversationId?: string;
  target?: agent_v1_SmartModeRiskTarget;
  conversationContext: agent_v1_SmartModeClassifierConversationMessage[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeClassifierArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeClassifierArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeClassifierArgs;
  static equals(a: agent_v1_SmartModeClassifierArgs | MessageInit<agent_v1_SmartModeClassifierArgs> | undefined, b: agent_v1_SmartModeClassifierArgs | MessageInit<agent_v1_SmartModeClassifierArgs> | undefined): boolean;
}

/** agent.v1.SmartModeClassifierConversationMessage; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SmartModeClassifierConversationMessage extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeClassifierConversationMessage>);
  static readonly typeName: "agent.v1.SmartModeClassifierConversationMessage";
  role: string;
  content: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeClassifierConversationMessage;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeClassifierConversationMessage;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeClassifierConversationMessage;
  static equals(a: agent_v1_SmartModeClassifierConversationMessage | MessageInit<agent_v1_SmartModeClassifierConversationMessage> | undefined, b: agent_v1_SmartModeClassifierConversationMessage | MessageInit<agent_v1_SmartModeClassifierConversationMessage> | undefined): boolean;
}

/** agent.v1.SmartModeClassifierDecision; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare enum agent_v1_SmartModeClassifierDecision {
  "UNSPECIFIED" = 0,
  "ALLOW" = 1,
  "BLOCK" = 2,
}

/** agent.v1.SmartModeClassifierError; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SmartModeClassifierError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeClassifierError>);
  static readonly typeName: "agent.v1.SmartModeClassifierError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeClassifierError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeClassifierError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeClassifierError;
  static equals(a: agent_v1_SmartModeClassifierError | MessageInit<agent_v1_SmartModeClassifierError> | undefined, b: agent_v1_SmartModeClassifierError | MessageInit<agent_v1_SmartModeClassifierError> | undefined): boolean;
}

/** agent.v1.SmartModeClassifierResult; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SmartModeClassifierResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeClassifierResult>);
  static readonly typeName: "agent.v1.SmartModeClassifierResult";
  result: { case: "success"; value: agent_v1_SmartModeClassifierSuccess } | { case: "error"; value: agent_v1_SmartModeClassifierError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeClassifierResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeClassifierResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeClassifierResult;
  static equals(a: agent_v1_SmartModeClassifierResult | MessageInit<agent_v1_SmartModeClassifierResult> | undefined, b: agent_v1_SmartModeClassifierResult | MessageInit<agent_v1_SmartModeClassifierResult> | undefined): boolean;
}

/** agent.v1.SmartModeClassifierRuleEffect; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare enum agent_v1_SmartModeClassifierRuleEffect {
  "UNSPECIFIED" = 0,
  "ALLOW" = 1,
  "ASK_FIRST" = 2,
}

/** agent.v1.SmartModeClassifierRuleSource; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare enum agent_v1_SmartModeClassifierRuleSource {
  "UNSPECIFIED" = 0,
  "CUSTOM_RULE" = 1,
  "TEAM_RULE" = 2,
}

/** agent.v1.SmartModeClassifierSuccess; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SmartModeClassifierSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeClassifierSuccess>);
  static readonly typeName: "agent.v1.SmartModeClassifierSuccess";
  decision: agent_v1_SmartModeClassifierDecision;
  blockReason?: string;
  proposedAllowRule?: string;
  appliedRules: agent_v1_SmartModeClassifierAppliedRule[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeClassifierSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeClassifierSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeClassifierSuccess;
  static equals(a: agent_v1_SmartModeClassifierSuccess | MessageInit<agent_v1_SmartModeClassifierSuccess> | undefined, b: agent_v1_SmartModeClassifierSuccess | MessageInit<agent_v1_SmartModeClassifierSuccess> | undefined): boolean;
}

/** agent.v1.SmartModeRiskTarget; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SmartModeRiskTarget extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SmartModeRiskTarget>);
  static readonly typeName: "agent.v1.SmartModeRiskTarget";
  action: string;
  arguments?: google_protobuf_Struct;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SmartModeRiskTarget;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SmartModeRiskTarget;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SmartModeRiskTarget;
  static equals(a: agent_v1_SmartModeRiskTarget | MessageInit<agent_v1_SmartModeRiskTarget> | undefined, b: agent_v1_SmartModeRiskTarget | MessageInit<agent_v1_SmartModeRiskTarget> | undefined): boolean;
}

/** agent.v1.SpanContext; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SpanContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SpanContext>);
  static readonly typeName: "agent.v1.SpanContext";
  traceId: string;
  spanId: string;
  traceFlags?: number;
  traceState?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SpanContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SpanContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SpanContext;
  static equals(a: agent_v1_SpanContext | MessageInit<agent_v1_SpanContext> | undefined, b: agent_v1_SpanContext | MessageInit<agent_v1_SpanContext> | undefined): boolean;
}

/** agent.v1.SpawnPtyRequest; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_SpawnPtyRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SpawnPtyRequest>);
  static readonly typeName: "agent.v1.SpawnPtyRequest";
  process?: agent_v1_Process;
  cwd: string;
  env: Record<string, string>;
  cols: number;
  rows: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SpawnPtyRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SpawnPtyRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SpawnPtyRequest;
  static equals(a: agent_v1_SpawnPtyRequest | MessageInit<agent_v1_SpawnPtyRequest> | undefined, b: agent_v1_SpawnPtyRequest | MessageInit<agent_v1_SpawnPtyRequest> | undefined): boolean;
}

/** agent.v1.SpawnPtyResponse; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_SpawnPtyResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SpawnPtyResponse>);
  static readonly typeName: "agent.v1.SpawnPtyResponse";
  ptyId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SpawnPtyResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SpawnPtyResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SpawnPtyResponse;
  static equals(a: agent_v1_SpawnPtyResponse | MessageInit<agent_v1_SpawnPtyResponse> | undefined, b: agent_v1_SpawnPtyResponse | MessageInit<agent_v1_SpawnPtyResponse> | undefined): boolean;
}

/** agent.v1.StackTrace; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_StackTrace extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_StackTrace>);
  static readonly typeName: "agent.v1.StackTrace";
  callFrames: agent_v1_CallFrame[];
  rawStackTrace?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_StackTrace;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_StackTrace;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_StackTrace;
  static equals(a: agent_v1_StackTrace | MessageInit<agent_v1_StackTrace> | undefined, b: agent_v1_StackTrace | MessageInit<agent_v1_StackTrace> | undefined): boolean;
}

/** agent.v1.StderrEvent; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_StderrEvent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_StderrEvent>);
  static readonly typeName: "agent.v1.StderrEvent";
  data: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_StderrEvent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_StderrEvent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_StderrEvent;
  static equals(a: agent_v1_StderrEvent | MessageInit<agent_v1_StderrEvent> | undefined, b: agent_v1_StderrEvent | MessageInit<agent_v1_StderrEvent> | undefined): boolean;
}

/** agent.v1.StdoutEvent; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_StdoutEvent extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_StdoutEvent>);
  static readonly typeName: "agent.v1.StdoutEvent";
  data: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_StdoutEvent;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_StdoutEvent;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_StdoutEvent;
  static equals(a: agent_v1_StdoutEvent | MessageInit<agent_v1_StdoutEvent> | undefined, b: agent_v1_StdoutEvent | MessageInit<agent_v1_StdoutEvent> | undefined): boolean;
}

/** agent.v1.StopRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_StopRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_StopRequestQuery>);
  static readonly typeName: "agent.v1.StopRequestQuery";
  status: string;
  loopCount: number;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  inputTokens?: bigint;
  outputTokens?: bigint;
  cacheReadTokens?: bigint;
  cacheWriteTokens?: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_StopRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_StopRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_StopRequestQuery;
  static equals(a: agent_v1_StopRequestQuery | MessageInit<agent_v1_StopRequestQuery> | undefined, b: agent_v1_StopRequestQuery | MessageInit<agent_v1_StopRequestQuery> | undefined): boolean;
}

/** agent.v1.StopRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_StopRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_StopRequestResponse>);
  static readonly typeName: "agent.v1.StopRequestResponse";
  followupMessage?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_StopRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_StopRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_StopRequestResponse;
  static equals(a: agent_v1_StopRequestResponse | MessageInit<agent_v1_StopRequestResponse> | undefined, b: agent_v1_StopRequestResponse | MessageInit<agent_v1_StopRequestResponse> | undefined): boolean;
}

/** agent.v1.SubagentArgs; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentArgs>);
  static readonly typeName: "agent.v1.SubagentArgs";
  toolCallId: string;
  subagentType: string;
  modelId: string;
  prompt: string;
  readonly: boolean;
  resumeAgentId?: string;
  runInBackground?: boolean;
  continuationConfig?: agent_v1_ClientContinuationConfig;
  parentConversationId?: string;
  interrupt?: boolean;
  mode: agent_v1_TaskMode;
  forkAgentId?: string;
  rootParentConversationId?: string;
  selectedContext?: agent_v1_SelectedContext;
  directMetaParentChildSubagent?: boolean;
  environment: agent_v1_SubagentExecutionEnvironment;
  cloudBaseBranch?: string;
  modelParameters: agent_v1_RequestedModel_ModelParameterValue[];
  credentials: { case: "apiKeyCredentials"; value: agent_v1_ApiKeyCredentials } | { case: "azureCredentials"; value: agent_v1_AzureCredentials } | { case: "bedrockCredentials"; value: agent_v1_BedrockCredentials } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentArgs;
  static equals(a: agent_v1_SubagentArgs | MessageInit<agent_v1_SubagentArgs> | undefined, b: agent_v1_SubagentArgs | MessageInit<agent_v1_SubagentArgs> | undefined): boolean;
}

/** agent.v1.SubagentAwaitArgs; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentAwaitArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentAwaitArgs>);
  static readonly typeName: "agent.v1.SubagentAwaitArgs";
  agentId: string;
  timeoutMs: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentAwaitArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentAwaitArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentAwaitArgs;
  static equals(a: agent_v1_SubagentAwaitArgs | MessageInit<agent_v1_SubagentAwaitArgs> | undefined, b: agent_v1_SubagentAwaitArgs | MessageInit<agent_v1_SubagentAwaitArgs> | undefined): boolean;
}

/** agent.v1.SubagentAwaitComplete; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentAwaitComplete extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentAwaitComplete>);
  static readonly typeName: "agent.v1.SubagentAwaitComplete";
  agentId: string;
  transcriptPath?: string;
  toolCallCount: number;
  finalMessage?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentAwaitComplete;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentAwaitComplete;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentAwaitComplete;
  static equals(a: agent_v1_SubagentAwaitComplete | MessageInit<agent_v1_SubagentAwaitComplete> | undefined, b: agent_v1_SubagentAwaitComplete | MessageInit<agent_v1_SubagentAwaitComplete> | undefined): boolean;
}

/** agent.v1.SubagentAwaitError; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentAwaitError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentAwaitError>);
  static readonly typeName: "agent.v1.SubagentAwaitError";
  agentId?: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentAwaitError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentAwaitError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentAwaitError;
  static equals(a: agent_v1_SubagentAwaitError | MessageInit<agent_v1_SubagentAwaitError> | undefined, b: agent_v1_SubagentAwaitError | MessageInit<agent_v1_SubagentAwaitError> | undefined): boolean;
}

/** agent.v1.SubagentAwaitNotFound; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentAwaitNotFound extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentAwaitNotFound>);
  static readonly typeName: "agent.v1.SubagentAwaitNotFound";
  agentId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentAwaitNotFound;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentAwaitNotFound;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentAwaitNotFound;
  static equals(a: agent_v1_SubagentAwaitNotFound | MessageInit<agent_v1_SubagentAwaitNotFound> | undefined, b: agent_v1_SubagentAwaitNotFound | MessageInit<agent_v1_SubagentAwaitNotFound> | undefined): boolean;
}

/** agent.v1.SubagentAwaitResult; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentAwaitResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentAwaitResult>);
  static readonly typeName: "agent.v1.SubagentAwaitResult";
  result: { case: "complete"; value: agent_v1_SubagentAwaitComplete } | { case: "stillRunning"; value: agent_v1_SubagentAwaitStillRunning } | { case: "notFound"; value: agent_v1_SubagentAwaitNotFound } | { case: "error"; value: agent_v1_SubagentAwaitError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentAwaitResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentAwaitResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentAwaitResult;
  static equals(a: agent_v1_SubagentAwaitResult | MessageInit<agent_v1_SubagentAwaitResult> | undefined, b: agent_v1_SubagentAwaitResult | MessageInit<agent_v1_SubagentAwaitResult> | undefined): boolean;
}

/** agent.v1.SubagentAwaitStillRunning; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentAwaitStillRunning extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentAwaitStillRunning>);
  static readonly typeName: "agent.v1.SubagentAwaitStillRunning";
  agentId: string;
  transcriptPath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentAwaitStillRunning;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentAwaitStillRunning;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentAwaitStillRunning;
  static equals(a: agent_v1_SubagentAwaitStillRunning | MessageInit<agent_v1_SubagentAwaitStillRunning> | undefined, b: agent_v1_SubagentAwaitStillRunning | MessageInit<agent_v1_SubagentAwaitStillRunning> | undefined): boolean;
}

/** agent.v1.SubagentBackgroundReason; source: ../proto/dist/generated/agent/v1/subagents_pb.js */
export declare enum agent_v1_SubagentBackgroundReason {
  "UNSPECIFIED" = 0,
  "AGENT_REQUEST" = 1,
  "USER_REQUEST" = 2,
  "QUEUED_FOLLOW_UP" = 3,
}

/** agent.v1.SubagentError; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentError>);
  static readonly typeName: "agent.v1.SubagentError";
  agentId?: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentError;
  static equals(a: agent_v1_SubagentError | MessageInit<agent_v1_SubagentError> | undefined, b: agent_v1_SubagentError | MessageInit<agent_v1_SubagentError> | undefined): boolean;
}

/** agent.v1.SubagentExecutionEnvironment; source: ../proto/dist/generated/agent/v1/subagents_pb.js */
export declare enum agent_v1_SubagentExecutionEnvironment {
  "UNSPECIFIED" = 0,
  "LOCAL" = 1,
  "CLOUD" = 2,
}

/** agent.v1.SubagentResult; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentResult>);
  static readonly typeName: "agent.v1.SubagentResult";
  result: { case: "success"; value: agent_v1_SubagentSuccess } | { case: "error"; value: agent_v1_SubagentError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentResult;
  static equals(a: agent_v1_SubagentResult | MessageInit<agent_v1_SubagentResult> | undefined, b: agent_v1_SubagentResult | MessageInit<agent_v1_SubagentResult> | undefined): boolean;
}

/** agent.v1.SubagentStartRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_SubagentStartRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentStartRequestQuery>);
  static readonly typeName: "agent.v1.SubagentStartRequestQuery";
  subagentId: string;
  subagentType: string;
  task: string;
  parentConversationId: string;
  toolCallId?: string;
  subagentModel?: string;
  isParallelWorker: boolean;
  gitBranch?: string;
  conversationId?: string;
  generationId?: string;
  model?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentStartRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentStartRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentStartRequestQuery;
  static equals(a: agent_v1_SubagentStartRequestQuery | MessageInit<agent_v1_SubagentStartRequestQuery> | undefined, b: agent_v1_SubagentStartRequestQuery | MessageInit<agent_v1_SubagentStartRequestQuery> | undefined): boolean;
}

/** agent.v1.SubagentStartRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_SubagentStartRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentStartRequestResponse>);
  static readonly typeName: "agent.v1.SubagentStartRequestResponse";
  permission?: string;
  userMessage?: string;
  additionalContext?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentStartRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentStartRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentStartRequestResponse;
  static equals(a: agent_v1_SubagentStartRequestResponse | MessageInit<agent_v1_SubagentStartRequestResponse> | undefined, b: agent_v1_SubagentStartRequestResponse | MessageInit<agent_v1_SubagentStartRequestResponse> | undefined): boolean;
}

/** agent.v1.SubagentStopRequestQuery; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_SubagentStopRequestQuery extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentStopRequestQuery>);
  static readonly typeName: "agent.v1.SubagentStopRequestQuery";
  subagentId: string;
  subagentType: string;
  status: string;
  durationMs: bigint;
  summary?: string;
  parentConversationId: string;
  messageCount: number;
  toolCallCount: number;
  errorMessage?: string;
  modifiedFiles: string[];
  gitBranch?: string;
  conversationId?: string;
  generationId?: string;
  model?: string;
  loopCount: number;
  task?: string;
  description?: string;
  modelId?: string;
  modelParams: agent_v1_RequestedModel_ModelParameterValue[];
  childConversationId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentStopRequestQuery;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentStopRequestQuery;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentStopRequestQuery;
  static equals(a: agent_v1_SubagentStopRequestQuery | MessageInit<agent_v1_SubagentStopRequestQuery> | undefined, b: agent_v1_SubagentStopRequestQuery | MessageInit<agent_v1_SubagentStopRequestQuery> | undefined): boolean;
}

/** agent.v1.SubagentStopRequestResponse; source: ../proto/dist/generated/agent/v1/hooks_pb.js */
export declare class agent_v1_SubagentStopRequestResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentStopRequestResponse>);
  static readonly typeName: "agent.v1.SubagentStopRequestResponse";
  followupMessage?: string;
  additionalContext?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentStopRequestResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentStopRequestResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentStopRequestResponse;
  static equals(a: agent_v1_SubagentStopRequestResponse | MessageInit<agent_v1_SubagentStopRequestResponse> | undefined, b: agent_v1_SubagentStopRequestResponse | MessageInit<agent_v1_SubagentStopRequestResponse> | undefined): boolean;
}

/** agent.v1.SubagentSuccess; source: ../proto/dist/generated/agent/v1/exec_pb.js */
export declare class agent_v1_SubagentSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SubagentSuccess>);
  static readonly typeName: "agent.v1.SubagentSuccess";
  agentId: string;
  finalMessage?: string;
  toolCallCount: number;
  backgroundReason: agent_v1_SubagentBackgroundReason;
  transcriptPath?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SubagentSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SubagentSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SubagentSuccess;
  static equals(a: agent_v1_SubagentSuccess | MessageInit<agent_v1_SubagentSuccess> | undefined, b: agent_v1_SubagentSuccess | MessageInit<agent_v1_SubagentSuccess> | undefined): boolean;
}

/** agent.v1.SyncScopedSecretsRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_SyncScopedSecretsRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SyncScopedSecretsRequest>);
  static readonly typeName: "agent.v1.SyncScopedSecretsRequest";
  scopeId: string;
  revision: number;
  secrets?: agent_v1_ScopedSecretValues;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SyncScopedSecretsRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SyncScopedSecretsRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SyncScopedSecretsRequest;
  static equals(a: agent_v1_SyncScopedSecretsRequest | MessageInit<agent_v1_SyncScopedSecretsRequest> | undefined, b: agent_v1_SyncScopedSecretsRequest | MessageInit<agent_v1_SyncScopedSecretsRequest> | undefined): boolean;
}

/** agent.v1.SyncScopedSecretsResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_SyncScopedSecretsResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SyncScopedSecretsResponse>);
  static readonly typeName: "agent.v1.SyncScopedSecretsResponse";
  revision?: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SyncScopedSecretsResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SyncScopedSecretsResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SyncScopedSecretsResponse;
  static equals(a: agent_v1_SyncScopedSecretsResponse | MessageInit<agent_v1_SyncScopedSecretsResponse> | undefined, b: agent_v1_SyncScopedSecretsResponse | MessageInit<agent_v1_SyncScopedSecretsResponse> | undefined): boolean;
}

/** agent.v1.SystemPromptSpec; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_SystemPromptSpec extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SystemPromptSpec>);
  static readonly typeName: "agent.v1.SystemPromptSpec";
  spec: { case: "replace"; value: string } | { case: "append"; value: string } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SystemPromptSpec;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SystemPromptSpec;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SystemPromptSpec;
  static equals(a: agent_v1_SystemPromptSpec | MessageInit<agent_v1_SystemPromptSpec> | undefined, b: agent_v1_SystemPromptSpec | MessageInit<agent_v1_SystemPromptSpec> | undefined): boolean;
}

/** agent.v1.SystemReminder; source: ../proto/dist/generated/agent/v1/mcp_exec_pb.js */
export declare class agent_v1_SystemReminder extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_SystemReminder>);
  static readonly typeName: "agent.v1.SystemReminder";
  body: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_SystemReminder;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_SystemReminder;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_SystemReminder;
  static equals(a: agent_v1_SystemReminder | MessageInit<agent_v1_SystemReminder> | undefined, b: agent_v1_SystemReminder | MessageInit<agent_v1_SystemReminder> | undefined): boolean;
}

/** agent.v1.TaskMode; source: ../proto/dist/generated/agent/v1/subagents_pb.js */
export declare enum agent_v1_TaskMode {
  "UNSPECIFIED" = 0,
  "AGENT" = 1,
  "PLAN" = 2,
}

/** agent.v1.TerminalMetadata; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_TerminalMetadata extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_TerminalMetadata>);
  static readonly typeName: "agent.v1.TerminalMetadata";
  cwd?: string;
  lastCommands: agent_v1_TerminalMetadata_Command[];
  lastModifiedMs?: bigint;
  currentCommand?: agent_v1_TerminalMetadata_Command;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_TerminalMetadata;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_TerminalMetadata;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_TerminalMetadata;
  static equals(a: agent_v1_TerminalMetadata | MessageInit<agent_v1_TerminalMetadata> | undefined, b: agent_v1_TerminalMetadata | MessageInit<agent_v1_TerminalMetadata> | undefined): boolean;
}

/** agent.v1.TerminalMetadata.Command; source: ../proto/dist/generated/agent/v1/ls_exec_pb.js */
export declare class agent_v1_TerminalMetadata_Command extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_TerminalMetadata_Command>);
  static readonly typeName: "agent.v1.TerminalMetadata.Command";
  command: string;
  exitCode?: number;
  timestampMs?: bigint;
  durationMs?: bigint;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_TerminalMetadata_Command;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_TerminalMetadata_Command;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_TerminalMetadata_Command;
  static equals(a: agent_v1_TerminalMetadata_Command | MessageInit<agent_v1_TerminalMetadata_Command> | undefined, b: agent_v1_TerminalMetadata_Command | MessageInit<agent_v1_TerminalMetadata_Command> | undefined): boolean;
}

/** agent.v1.TerminatePtyRequest; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_TerminatePtyRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_TerminatePtyRequest>);
  static readonly typeName: "agent.v1.TerminatePtyRequest";
  ptyId: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_TerminatePtyRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_TerminatePtyRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_TerminatePtyRequest;
  static equals(a: agent_v1_TerminatePtyRequest | MessageInit<agent_v1_TerminatePtyRequest> | undefined, b: agent_v1_TerminatePtyRequest | MessageInit<agent_v1_TerminatePtyRequest> | undefined): boolean;
}

/** agent.v1.TerminatePtyResponse; source: ../proto/dist/generated/agent/v1/pty_host_service_pb.js */
export declare class agent_v1_TerminatePtyResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_TerminatePtyResponse>);
  static readonly typeName: "agent.v1.TerminatePtyResponse";
  success: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_TerminatePtyResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_TerminatePtyResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_TerminatePtyResponse;
  static equals(a: agent_v1_TerminatePtyResponse | MessageInit<agent_v1_TerminatePtyResponse> | undefined, b: agent_v1_TerminatePtyResponse | MessageInit<agent_v1_TerminatePtyResponse> | undefined): boolean;
}

/** agent.v1.TimeoutBehavior; source: ../proto/dist/generated/agent/v1/shell_exec_pb.js */
export declare enum agent_v1_TimeoutBehavior {
  "UNSPECIFIED" = 0,
  "CANCEL" = 1,
  "BACKGROUND" = 2,
}

/** agent.v1.TmuxSession; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare class agent_v1_TmuxSession extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_TmuxSession>);
  static readonly typeName: "agent.v1.TmuxSession";
  sessionId: string;
  sessionName: string;
  displayName: string;
  kind: agent_v1_TmuxSessionKind;
  cwd: string;
  shell: string;
  processArgs: string[];
  createdAtUnixMs: bigint;
  attachedClientCount: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_TmuxSession;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_TmuxSession;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_TmuxSession;
  static equals(a: agent_v1_TmuxSession | MessageInit<agent_v1_TmuxSession> | undefined, b: agent_v1_TmuxSession | MessageInit<agent_v1_TmuxSession> | undefined): boolean;
}

/** agent.v1.TmuxSessionKind; source: ../proto/dist/generated/agent/v1/tmux_session_service_pb.js */
export declare enum agent_v1_TmuxSessionKind {
  "UNSPECIFIED" = 0,
  "USER_MANUAL" = 1,
  "AGENT_BACKGROUND" = 2,
  "AGENT_INTERACTIVE" = 3,
}

/** agent.v1.TypeAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_TypeAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_TypeAction>);
  static readonly typeName: "agent.v1.TypeAction";
  text: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_TypeAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_TypeAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_TypeAction;
  static equals(a: agent_v1_TypeAction | MessageInit<agent_v1_TypeAction> | undefined, b: agent_v1_TypeAction | MessageInit<agent_v1_TypeAction> | undefined): boolean;
}

/** agent.v1.UpdateEnvironmentVariablesRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_UpdateEnvironmentVariablesRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_UpdateEnvironmentVariablesRequest>);
  static readonly typeName: "agent.v1.UpdateEnvironmentVariablesRequest";
  env: Record<string, string>;
  replace: boolean;
  restorePreviousValues: boolean;
  runScopedOverlay?: agent_v1_RunScopedOverlay;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_UpdateEnvironmentVariablesRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_UpdateEnvironmentVariablesRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_UpdateEnvironmentVariablesRequest;
  static equals(a: agent_v1_UpdateEnvironmentVariablesRequest | MessageInit<agent_v1_UpdateEnvironmentVariablesRequest> | undefined, b: agent_v1_UpdateEnvironmentVariablesRequest | MessageInit<agent_v1_UpdateEnvironmentVariablesRequest> | undefined): boolean;
}

/** agent.v1.UpdateEnvironmentVariablesResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_UpdateEnvironmentVariablesResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_UpdateEnvironmentVariablesResponse>);
  static readonly typeName: "agent.v1.UpdateEnvironmentVariablesResponse";
  applied: number;
  removed: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_UpdateEnvironmentVariablesResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_UpdateEnvironmentVariablesResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_UpdateEnvironmentVariablesResponse;
  static equals(a: agent_v1_UpdateEnvironmentVariablesResponse | MessageInit<agent_v1_UpdateEnvironmentVariablesResponse> | undefined, b: agent_v1_UpdateEnvironmentVariablesResponse | MessageInit<agent_v1_UpdateEnvironmentVariablesResponse> | undefined): boolean;
}

/** agent.v1.UploadArtifactsRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_UploadArtifactsRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_UploadArtifactsRequest>);
  static readonly typeName: "agent.v1.UploadArtifactsRequest";
  uploads: agent_v1_ArtifactUploadInstruction[];
  waitForCompletion: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_UploadArtifactsRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_UploadArtifactsRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_UploadArtifactsRequest;
  static equals(a: agent_v1_UploadArtifactsRequest | MessageInit<agent_v1_UploadArtifactsRequest> | undefined, b: agent_v1_UploadArtifactsRequest | MessageInit<agent_v1_UploadArtifactsRequest> | undefined): boolean;
}

/** agent.v1.UploadArtifactsResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_UploadArtifactsResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_UploadArtifactsResponse>);
  static readonly typeName: "agent.v1.UploadArtifactsResponse";
  results: agent_v1_ArtifactUploadDispatchResult[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_UploadArtifactsResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_UploadArtifactsResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_UploadArtifactsResponse;
  static equals(a: agent_v1_UploadArtifactsResponse | MessageInit<agent_v1_UploadArtifactsResponse> | undefined, b: agent_v1_UploadArtifactsResponse | MessageInit<agent_v1_UploadArtifactsResponse> | undefined): boolean;
}

/** agent.v1.UserAgentStoreWebContext; source: ../proto/dist/generated/agent/v1/request_context_exec_pb.js */
export declare class agent_v1_UserAgentStoreWebContext extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_UserAgentStoreWebContext>);
  static readonly typeName: "agent.v1.UserAgentStoreWebContext";
  storeId: string;
  portalBaseUrl: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_UserAgentStoreWebContext;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_UserAgentStoreWebContext;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_UserAgentStoreWebContext;
  static equals(a: agent_v1_UserAgentStoreWebContext | MessageInit<agent_v1_UserAgentStoreWebContext> | undefined, b: agent_v1_UserAgentStoreWebContext | MessageInit<agent_v1_UserAgentStoreWebContext> | undefined): boolean;
}

/** agent.v1.WaitAction; source: ../proto/dist/generated/agent/v1/computer_use_tool_pb.js */
export declare class agent_v1_WaitAction extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WaitAction>);
  static readonly typeName: "agent.v1.WaitAction";
  durationMs: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WaitAction;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WaitAction;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WaitAction;
  static equals(a: agent_v1_WaitAction | MessageInit<agent_v1_WaitAction> | undefined, b: agent_v1_WaitAction | MessageInit<agent_v1_WaitAction> | undefined): boolean;
}

/** agent.v1.WarmRemoteAccessServerRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_WarmRemoteAccessServerRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WarmRemoteAccessServerRequest>);
  static readonly typeName: "agent.v1.WarmRemoteAccessServerRequest";
  commit: string;
  port: number;
  connectionToken: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WarmRemoteAccessServerRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WarmRemoteAccessServerRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WarmRemoteAccessServerRequest;
  static equals(a: agent_v1_WarmRemoteAccessServerRequest | MessageInit<agent_v1_WarmRemoteAccessServerRequest> | undefined, b: agent_v1_WarmRemoteAccessServerRequest | MessageInit<agent_v1_WarmRemoteAccessServerRequest> | undefined): boolean;
}

/** agent.v1.WarmRemoteAccessServerResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_WarmRemoteAccessServerResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WarmRemoteAccessServerResponse>);
  static readonly typeName: "agent.v1.WarmRemoteAccessServerResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WarmRemoteAccessServerResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WarmRemoteAccessServerResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WarmRemoteAccessServerResponse;
  static equals(a: agent_v1_WarmRemoteAccessServerResponse | MessageInit<agent_v1_WarmRemoteAccessServerResponse> | undefined, b: agent_v1_WarmRemoteAccessServerResponse | MessageInit<agent_v1_WarmRemoteAccessServerResponse> | undefined): boolean;
}

/** agent.v1.WebFetchAllowlistPrecheckArgs; source: ../proto/dist/generated/agent/v1/web_fetch_allowlist_precheck_exec_pb.js */
export declare class agent_v1_WebFetchAllowlistPrecheckArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WebFetchAllowlistPrecheckArgs>);
  static readonly typeName: "agent.v1.WebFetchAllowlistPrecheckArgs";
  url: string;
  toolCallId?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WebFetchAllowlistPrecheckArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WebFetchAllowlistPrecheckArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WebFetchAllowlistPrecheckArgs;
  static equals(a: agent_v1_WebFetchAllowlistPrecheckArgs | MessageInit<agent_v1_WebFetchAllowlistPrecheckArgs> | undefined, b: agent_v1_WebFetchAllowlistPrecheckArgs | MessageInit<agent_v1_WebFetchAllowlistPrecheckArgs> | undefined): boolean;
}

/** agent.v1.WebFetchAllowlistPrecheckResult; source: ../proto/dist/generated/agent/v1/web_fetch_allowlist_precheck_exec_pb.js */
export declare class agent_v1_WebFetchAllowlistPrecheckResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WebFetchAllowlistPrecheckResult>);
  static readonly typeName: "agent.v1.WebFetchAllowlistPrecheckResult";
  allowlisted: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WebFetchAllowlistPrecheckResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WebFetchAllowlistPrecheckResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WebFetchAllowlistPrecheckResult;
  static equals(a: agent_v1_WebFetchAllowlistPrecheckResult | MessageInit<agent_v1_WebFetchAllowlistPrecheckResult> | undefined, b: agent_v1_WebFetchAllowlistPrecheckResult | MessageInit<agent_v1_WebFetchAllowlistPrecheckResult> | undefined): boolean;
}

/** agent.v1.WriteArgs; source: ../proto/dist/generated/agent/v1/write_exec_pb.js */
export declare class agent_v1_WriteArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteArgs>);
  static readonly typeName: "agent.v1.WriteArgs";
  path: string;
  fileText: string;
  toolCallId: string;
  returnFileContentAfterWrite: boolean;
  fileBytes: Uint8Array;
  encodingHint?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteArgs;
  static equals(a: agent_v1_WriteArgs | MessageInit<agent_v1_WriteArgs> | undefined, b: agent_v1_WriteArgs | MessageInit<agent_v1_WriteArgs> | undefined): boolean;
}

/** agent.v1.WriteBinaryFileRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_WriteBinaryFileRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteBinaryFileRequest>);
  static readonly typeName: "agent.v1.WriteBinaryFileRequest";
  path: string;
  content: Uint8Array;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteBinaryFileRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteBinaryFileRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteBinaryFileRequest;
  static equals(a: agent_v1_WriteBinaryFileRequest | MessageInit<agent_v1_WriteBinaryFileRequest> | undefined, b: agent_v1_WriteBinaryFileRequest | MessageInit<agent_v1_WriteBinaryFileRequest> | undefined): boolean;
}

/** agent.v1.WriteBinaryFileResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_WriteBinaryFileResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteBinaryFileResponse>);
  static readonly typeName: "agent.v1.WriteBinaryFileResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteBinaryFileResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteBinaryFileResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteBinaryFileResponse;
  static equals(a: agent_v1_WriteBinaryFileResponse | MessageInit<agent_v1_WriteBinaryFileResponse> | undefined, b: agent_v1_WriteBinaryFileResponse | MessageInit<agent_v1_WriteBinaryFileResponse> | undefined): boolean;
}

/** agent.v1.WriteError; source: ../proto/dist/generated/agent/v1/write_exec_pb.js */
export declare class agent_v1_WriteError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteError>);
  static readonly typeName: "agent.v1.WriteError";
  path: string;
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteError;
  static equals(a: agent_v1_WriteError | MessageInit<agent_v1_WriteError> | undefined, b: agent_v1_WriteError | MessageInit<agent_v1_WriteError> | undefined): boolean;
}

/** agent.v1.WriteNoSpace; source: ../proto/dist/generated/agent/v1/write_exec_pb.js */
export declare class agent_v1_WriteNoSpace extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteNoSpace>);
  static readonly typeName: "agent.v1.WriteNoSpace";
  path: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteNoSpace;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteNoSpace;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteNoSpace;
  static equals(a: agent_v1_WriteNoSpace | MessageInit<agent_v1_WriteNoSpace> | undefined, b: agent_v1_WriteNoSpace | MessageInit<agent_v1_WriteNoSpace> | undefined): boolean;
}

/** agent.v1.WritePermissionDenied; source: ../proto/dist/generated/agent/v1/write_exec_pb.js */
export declare class agent_v1_WritePermissionDenied extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WritePermissionDenied>);
  static readonly typeName: "agent.v1.WritePermissionDenied";
  path: string;
  directory: string;
  operation: string;
  error: string;
  isReadonly: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WritePermissionDenied;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WritePermissionDenied;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WritePermissionDenied;
  static equals(a: agent_v1_WritePermissionDenied | MessageInit<agent_v1_WritePermissionDenied> | undefined, b: agent_v1_WritePermissionDenied | MessageInit<agent_v1_WritePermissionDenied> | undefined): boolean;
}

/** agent.v1.WriteRejected; source: ../proto/dist/generated/agent/v1/write_exec_pb.js */
export declare class agent_v1_WriteRejected extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteRejected>);
  static readonly typeName: "agent.v1.WriteRejected";
  path: string;
  reason: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteRejected;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteRejected;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteRejected;
  static equals(a: agent_v1_WriteRejected | MessageInit<agent_v1_WriteRejected> | undefined, b: agent_v1_WriteRejected | MessageInit<agent_v1_WriteRejected> | undefined): boolean;
}

/** agent.v1.WriteResult; source: ../proto/dist/generated/agent/v1/write_exec_pb.js */
export declare class agent_v1_WriteResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteResult>);
  static readonly typeName: "agent.v1.WriteResult";
  result: { case: "success"; value: agent_v1_WriteSuccess } | { case: "permissionDenied"; value: agent_v1_WritePermissionDenied } | { case: "noSpace"; value: agent_v1_WriteNoSpace } | { case: "error"; value: agent_v1_WriteError } | { case: "rejected"; value: agent_v1_WriteRejected } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteResult;
  static equals(a: agent_v1_WriteResult | MessageInit<agent_v1_WriteResult> | undefined, b: agent_v1_WriteResult | MessageInit<agent_v1_WriteResult> | undefined): boolean;
}

/** agent.v1.WriteShellStdinArgs; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_WriteShellStdinArgs extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteShellStdinArgs>);
  static readonly typeName: "agent.v1.WriteShellStdinArgs";
  shellId: number;
  chars: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteShellStdinArgs;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteShellStdinArgs;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteShellStdinArgs;
  static equals(a: agent_v1_WriteShellStdinArgs | MessageInit<agent_v1_WriteShellStdinArgs> | undefined, b: agent_v1_WriteShellStdinArgs | MessageInit<agent_v1_WriteShellStdinArgs> | undefined): boolean;
}

/** agent.v1.WriteShellStdinError; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_WriteShellStdinError extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteShellStdinError>);
  static readonly typeName: "agent.v1.WriteShellStdinError";
  error: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteShellStdinError;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteShellStdinError;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteShellStdinError;
  static equals(a: agent_v1_WriteShellStdinError | MessageInit<agent_v1_WriteShellStdinError> | undefined, b: agent_v1_WriteShellStdinError | MessageInit<agent_v1_WriteShellStdinError> | undefined): boolean;
}

/** agent.v1.WriteShellStdinResult; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_WriteShellStdinResult extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteShellStdinResult>);
  static readonly typeName: "agent.v1.WriteShellStdinResult";
  result: { case: "success"; value: agent_v1_WriteShellStdinSuccess } | { case: "error"; value: agent_v1_WriteShellStdinError } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteShellStdinResult;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteShellStdinResult;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteShellStdinResult;
  static equals(a: agent_v1_WriteShellStdinResult | MessageInit<agent_v1_WriteShellStdinResult> | undefined, b: agent_v1_WriteShellStdinResult | MessageInit<agent_v1_WriteShellStdinResult> | undefined): boolean;
}

/** agent.v1.WriteShellStdinSuccess; source: ../proto/dist/generated/agent/v1/background_shell_exec_pb.js */
export declare class agent_v1_WriteShellStdinSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteShellStdinSuccess>);
  static readonly typeName: "agent.v1.WriteShellStdinSuccess";
  shellId: number;
  terminalFileLengthBeforeInputWritten: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteShellStdinSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteShellStdinSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteShellStdinSuccess;
  static equals(a: agent_v1_WriteShellStdinSuccess | MessageInit<agent_v1_WriteShellStdinSuccess> | undefined, b: agent_v1_WriteShellStdinSuccess | MessageInit<agent_v1_WriteShellStdinSuccess> | undefined): boolean;
}

/** agent.v1.WriteSuccess; source: ../proto/dist/generated/agent/v1/write_exec_pb.js */
export declare class agent_v1_WriteSuccess extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteSuccess>);
  static readonly typeName: "agent.v1.WriteSuccess";
  path: string;
  linesCreated: number;
  fileSize: number;
  fileContentAfterWrite?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteSuccess;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteSuccess;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteSuccess;
  static equals(a: agent_v1_WriteSuccess | MessageInit<agent_v1_WriteSuccess> | undefined, b: agent_v1_WriteSuccess | MessageInit<agent_v1_WriteSuccess> | undefined): boolean;
}

/** agent.v1.WriteTextFileRequest; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_WriteTextFileRequest extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteTextFileRequest>);
  static readonly typeName: "agent.v1.WriteTextFileRequest";
  path: string;
  content: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteTextFileRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteTextFileRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteTextFileRequest;
  static equals(a: agent_v1_WriteTextFileRequest | MessageInit<agent_v1_WriteTextFileRequest> | undefined, b: agent_v1_WriteTextFileRequest | MessageInit<agent_v1_WriteTextFileRequest> | undefined): boolean;
}

/** agent.v1.WriteTextFileResponse; source: ../proto/dist/generated/agent/v1/control_service_pb.js */
export declare class agent_v1_WriteTextFileResponse extends ProtoMessage {
  constructor(data?: MessageInit<agent_v1_WriteTextFileResponse>);
  static readonly typeName: "agent.v1.WriteTextFileResponse";
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): agent_v1_WriteTextFileResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): agent_v1_WriteTextFileResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): agent_v1_WriteTextFileResponse;
  static equals(a: agent_v1_WriteTextFileResponse | MessageInit<agent_v1_WriteTextFileResponse> | undefined, b: agent_v1_WriteTextFileResponse | MessageInit<agent_v1_WriteTextFileResponse> | undefined): boolean;
}

/** aiserver.v1.FileDiff; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare class aiserver_v1_FileDiff extends ProtoMessage {
  constructor(data?: MessageInit<aiserver_v1_FileDiff>);
  static readonly typeName: "aiserver.v1.FileDiff";
  added: number;
  removed: number;
  from: string;
  to: string;
  chunks: aiserver_v1_FileDiff_Chunk[];
  beforeFileContents?: string;
  afterFileContents?: string;
  isGenerated?: boolean;
  oldMode?: string;
  newMode?: string;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): aiserver_v1_FileDiff;
  static fromJson(value: JsonValue, options?: JsonReadOptions): aiserver_v1_FileDiff;
  static fromJsonString(value: string, options?: JsonReadOptions): aiserver_v1_FileDiff;
  static equals(a: aiserver_v1_FileDiff | MessageInit<aiserver_v1_FileDiff> | undefined, b: aiserver_v1_FileDiff | MessageInit<aiserver_v1_FileDiff> | undefined): boolean;
}

/** aiserver.v1.FileDiff.Chunk; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare class aiserver_v1_FileDiff_Chunk extends ProtoMessage {
  constructor(data?: MessageInit<aiserver_v1_FileDiff_Chunk>);
  static readonly typeName: "aiserver.v1.FileDiff.Chunk";
  content: string;
  lines: string[];
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): aiserver_v1_FileDiff_Chunk;
  static fromJson(value: JsonValue, options?: JsonReadOptions): aiserver_v1_FileDiff_Chunk;
  static fromJsonString(value: string, options?: JsonReadOptions): aiserver_v1_FileDiff_Chunk;
  static equals(a: aiserver_v1_FileDiff_Chunk | MessageInit<aiserver_v1_FileDiff_Chunk> | undefined, b: aiserver_v1_FileDiff_Chunk | MessageInit<aiserver_v1_FileDiff_Chunk> | undefined): boolean;
}

/** aiserver.v1.GetDiffRequest; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare class aiserver_v1_GetDiffRequest extends ProtoMessage {
  constructor(data?: MessageInit<aiserver_v1_GetDiffRequest>);
  static readonly typeName: "aiserver.v1.GetDiffRequest";
  cwd: string;
  ref: string;
  baseRef: string;
  mergeBase: boolean;
  targetPaths: string[];
  unifiedContextLines?: number;
  maxUntrackedFiles: number;
  submoduleRecurseDepth: number;
  includeSpaceChanges: boolean;
  committedOnly: boolean;
  computePatchId: boolean;
  returnHeadSha?: boolean;
  maxResponseBytes?: number;
  maxFilesWithContents?: number;
  maxContentBytes?: number;
  outputFormat?: aiserver_v1_GetDiffRequest_OutputFormat;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): aiserver_v1_GetDiffRequest;
  static fromJson(value: JsonValue, options?: JsonReadOptions): aiserver_v1_GetDiffRequest;
  static fromJsonString(value: string, options?: JsonReadOptions): aiserver_v1_GetDiffRequest;
  static equals(a: aiserver_v1_GetDiffRequest | MessageInit<aiserver_v1_GetDiffRequest> | undefined, b: aiserver_v1_GetDiffRequest | MessageInit<aiserver_v1_GetDiffRequest> | undefined): boolean;
}

/** aiserver.v1.GetDiffRequest.OutputFormat; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare enum aiserver_v1_GetDiffRequest_OutputFormat {
  "UNSPECIFIED" = 0,
  "NAME_STATUS" = 1,
  "NAME_STATUS_AND_NUMSTAT" = 2,
  "FILE_DIFFS" = 3,
  "DIFFS_WITH_BEFORE_AND_AFTER" = 4,
}

/** aiserver.v1.GetDiffResponse; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare class aiserver_v1_GetDiffResponse extends ProtoMessage {
  constructor(data?: MessageInit<aiserver_v1_GetDiffResponse>);
  static readonly typeName: "aiserver.v1.GetDiffResponse";
  diff?: aiserver_v1_GitDiff;
  submoduleDiffs: aiserver_v1_GetDiffResponse_SubmoduleDiff[];
  patchId?: string;
  headSha?: string;
  hasUncommittedChanges?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): aiserver_v1_GetDiffResponse;
  static fromJson(value: JsonValue, options?: JsonReadOptions): aiserver_v1_GetDiffResponse;
  static fromJsonString(value: string, options?: JsonReadOptions): aiserver_v1_GetDiffResponse;
  static equals(a: aiserver_v1_GetDiffResponse | MessageInit<aiserver_v1_GetDiffResponse> | undefined, b: aiserver_v1_GetDiffResponse | MessageInit<aiserver_v1_GetDiffResponse> | undefined): boolean;
}

/** aiserver.v1.GetDiffResponse.SubmoduleDiff; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare class aiserver_v1_GetDiffResponse_SubmoduleDiff extends ProtoMessage {
  constructor(data?: MessageInit<aiserver_v1_GetDiffResponse_SubmoduleDiff>);
  static readonly typeName: "aiserver.v1.GetDiffResponse.SubmoduleDiff";
  relativePath: string;
  diff?: aiserver_v1_GitDiff;
  errored: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): aiserver_v1_GetDiffResponse_SubmoduleDiff;
  static fromJson(value: JsonValue, options?: JsonReadOptions): aiserver_v1_GetDiffResponse_SubmoduleDiff;
  static fromJsonString(value: string, options?: JsonReadOptions): aiserver_v1_GetDiffResponse_SubmoduleDiff;
  static equals(a: aiserver_v1_GetDiffResponse_SubmoduleDiff | MessageInit<aiserver_v1_GetDiffResponse_SubmoduleDiff> | undefined, b: aiserver_v1_GetDiffResponse_SubmoduleDiff | MessageInit<aiserver_v1_GetDiffResponse_SubmoduleDiff> | undefined): boolean;
}

/** aiserver.v1.GitDiff; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare class aiserver_v1_GitDiff extends ProtoMessage {
  constructor(data?: MessageInit<aiserver_v1_GitDiff>);
  static readonly typeName: "aiserver.v1.GitDiff";
  diffs: aiserver_v1_FileDiff[];
  diffType: aiserver_v1_GitDiff_DiffType;
  fileContentsOmitted?: boolean;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): aiserver_v1_GitDiff;
  static fromJson(value: JsonValue, options?: JsonReadOptions): aiserver_v1_GitDiff;
  static fromJsonString(value: string, options?: JsonReadOptions): aiserver_v1_GitDiff;
  static equals(a: aiserver_v1_GitDiff | MessageInit<aiserver_v1_GitDiff> | undefined, b: aiserver_v1_GitDiff | MessageInit<aiserver_v1_GitDiff> | undefined): boolean;
}

/** aiserver.v1.GitDiff.DiffType; source: ../proto/dist/generated/aiserver/v1/utils_pb.js */
export declare enum aiserver_v1_GitDiff_DiffType {
  "UNSPECIFIED" = 0,
  "DIFF_TO_HEAD" = 1,
  "DIFF_FROM_BRANCH_TO_MAIN" = 2,
}

/** google.protobuf.ListValue; source: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/google/protobuf/struct_pb.js */
export declare class google_protobuf_ListValue extends ProtoMessage {
  constructor(data?: MessageInit<google_protobuf_ListValue>);
  static readonly typeName: "google.protobuf.ListValue";
  values: google_protobuf_Value[];
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): google_protobuf_ListValue;
  static fromJson(value: JsonValue, options?: JsonReadOptions): google_protobuf_ListValue;
  static fromJsonString(value: string, options?: JsonReadOptions): google_protobuf_ListValue;
  static equals(a: google_protobuf_ListValue | MessageInit<google_protobuf_ListValue> | undefined, b: google_protobuf_ListValue | MessageInit<google_protobuf_ListValue> | undefined): boolean;
}

/** google.protobuf.NullValue; source: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/google/protobuf/struct_pb.js */
export declare enum google_protobuf_NullValue {
  "NULL_VALUE" = 0,
}

/** google.protobuf.Struct; source: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/google/protobuf/struct_pb.js */
export declare class google_protobuf_Struct extends ProtoMessage {
  constructor(data?: MessageInit<google_protobuf_Struct>);
  static readonly typeName: "google.protobuf.Struct";
  fields: Record<string, google_protobuf_Value>;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): google_protobuf_Struct;
  static fromJson(value: JsonValue, options?: JsonReadOptions): google_protobuf_Struct;
  static fromJsonString(value: string, options?: JsonReadOptions): google_protobuf_Struct;
  static equals(a: google_protobuf_Struct | MessageInit<google_protobuf_Struct> | undefined, b: google_protobuf_Struct | MessageInit<google_protobuf_Struct> | undefined): boolean;
}

/** google.protobuf.Timestamp; source: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/google/protobuf/timestamp_pb.js */
export declare class google_protobuf_Timestamp extends ProtoMessage {
  constructor(data?: MessageInit<google_protobuf_Timestamp>);
  static readonly typeName: "google.protobuf.Timestamp";
  seconds: bigint;
  nanos: number;
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): google_protobuf_Timestamp;
  static fromJson(value: JsonValue, options?: JsonReadOptions): google_protobuf_Timestamp;
  static fromJsonString(value: string, options?: JsonReadOptions): google_protobuf_Timestamp;
  static equals(a: google_protobuf_Timestamp | MessageInit<google_protobuf_Timestamp> | undefined, b: google_protobuf_Timestamp | MessageInit<google_protobuf_Timestamp> | undefined): boolean;
}

/** google.protobuf.Value; source: ../../node_modules/.pnpm/@bufbuild+protobuf@1.10.1_patch_hash=b56e7d63154958cee98db228b1c9efd9a1cb20db048af22a56bba107b262264e/node_modules/@bufbuild/protobuf/dist/esm/google/protobuf/struct_pb.js */
export declare class google_protobuf_Value extends ProtoMessage {
  constructor(data?: MessageInit<google_protobuf_Value>);
  static readonly typeName: "google.protobuf.Value";
  kind: { case: "nullValue"; value: google_protobuf_NullValue } | { case: "numberValue"; value: number } | { case: "stringValue"; value: string } | { case: "boolValue"; value: boolean } | { case: "structValue"; value: google_protobuf_Struct } | { case: "listValue"; value: google_protobuf_ListValue } | { case: undefined; value?: undefined };
  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): google_protobuf_Value;
  static fromJson(value: JsonValue, options?: JsonReadOptions): google_protobuf_Value;
  static fromJsonString(value: string, options?: JsonReadOptions): google_protobuf_Value;
  static equals(a: google_protobuf_Value | MessageInit<google_protobuf_Value> | undefined, b: google_protobuf_Value | MessageInit<google_protobuf_Value> | undefined): boolean;
}

export interface ControlServiceDescriptor {
  readonly typeName: "agent.v1.ControlService";
  readonly methods: {
    ping: { name: "Ping"; I: typeof agent_v1_PingRequest; O: typeof agent_v1_PingResponse; kind: 0 };
    getCapabilities: { name: "GetCapabilities"; I: typeof agent_v1_GetCapabilitiesRequest; O: typeof agent_v1_GetCapabilitiesResponse; kind: 0 };
    exec: { name: "Exec"; I: typeof agent_v1_ExecRequest; O: typeof agent_v1_ExecResponse; kind: 1 };
    listDirectory: { name: "ListDirectory"; I: typeof agent_v1_ListDirectoryRequest; O: typeof agent_v1_ListDirectoryResponse; kind: 0 };
    readTextFile: { name: "ReadTextFile"; I: typeof agent_v1_ReadTextFileRequest; O: typeof agent_v1_ReadTextFileResponse; kind: 0 };
    writeTextFile: { name: "WriteTextFile"; I: typeof agent_v1_WriteTextFileRequest; O: typeof agent_v1_WriteTextFileResponse; kind: 0 };
    readBinaryFile: { name: "ReadBinaryFile"; I: typeof agent_v1_ReadBinaryFileRequest; O: typeof agent_v1_ReadBinaryFileResponse; kind: 0 };
    writeBinaryFile: { name: "WriteBinaryFile"; I: typeof agent_v1_WriteBinaryFileRequest; O: typeof agent_v1_WriteBinaryFileResponse; kind: 0 };
    exportFile: { name: "ExportFile"; I: typeof agent_v1_ExportFileRequest; O: typeof agent_v1_ExportFileResponse; kind: 1 };
    getDiff: { name: "GetDiff"; I: typeof aiserver_v1_GetDiffRequest; O: typeof aiserver_v1_GetDiffResponse; kind: 0 };
    batchGetDiff: { name: "BatchGetDiff"; I: typeof agent_v1_BatchGetDiffRequest; O: typeof agent_v1_BatchGetDiffResponse; kind: 0 };
    getWorkspaceChangesHash: { name: "GetWorkspaceChangesHash"; I: typeof agent_v1_GetWorkspaceChangesHashRequest; O: typeof agent_v1_GetWorkspaceChangesHashResponse; kind: 0 };
    refreshGithubAccessToken: { name: "RefreshGithubAccessToken"; I: typeof agent_v1_RefreshGithubAccessTokenRequest; O: typeof agent_v1_RefreshGithubAccessTokenResponse; kind: 0 };
    warmRemoteAccessServer: { name: "WarmRemoteAccessServer"; I: typeof agent_v1_WarmRemoteAccessServerRequest; O: typeof agent_v1_WarmRemoteAccessServerResponse; kind: 0 };
    listArtifacts: { name: "ListArtifacts"; I: typeof agent_v1_ListArtifactsRequest; O: typeof agent_v1_ListArtifactsResponse; kind: 0 };
    uploadArtifacts: { name: "UploadArtifacts"; I: typeof agent_v1_UploadArtifactsRequest; O: typeof agent_v1_UploadArtifactsResponse; kind: 0 };
    persistArtifactsToAgentStore: { name: "PersistArtifactsToAgentStore"; I: typeof agent_v1_PersistArtifactsToAgentStoreRequest; O: typeof agent_v1_PersistArtifactsToAgentStoreResponse; kind: 0 };
    persistArtifactsToParentStore: { name: "PersistArtifactsToParentStore"; I: typeof agent_v1_PersistArtifactsToParentStoreRequest; O: typeof agent_v1_PersistArtifactsToParentStoreResponse; kind: 0 };
    restoreArtifacts: { name: "RestoreArtifacts"; I: typeof agent_v1_RestoreArtifactsRequest; O: typeof agent_v1_RestoreArtifactsResponse; kind: 0 };
    getMcpRefreshTokens: { name: "GetMcpRefreshTokens"; I: typeof agent_v1_GetMcpRefreshTokensRequest; O: typeof agent_v1_GetMcpRefreshTokensResponse; kind: 0 };
    downloadCursorServer: { name: "DownloadCursorServer"; I: typeof agent_v1_DownloadCursorServerRequest; O: typeof agent_v1_DownloadCursorServerResponse; kind: 0 };
    updateEnvironmentVariables: { name: "UpdateEnvironmentVariables"; I: typeof agent_v1_UpdateEnvironmentVariablesRequest; O: typeof agent_v1_UpdateEnvironmentVariablesResponse; kind: 0 };
    syncScopedSecrets: { name: "SyncScopedSecrets"; I: typeof agent_v1_SyncScopedSecretsRequest; O: typeof agent_v1_SyncScopedSecretsResponse; kind: 0 };
    reloadAgentSkills: { name: "ReloadAgentSkills"; I: typeof agent_v1_ReloadAgentSkillsRequest; O: typeof agent_v1_ReloadAgentSkillsResponse; kind: 0 };
    reloadPlugins: { name: "ReloadPlugins"; I: typeof agent_v1_ReloadPluginsRequest; O: typeof agent_v1_ReloadPluginsResponse; kind: 0 };
    installPluginArtifact: { name: "InstallPluginArtifact"; I: typeof agent_v1_InstallPluginArtifactRequest; O: typeof agent_v1_InstallPluginArtifactResponse; kind: 0 };
    loadMcpServers: { name: "LoadMcpServers"; I: typeof agent_v1_LoadMcpServersRequest; O: typeof agent_v1_LoadMcpServersResponse; kind: 0 };
    desktopLease: { name: "DesktopLease"; I: typeof agent_v1_DesktopLeaseRequest; O: typeof agent_v1_DesktopLeaseResponse; kind: 0 };
    getResourceUsage: { name: "GetResourceUsage"; I: typeof agent_v1_GetResourceUsageRequest; O: typeof agent_v1_GetResourceUsageResponse; kind: 0 };
  };
}

export interface ExecServiceDescriptor {
  readonly typeName: "agent.v1.ExecService";
  readonly methods: {
    exec: { name: "Exec"; I: typeof agent_v1_ExecServerMessage; O: typeof agent_v1_ExecStreamElement; kind: 1 };
    readFile: { name: "ReadFile"; I: typeof agent_v1_ReadFileRequest; O: typeof agent_v1_ReadFileResponse; kind: 1 };
  };
}

export interface PtyHostServiceDescriptor {
  readonly typeName: "agent.v1.PtyHostService";
  readonly methods: {
    spawnPty: { name: "SpawnPty"; I: typeof agent_v1_SpawnPtyRequest; O: typeof agent_v1_SpawnPtyResponse; kind: 0 };
    attachPty: { name: "AttachPty"; I: typeof agent_v1_AttachPtyRequest; O: typeof agent_v1_PtyEvent; kind: 1 };
    sendInput: { name: "SendInput"; I: typeof agent_v1_SendInputRequest; O: typeof agent_v1_SendInputResponse; kind: 0 };
    resizePty: { name: "ResizePty"; I: typeof agent_v1_ResizePtyRequest; O: typeof agent_v1_ResizePtyResponse; kind: 0 };
    listPtys: { name: "ListPtys"; I: typeof agent_v1_ListPtysRequest; O: typeof agent_v1_ListPtysResponse; kind: 0 };
    terminatePty: { name: "TerminatePty"; I: typeof agent_v1_TerminatePtyRequest; O: typeof agent_v1_TerminatePtyResponse; kind: 0 };
  };
}

export interface TmuxSessionServiceDescriptor {
  readonly typeName: "agent.v1.TmuxSessionService";
  readonly methods: {
    createSession: { name: "CreateSession"; I: typeof agent_v1_CreateTmuxSessionRequest; O: typeof agent_v1_CreateTmuxSessionResponse; kind: 0 };
    listSessions: { name: "ListSessions"; I: typeof agent_v1_ListTmuxSessionsRequest; O: typeof agent_v1_ListTmuxSessionsResponse; kind: 0 };
    killSession: { name: "KillSession"; I: typeof agent_v1_KillTmuxSessionRequest; O: typeof agent_v1_KillTmuxSessionResponse; kind: 0 };
    attachSession: { name: "AttachSession"; I: typeof agent_v1_AttachTmuxSessionRequest; O: typeof agent_v1_AttachTmuxSessionResponse; kind: 0 };
  };
}

declare module "../modules.js" {
  interface ExternalModules {
    "../proto/dist/generated/agent/v1/control_service_pb.js": {
      "$Y": typeof agent_v1_EntryType;
      "A9": typeof agent_v1_DesktopLeaseRequest;
      "AH": typeof agent_v1_UploadArtifactsRequest;
      "Bd": typeof agent_v1_ExitEvent;
      "Ce": typeof agent_v1_UploadArtifactsResponse;
      "Cg": typeof agent_v1_PersistArtifactToAgentStoreStatus;
      "D3": typeof agent_v1_ReloadPluginsRequest;
      "D7": typeof agent_v1_ExecRequest;
      "D9": typeof agent_v1_PersistArtifactsToParentStoreRequest;
      "Eb": typeof agent_v1_BatchGetDiffError;
      "Em": typeof agent_v1_StdoutEvent;
      "Er": typeof agent_v1_WarmRemoteAccessServerRequest;
      "FG": typeof agent_v1_ListArtifactsRequest;
      "G3": typeof agent_v1_BatchGetDiffErrorKind;
      "I": typeof agent_v1_LoadMcpServersResponse;
      "JO": typeof agent_v1_DownloadCursorServerRequest;
      "JZ": typeof agent_v1_ResourceSample;
      "Jm": typeof agent_v1_RefreshGithubAccessTokenResponse;
      "K4": typeof agent_v1_DirectoryEntry;
      "Ks": typeof agent_v1_WarmRemoteAccessServerResponse;
      "LC": typeof agent_v1_StderrEvent;
      "M7": typeof agent_v1_ArtifactUploadStatus;
      "MA": typeof agent_v1_DesktopLeaseActorKind;
      "Mj": typeof agent_v1_DesktopLeaseResponse;
      "Nj": typeof agent_v1_DownloadCursorServerResponse;
      "OS": typeof agent_v1_WriteBinaryFileRequest;
      "OT": typeof agent_v1_PersistArtifactsToAgentStoreRequest;
      "QW": typeof agent_v1_RestoreArtifactResult;
      "Qj": typeof agent_v1_ReloadAgentSkillsRequest;
      "Qp": typeof agent_v1_WriteBinaryFileResponse;
      "RE": typeof agent_v1_GetResourceUsageResponse;
      "RH": typeof agent_v1_GetMcpRefreshTokensRequest;
      "Rz": typeof agent_v1_ListDirectoryResponse;
      "Sv": typeof agent_v1_GetWorkspaceChangesHashRequest;
      "TL": typeof agent_v1_GetMcpRefreshTokensResponse;
      "TT": typeof agent_v1_ArtifactUploadDispatchResult;
      "TV": typeof agent_v1_ReadBinaryFileResponse;
      "UL": typeof agent_v1_ArtifactPathErrorKind;
      "V2": typeof agent_v1_DesktopLeaseStatus;
      "Vd": typeof agent_v1_RefreshGithubAccessTokenRequest;
      "Wz": typeof agent_v1_WriteTextFileRequest;
      "YM": typeof agent_v1_DesktopLeaseOwner;
      "YQ": typeof agent_v1_ExportFileRequest;
      "Y_": typeof agent_v1_GetWorkspaceChangesHashResponse;
      "b0": typeof agent_v1_ArtifactUploadMetadata;
      "b3": typeof agent_v1_ReadTextFileRequest;
      "cQ": typeof agent_v1_GetCapabilitiesRequest;
      "dj": typeof agent_v1_ReloadPluginsResponse;
      "eJ": typeof agent_v1_PingResponse;
      "eb": typeof agent_v1_WriteTextFileResponse;
      "f": typeof agent_v1_PersistArtifactsToParentStoreResponse;
      "fV": typeof agent_v1_ListDirectoryRequest;
      "fY": typeof agent_v1_ExecResponse;
      "fi": typeof agent_v1_BatchGetDiffRequest;
      "hO": typeof agent_v1_BatchGetDiffResponse;
      "i1": typeof agent_v1_ArtifactUploadDispatchStatus;
      "i5": typeof agent_v1_LoadMcpServersRequest;
      "kM": typeof agent_v1_InstallPluginArtifactRequest;
      "mc": typeof agent_v1_ExportFileMetadata;
      "nS": typeof agent_v1_ReadBinaryFileRequest;
      "o_": typeof agent_v1_ExportFileResponse;
      "p$": typeof agent_v1_BatchGetDiffResult;
      "pj": typeof agent_v1_PersistArtifactToAgentStoreResult;
      "pl": typeof agent_v1_ListArtifactsResponse;
      "pt": typeof agent_v1_RestoreArtifactsResponse;
      "q2": typeof agent_v1_ReloadAgentSkillsResponse;
      "qM": typeof agent_v1_SyncScopedSecretsResponse;
      "qp": typeof agent_v1_PingRequest;
      "r": typeof agent_v1_ResourceScope;
      "rk": typeof agent_v1_GetResourceUsageRequest;
      "sD": typeof agent_v1_SyncScopedSecretsRequest;
      "sK": typeof agent_v1_PersistArtifactsToAgentStoreResponse;
      "t3": typeof agent_v1_UpdateEnvironmentVariablesRequest;
      "tA": typeof agent_v1_RestoreArtifactsRequest;
      "tZ": typeof agent_v1_BatchGetDiffUnchanged;
      "u7": typeof agent_v1_ResourcePressure;
      "uR": typeof agent_v1_ArtifactPathError;
      "v$": typeof agent_v1_ArtifactRootKind;
      "vF": typeof agent_v1_ResourceLimits;
      "vy": typeof agent_v1_ReadTextFileResponse;
      "wY": typeof agent_v1_InstallPluginArtifactResponse;
      "y3": typeof agent_v1_GetCapabilitiesResponse;
      "zb": typeof agent_v1_ArtifactRestoreStatus;
      "zj": typeof agent_v1_UpdateEnvironmentVariablesResponse;
    };
    "../proto/dist/generated/agent/v1/exec_pb.js": {
      "$Y": typeof agent_v1_ExecClientControlMessage;
      "VA": typeof agent_v1_ExecClientHeartbeat;
      "yT": typeof agent_v1_ExecClientMessage;
      "D9": typeof agent_v1_ExecClientStreamClose;
      "Fu": typeof agent_v1_ExecClientThrow;
      "Ye": typeof agent_v1_ExecServerMessage;
      "w5": typeof agent_v1_ExecuteHookResponse;
      "S1": typeof agent_v1_ExecuteHookResult;
      "Kg": typeof agent_v1_SpanContext;
    };
    "../proto/dist/generated/agent/v1/pty_host_service_pb.js": {
      "Bk": typeof agent_v1_ResizePtyRequest;
      "E_": typeof agent_v1_SendInputResponse;
      "G": typeof agent_v1_PtyEvent;
      "I$": typeof agent_v1_PtyInfo;
      "Jz": typeof agent_v1_ResizePtyResponse;
      "M0": typeof agent_v1_Process;
      "MR": typeof agent_v1_SpawnPtyRequest;
      "SE": typeof agent_v1_PtyData;
      "SW": typeof agent_v1_SpawnPtyResponse;
      "_q": typeof agent_v1_TerminatePtyRequest;
      "cL": typeof agent_v1_TerminatePtyResponse;
      "e7": typeof agent_v1_ListPtysRequest;
      "h2": typeof agent_v1_PtyExited;
      "iB": typeof agent_v1_ListPtysResponse;
      "ss": typeof agent_v1_SendInputRequest;
      "st": typeof agent_v1_AttachPtyRequest;
    };
    "../proto/dist/generated/agent/v1/request_context_exec_pb.js": {
      "DS": typeof agent_v1_GitRepoInfo;
      "Jy": typeof agent_v1_HooksConfigInfo;
      "bb": typeof agent_v1_RequestContext;
      "_K": typeof agent_v1_RequestContextArgs;
      "GE": typeof agent_v1_RequestContextEnv;
      "nf": typeof agent_v1_RequestContextError;
      "_G": typeof agent_v1_RequestContextResult;
      "yW": typeof agent_v1_RequestContextSuccess;
    };
    "../proto/dist/generated/agent/v1/shell_exec_pb.js": {
      "$F": typeof agent_v1_ShellOutputNotificationConfig;
      "Db": typeof agent_v1_ShellStreamStderr;
      "E4": typeof agent_v1_CommandClassifierResult;
      "FI": typeof agent_v1_ShellStream;
      "HO": typeof agent_v1_ShellCommandParsingResult;
      "Hu": typeof agent_v1_ForceBackgroundShellArgs;
      "In": typeof agent_v1_ShellHookApprovalRequirement;
      "Jg": typeof agent_v1_ShellBackgroundReason;
      "Lv": typeof agent_v1_ShellAbortReason;
      "Ng": typeof agent_v1_ShellStreamHookContext;
      "QR": typeof agent_v1_ShellSuccess;
      "R_": typeof agent_v1_ShellOomKill_Kind;
      "W4": typeof agent_v1_ShellResult;
      "Y9": typeof agent_v1_ShellStreamBackgrounded;
      "_d": typeof agent_v1_TimeoutBehavior;
      "a": typeof agent_v1_ShellArgs;
      "b": typeof agent_v1_ShellHookApprovalRequirement_Kind;
      "eG": typeof agent_v1_ShellTimeout;
      "iA": typeof agent_v1_ForceBackgroundShellStatus;
      "iH": typeof agent_v1_ShellOomKill;
      "jK": typeof agent_v1_ForceBackgroundShellResult;
      "jn": typeof agent_v1_ShellPermissionDenied;
      "mJ": typeof agent_v1_ShellSpawnError;
      "o0": typeof agent_v1_ShellStreamStdout;
      "pZ": typeof agent_v1_ShellRejected;
      "rI": typeof agent_v1_ShellSandboxUnsupported;
      "tD": typeof agent_v1_ShellStreamStart;
      "vb": typeof agent_v1_ShellStreamExit;
      "xC": typeof agent_v1_ShellFailure;
    };
    "../proto/dist/generated/agent/v1/tmux_session_service_pb.js": {
      "Cd": typeof agent_v1_CreateTmuxSessionResponse;
      "GP": typeof agent_v1_KillTmuxSessionRequest;
      "Lw": typeof agent_v1_AttachTmuxSessionRequest;
      "fq": typeof agent_v1_ListTmuxSessionsRequest;
      "nx": typeof agent_v1_ListTmuxSessionsResponse;
      "pk": typeof agent_v1_TmuxSession;
      "pz": typeof agent_v1_TmuxSessionKind;
      "rt": typeof agent_v1_AttachTmuxSessionResponse;
      "su": typeof agent_v1_KillTmuxSessionResponse;
      "uL": typeof agent_v1_CreateTmuxSessionRequest;
    };
    "../proto/dist/generated/aiserver/v1/utils_pb.js": {
      "Ei": typeof aiserver_v1_FileDiff_Chunk;
      "QP": typeof aiserver_v1_FileDiff;
      "Vq": typeof aiserver_v1_GetDiffRequest;
      "Wf": typeof aiserver_v1_GitDiff_DiffType;
      "df": typeof aiserver_v1_GetDiffResponse;
      "ek": typeof aiserver_v1_GetDiffRequest_OutputFormat;
      "o$": typeof aiserver_v1_GitDiff;
    };
  }
}
