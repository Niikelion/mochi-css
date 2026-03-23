import { describe, it, expect, vi, beforeEach } from "vitest"

describe("mochiPackage", () => {
    beforeEach(() => {
        vi.stubGlobal("__VERSION__", "2.1.0")
    })

    it("appends caret major version range", async () => {
        const { mochiPackage } = await import("./version")
        expect(mochiPackage("@mochi-css/postcss")).toBe("@mochi-css/postcss@^2.0.0")
    })

    it("handles prerelease versions", async () => {
        vi.stubGlobal("__VERSION__", "3.0.0-beta.1")
        const { mochiPackage } = await import("./version")
        expect(mochiPackage("@mochi-css/vite")).toBe("@mochi-css/vite@^3.0.0")
    })
})
