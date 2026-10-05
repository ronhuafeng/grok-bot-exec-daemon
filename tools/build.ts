import { readSnapshot, verifySnapshot } from './lib/snapshot.js';
import { readBaseline, readRuntimeInventory } from './lib/bundle.js';
import { extractVendorCapsule, readCapsuleSources } from './lib/vendor-capsule.js';
import { materializeRuntimeBuild, planRuntimeBuild, readCompiledApplication, verifyRuntimeBuild } from './lib/module-build.js';

// Production packaging never substitutes an available-subset snapshot check.
const snapshot = await verifySnapshot();
if (snapshot.files.length !== 2270) throw new Error('Production packaging requires the complete 2,270-file pinned payload');
const inventory = await readRuntimeInventory(await readBaseline());
const required = [...inventory.sources, ...inventory.support].map(source => `src/runtime/${source.file}`);
const compiled = await readCompiledApplication(required);
const capsule = extractVendorCapsule(await readCapsuleSources());
const plan = planRuntimeBuild(await readSnapshot(), compiled, capsule);
await materializeRuntimeBuild(plan);
await verifyRuntimeBuild(plan);
console.log(`Built and verified ${plan.files.length} runtime files: ${inventory.sources.length} ordinary owned modules, ${inventory.support.length} support modules, one vendor-only capsule.`);
console.log('Separately provisioned tools are untouched and excluded from artifact verification. No daemon or native addon was executed.');
