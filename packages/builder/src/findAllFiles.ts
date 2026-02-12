import fs from "fs/promises"
import { Dirent } from "fs"
import path from "path"
import { MochiError } from "@/diagnostics"

/**
 * Recursively finds all TypeScript/TSX files in a directory.
 */
export async function findAllFiles(dir: string): Promise<string[]> {
    let entries: Dirent[] = []
    try {
        entries = await fs.readdir(dir, { withFileTypes: true })
    } catch (err) {
        throw new MochiError('MOCHI_FILE_READ', `Cannot read directory`, dir, err)
    }
    const results = await Promise.all(entries.map(async entry => {
        const res = path.resolve(dir, entry.name)
        if (entry.isDirectory()) {
            return await findAllFiles(res)
        }
        if (/\.(ts|tsx)$/.test(entry.name)) {
            return [res]
        }
        return []
    }))
    return results.flat()
}