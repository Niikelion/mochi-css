export type Diagnostic = {
    code: string
    message: string
    severity: 'error' | 'warning'
    file?: string
    line?: number
    column?: number
}

export type OnDiagnostic = (diagnostic: Diagnostic) => void

export class MochiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly file?: string,
        public override readonly cause?: unknown
    ) {
        super(message)
        this.name = 'MochiError'
    }
}
