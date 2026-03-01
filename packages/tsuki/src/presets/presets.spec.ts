import { describe, it, expect, vi, afterEach } from "vitest"
import type { PresetRunner, Module } from "@/types"

vi.mock("@clack/prompts", () => ({
    log: { warn: vi.fn() },
}))

vi.mock("@/modules/postcss", () => ({
    createPostcssModule: vi.fn().mockReturnValue({ id: "postcss", name: "PostCSS", run: vi.fn() }),
    postcssModule: { id: "postcss", name: "PostCSS", run: vi.fn() },
}))

vi.mock("@/modules/vite", () => ({
    viteModule: { id: "vite", name: "Vite", run: vi.fn() },
}))

vi.mock("@/modules/next", () => ({
    nextModule: { id: "next", name: "Next.js", run: vi.fn() },
}))

import { createPostcssModule } from "@/modules/postcss"
import { libPreset, vitePreset, nextjsPreset } from "./index"

afterEach(() => {
    vi.clearAllMocks()
})

function makeRunner(): { runner: PresetRunner; modules: Module[] } {
    const modules: Module[] = []
    const runner: PresetRunner = {
        register(m: Module) {
            modules.push(m)
            return this
        },
    }
    return { runner, modules }
}

describe("libPreset", () => {
    it("registers exactly one postcss module", () => {
        const { runner, modules } = makeRunner()
        libPreset.setup(runner)
        expect(modules).toHaveLength(1)
        expect(modules.at(0)?.id).toBe("postcss")
    })

    it("calls createPostcssModule with no options", () => {
        const { runner } = makeRunner()
        libPreset.setup(runner)
        expect(createPostcssModule).toHaveBeenCalledWith()
    })
})

describe("vitePreset", () => {
    it("registers postcss module and vite module", () => {
        const { runner, modules } = makeRunner()
        vitePreset.setup(runner)
        expect(modules).toHaveLength(2)
        expect(modules.at(0)?.id).toBe("postcss")
        expect(modules.at(1)?.id).toBe("vite")
    })

    it("calls createPostcssModule with outDir: .mochi", () => {
        const { runner } = makeRunner()
        vitePreset.setup(runner)
        expect(createPostcssModule).toHaveBeenCalledWith({ outDir: ".mochi" })
    })
})

describe("nextjsPreset", () => {
    it("registers postcss module and next module", () => {
        const { runner, modules } = makeRunner()
        nextjsPreset.setup(runner)
        expect(modules).toHaveLength(2)
        expect(modules.at(0)?.id).toBe("postcss")
        expect(modules.at(1)?.id).toBe("next")
    })

    it("calls createPostcssModule with outDir: .mochi and auto: true", () => {
        const { runner } = makeRunner()
        nextjsPreset.setup(runner)
        expect(createPostcssModule).toHaveBeenCalledWith({ outDir: ".mochi", auto: true })
    })
})
