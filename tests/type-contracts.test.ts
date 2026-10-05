import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import ts from 'typescript';
import { root } from '../tools/lib/project.js';
import { loadTypeScriptProject } from '../tools/lib/typecheck.js';
const imports = [
    'import { RingBuffer } from "../src/runtime/ring-buffer.js";',
    'import { ScopedSecretStore } from "../src/runtime/scoped-secrets.js";',
    'import { FilteredLoggerBackend } from "../src/runtime/logger.js";',
    'import { parseTraceAttributes } from "../src/runtime/trace-attributes.js";',
    'import { withInheritedExecDaemonEnv } from "../src/runtime/mcp-cloud-env.js";',
].join('\n');
/** Deliberately invalid programs are strings, never unchecked maintained files.
 * The compiler reads the real checked source interfaces and emits nothing. */
function checkFixture(statements: readonly string[]): {
    code: number;
    line: number;
    message: string;
}[] {
    const filename = path.join(root, 'tests', '__in_memory_negative_contracts__.ts');
    const text = `${imports}\n${statements.join('\n')}\n`;
    const parsed = loadTypeScriptProject();
    const options = { ...parsed.options, noEmit: true };
    const host = ts.createCompilerHost(options);
    const originalRead = host.readFile.bind(host);
    const originalExists = host.fileExists.bind(host);
    host.readFile = candidate => path.resolve(candidate) === filename ? text : originalRead(candidate);
    host.fileExists = candidate => path.resolve(candidate) === filename || originalExists(candidate);
    const program = ts.createProgram([filename], options, host);
    return ts.getPreEmitDiagnostics(program).filter(diagnostic => diagnostic.file?.fileName === filename).map(diagnostic => {
        assert.ok(diagnostic.file && diagnostic.start !== undefined);
        return { code: diagnostic.code, line: diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1,
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n') };
    });
}
test('runtime contracts accept valid ring, scoped-secret, logging, trace and MCP inputs', () => {
    assert.deepEqual(checkFixture([
        'const ring = new RingBuffer<number>(3); ring.push(1);',
        'new ScopedSecretStore(() => {}).set("scope", 1, { KEY: "value" });',
        'new FilteredLoggerBackend("warn");',
        'parseTraceAttributes("region=fixture");',
        'withInheritedExecDaemonEnv({ command: "fixture" });',
    ]), []);
});
test('runtime contracts reject wrong element, revision, log level, trace and MCP command types', () => {
    const diagnostics = checkFixture([
        'const ring = new RingBuffer<number>(3); ring.push("wrong element type");',
        'new ScopedSecretStore(() => {}).set("scope", "wrong revision type", { KEY: "value" });',
        'new FilteredLoggerBackend("wrong log level");',
        'parseTraceAttributes(42);',
        'withInheritedExecDaemonEnv({ command: 42 });',
    ]);
    assert.deepEqual(diagnostics.map(({ code, line }) => ({ code, line })), [
        { code: 2345, line: 6 }, { code: 2345, line: 7 }, { code: 2345, line: 8 },
        { code: 2345, line: 9 }, { code: 2322, line: 10 },
    ]);
    for (const diagnostic of diagnostics)
        assert.match(diagnostic.message, /not assignable/);
});
