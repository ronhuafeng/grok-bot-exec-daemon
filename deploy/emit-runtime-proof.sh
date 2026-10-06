#!/bin/bash
# Write runtime-proof.json after a runtime-proof attempt.
# A failed prerequisite still produces the record. This script does not make that failure green.
set -euo pipefail

stage=""
if [[ "${STAGE_BOOTSTRAP:-success}" != "success" ]]; then
  stage="host-bootstrap"
elif [[ "${STAGE_COMPILE:-success}" != "success" ]]; then
  stage="compile"
elif [[ "${STAGE_PREFLIGHT:-success}" != "success" ]]; then
  stage="host-preflight"
elif [[ "${STAGE_BUILD:-success}" != "success" ]]; then
  stage="build"
elif [[ "${STAGE_PROVISION:-success}" != "success" ]]; then
  stage="provision"
fi

reports=(
  "Native addons and PTY output=proof-reports/native-pty.junit.xml"
  "Launcher and bundled tool behavior=proof-reports/launcher-tools.junit.xml"
  "Origin CLI through the daemon=proof-reports/origin.junit.xml"
  "HTTP and PTY authentication=proof-reports/server.junit.xml"
  "Sandbox filesystem and network confinement=proof-reports/sandbox.junit.xml"
  "Agent Store FUSE mount=proof-reports/agent-store.junit.xml"
  "Agent Store direct backend=proof-reports/agent-store-direct.junit.xml"
  "Cgroup resource reporting=proof-reports/cgroup.junit.xml"
  "Shutdown and restart lifecycle=proof-reports/shutdown.junit.xml"
)

args=()
for report in "${reports[@]}"; do
  args+=(--report "$report")
  if [[ -n "$stage" ]]; then
    step="${report%%=*}"
    args+=(--blocked "$step=$stage failed before behavior tests")
  fi
done
if [[ -n "$stage" ]]; then
  args+=(--failure-stage "$stage")
fi

output="${RUNTIME_PROOF_OUTPUT:-runtime-proof.json}"
args+=(--output "$output")

if [[ -f dist/project/tools/emit-runtime-proof.js ]]; then
  node dist/project/tools/emit-runtime-proof.js "${args[@]}"
else
  node tools/emit-runtime-proof-fallback.mjs "${args[@]}"
fi
