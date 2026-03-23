export interface PackageRequest {
    name: string
    dev?: boolean // default: true (most are dev deps)
}

/**
 * Per-module forced config paths, set by CLI flags.
 * Value: config file path, or `true` to use auto-detected/default path.
 */
export interface ModuleOptions {
    postcss?: string | true
    vite?: string | true
    next?: string | true
    framework?: string
}

export interface RunOptions {
    /** Skip all prompts and treat them as cancelled */
    nonInteractive?: boolean
    /** Auto-accept package installation without prompting */
    autoInstall?: boolean
    /** Forced per-module config paths from CLI flags */
    moduleOptions?: ModuleOptions
}

export interface ModuleContext {
    /** Require a package to be installed */
    requirePackage(name: string, dev?: boolean): void
    /** Require multiple packages */
    requirePackages(packages: PackageRequest[]): void
    /** True when running in non-interactive mode (all prompts are treated as cancelled) */
    readonly nonInteractive: boolean
    /** Forced per-module config paths from CLI flags */
    readonly moduleOptions: ModuleOptions
}

export interface Module {
    /** Unique module identifier */
    id: string
    /** Display name for prompts */
    name: string
    /** Run the module's setup logic */
    run(ctx: ModuleContext): Promise<void> | void
}

export interface PresetRunner {
    register(module: Module): this
}

export interface Preset {
    id: string
    name: string
    setup(runner: PresetRunner): void
}
