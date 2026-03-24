import {
    ComponentProps,
    ComponentType,
    createElement,
    FC,
    Fragment,
    HTMLElementType,
    ReactNode,
} from "react";
import clsx from "clsx";
import {
    AllVariants,
    CssObjectBlock,
    DefaultVariants,
    isMochiCSS,
    MergeCSSVariants,
    MochiCSSProps,
    MochiCSS,
    RefineVariantType,
    StyleProps,
    css as vanillaCss,
} from "@mochi-css/vanilla";
import { StitchesConfig } from "@/types";
import { preprocess, expandBreakpoint } from "@/preprocess";

type Cls = { className?: string };

const MOCHI_CSS = Symbol("mochi-css");
const MOCHI_TARGET = Symbol("mochi-target");

export interface MochiStyledComponent<P = object> extends FC<P> {
    [MOCHI_CSS]: MochiCSS;
    [MOCHI_TARGET]: HTMLElementType | ComponentType<Cls>;
    selector: string;
}

function isMochiStyled(target: unknown): target is MochiStyledComponent {
    return typeof target === "function" && MOCHI_CSS in target;
}

type StyledVariantProp<V extends AllVariants> =
    | (keyof V[keyof V] & string)
    | Partial<Record<string, keyof V[keyof V] & string>>;

/** Extract the AllVariants shape from a single CSS arg */
type ExtractVariants<T> =
    T extends MochiCSS<infer V>
        ? V
        : T extends { variants: infer V extends AllVariants }
          ? V
          : DefaultVariants;

/** Merge variant shapes from all args, mirroring MergeCSSVariants over a mapped tuple */
type ArgsVariants<Args extends (MochiCSSProps<AllVariants> | MochiCSS)[]> =
    MergeCSSVariants<
        { [K in keyof Args]: ExtractVariants<Args[K]> } extends AllVariants[]
            ? { [K in keyof Args]: ExtractVariants<Args[K]> }
            : AllVariants[]
    >;

type StyledProps<AV extends AllVariants> = {
    as?: HTMLElementType | ComponentType;
    className?: string;
    css?: Record<string, unknown>;
    children?: ReactNode;
} & Partial<{
    [K in keyof AV]:
        | RefineVariantType<keyof AV[K] & string>
        | Partial<Record<string, RefineVariantType<keyof AV[K] & string>>>;
}>;

function extractVariantStyles(
    args: MochiCSSProps<AllVariants>[],
): Record<string, Record<string, StyleProps>> {
    const result: Record<string, Record<string, StyleProps>> = {};
    for (const arg of args) {
        const variants = (arg as Record<string, unknown>)["variants"] as
            | Record<string, Record<string, StyleProps>>
            | undefined;
        if (!variants) continue;
        for (const [vName, vOptions] of Object.entries(variants)) {
            result[vName] ??= {};
            for (const [optName, styles] of Object.entries(vOptions)) {
                result[vName][optName] = styles;
            }
        }
    }
    return result;
}

export function runtimeStyled<
    T extends HTMLElementType | ComponentType<Cls> | MochiStyledComponent,
    Args extends (MochiCSSProps<AllVariants> | MochiCSS)[],
>(
    target: T,
    args: Args,
    config: StitchesConfig,
): MochiStyledComponent<
    Omit<ComponentProps<T>, keyof StyledProps<ArgsVariants<Args>>> &
        StyledProps<ArgsVariants<Args>>
> {
    // Variant inheritance: unwrap parent styled component
    const renderTarget: HTMLElementType | ComponentType<Cls> = isMochiStyled(
        target,
    )
        ? target[MOCHI_TARGET]
        : target;

    const preprocessedArgs = args.map((arg) => {
        if (isMochiCSS(arg)) return arg;
        return preprocess(
            arg as Record<string, unknown>,
            config,
        ) as MochiCSSProps<AllVariants>;
    });

    // If target is a styled component, prepend its MochiCSS so styles are inherited
    const flatArgs = preprocessedArgs;
    const cssArgs: (MochiCSSProps<AllVariants> | MochiCSS)[] = isMochiStyled(
        target,
    )
        ? [target[MOCHI_CSS], ...flatArgs]
        : [...flatArgs];

    const variantStyles = extractVariantStyles(
        preprocessedArgs.filter(
            (a): a is MochiCSSProps<AllVariants> => !isMochiCSS(a),
        ),
    );
    const mochiInstance = vanillaCss(...cssArgs);
    const variantKeys = new Set(Object.keys(mochiInstance.variantClassNames));

    function StitchesComponent(
        props: Omit<ComponentProps<T>, keyof StyledProps<ArgsVariants<Args>>> &
            StyledProps<ArgsVariants<Args>>,
    ) {
        const {
            as: asProp,
            className,
            css: cssProp,
            ...rest
        } = props as {
            as?: HTMLElementType | ComponentType;
            className?: string;
            css?: Record<string, unknown>;
            [key: string]: unknown;
        };

        const variantProps: Record<string, string> = {};
        const responsiveVariantProps: Record<
            string,
            Record<string, string>
        > = {};
        const restProps: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(rest)) {
            if (variantKeys.has(key)) {
                if (typeof value === "string" || typeof value === "boolean") {
                    variantProps[key] = String(value);
                } else if (
                    value !== null &&
                    typeof value === "object" &&
                    !Array.isArray(value)
                ) {
                    responsiveVariantProps[key] = value as Record<
                        string,
                        string
                    >;
                }
            } else {
                restProps[key] = value;
            }
        }

        const variantClassName = mochiInstance.variant(
            variantProps as Parameters<typeof mochiInstance.variant>[0],
        );

        const dynamicStyles: { className: string; css: string }[] = [];

        for (const [vName, responsive] of Object.entries(
            responsiveVariantProps,
        )) {
            for (const [bp, value] of Object.entries(responsive)) {
                const mediaQuery = expandBreakpoint(bp, config);
                if (!mediaQuery) continue;
                const variantStyle = variantStyles[vName]?.[value];
                if (!variantStyle) continue;
                const block = new CssObjectBlock({
                    [mediaQuery]: variantStyle,
                } as StyleProps);
                dynamicStyles.push({
                    className: block.className,
                    css: block.asCssString(block.selector),
                });
            }
        }

        if (cssProp !== undefined) {
            const preprocessed = preprocess(cssProp, config);
            const block = new CssObjectBlock(preprocessed as StyleProps);
            dynamicStyles.push({
                className: block.className,
                css: block.asCssString(block.selector),
            });
        }

        const allClassNames = clsx(
            variantClassName,
            dynamicStyles.map((s) => s.className),
            className,
        );

        const styleElements = dynamicStyles.map((s) =>
            createElement(
                "style",
                {
                    key: s.className,
                    href: s.className,
                    // React 19 style deduplication
                    precedence: "medium",
                } as React.StyleHTMLAttributes<HTMLStyleElement> & {
                    href: string;
                    precedence: string;
                },
                s.css,
            ),
        );

        // Polymorphic `as` prop: use provided element type or fall back to render target
        const element = asProp ?? renderTarget;

        return createElement(
            Fragment,
            null,
            ...styleElements,
            createElement(element as ComponentType<Record<string, unknown>>, {
                className: allClassNames,
                ...restProps,
            }),
        );
    }

    // Attach metadata for variant inheritance and component-targeting selectors
    const component = StitchesComponent as MochiStyledComponent<
        Omit<ComponentProps<T>, keyof StyledProps<ArgsVariants<Args>>> &
            StyledProps<ArgsVariants<Args>>
    >;
    component[MOCHI_CSS] = mochiInstance;
    component[MOCHI_TARGET] = renderTarget;

    // Component-targeting selector: `.className` of the first class name
    Object.defineProperty(component, "selector", {
        get() {
            const cls = mochiInstance.classNames[0];
            return cls !== undefined ? `.${cls}` : "";
        },
        enumerable: false,
    });

    // toString() for use in template literals / nested selectors
    component.toString = function () {
        return component.selector;
    };

    return component;
}

// Re-export helper type for consumers
export type { StyledVariantProp };
