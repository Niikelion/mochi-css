import * as SWC from "@swc/core"
import { OnDiagnostic } from "@/diagnostics"
import { createCacheRegistry } from "@/analysis/CacheEngine"
import type { StageDefinition } from "@/analysis/Stage"
import { propagateUsagesFromExpr } from "@/analysis/propagation"
import { topoSort } from "@/analysis/helpers"
import {
    type BindingInfo,
    type DerivedExtractorBinding,
    type FileInfo,
    type ImportSpec,
    type Module,
    RefMap,
    type ResolveImport,
} from "@/analysis/types"
import {
    IMPORT_SPEC_STAGE,
    DERIVED_EXTRACTOR_STAGE,
    STYLE_EXPR_STAGE,
    BINDING_STAGE,
    CROSS_FILE_DERIVED_STAGE,
    type ImportSpecStageOut,
    type DerivedExtractorStageOut,
    type StyleExprStageOut,
    type BindingStageOut,
    type CrossFileDerivedStageOut,
    type CrossFileResult,
} from "@/analysis/stages"

export type { Module, ImportSpec, FileInfo, ResolveImport }
export type { BindingInfo, BindingDeclarator, LocalImport, DerivedExtractorBinding } from "@/analysis/types"
export { RefMap } from "@/analysis/types"
export type { Ref } from "@/analysis/types"

declare module "@swc/core" {
    interface Identifier {
        ctxt?: number
    }
}

function mergeMap<K, V extends unknown[]>(base: Map<K, V>, extra: Map<K, V>): Map<K, V> {
    if (extra.size === 0) return base
    const result = new Map(base)
    for (const [k, v] of extra) {
        const existing = result.get(k)
        if (existing) result.set(k, [...existing, ...v] as V)
        else result.set(k, [...v] as V)
    }
    return result
}

export class ProjectIndex {
    private readonly modules: Module[]
    private readonly resolveImport: ResolveImport
    private readonly onDiagnostic: OnDiagnostic | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly instanceMap: Map<StageDefinition<any[], any>, unknown>
    private readonly importInst: ImportSpecStageOut
    private readonly crossFileDerived: CrossFileDerivedStageOut
    private readonly bindingStage: BindingStageOut
    private readonly styleExprStage: StyleExprStageOut
    private readonly derivedStage: DerivedExtractorStageOut
    private analyzedBindings = new Set<string>()
    // Stable usedBindings sets (cleared in-place on reset; same Set reused across cache rebuilds)
    private readonly perFileUsedBindings = new Map<string, Set<BindingInfo>>()
    // Stable FileInfo cache — returned by-reference so AstProxy mutations persist
    private fileInfoCache: Map<string, FileInfo> | null = null

    private assembleFileInfo(m: Module, crossFileMap: CrossFileResult): FileInfo {
        const { moduleBindings, localImports, references, exports, exportedDerivedExtractors } =
            this.bindingStage.fileBindings.for(m.filePath).get()
        const { derivedBindings } = this.derivedStage.derived.for(m.filePath).get()
        const { styleExpressions, extractedExpressions, extractedCallExpressions } = this.styleExprStage.styleExprs
            .for(m.filePath)
            .get()
        const extra = crossFileMap.get(m.filePath)

        let usedBindings = this.perFileUsedBindings.get(m.filePath)
        if (!usedBindings) {
            usedBindings = new Set<BindingInfo>()
            this.perFileUsedBindings.set(m.filePath, usedBindings)
        }
        if (extra) {
            for (const ref of extra.usedImportRefs) {
                const b = moduleBindings.get(ref)
                if (b) usedBindings.add(b)
            }
        }

        const allDerivedBindings = new RefMap<DerivedExtractorBinding>()
        for (const [ref, b] of derivedBindings.entries()) allDerivedBindings.set(ref, b)
        if (extra) {
            for (const [ref, b] of extra.additionalDerivedBindings.entries()) allDerivedBindings.set(ref, b)
        }

        return {
            filePath: m.filePath,
            ast: m.ast,
            styleExpressions: extra ? new Set([...styleExpressions, ...extra.additionalStyleExprs]) : styleExpressions,
            extractedExpressions: extra
                ? mergeMap(extractedExpressions, extra.additionalExtractedExprs)
                : extractedExpressions,
            extractedCallExpressions: extra
                ? mergeMap(extractedCallExpressions, extra.additionalExtractedCallExprs)
                : extractedCallExpressions,
            references,
            moduleBindings,
            localImports,
            usedBindings,
            exports,
            derivedExtractorBindings: allDerivedBindings,
            exportedDerivedExtractors,
        }
    }

    private getFileInfoCache(): Map<string, FileInfo> {
        if (this.fileInfoCache) return this.fileInfoCache
        const crossFileMap = this.crossFileDerived.crossFileResult.get()
        const cache = new Map<string, FileInfo>()
        for (const m of this.modules) {
            cache.set(m.filePath, this.assembleFileInfo(m, crossFileMap))
        }
        this.fileInfoCache = cache
        return cache
    }

    public get files(): [string, FileInfo][] {
        return [...this.getFileInfoCache().entries()]
    }

    constructor(
        modules: Module[],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stages: readonly StageDefinition<any[], any>[],
        resolveImport: ResolveImport,
        onDiagnostic?: OnDiagnostic,
    ) {
        this.modules = modules
        this.resolveImport = resolveImport
        this.onDiagnostic = onDiagnostic

        const filePaths = modules.map((m) => m.filePath)
        const registry = createCacheRegistry(filePaths)
        const sorted = topoSort(stages)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instanceMap = new Map<StageDefinition<any[], any>, unknown>()

        for (const stage of sorted) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const deps = stage.dependsOn.map((d) => instanceMap.get(d))
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const instance = stage.init(registry, ...deps)
            instanceMap.set(stage, instance)
        }
        this.instanceMap = instanceMap

        this.importInst = this.findInstance<ImportSpecStageOut>(IMPORT_SPEC_STAGE)
        this.derivedStage = this.findInstance<DerivedExtractorStageOut>(DERIVED_EXTRACTOR_STAGE)
        this.styleExprStage = this.findInstance<StyleExprStageOut>(STYLE_EXPR_STAGE)
        this.bindingStage = this.findInstance<BindingStageOut>(BINDING_STAGE)
        this.crossFileDerived = this.findInstance<CrossFileDerivedStageOut>(CROSS_FILE_DERIVED_STAGE)

        for (const m of modules) {
            this.importInst.fileData.set(m.filePath, {
                ast: m.ast,
                filePath: m.filePath,
                resolveImport,
                onDiagnostic,
            })
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
    private findInstance<T>(tag: symbol): T {
        for (const [stage, inst] of this.instanceMap) {
            if ((stage as Record<symbol, unknown>)[tag] === true) return inst as T
        }
        throw new Error(`Required stage not found (${String(tag)}). Make sure to include extractor stages.`)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getInstance<D extends StageDefinition<any[], any>[], O>(stage: StageDefinition<D, O>): O {
        const inst = this.instanceMap.get(stage)
        if (inst === undefined) throw new Error(`Stage not registered`)
        return inst as O
    }

    public reanalyzeFiles(dirtyFilePaths: Set<string>): void {
        for (const filePath of dirtyFilePaths) {
            this.importInst.fileData.invalidate(filePath)
            this.perFileUsedBindings.delete(filePath)
        }
        this.fileInfoCache = null
    }

    public resetCrossFileState(): void {
        this.analyzedBindings.clear()
        for (const s of this.perFileUsedBindings.values()) s.clear()
        this.crossFileDerived.crossFileResult.invalidate()
        this.fileInfoCache = null
    }

    public discoverCrossFileDerivedExtractors(): void {
        this.crossFileDerived.crossFileResult.get()
    }

    public propagateUsages(extraExpressions?: Map<string, Set<SWC.Expression>>): void {
        const filesInfo = new Map(this.files)
        for (const [, fileInfo] of filesInfo) {
            for (const expr of fileInfo.styleExpressions) {
                propagateUsagesFromExpr(this.analyzedBindings, filesInfo, fileInfo, expr)
            }
            for (const expr of extraExpressions?.get(fileInfo.filePath) ?? []) {
                propagateUsagesFromExpr(this.analyzedBindings, filesInfo, fileInfo, expr)
            }
        }
    }

    public static extractImportSpecs(node: SWC.ImportDeclaration): ImportSpec[] {
        const source = node.source.value
        return node.specifiers.map((specifier) => {
            const ref = { name: specifier.local.value, id: specifier.local.ctxt }
            switch (specifier.type) {
                case "ImportSpecifier":
                    return { source, ref, sourceName: specifier.imported?.value ?? ref.name, isNamespace: false }
                case "ImportDefaultSpecifier":
                    return { source, ref, sourceName: ref.name, isNamespace: false }
                case "ImportNamespaceSpecifier":
                    return { source, ref, sourceName: ref.name, isNamespace: true }
            }
        })
    }
}
