import { printSync } from "@swc/core"
import type { ParsedFile, CssCall } from "../extract.ts"
import type { ObjectExpression } from "@swc/core"

const HEADER = "// @generated — do not edit; regenerated from mochi-vanilla-react by codegen/index.ts\n"
const DUMMY_SPAN = { start: 0, end: 0, ctxt: 0 }

function nodeToSrc(node: ObjectExpression): string {
    const result = printSync({
        type: "Module",
        body: [{ type: "ExpressionStatement", expression: node, span: DUMMY_SPAN }],
        interpreter: null,
        span: DUMMY_SPAN,
    })
    return result.code.replace(/;\s*$/, "").trim()
}

function resolveDepth(filePath: string): string {
    // filePath is relative to src/ — count directory components (excluding filename)
    const parts = filePath.split(/[/\\]/)
    const depth = parts.length - 1  // number of directories below src/
    if (depth <= 0) return "."
    return Array(depth).fill("..").join("/")
}

export function generateStitchesFile(parsed: ParsedFile, relPath: string): string {
    const { source, tokenImports, createTokenBindings, styledCalls, cssCalls } = parsed
    const dotdot = resolveDepth(relPath)
    const lines: string[] = [HEADER]

    const hasTokenImports = tokenImports.length > 0

    // Determine what stitches functions are needed
    const needsCss = cssCalls.length > 0 && !styledCalls.some(c => c.cssVarRef)
    const needsStyled = styledCalls.length > 0
    const stitchesFns: string[] = []
    if (needsStyled) stitchesFns.push("styled")
    if (needsCss) stitchesFns.push("css")

    if (stitchesFns.length > 0) {
        lines.push(`import { ${stitchesFns.join(", ")} } from "${dotdot}/stitches.config"`)
    }
    if (hasTokenImports) {
        lines.push(`import { ${tokenImports.join(", ")} } from "${dotdot}/tokens"`)
    }
    if (parsed.hasFadeInImport) {
        lines.push(`import { fadeIn } from "${dotdot}/global"`)
    }

    // For Heading pattern: need createElement, FC, HTMLProps
    const hasHeadingPattern = styledCalls.some(c => c.cssVarRef)
    if (hasHeadingPattern) {
        lines.push(`import { createElement, type FC, type HTMLProps } from "react"`)
    }

    lines.push("")

    // createToken bindings → plain objects
    for (const binding of createTokenBindings) {
        lines.push(`const ${binding.varName} = { value: "var(--${binding.tokenName})", variable: "--${binding.tokenName}" } as const`)
    }
    if (createTokenBindings.length > 0) lines.push("")

    // For css() calls (only if NOT used as a styled() argument — css()+styled pattern handled below)
    const cssVarRefs = new Set(styledCalls.filter(c => c.cssVarRef).map(c => c.cssVarRef!))
    for (const cssCall of cssCalls) {
        if (!cssVarRefs.has(cssCall.varName)) {
            lines.push(`const ${cssCall.varName} = css(${nodeToSrc(cssCall.config)})`)
        }
    }

    // Build a map from cssVarName → CssCall for inline merging
    const cssCallMap = new Map<string, CssCall>(cssCalls.map(c => [c.varName, c]))

    // Styled calls
    for (const call of styledCalls) {
        const prefix = call.isExported ? "export " : ""
        if (call.cssVarRef) {
            // Heading pattern: styled(HeadingCore, headingStyles)
            // Emit HeadingCore + Heading using inlined css config
            const cssCall = cssCallMap.get(call.cssVarRef)
            const configSrc = cssCall ? nodeToSrc(cssCall.config) : "{}"
            lines.push(`type HeadingProps = {`)
            lines.push(`    as?: "h1" | "h2" | "h3" | "h4"`)
            lines.push(`} & HTMLProps<HTMLHeadingElement>`)
            lines.push(``)
            lines.push(`const HeadingCore: FC<HeadingProps> = ({ as: tag = "h2", ...props }) => createElement(tag, props)`)
            lines.push(``)
            lines.push(`${prefix}const ${call.exportName} = styled(HeadingCore, ${configSrc})`)
        } else {
            const elementSrc = call.isComponent ? call.element : `"${call.element}"`
            const configSrc = call.config ? nodeToSrc(call.config) : "{}"
            lines.push(`${prefix}const ${call.exportName} = styled(${elementSrc}, ${configSrc})`)
        }
    }

    return lines.join("\n") + "\n"
}

export function generateStitchesGlobal(source: string): string {
    // Parse global.ts source to extract the globalCss argument and keyframes config
    // Since global.ts is static, we generate a static stitches version
    return `${HEADER}import { globalCss, keyframes } from "./stitches.config"
import { colors, font } from "./tokens"

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
        backgroundColor: colors.bg,
        color: colors.text,
        fontFamily: font,
        lineHeight: "1.6",
        minHeight: "100vh",
    },
    a: { color: "inherit", textDecoration: "none" },
    "a:hover": { opacity: "0.8" },
    "pre, code": { fontFamily: font },
})()

export const fadeIn = keyframes({
    from: { opacity: "0", transform: "translateY(-16px)" },
    to: { opacity: "1", transform: "translateY(0)" },
})
`
}

export const STITCHES_CONFIG = `import { createStitches } from "@stitches/react"

export const { styled, css, keyframes, globalCss, theme } = createStitches({})
`
