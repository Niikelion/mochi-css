import { createExtractorsPlugin } from "@mochi-css/plugins"
import type { StyleExtractor } from "@mochi-css/builder"
import type { Config } from "@mochi-css/config"
import { mochiCssFunctionExtractor } from "./VanillaCssExtractor"
import { mochiKeyframesFunctionExtractor } from "./VanillaKeyframesExtractor"
import { mochiGlobalCssFunctionExtractor } from "./VanillaGlobalCssExtractor"

export { styledIdPlugin } from "@mochi-css/config"
export * from "./VanillaCssExtractor"
export * from "./VanillaKeyframesExtractor"
export * from "./VanillaGlobalCssExtractor"
export * from "./VanillaCssGenerator"
export * from "./VanillaKeyframesGenerator"
export * from "./VanillaGlobalCssGenerator"

const defaultVanillaExtractors: StyleExtractor[] = [
    mochiCssFunctionExtractor,
    mochiKeyframesFunctionExtractor,
    mochiGlobalCssFunctionExtractor,
]

export function defineConfig(config: Partial<Config> & { extractors?: StyleExtractor[] }): Partial<Config> {
    const { extractors = [], ...rest } = config
    return {
        ...rest,
        plugins: [createExtractorsPlugin([...defaultVanillaExtractors, ...extractors]), ...(rest.plugins ?? [])],
    }
}
