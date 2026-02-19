export interface StyleGenerator {
    collectArgs(source: string, args: unknown[]): Record<string, StyleGenerator> | void

    generateStyles(): Promise<{ global?: string, files?: Record<string, string> }>
}
