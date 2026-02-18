import path from "path"
import {ProjectIndex, ResolveImport, Module} from "@/ProjectIndex"
import {parseFile} from "@/parse"
import {Bundler, FileLookup} from "@/Bundler"
import {Runner, VmRunner} from "@/Runner"
import dedent from "dedent"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { MochiError, OnDiagnostic, getErrorMessage } from "@/diagnostics"
import { findAllFiles } from "@/findAllFiles"
import { getExtractorId, extractRelevantSymbols } from "@/extractRelevantSymbols"

const rootFileSuffix = dedent`
    declare global {
        const extractors: Record<string, (source: string, ...args: any[]) => Record<string, any>>
    }
`

export type CollectCssOptions = {
    onDep?: (path: string) => void
}

export type BuilderOptions = {
    rootDir: string
    extractors: StyleExtractor[]
    bundler: Bundler
    runner: Runner
    splitBySource?: boolean
    onDiagnostic?: OnDiagnostic
}

export class Builder {
    constructor(private options: BuilderOptions) {}

    private async bundleFiles(files: Record<string, string | null>) {
        // Prepare extracted project
        const tmp = path.resolve(process.cwd(), ".mochi")
        const rootPath = path.join(tmp, "__mochi-css__.ts")

        const paths: string[] = []
        const fileLookup: FileLookup = {}

        for (const [filename, source] of Object.entries(files)) {
            if (source === null) continue
            const relativePath = path.relative(process.cwd(), filename)
            paths.push(relativePath.replaceAll(path.win32.sep, path.posix.sep))

            const filePath = path.join(tmp, relativePath)
            fileLookup[filePath] = source
        }
        const rootImports = paths.map(f => `import "./${f}"`).join("\n")

        fileLookup[rootPath] = [rootImports, rootFileSuffix].join("\n\n")

        // Bundle into single file
        try {
            return await this.options.bundler.bundle(rootPath, fileLookup)
        } catch (err) {
            const message = getErrorMessage(err)
            throw new MochiError('MOCHI_BUNDLE', message, undefined, err)
        }
    }

    private async executeCode(code: string, generators: Map<string, StyleGenerator>) {
        const onDiagnostic = this.options.onDiagnostic
        const runner = new VmRunner()

        const wrapGenerator = (generator: StyleGenerator): ((source: string, ...args: unknown[]) => Record<string, unknown>) => {
            return (source: string, ...args: unknown[]) => {
                try {
                    const subGenerators = generator.collectArgs(source, args)
                    const result: Record<string, unknown> = {}
                    for (const [name, subGen] of Object.entries(subGenerators ?? {})) {
                        result[name] = wrapGenerator(subGen)
                    }
                    return result
                } catch (err) {
                    const message = getErrorMessage(err)
                    onDiagnostic?.({
                        code: 'MOCHI_EXEC',
                        message: `Failed to collect styles: ${message}`,
                        severity: 'warning',
                        file: source,
                    })
                    return {}
                }
            }
        }

        const extractorsObj: Record<string, (source: string, ...args: unknown[]) => Record<string, unknown>> = {}
        for (const [id, generator] of generators) {
            extractorsObj[id] = wrapGenerator(generator)
        }

        try {
            await runner.execute(code, { extractors: extractorsObj })
        } catch (err) {
            const message = getErrorMessage(err)
            throw new MochiError('MOCHI_EXEC', message, undefined, err)
        }
    }

    public async collectStylesFromModules(modules: Module[]) {
        // Create a set of known file paths for resolving imports
        const knownFiles = new Set(modules.map(m => m.filePath))

        const resolveImport: ResolveImport = (fromFile, importSource) => {
            const dir = path.dirname(fromFile)
            // Try common extensions
            const extensions = ['', '.ts', '.tsx', '.js', '.jsx']
            for (const ext of extensions) {
                const resolved = path.resolve(dir, importSource + ext)
                if (knownFiles.has(resolved)) {
                    return resolved
                }
            }
            // Try index files
            for (const ext of ['.ts', '.tsx', '.js', '.jsx']) {
                const resolved = path.resolve(dir, importSource, 'index' + ext)
                if (knownFiles.has(resolved)) {
                    return resolved
                }
            }
            return null
        }

        const onDiagnostic = this.options.onDiagnostic
        const index = new ProjectIndex(modules, this.options.extractors, resolveImport, onDiagnostic)
        index.discoverCrossFileDerivedExtractors()
        index.propagateUsages()
        const resultingFiles = extractRelevantSymbols(index)

        // Create a generator for each extractor
        const generators = new Map<string, StyleGenerator>()
        for (const extractor of this.options.extractors) {
            const id = getExtractorId(extractor)
            generators.set(id, extractor.startGeneration(onDiagnostic))
        }

        const code = await this.bundleFiles(resultingFiles)
        await this.executeCode(code, generators)

        return generators
    }

    public async collectMochiStyles(onDep?: (path: string) => void) {
        const files = await findAllFiles(this.options.rootDir)

        if (onDep) {
            for (const file of files) {
                onDep(file)
            }
        }

        const modules = await Promise.all(files.map(parseFile))

        return await this.collectStylesFromModules(modules)
    }

    public async collectMochiCss(options?: CollectCssOptions): Promise<{ global?: string, files?: Record<string, string> }> {
        const generators = await this.collectMochiStyles(options?.onDep)

        // Collect and merge results from all generators
        const globalCss: string[] = []
        const files: Record<string, string> = {}

        for (const generator of generators.values()) {
            const result = await generator.generateStyles()
            if (result.global) {
                globalCss.push(result.global)
            }
            if (result.files) {
                for (const [source, css] of Object.entries(result.files)) {
                    files[source] = files[source] ? `${files[source]}\n\n${css}` : css
                }
            }
        }

        if (!this.options.splitBySource) {
            // Merge files into global CSS
            const allCss = [...globalCss]
            const sortedFiles = Object.keys(files).sort()
            for (const key of sortedFiles) {
                const css = files[key]
                if (css) allCss.push(css)
            }
            return {
                global: allCss.length > 0 ? allCss.join("\n\n") : undefined,
            }
        }

        return {
            global: globalCss.length > 0 ? globalCss.join("\n\n") : undefined,
            files: Object.keys(files).length > 0 ? files : undefined
        }
    }
}
