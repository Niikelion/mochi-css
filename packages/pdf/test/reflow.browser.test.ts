import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import type { AddressInfo } from "node:net"
import { createServer, type ViteDevServer } from "vite"
import { chromium, type Browser, type Page } from "playwright"

const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), "fixture")
const PAGE_SELECTOR = "[data-mochi-page]:not([data-mochi-probe])"

let server: ViteDevServer
let browser: Browser
let origin: string

beforeAll(async () => {
    server = await createServer({
        root: fixtureRoot,
        logLevel: "silent",
        server: { port: 0 },
        esbuild: { jsx: "automatic" },
    })
    await server.listen()

    const address = server.httpServer?.address() as AddressInfo | null
    if (address === null) throw new Error("fixture server did not start")
    origin = `http://localhost:${address.port}`

    browser = await chromium.launch()
}, 120_000)

afterAll(async () => {
    await browser?.close()
    await server?.close()
})

/** Opens a fixture mode and waits for pagination to settle. */
async function openFixture(mode: string): Promise<Page> {
    const page = await browser.newPage()
    await page.goto(`${origin}/?mode=${mode}`, { waitUntil: "load" })
    await page.waitForSelector(PAGE_SELECTOR)
    // Pagination runs in a layout effect; give it a beat to reach its final shape.
    await page.waitForTimeout(300)
    return page
}

describe("reflow in a real browser", () => {
    it("omits finished table rows rather than repeating empty padded rows", async () => {
        const page = await openFixture("parallel-table-rows")
        try {
            const pages = await page.$$eval(PAGE_SELECTOR, (pages) =>
                pages.map((page) => {
                    const content = page.querySelector("[data-mochi-page-content]")
                    const rows = [...page.querySelectorAll("tr")]
                    return {
                        rows: rows.length,
                        items: [...page.querySelectorAll("[data-item]")].map((item) => item.getAttribute("data-item")),
                        overflow: rows.some(
                            (row) =>
                                row.getBoundingClientRect().bottom > (content?.getBoundingClientRect().bottom ?? 0) + 1,
                        ),
                    }
                }),
            )
            expect(pages.map((page) => page.rows)).toEqual([4, 4])
            expect(pages.every((page) => !page.overflow)).toBe(true)
            expect(pages.flatMap((page) => page.items)).toEqual(Array.from({ length: 8 }, (_, index) => `row${index}`))
        } finally {
            await page.close()
        }
    }, 120_000)
    it("does not carry empty grid rows or their gaps onto the next page", async () => {
        const page = await openFixture("parallel-grid-rows")
        try {
            const result = await page.$$eval(PAGE_SELECTOR, (pages) =>
                pages.map((page) => {
                    const content = page.querySelector("[data-mochi-page-content]")
                    const items = [...page.querySelectorAll("[data-item]")]
                    return {
                        items: items
                            .filter((item) => item.textContent !== "")
                            .map((item) => item.getAttribute("data-item")),
                        overflow: items.some(
                            (item) =>
                                item.getBoundingClientRect().bottom >
                                (content?.getBoundingClientRect().bottom ?? 0) + 1,
                        ),
                    }
                }),
            )
            expect(result).toHaveLength(2)
            expect(result.map((page) => page.items.length)).toEqual([8, 8])
            expect(result.every((page) => !page.overflow)).toBe(true)
            expect(result.flatMap((page) => page.items)).toEqual(Array.from({ length: 16 }, (_, i) => `grid${i}`))
        } finally {
            await page.close()
        }
    }, 120_000)
    it("keeps rowspan origins on table continuation pages", async () => {
        const page = await openFixture("parallel-rowspan")
        try {
            const pages = await page.$$eval(PAGE_SELECTOR, (pages) =>
                pages.map((page) => ({
                    items: [...page.querySelectorAll("[data-item]")].map((item) => item.getAttribute("data-item")),
                    left: page.querySelector('[data-slot="left"]')?.getBoundingClientRect().left,
                    span: page.querySelector('[data-slot="span"]')?.getAttribute("rowspan"),
                    spanText: page.querySelector('[data-slot="span"]')?.textContent,
                })),
            )
            expect(pages).toHaveLength(2)
            expect(pages[0]?.spanText).toBe("span")
            expect(pages[1]?.spanText).toBe("")
            expect(pages[1]?.span).toBe("2")
            expect(pages[1]?.left).toBe(pages[0]?.left)
            expect(pages.flatMap((page) => page.items).sort()).toEqual(
                ["span", ...Array.from({ length: 8 }, (_, i) => `left${i}`), "right0", "right1"].sort(),
            )
        } finally {
            await page.close()
        }
    }, 120_000)
    it.each(["parallel-flex", "parallel-grid", "parallel-grid-span", "parallel-table"])(
        "preserves parallel slots in %s",
        async (mode) => {
            const page = await openFixture(mode)
            try {
                const result = await page.$$eval(PAGE_SELECTOR, (pages) =>
                    pages.map((page) => {
                        const content = page.querySelector("[data-mochi-page-content]")
                        const slots = [...page.querySelectorAll("[data-slot]")]
                        return {
                            items: [...page.querySelectorAll("[data-item]")].map((item) =>
                                item.getAttribute("data-item"),
                            ),
                            slots: slots.map((slot) => ({
                                name: slot.getAttribute("data-slot"),
                                text: slot.textContent,
                                width: slot.getBoundingClientRect().width,
                                left: slot.getBoundingClientRect().left,
                            })),
                            overflow:
                                content === null
                                    ? true
                                    : [...content.querySelectorAll("[data-item], [data-after]")].some(
                                          (item) =>
                                              item.getBoundingClientRect().bottom >
                                              content.getBoundingClientRect().bottom + 1,
                                      ),
                        }
                    }),
                )
                expect(result).toHaveLength(2)
                expect(result[0]?.items).toEqual(["left0", "left1", "left2", "left3", "left4", "right0", "right1"])
                expect(result[1]?.items).toEqual(["left5", "left6", "left7"])
                expect(result[1]?.slots[1]?.text).toBe("")
                for (const current of result) {
                    expect(current.slots).toHaveLength(2)
                    expect(current.overflow).toBe(false)
                    current.slots.forEach((slot, index) => {
                        expect(slot.width).toBeCloseTo(result[0]?.slots[index]?.width ?? 0, 1)
                        expect(slot.left).toBeCloseTo(result[0]?.slots[index]?.left ?? 0, 1)
                    })
                }
            } finally {
                await page.close()
            }
        },
        120_000,
    )
    it(
        "splits a list across pages, leaving a real list on each",
        async () => {
            const page = await openFixture("list")
            try {
                const lists = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.map(element => ({
                        lists: element.querySelectorAll("ul").length,
                        items: element.querySelectorAll("ul > li").length,
                    })),
                )

                expect(lists.length).toBeGreaterThan(1)
                // Every page carries its items inside a list, not as orphaned rows.
                for (const page of lists) {
                    expect(page.lists).toBe(1)
                    expect(page.items).toBeGreaterThan(0)
                }
                // Nothing is dropped or duplicated by the split.
                expect(lists.reduce((total, page) => total + page.items, 0)).toBe(14)
            } finally {
                await page.close()
            }
        },
        120_000,
    )

    it(
        "never splits a block marked break-inside: avoid",
        async () => {
            const page = await openFixture("keep")
            try {
                const blocks = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.flatMap(element =>
                        [...element.querySelectorAll("[data-block]")].map(block => ({
                            id: block.getAttribute("data-block"),
                            children: block.children.length,
                        })),
                    ),
                )

                expect(blocks.length).toBe(8)
                // A block appearing once with both halves means it moved whole; a split block
                // would show up twice, with one child each.
                expect(new Set(blocks.map(block => block.id)).size).toBe(8)
                for (const block of blocks) expect(block.children).toBe(2)
            } finally {
                await page.close()
            }
        },
        120_000,
    )

    it(
        "breaks a long paragraph across pages without losing or repeating a character",
        async () => {
            const page = await openFixture("prose")
            try {
                const original = await page.evaluate(
                    () => (window as unknown as { __PROSE__: string }).__PROSE__,
                )
                const parts = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.map(element => element.querySelector("p")?.textContent ?? ""),
                )

                // A paragraph too tall for one page has to break inside itself.
                expect(parts.length).toBeGreaterThan(1)
                for (const part of parts) expect(part.length).toBeGreaterThan(0)

                // The split is exact: the pages put back together are the original text.
                expect(parts.join("")).toBe(original)
            } finally {
                await page.close()
            }
        },
        120_000,
    )

    it(
        "never strands a single line of a paragraph at a page break",
        async () => {
            // This fixture's geometry leaves room for exactly one line at the foot of the first
            // page, so without the minimum that line would be stranded there.
            const page = await openFixture("orphan")
            try {
                const lineCounts = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages
                        .map(element => {
                            const paragraph = element.querySelector("p")
                            if (paragraph?.firstChild == null) return null

                            // Count the line boxes the browser actually produced on this page.
                            const range = document.createRange()
                            range.selectNodeContents(paragraph.firstChild)
                            return range.getClientRects().length
                        })
                        // A page the paragraph does not reach at all is not a stranded line.
                        .filter((count): count is number => count !== null),
                )

                expect(lineCounts.length).toBeGreaterThan(0)
                for (const count of lineCounts) expect(count).toBeGreaterThanOrEqual(2)
            } finally {
                await page.close()
            }
        },
        120_000,
    )

    it(
        "keeps bare text alongside elements instead of dropping content",
        async () => {
            const page = await openFixture("mixed")
            try {
                const text = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.map(element => element.querySelector("[data-mochi-page-content]")?.textContent ?? "").join(""),
                )

                for (const expected of ["loose text", "alpha", "beta", "gamma"]) {
                    expect(text).toContain(expected)
                }
            } finally {
                await page.close()
            }
        },
        120_000,
    )

    it(
        "keeps every paragraph exactly once when flowing across pages",
        async () => {
            const page = await openFixture("flow")
            try {
                const texts = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.flatMap(element => [...element.querySelectorAll("p")].map(p => p.textContent ?? "")),
                )

                expect(texts).toHaveLength(24)
                expect(new Set(texts).size).toBe(24)
                expect(texts[0]).toBe("Paragraph 1")
                expect(texts[23]).toBe("Paragraph 24")
            } finally {
                await page.close()
            }
        },
        120_000,
    )
})
