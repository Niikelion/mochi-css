import * as SWC from "@swc/core"
import { ProjectIndex } from "@/ProjectIndex"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { generateMinimalModuleItem } from "@/moduleMinimizer"

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

export function getExtractorId(extractor: StyleExtractor): string {
    return `${extractor.importPath}:${extractor.symbolName}`
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