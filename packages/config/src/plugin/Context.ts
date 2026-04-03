import {
    FilteredTransformationPipeline,
    TransformationFilter,
    TransformationHookProvider,
} from "./TransformationPipeline"
import { globExToRegex } from "./globEx"
import type { AstPostProcessor, EmitHook, OnDiagnostic, StageDefinition } from "@mochi-css/builder"

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

class SourceTransformCollector implements SourceTransformHookProvider {
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

export interface PluginContext {
    readonly filePreProcess: FileTransformationHookProvider
    readonly sourceTransforms: SourceTransformHookProvider
    readonly stages: StageHookProvider
    readonly emitHooks: EmitHookProvider
    readonly cleanup: CleanupHookProvider
    readonly onDiagnostic: OnDiagnostic
}

export class FullContext implements PluginContext {
    readonly filePreProcess = makeFilePipeline()
    readonly sourceTransforms = new SourceTransformCollector()
    readonly stages = new StageCollector()
    readonly emitHooks = new EmitHookCollector()
    readonly cleanup = new CleanupCollector()
    readonly onDiagnostic: OnDiagnostic

    constructor(onDiagnostic: OnDiagnostic) {
        this.onDiagnostic = onDiagnostic
    }
}
