import type SWC from "@swc/core"

export interface StyleGenerator {
    collectArgs(source: string, args: unknown[]): Record<string, StyleGenerator> | void

    generateStyles(): Promise<{ global?: string; files?: Record<string, string> }>

    getArgReplacements?(): { source: string; expression: SWC.Expression }[]
}
