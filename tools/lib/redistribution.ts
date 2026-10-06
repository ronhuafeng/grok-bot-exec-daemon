import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { root } from './project.js';
import { parseRuntimeToolLock } from './runtime-provision.js';

export const REDISTRIBUTION_STATUSES = ['redistributable', 'fetch-at-install', 'internal', 'unresolved', 'blocked'] as const;
export type RedistributionStatus = typeof REDISTRIBUTION_STATUSES[number];

/** Classes that enter a release even though they are not rows in the tool lock. */
export const FIXED_REDISTRIBUTION_IDS = [
  'project-source',
  'vendor-snapshot',
  'native:pty.node',
  'native:polished-renderer.node',
  'native:tree-sitter',
  'native:tree-sitter-bash',
] as const;

const sha256Pattern = /^[0-9a-f]{64}$/;
const sourcePattern = /^https:\/\/[^\s]+$/;

export interface RedistributionEvaluation {
  ok: boolean;
  errors: string[];
}

export function requiredRedistributionIds(lockJson: unknown): string[] {
  const lock = parseRuntimeToolLock(lockJson);
  const ids: string[] = [...FIXED_REDISTRIBUTION_IDS];
  for (const tool of lock.tools) ids.push(tool.id);
  return ids;
}

/** Fail closed on missing status. Public mode also rejects unresolved, blocked, and internal components. */
export function evaluateRedistribution(inventory: unknown, mode: 'completeness' | 'public', requiredIds: readonly string[], rootDir = root): RedistributionEvaluation {
  const errors: string[] = [];
  const record = objectValue(inventory);
  if (record === undefined || record.schemaVersion !== 1) errors.push('Redistribution inventory schema is missing');
  const notice = record?.notice;
  if (typeof notice !== 'string' || notice.trim() === '') errors.push('Redistribution inventory notice path is missing');
  const components = arrayValue(record?.components);
  if (components === undefined) {
    errors.push('Redistribution inventory components are missing');
    return { ok: false, errors };
  }
  const seen = new Set<string>();
  for (let index = 0; index < components.length; index += 1) {
    const entry: unknown = components[index];
    const component = objectValue(entry);
    const label = component !== undefined && typeof component.id === 'string' && component.id !== '' ? component.id : `components[${index}]`;
    if (component === undefined) {
      errors.push(`${label} is not an object`);
      continue;
    }
    if (typeof component.id !== 'string' || component.id.trim() === '') {
      errors.push(`${label} is missing an id`);
      continue;
    }
    if (seen.has(component.id)) errors.push(`${component.id} is duplicated`);
    seen.add(component.id);
    const status = component.status;
    if (typeof status !== 'string' || status.trim() === '' || !isStatus(status)) {
      errors.push(`${component.id} is missing a distribution status`);
      continue;
    }
    if (typeof component.version !== 'string' || component.version.trim() === '') errors.push(`${component.id} is missing a version`);
    if (typeof component.packaged !== 'boolean') errors.push(`${component.id} is missing packaged`);
    if (typeof component.identity !== 'string' || component.identity.trim() === '') errors.push(`${component.id} is missing an identity`);
    const identityKind = component.identityKind;
    if (identityKind !== 'sha256' && identityKind !== 'git-tree' && identityKind !== 'workspace') {
      errors.push(`${component.id} is missing an identity kind`);
    }
    if (identityKind === 'sha256' && (typeof component.identity !== 'string' || !sha256Pattern.test(component.identity))) {
      errors.push(`${component.id} sha256 identity is incomplete`);
    }
    if (typeof component.bundledPath === 'string') {
      if (identityKind !== 'sha256' || typeof component.identity !== 'string') {
        errors.push(`${component.id} bundled artifact is missing a sha256 identity`);
      } else {
        const fullPath = path.join(rootDir, component.bundledPath);
        let actual = '';
        try {
          actual = createHash('sha256').update(readFileSync(fullPath)).digest('hex');
        } catch {
          errors.push(`${component.id} bundled artifact is missing: ${component.bundledPath}`);
        }
        if (actual !== '' && actual !== component.identity) errors.push(`${component.id} bundled bytes do not match the inventory identity`);
      }
    }
    if (status === 'fetch-at-install' && (typeof component.authorizedSource !== 'string' || !sourcePattern.test(component.authorizedSource))) {
      errors.push(`${component.id} is missing an authorized fetch source`);
    }
    if (status === 'redistributable' && (typeof component.notice !== 'string' || component.notice.trim() === '')) {
      errors.push(`${component.id} is missing a redistribution notice`);
    }
    if (mode === 'public' && (status === 'unresolved' || status === 'blocked' || status === 'internal')) {
      errors.push(`public release rejects ${component.id} (${status})`);
    }
  }
  for (const id of requiredIds) {
    if (!seen.has(id)) errors.push(`${id} is missing a distribution status`);
  }
  return { ok: errors.length === 0, errors };
}

export function loadCommittedRedistributionInventory(): unknown {
  return JSON.parse(readFileSync(path.join(root, 'runtime/redistribution.json'), 'utf8')) as unknown;
}

function isStatus(value: string): value is RedistributionStatus {
  for (const status of REDISTRIBUTION_STATUSES) {
    if (status === value) return true;
  }
  return false;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function arrayValue(value: unknown): readonly unknown[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value as readonly unknown[];
}
