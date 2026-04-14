import type { Plugin, ViteDevServer } from "vite"
import {
    fileHash,
    type MochiManifest,
    path
} from "@mochi-css/builder"
import { loadConfig, resolveConfig, FullContext, createBuilder, type Config, OnDiagnostic } from "@mochi-css/config"
import { diagnosticToString } from "@mochi-css/core"

const VIRTUAL_PREFIX = "virtual:mochi-css/"
const RESOLVED_PREFIX = "\0virtual:mochi-css/"
const GLOBAL_ID = "virtual:mochi-css/global.css"
const RESOLVED_GLOBAL_ID = "\0virtual:mochi-css/global.css"

/**
 * Inline options for the Mochi CSS Vite plugin.
 *
 * Most options are loaded automatically from `mochi.config.ts` — see `@mochi-css/config` for the full list.
 * Inline options passed here are merged on top of the file config.
 *
 * The only options unique to the Vite integration are `bundler` and `runner`.
 *
 * @see {@link https://github.com/Niikelion/mochi-css/tree/master/packages/config MochiConfig}
 */
export type MochiViteOptions = Partial<Pick<Config, "plugins"> & {
    entries: string[]
}>

/**
 * Vite plugin that statically extracts Mochi CSS styles from TypeScript/TSX source files
 * and serves them as virtual CSS modules.
 *
 * `mochi.config.ts` is loaded automatically from the Vite project root — you only need to
 * pass `opts` when you want to override individual options inline.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from "vite"
 * import { mochiCss } from "@mochi-css/vite"
 *
 * export default defineConfig({
 *     plugins: [mochiCss()],
 * })
 * ```
 */
export function mochiCss(opts?: MochiViteOptions): Plugin {
    let resolved: Config | undefined
    let context: FullContext | undefined
    let builder: ReturnType<typeof createBuilder> | undefined
    let server: ViteDevServer | undefined

    let manifest: MochiManifest | undefined
    // Map from hash to source path for resolving virtual modules
    const hashToSource = new Map<string, string>()

    const entries = opts?.entries ?? ["src/main.tsx"]

    const resolvedEntries = new Set(entries.map(entry => path.resolve(path.fromSystemPath(process.cwd()), entry)))

    return {
        name: "mochi-css",
        enforce: "pre",

        async configResolved(viteConfig) {
            const fileConfig = await loadConfig(viteConfig.root)
            resolved = await resolveConfig(fileConfig, opts, {
                roots: ["src"],
                splitCss: true,
            })

            const logger = viteConfig.logger

            const defaultDiagnostic: OnDiagnostic = (event) => {
                const content = diagnosticToString(event)
                switch (event.severity) {
                    case "error": return logger.error(content)
                    case "warning": return logger.warn(content)
                    case "info": return logger.info(content)
                    case "debug": {
                        if (!resolved?.debug) return
                        return logger.info(content)
                    }
                }
            }

            const onDiagnostic = resolved?.onDiagnostic ?? defaultDiagnostic

            const ctx = new FullContext(onDiagnostic)
            context = ctx
            for (const plugin of resolved.plugins) {
                plugin.onLoad?.(ctx)
            }
            builder = createBuilder(resolved, ctx)
            const result = await builder.collectMochiCss()
            manifest = { global: result.global, files: result.files ?? {} }

            hashToSource.clear()
            for (const source of Object.keys(manifest.files)) {
                const hash = fileHash(source)
                hashToSource.set(hash, source)
            }
        },

        buildStart() { /* CSS already collected in configResolved */ },

        resolveId(id) {
            if (id === GLOBAL_ID) return { id: RESOLVED_GLOBAL_ID }
            if (id.startsWith(VIRTUAL_PREFIX)) return { id: "\0" + id }
            return undefined
        },

        load(id) {
            if (!manifest) return undefined

            if (id === RESOLVED_GLOBAL_ID) {
                return manifest.global ?? ""
            }

            if (id.startsWith(RESOLVED_PREFIX)) {
                const hash = id.slice(RESOLVED_PREFIX.length).replace(/\.css$/, "")
                const source = hashToSource.get(hash)
                if (source) {
                    return manifest.files[source] ?? ""
                }
            }

            return undefined
        },

        configureServer(s) {
            server = s
        },

        async handleHotUpdate(ctx) {
            if (!/\.(ts|tsx|js|jsx)$/.test(ctx.file)) return
            if (!context || !builder || !manifest) return

            const oldManifest = manifest

            const result = await builder.collectMochiCss()
            manifest = { global: result.global, files: result.files ?? {} }

            hashToSource.clear()
            for (const source of Object.keys(manifest.files)) {
                hashToSource.set(fileHash(source), source)
            }

            const ctxModuleSet = new Set(ctx.modules)
            const invalidatedModules = new Set<NonNullable<ReturnType<typeof ctx.server.moduleGraph.getModuleById>>>()
            const extraModules = new Set<NonNullable<ReturnType<typeof ctx.server.moduleGraph.getModuleById>>>()

            const invalidateAndCollectImporters = (mod: NonNullable<ReturnType<typeof ctx.server.moduleGraph.getModuleById>>) => {
                ctx.server.moduleGraph.invalidateModule(mod)
                invalidatedModules.add(mod)
                for (const importer of mod.importers) {
                    if (!ctxModuleSet.has(importer)) {
                        extraModules.add(importer)
                    }
                }
            }

            if (oldManifest.global !== manifest.global) {
                const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_GLOBAL_ID)
                if (mod) invalidateAndCollectImporters(mod)
            }

            const allSources = new Set([...Object.keys(oldManifest.files), ...Object.keys(manifest.files)])
            for (const source of allSources) {
                if (oldManifest.files[source] !== manifest.files[source]) {
                    const hash = fileHash(source)
                    const mod = ctx.server.moduleGraph.getModuleById(`${RESOLVED_PREFIX}${hash}.css`)
                    if (mod) invalidateAndCollectImporters(mod)
                }
            }

            return [...ctx.modules, ...invalidatedModules, ...extraModules]
        },

        async watchChange(id, change) {
            if (change.event !== "delete") return
            if (!/\.(ts|tsx|js|jsx)$/.test(id)) return
            if (!manifest) return

            delete manifest.files[id]
            hashToSource.delete(fileHash(id))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const ws = server?.hot ?? server?.ws
            ws?.send({ type: "full-reload" })
        },

        async transform(code, id) {
            // Skip non-source files (CSS, JSON, assets, etc.)
            if (!/\.(ts|tsx|js|jsx)$/.test(id)) return undefined
            if (!context) return undefined

            // Apply registered source transforms (e.g. styledIdPlugin for runtime "s-*" id injection)
            const transformed = await context.filePreProcess.transform(code, { filePath: id })

            const imports: string[] = []

            // Inject global CSS import (keyframes, globalCss, and all CSS when splitCss: false)
            if (resolvedEntries.has(id) && manifest?.global) {
                imports.push(`import "${GLOBAL_ID}";`)
            }

            // Inject per-file CSS import (splitCss: true)
            if (manifest?.files?.[id] !== undefined) {
                const hash = fileHash(id)
                imports.push(`import "${VIRTUAL_PREFIX}${hash}.css";`)
            }

            if (imports.length === 0) {
                return transformed !== code ? { code: transformed } : undefined
            }

            return {
                code: imports.join("\n") + "\n" + transformed,
            }
        },
    }

}
