/** Minimal bootstrap: uses Node's type stripping only to run the compiler.
 * The compiler strictly checks this file and the entire project before emitting. */
import { lstat, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const configPath = path.join(root, 'tsconfig.json');
const loaded = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(loaded.config as unknown, ts.sys, root, undefined, configPath);
const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: file => file,
  getCurrentDirectory: () => root,
  getNewLine: () => '\n',
};
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diagnostics = [...(loaded.error ? [loaded.error] : []), ...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
  process.exitCode = 1;
} else {
  const output = path.join(root, 'dist/project');
  if (parsed.options.outDir !== output || parsed.options.noEmitOnError !== true) {
    throw new Error('Compilation must emit only to dist/project with noEmitOnError');
  }
  // Reject symlinked parents before removing the disposable compiler output.
  for (const directory of [path.join(root, 'dist'), output]) {
    try {
      const stat = await lstat(directory);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe compiler output: ${directory}`);
    } catch (error) {
      if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'ENOENT') throw error;
    }
  }
  await rm(output, { recursive: true, force: true });
  const result = program.emit();
  if (result.emitSkipped || result.diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(result.diagnostics, formatHost));
    process.exitCode = 1;
  }
}
