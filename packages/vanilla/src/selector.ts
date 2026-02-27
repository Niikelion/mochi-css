/**
 * CSS selector building and manipulation utilities.
 * Handles nested selectors (using `&` placeholder) and CSS at-rules.
 * @module selector
 */

import { isAtRuleKey, isNestedSelector } from "@/props"

/**
 * Immutable CSS selector builder that handles nested selectors and CSS at-rules.
 * Uses the `&` character as a placeholder for parent selector substitution.
 *
 * @example
 * const selector = new MochiSelector(['.button'])
 * selector.extend('&:hover').cssSelector // '.button:hover'
 * selector.wrap('@media (min-width: 768px)').atRules // ['@media (min-width: 768px)']
 */
export class MochiSelector {
    /**
     * Creates a new MochiSelector instance.
     * @param cssSelectors - Array of CSS selectors (may contain `&` placeholders)
     * @param atRules - Array of full CSS at-rule strings e.g. `"@media (min-width: 768px)"`
     */
    constructor(
        private readonly cssSelectors: string[] = [],
        public readonly atRules: string[] = [],
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
     * Substitutes all `&` placeholders with the given root selector.
     * @param root - The selector to replace `&` with
     * @returns A new MochiSelector with substituted selectors
     */
    substitute(root: string): MochiSelector {
        return new MochiSelector(
            this.cssSelectors.map((selector) => selector.replace(/&/g, root)),
            this.atRules,
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
        const selectors = this.cssSelectors.flatMap((parentSelector) =>
            children.map((childSelector) => {
                return childSelector.replace(/&/g, parentSelector)
            }),
        )
        return new MochiSelector(selectors, this.atRules)
    }

    /**
     * Wraps this selector with a CSS at-rule.
     * @param atRule - The full at-rule string (e.g. `"@media (min-width: 768px)"`)
     * @returns A new MochiSelector with the added at-rule, or unchanged if not a known at-rule
     * @example
     * selector.wrap('@media (min-width: 768px)') // Adds media query
     * selector.wrap('@container sidebar (min-width: 300px)') // Adds container query
     */
    wrap(atRule: string): MochiSelector {
        if (!isAtRuleKey(atRule)) return this
        return new MochiSelector(this.cssSelectors, [...this.atRules, atRule])
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
