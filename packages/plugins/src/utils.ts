export function getOrInsert<K, V>(target: Map<K, V>, key: K, compute: () => V): V {
    const value = target.get(key)
    if (value) return value
    const newValue = compute()
    target.set(key, newValue)
    return newValue
}

export function isLocalImport(source: string): boolean {
    return source.startsWith("./") || source.startsWith("../")
}

// Files a bundler handles but that hold no styles to extract.
const assetExtensions = new Set([
    "css",
    "scss",
    "sass",
    "less",
    "styl",
    "stylus",
    "pcss",
    "sss",
    "json",
    "json5",
    "yaml",
    "yml",
    "toml",
    "txt",
    "md",
    "mdx",
    "html",
    "xml",
    "csv",
    "graphql",
    "gql",
    "wasm",
    "svg",
    "png",
    "jpg",
    "jpeg",
    "gif",
    "webp",
    "avif",
    "ico",
    "bmp",
    "tif",
    "tiff",
    "apng",
    "woff",
    "woff2",
    "ttf",
    "otf",
    "eot",
    "mp4",
    "webm",
    "ogg",
    "mov",
    "mp3",
    "wav",
    "flac",
    "aac",
    "m4a",
])

/**
 * An import of a stylesheet, image, font, data file or other asset, or one with a bundler query
 * such as `?url` or `?raw`. These aren't modules the extractor can read, so failing to resolve
 * them isn't worth a warning.
 */
export function isAssetImport(source: string): boolean {
    if (/[?#]/.test(source)) return true
    const extension = /\.([a-z0-9]+)$/i.exec(source)?.[1]
    return extension !== undefined && assetExtensions.has(extension.toLowerCase())
}
