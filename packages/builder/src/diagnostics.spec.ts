import { describe, it, expect } from "vitest"
import { MochiError, getErrorMessage } from "@/diagnostics"

describe("MochiError", () => {
    it("stores code and message", () => {
        const err = new MochiError("MOCHI_TEST", "something broke")
        expect(err.code).toBe("MOCHI_TEST")
        expect(err.message).toBe("something broke")
        expect(err.name).toBe("MochiError")
    })

    it("stores optional file and cause", () => {
        const cause = new Error("root cause")
        const err = new MochiError("MOCHI_TEST", "failed", "src/foo.ts", cause)
        expect(err.file).toBe("src/foo.ts")
        expect(err.cause).toBe(cause)
    })

    it("is an instance of Error", () => {
        const err = new MochiError("MOCHI_TEST", "msg")
        expect(err).toBeInstanceOf(Error)
    })
})

describe("getErrorMessage", () => {
    it("returns message from Error instances", () => {
        expect(getErrorMessage(new Error("boom"))).toBe("boom")
    })

    it("stringifies non-Error values", () => {
        expect(getErrorMessage("raw string")).toBe("raw string")
        expect(getErrorMessage(42)).toBe("42")
    })
})