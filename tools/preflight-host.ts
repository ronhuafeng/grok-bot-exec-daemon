import { parseArgs } from 'node:util';
import { collectHostFacts, evaluateHost, parseHostProfile, parseHostScope, recordHostConfiguration } from './lib/host-preflight.js';

const { values } = parseArgs({
  options: {
    profile: { type: 'string', default: 'supported' },
    scope: { type: 'string', default: 'observed-host' },
  },
});
const profile = parseHostProfile(values.profile ?? 'supported');
const scope = parseHostScope(values.scope ?? 'observed-host');
// Scope is recorded only. It does not change which checks pass.
const facts = collectHostFacts();
const checks = evaluateHost(facts, profile);
for (const check of checks) console.log(`${check.ok ? 'OK' : 'MISSING'}  ${check.id}: ${check.detail}`);
console.log(`host-configuration ${JSON.stringify(recordHostConfiguration(facts, scope))}`);
const unchanged = 'The command does not change host configuration.';
if (checks.some(check => !check.ok)) {
  console.error(`Host preflight failed for profile ${profile}. ${unchanged}`);
  process.exit(1);
}
console.log(`Host preflight passed for profile ${profile}. ${unchanged}`);
