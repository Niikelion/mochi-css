import * as SWC from "@swc/core"
import {visit, AnyNode} from "@/Visitors";

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

export interface FileInfo {
    filePath: string
    ast: SWC.Module
    styleExpressions: Set<SWC.Expression>
    parentLookup: Map<AnyNode, AnyNode>
    identifierSources: RefMap<SWC.Identifier>
    references: Set<SWC.Identifier>
    usedNodes: Set<AnyNode>
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

    private requireName(name: string): Map<number, T> {
        let s = this.data.get(name)
        if (s !== undefined) return s

        s = new Map<number, T>()
        this.data.set(name, s)
        return s
    }
}

const mochiIdentifiers = [ "css", "styled" ] as const
type MochiIdentifier = (typeof mochiIdentifiers)[number]

function isMochiIdentifier(v: any): v is MochiIdentifier {
    return mochiIdentifiers.includes(v)
}

function extractData(ast: SWC.Module) {
    const parentLookup = new Map<AnyNode, AnyNode>()
    const identifiers = new RefMap<MochiIdentifier>()
    const styleExpressions = new Set<SWC.Expression>()
    const identifierSources = new RefMap<SWC.Identifier>
    const references = new Set<SWC.Identifier>()

    visit.module<AnyNode | null>(ast, {
        // parent mapping
        any(node, { descend, context }) {
            if (context !== null) parentLookup.set(node, context)
            descend(node)
        },
        // mochi imports
        importDeclaration(node: SWC.ImportDeclaration, { descend, context }) {
            descend(context)
            if (node.source.value !== "@mochi-css/vanilla") return
            for (const spec of ProjectIndex.extractImportSpecs(node)) {
                const ref = spec.ref
                const sourceName = spec.sourceName

                if (spec.isNamespace || !isMochiIdentifier(sourceName)) return
                identifiers.set(ref, sourceName)
            }
        }
    }, null)

    visit.module(ast, {
        // mochi calls
        callExpression(node, { descend }) {
            if (node.callee.type !== "Identifier") {
                descend(null)
                return
            }

            const calleeRef = idToRef(node.callee)
            const mochiId = identifiers.get(calleeRef)

            switch (mochiId) {
                case "css":
                    node.arguments.forEach(a => styleExpressions.add(a.expression))
                    break
                case "styled":
                    node.arguments.forEach((a, i) => {
                        if (i === 0) return
                        styleExpressions.add(a.expression)
                    })
                    break
            }

            descend(null)
        }
    }, null)

    // locate sources of identifiers
    visit.module(ast, {
        declaration(_, { descend }) {
            descend(false)
        },
        param(_, { descend }) {
            descend(false)
        },
        expression(_, { descend }) {
            descend(true)
        },
        pattern(_, { descend }) {
            descend(false)
        },
        statement(_, { descend }) {
            descend(false)
        },
        importDeclaration(_, { descend }) {
            descend(false)
        },
        identifier(node, { context }) {
            const ref = idToRef(node)

            // skip invalid
            if (ref.id === undefined) return

            if (context) references.add(node)
            else identifierSources.set(ref, node)
        }
    }, false)

    return {
        parentLookup,
        styleExpressions,
        identifierSources,
        references
    }
}

export class ProjectIndex {
    private filesInfo: Map<string, FileInfo> = new Map()

    public get files(): [string, FileInfo][] {
        return [...this.filesInfo.entries()]
    }

    constructor(modules: Module[]) {
        for (const module of modules) {
            console.log(module.filePath)

            const data = extractData(module.ast)

            this.filesInfo.set(module.filePath, {
                ...module,
                ...data,
                usedNodes: new Set<AnyNode>()
            })
        }
    }

    public propagateUsages() {
        for (const fileInfo of this.filesInfo.values()) {
            for (const expr of fileInfo.styleExpressions) {
                this.propagateUsagesFromExpr(fileInfo, expr)
            }
        }
    }

    public propagateUsagesFromExpr(fileInfo: FileInfo, expr: SWC.Expression) {
        if (fileInfo.usedNodes.has(expr)) return

        const that = this

        visit.expression(expr, {
            any(node, { descend }) {
                if (node !== expr) {
                    if (fileInfo.usedNodes.has(node)) return
                    fileInfo.usedNodes.add(node)
                }
                descend(null)
            },
            identifier(node) {
                that.propagateUsagesFromRef(fileInfo, idToRef(node))
            }
        }, null)
    }

    public propagateUsagesFromRootItem(fileInfo: FileInfo, item: SWC.ModuleItem) {
        if (fileInfo.usedNodes.has(item)) return

        const that = this
        visit.moduleItem(item, {
            any(node, { descend }) {
                if (fileInfo.usedNodes.has(node)) return
                fileInfo.usedNodes.add(node)
                descend(null)
            },
            identifier(node) {
                that.propagateUsagesFromRef(fileInfo, idToRef(node))
            }
        }, null)
    }

    public propagateUsagesFromRef(fileInfo: FileInfo, ref: Ref) {
        if (ref.id === undefined) return

        const source = fileInfo.identifierSources.get(ref)
        if (!source) return
        let currentNode: AnyNode = source
        let parent: AnyNode | null = fileInfo.parentLookup.get(source) ?? null
        while (parent !== null && parent.type !== "Module") {
            currentNode = parent
            parent = fileInfo.parentLookup.get(currentNode) ?? null
        }
        if (parent?.type !== "Module") return
        const typedCurrentNode = currentNode as SWC.ModuleItem
        this.propagateUsagesFromRootItem(fileInfo, typedCurrentNode)
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
