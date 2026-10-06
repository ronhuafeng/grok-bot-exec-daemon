import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from '../tools/lib/project.js';

function text(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8');
}

test('the supported host recipe is the runtime-proof bootstrap and preflight stays read-only', () => {
  const script = text('deploy/bootstrap-supported-host.sh');
  const workflow = text('.github/workflows/runtime-proof.yml');
  const preflight = text('tools/preflight-host.ts');
  const doc = text('docs/supported-host.md');
  assert.match(script, /bubblewrap/);
  assert.match(script, /user_allow_other/);
  assert.match(script, /apparmor_restrict_unprivileged_userns/);
  assert.doesNotMatch(script, /--privileged/);
  assert.match(workflow, /deploy\/bootstrap-supported-host\.sh/);
  assert.doesNotMatch(workflow, /apt-get install/);
  assert.doesNotMatch(workflow, /sysctl/);
  assert.doesNotMatch(preflight, /sysctl/);
  assert.match(doc, /CURSOR_EXEC_DAEMON_DATA_DIR/);
  assert.match(doc, /prepared-runner/);
  assert.match(doc, /core container/i);
  assert.match(doc, /does not become the supported profile|lower-privilege/);
});
