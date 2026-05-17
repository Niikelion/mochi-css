import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";

const { mockTransform, mockLoadConfig, mockCollectMochiCss } = vi.hoisted(
    () => ({
        mockTransform: vi.fn(
            async (source: string, _opts: { filePath: string }) => source,
        ),
        mockLoadConfig: vi.fn(async () => ({})),
        mockCollectMochiCss: vi.fn(
            async (): Promise<{
                files?: Record<string, string>;
                global?: string;
                sourcemods?: Record<string, string>;
            }> => ({ files: {}, global: undefined }),
        ),
    }),
);

vi.mock("@mochi-css/config", () => ({
    loadConfig: mockLoadConfig,
    resolveConfig: vi.fn(async (_file: unknown, _opts: unknown) => ({
        plugins: [],
        roots: ["src"],
        splitCss: false,
        onDiagnostic: undefined,
    })),
    FullContext: class {
        filePreProcess = {
            transform: (source: string, opts: { filePath: string }) =>
                mockTransform(source, opts),
        };
        stages = { getAll: () => [] };
        sourceTransforms = { getAll: () => [] };
        postEvalTransforms = { getAll: () => [] };
        emitHooks = { getAll: () => [] };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        cleanup = { runAll: () => {} };
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onDiagnostic = () => {};
        initializeStages = { merged: () => undefined };
        prepareAnalysis = { merged: () => undefined };
        getFileData = { merged: () => undefined };
        invalidateFiles = { merged: () => undefined };
        resetCrossFileState = { merged: () => undefined };
        getFilesToBundle = { merged: () => undefined };
    },
    createBuilder: vi.fn(() => ({
        collectMochiCss: mockCollectMochiCss,
    })),
}));

vi.mock("@mochi-css/builder", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        fileHash: (id: string) =>
            id
                .split("/")
                .pop()
                ?.replace(/\.[^.]+$/, "") ?? id,
    };
});

vi.mock("fs/promises", () => ({
    default: {
        readFile: vi.fn(async () => "const x = 1"),
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        writeFile: vi.fn(async () => {}),
        mkdir: vi.fn(async () => undefined),
    },
}));

import { mochiCss } from "./index.js";
import fsMock from "fs/promises";

type LoadResult = { contents: string; loader: string } | null | undefined;
type ResolveResult =
    | { path: string; namespace?: string; external?: boolean }
    | null
    | undefined;
type OnStartHandler = () => Promise<void>;
type OnResolveHandler = (args: {
    path: string;
    importer: string;
}) => ResolveResult;
type OnLoadHandler = (args: {
    path: string;
    namespace?: string;
}) => Promise<LoadResult> | LoadResult;
type OnEndHandler = () => Promise<void>;

interface MockBuild {
    initialOptions: {
        entryPoints?: string[];
        outdir?: string;
        outbase?: string;
    };
    onStartHandlers: OnStartHandler[];
    onResolveHandlers: { filter: RegExp; fn: OnResolveHandler }[];
    onLoadHandlers: { filter: RegExp; namespace?: string; fn: OnLoadHandler }[];
    onEndHandlers: OnEndHandler[];
    onStart(fn: OnStartHandler): void;
    onResolve(opts: { filter: RegExp }, fn: OnResolveHandler): void;
    onLoad(
        opts: { filter: RegExp; namespace?: string },
        fn: OnLoadHandler,
    ): void;
    onEnd(fn: OnEndHandler): void;
    triggerStart(): Promise<void>;
    triggerResolve(path: string, importer?: string): ResolveResult;
    triggerLoad(filePath: string, namespace?: string): Promise<LoadResult>;
    triggerEnd(): Promise<void>;
}

function createMockBuild(
    opts: { entryPoints?: string[]; outdir?: string; outbase?: string } = {},
): MockBuild {
    const build: MockBuild = {
        initialOptions: {
            entryPoints: opts.entryPoints ?? [],
            outdir: opts.outdir ?? "dist",
            outbase: opts.outbase,
        },
        onStartHandlers: [],
        onResolveHandlers: [],
        onLoadHandlers: [],
        onEndHandlers: [],
        onStart(fn) {
            this.onStartHandlers.push(fn);
        },
        onResolve(o, fn) {
            this.onResolveHandlers.push({ filter: o.filter, fn });
        },
        onLoad(o, fn) {
            this.onLoadHandlers.push({
                filter: o.filter,
                namespace: o.namespace,
                fn,
            });
        },
        onEnd(fn) {
            this.onEndHandlers.push(fn);
        },
        async triggerStart() {
            for (const fn of this.onStartHandlers) await fn();
        },
        triggerResolve(filePath, importer = "") {
            for (const { filter, fn } of this.onResolveHandlers) {
                if (filter.test(filePath)) {
                    const result = fn({ path: filePath, importer });
                    if (result) return result;
                }
            }
            return undefined;
        },
        async triggerLoad(filePath, namespace) {
            for (const { filter, namespace: ns, fn } of this.onLoadHandlers) {
                const nsMatch =
                    namespace !== undefined
                        ? ns === namespace
                        : ns === undefined;
                if (filter.test(filePath) && nsMatch) {
                    const result = await fn({ path: filePath, namespace });
                    if (result !== undefined) return result;
                }
            }
            return undefined;
        },
        async triggerEnd() {
            for (const fn of this.onEndHandlers) await fn();
        },
    };
    return build;
}

describe("mochiCss esbuild plugin — virtual mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({});
        mockCollectMochiCss.mockResolvedValue({ files: {}, global: undefined });
        mockTransform.mockImplementation(async (source: string) => source);
        vi.mocked(fsMock.readFile).mockResolvedValue("const x = 1" as never);
    });

    it("registers onStart, onResolve, onLoad hooks", async () => {
        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);

        expect(build.onStartHandlers).toHaveLength(1);
        expect(build.onResolveHandlers.length).toBeGreaterThan(0);
        expect(build.onLoadHandlers.length).toBeGreaterThan(0);
    });

    it("resolves mochi-css-asset: to mochi-css namespace", async () => {
        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);

        const result = build.triggerResolve("mochi-css-asset:global");
        expect(result).toBeDefined();
        expect(result?.namespace).toBe("mochi-css");
        expect(result?.path).toBe("global");
    });

    it("serves global CSS from namespace loader", async () => {
        mockCollectMochiCss.mockResolvedValue({
            global: ".g { color: red; }",
            files: {},
        });
        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = await build.triggerLoad("global", "mochi-css");
        expect(result?.contents).toBe(".g { color: red; }");
        expect(result?.loader).toBe("css");
    });

    it("serves per-file CSS from namespace loader", async () => {
        const srcPath = path.posix.resolve(
            process.cwd().replaceAll("\\", "/"),
            "src/Button.tsx",
        );
        mockCollectMochiCss.mockResolvedValue({
            files: { [srcPath]: ".btn { color: blue; }" },
            global: undefined,
        });
        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);
        await build.triggerStart();

        // fileHash mock returns basename without extension → "Button"
        const result = await build.triggerLoad("Button", "mochi-css");
        expect(result?.contents).toBe(".btn { color: blue; }");
        expect(result?.loader).toBe("css");
    });

    it("returns empty string from namespace loader for unknown id", async () => {
        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = await build.triggerLoad("unknown-hash", "mochi-css");
        expect(result?.contents).toBe("");
    });

    it("injects global CSS import into entry files", async () => {
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });

        const plugin = mochiCss({ entries: ["src/index.ts"] });
        const build = createMockBuild({ entryPoints: ["src/index.ts"] });
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = await build.triggerLoad(
            path.resolve("src/index.ts").replaceAll("\\", "/"),
        );
        expect(result?.contents).toContain(`import "mochi-css-asset:global"`);
        expect(result?.loader).toBe("ts");
    });

    it("injects per-file CSS import into file with CSS", async () => {
        const srcPath = path.resolve("src/Button.tsx").replaceAll("\\", "/");
        mockCollectMochiCss.mockResolvedValue({
            files: { [srcPath]: ".btn {}" },
            global: undefined,
        });

        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = await build.triggerLoad(
            path.resolve("src/Button.tsx").replaceAll("\\", "/"),
        );
        expect(result?.contents).toContain(`import "mochi-css-asset:Button"`);
    });

    it("returns null for source files with no CSS and no sourcemods", async () => {
        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = await build.triggerLoad(
            path.resolve("src/Other.tsx").replaceAll("\\", "/"),
        );
        expect(result).toBeNull();
    });

    it("applies sourcemods to source files", async () => {
        const srcPath = path.resolve("src/Widget.tsx").replaceAll("\\", "/");
        mockCollectMochiCss.mockResolvedValue({
            files: {},
            global: undefined,
            sourcemods: { [srcPath]: "const x = 'patched'" },
        });

        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = await build.triggerLoad(srcPath);
        expect(result?.contents).toContain("const x = 'patched'");
        expect(mockTransform).not.toHaveBeenCalled();
    });

    it("does not register onEnd in virtual mode", async () => {
        const plugin = mochiCss();
        const build = createMockBuild();
        await plugin.setup(build as never);

        expect(build.onEndHandlers).toHaveLength(0);
    });
});

describe("mochiCss esbuild plugin — external mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({});
        mockCollectMochiCss.mockResolvedValue({ files: {}, global: undefined });
        mockTransform.mockImplementation(async (source: string) => source);
        vi.mocked(fsMock.readFile).mockResolvedValue("const x = 1" as never);
        vi.mocked(fsMock.writeFile).mockResolvedValue(undefined);
        vi.mocked(fsMock.mkdir).mockResolvedValue(undefined as never);
    });

    it("resolves mochi-css-asset: as external with relative css path", async () => {
        const entryFile = path.resolve("src/index.ts").replaceAll("\\", "/");

        const plugin = mochiCss({ externalCss: true });
        const build = createMockBuild({
            entryPoints: [entryFile],
            outdir: "dist",
        });
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = build.triggerResolve(
            "mochi-css-asset:global",
            entryFile,
        );
        expect(result?.external).toBe(true);
        expect(result?.path).toMatch(/\.css$/);
        // src/index.ts → dist/src/index.js; global.css is at dist/global.css → "../global.css"
        expect(result?.path).toBe("../global.css");
    });

    it("writes CSS files to outdir in onEnd", async () => {
        const srcPath = path.resolve("src/Button.tsx").replaceAll("\\", "/");
        mockCollectMochiCss.mockResolvedValue({
            files: { [srcPath]: ".btn { color: blue; }" },
            global: ".g { margin: 0; }",
        });

        const plugin = mochiCss({ externalCss: true });
        const build = createMockBuild({ outdir: "dist" });
        await plugin.setup(build as never);
        await build.triggerStart();
        await build.triggerEnd();

        expect(fsMock.writeFile).toHaveBeenCalledWith(
            expect.stringContaining("Button.css"),
            ".btn { color: blue; }",
            "utf8",
        );
        expect(fsMock.writeFile).toHaveBeenCalledWith(
            expect.stringContaining("global.css"),
            ".g { margin: 0; }",
            "utf8",
        );
    });

    it("creates outdir before writing CSS files", async () => {
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });

        const plugin = mochiCss({ externalCss: true });
        const build = createMockBuild({ outdir: "dist" });
        await plugin.setup(build as never);
        await build.triggerStart();
        await build.triggerEnd();

        expect(fsMock.mkdir).toHaveBeenCalledWith(expect.any(String), {
            recursive: true,
        });
    });

    it("does not write CSS if no manifest", async () => {
        const plugin = mochiCss({ externalCss: true });
        const build = createMockBuild({ outdir: "dist" });
        await plugin.setup(build as never);
        // Do NOT trigger start — manifest remains undefined
        await build.triggerEnd();

        expect(fsMock.writeFile).not.toHaveBeenCalled();
    });
});

describe("mochiCss esbuild plugin — entry detection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({});
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });
        mockTransform.mockImplementation(async (source: string) => source);
        vi.mocked(fsMock.readFile).mockResolvedValue("const x = 1" as never);
    });

    it("auto-detects entries from string[] entryPoints", async () => {
        const plugin = mochiCss();
        const build = createMockBuild({
            entryPoints: ["src/main.ts"],
            outdir: "dist",
        });
        await plugin.setup(build as never);
        await build.triggerStart();

        const result = await build.triggerLoad(
            path.resolve("src/main.ts").replaceAll("\\", "/"),
        );
        expect(result?.contents).toContain(`import "mochi-css-asset:global"`);
    });

    it("opts.entries overrides auto-detection", async () => {
        const plugin = mochiCss({ entries: ["src/custom.ts"] });
        const build = createMockBuild({
            entryPoints: ["src/main.ts"],
            outdir: "dist",
        });
        await plugin.setup(build as never);
        await build.triggerStart();

        // src/main.ts should NOT get the import
        const main = await build.triggerLoad(
            path.resolve("src/main.ts").replaceAll("\\", "/"),
        );
        expect(main).toBeNull();

        // src/custom.ts SHOULD get the import
        const custom = await build.triggerLoad(
            path.resolve("src/custom.ts").replaceAll("\\", "/"),
        );
        expect(custom?.contents).toContain(`import "mochi-css-asset:global"`);
    });
});
