import {describe, it, expect} from "vitest"
import {VmRunner} from "@/Runner";
import dedent from "dedent";

describe("VmRunner", () => {
    it("executes given code with provided globals", async () => {
        let executed = false

        const runner = new VmRunner()

        await runner.execute(/* language=typescript */ dedent`
            // @ts-ignore
            acknowledgeExecution()
        `, {
            acknowledgeExecution: () => executed = true
        })

        expect(executed).toEqual(true)
    })
})
