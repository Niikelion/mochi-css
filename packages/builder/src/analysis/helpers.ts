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

export function getOrInsert<K, V>(target: Map<K, V>, key: K, compute: () => V): V {
    const value = target.get(key)
    if (value) return value
    const newValue = compute()
    target.set(key, newValue)
    return newValue
}

export function isLocalImport(source: string): boolean {
    return source.startsWith("./") || source.startsWith("../")
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
