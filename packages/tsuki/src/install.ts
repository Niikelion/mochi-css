import { createInterface } from "node:readline"
import { PassThrough } from "node:stream"
import type { ChildProcess, SpawnOptions } from "node:child_process"
import { detect, resolveCommand } from "package-manager-detector"
import spawn from "cross-spawn"
import * as p from "@clack/prompts"
import type { PackageRequest } from "./types"

type OverloadedParameters<T extends (...args: never[]) => unknown> = T extends {
    (...args: infer A): unknown
    (...args: infer B): unknown
    (...args: infer C): unknown
    (...args: infer D): unknown
    (...args: infer E): unknown
    (...args: infer F): unknown
}
    ? A | B | C | D | E | F
    : never

type SubscribeFunction = (event: string, listener: (...args: never[]) => unknown) => unknown
type EventName<T extends SubscribeFunction> = OverloadedParameters<T>[0]
type EventArgs<T extends SubscribeFunction, N extends EventName<SubscribeFunction>> = Parameters<
    (OverloadedParameters<T> & [N, unknown])[1]
>

function onceEvent<E extends { once(event: string, listener: unknown): unknown }, N extends EventName<E["once"]>>(
    emitter: E,
    event: N,
) {
    return new Promise<EventArgs<E["once"], N>>((resolve) => {
        emitter.once(event, (...args: unknown[]) => {
            resolve(args as EventArgs<E["once"], N>)
        })
    })
}

function spawnProcess(command: string, args: string[], options: SpawnOptions): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, options)

        const onSpawn = () => {
            child.off("error", onError)
            resolve(child)
        }
        const onError = (err: Error) => {
            child.off("spawn", onSpawn)
            reject(err)
        }

        child.once("spawn", onSpawn)
        child.once("error", onError)
    })
}

async function runInstall(title: string, command: string, args: string[], packages: string[]): Promise<void> {
    const log = p.taskLog({ title })

    log.message(`${command} ${args.join(" ")}`)

    try {
        const child = await spawnProcess(command, args, { stdio: ["inherit", "pipe", "pipe"] })

        const merged = new PassThrough()
        let openStreams = 0
        for (const stream of [child.stdout, child.stderr]) {
            if (!stream) continue
            openStreams++
            stream.pipe(merged, { end: false })
            stream.on("end", () => {
                if (--openStreams === 0) merged.end()
            })
        }

        const rl = createInterface({ input: merged, crlfDelay: Infinity })

        const drain = (async () => {
            for await (const line of rl) {
                log.message(line)
            }
        })()

        const [code] = await onceEvent(child, "close")
        await drain

        if (code !== 0) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Failed to install packages: ${packages.join(", ")}`)
        }

        log.success(`${packages.join(", ")} has been installed!`)
    } catch (err) {
        log.error(err instanceof Error ? err.message : String(err))
        throw err
    }
}

export async function installPackages(packages: PackageRequest[], autoInstall = false): Promise<void> {
    if (packages.length === 0) return

    // Detect package manager
    const packageManager = await detect({
        strategies: ["packageManager-field", "devEngines-field", "lockfile", "install-metadata"],
    })

    if (packageManager === null) {
        throw new Error("Could not determine package manager of the project")
    }

    const agent = packageManager.agent
    const devFlag = agent === "deno" ? "--dev" : "-D"

    // Group packages by dev/prod; a package asked for both ways is a regular dependency
    const prodPackages = [...new Set(packages.filter((pkg) => pkg.dev === false).map((pkg) => pkg.name))]
    const devPackages = [
        ...new Set(
            packages.filter((pkg) => pkg.dev !== false && !prodPackages.includes(pkg.name)).map((pkg) => pkg.name),
        ),
    ]

    const packageList = [...devPackages.map((name) => `${name} (dev)`), ...prodPackages.map((name) => name)].join(", ")

    if (!autoInstall) {
        const confirmed = await p.confirm({
            message: `Install the following packages: ${packageList}?`,
        })

        if (p.isCancel(confirmed) || !confirmed) {
            p.log.info("Skipping package installation")
            return
        }
    }

    const groups = [
        { title: "dev dependencies", packages: devPackages, args: [devFlag, ...devPackages] },
        { title: "dependencies", packages: prodPackages, args: prodPackages },
    ].filter((group) => group.packages.length > 0)

    // Every group is attempted, so one failing install doesn't leave the others out.
    const failed: string[] = []
    for (const group of groups) {
        const cmd = resolveCommand(agent, "add", group.args)
        if (cmd === null) throw new Error("Could not prepare install command")

        try {
            await runInstall(
                `Installing ${group.title}: ${group.packages.join(", ")}`,
                cmd.command,
                cmd.args,
                group.packages,
            )
        } catch {
            failed.push(`${cmd.command} ${cmd.args.join(" ")}`)
        }
    }

    if (failed.length > 0) {
        throw new Error(`Some packages could not be installed. Install them with:\n${failed.join("\n")}`)
    }
}
