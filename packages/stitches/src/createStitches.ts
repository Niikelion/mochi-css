import {
    KeyframeStops,
    MochiKeyframes,
    GlobalCssStyles,
    AllVariants,
    MochiCSS,
    MochiCSSProps,
    MergeCSSVariants,
} from "@mochi-css/vanilla";
import { HTMLElementType } from "react";
import { StitchesConfig, StitchesTheme, defaultThemeMap } from "@/types";
import { buildThemeRefs } from "@/theme";
import { runtimeCss } from "@/runtime/css";
import { runtimeKeyframes } from "@/runtime/keyframes";
import { runtimeGlobalCss } from "@/runtime/globalCss";
import { runtimeCreateTheme, ThemeResult } from "@/runtime/createTheme";
import { runtimeStyled, StyledFunction } from "@/runtime/styled";

export function createStitches(config: StitchesConfig) {
    const resolvedConfig: StitchesConfig = {
        ...config,
        themeMap: config.themeMap ?? defaultThemeMap,
    };

    return {
        config: resolvedConfig,
        theme: buildThemeRefs(
            resolvedConfig.theme ?? {},
            resolvedConfig.prefix,
        ),
        css<V extends AllVariants[]>(
            ...args: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS }
        ): MochiCSS<MergeCSSVariants<V>> {
            return runtimeCss<V>(args, resolvedConfig);
        },
        styled: ((target: unknown, ...args: unknown[]) =>
            runtimeStyled(
                target as HTMLElementType,
                args as (MochiCSSProps<AllVariants> | MochiCSS)[],
                resolvedConfig,
            )) as StyledFunction,
        keyframes(stops: KeyframeStops): MochiKeyframes {
            return runtimeKeyframes(stops);
        },

        globalCss(_styles: GlobalCssStyles): () => void {
            return runtimeGlobalCss(_styles);
        },
        createTheme(tokens: StitchesTheme): ThemeResult {
            return runtimeCreateTheme(tokens, resolvedConfig);
        },
    };
}
