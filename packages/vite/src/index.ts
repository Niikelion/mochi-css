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

const VIRTUAL_PREFIX = "virtual:mochi-css/"
const RESOLVED_PREFIX = "\0virtual:mochi-css/"
const GLOBAL_ID = "virtual:mochi-css/global.css"
const RESOLVED_GLOBAL_ID = "\0virtual:mochi-css/global.css"

export type MochiViteOptions = Partial<BuilderOptions>

export function mochiCss(opts?: MochiViteOptions): Plugin {
    const options: BuilderOptions = {
        rootDir: opts?.rootDir ?? "src",
        extractors: opts?.extractors ?? defaultExtractors,
        bundler: opts?.bundler ?? new RolldownBundler(),
        runner: opts?.runner ?? new VmRunner(),
        splitBySource: true,
        onDiagnostic: opts?.onDiagnostic,
    }

    let manifest: MochiManifest | undefined
    // Map from hash to source path for resolving virtual modules
    const hashToSource = new Map<string, string>()

    return {
        name: "mochi-css",
        enforce: "pre",

        async buildStart() {
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

        transform(code, id) {
            if (!manifest) return undefined

            // Only process source files that have styles
            const css = manifest.files[id]
            if (css === undefined) return undefined

            const hash = fileHash(id)
            const imports: string[] = []

            // Import per-file CSS
            imports.push(`import "${VIRTUAL_PREFIX}${hash}.css";`)

            // Import global CSS (keyframes etc.) - bundler deduplicates
            if (manifest.global) {
                imports.push(`import "${GLOBAL_ID}";`)
            }

            return {
                code: imports.join("\n") + "\n" + code,
                map: null,
            }
        },
    }
}
