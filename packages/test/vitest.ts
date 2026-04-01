import { defineConfig } from "vitest/config"

export const vitestConfig = defineConfig({
    test: {
        coverage: {
            provider: "v8"
        }
    },
    resolve: {
        tsconfigPaths: true
    }
})
