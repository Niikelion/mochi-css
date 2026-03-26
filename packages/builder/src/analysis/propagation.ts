import * as SWC from "@swc/core"
import { visit } from "@/Visitor"
import type { Ref } from "./helpers"
import { idToRef } from "./helpers"
import type { BindingInfo, FileInfo } from "./types"

function bindingKey(filePath: string, ref: Ref): string {
    return `${filePath}:${ref.name}:${ref.id}`
}

export function propagateUsagesFromRef(
    analyzedBindings: Set<string>,
    filesInfo: Map<string, FileInfo>,
    fileInfo: FileInfo,
    ref: Ref,
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
            propagateUsagesFromRef(analyzedBindings, filesInfo, importedFileInfo, exportedRef)
        }
        const importBinding = fileInfo.moduleBindings.get(ref)
        if (importBinding) fileInfo.usedBindings.add(importBinding)
        return
    }

    const binding = fileInfo.moduleBindings.get(ref)
    if (!binding) return

    propagateUsagesFromBinding(analyzedBindings, filesInfo, fileInfo, binding)
}

function propagateUsagesFromBinding(
    analyzedBindings: Set<string>,
    filesInfo: Map<string, FileInfo>,
    fileInfo: FileInfo,
    binding: BindingInfo,
): void {
    if (fileInfo.usedBindings.has(binding)) return
    fileInfo.usedBindings.add(binding)

    if (binding.declarator.type === "variable" && binding.declarator.declarator.init) {
        visit.expression(
            binding.declarator.declarator.init,
            {
                identifier(node) {
                    propagateUsagesFromRef(analyzedBindings, filesInfo, fileInfo, idToRef(node))
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
): void {
    visit.expression(
        expr,
        {
            identifier(node) {
                propagateUsagesFromRef(analyzedBindings, filesInfo, fileInfo, idToRef(node))
            },
        },
        null,
    )
}
