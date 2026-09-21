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
