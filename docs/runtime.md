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

Project tooling requires Node 22.20+ or 24.3+; CI checks the latest releases in both lines. The native runtime is a separate
pin. The observed environment's `node` is the official Node.js 22.14.0 linux-x64
binary, ABI `modules` 127, and it loads this snapshot's `pty.node`, tree-sitter
bindings and `polished-renderer.node`. `npm run provision` installs that binary
into `dist/runtime/node` from the observed environment or from nodejs.org.

The `pty.node` and `polished-renderer.node` files are Linux x86-64 ELF shared
objects. Additional native tree-sitter bindings are shipped inside
`node_modules`. The supported ABI is Node 22 `modules` 127. macOS-related helper
names and browser WASM files do not make the complete runtime cross-platform.

Install the locked tools with `npm run provision` after `npm run build`. The
installer writes `dist/runtime/` only. It checks every file against
`runtime/tools.lock.json` and refuses to write into `vendor/exec-daemon-runtime/`.
Do not assume a symlink to the host Node keeps the contract: Node may resolve its
real executable path elsewhere, while bundled-tool lookup uses `process.execPath`.
Do not put these tools into the immutable vendor tree. `node` and `origin` are
too large for a normal GitHub blob; ripgrep 15.1.0-cursor5 and `cursorsandbox`
are stored under `runtime-tools/` because a public package cannot replace them.

## Other excluded tools

The imported `.gitignore` excluded `node`, `gh`, `rg`, `ssh-keygen`,
`cursorsandbox`, `tools/origin`, and `tmux-root/`. Features that use them need
separate provisioning/configuration. The imported `tmux` shim specifically
expects `tmux-root/bin/tmux`, libraries under `tmux-root/lib`, and terminfo under
`tmux-root/share/terminfo`. The imported `npx` shim expects sibling Node and
`lib/node_modules/npm/bin/npx-cli.js`.

`npm run doctor` checks platform and built-file presence only. It does not invoke
Node from the runtime, native addons, the server, subprocess tools, network
services or authentication. `npm run test:live` is the separate acceptance run:
it loads the native addons, opens a PTY, checks `--cursor-ignore`, prints CLI
help, and exercises `cursorsandbox` write denial. A fresh clone reports the
runtime Node as missing until `npm run provision`.

## CLI and safety

The recovered entrypoint defines `refresh-git-token`,
`prebuild-request-context-cache`, and default `serve` commands. `serve` requires
an authentication token and exposes execution/browser/computer features based
on its options. Use `./bin/exec-daemon --help` and
`./bin/exec-daemon serve --help` only after establishing the required runtime.

Do not start the service with real tokens or expose a port as part of a build
test. Existing CLI flags and defaults are preserved, including the handling
of unknown `serve` options for newer launchers. Authentication and execution policy are retained. The two documented JSON
configuration guards reject malformed types earlier through the existing error
paths; see [verification](strict-typescript.md).

Stop a running daemon before rebuilding `dist/runtime/`. The builder preserves
separately provisioned files there, but updates owned payload files individually;
it is a developer build tool, not a live-upgrade/deployment mechanism.
