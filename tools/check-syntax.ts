import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { root, listFiles } from './lib/project.js';

let count = 0;
for (const directory of ['dist/project/tools', 'dist/project/tests']) {
  for (const file of await listFiles(path.join(root, directory))) {
    if (!/\.js$/.test(file)) continue;
    const result = spawnSync(process.execPath, ['--check', path.join(root, directory, file)], { stdio: 'inherit' });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
    count++;
  }
}
const shell = spawnSync('bash', ['-n', path.join(root, 'bin/exec-daemon')], { stdio: 'inherit' });
if (shell.error) throw shell.error;
if (shell.status !== 0) process.exit(shell.status ?? 1);
console.log(`Syntax checked ${count} JavaScript files and the project launcher.`);
