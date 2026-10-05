/** Build-time isolation of the pinned Webpack payload. This is not a runtime loader
 * for owned source: emitted application modules never pass through this file. */
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import { moduleBlocks, ownedSegments, wrapFactory } from './bundle.js';
import type { OwnedSegment } from './bundle.js';
import { ensureDirectory, gitBlobHash, root, runtimeRoot, assertGeneratedFilePath, writeGeneratedFile } from './project.js';
import { readSnapshot } from './snapshot.js';

const ownedPrefix = './src/';
const factoryWrapperPrefix = 'module.exports = {\n';
const startup = 'var __webpack_exports__ = __webpack_require__("./src/index.ts");';
const commanderId = '../../node_modules/.pnpm/@commander-js+extra-typings@14.0.0_commander@15.0.0/node_modules/@commander-js/extra-typings/esm.mjs';
const contextId = '../context/dist/core.js';
// The two bundled host-instrumentation boundaries intentionally inspect the
// cache by computed filesystem-derived keys. Permit only those exact factories,
// not a grammar-wide exception that would admit new dynamic cache lookups.
const pinnedCacheReaders: ReadonlyMap<string, string> = new Map([
  ['../../node_modules/.pnpm/@opentelemetry+instrumentation@0.208.0_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/index.js', '1a1743a2daf618632754907ebdf1ce3c06684ad9'],
  ['../../node_modules/.pnpm/require-in-the-middle@8.0.0/node_modules/require-in-the-middle/index.js', 'c8d9e3bd86c1e7903fc3860a99e2f94fb880a8ea'],
]);
/** Names are backed by the current VendorBindings declarations, not recreated values. */
export const privateBindings = {
  './src/server.ts': ['ControlService', 'ExecService', 'PtyHostService', 'TmuxSessionService',
    'createContextExtractingService', 'ReadFileResponse', 'ReadFileRequest', 'ExecStreamElement'],
  './src/setup.ts': ['DEFAULT_RENDERER_CONFIG', 'generateRenderPlan', 'renderFromPlan',
    'CliHooksExecutor', 'HooksConfigLoader', 'NodeFileReader', 'MutableHooksConfigLeaseImpl',
    'getCloudManagedTeamHooksPath', 'getHooksConfigPaths', 'hasAnyHooks', 'ListableHooksResourceAccessor',
    'getProjectDir', 'ensureCanvasSkillSdkMirror'],
  './src/tracing.ts': ['resourceFromAttributes'],
} as const;
type CompositeId = keyof typeof privateBindings;
const compositeIds: ReadonlyMap<string, string> = new Map([
  ['./src/server.ts', 'vendor-private/server'],
  ['./src/setup.ts', 'vendor-private/setup'],
  ['./src/tracing.ts', 'vendor-private/tracing'],
]);

/** Reviewed closed relocation set. A new shared reference fails extraction instead
 * of silently keeping an eager owned-only import in a private vendor facade.
 * The unused canvas_skill_types_section initializer is intentionally retained. */
const relocatedBindingNames: Readonly<Record<string, readonly string[]>> = {
  "./src/server.ts": [
    "external_node_http_",
    "dist",
    "logger",
    "promise_extras",
    "connect_error",
    "esm_code",
    "esm",
    "wrapper",
    "esm_router",
    "external_node_child_process_",
    "promises_",
    "promises_default",
    "external_node_path_",
    "external_node_path_default",
    "cloud_agent_artifact_paths",
    "local_exec_dist",
    "writable_iterable",
    "safe_spawn_cwd",
    "workload_spawn",
    "external_node_fs_",
    "external_node_stream_",
    "external_node_stream_promises_",
    "external_node_readline_",
    "external_node_crypto_"
  ],
  "./src/setup.ts": [
    "external_node_os_default",
    "external_node_path_default",
    "otel",
    "promises_default",
    "local_exec_dist",
    "mcp_agent_exec_dist",
    "secrets_exec_dist",
    "shell_exec_dist",
    "find_executable",
    "workload_spawn",
    "canvas_diagnostics_provider",
    "canvas_share_bundle",
    "external_node_zlib_",
    "canvas_path_validation",
    "agent_store_ids",
    "cloud_canvas",
    "external_node_util_",
    "external_node_util_default",
    "cursor_plugins_dist",
    "external_node_buffer_",
    "node_pty",
    "external_node_https_namespaceObject",
    "external_node_https_default",
    "connect_error",
    "code",
    "https_proxy_agent_dist"
  ],
  "./src/tracing.ts": [
    "external_node_os_",
    "external_node_os_default",
    "logger",
    "types",
    "OTLPTraceExporter",
    "src"
  ]
};

export interface CapsuleRelocation {
  factory: string; binding: string; kind: "registry" | "host" | "default-helper";
  target: string; dependencyBinding?: string; order: number; originalLine: number;
  ownedConsumers: string[];
}
export interface CapsuleSources { main: string; chunks: ReadonlyMap<string, string>; }
interface Range { start: number; end: number; }
interface Edit extends Range { replacement: string; }
interface Factory { id: string; node: ts.MethodDeclaration; source: ts.SourceFile; }
interface ParsedPayload { source: ts.SourceFile; registry: ts.ObjectLiteralExpression; factories: Factory[]; }
export interface CapsuleProof {
  sourceFactories: number;
  retainedFactories: number;
  ownedFactoriesRemoved: number;
  ownedSegmentsRemoved: number;
  ownedExportReferencesRemoved: number;
  ownedImportInitializersRemoved: number;
  directRegistryEdges: number;
  boundRegistryEdges: number;
  namespaceRegistryEdges: number;
  literalChunkRequests: number;
  directHostRequires: number;
  privateBindings: number;
  relocatedVendorInitializers: number;
}
export interface CapsuleResult { code: string; proof: CapsuleProof; relocations: CapsuleRelocation[]; }

function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
}
function unparen(node: ts.Expression): ts.Expression {
  return ts.isParenthesizedExpression(node) ? unparen(node.expression) : node;
}
function named(node: ts.Node | undefined, name: string): node is ts.Identifier {
  return node !== undefined && ts.isIdentifier(node) && node.text === name;
}
function webpackProperty(node: ts.Node, name: string): node is ts.PropertyAccessExpression {
  return ts.isPropertyAccessExpression(node) && named(node.expression, '__webpack_require__') && node.name.text === name;
}
function inside(node: ts.Node, ranges: readonly Range[]): boolean {
  return ranges.some(range => node.getStart() >= range.start && node.end <= range.end);
}
function location(node: ts.Node): string {
  const source = node.getSourceFile();
  return `${source.fileName}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
}
function parse(filename: string, text: string): ts.SourceFile {
  const source = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  // createSourceFile deliberately accepts malformed text; use the public compiler
  // diagnostics API before treating ranges as executable syntax boundaries.
  const host = ts.createCompilerHost({ allowJs: true, noLib: true });
  host.getSourceFile = file => file === filename ? source : undefined;
  const program = ts.createProgram([filename], { allowJs: true, noLib: true, noResolve: true }, host);
  const errors = program.getSyntacticDiagnostics(source);
  if (errors.length) throw new Error(`Invalid capsule input ${filename}: ${ts.flattenDiagnosticMessageText(errors[0]?.messageText ?? '', '\n')}`);
  return source;
}
function parsePayload(filename: string, text: string): ParsedPayload {
  const source = parse(filename, text);
  const registries: ts.ObjectLiteralExpression[] = [];
  walk(source, node => {
    if (ts.isVariableDeclaration(node) && named(node.name, '__webpack_modules__') && node.initializer) {
      const expression = unparen(node.initializer);
      if (ts.isObjectLiteralExpression(expression)) registries.push(expression);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(node.left) && named(node.left.expression, 'exports') && node.left.name.text === 'modules' &&
        ts.isObjectLiteralExpression(node.right)) registries.push(node.right);
  });
  if (registries.length !== 1) throw new Error(`Expected one static registry in ${filename}`);
  const registry = registries[0];
  if (!registry) throw new Error(`Missing registry in ${filename}`);
  if (/^\d+\.index\.js$/.test(filename)) {
    const chunkId = Number(filename.split('.')[0]);
    const statements = source.statements.filter(statement => !ts.isEmptyStatement(statement) &&
      !(ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression) && statement.expression.text === 'use strict'));
    if (statements.length !== 3 || statements[0]?.getText() !== `exports.id = ${chunkId};` ||
        statements[1]?.getText() !== `exports.ids = [${chunkId}];` ||
        !statements[2] || !ts.isExpressionStatement(statements[2]) || !ts.isBinaryExpression(statements[2].expression) ||
        statements[2].expression.right !== registry) throw new Error(`Unsupported chunk runtime envelope: ${filename}`);
  }
  const factories = registry.properties.map(node => {
    if (!ts.isMethodDeclaration(node) || !ts.isStringLiteral(node.name) || !node.body) throw new Error(`Unsupported registry member in ${filename}`);
    return { id: node.name.text, node, source };
  });
  if (new Set(factories.map(factory => factory.id)).size !== factories.length) throw new Error(`Duplicate factory in ${filename}`);
  return { source, registry, factories };
}
function editSource(source: string, edits: readonly Edit[]): string {
  let end = source.length;
  const result: string[] = [];
  for (const edit of [...edits].sort((left, right) => right.start - left.start)) {
    if (edit.start < 0 || edit.end > end || edit.start > edit.end) throw new Error('Overlapping or invalid capsule source edits');
    result.unshift(edit.replacement, source.slice(edit.end, end));
    end = edit.start;
  }
  result.unshift(source.slice(0, end));
  return result.join('');
}

interface OwnedProof { text: string; exportReferences: number; imports: number; relocations: CapsuleRelocation[]; }
function isolateOwnedFactory(id: string, text: string, segments: readonly OwnedSegment[], originalStartLine: number): OwnedProof {
  const wrapped = wrapFactory(text);
  const source = parse(`${id}.capsule.js`, wrapped);
  const host = ts.createCompilerHost({ allowJs: true, noLib: true, noResolve: true });
  host.getSourceFile = file => file === source.fileName ? source : undefined;
  const program = ts.createProgram([source.fileName], { allowJs: true, noLib: true, noResolve: true }, host);
  const checker = program.getTypeChecker();
  let factory: ts.MethodDeclaration | undefined;
  walk(source, node => { if (ts.isMethodDeclaration(node) && ts.isStringLiteral(node.name) && node.name.text === id) factory = node; });
  if (!factory?.body) throw new Error(`Missing owned factory ${id}`);
  const body = factory.body;
  const importStatements = new Set<ts.VariableStatement>();
  const exportStatements = new Set<ts.ExpressionStatement>();
  const ownedImports = new Set<ts.Symbol>();
  let imports = 0;
  walk(body, node => {
    if (!ts.isVariableDeclaration(node) || !node.initializer || inside(node, segments)) return;
    const call = unparen(node.initializer);
    if (!ts.isCallExpression(call) || !named(call.expression, '__webpack_require__')) return;
    const target = call.arguments[0];
    if (!target || !ts.isStringLiteral(target) || !target.text.startsWith(ownedPrefix)) return;
    if (!ts.isIdentifier(node.name) || !ts.isVariableDeclarationList(node.parent) || node.parent.declarations.length !== 1 || !ts.isVariableStatement(node.parent.parent)) {
      throw new Error(`Unsupported owned import initializer at ${location(node)}`);
    }
    const symbol = checker.getSymbolAtLocation(node.name);
    if (!symbol) throw new Error(`Unresolved owned import ${node.name.text}`);
    ownedImports.add(symbol);
    importStatements.add(node.parent.parent);
    imports++;
  });
  const isRemovedSymbol = (symbol: ts.Symbol): boolean => ownedImports.has(symbol) ||
    (symbol.declarations?.some(declaration => inside(declaration, segments)) ?? false);
  let exportReferences = 0;
  walk(body, node => {
    if (!ts.isIdentifier(node) || inside(node, segments) || [...importStatements].some(statement => inside(node, [statementRange(statement)]))) return;
    const symbol = ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(node.parent) : checker.getSymbolAtLocation(node);
    if (!symbol || !isRemovedSymbol(symbol)) return;
    // Only original direct export-getter scaffolding is an allowed backedge.
    let expression: ts.Node = node;
    while (ts.isParenthesizedExpression(expression.parent)) expression = expression.parent;
    const arrow = expression.parent;
    const property = arrow.parent;
    const object = property.parent;
    const call = object.parent;
    if (!ownedImports.has(symbol) && ts.isArrowFunction(arrow) && arrow.body === expression && arrow.parameters.length === 0 &&
        ts.isPropertyAssignment(property) && property.initializer === arrow && ts.isObjectLiteralExpression(object) &&
        ts.isCallExpression(call) && webpackProperty(call.expression, 'd') && call.arguments[1] === object && ts.isExpressionStatement(call.parent)) {
      exportStatements.add(call.parent);
      exportReferences++;
      return;
    }
    throw new Error(`Shared-to-owned ${ownedImports.has(symbol) ? 'import' : 'lexical'} backedge: ${id} -> ${node.text} at ${location(node)}`);
  });
  // Do not delete a getter object that mixes owned and retained public exports.
  for (const statement of compositeIds.has(id) ? exportStatements : []) {
    if (!ts.isCallExpression(statement.expression)) throw new Error('Invalid export scaffolding');
    const object = statement.expression.arguments[1];
    if (!object || !ts.isObjectLiteralExpression(object)) throw new Error('Invalid export getter object');
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isArrowFunction(property.initializer) || ts.isBlock(property.initializer.body)) throw new Error(`Unsupported export getter in ${id}`);
      const expression = unparen(property.initializer.body);
      const symbol = ts.isIdentifier(expression) ? checker.getSymbolAtLocation(expression) : undefined;
      if (!symbol || !isRemovedSymbol(symbol) || ownedImports.has(symbol)) throw new Error(`Mixed retained/owned export getter in ${id}`);
    }
  }
  const relocated = proveInitializerRelocations(id, body, checker, segments, originalStartLine);
  const removals: Range[] = [...segments, ...[...importStatements, ...exportStatements, ...relocated.statements].map(statementRange)];
  // An eval in retained shared lexical scope could defeat symbol analysis. The
  // sole owned new-Function path is removed, so it is not a retained exception.
  walk(body, node => {
    if (inside(node, removals)) return;
    if (ts.isIdentifier(node) && ['eval', 'Function'].includes(node.text)) throw new Error(`Unsupported dynamic lexical exposure in ${id} at ${location(node)}`);
  });
  const renamed = compositeIds.get(id);
  if (!renamed) return { text: '', exportReferences, imports, relocations: [] };
  const names = privateBindings[id as CompositeId];
  for (const name of names) {
    const symbol = checker.getSymbolsInScope(body, ts.SymbolFlags.Value).find(candidate => candidate.name === name);
    if (!symbol || !symbol.declarations?.length || symbol.declarations.some(declaration => inside(declaration, removals))) {
      throw new Error(`Missing retained private binding ${id}:${name}`);
    }
    // All private adapters must reference an actual top-level lexical declaration
    // in this closure, not a same-spelled binding from another scope/global.
    if (!symbol.declarations.some(declaration => declaration.getSourceFile() === source && declaration.getStart() > body.getStart() && declaration.end < body.end)) {
      throw new Error(`Private binding is not source-bound: ${id}:${name}`);
    }
  }
  const exports = `\n__webpack_require__.d(__webpack_exports__, {\n${names.map(name => `  ${JSON.stringify(name)}: () => ${name}`).join(',\n')}\n});\n`;
  const isolated = editSource(wrapped, [
    ...removals.map(range => ({ ...range, replacement: '' })),
    { start: factory.name.getStart(), end: factory.name.end, replacement: JSON.stringify(renamed) },
    { start: body.end - 1, end: body.end - 1, replacement: exports },
  ]);
  return { text: isolated.slice(factoryWrapperPrefix.length, -3), exportReferences, imports, relocations: relocated.records };
}

interface InitializerCandidate {
  declaration: ts.VariableDeclaration; statement: ts.VariableStatement; symbol: ts.Symbol;
  binding: string; kind: CapsuleRelocation['kind']; target?: string; dependencyBinding?: string;
  order: number; references: ts.Identifier[]; removed: boolean;
}
function proveInitializerRelocations(id: string, body: ts.Block, checker: ts.TypeChecker,
  segments: readonly OwnedSegment[], originalStartLine: number): { statements: ts.VariableStatement[]; records: CapsuleRelocation[] } {
  const expected = relocatedBindingNames[id];
  if (!expected) return { statements: [], records: [] };
  const candidates: InitializerCandidate[] = [];
  let order = 0;
  for (const statement of body.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      const call = unparen(declaration.initializer);
      if (!ts.isCallExpression(call)) continue;
      const kind = named(call.expression, '__webpack_require__') ? 'registry' :
        named(call.expression, 'require') ? 'host' : webpackProperty(call.expression, 'n') ? 'default-helper' : undefined;
      if (!kind) continue;
      order++;
      if (inside(declaration, segments)) continue;
      const argument = call.arguments[0];
      if (call.arguments.length !== 1 || !argument) throw new Error(`Unsupported relocation initializer in ${id}`);
      if (kind === 'default-helper' ? !ts.isIdentifier(argument) : !ts.isStringLiteral(argument)) throw new Error(`Unsupported relocation target in ${id}`);
      if (ts.isStringLiteral(argument) && argument.text.startsWith(ownedPrefix)) continue;
      if (statement.declarationList.declarations.length !== 1) throw new Error(`Mixed relocation declarations in ${id}`);
      const symbol = checker.getSymbolAtLocation(declaration.name);
      if (!symbol) throw new Error(`Unresolved vendor initializer in ${id}`);
      candidates.push({ declaration, statement, symbol, binding: declaration.name.text, kind, order,
        target: ts.isStringLiteral(argument) ? argument.text : undefined,
        dependencyBinding: ts.isIdentifier(argument) ? argument.text : undefined, references: [], removed: false });
    }
  }
  walk(body, node => {
    if (!ts.isIdentifier(node)) return;
    const symbol = ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(node.parent) : checker.getSymbolAtLocation(node);
    const candidate = candidates.find(candidate => candidate.symbol === symbol && candidate.declaration.name !== node);
    if (candidate) candidate.references.push(node);
  });
  // Only a path ending in a removed owned consumer permits relocation. A bare
  // unused import is not evidence of ownership or absence of initialization effects.
  let progress = true;
  while (progress) {
    progress = false;
    for (const candidate of candidates) {
      if (candidate.removed || candidate.references.length === 0) continue;
      if (candidate.references.every(reference => inside(reference, segments) ||
          candidates.some(other => other.removed && inside(reference, [statementRange(other.declaration)])))) {
        candidate.removed = true;
        progress = true;
      }
    }
  }
  const selected = candidates.filter(candidate => candidate.removed);
  if (selected.length !== expected.length || expected.some(name => !selected.some(candidate => candidate.binding === name)) ||
      selected.some(candidate => !expected.includes(candidate.binding))) {
    const unsafe = expected.filter(name => !selected.some(candidate => candidate.binding === name));
    const unexpected = selected.filter(candidate => !expected.includes(candidate.binding)).map(candidate => candidate.binding);
    throw new Error(`Unsafe vendor initializer relocation in ${id}: missing/shared [${unsafe.join(', ')}], unexpected [${unexpected.join(', ')}]`);
  }
  function target(candidate: InitializerCandidate): string {
    if (candidate.target !== undefined) return candidate.target;
    const dependency = candidates.find(other => other.binding === candidate.dependencyBinding);
    if (!dependency || dependency.kind === 'default-helper' || dependency.target === undefined) throw new Error(`Unresolved initializer prerequisite ${id}:${candidate.binding}`);
    return dependency.target;
  }
  function consumers(candidate: InitializerCandidate): string[] {
    const result = new Set<string>();
    for (const reference of candidate.references) {
      for (const segment of segments) if (inside(reference, [segment])) result.add(segment.id);
      for (const other of selected) if (inside(reference, [statementRange(other.declaration)])) {
        for (const consumer of consumers(other)) result.add(consumer);
      }
    }
    return [...result].sort();
  }
  return { statements: selected.map(candidate => candidate.statement), records: selected.map(candidate => ({
    factory: id, binding: candidate.binding, kind: candidate.kind, target: target(candidate),
    ...(candidate.dependencyBinding === undefined ? {} : { dependencyBinding: candidate.dependencyBinding }),
    order: candidate.order,
    originalLine: originalStartLine + candidate.declaration.getSourceFile().getLineAndCharacterOfPosition(candidate.declaration.getStart()).line - 1,
    ownedConsumers: consumers(candidate),
  })) };
}

function statementRange(statement: ts.Node): Range { return { start: statement.getStart(), end: statement.end }; }

interface GraphProof { direct: number; bound: number; namespace: number; chunks: number; host: number; }
function inspectGraph(payloads: readonly ParsedPayload[], knownChunks: ReadonlySet<number>, allowOwned: boolean): GraphProof {
  const ids = new Set(payloads.flatMap(payload => payload.factories.map(factory => factory.id)));
  const definitions = new Map<string, string>();
  for (const payload of payloads) for (const factory of payload.factories) {
    const previous = definitions.get(factory.id);
    if (previous !== undefined && previous !== factory.node.getText()) throw new Error(`Conflicting duplicate chunk factory: ${factory.id}`);
    definitions.set(factory.id, factory.node.getText());
  }
  const proof: GraphProof = { direct: 0, bound: 0, namespace: 0, chunks: 0, host: 0 };
  function target(node: ts.Expression | undefined, at: ts.Node): string {
    if (!node || !ts.isStringLiteral(node)) throw new Error(`Dynamic registry request at ${location(at)}`);
    if (!allowOwned && node.text.startsWith(ownedPrefix)) throw new Error(`Owned registry target retained: ${node.text}`);
    if (!ids.has(node.text)) throw new Error(`Missing static registry target ${node.text} at ${location(at)}`);
    return node.text;
  }
  for (const payload of payloads) {
    for (const factory of payload.factories) {
      if (!allowOwned && factory.id.startsWith(ownedPrefix)) throw new Error(`Owned factory reintroduced: ${factory.id}`);
      const markers = [...factory.node.getText().matchAll(/^;\/\/ (\.\/src\/[^\n]+)$/gm)];
      if (markers.length && (!allowOwned || !factory.id.startsWith(ownedPrefix))) throw new Error(`Owned segment in vendor factory ${factory.id}`);
      walk(factory.node, node => {
        if (ts.isCallExpression(node) && named(node.expression, '__webpack_require__')) {
          if (node.arguments.length !== 1) throw new Error(`Unsupported registry call at ${location(node)}`);
          const id = target(node.arguments[0], node);
          if (!factory.id.startsWith(ownedPrefix) && id.startsWith(ownedPrefix)) throw new Error(`Vendor-to-owned import: ${factory.id} -> ${id}`);
          proof.direct++;
        }
        if (ts.isCallExpression(node) && named(node.expression, 'require')) {
          if (node.arguments.length !== 1 || !ts.isStringLiteral(node.arguments[0])) throw new Error(`Dynamic host require outside pinned chunk loader at ${location(node)}`);
          proof.host++;
        }
        if (!named(node, '__webpack_require__')) return;
        const parent = node.parent;
        if (ts.isParameter(parent) && parent.name === node) return;
        if (ts.isCallExpression(parent) && parent.expression === node) return;
        if (ts.isCallExpression(parent) && parent.arguments[0] === node && ts.isPropertyAccessExpression(parent.expression) && parent.expression.name.text === 'bind') {
          const receiver = parent.expression.expression;
          if (!named(receiver, '__webpack_require__') && !webpackProperty(receiver, 't')) throw new Error(`Registry escapes through bind at ${location(node)}`);
          return;
        }
        if (!ts.isPropertyAccessExpression(parent) || parent.expression !== node) throw new Error(`Registry alias/escape at ${location(node)}`);
        const use = parent.parent;
        const property = parent.name.text;
        if (property === 'bind') {
          if (!ts.isCallExpression(use) || use.expression !== parent || use.arguments.length !== 2 || !named(use.arguments[0], '__webpack_require__')) throw new Error(`Unsupported bound registry request at ${location(parent)}`);
          const id = target(use.arguments[1], use);
          if (!factory.id.startsWith(ownedPrefix) && id.startsWith(ownedPrefix)) throw new Error(`Vendor-to-owned bound import: ${factory.id} -> ${id}`);
          proof.bound++;
        } else if (property === 't') {
          if (ts.isPropertyAccessExpression(use) && use.name.text === 'bind' && ts.isCallExpression(use.parent) && use.parent.expression === use) {
            const call = use.parent;
            const mode = call.arguments[2];
            if (call.arguments.length !== 3 || !named(call.arguments[0], '__webpack_require__') || !mode || !ts.isNumericLiteral(mode) || !(Number(mode.text) & 1)) throw new Error(`Unsupported namespace binding at ${location(call)}`);
            const id = target(call.arguments[1], call);
            if (!factory.id.startsWith(ownedPrefix) && id.startsWith(ownedPrefix)) throw new Error(`Vendor-to-owned namespace import: ${factory.id} -> ${id}`);
            proof.namespace++;
          } else if (!ts.isCallExpression(use) || use.expression !== parent || use.arguments.length !== 2 || !ts.isNumericLiteral(use.arguments[1]) || use.arguments[1].text !== '2') {
            throw new Error(`Unsupported namespace registry request at ${location(parent)}`);
          }
        } else if (property === 'e') {
          if (!ts.isCallExpression(use) || use.expression !== parent || use.arguments.length !== 1 || !ts.isNumericLiteral(use.arguments[0]) || !knownChunks.has(Number(use.arguments[0].text))) throw new Error(`Dynamic/unknown chunk request at ${location(parent)}`);
          proof.chunks++;
        } else if (['d', 'r', 'n', 'nmd', 'a'].includes(property)) {
          if (!ts.isCallExpression(use) || use.expression !== parent) throw new Error(`Registry helper alias/escape at ${location(parent)}`);
        } else if (property === 'c') {
          const indexed = ts.isElementAccessExpression(use) && use.expression === parent;
          const membership = ts.isBinaryExpression(use) && use.operatorToken.kind === ts.SyntaxKind.InKeyword && use.right === parent;
          if ((!indexed && !membership) || pinnedCacheReaders.get(factory.id) !== gitBlobHash(Buffer.from(factory.node.getText()))) throw new Error(`Unsupported module-cache boundary at ${location(parent)}`);
        } else if (property === 'b' || property === 'p') {
          if ((ts.isBinaryExpression(use) && use.left === parent && use.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && use.operatorToken.kind <= ts.SyntaxKind.LastAssignment) || ts.isPostfixUnaryExpression(use) || ts.isPrefixUnaryExpression(use)) throw new Error(`Vendor runtime location mutation at ${location(parent)}`);
        } else throw new Error(`Unsupported registry member ${property} at ${location(parent)}`);
      });
    }
  }
  return proof;
}

function verifyVendorOutput(sources: CapsuleSources): ParsedPayload[] {
  const payloads = [parsePayload('vendor.cjs', sources.main), ...[...sources.chunks].map(([file, text]) => parsePayload(file, text))];
  inspectGraph(payloads, new Set([...sources.chunks.keys()].map(file => Number(file.split('.')[0]))), false);
  return payloads;
}

/** Public output assertion, also used independently by mutation tests. */
export function assertNoOwnedFactories(sources: CapsuleSources): void { verifyVendorOutput(sources); }

export function extractVendorCapsule(sources: CapsuleSources): CapsuleResult {
  if (sources.chunks.size !== 13 || [...sources.chunks.keys()].some(file => !/^\d+\.index\.js$/.test(file))) throw new Error('Expected the 13 numbered chunks');
  const payloads = [parsePayload('index.js', sources.main), ...[...sources.chunks].map(([file, text]) => parsePayload(file, text))];
  const main = payloads[0];
  if (!main) throw new Error('Missing main bundle');
  if (gitBlobHash(Buffer.from(sources.main.slice(0, main.registry.getStart()) + sources.main.slice(main.registry.end))) !== '0885f577dffd679518d776682f3a41f631d8ca4e') throw new Error('Pinned Webpack loader/startup envelope changed');
  const graph = inspectGraph(payloads, new Set([...sources.chunks.keys()].map(file => Number(file.split('.')[0]))), true);
  const segments = ownedSegments(sources.main);
  const blocks = moduleBlocks(sources.main);
  if (segments.length !== 64 || blocks.size !== 21) throw new Error('Pinned ownership inventory must contain 64 segments in 21 factories');
  if (payloads.slice(1).some(payload => payload.factories.some(factory => factory.id.startsWith(ownedPrefix)))) throw new Error('Owned factory present in a numbered chunk');
  const startupPosition = sources.main.lastIndexOf(startup);
  if (startupPosition < main.registry.end || sources.main.indexOf(startup) !== startupPosition) throw new Error('Missing/duplicate original startup');
  const edits: Edit[] = [];
  let exportReferences = 0;
  let imports = 0;
  const relocations: CapsuleRelocation[] = [];
  for (const [id, block] of blocks) {
    const owned = segments.filter(segment => segment.factory === id);
    const isolated = isolateOwnedFactory(id, block.text, owned, main.source.getLineAndCharacterOfPosition(block.start).line + 1);
    relocations.push(...isolated.relocations);
    exportReferences += isolated.exportReferences;
    imports += isolated.imports;
    edits.push({ start: block.start, end: block.end, replacement: isolated.text });
  }
  if (exportReferences !== 45 || imports !== 35) throw new Error(`Owned scaffolding inventory changed: ${exportReferences} getters, ${imports} imports`);
  const requireFunctions: ts.FunctionDeclaration[] = [];
  walk(main.source, node => { if (ts.isFunctionDeclaration(node) && named(node.name, '__webpack_require__')) requireFunctions.push(node); });
  const loader = requireFunctions[0];
  if (requireFunctions.length !== 1 || !loader?.body || loader.getStart() < main.registry.end) throw new Error('Unsupported registry runtime loader');
  // The only dynamic registry dispatch stays inside the pinned Webpack runtime.
  // The loader itself gains a defense-in-depth rejection before cache lookup.
  edits.push({ start: loader.body.getStart() + 1, end: loader.body.getStart() + 1,
    replacement: '\nif (typeof moduleId !== "string" || moduleId.startsWith("./src/")) throw new Error("Owned/invalid module target rejected by vendor capsule");\n' });
  edits.push({ start: startupPosition, end: startupPosition + startup.length, replacement: capsuleApi() });
  const code = editSource(sources.main, edits);
  const generated = verifyVendorOutput({ main: code, chunks: sources.chunks });
  const retainedById = new Map(generated.flatMap(payload => payload.factories.map(factory => [factory.id, factory.node.getText()] as const)));
  for (const payload of payloads) for (const factory of payload.factories) {
    if (!factory.id.startsWith(ownedPrefix) && retainedById.get(factory.id) !== factory.node.getText()) throw new Error(`Vendor implementation bytes changed: ${factory.id}`);
  }
  const retained = payloads.reduce((sum, payload) => sum + payload.factories.length, 0) - blocks.size + compositeIds.size;
  return { code, relocations, proof: {
    sourceFactories: payloads.reduce((sum, payload) => sum + payload.factories.length, 0), retainedFactories: retained,
    ownedFactoriesRemoved: blocks.size, ownedSegmentsRemoved: segments.length,
    ownedExportReferencesRemoved: exportReferences, ownedImportInitializersRemoved: imports,
    directRegistryEdges: graph.direct + 1, boundRegistryEdges: graph.bound, namespaceRegistryEdges: graph.namespace,
    literalChunkRequests: graph.chunks, directHostRequires: graph.host + 2,
    relocatedVendorInitializers: relocations.length,
    privateBindings: Object.values(privateBindings).reduce((sum, names) => sum + names.length, 0),
  } };
}

function capsuleApi(): string {
  return `// Named facade values retain the pinned registry's original cache and identity.
const vendorFacades = Object.create(null);
function loadFacade(name) {
  if (typeof name !== "string" || !Object.prototype.hasOwnProperty.call(vendorAdapters, name)) throw new Error("Unknown vendor facade: " + String(name));
  return vendorFacades[name] ?? (vendorFacades[name] = vendorAdapters[name]());
}
const vendorAdapters = Object.freeze({
  commander: () => { const values = __webpack_require__(${JSON.stringify(commanderId)}); return Object.freeze({ Command: values.uB, Option: values.c$ }); },
  context: () => { const values = __webpack_require__(${JSON.stringify(contextId)}); return Object.freeze({ createContext: values.q6, createContextKey: values.cF }); },
  serverPrivate: () => __webpack_require__("vendor-private/server"),
  setupPrivate: () => __webpack_require__("vendor-private/setup"),
  tracingPrivate: () => __webpack_require__("vendor-private/tracing")
});
exports.runtimeRoot = __dirname;
exports.loadVendor = (id) => {
  if (typeof id !== "string" || id.startsWith("./src/") || !Object.prototype.hasOwnProperty.call(__webpack_modules__, id)) throw new Error("Unknown/owned vendor factory: " + String(id));
  return __webpack_require__(id);
};
exports.loadPrivate = (name) => {
  if (!["server", "setup", "tracing"].includes(name)) throw new Error("Unknown private vendor fragment: " + String(name));
  return loadFacade(name + "Private");
};
exports.loadCommander = () => loadFacade("commander");
exports.loadContext = () => loadFacade("context");
exports.loadServerPrivate = () => loadFacade("serverPrivate");
exports.loadSetupPrivate = () => loadFacade("setupPrivate");
exports.loadTracingPrivate = () => loadFacade("tracingPrivate");`;
}

/** The internal raw loader has one unknown-valued boundary and never accepts a
 * caller-selected return type. Its callers must be source-backed named facades;
 * ordinary application modules consume only those semantic values. */
export const capsuleDeclaration = `import type { Command, Option } from '@commander-js/extra-typings';
export const runtimeRoot: string;
export function loadVendor(id: string): unknown;
export function loadPrivate(name: "server" | "setup" | "tracing"): unknown;
export function loadCommander(): { readonly Command: typeof Command; readonly Option: typeof Option };
export interface ContextKey<T> { readonly symbol: symbol; readonly defaultValue: T; }
export interface Context {
  readonly signal: AbortSignal; readonly canceled: boolean; readonly reason: unknown;
  get<T>(key: ContextKey<T>): T; with<T>(key: ContextKey<T>, value: NoInfer<T>): Context;
}
export function loadContext(): { createContext(): Context; createContextKey<T>(name: symbol, defaultValue: T): ContextKey<T> };
`;

export async function readCapsuleSources(): Promise<CapsuleSources> {
  const snapshot = await readSnapshot();
  const chunks = new Map<string, string>();
  for (const file of snapshot.files.filter(file => /^\d+\.index\.js$/.test(file.path))) {
    const bytes = await readFile(path.join(runtimeRoot, file.path));
    const stat = await lstat(path.join(runtimeRoot, file.path));
    if (gitBlobHash(bytes) !== file.sha || !stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== Number.parseInt(file.mode.slice(-3), 8)) throw new Error(`Pinned chunk changed: ${file.path}`);
    chunks.set(file.path, bytes.toString('utf8'));
  }
  const main = await readFile(path.join(runtimeRoot, 'index.js'));
  const expected = snapshot.files.find(file => file.path === 'index.js');
  const stat = await lstat(path.join(runtimeRoot, 'index.js'));
  if (!expected || gitBlobHash(main) !== expected.sha || !stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o777) !== Number.parseInt(expected.mode.slice(-3), 8)) throw new Error('Pinned main bundle changed');
  return { main: main.toString('utf8'), chunks };
}

/** Install the capsule, byte-identical chunks and original package metadata for
 * ordinary-module tests. Full asset packaging belongs to the production build gate.
 * The original runnable index.js is never installed a second time. */
export async function buildVendorCapsule(outputRoot: string): Promise<CapsuleProof> {
  const destinationRoot = path.resolve(outputRoot);
  if (![path.join(root, '.work') + path.sep, path.join(root, 'dist') + path.sep].some(prefix => destinationRoot.startsWith(prefix))) throw new Error('Capsule output must be below .work or dist');
  const snapshot = await readSnapshot();
  await ensureDirectory(destinationRoot);
  // A caller may install its owned bootstrap later. Do not silently overwrite an
  // already runnable bundle while creating the dependency-only pilot.
  try {
    await lstat(path.join(destinationRoot, 'index.js'));
    throw new Error('Capsule destination already contains index.js; use a fresh capsule directory');
  } catch (error) {
    if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  const assets = snapshot.files.filter(file => file.path === 'package.json' || /^\d+\.index\.js$/.test(file.path));
  // Validate every output before any writes, including dangling symlink leaves.
  for (const filename of [...assets.map(file => file.path), 'vendor.cjs', 'vendor.d.cts', 'capsule-relocations.json', 'capsule-proof.json']) {
    await assertGeneratedFilePath(path.join(destinationRoot, filename));
  }
  const sources = await readCapsuleSources();
  const result = extractVendorCapsule(sources);
  for (const file of assets) {
    // Only install the capsule's execution inputs here. The final production
    // package builder owns the mandatory full 2,270-file snapshot integrity gate.
    const destination = path.join(destinationRoot, file.path);
    const bytes = await readFile(path.join(runtimeRoot, file.path));
    if (gitBlobHash(bytes) !== file.sha) throw new Error(`Copied asset changed: ${file.path}`);
    await writeGeneratedFile(destination, bytes, Number.parseInt(file.mode.slice(-3), 8));
  }
  await writeGeneratedFile(path.join(destinationRoot, 'vendor.cjs'), result.code);
  await writeGeneratedFile(path.join(destinationRoot, 'vendor.d.cts'), capsuleDeclaration);
  await writeGeneratedFile(path.join(destinationRoot, 'capsule-relocations.json'), JSON.stringify(result.relocations, null, 2) + '\n');
  await writeGeneratedFile(path.join(destinationRoot, 'capsule-proof.json'), JSON.stringify(result.proof, null, 2) + '\n');
  return result.proof;
}
