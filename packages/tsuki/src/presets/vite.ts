import { createPostcssModule } from "@/modules/postcss"
import { viteModule } from "@/modules/vite"
import type { Preset } from "@/types"

export const vitePreset: Preset = {
    id: "vite",
    name: "Vite",
    setup(runner) {
        runner.register(createPostcssModule({ outDir: ".mochi" }))
        runner.register(viteModule)
    },
}
