# Contributing

Read [architecture](docs/architecture.md) and [provenance](docs/provenance.md)
before changing code. This is a recovered installed snapshot; do not imply that
it is the original upstream project or that all bundled code is licensed alike.

## Small change workflow

1. Use Node 22 or 24, Bash, and Git; run `npm ci --ignore-scripts --no-audit --no-fund`.
2. Run `npm run check` to establish the current baseline.
3. Edit the relevant `src/recovered/*.cjs` factory, or project tooling under
   `tools/`. Keep existing module IDs and exported Webpack keys stable unless
   every consumer is explicitly migrated.
4. Add a focused test in `tests/`. Never use real credentials or a live daemon
   for an ordinary unit test. Test error paths and changed behavior.
5. Run `npm run check` again. Inspect the resulting bundle diff against the
   preserved snapshot. Only intended factory sections should differ.
6. Explain the change, exact checks, and remaining runtime/platform limitations
   in the pull request. Do not merge generated `dist/` output.

`npm run lint` is a dependency-free JavaScript/Bash syntax check, not a style or
type checker. Recovered JavaScript lacks the original TypeScript types; there
is no honest upstream typecheck to run yet.

## Regenerating the recovery

```sh
npm run recover -- --output /tmp/exec-daemon-recovered
diff -ru /tmp/exec-daemon-recovered src/recovered
```

The output directory must not exist. Recovery does not overwrite maintained
sources. `npm run verify:reproduction` must pass on the initial structural-only
conversion; after intentional behavior changes its failure simply means the
sources no longer match the old snapshot. It is not part of the routine CI gate.

Do not edit or run `npm install` inside `vendor/exec-daemon-runtime`. Installed
dependencies and bundled npm are runtime payload, not this project's dev
dependencies. Blindly replacing them with current npm versions is unsafe.
Updating the vendor baseline is a separate reviewed import: establish origin,
rights, file inventory, permissions, notices, module boundaries and platform
requirements, then update the provenance manifest and recovery together.

Do not add real tokens, host configuration, downloaded tool executables or
local state to commits. There are no automatic publish/deploy steps.
