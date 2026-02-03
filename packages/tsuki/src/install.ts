import { detect, resolveCommand } from "package-manager-detector"
import { spawn } from "node:child_process"
import * as p from "@clack/prompts"
import type { PackageRequest } from "./types"

async function runInstall(
    command: string,
    args: string[],
    packages: string[]
): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: "inherit",
            shell: true
        })

        child.on("close", (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`Failed to install packages: ${packages.join(", ")}`))
            }
        })

        child.on("error", reject)
    })
}

export async function installPackages(packages: PackageRequest[]): Promise<void> {
    if (packages.length === 0) return

    // Detect package manager
    const packageManager = await detect({
        strategies: ["packageManager-field", "devEngines-field", "lockfile", "install-metadata"]
    })

    if (packageManager === null) {
        throw new Error("Could not determine package manager of the project")
    }

    const agent = packageManager.agent
    const devFlag = agent === "deno" ? "--dev" : "-D"

    // Group packages by dev/prod
    const devPackages = packages.filter((pkg) => pkg.dev !== false).map((pkg) => pkg.name)
    const prodPackages = packages.filter((pkg) => pkg.dev === false).map((pkg) => pkg.name)

    // Build display list
    const allPackages = [
        ...devPackages.map((name) => ({ name, label: `${name} (dev)` })),
        ...prodPackages.map((name) => ({ name, label: name }))
    ]

    // Ask user for permission with multiselect
    const selected = await p.multiselect({
        message: "The following packages will be installed:",
        options: allPackages.map((pkg) => ({
            value: pkg.name,
            label: pkg.label
        })),
        initialValues: allPackages.map((pkg) => pkg.name),
        required: false
    })

    if (p.isCancel(selected) || selected.length === 0) {
        p.log.info("Skipping package installation")
        return
    }

    // Filter to only selected packages
    const selectedSet = new Set(selected)
    const selectedDev = devPackages.filter((name) => selectedSet.has(name))
    const selectedProd = prodPackages.filter((name) => selectedSet.has(name))

    // Install dev dependencies
    if (selectedDev.length > 0) {
        const cmd = resolveCommand(agent, "add", [devFlag, ...selectedDev])
        if (cmd === null) throw new Error("Could not prepare install command")

        p.log.step(`Installing dev dependencies: ${selectedDev.join(", ")}`)
        await runInstall(cmd.command, cmd.args, selectedDev)
    }

    // Install prod dependencies
    if (selectedProd.length > 0) {
        const cmd = resolveCommand(agent, "add", selectedProd)
        if (cmd === null) throw new Error("Could not prepare install command")

        p.log.step(`Installing dependencies: ${selectedProd.join(", ")}`)
        await runInstall(cmd.command, cmd.args, selectedProd)
    }

    p.log.success("Packages installed successfully")
}
