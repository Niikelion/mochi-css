import {
    FilteredTransformationPipeline,
    TransformationFilter,
    TransformationHookProvider,
} from "./TransformationPipeline"
import { globExToRegex } from "./globEx"
import type { AstPostProcessor, EmitHook, StageDefinition, StageRunner, MutableFileEntry } from "@mochi-css/builder"
import type { OnDiagnostic } from "@mochi-css/core"
import type * as SWC from "@swc/core"

type FileTransformOptions = {
    filePath: string
}

type FileTransformData = {
    filter?: string
}

const fileFilterRegexCache = new Map<string, RegExp>()

function getRegexForFilter(filter: string): RegExp {
    let regex = fileFilterRegexCache.get(filter)
    if (regex) return regex
    regex = globExToRegex(filter)
    fileFilterRegexCache.set(filter, regex)
    return regex
}

const fileFilter: TransformationFilter<FileTransformData, [FileTransformOptions]> = ({ filter }, { filePath }) => {
    return filter === undefined || getRegexForFilter(filter).test(filePath)
}

type FileTransformationHookProvider = TransformationHookProvider<string, [FileTransformOptions], FileTransformData>
function makeFilePipeline(): FilteredTransformationPipeline<string, FileTransformData, [FileTransformOptions]> {
    return new FilteredTransformationPipeline<string, FileTransformData, [FileTransformOptions]>(fileFilter)
}

export interface SourceTransformHookProvider {
    register(hook: AstPostProcessor): void
}

export interface PostEvalTransformHookProvider {
    register(hook: AstPostProcessor): void
}

export interface StageHookProvider {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register(stage: StageDefinition<any[], any>): void
}

export interface EmitHookProvider {
    register(hook: EmitHook): void
}

export interface CleanupHookProvider {
    register(fn: () => void): void
}

export interface InitializeStagesHookProvider {
    register(fn: (runner: StageRunner) => void): void
}

export interface PrepareAnalysisHookProvider {
    register(fn: (runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => void): void
}

export interface GetFileDataHookProvider {
    register(fn: (runner: StageRunner) => MutableFileEntry[]): void
}

export interface InvalidateFilesHookProvider {
    register(fn: (runner: StageRunner, dirtyFiles: Set<string>) => void): void
}

export interface ResetCrossFileStateHookProvider {
    register(fn: (runner: StageRunner) => void): void
}

export interface GetFilesToBundleHookProvider {
    register(
        fn: (runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => Record<string, string | null>,
    ): void
}

class SourceTransformCollector implements SourceTransformHookProvider {
    private readonly hooks: AstPostProcessor[] = []

    register(hook: AstPostProcessor): void {
        this.hooks.push(hook)
    }

    getAll(): AstPostProcessor[] {
        return [...this.hooks]
    }
}

class PostEvalTransformCollector implements PostEvalTransformHookProvider {
    private readonly hooks: AstPostProcessor[] = []

    register(hook: AstPostProcessor): void {
        this.hooks.push(hook)
    }

    getAll(): AstPostProcessor[] {
        return [...this.hooks]
    }
}

class StageCollector implements StageHookProvider {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly stageList: StageDefinition<any[], any>[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register(stage: StageDefinition<any[], any>): void {
        this.stageList.push(stage)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll(): readonly StageDefinition<any[], any>[] {
        return [...this.stageList]
    }
}

class EmitHookCollector implements EmitHookProvider {
    private readonly hooks: EmitHook[] = []

    register(hook: EmitHook): void {
        this.hooks.push(hook)
    }

    getAll(): EmitHook[] {
        return [...this.hooks]
    }
}

class CleanupCollector implements CleanupHookProvider {
    private readonly fns: (() => void)[] = []

    register(fn: () => void): void {
        this.fns.push(fn)
    }

    runAll(): void {
        for (const fn of this.fns) fn()
    }
}

class InitializeStagesCollector implements InitializeStagesHookProvider {
    private readonly fns: ((runner: StageRunner) => void)[] = []

    register(fn: (runner: StageRunner) => void): void {
        this.fns.push(fn)
    }

    merged(): ((runner: StageRunner) => void) | undefined {
        if (this.fns.length === 0) return undefined
        const fns = [...this.fns]
        return (runner) => {
            for (const fn of fns) fn(runner)
        }
    }
}

class PrepareAnalysisCollector implements PrepareAnalysisHookProvider {
    private readonly fns: ((runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => void)[] = []

    register(fn: (runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => void): void {
        this.fns.push(fn)
    }

    merged(): ((runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => void) | undefined {
        if (this.fns.length === 0) return undefined
        const fns = [...this.fns]
        return (runner, markedForEval) => {
            for (const fn of fns) fn(runner, markedForEval)
        }
    }
}

class GetFileDataCollector implements GetFileDataHookProvider {
    private readonly fns: ((runner: StageRunner) => MutableFileEntry[])[] = []

    register(fn: (runner: StageRunner) => MutableFileEntry[]): void {
        this.fns.push(fn)
    }

    merged(): ((runner: StageRunner) => MutableFileEntry[]) | undefined {
        if (this.fns.length === 0) return undefined
        const fns = [...this.fns]
        return (runner) => fns.flatMap((fn) => fn(runner))
    }
}

class InvalidateFilesCollector implements InvalidateFilesHookProvider {
    private readonly fns: ((runner: StageRunner, dirtyFiles: Set<string>) => void)[] = []

    register(fn: (runner: StageRunner, dirtyFiles: Set<string>) => void): void {
        this.fns.push(fn)
    }

    merged(): ((runner: StageRunner, dirtyFiles: Set<string>) => void) | undefined {
        if (this.fns.length === 0) return undefined
        const fns = [...this.fns]
        return (runner, dirtyFiles) => {
            for (const fn of fns) fn(runner, dirtyFiles)
        }
    }
}

class ResetCrossFileStateCollector implements ResetCrossFileStateHookProvider {
    private readonly fns: ((runner: StageRunner) => void)[] = []

    register(fn: (runner: StageRunner) => void): void {
        this.fns.push(fn)
    }

    merged(): ((runner: StageRunner) => void) | undefined {
        if (this.fns.length === 0) return undefined
        const fns = [...this.fns]
        return (runner) => {
            for (const fn of fns) fn(runner)
        }
    }
}

class GetFilesToBundleCollector implements GetFilesToBundleHookProvider {
    private readonly fns: ((
        runner: StageRunner,
        markedForEval: Map<string, Set<SWC.Expression>>,
    ) => Record<string, string | null>)[] = []

    register(
        fn: (runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => Record<string, string | null>,
    ): void {
        this.fns.push(fn)
    }

    merged():
        | ((runner: StageRunner, markedForEval: Map<string, Set<SWC.Expression>>) => Record<string, string | null>)
        | undefined {
        if (this.fns.length === 0) return undefined
        const fns = [...this.fns]
        return (runner, markedForEval) => {
            const result: Record<string, string | null> = {}
            for (const fn of fns) Object.assign(result, fn(runner, markedForEval))
            return result
        }
    }
}

export interface PluginContext {
    readonly filePreProcess: FileTransformationHookProvider
    readonly sourceTransforms: SourceTransformHookProvider
    readonly postEvalTransforms: PostEvalTransformHookProvider
    readonly stages: StageHookProvider
    readonly emitHooks: EmitHookProvider
    readonly cleanup: CleanupHookProvider
    readonly onDiagnostic: OnDiagnostic
    readonly initializeStages: InitializeStagesHookProvider
    readonly prepareAnalysis: PrepareAnalysisHookProvider
    readonly getFileData: GetFileDataHookProvider
    readonly invalidateFiles: InvalidateFilesHookProvider
    readonly resetCrossFileState: ResetCrossFileStateHookProvider
    readonly getFilesToBundle: GetFilesToBundleHookProvider
}

export class FullContext implements PluginContext {
    readonly filePreProcess = makeFilePipeline()
    readonly sourceTransforms = new SourceTransformCollector()
    readonly postEvalTransforms = new PostEvalTransformCollector()
    readonly stages = new StageCollector()
    readonly emitHooks = new EmitHookCollector()
    readonly cleanup = new CleanupCollector()
    readonly onDiagnostic: OnDiagnostic
    readonly initializeStages = new InitializeStagesCollector()
    readonly prepareAnalysis = new PrepareAnalysisCollector()
    readonly getFileData = new GetFileDataCollector()
    readonly invalidateFiles = new InvalidateFilesCollector()
    readonly resetCrossFileState = new ResetCrossFileStateCollector()
    readonly getFilesToBundle = new GetFilesToBundleCollector()

    constructor(onDiagnostic: OnDiagnostic) {
        this.onDiagnostic = onDiagnostic
    }
}
