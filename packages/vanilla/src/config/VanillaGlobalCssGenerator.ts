import type * as SWC from "@swc/core"
import { StyleGenerator } from "@mochi-css/plugins"
import { type OnDiagnostic, getErrorMessage } from "@mochi-css/core"
import { globalCss, GlobalCssObject, GlobalCssStyles } from "../index"

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

const voidZero: SWC.UnaryExpression = {
    type: "UnaryExpression",
    span: emptySpan,
    operator: "void",
    argument: { type: "NumericLiteral", span: emptySpan, value: 0, raw: "0" },
}

export class VanillaGlobalCssGenerator extends StyleGenerator {
    private readonly allCss = new Set<string>()
    private currentSubstitution: SWC.Expression | null = null

    constructor(private readonly onDiagnostic?: OnDiagnostic) {
        super()
    }

    override mockFunction(...args: unknown[]): unknown {
        return (globalCss as (...args: unknown[]) => unknown)(...args)
    }

    collectArgs(source: string, args: unknown[]): void {
        if (args.length === 0 || args[0] == null || typeof args[0] !== "object") {
            this.onDiagnostic?.({
                code: "MOCHI_INVALID_STYLE_ARG",
                message: `Expected global CSS styles object, got ${args[0] === null ? "null" : typeof args[0]}`,
                severity: "warning",
                file: source,
            })
            this.currentSubstitution = null
            return
        }

        try {
            const obj = new GlobalCssObject(args[0] as GlobalCssStyles)
            this.allCss.add(obj.asCssString())
            this.currentSubstitution = voidZero
        } catch (err) {
            const message = getErrorMessage(err)
            this.onDiagnostic?.({
                code: "MOCHI_STYLE_GENERATION",
                message: `Failed to generate global CSS: ${message}`,
                severity: "warning",
                file: source,
            })
            this.currentSubstitution = null
        }
    }

    override extractSubstitution(): SWC.Expression | null {
        return this.currentSubstitution
    }

    async generateStyles(): Promise<{ global: string }> {
        const sortedCss = [...this.allCss].sort()
        return { global: sortedCss.join("\n\n") }
    }
}
