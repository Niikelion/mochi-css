import { StyleGenerator } from "@/generators/StyleGenerator"
import { CSSObject, StyleProps } from "@mochi-css/vanilla"
import { OnDiagnostic } from "@/diagnostics"

export class VanillaCssGenerator implements StyleGenerator {
    private readonly collectedStyles: { source: string, args: StyleProps[] }[] = []

    constructor(private readonly onDiagnostic?: OnDiagnostic) {}

    collectArgs(source: string, args: unknown[]): void {
        const validArgs: StyleProps[] = []
        for (const arg of args) {
            if (arg == null || typeof arg !== 'object') {
                this.onDiagnostic?.({
                    code: 'MOCHI_INVALID_STYLE_ARG',
                    message: `Expected style object, got ${arg === null ? 'null' : typeof arg}`,
                    severity: 'warning',
                    file: source,
                })
                continue
            }
            validArgs.push(arg as StyleProps)
        }
        if (validArgs.length > 0) {
            this.collectedStyles.push({ source, args: validArgs })
        }
    }

    async generateStyles(): Promise<{ global: string }> {
        const css = new Set<string>()
        for (const { source, args } of this.collectedStyles) {
            for (const style of args) {
                try {
                    const styleCss = new CSSObject(style).asCssString()
                    css.add(styleCss)
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err)
                    this.onDiagnostic?.({
                        code: 'MOCHI_STYLE_GENERATION',
                        message: `Failed to generate CSS: ${message}`,
                        severity: 'warning',
                        file: source,
                    })
                }
            }
        }
        const sortedCss = [...css.values()].sort()
        return {
            global: sortedCss.join("\n\n"),
        }
    }
}
