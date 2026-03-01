import * as p from "@clack/prompts"
import { createPostcssModule } from "@/modules/postcss"
import type { Preset } from "@/types"

export const libPreset: Preset = {
    id: "lib",
    name: "Library",
    setup(runner) {
        p.log.warn("Library preset is not fully supported yet.")
        runner.register(createPostcssModule())
    },
}
