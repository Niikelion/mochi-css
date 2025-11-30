import {ComponentProps, ComponentType, createElement, FC, HTMLElementType} from "react";
import {css, DefaultVariants, MergeCSSVariants, MochiCSSProps, RefineVariants} from "@/css";
import clsx from "clsx";

type MochiProps<V extends DefaultVariants[]> = {
    className?: string
} & Partial<RefineVariants<MergeCSSVariants<V>>>
type Cls = { className?: string }

export function styled<T extends HTMLElementType | ComponentType<Cls>, V extends DefaultVariants[]>(target: T, ...props: { [K in keyof V]: MochiCSSProps<V[K]> }): FC<Omit<ComponentProps<T>, keyof MochiProps<V>> & MochiProps<V>>
{
    const styles = css<V>(...props)
    return ({ className, ...p }: Omit<ComponentProps<T>, keyof MochiProps<V>> & MochiProps<V>) =>
        //TODO: omit variant props in p
        createElement(target, { className: clsx(styles.variant(p as any), className), ...p })
}
