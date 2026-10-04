import path from 'node:path';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { root, sourceRoot, listFiles } from './project.js';

/** Enforce ordinary one-way module boundaries without freezing feature syntax. */
export async function verifyModuleGraph(): Promise<void> {
  const runtimeFiles = (await listFiles(sourceRoot)).filter(file => file.endsWith('.ts'));
  for (const file of runtimeFiles) {
    const filename = path.join(sourceRoot, file);
    const source = ts.createSourceFile(filename, await readFile(filename, 'utf8'), ts.ScriptTarget.Latest, true);
    function inspect(node: ts.Node): void {
      if (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.DeclareKeyword)) {
        throw new Error(`Ambient application binding: ${file}`);
      }
      if (ts.isIdentifier(node) && /__webpack|WEBPACK_IMPORTED_MODULE/.test(node.text)) {
        throw new Error(`Bundler binding in application module: ${file}`);
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        if (specifier.startsWith('node:')) {
          if (specifier === 'node:vm') throw new Error(`Application source evaluation is forbidden: ${file}`);
        } else if (!specifier.startsWith('.') || !specifier.endsWith('.js')) {
          throw new Error(`Application import must be a named local module or Node builtin: ${file}: ${specifier}`);
        } else {
          const target = path.resolve(path.dirname(filename), specifier);
          if (!target.startsWith(path.join(root, 'src') + path.sep)) throw new Error(`Application import escapes source: ${file}`);
          if (target === path.join(sourceRoot, 'index.js')) throw new Error(`Feature imports CLI composition: ${file}`);
          if (/[/\\]interop[/\\](?:modules|webpack|owned-modules)\.js$/.test(target)) {
            throw new Error(`Raw registry contract in application module: ${file}`);
          }
        }
      }
      ts.forEachChild(node, inspect);
    }
    inspect(source);
  }
  const vendorRoot = path.join(root, 'src/interop/vendor');
  for (const file of (await listFiles(vendorRoot)).filter(file => file.endsWith('.ts'))) {
    const filename = path.join(vendorRoot, file);
    const source = ts.createSourceFile(filename, await readFile(filename, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const specifier = statement.moduleSpecifier.text;
      if (!specifier.startsWith('node:') && (!specifier.startsWith('./') || !specifier.endsWith('.js'))) {
        throw new Error(`Vendor facade has a runtime backedge: ${file}: ${specifier}`);
      }
    }
  }
}
