import ts from 'typescript';
import { moduleBlocks, wrapFactory } from './bundle.js';

export const prunedMcpFactory = './src/mcp-token-storage.ts';
export const prunedMcpHelpers = ['buildExecDaemonStorageIdentifier', 'createEnvBasedScopedTokenStorage'] as const;
const erasedImports = ['LoggedScopedMcpTokenStorage', 'createStructuredLifecycleLogger', 'McpOAuthStoredData'] as const;

function findMethod(source: ts.SourceFile): ts.MethodDeclaration {
  let result: ts.MethodDeclaration | undefined;
  function visit(node: ts.Node): void {
    if (ts.isMethodDeclaration(node) && ts.isStringLiteral(node.name) && node.name.text === prunedMcpFactory) result = node;
    ts.forEachChild(node, visit);
  }
  visit(source);
  if (!result?.body) throw new Error('MCP proof: missing factory');
  return result;
}

/** One closed exception; never a general unused/dead-code filter. */
export function assertPrunedMcpHelpersUnreachable(baseline: string): void {
  const block = moduleBlocks(baseline).get(prunedMcpFactory);
  if (!block) throw new Error('MCP proof: missing source binding');
  const wrapped = wrapFactory(block.text);
  const source = ts.createSourceFile('mcp-factory.js', wrapped, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const method = findMethod(source);
  if (!method.body) throw new Error('MCP proof: missing body');
  const helpers = new Set<string>(prunedMcpHelpers);
  const imports = new Set<string>(erasedImports);
  const declarations = method.body.statements.filter((statement): statement is ts.FunctionDeclaration => ts.isFunctionDeclaration(statement) && statement.name !== undefined && helpers.has(statement.name.text));
  if (declarations.length !== 2 || new Set<string>(declarations.map((declaration) => declaration.name?.text ?? '')).size !== 2) throw new Error('MCP proof: private declaration inventory changed');
  const variables = method.body.statements.flatMap((statement) => ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : []);
  for (const name of imports) {
    const candidates = variables.filter((variable) => ts.isIdentifier(variable.name) && variable.name.text === name);
    if (candidates.length !== 1 || candidates[0]?.initializer !== undefined) throw new Error(`MCP proof: erased import changed: ${name}`);
  }
  let exportsFound = false;
  function inspect(node: ts.Node, insideRemovedHelper = false): void {
    const inside = insideRemovedHelper || (ts.isFunctionDeclaration(node) && node.name !== undefined && helpers.has(node.name.text));
    if (ts.isCallExpression(node)) {
      let expression: ts.Expression = node.expression;
      while (ts.isParenthesizedExpression(expression)) expression = expression.expression;
      const callee = expression.getText(source);
      if (callee === 'eval' || callee === 'Function' || callee.endsWith('.eval')) throw new Error('MCP proof: dynamic lexical exposure');
      if (callee === '__webpack_require__.d') {
        if (exportsFound || node.arguments[0]?.getText(source) !== '__webpack_exports__') throw new Error('MCP proof: export registration changed');
        const object = node.arguments[1];
        if (!object || !ts.isObjectLiteralExpression(object)) throw new Error('MCP proof: dynamic export map');
        const exports = new Map<string, string>();
        for (const property of object.properties) {
          if (!ts.isPropertyAssignment(property) || !ts.isArrowFunction(property.initializer)) throw new Error('MCP proof: dynamic export entry');
          const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : '';
          let value: ts.Node = property.initializer.body;
          while (ts.isParenthesizedExpression(value)) value = value.expression;
          if (!ts.isIdentifier(value)) throw new Error('MCP proof: export expression changed');
          exports.set(key, value.text);
        }
        if (exports.size !== 2 || exports.get('Iw') !== 'createEphemeralScopedTokenStorage' || exports.get('w8') !== 'getRefreshedMcpOAuthTokens') throw new Error('MCP proof: live export surface changed');
        exportsFound = true;
      }
    }
    if (ts.isNewExpression(node)) {
      let expression: ts.Expression = node.expression;
      while (ts.isParenthesizedExpression(expression)) expression = expression.expression;
      if (expression.getText(source) === 'Function') throw new Error('MCP proof: dynamic factory construction');
    }
    if (ts.isWithStatement(node)) throw new Error('MCP proof: dynamic scope');
    if (ts.isStringLiteralLike(node) && prunedMcpHelpers.some((name) => node.text.includes(name))) throw new Error('MCP proof: computed helper lookup');
    if (ts.isIdentifier(node) && helpers.has(node.text) && !inside) throw new Error(`MCP proof: live reference to ${node.text}`);
    if (ts.isIdentifier(node) && imports.has(node.text) && !inside && !(ts.isVariableDeclaration(node.parent) && node.parent.name === node)) throw new Error(`MCP proof: erased import used by live code: ${node.text}`);
    ts.forEachChild(node, (child) => inspect(child, inside));
  }
  inspect(method.body);
  if (!exportsFound) throw new Error('MCP proof: no static export surface');
  // Parsed identifier traversal excludes comments/strings and correctly handles
  // template/regexp lexical modes throughout the complete bundle. The only
  // helper use is the inner call. A bare scanner would miscount template text.
  const counts = new Map<string, number>(prunedMcpHelpers.map((name) => [name, 0]));
  const fullSource = ts.createSourceFile('preserved-runtime.js', baseline, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  function countReferences(node: ts.Node): void {
    if (ts.isIdentifier(node) && counts.has(node.text)) counts.set(node.text, (counts.get(node.text) ?? 0) + 1);
    ts.forEachChild(node, countReferences);
  }
  countReferences(fullSource);
  if (counts.get('createEnvBasedScopedTokenStorage') !== 1 || counts.get('buildExecDaemonStorageIdentifier') !== 2) throw new Error('MCP proof: whole-bundle reachability changed');
}

export function omitProvenMcpHelpers(code: string): string {
  const source = ts.createSourceFile('mcp-owned.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const helpers = new Set<string>(prunedMcpHelpers);
  const statements = source.statements.filter((statement) => !(ts.isFunctionDeclaration(statement) && statement.name !== undefined && helpers.has(statement.name.text)));
  return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(ts.factory.updateSourceFile(source, statements));
}
