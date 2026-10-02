import {
    ComponentPropsWithRef,
    ComponentRef,
    ComponentType,
    createElement,
    ElementType,
    ForwardRefExoticComponent,
    PropsWithoutRef,
    RefAttributes,
    forwardRef,
} from "react"
import clsx from "clsx"
import { css } from "@mochi-css/vanilla"
import type { AllVariants, MergeCSSVariants, MochiCSSProps, MochiCSS, RefineVariants } from "@mochi-css/vanilla"

type MochiProps<V extends AllVariants[]> = {
    className?: string
} & Partial<RefineVariants<MergeCSSVariants<V>>>

type StyledProps<T extends ElementType, V extends AllVariants[]> = Omit<ComponentPropsWithRef<T>, keyof MochiProps<V>> &
    MochiProps<V>

export type MochiStyledComponent<T extends ElementType, V extends AllVariants[]> = ForwardRefExoticComponent<
    PropsWithoutRef<StyledProps<T, V>> & RefAttributes<ComponentRef<T>>
> & {
    toString(): string
    selector: string
}

export function styled<T extends ElementType, V extends AllVariants[]>(
    target: T,
    ...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS<V[K]> | string }
): MochiStyledComponent<T, V> {
    // In built output, Mochi rewrites styled()'s trailing args into a single prebuilt
    // MochiCSS instance (`_mochiPrebuilt(...)`) — css() takes that fast path unchanged
    // (isMochiCSS short-circuits). Without the build-time rewrite (dev usage outside the
    // pipeline, tests, Storybook without extraction wired, etc.), props are still plain style
    // objects — css() computes real class names for them at runtime via CSSObject, the same
    // deterministic hashing the extraction pipeline itself uses. Either way, styled() ends up
    // with a real MochiCSS instance to work from.
    const styles = css(...(props as Parameters<typeof css>))
    const selector = styles.selector
    const variantKeys = new Set(Object.keys(styles.variantClassNames))
    return Object.assign(
        forwardRef<ComponentRef<T>, StyledProps<T, V>>((componentProps, ref) => {
            const { className, ...p } = componentProps as StyledProps<T, V>
            const variantProps: Record<string, unknown> = {}
            const restProps: Record<string, unknown> = {}
            for (const [k, v] of Object.entries(p)) {
                if (variantKeys.has(k)) variantProps[k] = v
                else restProps[k] = v
            }
            return createElement(target as ComponentType<Record<string, unknown>>, {
                className: clsx(styles.variant(variantProps), className),
                ...restProps,
                ref,
            })
        }),
        { toString: () => selector, selector },
    )
}
