# AGENTS.md

## Scope

This file applies to the whole repository. A more specific `AGENTS.md` or
`AGENTS.override.md` in a subdirectory may add or override guidance for that
subtree.

Read only the documentation relevant to the task:

- Use [architecture](docs/architecture.md) for module, dependency, and vendor-boundary changes.
- Use [provenance](docs/provenance.md) for snapshot, captured-tool, licensing, or redistribution questions.
- Use [runtime prerequisites](docs/runtime.md) for provisioning, deployment, host, and live-runtime work.
- Use [property-oriented verification](docs/verification-methodology.md) for tests, evidence, reviews, and issue acceptance.
- Use [type safety and verification](docs/strict-typescript.md) when changing reconstructed types, migration evidence, or verification claims.
- Use [CONTRIBUTING.md](CONTRIBUTING.md) for the normal development workflow.

Do not read the whole documentation tree before routine edits.

## Repository invariants

- Treat `vendor/exec-daemon-runtime/` as an immutable imported snapshot. Do not edit it for normal feature work.
- Keep application code in ordinary strict TypeScript modules under `src/runtime/`.
- Keep raw vendor registry IDs, private bindings, and minified dependency details inside the vendor adapter boundary under `src/interop/vendor/`.
- Do not replace retained runtime implementations with similarly named packages merely because a public package appears equivalent.
- Do not weaken strict typing with broad `any`, suppressions, source exclusions, or ambient escape hatches just to make a change compile.
- When adding a maintained runtime module, update the source inventory that owns that coverage.
- Do not commit generated `dist/` output, credentials, machine-local configuration, or untracked local tool copies.

## Verification and acceptance

Verification is property-oriented. The project property is the subject of the
claim; tests, local fixtures, Docker invocations, and GitHub Actions are proof
harnesses used to obtain evidence.

- State the property or observable outcome before choosing a test or workflow.
- Do not infer that a property is false merely because a proof harness failed.
  First distinguish a property contradiction from environment, fixture,
  provisioning, orchestration, or reporting failure.
- Do not treat a green workflow as proof of behavior it did not directly observe.
- Keep property status, evidence strength, and automation status separate when
  they differ.
- Prefer direct observable witnesses: process results, protocol responses,
  filesystem effects, browser events, recordings, native loads, or equivalent
  behavior.
- For negative properties, distinguish the intended denial from generic setup or
  startup failure. A nonzero exit alone is usually insufficient.
- Local acceptance evidence is valid when it records the revision, relevant
  environment/tool identities, command or fixture, observable result, and known
  limits. CI improves repeatability; it is not the truth authority.
- A skipped, blocked, or not-run required check is not a pass.
- Match claims to evidence narrowly. If a stronger property matters, add a
  stronger witness rather than broadening the interpretation of existing proof.

See [docs/verification-methodology.md](docs/verification-methodology.md) for the
full methodology.

## Tests and runtime work

- Start with focused tests for the changed behavior.
- Keep ordinary project tests offline and controlled; put listening-daemon,
  native-addon, PTY, sandbox, FUSE, cgroup, browser, and other host-dependent
  behavior in the appropriate live acceptance harness.
- On a complete checkout, run `npm run check` before considering code changes complete.
- For runtime/deployment changes, run the relevant live or profile-specific proof
  when the required environment is available. If it is not available, report
  that automation/evidence limitation explicitly instead of manufacturing a
  substitute pass.
- Preserve failure-path cleanup for processes, mounts, listeners, temporary
  directories, and other resources created by tests.

## Agent guidance maintenance

Keep this file small and durable. Put specialized workflows in the owning
documentation or a more specific subtree `AGENTS.md` rather than growing a
repository-wide checklist.

When work depends on current OpenAI or Codex behavior, consult current official
OpenAI documentation rather than relying on remembered product behavior. Use the
OpenAI developer documentation MCP server when it is configured and relevant.
