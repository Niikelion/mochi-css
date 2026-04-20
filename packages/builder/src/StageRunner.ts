import * as SWC from "@swc/core"
import { createCacheEngine } from "@/analysis/CacheEngine"
import type { CacheEngine } from "@/analysis/CacheEngine"
import type { AnyStage, StageContext, StageDefinition } from "@/analysis/Stage"
import { topoSort } from "@/analysis/helpers"
import type { BindingInfo, BindingDeclarator, LocalImport, ImportSpec, Module, ResolveImport } from "@/analysis/types"
import { OnDiagnostic } from "@mochi-css/core"

export type { Module, ImportSpec, ResolveImport }
export type { BindingInfo, BindingDeclarator, LocalImport }
export { RefMap } from "@/analysis/types"
export type { Ref } from "@/analysis/types"

declare module "@swc/core" {
    interface Identifier {
        ctxt?: number
    }
}

export class StageRunner {
    private readonly instanceMap: Map<AnyStage, unknown>
    private readonly filePaths: string[]
    public readonly engine: CacheEngine

    constructor(modules: Module[], stages: readonly AnyStage[], log: OnDiagnostic, resolveImport: ResolveImport) {
        this.filePaths = modules.map((m) => m.filePath)
        this.engine = createCacheEngine(this.filePaths)

        for (const module of modules) {
            this.engine.fileData.set(module.filePath, module)
        }

        const sorted = topoSort(stages)
        const instanceMap = new Map<AnyStage, unknown>()

        const context: StageContext = {
            registry: this.engine,
            log,
            resolveImport,
        }

        for (const stage of sorted) {
            const deps = stage.dependsOn.map((d) => instanceMap.get(d))

            const instance = stage.init(context, ...deps)
            instanceMap.set(stage, instance)
        }
        this.instanceMap = instanceMap
    }

    public getFilePaths(): string[] {
        return this.filePaths
    }

    public getInstance<D extends AnyStage[], O>(stage: StageDefinition<D, O>): O {
        const inst = this.instanceMap.get(stage)
        if (inst === undefined) throw new Error(`Stage not registered`)
        return inst as O
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
