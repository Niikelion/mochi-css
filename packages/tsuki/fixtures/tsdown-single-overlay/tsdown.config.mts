import { defineConfig } from "tsdown"
import { mochiCss } from "@mochi-css/rolldown"

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    plugins: [mochiCss({ externalCss: true })],
})
