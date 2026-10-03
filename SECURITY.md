# Security

This runtime can execute commands, access files, manage terminals and optionally
control browsers/computers. Treat a running daemon and its authentication token
as access to the host. Do not expose it to untrusted networks or supply real
credentials during unit tests.

This restructuring does not audit or fix all upstream vulnerabilities. Vendored
packages, native addons, npm, and WASM are an imported snapshot, not a claim that
every dependency is current or safe. Hash verification detects changes against
that snapshot; it does not prove the snapshot's authenticity or security.

Do not publish secrets or exploit details in a public issue. For a sensitive
report, use the repository owner's established private contact channel. No
dedicated security mailbox or private vulnerability-reporting setup is assumed.

Build/check commands parse and assemble JavaScript and run scoped tests. They do
not start the server, read host credentials, load native addons, download tools,
or publish artifacts. Review changes to tooling and CI with the same care as
runtime code. Do not grant CI write access or secrets for these offline checks.

Platform/toolchain compatibility and complete licensing/provenance review are
still required before any production rollout or public distribution.
