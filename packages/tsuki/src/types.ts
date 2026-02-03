export interface PackageRequest {
    name: string
    dev?: boolean // default: true (most are dev deps)
}

export interface ModuleContext {
    /** Require a package to be installed */
    requirePackage(name: string, dev?: boolean): void
    /** Require multiple packages */
    requirePackages(packages: PackageRequest[]): void
}

export interface Module {
    /** Unique module identifier */
    id: string
    /** Display name for prompts */
    name: string
    /** Run the module's setup logic */
    run(ctx: ModuleContext): Promise<void>
}
