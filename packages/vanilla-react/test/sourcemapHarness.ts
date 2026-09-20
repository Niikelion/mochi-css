import { TraceMap, originalPositionFor, type EncodedSourceMap } from "@jridgewell/trace-mapping"
import { expect } from "vitest"

/**
 * Sourcemap correctness harness.
 *
 * This is the contract that every later phase of the sourcemap work is graded against:
 * given a generated file + the map the build emitted for it, a chosen token in the
 * generated output must map back to the *same token* in the original source.
 *
 * The harness is deliberately token-oriented (not statement-oriented): the whole point
 * of the work is segment-level fidelity, so the grader asserts on the exact start
 * position of a token, which only succeeds if the map carries a mapping at that column.
 */

/** A 1-based line / 0-based column position, matching the source-map spec and trace-mapping. */
export type Position = { line: number; column: number }

/**
 * Locate the start of the `occurrence`-th (0-based) instance of `needle` in `text`,
 * returning a {@link Position}. Throws if the needle is not found that many times — a
 * missing token is a harness authoring error, not a soft failure.
 */
export function locate(text: string, needle: string, occurrence = 0): Position {
    let from = 0
    let idx = -1
    for (let i = 0; i <= occurrence; i++) {
        idx = text.indexOf(needle, from)
        if (idx < 0) {
            throw new Error(`harness: token ${JSON.stringify(needle)} occurrence #${occurrence} not found in text`)
        }
        from = idx + 1
    }

    // Convert the absolute index to line/column.
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

export type GradeInput = {
    /** The map emitted by the build for this file: generated output -> original source. */
    map: EncodedSourceMap | string
    /** The generated (post-transform) code the map describes. */
    generatedCode: string
    /** The original source the map should point back into. */
    originalCode: string
    /** A token present in both generated and original code (e.g. an identifier that survives the transform). */
    needle: string
    /** Which occurrence of the token in the generated code (default 0). */
    generatedOccurrence?: number
    /** Which occurrence of the token in the original code (default 0). */
    originalOccurrence?: number
}

/**
 * Assert that the start of `needle` in the generated code maps, via `map`, back to the
 * start of `needle` in the original code. This is the core grading primitive.
 */
export function assertMapsToOriginal(input: GradeInput): void {
    const { map, generatedCode, originalCode, needle } = input
    const tracer = new TraceMap(map)

    const generatedPos = locate(generatedCode, needle, input.generatedOccurrence ?? 0)
    const expected = locate(originalCode, needle, input.originalOccurrence ?? 0)

    const traced = originalPositionFor(tracer, generatedPos)

    expect(
        traced.line,
        `token ${JSON.stringify(needle)} at generated ${generatedPos.line}:${generatedPos.column} ` +
            `should map to original line ${expected.line}, got ${traced.line} (col ${traced.column})`,
    ).toBe(expected.line)
    expect(
        traced.column,
        `token ${JSON.stringify(needle)} at generated ${generatedPos.line}:${generatedPos.column} ` +
            `should map to original column ${expected.column}, got ${traced.column} (line ${traced.line})`,
    ).toBe(expected.column)
}
