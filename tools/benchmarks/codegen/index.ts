import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { parseStyledFile } from "./extract.ts"
import { generateStitchesFile, generateStitchesGlobal, STITCHES_CONFIG } from "./generators/stitches.ts"
import { generateVEFile, generateVEGlobal } from "./generators/vanilla-extract.ts"
import { generateMochiStitchesFile, generateMochiStitchesGlobal, MOCHI_STITCHES_CONFIG } from "./generators/mochi-stitches.ts"
import { generatePandaFile, PANDA_MAIN, PANDA_INDEX_CSS, PANDA_GLOBAL_STUB, PANDA_CONFIG } from "./generators/panda.ts"
import { generateCssModulesFiles, CSS_MODULES_GLOBAL_CSS, CSS_MODULES_GLOBAL_TS } from "./generators/css-modules.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const benchmarksRoot = path.resolve(__dirname, "..")

const MOCHI_SRC = path.join(benchmarksRoot, "implementations", "mochi-vanilla-react", "src")

function scanMochiSrc() {
    const sectionLayouts = readdirSync(path.join(MOCHI_SRC, "sections"))
        .filter(f => f.endsWith(".tsx"))
        .sort()
        .map(f => `sections/${f}`)

    const rootStyled = readdirSync(MOCHI_SRC)
        .filter(f => f.endsWith(".styled.ts"))
        .sort()
        .map(f => ({ src: f, baseName: f.replace(".styled.ts", "") }))

    const sectionStyled = readdirSync(path.join(MOCHI_SRC, "sections"))
        .filter(f => f.endsWith(".styled.ts"))
        .sort()
        .map(f => ({ src: `sections/${f}`, baseName: f.replace(".styled.ts", "") }))

    const componentSources = readdirSync(path.join(MOCHI_SRC, "components"))
        .filter(f => f.endsWith(".tsx"))
        .sort()
        .map(f => ({ src: `components/${f}`, baseName: f.replace(".tsx", "") }))

    return {
        // Layout files shared verbatim (+ tokens.ts and main.tsx are always included)
        sharedFiles: ["tokens.ts", "main.tsx", "App.tsx", ...sectionLayouts],
        // Same but without tokens.ts / main.tsx (for frameworks with custom entry files)
        sharedFilesNoEntry: ["App.tsx", ...sectionLayouts],
        styledSources: [...rootStyled, ...sectionStyled],
        componentSources,
    }
}

const { sharedFiles: SHARED_FILES, sharedFilesNoEntry: SHARED_FILES_NO_ENTRY, styledSources: STYLED_SOURCES, componentSources: COMPONENT_SOURCES } = scanMochiSrc()

function cleanDir(dir: string): void {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
        if (entry === ".gitignore") continue
        rmSync(path.join(dir, entry), { recursive: true, force: true })
    }
}

function writeFile(filePath: string, content: string): void {
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, content, "utf8")
    console.log(`  wrote ${path.relative(benchmarksRoot, filePath)}`)
}

function readSource(relPath: string): string {
    return readFileSync(path.join(MOCHI_SRC, relPath), "utf8")
}

function generateStitches(targetSrc: string): void {
    cleanDir(targetSrc)
    console.log("\n[stitches] Copying shared files...")
    for (const f of SHARED_FILES) {
        writeFile(path.join(targetSrc, f), readSource(f))
    }

    console.log("\n[stitches] Writing static config files...")
    writeFile(path.join(targetSrc, "stitches.config.ts"), STITCHES_CONFIG)
    writeFile(path.join(targetSrc, "global.ts"), generateStitchesGlobal(readSource("global.ts")))

    console.log("\n[stitches] Generating styled files...")
    for (const { src } of STYLED_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const content = generateStitchesFile(parsed, src)
        writeFile(path.join(targetSrc, src), content)
    }

    console.log("\n[stitches] Generating component files...")
    for (const { src } of COMPONENT_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const content = generateStitchesFile(parsed, src)
        writeFile(path.join(targetSrc, src), content)
    }
}

function generateMochiStitches(targetSrc: string): void {
    cleanDir(targetSrc)
    console.log("\n[mochi-stitches] Copying shared files...")
    for (const f of SHARED_FILES) {
        writeFile(path.join(targetSrc, f), readSource(f))
    }

    console.log("\n[mochi-stitches] Writing static config files...")
    writeFile(path.join(targetSrc, "stitches.config.ts"), MOCHI_STITCHES_CONFIG)
    writeFile(path.join(targetSrc, "global.ts"), generateMochiStitchesGlobal())

    console.log("\n[mochi-stitches] Generating styled files...")
    for (const { src } of STYLED_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const content = generateMochiStitchesFile(parsed, src)
        writeFile(path.join(targetSrc, src), content)
    }

    console.log("\n[mochi-stitches] Generating component files...")
    for (const { src } of COMPONENT_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const content = generateMochiStitchesFile(parsed, src)
        writeFile(path.join(targetSrc, src), content)
    }
}

function generateVanillaExtract(targetSrc: string): void {
    cleanDir(targetSrc)
    console.log("\n[vanilla-extract] Copying shared files...")
    for (const f of SHARED_FILES) {
        writeFile(path.join(targetSrc, f), readSource(f))
    }

    console.log("\n[vanilla-extract] Writing static global file...")
    writeFile(path.join(targetSrc, "global.css.ts"), generateVEGlobal())
    // Proxy so main.tsx's `import "./global"` triggers global.css.ts processing
    writeFile(path.join(targetSrc, "global.ts"), `export { fadeIn } from "./global.css"\n`)

    console.log("\n[vanilla-extract] Generating styled files...")
    for (const { src, baseName } of STYLED_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const isSubdir = src.includes("/")
        const { cssTs, styledTsx, cssFileName, styledFileName } = generateVEFile(parsed, isSubdir, true, baseName)
        const dir = path.dirname(path.join(targetSrc, src))
        writeFile(path.join(dir, cssFileName), cssTs)
        writeFile(path.join(dir, styledFileName), styledTsx)
    }

    console.log("\n[vanilla-extract] Generating component files...")
    for (const { src, baseName } of COMPONENT_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const { cssTs, styledTsx, cssFileName, styledFileName } = generateVEFile(parsed, true, false, baseName)
        const dir = path.join(targetSrc, "components")
        writeFile(path.join(dir, cssFileName), cssTs)
        writeFile(path.join(dir, styledFileName), styledTsx)
    }
}

function generatePanda(targetSrc: string): void {
    cleanDir(targetSrc)
    console.log("\n[panda] Copying shared files...")
    for (const f of SHARED_FILES_NO_ENTRY) {
        writeFile(path.join(targetSrc, f), readSource(f))
    }

    console.log("\n[panda] Writing static files...")
    writeFile(path.join(targetSrc, "main.tsx"), PANDA_MAIN)
    writeFile(path.join(targetSrc, "index.css"), PANDA_INDEX_CSS)
    writeFile(path.join(targetSrc, "global.ts"), PANDA_GLOBAL_STUB)

    // panda.config.ts lives outside src/ — write to impl root
    const implRoot = path.resolve(targetSrc, "..")
    writeFile(path.join(implRoot, "panda.config.ts"), PANDA_CONFIG)

    console.log("\n[panda] Generating styled files...")
    for (const { src } of STYLED_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const content = generatePandaFile(parsed, src)
        // Output as .tsx (panda generates JSX wrapper components)
        const outPath = src.replace(/\.ts$/, ".tsx")
        writeFile(path.join(targetSrc, outPath), content)
    }

    console.log("\n[panda] Generating component files...")
    for (const { src } of COMPONENT_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const content = generatePandaFile(parsed, src)
        writeFile(path.join(targetSrc, src), content)
    }
}

function generateCssModules(targetSrc: string): void {
    cleanDir(targetSrc)
    console.log("\n[css-modules] Copying shared files...")
    for (const f of SHARED_FILES) {
        writeFile(path.join(targetSrc, f), readSource(f))
    }

    console.log("\n[css-modules] Writing static files...")
    writeFile(path.join(targetSrc, "global.css"), CSS_MODULES_GLOBAL_CSS)
    writeFile(path.join(targetSrc, "global.ts"), CSS_MODULES_GLOBAL_TS)

    console.log("\n[css-modules] Generating styled files...")
    for (const { src, baseName } of STYLED_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const { css, tsx, cssFileName, tsxFileName } = generateCssModulesFiles(parsed, baseName, true)
        const dir = path.dirname(path.join(targetSrc, src))
        writeFile(path.join(dir, cssFileName), css)
        writeFile(path.join(dir, tsxFileName), tsx)
    }

    console.log("\n[css-modules] Generating component files...")
    for (const { src, baseName } of COMPONENT_SOURCES) {
        const source = readSource(src)
        const parsed = parseStyledFile(src, source)
        const { css, tsx, cssFileName, tsxFileName } = generateCssModulesFiles(parsed, baseName, false)
        const dir = path.join(targetSrc, "components")
        writeFile(path.join(dir, cssFileName), css)
        writeFile(path.join(dir, tsxFileName), tsx)
    }
}

const framework = process.argv[2]

if (framework === "stitches") {
    const targetSrc = path.join(benchmarksRoot, "implementations", "stitches", "src")
    console.log(`Generating stitches implementation in ${targetSrc}`)
    generateStitches(targetSrc)
    console.log("\n[stitches] Done.")
} else if (framework === "mochi-stitches") {
    const targetSrc = path.join(benchmarksRoot, "implementations", "mochi-stitches", "src")
    console.log(`Generating mochi-stitches implementation in ${targetSrc}`)
    generateMochiStitches(targetSrc)
    console.log("\n[mochi-stitches] Done.")
} else if (framework === "vanilla-extract") {
    const targetSrc = path.join(benchmarksRoot, "implementations", "vanilla-extract", "src")
    console.log(`Generating vanilla-extract implementation in ${targetSrc}`)
    generateVanillaExtract(targetSrc)
    console.log("\n[vanilla-extract] Done.")
} else if (framework === "panda") {
    const targetSrc = path.join(benchmarksRoot, "implementations", "panda", "src")
    console.log(`Generating panda implementation in ${targetSrc}`)
    generatePanda(targetSrc)
    console.log("\n[panda] Done.")
} else if (framework === "css-modules") {
    const targetSrc = path.join(benchmarksRoot, "implementations", "css-modules", "src")
    console.log(`Generating css-modules implementation in ${targetSrc}`)
    generateCssModules(targetSrc)
    console.log("\n[css-modules] Done.")
} else {
    console.error(`Usage: tsx codegen/index.ts <stitches|vanilla-extract|mochi-stitches|panda|css-modules>`)
    console.error(`Got: ${framework ?? "(none)"}`)
    process.exit(1)
}
