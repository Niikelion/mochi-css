import * as SWC from "@swc/core"
import { visit, idToRef } from "@mochi-css/builder"
import type { Ref, BindingInfo } from "@mochi-css/builder"
import type { FileInfo } from "./types"

export type ReexportResolver = (fileView: FileInfo, exportName: string) => { fileView: FileInfo; ref: Ref } | null

function bindingKey(filePath: string, ref: Ref): string {
    return `${filePath}:${ref.name}:${ref.id}`
}

export function propagateUsagesFromRef(
    analyzedBindings: Set<string>,
    filesInfo: Map<string, FileInfo>,
    fileInfo: FileInfo,
    ref: Ref,
    resolveReexport?: ReexportResolver,
): void {
    if (ref.id === undefined) return

    const key = bindingKey(fileInfo.filePath, ref)
    if (analyzedBindings.has(key)) return
    analyzedBindings.add(key)

    const localImport = fileInfo.localImports.get(ref)
    if (localImport) {
        const importedFileInfo = filesInfo.get(localImport.sourcePath)
        const exportedRef = importedFileInfo?.exports.get(localImport.exportName)
        if (importedFileInfo && exportedRef) {
            propagateUsagesFromRef(analyzedBindings, filesInfo, importedFileInfo, exportedRef, resolveReexport)
        } else if (importedFileInfo && resolveReexport) {
            const resolved = resolveReexport(importedFileInfo, localImport.exportName)
            if (resolved) {
                propagateUsagesFromRef(analyzedBindings, filesInfo, resolved.fileView, resolved.ref, resolveReexport)
            }
        }
        const importBinding = fileInfo.moduleBindings.get(ref)
        if (importBinding) fileInfo.usedBindings.add(importBinding)
        return
    }

    const binding = fileInfo.moduleBindings.get(ref)
    if (!binding) return

    propagateUsagesFromBinding(analyzedBindings, filesInfo, fileInfo, binding, resolveReexport)
}

function propagateUsagesFromBinding(
    analyzedBindings: Set<string>,
    filesInfo: Map<string, FileInfo>,
    fileInfo: FileInfo,
    binding: BindingInfo,
    resolveReexport?: ReexportResolver,
): void {
    if (fileInfo.usedBindings.has(binding)) return
    fileInfo.usedBindings.add(binding)

    if (binding.declarator.type === "variable" && binding.declarator.declarator.init) {
        visit.expression(
            binding.declarator.declarator.init,
            {
                identifier(node) {
                    propagateUsagesFromRef(analyzedBindings, filesInfo, fileInfo, idToRef(node), resolveReexport)
                },
            },
            null,
        )
    }
}

export function propagateUsagesFromExpr(
    analyzedBindings: Set<string>,
    filesInfo: Map<string, FileInfo>,
    fileInfo: FileInfo,
    expr: SWC.Expression,
    resolveReexport?: ReexportResolver,
): void {
    visit.expression(
        expr,
        {
            identifier(node) {
                propagateUsagesFromRef(analyzedBindings, filesInfo, fileInfo, idToRef(node), resolveReexport)
            },
        },
        null,
    )
}
