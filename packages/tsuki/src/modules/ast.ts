export type ObjNode = { type: "ObjectExpression"; properties: Record<string, unknown>[] }
export type ArrNode = { type: "ArrayExpression"; elements: Record<string, unknown>[] }

export function getPropKeyName(prop: Record<string, unknown>): string | undefined {
    const key = prop["key"] as Record<string, unknown>
    if (typeof key["name"] === "string") return key["name"]
    if (typeof key["value"] === "string") return key["value"]
    return undefined
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
