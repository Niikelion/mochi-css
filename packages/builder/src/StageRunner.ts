import * as SWC from "@swc/core"
import { createCacheEngine } from "@/analysis/CacheEngine"
import type { CacheEngine } from "@/analysis/CacheEngine"
import type { StageDefinition } from "@/analysis/Stage"
import { topoSort } from "@/analysis/helpers"
import type { BindingInfo, BindingDeclarator, LocalImport, ImportSpec, Module, ResolveImport } from "@/analysis/types"

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly instanceMap: Map<StageDefinition<any[], any>, unknown>
    private readonly filePaths: string[]
    public readonly engine: CacheEngine

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(filePaths: string[], stages: readonly StageDefinition<any[], any>[]) {
        this.filePaths = filePaths
        this.engine = createCacheEngine(filePaths)
        const sorted = topoSort(stages)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instanceMap = new Map<StageDefinition<any[], any>, unknown>()

        for (const stage of sorted) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const deps = stage.dependsOn.map((d) => instanceMap.get(d))
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const instance = stage.init(this.engine, ...deps)
            instanceMap.set(stage, instance)
        }
        this.instanceMap = instanceMap
    }

    public getFilePaths(): string[] {
        return this.filePaths
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public getInstance<D extends StageDefinition<any[], any>[], O>(stage: StageDefinition<D, O>): O {
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
