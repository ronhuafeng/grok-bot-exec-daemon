# grok-bot-exec-daemon

Strict TypeScript application modules around a pinned installed
`@anysphere/exec-daemon-runtime` snapshot.

The application uses ordinary NodeNext imports and exports. Build tools and tests
are also strictly checked. Dependencies whose original sources are unavailable
remain in a generated, vendor-only CommonJS capsule; application code is never
inserted into that capsule.

This is newly reconstructed TypeScript. The original upstream TypeScript,
source maps, build lockfile, native sources and Node executable were not supplied.
No new license grant is made for upstream material. See [provenance](docs/provenance.md).

## Development

Use Node 22.20+ or 24.3+, Bash and Git:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

Checks are offline after dependency installation. They use controlled fixtures,
not a listening daemon, credentials or real native addons.

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Strict compiler and untyped-escape audit |
| `npm test` | Ordinary-module, behavior, differential and packaging tests |
| `npm run verify:contracts` | Check source-derived protobuf declarations |
| `npm run verify:snapshot` | Verify all imported bytes, paths and modes |
| `npm run build` | Build the installed runtime directory |
| `npm run verify:build` | Verify the complete generated artifact |
| `npm run check` | All project checks and complete-checkout build verification |

For a feature change, start with its module in `src/runtime/` and focused test.
You do not need to understand the original bundle's lexical scope.
See [contributing](CONTRIBUTING.md) and [architecture](docs/architecture.md).

## Layout

```text
src/runtime/                 Application modules and CLI composition
src/interop/vendor/          Named, typed access to retained dependency values
src/interop/contracts/       Service, protocol and native boundary types
src/runtime-entry.cts        Small typed CommonJS launcher bridge
tools/                       Build, integrity and contract-generation tools
tests/                       Module tests and isolated baseline oracles
vendor/exec-daemon-runtime/   Immutable installed snapshot and notices
vendor/snapshot.json         Original file hashes, sizes and modes
dist/project/                Compiled development output (ignored)
dist/runtime/                Installed artifact (ignored)
```

The original bundle contains 64 identifiable application source segments. The
source inventory accounts for all of them: 63 remain in maintained modules; a
closed, unreachable platform-only segment and associated dead declarations are
retired with source-bound evidence. No application implementation is retained as
a hidden fallback inside the vendor capsule.

## Runtime prerequisites

```sh
npm run build
npm run doctor
# Only after provisioning compatible runtime prerequisites:
./bin/exec-daemon --help
```

The imported native addons target Linux x86-64. The supported runtime is official
Node.js 22.14.0, ABI 127. `npm run provision` installs it, the captured ripgrep
fork, `cursorsandbox`, and the Git LFS copies of `origin`, `tmux-root`, and
`cursor-agent-store-fuse` into `dist/runtime/`. `npm run test:live` then proves
native loading, PTY spawn, ripgrep `--cursor-ignore`, CLI help, sandbox write
denial, and those three tools. A green `npm run check` does not start the daemon.
See [runtime requirements](docs/runtime.md) and [verification limits](docs/strict-typescript.md).
