import { defineConfig } from "tsdown"
import { mochiCss } from "@mochi-css/rolldown"

export default defineConfig([
    {
        entry: ["src/index.ts", "src/react.tsx", "!src/**/*.spec.ts", "!src/**/*.spec.tsx"],
        format: ["esm", "cjs"],
        dts: true,
        sourcemap: true,
        clean: true,
        skipNodeModulesBundle: true,
        external: (id: string) => id.startsWith("@mochi-css/"),
        plugins: [mochiCss({ externalCss: true })],
    },
    { attw: true },
])
