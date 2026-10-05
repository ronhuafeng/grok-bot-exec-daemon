import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import ts from "typescript";
import { readBaseline } from "../tools/lib/bundle.js";
import { semanticFingerprint } from "../tools/lib/semantic.js";
import { normalized } from "./helpers/owned-vm.js";
import { fixtureContext } from "./fixtures/foundation.js";
import { assertHttpMcpToolsJson, validateSandboxPolicyJson, createHttpMcpLeaseFromJson, resolveSandboxPolicyFromJson } from "../src/runtime/configuration.js";
import type { JsonValue } from "../src/interop/contracts/protobuf-runtime.js";
import type { SandboxPolicy } from "../src/interop/contracts/shell.js";

// Candidate executes actual compiled normal modules. Source evaluation is only
// the immutable vendor oracle for private pure conversion/validation helpers.
const baseline = await readBaseline();
function preservedFunction(name: string): string {
  const marker = `function ${name}(`;
  assert.equal(baseline.split(marker).length, 2, `one preserved ${name}`);
  const start = baseline.indexOf(marker);
  const end = baseline.indexOf("\n}\n", start) + 2;
  assert.ok(end > start);
  const source = baseline.slice(start, end);
  const ast = ts.createSourceFile(`${name}.js`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.equal(ast.statements.length, 1);
  assert.ok(ts.isFunctionDeclaration(ast.statements[0]) && ast.statements[0].name?.text === name);
  return source;
}
function evaluateFunction(source: string): (input: unknown) => unknown {
  const value: unknown = new vm.Script(`(${source})`).runInNewContext({}, { timeout: 2000 });
  assert.equal(typeof value, "function");
  return (input: unknown): unknown => {
    if (typeof value !== "function") throw new Error("Expected isolated helper function");
    return Reflect.apply(value, undefined, [input]) as unknown;
  };
}
const validateHttp = (input: unknown): void => assertHttpMcpToolsJson(input as JsonValue);
const validateSandbox = validateSandboxPolicyJson;
const sandboxHelper = validateSandboxPolicyJson.toString();
const validatePreservedSandbox = evaluateFunction(preservedFunction("validateSandboxPolicyJson"));
const namedTool = evaluateFunction(preservedFunction("buildNamedMcpToolDefinitionFromFileContent"));
const parserSource = `${preservedFunction("parseNetworkPolicy")}\n${preservedFunction("parseSandboxPolicyJson")}`;
const parseSandbox = evaluateFunction(`function (input) { ${parserSource}; return parseSandboxPolicyJson(input); }`);
function runHttpIngress(json: string | undefined) {
  const errors: string[] = [];
  const infos: string[] = [];
  const converted: unknown[] = [];
  const result = createHttpMcpLeaseFromJson(json, {
    globalContext: fixtureContext(),
    execDaemonLogger: {
      info: (_ctx, message) => infos.push(message),
      error: (_ctx, message) => errors.push(message),
    },
    buildNamedMcpToolDefinitionFromFileContent: (tool) => { converted.push(tool); return namedTool(tool); },
    createLease: (tools) => ({ tools }),
  });
  return { result, errors, infos, converted };
}
function runSandboxIngress(json: string | undefined, enabled = true) {
  const errors: string[] = [];
  const parsed: unknown[] = [];
  const resolved: string[] = [];
  const result = resolveSandboxPolicyFromJson(json, {
    sandboxEnabled: enabled, workspacePath: "/fixture/workspace", globalContext: fixtureContext(),
    execDaemonLogger: { error: (_ctx, message) => errors.push(message) },
    parseSandboxPolicyJson: (input) => { parsed.push(input); return parseSandbox(input) as SandboxPolicy; },
    resolvePolicyPaths: (policy, workspace) => { resolved.push(workspace); return policy; },
  });
  return { result, errors, parsed, resolved };
}

const minimalTool = { serverIdentifier: "server", serverName: "Server", name: "tool" };
test("HTTP MCP ingress accepts minimal tools and preserves optional values and unknown schema keywords", () => {
  const schema = Object.freeze({ type: "object", properties: Object.freeze({ value: { type: "string" }, arbitrary: false }), required: Object.freeze(["value", ""]), additionalProperties: false, $defs: { x: { type: "number" } }, $ref: "#/$defs/x", custom: [null, true] });
  const tool = Object.freeze({ serverIdentifier: "", serverName: "", name: "", qualifiedName: "", description: "", plugin: "", marketplace: "", pluginId: "", marketplaceId: "", arguments: schema, outputSchema: schema, unknown: { keep: true } });
  const tools = Object.freeze([Object.freeze(minimalTool), tool]);
  const before = JSON.stringify(tools);
  assert.equal(validateHttp(tools), undefined);
  assert.equal(JSON.stringify(tools), before);
  assert.equal(tools[1], tool);
  assert.equal(tool.arguments, schema);
  assert.equal(validateHttp([]), undefined);
});
test("HTTP MCP ingress rejects wrong collection, entry and string field types", () => {
  for (const input of [null, false, 1, "tools", {}, { length: 0 }, [null], [false], [1], ["tool"], [[]]]) {
    assert.throws(() => validateHttp(input), /Invalid HTTP MCP/);
  }
  for (const field of ["serverIdentifier", "serverName", "name"]) {
    const missing: Record<string, unknown> = { ...minimalTool };
    delete missing[field];
    assert.throws(() => validateHttp([missing]), new RegExp(`${field}: expected string`));
    for (const value of [null, false, 1, [], {}]) assert.throws(() => validateHttp([{ ...minimalTool, [field]: value }]), new RegExp(`${field}: expected string`));
  }
  for (const field of ["qualifiedName", "description", "plugin", "marketplace", "pluginId", "marketplaceId"]) {
    for (const value of [null, false, 1, [], {}]) assert.throws(() => validateHttp([{ ...minimalTool, [field]: value }]), new RegExp(`${field}: expected string`));
  }
});
test("HTTP MCP ingress validates only the consumed shallow schema shape", () => {
  for (const field of ["arguments", "outputSchema"]) {
    for (const value of [null, false, 1, "schema", [], {}, { type: "string" }, { type: false }, { type: "object", properties: null }, { type: "object", properties: [] }, { type: "object", properties: 1 }, { type: "object", required: null }, { type: "object", required: "value" }, { type: "object", required: ["value", 1] }]) {
      assert.throws(() => validateHttp([{ ...minimalTool, [field]: value }]), new RegExp(`\\.${field}`));
    }
    for (const value of [{ type: "object" }, { type: "object", properties: {}, required: [] }, { type: "object", properties: { value: false, ignored: null }, $ref: "not-restricted", unknown: 7 }]) {
      assert.equal(validateHttp([{ ...minimalTool, [field]: value }]), undefined);
    }
  }
});
test("HTTP MCP existing catch logs invalid input before conversion and preserves discovery fallback", () => {
  for (const json of ["[", "null", "{}", JSON.stringify([minimalTool, { ...minimalTool, name: 7 }])]) {
    const state = runHttpIngress(json);
    assert.equal(state.result, undefined);
    assert.deepEqual(state.converted, []);
    assert.deepEqual(state.infos, []);
    assert.deepEqual(state.errors, ["Failed to parse HTTP MCP tools JSON"]);
  }
  for (const json of [undefined, "", "[]"]) {
    const state = runHttpIngress(json);
    assert.equal(state.result, undefined);
    assert.deepEqual(state.errors, []);
    assert.deepEqual(state.converted, []);
  }
});
test("HTTP MCP valid ingress produces the preserved named definitions without removing metadata", () => {
  const tools = [minimalTool, { ...minimalTool, qualifiedName: "server.tool", arguments: { type: "object", additionalProperties: false }, outputSchema: { type: "object", $defs: { id: { type: "string" } } }, pluginId: "plugin", marketplaceId: "market", extra: true }];
  const state = runHttpIngress(JSON.stringify(tools));
  assert.deepEqual(normalized(state.result), normalized({ tools: tools.map(namedTool) }));
  assert.deepEqual(normalized(state.converted), tools);
  assert.deepEqual(state.errors, []);
  assert.deepEqual(state.infos, ["Parsed HTTP MCP tools for file system discovery"]);
});

test("maintained sandbox validator is exactly the preserved helper after type erasure", () => {
  assert.equal(semanticFingerprint(sandboxHelper), semanticFingerprint(preservedFunction("validateSandboxPolicyJson")));
});
const validSandboxInputs: JsonValue[] = [
  {}, [], [null, "ignored", 7],
  { type: "insecure_none", debugOutputDir: "", captureDenies: false, enableSharedBuildCache: true, ignored: 7 },
  { type: "workspace_readonly", networkAccess: true, networkPolicyStrict: false, disableTmpWrite: true, readBoundary: "system", additionalReadPaths: ["", "relative"], additionalReadonlyPaths: [] },
  { type: "workspace_readwrite", readBoundary: "workspace", additionalReadwritePaths: ["/path"], networkPolicy: [] },
  { networkPolicy: { default: "allow", allow: ["example.test", 3, null, {}], deny: [false, "bad.test"], version: "ignored", logging: { decisionLogPath: 8, logFormat: "invalid" } } },
  { networkPolicy: { default: "deny", allow: [], deny: [], logging: ["ignored"], extra: null } },
  { networkPolicy: { logging: { decisionLogPath: "", logFormat: "jsonl" } } },
];
const invalidSandboxInputs: JsonValue[] = [null, false, 7, "policy", { type: "invalid" }, { type: null }, { readBoundary: "unexpected" }, { networkPolicy: null }, { networkPolicy: "policy" }, { networkPolicy: { default: "unexpected" } }, { networkPolicy: { allow: 7 } }, { networkPolicy: { deny: "bad.test" } }];
for (const field of ["networkAccess", "networkPolicyStrict", "disableTmpWrite", "enableSharedBuildCache", "captureDenies"]) {
  for (const value of [null, 7, "true", [], {}]) invalidSandboxInputs.push({ [field]: value });
}
for (const field of ["debugOutputDir"]) {
  for (const value of [null, 7, true, [], {}]) invalidSandboxInputs.push({ [field]: value });
}
for (const field of ["additionalReadwritePaths", "additionalReadonlyPaths", "additionalReadPaths"]) {
  for (const value of [null, 7, "path", {}, ["path", false]]) invalidSandboxInputs.push({ [field]: value });
}
test("maintained sandbox validator accepts original array roots and shallow network input without mutation", () => {
  for (const input of validSandboxInputs) {
    const before = JSON.stringify(input);
    assert.equal(validateSandbox(input), undefined);
    assert.equal(validateSandbox(input), validatePreservedSandbox(input));
    assert.equal(JSON.stringify(input), before);
  }
});
test("maintained sandbox validator rejects exactly the preserved wrong-type fixtures", () => {
  for (const input of invalidSandboxInputs) {
    assert.equal(typeof validateSandbox(input), "string");
    assert.equal(validateSandbox(input), validatePreservedSandbox(input));
  }
});
test("sandbox valid ingress preserves parser sanitization and resolves policies through the original path", () => {
  for (const input of validSandboxInputs) {
    const state = runSandboxIngress(JSON.stringify(input));
    assert.deepEqual(normalized(state.result), normalized(parseSandbox(input)));
    assert.deepEqual(normalized(state.parsed), [input]);
    assert.deepEqual(state.resolved, ["/fixture/workspace"]);
    assert.deepEqual(state.errors, []);
  }
  const mixedNetwork = runSandboxIngress(JSON.stringify({ networkPolicy: { allow: ["ok.test", 7, null], deny: [false, "bad.test"], logging: { decisionLogPath: 8 } } }));
  assert.deepEqual(normalized(mixedNetwork.result), { type: "workspace_readwrite", networkPolicy: { version: 1, allow: ["ok.test"], deny: ["bad.test"] } });
});
test("sandbox invalid ingress takes the existing logged default before invoking the parser", () => {
  for (const json of ["{", ...invalidSandboxInputs.map(input => JSON.stringify(input))]) {
    const state = runSandboxIngress(json);
    assert.deepEqual(normalized(state.result), { type: "workspace_readwrite" });
    assert.deepEqual(state.parsed, []);
    assert.deepEqual(state.resolved, []);
    assert.deepEqual(state.errors, ["Failed to parse sandbox policy, using default policy"]);
  }
});
test("sandbox disabled and absent-policy behavior remain unchanged", () => {
  const disabled = runSandboxIngress("{invalid", false);
  assert.deepEqual(normalized(disabled.result), { type: "insecure_none" });
  assert.deepEqual(disabled.errors, []);
  assert.deepEqual(disabled.parsed, []);
  const absent = runSandboxIngress(undefined);
  assert.deepEqual(normalized(absent.result), { type: "workspace_readwrite" });
  assert.deepEqual(absent.errors, []);
  assert.deepEqual(absent.parsed, []);
});

test("HTTP MCP conversion, lease and logging failures retain the existing catch and assigned-lease semantics", () => {
  for (const phase of ['conversion', 'lease', 'logging'] as const) {
    const errors: unknown[] = [];
    const failure = new Error(`fixture ${phase}`);
    const lease = { tools: [minimalTool] };
    const result = createHttpMcpLeaseFromJson(JSON.stringify([minimalTool]), {
      globalContext: fixtureContext(),
      execDaemonLogger: {
        info: () => { if (phase === 'logging') throw failure; },
        error: (_ctx, message, error) => errors.push([message, error]),
      },
      buildNamedMcpToolDefinitionFromFileContent: (tool) => {
        if (phase === 'conversion') throw failure;
        return tool;
      },
      createLease: () => {
        if (phase === 'lease') throw failure;
        return lease;
      },
    });
    assert.equal(result, phase === 'logging' ? lease : undefined);
    assert.deepEqual(errors, [["Failed to parse HTTP MCP tools JSON", failure]]);
  }
});

test("sandbox parser and path resolver failures preserve the logged workspace-write fallback", () => {
  for (const phase of ['parser', 'paths'] as const) {
    const errors: unknown[] = [];
    const failure = new Error(`fixture ${phase}`);
    const result = resolveSandboxPolicyFromJson('{}', {
      sandboxEnabled: true, workspacePath: '/fixture/workspace', globalContext: fixtureContext(),
      execDaemonLogger: { error: (_ctx, message, detail) => errors.push([message, detail]) },
      parseSandboxPolicyJson: () => {
        if (phase === 'parser') throw failure;
        return { type: 'workspace_readonly' };
      },
      resolvePolicyPaths: () => { throw failure; },
    });
    assert.deepEqual(result, { type: 'workspace_readwrite' });
    assert.deepEqual(errors, [["Failed to parse sandbox policy, using default policy", { error: failure }]]);
  }
});
