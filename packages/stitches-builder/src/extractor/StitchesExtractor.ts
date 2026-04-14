import { CallExpression, Expression } from "@swc/types";
import type { StyleExtractor, StyleGenerator } from "@mochi-css/plugins";
import { VanillaCssExtractor } from "@mochi-css/vanilla/config";
import { css, keyframes, globalCss } from "@mochi-css/vanilla";
import type { OnDiagnostic } from "@mochi-css/builder";
import { StitchesGenerator } from "@/generator/StitchesGenerator";

export class StitchesExtractor implements StyleExtractor {
    readonly importPath = "@mochi-css/stitches";
    readonly symbolName = "createStitches";
    readonly derivedExtractors: ReadonlyMap<string, StyleExtractor>;

    constructor() {
        this.derivedExtractors = new Map<string, StyleExtractor>([
            [
                "css",
                new VanillaCssExtractor(
                    "@mochi-css/stitches",
                    "css",
                    (call: CallExpression) =>
                        call.arguments.map((a) => a.expression),
                    css as (...args: unknown[]) => unknown,
                ),
            ],
            [
                "styled",
                new VanillaCssExtractor(
                    "@mochi-css/stitches",
                    "styled",
                    (call: CallExpression) =>
                        call.arguments.map((a) => a.expression).slice(1),
                    css as (...args: unknown[]) => unknown,
                ),
            ],
            [
                "keyframes",
                new VanillaCssExtractor(
                    "@mochi-css/stitches",
                    "keyframes",
                    (call: CallExpression) =>
                        call.arguments.slice(0, 1).map((a) => a.expression),
                    keyframes as (...args: unknown[]) => unknown,
                ),
            ],
            [
                "globalCss",
                new VanillaCssExtractor(
                    "@mochi-css/stitches",
                    "globalCss",
                    (call: CallExpression) =>
                        call.arguments.slice(0, 1).map((a) => a.expression),
                    globalCss as (...args: unknown[]) => unknown,
                ),
            ],
            [
                "createTheme",
                new VanillaCssExtractor(
                    "@mochi-css/stitches",
                    "createTheme",
                    (call: CallExpression) =>
                        call.arguments.slice(0, 1).map((a) => a.expression),
                    () => ({ className: "" }),
                ),
            ],
        ]);
    }

    extractStaticArgs(call: CallExpression): Expression[] {
        return call.arguments.slice(0, 1).map((a) => a.expression);
    }

    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator {
        return new StitchesGenerator(onDiagnostic);
    }
}

export const createStitchesExtractor = new StitchesExtractor();
