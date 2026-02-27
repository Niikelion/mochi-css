import { describe, it, expect } from "vitest"
import { MochiSelector } from "@/selector"

describe("MochiSelector", () => {
    it("should have no at-rules and catch-all selector by default", () => {
        const selector = new MochiSelector()
        expect(selector.atRules).toEqual([])
    })

    describe("cssSelector", () => {
        it("should return * when no selector is specified", () => {
            const selector = new MochiSelector()
            expect(selector.cssSelector).toEqual("*")
        })

        it("should return selectors joined with ',' if any are specified", () => {
            const selector = new MochiSelector(["span"])
            expect(selector.cssSelector).toEqual("span")

            const multiSelector = new MochiSelector(["div", "span"])
            expect(multiSelector.cssSelector).toEqual("div, span")
        })
    })

    describe("atRules", () => {
        it("should return empty array when no at-rules are specified", () => {
            const selector = new MochiSelector()
            expect(selector.atRules).toEqual([])
        })

        it("should return full at-rule strings in order", () => {
            const selector = new MochiSelector([], ["@media (width < 200px)", "@container sidebar (min-width: 300px)"])
            expect(selector.atRules).toEqual(["@media (width < 200px)", "@container sidebar (min-width: 300px)"])
        })
    })

    describe("substitute", () => {
        it("should replace all instances of & in selectors with provided single selector", () => {
            const selector = new MochiSelector(["& > span", "p.container > &"])
            const selectorWithRoot = selector.substitute(".test")

            expect(selectorWithRoot.cssSelector).toEqual(".test > span, p.container > .test")
            expect(selectorWithRoot.atRules).toEqual([])
        })
    })

    describe("extend", () => {
        it("should combine existing selector with provided selector string", () => {
            const parentSelector = new MochiSelector([".ck-edit"])
            const childSelector = parentSelector.extend("& p, & div")

            expect(childSelector.cssSelector).toEqual(".ck-edit p, .ck-edit div")
            expect(childSelector.atRules).toEqual([])

            const parentSelectorWithMedia = new MochiSelector([".test"], ["@media (min-width: 600px)"])
            const childSelectorWithMedia = parentSelectorWithMedia.extend("&.new")

            expect(childSelectorWithMedia.cssSelector).toEqual(".test.new")
            expect(childSelectorWithMedia.atRules).toEqual(["@media (min-width: 600px)"])
        })

        it("should return source without changes if selector is not valid", () => {
            const parentSelector = new MochiSelector([".ck-edit"])
            const childSelector = parentSelector.extend("span")

            expect(childSelector.cssSelector).toEqual(".ck-edit")
        })
    })

    describe("wrap", () => {
        it("should append a full at-rule string to the list of at-rules", () => {
            const selector = new MochiSelector([], ["@media (width >= 1024px)"])
            const wrappedSelector = selector.wrap("@media (color)")

            expect(wrappedSelector.atRules).toEqual(["@media (width >= 1024px)", "@media (color)"])
        })

        it("should return source without changes if at-rule is not a known prefix", () => {
            const selector = new MochiSelector([], ["@media (width >= 1024px)"])
            const wrappedSelector = selector.wrap("color")

            expect(wrappedSelector.atRules).toEqual(["@media (width >= 1024px)"])
        })

        it("should return source without changes for unknown @ shorthand", () => {
            const selector = new MochiSelector([], ["@media (width >= 1024px)"])
            const wrappedSelector = selector.wrap("@invalid-no-space")

            expect(wrappedSelector.atRules).toEqual(["@media (width >= 1024px)"])
        })

        it("should support nested at-rules (media + container)", () => {
            const selector = new MochiSelector(["&"])
            const wrapped = selector.wrap("@media (min-width: 768px)").wrap("@container sidebar (min-width: 300px)")

            expect(wrapped.atRules).toEqual(["@media (min-width: 768px)", "@container sidebar (min-width: 300px)"])
        })
    })
})
