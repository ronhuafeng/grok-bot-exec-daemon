# Property-oriented verification

## Purpose

Verification in this repository is organized around **project properties**, not
around particular CI workflows, test commands, or runners.

A workflow is one implementation of a proof harness. It can be incomplete,
misconfigured, or buggy while the property it is intended to demonstrate is
still true. Conversely, a green workflow proves only the properties its
observations actually cover; it is not evidence for unrelated behavior.

Use this distinction when designing tests, reviewing pull requests, interpreting
failures, and deciding whether an issue's acceptance criteria are satisfied.

## Verification model

The project separates five concepts:

1. **Property** — an observable claim about the project. Examples: the pinned
   native addons load under Node 22.14.0; a sandbox policy blocks a network
   connection; computer-use can deliver pointer and keyboard input to an X11
   desktop; a core container runs with a read-only root filesystem.
2. **Specification** — the required semantics and scope of that property,
   including prerequisites and explicit limits.
3. **Evidence / witness** — an observation that bears directly on the property:
   a real process result, protocol response, filesystem effect, browser event,
   recording, native load, or other inspectable outcome.
4. **Proof harness** — the machinery that constructs the environment and
   produces evidence: a GitHub Actions workflow, local acceptance command,
   fixture, Docker invocation, test runner, or provisioning script.
5. **Proof record** — durable metadata that binds evidence to a revision and
   environment, such as JUnit output, Actions logs, hashes, or
   `runtime-proof.json`.

The relationship is:

```text
specification
     │
     ▼
  property  ◀──────── evidence / witness
                         ▲
                         │
                    proof harness
                         │
                         ▼
                    proof record
```

The proof harness is therefore **not the authority that defines whether a
property is true**. It is a maintained implementation used to obtain repeatable
evidence about that property.

## Interpret failures at the layer that failed

Do not infer that a runtime property is false merely because its workflow is red.
First identify which layer failed.

### Property contradiction

A failure contradicts the property when its prerequisites were established, the
test reached the behavior under evaluation, and the observed result violates the
specified semantics.

Example: a local TCP fixture is reachable without confinement, the sandbox starts
successfully, and the confined process reaches that same TCP fixture despite a
network-denying policy. That is evidence against the sandbox network-isolation
property.

### Harness or environment failure

A failure in environment construction, provisioning, fixture setup, or CI
orchestration does not by itself contradict the property. It means the harness
did not obtain the intended evidence.

Examples:

- a desktop acceptance test requires a window manager but the workflow forgot to
  install it;
- an LFS object was not checked out;
- a test fixture port could not be allocated;
- a required executable was absent before the behavior test began.

These failures should be fixed because automated proof matters, but their
correct interpretation is **property unknown for that run**, not **property
false**.

### Evidence/reporting failure

A reporting or artifact-generation failure is separate again. If a native test
already produced authoritative evidence, a later failure to summarize or upload
that evidence must not rewrite the test result. The proof record should report
its own failure honestly.

### Skip or blocked execution

A skipped, not-run, or prerequisite-blocked check is not a pass. It says no
positive evidence was produced for that required property in that run. Optional
profiles may intentionally remain unexecuted, but the record must preserve that
distinction.

## Evidence is not CI-exclusive

GitHub Actions is valuable because it makes evidence repeatable, reviewable, and
easy to associate with a commit. It is not the only valid source of evidence.

A local acceptance result can establish a property when it is sufficiently
auditable. Record at least:

- the exact source revision;
- relevant runtime/tool identities;
- host/environment prerequisites;
- the command or fixture used;
- the observable result;
- known limits of the claim.

CI should normally be added so the same property is rechecked continuously, but
a broken CI recipe does not erase a stronger direct witness already obtained.
The automation status and property status must be reported separately.

## Keep three statuses separate

Reviews and roadmaps should avoid collapsing verification into one green/red
label. Report at least these dimensions:

| Dimension | Typical states |
| --- | --- |
| Property | proven / contradicted / unknown |
| Evidence | direct E2E / integration / model or unit / source-only |
| Automation | reproducible CI / CI broken or incomplete / manual only |

For example:

```text
computer-use
  property:    proven
  evidence:    direct local E2E
  automation:  CI harness incomplete
```

This is materially different from saying that computer-use failed.

## Match the claim to the evidence

Evidence establishes only the property it directly observes.

Examples:

- Loading `polished-renderer.node` proves native compatibility, not successful
  recording.
- Raw read/write operations through a FUSE mount prove filesystem substrate
  behavior, not every daemon feature that consumes that mount.
- A working core OCI image proves core container operability, not strict
  bit-for-bit build reproducibility.
- A successful sandbox process launch does not prove filesystem or network
  confinement until those effects are observed.
- A unit model of liveness decisions proves those decision semantics; it does not
  by itself prove kernel FUSE abort behavior.

When a stronger claim matters, add a stronger witness instead of stretching the
meaning of existing evidence.

## Issue acceptance

An issue owns an outcome or property, not a particular implementation technique
unless the technique is itself part of the accepted contract.

Close an issue when its acceptance property is supported by adequate evidence
for the stated scope. Do not keep it open solely because one proof harness needs
maintenance unless automated reproducibility is itself an acceptance criterion.

Likewise, do not close an issue merely because a workflow is green. Confirm that
the workflow actually observes the issue's property and that prerequisite,
skip, and reporting behavior cannot manufacture a false pass.

If a discovered problem belongs to a different layer, record it separately.
Examples include:

- runtime property is proven, but CI reproduction is broken;
- container operability is proven, but build reproducibility is not;
- FUSE semantics are proven, but a daemon-level Agent Store integration remains
  unproven.

This keeps roadmap items independently verifiable and prevents proof
infrastructure from becoming an accidental product specification.

## Designing new proofs

For a new capability:

1. State the property in observable terms.
2. State prerequisites separately from the property.
3. Choose the narrowest direct witness that would distinguish success from a
   setup failure or unrelated failure.
4. Implement the fixture/test so prerequisites fail distinctly.
5. Automate the witness in an appropriate harness.
6. Preserve the native result and relevant environment identity in durable
   evidence.
7. Document what remains outside the proof.

Negative tests require special care: a generic nonzero exit is rarely sufficient.
For example, a sandbox denial test should distinguish a confinement-specific
result from a missing helper or failed sandbox startup.

## Relationship to existing verification

[Type safety and verification](strict-typescript.md) describes the concrete
compiler, migration, behavior, and runtime evidence maintained by this project.
[Runtime prerequisites](runtime.md) describes the environment required by live
runtime proofs. This document defines how those observations are interpreted.

The goal is not to make workflows authoritative. The goal is to make project
properties explicit and to accumulate evidence that is direct, honest about its
scope, reproducible where practical, and resistant to false positive
interpretation.
