import { defineConfig, styledIdPlugin } from "@mochi-css/vanilla/config"

export default defineConfig({
    roots: ["src"],
    tmpDir: ".mochi",
    splitCss: true,
    plugins: [styledIdPlugin()],
})
