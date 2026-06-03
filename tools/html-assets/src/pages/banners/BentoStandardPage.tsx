import type { FC, ReactNode } from "react"
import { BannerContainer } from "../../components/BannerContainer"
import { Layout } from "../../components/banner"
import { Colors } from "../../components/banner/colors"
import { EN, JP } from "../../components/banner/Text"
import { styled } from "@mochi-css/vanilla-react"

// ── Left ─────────────────────────────────────────────────────────────────────

const LeftGrid = styled("section", {
    display: "grid",
    gridTemplateAreas: `"side top" "side sub" "side rule" "side tag"`,
    gridTemplateRows: "auto auto 1fr auto",
    columnGap: "10px",
    rowGap: "16px",
})

const Wordmark = styled(EN, {
    textBox: "trim-both cap alphabetic",
    fontWeight: 700,
    fontSize: "88px",
    padding: "4px 0",
    "& span": {
        color: Colors.bright,
        fontWeight: 300,
        fontSize: "0.42em",
        letterSpacing: "0.05em",
        paddingLeft: "0.12em",
    },
})

const SubLabel = styled(EN, {
    color: Colors.bright,
    fontWeight: 300,
    fontSize: "26px",
    letterSpacing: "0.22em",
})

const Rule = styled("div", {
    width: "72px",
    height: 1,
    alignSelf: "center",
    backgroundColor: Colors.dim,
})

const Tagline = styled("p", {
    fontWeight: 300,
    fontSize: "13px",
    color: "#5a5040",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    margin: 0,
    "& strong": {
        color: Colors.bright,
        fontWeight: 400,
    },
})

const LeftContent: FC = () => (
    <LeftGrid>
        <JP vertical color="dim" style={{ gridArea: "side" }}>レイアウト</JP>
        <Wordmark style={{ gridArea: "top" }}>Mochi<span>.css</span></Wordmark>
        <SubLabel style={{ gridArea: "sub" }}>/ bento</SubLabel>
        <Rule style={{ gridArea: "rule" }} />
        <Tagline style={{ gridArea: "tag" }}>
            layout primitives &nbsp;—&nbsp; <strong>compile-time</strong><br />
            frame · grid · pile · overlay
        </Tagline>
    </LeftGrid>
)

// ── Right — unified bento box ────────────────────────────────────────────────

// Box geometry
const BW = 448     // total width
const BH = 296     // total height
const BR = 13      // outer corner radius

// Dividers (lines, not gaps)
const DIV_Y  = 148  // horizontal divider
const DIV_XT = 270  // vertical divider in top half
const DIV_XB = 178  // vertical divider in bottom half

// Shared colors
const STROKE   = "rgba(201,168,76,0.28)"
const DIVIDER  = "rgba(201,168,76,0.13)"
const SYM_FILL = "rgba(201,168,76,0.08)"
const SYM_STR  = "rgba(201,168,76,0.30)"
const SYM_STR2 = "rgba(201,168,76,0.18)"

// Cell centre-points (for centering symbols)
const FRAME_CX = DIV_XT / 2
const FRAME_CY = DIV_Y / 2
const PILE_CX  = DIV_XT + (BW - DIV_XT) / 2
const PILE_CY  = DIV_Y / 2
const GRID_CX  = DIV_XB / 2
const GRID_CY  = DIV_Y + (BH - DIV_Y) / 2
const OV_CX    = DIV_XB + (BW - DIV_XB) / 2
const OV_CY    = DIV_Y + (BH - DIV_Y) / 2

// ── Symbols ───────────────────────────────────────────────────────────────────

// frame: 3 flex children side-by-side, varying widths
const FrameSymbol: FC = () => {
    const widths = [40, 82, 40]
    const h = 40
    const gap = 8
    const total = widths.reduce((s, w) => s + w, 0) + gap * (widths.length - 1)
    let x = FRAME_CX - total / 2
    const y = FRAME_CY - h / 2
    return (
        <>
            {widths.map((w, i) => {
                const rx_ = x
                x += w + gap
                return (
                    <rect key={i} x={rx_} y={y} width={w} height={h}
                        fill={SYM_FILL} stroke={SYM_STR} strokeWidth={0.8} rx={3} />
                )
            })}
        </>
    )
}

// divider: two content cards filling the cell, cut off at top/bottom, divider between
const DividerSymbol: FC = () => {
    const CW = 120
    const sx = PILE_CX - CW / 2
    const GAP = 5
    const divY = PILE_CY  // divider at cell vertical centre

    return (
        <>
            {/* top card — fills from cell top down to just above divider */}
            <rect x={sx} y={0} width={CW} height={divY - GAP}
                fill={SYM_FILL} stroke={SYM_STR} strokeWidth={0.8} rx={4} />
            {/* content hint — two text lines near bottom of top card */}
            <rect x={sx + 12} y={divY - GAP - 16} width={54} height={3.5}
                fill="rgba(201,168,76,0.26)" rx={1.5} />
            <rect x={sx + 12} y={divY - GAP - 9} width={36} height={3.5}
                fill="rgba(201,168,76,0.16)" rx={1.5} />

            {/* divider line — slightly wider than the cards */}
            <line x1={sx - 6} y1={divY} x2={sx + CW + 6} y2={divY}
                stroke="rgba(201,168,76,0.55)" strokeWidth={1.2} strokeLinecap="round" />

            {/* bottom card — fills from just below divider to cell bottom */}
            <rect x={sx} y={divY + GAP} width={CW} height={DIV_Y - divY - GAP}
                fill={SYM_FILL} stroke={SYM_STR} strokeWidth={0.8} rx={4} />
            {/* content hint — two text lines near top of bottom card */}
            <rect x={sx + 12} y={divY + GAP + 8} width={54} height={3.5}
                fill="rgba(201,168,76,0.26)" rx={1.5} />
            <rect x={sx + 12} y={divY + GAP + 15} width={36} height={3.5}
                fill="rgba(201,168,76,0.16)" rx={1.5} />
        </>
    )
}

// grid: 3 × 2 cells
const GridSymbol: FC = () => {
    const COLS = 3, ROWS = 2
    const CW = 38, CH = 38, GAP = 4
    const totalW = COLS * CW + (COLS - 1) * GAP
    const totalH = ROWS * CH + (ROWS - 1) * GAP
    const sx = OV_CX - totalW / 2
    const sy = OV_CY - totalH / 2
    const cells: ReactNode[] = []
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            cells.push(
                <rect key={`${r}-${c}`}
                    x={sx + c * (CW + GAP)} y={sy + r * (CH + GAP)}
                    width={CW} height={CH}
                    fill={SYM_FILL} stroke={SYM_STR} strokeWidth={0.7} rx={2} />
            )
        }
    }
    return <>{cells}</>
}

// overlay: three identical rectangles stacked with diagonal offset
const OverlaySymbol: FC = () => {
    const W = 80, H = 50, STEP = 7
    const layers = 3
    return (
        <>
            {Array.from({ length: layers }, (_, i) => {
                const back = layers - 1 - i
                const ox = GRID_CX - W / 2 + back * STEP
                const oy = GRID_CY - H / 2 + back * STEP
                const alpha = 0.05 + i * 0.04
                return (
                    <rect key={i} x={ox} y={oy} width={W} height={H}
                        fill={`rgba(201,168,76,${alpha})`}
                        stroke={i === layers - 1 ? SYM_STR : SYM_STR2}
                        strokeWidth={0.8} rx={4} />
                )
            })}
        </>
    )
}

// ── Assembled bento box SVG ───────────────────────────────────────────────────

const Outer = styled("div", {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
})

const RightContent: FC = () => (
    <Outer>
        <svg xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${BW} ${BH}`}
            style={{ width: BW, height: BH }}>

            {/* box background */}
            <rect x={0} y={0} width={BW} height={BH} rx={BR}
                fill="#131110" stroke="none" />

            {/* internal dividers */}
            {/* horizontal */}
            <line x1={0} y1={DIV_Y} x2={BW} y2={DIV_Y} stroke={DIVIDER} strokeWidth={1} />
            {/* vertical — top half */}
            <line x1={DIV_XT} y1={0} x2={DIV_XT} y2={DIV_Y} stroke={DIVIDER} strokeWidth={1} />
            {/* vertical — bottom half */}
            <line x1={DIV_XB} y1={DIV_Y} x2={DIV_XB} y2={BH} stroke={DIVIDER} strokeWidth={1} />

            {/* symbols */}
            <FrameSymbol />
            <DividerSymbol />
            <GridSymbol />
            <OverlaySymbol />

            {/* outer border — drawn last so it sits on top of dividers */}
            <rect x={0} y={0} width={BW} height={BH} rx={BR}
                fill="none" stroke={STROKE} strokeWidth={1} />
        </svg>
    </Outer>
)

// ── Page ─────────────────────────────────────────────────────────────────────

const Left = styled(Layout.Left, {
    placeContent: "center",
    placeItems: "center",
})

const Right = styled(Layout.Right, {
    display: "flex",
    placeItems: "center",
    placeContent: "center",
})

export default function BentoStandardPage() {
    return (
        <BannerContainer width={1280} height={640}>
            <Layout.Root>
                <Left>
                    <LeftContent />
                </Left>
                <Right>
                    <RightContent />
                </Right>
            </Layout.Root>
        </BannerContainer>
    )
}
