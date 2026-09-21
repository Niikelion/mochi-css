import { createRoot } from "react-dom/client"
import { AutoFlow, Document, KeepTogether, Page } from "../../src/index"

const mode = new URLSearchParams(window.location.search).get("mode")

// 40mm blocks against a 277mm content box: six fit per page, so pagination has to make real
// decisions rather than trivially fitting everything.
const BLOCK_HEIGHT = "40mm"

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

    if (mode === "list") {
        return (
            <Document size="a4" margin="10mm">
                <AutoFlow>
                    <ul style={{ margin: 0, paddingLeft: "10mm" }}>
                        {Array.from({ length: 14 }, (_, index) => (
                            <li key={index} style={{ height: BLOCK_HEIGHT }}>
                                Item {index + 1}
                            </li>
                        ))}
                    </ul>
                </AutoFlow>
            </Document>
        )
    }

    if (mode === "keep") {
        // Pairs of 40mm blocks: three pairs fit per page, and the fourth must move whole.
        return (
            <Document size="a4" margin="10mm">
                <AutoFlow>
                    {Array.from({ length: 8 }, (_, index) => (
                        <KeepTogether key={index} data-block={index}>
                            <p style={{ height: BLOCK_HEIGHT, margin: 0 }}>Block {index + 1} head</p>
                            <p style={{ height: BLOCK_HEIGHT, margin: 0 }}>Block {index + 1} tail</p>
                        </KeepTogether>
                    ))}
                </AutoFlow>
            </Document>
        )
    }

    return (
        <Document size="a4" margin="10mm">
            <AutoFlow>
                {Array.from({ length: 24 }, (_, index) => (
                    <p key={index} style={{ height: BLOCK_HEIGHT, margin: 0 }}>
                        Paragraph {index + 1}
                    </p>
                ))}
            </AutoFlow>
        </Document>
    )
}

const container = document.getElementById("root")
if (container) createRoot(container).render(<Fixture />)
