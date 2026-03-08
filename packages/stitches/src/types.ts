export type StitchesMedia = Record<string, string>;

export type StitchesTheme = Record<string, Record<string, string>>;

export type StitchesUtils = Record<
    string,
    (value: unknown) => Record<string, unknown>
>;

export interface StitchesConfig {
    prefix?: string;
    media?: StitchesMedia;
    theme?: StitchesTheme;
    themeMap?: Record<string, string>;
    utils?: StitchesUtils;
}

export const defaultThemeMap: Record<string, string> = {
    // Colors
    color: "colors",
    backgroundColor: "colors",
    borderColor: "colors",
    caretColor: "colors",
    columnRuleColor: "colors",
    fill: "colors",
    outlineColor: "colors",
    stroke: "colors",
    textDecorationColor: "colors",
    // Space
    gap: "space",
    gridGap: "space",
    columnGap: "space",
    gridColumnGap: "space",
    rowGap: "space",
    gridRowGap: "space",
    inset: "space",
    insetBlock: "space",
    insetBlockEnd: "space",
    insetBlockStart: "space",
    insetInline: "space",
    insetInlineEnd: "space",
    insetInlineStart: "space",
    margin: "space",
    marginTop: "space",
    marginRight: "space",
    marginBottom: "space",
    marginLeft: "space",
    marginBlock: "space",
    marginBlockEnd: "space",
    marginBlockStart: "space",
    marginInline: "space",
    marginInlineEnd: "space",
    marginInlineStart: "space",
    padding: "space",
    paddingTop: "space",
    paddingRight: "space",
    paddingBottom: "space",
    paddingLeft: "space",
    paddingBlock: "space",
    paddingBlockEnd: "space",
    paddingBlockStart: "space",
    paddingInline: "space",
    paddingInlineEnd: "space",
    paddingInlineStart: "space",
    // Sizes
    width: "sizes",
    minWidth: "sizes",
    maxWidth: "sizes",
    height: "sizes",
    minHeight: "sizes",
    maxHeight: "sizes",
    flexBasis: "sizes",
    gridTemplateColumns: "sizes",
    gridTemplateRows: "sizes",
    // FontSizes
    fontSize: "fontSizes",
    // FontWeights
    fontWeight: "fontWeights",
    // LineHeights
    lineHeight: "lineHeights",
    // LetterSpacings
    letterSpacing: "letterSpacings",
    // Fonts
    fontFamily: "fonts",
    // Radii
    borderRadius: "radii",
    borderTopLeftRadius: "radii",
    borderTopRightRadius: "radii",
    borderBottomRightRadius: "radii",
    borderBottomLeftRadius: "radii",
    borderEndEndRadius: "radii",
    borderEndStartRadius: "radii",
    borderStartEndRadius: "radii",
    borderStartStartRadius: "radii",
    // BorderWidths
    borderWidth: "borderWidths",
    borderTopWidth: "borderWidths",
    borderRightWidth: "borderWidths",
    borderBottomWidth: "borderWidths",
    borderLeftWidth: "borderWidths",
    // BorderStyles
    borderStyle: "borderStyles",
    borderTopStyle: "borderStyles",
    borderRightStyle: "borderStyles",
    borderBottomStyle: "borderStyles",
    borderLeftStyle: "borderStyles",
    // Shadows
    boxShadow: "shadows",
    textShadow: "shadows",
    // ZIndices
    zIndex: "zIndices",
    // Transitions
    transition: "transitions",
};
