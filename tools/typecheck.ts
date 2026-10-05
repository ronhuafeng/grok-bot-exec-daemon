import { readBaseline, readRuntimeSources } from './lib/bundle.js';
import { checkProjectTypes } from './lib/typecheck.js';
import { verifyModuleGraph } from './lib/module-graph.js';

const sources = await readRuntimeSources(await readBaseline());
await verifyModuleGraph();
checkProjectTypes(sources.map((source) => `src/runtime/${source.file}`));
console.log(`Strict type check and escape audit passed for all ${sources.length} maintained runtime segments and project tooling/tests.`);
