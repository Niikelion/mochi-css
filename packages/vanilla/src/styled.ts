/**
 * React styled component utilities.
 * Creates styled components with CSS-in-JS support and variant props.
 * @module styled
 */

import { ComponentProps, ComponentType, createElement, FC, HTMLElementType } from "react"
import { css } from "@/css"
import clsx from "clsx"
import { AllVariants, MergeCSSVariants, MochiCSSProps, RefineVariants } from "@/cssObject"

/** Props added by MochiCSS to styled components */
type MochiProps<V extends AllVariants[]> = {
    className?: string
} & Partial<RefineVariants<MergeCSSVariants<V>>>

/** Minimal interface for components that accept className */
type Cls = { className?: string }

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
//TODO: Move to dedicated "styled" package
export function styled<T extends HTMLElementType | ComponentType<Cls>, V extends AllVariants[]>(
    target: T,
    ...props: { [K in keyof V]: MochiCSSProps<V[K]> }
): FC<Omit<ComponentProps<T>, keyof MochiProps<V>> & MochiProps<V>> {
    const styles = css<V>(...props)
    return ({ className, ...p }: Omit<ComponentProps<T>, keyof MochiProps<V>> & MochiProps<V>) =>
        //TODO: pick only variant props from p
        //TODO: omit variant props in p
        createElement(target, {
            className: clsx(styles.variant(p as unknown as Parameters<typeof styles.variant>[0]), className),
            ...p,
        })
}
