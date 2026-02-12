import { describe, it, expect } from "vitest"
import { fileHash } from "@/manifest"

describe("fileHash", () => {
    it("returns a 12-character hex string", () => {
        const hash = fileHash("src/button.ts")
        expect(hash).toMatch(/^[0-9a-f]{12}$/)
    })

    it("returns the same hash for the same input", () => {
        expect(fileHash("src/button.ts")).toBe(fileHash("src/button.ts"))
    })

    it("returns different hashes for different inputs", () => {
        expect(fileHash("src/button.ts")).not.toBe(fileHash("src/link.ts"))
    })
})