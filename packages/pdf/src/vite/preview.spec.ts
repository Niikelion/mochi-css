import { describe, it, expect } from "vitest"
import { DEFAULT_PREVIEW_ROUTE, VIRTUAL_PREVIEW_ID, isPreviewRequest, previewHtml, previewModule } from "./preview"

describe("previewModule", () => {
    it("mounts the entry's default export", () => {
        const source = previewModule("/src/invoice.tsx")
        expect(source).toContain('from "/src/invoice.tsx"')
        expect(source).toContain("createRoot")
    })

    it("quotes the entry so a path with quotes cannot break out of the import", () => {
        expect(previewModule('/src/we"ird.tsx')).toContain('from "/src/we\\"ird.tsx"')
    })
})

describe("previewHtml", () => {
    it("loads the virtual preview entry", () => {
        expect(previewHtml()).toContain(`/@id/__x00__${VIRTUAL_PREVIEW_ID}`)
    })

    it("keeps the preview backdrop off the printed sheet", () => {
        expect(previewHtml()).toContain("@media screen")
    })
})

describe("isPreviewRequest", () => {
    it("matches the route", () => {
        expect(isPreviewRequest(DEFAULT_PREVIEW_ROUTE, DEFAULT_PREVIEW_ROUTE)).toBe(true)
    })

    it("matches the route with a trailing slash or a query string", () => {
        expect(isPreviewRequest(`${DEFAULT_PREVIEW_ROUTE}/`, DEFAULT_PREVIEW_ROUTE)).toBe(true)
        expect(isPreviewRequest(`${DEFAULT_PREVIEW_ROUTE}?page=2`, DEFAULT_PREVIEW_ROUTE)).toBe(true)
    })

    it("ignores other routes, including ones merely starting with it", () => {
        expect(isPreviewRequest("/", DEFAULT_PREVIEW_ROUTE)).toBe(false)
        expect(isPreviewRequest(`${DEFAULT_PREVIEW_ROUTE}-other`, DEFAULT_PREVIEW_ROUTE)).toBe(false)
        expect(isPreviewRequest(undefined, DEFAULT_PREVIEW_ROUTE)).toBe(false)
    })
})
