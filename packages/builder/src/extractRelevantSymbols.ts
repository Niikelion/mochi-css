import * as SWC from "@swc/core"
import { DerivedExtractorBinding, FileInfo, ProjectIndex } from "@/ProjectIndex"
import { StyleExtractor } from "@/extractors/StyleExtractor"
import { generateMinimalModuleItem } from "@/moduleMinimizer"

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

export function getExtractorId(extractor: StyleExtractor): string {
    return `${extractor.importPath}:${extractor.symbolName}`
}

function makeExtractorCall(extractorId: string, filePath: string, args: SWC.Expression[]): SWC.CallExpression & { ctxt: number } {
    return {
        type: "CallExpression",
        span: emptySpan,
        ctxt: 0,
        arguments: [
            { expression: { type: "StringLiteral", span: emptySpan, value: filePath } },
            ...args.map(expression => ({ expression }))
        ],
        callee: {
            type: "MemberExpression",
            span: emptySpan,
            object: {
                type: "Identifier",
                span: emptySpan,
                ctxt: 1,
                value: "extractors",
                optional: false
            },
            property: {
                type: "Computed",
                span: emptySpan,
                expression: {
                    type: "StringLiteral",
                    span: emptySpan,
                    value: extractorId
                }
            }
        }
    }
}

function makeIdentifier(name: string, ctxt: number): SWC.Identifier {
    return { type: "Identifier", span: emptySpan, ctxt, value: name, optional: false }
}

function makeVarDecl(kind: SWC.VariableDeclarationKind, declarations: SWC.VariableDeclarator[]): SWC.VariableDeclaration & { ctxt: number } {
    return { type: "VariableDeclaration", span: emptySpan, ctxt: 0, kind, declare: false, declarations }
}

function makeVarDeclarator(id: SWC.Pattern, init: SWC.Expression): SWC.VariableDeclarator {
    return { type: "VariableDeclarator", span: emptySpan, id, init, definite: false }
}

function generateDerivedStatements(
    filePath: string,
    info: FileInfo,
    derivedLookup: Map<StyleExtractor, DerivedExtractorBinding>,
    parentCallModuleItems: Set<SWC.ModuleItem>,
): SWC.ModuleItem[] {
    // Group local derived bindings by parent call
    const parentCallGroups = new Map<SWC.CallExpression, DerivedExtractorBinding[]>()
    for (const binding of info.derivedExtractorBindings.values()) {
        const ref = { name: binding.localIdentifier.value, id: binding.localIdentifier.ctxt }
        if (info.localImports.has(ref)) continue

        const group = parentCallGroups.get(binding.parentCallExpression)
        if (group) group.push(binding)
        else parentCallGroups.set(binding.parentCallExpression, [binding])
    }

    const statements: SWC.ModuleItem[] = []
    let derivedCounter = 0

    for (const [callExpr, bindings] of parentCallGroups) {
        const parentExtractor = bindings[0]?.parentExtractor
        if (!parentExtractor) continue
        const extractorId = getExtractorId(parentExtractor)
        const parentArgs = parentExtractor.extractStaticArgs(callExpr)
        const varName = `__mochi_derived_${derivedCounter++}`

        // Mark original destructuring module items for exclusion
        for (const binding of bindings) {
            const moduleBinding = info.moduleBindings.get(
                { name: binding.localIdentifier.value, id: binding.localIdentifier.ctxt }
            )
            if (moduleBinding) parentCallModuleItems.add(moduleBinding.moduleItem)
        }

        // const __mochi_derived_0 = extractors["parent:id"]("file.ts", ...args)
        statements.push(makeVarDecl("const", [
            makeVarDeclarator(makeIdentifier(varName, 0), makeExtractorCall(extractorId, filePath, parentArgs))
        ]))

        // For each derived binding: [export] const css = __mochi_derived_0["css"]
        for (const binding of bindings) {
            const hasExpressions = info.extractedExpressions.has(binding.extractor)
            const isExported = info.exportedDerivedExtractors.has(binding.propertyName)

            if (!hasExpressions && !isExported) continue

            const memberExpr: SWC.MemberExpression = {
                type: "MemberExpression",
                span: emptySpan,
                object: makeIdentifier(varName, 0),
                property: {
                    type: "Computed",
                    span: emptySpan,
                    expression: {
                        type: "StringLiteral",
                        span: emptySpan,
                        value: binding.propertyName
                    }
                }
            }

            const varDecl = makeVarDecl("const", [
                makeVarDeclarator(makeIdentifier(binding.localIdentifier.value, 0), memberExpr)
            ])

            if (isExported) {
                statements.push({
                    type: "ExportDeclaration",
                    span: emptySpan,
                    declaration: varDecl,
                } satisfies SWC.ExportDeclaration)
            } else {
                statements.push(varDecl)
            }
        }
    }

    return statements
}

function generateCallStatements(
    filePath: string,
    info: FileInfo,
    derivedLookup: Map<StyleExtractor, DerivedExtractorBinding>,
): SWC.ExpressionStatement[] {
    const statements: SWC.ExpressionStatement[] = []

    for (const [extractor, expressions] of info.extractedExpressions) {
        if (expressions.length === 0) continue

        const derivedBinding = derivedLookup.get(extractor)
        const args = expressions.map(expression => ({ expression }))

        if (derivedBinding) {
            // Derived call: localRef("file.ts", ...args)
            const callExpr: SWC.CallExpression & { ctxt: number } = {
                type: "CallExpression",
                span: emptySpan,
                ctxt: 0,
                arguments: [
                    { expression: { type: "StringLiteral", span: emptySpan, value: filePath } },
                    ...args
                ],
                callee: makeIdentifier(derivedBinding.localIdentifier.value, 0)
            }
            statements.push({ type: "ExpressionStatement", span: emptySpan, expression: callExpr })
        } else {
            // Regular call: extractors["id"]("file.ts", ...args)
            const extractorId = getExtractorId(extractor)
            statements.push({
                type: "ExpressionStatement",
                span: emptySpan,
                expression: makeExtractorCall(extractorId, filePath, expressions)
            })
        }
    }

    return statements
}

/**
 * Extracts relevant symbols from a project index, generating minimal code for each file.
 */
export function extractRelevantSymbols(index: ProjectIndex): Record<string, string | null> {
    return Object.fromEntries(index.files.map(([filePath, info]) => {
        const styles = info.styleExpressions
        const hasDerived = info.derivedExtractorBindings.size > 0

        if (styles.size === 0 && info.usedBindings.size === 0 && !hasDerived) return [filePath, null]

        // Build derived extractor lookup
        const derivedLookup = new Map<StyleExtractor, DerivedExtractorBinding>()
        for (const binding of info.derivedExtractorBindings.values()) {
            derivedLookup.set(binding.extractor, binding)
        }

        // Generate derived statements and collect module items to exclude
        const parentCallModuleItems = new Set<SWC.ModuleItem>()
        const derivedStatements = hasDerived
            ? generateDerivedStatements(filePath, info, derivedLookup, parentCallModuleItems)
            : []

        // Build the module body from used bindings, sorted by original source position
        const moduleBody: SWC.ModuleItem[] = []
        const processedItems = new Set<SWC.ModuleItem>()

        const usedItems: SWC.ModuleItem[] = []
        for (const binding of info.usedBindings) {
            const item = binding.moduleItem
            if (processedItems.has(item)) continue
            if (parentCallModuleItems.has(item)) continue
            processedItems.add(item)
            usedItems.push(item)
        }

        usedItems.sort((a, b) => a.span.start - b.span.start)

        for (const item of usedItems) {
            const minimalItem = generateMinimalModuleItem(item, info)
            if (minimalItem) {
                moduleBody.push(minimalItem)
            }
        }

        const hasExpressions = styles.size > 0 || info.extractedExpressions.size > 0
        if (!hasExpressions && derivedStatements.length === 0) {
            if (moduleBody.length === 0) return [filePath, null]

            const code = SWC.printSync({
                type: "Module",
                span: emptySpan,
                body: moduleBody,
                interpreter: ""
            }).code

            return [filePath, code]
        }

        const callStatements = generateCallStatements(filePath, info, derivedLookup)

        const code = SWC.printSync({
            type: "Module",
            span: emptySpan,
            body: [
                ...moduleBody,
                ...derivedStatements,
                ...callStatements
            ],
            interpreter: ""
        }).code

        return [filePath, code]
    }))
}
