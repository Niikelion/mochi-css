import { describe, it, expect, vi } from "vitest"
import { GenMapping, addMapping, toEncodedMap } from "@jridgewell/gen-mapping"
import type { SourceMap } from "rolldown"
import type { Diagnostic } from "@mochi-css/core"
import { createDiagnosticRemapper } from "./execDiagnosticRemap"

/**
 * Builds a real sourcemap: generated line 5, column 10 maps back to original line 2, column 3 of
 * "original.ts". Mirrors the shape rolldown's `BundleResult.map` actually has.
 */
function buildTestMap(): SourceMap {
    const map = new GenMapping({ file: "bundle.js" })
    addMapping(map, {
        generated: { line: 5, column: 10 },
        source: "original.ts",
        original: { line: 2, column: 3 },
    })
    return toEncodedMap(map) as unknown as SourceMap
}

function stackWithFrame(line: number, column: number): string {
    return `Error: boom\n    at boom (evalmachine.<anonymous>:${line}:${column})\n    at Object.<anonymous> (evalmachine.<anonymous>:9:1)`
}

describe("createDiagnosticRemapper", () => {
    it("remaps a MOCHI_FILE_EXEC diagnostic's position using the bundle map", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildTestMap(),
        )

        // V8 stack columns are 1-based; the frame reports column 11 for generated column 10.
        const diagnostic = {
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(5, 11),
        } as Diagnostic & { stack: string }

        remap(diagnostic)

        expect(received).toHaveLength(1)
        expect(received[0]).toMatchObject({
            code: "MOCHI_FILE_EXEC",
            file: "src/broken.ts",
            line: 2,
            column: 3,
        })
    })

    it("strips the stack field even when remapping succeeds", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildTestMap(),
        )

        remap({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(5, 11),
        } as Diagnostic & { stack: string })

        expect(received[0]).not.toHaveProperty("stack")
    })

    it("passes through diagnostics that are not MOCHI_FILE_EXEC unchanged", () => {
        const received: Diagnostic[] = []
        const getBundleMap = vi.fn(() => buildTestMap())
        const remap = createDiagnosticRemapper((d) => received.push(d), getBundleMap)

        const diagnostic: Diagnostic = { code: "MOCHI_UNRESOLVED_IMPORT", severity: "warning", message: "x" }
        remap(diagnostic)

        expect(received).toEqual([diagnostic])
        expect(getBundleMap).not.toHaveBeenCalled()
    })

    it("passes through a MOCHI_FILE_EXEC diagnostic with no stack unchanged", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildTestMap(),
        )

        const diagnostic: Diagnostic = { code: "MOCHI_FILE_EXEC", severity: "warning", message: "boom" }
        remap(diagnostic)

        expect(received).toEqual([diagnostic])
    })

    it("falls back to forwarding without position when no bundle map is available", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => undefined,
        )

        remap({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(5, 11),
        } as Diagnostic & { stack: string })

        expect(received[0]).toMatchObject({ code: "MOCHI_FILE_EXEC", file: "src/broken.ts" })
        expect(received[0]?.line).toBeUndefined()
    })

    it("falls back to forwarding without position when the stack has no parseable frame", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildTestMap(),
        )

        remap({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: "Error: boom\n    <native code>",
        } as Diagnostic & { stack: string })

        expect(received[0]?.line).toBeUndefined()
    })

    it("falls back to forwarding without position when the mapped position is unknown", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildTestMap(),
        )

        // A position far outside anything the map describes.
        remap({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(999, 999),
        } as Diagnostic & { stack: string })

        expect(received[0]?.line).toBeUndefined()
    })

    it("only resolves the bundle map once, even across multiple diagnostics", () => {
        const received: Diagnostic[] = []
        const getBundleMap = vi.fn(() => buildTestMap())
        const remap = createDiagnosticRemapper((d) => received.push(d), getBundleMap)

        const diagnostic = {
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(5, 11),
        } as Diagnostic & { stack: string }

        remap(diagnostic)
        remap(diagnostic)

        expect(getBundleMap).toHaveBeenCalledTimes(1)
        expect(received).toHaveLength(2)
    })
})
