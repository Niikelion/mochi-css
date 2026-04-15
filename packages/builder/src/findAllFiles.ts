import fs from "fs/promises"
import { Dirent } from "fs"
import { path } from "@/utils"
import { MochiError } from "@mochi-css/core"

/**
 * Recursively finds all TypeScript/TSX files in a directory.
 * Accepts and returns posix paths.
 */
export async function findAllFiles(dir: string): Promise<string[]> {
    let entries: Dirent[] = []
    try {
        entries = await fs.readdir(path.toSystemPath(dir), { withFileTypes: true })
    } catch (err) {
        throw new MochiError("MOCHI_FILE_READ", `Cannot read directory`, dir, err)
    }
    const results = await Promise.all(
        entries.map(async (entry) => {
            const res = path.resolve(dir, entry.name)
            if (entry.isDirectory()) {
                return await findAllFiles(res)
            }
            if (/\.(ts|tsx)$/.test(entry.name)) {
                return [res]
            }
            return []
        }),
    )
    return results.flat()
}
