# Supported host deployment

Ubuntu 24.04 x86-64 is the reference distribution for
`profiles.supported`. The GitHub-hosted `ubuntu-24.04` Runtime proof workflow
executes this same host recipe and the live behavior tests.

Distribution package versions are not part of the runtime contract. Ubuntu
supplies the host packages; `runtime/contract.json` defines the capabilities
the runtime requires; preflight checks those capabilities; the live workflow
proves the resulting behavior. If another distribution becomes a real
requirement, add it from an issue with its own acceptance run.

The lower-privilege core container remains a separate profile; see
[container](container.md).

## Procedure

From a checkout that contains the Git LFS objects:

```sh
npm ci --ignore-scripts --no-audit --no-fund
deploy/bootstrap-supported-host.sh
node --experimental-strip-types tools/compile.ts
node dist/project/tools/preflight-host.js --profile supported --scope prepared-runner
node dist/project/tools/build.js
node dist/project/tools/provision-runtime-tools.js --profile supported
```

`deploy/bootstrap-supported-host.sh` is allowed to prepare host policy.
`preflight-host` is read-only.

Start the provisioned runtime as a non-root user:

```sh
EXEC_DAEMON_AUTH_TOKEN=... EXEC_DAEMON_PTY_AUTH_TOKEN=... \
  CURSOR_EXEC_DAEMON_DATA_DIR=/var/lib/exec-daemon \
  bin/exec-daemon serve --project-dir "$PWD" --rg-path dist/runtime/rg
```

Provision verifies the locked runtime Node and runtime-tool bytes before
startup.

## Runtime and writable state

Treat `dist/runtime/` after build and provision as installed runtime content.
Rebuild and reprovision it rather than editing it in place.

Writable locations are:

| Path | Purpose |
| --- | --- |
| `CURSOR_EXEC_DAEMON_DATA_DIR` | logs, artifacts, recording staging, request-context cache, and the daemon-owned `tmux.sock` |
| project directory | agent workspace |
| `/tmp` | temporary files |
| home directory | sandbox policy state outside the data dir |
| `/cursor/stores` | Agent Store FUSE mount point |

## Host capabilities

The authoritative capability list is `runtime/contract.json` `host`.
The Ubuntu bootstrap installs `bubblewrap`, `ffmpeg`, `fuse3`, and
`xz-utils`, creates `/cursor/stores`, enables FUSE `user_allow_other`,
and permits unprivileged user namespaces when the Ubuntu AppArmor sysctl is
present.

The supported profile requires a usable `/dev/fuse`, cgroup v2 at
`/sys/fs/cgroup`, `fusermount3`, and a viable bubblewrap user-namespace
probe. Preflight reports missing capabilities and does not mutate the host.

The recipe does not require blanket container `--privileged`, a Docker socket,
or a host-filesystem bind.

## Agent Store, secrets, and shutdown

The provisioned `cursor-agent-store-fuse` helper owns Agent Store mounts.
Runtime proof exercises both the deterministic mock backend and the local direct
protocol fixture; neither claims the production remote service.

Pass `EXEC_DAEMON_AUTH_TOKEN` and `EXEC_DAEMON_PTY_AUTH_TOKEN` through the
environment or their `*_FILE` variants. Do not place secrets in argv.

Stop the daemon with `SIGTERM`. Its tmux service uses
`$CURSOR_EXEC_DAEMON_DATA_DIR/tmux.sock` (falling back to
`/opt/cursor/.exec-daemon/tmux.sock`), so shutdown removes only daemon-owned
tmux state. The live shutdown test also proves an unrelated tmux server
survives.
