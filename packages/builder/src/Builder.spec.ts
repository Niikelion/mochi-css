import {describe, it, expect} from "vitest"
import {parseSource} from "@/parse";
import dedent from "dedent";
import {Builder} from "@/Builder";
import {RolldownBundler} from "@/Bundler";
import {VmRunner} from "@/Runner";
import { mochiCssFunctionExtractor } from "@/extractors/VanillaCssExtractor"

describe("Builder", () => {
    it("extracts style expressions from css calls", async () => {
        const module = await parseSource(/* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"
            
            export const buttonStyles = css({
                backgroundColor: "gray",
                
                "&:hover": {
                    backgroundColor: "white"
                }
            })
        `,"buttonStyles.ts")

        const builder = new Builder({
            rootDir: "./",
            extractors: [mochiCssFunctionExtractor],
            bundler: new RolldownBundler(),
            runner: new VmRunner()
        })

        const generators = await builder.collectStylesFromModules([module])
        const generator = generators.get("@mochi-css/vanilla:css")!
        const result = await generator.generateStyles()

        expect(result.global).toContain("background-color: gray")
        expect(result.global).toContain("background-color: white")
    })

    it("strips unused module-level symbols", async () => {
        const module = await parseSource(/* language=typescript */ dedent`
            import { css } from "@mochi-css/vanilla"

            // @ts-ignore
            const { color, name = fib(1000).toString() } = { color: "blue" }
            
            console.log(name)
            
            export const linkStyles = css({
                textDecoration: "none",
                color
            })
        `, "linkStyles.ts")

        let generatedCode = ""

        const builder = new Builder({
            rootDir: "./",
            extractors: [mochiCssFunctionExtractor],
            bundler: {
                async bundle(rootFilePath, files) {
                    const bundler = new RolldownBundler()

                    for (const path in files) {
                        if (!path.endsWith("linkStyles.ts")) continue

                        const source = files[path]
                        if (source === undefined) continue
                        generatedCode = source
                    }

                    return bundler.bundle(rootFilePath, files)
                }
            },
            runner: new VmRunner()
        })

        await builder.collectStylesFromModules([module])

        expect(generatedCode).toEqual(/* language=typescript */ dedent`
            #!
            const { color } = {
                color: "blue"
            };
            registerStyles("@mochi-css/vanilla:css", "linkStyles.ts", {
                textDecoration: "none",
                color
            });\n
        `)
    })
})
