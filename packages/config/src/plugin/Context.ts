import {
    FilteredTransformationPipeline,
    TransformationFilter,
    TransformationHookProvider,
} from "./TransformationPipeline"
import { globExToRegex } from "./globEx"
import type { AstPostProcessor } from "@mochi-css/builder"

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

export interface AnalysisTransformHookProvider {
    register(hook: AstPostProcessor): void
}

class AnalysisHookCollector implements AnalysisTransformHookProvider {
    private readonly hooks: AstPostProcessor[] = []

    register(hook: AstPostProcessor): void {
        this.hooks.push(hook)
    }

    getHooks(): AstPostProcessor[] {
        return [...this.hooks]
    }
}

export interface PluginContext {
    readonly sourceTransform: FileTransformationHookProvider
    readonly analysisTransform: AnalysisTransformHookProvider
}

export class FullContext implements PluginContext {
    readonly sourceTransform = makeFilePipeline()
    readonly analysisTransform = new AnalysisHookCollector()

    public getAnalysisHooks(): AstPostProcessor[] {
        return this.analysisTransform.getHooks()
    }
}
