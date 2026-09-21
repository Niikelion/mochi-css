import { mergeConfig } from "vitest/config"
import { vitestConfig } from "@mochi-css/test/vitest"

export default mergeConfig(vitestConfig, {
    test: {
        // The integration suites each bind a dev server and drive a browser; running those files
        // concurrently makes them contend for ports and CPU rather than testing anything.
        fileParallelism: false,
        hookTimeout: 60_000,
    },
})
