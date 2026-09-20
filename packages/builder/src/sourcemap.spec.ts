import { describe, it, expect } from "vitest"
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping"
import { GenMapping, addMapping, setSourceContent, toEncodedMap } from "@jridgewell/gen-mapping"
import { buildPreprocessMap, composeWithPreprocessMap, offsetSourcemapLines } from "@/sourcemap"

/** Locate the 1-based line / 0-based column of the first occurrence of `needle`. */
function locate(text: string, needle: string): { line: number; column: number } {
    const idx = text.indexOf(needle)
    let line = 1
    let lastNewline = -1
    for (let i = 0; i < idx; i++) {
        if (text[i] === "\n") {
            line++
            lastNewline = i
        }
    }
    return { line, column: idx - lastNewline - 1 }
}

describe("buildPreprocessMap", () => {
    it("maps unchanged content 1:1", () => {
        const text = "const a = 1\nconst b = 2\n"
        const map = new TraceMap(buildPreprocessMap(text, text, "f.ts"))
        for (const tok of ["a", "b"]) {
            const pos = locate(text, tok)
            expect(originalPositionFor(map, pos)).toMatchObject({ line: pos.line, column: pos.column })
        }
    })

    it("keeps line fidelity for content after an in-line insertion", () => {
        const original = "const a = css({})\nconst after = 2\n"
        // filePreProcess injects a stable-id argument before the closing paren.
        const transformed = "const a = css({}, 's-x')\nconst after = 2\n"
        const map = new TraceMap(buildPreprocessMap(original, transformed, "f.ts"))

        // Tokens before the insertion are exact.
        const css = locate(transformed, "css")
        expect(originalPositionFor(map, css)).toMatchObject(locate(original, "css"))

        // Tokens on a later line map back to the right original line and column.
        const after = locate(transformed, "after")
        expect(originalPositionFor(map, after)).toMatchObject(locate(original, "after"))
    })

    it("embeds the original as source content", () => {
        const original = "const a = 1\n"
        const transformed = "const a = 1, b = 2\n"
        const map = buildPreprocessMap(original, transformed, "f.ts")
        expect(map.sources).toEqual(["f.ts"])
        expect(map.sourcesContent).toEqual([original])
    })
})

describe("offsetSourcemapLines", () => {
    it("shifts generated lines down so prepended lines are unmapped", () => {
        const code = "const target = 1\n"
        const gen = new GenMapping({ file: "f.ts" })
        setSourceContent(gen, "f.ts", code)
        addMapping(gen, { generated: locate(code, "target"), source: "f.ts", original: locate(code, "target") })
        const map = JSON.stringify(toEncodedMap(gen))

        // Prepend 2 import lines: the token is now on generated line 3 but still maps to line 1.
        const shifted = new TraceMap(offsetSourcemapLines(map, 2))
        expect(originalPositionFor(shifted, { line: 3, column: 6 })).toMatchObject(locate(code, "target"))
    })

    it("is a no-op for a zero offset", () => {
        const map = JSON.stringify(toEncodedMap(new GenMapping({ file: "f.ts" })))
        expect(offsetSourcemapLines(map, 0)).toBe(map)
    })
})

describe("composeWithPreprocessMap", () => {
    it("chains a printer map and a preprocess map back to disk origin", () => {
        // disk -> preprocessed: insert a leading line so positions shift down by one line.
        const disk = "const target = 1\n"
        const preprocessed = "const injected = 0\nconst target = 1\n"
        const preMap = buildPreprocessMap(disk, preprocessed, "f.ts")

        // preprocessed -> output: pretend the printer moved `target` to the first line.
        const output = "const target = 1;\nconst injected = 0;\n"
        const printGen = new GenMapping({ file: "f.ts" })
        setSourceContent(printGen, "f.ts", preprocessed)
        addMapping(printGen, {
            generated: locate(output, "target"),
            source: "f.ts",
            original: locate(preprocessed, "target"),
        })
        const printMap = JSON.stringify(toEncodedMap(printGen))

        const composed = new TraceMap(composeWithPreprocessMap(printMap, preMap))
        // `target` in the output should resolve all the way back to its position in disk.
        expect(originalPositionFor(composed, locate(output, "target"))).toMatchObject(locate(disk, "target"))
    })
})
