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

vi.mock("@/modules/mochiConfig", () => ({
    createMochiConfigModule: vi.fn().mockReturnValue({ id: "mochi-config", name: "Mochi Config", run: vi.fn() }),
}))

vi.mock("@/modules/uiFramework", () => ({
    createUiFrameworkModule: vi.fn().mockReturnValue({ id: "ui-framework", name: "UI Framework", run: vi.fn() }),
}))

import { createPostcssModule } from "@/modules/postcss"
import { createMochiConfigModule } from "@/modules/mochiConfig"
import { createUiFrameworkModule } from "@/modules/uiFramework"
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
    it("registers mochi-config, postcss, vite, and ui-framework modules", () => {
        const { runner, modules } = makeRunner()
        vitePreset.setup(runner)
        expect(modules).toHaveLength(4)
        expect(modules.at(0)?.id).toBe("mochi-config")
        expect(modules.at(1)?.id).toBe("postcss")
        expect(modules.at(2)?.id).toBe("vite")
        expect(modules.at(3)?.id).toBe("ui-framework")
    })

    it("calls createMochiConfigModule with styledId: true and outDir: .mochi", () => {
        const { runner } = makeRunner()
        vitePreset.setup(runner)
        expect(createMochiConfigModule).toHaveBeenCalledWith({ styledId: true, outDir: ".mochi" })
    })

    it("calls createPostcssModule with no options", () => {
        const { runner } = makeRunner()
        vitePreset.setup(runner)
        expect(createPostcssModule).toHaveBeenCalledWith()
    })

    it("calls createUiFrameworkModule with no args", () => {
        const { runner } = makeRunner()
        vitePreset.setup(runner)
        expect(createUiFrameworkModule).toHaveBeenCalledWith()
    })
})

describe("nextjsPreset", () => {
    it("registers mochi-config, postcss, next, and ui-framework modules", () => {
        const { runner, modules } = makeRunner()
        nextjsPreset.setup(runner)
        expect(modules).toHaveLength(4)
        expect(modules.at(0)?.id).toBe("mochi-config")
        expect(modules.at(1)?.id).toBe("postcss")
        expect(modules.at(2)?.id).toBe("next")
        expect(modules.at(3)?.id).toBe("ui-framework")
    })

    it("calls createMochiConfigModule with styledId: true and outDir: .mochi", () => {
        const { runner } = makeRunner()
        nextjsPreset.setup(runner)
        expect(createMochiConfigModule).toHaveBeenCalledWith({ styledId: true, outDir: ".mochi" })
    })

    it("calls createPostcssModule with auto: true", () => {
        const { runner } = makeRunner()
        nextjsPreset.setup(runner)
        expect(createPostcssModule).toHaveBeenCalledWith({ auto: true })
    })

    it("calls createUiFrameworkModule with auto: true", () => {
        const { runner } = makeRunner()
        nextjsPreset.setup(runner)
        expect(createUiFrameworkModule).toHaveBeenCalledWith({ auto: true })
    })
})
