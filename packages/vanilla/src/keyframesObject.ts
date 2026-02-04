import { shortHash } from "@/hash"
import { cssFromProps, SimpleStyleProps } from "@/props"
import { compareStringKey } from "@/compare"

export type KeyframeStops = Record<string, SimpleStyleProps>

export class KeyframesObject {
    public readonly name: string
    private readonly body: string

    constructor(stops: KeyframeStops) {
        this.body = KeyframesObject.generateBody(stops)
        this.name = "kf" + shortHash(this.body)
    }

    asCssString(): string {
        return `@keyframes ${this.name} {\n${this.body}\n}`
    }

    private static generateBody(stops: KeyframeStops): string {
        return Object.entries(stops)
            .toSorted(compareStringKey)
            .map(([stopKey, props]) => {
                const cssProps = cssFromProps(props)
                const propsStr = Object.entries(cssProps)
                    .toSorted(compareStringKey)
                    .map(([k, v]) => `        ${k}: ${v};`)
                    .join("\n")
                return `    ${stopKey} {\n${propsStr}\n    }`
            })
            .join("\n\n")
    }
}
