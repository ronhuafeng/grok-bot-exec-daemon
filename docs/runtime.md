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
Do not put these tools into the immutable vendor tree. `node` is too large for a
normal GitHub blob and is downloaded from nodejs.org. `origin`,
`cursor-agent-store-fuse`, and the `tmux-root` archive are stored with Git LFS
under `runtime-tools/`. ripgrep 15.1.0-cursor5 and `cursorsandbox` are stored
there as ordinary blobs because a public package cannot replace them.

## Other excluded tools

The imported `.gitignore` excluded `node`, `gh`, `rg`, `ssh-keygen`,
`cursorsandbox`, `tools/origin`, and `tmux-root/`. Features that use them need
separate provisioning/configuration. The imported `tmux` shim specifically
expects `tmux-root/bin/tmux`, libraries under `tmux-root/lib`, and terminfo under
`tmux-root/share/terminfo`. The imported `npx` shim expects sibling Node and
`lib/node_modules/npm/bin/npx-cli.js`.

`npm run doctor` checks platform and built-file presence only. It does not invoke
Node from the runtime, native addons, the server, subprocess tools, network
services or authentication. `npm run test:live` is the separate acceptance run.
It loads the native addons, reads PTY output, checks `--cursor-ignore`, starts
`serve`, checks HTTP Ping and PTY WebSocket authentication, exercises
`cursorsandbox` write denial, and checks Origin, tmux, and a `fuse.agent-store`
mount. Runners without Landlock's network namespace need `bubblewrap` for that
sandbox check. A fresh clone reports the runtime Node as missing until
`npm run provision`, and a checkout without Git LFS objects fails the hash check.

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

## Host preflight

`npm run preflight -- --profile supported` checks the Linux host before startup.
It reports architecture, glibc, `bwrap`, a read-only bubblewrap user-namespace
probe, the AppArmor unprivileged user-namespace sysctl when that file is
readable, `/dev/fuse`, `user_allow_other`, `fusermount3`, and cgroup v2. A
missing AppArmor file does not by itself prove that user namespaces work, and
an unreadable sysctl fails the check. The namespace check passes only when the
bubblewrap probe succeeds and AppArmor is not actively restricting namespaces.
`kernel.apparmor_restrict_unprivileged_userns=0` is one valid observation, not
the only supported deployment. The command does not change sysctls or FUSE
configuration. `--scope prepared-runner` records that the caller already
changed the host; the default scope is `observed-host`. Scope does not change
pass or fail. The runtime-proof workflow prepares a GitHub-hosted runner and
then runs this same check with `--scope prepared-runner`. Core-only hosts can
use `--profile core`. `--profile desktop` checks X11, Chrome or Chromium,
ffmpeg, and the polished-renderer libraries. It is separate from `supported`.
See [desktop](desktop.md) and [container](container.md).

## Writable state

`CURSOR_EXEC_DAEMON_DATA_DIR` is the mountable root for daemon-owned mutable
files: `logs/`, `artifacts/`, `recording-staging/`, and
`request-context-cache.json`. Without it, those files keep their compatibility
locations under `/opt/cursor`. Agent Store mounts and the upstream sandbox
policy directory under the user home stay outside this data root. HTTP and PTY
listeners bind to all interfaces unless `--bind-host` or `EXEC_DAEMON_BIND_HOST`
is set. The PTY listener uses that host unless `--pty-bind-host` or
`EXEC_DAEMON_PTY_BIND_HOST` overrides it. Recommended production supplies
`EXEC_DAEMON_AUTH_TOKEN` and `EXEC_DAEMON_PTY_AUTH_TOKEN`, or the matching
`*_FILE` paths, instead of putting secrets in argv. CLI values still win when
present. A missing or empty PTY token disables the PTY listener. An HTTP token
alone does not open an unauthenticated PTY socket.
`--allow-unauthenticated-pty` is an explicit compatibility mode and starts that
listener only on a loopback bind host (`127.0.0.1`, `::1`, or `localhost`).
TLS for a public listener belongs to the surrounding deployment.

Runtime proof calls `node --test` directly in semantic workflow steps: native
addons and PTY, launcher and bundled tools, HTTP and PTY authentication, sandbox
confinement, the Agent Store mount, cgroup reporting, and shutdown. The
capability mapping is in [verification](strict-typescript.md).

`runtime-proof.json` schema 3 records the source commit and the tested commit,
the workflow run id and attempt, and the host scope (`prepared-runner` or
`observed-host`) with the effective AppArmor user-namespace, FUSE
`user_allow_other`, and bubblewrap observations. Each locked tool is `verified`,
`absent`, or `mismatch` against the bytes this run provisioned; an optional tool
may be absent, and a lock hash alone does not verify it. Each native check stays
`passed`, `failed`, or `skipped`. Each declared capability is also `not-run` or
`prerequisite-blocked` when its report was not produced. A metadata failure is
recorded separately and does not relabel native results. The Actions run URL,
workflow, and job are included when GitHub provides them. The file is conformance evidence for that run,
not a provenance attestation or a security review. Provenance remains in
[provenance](provenance.md).
