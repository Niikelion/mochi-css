import type { Module, ModuleContext, PackageRequest } from "./types"
import { installPackages } from "./install"

export class ModuleRunner {
    private packages: PackageRequest[] = []
    private modules: Module[] = []

    register(module: Module): this {
        this.modules.push(module)
        return this
    }

    async run(): Promise<void> {
        const ctx: ModuleContext = {
            requirePackage: (name, dev = true) => {
                this.packages.push({ name, dev })
            },
            requirePackages: (packages) => {
                for (const pkg of packages) {
                    this.packages.push({ name: pkg.name, dev: pkg.dev ?? true })
                }
            }
        }

        // Run all modules
        for (const module of this.modules) {
            await module.run(ctx)
        }

        // Install all required packages
        if (this.packages.length > 0) {
            await installPackages(this.packages)
        }
    }
}
