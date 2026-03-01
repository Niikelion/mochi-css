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

export async function installPackages(packages: PackageRequest[]): Promise<void> {
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

    // Group packages by dev/prod
    const devPackages = packages.filter((pkg) => pkg.dev !== false).map((pkg) => pkg.name)
    const prodPackages = packages.filter((pkg) => pkg.dev === false).map((pkg) => pkg.name)

    const packageList = [...devPackages.map((name) => `${name} (dev)`), ...prodPackages.map((name) => name)].join(", ")

    const confirmed = await p.confirm({
        message: `Install the following packages: ${packageList}?`,
    })

    if (p.isCancel(confirmed) || !confirmed) {
        p.log.info("Skipping package installation")
        return
    }

    // Install dev dependencies
    if (devPackages.length > 0) {
        const cmd = resolveCommand(agent, "add", [devFlag, ...devPackages])
        if (cmd === null) throw new Error("Could not prepare install command")

        await runInstall(`Installing dev dependencies: ${devPackages.join(", ")}`, cmd.command, cmd.args, devPackages)
    }

    // Install prod dependencies
    if (prodPackages.length > 0) {
        const cmd = resolveCommand(agent, "add", prodPackages)
        if (cmd === null) throw new Error("Could not prepare install command")

        await runInstall(`Installing dependencies: ${prodPackages.join(", ")}`, cmd.command, cmd.args, prodPackages)
    }
}
