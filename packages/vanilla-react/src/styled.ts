/**
 * React styled component utilities.
 * Creates styled components with CSS-in-JS support and variant props.
 * @module styled
 */

import { ComponentPropsWithRef, ComponentType, createElement, ElementType, FC } from "react"
import {
    css,
    isMochiCSS,
    MochiCSS,
    AllVariants,
    MergeCSSVariants,
    MochiCSSProps,
    RefineVariants,
} from "@mochi-css/vanilla"
import clsx from "clsx"

/** Props added by MochiCSS to styled components */
type MochiProps<V extends AllVariants[]> = {
    className?: string
} & Partial<RefineVariants<MergeCSSVariants<V>>>

/** A styled component FC augmented with a CSS selector for component targeting */
export type MochiStyledComponent<T extends ElementType, V extends AllVariants[]> = FC<
    Omit<ComponentPropsWithRef<T>, keyof MochiProps<V>> & MochiProps<V>
> & {
    toString(): string
    selector: string
}

/**
 * Creates a styled React component with CSS-in-JS support and variant props.
 * Similar to styled-components or Stitches, but with zero runtime overhead.
 *
 * @template T - The base element type or component type
 * @template V - The variant definitions tuple type
 * @param target - The HTML element tag name or React component to style
 * @param props - One or more style objects with optional variants
 * @returns A React functional component with merged props and variant support
 *
 * @remarks
 * Variant props are automatically stripped and never forwarded to the underlying
 * element or component. This prevents unknown prop warnings on DOM elements.
 * If the inner component has a prop with the same
 * name as a variant, it will not receive that prop.
 *
 * @example
 * const Button = styled('button', {
 *   padding: 8,
 *   borderRadius: 4,
 *   variants: {
 *     size: {
 *       small: { padding: 4 },
 *       large: { padding: 16 }
 *     },
 *     variant: {
 *       primary: { backgroundColor: 'blue' },
 *       secondary: { backgroundColor: 'gray' }
 *     }
 *   }
 * })
 *
 * // Usage: <Button size="large" variant="primary">Click me</Button>
 */
export function styled<T extends ElementType, V extends AllVariants[]>(
    target: T,
    ...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS<V[K]> | string }
): MochiStyledComponent<T, V> {
    // When the builder has pre-built a single MochiCSS instance (via _mochiPrebuilt),
    // use it directly to avoid the runtime css() construction cost.
    const styles: MochiCSS<MergeCSSVariants<V>> =
        props.length === 1 && isMochiCSS(props[0])
            ? (props[0] as unknown as MochiCSS<MergeCSSVariants<V>>)
            : css<V>(...(props as Parameters<typeof css<V>>))
    const selector = styles.selector
    const variantKeys = new Set(Object.keys(styles.variantClassNames))
    return Object.assign(
        ({ className, ...p }: Omit<ComponentPropsWithRef<T>, keyof MochiProps<V>> & MochiProps<V>) => {
            const variantProps: Record<string, unknown> = {}
            const restProps: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(p)) {
                if (variantKeys.has(k)) variantProps[k] = v
                else restProps[k] = v
            }
            return createElement(target as ComponentType<Record<string, unknown>>, {
                className: clsx(styles.variant(variantProps as Parameters<typeof styles.variant>[0]), className),
                ...restProps,
            })
        },
        { toString: () => selector, selector },
    )
}
