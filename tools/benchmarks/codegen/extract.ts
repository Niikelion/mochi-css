import { parseSync, type Module, type ModuleItem, type Expression, type ObjectExpression, type KeyValueProperty } from "@swc/core"

export interface CreateTokenBinding {
    varName: string
    tokenName: string
}

export interface LocalCssVar {
    camelName: string
    cssName: string
}

export interface StyledCall {
    exportName: string
    isExported: boolean
    element: string
    isComponent: boolean
    cssVarRef?: string
    config?: ObjectExpression
}

export interface CssCall {
    varName: string
    config: ObjectExpression
}

export interface ParsedFile {
    source: string
    filePath: string
    tokenImports: string[]
    createTokenBindings: CreateTokenBinding[]
    localCssVars: LocalCssVar[]
    styledCalls: StyledCall[]
    cssCalls: CssCall[]
    hasFadeInImport: boolean
}

function getKeyStr(key: KeyValueProperty["key"]): string | null {
    if (key.type === "Identifier") return key.value
    if (key.type === "StringLiteral") return key.value
    return null
}

function scanExprForLocalCssVars(expr: Expression, referenced: Set<string>, defined: Set<string>) {
    if (expr.type === "TemplateLiteral") {
        for (const q of expr.quasis) {
            const m = q.raw.match(/var\(--([a-zA-Z-]+)\)/g)
            if (m) m.forEach(s => referenced.add(s.slice(6, -1)))
        }
    } else if (expr.type === "StringLiteral") {
        const m = expr.value.match(/^var\(--([a-zA-Z-]+)\)$/)
        if (m) referenced.add(m[1])
    } else if (expr.type === "ObjectExpression") {
        scanObjectForLocalCssVars(expr, referenced, defined)
    }
}

function scanObjectForLocalCssVars(obj: ObjectExpression, referenced: Set<string>, defined: Set<string>) {
    for (const prop of obj.properties) {
        if (prop.type !== "KeyValueProperty") continue
        const k = getKeyStr(prop.key)
        if (k && k.startsWith("--")) defined.add(k.slice(2))
        scanExprForLocalCssVars(prop.value as Expression, referenced, defined)
    }
}

function toCamelCase(kebab: string): string {
    return kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
}

function extractLocalCssVars(configs: ObjectExpression[]): LocalCssVar[] {
    const referenced = new Set<string>()
    const defined = new Set<string>()
    for (const cfg of configs) scanObjectForLocalCssVars(cfg, referenced, defined)
    const result: LocalCssVar[] = []
    for (const name of defined) {
        if (referenced.has(name)) {
            result.push({ camelName: toCamelCase(name), cssName: `--${name}` })
        }
    }
    return result
}

function processVarDecl(decl: ModuleItem, isExported: boolean, styledCalls: StyledCall[], cssCalls: CssCall[], createTokenBindings: CreateTokenBinding[]) {
    const varDecl = isExported && decl.type === "ExportDeclaration" ? decl.declaration : decl
    if (varDecl.type !== "VariableDeclaration") return

    for (const declarator of varDecl.declarations) {
        if (declarator.id.type !== "Identifier") continue
        const name = declarator.id.value
        const init = declarator.init
        if (!init || init.type !== "CallExpression") continue
        const callee = init.callee
        if (callee.type !== "Identifier") continue

        if (callee.value === "createToken" && init.arguments.length > 0) {
            const arg = init.arguments[0].expression
            if (arg.type === "StringLiteral") {
                createTokenBindings.push({ varName: name, tokenName: arg.value })
            }
        } else if (callee.value === "css" && init.arguments.length > 0) {
            const arg = init.arguments[0].expression
            if (arg.type === "ObjectExpression") {
                cssCalls.push({ varName: name, config: arg })
            }
        } else if (callee.value === "styled" && init.arguments.length >= 2) {
            const firstArg = init.arguments[0].expression
            const secondArg = init.arguments[1].expression
            const element = firstArg.type === "StringLiteral" ? firstArg.value
                : firstArg.type === "Identifier" ? firstArg.value : "div"
            const isComponent = firstArg.type === "Identifier"
            if (secondArg.type === "ObjectExpression") {
                styledCalls.push({ exportName: name, isExported, element, isComponent, config: secondArg })
            } else if (secondArg.type === "Identifier") {
                styledCalls.push({ exportName: name, isExported, element, isComponent: true, cssVarRef: secondArg.value })
            }
        }
    }
}

export function parseStyledFile(filePath: string, source: string): ParsedFile {
    const isTsx = filePath.endsWith(".tsx")
    const ast = parseSync(source, { syntax: "typescript", tsx: isTsx, decorators: false }) as Module

    const tokenImports: string[] = []
    const createTokenBindings: CreateTokenBinding[] = []
    const styledCalls: StyledCall[] = []
    const cssCalls: CssCall[] = []
    let hasFadeInImport = false

    for (const item of ast.body) {
        if (item.type === "ImportDeclaration") {
            const src = item.source.value
            if (src === "../tokens" || src === "./tokens") {
                for (const spec of item.specifiers) {
                    if (spec.type === "ImportSpecifier" && spec.local.type === "Identifier") {
                        tokenImports.push(spec.local.value)
                    }
                }
            }
            if (src === "../global" || src === "./global") {
                for (const spec of item.specifiers) {
                    if (spec.type === "ImportSpecifier" && spec.local.type === "Identifier" && spec.local.value === "fadeIn") {
                        hasFadeInImport = true
                    }
                }
            }
        } else if (item.type === "ExportDeclaration") {
            processVarDecl(item, true, styledCalls, cssCalls, createTokenBindings)
        } else if (item.type === "VariableDeclaration") {
            processVarDecl(item, false, styledCalls, cssCalls, createTokenBindings)
        }
    }

    const allConfigs = [
        ...styledCalls.filter(c => c.config).map(c => c.config!),
        ...cssCalls.map(c => c.config),
    ]
    const localCssVars = extractLocalCssVars(allConfigs)

    return { source, filePath, tokenImports, createTokenBindings, localCssVars, styledCalls, cssCalls, hasFadeInImport }
}
