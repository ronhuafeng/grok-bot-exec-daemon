# Provenance and licensing

## Observed origin

- Repository: `ronhuafeng/grok-bot-exec-daemon`
- Imported snapshot commit: `89afb204a8a326803669563ff7eda622b9c348d0`
- Original tree: `0f2a68dbfdfd3018916dee2b1fbceefc3228b9cb`
- Snapshot package name: `@anysphere/exec-daemon-runtime`
- Snapshot package was already `private: true`
- Upstream `gitCommit`: `unknown`
- Build timestamp recorded in that package: `2026-10-01T21:30:36.601Z`
- 2,270 tracked files, 52,763,977 bytes

The repository history at import contains the local-state/tool exclusions
commit followed by the installed snapshot. It does not establish an upstream
source repository, a release version, or permission to redistribute the whole
runtime. Recorded timestamps and package names are provenance clues, not an
independent authenticity attestation.

The entire original tree, including its package metadata and `.gitignore`, is
preserved under `vendor/exec-daemon-runtime/`. Its entrypoint retains Git blob ID
`fb1031be19418755e01e5a2de8a31253da50809a`.

The first project conversion extracted 21 compiled factories and reconstructed
that entrypoint byte for byte. The subsequent strict-TypeScript reconstruction
accounts for all 64 identifiable application source segments inside those factories.
The normal-module migration retains 63 feature segments and retires one closed,
unreachable platform-only segment with exact source evidence.
It was newly authored from the readable JavaScript and retained descriptors;
it is not recovery of the original TypeScript. Types and formatting change
emitted bytes. See [migration evidence](strict-typescript.md) for the behavior checks
and bounded source-retirement evidence. Shared-package and third-party code stays
in the immutable baseline; source location does not change its ownership.

## What is missing

There are no original `.ts`/`.tsx` implementation files or `.map` source-map
files in the imported tree. SDK `.d.ts` declarations and comments referencing
source maps do not restore those sources. Upstream workspace/build manifests,
the dependency lockfile, native-addon sources, and original tests are also
absent. Some dependency packages are partial installed payloads rather than
complete source packages.

The 2026-10-01 snapshot still excludes its original tool executables. Later
captures under `runtime-tools/` are not part of that snapshot and do not replace
it. `runtime/tools.lock.json` is the hash source of truth.

## Captured runtime tools

Observed from the 2026-10-04 exec-daemon image (`buildTimestamp`
`2026-10-04T20:39:01.722Z`) unless noted. No source or build recipe was supplied
for the non-Node tools. Matching a hash does not infer a redistribution license.

| Tool | Observed path | SHA256 | Size | Storage |
| --- | --- | --- | --- | --- |
| Node.js 22.14.0 linux-x64 | `/exec-daemon/node` | `1abce2374a485bddae3c27b17a3e3143e2780232026e627c4fe74ddde3f380a1` | 120177224 | Not stored. Byte-identical to the official nodejs.org linux-x64 binary |
| ripgrep 15.1.0-cursor5 | `/exec-daemon/rg` | `d42ae51b08e3a368ff9504ea713dc05934a6315f759531eb1f714147dd9989a5` | 5396392 | Ordinary blob. Not an upstream ripgrep release; it accepts `--cursor-ignore` |
| cursorsandbox | `/exec-daemon/cursorsandbox` | `62e854f33837c53f6fa52e09deca5e3e8d56307eb876e48a7bac6e7e07aa4cc7` | 4777184 | Ordinary blob. No public source was supplied |
| origin 2026.09.24-20-34-11-8ed25e0 | `/exec-daemon/tools/origin` | `1b28f4195dccf349cfd1ef66e42cb20b7fcaf126bc503949ff121f802067ca5e` | 105102687 | Git LFS. No public source was supplied |
| tmux 3.5a portable tree | `/exec-daemon/tmux-root` | archive `64fb6a9948a3e341f636fb3ca7dabe5b998faedb710bc53c910b20d4f8dcf9ae` | 8028160 | Git LFS tar. `bin/tmux` SHA256 `b48a48bf7d45c884f183f6ae16d0c9f0852d61221cc3f90a50842e22fea89b7c` |
| cursor-agent-store-fuse | `/usr/local/bin/cursor-agent-store-fuse` on the same machine, 2026-10-05 | `5974ebd1e38b736412940eb61561503c8c94fe9d2493d2d9d9f2e79583fe1bee` | 9377768 | Git LFS. No public source was supplied. Not part of the exec-daemon tree |

`gh` 2.99.0 and `ssh-keygen` were present in that image and are recorded as
optional. They are not stored, because the supported profile does not require
those exact bytes.

## License status

No top-level license grant accompanied the runtime snapshot. No replacement
license is added by this restructuring. `private: true` is a publishing guard,
not a license. Neither the repository name nor generated source organization
establishes rights to publish upstream-owned code.

All imported standalone license/notice files and embedded copyright/license
comments are retained. Examples include the npm license and nested package
licenses, `@jsquash/webp` and its codec notices, `esbuild-wasm/LICENSE.md`, and
`typescript/LICENSE.txt`. These notices apply to their respective components;
they do not grant a blanket license for the complete runtime. This list is not
a completed legal review or comprehensive SBOM.

Before public distribution, the owner must establish permission for the runtime,
the recovered upstream-derived code, native artifacts and assets; reconcile
component notices; decide licensing for newly authored project files; and
document the supported build/runtime toolchain. No repository visibility,
package publishing, release or deployment change is part of this conversion.

## Three different records

These stay separate:

| Record | Question it answers |
| --- | --- |
| This provenance page and `vendor/snapshot.json` | Where the bytes came from |
| `runtime-proof.json` | What a runtime proof run observed |
| `runtime/redistribution.json` | Whether a release may ship each component |

A checksum, a git tree id, `private: true`, or GitHub visibility does not move a
component out of `unresolved`. `node dist/project/tools/check-redistribution.js`
checks that every required class has a status. `node dist/project/tools/check-redistribution.js --public`
fails while any packaged or recorded component is `unresolved`, `blocked`, or
`internal`. Developer and runtime proofs keep using the captured artifacts; those
proofs are not public-release evidence. Notices are indexed in
[runtime/NOTICES.md](../runtime/NOTICES.md).
