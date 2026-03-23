import { mergeConfig } from "vitest/config"
import { vitestConfig } from "@mochi-css/test/vitest"

export default mergeConfig(vitestConfig, {
    test: {
        coverage: {
            provider: "v8",
            exclude: ["test/utils.ts"],
        },
    },
})
