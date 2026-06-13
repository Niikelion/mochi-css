import { defineStage } from "@mochi-css/builder"
import type { StageContext, ProjectCache } from "@mochi-css/builder"
import type * as SWC from "@swc/core"
import { GeneratorsCollectionStage, type GeneratorsCollectionStageOut } from "./GeneratorsCollectionStage"

export type ClassnameLiteralsStageOut = {
    classNameLiterals: ProjectCache<Map<string, SWC.StringLiteral[]>>
}

export const ClassnameLiteralsStage = defineStage({
    dependsOn: [GeneratorsCollectionStage] as const,
    init(context: StageContext, genCollection: GeneratorsCollectionStageOut): ClassnameLiteralsStageOut {
        const classNameLiterals = context.registry.projectCache(
            () => [genCollection.generators, context.steps.evaluation],
            () => {
                const map = new Map<string, SWC.StringLiteral[]>()
                for (const gen of genCollection.generators.get()) {
                    for (const [name, literals] of gen.getIdentifierLiterals()) {
                        const existing = map.get(name)
                        if (existing) existing.push(...literals)
                        else map.set(name, [...literals])
                    }
                }
                return map
            },
        )

        return { classNameLiterals }
    },
})
