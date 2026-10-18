import { describe, it, expect, vi, afterEach } from "vitest"
import fs from "fs"
import path from "path"

afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
})

describe("mochiPackage", () => {
    it("uses a caret range on the package's own version", async () => {
        vi.stubGlobal("__PACKAGE_VERSIONS__", { "@mochi-css/vite": "6.1.3", "@mochi-css/vanilla": "11.0.2" })
        const { mochiPackage } = await import("./version")
        expect(mochiPackage("@mochi-css/vite")).toBe("@mochi-css/vite@^6.1.3")
        expect(mochiPackage("@mochi-css/vanilla")).toBe("@mochi-css/vanilla@^11.0.2")
    })

    it("keeps 0.x packages within their minor version", async () => {
        vi.stubGlobal("__PACKAGE_VERSIONS__", { "@mochi-css/storybook": "0.3.0" })
        const { mochiPackage } = await import("./version")
        expect(mochiPackage("@mochi-css/storybook")).toBe("@mochi-css/storybook@^0.3.0")
    })

    it("installs the latest version of a package it has no version for", async () => {
        vi.stubGlobal("__PACKAGE_VERSIONS__", {})
        const { mochiPackage } = await import("./version")
        expect(mochiPackage("@mochi-css/vite")).toBe("@mochi-css/vite")
    })

    it("works when no versions were injected", async () => {
        const { mochiPackage } = await import("./version")
        expect(mochiPackage("@mochi-css/vite")).toBe("@mochi-css/vite")
    })
})

describe("installed packages", () => {
    it("are all published from this workspace, so the build knows their versions", () => {
        const packagesDir = path.resolve(__dirname, "../..")
        const workspace = new Set(
            fs
                .readdirSync(packagesDir)
                .map((dir) => path.join(packagesDir, dir, "package.json"))
                .filter((file) => fs.existsSync(file))
                .map((file) => (JSON.parse(fs.readFileSync(file, "utf-8")) as { name: string }).name),
        )
        const modulesDir = path.join(__dirname, "modules")
        const required = fs
            .readdirSync(modulesDir)
            .filter((file) => file.endsWith(".ts") && !file.endsWith(".spec.ts"))
            .flatMap((file) => [
                ...fs.readFileSync(path.join(modulesDir, file), "utf-8").matchAll(/mochiPackage\("([^"]+)"\)/g),
            ])
            .map((match) => match[1] ?? "")

        expect(required.length).toBeGreaterThan(0)
        expect(required.filter((name) => !workspace.has(name))).toEqual([])
    })
})
