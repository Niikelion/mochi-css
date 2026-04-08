import type { StyleGenerator } from "@mochi-css/plugins"
import type { OnDiagnostic } from "@mochi-css/builder"
import { getErrorMessage } from "@mochi-css/builder"
import { KeyframesObject, KeyframeStops } from "../index"

export class VanillaKeyframesGenerator implements StyleGenerator {
    private readonly collectedStyles: { source: string; stops: KeyframeStops }[] = []

    constructor(private readonly onDiagnostic?: OnDiagnostic) {}

    collectArgs(source: string, args: unknown[]): void {
        if (args.length === 0 || args[0] == null || typeof args[0] !== "object") {
            this.onDiagnostic?.({
                code: "MOCHI_INVALID_STYLE_ARG",
                message: `Expected keyframe stops object, got ${args[0] === null ? "null" : typeof args[0]}`,
                severity: "warning",
                file: source,
            })
            return
        }
        this.collectedStyles.push({ source, stops: args[0] as KeyframeStops })
    }

    async generateStyles(): Promise<{ files: Record<string, string> }> {
        const filesCss = new Map<string, Set<string>>()
        for (const { source, stops } of this.collectedStyles) {
            let css = filesCss.get(source)
            if (!css) {
                css = new Set<string>()
                filesCss.set(source, css)
            }
            try {
                const obj = new KeyframesObject(stops)
                css.add(obj.asCssString())
            } catch (err) {
                const message = getErrorMessage(err)
                this.onDiagnostic?.({
                    code: "MOCHI_STYLE_GENERATION",
                    message: `Failed to generate keyframes CSS: ${message}`,
                    severity: "warning",
                    file: source,
                })
            }
        }
        const files: Record<string, string> = {}
        for (const [source, css] of filesCss) {
            const sortedCss = [...css.values()].sort()
            files[source] = sortedCss.join("\n\n")
        }
        return { files }
    }
}
