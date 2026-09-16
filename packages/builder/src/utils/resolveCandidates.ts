/**
 * Path candidates to try when resolving an import specifier back to a known file.
 *
 * NodeNext / verbatimModuleSyntax projects (and any TypeScript project emitting to ESM) write
 * imports like `./component.js` even though the source file is `./component.ts`. Without stripping
 * the `.js`/`.jsx` etc. suffix we'd only try `component.js.ts`, `component.js.tsx`, ... — none of
 * which match. Emits the original specifier first (so a real `.js` on disk still wins), then the
 * stems with common runtime-extension mappings.
 */
export function resolveCandidates(importSource: string): string[] {
    const candidates = [importSource]
    const runtimeExts = [".js", ".jsx", ".mjs", ".cjs"]
    for (const ext of runtimeExts) {
        if (importSource.endsWith(ext)) {
            candidates.push(importSource.slice(0, -ext.length))
            break
        }
    }
    return candidates
}
