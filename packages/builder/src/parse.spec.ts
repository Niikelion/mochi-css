import {describe, it, expect} from "vitest"
import {parseFile, parseSource} from "@/parse";
import SWC from "@swc/core";
import fs from "fs/promises"

describe("parseSource", () => {
    it("should parse given file and return with and specified filePath", async () => {
        const result = await parseSource(`const test = 5;`,"./source/index.ts")

        expect(result.filePath).toEqual("./source/index.ts")
        expect(SWC.printSync(result.ast).code).toEqual("const test = 5;\n")
    })
})

describe("parseFile", () => {
    it("should read file at given filePath and parse it", async () => {
        await fs.writeFile("./tmp.ts", `const a = "random text"`)
        const result = await parseFile("./tmp.ts")

        expect(result.filePath).toEqual("./tmp.ts")
        expect(SWC.printSync(result.ast).code).toEqual(`const a = "random text";\n`)

        await fs.rm("./tmp.ts")
    })
})
