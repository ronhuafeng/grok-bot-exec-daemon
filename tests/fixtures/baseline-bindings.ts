// Pinned baseline-only ABI. Never used to load or rewrite candidate modules.
export const baselineBindings: Readonly<Record<string, readonly BaselineBinding[]>> = {
  "artifactUploads": [
    {"old":"_anysphere_agent_core_server__WEBPACK_IMPORTED_MODULE_7__","module":"../interop/vendor/agent-core-cloud-agent-artifact-paths.js","kind":"namespace","exports":{"XJ":"AGENT_STORE_INTERNAL_ROOT_DIRECTORY","rK":"toAgentStoreArtifactPath","vR":"toArtifactRelativePath","kp":"fromArtifactRelativePath","KJ":"fromAgentStoreArtifactPath","hG":"AGENT_STORE_ARTIFACTS_PREFIX","Yk":"normalizeCloudAgentArtifactAbsolutePath"}},
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_8__","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"_anysphere_proto_agent_v1_control_service_pb_js__WEBPACK_IMPORTED_MODULE_9__","module":"../interop/vendor/proto-agent-v1-control-service-pb.js","kind":"namespace","exports":{"M7":"ArtifactUploadStatus","b0":"ArtifactUploadMetadata","sK":"PersistArtifactsToAgentStoreResponse","Cg":"PersistArtifactToAgentStoreStatus","f":"PersistArtifactsToParentStoreResponse","pj":"PersistArtifactToAgentStoreResult","TT":"ArtifactUploadDispatchResult","i1":"ArtifactUploadDispatchStatus","Ce":"UploadArtifactsResponse","pt":"RestoreArtifactsResponse","QW":"RestoreArtifactResult","zb":"ArtifactRestoreStatus","r":"ResourceScope","u7":"ResourcePressure","vF":"ResourceLimits","RE":"GetResourceUsageResponse","JZ":"ResourceSample","V2":"DesktopLeaseStatus","MA":"DesktopLeaseActorKind","Mj":"DesktopLeaseResponse","YM":"DesktopLeaseOwner","wY":"InstallPluginArtifactResponse","eJ":"PingResponse","y3":"GetCapabilitiesResponse","qM":"SyncScopedSecretsResponse","q2":"ReloadAgentSkillsResponse","dj":"ReloadPluginsResponse","I":"LoadMcpServersResponse","fY":"ExecResponse","Em":"StdoutEvent","LC":"StderrEvent","Bd":"ExitEvent","$Y":"EntryType","K4":"DirectoryEntry","Rz":"ListDirectoryResponse","vy":"ReadTextFileResponse","eb":"WriteTextFileResponse","TV":"ReadBinaryFileResponse","o_":"ExportFileResponse","mc":"ExportFileMetadata","Qp":"WriteBinaryFileResponse","G3":"BatchGetDiffErrorKind","p$":"BatchGetDiffResult","tZ":"BatchGetDiffUnchanged","hO":"BatchGetDiffResponse","Eb":"BatchGetDiffError","Y_":"GetWorkspaceChangesHashResponse","Jm":"RefreshGithubAccessTokenResponse","Ks":"WarmRemoteAccessServerResponse","Nj":"DownloadCursorServerResponse","v$":"ArtifactRootKind","pl":"ListArtifactsResponse","uR":"ArtifactPathError","UL":"ArtifactPathErrorKind","TL":"GetMcpRefreshTokensResponse","t3":"UpdateEnvironmentVariablesRequest","zj":"UpdateEnvironmentVariablesResponse"}},
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_10__","module":"../interop/vendor/utils-path-utils.js","kind":"namespace","exports":{"ZU":"isPathWithin"}},
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_11__","module":"../interop/vendor/utils-promise-extras.js","kind":"namespace","exports":{"PH":"asyncMapValues","up":"asyncMapSettledValues","wj":"withTimeout","MU":"TimeoutError"}},
    {"old":"node_crypto__WEBPACK_IMPORTED_MODULE_0__","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"node_fs__WEBPACK_IMPORTED_MODULE_1__","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"node_fs_promises__WEBPACK_IMPORTED_MODULE_2___default","module":"node:fs/promises","kind":"default"},
    {"old":"node_os__WEBPACK_IMPORTED_MODULE_3__","module":"node:os","kind":"namespace","exports":{"tmpdir":"tmpdir","homedir":"homedir"}},
    {"old":"node_path__WEBPACK_IMPORTED_MODULE_4___default","module":"node:path","kind":"default"},
    {"old":"node_stream__WEBPACK_IMPORTED_MODULE_5__","module":"node:stream","kind":"namespace","exports":{"Readable":"Readable","Transform":"Transform"}},
    {"old":"node_stream_promises__WEBPACK_IMPORTED_MODULE_6__","module":"node:stream/promises","kind":"namespace","exports":{"pipeline":"pipeline"}}
  ],
  "bundledToolPath": [
    {"old":"node_path__WEBPACK_IMPORTED_MODULE_0___default","module":"node:path","kind":"default"}
  ],
  "comma-separated-names": [

  ],
  "fuseLiveness": [
    {"old":"_anysphere_constants__WEBPACK_IMPORTED_MODULE_4__","module":"../interop/vendor/constants-agent-store-fuse.js","kind":"namespace","exports":{"Xb":"AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE","HH":"AGENT_STORE_FUSE_PID_FILE","rM":"AGENT_STORE_FUSE_DISPATCH_WEDGE_REPORT_PATH","YE":"AGENT_STORE_FUSE_RELAUNCH_REASON_PATH"}},
    {"old":"_anysphere_constants__WEBPACK_IMPORTED_MODULE_5__","module":"../interop/vendor/constants-agent-store-ids.js","kind":"namespace","exports":{"f":"AGENT_STORE_MOUNT_ROOT","EN":"CLOUD_CANVAS_SOURCE_BASENAME","ur":"CANVAS_STORE_PERSIST_ROOTS"}},
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_6__","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_7__","module":"../interop/vendor/context-otel.js","kind":"namespace","exports":{"HF":"reportEvent","fR":"withSpan","fU":"getSpan","Mf":"withInheritableAttribute","V5":"createContextFromSpanContext","Rm":"SPAN_KEY"}},
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_8__","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}},
    {"old":"node_child_process__WEBPACK_IMPORTED_MODULE_0__","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"node_fs__WEBPACK_IMPORTED_MODULE_1__","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"node_os__WEBPACK_IMPORTED_MODULE_2___default","module":"node:os","kind":"default"},
    {"old":"node_path__WEBPACK_IMPORTED_MODULE_3___default","module":"node:path","kind":"default"}
  ],
  "cat-file-batch": [

  ],
  "git-name-status": [

  ],
  "managed-git-credentials": [
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_os_default","module":"node:os","kind":"default"},
    {"old":"external_node_path_","module":"node:path","kind":"namespace","exports":{"join":"join","resolve":"resolve"}},
    {"old":"external_node_util_default","module":"node:util","kind":"default"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"secretRedaction","module":"./secretRedaction.js","kind":"namespace","exports":{"o5":"SYNTHETIC_GIT_AUTH_USERNAMES","wM":"refreshCachedGitAuthTokens","gz":"CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR","l1":"CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR","hK":"ALWAYS_REDACTED_ENV_SECRET_NAMES","LK":"SecretRedactionState"}},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "git": [
    {"old":"CatFileBatchOutputParser","module":"./cat-file-batch.js","kind":"owned","name":"CatFileBatchOutputParser"},
    {"old":"KNOWN_GIT_CLONE_USERNAMES","module":"./managed-git-credentials.js","kind":"owned","name":"KNOWN_GIT_CLONE_USERNAMES"},
    {"old":"dist","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"external_node_util_default","module":"node:util","kind":"default"},
    {"old":"generated_file_detection","module":"../interop/vendor/git-core-generated-file-detection.js","kind":"namespace","exports":{"zM":"checkFilesGenerated"}},
    {"old":"getGhConfigPaths","module":"./managed-git-credentials.js","kind":"owned","name":"getGhConfigPaths"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"markGhConfigManaged","module":"./managed-git-credentials.js","kind":"owned","name":"markGhConfigManaged"},
    {"old":"numstatBigFileThreshold","module":"./git-name-status.js","kind":"owned","name":"numstatBigFileThreshold"},
    {"old":"parseCatFileBatchCheck","module":"./cat-file-batch.js","kind":"owned","name":"parseCatFileBatchCheck"},
    {"old":"parseNumstatZ","module":"./git-name-status.js","kind":"owned","name":"parseNumstatZ"},
    {"old":"parseRawDiffZ","module":"./git-name-status.js","kind":"owned","name":"parseRawDiffZ"},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"recordManagedGitAuthScopeMarker","module":"./managed-git-credentials.js","kind":"owned","name":"recordManagedGitAuthScopeMarker"},
    {"old":"removeManagedGitCredentials","module":"./managed-git-credentials.js","kind":"owned","name":"removeManagedGitCredentials"},
    {"old":"removeTokenizedInsteadOfRewrites","module":"./managed-git-credentials.js","kind":"owned","name":"removeTokenizedInsteadOfRewrites"},
    {"old":"repo_url","module":"../interop/vendor/utils-repo-url.js","kind":"namespace","exports":{"Wo":"buildRepoUrlForAuthRefresh","A9":"trimRemotePath","UG":"parseOriginRepoCloneUrlParts","gT":"normalizeRepoUrlForAuthLookup","Ol":"getBoundedRepoAuthPathname"}},
    {"old":"secretRedaction","module":"./secretRedaction.js","kind":"namespace","exports":{"o5":"SYNTHETIC_GIT_AUTH_USERNAMES","wM":"refreshCachedGitAuthTokens","gz":"CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR","l1":"CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR","hK":"ALWAYS_REDACTED_ENV_SECRET_NAMES","LK":"SecretRedactionState"}},
    {"old":"utils_pb","module":"../interop/vendor/proto-aiserver-v1-utils-pb.js","kind":"namespace","exports":{"QP":"FileDiff","Ei":"FileDiff_Chunk","o$":"GitDiff","Wf":"GitDiff_DiffType","ek":"GetDiffRequest_OutputFormat","df":"GetDiffResponse"}},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "index": [
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_0__","module":"../interop/vendor/context-core.js","kind":"namespace","exports":{"q6":"createContext"}},
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_1__","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_2__","module":"../interop/vendor/context-otel.js","kind":"namespace","exports":{"HF":"reportEvent","fR":"withSpan","fU":"getSpan","Mf":"withInheritableAttribute","V5":"createContextFromSpanContext","Rm":"SPAN_KEY"}},
    {"old":"_anysphere_hooks__WEBPACK_IMPORTED_MODULE_3__","module":"../interop/vendor/hooks.js","kind":"namespace","exports":{"S6":"getCommandHookPayloadTransport"}},
    {"old":"_anysphere_local_exec__WEBPACK_IMPORTED_MODULE_4__","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"_anysphere_orbit_client__WEBPACK_IMPORTED_MODULE_5__","module":"../interop/vendor/orbit-client.js","kind":"namespace","exports":{"nz":"createOrbitOperationReporter"}},
    {"old":"_anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_6__","module":"../interop/vendor/proto-agent-v1-request-context-exec-pb.js","kind":"namespace","exports":{"_K":"RequestContextArgs","bb":"RequestContext","_G":"RequestContextResult","yW":"RequestContextSuccess","nf":"RequestContextError"}},
    {"old":"_anysphere_shell_exec__WEBPACK_IMPORTED_MODULE_7__","module":"../interop/vendor/shell-exec.js","kind":"namespace","exports":{"J":"configureRipgrepPath","St":"configureSandboxPrereqs","_B":"isAllowAllNetworkByPolicy","T6":"networkAllowAllPolicy","fZ":"mergeNetworkPolicies","s9":"mergePathsUnion","Ko":"getRipgrepBinaryPath","K3":"isSandboxSupported","$6":"parseSandboxPolicyJson","l7":"resolvePolicyPaths","Fn":"createDefaultTerminalExecutor","fi":"createNaiveTerminalExecutor"}},
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_8__","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}},
    {"old":"_bundledToolPath_js__WEBPACK_IMPORTED_MODULE_10__","module":"./bundledToolPath.js","kind":"namespace","exports":{"o5":"prependExecDaemonBundleToPath","W2":"prependExecDaemonGatedToolsToPath"}},
    {"old":"_commander_js_extra_typings__WEBPACK_IMPORTED_MODULE_9__","module":"../interop/vendor/commander.js","kind":"namespace","exports":{"uB":"Command","c$":"Option"}},
    {"old":"_fuseLiveness_js__WEBPACK_IMPORTED_MODULE_11__","module":"./fuseLiveness.js","kind":"namespace","exports":{"Hj":"FuseLivenessMonitor"}},
    {"old":"_git_js__WEBPACK_IMPORTED_MODULE_12__","module":"./git.js","kind":"namespace","exports":{"Y8":"GitService"}},
    {"old":"_logger_js__WEBPACK_IMPORTED_MODULE_13__","module":"./logger.js","kind":"namespace","exports":{"M":"FilteredLoggerBackend","h":"safeJsonStringify"}},
    {"old":"_machine_resources_js__WEBPACK_IMPORTED_MODULE_14__","module":"./machine-resources.js","kind":"namespace","exports":{"Up":"MachineResourceMonitor"}},
    {"old":"_refresh_git_token_js__WEBPACK_IMPORTED_MODULE_15__","module":"./refresh-git-token.js","kind":"namespace","exports":{"E":"refreshGitTokenForCurrentWorkspace"}},
    {"old":"_request_context_disk_cache_js__WEBPACK_IMPORTED_MODULE_16__","module":"./request-context-disk-cache.js","kind":"namespace","exports":{"N6":"writeRequestContextDiskCache","Tk":"REQUEST_CONTEXT_DISK_CACHE_PATH","vs":"DiskBackedRequestContextExecutor","gc":"readRequestContextDiskCache"}},
    {"old":"_serveCommand_js__WEBPACK_IMPORTED_MODULE_17__","module":"./serveCommand.js","kind":"namespace","exports":{"l":"createServeCommand","E":"collectUnknownServeOptions"}},
    {"old":"_server_js__WEBPACK_IMPORTED_MODULE_18__","module":"./server.js","kind":"namespace","exports":{"UD":"startServer","mC":"startPtyHostWebSocketServer"}},
    {"old":"_setup_js__WEBPACK_IMPORTED_MODULE_19__","module":"./setup.js","kind":"namespace","exports":{"Sg":"EXEC_DAEMON_DATA_DIR_ENV_VAR","My":"setupDaemon"}},
    {"old":"_startup_traceparent_js__WEBPACK_IMPORTED_MODULE_20__","module":"./startup-traceparent.js","kind":"namespace","exports":{"t1":"withStartupTraceparent"}},
    {"old":"_tmux_session_manager_js__WEBPACK_IMPORTED_MODULE_21__","module":"./tmux-session-manager.js","kind":"namespace","exports":{"a0":"TmuxSessionManager","Ug":"TmuxValidationError","LE":"TmuxSessionAlreadyExistsError"}},
    {"old":"_tracing_js__WEBPACK_IMPORTED_MODULE_22__","module":"./tracing.js","kind":"namespace","exports":{"Hu":"initTracing","HO":"shutdownTracing"}},
    {"old":"_workspace_discovery_js__WEBPACK_IMPORTED_MODULE_23__","module":"./workspace-discovery.js","kind":"namespace","exports":{"MH":"discoverExecDaemonWorkspacePaths"}}
  ],
  "logger": [

  ],
  "darwin-memory": [

  ],
  "machine-resources": [
    {"old":"code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"control_service_pb","module":"../interop/vendor/proto-agent-v1-control-service-pb.js","kind":"namespace","exports":{"M7":"ArtifactUploadStatus","b0":"ArtifactUploadMetadata","sK":"PersistArtifactsToAgentStoreResponse","Cg":"PersistArtifactToAgentStoreStatus","f":"PersistArtifactsToParentStoreResponse","pj":"PersistArtifactToAgentStoreResult","TT":"ArtifactUploadDispatchResult","i1":"ArtifactUploadDispatchStatus","Ce":"UploadArtifactsResponse","pt":"RestoreArtifactsResponse","QW":"RestoreArtifactResult","zb":"ArtifactRestoreStatus","r":"ResourceScope","u7":"ResourcePressure","vF":"ResourceLimits","RE":"GetResourceUsageResponse","JZ":"ResourceSample","V2":"DesktopLeaseStatus","MA":"DesktopLeaseActorKind","Mj":"DesktopLeaseResponse","YM":"DesktopLeaseOwner","wY":"InstallPluginArtifactResponse","eJ":"PingResponse","y3":"GetCapabilitiesResponse","qM":"SyncScopedSecretsResponse","q2":"ReloadAgentSkillsResponse","dj":"ReloadPluginsResponse","I":"LoadMcpServersResponse","fY":"ExecResponse","Em":"StdoutEvent","LC":"StderrEvent","Bd":"ExitEvent","$Y":"EntryType","K4":"DirectoryEntry","Rz":"ListDirectoryResponse","vy":"ReadTextFileResponse","eb":"WriteTextFileResponse","TV":"ReadBinaryFileResponse","o_":"ExportFileResponse","mc":"ExportFileMetadata","Qp":"WriteBinaryFileResponse","G3":"BatchGetDiffErrorKind","p$":"BatchGetDiffResult","tZ":"BatchGetDiffUnchanged","hO":"BatchGetDiffResponse","Eb":"BatchGetDiffError","Y_":"GetWorkspaceChangesHashResponse","Jm":"RefreshGithubAccessTokenResponse","Ks":"WarmRemoteAccessServerResponse","Nj":"DownloadCursorServerResponse","v$":"ArtifactRootKind","pl":"ListArtifactsResponse","uR":"ArtifactPathError","UL":"ArtifactPathErrorKind","TL":"GetMcpRefreshTokensResponse","t3":"UpdateEnvironmentVariablesRequest","zj":"UpdateEnvironmentVariablesResponse"}},
    {"old":"external_node_crypto_","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_os_default","module":"node:os","kind":"default"},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"ring_buffer","module":"./ring-buffer.js","kind":"namespace","exports":{"N":"RingBuffer"}},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "managed-environment": [
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_0__","module":"../interop/vendor/utils-safe-spawn-cwd.js","kind":"namespace","exports":{"Bn":"SPAWN_CWD_HOP_ENV_VAR","$Y":"isSpawnCwdHopActive","yo":"SPAWN_CWD_HOP_USED_EVENT","iA":"spawnCwdHopLogFields","wz":"isSpawnCwdHopCdFailure","Gq":"SPAWN_CWD_HOP_CD_FAILED_EVENT","fK":"isSpawnCwdHopCdFailedError"}},
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_1__","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "mcp-token-storage": [

  ],
  "refresh-git-token": [
    {"old":"_anysphere_local_exec__WEBPACK_IMPORTED_MODULE_0__","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"_workspace_discovery_js__WEBPACK_IMPORTED_MODULE_1__","module":"./workspace-discovery.js","kind":"namespace","exports":{"MH":"discoverExecDaemonWorkspacePaths"}}
  ],
  "request-context-disk-cache": [
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_2__","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"_anysphere_proto_agent_v1_request_context_exec_pb_js__WEBPACK_IMPORTED_MODULE_3__","module":"../interop/vendor/proto-agent-v1-request-context-exec-pb.js","kind":"namespace","exports":{"_K":"RequestContextArgs","bb":"RequestContext","_G":"RequestContextResult","yW":"RequestContextSuccess","nf":"RequestContextError"}},
    {"old":"node_fs_promises__WEBPACK_IMPORTED_MODULE_0__","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"node_path__WEBPACK_IMPORTED_MODULE_1___default","module":"node:path","kind":"default"}
  ],
  "ring-buffer": [

  ],
  "secretRedaction": [
    {"old":"_anysphere_secrets_exec__WEBPACK_IMPORTED_MODULE_3__","module":"../interop/vendor/secrets-exec.js","kind":"namespace","exports":{"pE":"SecretRedactor","sR":"RedactingShellCoreExecutor","DA":"RedactingResourceAccessor"}},
    {"old":"_comma_separated_names_js__WEBPACK_IMPORTED_MODULE_4__","module":"./comma-separated-names.js","kind":"namespace","exports":{"w":"parseCommaSeparatedNames"}},
    {"old":"node_fs_promises__WEBPACK_IMPORTED_MODULE_0__","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"node_os__WEBPACK_IMPORTED_MODULE_1___default","module":"node:os","kind":"default"},
    {"old":"node_path__WEBPACK_IMPORTED_MODULE_2___default","module":"node:path","kind":"default"}
  ],
  "trace-attributes": [

  ],
  "serveCommand": [
    {"old":"esm","module":"../interop/vendor/commander.js","kind":"namespace","exports":{"uB":"Command","c$":"Option"}},
    {"old":"parseTraceAttributes","module":"./trace-attributes.js","kind":"owned","name":"parseTraceAttributes"}
  ],
  "connect-websocket-adapter": [
    {"old":"esm_router","module":"../interop/vendor/connect-router.js","kind":"namespace","exports":{"k":"createConnectRouter"}}
  ],
  "desktopLease": [
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"control_service_pb","module":"../interop/vendor/proto-agent-v1-control-service-pb.js","kind":"namespace","exports":{"M7":"ArtifactUploadStatus","b0":"ArtifactUploadMetadata","sK":"PersistArtifactsToAgentStoreResponse","Cg":"PersistArtifactToAgentStoreStatus","f":"PersistArtifactsToParentStoreResponse","pj":"PersistArtifactToAgentStoreResult","TT":"ArtifactUploadDispatchResult","i1":"ArtifactUploadDispatchStatus","Ce":"UploadArtifactsResponse","pt":"RestoreArtifactsResponse","QW":"RestoreArtifactResult","zb":"ArtifactRestoreStatus","r":"ResourceScope","u7":"ResourcePressure","vF":"ResourceLimits","RE":"GetResourceUsageResponse","JZ":"ResourceSample","V2":"DesktopLeaseStatus","MA":"DesktopLeaseActorKind","Mj":"DesktopLeaseResponse","YM":"DesktopLeaseOwner","wY":"InstallPluginArtifactResponse","eJ":"PingResponse","y3":"GetCapabilitiesResponse","qM":"SyncScopedSecretsResponse","q2":"ReloadAgentSkillsResponse","dj":"ReloadPluginsResponse","I":"LoadMcpServersResponse","fY":"ExecResponse","Em":"StdoutEvent","LC":"StderrEvent","Bd":"ExitEvent","$Y":"EntryType","K4":"DirectoryEntry","Rz":"ListDirectoryResponse","vy":"ReadTextFileResponse","eb":"WriteTextFileResponse","TV":"ReadBinaryFileResponse","o_":"ExportFileResponse","mc":"ExportFileMetadata","Qp":"WriteBinaryFileResponse","G3":"BatchGetDiffErrorKind","p$":"BatchGetDiffResult","tZ":"BatchGetDiffUnchanged","hO":"BatchGetDiffResponse","Eb":"BatchGetDiffError","Y_":"GetWorkspaceChangesHashResponse","Jm":"RefreshGithubAccessTokenResponse","Ks":"WarmRemoteAccessServerResponse","Nj":"DownloadCursorServerResponse","v$":"ArtifactRootKind","pl":"ListArtifactsResponse","uR":"ArtifactPathError","UL":"ArtifactPathErrorKind","TL":"GetMcpRefreshTokensResponse","t3":"UpdateEnvironmentVariablesRequest","zj":"UpdateEnvironmentVariablesResponse"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}}
  ],
  "errors": [
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}}
  ],
  "export-file": [
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}}
  ],
  "plugin-install/limits": [

  ],
  "plugin-install/download": [
    {"old":"PLUGIN_ARTIFACT_MAX_BYTES","module":"./plugin-install/limits.js","kind":"owned","name":"PLUGIN_ARTIFACT_MAX_BYTES"},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_stream_","module":"node:stream","kind":"namespace","exports":{"Readable":"Readable","Transform":"Transform"}},
    {"old":"external_node_stream_promises_","module":"node:stream/promises","kind":"namespace","exports":{"pipeline":"pipeline"}}
  ],
  "plugin-install/errors": [
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}}
  ],
  "plugin-install/paths": [
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"promises_default","module":"node:fs/promises","kind":"default"}
  ],
  "plugin-install/tar": [
    {"old":"PLUGIN_ARTIFACT_MAX_ENTRIES","module":"./plugin-install/limits.js","kind":"owned","name":"PLUGIN_ARTIFACT_MAX_ENTRIES"},
    {"old":"PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES","module":"./plugin-install/limits.js","kind":"owned","name":"PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES"},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"external_node_readline_","module":"node:readline","kind":"namespace","exports":{"createInterface":"createInterface"}},
    {"old":"isPathEqualOrInside","module":"./plugin-install/paths.js","kind":"owned","name":"isPathEqualOrInside"},
    {"old":"parseTarVerboseListingSize","module":"./plugin-install/limits.js","kind":"owned","name":"parseTarVerboseListingSize"},
    {"old":"pluginInstallFailureMessage","module":"./plugin-install/errors.js","kind":"owned","name":"pluginInstallFailureMessage"},
    {"old":"promises_default","module":"node:fs/promises","kind":"default"},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "install-plugin-artifact": [
    {"old":"PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS","module":"./plugin-install/limits.js","kind":"owned","name":"PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS"},
    {"old":"PLUGIN_INSTALL_TIMEOUT_MS","module":"./plugin-install/limits.js","kind":"owned","name":"PLUGIN_INSTALL_TIMEOUT_MS"},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"control_service_pb","module":"../interop/vendor/proto-agent-v1-control-service-pb.js","kind":"namespace","exports":{"M7":"ArtifactUploadStatus","b0":"ArtifactUploadMetadata","sK":"PersistArtifactsToAgentStoreResponse","Cg":"PersistArtifactToAgentStoreStatus","f":"PersistArtifactsToParentStoreResponse","pj":"PersistArtifactToAgentStoreResult","TT":"ArtifactUploadDispatchResult","i1":"ArtifactUploadDispatchStatus","Ce":"UploadArtifactsResponse","pt":"RestoreArtifactsResponse","QW":"RestoreArtifactResult","zb":"ArtifactRestoreStatus","r":"ResourceScope","u7":"ResourcePressure","vF":"ResourceLimits","RE":"GetResourceUsageResponse","JZ":"ResourceSample","V2":"DesktopLeaseStatus","MA":"DesktopLeaseActorKind","Mj":"DesktopLeaseResponse","YM":"DesktopLeaseOwner","wY":"InstallPluginArtifactResponse","eJ":"PingResponse","y3":"GetCapabilitiesResponse","qM":"SyncScopedSecretsResponse","q2":"ReloadAgentSkillsResponse","dj":"ReloadPluginsResponse","I":"LoadMcpServersResponse","fY":"ExecResponse","Em":"StdoutEvent","LC":"StderrEvent","Bd":"ExitEvent","$Y":"EntryType","K4":"DirectoryEntry","Rz":"ListDirectoryResponse","vy":"ReadTextFileResponse","eb":"WriteTextFileResponse","TV":"ReadBinaryFileResponse","o_":"ExportFileResponse","mc":"ExportFileMetadata","Qp":"WriteBinaryFileResponse","G3":"BatchGetDiffErrorKind","p$":"BatchGetDiffResult","tZ":"BatchGetDiffUnchanged","hO":"BatchGetDiffResponse","Eb":"BatchGetDiffError","Y_":"GetWorkspaceChangesHashResponse","Jm":"RefreshGithubAccessTokenResponse","Ks":"WarmRemoteAccessServerResponse","Nj":"DownloadCursorServerResponse","v$":"ArtifactRootKind","pl":"ListArtifactsResponse","uR":"ArtifactPathError","UL":"ArtifactPathErrorKind","TL":"GetMcpRefreshTokensResponse","t3":"UpdateEnvironmentVariablesRequest","zj":"UpdateEnvironmentVariablesResponse"}},
    {"old":"downloadPluginArtifactToFile","module":"./plugin-install/download.js","kind":"owned","name":"downloadPluginArtifactToFile"},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"extractTarball","module":"./plugin-install/tar.js","kind":"owned","name":"extractTarball"},
    {"old":"isAllowedPluginInstallTargetRoot","module":"./plugin-install/paths.js","kind":"owned","name":"isAllowedPluginInstallTargetRoot"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"pluginInstallFailureMessage","module":"./plugin-install/errors.js","kind":"owned","name":"pluginInstallFailureMessage"},
    {"old":"promises_default","module":"node:fs/promises","kind":"default"},
    {"old":"remainingInstallTimeoutMs","module":"./plugin-install/errors.js","kind":"owned","name":"remainingInstallTimeoutMs"},
    {"old":"remainingPhaseTimeoutMs","module":"./plugin-install/errors.js","kind":"owned","name":"remainingPhaseTimeoutMs"},
    {"old":"resetPluginInstallTargetDirectory","module":"./plugin-install/paths.js","kind":"owned","name":"resetPluginInstallTargetDirectory"},
    {"old":"toPluginInstallConnectError","module":"./plugin-install/errors.js","kind":"owned","name":"toPluginInstallConnectError"},
    {"old":"validateTarballBeforeExtraction","module":"./plugin-install/tar.js","kind":"owned","name":"validateTarballBeforeExtraction"},
    {"old":"verifyExtractedArtifactPaths","module":"./plugin-install/tar.js","kind":"owned","name":"verifyExtractedArtifactPaths"}
  ],
  "control": [
    {"old":"annotateSpawnEnoent","module":"./errors.js","kind":"owned","name":"annotateSpawnEnoent"},
    {"old":"artifactUploads","module":"./artifactUploads.js","kind":"namespace","exports":{"fE":"ARTIFACT_MTIME_TOLERANCE_MS","PM":"isAgentStoreFuseBackedPath","VO":"resolveArtifactsRootPath","cB":"ArtifactUploadManagerProvider"}},
    {"old":"cloud_agent_artifact_paths","module":"../interop/vendor/agent-core-cloud-agent-artifact-paths.js","kind":"namespace","exports":{"XJ":"AGENT_STORE_INTERNAL_ROOT_DIRECTORY","rK":"toAgentStoreArtifactPath","vR":"toArtifactRelativePath","kp":"fromArtifactRelativePath","KJ":"fromAgentStoreArtifactPath","hG":"AGENT_STORE_ARTIFACTS_PREFIX","Yk":"normalizeCloudAgentArtifactAbsolutePath"}},
    {"old":"comma_separated_names","module":"./comma-separated-names.js","kind":"namespace","exports":{"w":"parseCommaSeparatedNames"}},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"control_service_pb","module":"../interop/vendor/proto-agent-v1-control-service-pb.js","kind":"namespace","exports":{"M7":"ArtifactUploadStatus","b0":"ArtifactUploadMetadata","sK":"PersistArtifactsToAgentStoreResponse","Cg":"PersistArtifactToAgentStoreStatus","f":"PersistArtifactsToParentStoreResponse","pj":"PersistArtifactToAgentStoreResult","TT":"ArtifactUploadDispatchResult","i1":"ArtifactUploadDispatchStatus","Ce":"UploadArtifactsResponse","pt":"RestoreArtifactsResponse","QW":"RestoreArtifactResult","zb":"ArtifactRestoreStatus","r":"ResourceScope","u7":"ResourcePressure","vF":"ResourceLimits","RE":"GetResourceUsageResponse","JZ":"ResourceSample","V2":"DesktopLeaseStatus","MA":"DesktopLeaseActorKind","Mj":"DesktopLeaseResponse","YM":"DesktopLeaseOwner","wY":"InstallPluginArtifactResponse","eJ":"PingResponse","y3":"GetCapabilitiesResponse","qM":"SyncScopedSecretsResponse","q2":"ReloadAgentSkillsResponse","dj":"ReloadPluginsResponse","I":"LoadMcpServersResponse","fY":"ExecResponse","Em":"StdoutEvent","LC":"StderrEvent","Bd":"ExitEvent","$Y":"EntryType","K4":"DirectoryEntry","Rz":"ListDirectoryResponse","vy":"ReadTextFileResponse","eb":"WriteTextFileResponse","TV":"ReadBinaryFileResponse","o_":"ExportFileResponse","mc":"ExportFileMetadata","Qp":"WriteBinaryFileResponse","G3":"BatchGetDiffErrorKind","p$":"BatchGetDiffResult","tZ":"BatchGetDiffUnchanged","hO":"BatchGetDiffResponse","Eb":"BatchGetDiffError","Y_":"GetWorkspaceChangesHashResponse","Jm":"RefreshGithubAccessTokenResponse","Ks":"WarmRemoteAccessServerResponse","Nj":"DownloadCursorServerResponse","v$":"ArtifactRootKind","pl":"ListArtifactsResponse","uR":"ArtifactPathError","UL":"ArtifactPathErrorKind","TL":"GetMcpRefreshTokensResponse","t3":"UpdateEnvironmentVariablesRequest","zj":"UpdateEnvironmentVariablesResponse"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"exportFileChunks","module":"./export-file.js","kind":"owned","name":"exportFileChunks"},
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"handleDesktopLease","module":"./desktopLease.js","kind":"owned","name":"handleDesktopLease"},
    {"old":"installPluginArtifactFromUrl","module":"./install-plugin-artifact.js","kind":"owned","name":"installPluginArtifactFromUrl"},
    {"old":"isClientDisconnectError","module":"./errors.js","kind":"owned","name":"isClientDisconnectError"},
    {"old":"local_exec_dist","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"managed_environment","module":"./managed-environment.js","kind":"namespace","exports":{"R1":"ManagedEnvironment","_Z":"ManagedEnvironmentValidationError","j8":"SANDBOX_ENV_RESTORE_ENV_VAR","tr":"validateManagedEnvironmentNames","jg":"ENV_NAME_PATTERN","uT":"CURSOR_SANDBOX_ENV_NAME_PATTERN","ZH":{"module":"../interop/vendor/utils-workload-spawn.js","name":"WORKLOAD_CGROUP_ENV_VAR"},"Bn":{"module":"../interop/vendor/utils-safe-spawn-cwd.js","name":"SPAWN_CWD_HOP_ENV_VAR"}}},
    {"old":"mcp_token_storage","module":"./mcp-token-storage.js","kind":"namespace","exports":{"w8":"getRefreshedMcpOAuthTokens","Iw":"createEphemeralScopedTokenStorage"}},
    {"old":"otel","module":"../interop/vendor/context-otel.js","kind":"namespace","exports":{"HF":"reportEvent","fR":"withSpan","fU":"getSpan","Mf":"withInheritableAttribute","V5":"createContextFromSpanContext","Rm":"SPAN_KEY"}},
    {"old":"promise_extras","module":"../interop/vendor/utils-promise-extras.js","kind":"namespace","exports":{"PH":"asyncMapValues","up":"asyncMapSettledValues","wj":"withTimeout","MU":"TimeoutError"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"safe_spawn_cwd","module":"../interop/vendor/utils-safe-spawn-cwd.js","kind":"namespace","exports":{"Bn":"SPAWN_CWD_HOP_ENV_VAR","$Y":"isSpawnCwdHopActive","yo":"SPAWN_CWD_HOP_USED_EVENT","iA":"spawnCwdHopLogFields","wz":"isSpawnCwdHopCdFailure","Gq":"SPAWN_CWD_HOP_CD_FAILED_EVENT","fK":"isSpawnCwdHopCdFailedError"}},
    {"old":"secretRedaction","module":"./secretRedaction.js","kind":"namespace","exports":{"o5":"SYNTHETIC_GIT_AUTH_USERNAMES","wM":"refreshCachedGitAuthTokens","gz":"CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR","l1":"CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR","hK":"ALWAYS_REDACTED_ENV_SECRET_NAMES","LK":"SecretRedactionState"}},
    {"old":"toInternalConnectError","module":"./errors.js","kind":"owned","name":"toInternalConnectError"},
    {"old":"utils_pb","module":"../interop/vendor/proto-aiserver-v1-utils-pb.js","kind":"namespace","exports":{"QP":"FileDiff","Ei":"FileDiff_Chunk","o$":"GitDiff","Wf":"GitDiff_DiffType","ek":"GetDiffRequest_OutputFormat","df":"GetDiffResponse"}},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}},
    {"old":"workspace_discovery","module":"./workspace-discovery.js","kind":"namespace","exports":{"MH":"discoverExecDaemonWorkspacePaths"}},
    {"old":"writable_iterable","module":"../interop/vendor/utils-writable-iterable.js","kind":"namespace","exports":{"Jt":"createWritableIterable"}}
  ],
  "read-file": [
    {"old":"ReadFileResponse","module":"../interop/vendor/server-private.js","kind":"private","name":"ReadFileResponse"},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_crypto_","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"toInternalConnectError","module":"./errors.js","kind":"owned","name":"toInternalConnectError"}
  ],
  "exec": [
    {"old":"readFile","module":"./read-file.js","kind":"owned","name":"readFile"},
    {"old":"ExecStreamElement","module":"../interop/vendor/server-private.js","kind":"private","name":"ExecStreamElement"},
    {"old":"dist","module":"../interop/vendor/agent-exec.js","kind":"namespace","exports":{"n6O":"SimpleControlledExecManager","S5q":"EXEC_CONVERSATION_ID_HEADER","FmW":"execConversationIdKey","sMm":"EXEC_REQUEST_ID_HEADER","dxK":"execRequestIdKey","LXI":"EXEC_BROWSER_OPERATION_SOURCE_HEADER","Kwv":"EXEC_BROWSER_OPERATION_SOURCES","$mb":"execBrowserOperationSourceKey","OIF":"EXEC_HOOK_CONVERSATION_ID_HEADER","WWy":"execHookConversationIdKey","TpB":"EXEC_HOOK_GENERATION_ID_HEADER","JT2":"execHookGenerationIdKey","AnR":"EXEC_HOOK_MODEL_HEADER","dBo":"execHookModelKey","s0I":"EXEC_HOOK_WORKSPACE_ROOTS_HEADER","IjH":"execHookWorkspaceRootsKey","qkk":"shellExecutorResource","Yib":"mcpExecutorResource","X_3":"shouldIncludeAgentSkillInRequestContext","tx6":"stripAgentSkillContentForRequestContext","wve":"shellStreamExecutorResource","uvp":"buildNamedMcpToolDefinitionFromFileContent","u8v":"grepExecutorResource","Mfc":"redactedReadExecutorResource","mlu":"readMcpResourceExecutorResource"}},
    {"old":"exec_pb","module":"../interop/vendor/proto-agent-v1-exec-pb.js","kind":"namespace","exports":{"yT":"ExecClientMessage","$Y":"ExecClientControlMessage"}},
    {"old":"isClientDisconnectError","module":"./errors.js","kind":"owned","name":"isClientDisconnectError"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"otel","module":"../interop/vendor/context-otel.js","kind":"namespace","exports":{"HF":"reportEvent","fR":"withSpan","fU":"getSpan","Mf":"withInheritableAttribute","V5":"createContextFromSpanContext","Rm":"SPAN_KEY"}},
    {"old":"toInternalConnectError","module":"./errors.js","kind":"owned","name":"toInternalConnectError"}
  ],
  "pty-host-server": [
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"isClientDisconnectError","module":"./errors.js","kind":"owned","name":"isClientDisconnectError"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"pty_host_service_pb","module":"../interop/vendor/proto-agent-v1-pty-host-service-pb.js","kind":"namespace","exports":{"I$":"PtyInfo","G":"PtyEvent","SE":"PtyData","h2":"PtyExited"}}
  ],
  "tmux-session-server": [
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"tmux_session_manager","module":"./tmux-session-manager.js","kind":"namespace","exports":{"a0":"TmuxSessionManager","Ug":"TmuxValidationError","LE":"TmuxSessionAlreadyExistsError"}},
    {"old":"tmux_session_service_pb","module":"../interop/vendor/proto-agent-v1-tmux-session-service-pb.js","kind":"namespace","exports":{"pk":"TmuxSession","pz":"TmuxSessionKind"}}
  ],
  "server": [
    {"old":"ControlServer","module":"./control.js","kind":"owned","name":"ControlServer"},
    {"old":"ControlService","module":"../interop/vendor/server-private.js","kind":"private","name":"ControlService"},
    {"old":"ExecServer","module":"./exec.js","kind":"owned","name":"ExecServer"},
    {"old":"ExecService","module":"../interop/vendor/server-private.js","kind":"private","name":"ExecService"},
    {"old":"PtyHostServer","module":"./pty-host-server.js","kind":"owned","name":"PtyHostServer"},
    {"old":"PtyHostService","module":"../interop/vendor/server-private.js","kind":"private","name":"PtyHostService"},
    {"old":"TmuxSessionServer","module":"./tmux-session-server.js","kind":"owned","name":"TmuxSessionServer"},
    {"old":"TmuxSessionService","module":"../interop/vendor/server-private.js","kind":"private","name":"TmuxSessionService"},
    {"old":"connectWebSocketAdapter","module":"./connect-websocket-adapter.js","kind":"owned","name":"connectWebSocketAdapter"},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"core","module":"../interop/vendor/context-core.js","kind":"namespace","exports":{"q6":"createContext"}},
    {"old":"createContextExtractingService","module":"../interop/vendor/server-private.js","kind":"private","name":"createContextExtractingService"},
    {"old":"dist","module":"../interop/vendor/agent-exec.js","kind":"namespace","exports":{"n6O":"SimpleControlledExecManager","S5q":"EXEC_CONVERSATION_ID_HEADER","FmW":"execConversationIdKey","sMm":"EXEC_REQUEST_ID_HEADER","dxK":"execRequestIdKey","LXI":"EXEC_BROWSER_OPERATION_SOURCE_HEADER","Kwv":"EXEC_BROWSER_OPERATION_SOURCES","$mb":"execBrowserOperationSourceKey","OIF":"EXEC_HOOK_CONVERSATION_ID_HEADER","WWy":"execHookConversationIdKey","TpB":"EXEC_HOOK_GENERATION_ID_HEADER","JT2":"execHookGenerationIdKey","AnR":"EXEC_HOOK_MODEL_HEADER","dBo":"execHookModelKey","s0I":"EXEC_HOOK_WORKSPACE_ROOTS_HEADER","IjH":"execHookWorkspaceRootsKey","qkk":"shellExecutorResource","Yib":"mcpExecutorResource","X_3":"shouldIncludeAgentSkillInRequestContext","tx6":"stripAgentSkillContentForRequestContext","wve":"shellStreamExecutorResource","uvp":"buildNamedMcpToolDefinitionFromFileContent","u8v":"grepExecutorResource","Mfc":"redactedReadExecutorResource","mlu":"readMcpResourceExecutorResource"}},
    {"old":"esm","module":"../interop/vendor/connect-node.js","kind":"namespace","exports":{"aO":"connectNodeAdapter","JY":"compressionGzip"}},
    {"old":"esm_code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"external_node_http_","module":"node:http","kind":"namespace","exports":{"createServer":"createServer"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"otel","module":"../interop/vendor/context-otel.js","kind":"namespace","exports":{"HF":"reportEvent","fR":"withSpan","fU":"getSpan","Mf":"withInheritableAttribute","V5":"createContextFromSpanContext","Rm":"SPAN_KEY"}},
    {"old":"promise_extras","module":"../interop/vendor/utils-promise-extras.js","kind":"namespace","exports":{"PH":"asyncMapValues","up":"asyncMapSettledValues","wj":"withTimeout","MU":"TimeoutError"}},
    {"old":"tmux_session_service_pb","module":"../interop/vendor/proto-agent-v1-tmux-session-service-pb.js","kind":"namespace","exports":{"pk":"TmuxSession","pz":"TmuxSessionKind"}},
    {"old":"wrapper","module":"../interop/vendor/websocket.js","kind":"namespace","exports":{"zu":"WebSocketServer"}}
  ],
  "agent-store-skills": [
    {"old":"promise_extras","module":"../interop/vendor/utils-promise-extras.js","kind":"namespace","exports":{"PH":"asyncMapValues","up":"asyncMapSettledValues","wj":"withTimeout","MU":"TimeoutError"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}}
  ],
  "canvasShareBundle": [
    {"old":"canvas_share_bundle","module":"../interop/vendor/canvas-shared-canvas-share-bundle.js","kind":"namespace","exports":{"pZ":"canvasSourceBasenameToShareBundleFileName","u3":"agentCanvasPreviewPrefix","VY":"isCanvasShareBundleFileName","P4":"canvasShareBundleFileNameToSourceBasename"}},
    {"old":"external_node_crypto_","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"external_node_url_","module":"node:url","kind":"namespace","exports":{"fileURLToPath":"fileURLToPath"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}}
  ],
  "canvasStorePersist": [
    {"old":"agent_store_ids","module":"../interop/vendor/constants-agent-store-ids.js","kind":"namespace","exports":{"f":"AGENT_STORE_MOUNT_ROOT","EN":"CLOUD_CANVAS_SOURCE_BASENAME","ur":"CANVAS_STORE_PERSIST_ROOTS"}},
    {"old":"artifactUploads","module":"./artifactUploads.js","kind":"namespace","exports":{"fE":"ARTIFACT_MTIME_TOLERANCE_MS","PM":"isAgentStoreFuseBackedPath","VO":"resolveArtifactsRootPath","cB":"ArtifactUploadManagerProvider"}},
    {"old":"canvas_path_validation","module":"../interop/vendor/canvas-server-canvas-path-validation.js","kind":"namespace","exports":{"K3":"classifyStoreCanvasSavePath"}},
    {"old":"cloud_canvas","module":"../interop/vendor/canvas-shared-cloud-canvas.js","kind":"namespace","exports":{"Ur":"CLOUD_CANVAS_SOURCE_MAX_BYTES","IR":"isGzipMagic","n_":"CLOUD_CANVAS_DATA_BASENAME","NH":"CLOUD_CANVAS_PAYLOAD_MAX_BYTES","_g":"CLOUD_CANVAS_MANIFEST_BASENAME","Yz":"parseCloudCanvasManifest","Rj":"CLOUD_CANVAS_BUNDLE_BASENAME","EC":"CLOUD_CANVAS_MANIFEST_VERSION","Wo":"CLOUD_CANVAS_MANIFEST_MAX_BYTES"}},
    {"old":"external_node_crypto_","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"external_node_zlib_","module":"node:zlib","kind":"namespace","exports":{"gunzipSync":"gunzipSync"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}}
  ],
  "canvasDiagnostics": [
    {"old":"agent_store_ids","module":"../interop/vendor/constants-agent-store-ids.js","kind":"namespace","exports":{"f":"AGENT_STORE_MOUNT_ROOT","EN":"CLOUD_CANVAS_SOURCE_BASENAME","ur":"CANVAS_STORE_PERSIST_ROOTS"}},
    {"old":"canvas_diagnostics_provider","module":"../interop/vendor/canvas-server-canvas-diagnostics-provider.js","kind":"namespace","exports":{"WT":"createCanvasDiagnosticsProvider"}},
    {"old":"createCanvasStorePersist","module":"./canvasStorePersist.js","kind":"owned","name":"createCanvasStorePersist"},
    {"old":"ensureCanvasSkillSdkMirror","module":"../interop/vendor/setup-private.js","kind":"private","name":"ensureCanvasSkillSdkMirror"},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"external_node_url_","module":"node:url","kind":"namespace","exports":{"fileURLToPath":"fileURLToPath"}},
    {"old":"getProjectDir","module":"../interop/vendor/setup-private.js","kind":"private","name":"getProjectDir"},
    {"old":"isPathInsideDir","module":"./canvasShareBundle.js","kind":"owned","name":"isPathInsideDir"},
    {"old":"local_exec_dist","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"persistCanvasShareBundle","module":"./canvasShareBundle.js","kind":"owned","name":"persistCanvasShareBundle"},
    {"old":"resolveCanvasRuntimeDir","module":"./canvasShareBundle.js","kind":"owned","name":"resolveCanvasRuntimeDir"}
  ],
  "canvasPreviewPersistRoot": [
    {"old":"artifactUploads","module":"./artifactUploads.js","kind":"namespace","exports":{"fE":"ARTIFACT_MTIME_TOLERANCE_MS","PM":"isAgentStoreFuseBackedPath","VO":"resolveArtifactsRootPath","cB":"ArtifactUploadManagerProvider"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}}
  ],
  "cloud-plugins-service": [
    {"old":"cursor_plugins_dist","module":"../interop/vendor/cursor-plugins.js","kind":"namespace","exports":{"n8G":"PLUGINS_CACHE_ROOT","Zc4":"loadPluginsFromCloudManifest"}},
    {"old":"external_node_path_","module":"node:path","kind":"namespace","exports":{"join":"join","resolve":"resolve"}},
    {"old":"external_node_util_","module":"node:util","kind":"namespace","exports":{"debuglog":"debuglog","promisify":"promisify"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}}
  ],
  "computerUseExecutorSetup": [
    {"old":"local_exec_dist","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}}
  ],
  "dedupe-agent-skill-rules": [

  ],
  "global-hook-context": [

  ],
  "lazy-mcp-client": [

  ],
  "mcp-cloud-env": [
    {"old":"comma_separated_names","module":"./comma-separated-names.js","kind":"namespace","exports":{"w":"parseCommaSeparatedNames"}},
    {"old":"managed_environment","module":"./managed-environment.js","kind":"namespace","exports":{"R1":"ManagedEnvironment","_Z":"ManagedEnvironmentValidationError","j8":"SANDBOX_ENV_RESTORE_ENV_VAR","tr":"validateManagedEnvironmentNames","jg":"ENV_NAME_PATTERN","uT":"CURSOR_SANDBOX_ENV_NAME_PATTERN","ZH":{"module":"../interop/vendor/utils-workload-spawn.js","name":"WORKLOAD_CGROUP_ENV_VAR"},"Bn":{"module":"../interop/vendor/utils-safe-spawn-cwd.js","name":"SPAWN_CWD_HOP_ENV_VAR"}}},
    {"old":"mcp_agent_exec_dist","module":"../interop/vendor/mcp-agent-exec.js","kind":"namespace","exports":{"Ds":"expandLocalEnvMap","Vh":"mcpConfigSchema","N5":"expandMcpConfigForCloudRuntime","i9":"McpManager","qV":"loadServer","S2":"getMcpStdioStderrTail","uz":"ManagerMcpLease"}},
    {"old":"secretRedaction","module":"./secretRedaction.js","kind":"namespace","exports":{"o5":"SYNTHETIC_GIT_AUTH_USERNAMES","wM":"refreshCachedGitAuthTokens","gz":"CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR","l1":"CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR","hK":"ALWAYS_REDACTED_ENV_SECRET_NAMES","LK":"SecretRedactionState"}}
  ],
  "orbit/browser-operation": [

  ],
  "orbit/playwright-mcp": [
    {"old":"BROWSER_OPERATION_NAMESPACES","module":"./orbit/browser-operation.js","kind":"owned","name":"BROWSER_OPERATION_NAMESPACES"},
    {"old":"operationOutcome","module":"./orbit/browser-operation.js","kind":"owned","name":"operationOutcome"},
    {"old":"sandBoxCdpEndpoint","module":"./orbit/browser-operation.js","kind":"owned","name":"sandBoxCdpEndpoint"}
  ],
  "orbit/sand-browser-driver": [
    {"old":"BROWSER_OPERATION_NAMESPACES","module":"./orbit/browser-operation.js","kind":"owned","name":"BROWSER_OPERATION_NAMESPACES"},
    {"old":"external_node_buffer_","module":"node:buffer","kind":"namespace","exports":{"Buffer":"Buffer"}},
    {"old":"operationOutcome","module":"./orbit/browser-operation.js","kind":"owned","name":"operationOutcome"},
    {"old":"sandBoxCdpEndpoint","module":"./orbit/browser-operation.js","kind":"owned","name":"sandBoxCdpEndpoint"},
    {"old":"shell_exec_pb","module":"../interop/vendor/proto-agent-v1-shell-exec-pb.js","kind":"namespace","exports":{"Lv":"ShellAbortReason","R_":"ShellOomKill_Kind","iH":"ShellOomKill"}}
  ],
  "orbit/operation-reporting": [
    {"old":"dist","module":"../interop/vendor/agent-exec.js","kind":"namespace","exports":{"n6O":"SimpleControlledExecManager","S5q":"EXEC_CONVERSATION_ID_HEADER","FmW":"execConversationIdKey","sMm":"EXEC_REQUEST_ID_HEADER","dxK":"execRequestIdKey","LXI":"EXEC_BROWSER_OPERATION_SOURCE_HEADER","Kwv":"EXEC_BROWSER_OPERATION_SOURCES","$mb":"execBrowserOperationSourceKey","OIF":"EXEC_HOOK_CONVERSATION_ID_HEADER","WWy":"execHookConversationIdKey","TpB":"EXEC_HOOK_GENERATION_ID_HEADER","JT2":"execHookGenerationIdKey","AnR":"EXEC_HOOK_MODEL_HEADER","dBo":"execHookModelKey","s0I":"EXEC_HOOK_WORKSPACE_ROOTS_HEADER","IjH":"execHookWorkspaceRootsKey","qkk":"shellExecutorResource","Yib":"mcpExecutorResource","X_3":"shouldIncludeAgentSkillInRequestContext","tx6":"stripAgentSkillContentForRequestContext","wve":"shellStreamExecutorResource","uvp":"buildNamedMcpToolDefinitionFromFileContent","u8v":"grepExecutorResource","Mfc":"redactedReadExecutorResource","mlu":"readMcpResourceExecutorResource"}},
    {"old":"external_node_crypto_","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"operationOutcome","module":"./orbit/browser-operation.js","kind":"owned","name":"operationOutcome"},
    {"old":"recognizePlaywrightMcpOperation","module":"./orbit/playwright-mcp.js","kind":"owned","name":"recognizePlaywrightMcpOperation"},
    {"old":"recognizeSandBrowserDriverOperation","module":"./orbit/sand-browser-driver.js","kind":"owned","name":"recognizeSandBrowserDriverOperation"}
  ],
  "pty-manager": [
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"node_pty","module":"../interop/vendor/node-pty.js","kind":"namespace","exports":{"cH":"spawn"}},
    {"old":"ring_buffer","module":"./ring-buffer.js","kind":"namespace","exports":{"N":"RingBuffer"}},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "read-only-bare/repository": [
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_util_","module":"node:util","kind":"namespace","exports":{"debuglog":"debuglog","promisify":"promisify"}},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "read-only-bare/request-context": [
    {"old":"VmDaemonBareGitRepository","module":"./read-only-bare/repository.js","kind":"owned","name":"VmDaemonBareGitRepository"},
    {"old":"cursor_plugins_dist","module":"../interop/vendor/cursor-plugins.js","kind":"namespace","exports":{"n8G":"PLUGINS_CACHE_ROOT","Zc4":"loadPluginsFromCloudManifest"}},
    {"old":"dist","module":"../interop/vendor/agent-exec.js","kind":"namespace","exports":{"n6O":"SimpleControlledExecManager","S5q":"EXEC_CONVERSATION_ID_HEADER","FmW":"execConversationIdKey","sMm":"EXEC_REQUEST_ID_HEADER","dxK":"execRequestIdKey","LXI":"EXEC_BROWSER_OPERATION_SOURCE_HEADER","Kwv":"EXEC_BROWSER_OPERATION_SOURCES","$mb":"execBrowserOperationSourceKey","OIF":"EXEC_HOOK_CONVERSATION_ID_HEADER","WWy":"execHookConversationIdKey","TpB":"EXEC_HOOK_GENERATION_ID_HEADER","JT2":"execHookGenerationIdKey","AnR":"EXEC_HOOK_MODEL_HEADER","dBo":"execHookModelKey","s0I":"EXEC_HOOK_WORKSPACE_ROOTS_HEADER","IjH":"execHookWorkspaceRootsKey","qkk":"shellExecutorResource","Yib":"mcpExecutorResource","X_3":"shouldIncludeAgentSkillInRequestContext","tx6":"stripAgentSkillContentForRequestContext","wve":"shellStreamExecutorResource","uvp":"buildNamedMcpToolDefinitionFromFileContent","u8v":"grepExecutorResource","Mfc":"redactedReadExecutorResource","mlu":"readMcpResourceExecutorResource"}},
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_os_","module":"node:os","kind":"namespace","exports":{"tmpdir":"tmpdir","homedir":"homedir"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"external_node_util_","module":"node:util","kind":"namespace","exports":{"debuglog":"debuglog","promisify":"promisify"}},
    {"old":"local_exec_dist","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"promise_extras","module":"../interop/vendor/utils-promise-extras.js","kind":"namespace","exports":{"PH":"asyncMapValues","up":"asyncMapSettledValues","wj":"withTimeout","MU":"TimeoutError"}},
    {"old":"promises_","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"request_context_exec_pb","module":"../interop/vendor/proto-agent-v1-request-context-exec-pb.js","kind":"namespace","exports":{"_K":"RequestContextArgs","bb":"RequestContext","_G":"RequestContextResult","yW":"RequestContextSuccess","nf":"RequestContextError"}},
    {"old":"withDeduplicatedAgentSkillRules","module":"./dedupe-agent-skill-rules.js","kind":"owned","name":"withDeduplicatedAgentSkillRules"},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "recording-renderer": [
    {"old":"DEFAULT_RENDERER_CONFIG","module":"../interop/vendor/setup-private.js","kind":"private","name":"DEFAULT_RENDERER_CONFIG"},
    {"old":"generateRenderPlan","module":"../interop/vendor/setup-private.js","kind":"private","name":"generateRenderPlan"},
    {"old":"renderFromPlan","module":"../interop/vendor/setup-private.js","kind":"private","name":"renderFromPlan"}
  ],
  "remoteAccess": [
    {"old":"code","module":"../interop/vendor/connect-code.js","kind":"namespace","exports":{"C":"Code"}},
    {"old":"connect_error","module":"../interop/vendor/connect-connect-error.js","kind":"namespace","exports":{"T":"ConnectError"}},
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_crypto_","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"external_node_https_default","module":"node:https","kind":"default"},
    {"old":"external_node_os_default","module":"node:os","kind":"default"},
    {"old":"external_node_path_","module":"node:path","kind":"namespace","exports":{"join":"join","resolve":"resolve"}},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"external_node_util_default","module":"node:util","kind":"default"},
    {"old":"https_proxy_agent_dist","module":"../interop/vendor/https-proxy-agent.js","kind":"namespace","exports":{}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"promise_extras","module":"../interop/vendor/utils-promise-extras.js","kind":"namespace","exports":{"PH":"asyncMapValues","up":"asyncMapSettledValues","wj":"withTimeout","MU":"TimeoutError"}},
    {"old":"promises_default","module":"node:fs/promises","kind":"default"},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "scoped-secrets": [
    {"old":"managed_environment","module":"./managed-environment.js","kind":"namespace","exports":{"R1":"ManagedEnvironment","_Z":"ManagedEnvironmentValidationError","j8":"SANDBOX_ENV_RESTORE_ENV_VAR","tr":"validateManagedEnvironmentNames","jg":"ENV_NAME_PATTERN","uT":"CURSOR_SANDBOX_ENV_NAME_PATTERN","ZH":{"module":"../interop/vendor/utils-workload-spawn.js","name":"WORKLOAD_CGROUP_ENV_VAR"},"Bn":{"module":"../interop/vendor/utils-safe-spawn-cwd.js","name":"SPAWN_CWD_HOP_ENV_VAR"}}}
  ],
  "shell-oom-kill": [
    {"old":"dist","module":"../interop/vendor/agent-exec.js","kind":"namespace","exports":{"n6O":"SimpleControlledExecManager","S5q":"EXEC_CONVERSATION_ID_HEADER","FmW":"execConversationIdKey","sMm":"EXEC_REQUEST_ID_HEADER","dxK":"execRequestIdKey","LXI":"EXEC_BROWSER_OPERATION_SOURCE_HEADER","Kwv":"EXEC_BROWSER_OPERATION_SOURCES","$mb":"execBrowserOperationSourceKey","OIF":"EXEC_HOOK_CONVERSATION_ID_HEADER","WWy":"execHookConversationIdKey","TpB":"EXEC_HOOK_GENERATION_ID_HEADER","JT2":"execHookGenerationIdKey","AnR":"EXEC_HOOK_MODEL_HEADER","dBo":"execHookModelKey","s0I":"EXEC_HOOK_WORKSPACE_ROOTS_HEADER","IjH":"execHookWorkspaceRootsKey","qkk":"shellExecutorResource","Yib":"mcpExecutorResource","X_3":"shouldIncludeAgentSkillInRequestContext","tx6":"stripAgentSkillContentForRequestContext","wve":"shellStreamExecutorResource","uvp":"buildNamedMcpToolDefinitionFromFileContent","u8v":"grepExecutorResource","Mfc":"redactedReadExecutorResource","mlu":"readMcpResourceExecutorResource"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_os_default","module":"node:os","kind":"default"},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"shell_exec_pb","module":"../interop/vendor/proto-agent-v1-shell-exec-pb.js","kind":"namespace","exports":{"Lv":"ShellAbortReason","R_":"ShellOomKill_Kind","iH":"ShellOomKill"}},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "webp-codec-startup": [
    {"old":"local_exec_dist","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}}
  ],
  "setup": [
    {"old":"CliHooksExecutor","module":"../interop/vendor/setup-private.js","kind":"private","name":"CliHooksExecutor"},
    {"old":"CloudPluginsService","module":"./cloud-plugins-service.js","kind":"owned","name":"CloudPluginsService"},
    {"old":"ExecDaemonPolishedRecordingRenderer","module":"./recording-renderer.js","kind":"owned","name":"ExecDaemonPolishedRecordingRenderer"},
    {"old":"HooksConfigLoader","module":"../interop/vendor/setup-private.js","kind":"private","name":"HooksConfigLoader"},
    {"old":"LazyMcpClient","module":"./lazy-mcp-client.js","kind":"owned","name":"LazyMcpClient"},
    {"old":"ListableHooksResourceAccessor","module":"../interop/vendor/setup-private.js","kind":"private","name":"ListableHooksResourceAccessor"},
    {"old":"MutableHooksConfigLeaseImpl","module":"../interop/vendor/setup-private.js","kind":"private","name":"MutableHooksConfigLeaseImpl"},
    {"old":"NodeFileReader","module":"../interop/vendor/setup-private.js","kind":"private","name":"NodeFileReader"},
    {"old":"PtyManager","module":"./pty-manager.js","kind":"owned","name":"PtyManager"},
    {"old":"RemoteAccessService","module":"./remoteAccess.js","kind":"owned","name":"RemoteAccessService"},
    {"old":"ScopedSecretStore","module":"./scoped-secrets.js","kind":"owned","name":"ScopedSecretStore"},
    {"old":"ScopedSecretsShellCoreExecutor","module":"./scoped-secrets.js","kind":"owned","name":"ScopedSecretsShellCoreExecutor"},
    {"old":"artifactUploads","module":"./artifactUploads.js","kind":"namespace","exports":{"fE":"ARTIFACT_MTIME_TOLERANCE_MS","PM":"isAgentStoreFuseBackedPath","VO":"resolveArtifactsRootPath","cB":"ArtifactUploadManagerProvider"}},
    {"old":"buildExecDaemonComputerUseExecutor","module":"./computerUseExecutorSetup.js","kind":"owned","name":"buildExecDaemonComputerUseExecutor"},
    {"old":"computerUseExecutorHasInputEventLogger","module":"./computerUseExecutorSetup.js","kind":"owned","name":"computerUseExecutorHasInputEventLogger"},
    {"old":"createAgentStoreSkillsMountLatch","module":"./agent-store-skills.js","kind":"owned","name":"createAgentStoreSkillsMountLatch"},
    {"old":"createCloudMcpInjectedSecretAccessor","module":"./mcp-cloud-env.js","kind":"owned","name":"createCloudMcpInjectedSecretAccessor"},
    {"old":"createReadOnlyVmDaemonBareRequestContextExecutor","module":"./read-only-bare/request-context.js","kind":"owned","name":"createReadOnlyVmDaemonBareRequestContextExecutor"},
    {"old":"dist","module":"../interop/vendor/agent-exec.js","kind":"namespace","exports":{"n6O":"SimpleControlledExecManager","S5q":"EXEC_CONVERSATION_ID_HEADER","FmW":"execConversationIdKey","sMm":"EXEC_REQUEST_ID_HEADER","dxK":"execRequestIdKey","LXI":"EXEC_BROWSER_OPERATION_SOURCE_HEADER","Kwv":"EXEC_BROWSER_OPERATION_SOURCES","$mb":"execBrowserOperationSourceKey","OIF":"EXEC_HOOK_CONVERSATION_ID_HEADER","WWy":"execHookConversationIdKey","TpB":"EXEC_HOOK_GENERATION_ID_HEADER","JT2":"execHookGenerationIdKey","AnR":"EXEC_HOOK_MODEL_HEADER","dBo":"execHookModelKey","s0I":"EXEC_HOOK_WORKSPACE_ROOTS_HEADER","IjH":"execHookWorkspaceRootsKey","qkk":"shellExecutorResource","Yib":"mcpExecutorResource","X_3":"shouldIncludeAgentSkillInRequestContext","tx6":"stripAgentSkillContentForRequestContext","wve":"shellStreamExecutorResource","uvp":"buildNamedMcpToolDefinitionFromFileContent","u8v":"grepExecutorResource","Mfc":"redactedReadExecutorResource","mlu":"readMcpResourceExecutorResource"}},
    {"old":"expandCloudMcpStdioServerEnvOnly","module":"./mcp-cloud-env.js","kind":"owned","name":"expandCloudMcpStdioServerEnvOnly"},
    {"old":"external_node_child_process_","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"external_node_crypto_","module":"node:crypto","kind":"namespace","exports":{"randomUUID":"randomUUID","randomBytes":"randomBytes","createHash":"createHash"}},
    {"old":"external_node_fs_","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"external_node_os_default","module":"node:os","kind":"default"},
    {"old":"external_node_path_default","module":"node:path","kind":"default"},
    {"old":"find_executable","module":"../interop/vendor/utils-find-executable.js","kind":"namespace","exports":{"E":"findActualExecutable"}},
    {"old":"getCloudManagedTeamHooksPath","module":"../interop/vendor/setup-private.js","kind":"private","name":"getCloudManagedTeamHooksPath"},
    {"old":"getHooksConfigPaths","module":"../interop/vendor/setup-private.js","kind":"private","name":"getHooksConfigPaths"},
    {"old":"getProjectDir","module":"../interop/vendor/setup-private.js","kind":"private","name":"getProjectDir"},
    {"old":"git","module":"./git.js","kind":"namespace","exports":{"Y8":"GitService"}},
    {"old":"hasAnyHooks","module":"../interop/vendor/setup-private.js","kind":"private","name":"hasAnyHooks"},
    {"old":"local_exec_dist","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"mcp_agent_exec_dist","module":"../interop/vendor/mcp-agent-exec.js","kind":"namespace","exports":{"Ds":"expandLocalEnvMap","Vh":"mcpConfigSchema","N5":"expandMcpConfigForCloudRuntime","i9":"McpManager","qV":"loadServer","S2":"getMcpStdioStderrTail","uz":"ManagerMcpLease"}},
    {"old":"mcp_token_storage","module":"./mcp-token-storage.js","kind":"namespace","exports":{"w8":"getRefreshedMcpOAuthTokens","Iw":"createEphemeralScopedTokenStorage"}},
    {"old":"otel","module":"../interop/vendor/context-otel.js","kind":"namespace","exports":{"HF":"reportEvent","fR":"withSpan","fU":"getSpan","Mf":"withInheritableAttribute","V5":"createContextFromSpanContext","Rm":"SPAN_KEY"}},
    {"old":"promise_extras","module":"../interop/vendor/utils-promise-extras.js","kind":"namespace","exports":{"PH":"asyncMapValues","up":"asyncMapSettledValues","wj":"withTimeout","MU":"TimeoutError"}},
    {"old":"registerExecDaemonWebpCodec","module":"./webp-codec-startup.js","kind":"owned","name":"registerExecDaemonWebpCodec"},
    {"old":"removeDuplicatedAgentSkillRules","module":"./dedupe-agent-skill-rules.js","kind":"owned","name":"removeDuplicatedAgentSkillRules"},
    {"old":"request_context_disk_cache","module":"./request-context-disk-cache.js","kind":"namespace","exports":{"N6":"writeRequestContextDiskCache","Tk":"REQUEST_CONTEXT_DISK_CACHE_PATH","vs":"DiskBackedRequestContextExecutor","gc":"readRequestContextDiskCache"}},
    {"old":"resolveAgentStoreSkillRoots","module":"./agent-store-skills.js","kind":"owned","name":"resolveAgentStoreSkillRoots"},
    {"old":"resolveCanvasPreviewPersistArtifactsRoot","module":"./canvasPreviewPersistRoot.js","kind":"owned","name":"resolveCanvasPreviewPersistArtifactsRoot"},
    {"old":"resolveExecDaemonGlobalHookContext","module":"./global-hook-context.js","kind":"owned","name":"resolveExecDaemonGlobalHookContext"},
    {"old":"secretRedaction","module":"./secretRedaction.js","kind":"namespace","exports":{"o5":"SYNTHETIC_GIT_AUTH_USERNAMES","wM":"refreshCachedGitAuthTokens","gz":"CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR","l1":"CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR","hK":"ALWAYS_REDACTED_ENV_SECRET_NAMES","LK":"SecretRedactionState"}},
    {"old":"secrets_exec_dist","module":"../interop/vendor/secrets-exec.js","kind":"namespace","exports":{"pE":"SecretRedactor","sR":"RedactingShellCoreExecutor","DA":"RedactingResourceAccessor"}},
    {"old":"setupExecDaemonCanvasDiagnostics","module":"./canvasDiagnostics.js","kind":"owned","name":"setupExecDaemonCanvasDiagnostics"},
    {"old":"shell_exec_dist","module":"../interop/vendor/shell-exec.js","kind":"namespace","exports":{"J":"configureRipgrepPath","St":"configureSandboxPrereqs","_B":"isAllowAllNetworkByPolicy","T6":"networkAllowAllPolicy","fZ":"mergeNetworkPolicies","s9":"mergePathsUnion","Ko":"getRipgrepBinaryPath","K3":"isSandboxSupported","$6":"parseSandboxPolicyJson","l7":"resolvePolicyPaths","Fn":"createDefaultTerminalExecutor","fi":"createNaiveTerminalExecutor"}},
    {"old":"src_logger","module":"./logger.js","kind":"namespace","exports":{"M":"FilteredLoggerBackend","h":"safeJsonStringify"}},
    {"old":"withDeduplicatedAgentSkillRules","module":"./dedupe-agent-skill-rules.js","kind":"owned","name":"withDeduplicatedAgentSkillRules"},
    {"old":"withInheritedExecDaemonEnv","module":"./mcp-cloud-env.js","kind":"owned","name":"withInheritedExecDaemonEnv"},
    {"old":"withOrbitOperationReporting","module":"./orbit/operation-reporting.js","kind":"owned","name":"withOrbitOperationReporting"},
    {"old":"withShellOomKillReporting","module":"./shell-oom-kill.js","kind":"owned","name":"withShellOomKillReporting"},
    {"old":"workload_spawn","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}}
  ],
  "startup-traceparent": [
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_0__","module":"../interop/vendor/context-otel.js","kind":"namespace","exports":{"HF":"reportEvent","fR":"withSpan","fU":"getSpan","Mf":"withInheritableAttribute","V5":"createContextFromSpanContext","Rm":"SPAN_KEY"}},
    {"old":"_opentelemetry_api__WEBPACK_IMPORTED_MODULE_1__","module":"../interop/vendor/otel-trace-api.js","kind":"namespace","exports":{"u":"trace"}}
  ],
  "tmux-session-manager": [
    {"old":"_anysphere_context__WEBPACK_IMPORTED_MODULE_5__","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"_anysphere_proto_agent_v1_tmux_session_service_pb_js__WEBPACK_IMPORTED_MODULE_6__","module":"../interop/vendor/proto-agent-v1-tmux-session-service-pb.js","kind":"namespace","exports":{"pk":"TmuxSession","pz":"TmuxSessionKind"}},
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_7__","module":"../interop/vendor/utils-oom-score-adj.js","kind":"namespace","exports":{"W":"resetOomScoreAdjBeforeExec"}},
    {"old":"_anysphere_utils__WEBPACK_IMPORTED_MODULE_8__","module":"../interop/vendor/utils-workload-spawn.js","kind":"namespace","exports":{"D9":"spawnWorkload","NG":"getWorkloadPlacement","ZH":"WORKLOAD_CGROUP_ENV_VAR"}},
    {"old":"_managed_environment_js__WEBPACK_IMPORTED_MODULE_9__","module":"./managed-environment.js","kind":"namespace","exports":{"R1":"ManagedEnvironment","_Z":"ManagedEnvironmentValidationError","j8":"SANDBOX_ENV_RESTORE_ENV_VAR","tr":"validateManagedEnvironmentNames","jg":"ENV_NAME_PATTERN","uT":"CURSOR_SANDBOX_ENV_NAME_PATTERN","ZH":{"module":"../interop/vendor/utils-workload-spawn.js","name":"WORKLOAD_CGROUP_ENV_VAR"},"Bn":{"module":"../interop/vendor/utils-safe-spawn-cwd.js","name":"SPAWN_CWD_HOP_ENV_VAR"}}},
    {"old":"node_child_process__WEBPACK_IMPORTED_MODULE_0__","module":"node:child_process","kind":"namespace","exports":{"spawn":"spawn","execFile":"execFile","execFileSync":"execFileSync"}},
    {"old":"node_crypto__WEBPACK_IMPORTED_MODULE_1___default","module":"node:crypto","kind":"default"},
    {"old":"node_fs__WEBPACK_IMPORTED_MODULE_2__","module":"node:fs","kind":"namespace","exports":{"constants":"constants","createWriteStream":"createWriteStream","readFileSync":"readFileSync","renameSync":"renameSync","unlinkSync":"unlinkSync","realpathSync":"realpathSync","writeFileSync":"writeFileSync","statfsSync":"statfsSync","existsSync":"existsSync","accessSync":"accessSync","mkdirSync":"mkdirSync","chmodSync":"chmodSync","promises":"promises"}},
    {"old":"node_path__WEBPACK_IMPORTED_MODULE_3___default","module":"node:path","kind":"default"},
    {"old":"node_util__WEBPACK_IMPORTED_MODULE_4__","module":"node:util","kind":"namespace","exports":{"debuglog":"debuglog","promisify":"promisify"}}
  ],
  "tracing": [
    {"old":"OTLPTraceExporter","module":"../interop/vendor/otel-trace-exporter.js","kind":"namespace","exports":{"Q":"OTLPTraceExporter"}},
    {"old":"diag_api","module":"../interop/vendor/otel-diag-api.js","kind":"namespace","exports":{"s":"diag"}},
    {"old":"external_node_os_default","module":"node:os","kind":"default"},
    {"old":"logger","module":"../interop/vendor/context-logger.js","kind":"namespace","exports":{"h":"createLogger","_O":"loggerKey"}},
    {"old":"resourceFromAttributes","module":"../interop/vendor/tracing-private.js","kind":"private","name":"resourceFromAttributes"},
    {"old":"src","module":"../interop/vendor/otel-node-sdk.js","kind":"namespace","exports":{"P":"NodeSDK"}},
    {"old":"types","module":"../interop/vendor/otel-types.js","kind":"namespace","exports":{"u":"DiagLogLevel"}}
  ],
  "workspace-discovery": [
    {"old":"_anysphere_local_exec__WEBPACK_IMPORTED_MODULE_2__","module":"../interop/vendor/local-exec.js","kind":"namespace","exports":{"FRC":"parseDiff","xK7":"LocalGitExecutor","T2h":"getBuiltinSkillsDir","PDU":"isX11Installed","JtE":"waitForDisplay","L_j":"detectDisplaySync","Sap":"MacComputerUseRPCClient","iTV":"X11ComputerUseExecutor","c6U":"parseDisplayNum","WZL":"resolutionConfigForDisplay","p$J":"MacRemoteComputerUseExecutor","Wy$":"LazyX11ComputerUseExecutor","bR2":"BareGitWorkspaceRuntimeRef","TlW":"BareGitWorkspaceGitExecutor","ZNu":"BareGitWorkspaceFilesystem","Z1t":"BareGitExtensibilityService","Rxj":"CursorPluginsAgentSkillsService","Px0":"MergedCursorRulesService","$3f":"NO_AGENT_STORE_SKILLS","NB":"MergedAgentSkillsService","M10":"MergedCloudRulesService","_Ji":"CursorPluginsSubagentsService","o_K":"MergedSubagentsService","d2r":"LocalRequestContextExecutor","Zu2":"registerLocalWebpCodec","c6e":"LOGS_DIR","OhU":"RECORDING_STAGING_DIR","$1H":"FileChangeTracker","E1e":"LazyIgnoreService","IK_":"NestedExtensibilityService","KOV":"LocalCursorRulesService","EVC":"AgentSkillsCursorRulesService","TCT":"LocalCloudRulesService","VzO":"LocalSubagentsService","J2t":"StaticMcpLease","cND":"CombinedMcpLease","x7h":"McpFileSystemWriter","pvL":"getDisplay","eI$":"DesktopLeaseStore","aZ7":"ObservableMcpStateAccessor","bXp":"buildLegacyMcpRequestContextFields","a0x":"buildMcpMetaToolOptions","tou":"AgentStoreConflictJournalDrainer","DvK":"LocalResourceProvider","f8t":"gateComputerUseExecutor","yJf":"AgentStoreConflictDrainAccessor","ky5":"findGitRoot"}},
    {"old":"node_fs_promises__WEBPACK_IMPORTED_MODULE_0__","module":"node:fs/promises","kind":"namespace","exports":{"rm":"rm","readFile":"readFile","mkdir":"mkdir","writeFile":"writeFile","rename":"rename","realpath":"realpath","lstat":"lstat","open":"open","readdir":"readdir","readlink":"readlink","stat":"stat","unlink":"unlink","access":"access"}},
    {"old":"node_path__WEBPACK_IMPORTED_MODULE_1__","module":"node:path","kind":"namespace","exports":{"join":"join","resolve":"resolve"}}
  ]
};
/** A pinned baseline namespace can re-export a value from another semantic module. */
export interface BaselineExportSource { module: string; name: string; }
export interface BaselineBinding { old: string; module: string; kind: string; name?: string; exports?: Readonly<Record<string, string | BaselineExportSource>>; }
