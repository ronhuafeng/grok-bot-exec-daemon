# Runtime boundary contracts

The declarations in `src/interop/contracts/` are reconstructed boundary contracts, not recovered original TypeScript declarations. Their source is the pinned readable bundle in `vendor/exec-daemon-runtime/index.js` and its retained factory descriptors. No native addon, external service, or daemon is started by the contract generator.

## Protobuf evidence

`tools/generate-proto-contracts.ts` parses retained protobuf descriptors and resolves their local and Webpack-imported references. It handles compact descriptors, the retained protobuf-es well-known-type descriptors, enum local-name rules, optional/repeated/map fields, and discriminated oneofs. It also reads the four retained Connect service descriptors.

The current generated dependency graph contains 477 message classes and 47 enums. The seven protobuf factories imported by owned runtime segments are mapped to their exact preserved export names. Transitive field types include messages and enums from other factories. Classes concatenated into the preserved server factory are included explicitly.

Each message has an independent constructor audit: every initialized runtime field must exist in the descriptor, and every required generated field or oneof group must be initialized by the retained constructor. Regeneration fails on unresolved references or an unsupported descriptor shape.

Run the TypeScript generator from the repository root:

- `npm run generate:contracts` regenerates declarations
- `npm run verify:contracts` checks that declarations are current

These commands first compile the strict project with its pinned TypeScript development dependency. Node's type stripping runs only the small compiler bootstrap; full strict checking precedes application emission.

## Generic and dynamic boundaries

- Context keys preserve their value type, including optional defaults. Context assignment uses `NoInfer` so a mismatching value cannot widen a key's type.
- Workload spawning preserves the creator's argument tuple and resolved result type. The hopped path chains promises with `then`, so promise-subclass extras such as promisified `execFile`'s `child` property are not promised on its output. Native Node imports retain Node's declarations instead of replacement maps.
- Resources keep their generic payload relation through their real construction/registration methods. `get` includes the real missing-value possibility. Heterogeneous `entries` explicitly erase values, which must be narrowed by the preserved resource identity before inspection.
- Protobuf oneofs retain coupled case/value alternatives. Initializer types recurse through message data without requiring runtime methods.
- Arbitrary maps occur only where the protocol itself is a map, such as environment variables, JSON objects, structured log metadata, protobuf map fields, or named client registries.
- `Span.recordException` is raw telemetry ingress. The retained SDK accepts arbitrary inputs and returns no value; it checks strings/truthiness before reading exception-like properties. Its `unknown` input does not imply validation or suppress the original possible failures.
- Cloud-plugin manifest ingestion accepts JSON values, including malformed roots. Invalid inputs retain the original skip/throw behavior. Successful JSON-sourced identifiers pass the retained string sanitizers; component content is narrowed by the retained parsers. This promise is deliberately not extended to arbitrary objects with custom methods.

## JSON input boundaries

Two preserved helpers are converters rather than validators:

1. `buildNamedMcpToolDefinitionFromFileContent` copies fields directly. For example, an empty object produces undefined tool identifiers.
2. `parseSandboxPolicyJson` copies several optional values without validating their types. For example, a string `captureDenies` survives its insecure-policy branch.

The contracts expose their valid-input shapes. They must not be used as evidence that arbitrary parsed JSON has been validated. The HTTP MCP and sandbox entrypoints in `configuration.ts` validate their consumed input shapes before those converters run. The sandbox helper is source-bound to the existing private vendor validator. It retains array roots and shallow network-array acceptance. Broad casts or stronger invented schema guarantees would conceal that distinction.

## Verification limits

`tests/interop-contracts.types.ts` supplies compile-time checks for context/resource relationships, protobuf oneof cases, JSON ingress, and RPC streaming modes. Standalone strict contract checks and the generator check validate the reconstructed declarations. They do not establish native-addon ABI compatibility, remote-service behavior, full-project runtime equivalence, or a live acceptance result. Those remain separate project gates.

## Daemon startup constructor subset

`startup-services.ts` admits the concrete dependencies supplied by the maintained daemon setup. It deliberately excludes uncalled IDE integrations: disabled watcher, team-settings, shell-manager, and sandbox-resolver slots are typed as undefined rather than opaque object placeholders. The file is a supported-call subset of the vendor API, not a claim to reconstruct every optional feature.

Source anchors in the immutable `vendor/exec-daemon-runtime/index.js`:

- `FileChangeTracker`, line 265439: string file contents, optional change metadata, notifications, accept/reject, and disposal.
- `LazyIgnoreService`, line 251419: asynchronous ignore checks and string-array mappings; startup supplies no team-settings service.
- `NestedExtensibilityService`, line 257115: discovery returns four string-path collections.
- `LocalCursorRulesService`, line 258073; `AgentSkillsCursorRulesService`, line 258582: startup passes discovery promises and no watcher; change subscriptions and skills-root reload retain their concrete return types.
- `LocalCloudRulesService`, line 285122; `LocalSubagentsService`, line 259570: cloud-rule and subagent service interfaces.
- `AgentStoreConflictJournalDrainer`, line 242882; `AgentStoreConflictDrainAccessor`, line 242764: cursor/event structure, quota-gate updates, hook-context messages, and resource-preserving wrapping. Their downstream consumer is `LocalAgentStoreConflictExecutor`, line 274281.
- `LocalResourceProvider`, line 284720: typed registry, MCP/request-context dependencies, shell wrapper and extra environment callback, mounted-store messages, optional canvas and recording hooks. `BaseShellCoreExecutor`, line 283080, calls the extra environment provider synchronously; inventory is awaited by the resource provider.
- `LocalDiagnosticsExecutor`, line 274918, converts diagnostic ranges and metadata; `LocalRecordScreenExecutor` exposes recording-start/stop callbacks at lines 280050 and 280056.

The daemon-specific permissions port requires the actual allow-only shell decisions and false read/write/MCP gates supplied by `DaemonPermissionsService`. Unknown parameters are limited to ignored inputs; outputs remain concrete. The generic setup/startup span helpers preserve callback result types, and CLI option shapes come from the pinned Commander declarations.

`tests/startup-differential.test.ts` supplements the other runtime tests with span success/failure cleanup, executable lookup, sandbox-policy merging, and successful lazy/eager/macOS computer registration. Candidate behavior is exercised through ordinary module imports and named dependency mocks; isolated VM evaluation is baseline-only. No real display, process, listener, native addon, filesystem mutation, or service call is used. Existing runtime tests cover CLI parsing and unavailable-desktop branches.

## MCP SDK comparison

The retained bundle identifies a patched `@modelcontextprotocol/sdk` 1.25.1,
with Zod 3.25.76's v4 surface. The matching official
[release](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/1.25.1)
and [protocol definitions](https://github.com/modelcontextprotocol/typescript-sdk/blob/1.25.1/src/types.ts)
were compared during reconstruction. The upstream patch and workspace lockfile
were not supplied, so this migration does not substitute an unpatched SDK runtime.

These contracts describe the protocol fields the application actually consumes;
they are not a replacement for the complete SDK schema surface. The internal
named-tool/file format adds server identifiers, qualified names and converter
normalization, and is not the SDK's `Tool` schema. Applying that protocol schema
at the file boundary would change accepted JSON shapes. The small source-backed
ports retain the existing runtime behavior without adding a parallel SDK runtime
or importing its entire development dependency graph solely for a partial type.
