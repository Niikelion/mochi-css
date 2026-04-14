import { StyleGenerator } from "@mochi-css/plugins";
import type { OnDiagnostic } from "@mochi-css/builder";
import { StitchesConfig } from "@mochi-css/stitches";
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

export class StitchesGenerator extends StyleGenerator {
    private readonly allSubGeneratorGroups: SubGeneratorGroup[] = [];
    private lastSubGenGroup: SubGeneratorGroup | null = null;

    constructor(private readonly onDiagnostic?: OnDiagnostic) {
        super();
    }

    override mockFunction(..._args: unknown[]): unknown {
        return this.lastSubGenGroup;
    }

    collectArgs(
        source: string,
        args: unknown[],
    ): Record<string, StyleGenerator> {
        const config = (args[0] ?? {}) as StitchesConfig;

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
        return subGens as unknown as Record<string, StyleGenerator>;
    }

    async generateStyles(): Promise<{
        global?: string;
        files?: Record<string, string>;
    }> {
        const globalParts: string[] = [];
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
