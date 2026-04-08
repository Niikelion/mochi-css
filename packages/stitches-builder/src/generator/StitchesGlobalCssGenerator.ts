import { GlobalCssObject, GlobalCssStyles } from "@mochi-css/vanilla";
import type { StyleGenerator } from "@mochi-css/plugins";
import type { OnDiagnostic } from "@mochi-css/builder";
import { getErrorMessage } from "@mochi-css/builder";
import { StitchesConfig, preprocess } from "@mochi-css/stitches";

export class StitchesGlobalCssGenerator implements StyleGenerator {
    private readonly collectedStyles: {
        source: string;
        args: GlobalCssStyles[];
    }[] = [];

    constructor(
        private readonly config: StitchesConfig,
        private readonly onDiagnostic?: OnDiagnostic,
    ) {}

    collectArgs(source: string, args: unknown[]): void {
        const validArgs: GlobalCssStyles[] = [];
        for (const arg of args) {
            if (arg == null || typeof arg !== "object") {
                this.onDiagnostic?.({
                    code: "MOCHI_INVALID_GLOBAL_CSS_ARG",
                    message: `Expected styles object, got ${arg === null ? "null" : typeof arg}`,
                    severity: "warning",
                    file: source,
                });
                continue;
            }
            const preprocessed = preprocess(
                arg as Record<string, unknown>,
                this.config,
            );
            validArgs.push(preprocessed as GlobalCssStyles);
        }
        if (validArgs.length > 0) {
            this.collectedStyles.push({ source, args: validArgs });
        }
    }

    async generateStyles(): Promise<{ global?: string }> {
        const css = new Set<string>();
        for (const { source, args } of this.collectedStyles) {
            for (const styles of args) {
                try {
                    css.add(new GlobalCssObject(styles).asCssString());
                } catch (err) {
                    const message = getErrorMessage(err);
                    this.onDiagnostic?.({
                        code: "MOCHI_GLOBAL_CSS_GENERATION",
                        message: `Failed to generate global CSS: ${message}`,
                        severity: "warning",
                        file: source,
                    });
                }
            }
        }
        if (css.size === 0) return {};
        return { global: [...css.values()].sort().join("\n\n") };
    }
}
