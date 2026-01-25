import path from "path";
import {rolldown, Plugin} from "rolldown";

export type FileLookup = { [K in string]?: string }

export interface Bundler {
    bundle(rootFilePath: string, files: FileLookup): Promise<string>
}

function normalizeFilePath(filePath: string): string {
    return path.normalize(filePath).replaceAll(path.win32.sep, path.posix.sep)
}

function createVirtualFsPlugin(rootFilePath: string, files: FileLookup): Plugin {
    const normalizedFiles = new Map<string, string>()

    for (const [filePath, source] of Object.entries(files)) {
        if (source !== undefined) {
            normalizedFiles.set(normalizeFilePath(filePath), source)
        }
    }

    return {
        name: "virtual-fs",
        resolveId(source, importer = rootFilePath) {
            const resolvedPath = normalizeFilePath(path.isAbsolute(source)
                ? source
                : path.resolve(path.dirname(importer), source)
            )

            if (!normalizedFiles.has(resolvedPath)) return null

            return resolvedPath
        },
        load(id) {
            const normalizedId = normalizeFilePath(id)
            const content = normalizedFiles.get(normalizedId)

            if (content !== undefined) {
                return content
            }

            return null
        }
    } satisfies Pick<Plugin, "name" | "resolveId" | "load">
}

export class RolldownBundler implements Bundler {
    async bundle(rootFilePath: string, files: FileLookup): Promise<string> {
        const build = await rolldown({
            input: rootFilePath,
            platform: "node",
            treeshake: false,
            plugins: [createVirtualFsPlugin(rootFilePath, files)]
        })

        const { output } = await build.generate({ format: "cjs" })

        return output[0].code
    }
}
