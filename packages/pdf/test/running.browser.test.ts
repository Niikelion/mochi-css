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

async function openFixture(mode: string): Promise<Page> {
    const page = await browser.newPage()
    await page.goto(`${origin}/?mode=${mode}`, { waitUntil: "load" })
    await page.waitForSelector(PAGE_SELECTOR)
    await page.waitForTimeout(300)
    return page
}

const pageCount = (page: Page) => page.$$eval(PAGE_SELECTOR, pages => pages.length)

describe("running headers and footers", () => {
    it(
        "repeats them on every page",
        async () => {
            const page = await openFixture("running")
            try {
                const perPage = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.map(element => ({
                        header: element.querySelector("[data-mochi-page-header]")?.textContent ?? null,
                        footer: element.querySelector("[data-mochi-page-footer]")?.textContent ?? null,
                    })),
                )

                expect(perPage.length).toBeGreaterThan(1)
                for (const slots of perPage) expect(slots.header).toBe("Report")
                for (const slots of perPage) expect(slots.footer).not.toBeNull()
            } finally {
                await page.close()
            }
        },
        120_000,
    )

    it(
        "numbers the pages, and knows the total only the finished layout can give",
        async () => {
            const page = await openFixture("running")
            try {
                const footers = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.map(element => element.querySelector("[data-mochi-page-footer]")?.textContent ?? ""),
                )

                const total = footers.length
                expect(footers).toEqual(
                    Array.from({ length: total }, (_, index) => `Page ${index + 1} of ${total}`),
                )
            } finally {
                await page.close()
            }
        },
        120_000,
    )

    it(
        "takes the space away from the flowed content instead of drawing over it",
        async () => {
            const [plain, running] = await Promise.all([openFixture("plain"), openFixture("running")])
            try {
                // 20 blocks of 50px: eight per 400px page, but only five once a 100px header and
                // 40px footer take their share.
                expect(await pageCount(plain)).toBe(3)
                expect(await pageCount(running)).toBe(4)
            } finally {
                await plain.close()
                await running.close()
            }
        },
        120_000,
    )

    it(
        "keeps the content clear of the header and footer",
        async () => {
            const page = await openFixture("running")
            try {
                const overlaps = await page.$$eval(PAGE_SELECTOR, pages =>
                    pages.map(element => {
                        const header = element.querySelector("[data-mochi-page-header]")?.getBoundingClientRect()
                        const footer = element.querySelector("[data-mochi-page-footer]")?.getBoundingClientRect()
                        const content = element.querySelector("[data-mochi-page-content]")?.getBoundingClientRect()
                        if (header == null || footer == null || content == null) return true

                        return content.top < header.bottom - 0.5 || content.bottom > footer.top + 0.5
                    }),
                )

                expect(overlaps).not.toContain(true)
            } finally {
                await page.close()
            }
        },
        120_000,
    )
})
