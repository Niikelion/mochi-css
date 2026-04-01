import { defineConfig } from "tsdown";

export default defineConfig([
    {
        entry: ["src/index.ts"],
        format: ["esm", "cjs"],
        dts: true,
        sourcemap: true,
        clean: true,
        skipNodeModulesBundle: true,
        external: (id: string) => id.startsWith("@mochi-css/"),
    },
    { attw: true },
]);
