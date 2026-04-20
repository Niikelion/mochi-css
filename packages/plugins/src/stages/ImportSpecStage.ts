import type { StyleExtractor } from "../types"
import { RefMap } from "@mochi-css/builder"
import { defineStage } from "@mochi-css/builder"
import type { FileCache, ProjectInput, StageContext } from "@mochi-css/builder"
import { idToRef } from "@mochi-css/builder"

/**
 * Maps import path → (exported name → StyleExtractor).
 * Built from the extractor registry and injected into the stage via `extractors.set(lookup)`.
 */
export type ExtractorLookup = Map<string, Map<string, StyleExtractor>>

/**
 * Output of {@link importStageDef}.
 *
 * - `extractors` — writable project-level input; set the extractor lookup before running analysis
 * - `importSpecs` — computed cache: for each file, maps imported identifier refs to their {@link StyleExtractor}
 */
export type ImportSpecStageOut = {
    extractors: ProjectInput<ExtractorLookup>
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
 */
export const importStageDef = defineStage({
    dependsOn: [],
    init(context: StageContext): ImportSpecStageOut {
        const { registry } = context
        const extractors = registry.projectInput<ExtractorLookup>()

        const importSpecs = registry.fileCache(
            (file) => [registry.fileData.for(file), extractors.value],
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

        return { extractors, importSpecs }
    },
})
