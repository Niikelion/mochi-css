import { mergeConfig } from "vitest/config"
import { vitestConfig } from "@mochi-css/test/vitest"
import path from "path"

export default mergeConfig(vitestConfig, {
    resolve: {
        alias: {
            "@mochi-css/vanilla/config": path.resolve(__dirname, "../vanilla/dist/config/index.mjs"),
            "@mochi-css/vanilla": path.resolve(__dirname, "../vanilla/dist/index.mjs"),
        },
    },
    test: {
        coverage: {
            provider: "v8",
            exclude: ["test/utils.ts"],
        },
    },
})
