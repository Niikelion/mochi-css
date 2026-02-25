import { StyleGenerator } from "@/generators/StyleGenerator"
import { GlobalCssObject, GlobalCssStyles } from "@mochi-css/vanilla"
import { OnDiagnostic, getErrorMessage } from "@/diagnostics"

export class VanillaGlobalCssGenerator implements StyleGenerator {
    private readonly collectedStyles: { source: string; args: GlobalCssStyles[] }[] = []

    constructor(private readonly onDiagnostic?: OnDiagnostic) {}

    collectArgs(source: string, args: unknown[]): void {
        const validArgs: GlobalCssStyles[] = []
        for (const arg of args) {
            if (arg == null || typeof arg !== "object") {
                this.onDiagnostic?.({
                    code: "MOCHI_INVALID_GLOBAL_CSS_ARG",
                    message: `Expected styles object, got ${arg === null ? "null" : typeof arg}`,
                    severity: "warning",
                    file: source,
                })
                continue
            }
            validArgs.push(arg as GlobalCssStyles)
        }
        if (validArgs.length > 0) {
            this.collectedStyles.push({ source, args: validArgs })
        }
    }

    async generateStyles(): Promise<{ global?: string }> {
        const css = new Set<string>()
        for (const { source, args } of this.collectedStyles) {
            for (const styles of args) {
                try {
                    css.add(new GlobalCssObject(styles).asCssString())
                } catch (err) {
                    const message = getErrorMessage(err)
                    this.onDiagnostic?.({
                        code: "MOCHI_GLOBAL_CSS_GENERATION",
                        message: `Failed to generate global CSS: ${message}`,
                        severity: "warning",
                        file: source,
                    })
                }
            }
        }
        if (css.size === 0) return {}
        return { global: [...css.values()].sort().join("\n\n") }
    }
}