import { readSnapshot } from './lib/snapshot.js';
import { readBaseline, readRuntimeInventory } from './lib/bundle.js';
import { extractVendorCapsule, readCapsuleSources } from './lib/vendor-capsule.js';
import { planRuntimeBuild, readCompiledApplication, verifyRuntimeBuild } from './lib/module-build.js';

const snapshot = await readSnapshot();
const inventory = await readRuntimeInventory(await readBaseline());
const compiled = await readCompiledApplication([...inventory.sources, ...inventory.support].map(source => `src/runtime/${source.file}`));
const plan = planRuntimeBuild(snapshot, compiled, extractVendorCapsule(await readCapsuleSources()));
await verifyRuntimeBuild(plan);
console.log(`Verified exact content, modes, and complete emitted inventory for ${plan.files.length} runtime files.`);
