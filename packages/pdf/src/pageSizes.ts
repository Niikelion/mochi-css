export type PageSizeName = "a3" | "a4" | "a5" | "letter" | "legal" | "tabloid"

export type PageDimensions = {
    width: string
    height: string
}

/** Portrait dimensions as CSS physical lengths — the browser converts them when printing. */
export const PAGE_SIZES: Record<PageSizeName, PageDimensions> = {
    a3: { width: "297mm", height: "420mm" },
    a4: { width: "210mm", height: "297mm" },
    a5: { width: "148mm", height: "210mm" },
    letter: { width: "8.5in", height: "11in" },
    legal: { width: "8.5in", height: "14in" },
    tabloid: { width: "11in", height: "17in" },
}

export type PageSize = PageSizeName | { width: string | number; height: string | number }
export type PageOrientation = "portrait" | "landscape"
export type PageMargin =
    | string
    | number
    | { top?: string | number; right?: string | number; bottom?: string | number; left?: string | number }

export function toCssLength(value: string | number): string {
    return typeof value === "number" ? `${value}px` : value
}

export function resolvePageSize(size: PageSize, orientation: PageOrientation): PageDimensions {
    const base = typeof size === "string" ? PAGE_SIZES[size] : size
    const width = toCssLength(base.width)
    const height = toCssLength(base.height)
    return orientation === "landscape" ? { width: height, height: width } : { width, height }
}

/** Resolves a margin into a CSS `padding` shorthand applied to the page box. */
export function resolvePageMargin(margin: PageMargin): string {
    if (typeof margin === "string" || typeof margin === "number") return toCssLength(margin)

    const top = toCssLength(margin.top ?? 0)
    const right = toCssLength(margin.right ?? 0)
    const bottom = toCssLength(margin.bottom ?? 0)
    const left = toCssLength(margin.left ?? 0)
    return `${top} ${right} ${bottom} ${left}`
}
