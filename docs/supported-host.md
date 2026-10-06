# Supported host deployment

The core container in [container](container.md) is a lower-privilege profile. It
does not become the supported profile. This page is the host-native recipe for
`profiles.supported`. The GitHub-hosted `ubuntu-24.04` runtime-proof job is the
automated exercise of this recipe. It records `hostScope: prepared-runner`.
A runner that cannot represent a stricter security boundary is not silently
treated as that boundary.

## Procedure

From a checkout that already contains the Git LFS objects:

```sh
npm ci --ignore-scripts --no-audit --no-fund
deploy/bootstrap-supported-host.sh
node --experimental-strip-types tools/compile.ts
node dist/project/tools/preflight-host.js --profile supported --scope prepared-runner
node dist/project/tools/build.js
node dist/project/tools/provision-runtime-tools.js --profile supported
```

`deploy/bootstrap-supported-host.sh` is the only step that changes host policy.
`preflight-host` stays read-only. Startup uses the provisioned tree:

```sh
EXEC_DAEMON_AUTH_TOKEN=... EXEC_DAEMON_PTY_AUTH_TOKEN=... \
  CURSOR_EXEC_DAEMON_DATA_DIR=/var/lib/exec-daemon \
  bin/exec-daemon serve --project-dir "$PWD" --rg-path dist/runtime/rg
```

Provision verifies locked Node and tool bytes before `serve`. Do not start the
daemon as root.

## What is immutable

`dist/runtime/` after build and provision: the runtime Node binary, `rg`,
`cursorsandbox`, `origin`, `cursor-agent-store-fuse`, `tmux-root`, and the
installed application. Replace that tree by building and provisioning again,
not by editing it in place.

## What is writable

| Path | Purpose |
| --- | --- |
| `CURSOR_EXEC_DAEMON_DATA_DIR` | `logs/`, `artifacts/`, `recording-staging/`, and `request-context-cache.json` |
| project directory | agent workspace |
| `/tmp` | temporary files |
| home directory | sandbox policy state outside the data dir |
| `/cursor/stores` | Agent Store FUSE mount, created by the bootstrap |

The core image uses `/data` for the same data-dir contract. This host recipe
uses whatever directory `CURSOR_EXEC_DAEMON_DATA_DIR` names.

## Host requirements

The authoritative list is `runtime/contract.json` `host`. The bootstrap installs
`bubblewrap`, `ffmpeg`, `fuse3`, and `xz-utils`, creates `/cursor/stores`,
appends `user_allow_other` to `/etc/fuse.conf` when it is missing, and sets
`kernel.apparmor_restrict_unprivileged_userns=0` when that sysctl file exists.
Those are the host changes. The recipe does not use `--privileged`,
`docker.sock`, or a host filesystem bind.

`/dev/fuse` must be a character device. cgroup v2 must be mounted at
`/sys/fs/cgroup` with `cgroup.controllers`. The sandbox backend is bubblewrap.
Preflight passes only when the bubblewrap user-namespace probe succeeds and
AppArmor is not actively restricting unprivileged user namespaces.

## Agent Store

The bootstrap does not mount a store. The provisioned
`dist/runtime/cursor-agent-store-fuse` helper does. The default runtime proof
uses `--backend-mode mock` and then unmounts with `fusermount3`. Direct mode is
a separate local protocol proof, not a production backend. See
[runtime](runtime.md).

## Secrets, cgroup, and shutdown

Pass `EXEC_DAEMON_AUTH_TOKEN` and `EXEC_DAEMON_PTY_AUTH_TOKEN` in the
environment or through the `*_FILE` paths. Do not put them in argv, unit files,
image layers, or proof artifacts. cgroup limits are properties of the service
manager or the proof harness; the daemon reports the cgroup it is running in.
Stop the daemon with `SIGTERM` and start it again. `SIGKILL` is only the
fallback when it does not exit.
