// @vitest-environment happy-dom
import { describe, it, expect } from "vitest"
import { measureTextLines } from "./text"

function element(build: (el: HTMLElement) => void): HTMLElement {
    const el = document.createElement("p")
    build(el)
    document.body.appendChild(el)
    return el
}

describe("measureTextLines", () => {
    it("declines an element holding more than a single run of text", () => {
        const el = element((node) => {
            node.append("some text", document.createElement("span"))
        })
        expect(measureTextLines(el)).toBeNull()
    })

    it("declines an element whose child is not text", () => {
        const el = element((node) => {
            node.appendChild(document.createElement("span"))
        })
        expect(measureTextLines(el)).toBeNull()
    })

    it("declines an empty element", () => {
        expect(measureTextLines(element(() => undefined))).toBeNull()
    })

    it("declines text with no measurable lines, leaving the node unsplit", () => {
        // happy-dom does no layout, so a range reports no line boxes — the same shape as any
        // environment that cannot measure. Callers must fall back to keeping the node whole.
        const el = element((node) => {
            node.textContent = "a single line of text"
        })
        expect(measureTextLines(el)).toBeNull()
    })
})
