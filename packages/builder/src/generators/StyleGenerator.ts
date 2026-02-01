export interface StyleGenerator {
    collectArgs(source: string, args: unknown[]): void

    generateStyles(): Promise<{ global?: string, files?: Record<string, string> }>
}
