import { describe, it, expect } from "vitest"
import * as csstree from "css-tree"
import { FullContext } from "@mochi-css/config"
import { StageRunner } from "@mochi-css/builder"
import type { PostProcessContext } from "@mochi-css/builder"
import { noop } from "@mochi-css/core"
import type * as SWC from "@swc/core"
import { createClassRemapPlugin } from "./ClassRemapPlugin"
import { GeneratorsCollectionStage, ClassnameLiteralsStage } from "./stages"
import { StyleGenerator } from "@/types"

class LiteralGenerator extends StyleGenerator {
    constructor(private readonly literalMap: Map<string, SWC.StringLiteral[]> = new Map()) {
        super()
    }
    override mockFunction(): unknown {
        return undefined
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    collectArgs(): void {}
    override async generateStyles() {
        return {}
    }
    override getIdentifierLiterals() {
        return this.literalMap
    }
}

function lit(value: string): SWC.StringLiteral {
    return { type: "StringLiteral", value, span: { start: 0, end: 0, ctxt: 0 } }
}

/** Class names as they appear in the CSS AST after the walk/mutation. */
function classNamesInCss(ast: csstree.CssNode): string[] {
    const names: string[] = []
    csstree.walk(ast, (node) => {
        if (node.type === "ClassSelector") names.push(node.name)
    })
    return names
}

/**
 * Runs the ClassRemapPlugin postProcess hook over a single CSS chunk.
 * `literalMap` supplies the mochi-internal class names (StringLiteral refs).
 */
async function runRemap(css: string, literalMap: Map<string, SWC.StringLiteral[]>) {
    const plugin = createClassRemapPlugin()
    const context = new FullContext(noop)
    plugin.onLoad?.(context)

    const runner = new StageRunner([], [ClassnameLiteralsStage], noop, () => null)
    runner.getInstance(GeneratorsCollectionStage).register(new LiteralGenerator(literalMap))

    const ast = csstree.parse(css) as csstree.StyleSheet
    const dirty = new Set<string>()
    const ppCtx: PostProcessContext = {
        cssAstChunks: new Map([["src/App.tsx", { originalCss: css, ast, wasMutated: false }]]),
        markFileDirty: (fp) => dirty.add(fp),
    }

    const [hook] = context.postProcessHooks.getAll()
    await hook?.(runner, ppCtx)

    return { ast, dirty }
}

describe("createClassRemapPlugin — user-authored selectors", () => {
    it("does not remap raw class names in descendant selectors", async () => {
        const main = "mochi_abc"
        const css = `.${main} { color: red; } .${main} .ProseMirror { margin: 0; }`
        const literalMap = new Map([[main, [lit(main)]]])

        const { ast } = await runRemap(css, literalMap)
        const names = classNamesInCss(ast)

        // The user-authored class survives untouched.
        expect(names).toContain("ProseMirror")
        // The mochi-internal class is renamed away from its original name.
        expect(names).not.toContain(main)
    })

    it("remaps the internal class but leaves the raw class in the JS literal", async () => {
        const main = "mochi_abc"
        const mainLit = lit(main)
        const css = `.${main} { color: red; } .${main} .ProseMirror { margin: 0; }`
        const literalMap = new Map([[main, [mainLit]]])

        await runRemap(css, literalMap)

        // Phase 3 rewrites the JS literal for the internal class only.
        expect(mainLit.value).not.toBe(main)
    })

    it("does not remap a raw class that appears as a standalone rule", async () => {
        const main = "mochi_abc"
        const css = `.${main} { color: red; } .ProseMirror { padding: 0; }`
        const literalMap = new Map([[main, [lit(main)]]])

        const { ast } = await runRemap(css, literalMap)
        const names = classNamesInCss(ast)

        expect(names).toContain("ProseMirror")
    })

    it("still remaps internal compound variant classes", async () => {
        const main = "mochi_abc"
        const variant = "mochi_variant"
        const css = `.${main} { color: red; } .${main}.${variant} { color: blue; }`
        const literalMap = new Map([
            [main, [lit(main)]],
            [variant, [lit(variant)]],
        ])

        const { ast } = await runRemap(css, literalMap)
        const names = classNamesInCss(ast)

        expect(names).not.toContain(main)
        expect(names).not.toContain(variant)
    })
})
