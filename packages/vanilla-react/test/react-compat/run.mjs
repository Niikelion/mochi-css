import { execFileSync, execSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "../..")
const version = process.argv[2]
if (!version || !/^(18|19)(\.\d+\.\d+)?$/.test(version)) {
    throw new Error("Pass a React version: 18, 19, or an exact 18.x/19.x release")
}
const major = version.split(".")[0]
const types = major
const fixture = mkdtempSync(join(tmpdir(), "mochi-react-compat-"))
const { packageManager } = JSON.parse(readFileSync(resolve(root, "../../package.json"), "utf8"))
writeFileSync(
    join(fixture, "package.json"),
    JSON.stringify(
        {
            name: "mochi-react-compat",
            private: true,
            type: "module",
            packageManager,
            dependencies: {
                "@mochi-css/vanilla-react": `file:${root.replaceAll("\\", "/")}`,
                react: version,
                "react-dom": version,
                "@types/react": types,
                "@types/react-dom": types,
                "@types/scheduler": "0.16.8",
                "@types/node": "^24.8.1",
                "happy-dom": "^20.8.9",
                typescript: "^5.9.3",
            },
        },
        null,
        2,
    ),
)
// This disposable consumer resolves a different React version on every run, so it must
// create its own lockfile even in CI. The repository install remains immutable.
writeFileSync(join(fixture, ".yarnrc.yml"), "nodeLinker: node-modules\nenableImmutableInstalls: false\n")
writeFileSync(join(fixture, "yarn.lock"), "")
writeFileSync(
    join(fixture, "tsconfig.json"),
    JSON.stringify({
        compilerOptions: {
            strict: true,
            noEmit: true,
            jsx: "react-jsx",
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            types: ["react", "react-dom", "node"],
            skipLibCheck: false,
        },
        include: ["types.tsx"],
    }),
)
for (const file of ["runtime.mjs", "types.tsx"]) cpSync(join(here, file), join(fixture, file))
console.log(`Testing built vanilla-react with React ${version} in ${fixture}`)
// Commands are fixed strings; all version and path inputs are written to the manifest.
execSync("yarn install --mode=skip-build", { cwd: fixture, stdio: "inherit" })
execSync("yarn exec tsc --noEmit", { cwd: fixture, stdio: "inherit" })
execFileSync(process.execPath, ["runtime.mjs"], { cwd: fixture, stdio: "inherit" })
// Only remove the generated fixture, never the source checkout or an ancestor directory.
if (dirname(resolve(fixture)) !== resolve(tmpdir())) throw new Error("Unexpected fixture directory")
rmSync(fixture, { recursive: true, force: true, maxRetries: 3 })
