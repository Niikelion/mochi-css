import { execa } from "execa"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

interface ImplConfig {
    name: string
    extraSteps?: { cmd: string; args: string[] }[]
}

const implementations: ImplConfig[] = [
    { name: "mochi-vanilla-react" },
    { name: "mochi-stitches" },
    { name: "stitches" },
    { name: "vanilla-extract" },
    {
        name: "panda",
        extraSteps: [
            { cmd: "yarn", args: ["panda", "codegen"] },
            { cmd: "yarn", args: ["panda", "cssgen"] },
        ],
    },
    { name: "css-modules" },
]

async function buildAll() {
    for (const impl of implementations) {
        const implDir = path.join(root, "implementations", impl.name)
        console.log(`\n▸ ${impl.name}`)
        for (const { cmd, args } of impl.extraSteps ?? []) {
            await execa(cmd, args, { cwd: implDir, stdio: "inherit" })
        }
        await execa("yarn", ["vite", "build"], { cwd: implDir, stdio: "inherit" })
    }
}

buildAll().catch((err) => {
    console.error(err)
    process.exit(1)
})
