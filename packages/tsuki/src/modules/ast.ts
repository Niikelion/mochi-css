export type ObjNode = { type: "ObjectExpression"; properties: Record<string, unknown>[] }
export type ArrNode = { type: "ArrayExpression"; elements: Record<string, unknown>[] }

export function getPropKeyName(prop: Record<string, unknown>): string | undefined {
    const key = prop["key"] as Record<string, unknown>
    if (typeof key["name"] === "string") return key["name"]
    if (typeof key["value"] === "string") return key["value"]
    return undefined
}

export function getArrayPropElements(obj: ObjNode, propName: string, configPath: string): Record<string, unknown>[] {
    const existing = obj.properties.find((prop) => getPropKeyName(prop) === propName)

    if (existing) {
        const value = existing["value"] as Record<string, unknown>
        if (value["type"] !== "ArrayExpression") {
            throw new Error(`Unrecognized ${propName} config type in ${configPath}`)
        }
        return value["elements"] as Record<string, unknown>[]
    }

    const elements: Record<string, unknown>[] = []
    obj.properties.push({
        type: "ObjectProperty",
        key: { type: "Identifier", name: propName },
        value: { type: "ArrayExpression", elements },
        computed: false,
        shorthand: false,
    })
    return elements
}

/** Push a string literal into an AST array, skipping it if already present. */
export function pushUniqueStringLiteral(elements: Record<string, unknown>[], value: string): void {
    const alreadyPresent = elements.some(
        (el) => el["type"] === "StringLiteral" && (el as { value: unknown }).value === value,
    )
    if (alreadyPresent) return
    elements.push({ type: "StringLiteral", value })
}

/**
 * Resolves the object literal behind a module's default export, unwrapping the common
 * shapes used by JS/TS config files:
 * - `export default { ... }`
 * - `export default someWrapperFn({ ... })` (e.g. `defineConfig`, `defineMain`)
 * - `const config = { ... }; export default config`
 */
export function resolveExportedConfigObject(mod: { $ast: unknown }, configPath: string): ObjNode {
    type DeclNode = { id: { type: string; name: string }; init: Record<string, unknown> | null }
    type VarDeclNode = { type: "VariableDeclaration"; declarations: DeclNode[] }
    type ExportDefaultDecl = { type: "ExportDefaultDeclaration"; declaration: Record<string, unknown> }

    const body = (mod.$ast as { body: unknown[] }).body
    const exportDefault = body.find((s) => (s as { type: string }).type === "ExportDefaultDeclaration") as
        | ExportDefaultDecl
        | undefined

    if (!exportDefault) throw new Error(`No default export found in ${configPath}`)

    const decl = exportDefault.declaration

    if (decl["type"] === "ObjectExpression") {
        return decl as ObjNode
    }

    if (decl["type"] === "CallExpression") {
        const args = decl["arguments"] as Record<string, unknown>[]
        const firstArg = args[0]
        if (firstArg?.["type"] === "ObjectExpression") {
            return firstArg as ObjNode
        }
    }

    if (decl["type"] === "Identifier") {
        const varName = decl["name"] as string
        for (const stmt of body) {
            if ((stmt as { type: string }).type !== "VariableDeclaration") continue
            for (const d of (stmt as VarDeclNode).declarations) {
                if (d.id.type !== "Identifier" || d.id.name !== varName) continue
                if (d.init?.["type"] !== "ObjectExpression") {
                    throw new Error(`Failed to resolve config object in ${configPath}`)
                }
                return d.init as ObjNode
            }
        }
    }

    throw new Error(`Failed to resolve config object in ${configPath}`)
}

export function optionsToAstProperties(options: Record<string, string | number | boolean>): Record<string, unknown>[] {
    return Object.entries(options).map(([key, value]) => ({
        type: "ObjectProperty",
        key: { type: "Identifier", name: key },
        value:
            typeof value === "string"
                ? { type: "StringLiteral", value }
                : typeof value === "number"
                  ? { type: "NumericLiteral", value }
                  : { type: "BooleanLiteral", value },
        computed: false,
        shorthand: false,
    }))
}
