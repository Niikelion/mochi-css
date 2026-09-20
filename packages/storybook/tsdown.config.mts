import { defineConfig } from "tsdown"

export default defineConfig([
    {
        entry: ["src/index.ts", "src/preview.ts"],
        format: ["esm", "cjs"],
        dts: true,
        sourcemap: true,
        clean: true,
        skipNodeModulesBundle: true,
        external: (id: string) => id.startsWith("@mochi-css/") || id.startsWith("virtual:"),
    },
    { attw: true },
])
