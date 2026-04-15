import { defineConfig as vanillaDefineConfig, VanillaCssExtractor } from "@mochi-css/vanilla/config"
import type { StyleExtractor } from "@mochi-css/plugins"
import { styledIdPlugin } from "@mochi-css/plugins"
import type { Config } from "@mochi-css/config"
import { css } from "@mochi-css/vanilla"

class ComponentMock {
    constructor(public readonly selector: string) {
        /* empty */
    }

    toString() {
        return this.selector
    }
}

const mochiStyledFunctionExtractor = new VanillaCssExtractor(
    "@mochi-css/vanilla-react",
    "styled",
    (call) => call.arguments.map((a) => a.expression).slice(1),
    (...args: unknown[]) => {
        const res = (css as (...args: unknown[]) => { get selector(): string })(...args)
        return new ComponentMock(res.selector)
    },
)

export function defineConfig(config: Partial<Config> & { extractors?: StyleExtractor[] }): Partial<Config> {
    const { extractors = [], ...rest } = config
    return vanillaDefineConfig({
        ...rest,
        extractors: [mochiStyledFunctionExtractor, ...extractors],
        plugins: [styledIdPlugin([mochiStyledFunctionExtractor]), ...(rest.plugins ?? [])],
    })
}
