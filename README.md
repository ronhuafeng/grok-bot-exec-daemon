# grok-bot-exec-daemon

A maintainable project layout for the installed `@anysphere/exec-daemon-runtime`
snapshot imported in commit `89afb204a8a326803669563ff7eda622b9c348d0`.

**Status:** recovered-runtime project, not a complete upstream source release.
The original TypeScript, source maps, upstream build configuration, native-addon
sources, dependency lockfile, and original Node executable are absent. This
repository does not grant an open-source license for the imported runtime.
See [provenance and licensing](docs/provenance.md) before redistribution.

## Develop and verify

Use Node.js 22 or 24, Bash, and Git. Project tooling has no npm dependencies and does
not run install hooks, fetch packages, start the daemon, or load native addons.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm run verify:reproduction
```

`check` verifies every imported file, checks JavaScript and shell syntax, runs
focused behavioral tests, builds `dist/runtime/`, and verifies the built files.
`verify:reproduction` proves the initial recovered modules reconstruct the
original `index.js` byte for byte. It is an explicit baseline check, not a
permanent requirement after intentional runtime changes.

## Layout

```text
bin/                         Project launcher
src/recovered/               21 editable compiled JavaScript module factories
tools/                       Offline recovery, integrity, build and doctor tools
tests/                       Build, launcher and selected runtime contract tests
docs/                        Architecture, runtime prerequisites and provenance
vendor/exec-daemon-runtime/   Byte-preserved installed snapshot, including notices
vendor/snapshot.json         Original paths, Git blob IDs, sizes and modes
dist/runtime/                Generated runnable-layout output (ignored)
```

The recovered factories keep their Webpack imports and export names. They are
editable JavaScript, not standalone npm modules or reconstructed TypeScript.
The build replaces only those factories in the pinned bundle and keeps chunks,
SDK declarations, native addons, WASM, npm and other runtime assets together.
See [architecture](docs/architecture.md) and [contributing](CONTRIBUTING.md).

## Run

```sh
npm run build
npm run doctor
# After separately provisioning the compatible runtime prerequisites:
./bin/exec-daemon --help
```

The snapshot intentionally excludes its original `node` and several external
tools. `doctor` is a read-only presence/platform check and is expected to fail
until required files have been provisioned. It does not establish native ABI
compatibility or successful server startup. The bundled native addons are
Linux x86-64 ELF; this snapshot is not a portable macOS/Windows distribution.

The launcher requires `dist/runtime/node` because imported tool discovery uses
`process.execPath`. It does not silently fall back to a host Node installation.
Full daemon use also requires authentication and feature-specific services.
Read [runtime prerequisites and migration](docs/runtime.md) and
[security](SECURITY.md) first. No daemon startup or end-to-end service behavior
is asserted by the unit-test suite.

## Publishing

The root npm package remains `private: true`. There is no release or deployment
workflow. Public distribution needs confirmed rights, complete notices, and a
supported runtime/toolchain. This restructuring neither changes repository
visibility nor relicenses any upstream code.
