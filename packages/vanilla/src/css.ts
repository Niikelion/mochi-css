import { CSSObject, type AllVariants, type MochiCSSProps, type MergeCSSVariants } from "@/cssObject"
import { isMochiCSS, MochiCSS, mergeMochiCss } from "@/mochiCss"

export { isMochiCSS, MochiCSS, mergeMochiCss } from "@/mochiCss"
export { _mochiPrebuilt } from "@/mochiCss"

export function css<V extends AllVariants[]>(
    ...props: { [K in keyof V]: MochiCSSProps<V[K]> | MochiCSS | string }
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

    return mergeMochiCss(cssToMerge)
}
