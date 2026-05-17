import { createPostcssModule } from "@/modules/postcss"
import { esbuildModule } from "@/modules/esbuild"
import { createMochiConfigModule } from "@/modules/mochiConfig"
import { createUiFrameworkModule } from "@/modules/uiFramework"
import { createGitignoreModule } from "@/modules/gitignore"
import type { Preset } from "@/types"

export const esbuildPreset: Preset = {
    id: "esbuild",
    name: "esbuild",
    setup(runner) {
        runner.register(createMochiConfigModule({ tmpDir: ".mochi", roots: ["src"] }))
        runner.register(createPostcssModule())
        runner.register(esbuildModule)
        runner.register(createUiFrameworkModule())
        runner.register(createGitignoreModule(".mochi"))
    },
}
