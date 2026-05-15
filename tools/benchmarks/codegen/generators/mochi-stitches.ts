import { printSync } from "@swc/core"
import type { Expression, ObjectExpression, TemplateLiteral } from "@swc/core"
import type { ParsedFile } from "../extract.ts"

const HEADER = "// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts\n"
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

function resolveDepth(filePath: string): string {
    const parts = filePath.split(/[/\\]/)
    const depth = parts.length - 1
    if (depth <= 0) return "."
    return Array(depth).fill("..").join("/")
}

// Token namespaces that map to stitches theme ($namespace$key)
const NAMESPACED_TOKENS = new Set(["colors", "space", "fontSizes", "radii"])

function resolveTokenExpr(expr: Expression, known: Set<string>): string | null {
    // font → "$fonts$mono"
    if (expr.type === "Identifier" && expr.value === "font" && known.has("font"))
        return "$fonts$mono"

    // colors.gold, fontSizes.lg, radii.sm, space.x → "$colors$gold" etc.
    if (expr.type === "MemberExpression" && !expr.computed &&
        expr.object.type === "Identifier" && expr.property.type === "Identifier") {
        const obj = expr.object.value, prop = expr.property.value
        if (NAMESPACED_TOKENS.has(obj) && known.has(obj)) return `$${obj}$${prop}`
    }

    // space[3], fontSizes["2xl"] → "$space$3", "$fontSizes$2xl"
    // SWC signals computed access via a Computed wrapper node (not a boolean `computed` field at runtime)
    if (expr.type === "MemberExpression" && expr.object.type === "Identifier") {
        const rawProp = expr.property as unknown as { type: string; expression?: Expression }
        if (rawProp.type === "Computed") {
            const obj = expr.object.value
            if (NAMESPACED_TOKENS.has(obj) && known.has(obj)) {
                const p = rawProp.expression
                if (p && p.type === "NumericLiteral") return `$${obj}$${(p as { value: number }).value}`
                if (p && p.type === "StringLiteral") return `$${obj}$${(p as { value: string }).value}`
            }
        }
    }

    return null
}

// Attempt to resolve a template literal entirely to a stitches token string.
// Returns null if any expression cannot be resolved (keeps original template).
function resolveTemplate(tmpl: TemplateLiteral, known: Set<string>): string | null {
    let result = ""
    for (let i = 0; i < tmpl.quasis.length; i++) {
        result += tmpl.quasis[i].cooked ?? tmpl.quasis[i].raw
        if (i < tmpl.expressions.length) {
            const s = resolveTokenExpr(tmpl.expressions[i] as Expression, known)
            if (s === null) return null
            result += s
        }
    }
    return result
}

function transformExpr(expr: Expression, known: Set<string>): Expression {
    const s = resolveTokenExpr(expr, known)
    if (s !== null) return { type: "StringLiteral", value: s, span: DUMMY_SPAN, hasEscape: false }

    if (expr.type === "TemplateLiteral") {
        const s = resolveTemplate(expr as unknown as TemplateLiteral, known)
        if (s !== null) return { type: "StringLiteral", value: s, span: DUMMY_SPAN, hasEscape: false }
    }

    if (expr.type === "ObjectExpression") return transformConfig(expr, known)

    return expr
}

function transformConfig(node: ObjectExpression, known: Set<string>): ObjectExpression {
    return {
        ...node,
        properties: node.properties.map(p => {
            if (p.type !== "KeyValueProperty") return p
            return { ...p, value: transformExpr(p.value as Expression, known) }
        }),
    }
}

function nodeToSrc(node: ObjectExpression, tokenImports: string[]): string {
    const known = new Set(tokenImports)
    const result = printSync({
        type: "Module",
        body: [{ type: "ExpressionStatement", expression: transformConfig(node, known), span: DUMMY_SPAN }],
        interpreter: null,
        span: DUMMY_SPAN,
    })
    return result.code.replace(/;\s*$/, "").trim()
}

export function generateMochiStitchesFile(parsed: ParsedFile, relPath: string): string {
    const { tokenImports, createTokenBindings, styledCalls, cssCalls, hasFadeInImport } = parsed
    const dotdot = resolveDepth(relPath)
    const lines: string[] = [HEADER]

    const needsCss = cssCalls.length > 0 && !styledCalls.some(c => c.cssVarRef)
    const needsStyled = styledCalls.length > 0
    const stitchesFns: string[] = []
    if (needsStyled) stitchesFns.push("styled")
    if (needsCss) stitchesFns.push("css")

    if (stitchesFns.length > 0)
        lines.push(`import { ${stitchesFns.join(", ")} } from "${dotdot}/stitches.config"`)
    if (hasFadeInImport)
        lines.push(`import { fadeIn } from "${dotdot}/global"`)

    const hasHeadingPattern = styledCalls.some(c => c.cssVarRef)
    if (hasHeadingPattern)
        lines.push(`import { createElement, type FC, type HTMLProps } from "react"`)

    lines.push("")

    // createToken → plain object (CSS custom property, works with stitches)
    for (const b of createTokenBindings)
        lines.push(`const ${b.varName} = { value: "var(--${b.tokenName})", variable: "--${b.tokenName}" } as const`)
    if (createTokenBindings.length > 0) lines.push("")

    const cssVarRefs = new Set(styledCalls.filter(c => c.cssVarRef).map(c => c.cssVarRef!))
    for (const cssCall of cssCalls) {
        if (!cssVarRefs.has(cssCall.varName))
            lines.push(`const ${cssCall.varName} = css(${nodeToSrc(cssCall.config, tokenImports)})`)
    }

    const cssCallMap = new Map(cssCalls.map(c => [c.varName, c]))

    for (const call of styledCalls) {
        const prefix = call.isExported ? "export " : ""
        if (call.cssVarRef) {
            const cssCall = cssCallMap.get(call.cssVarRef)
            const configSrc = cssCall ? nodeToSrc(cssCall.config, tokenImports) : "{}"
            lines.push(`type HeadingProps = {`)
            lines.push(`    as?: "h1" | "h2" | "h3" | "h4"`)
            lines.push(`} & HTMLProps<HTMLHeadingElement>`)
            lines.push(``)
            lines.push(`const HeadingCore: FC<HeadingProps> = ({ as: tag = "h2", ...props }) => createElement(tag, props)`)
            lines.push(``)
            lines.push(`${prefix}const ${call.exportName} = styled(HeadingCore, ${configSrc})`)
        } else {
            const elementSrc = call.isComponent ? call.element : `"${call.element}"`
            const configSrc = call.config ? nodeToSrc(call.config, tokenImports) : "{}"
            lines.push(`${prefix}const ${call.exportName} = styled(${elementSrc}, ${configSrc})`)
        }
    }

    return lines.join("\n") + "\n"
}

export function generateMochiStitchesGlobal(): string {
    return `${HEADER}import { globalCss, keyframes } from "./stitches.config"

globalCss({
    ":root": {
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
    },
    "*, *::before, *::after": { boxSizing: "border-box", margin: "0", padding: "0" },
    html: { scrollBehavior: "smooth" },
    body: {
        backgroundColor: "$colors$bg",
        color: "$colors$text",
        fontFamily: "$fonts$mono",
        lineHeight: "1.6",
        minHeight: "100vh",
    },
    a: { color: "inherit", textDecoration: "none" },
    "a:hover": { opacity: "0.8" },
    "pre, code": { fontFamily: "$fonts$mono" },
})()

export const fadeIn = keyframes({
    from: { opacity: "0", transform: "translateY(-16px)" },
    to: { opacity: "1", transform: "translateY(0)" },
})
`
}

export const MOCHI_STITCHES_CONFIG = `import { createStitches } from "@mochi-css/stitches"

export const { styled, css, keyframes, globalCss, theme } = createStitches({
    theme: {
        colors: {
            bg: "#131110", text: "#e8e0cc", gold: "#c9a84c", dim: "#6b5e3a",
            surface: "#1e1b18", border: "#2a2520",
            bgGlass: "#131110ee", bgMuted: "#13111080",
            goldSubtle: "#c9a84c20", goldFaint: "#c9a84c40",
        },
        space: { 1: "4px", 2: "8px", 3: "16px", 4: "24px", 5: "32px", 6: "48px", 7: "64px", 8: "96px" },
        radii: { sm: "4px", md: "8px", lg: "16px" },
        fontSizes: { xs: "12px", sm: "14px", base: "16px", lg: "20px", xl: "24px", "2xl": "36px", "3xl": "64px" },
        fonts: { mono: "'IBM Plex Mono', 'Courier New', monospace" },
    },
})
`
