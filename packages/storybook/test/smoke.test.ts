import { execSync } from "node:child_process";
import {
    cpSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const localPackage = (name: string): string =>
    `file:${resolve(packageRoot, "..", name).replaceAll("\\", "/")}`;
// Test this checkout's builds, including release versions not yet published to npm.
const localPackages = Object.fromEntries(
    [
        "storybook",
        "vite",
        "vanilla",
        "plugins",
        "config",
        "builder",
        "core",
    ].map((name) => [`@mochi-css/${name}`, localPackage(name)]),
);
const require = createRequire(import.meta.url);
// Keep the compiler aligned with the repository lockfile while varying Storybook.
const swcVersion = (
    JSON.parse(
        readFileSync(require.resolve("@swc/core/package.json"), "utf8"),
    ) as { version: string }
).version;
const { packageManager } = JSON.parse(
    readFileSync(resolve(packageRoot, "../../package.json"), "utf8"),
) as { packageManager: string };

it.each(["8", "9", "10.0.0", "10"])(
    "builds extracted component and global CSS with Storybook %s",
    (version) => {
        const fixture = mkdtempSync(join(tmpdir(), "mochi-storybook-"));
        try {
            cpSync(join(here, "fixture"), fixture, { recursive: true });
            writeFileSync(
                join(fixture, "package.json"),
                JSON.stringify({
                    name: "mochi-storybook-smoke",
                    private: true,
                    type: "module",
                    packageManager,
                    resolutions: { ...localPackages, "@swc/core": swcVersion },
                    dependencies: {
                        ...localPackages,
                        "@storybook/react-vite": version,
                        storybook: version,
                        react: "^19",
                        "react-dom": "^19",
                        vite: "^6.0.0",
                        typescript: "^5.9.3",
                    },
                }),
            );
            writeFileSync(
                join(fixture, ".yarnrc.yml"),
                "nodeLinker: node-modules\nenableImmutableInstalls: false\n",
            );
            writeFileSync(join(fixture, "yarn.lock"), "");
            const options = {
                cwd: fixture,
                encoding: "utf8" as const,
                timeout: 180_000,
                env: {
                    ...process.env,
                    CI: "true",
                    STORYBOOK_DISABLE_TELEMETRY: "1",
                },
            };
            execSync("yarn install", options);
            execSync("yarn exec storybook build --disable-telemetry", options);
            const output = join(fixture, "storybook-static");
            expect(readFileSync(join(output, "index.json"), "utf8")).toContain(
                "mochi-styles--styled",
            );
            const css = readdirSync(output, { recursive: true })
                .filter(
                    (file): file is string =>
                        typeof file === "string" && file.endsWith(".css"),
                )
                .map((file) => readFileSync(join(output, file), "utf8"))
                .join("\n");
            expect(css).toContain("137px");
            expect(css).toMatch(/body\s*\{[^}]*letter-spacing:\s*3px/);
        } finally {
            if (dirname(resolve(fixture)) !== resolve(tmpdir()))
                throw new Error("Unexpected fixture directory");
            try {
                rmSync(fixture, {
                    recursive: true,
                    force: true,
                    maxRetries: 3,
                });
            } catch (error) {
                // Native compiler handles can outlive the build briefly on Windows.
                if (
                    !(error instanceof Error) ||
                    !("code" in error) ||
                    !["EPERM", "EBUSY"].includes(String(error.code))
                )
                    throw error;
                console.warn(
                    `Temporary Storybook fixture still in use: ${fixture}`,
                );
            }
        }
    },
    240_000,
);
