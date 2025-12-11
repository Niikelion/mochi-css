import {describe, it, expect} from "vitest"
import {createToken} from "@/token";

describe("Token", () => {
    it("should correctly generate css variable name from token name", () => {
        const token = createToken("some-token-name")
        expect(token.variable).toEqual(`--${token.name}`)

        const token2 = createToken("some_other_token_name")
        expect(token2.variable).toEqual(`--${token2.name}`)
    })

    it("should correctly generate css variable value from token name", () => {
        const token = createToken("some-token-name")
        expect(token.value).toEqual(`var(--${token.name})`)

        const token2 = createToken("some_other_token_name")
        expect(token2.value).toEqual(`var(--${token2.name})`)
    })
})
