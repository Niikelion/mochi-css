import * as SWC from "@swc/core"
import { visit } from "@/Visitor"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { OnDiagnostic } from "@/diagnostics"

//TODO: move to separate package

declare module '@swc/core' {
    interface Identifier {
        ctxt?: number
    }
}

export type Module = {
    ast: SWC.Module
    filePath: string
}

type Ref = {
    name: string
    id?: number
}

export interface ImportSpec {
    ref: Ref
    sourceName: string
    isNamespace: boolean
    source: string
}

// Binding information for precise tracking
export type BindingDeclarator =
    | { type: 'variable', declarator: SWC.VariableDeclarator, declaration: SWC.VariableDeclaration }
    | { type: 'function', declaration: SWC.FunctionDeclaration }
    | { type: 'class', declaration: SWC.ClassDeclaration }
    | { type: 'import', specifier: SWC.ImportSpecifier | SWC.ImportDefaultSpecifier, declaration: SWC.ImportDeclaration }

export interface BindingInfo {
    identifier: SWC.Identifier
    ref: Ref
    declarator: BindingDeclarator
    moduleItem: SWC.ModuleItem
}

export interface LocalImport {
    localRef: Ref
    sourcePath: string  // resolved absolute path
    exportName: string  // original export name
}

export interface FileInfo {
    filePath: string
    ast: SWC.Module
    styleExpressions: Set<SWC.Expression>
    extractedExpressions: Map<StyleExtractor, SWC.Expression[]>
    references: Set<SWC.Identifier>
    moduleBindings: RefMap<BindingInfo>
    localImports: RefMap<LocalImport>
    usedBindings: Set<BindingInfo>
    exports: Map<string, Ref>
}

export class RefMap<T> {
    private readonly data = new Map<string, Map<number, T>>()

    public set(ref: Ref, v: T): void {
        if (ref.id === undefined) return
        this.requireName(ref.name).set(ref.id, v)
    }
    public delete(ref: Ref): boolean {
        if (ref.id === undefined) return false
        const s = this.data.get(ref.name)
        if (s === undefined) return false
        const r = s.delete(ref.id)
        if (s.size === 0) this.data.delete(ref.name)
        return r
    }
    public has(ref: Ref): boolean {
        if (ref.id === undefined) return false
        return this.data.get(ref.name)?.has(ref.id) ?? false
    }
    public get(ref: Ref): T | undefined {
        if (ref.id === undefined) return undefined
        return this.data.get(ref.name)?.get(ref.id)
    }

    // Get by name only (returns first match) - useful for module-level lookups
    public getByName(name: string): T | undefined {
        const map = this.data.get(name)
        if (!map) return undefined
        return map.values().next().value
    }

    // Iterate all values
    public *values(): IterableIterator<T> {
        for (const map of this.data.values()) {
            yield* map.values()
        }
    }

    // Find a value matching a predicate
    public find(predicate: (value: T) => boolean): T | undefined {
        for (const value of this.values()) {
            if (predicate(value)) return value
        }
        return undefined
    }

    private requireName(name: string): Map<number, T> {
        let s = this.data.get(name)
        if (s !== undefined) return s

        s = new Map<number, T>()
        this.data.set(name, s)
        return s
    }
}

function getOrInsert<K, V>(target: Map<K, V>, key: K, compute: () => V): V
{
    const value = target.get(key)
    if (value) return value

    const newValue = compute()
    target.set(key, newValue)
    return newValue
}

function isLocalImport(source: string): boolean {
    return source.startsWith('./') || source.startsWith('../')
}

function collectBindingsFromPattern(
    pattern: SWC.Pattern,
    declarator: SWC.VariableDeclarator,
    declaration: SWC.VariableDeclaration,
    moduleItem: SWC.ModuleItem,
    bindings: RefMap<BindingInfo>
): void {
    switch (pattern.type) {
        case 'Identifier': {
            const ref = idToRef(pattern)
            bindings.set(ref, {
                identifier: pattern,
                ref,
                declarator: { type: 'variable', declarator, declaration },
                moduleItem
            })
            break
        }
        case 'ObjectPattern':
            for (const prop of pattern.properties) {
                if (prop.type === 'RestElement') {
                    collectBindingsFromPattern(prop.argument, declarator, declaration, moduleItem, bindings)
                } else if (prop.type === 'KeyValuePatternProperty') {
                    collectBindingsFromPattern(prop.value, declarator, declaration, moduleItem, bindings)
                } else if (prop.type === 'AssignmentPatternProperty') {
                    const ref = idToRef(prop.key)
                    bindings.set(ref, {
                        identifier: prop.key,
                        ref,
                        declarator: { type: 'variable', declarator, declaration },
                        moduleItem
                    })
                }
            }
            break
        case 'ArrayPattern':
            for (const element of pattern.elements) {
                if (element) {
                    collectBindingsFromPattern(element, declarator, declaration, moduleItem, bindings)
                }
            }
            break
        case 'RestElement':
            collectBindingsFromPattern(pattern.argument, declarator, declaration, moduleItem, bindings)
            break
        case 'AssignmentPattern':
            collectBindingsFromPattern(pattern.left, declarator, declaration, moduleItem, bindings)
            break
    }
}

type ExtractContext = {
    scopeDepth: number
    currentModuleItem: SWC.ModuleItem | null
}

function extractData(
    ast: SWC.Module,
    filePath: string,
    styleExtractors: Map<string, Map<string, StyleExtractor>>,
    resolveImport: (from: string, source: string) => string | null,
    onDiagnostic?: OnDiagnostic
) {
    const styleExtractorIdentifiers = new RefMap<StyleExtractor>()
    const styleExpressions = new Set<SWC.Expression>()
    const extractedExpressions = new Map<StyleExtractor, SWC.Expression[]>()
    const moduleBindings = new RefMap<BindingInfo>()
    const localImports = new RefMap<LocalImport>()
    const references = new Set<SWC.Identifier>()
    const exports = new Map<string, Ref>()

    // Pass 1: Collect style source identifiers from imports
    for (const item of ast.body) {
        if (item.type !== 'ImportDeclaration') continue

        const possibleExtractors = styleExtractors.get(item.source.value)
        if (!possibleExtractors) continue

        for (const spec of ProjectIndex.extractImportSpecs(item)) {
            const source = possibleExtractors.get(spec.sourceName)
            if (spec.isNamespace || !source) continue
            styleExtractorIdentifiers.set(spec.ref, source)
        }
    }

    // Pass 2: Find style expressions
    visit.module(ast, {
        callExpression(node, { descend }) {
            if (node.callee.type === "Identifier") {
                const calleeRef = idToRef(node.callee)
                const styleExtractor = styleExtractorIdentifiers.get(calleeRef)
                if (styleExtractor) {
                    const staticArgs = styleExtractor.extractStaticArgs(node)
                    staticArgs.forEach(style => styleExpressions.add(style))

                    // Track expressions per extractor
                    const existing = extractedExpressions.get(styleExtractor)
                    if (existing) {
                        existing.push(...staticArgs)
                    } else {
                        extractedExpressions.set(styleExtractor, [...staticArgs])
                    }
                }
            }
            descend(null)
        }
    }, null)

    // Pass 3: Collect module-level bindings, local imports, and exports
    for (const item of ast.body) {
        switch (item.type) {
            case 'ImportDeclaration': {
                const isLocal = isLocalImport(item.source.value)
                const sourcePath = isLocal
                    ? resolveImport(filePath, item.source.value)
                    : null

                if (isLocal && sourcePath === null) {
                    onDiagnostic?.({
                        code: 'MOCHI_UNRESOLVED_IMPORT',
                        message: `Cannot resolve local import "${item.source.value}"`,
                        severity: 'warning',
                        file: filePath,
                        line: item.source.span.start,
                    })
                }

                for (const specifier of item.specifiers) {
                    if (specifier.type === 'ImportNamespaceSpecifier') continue

                    const ref = idToRef(specifier.local)
                    const sourceName = specifier.type === 'ImportSpecifier'
                        ? (specifier.imported?.value ?? ref.name)
                        : ref.name  // default import

                    if (sourcePath) {
                        // Local import - track for cross-file analysis
                        localImports.set(ref, {
                            localRef: ref,
                            sourcePath,
                            exportName: sourceName
                        })
                    }

                    // Track as a binding (imported identifiers are module-level)
                    moduleBindings.set(ref, {
                        identifier: specifier.local,
                        ref,
                        declarator: { type: 'import', specifier, declaration: item },
                        moduleItem: item
                    })
                }
                break
            }

            case 'VariableDeclaration':
                for (const declarator of item.declarations) {
                    collectBindingsFromPattern(declarator.id, declarator, item, item, moduleBindings)
                }
                break

            case 'FunctionDeclaration':
                if (item.identifier) {
                    const ref = idToRef(item.identifier)
                    moduleBindings.set(ref, {
                        identifier: item.identifier,
                        ref,
                        declarator: { type: 'function', declaration: item },
                        moduleItem: item
                    })
                }
                break

            case 'ClassDeclaration':
                if (item.identifier) {
                    const ref = idToRef(item.identifier)
                    moduleBindings.set(ref, {
                        identifier: item.identifier,
                        ref,
                        declarator: { type: 'class', declaration: item },
                        moduleItem: item
                    })
                }
                break

            case 'ExportDeclaration': {
                // Handle: export const x = ..., export function f() {}, export class C {}
                const decl = item.declaration
                if (decl.type === 'VariableDeclaration') {
                    for (const declarator of decl.declarations) {
                        collectBindingsFromPattern(declarator.id, declarator, decl, item, moduleBindings)
                        if (declarator.id.type !== 'Identifier') continue
                        const ref = idToRef(declarator.id)
                        exports.set(ref.name, ref)
                    }
                    break
                }
                const identifier = decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration'
                    ? decl.identifier
                    : null
                if (!identifier) break
                const ref = idToRef(identifier)
                const type = decl.type === 'FunctionDeclaration' ? 'function' : 'class'
                moduleBindings.set(ref, {
                    identifier,
                    ref,
                    declarator: { type, declaration: decl } as BindingDeclarator,
                    moduleItem: item
                })
                exports.set(ref.name, ref)
                break
            }

            case 'ExportNamedDeclaration':
                // Handle: export { x, y as z }
                for (const specifier of item.specifiers) {
                    if (specifier.type !== 'ExportSpecifier') continue
                    const localName = specifier.orig.type === 'Identifier' ? specifier.orig.value : specifier.orig.value
                    const exportedName = specifier.exported?.value ?? localName
                    const binding = moduleBindings.getByName(localName)
                    if (binding) exports.set(exportedName, binding.ref)
                }
                break
        }
    }

    // Pass 4: Collect references (identifiers used in expressions)
    visit.module<ExtractContext>(ast, {
        functionDeclaration(_, { descend, context }) {
            descend({ ...context, scopeDepth: context.scopeDepth + 1 })
        },
        functionExpression(_, { descend, context }) {
            descend({ ...context, scopeDepth: context.scopeDepth + 1 })
        },
        arrowFunctionExpression(_, { descend, context }) {
            descend({ ...context, scopeDepth: context.scopeDepth + 1 })
        },
        classMethod(_, { descend, context }) {
            descend({ ...context, scopeDepth: context.scopeDepth + 1 })
        },
        // Skip identifiers in declaration positions
        variableDeclarator(node, { descend, context }) {
            // Only visit the init expression, not the pattern
            if (node.init) {
                visit.expression(node.init, {
                    identifier(id) {
                        references.add(id)
                    }
                }, null)
            }
        },
        param() {
            // Skip parameters - they introduce local bindings
        },
        pattern() {
            // Skip patterns in declaration context
        },
        identifier(node, { context }) {
            // Only collect references at module level (scopeDepth === 0)
            // References inside functions are not relevant for extraction
            if (context.scopeDepth === 0) {
                references.add(node)
            }
        },
        tsType() {}
    }, { scopeDepth: 0, currentModuleItem: null })

    return {
        styleExpressions,
        extractedExpressions,
        moduleBindings,
        localImports,
        references,
        exports
    }
}

export type ResolveImport = (fromFile: string, importSource: string) => string | null

export class ProjectIndex {
    private filesInfo: Map<string, FileInfo> = new Map()
    private analyzedBindings = new Set<string>()
    public readonly extractors: StyleExtractor[]

    public get files(): [string, FileInfo][] {
        return [...this.filesInfo.entries()]
    }

    constructor(modules: Module[], extractors: StyleExtractor[], resolveImport: ResolveImport, onDiagnostic?: OnDiagnostic) {
        this.extractors = extractors

        const extractorLookup = new Map<string, Map<string, StyleExtractor>>()
        for (const extractor of extractors) {
            const importScope = getOrInsert(extractorLookup, extractor.importPath, () => new Map<string, StyleExtractor>())
            importScope.set(extractor.symbolName, extractor)
        }

        for (const module of modules) {
            const data = extractData(module.ast, module.filePath, extractorLookup, resolveImport, onDiagnostic)

            this.filesInfo.set(module.filePath, {
                ...module,
                ...data,
                usedBindings: new Set<BindingInfo>()
            })
        }
    }

    private getBindingKey(filePath: string, ref: Ref): string {
        return `${filePath}:${ref.name}:${ref.id}`
    }

    public propagateUsages() {
        for (const fileInfo of this.filesInfo.values()) {
            for (const expr of fileInfo.styleExpressions) {
                this.propagateUsagesFromExpr(fileInfo, expr)
            }
        }
    }

    public propagateUsagesFromExpr(fileInfo: FileInfo, expr: SWC.Expression) {
        const that = this

        visit.expression(expr, {
            identifier(node) {
                that.propagateUsagesFromRef(fileInfo, idToRef(node))
            }
        }, null)
    }

    public propagateUsagesFromBinding(fileInfo: FileInfo, binding: BindingInfo) {
        if (fileInfo.usedBindings.has(binding)) return
        fileInfo.usedBindings.add(binding)

        const that = this

        // For variable bindings, propagate through the initializer
        if (binding.declarator.type === 'variable' && binding.declarator.declarator.init) {
            visit.expression(binding.declarator.declarator.init, {
                identifier(node) {
                    that.propagateUsagesFromRef(fileInfo, idToRef(node))
                }
            }, null)
        }
    }

    public propagateUsagesFromRef(fileInfo: FileInfo, ref: Ref) {
        if (ref.id === undefined) return

        // Deduplication check
        const bindingKey = this.getBindingKey(fileInfo.filePath, ref)
        if (this.analyzedBindings.has(bindingKey)) return
        this.analyzedBindings.add(bindingKey)

        // Check if it's a local import - follow recursively
        const localImport = fileInfo.localImports.get(ref)
        if (localImport) {
            const importedFileInfo = this.filesInfo.get(localImport.sourcePath)
            const exportedRef = importedFileInfo?.exports.get(localImport.exportName)
            if (importedFileInfo && exportedRef) {
                this.propagateUsagesFromRef(importedFileInfo, exportedRef)
            }
            // Also mark the import binding itself as used
            const importBinding = fileInfo.moduleBindings.get(ref)
            if (importBinding) fileInfo.usedBindings.add(importBinding)
            return
        }

        // Check if it's a module-level binding
        const binding = fileInfo.moduleBindings.get(ref)
        if (!binding) return

        this.propagateUsagesFromBinding(fileInfo, binding)
    }

    public static extractImportSpecs(node: SWC.ImportDeclaration): ImportSpec[] {
        const source = node.source.value

        return node.specifiers.map(specifier => {
            const ref = idToRef(specifier.local)
            switch (specifier.type) {
                case "ImportSpecifier": {
                    return { source, ref, sourceName: specifier.imported?.value ?? ref.name, isNamespace: false } satisfies ImportSpec
                }
                case "ImportDefaultSpecifier": {
                    return { source, ref, sourceName: ref.name, isNamespace: false } satisfies ImportSpec
                }
                case "ImportNamespaceSpecifier": {
                    return { source, ref, sourceName: ref.name, isNamespace: true } satisfies ImportSpec
                }
            }
        })
    }
}

function idToRef(v: SWC.Identifier): Ref
{
    return {
        name: v.value,
        id: v.ctxt
    }
}
