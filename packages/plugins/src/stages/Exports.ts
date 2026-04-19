import { type StageContext, defineStage, type FileCache } from "@mochi-css/builder"
import { isLocalImport, getOrInsert } from "../utils"

/** A single named reexport specifier from one source file. */
export type ReexportEntry = {
    /** Name of the binding in the source file. */
    originalName: string
    /** Name exposed by the current file's export. */
    exportedName: string
}

/**
 * Reexport data computed for a single file.
 *
 * - `reexports` — maps resolved source path → list of named reexports from that source
 *   (covers `export { foo } from "./src"` and `export { foo as bar } from "./src"`)
 * - `namespaceReexports` — resolved source paths for `export * from "./src"` declarations
 *
 * Only local imports (`./` or `../`) are tracked. Package imports are ignored.
 * Unresolvable local paths emit a `MOCHI_UNRESOLVED_IMPORT` diagnostic.
 */
export type ExportsStageResult = {
    reexports: Map<string, ReexportEntry[]>
    namespaceReexports: Set<string>
}

/**
 * Output of {@link exportsStage}.
 *
 * - `fileExports` — per-file cache of named and namespace reexport data
 */
export type ExportsStageOut = {
    fileExports: FileCache<ExportsStageResult>
}

/**
 * Reexport tracking.
 *
 * Scans each file for `export { ... } from "./..."` and `export * from "./..."` declarations
 * and resolves the source paths. The result is used by {@link ExtractorsPlugin} to build
 * barrel-compatible virtual bundles — barrel files with no CSS of their own are emitted into
 * the `.mochi/` bundle with their reexport declarations intact so that Rolldown can resolve
 * them correctly.
 */
export const exportsStage = defineStage({
    dependsOn: [],
    init(context: StageContext): ExportsStageOut {
        const { registry, resolveImport, log: onDiagnostic } = context
        const fileExports = registry.fileCache(
            (file) => [registry.fileData.for(file)],
            (file): ExportsStageResult => {
                const { ast } = registry.fileData.for(file).get()

                const reexports = new Map<string, ReexportEntry[]>()
                const namespaceReexports = new Set<string>()

                for (const item of ast.body) {
                    if (item.type === "ExportNamedDeclaration" && item.source) {
                        const sourceValue = item.source.value
                        if (!isLocalImport(sourceValue)) continue
                        const sourcePath = resolveImport(file, sourceValue)
                        if (sourcePath === null) {
                            onDiagnostic({
                                code: "MOCHI_UNRESOLVED_IMPORT",
                                message: `Cannot resolve local import "${sourceValue}"`,
                                severity: "warning",
                                file,
                                line: item.source.span.start,
                            })
                            continue
                        }
                        const entries = getOrInsert(reexports, sourcePath, () => [])
                        for (const specifier of item.specifiers) {
                            if (specifier.type !== "ExportSpecifier") continue
                            const originalName = specifier.orig.value
                            const exportedName = specifier.exported?.value ?? originalName
                            entries.push({ originalName, exportedName })
                        }
                        continue
                    }

                    if (item.type === "ExportAllDeclaration") {
                        const sourceValue = item.source.value
                        if (!isLocalImport(sourceValue)) continue
                        const sourcePath = resolveImport(file, sourceValue)
                        if (sourcePath === null) {
                            onDiagnostic({
                                code: "MOCHI_UNRESOLVED_IMPORT",
                                message: `Cannot resolve local import "${sourceValue}"`,
                                severity: "warning",
                                file,
                                line: item.source.span.start,
                            })
                            continue
                        }
                        namespaceReexports.add(sourcePath)
                    }
                }

                return { reexports, namespaceReexports }
            },
        )

        return { fileExports }
    },
})
