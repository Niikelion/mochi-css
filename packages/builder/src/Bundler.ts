import { path } from "./utils"
import { rolldown, Plugin } from "rolldown"

/**
 * Maps absolute file paths to their source content.
 * Paths absent from the map (or mapped to `undefined`) are not part of the virtual filesystem
 * and will fall through to the real filesystem.
 */
export type FileLookup = Partial<Record<string, string>>

/**
 * Bundles a set of in-memory source files into a single JavaScript string.
 * Used by the builder to execute relevant code.
 */
export interface Bundler {
    /**
     * Bundles the module rooted at `rootFilePath` using the provided virtual filesystem.
     *
     * @param rootFilePath - absolute path to the module entry-point.
     * @param files - virtual files.
     * @param tsConfigPath - optional path to a `tsconfig.json` to use for TypeScript compilation.
     * @returns the bundled CJS source as a string
     */
    bundle(rootFilePath: string, files: FileLookup, tsConfigPath?: string): Promise<string>
}

/**
 * Virtual filesystem plugin for Rolldown.
 *
 * @param rootFilePath - module entry-point path
 * @param files - virtual files
 */
function createVirtualFsPlugin(rootFilePath: string, files: FileLookup): Plugin {
    const normalizedFiles = new Map<string, string>()

    for (const [filePath, source] of Object.entries(files)) {
        if (source !== undefined) {
            normalizedFiles.set(path.fromSystemPath(filePath), source)
        }
    }

    const tryResolve = (resolvedPath: string): string | null => {
        if (normalizedFiles.has(resolvedPath)) return resolvedPath
        for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
            const withExt = resolvedPath + ext
            if (normalizedFiles.has(withExt)) return withExt
        }
        for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
            const indexFile = resolvedPath + "/index" + ext
            if (normalizedFiles.has(indexFile)) return indexFile
        }
        return null
    }

    return {
        name: "virtual-fs",
        resolveId(source, importer = rootFilePath) {
            const normalizedSource = path.fromSystemPath(source)
            const resolvedPath = path.isAbsolute(normalizedSource)
                ? normalizedSource
                : path.resolve(path.dirname(importer), normalizedSource)

            return tryResolve(resolvedPath)
        },
        load(id) {
            const normalizedId = path.fromSystemPath(id)
            const content = normalizedFiles.get(normalizedId)

            if (content !== undefined) {
                return content
            }

            return null
        },
    } satisfies Pick<Plugin, "name" | "resolveId" | "load">
}

/**
 * Bundler implementation using Rolldown for bundling JavaScript and TypeScript files.
 */
export class RolldownBundler implements Bundler {
    async bundle(rootFilePath: string, files: FileLookup, tsConfigPath?: string): Promise<string> {
        const build = await rolldown({
            input: rootFilePath,
            platform: "node",
            treeshake: false,
            plugins: [createVirtualFsPlugin(rootFilePath, files)],
            tsconfig: tsConfigPath,
        })

        try {
            const { output } = await build.generate({ format: "cjs" })
            return output[0].code
        } finally {
            await build.close()
        }
    }
}
