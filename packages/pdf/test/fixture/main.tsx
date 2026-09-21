import { createRoot } from "react-dom/client"
import { AutoFlow, Document, Page } from "../../src/index"

const mode = new URLSearchParams(window.location.search).get("mode")

// Tall enough that several paragraphs fill a page, so pagination has to make real decisions.
const paragraphs = Array.from({ length: 24 }, (_, index) => (
    <p key={index} style={{ height: "40mm", margin: 0 }}>
        Paragraph {index + 1}
    </p>
))

function Fixture() {
    if (mode === "explicit") {
        return (
            <Document size="a4" margin="10mm">
                <Page>one</Page>
                <Page>two</Page>
                <Page>three</Page>
            </Document>
        )
    }

    return (
        <Document size="a4" margin="10mm">
            <AutoFlow>{paragraphs}</AutoFlow>
        </Document>
    )
}

const container = document.getElementById("root")
if (container) createRoot(container).render(<Fixture />)
