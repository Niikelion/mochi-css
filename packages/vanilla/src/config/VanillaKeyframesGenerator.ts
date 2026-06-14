import type * as SWC from "@swc/core"
import { AstStyleGenerator, type CssAstChunk, parseCss } from "@mochi-css/plugins"
import { type OnDiagnostic, getErrorMessage } from "@mochi-css/core"
import { keyframes, KeyframesObject, KeyframeStops } from "../index"

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

export class VanillaKeyframesGenerator extends AstStyleGenerator {
    private readonly filesCss = new Map<string, Set<string>>()
    private currentSubstitution: SWC.Expression | null = null

    constructor(private readonly onDiagnostic?: OnDiagnostic) {
        super()
    }

    override mockFunction(...args: unknown[]): unknown {
        return (keyframes as (...args: unknown[]) => unknown)(...args)
    }

    collectArgs(source: string, args: unknown[]): void {
        if (args.length === 0 || args[0] == null || typeof args[0] !== "object") {
            this.onDiagnostic?.({
                code: "MOCHI_INVALID_STYLE_ARG",
                message: `Expected keyframe stops object, got ${args[0] === null ? "null" : typeof args[0]}`,
                severity: "warning",
                file: source,
            })
            this.currentSubstitution = null
            return
        }

        try {
            const obj = new KeyframesObject(args[0] as KeyframeStops)

            let css = this.filesCss.get(source)
            if (!css) {
                css = new Set<string>()
                this.filesCss.set(source, css)
            }
            css.add(obj.asCssString())

            this.currentSubstitution = {
                type: "StringLiteral",
                span: emptySpan,
                value: obj.name,
                raw: undefined,
            } as SWC.StringLiteral
        } catch (err) {
            const message = getErrorMessage(err)
            this.onDiagnostic?.({
                code: "MOCHI_STYLE_GENERATION",
                message: `Failed to generate keyframes CSS: ${message}`,
                severity: "warning",
                file: source,
            })
            this.currentSubstitution = null
        }
    }

    override extractSubstitution(): SWC.Expression | null {
        return this.currentSubstitution
    }

    override async generateCssAst(): Promise<{ files: Record<string, CssAstChunk> }> {
        const files: Record<string, CssAstChunk> = {}
        for (const [source, css] of this.filesCss) {
            const cssString = [...css.values()].sort().join("\n\n")
            files[source] = { originalCss: cssString, ast: parseCss(cssString) }
        }
        return { files }
    }
}
