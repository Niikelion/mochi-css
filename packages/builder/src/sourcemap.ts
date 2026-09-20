import { GenMapping, addMapping, setSourceContent, toEncodedMap, type EncodedSourceMap } from "@jridgewell/gen-mapping"
import { TraceMap, eachMapping, originalPositionFor } from "@jridgewell/trace-mapping"
import { diffChars, diffLines } from "diff"

/**
 * Sourcemap composition for the extraction pipeline.
 *
 * A file passes through two position-shifting steps before it is emitted:
 *   1. `filePreProcess` — a plain string transform (e.g. stable-id injection) that edits
 *      the raw disk source before it is parsed.
 *   2. parse → AST mutation → reprint — produces the final sourcemod and a printer map that
 *      points back at the *parse input* (the preprocessed string), not the disk file.
 *
 * To map the final output back to the true origin we compose the printer map with a map for
 * step 1. {@link buildPreprocessMap} derives the latter from a character diff so it works for
 * any string transform, and {@link composeWithPreprocessMap} chains them.
 */

type Cursor = { line: number; column: number }

/**
 * Advance a 1-based line / 0-based column cursor across `text`. Columns are counted in UTF-16
 * units (`ch.length`) to match the column basis sourcemaps and the SWC printer use.
 */
function advance(pos: Cursor, text: string): void {
    for (const ch of text) {
        if (ch === "\n") {
            pos.line++
            pos.column = 0
        } else {
            pos.column += ch.length
        }
    }
}

/**
 * Emit per-character identity mappings while advancing both cursors across `text`. Used for an
 * unchanged region: every character gets its own mapping so columns resolve exactly (sourcemap
 * consumers do not interpolate between segments).
 */
function emitIdentity(map: GenMapping, orig: Cursor, gen: Cursor, fileName: string, text: string): void {
    for (const ch of text) {
        addMapping(map, {
            generated: { line: gen.line, column: gen.column },
            source: fileName,
            original: { line: orig.line, column: orig.column },
        })
        if (ch === "\n") {
            orig.line++
            orig.column = 0
            gen.line++
            gen.column = 0
        } else {
            orig.column += ch.length
            gen.column += ch.length
        }
    }
}

/**
 * Build a sourcemap from a preprocessed string back to the original, given both texts.
 *
 * The diff is computed line-first, then character-level only within a modified line group. This
 * two-level structure is deliberate: a flat character diff aligns by longest-common-subsequence
 * and happily matches scattered characters across line boundaries, which misaligns the cursors
 * whenever whole lines are inserted. Anchoring on lines bounds the character diff to the region
 * that actually changed.
 *
 * Granularity is per-character within unchanged text, so columns are exact (not merely
 * line-accurate) — which matters because the composed lookup happens at arbitrary token-start
 * columns the printer chose. Map size is O(source length), a non-issue at build time.
 */
export function buildPreprocessMap(original: string, transformed: string, fileName: string): EncodedSourceMap {
    const map = new GenMapping({ file: fileName })
    setSourceContent(map, fileName, original)

    const orig: Cursor = { line: 1, column: 0 }
    const gen: Cursor = { line: 1, column: 0 }

    const emitModified = (removedText: string, addedText: string): void => {
        // Bounded character diff over just the changed region.
        for (const part of diffChars(removedText, addedText)) {
            if (part.added) advance(gen, part.value)
            else if (part.removed) advance(orig, part.value)
            else emitIdentity(map, orig, gen, fileName, part.value)
        }
    }

    const lineParts = diffLines(original, transformed)
    for (let i = 0; i < lineParts.length; i++) {
        const part = lineParts[i]
        if (!part) continue
        if (!part.added && !part.removed) {
            emitIdentity(map, orig, gen, fileName, part.value)
            continue
        }
        // Gather a run of consecutive changed parts (a replacement is a removed block followed
        // by an added block) and reconcile them with a single bounded character diff.
        let removedText = ""
        let addedText = ""
        while (i < lineParts.length) {
            const p = lineParts[i]
            if (!p || (!p.added && !p.removed)) break
            if (p.removed) removedText += p.value
            else addedText += p.value
            i++
        }
        i-- // step back so the outer loop's increment lands on the next unconsumed part
        emitModified(removedText, addedText)
    }

    return toEncodedMap(map)
}

/**
 * Compose a printer map (output → preprocessed input) with a preprocess map
 * (preprocessed input → disk original), yielding output → disk origin. The result carries the
 * disk source content so downstream consumers resolve to the real file.
 *
 * Each printer-map segment is re-pointed by tracing its original position through the
 * preprocess map. Done explicitly rather than via a generic remapping pass because both maps
 * describe a single, identically named source, which a name-keyed composer cannot disambiguate.
 */
/**
 * Shift every generated position in an encoded map down by `lineOffset` lines, without touching
 * the original positions. Integrations prepend generated-only lines (CSS `import` statements) to
 * the emitted source; this re-aligns the map so those leading lines are simply unmapped and
 * everything below maps as before. A no-op when `lineOffset <= 0`.
 */
export function offsetSourcemapLines(map: string, lineOffset: number): string {
    if (lineOffset <= 0) return map
    const parsed = JSON.parse(map) as { mappings: string }
    // The `mappings` field is `;`-delimited per generated line, so N leading semicolons insert N
    // empty (unmapped) lines at the top.
    parsed.mappings = ";".repeat(lineOffset) + parsed.mappings
    return JSON.stringify(parsed)
}

export function composeWithPreprocessMap(printMap: string, preprocessMap: EncodedSourceMap): string {
    const printTrace = new TraceMap(printMap)
    const preTrace = new TraceMap(preprocessMap)
    const diskSource = preprocessMap.sources[0] ?? undefined
    const diskContent = preprocessMap.sourcesContent?.[0] ?? null

    const out = new GenMapping({ file: printTrace.file ?? undefined })

    eachMapping(printTrace, (m) => {
        if (m.originalLine == null) return
        const origin = originalPositionFor(preTrace, { line: m.originalLine, column: m.originalColumn })
        if (origin.line == null) return
        const source = origin.source ?? diskSource
        if (source === undefined) return
        const generated = { line: m.generatedLine, column: m.generatedColumn }
        const original = { line: origin.line, column: origin.column }
        const name = m.name ?? origin.name
        if (name != null) {
            addMapping(out, { generated, source, original, name })
        } else {
            addMapping(out, { generated, source, original })
        }
    })

    if (diskSource !== undefined && diskContent !== null) {
        setSourceContent(out, diskSource, diskContent)
    }

    return JSON.stringify(toEncodedMap(out))
}
