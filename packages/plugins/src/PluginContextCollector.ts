import type {
    PluginContext,
    SourceTransformHookProvider,
    PostEvalTransformHookProvider,
    StageHookProvider,
    EmitHookProvider,
    CleanupHookProvider,
    InitializeStagesHookProvider,
    PrepareAnalysisHookProvider,
    GetFileDataHookProvider,
    InvalidateFilesHookProvider,
    ResetCrossFileStateHookProvider,
    GetFilesToBundleHookProvider,
} from "@mochi-css/config"
import type { AstPostProcessor, EmitHook, StageDefinition, MutableFileEntry, StageRunner } from "@mochi-css/builder"
import type { OnDiagnostic } from "@mochi-css/core"
import type * as SWC from "@swc/core"

/**
 * A simple collector that implements {@link PluginContext} by gathering all registered
 * hooks into arrays. Call {@link PluginContextCollector.getStages}, etc. after
 * `plugin.onLoad(collector)` to extract the collected hooks for use in Builder.
 */
export class PluginContextCollector implements PluginContext {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly _stages: StageDefinition<any[], any>[] = []
    private readonly _sourceTransforms: AstPostProcessor[] = []
    private readonly _postEvalTransforms: AstPostProcessor[] = []
    private readonly _emitHooks: EmitHook[] = []
    private readonly _cleanupFns: (() => void)[] = []
    private readonly _initializeStages: ((runner: StageRunner) => void)[] = []
    private readonly _prepareAnalysis: ((
        runner: StageRunner,
        markedForEval: Map<string, Set<SWC.Expression>>,
    ) => void)[] = []
    private readonly _getFileData: ((runner: StageRunner) => MutableFileEntry[])[] = []
    private readonly _invalidateFiles: ((runner: StageRunner, dirtyFiles: Set<string>) => void)[] = []
    private readonly _resetCrossFileState: ((runner: StageRunner) => void)[] = []
    private readonly _getFilesToBundle: ((
        runner: StageRunner,
        markedForEval: Map<string, Set<SWC.Expression>>,
    ) => Record<string, string | null>)[] = []

    readonly filePreProcess = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        registerTransformation: (_t: unknown, _d: unknown) => {},
    }

    readonly stages: StageHookProvider = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        register: (s: StageDefinition<any[], any>) => {
            this._stages.push(s)
        },
    }

    readonly sourceTransforms: SourceTransformHookProvider = {
        register: (h: AstPostProcessor) => {
            this._sourceTransforms.push(h)
        },
    }

    readonly postEvalTransforms: PostEvalTransformHookProvider = {
        register: (h: AstPostProcessor) => {
            this._postEvalTransforms.push(h)
        },
    }

    readonly emitHooks: EmitHookProvider = {
        register: (h: EmitHook) => {
            this._emitHooks.push(h)
        },
    }

    readonly cleanup: CleanupHookProvider = {
        register: (fn: () => void) => {
            this._cleanupFns.push(fn)
        },
    }

    readonly initializeStages: InitializeStagesHookProvider = {
        register: (fn) => {
            this._initializeStages.push(fn)
        },
    }

    readonly prepareAnalysis: PrepareAnalysisHookProvider = {
        register: (fn) => {
            this._prepareAnalysis.push(fn)
        },
    }

    readonly getFileData: GetFileDataHookProvider = {
        register: (fn) => {
            this._getFileData.push(fn)
        },
    }

    readonly invalidateFiles: InvalidateFilesHookProvider = {
        register: (fn) => {
            this._invalidateFiles.push(fn)
        },
    }

    readonly resetCrossFileState: ResetCrossFileStateHookProvider = {
        register: (fn) => {
            this._resetCrossFileState.push(fn)
        },
    }

    readonly getFilesToBundle: GetFilesToBundleHookProvider = {
        register: (fn) => {
            this._getFilesToBundle.push(fn)
        },
    }

    readonly onDiagnostic: OnDiagnostic

    constructor(onDiagnostic?: OnDiagnostic) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.onDiagnostic = onDiagnostic ?? (() => {})
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getStages(): readonly StageDefinition<any[], any>[] {
        return [...this._stages]
    }

    getSourceTransforms(): AstPostProcessor[] {
        return [...this._sourceTransforms]
    }

    getPostEvalTransforms(): AstPostProcessor[] {
        return [...this._postEvalTransforms]
    }

    getEmitHooks(): EmitHook[] {
        return [...this._emitHooks]
    }

    runCleanup(): void {
        for (const fn of this._cleanupFns) fn()
    }

    getInitializeStages(): ((runner: StageRunner) => void) | undefined {
        if (this._initializeStages.length === 0) return undefined
        const fns = [...this._initializeStages]
        return (runner) => {
            for (const fn of fns) fn(runner)
        }
    }

    getPrepareAnalysis(): ((runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => void) | undefined {
        if (this._prepareAnalysis.length === 0) return undefined
        const fns = [...this._prepareAnalysis]
        return (runner, markedForEval) => {
            for (const fn of fns) fn(runner, markedForEval)
        }
    }

    getGetFileData(): ((runner: StageRunner) => MutableFileEntry[]) | undefined {
        if (this._getFileData.length === 0) return undefined
        const fns = [...this._getFileData]
        return (runner) => fns.flatMap((fn) => fn(runner))
    }

    getInvalidateFiles(): ((runner: StageRunner, dirtyFiles: Set<string>) => void) | undefined {
        if (this._invalidateFiles.length === 0) return undefined
        const fns = [...this._invalidateFiles]
        return (runner, dirtyFiles) => {
            for (const fn of fns) fn(runner, dirtyFiles)
        }
    }

    getResetCrossFileState(): ((runner: StageRunner) => void) | undefined {
        if (this._resetCrossFileState.length === 0) return undefined
        const fns = [...this._resetCrossFileState]
        return (runner) => {
            for (const fn of fns) fn(runner)
        }
    }

    getGetFilesToBundle():
        | ((runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => Record<string, string | null>)
        | undefined {
        if (this._getFilesToBundle.length === 0) return undefined
        const fns = [...this._getFilesToBundle]
        return (runner, markedForEval) => {
            const result: Record<string, string | null> = {}
            for (const fn of fns) Object.assign(result, fn(runner, markedForEval))
            return result
        }
    }
}
