import { printSync } from "@swc/core"
import type { Expression, ObjectExpression, TemplateLiteral } from "@swc/core"
import type { ParsedFile, CreateTokenBinding } from "../extract.ts"

const CSS_HEADER = "/* @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts */"
const TS_HEADER = "// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts"
const DUMMY_SPAN = { start: 0, end: 0, ctxt: 0 }
const VARIANT_KEYS = new Set(["variants", "defaultVariants", "compoundVariants"])

// Mochi token expressions → CSS custom property var() references
const COLOR_VARS: Record<string, string> = {
    bg: "--m-bg", text: "--m-text", gold: "--m-gold", dim: "--m-dim",
    surface: "--m-surface", border: "--m-border",
    bgGlass: "--m-bg-glass", bgMuted: "--m-bg-muted",
    goldSubtle: "--m-gold-subtle", goldFaint: "--m-gold-faint",
}
const RADII_VARS: Record<string, string> = { sm: "--m-r-sm", md: "--m-r-md", lg: "--m-r-lg" }
const FONT_SIZE_VARS: Record<string, string> = {
    xs: "--m-fs-xs", sm: "--m-fs-sm", base: "--m-fs-base",
    lg: "--m-fs-lg", xl: "--m-fs-xl", "2xl": "--m-fs-2xl", "3xl": "--m-fs-3xl",
}

function cssProperty(camel: string): string {
    if (camel.startsWith("--")) return camel
    return camel.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
}

function exprToSrc(expr: Expression): string {
    const r = printSync({
        type: "Module",
        body: [{ type: "ExpressionStatement", expression: expr, span: DUMMY_SPAN }],
        interpreter: null,
        span: DUMMY_SPAN,
    })
    return r.code.replace(/;\s*$/, "").trim()
}

function resolveTokenExpr(expr: Expression, known: Set<string>, bindings: CreateTokenBinding[]): string | null {
    if (expr.type === "Identifier") {
        if (expr.value === "font" && known.has("font")) return "var(--m-font)"
        if (expr.value === "fadeIn") return "fadeIn"
    }

    if (expr.type === "MemberExpression" && expr.object.type === "Identifier") {
        const objName = expr.object.value
        const propNode = expr.property as unknown as { type: string; value?: string; expression?: Expression }

        let propName: string | null = null
        if (propNode.type === "Identifier") propName = propNode.value ?? null
        if (propNode.type === "Computed") {
            const p = propNode.expression
            if (p?.type === "StringLiteral") propName = (p as { value: string }).value
            if (p?.type === "NumericLiteral") propName = String((p as { value: number }).value)
        }
        if (propName === null) return null

        if (propName === "value") {
            const b = bindings.find(b => b.varName === objName)
            if (b) return `var(--${b.tokenName})`
        }

        if (objName === "colors" && COLOR_VARS[propName]) return `var(${COLOR_VARS[propName]})`
        if (objName === "radii" && RADII_VARS[propName]) return `var(${RADII_VARS[propName]})`
        if (objName === "fontSizes" && FONT_SIZE_VARS[propName]) return `var(${FONT_SIZE_VARS[propName]})`
        if (objName === "space" && known.has("space")) return `var(--m-sp-${propName})`
    }

    return null
}

function resolveTemplate(tmpl: TemplateLiteral, known: Set<string>, bindings: CreateTokenBinding[]): string | null {
    let result = ""
    for (let i = 0; i < tmpl.quasis.length; i++) {
        result += tmpl.quasis[i].cooked ?? tmpl.quasis[i].raw
        if (i < tmpl.expressions.length) {
            const s = resolveTokenExpr(tmpl.expressions[i] as Expression, known, bindings)
            if (s === null) return null
            result += s
        }
    }
    return result
}

function cssValue(expr: Expression, known: Set<string>, bindings: CreateTokenBinding[]): string {
    const token = resolveTokenExpr(expr, known, bindings)
    if (token !== null) return token

    if (expr.type === "TemplateLiteral") {
        const resolved = resolveTemplate(expr as unknown as TemplateLiteral, known, bindings)
        if (resolved !== null) return resolved
    }

    if (expr.type === "StringLiteral") return (expr as { value: string }).value
    if (expr.type === "NumericLiteral") return String((expr as { value: number }).value)
    if (expr.type === "BooleanLiteral") return String((expr as { value: boolean }).value)
    return exprToSrc(expr)
}

function getKeyStr(prop: ObjectExpression["properties"][number]): string | null {
    if (prop.type !== "KeyValueProperty") return null
    const key = prop.key as unknown as { type: string; value?: string }
    if (key.type === "Identifier" || key.type === "StringLiteral") return key.value ?? null
    return null
}

function resolveComputedCssKey(prop: ObjectExpression["properties"][number], bindings: CreateTokenBinding[]): string | null {
    if (prop.type !== "KeyValueProperty") return null
    const key = prop.key as unknown as { type: string; expression?: Expression }
    if (key.type !== "Computed" || !key.expression) return null
    const expr = key.expression
    if (expr.type !== "MemberExpression" || expr.object.type !== "Identifier") return null
    const objName = expr.object.value
    const propNode = expr.property as unknown as { type: string; value?: string }
    if (propNode.type !== "Identifier" || propNode.value !== "variable") return null
    const b = bindings.find(b => b.varName === objName)
    return b ? `--${b.tokenName}` : null
}

// Serialize a flat set of properties to CSS lines (no nesting handled here)
function serializeFlatLines(
    props: ObjectExpression["properties"],
    known: Set<string>,
    bindings: CreateTokenBinding[],
    indent: string,
): string[] {
    const lines: string[] = []
    for (const prop of props) {
        if (prop.type !== "KeyValueProperty") continue
        const key = getKeyStr(prop) ?? resolveComputedCssKey(prop, bindings)
        if (key === null) continue
        const val = (prop as { value: Expression }).value
        lines.push(`${indent}${cssProperty(key)}: ${cssValue(val, known, bindings)};`)
    }
    return lines
}

// Generate CSS rule blocks for className, handling pseudo/media nesting
function generateCssBlocks(
    className: string,
    props: ObjectExpression["properties"],
    known: Set<string>,
    bindings: CreateTokenBinding[],
): string[] {
    const blocks: string[] = []
    const mainLines: string[] = []

    for (const prop of props) {
        if (prop.type !== "KeyValueProperty") continue
        const key = getKeyStr(prop)

        if (key === null) {
            const computedKey = resolveComputedCssKey(prop, bindings)
            if (computedKey) {
                const val = (prop as { value: Expression }).value
                mainLines.push(`    ${cssProperty(computedKey)}: ${cssValue(val, known, bindings)};`)
            }
            continue
        }

        if (VARIANT_KEYS.has(key)) continue

        const val = (prop as { value: Expression }).value

        if (key.startsWith("&") && val.type === "ObjectExpression") {
            const selector = key.slice(1)  // e.g. ":hover" or " em"
            const subLines = serializeFlatLines((val as ObjectExpression).properties, known, bindings, "    ")
            if (subLines.length > 0) {
                blocks.push(`.${className}${selector} {\n${subLines.join("\n")}\n}`)
            }
            continue
        }

        if (key.startsWith("@media") && val.type === "ObjectExpression") {
            const subLines = serializeFlatLines((val as ObjectExpression).properties, known, bindings, "        ")
            if (subLines.length > 0) {
                blocks.push(`${key} {\n    .${className} {\n${subLines.join("\n")}\n    }\n}`)
            }
            continue
        }

        mainLines.push(`    ${cssProperty(key)}: ${cssValue(val, known, bindings)};`)
    }

    if (mainLines.length > 0) {
        blocks.unshift(`.${className} {\n${mainLines.join("\n")}\n}`)
    }
    return blocks
}

function hasVariantsNode(config: ObjectExpression): boolean {
    return config.properties.some(p => getKeyStr(p) === "variants")
}

// For variant components: base class + one class per variant value
function generateVariantCssBlocks(
    config: ObjectExpression,
    known: Set<string>,
    bindings: CreateTokenBinding[],
): string[] {
    const baseProps = config.properties.filter(p => {
        const k = getKeyStr(p)
        return k === null || !VARIANT_KEYS.has(k)
    })
    const blocks = generateCssBlocks("base", baseProps, known, bindings)

    for (const prop of config.properties) {
        if (getKeyStr(prop) !== "variants" || prop.type !== "KeyValueProperty") continue
        const variantsObj = prop.value as ObjectExpression
        for (const vp of variantsObj.properties) {
            if (vp.type !== "KeyValueProperty") continue
            const variantName = getKeyStr(vp)
            if (!variantName) continue
            for (const vvp of (vp.value as ObjectExpression).properties) {
                if (vvp.type !== "KeyValueProperty") continue
                const valueName = getKeyStr(vvp)
                if (!valueName) continue
                blocks.push(...generateCssBlocks(`${variantName}_${valueName}`, (vvp.value as ObjectExpression).properties, known, bindings))
            }
        }
    }

    return blocks
}

interface VariantParam {
    name: string
    values: string[]
    isBoolean: boolean
    defaultValue: string | null
}

function extractVariantParams(config: ObjectExpression): VariantParam[] {
    const params: VariantParam[] = []
    const defaults: Record<string, string> = {}

    for (const prop of config.properties) {
        if (prop.type !== "KeyValueProperty") continue
        const key = getKeyStr(prop) ?? ""

        if (key === "variants") {
            for (const vp of (prop.value as ObjectExpression).properties) {
                if (vp.type !== "KeyValueProperty") continue
                const vName = getKeyStr(vp) ?? ""
                if (!vName) continue
                const values = (vp.value as ObjectExpression).properties.flatMap(vvp => {
                    const k = getKeyStr(vvp)
                    return k ? [k] : []
                })
                params.push({ name: vName, values, isBoolean: values.length === 2 && values.includes("true") && values.includes("false"), defaultValue: null })
            }
        } else if (key === "defaultVariants") {
            for (const dp of (prop.value as ObjectExpression).properties) {
                if (dp.type !== "KeyValueProperty") continue
                const dKey = getKeyStr(dp) ?? ""
                const dVal = dp.value as Expression
                if (dVal.type === "StringLiteral") defaults[dKey] = (dVal as { value: string }).value
                else if (dVal.type === "BooleanLiteral") defaults[dKey] = String((dVal as { value: boolean }).value)
                else if (dVal.type === "NumericLiteral") defaults[dKey] = String((dVal as { value: number }).value)
            }
        }
    }

    for (const p of params) p.defaultValue = defaults[p.name] ?? null
    return params
}

export function generateCssModulesFiles(
    parsed: ParsedFile,
    baseName: string,
    isStyledSource: boolean,
): { css: string; tsx: string; cssFileName: string; tsxFileName: string } {
    const { tokenImports, createTokenBindings: bindings, styledCalls, cssCalls } = parsed
    const known = new Set(tokenImports)
    if (parsed.hasFadeInImport) known.add("fadeIn")

    const cssFileName = `${baseName}.module.css`
    const tsxFileName = isStyledSource ? `${baseName}.styled.tsx` : `${baseName}.tsx`

    const cssBlocks: string[] = [CSS_HEADER]
    const tsxLines: string[] = [TS_HEADER, ""]

    const cssVarRefs = new Set(styledCalls.filter(c => c.cssVarRef).map(c => c.cssVarRef!))
    const cssCallMap = new Map(cssCalls.map(c => [c.varName, c]))

    const hasHeadingPattern = styledCalls.some(c => c.cssVarRef)
    if (hasHeadingPattern) tsxLines.push(`import { createElement, type HTMLProps } from "react"`)
    tsxLines.push(`import React from "react"`)
    tsxLines.push(`import styles from "./${cssFileName}"`)
    tsxLines.push("")

    // Any css() calls not used as cssVarRef → standalone CSS class
    for (const cssCall of cssCalls) {
        if (cssVarRefs.has(cssCall.varName)) continue
        const cssClass = cssCall.varName.charAt(0).toLowerCase() + cssCall.varName.slice(1)
        cssBlocks.push(`/* ${cssCall.varName} */`)
        if (hasVariantsNode(cssCall.config)) {
            cssBlocks.push(...generateVariantCssBlocks(cssCall.config, known, bindings))
        } else {
            cssBlocks.push(...generateCssBlocks(cssClass, cssCall.config.properties, known, bindings))
        }
    }

    for (const call of styledCalls) {
        const prefix = call.isExported ? "export " : ""
        const el = call.isComponent ? "div" : call.element

        if (call.cssVarRef) {
            // Heading pattern: use the css() call's config as the variant config
            const cssCall = cssCallMap.get(call.cssVarRef)
            if (!cssCall) continue
            const config = cssCall.config
            const variantParams = extractVariantParams(config)

            cssBlocks.push(`/* ${call.exportName} */`)
            cssBlocks.push(...generateVariantCssBlocks(config, known, bindings))

            const defaultParts = variantParams
                .filter(v => v.defaultValue !== null)
                .map(v => `${v.name} = ${JSON.stringify(v.defaultValue)}`)
            const classExprParts = [
                "styles.base",
                ...variantParams.map(v => `styles[\`${v.name}_\${${v.name}}\`]`),
                "className",
            ]

            tsxLines.push(`type ${call.exportName}Props = {`)
            tsxLines.push(`    as?: "h1" | "h2" | "h3" | "h4"`)
            for (const v of variantParams) {
                tsxLines.push(`    ${v.name}?: ${v.values.map(val => JSON.stringify(val)).join(" | ")}`)
            }
            tsxLines.push(`} & HTMLProps<HTMLHeadingElement>`)
            tsxLines.push("")
            const destructure = ["as: tag = \"h2\"", ...defaultParts, "className", "...props"].join(", ")
            tsxLines.push(`${prefix}const ${call.exportName} = ({ ${destructure} }: ${call.exportName}Props) =>`)
            tsxLines.push(`    createElement(tag, {`)
            tsxLines.push(`        className: [${classExprParts.join(", ")}].filter(Boolean).join(" "),`)
            tsxLines.push(`        ...props`)
            tsxLines.push(`    })`)
        } else if (call.config && hasVariantsNode(call.config)) {
            const variantParams = extractVariantParams(call.config)

            cssBlocks.push(`/* ${call.exportName} */`)
            cssBlocks.push(...generateVariantCssBlocks(call.config, known, bindings))

            const variantTypeLines = variantParams.map(v =>
                v.isBoolean
                    ? `    ${v.name}?: boolean`
                    : `    ${v.name}?: ${v.values.map(val => JSON.stringify(val)).join(" | ")}`
            )
            const destructureParts = variantParams.map(v =>
                !v.isBoolean && v.defaultValue !== null ? `${v.name} = ${JSON.stringify(v.defaultValue)}` : v.name
            )
            const classExprParts = [
                "styles.base",
                ...variantParams.map(v =>
                    v.isBoolean
                        ? `styles[\`${v.name}_\${${v.name} ? "true" : "false"}\`]`
                        : `styles[\`${v.name}_\${${v.name}}\`]`
                ),
                "className",
            ]

            tsxLines.push(`${prefix}const ${call.exportName} = ({`)
            tsxLines.push(`    ${[...destructureParts, "className", "children", "...p"].join(", ")}`)
            tsxLines.push(`}: {`)
            tsxLines.push(...variantTypeLines.map(l => `${l},`))
            tsxLines.push(`} & React.ComponentPropsWithoutRef<"${el}">) =>`)
            tsxLines.push(`    <${el} {...p} className={[${classExprParts.join(", ")}].filter(Boolean).join(" ")}>{children}</${el}>`)
        } else {
            const cssClass = call.exportName.charAt(0).toLowerCase() + call.exportName.slice(1)
            if (call.config) {
                cssBlocks.push(`/* ${call.exportName} */`)
                cssBlocks.push(...generateCssBlocks(cssClass, call.config.properties, known, bindings))
            }
            const classExpr = call.config
                ? `[styles.${cssClass}, className].filter(Boolean).join(" ")`
                : `className ?? ""`
            tsxLines.push(`${prefix}const ${call.exportName} = ({ className, children, ...p }: React.ComponentPropsWithoutRef<"${el}">) =>`)
            tsxLines.push(`    <${el} {...p} className={${classExpr}}>{children}</${el}>`)
        }
    }

    return {
        css: cssBlocks.join("\n\n") + "\n",
        tsx: tsxLines.join("\n") + "\n",
        cssFileName,
        tsxFileName,
    }
}

export const CSS_MODULES_GLOBAL_CSS = `/* @generated */
:root {
    --m-bg: #131110;
    --m-text: #e8e0cc;
    --m-gold: #c9a84c;
    --m-dim: #6b5e3a;
    --m-surface: #1e1b18;
    --m-border: #2a2520;
    --m-bg-glass: #131110ee;
    --m-bg-muted: #13111080;
    --m-gold-subtle: #c9a84c20;
    --m-gold-faint: #c9a84c40;
    --m-sp-1: 4px;
    --m-sp-2: 8px;
    --m-sp-3: 16px;
    --m-sp-4: 24px;
    --m-sp-5: 32px;
    --m-sp-6: 48px;
    --m-sp-7: 64px;
    --m-sp-8: 96px;
    --m-r-sm: 4px;
    --m-r-md: 8px;
    --m-r-lg: 16px;
    --m-fs-xs: 12px;
    --m-fs-sm: 14px;
    --m-fs-base: 16px;
    --m-fs-lg: 20px;
    --m-fs-xl: 24px;
    --m-fs-2xl: 36px;
    --m-fs-3xl: 64px;
    --m-font: 'IBM Plex Mono', 'Courier New', monospace;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-16px); }
    to { opacity: 1; transform: translateY(0); }
}

*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    scroll-behavior: smooth;
}

body {
    background-color: var(--m-bg);
    color: var(--m-text);
    font-family: var(--m-font);
    line-height: 1.6;
    min-height: 100vh;
}

a {
    color: inherit;
    text-decoration: none;
}

a:hover {
    opacity: 0.8;
}

pre, code {
    font-family: var(--m-font);
}
`

export const CSS_MODULES_GLOBAL_TS = `// @generated
import "./global.css"
export const fadeIn = "fadeIn"
`
