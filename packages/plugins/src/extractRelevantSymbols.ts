import * as SWC from "@swc/core"
import type { FileInfo, StyleExtractor, DerivedExtractorBinding } from "./types"
import { generateMinimalModuleItem } from "@mochi-css/builder"

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

function getExtractorId(extractor: StyleExtractor): string {
    return `${extractor.importPath}:${extractor.symbolName}`
}

function makeExtractorCall(
    extractorId: string,
    filePath: string,
    args: SWC.Argument[],
): SWC.CallExpression & { ctxt: number } {
    return {
        type: "CallExpression",
        span: emptySpan,
        ctxt: 0,
        arguments: [
            {
                expression: {
                    type: "StringLiteral",
                    span: emptySpan,
                    value: filePath,
                },
            },
            ...args,
        ],
        callee: {
            type: "MemberExpression",
            span: emptySpan,
            object: {
                type: "Identifier",
                span: emptySpan,
                ctxt: 1,
                value: "extractors",
                optional: false,
            },
            property: {
                type: "Computed",
                span: emptySpan,
                expression: {
                    type: "StringLiteral",
                    span: emptySpan,
                    value: extractorId,
                },
            },
        },
    }
}

function makeIdentifier(name: string, ctxt: number): SWC.Identifier {
    return {
        type: "Identifier",
        span: emptySpan,
        ctxt,
        value: name,
        optional: false,
    }
}

function makeVarDecl(
    kind: SWC.VariableDeclarationKind,
    declarations: SWC.VariableDeclarator[],
): SWC.VariableDeclaration & { ctxt: number } {
    return {
        type: "VariableDeclaration",
        span: emptySpan,
        ctxt: 0,
        kind,
        declare: false,
        declarations,
    }
}

function makeVarDeclarator(id: SWC.Pattern, init: SWC.Expression): SWC.VariableDeclarator {
    return {
        type: "VariableDeclarator",
        span: emptySpan,
        id,
        init,
        definite: false,
    }
}

/**
 * Builds the replacement call expression for an extracted call node.
 * Returns null when extractStaticArgs returns no args (nothing to extract).
 */
function makeExtractorCallForNode(
    filePath: string,
    extractor: StyleExtractor,
    callNode: SWC.CallExpression,
    derivedLookup: Map<StyleExtractor, DerivedExtractorBinding>,
): (SWC.CallExpression & { ctxt: number }) | null {
    const staticArgs = extractor.extractStaticArgs(callNode)
    if (staticArgs.length === 0) return null

    const args: SWC.Argument[] = staticArgs.map((e) => ({ expression: e }))
    const filePathArg: SWC.Argument = {
        expression: {
            type: "StringLiteral",
            span: emptySpan,
            value: filePath,
        },
    }

    const derivedBinding = derivedLookup.get(extractor)
    if (derivedBinding) {
        return {
            type: "CallExpression",
            span: emptySpan,
            ctxt: 0,
            callee: makeIdentifier(derivedBinding.localIdentifier.value, 0),
            arguments: [filePathArg, ...args],
        }
    }

    return makeExtractorCall(getExtractorId(extractor), filePath, args)
}

/**
 * Recursively transforms an expression, replacing any CallExpression nodes
 * present in replacementMap with their replacement. Returns the same node
 * reference if nothing changed (no mutation of originals).
 */
function transformExpression(
    expr: SWC.Expression,
    replacementMap: Map<SWC.CallExpression, SWC.CallExpression>,
    handledCalls: Set<SWC.CallExpression>,
): SWC.Expression {
    if (expr.type === "CallExpression") {
        const rep = replacementMap.get(expr)
        if (rep) {
            handledCalls.add(expr)
            return rep
        }
        // Recurse into callee and arguments
        let changed = false
        const newCallee = transformCallee(expr.callee, replacementMap, handledCalls)
        if (newCallee !== expr.callee) changed = true
        const newArgs = expr.arguments.map((arg) => {
            const newExpr = transformExpression(arg.expression, replacementMap, handledCalls)
            if (newExpr === arg.expression) return arg
            changed = true
            return { ...arg, expression: newExpr }
        })
        if (!changed) return expr
        return { ...expr, callee: newCallee, arguments: newArgs }
    }

    if (expr.type === "ObjectExpression") {
        let changed = false
        const newProps = expr.properties.map((prop) => {
            if (prop.type === "KeyValueProperty") {
                const newVal = transformExpression(prop.value, replacementMap, handledCalls)
                if (newVal === prop.value) return prop
                changed = true
                return { ...prop, value: newVal }
            }
            if (prop.type === "SpreadElement") {
                const newArg = transformExpression(prop.arguments, replacementMap, handledCalls)
                if (newArg === prop.arguments) return prop
                changed = true
                return { ...prop, arguments: newArg }
            }
            return prop
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!changed) return expr
        return { ...expr, properties: newProps }
    }

    if (expr.type === "ArrayExpression") {
        let changed = false
        const newElems = expr.elements.map((elem) => {
            if (!elem) return elem
            const newExpr = transformExpression(elem.expression, replacementMap, handledCalls)
            if (newExpr === elem.expression) return elem
            changed = true
            return { ...elem, expression: newExpr }
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!changed) return expr
        return { ...expr, elements: newElems }
    }

    if (expr.type === "ConditionalExpression") {
        const newTest = transformExpression(expr.test, replacementMap, handledCalls)
        const newCons = transformExpression(expr.consequent, replacementMap, handledCalls)
        const newAlt = transformExpression(expr.alternate, replacementMap, handledCalls)
        if (newTest === expr.test && newCons === expr.consequent && newAlt === expr.alternate) return expr
        return {
            ...expr,
            test: newTest,
            consequent: newCons,
            alternate: newAlt,
        }
    }

    if (expr.type === "BinaryExpression") {
        const newLeft = transformExpression(expr.left, replacementMap, handledCalls)
        const newRight = transformExpression(expr.right, replacementMap, handledCalls)
        if (newLeft === expr.left && newRight === expr.right) return expr
        return { ...expr, left: newLeft, right: newRight }
    }

    if (expr.type === "MemberExpression") {
        const newObj = transformExpression(expr.object, replacementMap, handledCalls)
        let newProp = expr.property
        if (expr.property.type === "Computed") {
            const newPropExpr = transformExpression(expr.property.expression, replacementMap, handledCalls)
            if (newPropExpr !== expr.property.expression) {
                newProp = { ...expr.property, expression: newPropExpr }
            }
        }
        if (newObj === expr.object && newProp === expr.property) return expr
        return { ...expr, object: newObj, property: newProp }
    }

    if (expr.type === "ParenthesisExpression") {
        const newInner = transformExpression(expr.expression, replacementMap, handledCalls)
        if (newInner === expr.expression) return expr
        return { ...expr, expression: newInner }
    }

    if (expr.type === "TemplateLiteral") {
        let changed = false
        const newExprs = expr.expressions.map((e) => {
            const newE = transformExpression(e, replacementMap, handledCalls)
            if (newE !== e) changed = true
            return newE
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!changed) return expr
        return { ...expr, expressions: newExprs }
    }

    if (expr.type === "UnaryExpression") {
        const newArg = transformExpression(expr.argument, replacementMap, handledCalls)
        if (newArg === expr.argument) return expr
        return { ...expr, argument: newArg }
    }

    if (expr.type === "AssignmentExpression") {
        const newRight = transformExpression(expr.right, replacementMap, handledCalls)
        if (newRight === expr.right) return expr
        return { ...expr, right: newRight }
    }

    if (expr.type === "SequenceExpression") {
        let changed = false
        const newExprs = expr.expressions.map((e) => {
            const newE = transformExpression(e, replacementMap, handledCalls)
            if (newE !== e) changed = true
            return newE
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!changed) return expr
        return { ...expr, expressions: newExprs }
    }

    // Literals, Identifier, TaggedTemplate, etc. — return as-is
    return expr
}

function transformCallee(
    callee: SWC.Expression | SWC.Super | SWC.Import,
    replacementMap: Map<SWC.CallExpression, SWC.CallExpression>,
    handledCalls: Set<SWC.CallExpression>,
): SWC.Expression | SWC.Super | SWC.Import {
    if (callee.type === "Super" || callee.type === "Import") return callee
    return transformExpression(callee, replacementMap, handledCalls)
}

/**
 * Substitutes extracted CallExpression nodes within a module item using replacementMap.
 * Populates handledCalls with every original call node that was replaced.
 * Returns a new node if anything changed; the original node if nothing changed.
 */
function substituteExtractedCalls(
    item: SWC.ModuleItem,
    replacementMap: Map<SWC.CallExpression, SWC.CallExpression>,
    handledCalls: Set<SWC.CallExpression>,
): SWC.ModuleItem {
    if (item.type === "VariableDeclaration") {
        return substituteInVarDecl(item, replacementMap, handledCalls)
    }
    if (item.type === "ExportDeclaration" && item.declaration.type === "VariableDeclaration") {
        const newDecl = substituteInVarDecl(item.declaration, replacementMap, handledCalls)
        if (newDecl === item.declaration) return item
        return { ...item, declaration: newDecl }
    }
    if (item.type === "ExpressionStatement") {
        const newExpr = transformExpression(item.expression, replacementMap, handledCalls)
        if (newExpr === item.expression) return item
        return { ...item, expression: newExpr }
    }
    return item
}

function substituteInVarDecl(
    decl: SWC.VariableDeclaration,
    replacementMap: Map<SWC.CallExpression, SWC.CallExpression>,
    handledCalls: Set<SWC.CallExpression>,
): SWC.VariableDeclaration {
    let changed = false
    const newDeclarators = decl.declarations.map((d) => {
        if (!d.init) return d
        const newInit = transformExpression(d.init, replacementMap, handledCalls)
        if (newInit === d.init) return d
        changed = true
        return { ...d, init: newInit }
    })
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!changed) return decl
    return { ...decl, declarations: newDeclarators }
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
        const ref = {
            name: binding.localIdentifier.value,
            id: binding.localIdentifier.ctxt,
        }
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
            const moduleBinding = info.moduleBindings.get({
                name: binding.localIdentifier.value,
                id: binding.localIdentifier.ctxt,
            })
            if (moduleBinding) parentCallModuleItems.add(moduleBinding.moduleItem)
        }

        // const __mochi_derived_0 = extractors["parent:id"]("file.ts", ...args)
        statements.push(
            makeVarDecl("const", [
                makeVarDeclarator(
                    makeIdentifier(varName, 0),
                    makeExtractorCall(
                        extractorId,
                        filePath,
                        parentArgs.map((e) => ({ expression: e })),
                    ),
                ),
            ]),
        )

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
                        value: binding.propertyName,
                    },
                },
            }

            const varDecl = makeVarDecl("const", [
                makeVarDeclarator(makeIdentifier(binding.localIdentifier.value, 0), memberExpr),
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

/**
 * Extracts relevant symbols from a list of file infos, generating minimal code for each file.
 */
export function extractRelevantSymbols(
    files: [string, FileInfo][],
    extraExpressions?: Map<string, Set<SWC.Expression>>,
): Record<string, string | null> {
    return Object.fromEntries(
        files.map(([filePath, info]) => {
            const styles = info.styleExpressions
            const hasDerived = info.derivedExtractorBindings.size > 0
            const extra = [...(extraExpressions?.get(filePath) ?? [])]

            if (styles.size === 0 && info.usedBindings.size === 0 && !hasDerived && extra.length === 0)
                return [filePath, null]

            // Build derived extractor lookup
            const derivedLookup = new Map<StyleExtractor, DerivedExtractorBinding>()
            for (const binding of info.derivedExtractorBindings.values()) {
                derivedLookup.set(binding.extractor, binding)
            }

            // Build replacement map: extracted call node → extractors[...] call
            const replacementMap = new Map<SWC.CallExpression, SWC.CallExpression & { ctxt: number }>()
            for (const [extractor, callNodes] of info.extractedCallExpressions) {
                for (const callNode of callNodes) {
                    const rep = makeExtractorCallForNode(filePath, extractor, callNode, derivedLookup)
                    if (rep) replacementMap.set(callNode, rep)
                }
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

            // Track which extracted call nodes have been handled via in-place substitution
            const handledCalls = new Set<SWC.CallExpression>()

            for (const item of usedItems) {
                const minimalItem = generateMinimalModuleItem(item, info)
                if (!minimalItem) continue
                moduleBody.push(substituteExtractedCalls(minimalItem, replacementMap, handledCalls))
            }

            const extraStatements: SWC.ExpressionStatement[] = extra.map((expression) => ({
                type: "ExpressionStatement",
                span: emptySpan,
                expression,
            }))

            const hasExpressions = styles.size > 0 || info.extractedExpressions.size > 0 || extra.length > 0
            if (!hasExpressions && derivedStatements.length === 0) {
                if (moduleBody.length === 0) return [filePath, null]

                const code = SWC.printSync({
                    type: "Module",
                    span: emptySpan,
                    body: moduleBody,
                    interpreter: "",
                }).code

                return [filePath, code]
            }

            // Emit standalone extractor calls for any extracted calls not handled in-place
            const standaloneStatements: SWC.ExpressionStatement[] = []
            for (const [, callNodes] of info.extractedCallExpressions) {
                for (const callNode of callNodes) {
                    if (handledCalls.has(callNode)) continue
                    const rep = replacementMap.get(callNode)
                    if (!rep) continue
                    standaloneStatements.push({
                        type: "ExpressionStatement",
                        span: emptySpan,
                        expression: rep,
                    })
                }
            }

            const code = SWC.printSync({
                type: "Module",
                span: emptySpan,
                body: [...moduleBody, ...derivedStatements, ...standaloneStatements, ...extraStatements],
                interpreter: "",
            }).code

            return [filePath, code]
        }),
    )
}
