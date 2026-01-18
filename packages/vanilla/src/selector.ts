import {isMediaSelector, isNestedSelector} from "@/props";

export class MochiSelector {
    constructor(
        private readonly cssSelectors: string[] = [],
        private readonly mediaSelectors: string[] = []
    ) {}

    get cssSelector(): string {
        if (this.cssSelectors.length === 0) return "*"
        return this.cssSelectors.join(", ")
    }

    get mediaQuery(): string | undefined {
        if (this.mediaSelectors.length === 0) return undefined
        return `@media ${this.mediaSelectors.map(s => `(${s})`).join(", ")}`
    }

    substitute(root: string): MochiSelector {
        return new MochiSelector(
            this.cssSelectors.map(selector => selector.replace(/&/g, root)),
            this.mediaSelectors
        )
    }

    extend(child: string): MochiSelector {
        if (!isNestedSelector(child)) return this
        const children = MochiSelector.split(child)
        const selectors = this.cssSelectors.flatMap(parentSelector => children.map(childSelector => {
            return childSelector.replace(/&/g, parentSelector)
        }))
        return new MochiSelector(selectors, this.mediaSelectors)
    }

    wrap(mediaQuery: string): MochiSelector {
        if (!isMediaSelector(mediaQuery)) return this
        const mediaQueryPart = mediaQuery.substring(1)
        return new MochiSelector(this.cssSelectors, [...this.mediaSelectors, mediaQueryPart])
    }

    private static split(selector: string): string[] {
        return [selector]
    }
}
