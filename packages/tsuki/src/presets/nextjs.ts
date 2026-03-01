import { createPostcssModule } from "@/modules/postcss"
import { nextModule } from "@/modules/next"
import type { Preset } from "@/types"

export const nextjsPreset: Preset = {
    id: "nextjs",
    name: "Next.js",
    setup(runner) {
        runner.register(createPostcssModule({ outDir: ".mochi", auto: true }))
        runner.register(nextModule)
    },
}
