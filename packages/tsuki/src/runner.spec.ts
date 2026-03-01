import { describe, it, expect, vi, afterEach } from "vitest"
import { ModuleRunner } from "./runner"

vi.mock("./install", () => ({
    installPackages: vi.fn().mockResolvedValue(undefined),
}))

import { installPackages } from "./install"

afterEach(() => {
    vi.clearAllMocks()
})

describe("ModuleRunner", () => {
    it("requirePackages queues multiple packages", async () => {
        const runner = new ModuleRunner()
        runner.register({
            id: "test",
            name: "Test",
            run(ctx) {
                ctx.requirePackages([
                    { name: "pkg-a", dev: true },
                    { name: "pkg-b", dev: false },
                    { name: "pkg-c" }, // no dev → defaults to true via ?? true
                ])
            },
        })
        await runner.run()
        expect(installPackages).toHaveBeenCalledWith([
            { name: "pkg-a", dev: true },
            { name: "pkg-b", dev: false },
            { name: "pkg-c", dev: true },
        ])
    })

    it("skips installPackages when no packages are queued", async () => {
        const runner = new ModuleRunner()
        runner.register({
            id: "noop",
            name: "Noop",
            run() {
                // does not call requirePackage or requirePackages
            },
        })
        await runner.run()
        expect(installPackages).not.toHaveBeenCalled()
    })
})
