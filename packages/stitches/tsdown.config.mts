import { definePackageConfig } from "@gamedev-sensei/tsdown-config";

export default definePackageConfig({
    attw: true,
    format: ["esm", "cjs"],
    entry: ["src/index.ts", "src/config/index.ts", "!src/**/*.spec.*"],
    external: (id: string) => id.startsWith("@mochi-css/"),
});
