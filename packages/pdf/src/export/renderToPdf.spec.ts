import { describe, it, expect, vi } from "vitest"
import type { Browser } from "playwright"
import { renderToPdf } from "./renderToPdf"

type FakeOptions = {
    /** Page counts returned by successive layout probes. */
    counts?: number[]
    pdf?: Uint8Array
}

function fakeBrowser(options: FakeOptions = {}) {
    const counts = [...(options.counts ?? [2, 2, 2])]
    const pdf = options.pdf ?? new Uint8Array([1, 2, 3])
    // Once the scripted probes run out, the layout holds its last value rather than settling
    // on some other number — otherwise a "never settles" case would settle by accident.
    let lastCount = counts[counts.length - 1] ?? 0

    const page = {
        goto: vi.fn(async () => undefined),
        waitForSelector: vi.fn(async () => undefined),
        evaluate: vi.fn(async () => undefined),
        locator: vi.fn(() => ({
            count: async () => {
                const next = counts.shift()
                if (next !== undefined) lastCount = next
                return lastCount
            },
        })),
        waitForTimeout: vi.fn(async () => undefined),
        pdf: vi.fn(async () => pdf),
        close: vi.fn(async () => undefined),
        url: () => "http://localhost/doc",
    }

    const browser = {
        newPage: vi.fn(async () => page),
        close: vi.fn(async () => undefined),
    }

    return { browser: browser as unknown as Browser, page, raw: browser }
}

describe("renderToPdf", () => {
    it("returns the rendered bytes", async () => {
        const { browser } = fakeBrowser({ pdf: new Uint8Array([9, 9]) })
        await expect(renderToPdf("http://localhost/doc", { browser, settleMs: 0 })).resolves.toEqual(
            new Uint8Array([9, 9]),
        )
    })

    it("prints backgrounds and honours the document's own page size", async () => {
        const { browser, page } = fakeBrowser()
        await renderToPdf("http://localhost/doc", { browser, settleMs: 0 })

        expect(page.pdf).toHaveBeenCalledWith(
            expect.objectContaining({ printBackground: true, preferCSSPageSize: true }),
        )
    })

    it("writes to the requested path", async () => {
        const { browser, page } = fakeBrowser()
        await renderToPdf("http://localhost/doc", { browser, outputPath: "out.pdf", settleMs: 0 })

        expect(page.pdf).toHaveBeenCalledWith(expect.objectContaining({ path: "out.pdf" }))
    })

    it("waits for the document before printing", async () => {
        const { browser, page } = fakeBrowser()
        await renderToPdf("http://localhost/doc", { browser, settleMs: 0 })

        expect(page.waitForSelector).toHaveBeenCalledWith("[data-mochi-document]", expect.anything())
        expect(page.evaluate).toHaveBeenCalled()
    })

    it("keeps waiting while the page count is still changing", async () => {
        // Pagination settles only on the third probe; printing earlier would capture a
        // half-flowed document.
        const { browser, page } = fakeBrowser({ counts: [1, 3, 4, 4, 4] })
        await renderToPdf("http://localhost/doc", { browser, settleMs: 0 })

        expect(page.locator).toHaveBeenCalledTimes(4)
        expect(page.pdf).toHaveBeenCalled()
    })

    it("fails loudly when no page ever renders", async () => {
        const { browser } = fakeBrowser({ counts: [0, 0, 0, 0, 0, 0] })
        await expect(renderToPdf("http://localhost/doc", { browser, timeout: 120, settleMs: 0 })).rejects.toThrow(
            /no \[data-mochi-page\].* appeared/,
        )
    })

    it("treats a reload during measurement as unsettled rather than failing", async () => {
        // Exporting from a running dev server means the page can reload mid-measurement.
        const { browser, page } = fakeBrowser()
        page.evaluate.mockRejectedValueOnce(
            new Error("Execution context was destroyed, most likely because of a navigation"),
        )

        await expect(renderToPdf("http://localhost/doc", { browser, settleMs: 0 })).resolves.toBeInstanceOf(Uint8Array)
    })

    it("still surfaces a genuine failure while measuring", async () => {
        const { browser, page } = fakeBrowser()
        page.evaluate.mockRejectedValue(new Error("boom"))

        await expect(renderToPdf("http://localhost/doc", { browser, settleMs: 0 })).rejects.toThrow("boom")
    })

    it("closes the page but leaves a caller-supplied browser open", async () => {
        const { browser, page, raw } = fakeBrowser()
        await renderToPdf("http://localhost/doc", { browser, settleMs: 0 })

        expect(page.close).toHaveBeenCalled()
        expect(raw.close).not.toHaveBeenCalled()
    })

    it("still closes the page when printing fails", async () => {
        const { browser, page } = fakeBrowser()
        page.pdf.mockRejectedValueOnce(new Error("boom"))

        await expect(renderToPdf("http://localhost/doc", { browser, settleMs: 0 })).rejects.toThrow("boom")
        expect(page.close).toHaveBeenCalled()
    })
})
