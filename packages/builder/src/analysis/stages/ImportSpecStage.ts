import * as SWC from "@swc/core"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { OnDiagnostic } from "@/diagnostics"
import { type ResolveImport, RefMap } from "@/analysis/types"
import { defineStage } from "@/analysis/Stage"
import type { CacheRegistry, FileInput } from "@/analysis/CacheEngine"
import { idToRef } from "@/analysis/helpers"

export type ExtractorLookup = Map<string, Map<string, StyleExtractor>>

export type FileData = {
    ast: SWC.Module
    filePath: string
    extractorLookup: ExtractorLookup
    resolveImport: ResolveImport
    onDiagnostic: OnDiagnostic | undefined
}

export const ImportSpecStage = defineStage({
    dependsOn: [],
    init(registry: CacheRegistry) {
        const fileData: FileInput<FileData> = registry.fileInput<FileData>()

        const importSpecs = registry.fileCache(
            (file) => [fileData.cache.for(file)],
            (file): RefMap<StyleExtractor> => {
                const data = fileData.cache.for(file).get()
                const result = new RefMap<StyleExtractor>()
                for (const item of data.ast.body) {
                    if (item.type !== "ImportDeclaration") continue
                    const possibleExtractors = data.extractorLookup.get(item.source.value)
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

        return { fileData, importSpecs }
    },
})
