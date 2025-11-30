import fs from "fs/promises";
import path from "path";
import * as SWC from "@swc/core";
import {Module, ProjectIndex} from "@/ProjectIndex";
import vm from "vm";
import {CSSObject, StyleProps} from "@mochi-css/vanilla";

export type BuilderOptions = {
  rootDir: string
}

const rootFileSuffix = `\
declare global {
    function registerStyles(...args: any[]): void
}`

export class Builder {
    constructor(private options: BuilderOptions) {}

    private async findAllFiles(dir: string): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        const results = await Promise.all(entries.map(async entry => {
            const res = path.resolve(dir, entry.name)
            if (entry.isDirectory()) {
                return await this.findAllFiles(res)
            } else if (/\.(ts|tsx)$/.test(entry.name)) {
                return [res]
            }
            return []
        }))
        return results.flat()
    }

    private async parseFile(filePath: string): Promise<Module> {
        const src = await fs.readFile(filePath, "utf8")
        return {
            ast: await SWC.parse(src, {
                syntax: "typescript",
                tsx: filePath.endsWith(".tsx"),
                target: "es2022"
            }),
            filePath
        }
    }

    private async extractRelevantSymbols(index: ProjectIndex) {
        return Object.fromEntries(index.files.map(([path, info]) => {
            const styles = info.styleExpressions

            if (styles.size === 0) return [path, null]

            const args = styles.values().filter(e => !info.usedNodes.has(e)).map(expression => ({ expression }))
            const registerExpression: SWC.CallExpression & { ctxt: number } = {
                type: "CallExpression",
                span: emptySpan,
                arguments: [{ expression: { type: "StringLiteral", span: emptySpan, value: path } }, ...args],
                ctxt: 0,
                callee: {
                    type: "Identifier",
                    span: emptySpan,
                    ctxt: 1,
                    value: "registerStyles",
                    optional: false
                }
            }

            const code = SWC.printSync({
                type: "Module",
                span: emptySpan,
                body: [
                    ...info.ast.body.filter(i => info.usedNodes.has(i)),
                    {
                        type: "ExpressionStatement",
                        span: emptySpan,
                        expression: registerExpression
                    }
                ],
                interpreter: ""
            }).code

            return [path, code]
        }))
    }
    private async executeFiles(files: Record<string, string | null>, onStyleRegistered: (source: string, styles: StyleProps[]) => void): Promise<void> {
        const context = vm.createContext({
            registerStyles(source: string, ...registeredStyles: StyleProps[]) {
                onStyleRegistered(source, registeredStyles)
            }
        })

        // prepare extracted project
        const tmp = path.resolve(process.cwd(), ".mochi")
        const rootPath = path.join(tmp, "__mochi-css__.ts")
        const outputPath = path.join(tmp, "__mochi-css__.js")

        const paths: string[] = []

        for (const [filename, source] of Object.entries(files)) {
            if (source === null) continue
            const relativePath = path.relative(process.cwd(), filename)
            paths.push(relativePath.replaceAll(path.win32.sep, path.posix.sep))

            const filePath = path.join(tmp, relativePath)
            await fs.mkdir(path.dirname(filePath), { recursive: true })
            await fs.writeFile(filePath, source, "utf8")
        }
        const rootImports = paths.map(f => `import "./${f}";`).join("\n")

        await fs.writeFile(rootPath, [rootImports, rootFileSuffix].join("\n\n"), "utf8")

        // bundle all
        const newFiles = await SWC.bundle({
            target: "node",
            module: {},
            workingDir: tmp,
            output: {
                path: outputPath,
                name: "generated"
            },
            entry: rootPath
        })
        const resultFile = newFiles["__mochi-css__.ts"] ?? null
        if (!resultFile) return

        await vm.runInContext(resultFile.code, context)
    }

    public async collectMochiStyles() {
        const files = await this.findAllFiles(this.options.rootDir)
        const modules = await Promise.all(files.map(async file => this.parseFile(file)))
        const index = new ProjectIndex(modules)
        index.propagateUsages()
        const resultingFiles = await this.extractRelevantSymbols(index)
        const collectedStyles: { path: string, styles: StyleProps[] }[] = []
        await this.executeFiles(resultingFiles, (path, styles) => collectedStyles.push({ path, styles }))
        return collectedStyles
    }

    public async collectMochiCss(onDep?: (path: string) => void) {
        const collectedStyles = await this.collectMochiStyles()
        const css = new Set<string>()
        for (const { path, styles } of collectedStyles) {
            onDep?.(path)
            for (const style of styles) {
                const styleCss = new CSSObject(style).asCssString()
                css.add(styleCss)
            }
        }
        const sortedCss = [...css.values()].sort()
        return { "global.css": sortedCss.join("\n\n") }
    }
}

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }
