import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import type { AddressInfo } from "node:net"
import { createServer, type ViteDevServer } from "vite"
import { chromium, type Browser } from "playwright"
import { PDFDocument } from "pdf-lib"
import { renderToPdf } from "../src/export/index"

const fixtureRoot = join(dirname(fileURLToPath(import.meta.url)), "fixture")

// A4 in PDF points (72dpi): 210mm and 297mm.
const A4_WIDTH_PT = 595
const A4_HEIGHT_PT = 842

let server: ViteDevServer
let browser: Browser
let origin: string

beforeAll(async () => {
    server = await createServer({
        root: fixtureRoot,
        logLevel: "silent",
        server: { port: 0 },
        // The fixture uses JSX without importing React.
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

describe("renderToPdf", () => {
    it(
        "prints one sheet per page, at the document's size",
        async () => {
            const bytes = await renderToPdf(`${origin}/?mode=explicit`, { browser })
            const pdf = await PDFDocument.load(bytes)

            expect(pdf.getPageCount()).toBe(3)

            const { width, height } = pdf.getPage(0).getSize()
            expect(width).toBeCloseTo(A4_WIDTH_PT, 0)
            expect(height).toBeCloseTo(A4_HEIGHT_PT, 0)
        },
        120_000,
    )

    it(
        "flows content across several sheets, breaking where the browser lays it out",
        async () => {
            const bytes = await renderToPdf(`${origin}/?mode=flow`, { browser })
            const pdf = await PDFDocument.load(bytes)

            // 24 paragraphs of 40mm into a 277mm content box: six fit per page, so four pages.
            // Asserting the exact count is the point — an off-by-one means the reflow measured
            // the content box wrong, and a count of 1 means it never paginated at all.
            expect(pdf.getPageCount()).toBe(4)
            expect(pdf.getPage(0).getSize().height).toBeCloseTo(A4_HEIGHT_PT, 0)
        },
        120_000,
    )

    it(
        "writes the file when given a path",
        async () => {
            const { mkdtemp, readFile } = await import("node:fs/promises")
            const { tmpdir } = await import("node:os")
            const outDir = await mkdtemp(join(tmpdir(), "mochi-pdf-"))
            const outputPath = join(outDir, "out.pdf")

            await renderToPdf(`${origin}/?mode=explicit`, { browser, outputPath })

            const written = await readFile(outputPath)
            expect(written.subarray(0, 5).toString()).toBe("%PDF-")
        },
        120_000,
    )
})
