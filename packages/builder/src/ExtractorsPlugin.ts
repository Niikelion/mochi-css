import type { AstPostProcessor, EmitHook } from "@/Builder"
import { getExtractorId } from "@/extractRelevantSymbols"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { StyleGenerator } from "@/generators/StyleGenerator"
import { OnDiagnostic, getErrorMessage } from "@/diagnostics"
import * as SWC from "@swc/core"

export type ExtractorsPluginResult = {
    extractors: StyleExtractor[]
    sourceTransforms: AstPostProcessor[]
    emitHooks: EmitHook[]
    getGenerators(): Map<string, StyleGenerator>
    cleanup: () => void
}

function wrapGenerator(
    generator: StyleGenerator,
    onDiagnostic: OnDiagnostic | undefined,
): (source: string, ...args: unknown[]) => Record<string, unknown> {
    return (source: string, ...args: unknown[]) => {
        try {
            const subGenerators = generator.collectArgs(source, args)
            const result: Record<string, unknown> = {}
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            for (const [name, subGen] of Object.entries(subGenerators ?? {})) {
                result[name] = wrapGenerator(subGen, onDiagnostic)
            }
            return result
        } catch (err) {
            const message = getErrorMessage(err)
            onDiagnostic?.({
                code: "MOCHI_EXEC",
                message: `Failed to collect styles: ${message}`,
                severity: "warning",
                file: source,
            })
            return {}
        }
    }
}

export function createExtractorsPlugin(
    extractors: StyleExtractor[],
    options?: { onDiagnostic?: OnDiagnostic },
): ExtractorsPluginResult {
    let capturedGenerators: Map<string, StyleGenerator> | null = null

    const sourceTransform: AstPostProcessor = (_index, context) => {
        const generators = new Map<string, StyleGenerator>()
        for (const extractor of extractors) {
            const id = getExtractorId(extractor)
            generators.set(id, extractor.startGeneration(options?.onDiagnostic))
        }
        capturedGenerators = generators

        const extractorsObj: Record<string, (source: string, ...args: unknown[]) => Record<string, unknown>> = {}
        for (const [id, gen] of generators) {
            extractorsObj[id] = wrapGenerator(gen, options?.onDiagnostic)
        }
        context.evaluator.setGlobal("extractors", extractorsObj)
    }

    const emitHook: EmitHook = async (index, context) => {
        if (!capturedGenerators) return

        for (const [, generator] of capturedGenerators) {
            const styles = await generator.generateStyles()
            const replacements = generator.getArgReplacements?.() ?? []

            // Group replacements by source and apply to AST call expressions
            const replacementsBySource = new Map<string, { expression: SWC.Expression }[]>()
            for (const rep of replacements) {
                const list = replacementsBySource.get(rep.source)
                if (list) {
                    list.push({ expression: rep.expression })
                } else {
                    replacementsBySource.set(rep.source, [{ expression: rep.expression }])
                }
            }

            for (const [source, repList] of replacementsBySource) {
                const fileEntry = index.files.find(([p]) => p === source)
                const fileInfo = fileEntry?.[1]
                if (!fileInfo) continue

                // Find the extractor whose generator produced these replacements
                for (const extractor of extractors) {
                    const callNodes = fileInfo.extractedCallExpressions.get(extractor)
                    if (callNodes?.length !== repList.length) continue

                    for (let i = 0; i < callNodes.length; i++) {
                        const callNode = callNodes[i]
                        const rep = repList[i]
                        if (!callNode || !rep) continue
                        // Replace arguments: keep source arg, replace style args with single replacement
                        callNode.arguments = [{ expression: rep.expression }]
                    }
                }
            }

            if (styles.files) {
                for (const [source, css] of Object.entries(styles.files)) {
                    context.emitChunk(source, css)
                }
            }
            if (styles.global) {
                context.emitChunk("global.css", styles.global)
            }
        }
    }

    return {
        extractors,
        sourceTransforms: [sourceTransform],
        emitHooks: [emitHook],
        getGenerators: () => capturedGenerators ?? new Map<string, StyleGenerator>(),
        cleanup() {
            capturedGenerators = null
        },
    }
}
