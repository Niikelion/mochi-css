import { StyleGenerator } from "@mochi-css/plugins";
import type { OnDiagnostic } from "@mochi-css/core";
import { StitchesConfig, StitchesTheme } from "../../types";
import { StitchesCssGenerator } from "./StitchesCssGenerator";
import { StitchesGlobalCssGenerator } from "./StitchesGlobalCssGenerator";
import { StitchesKeyframesGenerator } from "./StitchesKeyframesGenerator";
import { StitchesCreateThemeGenerator } from "./StitchesCreateThemeGenerator";

interface SubGeneratorGroup {
    css: StitchesCssGenerator;
    styled: StitchesCssGenerator;
    keyframes: StitchesKeyframesGenerator;
    globalCss: StitchesGlobalCssGenerator;
    createTheme: StitchesCreateThemeGenerator;
}

function buildRootCss(theme: StitchesTheme, prefix: string): string {
    const declarations: string[] = [];
    for (const [scale, vals] of Object.entries(theme).sort(([a], [b]) =>
        a.localeCompare(b),
    )) {
        for (const [token, value] of Object.entries(vals).sort(([a], [b]) =>
            a.localeCompare(b),
        )) {
            if (typeof value === "string") {
                declarations.push(
                    `    --${prefix}${scale}-${token}: ${value};`,
                );
            } else {
                for (const [subKey, subVal] of Object.entries(value).sort(
                    ([a], [b]) => a.localeCompare(b),
                )) {
                    declarations.push(
                        `    --${prefix}${scale}-${token}-${subKey}: ${subVal};`,
                    );
                }
            }
        }
    }
    return declarations.length > 0
        ? `:root {\n${declarations.join("\n")}\n}`
        : "";
}

export class StitchesGenerator extends StyleGenerator {
    private readonly allSubGeneratorGroups: SubGeneratorGroup[] = [];
    private lastSubGenGroup: SubGeneratorGroup | null = null;
    private readonly defaultThemeCssBlocks = new Set<string>();

    constructor(private readonly onDiagnostic?: OnDiagnostic) {
        super();
    }

    override mockFunction(..._args: unknown[]): unknown {
        return this.lastSubGenGroup;
    }

    collectArgs(source: string, args: unknown[]): void {
        const config = (args[0] ?? {}) as StitchesConfig;

        if (config.theme) {
            const prefix = config.prefix ? `${config.prefix}-` : "";
            const block = buildRootCss(config.theme, prefix);
            if (block) this.defaultThemeCssBlocks.add(block);
        }

        const subGens: SubGeneratorGroup = {
            css: new StitchesCssGenerator(config, this.onDiagnostic),
            styled: new StitchesCssGenerator(config, this.onDiagnostic),
            keyframes: new StitchesKeyframesGenerator(this.onDiagnostic),
            globalCss: new StitchesGlobalCssGenerator(
                config,
                this.onDiagnostic,
            ),
            createTheme: new StitchesCreateThemeGenerator(
                config,
                this.onDiagnostic,
            ),
        };

        this.allSubGeneratorGroups.push(subGens);
        this.lastSubGenGroup = subGens;
    }

    override async generateStyles(): Promise<{
        global?: string;
        files?: Record<string, string>;
    }> {
        const globalParts: string[] = [...this.defaultThemeCssBlocks];
        const allFiles: Record<string, string> = {};

        for (const subGens of this.allSubGeneratorGroups) {
            for (const subGen of Object.values(subGens) as StyleGenerator[]) {
                const result = await subGen.generateStyles();
                if (result.global) globalParts.push(result.global);
                if (result.files) {
                    for (const [filePath, css] of Object.entries(
                        result.files,
                    )) {
                        allFiles[filePath] = allFiles[filePath]
                            ? `${allFiles[filePath]}\n\n${css}`
                            : css;
                    }
                }
            }
        }

        return {
            global:
                globalParts.length > 0 ? globalParts.join("\n\n") : undefined,
            files: Object.keys(allFiles).length > 0 ? allFiles : undefined,
        };
    }
}
