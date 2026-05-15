import { defineConfig } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const implDir = (name: string) => path.resolve(__dirname, "implementations", name)

const implementations = [
    { name: "mochi-vanilla-react", port: 4101 },
    { name: "mochi-stitches", port: 4102 },
    { name: "stitches", port: 4103 },
    { name: "vanilla-extract", port: 4104 },
    { name: "panda", port: 4105 },
    { name: "css-modules", port: 4106 },
]

export default defineConfig({
    testDir: "./tests",
    timeout: 30_000,
    use: { headless: true },
    webServer: implementations.map(({ name, port }) => ({
        command: `yarn vite preview --port ${port} --strictPort`,
        cwd: implDir(name),
        port,
        reuseExistingServer: !process.env.CI,
        timeout: 15_000,
    })),
})
