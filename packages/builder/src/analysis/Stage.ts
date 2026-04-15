import type { CacheRegistry } from "./CacheEngine"

/** Structural base type used to constrain stage dependency arrays without recursive expansion. */
export type AnyStage = {
    readonly dependsOn: AnyStage[]
    init(registry: CacheRegistry, ...instances: unknown[]): unknown
}

/**
 * Defines a stage that depends on a set of other stages and produces some output.
 *
 * @template Deps - Tuple of stages this stage depends on.
 * @template Out - The output this stage produces when initialized.
 */
export type StageDefinition<Deps extends AnyStage[], Out> = {
    /**
     * Array of stages this stage depends on.
     */
    readonly dependsOn: Deps

    /**
     * Initializes the stage and returns its output.
     *
     * @remarks This method should not compute any value directly. Instead, it should declare cached
     *          values and methods to compute those values and return them.
     * @param registry - cache registry
     * @param instances - instances of stages this stage depends on
     * @returns cached values defined by this stage
     */
    init(registry: CacheRegistry, ...instances: Instances<Deps>): Out
}

/** Extracts the output type of stage definition. */
export type Instance<S> = S extends { init(...args: never[]): infer O } ? O : never

/** Maps a tuple of stage definitions to a tuple of their output types. */
export type Instances<Deps extends AnyStage[]> = {
    [K in keyof Deps]: Instance<Deps[K]>
}

/** Helper to define a stage with full type inference. */
export function defineStage<const Deps extends AnyStage[], Out>(
    def: StageDefinition<Deps, Out>,
): StageDefinition<Deps, Out> {
    return def
}
