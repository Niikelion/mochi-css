import clsx from "clsx";
import "react";
import "rolldown";
import "@swc/core";
import dedent from "dedent";

//#region ../builder/dist/index.mjs
const propertyUnits$1 = {
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
const knownPropertyNames$1 = new Set([
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
function camelToKebab$1(str) {
	return str.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}
function getUnitForProperty$1(propertyName) {
	return propertyName in propertyUnits$1 ? propertyUnits$1[propertyName] : void 0;
}
/**
* Converts a CSS-like value to its string representation.
* For properties with known units, numbers are automatically suffixed.
*/
function formatValue$1(value, propertyName, maxDepth = 10) {
	if (maxDepth <= 0) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number") {
		const unit = getUnitForProperty$1(propertyName);
		if (unit === "%") return `${value * 100}${unit}`;
		if (value === 0) return "0";
		return unit ? `${value}${unit}` : value.toString();
	}
	return formatValue$1(value.value, propertyName, maxDepth - 1);
}
/**
* Checks if a property name is a CSS custom property (variable).
*/
function isCssVariableName$1(key) {
	return key.startsWith("--");
}
/**
* Converts a CSS-like value to a string for use as a CSS variable value.
* @param value - The value to convert (string, number, or wrapped value)
* @param maxDepth - Maximum recursion depth for evaluating the value
* @returns The string representation
*/
function asVar$1(value, maxDepth = 10) {
	if (maxDepth <= 0) return "";
	switch (typeof value) {
		case "string": return value;
		case "number": return value.toString();
		default: return asVar$1(value.value, maxDepth - 1);
	}
}
/**
* Checks if a property name is a known CSS property.
*/
function isKnownPropertyName$1(key) {
	return knownPropertyNames$1.has(key);
}
/**
* Converts a value to a CSS property string.
* Automatically appends units to numeric values for properties that require them.
* @param value - The value to convert
* @param key - The CSS property name
* @returns The formatted CSS value string
*/
function asKnownProp$1(value, key) {
	return formatValue$1(value, key);
}
/**
* Checks if a key represents a nested CSS selector.
*/
function isNestedSelector$1(key) {
	return key.includes("&");
}
/** Known at-rule prefixes that mochi-css recognizes */
const AT_RULE_PREFIXES$1 = [
	"@media ",
	"@container ",
	"@supports ",
	"@layer "
];
/**
* Checks if a key represents a CSS at-rule (media, container, supports, layer).
*/
function isAtRuleKey$1(key) {
	return AT_RULE_PREFIXES$1.some((p) => key.startsWith(p));
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
function cssFromProps$1(props) {
	return Object.fromEntries(Object.entries(props).map(([key, value]) => {
		if (value === void 0) return void 0;
		if (isCssVariableName$1(key)) return [key, asVar$1(value)];
		if (isKnownPropertyName$1(key)) return [camelToKebab$1(key), asKnownProp$1(value, key)];
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
var MochiSelector$1 = class MochiSelector$1$1 {
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
		return new MochiSelector$1$1(this.cssSelectors.map((selector) => selector.replace(/&/g, root)), this.atRules);
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
		if (!isNestedSelector$1(child)) return this;
		const children = MochiSelector$1$1.split(child);
		return new MochiSelector$1$1(this.cssSelectors.flatMap((parentSelector) => children.map((childSelector) => {
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
		if (!isAtRuleKey$1(atRule)) return this;
		return new MochiSelector$1$1(this.cssSelectors, [...this.atRules, atRule]);
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
const hashBase$2 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const base$2 = 64;
/**
* Converts a number to a base-62 string representation.
* @param num - The number to convert
* @param maxLength - Optional maximum length of the output string
* @returns Base-62 encoded string representation of the number
*/
function numberToBase62$2(num, maxLength) {
	let out = "";
	while (num > 0 && out.length < (maxLength ?? Infinity)) {
		out = hashBase$2[num % base$2] + out;
		num = Math.floor(num / base$2);
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
function shortHash$2(input, length = 8) {
	let h = 5381;
	for (let i = 0; i < input.length; i++) h = h * 33 ^ input.charCodeAt(i);
	h >>>= 0;
	return numberToBase62$2(h, length);
}
/**
* String comparison utilities for deterministic sorting.
* Used internally to ensure consistent CSS output order.
* @module compare
*/
/**
* Compares two strings lexicographically.
*/
function compareString$1(a, b) {
	return a < b ? -1 : a === b ? 0 : 1;
}
/**
* Compares two tuples by their first element (string key).
* Useful for sorting Object.entries() results.
*/
function compareStringKey$1(a, b) {
	return compareString$1(a[0], b[0]);
}
/**
* Creates a comparator function for objects with a specific string property.
* @param name - The property name to compare by
* @returns A comparator function that compares objects by the specified property
* @example
* const items = [{ key: 'b' }, { key: 'a' }]
* items.sort(stringPropComparator('key')) // [{ key: 'a' }, { key: 'b' }]
*/
function stringPropComparator$1(name) {
	return (a, b) => compareString$1(a[name], b[name]);
}
/**
* Represents a single CSS rule block with properties and a selector.
* Handles conversion to CSS string format and hash generation.
*/
var CssObjectSubBlock$1 = class CssObjectSubBlock$1$1 {
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
		return shortHash$2(this.asCssString("&"));
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
		const props = Object.entries(this.cssProps).toSorted(compareStringKey$1).map(([k, v]) => `${innerIndent}    ${k}: ${v};\n`).join("");
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
		selector ??= new MochiSelector$1(["&"]);
		const cssProps = {};
		const propsToProcess = [];
		for (const [key, value] of Object.entries(props)) {
			if (value === void 0) continue;
			if (isCssVariableName$1(key)) {
				cssProps[key] = asVar$1(value);
				continue;
			}
			if (isKnownPropertyName$1(key)) {
				cssProps[camelToKebab$1(key)] = asKnownProp$1(value, key);
				continue;
			}
			if (isNestedSelector$1(key)) {
				propsToProcess.push({
					key,
					props: value,
					selector: selector.extend(key)
				});
				continue;
			}
			if (isAtRuleKey$1(key)) {
				propsToProcess.push({
					key,
					props: value,
					selector: selector.wrap(key)
				});
				continue;
			}
			if (process.env["NODE_ENV"] !== "production") console.warn(`[mochi-css] Unknown style property "${key}" will be ignored`);
		}
		return [new CssObjectSubBlock$1$1(cssProps, selector), ...propsToProcess.toSorted(stringPropComparator$1("key")).flatMap(({ props: props$1, selector: selector$1 }) => CssObjectSubBlock$1$1.fromProps(props$1, selector$1))];
	}
};
/**
* Represents an abstract CSS block definition.
* Contains one or more sub-blocks for nested selectors and media queries.
*/
var CssObjectBlock$1 = class {
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
		const blocks = CssObjectSubBlock$1.fromProps(styles);
		this.className = "c" + shortHash$2(blocks.map((b) => b.hash).join("+"));
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
		return this.subBlocks.map((b) => b.asCssString(new MochiSelector$1([root]).extend(`&.${this.className}`).cssSelector)).join("\n\n");
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
var CSSObject$1 = class {
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
		this.mainBlock = new CssObjectBlock$1(props);
		this.variantBlocks = {};
		this.variantDefaults = defaultVariants ?? {};
		this.compoundVariants = [];
		if (variants) for (const variantGroupName in variants) {
			this.variantBlocks[variantGroupName] = {};
			const variantGroup = variants[variantGroupName];
			for (const variantItemName in variantGroup) this.variantBlocks[variantGroupName][variantItemName] = new CssObjectBlock$1(variantGroup[variantItemName] ?? {});
		}
		if (compoundVariants) for (const compound of compoundVariants) {
			const { css: styles,...conditions } = compound;
			this.compoundVariants.push({
				conditions,
				subBlocks: CssObjectSubBlock$1.fromProps(styles)
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
			...Object.entries(this.variantBlocks).toSorted(compareStringKey$1).flatMap(([_, b]) => Object.entries(b).toSorted(compareStringKey$1)).map(([_, b]) => b.asCssString(this.mainBlock.selector)),
			...this.compoundVariants.flatMap(({ conditions, subBlocks }) => {
				const selectorParts = [];
				for (const [variantName, optionName] of Object.entries(conditions).toSorted(compareStringKey$1)) {
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
const MOCHI_CSS_TYPEOF$2 = Symbol.for("mochi-css.MochiCSS");
function isMochiCSS$1(value) {
	return typeof value === "object" && value !== null && value["$$typeof"] === MOCHI_CSS_TYPEOF$2;
}
new class MochiCSS$1$1 {
	$$typeof = MOCHI_CSS_TYPEOF$2;
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
		return new MochiCSS$1$1([object.mainBlock.className], Object.fromEntries(Object.entries(object.variantBlocks).map(([key, variantOptions]) => {
			return [key, Object.fromEntries(Object.entries(variantOptions).map(([optionKey, block]) => {
				return [optionKey, block.className];
			}))];
		})), object.variantDefaults);
	}
}([], {}, {});
var KeyframesObject$1 = class KeyframesObject$1$1 {
	name;
	body;
	constructor(stops) {
		this.body = KeyframesObject$1$1.generateBody(stops);
		this.name = "kf" + shortHash$2(this.body);
	}
	asCssString() {
		return `@keyframes ${this.name} {\n${this.body}\n}`;
	}
	static generateBody(stops) {
		return Object.entries(stops).toSorted(compareStringKey$1).map(([stopKey, props]) => {
			const cssProps = cssFromProps$1(props);
			return `    ${stopKey} {\n${Object.entries(cssProps).toSorted(compareStringKey$1).map(([k, v]) => `        ${k}: ${v};`).join("\n")}\n    }`;
		}).join("\n\n");
	}
};
/**
* CSS object model for global (non-scoped) styles.
* Accepts a map of CSS selectors to style objects and serializes them
* as plain CSS rules without class name scoping.
*
* @example
* const obj = new GlobalCssObject({
*   body: { margin: 0 },
*   'h1': { fontSize: 32 },
* })
* obj.asCssString() // "body {\n    margin: 0;\n}\n\nh1 {\n    font-size: 32px;\n}"
*/
var GlobalCssObject$1 = class {
	rules;
	constructor(styles) {
		this.rules = Object.entries(styles).toSorted(compareStringKey$1).map(([selector, props]) => ({
			selector,
			subBlocks: [...CssObjectSubBlock$1.fromProps(props)]
		}));
	}
	asCssString() {
		return this.rules.flatMap(({ selector, subBlocks }) => subBlocks.map((b) => b.asCssString(selector))).join("\n\n");
	}
};
/**
* Wraps a condition in parentheses if not already wrapped.
*/
function wrapParens$2(condition) {
	const trimmed = condition.trim();
	if (trimmed.startsWith("(") && trimmed.endsWith(")")) return trimmed;
	return `(${trimmed})`;
}
function mediaFn$2(condition) {
	return `@media ${wrapParens$2(condition)}`;
}
mediaFn$2.and = function(...conditions) {
	return `@media ${conditions.map(wrapParens$2).join(" and ")}`;
};
mediaFn$2.or = function(...conditions) {
	return `@media ${conditions.map(wrapParens$2).join(", ")}`;
};
Object.defineProperties(mediaFn$2, {
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
function containerFn$2(condition) {
	return `@container ${wrapParens$2(condition)}`;
}
containerFn$2.named = function(name, condition) {
	return `@container ${name} ${wrapParens$2(condition)}`;
};
function supportsFn$2(condition) {
	return `@supports ${wrapParens$2(condition)}`;
}
supportsFn$2.not = function(condition) {
	return `@supports not ${wrapParens$2(condition)}`;
};
supportsFn$2.and = function(...conditions) {
	return `@supports ${conditions.map(wrapParens$2).join(" and ")}`;
};
supportsFn$2.or = function(...conditions) {
	return `@supports ${conditions.map(wrapParens$2).join(" or ")}`;
};
function getErrorMessage(err) {
	return err instanceof Error ? err.message : String(err);
}
var VanillaCssGenerator = class {
	collectedStyles = [];
	constructor(onDiagnostic) {
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const validArgs = [];
		for (const arg of args) {
			if (arg == null || typeof arg !== "object") {
				this.onDiagnostic?.({
					code: "MOCHI_INVALID_STYLE_ARG",
					message: `Expected style object, got ${arg === null ? "null" : typeof arg}`,
					severity: "warning",
					file: source
				});
				continue;
			}
			if (isMochiCSS$1(arg)) continue;
			validArgs.push(arg);
		}
		if (validArgs.length > 0) this.collectedStyles.push({
			source,
			args: validArgs
		});
	}
	async generateStyles() {
		const filesCss = /* @__PURE__ */ new Map();
		for (const { source, args } of this.collectedStyles) {
			let css = filesCss.get(source);
			if (!css) {
				css = /* @__PURE__ */ new Set();
				filesCss.set(source, css);
			}
			for (const style of args) try {
				const styleCss = new CSSObject$1(style).asCssString();
				css.add(styleCss);
			} catch (err) {
				const message = getErrorMessage(err);
				this.onDiagnostic?.({
					code: "MOCHI_STYLE_GENERATION",
					message: `Failed to generate CSS: ${message}`,
					severity: "warning",
					file: source
				});
			}
		}
		const files = {};
		for (const [source, css] of filesCss) files[source] = [...css.values()].sort().join("\n\n");
		return { files };
	}
};
var VanillaKeyframesGenerator = class {
	collectedKeyframes = [];
	constructor(onDiagnostic) {
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const validArgs = [];
		for (const arg of args) {
			if (arg == null || typeof arg !== "object") {
				this.onDiagnostic?.({
					code: "MOCHI_INVALID_KEYFRAMES_ARG",
					message: `Expected keyframe stops object, got ${arg === null ? "null" : typeof arg}`,
					severity: "warning",
					file: source
				});
				continue;
			}
			validArgs.push(arg);
		}
		if (validArgs.length > 0) this.collectedKeyframes.push({
			source,
			args: validArgs
		});
	}
	async generateStyles() {
		const filesCss = /* @__PURE__ */ new Map();
		for (const { source, args } of this.collectedKeyframes) {
			let css = filesCss.get(source);
			if (!css) {
				css = /* @__PURE__ */ new Set();
				filesCss.set(source, css);
			}
			for (const stops of args) try {
				const kf = new KeyframesObject$1(stops);
				css.add(kf.asCssString());
			} catch (err) {
				const message = getErrorMessage(err);
				this.onDiagnostic?.({
					code: "MOCHI_KEYFRAMES_GENERATION",
					message: `Failed to generate keyframes CSS: ${message}`,
					severity: "warning",
					file: source
				});
			}
		}
		const files = {};
		for (const [source, css] of filesCss) files[source] = [...css.values()].sort().join("\n\n");
		return { files };
	}
};
var VanillaGlobalCssGenerator = class {
	collectedStyles = [];
	constructor(onDiagnostic) {
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const validArgs = [];
		for (const arg of args) {
			if (arg == null || typeof arg !== "object") {
				this.onDiagnostic?.({
					code: "MOCHI_INVALID_GLOBAL_CSS_ARG",
					message: `Expected styles object, got ${arg === null ? "null" : typeof arg}`,
					severity: "warning",
					file: source
				});
				continue;
			}
			validArgs.push(arg);
		}
		if (validArgs.length > 0) this.collectedStyles.push({
			source,
			args: validArgs
		});
	}
	async generateStyles() {
		const css = /* @__PURE__ */ new Set();
		for (const { source, args } of this.collectedStyles) for (const styles of args) try {
			css.add(new GlobalCssObject$1(styles).asCssString());
		} catch (err) {
			const message = getErrorMessage(err);
			this.onDiagnostic?.({
				code: "MOCHI_GLOBAL_CSS_GENERATION",
				message: `Failed to generate global CSS: ${message}`,
				severity: "warning",
				file: source
			});
		}
		if (css.size === 0) return {};
		return { global: [...css.values()].sort().join("\n\n") };
	}
};
var VanillaCssExtractor = class {
	importPath;
	symbolName;
	constructor(importPath, symbolName, extractor) {
		this.extractor = extractor;
		this.importPath = importPath;
		this.symbolName = symbolName;
	}
	extractStaticArgs(call) {
		return this.extractor(call);
	}
	startGeneration(onDiagnostic) {
		return new VanillaCssGenerator(onDiagnostic);
	}
};
const mochiCssFunctionExtractor = new VanillaCssExtractor("@mochi-css/vanilla", "css", (call) => call.arguments.map((a) => a.expression));
const mochiStyledFunctionExtractor = new VanillaCssExtractor("@mochi-css/vanilla", "styled", (call) => call.arguments.map((a) => a.expression).slice(1));
var VanillaKeyframesExtractor = class {
	importPath;
	symbolName;
	constructor(importPath, symbolName) {
		this.importPath = importPath;
		this.symbolName = symbolName;
	}
	extractStaticArgs(call) {
		return call.arguments.slice(0, 1).map((a) => a.expression);
	}
	startGeneration(onDiagnostic) {
		return new VanillaKeyframesGenerator(onDiagnostic);
	}
};
const mochiKeyframesFunctionExtractor = new VanillaKeyframesExtractor("@mochi-css/vanilla", "keyframes");
var VanillaGlobalCssExtractor = class {
	importPath;
	symbolName;
	constructor(importPath, symbolName) {
		this.importPath = importPath;
		this.symbolName = symbolName;
	}
	extractStaticArgs(call) {
		return call.arguments.slice(0, 1).map((a) => a.expression);
	}
	startGeneration(onDiagnostic) {
		return new VanillaGlobalCssGenerator(onDiagnostic);
	}
};
const mochiGlobalCssFunctionExtractor = new VanillaGlobalCssExtractor("@mochi-css/vanilla", "globalCss");
const ret = Symbol("ret");
function run(callback) {
	callback();
}
function visitAny(_, context) {
	context.descend(context.context);
}
const defaultVisitors = {
	stringLiteral(_node, _context) {},
	booleanLiteral(_node, _context) {},
	nullLiteral(_node, _context) {},
	numericLiteral(_node, _context) {},
	bigIntLiteral(_node, _context) {},
	regExpLiteral(_node, _context) {},
	module(node, context) {
		node.body.forEach((node$1) => visit.moduleItem(node$1, context.visitors, context.context));
	},
	moduleItem(node, context) {
		run(() => {
			switch (node.type) {
				case "ImportDeclaration":
				case "ExportDeclaration":
				case "ExportNamedDeclaration":
				case "ExportDefaultDeclaration":
				case "ExportDefaultExpression":
				case "ExportAllDeclaration":
				case "TsImportEqualsDeclaration":
				case "TsExportAssignment":
				case "TsNamespaceExportDeclaration": return visit.moduleDeclaration(node, context.visitors, context.context, true);
				default: return visit.statement(node, context.visitors, context.context, true);
			}
		});
	},
	moduleDeclaration(node, context) {
		run(() => {
			switch (node.type) {
				case "ImportDeclaration": return visit.importDeclaration(node, context.visitors, context.context, true);
				case "ExportDeclaration": return visit.exportDeclaration(node, context.visitors, context.context, true);
				case "ExportNamedDeclaration": return visit.exportNamedDeclaration(node, context.visitors, context.context, true);
				case "ExportDefaultDeclaration": return visit.exportDefaultDeclaration(node, context.visitors, context.context, true);
				case "ExportDefaultExpression": return visit.exportDefaultExpression(node, context.visitors, context.context, true);
				case "ExportAllDeclaration": return visit.exportAllDeclaration(node, context.visitors, context.context, true);
				case "TsImportEqualsDeclaration": return visit.tsImportEqualsDeclaration(node, context.visitors, context.context, true);
				case "TsExportAssignment": return visit.tsExportAssignment(node, context.visitors, context.context, true);
				case "TsNamespaceExportDeclaration": return visit.tsNamespaceExportDeclaration(node, context.visitors, context.context, true);
			}
		});
	},
	exportDeclaration(node, context) {
		visit.declaration(node.declaration, context.visitors, context.context);
	},
	exportNamedDeclaration(node, context) {
		node.specifiers.forEach((specifier) => visit.exportSpecifier(specifier, context.visitors, context.context));
		if (node.source) visit.stringLiteral(node.source, context.visitors, context.context);
		if (node.asserts) visit.objectExpression(node.asserts, context.visitors, context.context);
	},
	exportDefaultDeclaration(node, context) {
		visit.defaultDecl(node.decl, context.visitors, context.context);
	},
	exportDefaultExpression(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	exportAllDeclaration(node, context) {
		visit.stringLiteral(node.source, context.visitors, context.context);
		if (node.asserts) visit.objectExpression(node.asserts, context.visitors, context.context);
	},
	tsImportEqualsDeclaration(node, context) {
		visit.identifier(node.id, context.visitors, context.context);
		visit.tsModuleReference(node.moduleRef, context.visitors, context.context);
	},
	tsModuleReference(node, context) {
		run(() => {
			switch (node.type) {
				case "TsQualifiedName":
				case "Identifier": return visit.tsEntityName(node, context.visitors, context.context, true);
				case "TsExternalModuleReference": return visit.tsExternalModuleReference(node, context.visitors, context.context, true);
			}
		});
	},
	tsExternalModuleReference(node, context) {
		visit.stringLiteral(node.expression, context.visitors, context.context);
	},
	tsExportAssignment(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	tsNamespaceExportDeclaration(node, context) {
		visit.identifier(node.id, context.visitors, context.context);
	},
	defaultDecl(node, context) {
		run(() => {
			switch (node.type) {
				case "ClassExpression": return visit.classExpression(node, context.visitors, context.context, true);
				case "FunctionExpression": return visit.functionExpression(node, context.visitors, context.context, true);
				case "TsInterfaceDeclaration": return visit.tsInterfaceDeclaration(node, context.visitors, context.context, true);
			}
		});
	},
	exportSpecifier(node, context) {
		run(() => {
			switch (node.type) {
				case "ExportNamespaceSpecifier": return visit.exportNamespaceSpecifier(node, context.visitors, context.context, true);
				case "ExportDefaultSpecifier": return visit.exportDefaultSpecifier(node, context.visitors, context.context, true);
				case "ExportSpecifier": return visit.namedExportSpecifier(node, context.visitors, context.context, true);
			}
		});
	},
	namedExportSpecifier(node, context) {
		visit.moduleExportName(node.orig, context.visitors, context.context);
		if (node.exported) visit.moduleExportName(node.exported, context.visitors, context.context);
	},
	exportNamespaceSpecifier(node, context) {
		visit.moduleExportName(node.name, context.visitors, context.context);
	},
	moduleExportName(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "StringLiteral": return visit.stringLiteral(node, context.visitors, context.context, true);
			}
		});
	},
	exportDefaultSpecifier(node, context) {
		visit.identifier(node.exported, context.visitors, context.context);
	},
	importDeclaration(node, context) {
		node.specifiers.forEach((specifier) => visit.importSpecifier(specifier, context.visitors, context.context));
		visit.stringLiteral(node.source, context.visitors, context.context);
		if (node.asserts) visit.objectExpression(node.asserts, context.visitors, context.context);
	},
	importSpecifier(node, context) {
		run(() => {
			switch (node.type) {
				case "ImportSpecifier": return visit.importNamedSpecifier(node, context.visitors, context.context, true);
				case "ImportDefaultSpecifier": return visit.importDefaultSpecifier(node, context.visitors, context.context, true);
				case "ImportNamespaceSpecifier": return visit.importNamespaceSpecifier(node, context.visitors, context.context, true);
			}
		});
	},
	importNamedSpecifier(node, context) {
		visit.identifier(node.local, context.visitors, context.context);
		if (node.imported) visit.moduleExportName(node.imported, context.visitors, context.context);
	},
	importDefaultSpecifier(node, context) {
		visit.identifier(node.local, context.visitors, context.context);
	},
	importNamespaceSpecifier(node, context) {
		visit.identifier(node.local, context.visitors, context.context);
	},
	declaration(node, context) {
		run(() => {
			switch (node.type) {
				case "ClassDeclaration": return visit.classDeclaration(node, context.visitors, context.context, true);
				case "FunctionDeclaration": return visit.functionDeclaration(node, context.visitors, context.context, true);
				case "VariableDeclaration": return visit.variableDeclaration(node, context.visitors, context.context, true);
				case "TsInterfaceDeclaration": return visit.tsInterfaceDeclaration(node, context.visitors, context.context, true);
				case "TsTypeAliasDeclaration": return visit.tsTypeAliasDeclaration(node, context.visitors, context.context, true);
				case "TsEnumDeclaration": return visit.tsEnumDeclaration(node, context.visitors, context.context, true);
				case "TsModuleDeclaration": return visit.tsModuleDeclaration(node, context.visitors, context.context, true);
			}
		});
	},
	variableDeclaration(node, context) {
		node.declarations.forEach((declarator) => visit.variableDeclarator(declarator, context.visitors, context.context));
	},
	variableDeclarator(node, context) {
		visit.pattern(node.id, context.visitors, context.context);
		if (node.init) visit.expression(node.init, context.visitors, context.context);
	},
	classDeclaration(node, context) {
		visit.class(node, context.visitors, context.context, true);
		visit.identifier(node.identifier, context.visitors, context.context);
	},
	class(node, context) {
		if (node.decorators) node.decorators.forEach((d) => visit.decorator(d, context.visitors, context.context));
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		if (node.superClass) visit.expression(node.superClass, context.visitors, context.context);
		if (node.superTypeParams) visit.tsTypeParameterInstantiation(node.superTypeParams, context.visitors, context.context);
		node.implements.forEach((i) => visit.tsExpressionWithTypeArguments(i, context.visitors, context.context));
		node.body.forEach((m) => visit.classMember(m, context.visitors, context.context));
	},
	tsExpressionWithTypeArguments(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
		if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context);
	},
	classMember(node, context) {
		run(() => {
			switch (node.type) {
				case "Constructor": return visit.classConstructor(node, context.visitors, context.context, true);
				case "ClassMethod": return visit.classMethod(node, context.visitors, context.context, true);
				case "PrivateMethod": return visit.privateMethod(node, context.visitors, context.context, true);
				case "ClassProperty": return visit.classProperty(node, context.visitors, context.context, true);
				case "PrivateProperty": return visit.privateProperty(node, context.visitors, context.context, true);
				case "TsIndexSignature": return visit.tsIndexSignature(node, context.visitors, context.context, true);
				case "EmptyStatement": return visit.emptyStatement(node, context.visitors, context.context, true);
				case "StaticBlock": return visit.staticBlock(node, context.visitors, context.context, true);
			}
		});
	},
	classConstructor(node, context) {
		visit.propertyName(node.key, context.visitors, context.context);
		node.params.forEach((param) => {
			if (param.type === "Parameter") visit.param(param, context.visitors, context.context);
			else visit.tsParameterProperty(param, context.visitors, context.context);
		});
		if (node.body) visit.blockStatement(node.body, context.visitors, context.context);
	},
	tsParameterProperty(node, context) {
		if (node.decorators) node.decorators.forEach((d) => visit.decorator(d, context.visitors, context.context));
		visit.tsParameterPropertyParameter(node.param, context.visitors, context.context);
	},
	tsParameterPropertyParameter(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.bindingIdentifier(node, context.visitors, context.context, true);
				case "AssignmentPattern": return visit.assignmentPattern(node, context.visitors, context.context, true);
			}
		});
	},
	bindingIdentifier(node, context) {
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	classMethod(node, context) {
		visit.classMethodBase(node, context.visitors, context.context, true);
		visit.propertyName(node.key, context.visitors, context.context);
	},
	privateMethod(node, context) {
		visit.classMethodBase(node, context.visitors, context.context, true);
		visit.privateName(node.key, context.visitors, context.context);
	},
	classMethodBase(node, context) {
		visit.function(node.function, context.visitors, context.context, true);
	},
	function(node, context) {
		if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context);
		node.params.forEach((param) => visit.param(param, context.visitors, context.context));
		if (node.body) visit.blockStatement(node.body, context.visitors, context.context);
	},
	classProperty(node, context) {
		visit.classPropertyBase(node, context.visitors, context.context, true);
		visit.propertyName(node.key, context.visitors, context.context);
	},
	privateProperty(node, context) {
		visit.classPropertyBase(node, context.visitors, context.context, true);
		visit.privateName(node.key, context.visitors, context.context);
	},
	classPropertyBase(node, context) {
		if (node.decorators) node.decorators.forEach((d) => visit.decorator(d, context.visitors, context.context));
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
		if (node.value) visit.expression(node.value, context.visitors, context.context);
	},
	tsIndexSignature(node, context) {
		node.params.forEach((param) => visit.tsFnParameter(param, context.visitors, context.context));
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	tsFnParameter(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.bindingIdentifier(node, context.visitors, context.context, true);
				case "ArrayPattern": return visit.arrayPattern(node, context.visitors, context.context, true);
				case "RestElement": return visit.restElement(node, context.visitors, context.context, true);
				case "ObjectPattern": return visit.objectPattern(node, context.visitors, context.context, true);
			}
		});
	},
	staticBlock(node, context) {
		visit.blockStatement(node.body, context.visitors, context.context);
	},
	functionDeclaration(node, context) {
		visit.function(node, context.visitors, context.context, true);
		visit.identifier(node.identifier, context.visitors, context.context);
	},
	tsInterfaceDeclaration(node, context) {
		visit.identifier(node.id, context.visitors, context.context);
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		node.extends.forEach((i) => visit.tsExpressionWithTypeArguments(i, context.visitors, context.context));
		visit.tsInterfaceBody(node.body, context.visitors, context.context);
	},
	tsInterfaceBody(node, context) {
		node.body.forEach((e) => visit.tsTypeElement(e, context.visitors, context.context));
	},
	tsTypeElement(node, context) {
		run(() => {
			switch (node.type) {
				case "TsCallSignatureDeclaration": return visit.tsCallSignatureDeclaration(node, context.visitors, context.context, true);
				case "TsConstructSignatureDeclaration": return visit.tsConstructSignatureDeclaration(node, context.visitors, context.context, true);
				case "TsPropertySignature": return visit.tsPropertySignature(node, context.visitors, context.context, true);
				case "TsGetterSignature": return visit.tsGetterSignature(node, context.visitors, context.context, true);
				case "TsSetterSignature": return visit.tsSetterSignature(node, context.visitors, context.context, true);
				case "TsMethodSignature": return visit.tsMethodSignature(node, context.visitors, context.context, true);
				case "TsIndexSignature": return visit.tsIndexSignature(node, context.visitors, context.context, true);
			}
		});
	},
	tsCallSignatureDeclaration(node, context) {
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		node.params.forEach((param) => visit.tsFnParameter(param, context.visitors, context.context));
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	tsConstructSignatureDeclaration(node, context) {
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		node.params.forEach((param) => visit.tsFnParameter(param, context.visitors, context.context));
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	tsPropertySignature(node, context) {
		visit.expression(node.key, context.visitors, context.context);
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	tsGetterSignature(node, context) {
		visit.expression(node.key, context.visitors, context.context);
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	tsSetterSignature(node, context) {
		visit.expression(node.key, context.visitors, context.context);
		visit.tsFnParameter(node.param, context.visitors, context.context);
	},
	tsMethodSignature(node, context) {
		visit.expression(node.key, context.visitors, context.context);
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		node.params.forEach((param) => visit.tsFnParameter(param, context.visitors, context.context));
		if (node.typeAnn) visit.tsTypeAnnotation(node.typeAnn, context.visitors, context.context);
	},
	tsTypeAliasDeclaration(node, context) {
		visit.identifier(node.id, context.visitors, context.context);
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsEnumDeclaration(node, context) {
		visit.identifier(node.id, context.visitors, context.context);
		node.members.forEach((member) => visit.tsEnumMember(member, context.visitors, context.context));
	},
	tsEnumMember(node, context) {
		visit.tsEnumMemberId(node.id, context.visitors, context.context);
		if (node.init) visit.expression(node.init, context.visitors, context.context);
	},
	tsEnumMemberId(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "StringLiteral": return visit.stringLiteral(node, context.visitors, context.context, true);
			}
		});
	},
	tsModuleDeclaration(node, context) {
		visit.tsModuleName(node.id, context.visitors, context.context);
		if (node.body) visit.tsNamespaceBody(node.body, context.visitors, context.context);
	},
	tsModuleName(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "StringLiteral": return visit.stringLiteral(node, context.visitors, context.context, true);
			}
		});
	},
	tsNamespaceBody(node, context) {
		run(() => {
			switch (node.type) {
				case "TsModuleBlock": return visit.tsModuleBlock(node, context.visitors, context.context, true);
				case "TsNamespaceDeclaration": return visit.tsNamespaceDeclaration(node, context.visitors, context.context, true);
			}
		});
	},
	tsModuleBlock(node, context) {
		node.body.forEach((item) => visit.moduleItem(item, context.visitors, context.context, true));
	},
	tsNamespaceDeclaration(node, context) {
		visit.identifier(node.id, context.visitors, context.context);
		visit.tsNamespaceBody(node.body, context.visitors, context.context);
	},
	tsTypeParameterDeclaration(node, context) {
		node.parameters.forEach((param) => visit.tsTypeParameter(param, context.visitors, context.context));
	},
	tsTypeParameter(node, context) {
		visit.identifier(node.name, context.visitors, context.context);
		if (node.constraint) visit.tsType(node.constraint, context.visitors, context.context);
		if (node.default) visit.tsType(node.default, context.visitors, context.context);
	},
	tsTypeParameterInstantiation(node, context) {
		node.params.forEach((type) => visit.tsType(type, context.visitors, context.context));
	},
	statement(node, context) {
		run(() => {
			switch (node.type) {
				case "BlockStatement": return visit.blockStatement(node, context.visitors, context.context, true);
				case "EmptyStatement": return visit.emptyStatement(node, context.visitors, context.context, true);
				case "DebuggerStatement": return visit.debuggerStatement(node, context.visitors, context.context, true);
				case "WithStatement": return visit.withStatement(node, context.visitors, context.context, true);
				case "ReturnStatement": return visit.returnStatement(node, context.visitors, context.context, true);
				case "LabeledStatement": return visit.labeledStatement(node, context.visitors, context.context, true);
				case "BreakStatement": return visit.breakStatement(node, context.visitors, context.context, true);
				case "ContinueStatement": return visit.continueStatement(node, context.visitors, context.context, true);
				case "IfStatement": return visit.ifStatement(node, context.visitors, context.context, true);
				case "SwitchStatement": return visit.switchStatement(node, context.visitors, context.context, true);
				case "ThrowStatement": return visit.throwStatement(node, context.visitors, context.context, true);
				case "TryStatement": return visit.tryStatement(node, context.visitors, context.context, true);
				case "WhileStatement": return visit.whileStatement(node, context.visitors, context.context, true);
				case "DoWhileStatement": return visit.doWhileStatement(node, context.visitors, context.context, true);
				case "ForStatement": return visit.forStatement(node, context.visitors, context.context, true);
				case "ForInStatement": return visit.forInStatement(node, context.visitors, context.context, true);
				case "ForOfStatement": return visit.forOfStatement(node, context.visitors, context.context, true);
				case "ClassDeclaration":
				case "FunctionDeclaration":
				case "VariableDeclaration":
				case "TsInterfaceDeclaration":
				case "TsTypeAliasDeclaration":
				case "TsEnumDeclaration":
				case "TsModuleDeclaration": return visit.declaration(node, context.visitors, context.context, true);
				case "ExpressionStatement": return visit.expressionStatement(node, context.visitors, context.context, true);
			}
		});
	},
	blockStatement(node, context) {
		node.stmts.forEach((statement) => visit.statement(statement, context.visitors, context.context));
	},
	emptyStatement(_node, _context) {},
	debuggerStatement(_node, _context) {},
	withStatement(node, context) {
		visit.expression(node.object, context.visitors, context.context);
		visit.statement(node.body, context.visitors, context.context);
	},
	returnStatement(node, context) {
		if (node.argument) visit.expression(node.argument, context.visitors, context.context);
	},
	labeledStatement(node, context) {
		visit.identifier(node.label, context.visitors, context.context);
		visit.statement(node.body, context.visitors, context.context);
	},
	breakStatement(node, context) {
		if (node.label) visit.identifier(node.label, context.visitors, context.context);
	},
	continueStatement(node, context) {
		if (node.label) visit.identifier(node.label, context.visitors, context.context);
	},
	ifStatement(node, context) {
		visit.expression(node.test, context.visitors, context.context);
		visit.statement(node.consequent, context.visitors, context.context);
		if (node.alternate) visit.statement(node.alternate, context.visitors, context.context);
	},
	switchStatement(node, context) {
		visit.expression(node.discriminant, context.visitors, context.context);
		node.cases.forEach((c) => visit.switchCase(c, context.visitors, context.context));
	},
	switchCase(node, context) {
		if (node.test) visit.expression(node.test, context.visitors, context.context);
		node.consequent.forEach((c) => visit.statement(c, context.visitors, context.context));
	},
	throwStatement(node, context) {
		visit.expression(node.argument, context.visitors, context.context);
	},
	tryStatement(node, context) {
		visit.blockStatement(node.block, context.visitors, context.context);
		if (node.handler) visit.catchClause(node.handler, context.visitors, context.context);
		if (node.finalizer) visit.blockStatement(node.finalizer, context.visitors, context.context);
	},
	catchClause(node, context) {
		if (node.param) visit.pattern(node.param, context.visitors, context.context);
		visit.blockStatement(node.body, context.visitors, context.context);
	},
	whileStatement(node, context) {
		visit.expression(node.test, context.visitors, context.context);
		visit.statement(node.body, context.visitors, context.context);
	},
	doWhileStatement(node, context) {
		visit.expression(node.test, context.visitors, context.context);
		visit.statement(node.body, context.visitors, context.context);
	},
	forStatement(node, context) {
		if (node.init) if (node.init.type === "VariableDeclaration") visit.variableDeclaration(node.init, context.visitors, context.context);
		else visit.expression(node.init, context.visitors, context.context);
		if (node.test) visit.expression(node.test, context.visitors, context.context);
		if (node.update) visit.expression(node.update, context.visitors, context.context);
		visit.statement(node.body, context.visitors, context.context);
	},
	forInStatement(node, context) {
		if (node.left.type === "VariableDeclaration") visit.variableDeclaration(node.left, context.visitors, context.context);
		else visit.pattern(node.left, context.visitors, context.context);
		visit.expression(node.right, context.visitors, context.context);
		visit.statement(node.body, context.visitors, context.context);
	},
	forOfStatement(node, context) {
		if (node.left.type === "VariableDeclaration") visit.variableDeclaration(node.left, context.visitors, context.context);
		else visit.pattern(node.left, context.visitors, context.context);
		visit.expression(node.right, context.visitors, context.context);
		visit.statement(node.body, context.visitors, context.context);
	},
	expressionStatement(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	expression(node, context) {
		run(() => {
			switch (node.type) {
				case "ThisExpression": return visit.thisExpression(node, context.visitors, context.context, true);
				case "ArrayExpression": return visit.arrayExpression(node, context.visitors, context.context, true);
				case "ObjectExpression": return visit.objectExpression(node, context.visitors, context.context, true);
				case "FunctionExpression": return visit.functionExpression(node, context.visitors, context.context, true);
				case "UnaryExpression": return visit.unaryExpression(node, context.visitors, context.context, true);
				case "UpdateExpression": return visit.updateExpression(node, context.visitors, context.context, true);
				case "BinaryExpression": return visit.binaryExpression(node, context.visitors, context.context, true);
				case "AssignmentExpression": return visit.assignmentExpression(node, context.visitors, context.context, true);
				case "MemberExpression": return visit.memberExpression(node, context.visitors, context.context, true);
				case "SuperPropExpression": return visit.superPropExpression(node, context.visitors, context.context, true);
				case "ConditionalExpression": return visit.conditionalExpression(node, context.visitors, context.context, true);
				case "CallExpression": return visit.callExpression(node, context.visitors, context.context, true);
				case "NewExpression": return visit.newExpression(node, context.visitors, context.context, true);
				case "SequenceExpression": return visit.sequenceExpression(node, context.visitors, context.context, true);
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "StringLiteral":
				case "BooleanLiteral":
				case "NullLiteral":
				case "NumericLiteral":
				case "BigIntLiteral":
				case "RegExpLiteral":
				case "JSXText": return visit.literal(node, context.visitors, context.context, true);
				case "TemplateLiteral": return visit.templateLiteral(node, context.visitors, context.context, true);
				case "TaggedTemplateExpression": return visit.taggedTemplateExpression(node, context.visitors, context.context, true);
				case "ArrowFunctionExpression": return visit.arrowFunctionExpression(node, context.visitors, context.context, true);
				case "ClassExpression": return visit.classExpression(node, context.visitors, context.context, true);
				case "YieldExpression": return visit.yieldExpression(node, context.visitors, context.context, true);
				case "MetaProperty": return visit.metaProperty(node, context.visitors, context.context, true);
				case "AwaitExpression": return visit.awaitExpression(node, context.visitors, context.context, true);
				case "ParenthesisExpression": return visit.parenthesisExpression(node, context.visitors, context.context, true);
				case "JSXMemberExpression": return visit.jsxMemberExpression(node, context.visitors, context.context, true);
				case "JSXNamespacedName": return visit.jsxNamespacedName(node, context.visitors, context.context, true);
				case "JSXEmptyExpression": return visit.jsxEmptyExpression(node, context.visitors, context.context, true);
				case "JSXElement": return visit.jsxElement(node, context.visitors, context.context, true);
				case "JSXFragment": return visit.jsxFragment(node, context.visitors, context.context, true);
				case "TsTypeAssertion": return visit.tsTypeAssertion(node, context.visitors, context.context, true);
				case "TsConstAssertion": return visit.tsConstAssertion(node, context.visitors, context.context, true);
				case "TsNonNullExpression": return visit.tsNonNullExpression(node, context.visitors, context.context, true);
				case "TsAsExpression": return visit.tsAsExpression(node, context.visitors, context.context, true);
				case "TsSatisfiesExpression": return visit.tsSatisfiesExpression(node, context.visitors, context.context, true);
				case "TsInstantiation": return visit.tsInstantiation(node, context.visitors, context.context, true);
				case "PrivateName": return visit.privateName(node, context.visitors, context.context, true);
				case "OptionalChainingExpression": return visit.optionalChainingExpression(node, context.visitors, context.context, true);
				case "Invalid": return visit.invalid(node, context.visitors, context.context, true);
			}
		});
	},
	thisExpression(_node, _context) {},
	arrayExpression(node, context) {
		node.elements.forEach((element) => element && visit.exprOrSpread(element, context.visitors, context.context));
	},
	exprOrSpread(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	objectExpression(node, context) {
		node.properties.forEach((property) => {
			if (property.type === "SpreadElement") visit.spreadElement(property, context.visitors, context.context);
			else visit.property(property, context.visitors, context.context);
		});
	},
	functionExpression(node, context) {
		visit.function(node, context.visitors, context.context, true);
		if (node.identifier) visit.identifier(node.identifier, context.visitors, context.context);
	},
	unaryExpression(node, context) {
		visit.expression(node.argument, context.visitors, context.context);
	},
	updateExpression(node, context) {
		visit.expression(node.argument, context.visitors, context.context);
	},
	binaryExpression(node, context) {
		visit.expression(node.left, context.visitors, context.context);
		visit.expression(node.right, context.visitors, context.context);
	},
	assignmentExpression(node, context) {
		visit.pattern(node.left, context.visitors, context.context);
		visit.expression(node.right, context.visitors, context.context);
	},
	memberExpression(node, context) {
		visit.expression(node.object, context.visitors, context.context);
		run(() => {
			switch (node.property.type) {
				case "Identifier": return visit.identifier(node.property, context.visitors, context.context);
				case "PrivateName": return visit.privateName(node.property, context.visitors, context.context);
				case "Computed": return visit.computedPropertyName(node.property, context.visitors, context.context);
			}
		});
	},
	superPropExpression(node, context) {
		visit.super(node.obj, context.visitors, context.context);
		run(() => {
			switch (node.property.type) {
				case "Computed":
					visit.computedPropertyName(node.property, context.visitors, context.context);
					return ret;
				case "Identifier":
					visit.identifier(node.property, context.visitors, context.context);
					return ret;
			}
		});
	},
	conditionalExpression(node, context) {
		visit.expression(node.test, context.visitors, context.context);
		visit.expression(node.consequent, context.visitors, context.context);
		visit.expression(node.alternate, context.visitors, context.context);
	},
	callExpression(node, context) {
		run(() => {
			switch (node.callee.type) {
				case "Super": return visit.super(node.callee, context.visitors, context.context);
				case "Import": return visit.import(node.callee, context.visitors, context.context);
				default: return visit.expression(node.callee, context.visitors, context.context);
			}
		});
		if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context);
		node.arguments.forEach((argument) => visit.expression(argument.expression, context.visitors, context.context));
	},
	newExpression(node, context) {
		visit.expression(node.callee, context.visitors, context.context);
		if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context);
		if (node.arguments) node.arguments.forEach((argument) => visit.expression(argument.expression, context.visitors, context.context));
	},
	sequenceExpression(node, context) {
		node.expressions.forEach((expression) => visit.expression(expression, context.visitors, context.context));
	},
	identifier(_node, _context) {},
	literal(node, context) {
		run(() => {
			switch (node.type) {
				case "StringLiteral": return visit.stringLiteral(node, context.visitors, context.context, true);
				case "BooleanLiteral": return visit.booleanLiteral(node, context.visitors, context.context, true);
				case "NullLiteral": return visit.nullLiteral(node, context.visitors, context.context, true);
				case "NumericLiteral": return visit.numericLiteral(node, context.visitors, context.context, true);
				case "BigIntLiteral": return visit.bigIntLiteral(node, context.visitors, context.context, true);
				case "RegExpLiteral": return visit.regExpLiteral(node, context.visitors, context.context, true);
				case "JSXText": return visit.jsxText(node, context.visitors, context.context, true);
			}
		});
	},
	jsxText(_node, _context) {},
	templateLiteral(node, context) {
		node.expressions.forEach((expression) => visit.expression(expression, context.visitors, context.context));
		node.quasis.forEach((quasi) => visit.templateElement(quasi, context.visitors, context.context));
	},
	templateElement(_node, _context) {},
	taggedTemplateExpression(node, context) {
		visit.expression(node.tag, context.visitors, context.context);
		if (node.typeParameters) visit.tsTypeParameterInstantiation(node.typeParameters, context.visitors, context.context);
		visit.templateLiteral(node.template, context.visitors, context.context);
	},
	arrowFunctionExpression(node, context) {
		if (node.typeParameters) visit.tsTypeParameterDeclaration(node.typeParameters, context.visitors, context.context);
		node.params.forEach((param) => visit.pattern(param, context.visitors, context.context));
		if (node.returnType) visit.tsTypeAnnotation(node.returnType, context.visitors, context.context);
		if (node.body.type === "BlockStatement") visit.blockStatement(node.body, context.visitors, context.context);
		else visit.expression(node.body, context.visitors, context.context);
	},
	classExpression(node, context) {
		visit.class(node, context.visitors, context.context, true);
		if (node.identifier) visit.identifier(node.identifier, context.visitors, context.context);
	},
	yieldExpression(node, context) {
		if (node.argument) visit.expression(node.argument, context.visitors, context.context);
	},
	metaProperty(_node, _context) {},
	awaitExpression(node, context) {
		visit.expression(node.argument, context.visitors, context.context);
	},
	parenthesisExpression(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	jsxMemberExpression(node, context) {
		visit.jsxObject(node.object, context.visitors, context.context);
		visit.identifier(node.property, context.visitors, context.context);
	},
	jsxObject(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "JSXMemberExpression": return visit.jsxMemberExpression(node, context.visitors, context.context, true);
			}
		});
	},
	jsxNamespacedName(node, context) {
		visit.identifier(node.namespace, context.visitors, context.context);
		visit.identifier(node.name, context.visitors, context.context);
	},
	jsxEmptyExpression(_node, _context) {},
	jsxElement(node, context) {
		visit.jsxOpeningElement(node.opening, context.visitors, context.context);
		node.children.forEach((child) => visit.jsxElementChild(child, context.visitors, context.context));
		if (node.closing) visit.jsxClosingElement(node.closing, context.visitors, context.context);
	},
	jsxOpeningElement(node, context) {
		visit.jsxElementName(node.name, context.visitors, context.context);
		if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context);
		node.attributes.forEach((attribute) => visit.jsxAttributeOrSpread(attribute, context.visitors, context.context));
	},
	jsxAttributeOrSpread(node, context) {
		run(() => {
			switch (node.type) {
				case "JSXAttribute": return visit.jsxAttribute(node, context.visitors, context.context, true);
				case "SpreadElement": return visit.spreadElement(node, context.visitors, context.context, true);
			}
		});
	},
	jsxAttribute(node, context) {
		visit.jsxAttributeName(node.name, context.visitors, context.context);
		if (node.value) visit.jsxAttrValue(node.value, context.visitors, context.context);
	},
	jsxAttributeName(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "JSXNamespacedName": return visit.jsxNamespacedName(node, context.visitors, context.context, true);
			}
		});
	},
	jsxElementName(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "JSXMemberExpression": return visit.jsxMemberExpression(node, context.visitors, context.context, true);
				case "JSXNamespacedName": return visit.jsxNamespacedName(node, context.visitors, context.context, true);
			}
		});
	},
	jsxAttrValue(node, context) {
		run(() => {
			switch (node.type) {
				case "JSXExpressionContainer": return visit.jsxExpressionContainer(node, context.visitors, context.context, true);
				case "JSXElement": return visit.jsxElement(node, context.visitors, context.context, true);
				case "JSXFragment": return visit.jsxFragment(node, context.visitors, context.context, true);
				default: return visit.literal(node, context.visitors, context.context, true);
			}
		});
	},
	jsxExpressionContainer(node, context) {
		visit.jsxExpression(node.expression, context.visitors, context.context);
	},
	jsxExpression(node, context) {
		run(() => {
			switch (node.type) {
				case "JSXEmptyExpression": return visit.jsxEmptyExpression(node, context.visitors, context.context, true);
				default: return visit.expression(node, context.visitors, context.context, true);
			}
		});
	},
	jsxElementChild(node, context) {
		run(() => {
			switch (node.type) {
				case "JSXText": return visit.jsxText(node, context.visitors, context.context, true);
				case "JSXExpressionContainer": return visit.jsxExpressionContainer(node, context.visitors, context.context, true);
				case "JSXSpreadChild": return visit.jsxSpreadChild(node, context.visitors, context.context, true);
				case "JSXElement": return visit.jsxElement(node, context.visitors, context.context, true);
				case "JSXFragment": return visit.jsxFragment(node, context.visitors, context.context, true);
			}
		});
	},
	jsxSpreadChild(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	jsxClosingElement(node, context) {
		visit.jsxElementName(node.name, context.visitors, context.context);
	},
	jsxFragment(node, context) {
		visit.jsxOpeningFragment(node.opening, context.visitors, context.context);
		node.children.forEach((child) => visit.jsxElementChild(child, context.visitors, context.context));
		visit.jsxClosingFragment(node.closing, context.visitors, context.context);
	},
	jsxOpeningFragment(_node, _context) {},
	jsxClosingFragment(_node, _context) {},
	tsTypeAssertion(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsConstAssertion(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	tsNonNullExpression(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	tsAsExpression(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsSatisfiesExpression(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsInstantiation(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
		visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context);
	},
	privateName(_node, _context) {},
	optionalChainingExpression(node, context) {
		run(() => {
			switch (node.base.type) {
				case "MemberExpression": return visit.memberExpression(node.base, context.visitors, context.context);
				case "CallExpression": return visit.callExpression(node.base, context.visitors, context.context);
			}
		});
	},
	invalid(_node, _context) {},
	spreadElement(node, context) {
		visit.expression(node.arguments, context.visitors, context.context);
	},
	property(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "KeyValueProperty": return visit.keyValueProperty(node, context.visitors, context.context, true);
				case "AssignmentProperty": return visit.assignmentProperty(node, context.visitors, context.context, true);
				case "GetterProperty": return visit.getterProperty(node, context.visitors, context.context, true);
				case "SetterProperty": return visit.setterProperty(node, context.visitors, context.context, true);
				case "MethodProperty": return visit.methodProperty(node, context.visitors, context.context, true);
			}
		});
	},
	propertyName(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
				case "StringLiteral": return visit.stringLiteral(node, context.visitors, context.context, true);
				case "NumericLiteral": return visit.numericLiteral(node, context.visitors, context.context, true);
				case "Computed": return visit.computedPropertyName(node, context.visitors, context.context, true);
				case "BigIntLiteral": return visit.bigIntLiteral(node, context.visitors, context.context, true);
			}
		});
	},
	computedPropertyName(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	keyValueProperty(node, context) {
		visit.propertyName(node.key, context.visitors, context.context);
		visit.expression(node.value, context.visitors, context.context);
	},
	assignmentProperty(node, context) {
		visit.identifier(node.key, context.visitors, context.context);
		visit.expression(node.value, context.visitors, context.context);
	},
	getterProperty(node, context) {
		visit.propertyName(node.key, context.visitors, context.context);
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
		if (node.body) visit.blockStatement(node.body, context.visitors, context.context);
	},
	setterProperty(node, context) {
		visit.propertyName(node.key, context.visitors, context.context);
		visit.pattern(node.param, context.visitors, context.context);
		if (node.body) visit.blockStatement(node.body, context.visitors, context.context);
	},
	methodProperty(node, context) {
		visit.function(node, context.visitors, context.context, true);
		visit.propertyName(node.key, context.visitors, context.context);
	},
	param(node, context) {
		if (node.decorators) node.decorators.forEach((decorator) => visit.decorator(decorator, context.visitors, context.context));
		visit.pattern(node.pat, context.visitors, context.context);
	},
	decorator(node, context) {
		visit.expression(node.expression, context.visitors, context.context);
	},
	pattern(node, context) {
		run(() => {
			switch (node.type) {
				case "Identifier": return visit.bindingIdentifier(node, context.visitors, context.context, true);
				case "ArrayPattern": return visit.arrayPattern(node, context.visitors, context.context, true);
				case "RestElement": return visit.restElement(node, context.visitors, context.context, true);
				case "ObjectPattern": return visit.objectPattern(node, context.visitors, context.context, true);
				case "AssignmentPattern": return visit.assignmentPattern(node, context.visitors, context.context, true);
				case "Invalid": return visit.invalid(node, context.visitors, context.context, true);
				default: return visit.expression(node, context.visitors, context.context, true);
			}
		});
	},
	arrayPattern(node, context) {
		node.elements.forEach((element) => element && visit.pattern(element, context.visitors, context.context));
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	restElement(node, context) {
		visit.pattern(node.argument, context.visitors, context.context);
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	objectPattern(node, context) {
		node.properties.forEach((prop) => visit.objectPatternProperty(prop, context.visitors, context.context));
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	assignmentPattern(node, context) {
		visit.pattern(node.left, context.visitors, context.context);
		visit.expression(node.right, context.visitors, context.context);
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	objectPatternProperty(node, context) {
		run(() => {
			switch (node.type) {
				case "KeyValuePatternProperty": return visit.keyValuePatternProperty(node, context.visitors, context.context, true);
				case "AssignmentPatternProperty": return visit.assignmentPatternProperty(node, context.visitors, context.context, true);
				case "RestElement": return visit.restElement(node, context.visitors, context.context, true);
			}
		});
	},
	keyValuePatternProperty(node, context) {
		visit.propertyName(node.key, context.visitors, context.context);
		visit.pattern(node.value, context.visitors, context.context);
	},
	assignmentPatternProperty(node, context) {
		visit.identifier(node.key, context.visitors, context.context);
		if (node.value) visit.expression(node.value, context.visitors, context.context);
	},
	tsTypeAnnotation(node, context) {
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsType(node, context) {
		run(() => {
			switch (node.type) {
				case "TsThisType": return visit.tsThisType(node, context.visitors, context.context, true);
				case "TsKeywordType": return visit.tsKeywordType(node, context.visitors, context.context, true);
				case "TsFunctionType": return visit.tsFunctionType(node, context.visitors, context.context, true);
				case "TsConstructorType": return visit.tsConstructorType(node, context.visitors, context.context, true);
				case "TsTypeReference": return visit.tsTypeReference(node, context.visitors, context.context, true);
				case "TsTypeQuery": return visit.tsTypeQuery(node, context.visitors, context.context, true);
				case "TsTypeLiteral": return visit.tsTypeLiteral(node, context.visitors, context.context, true);
				case "TsArrayType": return visit.tsArrayType(node, context.visitors, context.context, true);
				case "TsTupleType": return visit.tsTupleType(node, context.visitors, context.context, true);
				case "TsOptionalType": return visit.tsOptionalType(node, context.visitors, context.context, true);
				case "TsRestType": return visit.tsRestType(node, context.visitors, context.context, true);
				case "TsUnionType": return visit.tsUnionType(node, context.visitors, context.context, true);
				case "TsIntersectionType": return visit.tsIntersectionType(node, context.visitors, context.context, true);
				case "TsConditionalType": return visit.tsConditionalType(node, context.visitors, context.context, true);
				case "TsInferType": return visit.tsInferType(node, context.visitors, context.context, true);
				case "TsParenthesizedType": return visit.tsParenthesizedType(node, context.visitors, context.context, true);
				case "TsTypeOperator": return visit.tsTypeOperator(node, context.visitors, context.context, true);
				case "TsIndexedAccessType": return visit.tsIndexedAccessType(node, context.visitors, context.context, true);
				case "TsMappedType": return visit.tsMappedType(node, context.visitors, context.context, true);
				case "TsLiteralType": return visit.tsLiteralType(node, context.visitors, context.context, true);
				case "TsTypePredicate": return visit.tsTypePredicate(node, context.visitors, context.context, true);
				case "TsImportType": return visit.tsImportType(node, context.visitors, context.context, true);
			}
		});
	},
	tsKeywordType(_node, _context) {},
	tsThisType(_node, _context) {},
	tsFunctionType(node, context) {
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		node.params.forEach((param) => visit.tsFnParameter(param, context.visitors, context.context));
		visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context, true);
	},
	tsConstructorType(node, context) {
		if (node.typeParams) visit.tsTypeParameterDeclaration(node.typeParams, context.visitors, context.context);
		node.params.forEach((param) => visit.tsFnParameter(param, context.visitors, context.context));
		visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	tsTypeReference(node, context) {
		visit.tsEntityName(node.typeName, context.visitors, context.context);
		if (node.typeParams) visit.tsTypeParameterInstantiation(node.typeParams, context.visitors, context.context);
	},
	tsTypeQuery(node, context) {
		visit.tsTypeQueryExpr(node.exprName, context.visitors, context.context);
		if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context);
	},
	tsTypeQueryExpr(node, context) {
		run(() => {
			switch (node.type) {
				case "TsImportType": return visit.tsImportType(node, context.visitors, context.context, true);
				default: return visit.tsEntityName(node, context.visitors, context.context, true);
			}
		});
	},
	tsTypeLiteral(node, context) {
		node.members.forEach((member) => visit.tsTypeElement(member, context.visitors, context.context));
	},
	tsArrayType(node, context) {
		visit.tsType(node.elemType, context.visitors, context.context);
	},
	tsTupleType(node, context) {
		node.elemTypes.forEach((elem) => visit.tsTupleElement(elem, context.visitors, context.context));
	},
	tsTupleElement(node, context) {
		if (node.label) visit.pattern(node.label, context.visitors, context.context);
		visit.tsType(node.ty, context.visitors, context.context);
	},
	tsOptionalType(node, context) {
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsRestType(node, context) {
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsUnionType(node, context) {
		node.types.forEach((type) => visit.tsType(type, context.visitors, context.context));
	},
	tsIntersectionType(node, context) {
		node.types.forEach((type) => visit.tsType(type, context.visitors, context.context));
	},
	tsConditionalType(node, context) {
		visit.tsType(node.checkType, context.visitors, context.context);
		visit.tsType(node.extendsType, context.visitors, context.context);
		visit.tsType(node.trueType, context.visitors, context.context);
		visit.tsType(node.falseType, context.visitors, context.context);
	},
	tsInferType(node, context) {
		visit.tsTypeParameter(node.typeParam, context.visitors, context.context);
	},
	tsParenthesizedType(node, context) {
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsTypeOperator(node, context) {
		visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsIndexedAccessType(node, context) {
		visit.tsType(node.objectType, context.visitors, context.context);
		visit.tsType(node.indexType, context.visitors, context.context);
	},
	tsMappedType(node, context) {
		if (node.nameType) visit.tsType(node.nameType, context.visitors, context.context);
		visit.tsTypeParameter(node.typeParam, context.visitors, context.context);
		if (node.typeAnnotation) visit.tsType(node.typeAnnotation, context.visitors, context.context);
	},
	tsLiteralType(node, context) {
		visit.tsLiteral(node.literal, context.visitors, context.context);
	},
	tsLiteral(node, context) {
		run(() => {
			switch (node.type) {
				case "NumericLiteral": return visit.numericLiteral(node, context.visitors, context.context, true);
				case "StringLiteral": return visit.stringLiteral(node, context.visitors, context.context, true);
				case "BooleanLiteral": return visit.booleanLiteral(node, context.visitors, context.context, true);
				case "BigIntLiteral": return visit.bigIntLiteral(node, context.visitors, context.context, true);
				case "TemplateLiteral": return visit.tsTemplateLiteralType(node, context.visitors, context.context, true);
			}
		});
	},
	tsTemplateLiteralType(node, context) {
		node.types.forEach((type) => visit.tsType(type, context.visitors, context.context));
		node.quasis.forEach((quasi) => visit.templateElement(quasi, context.visitors, context.context));
	},
	tsTypePredicate(node, context) {
		visit.tsThisTypeOrIdent(node.paramName, context.visitors, context.context);
		if (node.typeAnnotation) visit.tsTypeAnnotation(node.typeAnnotation, context.visitors, context.context);
	},
	tsThisTypeOrIdent(node, context) {
		run(() => {
			switch (node.type) {
				case "TsThisType": return visit.tsThisType(node, context.visitors, context.context, true);
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
			}
		});
	},
	tsImportType(node, context) {
		if (node.qualifier) visit.tsEntityName(node.qualifier, context.visitors, context.context);
		if (node.typeArguments) visit.tsTypeParameterInstantiation(node.typeArguments, context.visitors, context.context);
		visit.stringLiteral(node.argument, context.visitors, context.context);
	},
	tsEntityName(node, context) {
		run(() => {
			switch (node.type) {
				case "TsQualifiedName": return visit.tsQualifiedName(node, context.visitors, context.context, true);
				case "Identifier": return visit.identifier(node, context.visitors, context.context, true);
			}
		});
	},
	tsQualifiedName(node, context) {
		visit.tsEntityName(node.left, context.visitors, context.context);
		visit.identifier(node.right, context.visitors, context.context);
	},
	super(_node, _context) {},
	import(_node, _context) {}
};
function noDescend() {}
function makeVisitor(name) {
	return function(node, visitors, context, skipAny = false) {
		function nodeDescend(newContext) {
			defaultVisitors[name](node, {
				context: newContext,
				visitors,
				descend: noDescend
			});
		}
		function anyDescend(newContext) {
			(visitors[name] ?? defaultVisitors[name])(node, {
				context: newContext,
				visitors,
				descend: nodeDescend
			});
		}
		if (skipAny) {
			anyDescend(context);
			return ret;
		}
		(visitors.any ?? visitAny)(node, {
			context,
			visitors,
			descend: anyDescend
		});
		return ret;
	};
}
const visit = new Proxy({}, { get(target, name) {
	return target[name] ??= makeVisitor(name);
} });
const rootFileSuffix = dedent`
    declare global {
        const extractors: Record<string, (source: string, ...args: any[]) => Record<string, any>>
    }
`;

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
var MochiSelector = class MochiSelector$2 {
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
		return new MochiSelector$2(this.cssSelectors.map((selector) => selector.replace(/&/g, root)), this.atRules);
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
		const children = MochiSelector$2.split(child);
		return new MochiSelector$2(this.cssSelectors.flatMap((parentSelector) => children.map((childSelector) => {
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
		return new MochiSelector$2(this.cssSelectors, [...this.atRules, atRule]);
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
const hashBase$1 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const base$1 = 64;
/**
* Converts a number to a base-62 string representation.
* @param num - The number to convert
* @param maxLength - Optional maximum length of the output string
* @returns Base-62 encoded string representation of the number
*/
function numberToBase62$1(num, maxLength) {
	let out = "";
	while (num > 0 && out.length < (maxLength ?? Infinity)) {
		out = hashBase$1[num % base$1] + out;
		num = Math.floor(num / base$1);
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
function shortHash$1(input, length = 8) {
	let h = 5381;
	for (let i = 0; i < input.length; i++) h = h * 33 ^ input.charCodeAt(i);
	h >>>= 0;
	return numberToBase62$1(h, length);
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
var CssObjectSubBlock = class CssObjectSubBlock$2 {
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
		return shortHash$1(this.asCssString("&"));
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
		return [new CssObjectSubBlock$2(cssProps, selector), ...propsToProcess.toSorted(stringPropComparator("key")).flatMap(({ props: props$1, selector: selector$1 }) => CssObjectSubBlock$2.fromProps(props$1, selector$1))];
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
		this.className = "c" + shortHash$1(blocks.map((b) => b.hash).join("+"));
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
const MOCHI_CSS_TYPEOF$1 = Symbol.for("mochi-css.MochiCSS");
function isMochiCSS(value) {
	return typeof value === "object" && value !== null && value["$$typeof"] === MOCHI_CSS_TYPEOF$1;
}
var MochiCSS$1 = class MochiCSS$2 {
	$$typeof = MOCHI_CSS_TYPEOF$1;
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
		return new MochiCSS$2([object.mainBlock.className], Object.fromEntries(Object.entries(object.variantBlocks).map(([key, variantOptions]) => {
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
const emptyMochiCSS$1 = new MochiCSS$1([], {}, {});
var KeyframesObject = class KeyframesObject$2 {
	name;
	body;
	constructor(stops) {
		this.body = KeyframesObject$2.generateBody(stops);
		this.name = "kf" + shortHash$1(this.body);
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
/**
* CSS object model for global (non-scoped) styles.
* Accepts a map of CSS selectors to style objects and serializes them
* as plain CSS rules without class name scoping.
*
* @example
* const obj = new GlobalCssObject({
*   body: { margin: 0 },
*   'h1': { fontSize: 32 },
* })
* obj.asCssString() // "body {\n    margin: 0;\n}\n\nh1 {\n    font-size: 32px;\n}"
*/
var GlobalCssObject = class {
	rules;
	constructor(styles) {
		this.rules = Object.entries(styles).toSorted(compareStringKey).map(([selector, props]) => ({
			selector,
			subBlocks: [...CssObjectSubBlock.fromProps(props)]
		}));
	}
	asCssString() {
		return this.rules.flatMap(({ selector, subBlocks }) => subBlocks.map((b) => b.asCssString(selector))).join("\n\n");
	}
};
/**
* Wraps a condition in parentheses if not already wrapped.
*/
function wrapParens$1(condition) {
	const trimmed = condition.trim();
	if (trimmed.startsWith("(") && trimmed.endsWith(")")) return trimmed;
	return `(${trimmed})`;
}
function mediaFn$1(condition) {
	return `@media ${wrapParens$1(condition)}`;
}
mediaFn$1.and = function(...conditions) {
	return `@media ${conditions.map(wrapParens$1).join(" and ")}`;
};
mediaFn$1.or = function(...conditions) {
	return `@media ${conditions.map(wrapParens$1).join(", ")}`;
};
Object.defineProperties(mediaFn$1, {
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
function containerFn$1(condition) {
	return `@container ${wrapParens$1(condition)}`;
}
containerFn$1.named = function(name, condition) {
	return `@container ${name} ${wrapParens$1(condition)}`;
};
function supportsFn$1(condition) {
	return `@supports ${wrapParens$1(condition)}`;
}
supportsFn$1.not = function(condition) {
	return `@supports not ${wrapParens$1(condition)}`;
};
supportsFn$1.and = function(...conditions) {
	return `@supports ${conditions.map(wrapParens$1).join(" and ")}`;
};
supportsFn$1.or = function(...conditions) {
	return `@supports ${conditions.map(wrapParens$1).join(" or ")}`;
};

//#endregion
//#region ../stitches/dist/index.mjs
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
var MochiCSS = class MochiCSS$1$1 {
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
		return new MochiCSS$1$1([object.mainBlock.className], Object.fromEntries(Object.entries(object.variantBlocks).map(([key, variantOptions]) => {
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
function expandBreakpoints(style, config) {
	const result = {};
	for (const [key, value] of Object.entries(style)) if (key.startsWith("@") && config.media?.[key.slice(1)]) {
		const newKey = `@media ${config.media[key.slice(1)]}`;
		result[newKey] = value !== null && typeof value === "object" && !Array.isArray(value) ? expandBreakpoints(value, config) : value;
	} else if (value !== null && typeof value === "object" && !Array.isArray(value)) result[key] = expandBreakpoints(value, config);
	else result[key] = value;
	return result;
}
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
function preprocess(style, config) {
	let result = expandUtils(style, config);
	result = expandBreakpoints(result, config);
	result = resolveScopedTokens(result, config);
	result = resolveTokens(result, config);
	return result;
}
function buildThemeClassName(tokens) {
	return `th-${shortHash(JSON.stringify(Object.fromEntries(Object.entries(tokens).sort(([a], [b]) => a.localeCompare(b)).map(([scale, vals]) => [scale, Object.fromEntries(Object.entries(vals).sort(([a], [b]) => a.localeCompare(b)))]))))}`;
}

//#endregion
//#region src/generator/StitchesCssGenerator.ts
var StitchesCssGenerator = class {
	collectedStyles = [];
	constructor(config, onDiagnostic) {
		this.config = config;
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const validArgs = [];
		for (const arg of args) {
			if (arg == null || typeof arg !== "object") {
				this.onDiagnostic?.({
					code: "MOCHI_INVALID_STYLE_ARG",
					message: `Expected style object, got ${arg === null ? "null" : typeof arg}`,
					severity: "warning",
					file: source
				});
				continue;
			}
			if (isMochiCSS(arg)) continue;
			const preprocessed = preprocess(arg, this.config);
			validArgs.push(preprocessed);
		}
		if (validArgs.length > 0) this.collectedStyles.push({
			source,
			args: validArgs
		});
	}
	async generateStyles() {
		const filesCss = /* @__PURE__ */ new Map();
		for (const { source, args } of this.collectedStyles) {
			let css = filesCss.get(source);
			if (!css) {
				css = /* @__PURE__ */ new Set();
				filesCss.set(source, css);
			}
			for (const style of args) try {
				const styleCss = new CSSObject(style).asCssString();
				css.add(styleCss);
			} catch (err) {
				const message = getErrorMessage(err);
				this.onDiagnostic?.({
					code: "MOCHI_STYLE_GENERATION",
					message: `Failed to generate CSS: ${message}`,
					severity: "warning",
					file: source
				});
			}
		}
		const files = {};
		for (const [source, css] of filesCss) files[source] = [...css.values()].sort().join("\n\n");
		return { files };
	}
};

//#endregion
//#region src/generator/StitchesGlobalCssGenerator.ts
var StitchesGlobalCssGenerator = class {
	collectedStyles = [];
	constructor(config, onDiagnostic) {
		this.config = config;
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const validArgs = [];
		for (const arg of args) {
			if (arg == null || typeof arg !== "object") {
				this.onDiagnostic?.({
					code: "MOCHI_INVALID_GLOBAL_CSS_ARG",
					message: `Expected styles object, got ${arg === null ? "null" : typeof arg}`,
					severity: "warning",
					file: source
				});
				continue;
			}
			const preprocessed = preprocess(arg, this.config);
			validArgs.push(preprocessed);
		}
		if (validArgs.length > 0) this.collectedStyles.push({
			source,
			args: validArgs
		});
	}
	async generateStyles() {
		const css = /* @__PURE__ */ new Set();
		for (const { source, args } of this.collectedStyles) for (const styles of args) try {
			css.add(new GlobalCssObject(styles).asCssString());
		} catch (err) {
			const message = getErrorMessage(err);
			this.onDiagnostic?.({
				code: "MOCHI_GLOBAL_CSS_GENERATION",
				message: `Failed to generate global CSS: ${message}`,
				severity: "warning",
				file: source
			});
		}
		if (css.size === 0) return {};
		return { global: [...css.values()].sort().join("\n\n") };
	}
};

//#endregion
//#region src/generator/StitchesKeyframesGenerator.ts
var StitchesKeyframesGenerator = class {
	collectedKeyframes = [];
	constructor(onDiagnostic) {
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const validArgs = [];
		for (const arg of args) {
			if (arg == null || typeof arg !== "object") {
				this.onDiagnostic?.({
					code: "MOCHI_INVALID_KEYFRAMES_ARG",
					message: `Expected keyframe stops object, got ${arg === null ? "null" : typeof arg}`,
					severity: "warning",
					file: source
				});
				continue;
			}
			validArgs.push(arg);
		}
		if (validArgs.length > 0) this.collectedKeyframes.push({
			source,
			args: validArgs
		});
	}
	async generateStyles() {
		const filesCss = /* @__PURE__ */ new Map();
		for (const { source, args } of this.collectedKeyframes) {
			let css = filesCss.get(source);
			if (!css) {
				css = /* @__PURE__ */ new Set();
				filesCss.set(source, css);
			}
			for (const stops of args) try {
				css.add(new KeyframesObject(stops).asCssString());
			} catch (err) {
				const message = getErrorMessage(err);
				this.onDiagnostic?.({
					code: "MOCHI_KEYFRAMES_GENERATION",
					message: `Failed to generate keyframes CSS: ${message}`,
					severity: "warning",
					file: source
				});
			}
		}
		const files = {};
		for (const [source, css] of filesCss) files[source] = [...css.values()].sort().join("\n\n");
		return { files };
	}
};

//#endregion
//#region src/generator/StitchesCreateThemeGenerator.ts
var StitchesCreateThemeGenerator = class {
	collectedThemes = [];
	constructor(config, onDiagnostic) {
		this.config = config;
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const tokens = args[0];
		if (tokens == null || typeof tokens !== "object" || Array.isArray(tokens)) {
			this.onDiagnostic?.({
				code: "MOCHI_INVALID_CREATE_THEME_ARG",
				message: `Expected theme tokens object, got ${tokens === null ? "null" : typeof tokens}`,
				severity: "warning",
				file: source
			});
			return;
		}
		this.collectedThemes.push({
			source,
			tokens
		});
	}
	async generateStyles() {
		const prefix = this.config.prefix ? `${this.config.prefix}-` : "";
		const css = /* @__PURE__ */ new Set();
		for (const { tokens } of this.collectedThemes) {
			const className = buildThemeClassName(tokens);
			const declarations = [];
			for (const [scale, vals] of Object.entries(tokens).sort(([a], [b]) => a.localeCompare(b))) for (const [token, value] of Object.entries(vals).sort(([a], [b]) => a.localeCompare(b))) declarations.push(`    --${prefix}${scale}-${token}: ${value};`);
			if (declarations.length > 0) css.add(`.${className} {\n${declarations.join("\n")}\n}`);
		}
		if (css.size === 0) return {};
		return { global: [...css.values()].sort().join("\n\n") };
	}
};

//#endregion
//#region src/generator/StitchesGenerator.ts
var StitchesGenerator = class {
	allSubGeneratorGroups = [];
	constructor(onDiagnostic) {
		this.onDiagnostic = onDiagnostic;
	}
	collectArgs(source, args) {
		const config = args[0] ?? {};
		const subGens = {
			css: new StitchesCssGenerator(config, this.onDiagnostic),
			styled: new StitchesCssGenerator(config, this.onDiagnostic),
			keyframes: new StitchesKeyframesGenerator(this.onDiagnostic),
			globalCss: new StitchesGlobalCssGenerator(config, this.onDiagnostic),
			createTheme: new StitchesCreateThemeGenerator(config, this.onDiagnostic)
		};
		this.allSubGeneratorGroups.push(subGens);
		return subGens;
	}
	async generateStyles() {
		const globalParts = [];
		const allFiles = {};
		for (const subGens of this.allSubGeneratorGroups) for (const subGen of Object.values(subGens)) {
			const result = await subGen.generateStyles();
			if (result.global) globalParts.push(result.global);
			if (result.files) for (const [filePath, css] of Object.entries(result.files)) allFiles[filePath] = allFiles[filePath] ? `${allFiles[filePath]}\n\n${css}` : css;
		}
		return {
			global: globalParts.length > 0 ? globalParts.join("\n\n") : void 0,
			files: Object.keys(allFiles).length > 0 ? allFiles : void 0
		};
	}
};

//#endregion
//#region src/extractor/StitchesExtractor.ts
var StitchesExtractor = class {
	importPath = "@mochi-css/stitches";
	symbolName = "createStitches";
	derivedExtractors;
	constructor() {
		this.derivedExtractors = new Map([
			["css", new VanillaCssExtractor("@mochi-css/stitches", "css", (call) => call.arguments.map((a) => a.expression))],
			["styled", new VanillaCssExtractor("@mochi-css/stitches", "styled", (call) => call.arguments.map((a) => a.expression).slice(1))],
			["keyframes", new VanillaCssExtractor("@mochi-css/stitches", "keyframes", (call) => call.arguments.slice(0, 1).map((a) => a.expression))],
			["globalCss", new VanillaCssExtractor("@mochi-css/stitches", "globalCss", (call) => call.arguments.slice(0, 1).map((a) => a.expression))],
			["createTheme", new VanillaCssExtractor("@mochi-css/stitches", "createTheme", (call) => call.arguments.slice(0, 1).map((a) => a.expression))]
		]);
	}
	extractStaticArgs(call) {
		return call.arguments.slice(0, 1).map((a) => a.expression);
	}
	startGeneration(onDiagnostic) {
		return new StitchesGenerator(onDiagnostic);
	}
};
const createStitchesExtractor = new StitchesExtractor();

//#endregion
export { StitchesCreateThemeGenerator, StitchesCssGenerator, StitchesExtractor, StitchesGenerator, StitchesGlobalCssGenerator, StitchesKeyframesGenerator, createStitchesExtractor };
//# sourceMappingURL=index.mjs.map