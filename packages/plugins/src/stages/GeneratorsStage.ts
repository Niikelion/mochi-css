import { defineStage } from "@mochi-css/builder"
import type { StageContext } from "@mochi-css/builder"
import type { StyleGenerator } from "@/types"

export type GeneratorsStageOut = {
    generators: Map<string, StyleGenerator> | null
}

export const generatorsStageDef = defineStage({
    dependsOn: [],
    init(_context: StageContext): GeneratorsStageOut {
        return { generators: null }
    },
})
