import ts from 'typescript';
import { moduleBlocks, ownedSegments } from './bundle.js';

export const prunedCanvasSource = './src/canvasDiagnostics.ts';
const expectedBlock = `try {
  const require = undefined;
  const canvasServerEntry = require.resolve("@anysphere/canvas-server");
  candidates.push(external_node_path_default().join(external_node_path_default().dirname(canvasServerEntry), "sdk"));
} catch {}`;
const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed });
const parsedExpected = ts.createSourceFile('expected.js', expectedBlock, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const expectedStatement = parsedExpected.statements[0];
if (!expectedStatement) throw new Error('Missing pinned canvas compiler-residue pattern');
function tokens(code: string): string {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, code);
  const result: [number, string][] = [];
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) result.push([token, scanner.getTokenText()]);
  return JSON.stringify(result);
}
const expectedText = tokens(printer.printNode(ts.EmitHint.Unspecified, expectedStatement, parsedExpected));

function locate(code: string): { source: ts.SourceFile; fn: ts.FunctionDeclaration; dead: ts.TryStatement } {
  const source = ts.createSourceFile('canvas.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const functions = source.statements.filter((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === 'resolveCanvasSdkSourceDir');
  const fn = functions[0];
  if (functions.length !== 1 || !fn?.body || fn.body.statements.length !== 3) throw new Error('Canvas compiler-residue function shape changed');
  const dead = fn.body.statements[1];
  if (!dead || !ts.isTryStatement(dead) || tokens(printer.printNode(ts.EmitHint.Unspecified, dead, source)) !== expectedText) throw new Error('Canvas compiler-residue block changed');
  return { source, fn, dead };
}

/** This exact block always throws at undefined.resolve, before the candidate push.
 * The empty catch discards that TypeError. No other try/catch is eligible. */
export function assertPrunedCanvasRequireUnreachable(baseline: string): void {
  const segment = ownedSegments(baseline).find((entry) => entry.id === prunedCanvasSource);
  if (!segment) throw new Error('Missing pinned canvas source');
  locate(segment.text);
  const factory = moduleBlocks(baseline).get(segment.factory);
  if (!factory) throw new Error('Missing canvas factory');
  const source = ts.createSourceFile('factory.js', `({${factory.text}})`, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  function binding(name: ts.BindingName | ts.Identifier | undefined): void {
    if (name === undefined) return;
    if (ts.isIdentifier(name)) {
      if (name.text === 'undefined') throw new Error('Canvas compiler-residue proof forbids a shadowed undefined binding');
    } else for (const item of name.elements) if (ts.isBindingElement(item)) binding(item.name);
  }
  function visit(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isClassDeclaration(node) || ts.isClassExpression(node)) binding(node.name);
    ts.forEachChild(node, visit);
  }
  visit(source);
}

export function omitProvenCanvasRequire(code: string): string {
  const { source, fn, dead } = locate(code);
  if (!fn.body) throw new Error('Missing canvas function body');
  const replacement = ts.factory.updateFunctionDeclaration(fn, fn.modifiers, fn.asteriskToken, fn.name, fn.typeParameters, fn.parameters, fn.type, ts.factory.updateBlock(fn.body, fn.body.statements.filter((statement) => statement !== dead)));
  return printer.printFile(ts.factory.updateSourceFile(source, source.statements.map((statement) => statement === fn ? replacement : statement)));
}
