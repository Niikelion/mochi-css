import { createHash } from "crypto"

export type MochiManifest = {
    global?: string
    files: Record<string, string>
}

export function fileHash(filePath: string): string {
    return createHash("sha256").update(filePath).digest("hex").slice(0, 12)
}
