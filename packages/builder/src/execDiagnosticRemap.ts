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
 * Wraps `onDiagnostic` so a `MOCHI_FILE_EXEC` diagnostic's position gets remapped from the
 * bundled-script position (where the VM caught the throw) to a position in the extracted,
 * per-file source — via the bundler's own sourcemap — before reaching the caller.
 *
 * `getBundleMap` is read lazily (once, on first `MOCHI_FILE_EXEC` diagnostic) so it can be
 * supplied by a variable populated only after bundling completes, without this wrapper needing
 * to know when that happens. The transient `stack` field is always stripped before forwarding —
 * callers should never see a raw bundle-internal stack trace.
 */
export function createDiagnosticRemapper(
    onDiagnostic: OnDiagnostic,
    getBundleMap: () => SourceMap | undefined,
): OnDiagnostic {
    let traceMap: TraceMap | undefined
    let resolved = false

    return (diagnostic) => {
        const { stack, ...rest } = diagnostic as DiagnosticWithStack

        if (rest.code !== "MOCHI_FILE_EXEC" || !stack) {
            onDiagnostic(rest)
            return
        }

        if (!resolved) {
            resolved = true
            const map = getBundleMap()
            // TraceMap's object overload only accepts a *decoded* map; rolldown's SourceMap has
            // encoded (VLQ string) mappings, matching the string overload instead.
            if (map) traceMap = new TraceMap(JSON.stringify(map))
        }

        const framePosition = traceMap ? parseFirstFramePosition(stack) : undefined
        if (!traceMap || !framePosition) {
            onDiagnostic(rest)
            return
        }

        // V8 stack columns are 1-based; sourcemap lookups expect 0-based columns.
        const original = originalPositionFor(traceMap, { line: framePosition.line, column: framePosition.column - 1 })
        if (original.line == null) {
            onDiagnostic(rest)
            return
        }

        onDiagnostic({ ...rest, line: original.line, column: original.column })
    }
}
