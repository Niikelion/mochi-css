import type { Browser, Page } from "playwright"

const DOCUMENT_SELECTOR = "[data-mochi-document]"
// The off-screen page AutoFlow measures in carries the page attribute too; counting it would
// report a document as settled before any real page had rendered.
const PAGE_SELECTOR = "[data-mochi-page]:not([data-mochi-probe])"

export type RenderToPdfOptions = {
    /** Where to write the PDF. Omit to only receive the bytes. */
    outputPath?: string
    /**
     * Browser to render in. Supplying one keeps it open across calls, which is much faster when
     * exporting several documents; the caller then owns closing it.
     */
    browser?: Browser
    /** How long to wait for the document to appear and settle. Default: 30s. */
    timeout?: number
    /** How long the page count must hold steady before the layout counts as settled. Default: 300ms. */
    settleMs?: number
}

/**
 * Renders a served document to a PDF.
 *
 * The URL must point at a page that already renders a `<Document>` — its styles are extracted by
 * whatever build the page is served from, so this drives that page rather than re-rendering it in
 * isolation with a second, possibly divergent, CSS pipeline.
 */
export async function renderToPdf(url: string, options: RenderToPdfOptions = {}): Promise<Uint8Array> {
    const { outputPath, timeout = 30_000, settleMs = 300 } = options

    const browser = options.browser ?? (await launchChromium())
    const ownsBrowser = options.browser === undefined

    try {
        const page = await browser.newPage()
        try {
            await page.goto(url, { waitUntil: "load", timeout })
            await page.waitForSelector(DOCUMENT_SELECTOR, { timeout })
            await waitForStableLayout(page, timeout, settleMs)

            return await page.pdf({ printBackground: true, preferCSSPageSize: true, path: outputPath })
        } finally {
            await page.close()
        }
    } finally {
        if (ownsBrowser) await browser.close()
    }
}

async function launchChromium(): Promise<Browser> {
    let playwright: typeof import("playwright")

    try {
        playwright = await import("playwright")
    } catch (cause) {
        throw new Error("Exporting a PDF needs Playwright. Install it with `yarn add -D playwright`.", { cause })
    }

    // Deliberately unwrapped: if the browser itself is missing, Playwright's own error already
    // names the binary and the command that installs it.
    return await playwright.chromium.launch()
}

/**
 * Waits for the number of rendered pages to stop changing.
 *
 * Content that flows across pages is paginated after the first layout, and can repaginate as
 * images and fonts land — printing before that settles captures a half-flowed document.
 */
async function waitForStableLayout(page: Page, timeout: number, settleMs: number): Promise<void> {
    const deadline = Date.now() + timeout
    let seen = -1
    let stableSince = Date.now()

    while (Date.now() < deadline) {
        const count = await measurePageCount(page)

        if (count === null || count !== seen) {
            // Either the layout changed or the page reloaded under us; both mean "not settled".
            seen = count ?? -1
            stableSince = Date.now()
        } else if (count > 0 && Date.now() - stableSince >= settleMs) {
            return
        }

        await page.waitForTimeout(50)
    }

    if (seen > 0) return
    throw new Error(`Timed out waiting for pages to render at ${page.url()} — no ${PAGE_SELECTOR} appeared.`)
}

/** Current page count, or null if the page navigated while being measured. */
async function measurePageCount(page: Page): Promise<number | null> {
    try {
        // Webfonts change line breaking, which changes where the page breaks land.
        await page.evaluate(() => document.fonts.ready)
        return await page.locator(PAGE_SELECTOR).count()
    } catch (error) {
        // Exporting from a running dev server is the documented workflow, and such a server may
        // reload the page at any point — including between two steps of one measurement.
        if (isNavigationError(error)) return null
        throw error
    }
}

function isNavigationError(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    return /execution context was destroyed|navigating|target closed|frame was detached/i.test(error.message)
}
