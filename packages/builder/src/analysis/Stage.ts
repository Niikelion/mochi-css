import type { CacheRegistry } from "./CacheEngine"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StageDefinition<Deps extends StageDefinition<any[], any>[], Out> = {
    readonly dependsOn: Deps
    init(registry: CacheRegistry, ...instances: Instances<Deps>): Out
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Instance<S> = S extends StageDefinition<any[], infer O> ? O : never

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Instances<Deps extends StageDefinition<any[], any>[]> = {
    [K in keyof Deps]: Instance<Deps[K]>
}

export function defineStage<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Deps extends StageDefinition<any[], any>[],
    Out,
>(def: StageDefinition<Deps, Out>): StageDefinition<Deps, Out> {
    return def
}
