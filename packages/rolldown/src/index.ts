import type {
    Plugin,
    NormalizedInputOptions,
    NormalizedOutputOptions,
} from "rolldown";
import type { Config } from "@mochi-css/config";
import {
    loadConfig,
    resolveConfig,
    FullContext,
    createBuilder,
} from "@mochi-css/config";
import { fileHash, path } from "@mochi-css/builder";
import { diagnosticToString, type OnDiagnostic } from "@mochi-css/core";
import fs from "node:fs/promises";
import nodePath from "node:path";

const ASSET_PREFIX = "mochi-css-asset:";
const RESOLVED_PREFIX = "\0mochi-css-asset:";

/**
 * Inline options for the Mochi CSS Rolldown plugin.
 *
 * Most options are loaded automatically from `mochi.config.ts`.
 * Inline options passed here are merged on top of the file config.
 *
 * @example
 * ```ts
 * // tsdown.config.mts
 * import { defineConfig } from "tsdown"
 * import { mochiCss } from "@mochi-css/rolldown"
 *
 * export default defineConfig({
 *     entry: ["src/index.ts"],
 *     plugins: [mochiCss()],
 * })
 * ```
 *
 * For library distribution where Vite/Next.js consumers should auto-import CSS:
 * ```ts
 * plugins: [mochiCss({ externalCss: true })]
 * ```
 */
export type MochiRolldownOptions = Partial<
    Pick<Config, "plugins"> & {
        /**
         * Entry files where the global CSS import is injected.
         * Defaults to the entry points from the build config.
         */
        entries?: string[];
        /**
         * When `true`, CSS imports are marked external so they survive in the
         * output JS. CSS files are written to `outdir` in `writeBundle`.
         * Downstream bundlers (Vite, Next.js) then resolve and process them.
         *
         * Use this when distributing a component library.
         * Default: `false` (CSS injected via `<style>` tag at runtime).
         */
        externalCss?: boolean;
    }
>;

function normalizeInput(input: string[] | Record<string, string>): Set<string> {
    if (Array.isArray(input)) {
        return new Set(
            input.map((e) => path.fromSystemPath(nodePath.resolve(e))),
        );
    }
    return new Set(
        Object.values(input).map((e) =>
            path.fromSystemPath(nodePath.resolve(e)),
        ),
    );
}

/**
 * Rolldown plugin that statically extracts Mochi CSS styles from TypeScript/TSX source
 * files. Supports both runtime style injection (app builds) and external CSS files
 * (library distribution).
 */
export function mochiCss(opts?: MochiRolldownOptions): Plugin {
    let manifest:
        | {
              global?: string;
              files?: Record<string, string>;
              sourcemods?: Record<string, string>;
          }
        | undefined;
    let context: FullContext | undefined;
    let builder: ReturnType<typeof createBuilder> | undefined;
    let collectPromise:
        | Promise<{
              global?: string;
              files?: Record<string, string>;
              sourcemods?: Record<string, string>;
          }>
        | undefined;
    const cssMap = new Map<string, string>();
    let entries = new Set<string>();

    const externalCss = opts?.externalCss ?? false;

    return {
        name: "mochi-css",

        async buildStart(inputOptions: NormalizedInputOptions) {
            cssMap.clear();

            // Capture entries for global CSS injection
            if (opts?.entries) {
                entries = new Set(
                    opts.entries.map((e) =>
                        path.fromSystemPath(nodePath.resolve(e)),
                    ),
                );
            } else {
                entries = normalizeInput(inputOptions.input);
            }

            // Load config and create builder lazily
            if (!builder) {
                const cwd = process.cwd();
                const fileConfig = await loadConfig(cwd);
                const resolved = await resolveConfig(fileConfig, opts);

                const defaultDiagnostic: OnDiagnostic = (event) => {
                    const content = diagnosticToString(event);
                    if (
                        event.severity === "debug" &&
                        !(resolved as { debug?: boolean }).debug
                    )
                        return;
                    console.log(content);
                };

                const ctx = new FullContext(
                    resolved.onDiagnostic ?? defaultDiagnostic,
                );
                context = ctx;
                for (const plugin of resolved.plugins) {
                    plugin.onLoad?.(ctx);
                }
                builder = createBuilder(resolved, ctx);
            }

            // Share a single collectMochiCss call across concurrent format builds
            // (ESM + CJS in tsdown both trigger buildStart on the same plugin instance)
            collectPromise ??= builder.collectMochiCss();

            let result: {
                global?: string;
                files?: Record<string, string>;
                sourcemods?: Record<string, string>;
            };
            try {
                result = await collectPromise;
            } catch (e) {
                console.error("[mochi-css]", e);
                result = {};
            } finally {
                collectPromise = undefined;
            }

            manifest = result;
            if (result.global) cssMap.set("global", result.global);
            for (const [srcPath, css] of Object.entries(result.files ?? {})) {
                cssMap.set(fileHash(srcPath), css);
            }
        },

        resolveId(id) {
            if (externalCss) {
                // In external mode the transform hook injects "./hash.css" and "./global.css"
                // directly. Mark them external so Rolldown does not try to bundle them.
                if (id === "./global.css" || /^\.\/[0-9a-f]+\.css$/.test(id)) {
                    return { id, external: true };
                }
                return null;
            }

            // Virtual mode: map mochi-css-asset: to an internal virtual module id.
            if (!id.startsWith(ASSET_PREFIX)) return null;
            const assetId = id.slice(ASSET_PREFIX.length);
            return { id: `${RESOLVED_PREFIX}${assetId}` };
        },

        load(id) {
            // In external mode no virtual modules are created — resolveId never emits
            // \0mochi-css-asset: ids so this hook is never reached for CSS assets.
            if (externalCss) return null;
            if (!id.startsWith(RESOLVED_PREFIX)) return null;
            const assetId = id.slice(RESOLVED_PREFIX.length);
            const css = cssMap.get(assetId) ?? "";

            // Inject CSS via a style element for virtual mode
            return {
                code: [
                    `const __mochi_css__ = ${JSON.stringify(css)};`,
                    `if (typeof document !== "undefined") {`,
                    `    const s = document.createElement("style");`,
                    `    s.textContent = __mochi_css__;`,
                    `    document.head.appendChild(s);`,
                    `}`,
                ].join("\n"),
            };
        },

        async transform(code, id) {
            if (!/\.(ts|tsx|js|jsx)$/.test(id)) return null;
            if (!manifest || !context) return null;

            const filePath = path.fromSystemPath(id);
            const transformed =
                manifest.sourcemods?.[filePath] ??
                (await context.filePreProcess.transform(code, { filePath }));

            const imports: string[] = [];
            if (entries.has(filePath) && manifest.global) {
                // External mode: inject the final CSS path directly so Rolldown preserves
                // the specifier in chunk output without needing to rewrite it.
                imports.push(
                    externalCss
                        ? `import "./global.css"`
                        : `import "${ASSET_PREFIX}global"`,
                );
            }
            if (manifest.files?.[filePath]) {
                const hash = fileHash(filePath);
                imports.push(
                    externalCss
                        ? `import "./${hash}.css"`
                        : `import "${ASSET_PREFIX}${hash}"`,
                );
            }

            if (imports.length === 0 && transformed === code) return null;

            return { code: imports.join("\n") + "\n" + transformed };
        },

        async writeBundle(outputOptions: NormalizedOutputOptions) {
            if (!externalCss || !manifest) return;
            const outdir = outputOptions.dir ?? "dist";
            await fs.mkdir(outdir, { recursive: true });
            for (const [srcPath, css] of Object.entries(manifest.files ?? {})) {
                const hash = fileHash(srcPath);
                await fs.writeFile(
                    nodePath.join(outdir, `${hash}.css`),
                    css,
                    "utf8",
                );
            }
            if (manifest.global) {
                await fs.writeFile(
                    nodePath.join(outdir, "global.css"),
                    manifest.global,
                    "utf8",
                );
            }
        },
    };
}
