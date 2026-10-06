# Property-oriented verification

## Authority

Project properties are the subject of verification. GitHub Actions is the
continuous acceptance surface for this repository.

A green semantic workflow is accepted proof for the properties its native
steps directly exercised in that declared environment. It is not proof for
behavior the workflow did not run.

There is no second verdict layer after the native test command. Actions already
bind the command, revision, environment, log, and exit status.

## Interpreting a run

A green step means its scoped property was observed successfully.

A red step means that run did not establish the property. Inspect the failing
layer before deciding why:

- If prerequisites were established and the behavior produced the wrong
  observable result, the property is contradicted.
- If checkout, host preparation, provisioning, fixture setup, or orchestration
  failed before the behavior was reached, the proof harness failed for that run.

A skipped required behavior is not a pass.

This asymmetry matters: green semantic CI proves the behavior it observed;
red CI identifies an unsuccessful proof run but does not by itself say whether
the product behavior or the harness was wrong.

## Designing verification

Prefer the shortest direct witness.

- Type and pure logic rules belong in focused project tests.
- Native addons, PTY, listeners, sandbox, FUSE, cgroups, browser interaction,
  recording, shutdown, and container behavior belong in their live/profile
  workflows.
- Negative properties must distinguish the intended denial from a generic
  startup or dependency failure.
- Workflow step names should state the property being exercised.
- Run native commands directly and let their exit status control the step.
- Do not add a summary schema, generated verdict, hand-maintained test-name
  inventory, or proof artifact unless a current external consumer requires it.

Local runs are useful for development and diagnosis. The maintained workflows
are the repeatable acceptance authority used for merges and ongoing regression
detection.

## Scope

Evidence proves only the behavior it observes. Loading a native addon does not
prove screen recording; mounting FUSE does not prove every consumer; a working
core image does not prove the full supported host profile.

When a stronger property becomes a current requirement, add the smallest direct
test that distinguishes it from setup failure. Do not broaden an existing
result by interpretation.

## Issue acceptance

Issues own observable outcomes, not historical implementation plans. Close an
issue when the current property is exercised by adequate direct verification at
the intended scope.

If a future environment, platform, backend, or release mode becomes a real
requirement, add verification for that requirement then. Do not make every
current path carry speculative future assurance.

[Type safety and verification](strict-typescript.md) lists the concrete checks.
[Runtime prerequisites](runtime.md) describes the live runtime environment.
