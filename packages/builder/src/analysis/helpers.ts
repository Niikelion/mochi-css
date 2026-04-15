import * as SWC from "@swc/core"
import { AnyStage } from "@/analysis/Stage"

/**
 * Unique reference to a binding within a module.
 * Matches SWC's identifier identity: same `name` + `id` means the same binding.
 * `id` is undefined for unresolved or synthetic identifiers.
 */
export type Ref = {
    name: string
    id?: number
}

/** Converts an SWC `Identifier` node to a `Ref`. */
// noinspection JSUnusedGlobalSymbols
export function idToRef(v: SWC.Identifier): Ref {
    return {
        name: v.value,
        id: v.ctxt,
    }
}

/**
 * Sorts stages in topological order so each stage appears after all its dependencies.
 * Throws if a dependency cycle is detected.
 */
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
