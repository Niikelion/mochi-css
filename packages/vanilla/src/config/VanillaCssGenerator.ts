import * as SWC from "@swc/core"
import { AstStyleGenerator, type CssAstChunk, parseCss, getOrInsert } from "@mochi-css/plugins"
import { type OnDiagnostic, getErrorMessage } from "@mochi-css/core"
import { CSSObject, MochiCSS, StyleProps, isMochiCSS, mergeMochiCss, AllVariants } from "../index"

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

function strLit(value: string): SWC.StringLiteral {
    return { type: "StringLiteral", span: emptySpan, value, raw: undefined }
}

function arrExpr(elements: SWC.Expression[]): SWC.ArrayExpression {
    return { type: "ArrayExpression", span: emptySpan, elements: elements.map((e) => ({ expression: e })) }
}

function objExpr(properties: [string, SWC.Expression][]): SWC.ObjectExpression {
    return {
        type: "ObjectExpression",
        span: emptySpan,
        properties: properties.map(([key, value]) => ({
            type: "KeyValueProperty" as const,
            key: strLit(key),
            value,
        })),
    }
}

function mochiPrebuiltCallNode(instance: MochiCSS<AllVariants>): SWC.CallExpression & { ctxt: number } {
    const classNamesNode = arrExpr(instance.classNames.map(strLit))
    const variantClassNamesNode = objExpr(
        Object.entries(instance.variantClassNames).map(([varKey, opts]) => [
            varKey,
            objExpr(Object.entries(opts as Record<string, string>).map(([optKey, cls]) => [optKey, strLit(cls)])),
        ]),
    )
    const defaultVariantsNode = objExpr(
        Object.entries(instance.defaultVariants)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, strLit(String(v))]),
    )
    return {
        type: "CallExpression",
        span: emptySpan,
        ctxt: 0,
        callee: { type: "Identifier", span: emptySpan, ctxt: 0, value: "_mochiPrebuilt", optional: false },
        arguments: [
            { expression: classNamesNode },
            { expression: variantClassNamesNode },
            { expression: defaultVariantsNode },
        ],
        typeArguments: undefined,
    }
}

export class VanillaCssGenerator extends AstStyleGenerator {
    private readonly filesCss = new Map<string, Set<string>>()
    private readonly classNameLiterals = new Map<string, SWC.StringLiteral[]>()
    private currentSubstitution: SWC.Expression | null = null
    private currentMergedMochi: MochiCSS<AllVariants> | null = null
    private readonly mock: (...args: unknown[]) => unknown

    constructor(
        mock: (...args: unknown[]) => unknown,
        private readonly onDiagnostic?: OnDiagnostic,
    ) {
        super()
        this.mock = mock
    }

    override mockFunction(...args: unknown[]): unknown {
        if (this.currentMergedMochi) {
            return this.mock(this.currentMergedMochi)
        }
        return this.mock(...args)
    }

    collectArgs(source: string, args: unknown[]): void {
        const validArgs: StyleProps[] = []
        const prebuilt: MochiCSS<AllVariants>[] = []
        let stableId: string | undefined
        for (const arg of args) {
            if (typeof arg === "string") {
                stableId = arg
                continue
            }
            if (arg == null || typeof arg !== "object") {
                this.onDiagnostic?.({
                    code: "MOCHI_INVALID_STYLE_ARG",
                    message: `Expected style object, got ${arg === null ? "null" : typeof arg}`,
                    severity: "warning",
                    file: source,
                })
                continue
            }
            if (isMochiCSS(arg)) {
                prebuilt.push(arg)
                continue
            }
            validArgs.push(arg as StyleProps)
        }

        if (validArgs.length === 0 && prebuilt.length === 0) {
            this.currentSubstitution = null
            this.currentMergedMochi = null
            return
        }

        let css = this.filesCss.get(source)
        if (!css) {
            css = new Set<string>()
            this.filesCss.set(source, css)
        }

        const mochiInstances: MochiCSS<AllVariants>[] = [...prebuilt]
        for (const style of validArgs) {
            try {
                const cssObj = new CSSObject(style, stableId)
                css.add(cssObj.asCssString())
                mochiInstances.push(MochiCSS.from(cssObj))
            } catch (err) {
                const message = getErrorMessage(err)
                this.onDiagnostic?.({
                    code: "MOCHI_STYLE_GENERATION",
                    message: `Failed to generate CSS: ${message}`,
                    severity: "warning",
                    file: source,
                })
            }
        }

        if (mochiInstances.length === 0) {
            this.currentSubstitution = null
            this.currentMergedMochi = null
            return
        }

        const merged = mergeMochiCss(mochiInstances)
        this.currentMergedMochi = merged
        this.currentSubstitution = mochiPrebuiltCallNode(merged)

        // Collect StringLiteral refs for the class remap pass
        const callNode = this.currentSubstitution
        const classNamesArr = callNode.arguments[0]?.expression as SWC.ArrayExpression | undefined
        if (classNamesArr) {
            for (const el of classNamesArr.elements) {
                if (!el) continue
                const lit = el.expression as SWC.StringLiteral
                getOrInsert(this.classNameLiterals, lit.value, () => []).push(lit)
            }
        }
        const variantGroupsObj = callNode.arguments[1]?.expression as SWC.ObjectExpression | undefined
        if (variantGroupsObj) {
            for (const groupProp of variantGroupsObj.properties) {
                if (groupProp.type !== "KeyValueProperty") continue
                const optsObj = groupProp.value as SWC.ObjectExpression
                for (const optProp of optsObj.properties) {
                    if (optProp.type !== "KeyValueProperty") continue
                    const lit = optProp.value as SWC.StringLiteral
                    getOrInsert(this.classNameLiterals, lit.value, () => []).push(lit)
                }
            }
        }
    }

    override getIdentifierLiterals(): Map<string, SWC.StringLiteral[]> {
        return this.classNameLiterals
    }

    override extractSubstitution(): SWC.Expression | null {
        return this.currentSubstitution
    }

    override async generateCssAst(): Promise<{ files: Record<string, CssAstChunk> }> {
        const files: Record<string, CssAstChunk> = {}
        for (const [source, css] of this.filesCss) {
            const cssString = [...css.values()].sort().join("\n\n")
            files[source] = { originalCss: cssString, ast: parseCss(cssString) }
        }
        return { files }
    }
}
