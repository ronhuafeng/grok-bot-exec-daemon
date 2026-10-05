import path from 'node:path';
import ts from 'typescript';
import { root } from './project.js';

export function loadTypeScriptProject(): ts.ParsedCommandLine {
  const configPath = path.join(root, 'tsconfig.json');
  const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
  if (loaded.error) throw new Error(formatDiagnostics([loaded.error]));
  const parsed = ts.parseJsonConfigFileContent(loaded.config as unknown, ts.sys, root, undefined, configPath);
  if (parsed.errors.length) throw new Error(formatDiagnostics(parsed.errors));
  if (parsed.options.strict !== true || parsed.options.allowJs === true || parsed.options.skipLibCheck === true) {
    throw new Error('Maintained project code must use strict TypeScript without allowJs or skipped library checks');
  }
  return parsed;
}

export function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (file) => file,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  });
}

/** Compile-time checking never imports or executes a runtime source module. */
export function checkProjectTypes(requiredSources: readonly string[] = []): ts.Program {
  const parsed = loadTypeScriptProject();
  const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
  for (const file of requiredSources) {
    if (!program.getSourceFile(path.resolve(root, file))) throw new Error(`Owned source excluded from strict checking: ${file}`);
  }
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(formatDiagnostics(diagnostics));
  const checker = program.getTypeChecker();
  const violations: string[] = [];
  for (const source of program.getSourceFiles()) {
    if (source.fileName.includes('/node_modules/')) continue;
    const relative = path.relative(root, source.fileName);
    if (relative.startsWith('..')) continue;
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, source.text);
    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
      if ((token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) &&
          /@ts-(?:ignore|nocheck|expect-error)\b/.test(scanner.getTokenText())) {
        violations.push(`${relative}: type-check suppression is not permitted in maintained code`);
      }
    }
    function inspect(node: ts.Node): void {
      if (node.kind === ts.SyntaxKind.AnyKeyword ||
          (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.text === 'Function')) {
        violations.push(`${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: unchecked escape type`);
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) &&
          ['Map', 'Set', 'WeakMap', 'WeakSet', 'Array'].includes(node.expression.text)) {
        const type = checker.getTypeAtLocation(node);
        if ((type.flags & ts.TypeFlags.Object) && ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) &&
            checker.getTypeArguments(type as ts.TypeReference).some((argument) => argument.flags & ts.TypeFlags.Any)) {
          violations.push(`${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: unchecked collection element type`);
        }
      }
      if ((ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isPropertyDeclaration(node)) && ts.isIdentifier(node.name)) {
        if (checker.getTypeAtLocation(node.name).flags & ts.TypeFlags.Any) {
          violations.push(`${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: inferred unchecked value ${node.name.text}`);
        }
      }
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) {
        const signature = checker.getSignatureFromDeclaration(node);
        if (signature && (checker.getReturnTypeOfSignature(signature).flags & ts.TypeFlags.Any)) {
          violations.push(`${relative}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}: unchecked function result`);
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
  if (violations.length) throw new Error(`Type-boundary audit failed:\n${violations.join('\n')}`);
  return program;
}
