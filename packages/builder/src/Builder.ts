import fs from "fs/promises";
import path from "path";
import * as SWC from "@swc/core";
import {ProjectIndex, StyleSource, FileInfo, ResolveImport, Module} from "@/ProjectIndex";
import vm from "vm";
import {CSSObject, StyleProps} from "@mochi-css/vanilla";
import {rolldown} from "rolldown";
import {parseFile} from "@/parse";

export type BuilderOptions = {
  rootDir: string
  styleSources: StyleSource[]
}

const rootFileSuffix = `\
declare global {
    function registerStyles(...args: any[]): void
}`

//TODO: make more modular to allow replacing bundler
export class Builder {
    constructor(private options: BuilderOptions) {}

    private async findAllFiles(dir: string): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        const results = await Promise.all(entries.map(async entry => {
            const res = path.resolve(dir, entry.name)
            if (entry.isDirectory()) {
                return await this.findAllFiles(res)
            } else if (/\.(ts|tsx)$/.test(entry.name)) {
                return [res]
            }
            return []
        }))
        return results.flat()
    }

    private async extractRelevantSymbols(index: ProjectIndex) {
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
                const minimalItem = this.generateMinimalModuleItem(item, info)
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

            const args = [...styles.values()].map(expression => ({ expression }))
            const registerExpression: SWC.CallExpression & { ctxt: number } = {
                type: "CallExpression",
                span: emptySpan,
                arguments: [{ expression: { type: "StringLiteral", span: emptySpan, value: filePath } }, ...args],
                ctxt: 0,
                callee: {
                    type: "Identifier",
                    span: emptySpan,
                    ctxt: 1,
                    value: "registerStyles",
                    optional: false
                }
            }

            const code = SWC.printSync({
                type: "Module",
                span: emptySpan,
                body: [
                    ...moduleBody,
                    {
                        type: "ExpressionStatement",
                        span: emptySpan,
                        expression: registerExpression
                    }
                ],
                interpreter: ""
            }).code

            return [filePath, code]
        }))
    }

    private generateMinimalModuleItem(item: SWC.ModuleItem, info: FileInfo): SWC.ModuleItem | null {
        // For imports, generate minimal import declaration
        if (item.type === 'ImportDeclaration') {
            const usedSpecifiers = item.specifiers.filter(spec => {
                for (const binding of info.usedBindings) {
                    if (binding.declarator.type === 'import' &&
                        binding.declarator.declaration === item &&
                        binding.identifier.value === spec.local.value) {
                        return true
                    }
                }
                return false
            })

            if (usedSpecifiers.length === 0) return null

            return {
                ...item,
                specifiers: usedSpecifiers
            }
        }

        // For variable declarations, prune unused bindings from patterns
        if (item.type === 'VariableDeclaration') {
            const minimalDeclarators = item.declarations
                .map(declarator => this.pruneUnusedPatternParts(declarator, info))
                .filter((d): d is SWC.VariableDeclarator => d !== null)

            if (minimalDeclarators.length === 0) return null

            return {
                ...item,
                declarations: minimalDeclarators
            }
        }

        // For function/class declarations, include as-is
        if (item.type !== 'ExportDeclaration') {
            return item
        }

        // For export declarations, handle the inner declaration

        if (item.declaration.type === 'VariableDeclaration') {
            const minimalDeclarators = item.declaration.declarations
                .map(declarator => this.pruneUnusedPatternParts(declarator, info))
                .filter((d): d is SWC.VariableDeclarator => d !== null)

            if (minimalDeclarators.length === 0) return null

            return {
                ...item,
                declaration: {
                    ...item.declaration,
                    declarations: minimalDeclarators
                }
            }
        }
        // For function/class exports, include as-is if any binding is used
        return item
    }

    private pruneUnusedPatternParts(declarator: SWC.VariableDeclarator, info: FileInfo): SWC.VariableDeclarator | null {
        // Check if any binding from this declarator is used
        const hasUsedBinding = [...info.usedBindings].some(binding =>
            binding.declarator.type === 'variable' &&
            binding.declarator.declarator === declarator
        )

        if (!hasUsedBinding) return null

        // For simple identifiers, return as-is
        if (declarator.id.type === 'Identifier') {
            return declarator
        }

        // For object patterns, prune unused properties
        if (declarator.id.type === 'ObjectPattern') {
            const usedProperties = declarator.id.properties.filter(prop => {
                return this.isPatternPropertyUsed(prop, declarator, info)
            })

            if (usedProperties.length === 0) return null

            return {
                ...declarator,
                id: {
                    ...declarator.id,
                    properties: usedProperties
                }
            }
        }

        // For array patterns, prune unused elements (but keep holes for indices)
        if (declarator.id.type === 'ArrayPattern') {
            let lastUsedIndex = -1
            const usedElements = declarator.id.elements.map((elem, index) => {
                if (!elem) return undefined
                if (this.isPatternElementUsed(elem, declarator, info)) {
                    lastUsedIndex = index
                    return elem
                }
                return undefined
            })

            // Trim trailing undefineds
            const trimmedElements = usedElements.slice(0, lastUsedIndex + 1)
            if (trimmedElements.length === 0) return null

            return {
                ...declarator,
                id: {
                    ...declarator.id,
                    elements: trimmedElements
                }
            }
        }

        // For other patterns, return as-is
        return declarator
    }

    private isPatternPropertyUsed(prop: SWC.ObjectPatternProperty, declarator: SWC.VariableDeclarator, info: FileInfo): boolean {
        for (const binding of info.usedBindings) {
            if (binding.declarator.type !== 'variable') continue
            if (binding.declarator.declarator !== declarator) continue

            // Check if this binding's identifier is within this property
            if (prop.type === 'AssignmentPatternProperty' && binding.identifier === prop.key) return true
            if (prop.type === 'KeyValuePatternProperty' && this.patternContainsIdentifier(prop.value, binding.identifier)) return true
            if (prop.type === 'RestElement' && this.patternContainsIdentifier(prop.argument, binding.identifier)) return true
        }
        return false
    }

    private isPatternElementUsed(elem: SWC.Pattern, declarator: SWC.VariableDeclarator, info: FileInfo): boolean {
        for (const binding of info.usedBindings) {
            if (binding.declarator.type !== 'variable') continue
            if (binding.declarator.declarator !== declarator) continue

            if (this.patternContainsIdentifier(elem, binding.identifier)) return true
        }
        return false
    }

    private patternContainsIdentifier(pattern: SWC.Pattern, identifier: SWC.Identifier): boolean {
        switch (pattern.type) {
            case 'Identifier':
                return pattern === identifier
            case 'ObjectPattern':
                return pattern.properties.some(prop => {
                    if (prop.type === 'AssignmentPatternProperty') return prop.key === identifier
                    if (prop.type === 'KeyValuePatternProperty') return this.patternContainsIdentifier(prop.value, identifier)
                    if (prop.type === 'RestElement') return this.patternContainsIdentifier(prop.argument, identifier)
                    return false
                })
            case 'ArrayPattern':
                return pattern.elements.some(elem => elem && this.patternContainsIdentifier(elem, identifier))
            case 'RestElement':
                return this.patternContainsIdentifier(pattern.argument, identifier)
            case 'AssignmentPattern':
                return this.patternContainsIdentifier(pattern.left, identifier)
            default:
                return false
        }
    }
    private async executeFiles(files: Record<string, string | null>, onStyleRegistered: (source: string, styles: StyleProps[]) => void): Promise<void> {
        const context = vm.createContext({
            ...globalThis,
            process,
            registerStyles(source: string, ...registeredStyles: StyleProps[]) {
                onStyleRegistered(source, registeredStyles)
            }
        })

        // prepare extracted project
        const tmp = path.resolve(process.cwd(), ".mochi")
        const rootPath = path.join(tmp, "__mochi-css__.ts")
        const outputPath = path.join(tmp, "__mochi-css__.js")

        const paths: string[] = []

        for (const [filename, source] of Object.entries(files)) {
            if (source === null) continue
            const relativePath = path.relative(process.cwd(), filename)
            paths.push(relativePath.replaceAll(path.win32.sep, path.posix.sep))

            const filePath = path.join(tmp, relativePath)
            await fs.mkdir(path.dirname(filePath), { recursive: true })
            await fs.writeFile(filePath, source, "utf8")
        }
        const rootImports = paths.map(f => `import "./${f}";`).join("\n")

        await fs.writeFile(rootPath, [rootImports, rootFileSuffix].join("\n\n"), "utf8")

        // bundle into single file
        const bundle = await rolldown({
            input: rootPath,
            platform: "node",
            treeshake: false
        })

        const { output } = await bundle.generate({
            format: "cjs"
        })

        const resultFile = output[0]
        await fs.writeFile(outputPath, resultFile.code)
        await vm.runInContext(resultFile.code, context)
    }

    public async cleanup() {
        const tmp = path.resolve(process.cwd(), ".mochi")
        await fs.rm(tmp, { recursive: true, force: true })
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

        const index = new ProjectIndex(modules, this.options.styleSources, resolveImport)
        index.propagateUsages()
        const resultingFiles = await this.extractRelevantSymbols(index)
        const collectedStyles: { path: string, styles: StyleProps[] }[] = []
        await this.executeFiles(resultingFiles, (path, styles) => collectedStyles.push({ path, styles }))
        return collectedStyles
    }

    public async collectMochiStyles() {
        const files = await this.findAllFiles(this.options.rootDir)
        const modules = await Promise.all(files.map(parseFile))

        return await this.collectStylesFromModules(modules)
    }

    public async collectMochiCss(onDep?: (path: string) => void) {
        const collectedStyles = await this.collectMochiStyles()
        const css = new Set<string>()
        for (const {path, styles} of collectedStyles) {
            onDep?.(path)
            for (const style of styles) {
                const styleCss = new CSSObject(style).asCssString()
                css.add(styleCss)
            }
        }
        const sortedCss = [...css.values()].sort()
        return {"global.css": sortedCss.join("\n\n")}
    }
}

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }
