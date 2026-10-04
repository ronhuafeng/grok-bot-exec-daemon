import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { readBaseline } from './lib/bundle.js';
type Literal = string | number | boolean;
interface Scalar {
    kind: "scalar";
    id: string;
}
interface Field {
    name: string;
    type: Descriptor | Scalar;
    optional: boolean;
    repeated: boolean;
    oneof?: string;
    mapKey?: string | number;
}
interface DescriptorBase {
    key: string;
    fq: string;
    id: string;
    source: string;
}
interface MessageDescriptor extends DescriptorBase {
    kind: "message";
    fields: Field[];
}
interface EnumDescriptor extends DescriptorBase {
    kind: "enum";
    values: [
        string,
        number
    ][];
}
type Descriptor = MessageDescriptor | EnumDescriptor;
interface Factory {
    id: string;
    imports: Map<string, string>;
    exports: Map<string, ts.Expression>;
    classes: Map<string, ts.ClassDeclaration>;
    enums: Map<string, {
        node: ts.VariableDeclaration;
        args: ts.NodeArray<ts.Expression>;
    }>;
    legacy: Map<string, ts.Expression>;
    legacyEnums: Map<string, ts.NodeArray<ts.Expression>>;
    variables: Map<string, ts.Expression>;
}
function requireValue<T>(value: T | undefined, message = "Missing value"): T { if (value === undefined)
    throw new Error(message); return value; }
function expression(node: ts.Node | undefined): ts.Expression { if (!node || !ts.isExpression(node))
    throw new Error("Expected expression"); return node; }
function object(node: ts.Node | undefined): ts.ObjectLiteralExpression { if (!node || !ts.isObjectLiteralExpression(node))
    throw new Error("Expected object literal"); return node; }
function array(node: ts.Node | undefined): ts.ArrayLiteralExpression { if (!node || !ts.isArrayLiteralExpression(node))
    throw new Error("Expected array literal"); return node; }
function property(node: ts.ObjectLiteralElementLike): ts.PropertyAssignment { if (!ts.isPropertyAssignment(node))
    throw new Error("Expected property assignment"); return node; }
function properties(node: ts.Node | undefined): Map<string, ts.Expression> { return new Map(object(node).properties.map(p => { const a = property(p); return [a.name.getText(), a.initializer]; })); }
function asString(value: Literal): string { if (typeof value !== "string")
    throw new Error("Expected string"); return value; }
const source = await readBaseline();
const starts = [...source.matchAll(/^\/\*\*\*\/ "([^"\n]+)"\n/gm)];
const raw = new Map(starts.map((m, i) => [m[1], source.slice(m.index, starts[i + 1]?.index ?? source.length)]));
const modules = new Map<string, Factory>(), nodes = new Map<string, Descriptor>(), needed = new Set<string>(), gaps: string[] = [];
function unwrap(x: ts.Expression | undefined): ts.Expression | undefined { while (x && (ts.isParenthesizedExpression(x) || ts.isAsExpression(x)))
    x = x.expression; return x; }
function val(input: ts.Expression | undefined): Literal { const x = requireValue(unwrap(input)); if (ts.isStringLiteral(x) || ts.isNumericLiteral(x))
    return x.text; if (x.kind === ts.SyntaxKind.TrueKeyword)
    return true; if (x.kind === ts.SyntaxKind.FalseKeyword)
    return false; if (ts.isPrefixUnaryExpression(x))
    return -Number(val(x.operand)); throw new Error('not literal ' + x.getText()); }
function getModule(id: string): Factory {
    if (modules.has(id))
        return requireValue(modules.get(id));
    const txt = raw.get(id);
    if (!txt)
        throw new Error('missing module ' + id);
    const sf = ts.createSourceFile(id, 'const factories = {\n' + txt + '\n};', ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const statement = sf.statements[0];
    if (!ts.isVariableStatement(statement))
        throw new Error('Expected factory declaration');
    const factory = object(statement.declarationList.declarations[0].initializer).properties[0];
    if (!ts.isMethodDeclaration(factory))
        throw new Error('Expected factory method');
    if (!factory.body)
        throw new Error('missing body ' + id);
    const mod: Factory = {
        id,
        imports: new Map<string, string>(),
        exports: new Map<string, ts.Expression>(),
        classes: new Map<string, ts.ClassDeclaration>(),
        enums: new Map<string, { node: ts.VariableDeclaration; args: ts.NodeArray<ts.Expression> }>(),
        legacy: new Map<string, ts.Expression>(),
        legacyEnums: new Map<string, ts.NodeArray<ts.Expression>>(),
        variables: new Map<string, ts.Expression>(),
    };
    modules.set(id, mod);
    for (const st of factory.body.statements) {
        if (ts.isVariableStatement(st))
            for (const d of st.declarationList.declarations) {
                const x = unwrap(d.initializer);
                if (!x)
                    continue;
                mod.variables.set(d.name.getText(), x);
                if (ts.isCallExpression(x) && ts.isIdentifier(x.expression) && x.expression.text === '__webpack_require__')
                    mod.imports.set(d.name.getText(), asString(val(x.arguments[0])));
                if (ts.isCallExpression(x) && x.arguments.length >= 4 && ts.isStringLiteral(x.arguments[2]) && ts.isArrayLiteralExpression(x.arguments[3])) {
                    const doc = source;
                    const pairs = x.arguments[3].elements;
                    if (pairs.every(p => ts.isArrayLiteralExpression(p) && p.elements.length >= 2 && ts.isNumericLiteral(p.elements[0])))
                        mod.enums.set(d.name.getText(), { node: d, args: x.arguments });
                }
            }
        if (ts.isClassDeclaration(st) && st.name)
            mod.classes.set(st.name.text, st);
        if (ts.isExpressionStatement(st)) {
            const e = st.expression;
            if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression) && e.expression.name.text === 'setEnumType')
                mod.legacyEnums.set(e.arguments[0].getText(), e.arguments);
            if (ts.isCallExpression(e) && ts.isPropertyAccessExpression(e.expression) && e.expression.expression.getText() === '__webpack_require__' && e.expression.name.text === 'd') {
                const obj = e.arguments[1];
                if (ts.isObjectLiteralExpression(obj))
                    for (const p of obj.properties)
                        if (ts.isPropertyAssignment(p) && ts.isArrowFunction(p.initializer))
                            mod.exports.set(p.name.getText().replace(/^['"]|['"]$/g, ''), requireValue(unwrap(expression(p.initializer.body))));
            }
            if (ts.isBinaryExpression(e) && ts.isPropertyAccessExpression(e.left) && e.left.name.text === 'fields')
                mod.legacy.set(e.left.expression.getText(), e.right);
        }
    }
    return mod;
}
function resolve(mod: Factory, input: ts.Expression | undefined): Descriptor {
    const x = requireValue(unwrap(input));
    if (ts.isCallExpression(x) && ts.isPropertyAccessExpression(x.expression) && x.expression.name.text === 'getEnumType')
        return resolve(mod, x.arguments[0]);
    if (ts.isIdentifier(x)) {
        if (mod.classes.has(x.text) || mod.enums.has(x.text) || mod.legacyEnums.has(x.text))
            return load(mod, x.text);
        throw new Error('unresolved local ' + mod.id + ' ' + x.text);
    }
    if (ts.isPropertyAccessExpression(x)) {
        const id = mod.imports.get(x.expression.getText());
        if (!id)
            throw new Error('unresolved import ' + mod.id + ' ' + x.getText());
        const next = getModule(id), ex = next.exports.get(x.name.text);
        if (!ex)
            throw new Error('unresolved export ' + id + ' ' + x.name.text);
        return resolve(next, ex);
    }
    throw new Error('unresolved expr ' + mod.id + ' ' + x.getText());
}
function identifier(fq: string): string { return fq.replace(/[^a-zA-Z0-9_$]/g, '_'); }
function packageOf(mod: Factory, cls: ts.ClassDeclaration): string {
    const comment = cls.getFullText().match(/@generated from message ([\w.]+)/);
    if (comment)
        return comment[1];
    // Google WKT standard class type name assignment retained in factory text.
    const m = requireValue(raw.get(mod.id)).match(new RegExp('\\b' + requireValue(cls.name).text + '\\.typeName = "([^"\\n]+)"'));
    if (m)
        return m[1];
    throw new Error('no qualified class name ' + mod.id + ' ' + requireValue(cls.name).text);
}
function load(mod: Factory, name: string): Descriptor {
    const key = mod.id + '::' + name;
    if (nodes.has(key)) {
        needed.add(key);
        return requireValue(nodes.get(key));
    }
    if (mod.legacyEnums.has(name)) {
        const args = requireValue(mod.legacyEnums.get(name)), fq = asString(val(args[1]));
        const values: [
            string,
            number
        ][] = array(args[2]).elements.map(p => { const m = properties(p); return [asString(val(m.get('name'))), Number(val(m.get('no')))]; });
        const result: EnumDescriptor = { key, fq, id: identifier(fq), kind: 'enum', values, source: mod.id };
        nodes.set(key, result);
        needed.add(key);
        return result;
    }
    if (mod.enums.has(name)) {
        const { node, args } = requireValue(mod.enums.get(name));
        const c = node.getFullText().match(/@generated from enum ([\w.]+)/);
        // Declarations may attach comment to variable statement rather than individual declaration.
        const c2 = node.parent.parent.getFullText().match(/@generated from enum ([\w.]+)/);
        const fq = (c ?? c2)?.[1];
        if (!fq)
            throw new Error('no qualified enum ' + mod.id + ' ' + name);
        const pairs = array(args[3]).elements.map(p => array(p).elements.map(val));
        const flag = args[4] && unwrap(args[4]);
        let locals: string[];
        if (flag && ts.isNumericLiteral(flag) && flag.text === '1')
            locals = pairs.map(p => asString(p[1]));
        else if (flag && ts.isArrayLiteralExpression(flag))
            locals = flag.elements.map(p => asString(val(p)));
        else {
            const simple = requireValue(fq.split('.').at(-1));
            const prefix = (simple[0] + simple.slice(1).replace(/[A-Z]/g, c => '_' + c)).toLowerCase() + '_';
            locals = pairs.every(p => asString(p[1]).toLowerCase().startsWith(prefix) && asString(p[1]).length > prefix.length && !/^\d/.test(asString(p[1]).slice(prefix.length))) ? pairs.map(p => asString(p[1]).slice(prefix.length)) : pairs.map(p => asString(p[1]));
        }
        const result: EnumDescriptor = { key, fq, id: identifier(fq), kind: 'enum', values: pairs.map((p, i) => [locals[i], Number(p[0])]), source: mod.id };
        nodes.set(key, result);
        needed.add(key);
        return result;
    }
    const cls = requireValue(mod.classes.get(name));
    const fq = packageOf(mod, cls);
    const result: MessageDescriptor = { key, fq, id: identifier(fq), kind: 'message', fields: [], source: mod.id };
    nodes.set(key, result);
    needed.add(key);
    const method = cls.members.find((m): m is ts.MethodDeclaration => ts.isMethodDeclaration(m) && m.name.getText() === '$');
    if (method) {
        const arr = array(requireValue(requireValue(method.body).statements.find(ts.isReturnStatement)).expression);
        const [descriptor, ...refs] = arr.elements;
        const text = asString(val(descriptor));
        for (const f of text.split('|').slice(1)) {
            let [no, n, t, modif] = f.split(' ');
            if (/[?*]$/.test(t)) {
                modif = requireValue(t.at(-1));
                t = t.slice(0, -1);
            }
            let mapKey: string | undefined;
            if (t.includes(',')) {
                [mapKey, t] = t.split(',');
            }
            const type: Descriptor | Scalar = t.startsWith('#') ? resolve(mod, refs[Number(t.slice(1))]) : { kind: 'scalar', id: scalar(t) };
            result.fields.push({ name: camel(n), type, optional: modif === '?' || (type.kind === 'message' && !modif && !mapKey), repeated: modif === '*', oneof: modif && modif !== '?' && modif !== '*' ? camel(modif) : undefined, mapKey });
        }
    }
    else if (mod.legacy.has(name)) {
        const init = requireValue(mod.legacy.get(name));
        if (!ts.isCallExpression(init) || !ts.isArrowFunction(init.arguments[0]))
            throw new Error('Invalid legacy fields');
        const arr = array(init.arguments[0].body);
        for (const obj of arr.elements) {
            const p = properties(obj);
            let kind = val(p.get('kind')), mapKey: string | number | undefined;
            let types = p;
            if (kind === 'map') {
                mapKey = Number(val(p.get('K')));
                types = properties(p.get('V'));
                kind = val(types.get('kind'));
            }
            const type: Descriptor | Scalar = kind === 'scalar' ? { kind: 'scalar', id: scalar(val(types.get('T'))) } : resolve(mod, types.get('T'));
            const repeated = p.has('repeated') && val(p.get('repeated')) === true;
            result.fields.push({ name: camel(asString(val(p.get('name')))), type, optional: (!mapKey && !repeated && kind === 'message') || (p.has('opt') && val(p.get('opt')) === true), repeated, oneof: p.has('oneof') ? camel(asString(val(p.get('oneof')))) : undefined, mapKey });
        }
    }
    else
        throw new Error('no field descriptor ' + fq);
    // Independent constructor audit: every emitted non-optional data field and
    // oneof group must agree with the class's retained runtime initialization.
    const initialized = new Set<string>();
    const constructor = cls.members.find(ts.isConstructorDeclaration);
    for (const statement of constructor?.body?.statements ?? []) {
        if (!ts.isExpressionStatement(statement)) continue;
        const assignment = statement.expression;
        if (!ts.isBinaryExpression(assignment) || assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken) continue;
        if (!ts.isPropertyAccessExpression(assignment.left) || assignment.left.expression.kind !== ts.SyntaxKind.ThisKeyword) continue;
        initialized.add(assignment.left.name.text);
    }
    const names = new Set(result.fields.map(field => field.oneof ?? field.name));
    for (const initializedName of initialized) {
        if (!names.has(initializedName)) throw new Error(`Constructor field ${fq}.${initializedName} is absent from its descriptor`);
    }
    for (const field of result.fields) {
        if (!field.optional && !initialized.has(field.oneof ?? field.name)) {
            throw new Error(`Required field ${fq}.${field.oneof ?? field.name} is not initialized`);
        }
    }
    return result;
}
function scalar(t: Literal): string { const n = Number(t); if ([1, 2, 5, 7, 13, 15, 17].includes(n))
    return 'number'; if ([3, 4, 6, 16, 18].includes(n))
    return 'bigint'; if (n === 8)
    return 'boolean'; if (n === 9)
    return 'string'; if (n === 12)
    return 'Uint8Array'; throw new Error('scalar ' + t); }
function camel(name: string): string { return name.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase()); }
function runtimeFiles(directory: string): string[] { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? runtimeFiles(path.join(directory, entry.name)) : [path.join(directory, entry.name)]); }
/** The semantic facades are the runtime dependency authority. Ambient application
 * declarations no longer exist, so discover exact registry IDs at this boundary. */
function importedProtoModules(): string[] {
    const ids = new Set<string>();
    for (const file of runtimeFiles('src/interop/vendor').filter(file => file.endsWith('.ts'))) {
        const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
        const loaders = new Set<string>();
        for (const statement of source.statements) {
            if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
                statement.moduleSpecifier.text !== './loader.js' || statement.importClause?.isTypeOnly) continue;
            const bindings = statement.importClause?.namedBindings;
            if (bindings && ts.isNamedImports(bindings)) {
                for (const binding of bindings.elements) {
                    if ((binding.propertyName ?? binding.name).text === 'loadVendorModule') loaders.add(binding.name.text);
                }
            }
        }
        function inspect(node: ts.Node): void {
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && loaders.has(node.expression.text)) {
                const id = node.arguments[0];
                if (node.arguments.length !== 1 || !id || !ts.isStringLiteral(id)) {
                    throw new Error(`Vendor facade requires one literal module ID: ${file}`);
                }
                if (id.text.includes('/proto/dist/generated/')) ids.add(id.text);
            }
            ts.forEachChild(node, inspect);
        }
        inspect(source);
    }
    if (ids.size === 0) throw new Error('No retained protobuf facade modules were discovered');
    return [...ids].sort();
}
const ids = importedProtoModules();
const mappings: {
    id: string;
    fields: [
        string,
        Descriptor
    ][];
}[] = [];
for (const id of ids) {
    const m = getModule(id), fields: [
        string,
        Descriptor
    ][] = [];
    for (const [symbol, ref] of m.exports) {
        try {
            const n = resolve(m, ref);
            fields.push([symbol, n]);
        }
        catch (e) {
            gaps.push(e instanceof Error ? e.stack ?? e.message : String(e));
        }
    }
    mappings.push({ id, fields });
}
for (const name of ['ExecStreamElement', 'ReadFileRequest', 'ReadFileHeader', 'ReadFileComplete', 'ReadFileResponse'])
    load(getModule('./src/server.ts'), name);
load(getModule('../proto/dist/generated/agent/v1/exec_pb.js'), 'ExecServerControlMessage');
const services: {
    name: string;
    typeName: string;
    methods: {
        key: string;
        name: string;
        input: Descriptor;
        output: Descriptor;
        kind: number;
    }[];
}[] = [];
for (const name of ['ControlService', 'ExecService', 'PtyHostService', 'TmuxSessionService']) {
    const mod = getModule('./src/server.ts'), service = mod.variables.get(name);
    const props = properties(service);
    const methods = object(props.get('methods')).properties.map(propertyNode => {
        const method = property(propertyNode);
        const fields = properties(method.initializer);
        const kindField = requireValue(fields.get("kind"));
        if (!ts.isPropertyAccessExpression(kindField))
            throw new Error("Invalid method kind");
        const kinds: Record<string, number> = { Unary: 0, ServerStreaming: 1, ClientStreaming: 2, BiDiStreaming: 3 };
        return { key: method.name.getText(), name: asString(val(fields.get('name'))), input: resolve(mod, fields.get('I')), output: resolve(mod, fields.get('O')), kind: kinds[kindField.name.text] };
    });
    services.push({ name, typeName: asString(val(props.get('typeName'))), methods });
}
if (gaps.length) {
    throw new Error(gaps.join('\n'));
}
const used = [...nodes.values()].filter(x => needed.has(x.key));
const uniq = new Map<string, Descriptor>();
for (const x of used) {
    if (uniq.has(x.id) && JSON.stringify(requireValue(uniq.get(x.id))) !== JSON.stringify(x))
        throw new Error('collision ' + x.id);
    uniq.set(x.id, x);
}
let out = '/** Generated from retained protobuf descriptors in vendor/exec-daemon-runtime/index.js.\n * Regenerate with tools/generate-proto-contracts.ts. No original declarations were available. */\nimport type { ProtoMessage, MessageInit, BinaryReadOptions, JsonReadOptions, JsonValue } from "./protobuf-runtime.js";\n\n';
for (const n of [...uniq.values()].sort((a, b) => a.id.localeCompare(b.id))) {
    out += '/** ' + n.fq + '; source: ' + n.source + ' */\n';
    if (n.kind === 'enum') {
        out += 'export declare enum ' + n.id + ' {\n' + n.values.map(([k, v]) => '  ' + JSON.stringify(k) + ' = ' + v + ',').join('\n') + '\n}\n\n';
        continue;
    }
    out += 'export declare class ' + n.id + ' extends ProtoMessage {\n';
    out += '  constructor(data?: MessageInit<' + n.id + '>);\n  static readonly typeName: ' + JSON.stringify(n.fq) + ';\n';
    const oneofs = new Map<string, string[]>();
    for (const f of n.fields) {
        let t = f.type.id;
        if (f.oneof) {
            if (!oneofs.has(f.oneof))
                oneofs.set(f.oneof, []);
            requireValue(oneofs.get(f.oneof)).push('{ case: ' + JSON.stringify(f.name) + '; value: ' + t + ' }');
            continue;
        }
        if (f.mapKey)
            t = 'Record<' + ([9, 8, 3, 4, 6, 16, 18].includes(Number(f.mapKey)) ? 'string' : 'number') + ', ' + t + '>';
        if (f.repeated)
            t += '[]';
        out += '  ' + f.name + (f.optional ? '?' : '') + ': ' + t + ';\n';
    }
    for (const [name, variants] of oneofs)
        out += '  ' + name + ': ' + [...variants, '{ case: undefined; value?: undefined }'].join(' | ') + ';\n';
    out += '  static fromBinary(bytes: Uint8Array, options?: BinaryReadOptions): ' + n.id + ';\n  static fromJson(value: JsonValue, options?: JsonReadOptions): ' + n.id + ';\n  static fromJsonString(value: string, options?: JsonReadOptions): ' + n.id + ';\n  static equals(a: ' + n.id + ' | MessageInit<' + n.id + '> | undefined, b: ' + n.id + ' | MessageInit<' + n.id + '> | undefined): boolean;\n}\n\n';
}
for (const service of services) {
    out += 'export interface ' + service.name + 'Descriptor {\n  readonly typeName: ' + JSON.stringify(service.typeName) + ';\n  readonly methods: {\n';
    for (const m of service.methods)
        out += '    ' + m.key + ': { name: ' + JSON.stringify(m.name) + '; I: typeof ' + m.input.id + '; O: typeof ' + m.output.id + '; kind: ' + m.kind + ' };\n';
    out += '  };\n}\n\n';
}
out += 'declare module "../modules.js" {\n  interface ExternalModules {\n';
for (const m of mappings)
    out += '    ' + JSON.stringify(m.id) + ': {\n' + m.fields.map(([s, n]) => '      ' + JSON.stringify(s) + ': typeof ' + n.id + ';').join('\n') + '\n    };\n';
out += '  }\n}\n';
const outputPath = 'src/interop/contracts/protobuf-generated.ts';
if (process.argv.includes('--check')) {
    if (fs.readFileSync(outputPath, 'utf8') !== out)
        throw new Error('Generated protobuf contracts are stale');
}
else
    fs.writeFileSync(outputPath, out);
console.log({ modules: ids.length, messages: [...uniq.values()].filter(x => x.kind === 'message').length, enums: [...uniq.values()].filter(x => x.kind === 'enum').length, lines: out.split('\n').length });
