import vm from "vm";

export interface Runner {
    execute(source: string, context: Record<string, any>): Promise<void>
}

export class VmRunner implements Runner {
    async execute(source: string, context: Record<string, any>): Promise<void> {
        const vmContext = vm.createContext({
            ...globalThis,
            process,
            ...context
        })

        await vm.runInContext(source, vmContext)
    }
}
