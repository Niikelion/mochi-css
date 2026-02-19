import {describe, it, expect} from "vitest"
import {parseFile, parseSource} from "@/parse";
import {MochiError} from "@/diagnostics";
import SWC from "@swc/core";
import fs from "fs/promises"

describe("parseSource", () => {
    it("should parse given file and return with and specified filePath", async () => {
        const result = await parseSource(`const test = 5;`,"./source/index.ts")

        expect(result.filePath).toEqual("./source/index.ts")
        expect(SWC.printSync(result.ast).code).toEqual("const test = 5;\n")
    })

    it("should parse tsx syntax when filePath ends with .tsx", async () => {
        const result = await parseSource(`const el = <div />;`, "./component.tsx")

        expect(result.filePath).toEqual("./component.tsx")
        expect(SWC.printSync(result.ast).code).toContain("div")
    })

    it("should throw MochiError with MOCHI_PARSE code on invalid syntax", async () => {
        await expect(parseSource(`const = invalid !!!`, "./bad.ts")).rejects.toSatisfy(
            (err: unknown) =>
                err instanceof MochiError &&
                err.code === "MOCHI_PARSE" &&
                err.file === "./bad.ts" &&
                err.cause !== undefined
        )
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

    it("should throw MochiError with MOCHI_FILE_READ code when file does not exist", async () => {
        await expect(parseFile("./nonexistent-file.ts")).rejects.toSatisfy(
            (err: unknown) =>
                err instanceof MochiError &&
                err.code === "MOCHI_FILE_READ" &&
                err.file === "./nonexistent-file.ts" &&
                err.cause !== undefined
        )
    })
})
