import * as csstree from "css-tree"
import type * as CssTree from "css-tree"
import type * as SWC from "@swc/core"
import { shortHash } from "@mochi-css/core"
import type { MochiPlugin } from "@mochi-css/config"
import { generatorsStageDef } from "./stages"

export interface ClassRemapContext {
    source: string
    isVariant: boolean
    /** Already-mapped parent class name; only present when `isVariant` is true */
    parentName?: string
}

export interface ClassRemapOptions {
    remapFn?: (originalName: string, context: ClassRemapContext) => string
}

function toBase26(n: number): string {
    let result = ""
    do {
        result = String.fromCharCode(97 + (n % 26)) + result
        n = Math.floor(n / 26)
    } while (n > 0)
    return result
}

export function createClassRemapPlugin(options: ClassRemapOptions = {}): MochiPlugin {
    return {
        name: "mochi-class-remap",
        onLoad(ctx) {
            ctx.postProcessHooks.register(async (runner, ppCtx) => {
                const { generators } = runner.getInstance(generatorsStageDef)
                if (!generators || generators.size === 0) return

                const classNameLiterals = new Map<string, SWC.StringLiteral[]>()
                for (const [, gen] of generators) {
                    for (const [name, literals] of gen.getIdentifierLiterals()) {
                        const existing = classNameLiterals.get(name)
                        if (existing) existing.push(...literals)
                        else classNameLiterals.set(name, [...literals])
                    }
                }
                if (classNameLiterals.size === 0) return

                // Phase 1: build remap table by walking CSS ASTs
                const remap = new Map<string, string>()
                const variantLetterIdx = new Map<string, number>()
                const { remapFn } = options

                for (const [source, { ast }] of ppCtx.cssAstChunks) {
                    const prefix = "m" + shortHash(source, 4)
                    let mainIdx = 0

                    csstree.walk(ast, (node) => {
                        if (node.type !== "Rule") return
                        const selectorList = node.prelude as CssTree.SelectorList
                        selectorList.children.forEach((sel) => {
                            const selector = sel as CssTree.Selector
                            const classNodes: CssTree.ClassSelector[] = []
                            selector.children.forEach((n: CssTree.CssNode) => {
                                if (n.type === "ClassSelector") classNodes.push(n)
                            })
                            if (classNodes.length === 0) return

                            const first = classNodes[0]
                            if (!first) return

                            if (classNodes.length === 1) {
                                const name = first.name
                                if (!remap.has(name)) {
                                    const newName = remapFn
                                        ? remapFn(name, { source, isVariant: false })
                                        : prefix + mainIdx.toString(36).toUpperCase()
                                    remap.set(name, newName)
                                    variantLetterIdx.set(newName, 0)
                                    mainIdx++
                                }
                            } else {
                                const mainMapped = remap.get(first.name)
                                if (!mainMapped) return
                                for (let i = 1; i < classNodes.length; i++) {
                                    const varNode = classNodes[i]
                                    if (!varNode || remap.has(varNode.name)) continue
                                    const li = variantLetterIdx.get(mainMapped) ?? 0
                                    const newName = remapFn
                                        ? remapFn(varNode.name, { source, isVariant: true, parentName: mainMapped })
                                        : mainMapped + toBase26(li)
                                    remap.set(varNode.name, newName)
                                    variantLetterIdx.set(mainMapped, li + 1)
                                }
                            }
                        })
                    })
                }

                if (remap.size === 0) return

                // Phase 2: mutate CSS AST ClassSelector nodes
                for (const [source, entry] of ppCtx.cssAstChunks) {
                    csstree.walk(entry.ast, (node) => {
                        if (node.type === "ClassSelector") {
                            const newName = remap.get(node.name)
                            if (newName) {
                                node.name = newName
                                entry.wasMutated = true
                            }
                        }
                    })
                    if (entry.wasMutated) ppCtx.markFileDirty(source)
                }

                // Phase 3: mutate JS StringLiteral nodes
                for (const [oldName, literals] of classNameLiterals) {
                    const newName = remap.get(oldName)
                    if (!newName) continue
                    for (const lit of literals) {
                        lit.value = newName
                        lit.raw = undefined
                    }
                }
            })
        },
    }
}
