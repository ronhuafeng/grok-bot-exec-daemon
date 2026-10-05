import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleBlocks, ownedSegments, readBaseline, wrapFactory, unwrapFactory } from '../tools/lib/bundle.js';
import { assertPrunedMcpHelpersUnreachable, omitProvenMcpHelpers, prunedMcpFactory } from '../tools/lib/pruned-mcp-proof.js';
import { assertPrunedCanvasRequireUnreachable, omitProvenCanvasRequire, prunedCanvasSource } from '../tools/lib/pruned-canvas-proof.js';
import { semanticFingerprint } from '../tools/lib/semantic.js';
import { loadOwnedSegment } from './helpers/owned-vm.js';
const baseline = await readBaseline();
const blocks = moduleBlocks(baseline);
function changedMcp(transform: (original: string) => string): string {
    const factory = blocks.get(prunedMcpFactory);
    assert.ok(factory);
    const changed = transform(factory.text);
    assert.notEqual(changed, factory.text, 'negative fixture must change the target factory');
    unwrapFactory(wrapFactory(changed), prunedMcpFactory);
    return baseline.slice(0, factory.start) + changed + baseline.slice(factory.end);
}
function insertStatement(statement: string): string {
    return changedMcp(original => original.replace('/***/ },\n\n', `${statement}\n/***/ },\n\n`));
}
test('the closed MCP deletion proof accepts the pinned baseline', () => {
    assert.doesNotThrow(() => assertPrunedMcpHelpersUnreachable(baseline));
});
test('the MCP deletion proof rejects live helper or erased-import references', () => {
    assert.throws(() => assertPrunedMcpHelpersUnreachable(insertStatement('createEnvBasedScopedTokenStorage();')), /live reference/);
    assert.throws(() => assertPrunedMcpHelpersUnreachable(insertStatement('void LoggedScopedMcpTokenStorage;')), /erased import used by live code/);
});
test('the MCP deletion proof rejects dynamic lexical exposure and computed helper lookup', () => {
    for (const statement of ['eval("");', '(eval)("createEnvBased" + "ScopedTokenStorage()");', 'new (Function)("return 1");', 'new Function("return 1");', 'void "createEnvBasedScopedTokenStorage";']) {
        assert.throws(() => assertPrunedMcpHelpersUnreachable(insertStatement(statement)), /dynamic lexical exposure|dynamic factory construction|computed helper lookup/);
    }
});
test('the MCP omission is limited to its two proven function declarations', () => {
    const original = 'function buildExecDaemonStorageIdentifier() {}\nfunction createEnvBasedScopedTokenStorage() {}\nfunction unrelatedUnusedHelper() { return 7; }\nconst retained = 3;';
    const result = omitProvenMcpHelpers(original);
    assert.doesNotMatch(result, /function (?:buildExecDaemonStorageIdentifier|createEnvBasedScopedTokenStorage)/);
    assert.match(result, /function unrelatedUnusedHelper/);
    assert.match(result, /const retained = 3/);
});
test('semantic migration comparison ignores formatting and disabled helpers but retains active algorithms', () => {
    assert.equal(semanticFingerprint('const n = (1_000); // comment'), semanticFingerprint('const n=1000;'));
    assert.equal(semanticFingerprint('const helper = (undefined && undefined.__addDisposableResource) || function () { return 1; };'), semanticFingerprint('const helper = false || function () { return 1; };'));
    assert.notEqual(semanticFingerprint('const n = operation(1);'), semanticFingerprint('const n = operation(2);'));
    assert.notEqual(semanticFingerprint('const n = condition ? a() : b();'), semanticFingerprint('const n = a();'));
    assert.throws(() => semanticFingerprint('function f(undefined) { return undefined || 1; }'), /shadowed undefined binding/);
});
test('semantic shorthand normalization keeps prototype-setting property semantics distinct', () => {
    assert.equal(semanticFingerprint('const result = { value };'), semanticFingerprint('const result = { value: value };'));
    assert.notEqual(semanticFingerprint('const result = { __proto__ };'), semanticFingerprint('const result = { __proto__: __proto__ };'));
});

const canvasSegment = ownedSegments(baseline).find(segment => segment.id === prunedCanvasSource);
assert.ok(canvasSegment);
const canvasOriginal = canvasSegment.text;
function changedCanvas(transform: (original: string) => string): string {
    const changed = transform(canvasOriginal);
    assert.notEqual(changed, canvasOriginal, 'canvas negative fixture must alter its source');
    assert.equal(baseline.split(canvasOriginal).length, 2, 'expected one pinned canvas segment');
    return baseline.replace(canvasOriginal, changed);
}
test('the exact canvas compiler-residue proof accepts the pinned baseline and retains the live lookup', () => {
    assert.doesNotThrow(() => assertPrunedCanvasRequireUnreachable(baseline));
    const omitted = omitProvenCanvasRequire(canvasOriginal);
    assert.doesNotMatch(omitted, /require\.resolve/);
    assert.match(omitted, /candidates\.find/);
    assert.match(omitted, /existsSync/);
    assert.match(omitted, /catch/); // module-directory fallback is unrelated and retained
});
test('the canvas compiler-residue proof rejects changed initialization, effects and scope', () => {
    assert.throws(() => assertPrunedCanvasRequireUnreachable(changedCanvas(source => source.replace(
        'const require = /* createRequire() */ undefined;', 'const require = {};'))), /block changed/);
    assert.throws(() => assertPrunedCanvasRequireUnreachable(changedCanvas(source => source.replace(
        'const require = /* createRequire() */ undefined;', 'const require = /* createRequire() */ undefined; sideEffect();'))), /block changed/);
    assert.throws(() => assertPrunedCanvasRequireUnreachable(changedCanvas(source => source.replace(
        'function resolveCanvasSdkSourceDir(here', 'function resolveCanvasSdkSourceDir(undefined, here'))), /shadowed undefined binding/);
});

test('semantic comparison retains operators, declaration kinds and template contents', () => {
    for (const [before, after] of [
        ['!value;', '+value;'], ['value++;', 'value--;'],
        ['const value = 1;', 'let value = 1;'], ['var value = 1;', 'let value = 1;'],
        ['`before ${value}`;', '`after ${value}`;'],
        ['`before ${value} one`;', '`before ${value} two`;'],
        ['tag`\\n`;', 'tag`\n`;'],
        ['class C { #one; get() { return this.#one; } }', 'class C { #two; get() { return this.#two; } }'],
        ['"use strict"; run();', '"use\\x20strict"; run();'],
    ]) assert.notEqual(semanticFingerprint(before), semanticFingerprint(after), `${before} differs from ${after}`);
});

test('semantic comparison preserves control-position empties and optional-chain grouping', () => {
    assert.notEqual(semanticFingerprint('if (flag); else action();'), semanticFingerprint('if (flag) action();'));
    assert.notEqual(semanticFingerprint('; "use strict"; action();'), semanticFingerprint('"use strict"; action();'));
    assert.notEqual(semanticFingerprint('(value?.method)();'), semanticFingerprint('value?.method();'));
    assert.notEqual(semanticFingerprint('(value?.method).field;'), semanticFingerprint('value?.method.field;'));
});


test('semantic comparison never folds a selected reference into a value-context expression', () => {
    assert.notEqual(semanticFingerprint('(undefined || obj.method)();'), semanticFingerprint('obj.method();'));
    assert.notEqual(semanticFingerprint('delete (false || obj.member);'), semanticFingerprint('delete obj.member;'));
    assert.notEqual(semanticFingerprint('typeof (true ? missing : 0);'), semanticFingerprint('typeof missing;'));
    assert.throws(() => semanticFingerprint('const f = class undefined { static value = undefined ? 1 : 2; };'), /shadowed undefined binding/);
});


test('compiler helper normalization retains anonymous function name inference', () => {
    const original = 'var __addDisposableResource = (undefined && undefined.__addDisposableResource) || function () {};';
    const preserved = 'var __addDisposableResource = false || function () {};';
    const different = 'var __addDisposableResource = function () {};';
    assert.equal(semanticFingerprint(original), semanticFingerprint(preserved));
    assert.notEqual(semanticFingerprint(original), semanticFingerprint(different));
});


test('compiled disposal helpers retain original reflective names', async () => {
    const modules = await loadOwnedSegment('exec', ['__addDisposableResource', '__disposeResources'], { '../interop/vendor/context-logger.js': { createLogger: () => ({}) } });
    for (const name of ['__addDisposableResource', '__disposeResources']) {
        const before = modules.baseline[name];
        const after = modules.typed[name];
        assert.equal(typeof before, 'function');
        assert.equal(typeof after, 'function');
        if (typeof before !== 'function' || typeof after !== 'function') throw new Error('Missing helper');
        assert.equal(before.name, '');
        assert.equal(after.name, before.name);
        assert.equal(after.length, before.length);
    }
});
