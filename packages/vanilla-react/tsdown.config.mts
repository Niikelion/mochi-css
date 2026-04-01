import { definePackageConfig } from "@gamedev-sensei/tsdown-config"

export default definePackageConfig({
    attw: true,
    format: ["esm", "cjs"],
    entry: ["src/index.ts", "src/config.ts", "!src/**/__tests__/**", "!src/**/*.test.*", "!src/**/*.spec.*"],
})
