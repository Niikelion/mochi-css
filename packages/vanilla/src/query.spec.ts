import { describe, it, expect } from "vitest"
import { media, container, supports } from "@/query"

describe("media", () => {
    it("wraps condition in parens", () => {
        expect(media("min-width: 768px")).toEqual("@media (min-width: 768px)")
    })

    it("does not double-wrap already-parented condition", () => {
        expect(media("(min-width: 768px)")).toEqual("@media (min-width: 768px)")
    })

    it("trims whitespace before checking for existing parens", () => {
        expect(media("  (color)  ")).toEqual("@media (color)")
    })

    describe("and", () => {
        it("joins conditions with 'and' and wraps each in parens", () => {
            expect(media.and("min-width: 768px", "max-width: 1024px")).toEqual(
                "@media (min-width: 768px) and (max-width: 1024px)",
            )
        })

        it("handles three or more conditions", () => {
            expect(media.and("color", "hover", "pointer")).toEqual("@media (color) and (hover) and (pointer)")
        })
    })

    describe("or", () => {
        it("joins conditions with ',' and wraps each in parens", () => {
            expect(media.or("max-width: 768px", "min-width: 1200px")).toEqual(
                "@media (max-width: 768px), (min-width: 1200px)",
            )
        })

        it("does not double-wrap already-parensed conditions", () => {
            expect(media.or("(max-width: 768px)", "(min-width: 1200px)")).toEqual(
                "@media (max-width: 768px), (min-width: 1200px)",
            )
        })
    })

    describe("shorthand properties", () => {
        it("dark returns prefers-color-scheme: dark", () => {
            expect(media.dark).toEqual("@media (prefers-color-scheme: dark)")
        })

        it("light returns prefers-color-scheme: light", () => {
            expect(media.light).toEqual("@media (prefers-color-scheme: light)")
        })

        it("motion returns prefers-reduced-motion: no-preference", () => {
            expect(media.motion).toEqual("@media (prefers-reduced-motion: no-preference)")
        })

        it("print returns @media print", () => {
            expect(media.print).toEqual("@media print")
        })
    })
})

describe("container", () => {
    it("wraps condition in parens for anonymous container", () => {
        expect(container("min-width: 300px")).toEqual("@container (min-width: 300px)")
    })

    it("does not double-wrap already-parensed condition", () => {
        expect(container("(min-width: 300px)")).toEqual("@container (min-width: 300px)")
    })

    describe("named", () => {
        it("includes the container name before the condition", () => {
            expect(container.named("sidebar", "min-width: 300px")).toEqual("@container sidebar (min-width: 300px)")
        })
    })
})

describe("supports", () => {
    it("wraps condition in parens", () => {
        expect(supports("display: grid")).toEqual("@supports (display: grid)")
    })

    it("does not double-wrap already-parensed condition", () => {
        expect(supports("(display: grid)")).toEqual("@supports (display: grid)")
    })

    describe("not", () => {
        it("produces @supports not (...)", () => {
            expect(supports.not("display: grid")).toEqual("@supports not (display: grid)")
        })
    })

    describe("and", () => {
        it("joins conditions with 'and' and wraps each in parens", () => {
            expect(supports.and("display: grid", "display: flex")).toEqual(
                "@supports (display: grid) and (display: flex)",
            )
        })
    })

    describe("or", () => {
        it("joins conditions with 'or' and wraps each in parens", () => {
            expect(supports.or("display: grid", "display: flex")).toEqual(
                "@supports (display: grid) or (display: flex)",
            )
        })
    })
})
