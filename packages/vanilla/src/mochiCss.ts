import clsx from "clsx"
import type { AllVariants, CSSObject, DefaultVariants, MergeCSSVariants, RefineVariants } from "@/cssObject"

const MOCHI_CSS_TYPEOF = Symbol.for("mochi-css.MochiCSS")

export function isMochiCSS(value: unknown): value is MochiCSS {
    return (
        typeof value === "object" &&
        value !== null &&
        (value as Record<string, unknown>)["$$typeof"] === MOCHI_CSS_TYPEOF
    )
}

export class MochiCSS<V extends AllVariants = DefaultVariants> {
    readonly $$typeof = MOCHI_CSS_TYPEOF

    constructor(
        public readonly classNames: string[],
        public readonly variantClassNames: { [K in keyof V]: { [P in keyof V[K]]: string } },
        public readonly defaultVariants: Partial<RefineVariants<V>>,
    ) {}

    variant(props: Partial<RefineVariants<V>>): string {
        const keys = new Set<keyof V & string>(
            [...Object.keys(props), ...Object.keys(this.defaultVariants)].filter((k) => k in this.variantClassNames),
        )

        return clsx(
            this.classNames,
            ...keys.values().map((k) => {
                const variantGroup = this.variantClassNames[k]
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (!variantGroup) return false

                const variantKey = ((k in props ? props[k] : undefined) ?? this.defaultVariants[k])?.toString()
                if (variantKey === undefined) return false

                const selectedClassname = variantGroup[variantKey]
                if (selectedClassname !== undefined) return selectedClassname

                const defaultKey = this.defaultVariants[k]
                if (defaultKey == null) return false

                return variantGroup[defaultKey.toString()]
            }),
        )
    }

    get selector(): string {
        return this.classNames.map((n) => `.${n}`).join("")
    }

    toString(): string {
        return this.selector
    }

    // CSSObject is a type-only import — no compile-time code is pulled into the bundle.
    static from<V extends AllVariants = DefaultVariants>(object: CSSObject<V>): MochiCSS<V> {
        return new MochiCSS<V>(
            [object.mainBlock.className],
            Object.fromEntries(
                Object.entries(object.variantBlocks).map(([key, variantOptions]) => {
                    return [
                        key,
                        Object.fromEntries(
                            Object.entries(variantOptions).map(([optionKey, block]) => {
                                return [optionKey, (block as { className: string }).className]
                            }),
                        ),
                    ]
                }),
            ) as { [K in keyof V]: { [P in keyof V[K]]: string } },
            object.variantDefaults,
        )
    }
}

export function _mochiPrebuilt<V extends AllVariants = DefaultVariants>(
    classNames: string[],
    variantClassNames: { [K in keyof V]: { [P in keyof V[K]]: string } },
    defaultVariants: Partial<RefineVariants<V>>,
): MochiCSS<V> {
    return new MochiCSS<V>(classNames, variantClassNames, defaultVariants)
}

const emptyMochiCSS = new MochiCSS<AllVariants>([], {}, {})

export function mergeMochiCss<V extends AllVariants[]>(
    instances: MochiCSS<AllVariants>[],
): MochiCSS<MergeCSSVariants<V>> {
    if (instances.length === 0) return emptyMochiCSS as MochiCSS<MergeCSSVariants<V>>

    return new MochiCSS<AllVariants>(
        instances.flatMap((c) => c.classNames),
        instances.reduce((a, b) => Object.assign(a, b.variantClassNames), {}),
        instances.reduce((a, b) => Object.assign(a, b.defaultVariants), {}),
    ) as MochiCSS<MergeCSSVariants<V>>
}
