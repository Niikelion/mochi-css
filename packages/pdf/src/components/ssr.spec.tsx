import { describe, it, expect, vi, afterEach } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { Document } from "./Document"
import { Page } from "./Page"
import { AutoFlow } from "./AutoFlow"

afterEach(() => {
    vi.restoreAllMocks()
})

function renderWithoutComplaint(element: React.ReactElement): string {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const markup = renderToStaticMarkup(element)

    // React warns on the server about effects that cannot run there; a document rendered
    // server-side should not produce that noise.
    expect(error).not.toHaveBeenCalled()
    return markup
}

describe("server rendering", () => {
    it("renders explicit pages, sized and ready to print", () => {
        const markup = renderWithoutComplaint(
            <Document size="a4" margin="10mm">
                <Page>hello</Page>
            </Document>,
        )

        expect(markup).toContain("data-mochi-page")
        expect(markup).toContain("210mm")
        expect(markup).toContain("@page")
    })

    it("renders running content, with the total not yet known", () => {
        const markup = renderWithoutComplaint(
            <Document header="Report" footer={({ pageCount }) => <i>{pageCount} pages</i>}>
                <Page>hello</Page>
            </Document>,
        )

        expect(markup).toContain("Report")
        // The count is a result of laying the document out, which has not happened here.
        expect(markup).toContain("0 pages")
    })

    it("renders flowed content unpaginated rather than failing", () => {
        const markup = renderWithoutComplaint(
            <Document>
                <AutoFlow>
                    <p>one</p>
                    <p>two</p>
                </AutoFlow>
            </Document>,
        )

        // Without layout there is nothing to measure, so the probe holds the content and no
        // pages have been produced from it yet.
        expect(markup).toContain("data-mochi-probe")
        expect(markup).toContain("one")
    })
})
