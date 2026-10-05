import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { runtimeRoot, sourceRoot, readJson, validateRelativePath, gitBlobHash, requireRecord, requireString, listFiles } from './project.js';
import { readSnapshot } from './snapshot.js';

const prefix = 'module.exports = {\n';
const suffix = '};\n';
export interface BundleBlock { start: number; end: number; text: string }
export interface OwnedSegment { id: string; factory: string; start: number; end: number; text: string }
export interface RuntimeSource { id: string; factory: string; file: string; source: string }

export async function readBaseline(): Promise<string> {
  const snapshot = await readSnapshot();
  const expected = snapshot.files.find((file) => file.path === 'index.js');
  const bytes = await readFile(path.join(runtimeRoot, 'index.js'));
  if (!expected || gitBlobHash(bytes) !== expected.sha) throw new Error('Baseline bundle differs from the pinned snapshot');
  return bytes.toString('utf8');
}

export function moduleBlocks(bundle: string): Map<string, BundleBlock> {
  const markers = [...bundle.matchAll(/^\/\*\*\*\/ "([^"\n]+)"\n/gm)];
  const blocks = new Map<string, BundleBlock>();
  for (let index = 0; index < markers.length - 1; index++) {
    const marker = markers[index];
    const id = marker?.[1];
    const next = markers[index + 1];
    if (!marker || id === undefined || !next || marker.index === undefined || next.index === undefined) throw new Error('Invalid module marker');
    if (!id.startsWith('./src/')) continue;
    if (blocks.has(id)) throw new Error(`Duplicate module ID: ${id}`);
    const text = bundle.slice(marker.index, next.index);
    if (!text.endsWith('/***/ },\n\n')) throw new Error(`Unsupported module boundary: ${id}`);
    blocks.set(id, { start: marker.index, end: next.index, text });
  }
  if (!blocks.size) throw new Error('No recoverable exec-daemon modules found');
  return blocks;
}

export const wrapFactory = (block: string): string => prefix + block + suffix;

export function unwrapFactory(source: string, id: string): string {
  if (!source.startsWith(prefix) || !source.endsWith(suffix)) throw new Error(`Invalid factory wrapper: ${id}`);
  const text = source.slice(prefix.length, -suffix.length);
  if (!text.startsWith(`/***/ ${JSON.stringify(id)}\n`) || !text.endsWith('/***/ },\n\n')) throw new Error(`Factory ID or boundary changed: ${id}`);
  if ([...text.matchAll(/^\/\*\*\*\/ "([^"\n]+)"\n/gm)].length !== 1) throw new Error(`Expected exactly one factory: ${id}`);
  const parsed = ts.createSourceFile(id, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const host = ts.createCompilerHost({ allowJs: true, noLib: true });
  host.getSourceFile = filename => filename === id ? parsed : undefined;
  const program = ts.createProgram([id], { allowJs: true, noLib: true, noResolve: true }, host);
  if (program.getSyntacticDiagnostics(parsed).length) throw new SyntaxError(`Invalid baseline factory: ${id}`);
  return text;
}

function findNode<T extends ts.Node>(node: ts.Node, predicate: (value: ts.Node) => value is T): T | undefined {
  if (predicate(node)) return node;
  return ts.forEachChild(node, (child) => findNode(child, predicate));
}

function isCompilerPrefix(statement: ts.Statement): boolean {
  if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) return true;
  const text = statement.getText();
  const leading = statement.getSourceFile().text.slice(statement.getFullStart(), statement.getStart());
  if (ts.isVariableStatement(statement) && /\/\* (?:unused harmony import specifier|harmony import) \*\//.test(leading)) return true;
  return /^__webpack_require__\.d\(/.test(text) ||
    (ts.isVariableStatement(statement) && /__webpack_require__(?:\.n)?\(/.test(text));
}

/** Rediscover ownership from the fixed compiler markers; a manifest cannot omit a hard module. */
export function ownedSegments(baseline: string): OwnedSegment[] {
  const result: OwnedSegment[] = [];
  for (const [id, block] of moduleBlocks(baseline)) {
    const text = wrapFactory(block.text);
    const source = ts.createSourceFile(id, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const method = findNode(source, (node): node is ts.MethodDeclaration => ts.isMethodDeclaration(node) && ts.isStringLiteral(node.name) && node.name.text === id);
    if (!method?.body) throw new Error(`Missing factory body: ${id}`);
    let body = method.body;
    if (id === './src/index.ts') {
      const tryStatement = findNode(body, ts.isTryStatement);
      if (!tryStatement) throw new Error('Missing async entrypoint body');
      body = tryStatement.tryBlock;
    }
    const statements = [...body.statements];
    const last = statements.filter((statement) => !statement.getText().startsWith('__webpack_async_result__(')).at(-1);
    if (!last) throw new Error(`Empty factory: ${id}`);
    const markers = [...text.matchAll(/^;\/\/ (.+)$/gm)].filter((marker) => marker.index !== undefined && marker.index > body.pos && marker.index < body.end);
    const ranges: { id: string; start: number; end: number }[] = [];
    if (markers.length) {
      for (let index = 0; index < markers.length; index++) {
        const marker = markers[index];
        const sourceId = marker?.[1];
        if (!marker || marker.index === undefined || sourceId === undefined || !sourceId.startsWith('./src/')) continue;
        ranges.push({ id: sourceId, start: marker.index, end: markers[index + 1]?.index ?? last.end });
      }
    } else {
      let index = 0;
      while (statements[index] && isCompilerPrefix(statements[index])) index++;
      const first = statements[index];
      if (!first) throw new Error(`No owned statements: ${id}`);
      ranges.push({ id, start: first.getFullStart(), end: last.end });
    }
    for (const range of ranges) {
      const external = text.indexOf('\n// EXTERNAL MODULE:', range.start);
      if (external >= 0 && external < range.end) range.end = external;
      result.push({ ...range, factory: id, text: text.slice(range.start, range.end) });
    }
  }
  if (new Set<string>(result.map((segment) => segment.id)).size !== result.length) throw new Error('Duplicate owned source ID');
  return result;
}

export interface RuntimeSupportSource { file: string; purpose: string; source: string; }
export interface RetiredRuntimeSource { id: string; factory: string; proof: string; }
export interface ReviewedDeclarationOmission { name: string; start: number; end: number; sha256: string; }
export interface RuntimeInventory {
  sources: RuntimeSource[];
  support: RuntimeSupportSource[];
  retiredSources: RetiredRuntimeSource[];
  declarations: ReviewedDeclarationOmission[];
}
const retiredDarwinId = './src/darwin-memory.ts';
const omissionProof = 'linux-platform-residue-v1';
const omissionNames = ['execFileSync', 'VM_STAT_PATH', 'VM_STAT_TIMEOUT_MS', 'PAGE_SIZE_PATTERN',
  'readCounter', 'parseDarwinVmStat', 'darwinMemoryFromVmStat', 'runVmStat', 'DEFAULT_TTL_MS',
  'createDarwinMemoryReader', 'os', 'ResourceScope', 'machine_resources_createDarwinMemoryReader',
  'readOsCpu', 'defaultOsHostProbeReads', 'OsHostProbe'];

/** Provenance inventory only. Application source now compiles as ordinary Node
 * modules; no maintained export is erased or inserted into a Webpack closure. */
export async function readRuntimeInventory(baseline: string, directory = sourceRoot): Promise<RuntimeInventory> {
  const manifest = requireRecord(await readJson(path.join(directory, 'manifest.json')), 'runtime source manifest');
  if (manifest.schemaVersion !== 2 || !Array.isArray(manifest.sources) || !Array.isArray(manifest.support) ||
      !Array.isArray(manifest.retiredSources) || !Array.isArray(manifest.reviewedOmissions)) throw new Error('Unsupported runtime module inventory');
  if (manifest.baselineBlob !== gitBlobHash(Buffer.from(baseline))) throw new Error('Runtime inventory baseline mismatch');
  const expected = ownedSegments(baseline);
  const sources: RuntimeSource[] = [];
  const support: RuntimeSupportSource[] = [];
  const retiredSources: RetiredRuntimeSource[] = [];
  const seen = new Set<string>();
  const filenames = new Set<string>();
  const rawRetired: unknown[] = manifest.retiredSources;
  for (const input of rawRetired) {
    const entry = requireRecord(input, 'retired source');
    if (entry.id !== retiredDarwinId || entry.factory !== './src/machine-resources.ts' || entry.proof !== omissionProof || seen.has(entry.id)) {
      throw new Error('Unreviewed or duplicate retired runtime source');
    }
    seen.add(entry.id);
    retiredSources.push({ id: entry.id, factory: entry.factory, proof: entry.proof });
  }
  if (retiredSources.length !== 1) throw new Error('The reviewed Darwin retirement must be recorded exactly once');
  const rawSources: unknown[] = manifest.sources;
  for (const input of rawSources) {
    const entry = requireRecord(input, 'runtime source');
    const id = requireString(entry.id, 'source id');
    const factory = requireString(entry.factory, 'factory');
    const file = validateRelativePath(entry.file);
    if (!file.endsWith('.ts') || file === 'darwin-memory.ts' || seen.has(id) || filenames.has(file) ||
        !expected.some(segment => segment.id === id && segment.factory === factory)) throw new Error(`Invalid runtime source mapping: ${id}`);
    seen.add(id); filenames.add(file);
    sources.push({ id, factory, file, source: await readFile(path.join(directory, file), 'utf8') });
  }
  if (seen.size !== expected.length || expected.some(segment => !seen.has(segment.id))) throw new Error('Every owned runtime segment must be maintained or explicitly retired by reviewed proof');
  const rawSupport: unknown[] = manifest.support;
  for (const input of rawSupport) {
    const entry = requireRecord(input, 'support source');
    const file = validateRelativePath(entry.file);
    const purpose = requireString(entry.purpose, 'support purpose');
    if (!file.endsWith('.ts') || file === 'darwin-memory.ts' || filenames.has(file) || !purpose.trim()) throw new Error(`Invalid or duplicated support source: ${file}`);
    filenames.add(file);
    support.push({ file, purpose, source: await readFile(path.join(directory, file), 'utf8') });
  }
  if (!support.some(entry => entry.file === 'runtime-location.ts')) throw new Error('The explicit runtime-location support module must be listed');
  const rawOmissions: unknown[] = manifest.reviewedOmissions;
  if (rawOmissions.length !== 1) throw new Error('The exact reviewed platform omission proof is required');
  const omission = requireRecord(rawOmissions[0], 'reviewed omission');
  if (omission.proof !== omissionProof || omission.factory !== './src/machine-resources.ts' || !Array.isArray(omission.declarations)) throw new Error('Unreviewed declaration omission');
  const declarations: ReviewedDeclarationOmission[] = [];
  const rawDeclarations: unknown[] = omission.declarations;
  const factory = moduleBlocks(baseline).get('./src/machine-resources.ts');
  if (!factory) throw new Error('Missing machine-resource provenance factory');
  for (const input of rawDeclarations) {
    const entry = requireRecord(input, 'omitted declaration');
    const name = requireString(entry.name, 'omitted name');
    const hash = requireString(entry.sha256, 'omitted declaration hash');
    const { start, end } = entry;
    if (!omissionNames.includes(name) || declarations.some(previous => previous.name === name) || typeof start !== 'number' || typeof end !== 'number' ||
        !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < factory.start || end > factory.end || end <= start ||
        !/^[a-f0-9]{64}$/.test(hash) || createHash('sha256').update(baseline.slice(start, end)).digest('hex') !== hash) {
      throw new Error(`Invalid reviewed declaration provenance: ${name}`);
    }
    const declaration = ts.createSourceFile('omitted.js', baseline.slice(start, end), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const statement = declaration.statements[0];
    const declared = statement && ts.isVariableStatement(statement) && statement.declarationList.declarations.length === 1
      ? statement.declarationList.declarations[0] : statement;
    if (declaration.statements.length !== 1 || !declared ||
        !(ts.isVariableDeclaration(declared) || ts.isFunctionDeclaration(declared) || ts.isClassDeclaration(declared)) ||
        !declared.name || !ts.isIdentifier(declared.name) || declared.name.text !== name) {
      throw new Error(`Omitted declaration name does not match exact pinned statement: ${name}`);
    }
    if (declarations.some(previous => start < previous.end && end > previous.start)) throw new Error(`Overlapping reviewed declaration provenance: ${name}`);
    declarations.push({ name, start, end, sha256: hash });
  }
  if (declarations.length !== omissionNames.length) throw new Error('All 16 reviewed declaration hashes must be retained');
  for (const file of await listFiles(directory)) {
    if (/\.(?:ts|mts|cts)$/.test(file) && !filenames.has(file)) throw new Error(`Unlisted maintained runtime source: ${file}`);
  }
  return { sources, support, retiredSources, declarations };
}

/** Kept for callers that need only the original-to-maintained provenance map. */
export async function readRuntimeSources(baseline: string, directory = sourceRoot): Promise<RuntimeSource[]> {
  return (await readRuntimeInventory(baseline, directory)).sources;
}
