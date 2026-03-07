import type { Module, ModuleContext, ModuleOptions, PackageRequest, RunOptions } from "./types"
import { installPackages } from "./install"

export class ModuleRunner {
    private packages: PackageRequest[] = []
    private modules: Module[] = []

    register(module: Module): this {
        this.modules.push(module)
        return this
    }

    async run(options: RunOptions = {}): Promise<void> {
        const { nonInteractive = false, autoInstall = false, moduleOptions = {} as ModuleOptions } = options

        const ctx: ModuleContext = {
            requirePackage: (name, dev = true) => {
                this.packages.push({ name, dev })
            },
            requirePackages: (packages) => {
                for (const pkg of packages) {
                    this.packages.push({ name: pkg.name, dev: pkg.dev ?? true })
                }
            },
            nonInteractive,
            moduleOptions,
        }

        // Run all modules
        for (const module of this.modules) {
            await module.run(ctx)
        }

        // Install all required packages
        if (this.packages.length > 0) {
            await installPackages(this.packages, autoInstall)
        }
    }
}
