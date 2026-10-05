# Captured runtime tools

These binaries are the pieces of the observed environment that a public download
cannot replace.

- `ripgrep/linux-x64/rg` is ripgrep 15.1.0-cursor5. The daemon passes
  `--cursor-ignore` to it.
- `cursorsandbox/linux-x64/cursorsandbox` is the Linux sandbox helper.
- `origin/linux-x64/origin`, `agent-store/linux-x64/cursor-agent-store-fuse`,
  and `tmux-root/linux-x64/tmux-root.tar` are Git LFS objects. The tar is the
  portable tmux tree, including its library symlinks. Provisioning extracts it
  to `dist/runtime/tmux-root/`.

`runtime/tools.lock.json` is the hash source of truth. Provisioning copies them
into `dist/runtime/` and checks the hash before trusting them. They are not part
of the immutable vendor snapshot. No new license is granted for them.
