/**
 * CSS selector building and manipulation utilities.
 * Handles nested selectors (using `&` placeholder) and media queries.
 * @module selector
 */

import {isMediaSelector, isNestedSelector} from "@/props";

/**
 * Immutable CSS selector builder that handles nested selectors and media queries.
 * Uses the `&` character as a placeholder for parent selector substitution.
 *
 * @example
 * const selector = new MochiSelector(['.button'])
 * selector.extend('&:hover').cssSelector // '.button:hover'
 * selector.wrap('@media (min-width: 768px)').mediaQuery // '@media (min-width: 768px)'
 */
export class MochiSelector {
    /**
     * Creates a new MochiSelector instance.
     * @param cssSelectors - Array of CSS selectors (may contain `&` placeholders)
     * @param mediaSelectors - Array of media query conditions (without `@media` prefix)
     */
    constructor(
        private readonly cssSelectors: string[] = [],
        private readonly mediaSelectors: string[] = []
    ) {}

    /**
     * Gets the combined CSS selector string.
     * Multiple selectors are joined with commas.
     * @returns The CSS selector, or "*" if no selectors are defined
     */
    get cssSelector(): string {
        if (this.cssSelectors.length === 0) return "*"
        return this.cssSelectors.join(", ")
    }

    /**
     * Gets the combined media query string, if any.
     * @returns The full `@media` query string, or undefined if no media conditions
     */
    get mediaQuery(): string | undefined {
        if (this.mediaSelectors.length === 0) return undefined
        return `@media ${this.mediaSelectors.map(s => `(${s})`).join("and ")}`
    }

    /**
     * Substitutes all `&` placeholders with the given root selector.
     * @param root - The selector to replace `&` with
     * @returns A new MochiSelector with substituted selectors
     */
    substitute(root: string): MochiSelector {
        return new MochiSelector(
            this.cssSelectors.map(selector => selector.replace(/&/g, root)),
            this.mediaSelectors
        )
    }

    /**
     * Extends this selector by nesting a child selector.
     * The `&` in the child selector is replaced with each parent selector.
     * @param child - The child selector pattern (must contain `&`)
     * @returns A new MochiSelector with the extended selectors
     * @example
     * new MochiSelector(['.btn']).extend('&:hover') // '.btn:hover'
     * new MochiSelector(['.btn']).extend('& .icon') // '.btn .icon'
     */
    extend(child: string): MochiSelector {
        if (!isNestedSelector(child)) return this
        const children = MochiSelector.split(child)
        const selectors = this.cssSelectors.flatMap(parentSelector => children.map(childSelector => {
            return childSelector.replace(/&/g, parentSelector)
        }))
        return new MochiSelector(selectors, this.mediaSelectors)
    }

    /**
     * Wraps this selector with a media query condition.
     * @param mediaQuery - The media query string (starting with `@`)
     * @returns A new MochiSelector with the added media condition
     * @example
     * selector.wrap('@min-width: 768px') // Adds media query condition
     */
    wrap(mediaQuery: string): MochiSelector {
        if (!isMediaSelector(mediaQuery)) return this
        const mediaQueryPart = mediaQuery.substring(1)
        return new MochiSelector(this.cssSelectors, [...this.mediaSelectors, mediaQueryPart])
    }

    /**
     * Splits a comma-separated selector string into individual selectors.
     * @param selector - The selector string to split
     * @returns Array of individual selector strings
     */
    private static split(selector: string): string[] {
        return [selector]
    }
}
