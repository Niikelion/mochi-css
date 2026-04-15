import { GlobalCssObject, GlobalCssStyles } from "@mochi-css/vanilla";
import { StyleGenerator } from "@mochi-css/plugins";
import { type OnDiagnostic, getErrorMessage } from "@mochi-css/core";
import { StitchesConfig } from "../../types";
import { preprocess } from "../../preprocess";

export class StitchesGlobalCssGenerator extends StyleGenerator {
    private readonly collectedStyles: {
        source: string;
        args: GlobalCssStyles[];
    }[] = [];

    constructor(
        private readonly config: StitchesConfig,
        private readonly onDiagnostic?: OnDiagnostic,
    ) {
        super();
    }

    override mockFunction(): unknown {
        // globalCss returns a function that applies global styles at runtime; no-op mock
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
    }

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
