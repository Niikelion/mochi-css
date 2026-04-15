import { KeyframesObject, KeyframeStops, keyframes } from "@mochi-css/vanilla";
import { StyleGenerator } from "@mochi-css/plugins";
import { type OnDiagnostic, getErrorMessage } from "@mochi-css/core";

export class StitchesKeyframesGenerator extends StyleGenerator {
    private readonly collectedKeyframes: {
        source: string;
        args: KeyframeStops[];
    }[] = [];

    constructor(private readonly onDiagnostic?: OnDiagnostic) {
        super();
    }

    override mockFunction(...args: unknown[]): unknown {
        return (keyframes as (...a: unknown[]) => unknown)(...args);
    }

    collectArgs(source: string, args: unknown[]): void {
        const validArgs: KeyframeStops[] = [];
        for (const arg of args) {
            if (arg == null || typeof arg !== "object") {
                this.onDiagnostic?.({
                    code: "MOCHI_INVALID_KEYFRAMES_ARG",
                    message: `Expected keyframe stops object, got ${arg === null ? "null" : typeof arg}`,
                    severity: "warning",
                    file: source,
                });
                continue;
            }
            validArgs.push(arg as KeyframeStops);
        }
        if (validArgs.length > 0) {
            this.collectedKeyframes.push({ source, args: validArgs });
        }
    }

    async generateStyles(): Promise<{ files: Record<string, string> }> {
        const filesCss = new Map<string, Set<string>>();
        for (const { source, args } of this.collectedKeyframes) {
            let css = filesCss.get(source);
            if (!css) {
                css = new Set<string>();
                filesCss.set(source, css);
            }
            for (const stops of args) {
                try {
                    css.add(new KeyframesObject(stops).asCssString());
                } catch (err) {
                    const message = getErrorMessage(err);
                    this.onDiagnostic?.({
                        code: "MOCHI_KEYFRAMES_GENERATION",
                        message: `Failed to generate keyframes CSS: ${message}`,
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
