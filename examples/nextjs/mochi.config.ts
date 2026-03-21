import { defineConfig, styledIdPlugin } from "@mochi-css/config"

export default defineConfig({
    tmpDir: ".mochi",
    splitCss: true,
    plugins: [styledIdPlugin()],
})
