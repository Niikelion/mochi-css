import { describe, it, expect, vi, afterEach } from "vitest"
import { EventEmitter } from "node:events"
import { PassThrough } from "node:stream"

vi.mock("@clack/prompts", () => ({
    confirm: vi.fn(),
    isCancel: vi.fn().mockReturnValue(false),
    log: { info: vi.fn() },
    taskLog: () => ({ message: vi.fn(), success: vi.fn(), error: vi.fn() }),
}))

vi.mock("package-manager-detector", () => ({
    detect: vi.fn().mockResolvedValue({ agent: "npm" }),
    resolveCommand: (_agent: string, _command: string, args: string[]) => ({ command: "npm", args: ["i", ...args] }),
}))

/** Exit code per install command, keyed by whether it installs dev dependencies. */
const exitCodes = { dev: 0, prod: 0 }
const commands: string[][] = []

vi.mock("cross-spawn", () => ({
    default: (_command: string, args: string[]) => {
        commands.push(args)
        const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), stderr: new PassThrough() })
        setTimeout(() => {
            child.emit("spawn")
            child.stdout.end()
            child.stderr.end()
            setTimeout(() => child.emit("close", args.includes("-D") ? exitCodes.dev : exitCodes.prod), 5)
        }, 0)
        return child
    },
}))

import { installPackages } from "./install"

afterEach(() => {
    commands.length = 0
    exitCodes.dev = 0
    exitCodes.prod = 0
})

describe("installPackages", () => {
    it("installs a package asked for as both dev and regular dependency once, as a regular one", async () => {
        await installPackages(
            [
                { name: "@mochi-css/vanilla", dev: true },
                { name: "@mochi-css/vanilla-react", dev: true },
                { name: "@mochi-css/vanilla-react", dev: false },
            ],
            true,
        )
        expect(commands).toEqual([
            ["i", "-D", "@mochi-css/vanilla"],
            ["i", "@mochi-css/vanilla-react"],
        ])
    })

    it("still installs regular dependencies when dev dependencies fail, then reports what is missing", async () => {
        exitCodes.dev = 1
        const result = installPackages(
            [
                { name: "@mochi-css/vite", dev: true },
                { name: "@mochi-css/vanilla-react", dev: false },
            ],
            true,
        )
        await expect(result).rejects.toThrow("npm i -D @mochi-css/vite")
        expect(commands).toEqual([
            ["i", "-D", "@mochi-css/vite"],
            ["i", "@mochi-css/vanilla-react"],
        ])
    })
})
