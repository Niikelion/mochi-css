import type { StyleExtractor } from "../types"
import type { OnDiagnostic } from "@mochi-css/core"
import type { ResolveImport } from "@mochi-css/builder"
import { RefMap } from "@mochi-css/builder"
import { defineStage } from "@mochi-css/builder"
import type { CacheRegistry, FileCache, FileInput, ProjectInput } from "@mochi-css/builder"
import { idToRef } from "@mochi-css/builder"

/**
 * Maps import path → (exported name → StyleExtractor).
 * Built from the extractor registry and injected into the stage via `extractors.set(lookup)`.
 */
export type ExtractorLookup = Map<string, Map<string, StyleExtractor>>

/**
 * Per-file callbacks injected from outside the stage pipeline.
 * Set via `importOut.fileCallbacks.set(filePath, callbacks)` before analysis runs.
 */
export type FileCallbacks = {
    resolveImport: ResolveImport
    onDiagnostic: OnDiagnostic | undefined
}

/**
 * Output of {@link importStageDef}.
 *
 * - `extractors` — writable project-level input; set the extractor lookup before running analysis
 * - `fileCallbacks` — writable per-file input; set resolve/diagnostic callbacks per file
 * - `importSpecs` — computed cache: for each file, maps imported identifier refs to their {@link StyleExtractor}
 */
export type ImportSpecStageOut = {
    extractors: ProjectInput<ExtractorLookup>
    fileCallbacks: FileInput<FileCallbacks>
    importSpecs: FileCache<RefMap<StyleExtractor>>
}

/**
 * Import specifier scanning.
 *
 * Reads each file's import declarations and maps every imported identifier that matches a
 * registered extractor to its {@link StyleExtractor}. Result is consumed by
 * {@link derivedStageDef} and {@link bindingStageDef}.
 *
 * External inputs that must be set before analysis:
 * - `out.extractors.set(lookup)` — the extractor lookup table (project-wide)
 * - `out.fileCallbacks.set(filePath, { resolveImport, onDiagnostic })` — per file
 */
export const importStageDef = defineStage({
    dependsOn: [],
    init(registry: CacheRegistry): ImportSpecStageOut {
        const extractors = registry.projectInput<ExtractorLookup>()
        const fileCallbacks = registry.fileInput<FileCallbacks>()

        const importSpecs = registry.fileCache(
            (file) => [registry.fileData.for(file), extractors.value, fileCallbacks.for(file)],
            (file): RefMap<StyleExtractor> => {
                const { ast } = registry.fileData.for(file).get()
                const extractorLookup = extractors.value.get()
                const result = new RefMap<StyleExtractor>()
                for (const item of ast.body) {
                    if (item.type !== "ImportDeclaration") continue
                    const possibleExtractors = extractorLookup.get(item.source.value)
                    if (!possibleExtractors) continue
                    for (const specifier of item.specifiers) {
                        if (specifier.type === "ImportNamespaceSpecifier") continue
                        const ref = idToRef(specifier.local)
                        const sourceName =
                            specifier.type === "ImportSpecifier" ? (specifier.imported?.value ?? ref.name) : ref.name
                        const source = possibleExtractors.get(sourceName)
                        if (!source) continue
                        result.set(ref, source)
                    }
                }
                return result
            },
        )

        return { extractors, fileCallbacks, importSpecs }
    },
})
