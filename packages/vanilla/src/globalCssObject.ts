import { CssObjectSubBlock } from "@/cssObject"
import { compareStringKey } from "@/compare"
import { StyleProps } from "@/props"

export type GlobalCssStyles = Record<string, StyleProps>

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
export class GlobalCssObject {
    private readonly rules: { selector: string; subBlocks: CssObjectSubBlock[] }[]

    constructor(styles: GlobalCssStyles) {
        this.rules = Object.entries(styles)
            .toSorted(compareStringKey)
            .map(([selector, props]) => ({
                selector,
                subBlocks: [...CssObjectSubBlock.fromProps(props)],
            }))
    }

    asCssString(): string {
        return this.rules
            .flatMap(({ selector, subBlocks }) => subBlocks.map((b) => b.asCssString(selector)))
            .join("\n\n")
    }
}
