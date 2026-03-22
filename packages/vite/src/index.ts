import { applyPatch } from "diff"
import type { Plugin, ViteDevServer } from "vite"
import {
    Builder,
    BuilderOptions,
    defaultExtractors,
    RolldownBundler,
    VmRunner,
    fileHash,
    type MochiManifest,
} from "@mochi-css/builder"
import { loadConfig, resolveConfig, FullContext, type Config } from "@mochi-css/config"

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
export type MochiViteOptions = Partial<BuilderOptions> & Pick<Config, "plugins">

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
    let builder: Builder | undefined
    let server: ViteDevServer | undefined

    let manifest: MochiManifest | undefined
    // Map from hash to source path for resolving virtual modules
    const hashToSource = new Map<string, string>()

    return {
        name: "mochi-css",
        enforce: "pre",

        async configResolved(viteConfig) {
            const fileConfig = await loadConfig(viteConfig.root)
            resolved = await resolveConfig(fileConfig, opts, {
                roots: ["src"],
                extractors: defaultExtractors,
                splitCss: true,
            })
        },

        async buildStart() {
            if (!resolved) return

            context = new FullContext()
            const buildContext = context
            for (const plugin of resolved.plugins) {
                plugin.onLoad?.(buildContext)
            }
            const options: BuilderOptions = {
                roots: resolved.roots,
                extractors: resolved.extractors,
                bundler: opts?.bundler ?? new RolldownBundler(),
                runner: opts?.runner ?? new VmRunner(),
                splitCss: resolved.splitCss,
                onDiagnostic: resolved.onDiagnostic,
                filePreProcess: ({ content, filePath }) => buildContext.sourceTransform.transform(content, { filePath }),
            }

            builder = new Builder(options)
            const result = await builder.collectMochiCss()
            // Normalize keys to forward slashes so Vite's id values (always forward-slash) match on Windows
            const normalizedFiles: Record<string, string> = {}
            for (const [source, css] of Object.entries(result.files ?? {})) {
                normalizedFiles[source.replaceAll("\\", "/")] = css
            }
            manifest = { global: result.global, files: normalizedFiles, sourcemods: result.sourcemods }

            hashToSource.clear()
            for (const source of Object.keys(manifest.files)) {
                const hash = fileHash(source)
                hashToSource.set(hash, source)
            }
        },

        resolveId(id) {
            if (id === GLOBAL_ID) return RESOLVED_GLOBAL_ID
            if (id.startsWith(VIRTUAL_PREFIX)) return "\0" + id
            return undefined
        },

        load(id) {
            if (!manifest) return undefined

            if (id === RESOLVED_GLOBAL_ID) {
                return manifest.global ?? ""
            }

            if (id.startsWith(RESOLVED_PREFIX)) {
                const hash = id
                    .slice(RESOLVED_PREFIX.length)
                    .replace(/\.css$/, "")
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
            const normalizedFiles: Record<string, string> = {}
            for (const [source, css] of Object.entries(result.files ?? {})) {
                normalizedFiles[source.replaceAll("\\", "/")] = css
            }
            manifest = { global: result.global, files: normalizedFiles, sourcemods: result.sourcemods }

            hashToSource.clear()
            for (const source of Object.keys(manifest.files)) {
                hashToSource.set(fileHash(source), source)
            }

            const invalidated: NonNullable<ReturnType<typeof ctx.server.moduleGraph.getModuleById>>[] = []

            if (oldManifest.global !== manifest.global) {
                const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_GLOBAL_ID)
                if (mod) {
                    ctx.server.moduleGraph.invalidateModule(mod)
                    invalidated.push(mod)
                }
            }

            const allSources = new Set([
                ...Object.keys(oldManifest.files),
                ...Object.keys(manifest.files),
            ])
            for (const source of allSources) {
                if (oldManifest.files[source] !== manifest.files[source]) {
                    const hash = fileHash(source)
                    const mod = ctx.server.moduleGraph.getModuleById(`${RESOLVED_PREFIX}${hash}.css`)
                    if (mod) {
                        ctx.server.moduleGraph.invalidateModule(mod)
                        invalidated.push(mod)
                    }
                }
            }

            return [...ctx.modules, ...invalidated]
        },

        async watchChange(id, change) {
            if (change.event !== "delete") return
            if (!/\.(ts|tsx|js|jsx)$/.test(id)) return
            if (!manifest) return

            delete manifest.files[id]
            delete manifest.sourcemods?.[id]
            hashToSource.delete(fileHash(id))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(server?.hot ?? (server as any)?.ws)?.send({ type: "full-reload" })
        },

        async transform(code, id) {
            // Skip non-source files (CSS, JSON, assets, etc.)
            if (!/\.(ts|tsx|js|jsx)$/.test(id)) return undefined

            // Vite normalizes ids to forward slashes; manifest keys are also normalized in buildStart
            const normalizedId = id.replaceAll("\\", "/")

            // Apply sourcemod from manifest (produced by builder at build time, refreshed by handleHotUpdate)
            const sourcemod = manifest?.sourcemods?.[normalizedId]
            const transformed = sourcemod ? (applyPatch(code, sourcemod) || code) : code

            // If this file has no CSS in the manifest, return transform result only
            if (!manifest || manifest.files[normalizedId] === undefined) {
                return transformed !== code ? { code: transformed as string, map: null } : undefined
            }

            // Inject CSS import statements
            const hash = fileHash(normalizedId)
            const imports: string[] = [`import "${VIRTUAL_PREFIX}${hash}.css";`]
            if (manifest.global) imports.push(`import "${GLOBAL_ID}";`)

            return {
                code: imports.join("\n") + "\n" + (transformed as string),
                map: null,
            }
        },
    }
}
