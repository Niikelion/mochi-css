import { defineConfig } from "@mochi-css/config"
import { styledIdPlugin } from "@mochi-css/builder"

export default defineConfig({
    outDir: ".mochi",
    plugins: [styledIdPlugin()],
})
