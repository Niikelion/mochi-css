import { writeFile } from "fs/promises"
import { join } from "path"
import dedent from "dedent"
import { definePackageConfig } from "@gamedev-sensei/tsdown-config"
import { definitionSyntax } from "css-tree"

// Minimal types for @webref/css (untyped package)
interface CssFeature {
    name: string
    syntax?: string
}
interface CssData {
    properties: CssFeature[]
    types: CssFeature[]
}
import css from "@webref/css"
const listAll: () => Promise<CssData> = css.listAll

const numericTypeUnits = {
    length: "px",
    "length-percentage": "px",
    percentage: "%",
    time: "ms",
    angle: "deg",
    resolution: "dppx",
    frequency: "Hz",
    flex: "fr",
} as const

function extractRefs(syntax: string) {
    const types: string[] = []
    const properties: string[] = []
    try {
        definitionSyntax.walk(definitionSyntax.parse(syntax), (node) => {
            if (node.type === "Type") types.push(node.name)
            else if (node.type === "Property") properties.push(node.name)
        })
    } catch {
        /* invalid syntax */
    }
    return { types, properties }
}

function findDefaultUnit(
    syntax: string | undefined,
    cssTypes: CssFeature[],
    cssProperties: CssFeature[],
    visited = new Set<string>(),
): string | undefined {
    if (!syntax) return undefined
    const { types, properties } = extractRefs(syntax)

    for (const t of types) if (t in numericTypeUnits) return numericTypeUnits[t as keyof typeof numericTypeUnits]

    for (const p of properties) {
        if (visited.has(`p:${p}`)) continue
        visited.add(`p:${p}`)
        const ref = cssProperties.find((x) => x.name === p)
        const unit = ref && findDefaultUnit(ref.syntax, cssTypes, cssProperties, visited)
        if (unit) return unit
    }

    for (const t of types) {
        if (visited.has(`t:${t}`)) continue
        visited.add(`t:${t}`)
        const ref = cssTypes.find((x) => x.name === t)
        const unit = ref && findDefaultUnit(ref.syntax, cssTypes, cssProperties, visited)
        if (unit) return unit
    }

    return undefined
}

const kebabToCamel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

function generatePropertyUnits(properties: CssFeature[], types: CssFeature[]) {
    const result: Record<string, string> = {}
    for (const prop of properties) {
        if (prop.name.startsWith("-")) continue
        const unit = findDefaultUnit(prop.syntax, types, properties)
        if (unit) result[kebabToCamel(prop.name)] = unit
    }
    return result
}

function generateUnitMappingFileContent(units: Record<string, string>) {
    const entries = Object.entries(units)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([prop, unit]) => `${prop}: "${unit}",`)
        .join(`\n${" ".repeat(3 * 4)}`)
    return (
        /* language=typescript */ dedent`
        // Auto-generated from @webref/css - do not edit manually
        // Run "yarn build" to regenerate

        export const propertyUnits = {
            ${entries}
        } as const

        export type PropertyWithUnit = keyof typeof propertyUnits
    ` + "\n"
    )
}

function generateKnownPropertiesFileContent(names: string[]) {
    const entries = [...names]
        .sort()
        .map((name) => `"${name}",`)
        .join(`\n${" ".repeat(3 * 4)}`)
    return (
        /* language=typescript */ dedent`
        // Auto-generated from @webref/css - do not edit manually
        // Run "yarn build" to regenerate

        export const knownPropertyNames: ReadonlySet<string> = new Set([
            ${entries}
        ])
    ` + "\n"
    )
}

export default definePackageConfig({
    attw: true,
    hooks: {
        "build:prepare": async () => {
            const { properties, types } = await listAll()

            const units = generatePropertyUnits(properties, types)
            const unitsPath = join(process.cwd(), "src", "propertyUnits.generated.ts")
            await writeFile(unitsPath, generateUnitMappingFileContent(units), "utf-8")
            console.log(`Generated ${Object.keys(units).length} property unit mappings`)

            const knownNames = properties
                .filter((p) => !p.name.startsWith("-"))
                .map((p) => kebabToCamel(p.name))
            const knownPath = join(process.cwd(), "src", "knownProperties.generated.ts")
            await writeFile(knownPath, generateKnownPropertiesFileContent(knownNames), "utf-8")
            console.log(`Generated ${knownNames.length} known property names`)
        },
    },
})
