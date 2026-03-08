import { StyleGenerator } from "@mochi-css/builder";
import { OnDiagnostic } from "@mochi-css/builder";
import { StitchesConfig, StitchesTheme } from "@mochi-css/stitches";
import { buildThemeClassName } from "@mochi-css/stitches";

export class StitchesCreateThemeGenerator implements StyleGenerator {
    private readonly collectedThemes: {
        source: string;
        tokens: StitchesTheme;
    }[] = [];

    constructor(
        private readonly config: StitchesConfig,
        private readonly onDiagnostic?: OnDiagnostic,
    ) {}

    collectArgs(source: string, args: unknown[]): void {
        const tokens = args[0];
        if (
            tokens == null ||
            typeof tokens !== "object" ||
            Array.isArray(tokens)
        ) {
            this.onDiagnostic?.({
                code: "MOCHI_INVALID_CREATE_THEME_ARG",
                message: `Expected theme tokens object, got ${tokens === null ? "null" : typeof tokens}`,
                severity: "warning",
                file: source,
            });
            return;
        }
        this.collectedThemes.push({ source, tokens: tokens as StitchesTheme });
    }

    async generateStyles(): Promise<{ global?: string }> {
        const prefix = this.config.prefix ? `${this.config.prefix}-` : "";
        const css = new Set<string>();

        for (const { tokens } of this.collectedThemes) {
            const className = buildThemeClassName(tokens);
            const declarations: string[] = [];

            for (const [scale, vals] of Object.entries(tokens).sort(
                ([a], [b]) => a.localeCompare(b),
            )) {
                for (const [token, value] of Object.entries(vals).sort(
                    ([a], [b]) => a.localeCompare(b),
                )) {
                    declarations.push(
                        `    --${prefix}${scale}-${token}: ${value};`,
                    );
                }
            }

            if (declarations.length > 0) {
                css.add(`.${className} {\n${declarations.join("\n")}\n}`);
            }
        }

        if (css.size === 0) return {};
        return { global: [...css.values()].sort().join("\n\n") };
    }
}
