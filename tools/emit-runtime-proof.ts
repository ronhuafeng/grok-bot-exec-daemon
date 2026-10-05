import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { root } from './lib/project.js';
import { buildRuntimeProof } from './lib/runtime-proof.js';
import type { RuntimeProofTool } from './lib/runtime-proof.js';

function capture(command: string, args: string[]): string {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed`);
  return result.stdout.trim();
}

const { values } = parseArgs({
  options: {
    tap: { type: 'string' },
    output: { type: 'string', default: 'runtime-proof.json' },
  },
});
if (values.tap === undefined) throw new Error('--tap is required');
const lock = JSON.parse(readFileSync(path.join(root, 'runtime/tools.lock.json'), 'utf8')) as {
  tools: { id: string; version: string; sha256?: string; sources?: { kind: string; sha256?: string }[] }[];
};
const tools: RuntimeProofTool[] = lock.tools.flatMap(tool => {
  const archive = tool.sources?.find(source => source.kind === 'repo-archive' && source.sha256 !== undefined);
  const sha256 = tool.sha256 ?? archive?.sha256;
  return sha256 === undefined ? [] : [{ id: tool.id, version: tool.version, sha256 }];
});
const node = capture(path.join(root, 'dist/runtime/node'), ['-p', 'process.version + " " + process.versions.modules']).split(' ');
const version = node[0];
const modules = Number(node[1]);
if (version === undefined || !Number.isInteger(modules)) throw new Error('Provisioned Node did not report its ABI');
const proof = buildRuntimeProof({
  commit: capture('git', ['-C', root, 'rev-parse', 'HEAD']),
  profile: 'supported',
  host: { os: process.platform, arch: process.arch, kernel: capture('uname', ['-r']), libc: capture('getconf', ['GNU_LIBC_VERSION']) },
  node: { version, modules },
  tools,
  tap: readFileSync(values.tap, 'utf8'),
});
writeFileSync(path.resolve(values.output), `${JSON.stringify(proof, null, 2)}\n`);
console.log(`Wrote runtime proof ${proof.commit} with ${proof.checks.length} passed checks.`);
