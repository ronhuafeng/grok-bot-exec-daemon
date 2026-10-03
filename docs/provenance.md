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
preserved under `vendor/exec-daemon-runtime/`. The 21 recovered factories are
derived verbatim from its `index.js` using the included recovery tool. The
initial reconstruction has Git blob ID
`fb1031be19418755e01e5a2de8a31253da50809a`, equal to the imported entrypoint.

## What is missing

There are no original `.ts`/`.tsx` implementation files or `.map` source-map
files in the imported tree. SDK `.d.ts` declarations and comments referencing
source maps do not restore those sources. Upstream workspace/build manifests,
the dependency lockfile, native-addon sources, original tests, and the excluded
tool executables are also absent. Some dependency packages are partial installed
payloads rather than complete source packages.

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
