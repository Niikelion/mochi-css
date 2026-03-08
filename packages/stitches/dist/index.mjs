import clsx from "clsx";
import { Fragment, createElement } from "react";

//#region src/types.ts
const defaultThemeMap = {
	color: "colors",
	backgroundColor: "colors",
	borderColor: "colors",
	caretColor: "colors",
	columnRuleColor: "colors",
	fill: "colors",
	outlineColor: "colors",
	stroke: "colors",
	textDecorationColor: "colors",
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
	width: "sizes",
	minWidth: "sizes",
	maxWidth: "sizes",
	height: "sizes",
	minHeight: "sizes",
	maxHeight: "sizes",
	flexBasis: "sizes",
	gridTemplateColumns: "sizes",
	gridTemplateRows: "sizes",
	fontSize: "fontSizes",
	fontWeight: "fontWeights",
	lineHeight: "lineHeights",
	letterSpacing: "letterSpacings",
	fontFamily: "fonts",
	borderRadius: "radii",
	borderTopLeftRadius: "radii",
	borderTopRightRadius: "radii",
	borderBottomRightRadius: "radii",
	borderBottomLeftRadius: "radii",
	borderEndEndRadius: "radii",
	borderEndStartRadius: "radii",
	borderStartEndRadius: "radii",
	borderStartStartRadius: "radii",
	borderWidth: "borderWidths",
	borderTopWidth: "borderWidths",
	borderRightWidth: "borderWidths",
	borderBottomWidth: "borderWidths",
	borderLeftWidth: "borderWidths",
	borderStyle: "borderStyles",
	borderTopStyle: "borderStyles",
	borderRightStyle: "borderStyles",
	borderBottomStyle: "borderStyles",
	borderLeftStyle: "borderStyles",
	boxShadow: "shadows",
	textShadow: "shadows",
	zIndex: "zIndices",
	transition: "transitions"
};

//#endregion
//#region src/theme.ts
function buildThemeRefs(theme, prefix = "") {
	const pfx = prefix ? `${prefix}-` : "";
	return Object.fromEntries(Object.entries(theme).map(([scale, tokens]) => [scale, Object.fromEntries(Object.entries(tokens).map(([token]) => [token, `var(--${pfx}${scale}-${token})`]))]));
}

//#endregion
//#region ../vanilla/dist/index.mjs
const propertyUnits = {
	animation: "ms",
	animationDelay: "ms",
	animationDuration: "ms",
	animationRange: "px",
	animationRangeCenter: "px",
	animationRangeEnd: "px",
	animationRangeStart: "px",
	background: "px",
	backgroundPosition: "px",
	backgroundPositionBlock: "px",
	backgroundPositionInline: "px",
	backgroundPositionX: "px",
	backgroundPositionY: "px",
	backgroundSize: "px",
	backgroundTbd: "px",
	baselineShift: "px",
	blockSize: "px",
	blockStep: "px",
	blockStepSize: "px",
	border: "px",
	borderBlock: "px",
	borderBlockClip: "px",
	borderBlockEnd: "px",
	borderBlockEndClip: "px",
	borderBlockEndRadius: "px",
	borderBlockEndWidth: "px",
	borderBlockStart: "px",
	borderBlockStartClip: "px",
	borderBlockStartRadius: "px",
	borderBlockStartWidth: "px",
	borderBlockWidth: "px",
	borderBottom: "px",
	borderBottomClip: "px",
	borderBottomLeftRadius: "px",
	borderBottomRadius: "px",
	borderBottomRightRadius: "px",
	borderBottomWidth: "px",
	borderClip: "px",
	borderEndEndRadius: "px",
	borderEndStartRadius: "px",
	borderImage: "%",
	borderImageOutset: "px",
	borderImageSlice: "%",
	borderImageWidth: "px",
	borderInline: "px",
	borderInlineClip: "px",
	borderInlineEnd: "px",
	borderInlineEndClip: "px",
	borderInlineEndRadius: "px",
	borderInlineEndWidth: "px",
	borderInlineStart: "px",
	borderInlineStartClip: "px",
	borderInlineStartRadius: "px",
	borderInlineStartWidth: "px",
	borderInlineWidth: "px",
	borderLeft: "px",
	borderLeftClip: "px",
	borderLeftRadius: "px",
	borderLeftWidth: "px",
	borderLimit: "px",
	borderRadius: "px",
	borderRight: "px",
	borderRightClip: "px",
	borderRightRadius: "px",
	borderRightWidth: "px",
	borderSpacing: "px",
	borderStartEndRadius: "px",
	borderStartStartRadius: "px",
	borderTop: "px",
	borderTopClip: "px",
	borderTopLeftRadius: "px",
	borderTopRadius: "px",
	borderTopRightRadius: "px",
	borderTopWidth: "px",
	borderWidth: "px",
	bottom: "px",
	boxShadow: "px",
	boxShadowBlur: "px",
	boxShadowOffset: "px",
	boxShadowSpread: "px",
	columnGap: "px",
	columnHeight: "px",
	columnRule: "px",
	columnRuleEdgeInset: "px",
	columnRuleEdgeInsetEnd: "px",
	columnRuleEdgeInsetStart: "px",
	columnRuleInset: "px",
	columnRuleInsetEnd: "px",
	columnRuleInsetStart: "px",
	columnRuleInteriorInset: "px",
	columnRuleInteriorInsetEnd: "px",
	columnRuleInteriorInsetStart: "px",
	columnRuleWidth: "px",
	columns: "px",
	columnWidth: "px",
	containIntrinsicBlockSize: "px",
	containIntrinsicHeight: "px",
	containIntrinsicInlineSize: "px",
	containIntrinsicSize: "px",
	containIntrinsicWidth: "px",
	corner: "px",
	cornerBlockEnd: "px",
	cornerBlockStart: "px",
	cornerBottom: "px",
	cornerBottomLeft: "px",
	cornerBottomRight: "px",
	cornerEndEnd: "px",
	cornerEndStart: "px",
	cornerInlineEnd: "px",
	cornerInlineStart: "px",
	cornerLeft: "px",
	cornerRight: "px",
	cornerStartEnd: "px",
	cornerStartStart: "px",
	cornerTop: "px",
	cornerTopLeft: "px",
	cornerTopRight: "px",
	cx: "px",
	cy: "px",
	fillOpacity: "%",
	fillPosition: "px",
	fillSize: "px",
	flex: "px",
	flexBasis: "px",
	floatOffset: "px",
	floodOpacity: "%",
	flowTolerance: "px",
	font: "deg",
	fontSize: "px",
	fontStretch: "%",
	fontStyle: "deg",
	fontWidth: "%",
	gap: "px",
	grid: "px",
	gridAutoColumns: "px",
	gridAutoRows: "px",
	gridColumnGap: "px",
	gridGap: "px",
	gridRowGap: "px",
	gridTemplate: "px",
	gridTemplateColumns: "px",
	gridTemplateRows: "px",
	height: "px",
	hyphenateLimitZone: "px",
	imageOrientation: "deg",
	imageResolution: "dppx",
	initialLetterWrap: "px",
	inlineSize: "px",
	inset: "px",
	insetBlock: "px",
	insetBlockEnd: "px",
	insetBlockStart: "px",
	insetInline: "px",
	insetInlineEnd: "px",
	insetInlineStart: "px",
	interestDelay: "ms",
	interestDelayEnd: "ms",
	interestDelayStart: "ms",
	itemFlow: "px",
	left: "px",
	letterSpacing: "px",
	lineHeight: "px",
	lineHeightStep: "px",
	linePadding: "px",
	margin: "px",
	marginBlock: "px",
	marginBlockEnd: "px",
	marginBlockStart: "px",
	marginBottom: "px",
	marginInline: "px",
	marginInlineEnd: "px",
	marginInlineStart: "px",
	marginLeft: "px",
	marginRight: "px",
	marginTop: "px",
	mask: "px",
	maskBorder: "%",
	maskBorderOutset: "px",
	maskBorderSlice: "%",
	maskBorderWidth: "px",
	maskPosition: "px",
	maskSize: "px",
	maxBlockSize: "px",
	maxHeight: "px",
	maxInlineSize: "px",
	maxWidth: "px",
	minBlockSize: "px",
	minHeight: "px",
	minInlineSize: "px",
	minWidth: "px",
	objectPosition: "px",
	offset: "px",
	offsetAnchor: "px",
	offsetDistance: "px",
	offsetPosition: "px",
	offsetRotate: "deg",
	opacity: "%",
	outline: "px",
	outlineOffset: "px",
	outlineWidth: "px",
	overflowClipMargin: "px",
	overflowClipMarginBlock: "px",
	overflowClipMarginBlockEnd: "px",
	overflowClipMarginBlockStart: "px",
	overflowClipMarginBottom: "px",
	overflowClipMarginInline: "px",
	overflowClipMarginInlineEnd: "px",
	overflowClipMarginInlineStart: "px",
	overflowClipMarginLeft: "px",
	overflowClipMarginRight: "px",
	overflowClipMarginTop: "px",
	padding: "px",
	paddingBlock: "px",
	paddingBlockEnd: "px",
	paddingBlockStart: "px",
	paddingBottom: "px",
	paddingInline: "px",
	paddingInlineEnd: "px",
	paddingInlineStart: "px",
	paddingLeft: "px",
	paddingRight: "px",
	paddingTop: "px",
	pause: "ms",
	pauseAfter: "ms",
	pauseBefore: "ms",
	perspective: "px",
	perspectiveOrigin: "px",
	r: "px",
	rest: "ms",
	restAfter: "ms",
	restBefore: "ms",
	right: "px",
	rotate: "deg",
	rowGap: "px",
	rowRule: "px",
	rowRuleEdgeInset: "px",
	rowRuleEdgeInsetEnd: "px",
	rowRuleEdgeInsetStart: "px",
	rowRuleInset: "px",
	rowRuleInsetEnd: "px",
	rowRuleInsetStart: "px",
	rowRuleInteriorInset: "px",
	rowRuleInteriorInsetEnd: "px",
	rowRuleInteriorInsetStart: "px",
	rowRuleWidth: "px",
	rule: "px",
	ruleEdgeInset: "px",
	ruleInset: "px",
	ruleInsetEnd: "px",
	ruleInsetStart: "px",
	ruleInteriorInset: "px",
	ruleWidth: "px",
	rx: "px",
	ry: "px",
	scale: "%",
	scrollMargin: "px",
	scrollMarginBlock: "px",
	scrollMarginBlockEnd: "px",
	scrollMarginBlockStart: "px",
	scrollMarginBottom: "px",
	scrollMarginInline: "px",
	scrollMarginInlineEnd: "px",
	scrollMarginInlineStart: "px",
	scrollMarginLeft: "px",
	scrollMarginRight: "px",
	scrollMarginTop: "px",
	scrollPadding: "px",
	scrollPaddingBlock: "px",
	scrollPaddingBlockEnd: "px",
	scrollPaddingBlockStart: "px",
	scrollPaddingBottom: "px",
	scrollPaddingInline: "px",
	scrollPaddingInlineEnd: "px",
	scrollPaddingInlineStart: "px",
	scrollPaddingLeft: "px",
	scrollPaddingRight: "px",
	scrollPaddingTop: "px",
	shapeImageThreshold: "%",
	shapeMargin: "px",
	shapePadding: "px",
	stopOpacity: "%",
	strokeDasharray: "px",
	strokeDashcorner: "px",
	strokeDashCorner: "px",
	strokeDashoffset: "px",
	strokeOpacity: "%",
	strokePosition: "px",
	strokeSize: "px",
	strokeWidth: "px",
	tabSize: "px",
	textDecoration: "px",
	textDecorationInset: "px",
	textDecorationThickness: "px",
	textIndent: "px",
	textShadow: "px",
	textSizeAdjust: "%",
	textUnderlineOffset: "px",
	timelineTrigger: "px",
	timelineTriggerExitRange: "px",
	timelineTriggerExitRangeEnd: "px",
	timelineTriggerExitRangeStart: "px",
	timelineTriggerRange: "px",
	timelineTriggerRangeEnd: "px",
	timelineTriggerRangeStart: "px",
	top: "px",
	transformOrigin: "px",
	transition: "ms",
	transitionDelay: "ms",
	transitionDuration: "ms",
	translate: "px",
	verticalAlign: "px",
	viewTimeline: "px",
	viewTimelineInset: "px",
	voiceDuration: "ms",
	voicePitch: "Hz",
	voiceRange: "Hz",
	voiceRate: "%",
	width: "px",
	wordSpacing: "px",
	x: "px",
	y: "px",
	zoom: "%"
};
const knownPropertyNames = new Set([
	"accentColor",
	"alignContent",
	"alignItems",
	"alignSelf",
	"alignmentBaseline",
	"all",
	"anchorName",
	"anchorScope",
	"animation",
	"animationComposition",
	"animationDelay",
	"animationDirection",
	"animationDuration",
	"animationFillMode",
	"animationIterationCount",
	"animationName",
	"animationPlayState",
	"animationRange",
	"animationRangeCenter",
	"animationRangeEnd",
	"animationRangeStart",
	"animationTimeline",
	"animationTimingFunction",
	"animationTrigger",
	"appearance",
	"aspectRatio",
	"backdropFilter",
	"backfaceVisibility",
	"background",
	"backgroundAttachment",
	"backgroundBlendMode",
	"backgroundClip",
	"backgroundColor",
	"backgroundImage",
	"backgroundOrigin",
	"backgroundPosition",
	"backgroundPositionBlock",
	"backgroundPositionInline",
	"backgroundPositionX",
	"backgroundPositionY",
	"backgroundRepeat",
	"backgroundRepeatBlock",
	"backgroundRepeatInline",
	"backgroundRepeatX",
	"backgroundRepeatY",
	"backgroundSize",
	"backgroundTbd",
	"baselineShift",
	"baselineSource",
	"blockEllipsis",
	"blockSize",
	"blockStep",
	"blockStepAlign",
	"blockStepInsert",
	"blockStepRound",
	"blockStepSize",
	"bookmarkLabel",
	"bookmarkLevel",
	"bookmarkState",
	"border",
	"borderBlock",
	"borderBlockClip",
	"borderBlockColor",
	"borderBlockEnd",
	"borderBlockEndClip",
	"borderBlockEndColor",
	"borderBlockEndRadius",
	"borderBlockEndStyle",
	"borderBlockEndWidth",
	"borderBlockStart",
	"borderBlockStartClip",
	"borderBlockStartColor",
	"borderBlockStartRadius",
	"borderBlockStartStyle",
	"borderBlockStartWidth",
	"borderBlockStyle",
	"borderBlockWidth",
	"borderBottom",
	"borderBottomClip",
	"borderBottomColor",
	"borderBottomLeftRadius",
	"borderBottomRadius",
	"borderBottomRightRadius",
	"borderBottomStyle",
	"borderBottomWidth",
	"borderBoundary",
	"borderClip",
	"borderCollapse",
	"borderColor",
	"borderEndEndRadius",
	"borderEndStartRadius",
	"borderImage",
	"borderImageOutset",
	"borderImageRepeat",
	"borderImageSlice",
	"borderImageSource",
	"borderImageWidth",
	"borderInline",
	"borderInlineClip",
	"borderInlineColor",
	"borderInlineEnd",
	"borderInlineEndClip",
	"borderInlineEndColor",
	"borderInlineEndRadius",
	"borderInlineEndStyle",
	"borderInlineEndWidth",
	"borderInlineStart",
	"borderInlineStartClip",
	"borderInlineStartColor",
	"borderInlineStartRadius",
	"borderInlineStartStyle",
	"borderInlineStartWidth",
	"borderInlineStyle",
	"borderInlineWidth",
	"borderLeft",
	"borderLeftClip",
	"borderLeftColor",
	"borderLeftRadius",
	"borderLeftStyle",
	"borderLeftWidth",
	"borderLimit",
	"borderRadius",
	"borderRight",
	"borderRightClip",
	"borderRightColor",
	"borderRightRadius",
	"borderRightStyle",
	"borderRightWidth",
	"borderShape",
	"borderSpacing",
	"borderStartEndRadius",
	"borderStartStartRadius",
	"borderStyle",
	"borderTop",
	"borderTopClip",
	"borderTopColor",
	"borderTopLeftRadius",
	"borderTopRadius",
	"borderTopRightRadius",
	"borderTopStyle",
	"borderTopWidth",
	"borderWidth",
	"bottom",
	"boxDecorationBreak",
	"boxShadow",
	"boxShadowBlur",
	"boxShadowColor",
	"boxShadowOffset",
	"boxShadowPosition",
	"boxShadowSpread",
	"boxSizing",
	"boxSnap",
	"breakAfter",
	"breakBefore",
	"breakInside",
	"captionSide",
	"caret",
	"caretAnimation",
	"caretColor",
	"caretShape",
	"clear",
	"clip",
	"clipPath",
	"clipRule",
	"color",
	"colorAdjust",
	"colorInterpolation",
	"colorInterpolationFilters",
	"colorScheme",
	"columnCount",
	"columnFill",
	"columnGap",
	"columnHeight",
	"columnRule",
	"columnRuleBreak",
	"columnRuleColor",
	"columnRuleEdgeInset",
	"columnRuleEdgeInsetEnd",
	"columnRuleEdgeInsetStart",
	"columnRuleInset",
	"columnRuleInsetEnd",
	"columnRuleInsetStart",
	"columnRuleInteriorInset",
	"columnRuleInteriorInsetEnd",
	"columnRuleInteriorInsetStart",
	"columnRuleStyle",
	"columnRuleWidth",
	"columnSpan",
	"columnWidth",
	"columnWrap",
	"columns",
	"contain",
	"containIntrinsicBlockSize",
	"containIntrinsicHeight",
	"containIntrinsicInlineSize",
	"containIntrinsicSize",
	"containIntrinsicWidth",
	"container",
	"containerName",
	"containerType",
	"content",
	"contentVisibility",
	"continue",
	"copyInto",
	"corner",
	"cornerBlockEnd",
	"cornerBlockEndShape",
	"cornerBlockStart",
	"cornerBlockStartShape",
	"cornerBottom",
	"cornerBottomLeft",
	"cornerBottomLeftShape",
	"cornerBottomRight",
	"cornerBottomRightShape",
	"cornerBottomShape",
	"cornerEndEnd",
	"cornerEndEndShape",
	"cornerEndStart",
	"cornerEndStartShape",
	"cornerInlineEnd",
	"cornerInlineEndShape",
	"cornerInlineStart",
	"cornerInlineStartShape",
	"cornerLeft",
	"cornerLeftShape",
	"cornerRight",
	"cornerRightShape",
	"cornerShape",
	"cornerStartEnd",
	"cornerStartEndShape",
	"cornerStartStart",
	"cornerStartStartShape",
	"cornerTop",
	"cornerTopLeft",
	"cornerTopLeftShape",
	"cornerTopRight",
	"cornerTopRightShape",
	"cornerTopShape",
	"counterIncrement",
	"counterReset",
	"counterSet",
	"cue",
	"cueAfter",
	"cueBefore",
	"cursor",
	"cx",
	"cy",
	"d",
	"direction",
	"display",
	"dominantBaseline",
	"dynamicRangeLimit",
	"emptyCells",
	"eventTrigger",
	"eventTriggerName",
	"eventTriggerSource",
	"fieldSizing",
	"fill",
	"fillBreak",
	"fillColor",
	"fillImage",
	"fillOpacity",
	"fillOrigin",
	"fillPosition",
	"fillRepeat",
	"fillRule",
	"fillSize",
	"filter",
	"flex",
	"flexBasis",
	"flexDirection",
	"flexFlow",
	"flexGrow",
	"flexShrink",
	"flexWrap",
	"float",
	"floatDefer",
	"floatOffset",
	"floatReference",
	"floodColor",
	"floodOpacity",
	"flowFrom",
	"flowInto",
	"flowTolerance",
	"font",
	"fontFamily",
	"fontFeatureSettings",
	"fontKerning",
	"fontLanguageOverride",
	"fontOpticalSizing",
	"fontPalette",
	"fontSize",
	"fontSizeAdjust",
	"fontStretch",
	"fontStyle",
	"fontSynthesis",
	"fontSynthesisPosition",
	"fontSynthesisSmallCaps",
	"fontSynthesisStyle",
	"fontSynthesisWeight",
	"fontVariant",
	"fontVariantAlternates",
	"fontVariantCaps",
	"fontVariantEastAsian",
	"fontVariantEmoji",
	"fontVariantLigatures",
	"fontVariantNumeric",
	"fontVariantPosition",
	"fontVariationSettings",
	"fontWeight",
	"fontWidth",
	"footnoteDisplay",
	"footnotePolicy",
	"forcedColorAdjust",
	"gap",
	"glyphOrientationVertical",
	"grid",
	"gridArea",
	"gridAutoColumns",
	"gridAutoFlow",
	"gridAutoRows",
	"gridColumn",
	"gridColumnEnd",
	"gridColumnGap",
	"gridColumnStart",
	"gridGap",
	"gridRow",
	"gridRowEnd",
	"gridRowGap",
	"gridRowStart",
	"gridTemplate",
	"gridTemplateAreas",
	"gridTemplateColumns",
	"gridTemplateRows",
	"hangingPunctuation",
	"height",
	"hyphenateCharacter",
	"hyphenateLimitChars",
	"hyphenateLimitLast",
	"hyphenateLimitLines",
	"hyphenateLimitZone",
	"hyphens",
	"imageOrientation",
	"imageRendering",
	"imageResolution",
	"initialLetter",
	"initialLetterAlign",
	"initialLetterWrap",
	"inlineSize",
	"inlineSizing",
	"inputSecurity",
	"inset",
	"insetBlock",
	"insetBlockEnd",
	"insetBlockStart",
	"insetInline",
	"insetInlineEnd",
	"insetInlineStart",
	"interactivity",
	"interestDelay",
	"interestDelayEnd",
	"interestDelayStart",
	"interpolateSize",
	"isolation",
	"itemCross",
	"itemDirection",
	"itemFlow",
	"itemPack",
	"itemTrack",
	"itemWrap",
	"justifyContent",
	"justifyItems",
	"justifySelf",
	"left",
	"letterSpacing",
	"lightingColor",
	"lineBreak",
	"lineClamp",
	"lineFitEdge",
	"lineGrid",
	"lineHeight",
	"lineHeightStep",
	"linePadding",
	"lineSnap",
	"linkParameters",
	"listStyle",
	"listStyleImage",
	"listStylePosition",
	"listStyleType",
	"margin",
	"marginBlock",
	"marginBlockEnd",
	"marginBlockStart",
	"marginBottom",
	"marginBreak",
	"marginInline",
	"marginInlineEnd",
	"marginInlineStart",
	"marginLeft",
	"marginRight",
	"marginTop",
	"marginTrim",
	"marker",
	"markerEnd",
	"markerMid",
	"markerSide",
	"markerStart",
	"mask",
	"maskBorder",
	"maskBorderMode",
	"maskBorderOutset",
	"maskBorderRepeat",
	"maskBorderSlice",
	"maskBorderSource",
	"maskBorderWidth",
	"maskClip",
	"maskComposite",
	"maskImage",
	"maskMode",
	"maskOrigin",
	"maskPosition",
	"maskRepeat",
	"maskSize",
	"maskType",
	"mathDepth",
	"mathShift",
	"mathStyle",
	"maxBlockSize",
	"maxHeight",
	"maxInlineSize",
	"maxLines",
	"maxWidth",
	"minBlockSize",
	"minHeight",
	"minInlineSize",
	"minIntrinsicSizing",
	"minWidth",
	"mixBlendMode",
	"navDown",
	"navLeft",
	"navRight",
	"navUp",
	"objectFit",
	"objectPosition",
	"objectViewBox",
	"offset",
	"offsetAnchor",
	"offsetDistance",
	"offsetPath",
	"offsetPosition",
	"offsetRotate",
	"opacity",
	"order",
	"orphans",
	"outline",
	"outlineColor",
	"outlineOffset",
	"outlineStyle",
	"outlineWidth",
	"overflow",
	"overflowAnchor",
	"overflowBlock",
	"overflowClipMargin",
	"overflowClipMarginBlock",
	"overflowClipMarginBlockEnd",
	"overflowClipMarginBlockStart",
	"overflowClipMarginBottom",
	"overflowClipMarginInline",
	"overflowClipMarginInlineEnd",
	"overflowClipMarginInlineStart",
	"overflowClipMarginLeft",
	"overflowClipMarginRight",
	"overflowClipMarginTop",
	"overflowInline",
	"overflowWrap",
	"overflowX",
	"overflowY",
	"overlay",
	"overscrollBehavior",
	"overscrollBehaviorBlock",
	"overscrollBehaviorInline",
	"overscrollBehaviorX",
	"overscrollBehaviorY",
	"padding",
	"paddingBlock",
	"paddingBlockEnd",
	"paddingBlockStart",
	"paddingBottom",
	"paddingInline",
	"paddingInlineEnd",
	"paddingInlineStart",
	"paddingLeft",
	"paddingRight",
	"paddingTop",
	"page",
	"pageBreakAfter",
	"pageBreakBefore",
	"pageBreakInside",
	"paintOrder",
	"pause",
	"pauseAfter",
	"pauseBefore",
	"perspective",
	"perspectiveOrigin",
	"placeContent",
	"placeItems",
	"placeSelf",
	"pointerEvents",
	"pointerTimeline",
	"pointerTimelineAxis",
	"pointerTimelineName",
	"position",
	"positionAnchor",
	"positionArea",
	"positionTry",
	"positionTryFallbacks",
	"positionTryOrder",
	"positionVisibility",
	"printColorAdjust",
	"quotes",
	"r",
	"readingFlow",
	"readingOrder",
	"regionFragment",
	"resize",
	"rest",
	"restAfter",
	"restBefore",
	"right",
	"rotate",
	"rowGap",
	"rowRule",
	"rowRuleBreak",
	"rowRuleColor",
	"rowRuleEdgeInset",
	"rowRuleEdgeInsetEnd",
	"rowRuleEdgeInsetStart",
	"rowRuleInset",
	"rowRuleInsetEnd",
	"rowRuleInsetStart",
	"rowRuleInteriorInset",
	"rowRuleInteriorInsetEnd",
	"rowRuleInteriorInsetStart",
	"rowRuleStyle",
	"rowRuleWidth",
	"rubyAlign",
	"rubyMerge",
	"rubyOverhang",
	"rubyPosition",
	"rule",
	"ruleBreak",
	"ruleColor",
	"ruleEdgeInset",
	"ruleInset",
	"ruleInsetEnd",
	"ruleInsetStart",
	"ruleInteriorInset",
	"ruleOverlap",
	"ruleStyle",
	"ruleWidth",
	"rx",
	"ry",
	"scale",
	"scrollBehavior",
	"scrollInitialTarget",
	"scrollMargin",
	"scrollMarginBlock",
	"scrollMarginBlockEnd",
	"scrollMarginBlockStart",
	"scrollMarginBottom",
	"scrollMarginInline",
	"scrollMarginInlineEnd",
	"scrollMarginInlineStart",
	"scrollMarginLeft",
	"scrollMarginRight",
	"scrollMarginTop",
	"scrollMarkerGroup",
	"scrollPadding",
	"scrollPaddingBlock",
	"scrollPaddingBlockEnd",
	"scrollPaddingBlockStart",
	"scrollPaddingBottom",
	"scrollPaddingInline",
	"scrollPaddingInlineEnd",
	"scrollPaddingInlineStart",
	"scrollPaddingLeft",
	"scrollPaddingRight",
	"scrollPaddingTop",
	"scrollSnapAlign",
	"scrollSnapStop",
	"scrollSnapType",
	"scrollTargetGroup",
	"scrollTimeline",
	"scrollTimelineAxis",
	"scrollTimelineName",
	"scrollbarColor",
	"scrollbarGutter",
	"scrollbarWidth",
	"shapeImageThreshold",
	"shapeInside",
	"shapeMargin",
	"shapeOutside",
	"shapePadding",
	"shapeRendering",
	"shapeSubtract",
	"sliderOrientation",
	"spatialNavigationAction",
	"spatialNavigationContain",
	"spatialNavigationFunction",
	"speak",
	"speakAs",
	"stopColor",
	"stopOpacity",
	"stringSet",
	"stroke",
	"strokeAlign",
	"strokeAlignment",
	"strokeBreak",
	"strokeColor",
	"strokeDashCorner",
	"strokeDashJustify",
	"strokeDashadjust",
	"strokeDasharray",
	"strokeDashcorner",
	"strokeDashoffset",
	"strokeImage",
	"strokeLinecap",
	"strokeLinejoin",
	"strokeMiterlimit",
	"strokeOpacity",
	"strokeOrigin",
	"strokePosition",
	"strokeRepeat",
	"strokeSize",
	"strokeWidth",
	"tabSize",
	"tableLayout",
	"textAlign",
	"textAlignAll",
	"textAlignLast",
	"textAnchor",
	"textAutospace",
	"textBox",
	"textBoxEdge",
	"textBoxTrim",
	"textCombineUpright",
	"textDecoration",
	"textDecorationColor",
	"textDecorationInset",
	"textDecorationLine",
	"textDecorationSkip",
	"textDecorationSkipBox",
	"textDecorationSkipInk",
	"textDecorationSkipSelf",
	"textDecorationSkipSpaces",
	"textDecorationStyle",
	"textDecorationThickness",
	"textEmphasis",
	"textEmphasisColor",
	"textEmphasisPosition",
	"textEmphasisSkip",
	"textEmphasisStyle",
	"textGroupAlign",
	"textIndent",
	"textJustify",
	"textOrientation",
	"textOverflow",
	"textRendering",
	"textShadow",
	"textSizeAdjust",
	"textSpacing",
	"textSpacingTrim",
	"textTransform",
	"textUnderlineOffset",
	"textUnderlinePosition",
	"textWrap",
	"textWrapMode",
	"textWrapStyle",
	"timelineScope",
	"timelineTrigger",
	"timelineTriggerExitRange",
	"timelineTriggerExitRangeEnd",
	"timelineTriggerExitRangeStart",
	"timelineTriggerName",
	"timelineTriggerRange",
	"timelineTriggerRangeEnd",
	"timelineTriggerRangeStart",
	"timelineTriggerSource",
	"top",
	"touchAction",
	"transform",
	"transformBox",
	"transformOrigin",
	"transformStyle",
	"transition",
	"transitionBehavior",
	"transitionDelay",
	"transitionDuration",
	"transitionProperty",
	"transitionTimingFunction",
	"translate",
	"triggerScope",
	"unicodeBidi",
	"userSelect",
	"vectorEffect",
	"verticalAlign",
	"viewTimeline",
	"viewTimelineAxis",
	"viewTimelineInset",
	"viewTimelineName",
	"viewTransitionClass",
	"viewTransitionGroup",
	"viewTransitionName",
	"viewTransitionScope",
	"visibility",
	"voiceBalance",
	"voiceDuration",
	"voiceFamily",
	"voicePitch",
	"voiceRange",
	"voiceRate",
	"voiceStress",
	"voiceVolume",
	"whiteSpace",
	"whiteSpaceCollapse",
	"whiteSpaceTrim",
	"widows",
	"width",
	"willChange",
	"wordBreak",
	"wordSpaceTransform",
	"wordSpacing",
	"wordWrap",
	"wrapAfter",
	"wrapBefore",
	"wrapFlow",
	"wrapInside",
	"wrapThrough",
	"writingMode",
	"x",
	"y",
	"zIndex",
	"zoom"
]);
/**
* Converts a camelCase string to kebab-case.
*/
function camelToKebab(str) {
	return str.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}
function getUnitForProperty(propertyName) {
	return propertyName in propertyUnits ? propertyUnits[propertyName] : void 0;
}
/**
* Converts a CSS-like value to its string representation.
* For properties with known units, numbers are automatically suffixed.
*/
function formatValue(value, propertyName, maxDepth = 10) {
	if (maxDepth <= 0) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number") {
		const unit = getUnitForProperty(propertyName);
		if (unit === "%") return `${value * 100}${unit}`;
		if (value === 0) return "0";
		return unit ? `${value}${unit}` : value.toString();
	}
	return formatValue(value.value, propertyName, maxDepth - 1);
}
/**
* Checks if a property name is a CSS custom property (variable).
*/
function isCssVariableName(key) {
	return key.startsWith("--");
}
/**
* Converts a CSS-like value to a string for use as a CSS variable value.
* @param value - The value to convert (string, number, or wrapped value)
* @param maxDepth - Maximum recursion depth for evaluating the value
* @returns The string representation
*/
function asVar(value, maxDepth = 10) {
	if (maxDepth <= 0) return "";
	switch (typeof value) {
		case "string": return value;
		case "number": return value.toString();
		default: return asVar(value.value, maxDepth - 1);
	}
}
/**
* Checks if a property name is a known CSS property.
*/
function isKnownPropertyName(key) {
	return knownPropertyNames.has(key);
}
/**
* Converts a value to a CSS property string.
* Automatically appends units to numeric values for properties that require them.
* @param value - The value to convert
* @param key - The CSS property name
* @returns The formatted CSS value string
*/
function asKnownProp(value, key) {
	return formatValue(value, key);
}
/**
* Checks if a key represents a nested CSS selector.
*/
function isNestedSelector(key) {
	return key.includes("&");
}
/** Known at-rule prefixes that mochi-css recognizes */
const AT_RULE_PREFIXES = [
	"@media ",
	"@container ",
	"@supports ",
	"@layer "
];
/**
* Checks if a key represents a CSS at-rule (media, container, supports, layer).
*/
function isAtRuleKey(key) {
	return AT_RULE_PREFIXES.some((p) => key.startsWith(p));
}
/**
* Converts a SimpleStyleProps object to a CSS properties record.
* Transforms camelCase property names to kebab-case and applies value converters.
* @param props - The style properties object
* @returns A record of CSS property names (kebab-case) to string values
* @example
* cssFromProps({ backgroundColor: 'blue', padding: 16 })
* // { 'background-color': 'blue', 'padding': '16px' }
*/
function cssFromProps(props) {
	return Object.fromEntries(Object.entries(props).map(([key, value]) => {
		if (value === void 0) return void 0;
		if (isCssVariableName(key)) return [key, asVar(value)];
		if (isKnownPropertyName(key)) return [camelToKebab(key), asKnownProp(value, key)];
	}).filter((v) => v !== void 0));
}
/**
* Immutable CSS selector builder that handles nested selectors and CSS at-rules.
* Uses the `&` character as a placeholder for parent selector substitution.
*
* @example
* const selector = new MochiSelector(['.button'])
* selector.extend('&:hover').cssSelector // '.button:hover'
* selector.wrap('@media (min-width: 768px)').atRules // ['@media (min-width: 768px)']
*/
var MochiSelector = class MochiSelector$1 {
	/**
	* Creates a new MochiSelector instance.
	* @param cssSelectors - Array of CSS selectors (may contain `&` placeholders)
	* @param atRules - Array of full CSS at-rule strings e.g. `"@media (min-width: 768px)"`
	*/
	constructor(cssSelectors = [], atRules = []) {
		this.cssSelectors = cssSelectors;
		this.atRules = atRules;
	}
	/**
	* Gets the combined CSS selector string.
	* Multiple selectors are joined with commas.
	* @returns The CSS selector, or "*" if no selectors are defined
	*/
	get cssSelector() {
		if (this.cssSelectors.length === 0) return "*";
		return this.cssSelectors.join(", ");
	}
	/**
	* Substitutes all `&` placeholders with the given root selector.
	* @param root - The selector to replace `&` with
	* @returns A new MochiSelector with substituted selectors
	*/
	substitute(root) {
		return new MochiSelector$1(this.cssSelectors.map((selector) => selector.replace(/&/g, root)), this.atRules);
	}
	/**
	* Extends this selector by nesting a child selector.
	* The `&` in the child selector is replaced with each parent selector.
	* @param child - The child selector pattern (must contain `&`)
	* @returns A new MochiSelector with the extended selectors
	* @example
	* new MochiSelector(['.btn']).extend('&:hover') // '.btn:hover'
	* new MochiSelector(['.btn']).extend('& .icon') // '.btn .icon'
	*/
	extend(child) {
		if (!isNestedSelector(child)) return this;
		const children = MochiSelector$1.split(child);
		return new MochiSelector$1(this.cssSelectors.flatMap((parentSelector) => children.map((childSelector) => {
			return childSelector.replace(/&/g, parentSelector);
		})), this.atRules);
	}
	/**
	* Wraps this selector with a CSS at-rule.
	* @param atRule - The full at-rule string (e.g. `"@media (min-width: 768px)"`)
	* @returns A new MochiSelector with the added at-rule, or unchanged if not a known at-rule
	* @example
	* selector.wrap('@media (min-width: 768px)') // Adds media query
	* selector.wrap('@container sidebar (min-width: 300px)') // Adds container query
	*/
	wrap(atRule) {
		if (!isAtRuleKey(atRule)) return this;
		return new MochiSelector$1(this.cssSelectors, [...this.atRules, atRule]);
	}
	/**
	* Splits a comma-separated selector string into individual selectors.
	* @param selector - The selector string to split
	* @returns Array of individual selector strings
	*/
	static split(selector) {
		return [selector];
	}
};
/**
* Hashing utilities for generating short, deterministic class names.
* Uses djb2 algorithm for fast string hashing.
* @module hash
*/
/** Characters used for base-62 encoding (css-name safe variant of base-64) */
const hashBase = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const base = 64;
/**
* Converts a number to a base-62 string representation.
* @param num - The number to convert
* @param maxLength - Optional maximum length of the output string
* @returns Base-62 encoded string representation of the number
*/
function numberToBase62(num, maxLength) {
	let out = "";
	while (num > 0 && out.length < (maxLength ?? Infinity)) {
		out = hashBase[num % base] + out;
		num = Math.floor(num / base);
	}
	return out.length > 0 ? out : "0";
}
/**
* Generates a short hash string from input using the djb2 algorithm.
* Used to create unique, deterministic CSS class names from style content.
* @param input - The string to hash
* @param length - Maximum length of the hash output (default: 8)
* @returns A short, css-safe hash string
* @example
* shortHash("color: red;") // Returns something like "A1b2C3d4"
*/
function shortHash(input, length = 8) {
	let h = 5381;
	for (let i = 0; i < input.length; i++) h = h * 33 ^ input.charCodeAt(i);
	h >>>= 0;
	return numberToBase62(h, length);
}
/**
* String comparison utilities for deterministic sorting.
* Used internally to ensure consistent CSS output order.
* @module compare
*/
/**
* Compares two strings lexicographically.
*/
function compareString(a, b) {
	return a < b ? -1 : a === b ? 0 : 1;
}
/**
* Compares two tuples by their first element (string key).
* Useful for sorting Object.entries() results.
*/
function compareStringKey(a, b) {
	return compareString(a[0], b[0]);
}
/**
* Creates a comparator function for objects with a specific string property.
* @param name - The property name to compare by
* @returns A comparator function that compares objects by the specified property
* @example
* const items = [{ key: 'b' }, { key: 'a' }]
* items.sort(stringPropComparator('key')) // [{ key: 'a' }, { key: 'b' }]
*/
function stringPropComparator(name) {
	return (a, b) => compareString(a[name], b[name]);
}
/**
* Represents a single CSS rule block with properties and a selector.
* Handles conversion to CSS string format and hash generation.
*/
var CssObjectSubBlock = class CssObjectSubBlock$1 {
	/**
	* Creates a new CSS sub-block.
	* @param cssProps - Map of CSS property names (kebab-case) to values
	* @param selector - The selector this block applies to
	*/
	constructor(cssProps, selector) {
		this.cssProps = cssProps;
		this.selector = selector;
	}
	/**
	* Computes a deterministic hash of this block's CSS content.
	* Used for generating unique class names.
	*/
	get hash() {
		return shortHash(this.asCssString("&"));
	}
	/**
	* Converts this block to a CSS string.
	* Handles at-rule wrapping (media, container, supports, layer) if present.
	* Multiple at-rules are nested in order.
	* @param root - The root selector to substitute for `&`
	* @returns Formatted CSS string
	*/
	asCssString(root) {
		const selector = this.selector.substitute(root);
		const atRules = selector.atRules;
		const innerIndent = "    ".repeat(atRules.length);
		const props = Object.entries(this.cssProps).toSorted(compareStringKey).map(([k, v]) => `${innerIndent}    ${k}: ${v};\n`).join("");
		let result = `${innerIndent}${selector.cssSelector} {\n${props}${innerIndent}}`;
		for (let i = atRules.length - 1; i >= 0; i--) {
			const outerIndent = "    ".repeat(i);
			result = `${outerIndent}${atRules[i]} {\n${result}\n${outerIndent}}`;
		}
		return result;
	}
	/**
	* Parses StyleProps into an array of CSS sub-blocks.
	* Recursively processes nested selectors and media queries.
	* Output order is deterministic for consistent hash generation.
	*
	* @param props - The style properties to parse
	* @param selector - The parent selector context (defaults to `&`)
	* @returns Non-empty array of sub-blocks (main block first, then nested)
	*/
	static fromProps(props, selector) {
		selector ??= new MochiSelector(["&"]);
		const cssProps = {};
		const propsToProcess = [];
		for (const [key, value] of Object.entries(props)) {
			if (value === void 0) continue;
			if (isCssVariableName(key)) {
				cssProps[key] = asVar(value);
				continue;
			}
			if (isKnownPropertyName(key)) {
				cssProps[camelToKebab(key)] = asKnownProp(value, key);
				continue;
			}
			if (isNestedSelector(key)) {
				propsToProcess.push({
					key,
					props: value,
					selector: selector.extend(key)
				});
				continue;
			}
			if (isAtRuleKey(key)) {
				propsToProcess.push({
					key,
					props: value,
					selector: selector.wrap(key)
				});
				continue;
			}
			if (process.env["NODE_ENV"] !== "production") console.warn(`[mochi-css] Unknown style property "${key}" will be ignored`);
		}
		return [new CssObjectSubBlock$1(cssProps, selector), ...propsToProcess.toSorted(stringPropComparator("key")).flatMap(({ props: props$1, selector: selector$1 }) => CssObjectSubBlock$1.fromProps(props$1, selector$1))];
	}
};
/**
* Represents an abstract CSS block definition.
* Contains one or more sub-blocks for nested selectors and media queries.
*/
var CssObjectBlock = class {
	/** The generated unique class name for this block */
	className;
	/** All sub-blocks (main styles and nested/media rules) */
	subBlocks = [];
	/**
	* Creates a new CSS block from style properties.
	* Generates a unique class name based on the content hash.
	* @param styles - The style properties to compile
	*/
	constructor(styles) {
		const blocks = CssObjectSubBlock.fromProps(styles);
		this.className = "c" + shortHash(blocks.map((b) => b.hash).join("+"));
		this.subBlocks = blocks;
	}
	/**
	* Gets the CSS class selector for this block.
	*/
	get selector() {
		return `.${this.className}`;
	}
	/**
	* Converts style block to a CSS string.
	* @param root - The root selector to scope styles to
	* @returns Complete CSS string for this block
	*/
	asCssString(root) {
		return this.subBlocks.map((b) => b.asCssString(new MochiSelector([root]).extend(`&.${this.className}`).cssSelector)).join("\n\n");
	}
};
/**
* Complete CSS object representation with main and variant styles.
*
* @template V - The variant definitions type
*
* @example
* const obj = new CSSObject({
*   color: 'blue',
*   variants: {
*     size: {
*       small: { fontSize: 12 },
*       large: { fontSize: 18 }
*     }
*   },
*   defaultVariants: { size: 'small' }
* })
* obj.asCssString() // Returns complete CSS with all variants
*/
var CSSObject = class {
	/** The main style block (non-variant styles) */
	mainBlock;
	/** Compiled blocks for each variant option */
	variantBlocks;
	/** Default variant selections */
	variantDefaults;
	/** Compound variant conditions and their parsed sub-blocks */
	compoundVariants;
	/**
	* Creates a new CSSObject from style props.
	* Compiles main styles and all variant options into CSS blocks.
	*/
	constructor({ variants, defaultVariants, compoundVariants,...props }) {
		this.mainBlock = new CssObjectBlock(props);
		this.variantBlocks = {};
		this.variantDefaults = defaultVariants ?? {};
		this.compoundVariants = [];
		if (variants) for (const variantGroupName in variants) {
			this.variantBlocks[variantGroupName] = {};
			const variantGroup = variants[variantGroupName];
			for (const variantItemName in variantGroup) this.variantBlocks[variantGroupName][variantItemName] = new CssObjectBlock(variantGroup[variantItemName] ?? {});
		}
		if (compoundVariants) for (const compound of compoundVariants) {
			const { css: styles,...conditions } = compound;
			this.compoundVariants.push({
				conditions,
				subBlocks: CssObjectSubBlock.fromProps(styles)
			});
		}
	}
	/**
	* Serializes the entire CSS object to a CSS string.
	* Outputs main block first, then all variant blocks in sorted order.
	* @returns Complete CSS string ready for injection into a stylesheet
	*/
	asCssString() {
		return [
			this.mainBlock.asCssString(this.mainBlock.selector),
			...Object.entries(this.variantBlocks).toSorted(compareStringKey).flatMap(([_, b]) => Object.entries(b).toSorted(compareStringKey)).map(([_, b]) => b.asCssString(this.mainBlock.selector)),
			...this.compoundVariants.flatMap(({ conditions, subBlocks }) => {
				const selectorParts = [];
				for (const [variantName, optionName] of Object.entries(conditions).toSorted(compareStringKey)) {
					const selector = this.variantBlocks[variantName]?.[optionName]?.selector;
					if (selector === void 0) return [];
					selectorParts.push(selector);
				}
				const combinedSelector = `${this.mainBlock.selector}${selectorParts.join("")}`;
				return subBlocks.map((b) => b.asCssString(combinedSelector));
			})
		].join("\n\n");
	}
};
/**
* Runtime representation of a CSS style definition with variant support.
* Holds generated class names and provides methods to compute the final
* className string based on selected variants.
*
* @template V - The variant definitions type mapping variant names to their options
*
* @example
* const styles = MochiCSS.from(new CSSObject({
*   color: 'blue',
*   variants: { size: { small: { fontSize: 12 }, large: { fontSize: 18 } } }
* }))
* styles.variant({ size: 'large' }) // Returns combined class names
*/
const MOCHI_CSS_TYPEOF = Symbol.for("mochi-css.MochiCSS");
function isMochiCSS(value) {
	return typeof value === "object" && value !== null && value["$$typeof"] === MOCHI_CSS_TYPEOF;
}
var MochiCSS = class MochiCSS$1 {
	$$typeof = MOCHI_CSS_TYPEOF;
	/**
	* Creates a new MochiCSS instance.
	* @param classNames - Base class names to always include
	* @param variantClassNames - Mapping of variant names to option class names
	* @param defaultVariants - Default variant selections when not specified
	*/
	constructor(classNames, variantClassNames, defaultVariants) {
		this.classNames = classNames;
		this.variantClassNames = variantClassNames;
		this.defaultVariants = defaultVariants;
	}
	/**
	* Computes the final className string based on variant selections.
	* Compound variants are handled purely via CSS combined selectors,
	* so no runtime matching is needed here.
	* @param props - Variant selections
	* @returns Combined className string for use in components
	*/
	variant(props) {
		const keys = new Set([...Object.keys(props), ...Object.keys(this.defaultVariants)].filter((k) => k in this.variantClassNames));
		return clsx(this.classNames, ...keys.values().map((k) => {
			const variantGroup = this.variantClassNames[k];
			if (!variantGroup) return false;
			const variantKey = ((k in props ? props[k] : void 0) ?? this.defaultVariants[k])?.toString();
			if (variantKey == null) return false;
			const selectedClassname = variantGroup[variantKey];
			if (selectedClassname !== void 0) return selectedClassname;
			const defaultKey = this.defaultVariants[k];
			if (defaultKey == null) return false;
			return variantGroup[defaultKey.toString()];
		}));
	}
	/**
	* Creates a MochiCSS instance from a CSSObject.
	* Extracts class names from the compiled CSS blocks.
	* @template V - The variant definitions type
	* @param object - The compiled CSSObject to extract from
	* @returns A new MochiCSS instance with the extracted class names
	*/
	static from(object) {
		return new MochiCSS$1([object.mainBlock.className], Object.fromEntries(Object.entries(object.variantBlocks).map(([key, variantOptions]) => {
			return [key, Object.fromEntries(Object.entries(variantOptions).map(([optionKey, block]) => {
				return [optionKey, block.className];
			}))];
		})), object.variantDefaults);
	}
};
/**
* Creates a CSS style definition.
* The primary API for defining styles in Mochi-CSS.
*
* @template V - Tuple of variant definition types
* @param props - One or more style objects or existing MochiCSS instances to merge
* @returns A MochiCSS instance with all styles and variants combined
*
* @example
* // Simple usage
* const button = css({ padding: 8, borderRadius: 4 })
*
* @example
* // With variants
* const button = css({
*   padding: 8,
*   variants: {
*     size: {
*       small: { padding: 4 },
*       large: { padding: 16 }
*     }
*   },
*   defaultVariants: { size: 'small' }
* })
* button.variant({ size: 'large' }) // Get class names for large size
*
* @example
* // Merging multiple styles
* const combined = css(baseStyles, additionalStyles)
*/
const emptyMochiCSS = new MochiCSS([], {}, {});
/**
* Merges multiple MochiCSS instances into a single one, combining their
* class names, variant class names, and default variants.
* @param instances - The MochiCSS instances to merge
* @returns A new MochiCSS instance with all styles combined
*/
function mergeMochiCss(instances) {
	if (instances.length === 0) return emptyMochiCSS;
	return new MochiCSS(instances.flatMap((c) => c.classNames), instances.reduce((a, b) => Object.assign(a, b.variantClassNames), {}), instances.reduce((a, b) => Object.assign(a, b.defaultVariants), {}));
}
function css(...props) {
	const cssToMerge = [];
	for (const p of props) {
		if (p == null || typeof p !== "object") continue;
		if (p instanceof MochiCSS) cssToMerge.push(p);
		else cssToMerge.push(MochiCSS.from(new CSSObject(p)));
	}
	return mergeMochiCss(cssToMerge);
}
var KeyframesObject = class KeyframesObject$1 {
	name;
	body;
	constructor(stops) {
		this.body = KeyframesObject$1.generateBody(stops);
		this.name = "kf" + shortHash(this.body);
	}
	asCssString() {
		return `@keyframes ${this.name} {\n${this.body}\n}`;
	}
	static generateBody(stops) {
		return Object.entries(stops).toSorted(compareStringKey).map(([stopKey, props]) => {
			const cssProps = cssFromProps(props);
			return `    ${stopKey} {\n${Object.entries(cssProps).toSorted(compareStringKey).map(([k, v]) => `        ${k}: ${v};`).join("\n")}\n    }`;
		}).join("\n\n");
	}
};
var MochiKeyframes = class MochiKeyframes$1 {
	constructor(name) {
		this.name = name;
	}
	toString() {
		return this.name;
	}
	get value() {
		return this.name;
	}
	static from(object) {
		return new MochiKeyframes$1(object.name);
	}
};
function keyframes(stops) {
	return MochiKeyframes.from(new KeyframesObject(stops));
}
/**
* Wraps a condition in parentheses if not already wrapped.
*/
function wrapParens(condition) {
	const trimmed = condition.trim();
	if (trimmed.startsWith("(") && trimmed.endsWith(")")) return trimmed;
	return `(${trimmed})`;
}
function mediaFn(condition) {
	return `@media ${wrapParens(condition)}`;
}
mediaFn.and = function(...conditions) {
	return `@media ${conditions.map(wrapParens).join(" and ")}`;
};
mediaFn.or = function(...conditions) {
	return `@media ${conditions.map(wrapParens).join(", ")}`;
};
Object.defineProperties(mediaFn, {
	dark: {
		get: () => "@media (prefers-color-scheme: dark)",
		enumerable: true
	},
	light: {
		get: () => "@media (prefers-color-scheme: light)",
		enumerable: true
	},
	motion: {
		get: () => "@media (prefers-reduced-motion: no-preference)",
		enumerable: true
	},
	print: {
		get: () => "@media print",
		enumerable: true
	}
});
function containerFn(condition) {
	return `@container ${wrapParens(condition)}`;
}
containerFn.named = function(name, condition) {
	return `@container ${name} ${wrapParens(condition)}`;
};
function supportsFn(condition) {
	return `@supports ${wrapParens(condition)}`;
}
supportsFn.not = function(condition) {
	return `@supports not ${wrapParens(condition)}`;
};
supportsFn.and = function(...conditions) {
	return `@supports ${conditions.map(wrapParens).join(" and ")}`;
};
supportsFn.or = function(...conditions) {
	return `@supports ${conditions.map(wrapParens).join(" or ")}`;
};

//#endregion
//#region src/preprocess/expandUtils.ts
function expandUtils(style, config) {
	const result = {};
	for (const [key, value] of Object.entries(style)) {
		const util = config.utils?.[key];
		if (util) {
			const expandedRecursive = expandUtils(util(value), config);
			Object.assign(result, expandedRecursive);
		} else if (value !== null && typeof value === "object" && !Array.isArray(value)) result[key] = expandUtils(value, config);
		else result[key] = value;
	}
	return result;
}

//#endregion
//#region src/preprocess/expandBreakpoints.ts
function expandBreakpoints(style, config) {
	const result = {};
	for (const [key, value] of Object.entries(style)) if (key.startsWith("@") && config.media?.[key.slice(1)]) {
		const newKey = `@media ${config.media[key.slice(1)]}`;
		result[newKey] = value !== null && typeof value === "object" && !Array.isArray(value) ? expandBreakpoints(value, config) : value;
	} else if (value !== null && typeof value === "object" && !Array.isArray(value)) result[key] = expandBreakpoints(value, config);
	else result[key] = value;
	return result;
}
function expandBreakpoint(bp, config) {
	const name = bp.startsWith("@") ? bp.slice(1) : bp;
	const condition = config.media?.[name];
	if (!condition) return void 0;
	return `@media ${condition}`;
}

//#endregion
//#region src/preprocess/resolveScopedTokens.ts
function resolveScopedTokens(style, config) {
	const prefix = config.prefix ? `${config.prefix}-` : "";
	const result = {};
	for (const [key, value] of Object.entries(style)) if (key.startsWith("$$")) {
		const varName = `--${prefix}${key.slice(2)}`;
		result[varName] = value;
	} else if (value !== null && typeof value === "object" && !Array.isArray(value)) result[key] = resolveScopedTokens(value, config);
	else if (typeof value === "string" && value.startsWith("$$")) result[key] = `var(${`--${prefix}${value.slice(2)}`})`;
	else result[key] = value;
	return result;
}

//#endregion
//#region src/preprocess/resolveTokens.ts
function resolveValue(key, value, config) {
	if (!value.startsWith("$")) return value;
	const tokenName = value.slice(1);
	const scale = config.themeMap?.[key];
	if (!scale) return value;
	return `var(--${scale}-${tokenName})`;
}
function resolveTokens(style, config) {
	const result = {};
	for (const [key, value] of Object.entries(style)) if (value !== null && typeof value === "object" && !Array.isArray(value)) result[key] = resolveTokens(value, config);
	else if (typeof value === "string") result[key] = resolveValue(key, value, config);
	else result[key] = value;
	return result;
}

//#endregion
//#region src/preprocess/index.ts
function preprocess(style, config) {
	let result = expandUtils(style, config);
	result = expandBreakpoints(result, config);
	result = resolveScopedTokens(result, config);
	result = resolveTokens(result, config);
	return result;
}

//#endregion
//#region src/runtime/css.ts
function runtimeCss(args, config) {
	return css(...args.map((arg) => {
		if (arg instanceof MochiCSS) return arg;
		return preprocess(arg, config);
	}));
}

//#endregion
//#region src/runtime/keyframes.ts
function runtimeKeyframes(stops) {
	return keyframes(stops);
}

//#endregion
//#region src/runtime/globalCss.ts
function noop() {}
function runtimeGlobalCss(_styles) {
	return noop;
}

//#endregion
//#region src/runtime/createTheme.ts
function buildThemeClassName(tokens) {
	return `th-${shortHash(JSON.stringify(Object.fromEntries(Object.entries(tokens).sort(([a], [b]) => a.localeCompare(b)).map(([scale, vals]) => [scale, Object.fromEntries(Object.entries(vals).sort(([a], [b]) => a.localeCompare(b)))]))))}`;
}
function runtimeCreateTheme(tokens, config) {
	const prefix = config.prefix ? `${config.prefix}-` : "";
	return {
		className: buildThemeClassName(tokens),
		...Object.fromEntries(Object.entries(tokens).map(([scale, vals]) => [scale, Object.fromEntries(Object.entries(vals).map(([token]) => [token, `var(--${prefix}${scale}-${token})`]))]))
	};
}

//#endregion
//#region src/runtime/styled.ts
const MOCHI_CSS = Symbol("mochi-css");
const MOCHI_TARGET = Symbol("mochi-target");
function isMochiStyled(target) {
	return typeof target === "function" && MOCHI_CSS in target;
}
function extractVariantStyles(args) {
	const result = {};
	for (const arg of args) {
		const variants = arg["variants"];
		if (!variants) continue;
		for (const [vName, vOptions] of Object.entries(variants)) {
			result[vName] ??= {};
			for (const [optName, styles] of Object.entries(vOptions)) result[vName][optName] = styles;
		}
	}
	return result;
}
function runtimeStyled(target, args, config) {
	const renderTarget = isMochiStyled(target) ? target[MOCHI_TARGET] : target;
	const preprocessedArgs = args.map((arg) => {
		if (isMochiCSS(arg)) return arg;
		return preprocess(arg, config);
	});
	const flatArgs = preprocessedArgs;
	const cssArgs = isMochiStyled(target) ? [target[MOCHI_CSS], ...flatArgs] : [...flatArgs];
	const variantStyles = extractVariantStyles(preprocessedArgs.filter((a) => !isMochiCSS(a)));
	const mochiInstance = css(...cssArgs);
	const variantKeys = new Set(Object.keys(mochiInstance.variantClassNames));
	function StitchesComponent(props) {
		const { as: asProp, className, css: cssProp,...rest } = props;
		const variantProps = {};
		const responsiveVariantProps = {};
		const restProps = {};
		for (const [key, value] of Object.entries(rest)) if (variantKeys.has(key)) {
			if (typeof value === "string" || typeof value === "boolean") variantProps[key] = String(value);
			else if (value !== null && typeof value === "object" && !Array.isArray(value)) responsiveVariantProps[key] = value;
		} else restProps[key] = value;
		const variantClassName = mochiInstance.variant(variantProps);
		const dynamicStyles = [];
		for (const [vName, responsive] of Object.entries(responsiveVariantProps)) for (const [bp, value] of Object.entries(responsive)) {
			const mediaQuery = expandBreakpoint(bp, config);
			if (!mediaQuery) continue;
			const variantStyle = variantStyles[vName]?.[value];
			if (!variantStyle) continue;
			const block = new CssObjectBlock({ [mediaQuery]: variantStyle });
			dynamicStyles.push({
				className: block.className,
				css: block.asCssString(block.selector)
			});
		}
		if (cssProp !== void 0) {
			const block = new CssObjectBlock(preprocess(cssProp, config));
			dynamicStyles.push({
				className: block.className,
				css: block.asCssString(block.selector)
			});
		}
		const allClassNames = clsx(variantClassName, dynamicStyles.map((s) => s.className), className);
		const styleElements = dynamicStyles.map((s) => createElement("style", {
			key: s.className,
			href: s.className,
			precedence: "medium"
		}, s.css));
		const element = asProp ?? renderTarget;
		return createElement(Fragment, null, ...styleElements, createElement(element, {
			className: allClassNames,
			...restProps
		}));
	}
	const component = StitchesComponent;
	component[MOCHI_CSS] = mochiInstance;
	component[MOCHI_TARGET] = renderTarget;
	Object.defineProperty(component, "selector", {
		get() {
			const cls = mochiInstance.classNames[0];
			return cls !== void 0 ? `.${cls}` : "";
		},
		enumerable: false
	});
	component.toString = function() {
		return component.selector;
	};
	return component;
}

//#endregion
//#region src/createStitches.ts
function createStitches(config) {
	const resolvedConfig = {
		...config,
		themeMap: config.themeMap ?? defaultThemeMap
	};
	return {
		config: resolvedConfig,
		theme: buildThemeRefs(resolvedConfig.theme ?? {}, resolvedConfig.prefix),
		css(...args) {
			return runtimeCss(args, resolvedConfig);
		},
		styled(target, ...args) {
			return runtimeStyled(target, args, resolvedConfig);
		},
		keyframes(stops) {
			return runtimeKeyframes(stops);
		},
		globalCss(_styles) {
			return runtimeGlobalCss(_styles);
		},
		createTheme(tokens) {
			return runtimeCreateTheme(tokens, resolvedConfig);
		}
	};
}

//#endregion
export { buildThemeClassName, buildThemeRefs, createStitches, defaultThemeMap, expandBreakpoint, preprocess };
//# sourceMappingURL=index.mjs.map