import ts from 'typescript';

type Fingerprint = string | number | boolean | null | readonly Fingerprint[];

function unwrap(node: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(node)) node = node.expression;
  return node;
}
/** Only the retained compiler's disabled reuse branch. Retain the OR value context: removing it changes anonymous Function.name
 * inference. Only its unreachable left operand is normalized to false. */
function disabledCompilerHelper(node: ts.BinaryExpression): ts.Expression | undefined {
  if (node.operatorToken.kind !== ts.SyntaxKind.BarBarToken) return undefined;
  const left = unwrap(node.left);
  const right = unwrap(node.right);
  if (!ts.isBinaryExpression(left) || left.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) return undefined;
  const receiver = unwrap(left.left);
  const property = unwrap(left.right);
  if (!ts.isIdentifier(receiver) || receiver.text !== 'undefined' ||
      !ts.isPropertyAccessExpression(property) || property.questionDotToken !== undefined ||
      !ts.isIdentifier(property.expression) || property.expression.text !== 'undefined') return undefined;
  if (property.name.text === '__addDisposableResource' && ts.isFunctionExpression(right)) return right;
  if (property.name.text === '__disposeResources' && ts.isCallExpression(right) && ts.isFunctionExpression(unwrap(right.expression))) return right;
  return undefined;
}

/** Bounded syntax fingerprint for pinned pure-validator/proof fixtures.
 * This is not an application build gate or a general semantic-equivalence claim. */
export function semanticFingerprint(code: string, filename = 'segment.js'): string {
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  function checkBinding(name: ts.BindingName | ts.Identifier | undefined): void {
    if (name === undefined) return;
    if (ts.isIdentifier(name)) {
      if (name.text === 'undefined') throw new Error('Constant-normalization proof forbids a shadowed undefined binding');
    } else {
      for (const element of name.elements) if (ts.isBindingElement(element)) checkBinding(element.name);
    }
  }
  function checkScope(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) || ts.isParameter(node) || ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isClassDeclaration(node) || ts.isClassExpression(node)) checkBinding(node.name);
    ts.forEachChild(node, checkScope);
  }
  checkScope(source);
  function visit(node: ts.Node): Fingerprint {
    if (ts.isParenthesizedExpression(node)) {
      let expression = node.expression;
      while (ts.isParenthesizedExpression(expression)) expression = expression.expression;
      // Grouping an optional chain terminates short-circuit propagation.
      return ts.isOptionalChain(expression) ? ['ParenthesizedExpression', visit(expression)] : visit(expression);
    }
    if (ts.isBinaryExpression(node)) {
      const helper = disabledCompilerHelper(node);
      if (helper !== undefined) return ['BinaryExpression', ['FalseKeyword'], ['BarBarToken'], visit(helper)];
    }
    // Erasing a property-value assertion expands `{ method }` to `{ method: method }`.
    // Exclude __proto__, whose explicit property-assignment spelling has distinct semantics.
    if (ts.isShorthandPropertyAssignment(node) && node.name.text !== '__proto__' && node.objectAssignmentInitializer === undefined) {
      return ['PropertyAssignment', visit(node.name), visit(node.name)];
    }
    if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) return [ts.SyntaxKind[node.kind], node.text];
    if (ts.isTemplateLiteralToken(node)) return [ts.SyntaxKind[node.kind], node.text, node.rawText ?? node.text];
    if (ts.isStringLiteral(node)) {
      // Escape spelling matters for strict-mode directive recognition.
      const directive = ts.isExpressionStatement(node.parent) && node.text === 'use strict'
        ? /^(['"])use strict\1$/.test(node.getText(source)) : false;
      return [ts.SyntaxKind[node.kind], node.text, directive];
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) return [ts.SyntaxKind[node.kind], node.operator, visit(node.operand)];
    if (ts.isNumericLiteral(node)) return ['number', Number(node.text)];
    if (ts.isBigIntLiteral(node)) return ['bigint', BigInt(node.text.replaceAll('_', '').slice(0, -1)).toString()];
    if (ts.isRegularExpressionLiteral(node)) return ['regexp', node.text];
    const children: Fingerprint[] = [];
    ts.forEachChild(node, (child) => {
      children.push(visit(child));
    });
    if (ts.isVariableDeclarationList(node)) return [ts.SyntaxKind[node.kind], node.flags & (ts.NodeFlags.Let | ts.NodeFlags.Const | ts.NodeFlags.Using | ts.NodeFlags.AwaitUsing), ...children];
    return [ts.SyntaxKind[node.kind], ...children];
  }
  return JSON.stringify(visit(source));
}

