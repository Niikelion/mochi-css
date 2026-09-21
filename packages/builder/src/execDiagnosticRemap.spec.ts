import { describe, it, expect, vi } from "vitest"
import { GenMapping, addMapping, toEncodedMap } from "@jridgewell/gen-mapping"
import type { SourceMap } from "rolldown"
import type { Diagnostic } from "@mochi-css/core"
import { createDiagnosticRemapper } from "./execDiagnosticRemap"

/**
 * Builds a bundle-level sourcemap: generated line 5, column 10 maps back to line 2, column 3 of
 * `source` (default "src/broken.ts" — a path relative to the bundler's virtual root, matching
 * what `RolldownBundler.bundle` actually produces).
 */
function buildBundleMap(source = "src/broken.ts"): SourceMap {
    const map = new GenMapping({ file: "bundle.js" })
    addMapping(map, {
        generated: { line: 5, column: 10 },
        source,
        original: { line: 2, column: 3 },
    })
    return toEncodedMap(map) as unknown as SourceMap
}

/**
 * Builds a per-file sourcemap: line 2, column 3 of the extracted/minimized file maps back to
 * line 40, column 7 of the original user source file.
 */
function buildPerFileMap(): string {
    const map = new GenMapping({ file: "src/broken.ts" })
    addMapping(map, {
        generated: { line: 2, column: 3 },
        source: "original/broken.ts",
        original: { line: 40, column: 7 },
    })
    return JSON.stringify(toEncodedMap(map))
}

function stackWithFrame(line: number, column: number): string {
    return `Error: boom\n    at boom (evalmachine.<anonymous>:${line}:${column})\n    at Object.<anonymous> (evalmachine.<anonymous>:9:1)`
}

const noPerFileMaps = new Map<string, string>()

describe("createDiagnosticRemapper", () => {
    it("remaps a MOCHI_FILE_EXEC diagnostic's position using only the bundle map when no per-file map matches", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildBundleMap(),
            noPerFileMaps,
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

    it("remaps through both hops — bundle map then per-file map — to the original file position", () => {
        const received: Diagnostic[] = []
        const perFileMaps = new Map([["src/broken.ts", buildPerFileMap()]])
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildBundleMap(),
            perFileMaps,
        )

        remap({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(5, 11),
        } as Diagnostic & { stack: string })

        expect(received).toHaveLength(1)
        // The truly-original position (line 40, col 7), not the hop-1 intermediate (line 2, col 3).
        expect(received[0]).toMatchObject({ line: 40, column: 7 })
    })

    it("strips the stack field even when remapping succeeds", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildBundleMap(),
            noPerFileMaps,
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
        const getBundleMap = vi.fn(() => buildBundleMap())
        const remap = createDiagnosticRemapper((d) => received.push(d), getBundleMap, noPerFileMaps)

        const diagnostic: Diagnostic = { code: "MOCHI_UNRESOLVED_IMPORT", severity: "warning", message: "x" }
        remap(diagnostic)

        expect(received).toEqual([diagnostic])
        expect(getBundleMap).not.toHaveBeenCalled()
    })

    it("passes through a MOCHI_FILE_EXEC diagnostic with no stack unchanged", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildBundleMap(),
            noPerFileMaps,
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
            noPerFileMaps,
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
            () => buildBundleMap(),
            noPerFileMaps,
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

    it("falls back to forwarding without position when the hop-1 mapped position is unknown", () => {
        const received: Diagnostic[] = []
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildBundleMap(),
            noPerFileMaps,
        )

        // A position far outside anything the bundle map describes.
        remap({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(999, 999),
        } as Diagnostic & { stack: string })

        expect(received[0]?.line).toBeUndefined()
    })

    it("falls back to the hop-1 position when a per-file map exists but doesn't cover the position", () => {
        const received: Diagnostic[] = []
        // A per-file map for the right source, but its own mapping is for a position hop-1
        // never actually produces here (hop-1 always resolves to line 2, col 3 in this test file).
        const map = new GenMapping({ file: "src/broken.ts" })
        addMapping(map, {
            generated: { line: 999, column: 999 },
            source: "original/broken.ts",
            original: { line: 1, column: 0 },
        })
        const perFileMaps = new Map([["src/broken.ts", JSON.stringify(toEncodedMap(map))]])
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildBundleMap(),
            perFileMaps,
        )

        remap({
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(5, 11),
        } as Diagnostic & { stack: string })

        // Hop 2 has nothing for (2,3), so we keep hop-1's position rather than dropping it.
        expect(received[0]).toMatchObject({ line: 2, column: 3 })
    })

    it("only resolves the bundle map once, even across multiple diagnostics", () => {
        const received: Diagnostic[] = []
        const getBundleMap = vi.fn(() => buildBundleMap())
        const remap = createDiagnosticRemapper((d) => received.push(d), getBundleMap, noPerFileMaps)

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

    it("only parses a given per-file map once, even across multiple diagnostics for the same source", () => {
        const received: Diagnostic[] = []
        const perFileMaps = new Map([["src/broken.ts", buildPerFileMap()]])
        const getSpy = vi.spyOn(perFileMaps, "get")
        const remap = createDiagnosticRemapper(
            (d) => received.push(d),
            () => buildBundleMap(),
            perFileMaps,
        )

        const diagnostic = {
            code: "MOCHI_FILE_EXEC",
            severity: "warning",
            file: "src/broken.ts",
            message: "boom",
            stack: stackWithFrame(5, 11),
        } as Diagnostic & { stack: string }

        remap(diagnostic)
        remap(diagnostic)

        expect(getSpy).toHaveBeenCalledTimes(1)
        expect(received).toHaveLength(2)
        expect(received[1]).toMatchObject({ line: 40, column: 7 })
    })
})
