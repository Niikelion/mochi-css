import { useContext, type ComponentPropsWithRef, type CSSProperties } from "react"
import { styled } from "@mochi-css/vanilla-react"
import { DocumentContext } from "./context"
import { resolvePageMargin, resolvePageSize, type PageMargin, type PageOrientation, type PageSize } from "../pageSizes"

// Only the static part of a page lives in extracted CSS. Width/height/padding vary per
// instance, so they are inline styles — mochi extracts styles at build time and cannot
// hash a class for a size that is only known from props.
const PageBox = styled("div", {
    boxSizing: "border-box",
    flexShrink: 0,
    overflow: "hidden",
    background: "#fff",
    breakAfter: "page",
    // A break after the final page would emit a trailing blank sheet.
    "&:last-child": { breakAfter: "auto" },
    "@media screen": { boxShadow: "0 1px 4px rgba(0, 0, 0, 0.25)" },
})

export type PageProps = Omit<ComponentPropsWithRef<"div">, "style"> & {
    size?: PageSize
    orientation?: PageOrientation
    margin?: PageMargin
    style?: CSSProperties
}

/**
 * A single page of a {@link Document}, rendered as a real fixed-size box so the on-screen
 * preview matches the exported PDF.
 */
export function Page({ size, orientation, margin, style, children, ...rest }: PageProps) {
    const defaults = useContext(DocumentContext)
    const { width, height } = resolvePageSize(size ?? defaults.size, orientation ?? defaults.orientation)
    const padding = resolvePageMargin(margin ?? defaults.margin)

    return (
        <PageBox {...rest} data-mochi-page="" style={{ width, height, padding, ...style }}>
            {children}
        </PageBox>
    )
}
