import { defineConfig } from "tsdown"
import path from "path"
// @ts-expect-error - fs-extra CJS/ESM interop
import fsExtra from "fs-extra"

const pkg = fsExtra.readJsonSync("./package.json")

/** Versions of every package in the workspace, so tsuki installs ranges that match this release. */
function workspaceVersions(): Record<string, string> {
    const packagesDir = path.resolve("..")
    const versions: Record<string, string> = {}
    for (const dir of fsExtra.readdirSync(packagesDir) as string[]) {
        const file = path.join(packagesDir, dir, "package.json")
        if (!fsExtra.existsSync(file)) continue
        const { name, version, private: isPrivate } = fsExtra.readJsonSync(file)
        if (!isPrivate && typeof name === "string" && name.startsWith("@mochi-css/")) versions[name] = version
    }
    return versions
}

export default defineConfig({
    entry: "src/index.ts",
    format: ["esm"],
    // Always emit dist/index.js, which package.json's `bin` points at; newer tsdown defaults to .mjs.
    fixedExtension: false,
    dts: false,
    clean: true,
    skipNodeModulesBundle: true,
    banner: {
        js: "#!/usr/bin/env node",
    },
    define: {
        __VERSION__: JSON.stringify(pkg.version),
        __PACKAGE_VERSIONS__: JSON.stringify(workspaceVersions()),
    },
})
