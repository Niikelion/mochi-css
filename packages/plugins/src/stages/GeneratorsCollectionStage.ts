import { Cached, defineStage } from "@mochi-css/builder"
import type { StageContext } from "@mochi-css/builder"
import type { StyleGenerator } from "@/types"

export type GeneratorsCollectionStageOut = {
    register(generator: StyleGenerator): void
    reset(): void
    readonly generators: Cached<StyleGenerator[]>
}

export const GeneratorsCollectionStage = defineStage({
    dependsOn: [],
    init(context: StageContext): GeneratorsCollectionStageOut {
        const generators = context.registry.projectInput<StyleGenerator[]>([])

        return {
            register(generator) {
                generators.get().push(generator)
                generators.invalidate()
            },
            reset() {
                generators.set([])
            },
            generators,
        }
    },
})
