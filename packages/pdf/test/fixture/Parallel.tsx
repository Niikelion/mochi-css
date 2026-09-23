import { AutoFlow, Document } from "../../src/index"

const blocks = (count: number, prefix: string) =>
    Array.from({ length: count }, (_, index) => (
        <div key={index} data-item={`${prefix}${index}`} style={{ height: 40 }}>
            {prefix}
            {index}
        </div>
    ))

export function Parallel({ mode }: { mode: string }) {
    if (mode === "parallel-table-rows")
        return (
            <Document size={{ width: 600, height: 200 }} margin={0}>
                <AutoFlow>
                    <table style={{ width: "100%", borderSpacing: 0 }}>
                        <tbody>
                            {Array.from({ length: 8 }, (_, index) => (
                                <tr key={index}>
                                    <td style={{ padding: "4px" }}>
                                        <div data-item={`row${index}`} style={{ height: 40 }}>
                                            row{index}
                                        </div>
                                    </td>
                                    <td style={{ padding: "4px" }}>short</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </AutoFlow>
            </Document>
        )
    if (mode === "parallel-grid-rows")
        return (
            <Document size={{ width: 600, height: 200 }} margin={0}>
                <AutoFlow>
                    <div data-layout="" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                        {blocks(16, "grid")}
                    </div>
                </AutoFlow>
            </Document>
        )
    const left = blocks(8, "left")
    const right = blocks(2, "right")
    return (
        <Document size={{ width: 600, height: 200 }} margin={0}>
            <AutoFlow>
                {mode === "parallel-table" || mode === "parallel-rowspan" ? (
                    <table data-layout="" style={{ width: "100%", borderSpacing: 0 }}>
                        <tbody>
                            {mode === "parallel-rowspan" && (
                                <tr>
                                    <td data-slot="span" rowSpan={2} style={{ padding: 0, verticalAlign: "top" }}>
                                        <div data-item="span" style={{ height: 40 }}>
                                            span
                                        </div>
                                    </td>
                                    <td colSpan={3} style={{ padding: 0 }} />
                                </tr>
                            )}
                            <tr>
                                <td data-slot="left" style={{ padding: 0, verticalAlign: "top" }}>
                                    {left}
                                </td>
                                <td data-slot="right" colSpan={2} style={{ padding: 0, verticalAlign: "top" }}>
                                    {right}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <div
                        data-layout=""
                        style={
                            mode.startsWith("parallel-grid")
                                ? {
                                      display: "grid",
                                      gridTemplateColumns: mode === "parallel-grid-span" ? "1fr 1fr 1fr" : "2fr 1fr",
                                  }
                                : { display: "flex" }
                        }
                    >
                        <div
                            data-slot="left"
                            style={{ flex: 2, gridColumn: mode === "parallel-grid-span" ? "span 2" : undefined }}
                        >
                            {left}
                        </div>
                        <div data-slot="right" style={{ flex: 1 }}>
                            {right}
                        </div>
                    </div>
                )}
                <div data-after="" style={{ height: 40 }}>
                    after
                </div>
            </AutoFlow>
        </Document>
    )
}
