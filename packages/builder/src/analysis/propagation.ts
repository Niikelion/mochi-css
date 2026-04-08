import * as SWC from "@swc/core"
import { visit } from "@/Visitor"
import type { Ref } from "./helpers"
import { idToRef } from "./helpers"
import type { BindingInfo, FileView } from "./types"

function bindingKey(filePath: string, ref: Ref): string {
    return `${filePath}:${ref.name}:${ref.id}`
}

export function propagateUsagesFromRef(
    analyzedBindings: Set<string>,
    filesInfo: Map<string, FileView>,
    fileInfo: FileView,
    ref: Ref,
): void {
    if (ref.id === undefined) return

    const key = bindingKey(fileInfo.filePath, ref)
    if (analyzedBindings.has(key)) return
    analyzedBindings.add(key)

    const localImport = fileInfo.localImports.get(ref)
    if (localImport) {
        const importedFileView = filesInfo.get(localImport.sourcePath)
        const exportedRef = importedFileView?.exports.get(localImport.exportName)
        if (importedFileView && exportedRef) {
            propagateUsagesFromRef(analyzedBindings, filesInfo, importedFileView, exportedRef)
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
    filesInfo: Map<string, FileView>,
    fileInfo: FileView,
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
    filesInfo: Map<string, FileView>,
    fileInfo: FileView,
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
