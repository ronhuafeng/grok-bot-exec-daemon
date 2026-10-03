import { verifySnapshot } from './lib/snapshot.mjs';

const snapshot = await verifySnapshot();
console.log(`Verified ${snapshot.files.length} imported files: Git blob hashes, sizes, modes, and exact inventory.`);
