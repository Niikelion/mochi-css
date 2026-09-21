import { createRoot } from "react-dom/client"
import { AutoFlow, Document, KeepTogether, Page } from "../../src/index"

const mode = new URLSearchParams(window.location.search).get("mode")

// 40mm blocks against a 277mm content box: six fit per page, so pagination has to make real
// decisions rather than trivially fitting everything.
const BLOCK_HEIGHT = "40mm"

// Numbered words so a test can tell truncation, duplication and reordering apart. Long enough to
// run over several pages, which is the only way a break lands inside the paragraph.
const PROSE = Array.from({ length: 1500 }, (_, index) => `word${index}`).join(" ")
;(window as unknown as { __PROSE__: string }).__PROSE__ = PROSE

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

    if (mode === "prose") {
        return (
            <Document size="a4" margin="10mm">
                <AutoFlow>
                    <p style={{ margin: 0 }}>{PROSE}</p>
                </AutoFlow>
            </Document>
        )
    }

    if (mode === "running" || mode === "plain") {
        // 400px content box. With running content it drops to 260px, so 50px blocks go from
        // eight a page to five — which is how a test can tell the header and footer were
        // actually subtracted rather than drawn over the content.
        const running = mode === "running"
        return (
            <Document
                size={{ width: 600, height: 400 }}
                margin={0}
                header={running ? <div style={{ height: 100 }}>Report</div> : undefined}
                footer={
                    running
                        ? ({ pageNumber, pageCount }) => (
                              <div style={{ height: 40 }}>
                                  Page {pageNumber} of {pageCount}
                              </div>
                          )
                        : undefined
                }
            >
                <AutoFlow>
                    {Array.from({ length: 20 }, (_, index) => (
                        <div key={index} style={{ height: 50 }}>
                            block {index + 1}
                        </div>
                    ))}
                </AutoFlow>
            </Document>
        )
    }

    if (mode === "orphan") {
        // Exact pixel geometry, chosen so that without widow and orphan control the greedy pack
        // leaves precisely one line of the paragraph at the foot of the first page: a 400px
        // content box, 380px of it taken by the block, and a 20px line that fits in what is left.
        return (
            <Document size={{ width: 600, height: 400 }} margin={0}>
                <AutoFlow>
                    <div style={{ height: 380 }}>lead</div>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}>
                        {Array.from({ length: 150 }, (_, index) => `word${index}`).join(" ")}
                    </p>
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
