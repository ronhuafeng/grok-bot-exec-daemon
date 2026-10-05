# Contributing

Start with [architecture](docs/architecture.md) and [provenance](docs/provenance.md).
This is a reconstructed application with retained upstream dependencies; source
organization does not establish redistribution rights.

## Small change workflow

1. Use Node 22.20+ or 24.3+, Bash and Git. Install with
   `npm ci --ignore-scripts --no-audit --no-fund`.
2. Run `npm run check` on a complete checkout.
3. Edit the relevant normal module and its named imports. Add focused success
   and failure tests using real candidate imports.
4. Run `npm run typecheck`, `npm test`, then `npm run check`.
5. Describe behavior changes, exact verification and any remaining limits in the PR.

A ring-buffer, trace parser or configuration change should need only that module,
its direct contracts and its test. Do not add ambient runtime bindings, broad
`any` types, suppressions or source exclusions to make compilation pass. Raw
registry IDs belong in the vendor adapter, never in application modules.

Use explicit narrow fixture ports or standard module mocks for side effects.
Tests must not use credentials, start a live daemon, contact services or load
real native addons. Baseline evaluation is allowed only as an isolated oracle;
the candidate must run through Node's real module loader.

`src/runtime/manifest.json` records original-source coverage and new support
modules. When adding a runtime module, update that inventory. Do not change
historical source-retirement evidence to accommodate a new behavior change.
Normal feature edits do not require matching the old bundle's AST spelling.

Tests use Node's [standard module and property mocks](https://nodejs.org/download/release/latest-jod/docs/api/test.html#mockpropertyobject-propertyname-value).
The package engine floor reflects those test APIs, not a claim about the
original native runtime's ABI.

## Extending a dependency boundary

Add a descriptive export to the relevant `src/interop/vendor/` facade, backed by
the exact retained value and an evidence-based contract. Check constructor/key
identity, loading timing and actual call signatures. Never substitute a runtime
package merely because its npm name or current types look compatible.

`npm run verify:contracts` checks the source-derived protobuf declarations.
`npm run generate:contracts` regenerates them. Both strictly compile the project.
The bootstrap compiler uses Node's built-in type stripping for its small driver;
the TypeScript compiler then checks the driver and the whole project before emit.

## Original snapshot

Never edit or run `npm install` inside `vendor/exec-daemon-runtime`. Its npm and
installed dependencies are payload, not development dependencies. A baseline
update requires a separate origin, rights, notice, inventory and ABI review.

For occasional provenance inspection:

```sh
npm run recover -- --output /tmp/exec-daemon-recovered
```

The output directory must be new. This recovers the original 21 compiled
factories for inspection, not the missing upstream TypeScript. Do not commit
those wrappers, generated `dist/`, credentials, machine configuration or tools.
