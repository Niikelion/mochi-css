import {defineConfig} from "tsdown";
// @ts-expect-error - fs-extra CJS/ESM interop
import fsExtra from "fs-extra";

const pkg = fsExtra.readJsonSync("./package.json");

export default defineConfig({
    entry: "src/index.ts",
    format: ["cjs"],
    dts: false,
    clean: true,
    skipNodeModulesBundle: true,
    banner: {
        js: "#!/usr/bin/env node"
    },
    define: {
        __VERSION__: JSON.stringify(pkg.version)
    }
})
