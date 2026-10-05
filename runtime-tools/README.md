# Captured runtime tools

These two binaries are the pieces of the observed 2026-10-04 exec-daemon image
that a public download cannot replace and that fit in git.

- `ripgrep/linux-x64/rg` is ripgrep 15.1.0-cursor5. The daemon passes
  `--cursor-ignore` to it.
- `cursorsandbox/linux-x64/cursorsandbox` is the Linux sandbox helper.

`runtime/tools.lock.json` is the hash source of truth. Provisioning copies them
into `dist/runtime/` and checks the hash before trusting them. They are not part
of the immutable vendor snapshot. No new license is granted for them.
