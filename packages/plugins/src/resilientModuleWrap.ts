import * as SWC from "@swc/core"

/**
 * Wraps a file's generated module body so a runtime error anywhere in it can't take down
 * extraction for the rest of the project (#44).
 *
 * All extracted files are bundled and executed together in one shared script (required for
 * cross-file imports, wildcard re-exports, and derived-extractor propagation to resolve
 * correctly). Without this wrap, a throw anywhere in one file's module-level code aborts that
 * whole shared execution.
 *
 * The transform:
 * - Leaves `import` declarations untouched (import statements can't live inside a block).
 * - Leaves non-exported statements untouched inside a `try` block — they're only ever
 *   referenced by sibling statements in the same block, so ordinary block scoping is enough.
 * - For anything exported (`export const`, `export function`, `export class`, `export default`),
 *   pre-declares the bound name(s) as `let` *outside* the `try` and replaces the declaration
 *   with a plain assignment inside it, then re-exports the name(s) after the `try`. If the
 *   assignment never runs (an earlier statement threw), the export still exists — just
 *   `undefined` — instead of the whole file's module linking failing.
 * - On catch, reports a `MOCHI_FILE_EXEC` diagnostic naming the file and error, and execution
 *   continues with whatever exports were assigned before the throw.
 */
/** A local binding that needs to be pre-declared and re-exported after the try/catch. */
type ExportedName = { local: string; as?: string }

export function wrapModuleItemsForResilience(filePath: string, items: SWC.ModuleItem[]): SWC.ModuleItem[] {
    const imports: SWC.ImportDeclaration[] = []
    const tryStmts: SWC.Statement[] = []
    const exportedNames: ExportedName[] = []

    for (const item of items) {
        if (item.type === "ImportDeclaration") {
            imports.push(item)
            continue
        }

        const { stmt, exported } = toResilientStatement(item)
        tryStmts.push(stmt)
        exportedNames.push(...exported)
    }

    if (tryStmts.length === 0) return imports

    const uniqueExports = dedupe(exportedNames)
    const preDeclare: SWC.ModuleItem[] =
        uniqueExports.length > 0 ? [makeLetDeclaration(uniqueExports.map((n) => n.local))] : []

    const tryStatement: SWC.TryStatement = {
        type: "TryStatement",
        span: emptySpan,
        block: makeBlock(tryStmts),
        handler: makeCatchClause(filePath),
    }

    const trailingExport: SWC.ModuleItem[] = uniqueExports.length > 0 ? [makeReexport(uniqueExports)] : []

    return [...imports, ...preDeclare, tryStatement, ...trailingExport]
}

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }
// Referenced as a bare ambient global (never imported), exactly like `extractors` — the
// generated code here runs inside a virtual, synthesized module path that real npm packages
// don't reliably resolve/inline from, and the sandboxed VM has no `require`. The Builder always
// sets this global (see `evaluator.setGlobal("__global_mochi_diagnostics", ...)`), matching
// `@mochi-css/core`'s own `reportGlobalDiagnostic` implementation.
const diagnosticsGlobal = "__global_mochi_diagnostics"

function dedupe(names: ExportedName[]): ExportedName[] {
    const seen = new Set<string>()
    const result: ExportedName[] = []
    for (const n of names) {
        const key = `${n.local}\0${n.as ?? ""}`
        if (seen.has(key)) continue
        seen.add(key)
        result.push(n)
    }
    return result
}

function makeIdentifier(name: string): SWC.Identifier {
    return { type: "Identifier", span: emptySpan, ctxt: 0, value: name, optional: false }
}

function makeCallExpression(callee: SWC.Expression, args: SWC.Expression[]): SWC.CallExpression & { ctxt: number } {
    return {
        type: "CallExpression",
        span: emptySpan,
        ctxt: 0,
        callee,
        arguments: args.map((expression) => ({ expression })),
    }
}

function makeBlock(stmts: SWC.Statement[]): SWC.BlockStatement & { ctxt: number } {
    return { type: "BlockStatement", span: emptySpan, ctxt: 0, stmts }
}

function makeLetDeclaration(names: string[]): SWC.VariableDeclaration & { ctxt: number } {
    return {
        type: "VariableDeclaration",
        span: emptySpan,
        ctxt: 0,
        kind: "let",
        declare: false,
        declarations: names.map((name) => ({
            type: "VariableDeclarator",
            span: emptySpan,
            id: makeIdentifier(name),
            definite: false,
        })),
    }
}

function makeReexport(names: ExportedName[]): SWC.ExportNamedDeclaration {
    return {
        type: "ExportNamedDeclaration",
        span: emptySpan,
        typeOnly: false,
        specifiers: names.map(
            (name): SWC.NamedExportSpecifier => ({
                type: "ExportSpecifier",
                span: emptySpan,
                orig: makeIdentifier(name.local),
                exported: name.as ? makeIdentifier(name.as) : undefined,
                isTypeOnly: false,
            }),
        ),
    }
}

function makeAssignment(left: SWC.Expression | SWC.Pattern, right: SWC.Expression): SWC.Statement {
    const assignment: SWC.Expression = { type: "AssignmentExpression", span: emptySpan, operator: "=", left, right }
    // `{a} = x` as a bare expression statement parses as a block statement, not an assignment —
    // parenthesize whenever the left side would otherwise make the statement start with `{`.
    const expression: SWC.Expression =
        left.type === "ObjectPattern"
            ? { type: "ParenthesisExpression", span: emptySpan, expression: assignment }
            : assignment
    return { type: "ExpressionStatement", span: emptySpan, expression }
}

function makeCatchClause(filePath: string): SWC.CatchClause {
    const errIdentifier = makeIdentifier("__mochi_err")

    // (__mochi_err && __mochi_err.message) || String(__mochi_err)
    const messageExpr: SWC.Expression = {
        type: "BinaryExpression",
        span: emptySpan,
        operator: "||",
        left: {
            type: "BinaryExpression",
            span: emptySpan,
            operator: "&&",
            left: errIdentifier,
            right: {
                type: "MemberExpression",
                span: emptySpan,
                object: errIdentifier,
                property: makeIdentifier("message"),
            },
        },
        right: makeCallExpression(makeIdentifier("String"), [errIdentifier]),
    }

    // (__mochi_err && __mochi_err.stack) || ""
    const stackExpr: SWC.Expression = {
        type: "BinaryExpression",
        span: emptySpan,
        operator: "||",
        left: {
            type: "BinaryExpression",
            span: emptySpan,
            operator: "&&",
            left: errIdentifier,
            right: {
                type: "MemberExpression",
                span: emptySpan,
                object: errIdentifier,
                property: makeIdentifier("stack"),
            },
        },
        right: strLit(""),
    }

    const diagnosticObject: SWC.ObjectExpression = {
        type: "ObjectExpression",
        span: emptySpan,
        properties: [
            keyValue("code", strLit("MOCHI_FILE_EXEC")),
            keyValue("severity", strLit("warning")),
            keyValue("file", strLit(filePath)),
            keyValue("message", messageExpr),
            // Raw stack from inside the sandboxed VM — its positions are in the *bundled* script,
            // not the original source. The host (Builder) parses the first frame and remaps it
            // through the bundle + per-file sourcemaps before this diagnostic reaches the caller.
            keyValue("stack", stackExpr),
        ],
    }

    // typeof __global_mochi_diagnostics === "function" && __global_mochi_diagnostics({...})
    const guardedReport: SWC.Expression = {
        type: "BinaryExpression",
        span: emptySpan,
        operator: "&&",
        left: {
            type: "BinaryExpression",
            span: emptySpan,
            operator: "===",
            left: {
                type: "UnaryExpression",
                span: emptySpan,
                operator: "typeof",
                argument: makeIdentifier(diagnosticsGlobal),
            },
            right: strLit("function"),
        },
        right: makeCallExpression(makeIdentifier(diagnosticsGlobal), [diagnosticObject]),
    }

    const reportCall: SWC.Statement = { type: "ExpressionStatement", span: emptySpan, expression: guardedReport }

    return {
        type: "CatchClause",
        span: emptySpan,
        param: errIdentifier,
        body: makeBlock([reportCall]),
    }
}

function strLit(value: string): SWC.StringLiteral {
    return { type: "StringLiteral", span: emptySpan, value }
}

function keyValue(key: string, value: SWC.Expression): SWC.KeyValueProperty {
    return {
        type: "KeyValueProperty",
        key: { type: "Identifier", span: emptySpan, ctxt: 0, value: key, optional: false },
        value,
    }
}

function toResilientStatement(item: SWC.ModuleItem): { stmt: SWC.Statement; exported: ExportedName[] } {
    if (item.type === "ExportDeclaration") {
        return exportedDeclarationToStatement(item.declaration)
    }
    if (item.type === "ExportDefaultDeclaration") {
        if (item.decl.type === "TsInterfaceDeclaration") {
            // Type-only default export — nothing to protect, nothing to export at runtime.
            return { stmt: { type: "EmptyStatement", span: emptySpan }, exported: [] }
        }
        return {
            stmt: makeAssignment(makeIdentifier("__mochi_default"), { ...item.decl }),
            exported: [{ local: "__mochi_default", as: "default" }],
        }
    }
    if (item.type === "ExportDefaultExpression") {
        return {
            stmt: makeAssignment(makeIdentifier("__mochi_default"), item.expression),
            exported: [{ local: "__mochi_default", as: "default" }],
        }
    }
    // Non-exported statement/declaration, or a module declaration kind that carries no
    // executable code (e.g. type-only exports) — pass through unchanged into the try block.
    return { stmt: item as SWC.Statement, exported: [] }
}

function exportedDeclarationToStatement(decl: SWC.Declaration): { stmt: SWC.Statement; exported: ExportedName[] } {
    if (decl.type === "VariableDeclaration") {
        return exportedVarDeclToStatement(decl)
    }
    if (decl.type === "FunctionDeclaration") {
        const name = decl.identifier.value
        const expr: SWC.FunctionExpression = { ...decl, type: "FunctionExpression" }
        return { stmt: makeAssignment(makeIdentifier(name), expr), exported: [{ local: name }] }
    }
    if (decl.type === "ClassDeclaration") {
        const name = decl.identifier.value
        const expr: SWC.ClassExpression = { ...decl, type: "ClassExpression" }
        return { stmt: makeAssignment(makeIdentifier(name), expr), exported: [{ local: name }] }
    }
    // Type-only declarations (interfaces, type aliases, enums, ts modules) carry no runtime
    // code — nothing to protect, nothing to export at the JS level.
    return { stmt: { type: "EmptyStatement", span: emptySpan }, exported: [] }
}

function exportedVarDeclToStatement(decl: SWC.VariableDeclaration): { stmt: SWC.Statement; exported: ExportedName[] } {
    const names: string[] = []
    const stmts: SWC.Statement[] = []

    for (const declarator of decl.declarations) {
        collectPatternNames(declarator.id, names)
        if (!declarator.init) continue
        stmts.push(makeAssignment(declarator.id, declarator.init))
    }

    const exported = names.map((local) => ({ local }))
    if (stmts.length === 0) return { stmt: { type: "EmptyStatement", span: emptySpan }, exported }
    if (stmts.length === 1) {
        const only = stmts[0]
        if (only) return { stmt: only, exported }
    }
    return { stmt: makeBlock(stmts), exported }
}

function collectPatternNames(pattern: SWC.Pattern, names: string[]): void {
    switch (pattern.type) {
        case "Identifier":
            names.push(pattern.value)
            return
        case "ArrayPattern":
            for (const el of pattern.elements) if (el) collectPatternNames(el, names)
            return
        case "ObjectPattern":
            for (const prop of pattern.properties) {
                if (prop.type === "KeyValuePatternProperty") collectPatternNames(prop.value, names)
                else if (prop.type === "AssignmentPatternProperty") names.push(prop.key.value)
                else collectPatternNames(prop.argument, names)
            }
            return
        case "AssignmentPattern":
            collectPatternNames(pattern.left, names)
            return
        case "RestElement":
            collectPatternNames(pattern.argument, names)
            return
        default:
            // Expression / Invalid patterns aren't valid binding targets — nothing to collect.
            return
    }
}
