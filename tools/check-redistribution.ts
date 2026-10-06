import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { root } from './lib/project.js';
import { evaluateRedistribution, loadCommittedRedistributionInventory, requiredRedistributionIds } from './lib/redistribution.js';

const { values } = parseArgs({
  options: {
    public: { type: 'boolean', default: false },
  },
});
const mode = values.public === true ? 'public' : 'completeness';
const lock = JSON.parse(readFileSync(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as unknown;
const evaluation = evaluateRedistribution(loadCommittedRedistributionInventory(), mode, requiredRedistributionIds(lock));
if (!evaluation.ok) {
  for (const error of evaluation.errors) console.error(error);
  console.error(`Redistribution ${mode} check failed.`);
  process.exit(1);
}
console.log(`Redistribution ${mode} check passed.`);
