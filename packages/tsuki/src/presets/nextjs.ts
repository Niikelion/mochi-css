import { createPostcssModule } from "@/modules/postcss"
import { nextModule } from "@/modules/next"
import { createMochiConfigModule } from "@/modules/mochiConfig"
import { createUiFrameworkModule } from "@/modules/uiFramework"
import { createGitignoreModule } from "@/modules/gitignore"
import type { Preset } from "@/types"

export const nextjsPreset: Preset = {
    id: "nextjs",
    name: "Next.js",
    setup(runner) {
        runner.register(createMochiConfigModule({ styledId: true, tmpDir: ".mochi", splitCss: true }))
        runner.register(createPostcssModule({ auto: true }))
        runner.register(nextModule)
        runner.register(createUiFrameworkModule({ auto: true }))
        runner.register(createGitignoreModule(".mochi"))
    },
}
