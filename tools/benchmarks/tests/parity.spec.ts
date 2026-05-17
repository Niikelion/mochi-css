import { test, expect, Browser, Page } from "@playwright/test"

const ports: Record<string, number> = {
    "mochi-vanilla-react": 4101,
    "mochi-stitches": 4102,
    stitches: 4103,
    "vanilla-extract": 4104,
    panda: 4105,
    "css-modules": 4106,
}

async function getNormalizedDom(browser: Browser, port: number): Promise<string> {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(`http://localhost:${port}/`)
    await page.waitForSelector("footer")
    const html = await page.evaluate(() => {
        function normalizeNode(node: Node): string {
            if (node.nodeType === Node.TEXT_NODE) {
                return (node.textContent ?? "").replace(/\s+/g, " ")
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return ""
            const el = node as Element
            const tag = el.tagName.toLowerCase()
            if (["head", "style", "script", "link"].includes(tag)) return ""
            const attrs: string[] = []
            for (const attr of el.attributes) {
                const name = attr.name.toLowerCase()
                if (!name.startsWith("class") && !name.startsWith("style") && name !== "id" && !name.startsWith("data-")) {
                    const kept = ["href", "src", "alt", "role", "type", "placeholder"]
                    if (kept.includes(name) || name.startsWith("aria-")) {
                        attrs.push(`${name}="${attr.value}"`)
                    }
                }
            }
            const attrStr = attrs.length ? " " + attrs.join(" ") : ""
            const children = Array.from(el.childNodes)
                .map(normalizeNode)
                .join("")
                .replace(/\s+/g, " ")
                .trim()
            const selfClosing = ["img", "br", "hr", "input", "meta"].includes(tag)
            if (selfClosing) return `<${tag}${attrStr}/>`
            return `<${tag}${attrStr}>${children}</${tag}>`
        }
        return normalizeNode(document.body)
    })
    await ctx.close()
    return html.replace(/\s+/g, " ").trim()
}

async function getScreenshot(browser: Browser, port: number): Promise<Buffer> {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page: Page = await ctx.newPage()
    await page.goto(`http://localhost:${port}/`)
    await page.waitForSelector("footer")
    const screenshot = await page.screenshot({ fullPage: true })
    await ctx.close()
    return screenshot
}

let baseline: string | undefined

test.describe("DOM parity", () => {
    test.beforeAll(async ({ browser }) => {
        baseline = await getNormalizedDom(browser, ports["mochi-vanilla-react"])
    })

    const candidates = Object.entries(ports).filter(([name]) => name !== "mochi-vanilla-react")
    for (const [name, port] of candidates) {
        test(`${name} matches mochi-vanilla-react`, async ({ browser }) => {
            const candidate = await getNormalizedDom(browser, port)
            expect(candidate).toEqual(baseline)
        })
    }
})

test.describe("visual screenshot parity", () => {
    // All implementation screenshots are compared against a single baseline.png captured
    // from mochi-vanilla-react. Only re-seed the baseline when the fixture design changes:
    //   yarn test --update-snapshots --grep "mochi-vanilla-react — baseline"
    let baselineScreenshot: Buffer

    test.beforeAll(async ({ browser }) => {
        baselineScreenshot = await getScreenshot(browser, ports["mochi-vanilla-react"])
    })

    // Self-check: detects visual regressions in the fixture itself
    test("mochi-vanilla-react — baseline", async () => {
        expect(baselineScreenshot).toMatchSnapshot("baseline.png", { maxDiffPixelRatio: 0.02 })
    })

    // All other implementations compare against the stored mochi-vanilla-react baseline.
    // IMPORTANT: never run --update-snapshots without --grep "mochi-vanilla-react — baseline",
    // or the baseline.png will be overwritten with each implementation's screenshot.
    const candidates = Object.entries(ports).filter(([name]) => name !== "mochi-vanilla-react")
    for (const [name, port] of candidates) {
        test(`${name} matches mochi-vanilla-react`, async ({ browser }) => {
            const screenshot = await getScreenshot(browser, port)
            expect(screenshot).toMatchSnapshot("baseline.png", { maxDiffPixelRatio: 0.02 })
        })
    }
})
