import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import type { JsonValue } from "../src/interop/contracts/protobuf-runtime.js";

// The validator is NOT exported by the preserved Webpack factory. These tests
// extract only its pure source body; they never initialize the bundle.
export type PreservedSandboxPolicyValidator = (value: JsonValue) => string | undefined;
const bundle = readFileSync("vendor/exec-daemon-runtime/index.js", "utf8");
const marker = '/***/ "../shell-exec/dist/index.js"\n';
const start = bundle.indexOf(marker);
assert.notEqual(start, -1);
const end = bundle.indexOf('\n/***/ "', start + marker.length);
const source = bundle.slice(start, end);
const ast = ts.createSourceFile("shell-factory.js", `const factories = {${source}};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const declaration = ast.statements[0];
assert.ok(ts.isVariableStatement(declaration));
const initializer = declaration.declarationList.declarations[0].initializer;
assert.ok(initializer && ts.isObjectLiteralExpression(initializer));
const factory = initializer.properties[0];
assert.ok(ts.isMethodDeclaration(factory) && factory.body);
const functions = new Map<string, string>();
for (const node of factory.body.statements) {
  if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node.getText(ast));
}
function functionSource(name: string): string {
  const text = functions.get(name);
  assert.ok(text, `Missing retained ${name}`);
  return text;
}
const rawValidator: unknown = vm.runInNewContext(`(${functionSource("validateSandboxPolicyJson")})`);
assert.equal(typeof rawValidator, "function");
const validate: PreservedSandboxPolicyValidator = (input) => {
  if (typeof rawValidator !== "function") throw new Error("Expected validator function");
  const result: unknown = Reflect.apply(rawValidator, undefined, [input]);
  assert.ok(result === undefined || typeof result === "string");
  return result;
};
const rawParser: unknown = vm.runInNewContext(`${functionSource("parseNetworkPolicy")}\n${functionSource("parseSandboxPolicyJson")}\nparseSandboxPolicyJson`);
function parse(input: JsonValue): unknown {
  if (typeof rawParser !== "function") throw new Error("Expected parser function");
  return Reflect.apply(rawParser, undefined, [input]);
}
function ordinary(value: unknown): unknown { return JSON.parse(JSON.stringify(value)) as unknown; }

test("the retained sandbox validator is private, not a guessed export", () => {
  const exportsEnd = source.indexOf("// UNUSED EXPORTS");
  const exportPreamble = source.slice(0, exportsEnd);
  assert.ok(exportPreamble.includes("parseSandboxPolicyJson"));
  assert.ok(!exportPreamble.includes("validateSandboxPolicyJson"));
});
test("validator accepts the original JSON root shapes and rejects invalid typed fields", () => {
  assert.equal(validate({}), undefined);
  assert.equal(validate([]), undefined);
  assert.equal(validate([null, "ignored"]), undefined);
  for (const input of [null, false, 7, "policy"]) assert.equal(validate(input), "Expected an object");
  assert.match(validate({ captureDenies: "bad" }) ?? "", /captureDenies: expected boolean/);
  assert.match(validate({ type: "invalid" }) ?? "", /Invalid type/);
  assert.match(validate({ additionalReadonlyPaths: ["ok", 7] }) ?? "", /expected array of strings/);
  assert.match(validate({ readBoundary: "unexpected" }) ?? "", /Invalid readBoundary/);
});
test("network input arrays are not already sanitized NetworkPolicy values", () => {
  const input: JsonValue = { networkPolicy: { allow: ["example.com", 3, null, {}], deny: [false, "bad.test"], logging: { decisionLogPath: 8, logFormat: "invalid" }, version: "ignored" } };
  assert.equal(validate(input), undefined);
  assert.deepEqual(ordinary(parse(input)), { type: "workspace_readwrite", networkPolicy: { version: 1, allow: ["example.com"], deny: ["bad.test"] } });
  assert.equal(validate({ networkPolicy: [] }), undefined);
  assert.match(validate({ networkPolicy: null }) ?? "", /expected object/);
  assert.match(validate({ networkPolicy: { allow: 7 } }) ?? "", /allow: expected array/);
});
test("calling the converter alone preserves a malformed unchecked field", () => {
  assert.deepEqual(ordinary(parse({ type: "insecure_none", captureDenies: "bad" })), { type: "insecure_none", captureDenies: "bad" });
  assert.deepEqual(ordinary(parse([])), { type: "workspace_readwrite" });
});
