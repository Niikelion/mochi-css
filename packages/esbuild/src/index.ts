import type { Plugin, BuildOptions } from "esbuild";
import fs from "fs/promises";
import { fileHash, path } from "@mochi-css/builder";
import {
    loadConfig,
    resolveConfig,
    FullContext,
    createBuilder,
    type Config,
} from "@mochi-css/config";
import { diagnosticToString, type OnDiagnostic } from "@mochi-css/core";

const ASSET_PREFIX = "mochi-css-asset:";
const MOCHI_CSS_NAMESPACE = "mochi-css";

/**
 * Inline options for the Mochi CSS esbuild plugin.
 *
 * Most options are loaded automatically from `mochi.config.ts`.
 * Inline options passed here are merged on top of the file config.
 *
 * @example
 * ```ts
 * // build.mjs
 * import { build } from "esbuild"
 * import { mochiCss } from "@mochi-css/esbuild"
 *
 * await build({
 *     entryPoints: ["src/index.ts"],
 *     outdir: "dist",
 *     bundle: true,
 *     plugins: [mochiCss()],
 * })
 * ```
 *
 * For library distribution where Vite/Next.js consumers should auto-import CSS:
 * ```ts
 * plugins: [mochiCss({ externalCss: true })]
 * ```
 */
export type MochiEsbuildOptions = Partial<
    Pick<Config, "plugins"> & {
        /**
         * Entry files where the global CSS import is injected.
         * Defaults to `build.initialOptions.entryPoints` (normalized).
         */
        entries?: string[];
        /**
         * When `true`, CSS imports are marked external so they survive in the
         * output JS. Downstream bundlers (Vite, Next.js) then resolve and process
         * them automatically. CSS files are written to `outdir` in `onEnd`.
         *
         * Use this when distributing a component library.
         * Default: `false` (virtual CSS modules bundled by esbuild).
         */
        externalCss?: boolean;
    }
>;

function normalizeEntryPoints(ep: BuildOptions["entryPoints"]): Set<string> {
    if (!ep) return new Set();
    if (Array.isArray(ep)) {
        return new Set(
            ep.map((e) =>
                path.fromSystemPath(
                    path.resolve(typeof e === "string" ? e : e.in),
                ),
            ),
        );
    }
    return new Set(
        Object.values(ep).map((e) => path.fromSystemPath(path.resolve(e))),
    );
}

function sourceToOutputPath(
    srcPath: string,
    outdir: string,
    outbase: string,
): string {
    const rel = path.relative(outbase, srcPath);
    return path.join(outdir, rel).replace(/\.(ts|tsx)$/, ".js");
}

/**
 * Esbuild plugin that statically extracts Mochi CSS styles from TypeScript/TSX source
 * files. Supports both virtual CSS modules (app builds) and external CSS files
 * (library distribution).
 */
export function mochiCss(opts?: MochiEsbuildOptions): Plugin {
    let resolved: Config | undefined;
    let context: FullContext | undefined;
    let builder: ReturnType<typeof createBuilder> | undefined;
    let manifest:
        | {
              global?: string;
              files?: Record<string, string>;
              sourcemods?: Record<string, string>;
          }
        | undefined;
    const cssMap = new Map<string, string>();

    return {
        name: "mochi-css",
        setup(build) {
            const externalCss = opts?.externalCss ?? false;
            const outdir = path.fromSystemPath(
                build.initialOptions.outdir ?? "dist",
            );
            const outbase = path.fromSystemPath(
                build.initialOptions.outbase ??
                    path.resolve(path.fromSystemPath(process.cwd())),
            );

            const entries: Set<string> = opts?.entries
                ? new Set(
                      opts.entries.map((e) =>
                          path.fromSystemPath(path.resolve(e)),
                      ),
                  )
                : normalizeEntryPoints(build.initialOptions.entryPoints);

            build.onStart(async () => {
                cssMap.clear();

                if (!builder) {
                    const cwd = path.toSystemPath(
                        path.fromSystemPath(process.cwd()),
                    );
                    const fileConfig = await loadConfig(cwd);
                    resolved = await resolveConfig(fileConfig, opts);

                    const defaultDiagnostic: OnDiagnostic = (event) => {
                        const content = diagnosticToString(event);
                        if (event.severity === "debug" && !resolved?.debug)
                            return;

                        console.log(content);
                    };

                    const onDiagnostic =
                        resolved.onDiagnostic ?? defaultDiagnostic;
                    const ctx = new FullContext(onDiagnostic);
                    context = ctx;
                    for (const plugin of resolved.plugins) {
                        plugin.onLoad?.(ctx);
                    }
                    builder = createBuilder(resolved, ctx);
                }

                const result = await builder.collectMochiCss();
                manifest = result;

                if (result.global) cssMap.set("global", result.global);
                for (const [srcPath, css] of Object.entries(
                    result.files ?? {},
                )) {
                    cssMap.set(fileHash(srcPath), css);
                }
            });

            build.onResolve({ filter: /^mochi-css-asset:/ }, (args) => {
                const id = args.path.slice(ASSET_PREFIX.length);

                if (externalCss) {
                    const srcPath = path.fromSystemPath(args.importer);
                    const outPath = sourceToOutputPath(
                        srcPath,
                        outdir,
                        outbase,
                    );
                    const cssFile =
                        id === "global" ? "global.css" : `${id}.css`;
                    const cssAbsPath = path.join(outdir, cssFile);
                    const rel = path.relative(
                        path.dirname(outPath),
                        cssAbsPath,
                    );
                    const relPath = rel.startsWith(".") ? rel : "./" + rel;
                    return { path: relPath, external: true };
                }

                return { path: id, namespace: MOCHI_CSS_NAMESPACE };
            });

            build.onLoad(
                { filter: /.*/, namespace: MOCHI_CSS_NAMESPACE },
                (args) => ({
                    contents: cssMap.get(args.path) ?? "",
                    loader: "css",
                }),
            );

            build.onLoad({ filter: /\.(ts|tsx|js|jsx)$/ }, async (args) => {
                if (!manifest || !context) return null;

                const filePath = path.fromSystemPath(args.path);
                const source = await fs.readFile(args.path, "utf8");
                const transformed =
                    manifest.sourcemods?.[filePath] ??
                    (await context.filePreProcess.transform(source, {
                        filePath,
                    }));

                const imports: string[] = [];
                if (entries.has(filePath) && manifest.global) {
                    imports.push(`import "${ASSET_PREFIX}global";`);
                }
                if (manifest.files?.[filePath]) {
                    imports.push(
                        `import "${ASSET_PREFIX}${fileHash(filePath)}";`,
                    );
                }

                if (imports.length === 0 && transformed === source) return null;

                const ext = path.extname(args.path).slice(1) as
                    | "ts"
                    | "tsx"
                    | "js"
                    | "jsx";
                return {
                    contents: imports.join("\n") + "\n" + transformed,
                    loader: ext,
                };
            });

            if (externalCss) {
                build.onEnd(async () => {
                    if (!manifest) return;
                    try {
                        await fs.mkdir(path.toSystemPath(outdir), {
                            recursive: true,
                        });
                        for (const [srcPath, css] of Object.entries(
                            manifest.files ?? {},
                        )) {
                            const hash = fileHash(srcPath);
                            await fs.writeFile(
                                path.toSystemPath(
                                    path.join(outdir, `${hash}.css`),
                                ),
                                css,
                                "utf8",
                            );
                        }
                        if (manifest.global) {
                            await fs.writeFile(
                                path.toSystemPath(
                                    path.join(outdir, "global.css"),
                                ),
                                manifest.global,
                                "utf8",
                            );
                        }
                    } catch {
                        // outdir creation or write failure — non-fatal
                    }
                });
            }
        },
    };
}
