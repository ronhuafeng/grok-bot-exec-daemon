# Type safety and verification

## Compiler coverage

The NodeNext configuration includes every maintained TypeScript application,
adapter, build tool and test, plus the typed CommonJS entry. It enables
`strict`, `noEmitOnError` and full library checking, with JavaScript inputs disabled.
An additional audit rejects explicit or inferred untyped escape hatches,
permissive collection elements and type-check suppressions. Negative type tests
compile deliberately invalid program strings rather than disabling checks in source.

`unknown` is used at genuine external boundaries. The capsule loader validates
its generated ABI and applies the single source-backed module type map. JSON
consumers narrow input before relying on typed values. Identity-sensitive
constructors, context keys and service descriptors come from the retained runtime.

The types are new reconstructions from readable JavaScript, descriptors and
actual call signatures. They are not recovered original TypeScript declarations.

## Behavior evidence

- All imported payload bytes, modes and paths are bound to the original Git tree.
- All 64 original application segments are accounted for, with a narrowly proven
  unreachable platform group retired rather than presented as working code.
- Capsule extraction rejects application backedges and unsupported dynamic
  graph/loader changes. Negative mutations exercise those rejection paths.
- Candidate tests use ordinary compiled modules and explicit side-effect fixtures.
  Baseline-only isolated evaluation supplies differential regression expectations.
- CLI checks use the actual retained Commander, not the development copy.
- Packaging checks cover module resolution, installed paths, argument/exit behavior,
  source inventory, stale-output rejection and unchanged assets/modes.

The earlier typing-only stage used type-erased AST comparison. Its result is
historical migration evidence, not a permanent requirement that feature code
retain old variable names or compiler structure. The normal build has no
application export stripping, lexical reinsertion or candidate source evaluation.

## Deliberate input validation

Two JSON entrypoints now reject malformed types earlier through their existing
error-log/default paths. Valid configurations preserve values and behavior:

1. HTTP MCP tool files check required identifiers/names and the optional fields
   actually consumed. Schema checks are shallow: unknown keywords and JSON-valued
   properties remain intact. This is not a general JSON Schema validator.
2. Sandbox input uses a typed reconstruction of the exact private validator in
   the pinned shell library. A source-binding test prevents divergent editable
   validation policies. Its original limits remain, including array roots and
   shallow network arrays; it does not prove stronger member types than it checks.

The downstream converters are not themselves evidence that arbitrary JSON is safe.
The project-specific HTTP file format is also distinct from MCP protocol schemas.

## Proven dead compiler/platform residue

The immutable original remains available for inspection. Maintained code omits:

- Two private, unreachable MCP token-storage helpers with missing compiler bindings.
- One canvas SDK lookup block whose constant-undefined dereference always throws
  before any effect and is swallowed by its empty catch.
- Sixteen declarations forming the closed, unexported Darwin/OsHostProbe group in
  the Linux machine-resource factory. The installed selector constructs only Linux
  probes; no real platform imports are added to revive the unreachable group.

Each deletion is bounded by exact original source and reachability/effect evidence.
There is no general dead-code pruning rule. Existing reachable computer-use
branches are retained; injected platform fixtures do not establish host support.

## Limits

`npm run check` requires a complete checkout. Node 22 and 24 project checks
compile TypeScript, check strict types and module boundaries, check generated
protocol contracts, verify the pinned snapshot, check syntax, prepare the test
capsule, test offline runtime contracts, build the installed runtime, and verify
that artifact as separate steps. A partial local checkout can run bounded module
tests but cannot certify the complete artifact; report that limitation explicitly.

Offline checks do not by themselves prove a listening daemon. After the runtime
is provisioned, Runtime proof calls `node --test` on the live files below.
cgroup `GetResourceUsage` is covered by `tests/live/cgroup-runtime.test.ts`.
Browser computer-use and recording are covered by
`tests/desktop/desktop-runtime.test.ts` on a non-headless Chrome window. The
core container is covered by `tests/container/core-image.test.ts`. The Agent
Store proof uses the mock helper; it is not production storage proof. See
[runtime prerequisites](runtime.md), [container](container.md), and
[desktop](desktop.md).

| Profile / capability | Behavior | Test file | Workflow step |
| --- | --- | --- | --- |
| supported / native addons | Provisioned Node 22.14.0 loads the pinned native addons | `tests/live/native-runtime.test.ts` | Native addons and PTY output |
| supported / PTY | The pinned pty addon opens a real process | `tests/live/pty-runtime.test.ts` | Native addons and PTY output |
| supported / launcher | The project launcher prints help with the provisioned Node | `tests/live/daemon-runtime.test.ts` | Launcher and bundled tool behavior |
| supported / bundled tools | Origin, tmux 3.5a, and the mock agent-store helper run from the provisioned tree | `tests/live/bundled-tools.test.ts` | Launcher and bundled tool behavior |
| supported / ripgrep | Provisioned ripgrep accepts `--cursor-ignore` | `tests/live/ripgrep-runtime.test.ts` | Launcher and bundled tool behavior |
| supported / HTTP and PTY auth | `serve` authenticates HTTP Ping and PTY WebSocket spawn, and a missing PTY token leaves that listener closed | `tests/live/server-runtime.test.ts`, `tests/live/pty-auth-runtime.test.ts` | HTTP and PTY authentication |
| supported / Agent Store cleanup and liveness | Unmount failures fall through, and a hung FUSE probe kills only the matching pid | `tests/fuse-cleanup.test.ts`, `tests/fuse-liveness-recovery.test.ts` | Test offline runtime contracts |
| supported / sandbox | A workspace write is allowed; an outside write and a local network connection are denied | `tests/live/sandbox-runtime.test.ts` | Sandbox filesystem and network confinement |
| supported / Agent Store | The mount reports `fuse.agent-store` through the mock helper | `tests/live/agent-store-runtime.test.ts` | Agent Store FUSE mount |
| supported / cgroup | `GetResourceUsage` reports the cgroup v2 limits | `tests/live/cgroup-runtime.test.ts` | Cgroup resource reporting |
| supported / shutdown | Graceful shutdown releases listeners and daemon-owned children | `tests/live/shutdown-runtime.test.ts` | Shutdown and restart lifecycle |
| core container | Read-only image serves authenticated HTTP Ping, PTY spawn, and native addons | `tests/container/core-image.test.ts` | Container proof |
| desktop | Non-headless Chrome receives pointer and keyboard input, and recording is playable | `tests/desktop/desktop-runtime.test.ts` | Desktop proof |
