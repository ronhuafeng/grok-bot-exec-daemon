#!/bin/bash
# Prepare a Linux host for the supported runtime profile.
# This script is allowed to change host policy. preflight-host is not.
# It does not grant blanket container privileges, the Docker socket, or a host filesystem bind.
set -euo pipefail

sudo apt-get update
sudo apt-get install -y --no-install-recommends bubblewrap ffmpeg fuse3 xz-utils

sudo mkdir -p /cursor/stores
sudo chown "$(id -u):$(id -g)" /cursor /cursor/stores

if ! grep -qx 'user_allow_other' /etc/fuse.conf 2>/dev/null; then
  echo user_allow_other | sudo tee -a /etc/fuse.conf >/dev/null
fi

if [[ -e /proc/sys/kernel/apparmor_restrict_unprivileged_userns ]]; then
  sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0
fi
