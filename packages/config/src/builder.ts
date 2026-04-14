import { Builder, RolldownBundler, VmRunner } from "@mochi-css/builder"
import type { Config } from "@/config"
import { FullContext } from "@/plugin"

export function createBuilder(config: Config, context: FullContext): Builder {
    return new Builder({
        roots: config.roots,
        bundler: new RolldownBundler(),
        runner: new VmRunner(),
        splitCss: config.splitCss,
        onDiagnostic: context.onDiagnostic,
        debug: config.debug,
        tsConfigPath: config.tsConfigPath,
        filePreProcess: ({ content, filePath }) => context.filePreProcess.transform(content, { filePath }),
        stages: [...context.stages.getAll()],
        sourceTransforms: [...context.sourceTransforms.getAll()],
        emitHooks: [...context.emitHooks.getAll()],
        cleanup: () => {
            context.cleanup.runAll()
        },
        initializeStages: context.initializeStages.merged(),
        prepareAnalysis: context.prepareAnalysis.merged(),
        getFileData: context.getFileData.merged(),
        invalidateFiles: context.invalidateFiles.merged(),
        resetCrossFileState: context.resetCrossFileState.merged(),
        getFilesToBundle: context.getFilesToBundle.merged(),
    })
}
