import { StyleGenerator } from "@/generators/StyleGenerator"
import { CSSObject, StyleProps } from "@mochi-css/vanilla"

export class VanillaCssGenerator implements StyleGenerator {
    private readonly collectedStyles: StyleProps[][] = []

    collectArgs(_source: string, args: unknown[]): void {
        //TODO: maybe add validation?
        this.collectedStyles.push(args as StyleProps[])
    }

    async generateStyles(): Promise<{ global: string }> {
        const css = new Set<string>()
        for (const styles of this.collectedStyles) {
            for (const style of styles) {
                const styleCss = new CSSObject(style).asCssString()
                css.add(styleCss)
            }
        }
        const sortedCss = [...css.values()].sort()
        return {
            global: sortedCss.join("\n\n"),
        }
    }
}
