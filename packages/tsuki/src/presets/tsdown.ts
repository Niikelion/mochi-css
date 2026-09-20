import { createPostcssModule } from "@/modules/postcss"
import { tsdownModule } from "@/modules/tsdown"
import { createMochiConfigModule } from "@/modules/mochiConfig"
import { createUiFrameworkModule } from "@/modules/uiFramework"
import { createGitignoreModule } from "@/modules/gitignore"
import type { Preset } from "@/types"

export const tsdownPreset: Preset = {
    id: "tsdown",
    name: "tsdown",
    setup(runner) {
        runner.register(createMochiConfigModule({ tmpDir: ".mochi", roots: ["src"] }))
        runner.register(createPostcssModule())
        runner.register(tsdownModule)
        runner.register(createUiFrameworkModule())
        runner.register(createGitignoreModule(".mochi"))
    },
}
