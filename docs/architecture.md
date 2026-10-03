# Architecture

## Two explicit boundaries

The imported installed payload is immutable under
`vendor/exec-daemon-runtime/`. Its entire Git tree is preserved from snapshot
commit `89afb204a8a326803669563ff7eda622b9c348d0`, tree
`0f2a68dbfdfd3018916dee2b1fbceefc3228b9cb`. `vendor/snapshot.json` records all
2,270 files and their original byte sizes, modes and Git blob hashes.

Project-owned tooling and tests surround that boundary. The files under
`src/recovered/` are upstream-derived compiled code; putting them in `src/`
does not change ownership or licensing. Their 21 factories have explicit
`./src/*.ts` IDs inside the readable Webpack bundle. Each `.cjs` file wraps
one unchanged factory block in a CommonJS object so editors and `node --check`
can parse it. The original TypeScript is not present.

## Module map

- CLI and startup: `index`, `serveCommand`, `bundledToolPath`,
  `startup-traceparent`, `tracing`, `logger`
- Daemon wiring and RPC: `setup`, `server`
- Workspace and Git: `git`, `refresh-git-token`, `workspace-discovery`
- Environment and access: `managed-environment`, `mcp-token-storage`,
  `secretRedaction`
- State and observation: `request-context-disk-cache`, `machine-resources`,
  `ring-buffer`, `fuseLiveness`
- Artifacts and sessions: `artifactUploads`, `tmux-session-manager`
- Parsing utility: `comma-separated-names`

This is a navigation map, not a claim that the compiler preserved clean module
separation. For example, `setup` contains concatenated modules from shared
packages and `serveCommand` includes the trace-attribute parser. Many original
`@anysphere/*` package modules and third-party dependencies remain in the bundle.
Splitting those further requires a separately verified behavioral migration.

## Build contract

1. Verify the full imported inventory, Git blob hashes, byte sizes and executable
   modes. Reject unexpected files and symlinks.
2. Locate the known Webpack factory boundaries in the pinned `index.js` without
   executing it. Require the recovered module IDs to match exactly.
3. Parse recovered factories, replace only those original blocks, and parse the
   assembled JavaScript. All remaining bundle text is retained exactly.
4. Copy the complete installed layout into `dist/runtime/`, preserving modes,
   and write the assembled `index.js` in place of the baseline entrypoint.
5. Verify every generated payload file and the assembled entrypoint.

There is no package installation, webpack run, upstream native build or remote
download in this process. It is deterministic assembly of a known installed
runtime, not a claim of reproducibly building the upstream product from source.
Repeated builds preserve separately provisioned tools under `dist/runtime/`;
they overwrite only files owned by the snapshot. Output directories must not
be symlinks. A whole-directory atomic runtime upgrade is not provided: stop a
running daemon before rebuilding its directory.

## Why preserve the installed layout?

The bundle loads numbered chunks with relative `require()`, locates native
addons and the canvas/SDK assets beside `index.js`, and relies on installed
`node_modules` and `lib/node_modules/npm`. Moving these independently would
change resolution. Tool PATH setup additionally uses the directory containing
`process.execPath`, so the original sibling-Node launcher contract is retained.

The project launcher in `bin/` delegates to the unchanged imported launcher in
the built directory, preserving arguments, working directory, exit status and
`exec`-style process behavior. No argument filtering or automatic server startup
is added. Original scripts and their relative layout are retained as evidence.

## Verification boundary

Tests cover assembly and rejection paths, snapshot integrity, launcher behavior,
and selected recovered pure/CLI modules. The test-only bundle loader disables
the exact final startup call before exposing Webpack's module registry; it
never boots `./src/index.ts` or loads a native addon. Real CLI parsing uses the
bundled Commander implementation rather than a fake replacement.

These checks do not prove RPC compatibility, native addon ABI compatibility,
PTY operation, sandboxing, browser control, remote authentication or successful
server startup. Those require the original/supported runtime tools and an
explicit integration environment.
