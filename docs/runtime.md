# Runtime prerequisites and migration

## Paths

The old repository root was the installed runtime directory. The equivalent
layout is now generated under `dist/runtime/`; its upstream launcher, `npx`,
tmux shim/config, chunks, SDKs, npm, dependencies and native assets retain their
relative paths and modes. Update external launch references accordingly:

```text
old: <checkout>/exec-daemon
new: <checkout>/bin/exec-daemon

old: node <checkout>/index.js
new: <checkout>/dist/runtime/node <checkout>/dist/runtime/index.js
```

No compatibility shim remains at the repository root. Existing consumers must
update their path rather than accidentally execute an immutable vendor baseline
and bypass edited sources. The caller's current working directory and all
arguments are preserved by the launcher.

## Node and platform

Project tooling/CI uses Node 22 and 24. This does not identify the original
runtime Node version or native ABI. The imported package metadata does not
record that version, and the original executable was excluded from Git.

The `pty.node` and `polished-renderer.node` files are Linux x86-64 ELF shared
objects. Additional native tree-sitter bindings are shipped inside
`node_modules`. Their sources/build recipes and supported Node ABI are not
established by this repository. macOS-related helper names and browser WASM
files do not make the complete runtime cross-platform.

Provision a trusted compatible Node executable at `dist/runtime/node`, using
the supported runtime's documented toolchain when it becomes available. Do not
assume a symlink to the host Node keeps the contract: Node may resolve its real
executable path elsewhere, while bundled-tool lookup uses `process.execPath`.
Do not put these local tools into the immutable vendor tree or commit them.
The build does not fetch a replacement or choose a native ABI for you.

## Other excluded tools

The imported `.gitignore` excluded `node`, `gh`, `rg`, `ssh-keygen`,
`cursorsandbox`, `tools/origin`, and `tmux-root/`. Features that use them need
separate provisioning/configuration. The imported `tmux` shim specifically
expects `tmux-root/bin/tmux`, libraries under `tmux-root/lib`, and terminfo under
`tmux-root/share/terminfo`. The imported `npx` shim expects sibling Node and
`lib/node_modules/npm/bin/npx-cli.js`.

`npm run doctor` checks platform and important built-file presence only. It
does not invoke Node from the runtime, native addons, the server, subprocess
tools, network services or authentication. A successful doctor result is not
a guarantee that the daemon works; a fresh clone is expected to report the
missing original Node executable.

## CLI and safety

The recovered entrypoint defines `refresh-git-token`,
`prebuild-request-context-cache`, and default `serve` commands. `serve` requires
an authentication token and exposes execution/browser/computer features based
on its options. Use `./bin/exec-daemon --help` and
`./bin/exec-daemon serve --help` only after establishing the required runtime.

Do not start the service with real tokens or expose a port as part of a build
test. Existing CLI flags and defaults are preserved, including the handling
of unknown `serve` options for newer launchers. No authentication, sandbox,
network, privacy or runtime policy is changed by the structural conversion.

Stop a running daemon before rebuilding `dist/runtime/`. The builder preserves
separately provisioned files there, but updates owned payload files individually;
it is a developer build tool, not a live-upgrade/deployment mechanism.
