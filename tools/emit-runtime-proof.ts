import path from 'node:path';
import { parseArgs } from 'node:util';
import { emitRuntimeProof } from './lib/emit-runtime-proof.js';
import type { CheckStatus } from './lib/runtime-proof.js';
import { buildRoot } from './lib/project.js';

function parsePair(value: string, flag: string): { step: string; file: string } {
  const split = value.indexOf('=');
  if (split <= 0 || split === value.length - 1) throw new Error(`Invalid ${flag} ${value}`);
  return { step: value.slice(0, split), file: value.slice(split + 1) };
}

const { values } = parseArgs({
  options: {
    report: { type: 'string', multiple: true },
    blocked: { type: 'string', multiple: true },
    output: { type: 'string', default: 'runtime-proof.json' },
    'failure-stage': { type: 'string' },
    'runtime-root': { type: 'string' },
  },
});
const reportArgs = values.report ?? [];
if (reportArgs.length === 0) throw new Error('--report is required');
const blocked = new Map<string, string>();
for (const value of values.blocked ?? []) {
  const parsed = parsePair(value, '--blocked');
  blocked.set(parsed.step, parsed.file);
}
const reports = reportArgs.map(value => parsePair(value, '--report'));
const result = emitRuntimeProof({
  reports,
  blocked,
  outputPath: path.resolve(values.output ?? 'runtime-proof.json'),
  failureStage: values['failure-stage'] ?? null,
  runtimeRoot: values['runtime-root'] ?? buildRoot,
});
const counts: Record<CheckStatus, number> = { passed: 0, failed: 0, skipped: 0, 'not-run': 0, 'prerequisite-blocked': 0 };
for (const capability of result.proof.capabilities) counts[capability.status] += 1;
console.log(`Wrote runtime proof tested ${result.proof.testedCommit} source ${result.proof.sourceCommit}: ${counts.passed} passed, ${counts.failed} failed, ${counts.skipped} skipped, ${counts['not-run']} not-run, ${counts['prerequisite-blocked']} prerequisite-blocked. Reporting ${result.proof.reporting.status}. Failure stage ${result.proof.failureStage ?? 'none'}.`);
if (result.exitCode !== 0) process.exitCode = result.exitCode;
