import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping"
import type { SourceMap } from "rolldown"
import type { Diagnostic, OnDiagnostic } from "@mochi-css/core"

/**
 * `MOCHI_FILE_EXEC` diagnostics (reported from inside the sandboxed VM — see
 * `resilientModuleWrap.ts` in `@mochi-css/plugins`) carry a raw V8 stack trace as a transient
 * `stack` field. Its positions are relative to the *bundled* script actually executed by the VM,
 * not any source file — this type exists only to read that field at the host boundary.
 */
type DiagnosticWithStack = Diagnostic & { stack?: string }

// Matches the last "line:col" (with optional trailing ")") in a stack frame line, e.g.
// "    at boom (evalmachine.<anonymous>:4:8)" or "    at evalmachine.<anonymous>:6:23".
const STACK_FRAME_POSITION = /:(\d+):(\d+)\)?\s*$/

function parseFirstFramePosition(stack: string): { line: number; column: number } | undefined {
    // First line is the error's own message ("Error: ..."); frames start after it.
    for (const frameLine of stack.split("\n").slice(1)) {
        const match = STACK_FRAME_POSITION.exec(frameLine)
        if (!match) continue
        const line = Number(match[1])
        const column = Number(match[2])
        if (Number.isFinite(line) && Number.isFinite(column)) return { line, column }
    }
    return undefined
}

/**
 * Wraps `onDiagnostic` so a `MOCHI_FILE_EXEC` diagnostic's position gets remapped, in two hops,
 * from the bundled-script position (where the VM caught the throw) all the way back to a
 * position in the *original* source file — before reaching the caller:
 *
 * 1. Bundle map: bundled-script position → position in the extracted per-file source (the
 *    bundler's own sourcemap, from bundling all extracted files together).
 * 2. Per-file map: that position → position in the original file (each extracted file's own
 *    printer-generated sourcemap, since the extracted/minimized AST nodes keep their original
 *    spans, a plain print-with-sourcemap already resolves this directly).
 *
 * `getBundleMap` is read lazily (once, on first `MOCHI_FILE_EXEC` diagnostic) so it can be
 * supplied by a variable populated only after bundling completes. `perFileMaps` is a live `Map`
 * (mutated by the caller as extraction proceeds) keyed by the same virtual file path the bundle
 * map's hop-1 `source` field resolves to — looked up, parsed, and cached lazily per file. The
 * transient `stack` field is always stripped before forwarding — callers should never see a raw
 * bundle-internal stack trace or an unmapped intermediate position.
 */
export function createDiagnosticRemapper(
    onDiagnostic: OnDiagnostic,
    getBundleMap: () => SourceMap | undefined,
    perFileMaps: ReadonlyMap<string, string>,
): OnDiagnostic {
    let bundleTraceMap: TraceMap | undefined
    let bundleMapResolved = false
    const perFileTraceMaps = new Map<string, TraceMap | undefined>()

    function getPerFileTraceMap(source: string): TraceMap | undefined {
        if (perFileTraceMaps.has(source)) return perFileTraceMaps.get(source)
        const map = perFileMaps.get(source)
        const traceMap = map ? new TraceMap(map) : undefined
        perFileTraceMaps.set(source, traceMap)
        return traceMap
    }

    return (diagnostic) => {
        const { stack, ...rest } = diagnostic as DiagnosticWithStack

        if (rest.code !== "MOCHI_FILE_EXEC" || !stack) {
            onDiagnostic(rest)
            return
        }

        if (!bundleMapResolved) {
            bundleMapResolved = true
            const map = getBundleMap()
            // TraceMap's object overload only accepts a *decoded* map; rolldown's SourceMap has
            // encoded (VLQ string) mappings, matching the string overload instead.
            if (map) bundleTraceMap = new TraceMap(JSON.stringify(map))
        }

        const framePosition = bundleTraceMap ? parseFirstFramePosition(stack) : undefined
        if (!bundleTraceMap || !framePosition) {
            onDiagnostic(rest)
            return
        }

        // V8 stack columns are 1-based; sourcemap lookups expect 0-based columns.
        const hop1 = originalPositionFor(bundleTraceMap, {
            line: framePosition.line,
            column: framePosition.column - 1,
        })
        if (hop1.line == null) {
            onDiagnostic(rest)
            return
        }

        const perFileMap = hop1.source ? getPerFileTraceMap(hop1.source) : undefined
        if (!perFileMap) {
            // No per-file map for this source (or it wasn't reprinted with one) — hop-1's
            // position, within the extracted/minimized source, is still better than nothing.
            onDiagnostic({ ...rest, line: hop1.line, column: hop1.column })
            return
        }

        const hop2 = originalPositionFor(perFileMap, { line: hop1.line, column: hop1.column })
        if (hop2.line == null) {
            onDiagnostic({ ...rest, line: hop1.line, column: hop1.column })
            return
        }

        onDiagnostic({ ...rest, line: hop2.line, column: hop2.column })
    }
}
