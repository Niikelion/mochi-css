import * as SWC from "@swc/core"
import type { StyleExtractor } from "../types"
import type { OnDiagnostic } from "@mochi-css/core"
import type { ResolveImport } from "@mochi-css/builder"
import { RefMap } from "@mochi-css/builder"
import { defineStage } from "@mochi-css/builder"
import type { CacheRegistry, FileCache, FileInput } from "@mochi-css/builder"
import { idToRef, getOrInsert } from "@mochi-css/builder"
import type { StageDefinition } from "@mochi-css/builder"

export type ExtractorLookup = Map<string, Map<string, StyleExtractor>>

export type FileData = {
    ast: SWC.Module
    filePath: string
    resolveImport: ResolveImport
    onDiagnostic: OnDiagnostic | undefined
}

export type ImportSpecStageOut = {
    fileData: FileInput<FileData>
    importSpecs: FileCache<RefMap<StyleExtractor>>
}

export const IMPORT_SPEC_STAGE = Symbol.for("ImportSpecStage")

export function makeImportSpecStage(extractors: StyleExtractor[]): StageDefinition<[], ImportSpecStageOut> {
    const extractorLookup: ExtractorLookup = new Map()
    for (const extractor of extractors) {
        getOrInsert(extractorLookup, extractor.importPath, () => new Map()).set(extractor.symbolName, extractor)
    }

    const stage = defineStage({
        dependsOn: [],
        init(registry: CacheRegistry): ImportSpecStageOut {
            const fileData: FileInput<FileData> = registry.fileInput<FileData>()

            const importSpecs = registry.fileCache(
                (file) => [fileData.cache.for(file)],
                (file): RefMap<StyleExtractor> => {
                    const data = fileData.cache.for(file).get()
                    const result = new RefMap<StyleExtractor>()
                    for (const item of data.ast.body) {
                        if (item.type !== "ImportDeclaration") continue
                        const possibleExtractors = extractorLookup.get(item.source.value)
                        if (!possibleExtractors) continue
                        for (const specifier of item.specifiers) {
                            if (specifier.type === "ImportNamespaceSpecifier") continue
                            const ref = idToRef(specifier.local)
                            const sourceName =
                                specifier.type === "ImportSpecifier"
                                    ? (specifier.imported?.value ?? ref.name)
                                    : ref.name
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

    return Object.assign(stage, { [IMPORT_SPEC_STAGE]: true as const })
}
