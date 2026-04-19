import type * as SWC from "@swc/core"
import { StyleGenerator } from "@mochi-css/plugins"
import { type OnDiagnostic, getErrorMessage } from "@mochi-css/core"
import { keyframes, KeyframesObject, KeyframeStops } from "../index"

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

export class VanillaKeyframesGenerator extends StyleGenerator {
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

    async generateStyles(): Promise<{ files: Record<string, string> }> {
        const files: Record<string, string> = {}
        for (const [source, css] of this.filesCss) {
            const sortedCss = [...css.values()].sort()
            files[source] = sortedCss.join("\n\n")
        }
        return { files }
    }
}
