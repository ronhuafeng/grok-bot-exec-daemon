# Core self-host container

`deploy/Dockerfile` builds the core profile from a checkout that already contains
the Git LFS objects. The image compiles the project, installs the locked Node
22.14.0 and ripgrep, and keeps the runtime tree under `/opt/exec-daemon`. It
does not install bubblewrap, FUSE, or a desktop. It does install the shared
libraries required to load the bundled native addons, including
`polished-renderer.node`.

```sh
docker build -f deploy/Dockerfile -t exec-daemon-core:local .
docker run --read-only \
  --tmpfs /tmp:rw,nosuid,mode=1777 \
  --tmpfs /home/exec:rw,nosuid,uid=1010,gid=1010,mode=755 \
  --tmpfs /data:rw,nosuid,uid=1010,gid=1010,mode=755 \
  --tmpfs /workspace:rw,nosuid,uid=1010,gid=1010,mode=755 \
  -e EXEC_DAEMON_AUTH_TOKEN -e EXEC_DAEMON_PTY_AUTH_TOKEN \
  -p 127.0.0.1::8080 -p 127.0.0.1::8081 \
  exec-daemon-core:local
```

The default process is user `exec` (uid 1010). The root filesystem can be
read-only. These mounts must be writable:

| Mount | Purpose |
| --- | --- |
| `/data` | `CURSOR_EXEC_DAEMON_DATA_DIR` (`logs/`, `artifacts/`, `recording-staging/`, request-context cache) |
| `/workspace` | project directory |
| `/tmp` | temporary files |
| `/home/exec` | home directory |

Authentication comes from `EXEC_DAEMON_AUTH_TOKEN` and
`EXEC_DAEMON_PTY_AUTH_TOKEN` at `docker run` time. The image does not contain
those values. The listeners bind inside the container network namespace; publish
them on the host loopback, for example `-p 127.0.0.1::8080`. The container does
not need the Docker socket or a host filesystem bind.

Sandbox and Agent Store stay optional. A host that wants them must add
`bubblewrap` or `/dev/fuse`, `fusermount3`, and `user_allow_other` itself and
pass the matching device or capability. The core image does not grant those
privileges. `npm run preflight -- --profile sandbox` and `--profile agent-store`
describe the host side of that choice.
