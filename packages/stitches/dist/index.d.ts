import { AllVariants, GlobalCssStyles, KeyframeStops, MergeCSSVariants, MochiCSS, MochiCSSProps, MochiKeyframes } from "@mochi-css/vanilla";
import { ComponentProps, ComponentType, FC, HTMLElementType } from "react";

//#region src/types.d.ts
type StitchesMedia = Record<string, string>;
type StitchesTheme = Record<string, Record<string, string>>;
type StitchesUtils = Record<string, (value: unknown) => Record<string, unknown>>;
interface StitchesConfig {
  prefix?: string;
  media?: StitchesMedia;
  theme?: StitchesTheme;
  themeMap?: Record<string, string>;
  utils?: StitchesUtils;
}
declare const defaultThemeMap: Record<string, string>;
//#endregion
//#region src/runtime/createTheme.d.ts
type ThemeResult = {
  className: string;
  [scale: string]: string | Record<string, string>;
};
declare function buildThemeClassName(tokens: StitchesTheme): string;
//#endregion
//#region src/runtime/styled.d.ts
type Cls$1 = {
  className?: string;
};
declare const MOCHI_CSS: unique symbol;
declare const MOCHI_TARGET: unique symbol;
interface MochiStyledComponent<P = object> extends FC<P> {
  [MOCHI_CSS]: MochiCSS;
  [MOCHI_TARGET]: HTMLElementType | ComponentType<Cls$1>;
  selector: string;
}
//#endregion
//#region src/createStitches.d.ts
type Cls = {
  className?: string;
};
declare function createStitches(config: StitchesConfig): {
  config: StitchesConfig;
  theme: Record<string, Record<string, string>>;
  css<V extends AllVariants[]>(...args: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS }): MochiCSS<MergeCSSVariants<V>>;
  styled<T extends HTMLElementType | ComponentType<Cls> | MochiStyledComponent, V extends AllVariants[]>(target: T, ...args: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS }): MochiStyledComponent<Omit<ComponentProps<T>, "as" | "className" | "css" | keyof MergeCSSVariants<V>> & {
    as?: HTMLElementType | ComponentType;
    className?: string;
    css?: Record<string, unknown>;
  } & Partial<{ [K in keyof MergeCSSVariants<V>]: (keyof MergeCSSVariants<V>[K] & string) | Partial<Record<string, keyof MergeCSSVariants<V>[K] & string>> }>>;
  keyframes(stops: KeyframeStops): MochiKeyframes;
  globalCss(_styles: GlobalCssStyles): () => void;
  createTheme(tokens: StitchesTheme): ThemeResult;
};
//#endregion
//#region src/preprocess/expandBreakpoints.d.ts
declare function expandBreakpoint(bp: string, config: StitchesConfig): string | undefined;
//#endregion
//#region src/preprocess/index.d.ts
declare function preprocess(style: Record<string, unknown>, config: StitchesConfig): Record<string, unknown>;
//#endregion
//#region src/theme.d.ts
declare function buildThemeRefs(theme: StitchesTheme, prefix?: string): Record<string, Record<string, string>>;
//#endregion
export { type MochiStyledComponent, type StitchesConfig, type StitchesMedia, type StitchesTheme, type StitchesUtils, type ThemeResult, buildThemeClassName, buildThemeRefs, createStitches, defaultThemeMap, expandBreakpoint, preprocess };
//# sourceMappingURL=index.d.ts.map