import { defineConfig as vanillaDefineConfig, VanillaCssExtractor } from "@mochi-css/vanilla/config"
import type { StyleExtractor } from "@mochi-css/plugins"
import { styledIdPlugin } from "@mochi-css/plugins"
import type { Config } from "@mochi-css/config"

export { styledIdPlugin } from "@mochi-css/plugins"

const mochiStyledFunctionExtractor = new VanillaCssExtractor("@mochi-css/vanilla-react", "styled", (call) =>
    call.arguments.map((a) => a.expression).slice(1),
)

export function defineConfig(config: Partial<Config> & { extractors?: StyleExtractor[] }): Partial<Config> {
    const { extractors = [], ...rest } = config
    return vanillaDefineConfig({
        ...rest,
        extractors: [mochiStyledFunctionExtractor, ...extractors],
        plugins: [styledIdPlugin([mochiStyledFunctionExtractor]), ...(rest.plugins ?? [])],
    })
}
