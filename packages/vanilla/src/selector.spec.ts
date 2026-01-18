import {describe, it, expect} from "vitest"
import {MochiSelector} from "@/selector";

describe("MochiSelector", () => {
    it("should have no media query and catch-all selector by default", () => {
        const selector = new MochiSelector()
        expect(selector.mediaQuery).toEqual(undefined)
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

    describe("mediaQuery", () => {
        it("should return undefined when no query is specified", () => {
            const selector = new MochiSelector()
            expect(selector.mediaQuery).toEqual(undefined)
        })

        it("should return conditions wrapped in parenthesis, separated by ',' and prefixed by @media when specified", () => {
            const selector = new MochiSelector([], ["width < 200px", "min-width: 1000px"])
            expect(selector.mediaQuery).toEqual("@media (width < 200px), (min-width: 1000px)")
        })
    })

    describe("substitute", () => {
        it("should replace all instances of & in selectors with provided single selector", () => {
            const selector = new MochiSelector(["& > span", "p.container > &"])
            const selectorWithRoot = selector.substitute(".test")

            expect(selectorWithRoot.cssSelector).toEqual(".test > span, p.container > .test")
            expect(selectorWithRoot.mediaQuery).toEqual(undefined)
        })
    })

    describe("extend", () => {
        it("should combine existing selector with provided selector string", () => {
            const parentSelector = new MochiSelector([".ck-edit"])
            const childSelector = parentSelector.extend("& p, & div")

            expect(childSelector.cssSelector).toEqual(".ck-edit p, .ck-edit div")
            expect(childSelector.mediaQuery).toEqual(undefined)

            const parentSelectorWithMedia = new MochiSelector([".test"], ["min-width: 600px"])
            const childSelectorWithMedia = parentSelectorWithMedia.extend("&.new")

            expect(childSelectorWithMedia.cssSelector).toEqual(".test.new")
            expect(childSelectorWithMedia.mediaQuery).toEqual("@media (min-width: 600px)")
        })

        it("should return source without changes if selector is not valid", () => {
            const parentSelector = new MochiSelector([".ck-edit"])
            const childSelector = parentSelector.extend("span")

            expect(childSelector.cssSelector).toEqual(".ck-edit")
        })
    })

    describe("wrap", () => {
        it("should convert mochi media condition to css media-query condition and append it to list of conditions", () => {
            const selector = new MochiSelector([], ["width >= 1024px"])
            const wrappedSelector = selector.wrap("@color")

            expect(wrappedSelector.mediaQuery).toEqual("@media (width >= 1024px), (color)")
        })

        it("should return source without changes if condition is not valid", () => {
            const selector = new MochiSelector([], ["width >= 1024px"])
            const wrappedSelector = selector.wrap("color")

            expect(wrappedSelector.mediaQuery).toEqual("@media (width >= 1024px)")
        })
    })
})
