import type { CacheRegistry, Signal } from "./CacheEngine"
import { OnDiagnostic } from "@mochi-css/core"
import type { ResolveImport } from "./types"

/** Signals invoked during different steps of the builder pipeline. */
export type StageSteps = {
    /** Fired after bundled code has been evaluated. */
    evaluation: Signal
}

/** Context passed to every stage. Provides the API for declaring cached computations. */
export type StageContext = {
    /** Cache registry for declaring derived values. */
    registry: CacheRegistry
    /** Diagnostic callback for reporting errors and warnings. */
    log: OnDiagnostic
    /** Resolves an import path to an absolute file path. */
    resolveImport: ResolveImport
    /** Builder pipeline step signals. */
    steps: StageSteps
}

/** Supertype of all stages. Use to constrain type parameters that accept any Stage. */
export type AnyStage = {
    readonly dependsOn: AnyStage[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(context: StageContext, ...instances: any[]): unknown
}

/**
 * Defines a stage that depends on a set of other stages and produces some output.
 *
 * @template Deps - tuple of stages this stage depends on.
 * @template Out - output this stage produces when initialized.
 */
export type StageDefinition<Deps extends AnyStage[], Out> = {
    /** Array of stages this stage depends on. */
    readonly dependsOn: Deps

    /**
     * Initializes the stage and returns its output.
     *
     * @remarks This method should not compute any value directly. Instead, it should declare cached
     *          values and methods to compute those values and return them.
     * @param context - context of the stage
     * @param instances - instances of stages this stage depends on
     * @returns cached values defined by this stage
     */
    init(context: StageContext, ...instances: Instances<Deps>): Out
}

/**
 * Output type produced by a stage when initialized.
 * @typeParam S - stage to extract the output type from.
 */
export type Instance<S extends AnyStage> = S extends { init(...args: never[]): infer O } ? O : never

/**
 * Maps a tuple of stages to a tuple of their output types.
 * @typeParam Deps - tuple of stage definitions to map.
 */
export type Instances<Deps extends AnyStage[]> = {
    [K in keyof Deps]: Instance<Deps[K]>
}

/**
 * Creates a stage definition.
 * @typeParam Deps - tuple of stages this stage depends on.
 * @typeParam Out - output type this stage produces.
 */
export function defineStage<const Deps extends AnyStage[], Out>(
    def: StageDefinition<Deps, Out>,
): StageDefinition<Deps, Out> {
    return def
}
