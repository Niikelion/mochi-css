import { createPostcssModule } from "@/modules/postcss"
import { viteModule } from "@/modules/vite"
import { createMochiConfigModule } from "@/modules/mochiConfig"
import { createUiFrameworkModule } from "@/modules/uiFramework"
import type { Preset } from "@/types"

export const vitePreset: Preset = {
    id: "vite",
    name: "Vite",
    setup(runner) {
        runner.register(createMochiConfigModule({ tmpDir: ".mochi" }))
        runner.register(createPostcssModule())
        runner.register(viteModule)
        runner.register(createUiFrameworkModule())
    },
}
