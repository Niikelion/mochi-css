import { build } from "esbuild"
import { mochiCss } from "@mochi-css/esbuild"

await build({
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    bundle: true,
    plugins: [mochiCss({ externalCss: true })],
})
