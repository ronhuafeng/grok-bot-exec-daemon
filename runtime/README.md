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
| `gh`, `ssh-keygen`, `origin`, `tmux-root` | Environment copy when the lock hash matches |

`node` and `origin` are larger than GitHub's 100 MB file limit, so they are not
stored in git. No new license is granted for the captured `rg` and `cursorsandbox`
binaries. See [provenance](../docs/provenance.md).

```sh
npm run build
npm run provision
npm run doctor
npm run test:live
```

`npm run provision -- --profile core` installs Node and ripgrep only.
The default `--profile supported` also installs `cursorsandbox` and any optional
environment tools whose hashes match.
