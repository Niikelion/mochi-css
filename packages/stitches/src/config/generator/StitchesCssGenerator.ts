import {
    CSSObject,
    StyleProps,
    isMochiCSS,
    css,
    MochiCSS,
} from "@mochi-css/vanilla";
import { StyleGenerator } from "@mochi-css/plugins";
import { type OnDiagnostic, getErrorMessage } from "@mochi-css/core";
import { StitchesConfig } from "../../types";
import { preprocess } from "../../preprocess";

export class StitchesCssGenerator extends StyleGenerator {
    private readonly collectedStyles: { source: string; args: StyleProps[] }[] =
        [];

    constructor(
        private readonly config: StitchesConfig,
        private readonly onDiagnostic?: OnDiagnostic,
    ) {
        super();
    }

    override mockFunction(...args: unknown[]): unknown {
        const preprocessed = args.map((arg) => {
            if (arg instanceof MochiCSS) return arg;
            if (arg == null || typeof arg !== "object") return arg;
            return preprocess(
                arg as Record<string, unknown>,
                this.config,
            ) as StyleProps;
        });
        return (css as (...a: unknown[]) => unknown)(...preprocessed);
    }

    collectArgs(source: string, args: unknown[]): void {
        const validArgs: StyleProps[] = [];
        for (const arg of args) {
            if (arg == null || typeof arg !== "object") {
                this.onDiagnostic?.({
                    code: "MOCHI_INVALID_STYLE_ARG",
                    message: `Expected style object, got ${arg === null ? "null" : typeof arg}`,
                    severity: "warning",
                    file: source,
                });
                continue;
            }
            if (isMochiCSS(arg)) continue;
            const preprocessed = preprocess(
                arg as Record<string, unknown>,
                this.config,
            );
            validArgs.push(preprocessed as StyleProps);
        }
        if (validArgs.length > 0) {
            this.collectedStyles.push({ source, args: validArgs });
        }
    }

    async generateStyles(): Promise<{ files: Record<string, string> }> {
        const filesCss = new Map<string, Set<string>>();
        for (const { source, args } of this.collectedStyles) {
            let css = filesCss.get(source);
            if (!css) {
                css = new Set<string>();
                filesCss.set(source, css);
            }
            for (const style of args) {
                try {
                    const styleCss = new CSSObject(style).asCssString();
                    css.add(styleCss);
                } catch (err) {
                    const message = getErrorMessage(err);
                    this.onDiagnostic?.({
                        code: "MOCHI_STYLE_GENERATION",
                        message: `Failed to generate CSS: ${message}`,
                        severity: "warning",
                        file: source,
                    });
                }
            }
        }
        const files: Record<string, string> = {};
        for (const [source, css] of filesCss) {
            const sortedCss = [...css.values()].sort();
            files[source] = sortedCss.join("\n\n");
        }
        return { files };
    }
}
