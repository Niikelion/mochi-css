import { createElement, type ComponentProps } from "react"
import { describe, it, expect, expectTypeOf } from "vitest"
import { styled } from "@/styled"

describe("variant props across several styles", () => {
    const tones = { variants: { tone: { error: { color: "red" }, warning: { color: "orange" } } } }

    it("types variant props when another style has none", () => {
        const Notice = styled("p", tones, { margin: 0 })
        const Box = styled("div", { ...tones, flexDirection: "column" }, { gap: 10 })
        const Plain = styled("span", { margin: 0 }, { padding: 0 })

        expectTypeOf<ComponentProps<typeof Notice>["tone"]>().toEqualTypeOf<"error" | "warning" | undefined>()
        expectTypeOf<ComponentProps<typeof Box>["tone"]>().toEqualTypeOf<"error" | "warning" | undefined>()
        expectTypeOf<ComponentProps<typeof Plain>>().not.toHaveProperty("tone")

        expect(createElement(Box, { tone: "warning" })).toBeTruthy()
        expect(createElement(Plain)).toBeTruthy()
        // @ts-expect-error "nope" is not a tone
        expect(createElement(Notice, { tone: "nope" })).toBeTruthy()
    })
})
