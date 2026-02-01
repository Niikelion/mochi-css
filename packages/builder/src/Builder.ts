import fs from "fs/promises";
import path from "path";
import * as SWC from "@swc/core";
import {ProjectIndex, ResolveImport, Module} from "@/ProjectIndex";
import {parseFile} from "@/parse";
import {Bundler, FileLookup} from "@/Bundler";
import {Runner, VmRunner} from "@/Runner";
import dedent from "dedent";
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { generateMinimalModuleItem } from "@/moduleMinimizer"

const rootFileSuffix = dedent`
    declare global {
        function registerStyles(extractorId: string, source: string, ...args: any[]): void
    }
`

export function getExtractorId(extractor: StyleExtractor): string {
    return `${extractor.importPath}:${extractor.symbolName}`
}

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

/**
 * Recursively finds all TypeScript/TSX files in a directory.
 */
export async function findAllFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const results = await Promise.all(entries.map(async entry => {
        const res = path.resolve(dir, entry.name)
        if (entry.isDirectory()) {
            return await findAllFiles(res)
        }
        if (/\.(ts|tsx)$/.test(entry.name)) {
            return [res]
        }
        return []
    }))
    return results.flat()
}

/**
 * Extracts relevant symbols from a project index, generating minimal code for each file.
 */
export function extractRelevantSymbols(index: ProjectIndex): Record<string, string | null> {
    return Object.fromEntries(index.files.map(([filePath, info]) => {
        const styles = info.styleExpressions

        if (styles.size === 0 && info.usedBindings.size === 0) return [filePath, null]

        // Build the module body from used bindings, sorted by original source position
        const moduleBody: SWC.ModuleItem[] = []
        const processedItems = new Set<SWC.ModuleItem>()

        // Collect unique module items
        const usedItems: SWC.ModuleItem[] = []
        for (const binding of info.usedBindings) {
            const item = binding.moduleItem
            if (processedItems.has(item)) continue
            processedItems.add(item)
            usedItems.push(item)
        }

        // Sort by original position in source file
        usedItems.sort((a, b) => a.span.start - b.span.start)

        // Generate minimal declarations
        for (const item of usedItems) {
            const minimalItem = generateMinimalModuleItem(item, info)
            if (minimalItem) {
                moduleBody.push(minimalItem)
            }
        }

        // Only include style expressions if this file has them
        if (styles.size === 0) {
            // This file only has dependencies needed by other files
            if (moduleBody.length === 0) return [filePath, null]

            const code = SWC.printSync({
                type: "Module",
                span: emptySpan,
                body: moduleBody,
                interpreter: ""
            }).code

            return [filePath, code]
        }

        // Generate a register call for each extractor
        const registerStatements: SWC.ExpressionStatement[] = []
        for (const [extractor, expressions] of info.extractedExpressions) {
            if (expressions.length === 0) continue

            const extractorId = getExtractorId(extractor)
            const args = expressions.map(expression => ({ expression }))
            const registerExpression: SWC.CallExpression & { ctxt: number } = {
                type: "CallExpression",
                span: emptySpan,
                ctxt: 0,
                arguments: [
                    { expression: { type: "StringLiteral", span: emptySpan, value: extractorId } },
                    { expression: { type: "StringLiteral", span: emptySpan, value: filePath } },
                    ...args
                ],
                callee: {
                    type: "Identifier",
                    span: emptySpan,
                    ctxt: 1,
                    value: "registerStyles",
                    optional: false
                }
            }
            registerStatements.push({
                type: "ExpressionStatement",
                span: emptySpan,
                expression: registerExpression
            })
        }

        const code = SWC.printSync({
            type: "Module",
            span: emptySpan,
            body: [
                ...moduleBody,
                ...registerStatements
            ],
            interpreter: ""
        }).code

        return [filePath, code]
    }))
}

export type BuilderOptions = {
    rootDir: string
    extractors: StyleExtractor[]
    bundler: Bundler
    runner: Runner
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
        return await this.options.bundler.bundle(rootPath, fileLookup)
    }

    private async executeCode(code: string, generators: Map<string, StyleGenerator>) {
        const runner = new VmRunner()
        await runner.execute(code, {
            registerStyles(extractorId: string, source: string, ...args: unknown[]) {
                const generator = generators.get(extractorId)
                if (generator) {
                    generator.collectArgs(source, args)
                }
            }
        })
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

        const index = new ProjectIndex(modules, this.options.extractors, resolveImport)
        index.propagateUsages()
        const resultingFiles = extractRelevantSymbols(index)

        // Create a generator for each extractor
        const generators = new Map<string, StyleGenerator>()
        for (const extractor of this.options.extractors) {
            const id = getExtractorId(extractor)
            generators.set(id, extractor.startGeneration())
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

    //TODO: Allow tree-shaking
    public async collectMochiCss(onDep?: (path: string) => void): Promise<{ global?: string, files?: Record<string, string> }> {
        const generators = await this.collectMochiStyles(onDep)

        // Collect and merge results from all generators
        const globalCss: string[] = []
        const files: Record<string, string> = {}

        for (const generator of generators.values()) {
            const result = await generator.generateStyles()
            if (result.global) {
                globalCss.push(result.global)
            }
            if (result.files) {
                Object.assign(files, result.files)
            }
        }

        return {
            global: globalCss.length > 0 ? globalCss.join("\n\n") : undefined,
            files: Object.keys(files).length > 0 ? files : undefined
        }
    }
}
