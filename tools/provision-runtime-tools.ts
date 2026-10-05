import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildRoot, root, runtimeRoot } from './lib/project.js';
import { parseRuntimeToolLock, provisionRuntimeTools } from './lib/runtime-provision.js';
import type { RuntimeProfile } from './lib/runtime-provision.js';

const { values } = parseArgs({
  options: {
    profile: { type: 'string', default: 'supported' },
    environment: { type: 'string' },
  },
});
if (values.profile !== 'core' && values.profile !== 'supported') throw new Error(`Unsupported provision profile: ${values.profile}`);
const profile: RuntimeProfile = values.profile;
const lock = parseRuntimeToolLock(JSON.parse(await readFile(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as unknown);
const actions = await provisionRuntimeTools({
  lock,
  repoRoot: root,
  destRoot: buildRoot,
  vendorRoot: runtimeRoot,
  environmentRoot: values.environment ?? process.env.EXEC_DAEMON_ROOT ?? lock.defaultEnvironment,
  profile,
  verifyExecutables: true,
});
for (const action of actions) console.log(`${action.status.padEnd(10)} ${action.id}: ${action.detail}`);
console.log(`Provisioned runtime profile ${profile} into ${buildRoot}.`);
