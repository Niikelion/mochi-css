import * as SWC from "@swc/core"

export type Ref = {
    name: string
    id?: number
}

export function idToRef(v: SWC.Identifier): Ref {
    return {
        name: v.value,
        id: v.ctxt,
    }
}

export type AnyStage = { readonly dependsOn: AnyStage[] }

export function topoSort<T extends AnyStage>(stages: readonly T[]): T[] {
    const visited = new Set<AnyStage>()
    const visiting = new Set<AnyStage>()
    const result: T[] = []

    function visit(stage: AnyStage): void {
        if (visited.has(stage)) return
        if (visiting.has(stage)) throw new Error("Cycle detected in stage dependencies")
        visiting.add(stage)
        for (const dep of stage.dependsOn) {
            visit(dep)
        }
        visiting.delete(stage)
        visited.add(stage)
        result.push(stage as T)
    }

    for (const stage of stages) {
        visit(stage)
    }
    return result
}
