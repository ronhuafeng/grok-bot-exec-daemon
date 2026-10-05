#!/bin/sh
set -eu
if [ -z "${EXEC_DAEMON_AUTH_TOKEN:-}" ] || [ -z "${EXEC_DAEMON_PTY_AUTH_TOKEN:-}" ]; then
  echo "EXEC_DAEMON_AUTH_TOKEN and EXEC_DAEMON_PTY_AUTH_TOKEN are required at runtime" >&2
  exit 1
fi
data="${CURSOR_EXEC_DAEMON_DATA_DIR:-/data}"
mkdir -p "$data" /workspace
if [ ! -d /workspace/.git ]; then
  git init /workspace >/dev/null
fi
cd /workspace
exec /opt/exec-daemon/bin/exec-daemon serve \
  --bind-host "${EXEC_DAEMON_BIND_HOST:-0.0.0.0}" \
  --pty-bind-host "${EXEC_DAEMON_PTY_BIND_HOST:-0.0.0.0}" \
  --port "${EXEC_DAEMON_PORT:-8080}" \
  --pty-websocket-port "${EXEC_DAEMON_PTY_PORT:-8081}" \
  --rg-path /opt/exec-daemon/dist/runtime/rg \
  --project-dir /workspace \
  --log-level error
