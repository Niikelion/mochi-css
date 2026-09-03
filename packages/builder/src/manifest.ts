import { createHash } from "crypto"

export type MochiManifest = {
    global?: string
    files: Record<string, string>
    sourcemods?: Record<string, string>
    /** Encoded sourcemaps for each `sourcemods` entry, mapping the emitted source back to the original file. */
    sourcemaps?: Record<string, string>
}

export function fileHash(filePath: string): string {
    return createHash("sha256").update(filePath.replaceAll("\\", "/")).digest("hex").slice(0, 12)
}
