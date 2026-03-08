import { CallExpression, Expression } from "@swc/types";
import { OnDiagnostic, StyleExtractor, StyleGenerator } from "@mochi-css/builder";
import { StitchesConfig } from "@mochi-css/stitches";

//#region src/extractor/StitchesExtractor.d.ts
declare class StitchesExtractor implements StyleExtractor {
  readonly importPath = "@mochi-css/stitches";
  readonly symbolName = "createStitches";
  readonly derivedExtractors: ReadonlyMap<string, StyleExtractor>;
  constructor();
  extractStaticArgs(call: CallExpression): Expression[];
  startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator;
}
declare const createStitchesExtractor: StitchesExtractor;
//#endregion
//#region src/generator/StitchesGenerator.d.ts
declare class StitchesGenerator implements StyleGenerator {
  private readonly onDiagnostic?;
  private readonly allSubGeneratorGroups;
  constructor(onDiagnostic?: OnDiagnostic | undefined);
  collectArgs(source: string, args: unknown[]): Record<string, StyleGenerator>;
  generateStyles(): Promise<{
    global?: string;
    files?: Record<string, string>;
  }>;
}
//#endregion
//#region src/generator/StitchesCssGenerator.d.ts
declare class StitchesCssGenerator implements StyleGenerator {
  private readonly config;
  private readonly onDiagnostic?;
  private readonly collectedStyles;
  constructor(config: StitchesConfig, onDiagnostic?: OnDiagnostic | undefined);
  collectArgs(source: string, args: unknown[]): void;
  generateStyles(): Promise<{
    files: Record<string, string>;
  }>;
}
//#endregion
//#region src/generator/StitchesGlobalCssGenerator.d.ts
declare class StitchesGlobalCssGenerator implements StyleGenerator {
  private readonly config;
  private readonly onDiagnostic?;
  private readonly collectedStyles;
  constructor(config: StitchesConfig, onDiagnostic?: OnDiagnostic | undefined);
  collectArgs(source: string, args: unknown[]): void;
  generateStyles(): Promise<{
    global?: string;
  }>;
}
//#endregion
//#region src/generator/StitchesKeyframesGenerator.d.ts
declare class StitchesKeyframesGenerator implements StyleGenerator {
  private readonly onDiagnostic?;
  private readonly collectedKeyframes;
  constructor(onDiagnostic?: OnDiagnostic | undefined);
  collectArgs(source: string, args: unknown[]): void;
  generateStyles(): Promise<{
    files: Record<string, string>;
  }>;
}
//#endregion
//#region src/generator/StitchesCreateThemeGenerator.d.ts
declare class StitchesCreateThemeGenerator implements StyleGenerator {
  private readonly config;
  private readonly onDiagnostic?;
  private readonly collectedThemes;
  constructor(config: StitchesConfig, onDiagnostic?: OnDiagnostic | undefined);
  collectArgs(source: string, args: unknown[]): void;
  generateStyles(): Promise<{
    global?: string;
  }>;
}
//#endregion
export { StitchesCreateThemeGenerator, StitchesCssGenerator, StitchesExtractor, StitchesGenerator, StitchesGlobalCssGenerator, StitchesKeyframesGenerator, createStitchesExtractor };
//# sourceMappingURL=index.d.mts.map