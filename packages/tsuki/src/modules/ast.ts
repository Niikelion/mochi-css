export type ObjNode = { type: "ObjectExpression"; properties: Record<string, unknown>[] }
export type ArrNode = { type: "ArrayExpression"; elements: Record<string, unknown>[] }

export function getPropKeyName(prop: Record<string, unknown>): string | undefined {
    const key = prop["key"] as Record<string, unknown>
    if (typeof key["name"] === "string") return key["name"]
    if (typeof key["value"] === "string") return key["value"]
    return undefined
}

export function getPluginsElements(obj: ObjNode, configPath: string): Record<string, unknown>[] {
    const existing = obj.properties.find((prop) => getPropKeyName(prop) === "plugins")

    if (existing) {
        const value = existing["value"] as Record<string, unknown>
        if (value["type"] !== "ArrayExpression") {
            throw new Error(`Unrecognized plugins config type in ${configPath}`)
        }
        return value["elements"] as Record<string, unknown>[]
    }

    const elements: Record<string, unknown>[] = []
    obj.properties.push({
        type: "ObjectProperty",
        key: { type: "Identifier", name: "plugins" },
        value: { type: "ArrayExpression", elements },
        computed: false,
        shorthand: false,
    })
    return elements
}

export function optionsToAstProperties(options: Record<string, string | number | boolean>): Record<string, unknown>[] {
    return Object.entries(options).map(([key, value]) => ({
        type: "ObjectProperty",
        key: { type: "Identifier", name: key },
        value:
            typeof value === "string"
                ? { type: "StringLiteral", value }
                : typeof value === "number"
                  ? { type: "NumericLiteral", value }
                  : { type: "BooleanLiteral", value },
        computed: false,
        shorthand: false,
    }))
}
