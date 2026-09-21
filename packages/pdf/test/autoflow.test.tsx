// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"
import { AutoFlow, Document, Page } from "../src/index"

const ITEM_HEIGHT = 40
const PAGE_HEIGHT = 100

const originalRect = Element.prototype.getBoundingClientRect

/**
 * happy-dom performs no layout, so the reflow has nothing to measure. Give every element a
 * height and stack siblings, which is the only shape the pagination actually reads.
 */
function stubLayout(): void {
    Element.prototype.getBoundingClientRect = function (this: Element) {
        const parent = this.parentElement
        const index = parent === null ? 0 : [...parent.children].indexOf(this)
        const top = index * ITEM_HEIGHT
        return { top, bottom: top + ITEM_HEIGHT } as DOMRect
    }
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
        configurable: true,
        get: () => PAGE_HEIGHT,
    })
}

function restoreLayout(): void {
    Element.prototype.getBoundingClientRect = originalRect
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete (HTMLElement.prototype as Partial<HTMLElement>).clientHeight
}

const realPages = (container: HTMLElement) => container.querySelectorAll("[data-mochi-document] > [data-mochi-page]")

afterEach(() => {
    restoreLayout()
    cleanup()
})

describe("AutoFlow", () => {
    it("splits content across as many pages as it needs", () => {
        stubLayout()
        const { container } = render(
            <Document>
                <AutoFlow>
                    <p>one</p>
                    <p>two</p>
                    <p>three</p>
                    <p>four</p>
                </AutoFlow>
            </Document>,
        )

        const pages = realPages(container)
        expect(pages).toHaveLength(2)
        expect(pages[0]?.textContent).toBe("onetwo")
        expect(pages[1]?.textContent).toBe("threefour")
    })

    it("breaks inside a list while keeping a real list on each page", () => {
        stubLayout()
        const { container } = render(
            <Document>
                <AutoFlow>
                    <ul>
                        <li>one</li>
                        <li>two</li>
                        <li>three</li>
                        <li>four</li>
                    </ul>
                </AutoFlow>
            </Document>,
        )

        const pages = realPages(container)
        expect(pages).toHaveLength(2)
        expect(pages[0]?.querySelectorAll("ul > li")).toHaveLength(2)
        expect(pages[1]?.querySelectorAll("ul > li")).toHaveLength(2)
    })

    it("keeps everything on one page when there is no layout to measure", () => {
        const { container } = render(
            <Document>
                <AutoFlow>
                    <p>one</p>
                    <p>two</p>
                </AutoFlow>
            </Document>,
        )

        const pages = realPages(container)
        expect(pages).toHaveLength(1)
        expect(pages[0]?.textContent).toBe("onetwo")
    })
})

describe("Page", () => {
    it("renders the resolved size and margin of its document", () => {
        const { container } = render(
            <Document size="a4" margin="10mm">
                <Page>content</Page>
            </Document>,
        )

        const page = container.querySelector("[data-mochi-page]")
        expect(page?.getAttribute("style")).toContain("width: 210mm")
        expect(page?.getAttribute("style")).toContain("height: 297mm")
        expect(page?.getAttribute("style")).toContain("padding: 10mm")
    })

    it("lets a page override the document defaults", () => {
        const { container } = render(
            <Document size="a4">
                <Page orientation="landscape">content</Page>
            </Document>,
        )

        const page = container.querySelector("[data-mochi-page]")
        expect(page?.getAttribute("style")).toContain("width: 297mm")
    })
})
