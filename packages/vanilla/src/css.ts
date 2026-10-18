import { CSSObject, type AllVariants, type MochiCSSProps, type MergeCSSVariants, type VariantSlot } from "@/cssObject"
import { isMochiCSS, MochiCSS, mergeMochiCss } from "@/mochiCss"

export { isMochiCSS, MochiCSS, mergeMochiCss } from "@/mochiCss"
export { _mochiPrebuilt } from "@/mochiCss"

/**
 * Each slot of `V` is inferred from one style's `variants`. Slots are `unknown` rather than
 * `AllVariants` so a style without variants doesn't make inference give up on the whole tuple.
 */
export function css<V extends unknown[] | []>(
    ...props: { [K in keyof V]: MochiCSSProps<VariantSlot<V[K]>> | MochiCSS | string }
): MochiCSS<MergeCSSVariants<V>> {
    const cssToMerge: MochiCSS<AllVariants>[] = []
    for (const p of props) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (p == null) continue
        if (typeof p === "string") {
            cssToMerge.push(new MochiCSS([p], {}, {}))
            continue
        }
        if (typeof p !== "object") continue
        if (isMochiCSS(p)) {
            cssToMerge.push(p)
        } else {
            cssToMerge.push(MochiCSS.from(new CSSObject<AllVariants>(p)))
        }
    }

    return mergeMochiCss<V>(cssToMerge)
}
