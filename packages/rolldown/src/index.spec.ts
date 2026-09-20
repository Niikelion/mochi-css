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
        debug: false,
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

vi.mock("@mochi-css/core", () => ({
    diagnosticToString: vi.fn((e: { message: string }) => e.message),
}));

vi.mock("node:fs/promises", () => ({
    default: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        writeFile: vi.fn(async () => {}),
        mkdir: vi.fn(async () => undefined),
    },
}));

import { mochiCss } from "./index.js";
import fsMock from "node:fs/promises";

// ─── Plugin test harness ──────────────────────────────────────────────────────

type SimplePlugin = {
    buildStart?: (inputOptions: { input: string[] }) => Promise<void> | void;
    resolveId?: (
        id: string,
        importer?: string | null,
    ) => { id: string; external?: boolean } | null | undefined;
    load?: (id: string) => { code: string } | null | undefined;
    transform?: (
        code: string,
        id: string,
    ) => Promise<{ code: string } | null | undefined>;
    writeBundle?: (outputOptions: { dir?: string }) => Promise<void> | void;
};

function extractHook<T>(hook: T | { handler: T } | undefined): T | undefined {
    if (!hook) return undefined;
    if (typeof hook === "function") return hook;
    if (typeof (hook as { handler: unknown }).handler === "function") {
        return (hook as { handler: T }).handler;
    }
    return undefined;
}

function createMockPlugin(
    rawPlugin: ReturnType<typeof mochiCss>,
): SimplePlugin & {
    triggerBuildStart(input?: string[]): Promise<void>;
    triggerResolveId(
        id: string,
        importer?: string | null,
    ): { id: string; external?: boolean } | null | undefined;
    triggerLoad(id: string): { code: string } | null | undefined;
    triggerTransform(
        code: string,
        id: string,
    ): Promise<{ code: string } | null | undefined>;
    triggerWriteBundle(dir?: string): Promise<void>;
} {
    const plugin = rawPlugin as unknown as SimplePlugin;

    return {
        ...plugin,
        async triggerBuildStart(input = []) {
            const fn = extractHook(plugin.buildStart);
            if (fn) await fn.call({} as never, { input });
        },
        triggerResolveId(id, importer = null) {
            const fn = extractHook(plugin.resolveId);
            if (!fn) return null;
            return fn.call({} as never, id, importer ?? undefined);
        },
        triggerLoad(id) {
            const fn = extractHook(plugin.load);
            if (!fn) return null;
            return fn.call({} as never, id);
        },
        async triggerTransform(code, id) {
            const fn = extractHook(plugin.transform);
            if (!fn) return null;
            return fn.call({} as never, code, id) as Promise<
                { code: string } | null | undefined
            >;
        },
        async triggerWriteBundle(dir = "dist") {
            const fn = extractHook(plugin.writeBundle);
            if (fn) await fn.call({} as never, { dir });
        },
    };
}

// ─── Virtual mode ─────────────────────────────────────────────────────────────

describe("mochiCss rolldown plugin — virtual mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({});
        mockCollectMochiCss.mockResolvedValue({ files: {}, global: undefined });
        mockTransform.mockImplementation(async (source: string) => source);
    });

    it("plugin has expected hooks", () => {
        const plugin = mochiCss();
        expect(typeof plugin.buildStart).toBe("function");
        expect(typeof plugin.resolveId).toBe("function");
        expect(typeof plugin.load).toBe("function");
        expect(typeof plugin.transform).toBe("function");
    });

    it("resolves mochi-css-asset: to virtual id (\\0 prefix)", async () => {
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = mock.triggerResolveId("mochi-css-asset:global");
        expect(result).toBeDefined();
        expect(result?.id).toBe("\0mochi-css-asset:global");
        expect(result?.external).toBeFalsy();
    });

    it("load returns style-injection JS for global virtual id", async () => {
        mockCollectMochiCss.mockResolvedValue({
            global: ".g { color: red; }",
            files: {},
        });
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = mock.triggerLoad("\0mochi-css-asset:global");
        expect(result?.code).toContain(".g { color: red; }");
        expect(result?.code).toContain("document.createElement");
    });

    it("load returns empty style JS for unknown id", async () => {
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = mock.triggerLoad("\0mochi-css-asset:unknown");
        expect(result?.code).toContain('""');
        expect(result?.code).toContain("document.createElement");
    });

    it("load returns null for non-virtual id", () => {
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        const result = mock.triggerLoad("src/index.ts");
        expect(result).toBeNull();
    });

    it("transform injects per-file CSS import into file with CSS", async () => {
        const srcPath = path.resolve("src/Button.tsx").replaceAll("\\", "/");
        mockCollectMochiCss.mockResolvedValue({
            files: { [srcPath]: ".btn { color: blue; }" },
            global: undefined,
        });
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = await mock.triggerTransform("const x = 1", srcPath);
        expect(result?.code).toContain(`import "mochi-css-asset:Button"`);
    });

    it("transform injects global CSS import into entry files", async () => {
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });
        const entryPath = path.resolve("src/index.ts").replaceAll("\\", "/");

        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart([entryPath]);

        const result = await mock.triggerTransform("const x = 1", entryPath);
        expect(result?.code).toContain(`import "mochi-css-asset:global"`);
    });

    it("transform returns null for source files with no CSS and no sourcemods", async () => {
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = await mock.triggerTransform(
            "const x = 1",
            path.resolve("src/Other.tsx").replaceAll("\\", "/"),
        );
        expect(result).toBeNull();
    });

    it("transform applies sourcemods to source files", async () => {
        const srcPath = path.resolve("src/Widget.tsx").replaceAll("\\", "/");
        mockCollectMochiCss.mockResolvedValue({
            files: {},
            global: undefined,
            sourcemods: { [srcPath]: "const x = 'patched'" },
        });

        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = await mock.triggerTransform("const x = 1", srcPath);
        expect(result?.code).toContain("const x = 'patched'");
        expect(mockTransform).not.toHaveBeenCalled();
    });

    it("writeBundle does not write files in virtual mode", async () => {
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();
        await mock.triggerWriteBundle("dist");

        expect(fsMock.writeFile).not.toHaveBeenCalled();
    });
});

// ─── External mode ────────────────────────────────────────────────────────────

describe("mochiCss rolldown plugin — external mode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({});
        mockCollectMochiCss.mockResolvedValue({ files: {}, global: undefined });
        mockTransform.mockImplementation(async (source: string) => source);
        vi.mocked(fsMock.writeFile).mockResolvedValue(undefined);
        vi.mocked(fsMock.mkdir).mockResolvedValue(undefined as never);
    });

    it("resolves ./global.css as external", async () => {
        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = mock.triggerResolveId("./global.css");
        expect(result?.external).toBe(true);
        expect(result?.id).toBe("./global.css");
    });

    it("resolves per-file ./hash.css as external", async () => {
        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = mock.triggerResolveId("./abc123def456.css");
        expect(result?.external).toBe(true);
        expect(result?.id).toBe("./abc123def456.css");
    });

    it("transform injects ./hash.css import directly in external mode", async () => {
        const srcPath = path.resolve("src/Button.tsx").replaceAll("\\", "/");
        mockCollectMochiCss.mockResolvedValue({
            files: { [srcPath]: ".btn { color: blue; }" },
            global: undefined,
        });

        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();

        const result = await mock.triggerTransform("const x = 1", srcPath);
        // Must inject a direct CSS file path — NOT a mochi-css-asset: virtual module
        expect(result?.code).toContain(`import "./Button.css"`);
        expect(result?.code).not.toContain("mochi-css-asset:");
    });

    it("transform injects ./global.css import directly in external mode", async () => {
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });
        const entryPath = path.resolve("src/index.ts").replaceAll("\\", "/");

        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart([entryPath]);

        const result = await mock.triggerTransform("const x = 1", entryPath);
        expect(result?.code).toContain(`import "./global.css"`);
        expect(result?.code).not.toContain("mochi-css-asset:");
    });

    it("writeBundle writes CSS files to outdir", async () => {
        const srcPath = path.resolve("src/Button.tsx").replaceAll("\\", "/");
        mockCollectMochiCss.mockResolvedValue({
            files: { [srcPath]: ".btn { color: blue; }" },
            global: ".g { margin: 0; }",
        });

        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();
        await mock.triggerWriteBundle("dist");

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

    it("writeBundle creates outdir before writing", async () => {
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });

        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart();
        await mock.triggerWriteBundle("dist");

        expect(fsMock.mkdir).toHaveBeenCalledWith(expect.any(String), {
            recursive: true,
        });
    });

    it("writeBundle skips if no manifest", async () => {
        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        // Do NOT trigger buildStart — manifest stays undefined
        await mock.triggerWriteBundle("dist");

        expect(fsMock.writeFile).not.toHaveBeenCalled();
    });

    it("load returns null in external mode (no virtual modules are created)", () => {
        const plugin = mochiCss({ externalCss: true });
        const mock = createMockPlugin(plugin);
        const result = mock.triggerLoad("\0mochi-css-asset:global");
        // In external mode resolveId never produces \0mochi-css-asset: ids, so load
        // should return null for any such id.
        expect(result).toBeNull();
    });
});

// ─── Entry detection ──────────────────────────────────────────────────────────

describe("mochiCss rolldown plugin — entry detection", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLoadConfig.mockResolvedValue({});
        mockCollectMochiCss.mockResolvedValue({ global: ".g {}", files: {} });
        mockTransform.mockImplementation(async (source: string) => source);
    });

    it("auto-detects entries from buildStart input array", async () => {
        const entryPath = path.resolve("src/main.ts").replaceAll("\\", "/");
        const plugin = mochiCss();
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart([entryPath]);

        const result = await mock.triggerTransform("const x = 1", entryPath);
        expect(result?.code).toContain(`import "mochi-css-asset:global"`);
    });

    it("opts.entries overrides auto-detection", async () => {
        const mainPath = path.resolve("src/main.ts").replaceAll("\\", "/");
        const customPath = path.resolve("src/custom.ts").replaceAll("\\", "/");

        const plugin = mochiCss({ entries: ["src/custom.ts"] });
        const mock = createMockPlugin(plugin);
        await mock.triggerBuildStart([mainPath]);

        // main should NOT get global import
        const main = await mock.triggerTransform("const x = 1", mainPath);
        expect(main).toBeNull();

        // custom SHOULD get global import
        const custom = await mock.triggerTransform("const x = 1", customPath);
        expect(custom?.code).toContain(`import "mochi-css-asset:global"`);
    });
});
