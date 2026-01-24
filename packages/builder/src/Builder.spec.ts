import {describe, it, expect} from "vitest"
import {parseSource} from "@/parse";
import dedent from "dedent";
import {Builder} from "@/Builder";
import {cssFunctionStyleSource} from "@/ProjectIndex";

describe("Builder", () => {
    it("extracts style expressions from css calls", async () => {
        const module = await parseSource(dedent`
            import { css } from "@mochi-css/vanilla"
            
            export const buttonStyles = css({
                backgroundColor: "gray",
                
                "&:hover": {
                    backgroundColor: "white"
                }
            })
        `, "buttonStyles.ts")

        const builder = new Builder({
            rootDir: "./",
            styleSources: [cssFunctionStyleSource]
        })

        const result = await builder.collectStylesFromModules([module])

        expect(result.length).toEqual(1)

        const [resultEntry] = result

        expect(resultEntry?.styles).toEqual([
            {
                backgroundColor: "gray",
                "&:hover": {
                    backgroundColor: "white"
                }
            }
        ])

        await builder.cleanup()
    })
})
