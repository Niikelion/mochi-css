import type { CacheRegistry } from "./CacheEngine"

type AnyStage = {
    readonly dependsOn: AnyStage[]
    init(registry: CacheRegistry, ...instances: unknown[]): unknown
}

export type StageDefinition<Deps extends AnyStage[], Out> = {
    readonly dependsOn: Deps
    init(registry: CacheRegistry, ...instances: Instances<Deps>): Out
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Instance<S> = S extends StageDefinition<any[], infer O> ? O : never

export type Instances<Deps extends AnyStage[]> = {
    [K in keyof Deps]: Instance<Deps[K]>
}

export function defineStage<const Deps extends AnyStage[], Out>(
    def: StageDefinition<Deps, Out>,
): StageDefinition<Deps, Out> {
    return def
}
