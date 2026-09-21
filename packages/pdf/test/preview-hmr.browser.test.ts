import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { mkdir, rm, writeFile } from "node:fs/promises"
import type { AddressInfo } from "node:net"
import { createServer, type ViteDevServer } from "vite"
import react from "@vitejs/plugin-react"
import { chromium, type Browser, type Page } from "playwright"
import { mochiPdfPreview } from "../src/vite/index"

const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), "fixture")
const tmpDir = join(fixtureRoot, "tmp")
const documentPath = join(tmpDir, "document.tsx")

const PAGE_SELECTOR = "[data-mochi-page]:not([data-mochi-probe])"
/** 400px of content at 100px a block: four blocks to a page. */
const BLOCKS_PER_PAGE = 4

let server: ViteDevServer
let browser: Browser
let page: Page
let origin: string

/** A document of `blocks` fixed-height blocks, which the preview will flow into pages. */
async function writeDocument(blocks: number): Promise<void> {
    await writeFile(
        documentPath,
        `import { AutoFlow, Document } from "../../../src/index"

export default function Invoice() {
    return (
        <Document size={{ width: 600, height: 400 }} margin={0}>
            <AutoFlow>
                {Array.from({ length: ${blocks} }, (_, index) => (
                    <div key={index} style={{ height: 100 }}>block {index + 1}</div>
                ))}
            </AutoFlow>
        </Document>
    )
}
`,
    )
}

beforeAll(async () => {
    await mkdir(tmpDir, { recursive: true })
    await writeDocument(BLOCKS_PER_PAGE)

    server = await createServer({
        root: fixtureRoot,
        logLevel: "silent",
        // Filesystem events are unreliable here — the watcher sees the first write to a file and
        // then misses later ones — so poll instead. This is about the test observing edits, not
        // about how the plugin behaves.
        server: { port: 0, watch: { usePolling: true, interval: 80 } },
        plugins: [react(), mochiPdfPreview({ entry: "/tmp/document.tsx" })],
    })
    await server.listen()

    const address = server.httpServer?.address() as AddressInfo | null
    if (address === null) throw new Error("preview server did not start")
    origin = `http://localhost:${address.port}`

    browser = await chromium.launch()
    page = await browser.newPage()
    page.on("console", message => {
        consoleLog.push(message.text())
    })
}, 180_000)

const consoleLog: string[] = []

afterAll(async () => {
    await page?.close()
    await browser?.close()
    await server?.close()
    await rm(tmpDir, { recursive: true, force: true })
})

const countPages = () => page.$$eval(PAGE_SELECTOR, pages => pages.length)

async function waitForPages(expected: number): Promise<number> {
    try {
        await page.waitForFunction(
            ([selector, want]) => document.querySelectorAll(selector as string).length === want,
            [PAGE_SELECTOR, expected] as const,
            { timeout: 20_000 },
        )
    } catch (cause) {
        const probeItems = await page.evaluate(
            () => document.querySelector("[data-mochi-probe] [data-mochi-page-content]")?.children.length ?? -1,
        )
        throw new Error(
            `expected ${expected} pages, settled on ${await countPages()} (probe holds ${probeItems} items)\n` +
                `console: ${consoleLog.join(" | ")}`,
            { cause },
        )
    }
    return countPages()
}

describe("preview hot reload", () => {
    it(
        "repaginates an edited document without reloading the page",
        async () => {
            await page.goto(`${origin}/__mochi-pdf/preview`, { waitUntil: "load" })
            expect(await waitForPages(1)).toBe(1)

            // Survives a hot update; a full reload would wipe it. This is the difference between
            // hot reloading the document and merely refreshing it.
            await page.evaluate(() => {
                ;(window as unknown as { __KEPT__?: boolean }).__KEPT__ = true
            })

            // Three pages' worth of content, edited the way an author would edit it.
            await writeDocument(BLOCKS_PER_PAGE * 3)
            expect(await waitForPages(3)).toBe(3)

            const kept = await page.evaluate(() => (window as unknown as { __KEPT__?: boolean }).__KEPT__ === true)
            expect(kept).toBe(true)
        },
        180_000,
    )

    it(
        "reflows back down when content is removed",
        async () => {
            // A block count not used before, so this cannot pass or fail on a cached module.
            await writeDocument(BLOCKS_PER_PAGE * 2)
            expect(await waitForPages(2)).toBe(2)

            const text = await page.$$eval(PAGE_SELECTOR, pages =>
                pages.map(element => element.textContent ?? "").join(""),
            )
            expect(text).toContain("block 8")
            expect(text).not.toContain("block 9")
        },
        180_000,
    )
})
