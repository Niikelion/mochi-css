import fsExtra from "fs-extra"
import fs from "fs/promises"
import * as p from "@clack/prompts"
import { parseModule, generateCode } from "magicast"
import type { Module, ModuleContext } from "@/types"
import { mochiPackage } from "@/version"
import { getPluginsElements, type ObjNode } from "./ast"
import dedent from "dedent"

const esbuildScriptNames = [
    "build.mjs",
    "build.ts",
    "build.js",
    "scripts/build.mjs",
    "scripts/build.ts",
    "scripts/build.js",
    "esbuild.config.mjs",
    "esbuild.config.ts",
    "esbuild.config.js",
]

export function findEsbuildScript(): string | undefined {
    return esbuildScriptNames.find((name) => fsExtra.existsSync(name))
}

// noinspection TypeScriptCheckImport
const defaultEsbuildScript = /* language=typescript */ dedent`
    import { build } from "esbuild"
    import { mochiCss } from "@mochi-css/esbuild"

    await build({
        entryPoints: ["src/index.ts"],
        outdir: "dist",
        bundle: true,
        plugins: [mochiCss()],
    })
`

function addPluginCallToObj(obj: ObjNode, scriptPath: string): void {
    const elements = getPluginsElements(obj, scriptPath)
    elements.push({
        type: "CallExpression",
        callee: { type: "Identifier", name: "mochiCss" },
        arguments: [],
    })
}

function addMochiToEsbuildScript(mod: ReturnType<typeof parseModule>, scriptPath: string): void {
    type DeclNode = { id: { type: string; name: string }; init: Record<string, unknown> | null }
    type VarDeclNode = { type: "VariableDeclaration"; declarations: DeclNode[] }
    type ExprStmt = { type: "ExpressionStatement"; expression: Record<string, unknown> }

    const body = (mod.$ast as unknown as { body: unknown[] }).body

    // Look for a call expression statement: `build({ ... })` or `await build({ ... })`
    for (const stmt of body) {
        const stmtTyped = stmt as Record<string, unknown>
        if (stmtTyped["type"] !== "ExpressionStatement") continue

        let callExpr = (stmtTyped as ExprStmt).expression
        // Unwrap `await`
        if (callExpr["type"] === "AwaitExpression") {
            callExpr = callExpr["argument"] as Record<string, unknown>
        }
        if (callExpr["type"] !== "CallExpression") continue

        const args = callExpr["arguments"] as Record<string, unknown>[]
        const firstArg = args[0]
        if (firstArg?.["type"] === "ObjectExpression") {
            addPluginCallToObj(firstArg as ObjNode, scriptPath)
            return
        }
    }

    // Fallback: look for a variable holding the options object
    for (const stmt of body) {
        if ((stmt as { type: string }).type !== "VariableDeclaration") continue
        for (const d of (stmt as VarDeclNode).declarations) {
            if (d.init?.["type"] === "ObjectExpression") {
                addPluginCallToObj(d.init as ObjNode, scriptPath)
                return
            }
        }
    }

    throw new Error(`Failed to add mochiCss() plugin to ${scriptPath}`)
}

async function addMochiToScript(scriptPath: string): Promise<void> {
    const content = await fs.readFile(scriptPath, "utf-8")
    const mod = parseModule(content)

    mod.imports.$prepend({ from: "@mochi-css/esbuild", imported: "mochiCss", local: "mochiCss" })
    addMochiToEsbuildScript(mod, scriptPath)

    const { code } = generateCode(mod)
    await fs.writeFile(scriptPath, code)
}

export const esbuildModule: Module = {
    id: "esbuild",
    name: "esbuild",

    async run(ctx: ModuleContext): Promise<void> {
        const existingScript = findEsbuildScript()
        const { esbuild: cliOption } = ctx.moduleOptions

        let scriptPath: string
        if (cliOption !== undefined) {
            scriptPath = typeof cliOption === "string" ? cliOption : (existingScript ?? "build.mjs")
        } else if (existingScript) {
            scriptPath = existingScript
        } else if (ctx.nonInteractive) {
            scriptPath = "build.mjs"
        } else {
            const selected = await p.text({
                message: "Path to esbuild build script",
                placeholder: "build.mjs",
                defaultValue: "build.mjs",
            })
            if (p.isCancel(selected)) return
            scriptPath = selected
        }

        if (!fsExtra.existsSync(scriptPath)) {
            await fs.writeFile(scriptPath, defaultEsbuildScript)
            p.log.success("Created esbuild build script with mochi plugin")
        } else {
            await addMochiToScript(scriptPath)
            p.log.success("Added mochiCss() to esbuild build script")
        }

        ctx.requirePackage(mochiPackage("@mochi-css/esbuild"))
    },
}
