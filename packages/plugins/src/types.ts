import * as csstree from "css-tree"
import type * as CssTree from "css-tree"
import type * as SWC from "@swc/core"
import type { OnDiagnostic } from "@mochi-css/core"
import type { BindingInfo, LocalImport, RefMap, Ref } from "@mochi-css/builder"

export type CssAstChunk = { originalCss: string; ast: CssTree.StyleSheet }

export abstract class StyleGenerator {
    abstract mockFunction(...args: unknown[]): unknown

    abstract collectArgs(source: string, args: unknown[]): void

    async generateStyles(): Promise<{
        global?: string
        files?: Record<string, string>
    }> {
        const chunks = await this.generateCssAst()
        const result: { global?: string; files?: Record<string, string> } = {}
        if (chunks.global) result.global = csstree.generate(chunks.global.ast)
        if (chunks.files) {
            const files: Record<string, string> = {}
            for (const [source, { ast }] of Object.entries(chunks.files)) {
                files[source] = csstree.generate(ast)
            }
            result.files = files
        }
        return result
    }

    private _inGenerateCssAst = false

    async generateCssAst(): Promise<{
        global?: CssAstChunk
        files?: Record<string, CssAstChunk>
    }> {
        if (this._inGenerateCssAst) {
            throw new Error(`${this.constructor.name} must override either generateStyles() or generateCssAst()`)
        }
        this._inGenerateCssAst = true
        try {
            const styles = await this.generateStyles()
            const result: { global?: CssAstChunk; files?: Record<string, CssAstChunk> } = {}
            if (styles.global) {
                let ast: CssTree.StyleSheet
                try {
                    ast = csstree.parse(styles.global) as CssTree.StyleSheet
                } catch {
                    ast = csstree.parse("") as CssTree.StyleSheet
                }
                result.global = { originalCss: styles.global, ast }
            }
            if (styles.files) {
                const files: Record<string, CssAstChunk> = {}
                for (const [source, css] of Object.entries(styles.files)) {
                    let ast: CssTree.StyleSheet
                    try {
                        ast = csstree.parse(css) as CssTree.StyleSheet
                    } catch {
                        ast = csstree.parse("") as CssTree.StyleSheet
                    }
                    files[source] = { originalCss: css, ast }
                }
                result.files = files
            }
            return result
        } finally {
            this._inGenerateCssAst = false
        }
    }

    async emitCssChunks(emit: (source: string, originalCss: string, ast: CssTree.StyleSheet) => void): Promise<void> {
        const chunks = await this.generateCssAst()
        if (chunks.global) emit("global.css", chunks.global.originalCss, chunks.global.ast)
        if (chunks.files) {
            for (const [source, { originalCss, ast }] of Object.entries(chunks.files)) {
                emit(source, originalCss, ast)
            }
        }
    }

    getIdentifierLiterals(): Map<string, SWC.StringLiteral[]> {
        return new Map()
    }

    extractSubstitution(): SWC.Expression | null {
        return null
    }
}

export interface StyleExtractor {
    readonly importPath: string
    readonly symbolName: string
    readonly derivedExtractors?: ReadonlyMap<string, StyleExtractor>
    readonly substitution?: {
        /** Name of the export to add as an import. Omit when no import is needed (e.g. a string literal replacement). */
        importName?: string
        /** Module path to import `importName` from. Defaults to this extractor's `importPath` when omitted. */
        importPath?: string
        /** `'full'`: replace the entire CallExpression with the generator expression.
         *  `'args'`: keep the original callee and prefix args (determined by `extractStaticArgs`), replace only the extracted args. */
        mode: "full" | "args"
    }

    extractStaticArgs(call: SWC.CallExpression): SWC.Expression[]
    startGeneration(onDiagnostic?: OnDiagnostic): StyleGenerator
}

export interface DerivedExtractorBinding {
    extractor: StyleExtractor
    parentExtractor: StyleExtractor
    parentCallExpression: SWC.CallExpression
    propertyName: string
    localIdentifier: SWC.Identifier
}

export type ReexportInfo = {
    sourcePath: string
    originalName: string
}

export interface FileInfo {
    filePath: string
    ast: SWC.Module
    styleExpressions: Set<SWC.Expression>
    extractedExpressions: Map<StyleExtractor, SWC.Expression[]>
    extractedCallExpressions: Map<StyleExtractor, SWC.CallExpression[]>
    references: Set<SWC.Identifier>
    moduleBindings: RefMap<BindingInfo>
    localImports: RefMap<LocalImport>
    usedBindings: Set<BindingInfo>
    exports: Map<string, Ref>
    derivedExtractorBindings: RefMap<DerivedExtractorBinding>
    exportedDerivedExtractors: Map<string, DerivedExtractorBinding>
    reexports: Map<string, ReexportInfo>
    namespaceReexports: Set<string>
}
