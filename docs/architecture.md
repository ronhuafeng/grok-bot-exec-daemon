# Architecture

## Application modules

`src/runtime/` contains normal TypeScript modules. Feature dependencies are named
imports; Node builtins use `node:` imports. `index.ts` is the CLI composition root:
its single-flight `main` creates application state, registers the existing error
handlers, defines commands and starts Commander parsing in the original order.
No feature imports that entrypoint.

Examples:

- `serveCommand` depends on the trace-attribute parser and retained Commander.
- `machine-resources` depends on `RingBuffer`, Linux probes and resource messages.
- `git` depends on its name-status, cat-file and credential helpers.
- `server` composes the Control, Exec, PTY and tmux implementations.
- `setup` assembles resources and lifecycle services. `configuration` owns JSON
  ingress validation and its existing log/default behavior.

The build compiles these modules normally. It does not erase exports, evaluate
source strings, inject globals or put application statements back into Webpack.

## The vendor boundary

The original dependency installation is incomplete as upstream source. Some
libraries are patched or concatenated into larger factories, and several values
needed by the application are private to those factories. Replacing them with
similarly named npm packages would risk changing behavior and object identity.

`tools/lib/vendor-capsule.ts` derives one CommonJS capsule from the pinned bundle
and chunk graph. It removes all application bodies, application export getters,
application-only import scaffolding and old startup. Three retained shared
closures expose their exact private dependency values. Unknown dynamic edges,
application backedges, missing exports and changed pinned loader/cache forms
fail extraction. Retained shared statements keep their bytes and relative order.

`src/interop/vendor/` is the only application-facing adapter. Its small facades
export descriptive values such as `createLogger`, `ControlService` and `Command`.
Raw registry IDs and minified property keys stay inside this boundary. Facades
return the original constructors, context keys and singleton values; they do not
recreate lookalikes. Dynamic canvas loading remains dynamic. Native libraries
remain behind their original loading contracts.

The dependency direction is application → named adapter → vendor capsule.
There is no dependency-injection container, callback bridge back into application
code, old application fallback or runtime source parser.

### Real packages and retained packages

- Node builtins are real Node imports.
- TypeScript, Node declarations and Commander typings are pinned development
  dependencies. They do not replace the bundled Commander implementation.
- Runtime implementations remain pinned: patched MCP/Connect, OpenTelemetry,
  protobuf, `@anysphere/*`, WebSocket, Commander and native-loading packages.
- Source-backed structural types describe consumed APIs. Protobuf types are
  generated from retained field/service descriptors and audited against constructors.

See [boundary contracts](interop-contract-reconstruction.md).

## Installed artifact

```text
dist/runtime/
  index.js                 Compiled CommonJS launch bridge
  vendor.cjs               Generated vendor-only dependency capsule
  app/                     Ordinary compiled application/adapter ESM
    package.json           Explicit ESM package scope
  <original assets>        Chunks, SDKs, npm, native addons, WASM and shims
```

The unchanged installed launcher still invokes sibling `node` and `index.js`.
The bridge imports the ESM entry once and leaves rejection policy to the original
application handlers and Node. It does not add a new catch/exit policy.

The capsule lives beside the original assets. `runtime-location.ts` exposes that
single installed root to canvas/SDK lookups, independent of cwd or a relocated
module's own directory. Executable discovery separately keeps its established
`process.execPath` contract.

## Build and verification

Verification is property-oriented: project behavior is the subject of a claim,
while tests, local fixtures and GitHub Actions are proof harnesses used to obtain
evidence about that claim. A harness failure is not automatically a behavior
contradiction, and a green harness proves only the behavior it actually observes.
See [property-oriented verification](verification-methodology.md) for the
interpretation and acceptance rules used by this project.

1. Strictly check every maintained source, tool and test before emitting. Clear
   only the disposable compiler output, rejecting symlinked output directories.
2. Verify the complete 2,270-file immutable inventory and original Git tree.
3. Account for every original application segment, including exact documented
   dead-code retirement and explicitly listed new support modules.
4. Prove/extract the vendor-only capsule and compile the ordinary module graph.
5. Derive the artifact inventory from current compiler output and pinned assets;
   reject stale/orphaned application output and preserve executable modes.
6. Verify the generated artifact. Separately provisioned tools remain outside
   the snapshot-owned inventory at the original documented paths.

A build does not download tools, rebuild native libraries or start the daemon.
Stop a running daemon before rebuilding: this is not an atomic deployment tool.

Behavior tests import real compiled candidate modules. Baseline VM evaluation is
confined to the regression oracle. The original AST spelling is not a permanent
constraint on ordinary feature changes. Capsule extraction, source provenance,
strict contracts and behavior/side-effect tests remain independent checks.
