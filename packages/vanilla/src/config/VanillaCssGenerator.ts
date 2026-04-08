import * as SWC from "@swc/core"
import type { StyleGenerator } from "@mochi-css/plugins"
import type { OnDiagnostic } from "@mochi-css/builder"
import { getErrorMessage } from "@mochi-css/builder"
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

function mochiCssNode(instance: MochiCSS<AllVariants>): SWC.NewExpression & { ctxt: number } {
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
        type: "NewExpression",
        span: emptySpan,
        ctxt: 0,
        callee: { type: "Identifier", span: emptySpan, ctxt: 0, value: "MochiCSS", optional: false },
        arguments: [
            { expression: classNamesNode },
            { expression: variantClassNamesNode },
            { expression: defaultVariantsNode },
        ],
    }
}

export class VanillaCssGenerator implements StyleGenerator {
    private readonly collectedStyles: { source: string; args: StyleProps[]; stableId?: string }[] = []
    private generatedMochiCss: { source: string; instance: MochiCSS<AllVariants> }[] = []

    constructor(private readonly onDiagnostic?: OnDiagnostic) {}

    collectArgs(source: string, args: unknown[]): void {
        const validArgs: StyleProps[] = []
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
            // Skip MochiCSS instances — they are runtime style handles whose styles
            // have already been collected via their own extractor call
            if (isMochiCSS(arg)) continue
            validArgs.push(arg as StyleProps)
        }
        if (validArgs.length > 0) {
            this.collectedStyles.push({ source, args: validArgs, stableId })
        }
    }

    async generateStyles(): Promise<{ files: Record<string, string> }> {
        this.generatedMochiCss = []
        const filesCss = new Map<string, Set<string>>()
        for (const { source, args, stableId } of this.collectedStyles) {
            let css = filesCss.get(source)
            if (!css) {
                css = new Set<string>()
                filesCss.set(source, css)
            }
            const mochiInstances: MochiCSS<AllVariants>[] = []
            for (const style of args) {
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
            if (mochiInstances.length > 0) {
                this.generatedMochiCss.push({ source, instance: mergeMochiCss(mochiInstances) })
            }
        }
        const files: Record<string, string> = {}
        for (const [source, css] of filesCss) {
            const sortedCss = [...css.values()].sort()
            files[source] = sortedCss.join("\n\n")
        }
        return { files }
    }

    getArgReplacements(): { source: string; expression: SWC.Expression }[] {
        return this.generatedMochiCss.map(({ source, instance }) => ({
            source,
            expression: mochiCssNode(instance),
        }))
    }
}
