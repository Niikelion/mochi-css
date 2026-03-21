import type { Plugin } from "vite"
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

            const builder = new Builder(options)
            const result = await builder.collectMochiCss()
            manifest = { global: result.global, files: result.files ?? {} }

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

        async transform(code, id) {
            // Skip non-source files (CSS, JSON, assets, etc.)
            if (!/\.(ts|tsx|js|jsx)$/.test(id)) return undefined

            // Apply source transforms (e.g. styledIdPlugin injects s-xxx IDs)
            const transformed = context
                ? await context.sourceTransform.transform(code, { filePath: id })
                : code

            // If this file has no CSS in the manifest, return transform result only
            if (!manifest || manifest.files[id] === undefined) {
                return transformed !== code ? { code: transformed, map: null } : undefined
            }

            // Inject CSS import statements
            const hash = fileHash(id)
            const imports: string[] = [`import "${VIRTUAL_PREFIX}${hash}.css";`]
            if (manifest.global) imports.push(`import "${GLOBAL_ID}";`)

            return {
                code: imports.join("\n") + "\n" + transformed,
                map: null,
            }
        },
    }
}
