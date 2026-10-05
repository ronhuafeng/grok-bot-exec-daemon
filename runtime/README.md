# Runtime contract

This directory records the Linux x86-64 runtime that loads the pinned snapshot's
native addons. It does not replace `vendor/exec-daemon-runtime/`. That tree stays
the 2026-10-01 snapshot. `npm run verify:snapshot` still rejects extra files there.

`npm run provision` installs the locked tools into `dist/runtime/`. Core tools are
required. The other tools are copied only when an observed environment, by default
`/exec-daemon`, contains the locked bytes.

| Tool | How it is obtained |
| --- | --- |
| `node` 22.14.0, ABI 127 | Official `nodejs.org` linux-x64 binary, byte-identical to the observed environment |
| `rg` 15.1.0-cursor5 | `runtime-tools/ripgrep/` (`--cursor-ignore`) |
| `cursorsandbox` | `runtime-tools/cursorsandbox/` |
| `origin` | Git LFS: `runtime-tools/origin/` |
| `cursor-agent-store-fuse` | Git LFS: `runtime-tools/agent-store/` |
| `tmux-root` | Git LFS archive `runtime-tools/tmux-root/linux-x64/tmux-root.tar`, extracted on provision |
| `gh`, `ssh-keygen` | Optional. Copied only when the observed environment matches the lock |

`node` is larger than GitHub's 100 MB file limit, so it is downloaded rather than
stored. `origin` is also over that limit and is stored with Git LFS, as are the
agent-store helper and the tmux archive. No new license is granted for the
captured binaries. See [provenance](../docs/provenance.md). A checkout has to
fetch LFS objects (`git lfs pull`) before `npm run provision` can see them.

```sh
npm run build
npm run provision
npm run doctor
npm run test:live
```

`npm run provision -- --profile core` installs Node and ripgrep only.
The default `--profile supported` also installs `cursorsandbox`, `origin`,
`cursor-agent-store-fuse`, and `tmux-root`. `gh` and `ssh-keygen` are optional
in that profile: they are copied when present and skipped when absent.
