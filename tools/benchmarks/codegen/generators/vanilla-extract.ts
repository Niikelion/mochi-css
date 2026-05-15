import { printSync } from "@swc/core"
import type { Expression, ObjectExpression, KeyValueProperty } from "@swc/core"
import type { ParsedFile, CreateTokenBinding, LocalCssVar } from "../extract.ts"

const DUMMY_SPAN = { start: 0, end: 0, ctxt: 0 }

function exprToSrc(expr: Expression): string {
    const result = printSync({
        type: "Module",
        body: [{ type: "ExpressionStatement", expression: expr, span: DUMMY_SPAN }],
        interpreter: null,
        span: DUMMY_SPAN,
    })
    return result.code.replace(/;\s*$/, "").trim()
}

const HEADER = "// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts\n"

const ELEMENT_TYPES: Record<string, [string, string]> = {
    button: ["button", "React.ButtonHTMLAttributes<HTMLButtonElement>"],
    div: ["div", "React.HTMLAttributes<HTMLDivElement>"],
    span: ["span", "React.HTMLAttributes<HTMLSpanElement>"],
    section: ["section", "React.HTMLAttributes<HTMLElement>"],
    nav: ["nav", "React.HTMLAttributes<HTMLElement>"],
    footer: ["footer", "React.HTMLAttributes<HTMLElement>"],
    h1: ["h1", "React.HTMLAttributes<HTMLHeadingElement>"],
    h2: ["h2", "React.HTMLAttributes<HTMLHeadingElement>"],
    h3: ["h3", "React.HTMLAttributes<HTMLHeadingElement>"],
    h4: ["h4", "React.HTMLAttributes<HTMLHeadingElement>"],
    p: ["p", "React.HTMLAttributes<HTMLParagraphElement>"],
    pre: ["pre", "React.HTMLAttributes<HTMLPreElement>"],
    select: ["select", "React.SelectHTMLAttributes<HTMLSelectElement>"],
    a: ["a", "React.AnchorHTMLAttributes<HTMLAnchorElement>"],
}

interface GlobalSelector {
    relativeSelector: string
    bodyNode: ObjectExpression
}

interface PrintCtx {
    createTokenBindings: CreateTokenBinding[]
    localCssVars: LocalCssVar[]
    depth: number
    globalSelectors: GlobalSelector[]
}

function ind(n: number): string {
    return "    ".repeat(n)
}

function getKeyStr(key: KeyValueProperty["key"]): string | null {
    if (key.type === "Identifier") return key.value
    if (key.type === "StringLiteral") return key.value
    return null
}

function isTokenComputedKey(key: KeyValueProperty["key"], tokenVarNames: Set<string>): string | null {
    if (key.type !== "Computed") return null
    const expr = key.expression
    if (expr.type !== "MemberExpression") return null
    if (expr.object.type !== "Identifier") return null
    if (!tokenVarNames.has(expr.object.value)) return null
    if (expr.property.type !== "Identifier" || expr.property.value !== "variable") return null
    return expr.object.value
}

function printValue(val: Expression, ctx: PrintCtx): string {
    const tokenVarNames = new Set(ctx.createTokenBindings.map(b => b.varName))
    const localVarMap = new Map(ctx.localCssVars.map(v => [v.cssName, v.camelName]))

    // createToken binding: alignX.value → alignX
    if (val.type === "MemberExpression" &&
        val.object.type === "Identifier" &&
        tokenVarNames.has(val.object.value) &&
        val.property.type === "Identifier" &&
        val.property.value === "value") {
        return val.object.value
    }

    // var(--xxx) string or template → createVar identifier
    const checkVarRef = (s: string): string | null => {
        const m = s.match(/^var\(--([a-zA-Z-]+)\)$/)
        if (!m) return null
        return localVarMap.get(`--${m[1]}`) ?? null
    }
    if (val.type === "TemplateLiteral" && val.quasis.length === 1 && val.expressions.length === 0) {
        const r = checkVarRef(val.quasis[0].raw)
        if (r) return r
    }
    if (val.type === "StringLiteral") {
        const r = checkVarRef(val.value)
        if (r) return r
    }

    if (val.type === "ObjectExpression") {
        return printStyleObj(val, ctx)
    }

    return exprToSrc(val)
}

function printStyleObj(node: ObjectExpression, ctx: PrintCtx): string {
    const tokenVarNames = new Set(ctx.createTokenBindings.map(b => b.varName))
    const localVarMap = new Map(ctx.localCssVars.map(v => [v.cssName, v.camelName]))
    const i = ind(ctx.depth + 1)
    const ci = ind(ctx.depth)
    const parts: string[] = []
    const selectorParts: string[] = []
    const varParts: string[] = []

    for (const prop of node.properties) {
        if (prop.type !== "KeyValueProperty") continue
        const val = prop.value as Expression

        // createToken computed key: [alignX.variable]
        const tokenVar = isTokenComputedKey(prop.key, tokenVarNames)
        if (tokenVar) {
            varParts.push(`${ind(ctx.depth + 2)}[${tokenVar}]: ${printValue(val, ctx)}`)
            continue
        }

        const keyStr = getKeyStr(prop.key)
        if (keyStr === null) continue

        // local CSS var: "--btn-accent"
        if (keyStr.startsWith("--") && localVarMap.has(keyStr)) {
            varParts.push(`${ind(ctx.depth + 2)}[${localVarMap.get(keyStr)!}]: ${printValue(val, ctx)}`)
            continue
        }

        // Child element selector: "& em", "& span:first-child" → must use globalStyle
        if (keyStr.startsWith("& ")) {
            if (val.type === "ObjectExpression") {
                ctx.globalSelectors.push({ relativeSelector: keyStr.slice(2), bodyNode: val })
            }
            continue
        }

        // Pseudo/class selector on parent: "&:hover", "&.foo" → stays in selectors: {}
        if (keyStr.startsWith("&")) {
            const innerCtx = { ...ctx, depth: ctx.depth + 2 }
            const valSrc = val.type === "ObjectExpression" ? printStyleObj(val, innerCtx) : printValue(val, ctx)
            selectorParts.push(`${ind(ctx.depth + 2)}"${keyStr}": ${valSrc}`)
            continue
        }

        // @media query
        if (keyStr.startsWith("@")) {
            const innerCtx = { ...ctx, depth: ctx.depth + 1 }
            const valSrc = val.type === "ObjectExpression" ? printStyleObj(val, innerCtx) : printValue(val, ctx)
            parts.push(`${i}"${keyStr}": ${valSrc}`)
            continue
        }

        const keySrc = /^[a-zA-Z][a-zA-Z0-9]*$/.test(keyStr) ? keyStr : `"${keyStr}"`
        parts.push(`${i}${keySrc}: ${printValue(val, ctx)}`)
    }

    if (selectorParts.length > 0) {
        parts.push(`${i}selectors: {\n${selectorParts.join(",\n")},\n${i}}`)
    }
    if (varParts.length > 0) {
        parts.push(`${i}vars: {\n${varParts.join(",\n")},\n${i}}`)
    }

    if (parts.length === 0) return "{}"
    return `{\n${parts.join(",\n")},\n${ci}}`
}

interface ConfigSplit {
    base: ObjectExpression
    variants: ObjectExpression | null
    defaultVariants: ObjectExpression | null
    variantNames: string[]
    booleanVariants: Set<string>
}

function splitConfig(config: ObjectExpression): ConfigSplit {
    let variants: ObjectExpression | null = null
    let defaultVariants: ObjectExpression | null = null
    const baseProps: ObjectExpression["properties"] = []

    for (const prop of config.properties) {
        if (prop.type !== "KeyValueProperty") { baseProps.push(prop); continue }
        const k = getKeyStr(prop.key)
        if (k === "variants") variants = prop.value as ObjectExpression
        else if (k === "defaultVariants") defaultVariants = prop.value as ObjectExpression
        else baseProps.push(prop)
    }

    const variantNames: string[] = []
    const booleanVariants = new Set<string>()
    if (variants) {
        for (const prop of variants.properties) {
            if (prop.type !== "KeyValueProperty") continue
            const k = getKeyStr(prop.key)
            if (!k) continue
            variantNames.push(k)
            if (prop.value.type === "ObjectExpression") {
                const keys = prop.value.properties
                    .filter(p => p.type === "KeyValueProperty")
                    .map(p => getKeyStr((p as KeyValueProperty).key))
                    .filter(Boolean) as string[]
                if (keys.length > 0 && keys.every(k => k === "true" || k === "false")) {
                    booleanVariants.add(k)
                }
            }
        }
    }

    const baseNode: ObjectExpression = { ...config, properties: baseProps }
    return { base: baseNode, variants, defaultVariants, variantNames, booleanVariants }
}

function printVariantsBlock(variants: ObjectExpression, ctx: PrintCtx, booleans: Set<string>): string {
    const lines: string[] = []
    for (const prop of variants.properties) {
        if (prop.type !== "KeyValueProperty") continue
        const k = getKeyStr(prop.key)
        if (!k) continue
        const keySrc = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`
        const valNode = prop.value as ObjectExpression
        // Each key → object of variant values
        const subParts: string[] = []
        for (const subProp of valNode.properties) {
            if (subProp.type !== "KeyValueProperty") continue
            const sk = getKeyStr(subProp.key)
            if (!sk) continue
            const skSrc = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(sk) ? sk : `"${sk}"`
            const svCtx = { ...ctx, depth: ctx.depth + 3 }
            const svSrc = subProp.value.type === "ObjectExpression"
                ? printStyleObj(subProp.value as ObjectExpression, svCtx)
                : printValue(subProp.value as Expression, ctx)
            subParts.push(`${ind(ctx.depth + 3)}${skSrc}: ${svSrc}`)
        }
        lines.push(`${ind(ctx.depth + 2)}${keySrc}: {\n${subParts.join(",\n")},\n${ind(ctx.depth + 2)}}`)
    }
    return `{\n${lines.join(",\n")},\n${ind(ctx.depth + 1)}}`
}

function printDefaultVariants(dv: ObjectExpression, booleans: Set<string>): string {
    const parts: string[] = []
    for (const prop of dv.properties) {
        if (prop.type !== "KeyValueProperty") continue
        const k = getKeyStr(prop.key)
        if (!k) continue
        const keySrc = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`
        let valSrc = exprToSrc(prop.value as Expression)
        if (booleans.has(k) && (valSrc === "true" || valSrc === "false")) valSrc = `"${valSrc}"`
        parts.push(`${keySrc}: ${valSrc}`)
    }
    return `{ ${parts.join(", ")} }`
}

function hasChildSelectors(config: ObjectExpression): boolean {
    for (const prop of config.properties) {
        if (prop.type !== "KeyValueProperty") continue
        const k = getKeyStr(prop.key)
        if (k && k.startsWith("& ")) return true
        if (prop.value.type === "ObjectExpression" && hasChildSelectors(prop.value as ObjectExpression)) return true
    }
    return false
}

function lc(s: string): string {
    return s.charAt(0).toLowerCase() + s.slice(1)
}

export interface VEFilePair {
    cssTs: string
    styledTsx: string
    cssFileName: string
    styledFileName: string
}

/**
 * @param isSubdir - true when file lives in src/sections/ or src/components/ (token import needs "../")
 * @param isStyledSource - true when source file is a .styled.ts (output gets .styled.css.ts/.styled.tsx naming)
 */
export function generateVEFile(parsed: ParsedFile, isSubdir: boolean, isStyledSource: boolean, baseName: string): VEFilePair {
    const { tokenImports, createTokenBindings, localCssVars, styledCalls, cssCalls, hasFadeInImport } = parsed
    const dotdot = isSubdir ? ".." : "."

    const cssCallMap = new Map(cssCalls.map(c => [c.varName, c]))

    // Determine which VE CSS APIs are needed
    const hasCreateVar = createTokenBindings.length > 0 || localCssVars.length > 0
    let needsStyle = false
    let needsRecipe = false
    let needsGlobalStyle = false

    for (const call of styledCalls) {
        const config = call.config ?? cssCallMap.get(call.cssVarRef ?? "")?.config
        if (!config) continue
        const split = splitConfig(config)
        if (split.variants) needsRecipe = true
        else needsStyle = true
        if (hasChildSelectors(config)) needsGlobalStyle = true
    }

    // ---- CSS file ----
    const cssLines: string[] = [HEADER]

    // Imports for CSS file
    const cssApiParts: string[] = []
    if (needsStyle) cssApiParts.push("style")
    if (needsGlobalStyle) cssApiParts.push("globalStyle")
    if (hasCreateVar) cssApiParts.push("createVar")
    if (cssApiParts.length > 0) {
        cssLines.push(`import { ${cssApiParts.sort().join(", ")} } from "@vanilla-extract/css"`)
    }
    if (needsRecipe) {
        cssLines.push(`import { recipe } from "@vanilla-extract/recipes"`)
    }
    if (hasFadeInImport) {
        cssLines.push(`import { fadeIn } from "${dotdot}/global.css"`)
    }
    if (tokenImports.length > 0) {
        cssLines.push(`import { ${tokenImports.join(", ")} } from "${dotdot}/tokens"`)
    }
    cssLines.push("")

    // createVar declarations
    for (const b of createTokenBindings) {
        cssLines.push(`export const ${b.varName} = createVar()`)
    }
    for (const lv of localCssVars) {
        cssLines.push(`export const ${lv.camelName} = createVar()`)
    }
    if (hasCreateVar) cssLines.push("")

    // Style/recipe for each call
    for (const call of styledCalls) {
        const config = call.config ?? cssCallMap.get(call.cssVarRef ?? "")?.config
        if (!config) continue
        const split = splitConfig(config)
        const cssName = lc(call.exportName)
        const globalSelectors: GlobalSelector[] = []
        const ctx: PrintCtx = { createTokenBindings, localCssVars, depth: 1, globalSelectors }

        if (split.variants) {
            const baseCtx = { ...ctx, depth: 1 }
            const baseSrc = printStyleObj(split.base, baseCtx)
            const varCtx = { ...ctx, depth: 1 }
            const varsSrc = split.variants ? printVariantsBlock(split.variants, varCtx, split.booleanVariants) : "{}"
            const dvSrc = split.defaultVariants
                ? printDefaultVariants(split.defaultVariants, split.booleanVariants)
                : "{}"
            cssLines.push(`export const ${cssName} = recipe({`)
            cssLines.push(`    base: ${baseSrc},`)
            cssLines.push(`    variants: ${varsSrc},`)
            cssLines.push(`    defaultVariants: ${dvSrc},`)
            cssLines.push(`})`)
        } else {
            const baseCtx = { ...ctx, depth: 0 }
            const baseSrc = printStyleObj(config, baseCtx)
            cssLines.push(`export const ${cssName} = style(${baseSrc})`)
        }

        for (const gs of globalSelectors) {
            const gsCtx: PrintCtx = { createTokenBindings, localCssVars, depth: 0, globalSelectors: [] }
            const bodySrc = printStyleObj(gs.bodyNode, gsCtx)
            cssLines.push(`globalStyle(\`\${${cssName}} ${gs.relativeSelector}\`, ${bodySrc})`)
        }

        cssLines.push("")
    }

    // ---- Styled/wrapper file ----
    const styledLines: string[] = [HEADER, `import React from "react"`]

    const anyVariants = styledCalls.some(c => {
        const config = c.config ?? cssCallMap.get(c.cssVarRef ?? "")?.config
        if (!config) return false
        return splitConfig(config).variants !== null
    })
    if (anyVariants) {
        styledLines.push(`import type { RecipeVariants } from "@vanilla-extract/recipes"`)
    }

    const cssFileBase = isStyledSource ? `${baseName}.styled.css` : `${baseName}.css`
    const cssExports = styledCalls.map(c => lc(c.exportName)).join(", ")
    styledLines.push(`import { ${cssExports} } from "./${cssFileBase}"`)

    // Also import createVar results if needed (for Frame pattern — createVar is exported from css file)
    const tokenVarExports = createTokenBindings.map(b => b.varName)
    const localVarExports = localCssVars.map(v => v.camelName)
    const extraExports = [...tokenVarExports, ...localVarExports]
    if (extraExports.length > 0) {
        // Already imported above (add to same import statement)
        styledLines[styledLines.length - 1] = styledLines[styledLines.length - 1].replace(
            `import { ${cssExports} } from "./${cssFileBase}"`,
            `import { ${[...cssExports.split(", "), ...extraExports].join(", ")} } from "./${cssFileBase}"`
        )
    }

    styledLines.push("")

    // React wrapper for each call
    for (const call of styledCalls) {
        const config = call.config ?? cssCallMap.get(call.cssVarRef ?? "")?.config
        const cssName = lc(call.exportName)

        if (call.cssVarRef && config) {
            // Heading pattern: styled(Component, cssVar) — generate polymorphic wrapper
            const split = splitConfig(config)
            const { variantNames, booleanVariants } = split

            const extraProps: string[] = []
            const destructParts: string[] = []
            const callParts: string[] = []

            for (const vn of variantNames) {
                if (booleanVariants.has(vn)) {
                    extraProps.push(`${vn}?: boolean`)
                    callParts.push(`${vn}: ${vn} ? "true" : "false"`)
                } else {
                    extraProps.push(`${vn}?: NonNullable<RecipeVariants<typeof ${cssName}>["${vn}"]>`)
                    callParts.push(vn)
                }
                destructParts.push(vn)
            }

            const extraPropsStr = extraProps.length > 0 ? `, ${extraProps.join(", ")}` : ""
            const callArgsStr = callParts.join(", ")
            const destructStr = destructParts.length > 0 ? `${destructParts.join(", ")}, ` : ""

            styledLines.push(`type HeadingProps = {`)
            styledLines.push(`    as?: "h1" | "h2" | "h3" | "h4"`)
            styledLines.push(`} & React.HTMLAttributes<HTMLHeadingElement>${extraPropsStr.replace(/^, /, " & { ") + (extraProps.length > 0 ? " }" : "")}`)
            styledLines.push(``)
            styledLines.push(`export function ${call.exportName}({ as: tag = "h2", ${destructStr}className, ...props }: HeadingProps) {`)
            styledLines.push(`    return React.createElement(tag, {`)
            styledLines.push(`        ...props,`)
            styledLines.push(`        className: [${cssName}({ ${callArgsStr} }), className].filter(Boolean).join(" "),`)
            styledLines.push(`    })`)
            styledLines.push(`}`)
            styledLines.push("")
        } else if (config) {
            const split = splitConfig(config)
            const element = call.element
            const [tagName, propsType] = ELEMENT_TYPES[element] ?? [element, "React.HTMLAttributes<HTMLElement>"]

            if (split.variants) {
                const { variantNames, booleanVariants } = split
                const extraProps: string[] = []
                const destructParts: string[] = []
                const callParts: string[] = []

                for (const vn of variantNames) {
                    if (booleanVariants.has(vn)) {
                        extraProps.push(`${vn}?: boolean`)
                        callParts.push(`${vn}: ${vn} ? "true" : "false"`)
                    } else {
                        callParts.push(vn)
                    }
                    destructParts.push(vn)
                }

                const destructStr = destructParts.join(", ")
                const callArgsStr = callParts.join(", ")
                const variantType = `NonNullable<RecipeVariants<typeof ${cssName}>>`
                const extraType = extraProps.length > 0 ? ` & { ${extraProps.join("; ")} }` : ""
                const baseType = extraProps.length > 0 ? propsType : `${propsType} & ${variantType}`
                const fullType = `${baseType}${extraType}`

                styledLines.push(`export const ${call.exportName} = ({ ${destructStr ? `${destructStr}, ` : ""}className, ...props }: ${fullType}) => (`)
                styledLines.push(`    <${tagName}`)
                styledLines.push(`        {...props}`)
                styledLines.push(`        className={[${cssName}({ ${callArgsStr} }), className].filter(Boolean).join(" ")}`)
                styledLines.push(`    />`)
                styledLines.push(`)`)
            } else {
                styledLines.push(`export const ${call.exportName} = ({ className, ...props }: ${propsType}) => (`)
                styledLines.push(`    <${tagName} {...props} className={[${cssName}, className].filter(Boolean).join(" ")} />`)
                styledLines.push(`)`)
            }
            styledLines.push("")
        }
    }

    const cssFileName = isStyledSource ? `${baseName}.styled.css.ts` : `${baseName}.css.ts`
    const styledFileName = isStyledSource ? `${baseName}.styled.tsx` : `${baseName}.tsx`

    return {
        cssTs: cssLines.join("\n"),
        styledTsx: styledLines.join("\n"),
        cssFileName,
        styledFileName,
    }
}

export function generateVEGlobal(): string {
    return `${HEADER}import { globalStyle, keyframes } from "@vanilla-extract/css"
import { colors, font } from "./tokens"

globalStyle(":root", {
    "--m-bg": "#131110",
    "--m-text": "#e8e0cc",
    "--m-gold": "#c9a84c",
    "--m-dim": "#6b5e3a",
    "--m-surface": "#1e1b18",
    "--m-border": "#2a2520",
    "--m-bg-glass": "#131110ee",
    "--m-bg-muted": "#13111080",
    "--m-gold-subtle": "#c9a84c20",
    "--m-gold-faint": "#c9a84c40",
    "--m-sp-1": "4px",
    "--m-sp-2": "8px",
    "--m-sp-3": "16px",
    "--m-sp-4": "24px",
    "--m-sp-5": "32px",
    "--m-sp-6": "48px",
    "--m-sp-7": "64px",
    "--m-sp-8": "96px",
    "--m-r-sm": "4px",
    "--m-r-md": "8px",
    "--m-r-lg": "16px",
    "--m-fs-xs": "12px",
    "--m-fs-sm": "14px",
    "--m-fs-base": "16px",
    "--m-fs-lg": "20px",
    "--m-fs-xl": "24px",
    "--m-fs-2xl": "36px",
    "--m-fs-3xl": "64px",
    "--m-font": "'IBM Plex Mono', 'Courier New', monospace",
})
globalStyle("*, *::before, *::after", { boxSizing: "border-box", margin: "0", padding: "0" })
globalStyle("html", { scrollBehavior: "smooth" })
globalStyle("body", {
    backgroundColor: colors.bg,
    color: colors.text,
    fontFamily: font,
    lineHeight: "1.6",
    minHeight: "100vh",
})
globalStyle("a", { color: "inherit", textDecoration: "none" })
globalStyle("a:hover", { opacity: "0.8" })
globalStyle("pre, code", { fontFamily: font })

export const fadeIn = keyframes({
    from: { opacity: "0", transform: "translateY(-16px)" },
    to: { opacity: "1", transform: "translateY(0)" },
})
`
}
