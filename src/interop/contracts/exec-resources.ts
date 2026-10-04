/** Resource payloads reconstructed from the preserved agent-exec factory's serializers. */
import type { Resource, Executor, StreamExecutor } from "./agent-exec.js";
import type { agent_v1_ExecServerMessage, agent_v1_ExecClientMessage } from "./protobuf-generated.js";
type Payload<Message, Case extends string> = Message extends { case: Case; value: infer Value } ? Value : never;
declare module "./agent-exec.js" {
  interface AgentExecModule {
    /** agentStoreConflictExecutorResource: retained serializer/deserializer cases. */
    iul: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "agentStoreConflictArgs">, Payload<agent_v1_ExecClientMessage["message"], "agentStoreConflictResult">>>;
    /** backgroundShellExecutorResource: retained serializer/deserializer cases. */
    OkD: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "backgroundShellSpawnArgs">, Payload<agent_v1_ExecClientMessage["message"], "backgroundShellSpawnResult">>>;
    /** writeBackgroundShellInputExecutorResource: retained serializer/deserializer cases. */
    TQC: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "writeShellStdinArgs">, Payload<agent_v1_ExecClientMessage["message"], "writeShellStdinResult">>>;
    /** canvasDiagnosticsExecutorResource: retained serializer/deserializer cases. */
    sOX: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "canvasDiagnosticsArgs">, Payload<agent_v1_ExecClientMessage["message"], "canvasDiagnosticsResult">>>;
    /** computerUseExecutorResource: retained serializer/deserializer cases. */
    iZk: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "computerUseArgs">, Payload<agent_v1_ExecClientMessage["message"], "computerUseResult">>>;
    /** deleteExecutorResource: retained serializer/deserializer cases. */
    RpG: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "deleteArgs">, Payload<agent_v1_ExecClientMessage["message"], "deleteResult">>>;
    /** diagnosticsExecutorResource: retained serializer/deserializer cases. */
    w4j: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "diagnosticsArgs">, Payload<agent_v1_ExecClientMessage["message"], "diagnosticsResult">>>;
    /** fetchExecutorResource: retained serializer/deserializer cases. */
    IGA: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "fetchArgs">, Payload<agent_v1_ExecClientMessage["message"], "fetchResult">>>;
    /** gitDiffExecutorResource: retained serializer/deserializer cases. */
    jH1: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "gitDiffRequest">, Payload<agent_v1_ExecClientMessage["message"], "gitDiffResponse">>>;
    /** grepExecutorResource: retained serializer/deserializer cases. */
    u8v: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "grepArgs">, Payload<agent_v1_ExecClientMessage["message"], "grepResult">>>;
    /** hookExecutorResource: retained serializer/deserializer cases. */
    bob: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "executeHookArgs">, Payload<agent_v1_ExecClientMessage["message"], "executeHookResult">>>;
    /** lsExecutorResource: retained serializer/deserializer cases. */
    bL4: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "lsArgs">, Payload<agent_v1_ExecClientMessage["message"], "lsResult">>>;
    /** mcpExecutorResource: retained serializer/deserializer cases. */
    Yib: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "mcpArgs">, Payload<agent_v1_ExecClientMessage["message"], "mcpResult">>>;
    /** listMcpResourcesExecutorResource: retained serializer/deserializer cases. */
    rn8: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "listMcpResourcesExecArgs">, Payload<agent_v1_ExecClientMessage["message"], "listMcpResourcesExecResult">>>;
    /** readMcpResourceExecutorResource: retained serializer/deserializer cases. */
    mlu: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "readMcpResourceExecArgs">, Payload<agent_v1_ExecClientMessage["message"], "readMcpResourceExecResult">>>;
    /** mcpStateExecutorResource: retained serializer/deserializer cases. */
    pY2: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "mcpStateExecArgs">, Payload<agent_v1_ExecClientMessage["message"], "mcpStateExecResult">>>;
    /** mcpAllowlistPrecheckExecutorResource: retained serializer/deserializer cases. */
    ODj: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "mcpAllowlistPrecheckArgs">, Payload<agent_v1_ExecClientMessage["message"], "mcpAllowlistPrecheckResult">>>;
    /** readExecutorResource: retained serializer/deserializer cases. */
    _As: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "readArgs">, Payload<agent_v1_ExecClientMessage["message"], "readResult">>>;
    /** redactedReadExecutorResource: retained serializer/deserializer cases. */
    Mfc: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "redactedReadArgs">, Payload<agent_v1_ExecClientMessage["message"], "redactedReadResult">>>;
    /** miniSweAgentBashExecutorResource: retained serializer/deserializer cases. */
    JP: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "miniSweAgentBashArgs">, Payload<agent_v1_ExecClientMessage["message"], "miniSweAgentBashResult">>>;
    /** piBashExecutorResource: retained serializer/deserializer cases. */
    TZ: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "piBashArgs">, Payload<agent_v1_ExecClientMessage["message"], "piBashResult">>>;
    /** piEditExecutorResource: retained serializer/deserializer cases. */
    PiX: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "piEditArgs">, Payload<agent_v1_ExecClientMessage["message"], "piEditResult">>>;
    /** piFindExecutorResource: retained serializer/deserializer cases. */
    ghi: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "piFindArgs">, Payload<agent_v1_ExecClientMessage["message"], "piFindResult">>>;
    /** piGrepExecutorResource: retained serializer/deserializer cases. */
    Rdb: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "piGrepArgs">, Payload<agent_v1_ExecClientMessage["message"], "piGrepResult">>>;
    /** piLsExecutorResource: retained serializer/deserializer cases. */
    qNu: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "piLsArgs">, Payload<agent_v1_ExecClientMessage["message"], "piLsResult">>>;
    /** piReadExecutorResource: retained serializer/deserializer cases. */
    T0F: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "piReadArgs">, Payload<agent_v1_ExecClientMessage["message"], "piReadResult">>>;
    /** piWriteExecutorResource: retained serializer/deserializer cases. */
    ohZ: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "piWriteArgs">, Payload<agent_v1_ExecClientMessage["message"], "piWriteResult">>>;
    /** shellExecutorResource: retained serializer/deserializer cases. */
    qkk: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "shellArgs">, Payload<agent_v1_ExecClientMessage["message"], "shellResult">>>;
    /** writeExecutorResource: retained serializer/deserializer cases. */
    Lnu: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "writeArgs">, Payload<agent_v1_ExecClientMessage["message"], "writeResult">>>;
    /** recordScreenExecutorResource: retained serializer/deserializer cases. */
    pq5: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "recordScreenArgs">, Payload<agent_v1_ExecClientMessage["message"], "recordScreenResult">>>;
    /** requestContextExecutorResource: retained serializer/deserializer cases. */
    MZM: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "requestContextArgs">, Payload<agent_v1_ExecClientMessage["message"], "requestContextResult">>>;
    /** shellAllowlistPrecheckExecutorResource: retained serializer/deserializer cases. */
    GuN: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "shellAllowlistPrecheckArgs">, Payload<agent_v1_ExecClientMessage["message"], "shellAllowlistPrecheckResult">>>;
    /** forceBackgroundShellExecutorResource: retained serializer/deserializer cases. */
    PEk: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "forceBackgroundShellArgs">, Payload<agent_v1_ExecClientMessage["message"], "forceBackgroundShellResult">>>;
    /** webFetchAllowlistPrecheckExecutorResource: retained serializer/deserializer cases. */
    sC3: Resource<Executor<Payload<agent_v1_ExecServerMessage["message"], "webFetchAllowlistPrecheckArgs">, Payload<agent_v1_ExecClientMessage["message"], "webFetchAllowlistPrecheckResult">>>;
  }
}
