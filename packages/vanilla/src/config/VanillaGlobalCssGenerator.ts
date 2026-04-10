import { StyleGenerator } from "@mochi-css/plugins"
import type { OnDiagnostic } from "@mochi-css/builder"
import { getErrorMessage } from "@mochi-css/builder"
import { globalCss, GlobalCssObject, GlobalCssStyles } from "../index"

export class VanillaGlobalCssGenerator extends StyleGenerator {
    private readonly collectedStyles: { source: string; styles: GlobalCssStyles }[] = []

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
            return
        }
        this.collectedStyles.push({ source, styles: args[0] as GlobalCssStyles })
    }

    async generateStyles(): Promise<{ global: string }> {
        const allCss = new Set<string>()
        for (const { source, styles } of this.collectedStyles) {
            try {
                const obj = new GlobalCssObject(styles)
                allCss.add(obj.asCssString())
            } catch (err) {
                const message = getErrorMessage(err)
                this.onDiagnostic?.({
                    code: "MOCHI_STYLE_GENERATION",
                    message: `Failed to generate global CSS: ${message}`,
                    severity: "warning",
                    file: source,
                })
            }
        }
        const sortedCss = [...allCss].sort()
        return { global: sortedCss.join("\n\n") }
    }
}
