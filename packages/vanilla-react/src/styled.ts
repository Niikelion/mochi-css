import { ComponentPropsWithRef, ComponentType, createElement, ElementType, FC } from "react"
import clsx from "clsx"
import type { AllVariants, MergeCSSVariants, MochiCSSProps, MochiCSS, RefineVariants } from "@mochi-css/vanilla"

// Duck-typed interface: only what styled() actually uses at runtime.
// MochiCSS instances from _mochiPrebuilt() satisfy this shape.
interface RuntimeStyles {
    variant(props: Record<string, unknown>): string
    readonly selector: string
    readonly variantClassNames: Record<string, Record<string, string>>
}

type MochiProps<V extends AllVariants[]> = {
    className?: string
} & Partial<RefineVariants<MergeCSSVariants<V>>>

export type MochiStyledComponent<T extends ElementType, V extends AllVariants[]> = FC<
    Omit<ComponentPropsWithRef<T>, keyof MochiProps<V>> & MochiProps<V>
> & {
    toString(): string
    selector: string
}

export function styled<T extends ElementType, V extends AllVariants[]>(
    target: T,
    ...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS<V[K]> | string }
): MochiStyledComponent<T, V> {
    // At runtime, props[0] is always a MochiCSS instance injected by the build transform.
    const styles = props[0] as unknown as RuntimeStyles
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
                className: clsx(styles.variant(variantProps), className),
                ...restProps,
            })
        },
        { toString: () => selector, selector },
    ) as MochiStyledComponent<T, V>
}
