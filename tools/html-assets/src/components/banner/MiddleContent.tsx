import type { FC } from "react";
import { styled } from "@mochi-css/vanilla-react";
import { Colors } from "./colors.ts";

const FONT = "IBM Plex Mono, monospace";
const C = 170;

const Outer = styled("div", {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
});

// Card occupies top-left 2×2 cells with inset
const PAD = 14;
const CX = PAD,
    CY = PAD;
const CW = C * 2 - PAD * 2; // 312
const CH = C * 2 - PAD * 2; // 312
const HH = 96; // header height
const BH = 108; // body height
const AV_R = 20;
const AV_CX = CX + 18 + AV_R; // 52
const AV_CY = CY + HH / 2; // 62
const NAME_X = AV_CX + AV_R + 10;
const C3X = C * 2; // x=340: left edge of right column
const R3Y = C * 2; // y=340: top edge of bottom row

const CHIP_DEFS = [
    { label: "design", w: 58 },
    { label: "css", w: 38 },
    { label: "react", w: 52 },
];

const Chip: FC<{ x: number; y: number; w: number; label: string }> = ({
    x,
    y,
    w,
    label,
}) => (
    <g>
        <rect
            x={x}
            y={y}
            width={w}
            height={20}
            rx={3}
            fill="rgba(201,168,76,0.08)"
            stroke="rgba(201,168,76,0.25)"
            strokeWidth={0.7}
        />
        <text
            x={x + w / 2}
            y={y + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={8}
            fontFamily={FONT}
            fill={Colors.dim}
            style={{ letterSpacing: "0.04em" }}
        >
            {label}
        </text>
    </g>
);

const HRuler: FC<{ x1: number; x2: number; y: number; label: string }> = ({
    x1,
    x2,
    y,
    label,
}) => (
    <>
        <line
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            stroke={Colors.dim}
            strokeWidth={0.7}
        />
        <line
            x1={x1}
            y1={y - 5}
            x2={x1}
            y2={y + 5}
            stroke={Colors.dim}
            strokeWidth={0.7}
        />
        <line
            x1={x2}
            y1={y - 5}
            x2={x2}
            y2={y + 5}
            stroke={Colors.dim}
            strokeWidth={0.7}
        />
        <text
            x={(x1 + x2) / 2}
            y={y + 14}
            textAnchor="middle"
            fontSize={9}
            fontFamily={FONT}
            fill={Colors.dim}
            style={{ letterSpacing: "0.5px" }}
        >
            {label}
        </text>
    </>
);

const VRuler: FC<{
    y1: number;
    y2: number;
    x: number;
    label: string;
    side?: "left" | "right";
}> = ({ y1, y2, x, label, side }) => {
    const lx = side === "right" ? x + 12 : x - 12;
    const anchor = side === "right" ? "start" : "end";
    return (
        <>
            <line
                x1={x}
                y1={y1}
                x2={x}
                y2={y2}
                stroke={Colors.dim}
                strokeWidth={0.7}
            />
            <line
                x1={x - 5}
                y1={y1}
                x2={x + 5}
                y2={y1}
                stroke={Colors.dim}
                strokeWidth={0.7}
            />
            <line
                x1={x - 5}
                y1={y2}
                x2={x + 5}
                y2={y2}
                stroke={Colors.dim}
                strokeWidth={0.7}
            />
            <text
                x={lx}
                y={(y1 + y2) / 2}
                dominantBaseline="middle"
                textAnchor={anchor}
                fontSize={9}
                fontFamily={FONT}
                fill={Colors.dim}
                style={{ letterSpacing: "0.5px" }}
            >
                {label}
            </text>
        </>
    );
};

const CellLabel: FC<{ cx: number; cy: number; label: string }> = ({
    cx,
    cy,
    label,
}) => (
    <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fontFamily={FONT}
        fill={Colors.dim}
        opacity={0.5}
        style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}
    >
        {label}
    </text>
);

export const MiddleContent: FC = () => {
    const cardChipY = CY + HH + BH + 18;

    const cardChips: { label: string; w: number; x: number }[] = [];
    let chipAcc = CX + 16;
    for (const { label, w } of CHIP_DEFS) {
        cardChips.push({ label, w, x: chipAcc });
        chipAcc += w + 8;
    }

    // Tags cell (col3, row3): 2 chip rows
    const tagRow1Y = R3Y + C / 2 - 22;
    const tagRow2Y = R3Y + C / 2 + 4;
    const tagRow1W = 58 + 8 + 38; // design + css
    const tag1X = C3X + (C - tagRow1W) / 2;
    const tag2X = C3X + (C - 52) / 2;

    return (
        <Outer>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={`0 0 ${C * 3} ${C * 3}`}
                style={{ width: C * 3, height: C * 3 }}
            >
                {/* ── Cell grid lines ───────────────────────────── */}
                {/* Internal dividers within 2×2 card area */}
                <line
                    x1={C}
                    y1={0}
                    x2={C}
                    y2={R3Y}
                    stroke="rgba(201,168,76,0.1)"
                    strokeWidth={0.8}
                />
                <line
                    x1={0}
                    y1={C}
                    x2={C3X}
                    y2={C}
                    stroke="rgba(201,168,76,0.1)"
                    strokeWidth={0.8}
                />
                {/* Major dividers separating card from sub-component cells */}
                <line
                    x1={C3X}
                    y1={0}
                    x2={C3X}
                    y2={C * 3}
                    stroke="rgba(201,168,76,0.2)"
                    strokeWidth={0.8}
                />
                <line
                    x1={0}
                    y1={R3Y}
                    x2={C * 3}
                    y2={R3Y}
                    stroke="rgba(201,168,76,0.2)"
                    strokeWidth={0.8}
                />

                {/* ── Full card ─────────────────────────────────── */}
                <rect
                    x={CX}
                    y={CY}
                    width={CW}
                    height={CH}
                    rx={7}
                    fill="#131110"
                    stroke="rgba(201,168,76,0.2)"
                    strokeWidth={0.8}
                />

                {/* Avatar */}
                <circle
                    cx={AV_CX}
                    cy={AV_CY}
                    r={AV_R}
                    fill="rgba(201,168,76,0.1)"
                    stroke="rgba(201,168,76,0.3)"
                    strokeWidth={1}
                />
                <text
                    x={AV_CX}
                    y={AV_CY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontFamily={FONT}
                    fill={Colors.bright}
                    opacity={0.7}
                    fontWeight="bold"
                >
                    PC
                </text>

                {/* Name + role */}
                <text
                    x={NAME_X}
                    y={AV_CY - 9}
                    fontSize={13}
                    fontFamily={FONT}
                    fill={Colors.white}
                    fontWeight="bold"
                    style={{ letterSpacing: "0.01em" }}
                >
                    Product Card
                </text>
                <text
                    x={NAME_X}
                    y={AV_CY + 9}
                    fontSize={10}
                    fontFamily={FONT}
                    fill={Colors.dim}
                    style={{ letterSpacing: "0.05em" }}
                >
                    component preview
                </text>

                {/* Header divider */}
                <line
                    x1={CX + 1}
                    y1={CY + HH}
                    x2={CX + CW - 1}
                    y2={CY + HH}
                    stroke="rgba(201,168,76,0.12)"
                    strokeWidth={0.8}
                />

                {/* Description */}
                <text
                    x={CX + 18}
                    y={CY + HH + 28}
                    fontSize={10}
                    fontFamily={FONT}
                    fill={Colors.dim}
                    style={{ letterSpacing: "0.04em" }}
                >
                    Minimal description text for
                </text>
                <text
                    x={CX + 18}
                    y={CY + HH + 44}
                    fontSize={10}
                    fontFamily={FONT}
                    fill={Colors.dim}
                    style={{ letterSpacing: "0.04em" }}
                >
                    the component layout.
                </text>

                {/* Body divider */}
                <line
                    x1={CX + 1}
                    y1={CY + HH + BH}
                    x2={CX + CW - 1}
                    y2={CY + HH + BH}
                    stroke="rgba(201,168,76,0.12)"
                    strokeWidth={0.8}
                />

                {/* Chips */}
                {cardChips.map(({ label, w, x }) => (
                    <Chip
                        key={`card-${label}`}
                        x={x}
                        y={cardChipY}
                        w={w}
                        label={label}
                    />
                ))}

                {/* ── Avatar cell (col3, row1) ───────────────────── */}
                <circle
                    cx={C3X + C / 2}
                    cy={C / 2}
                    r={36}
                    fill="rgba(201,168,76,0.08)"
                    stroke="rgba(201,168,76,0.28)"
                    strokeWidth={1}
                />
                <text
                    x={C3X + C / 2}
                    y={C / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={16}
                    fontFamily={FONT}
                    fill={Colors.bright}
                    opacity={0.6}
                    fontWeight="bold"
                >
                    PC
                </text>
                <CellLabel cx={C3X + C / 2} cy={C - 12} label="avatar" />

                {/* ── Title cell (col3, row2) ────────────────────── */}
                <text
                    x={C3X + C / 2}
                    y={C + C / 2 - 10}
                    textAnchor="middle"
                    fontSize={12}
                    fontFamily={FONT}
                    fill={Colors.white}
                    fontWeight="bold"
                    style={{ letterSpacing: "0.01em" }}
                >
                    Product Card
                </text>
                <text
                    x={C3X + C / 2}
                    y={C + C / 2 + 8}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily={FONT}
                    fill={Colors.dim}
                    style={{ letterSpacing: "0.05em" }}
                >
                    component preview
                </text>
                <CellLabel cx={C3X + C / 2} cy={C * 2 - 12} label="title" />

                {/* ── Description cell (row3, col1–2) ───────────── */}
                <text
                    x={C3X / 2}
                    y={R3Y + C / 2 - 10}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily={FONT}
                    fill={Colors.dim}
                    style={{ letterSpacing: "0.04em" }}
                >
                    Minimal description text for
                </text>
                <text
                    x={C3X / 2}
                    y={R3Y + C / 2 + 8}
                    textAnchor="middle"
                    fontSize={10}
                    fontFamily={FONT}
                    fill={Colors.dim}
                    style={{ letterSpacing: "0.04em" }}
                >
                    the component layout.
                </text>
                <CellLabel cx={C3X / 2} cy={R3Y + C - 12} label="description" />

                {/* ── Tags cell (col3, row3) ─────────────────────── */}
                <Chip label="design" x={tag1X} y={tagRow1Y} w={58} />
                <Chip label="css" x={tag1X + 58 + 8} y={tagRow1Y} w={38} />
                <Chip label="react" x={tag2X} y={tagRow2Y} w={52} />
                <CellLabel cx={C3X + C / 2} cy={R3Y + C - 12} label="tags" />

                {/* ── Measurements ──────────────────────────────── */}

                {/* Ø 40px — avatar diameter, bracket above avatar inside card header */}
                <line
                    x1={AV_CX - AV_R}
                    y1={AV_CY - AV_R - 8}
                    x2={AV_CX + AV_R}
                    y2={AV_CY - AV_R - 8}
                    stroke={Colors.dim}
                    strokeWidth={0.7}
                />
                <line
                    x1={AV_CX - AV_R}
                    y1={AV_CY - AV_R - 13}
                    x2={AV_CX - AV_R}
                    y2={AV_CY - AV_R - 3}
                    stroke={Colors.dim}
                    strokeWidth={0.7}
                />
                <line
                    x1={AV_CX + AV_R}
                    y1={AV_CY - AV_R - 13}
                    x2={AV_CX + AV_R}
                    y2={AV_CY - AV_R - 3}
                    stroke={Colors.dim}
                    strokeWidth={0.7}
                />
                <text
                    x={AV_CX}
                    y={AV_CY - AV_R - 19}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={9}
                    fontFamily={FONT}
                    fill={Colors.dim}
                    style={{ letterSpacing: "0.5px" }}
                >
                    Ø 40px
                </text>

                {/* 18px — left padding, bracket from card edge to content inside body */}
                <HRuler x1={CX} x2={CX + 18} y={CY + HH + 68} label="18px" />

                {/* 96px / 108px — section heights as stacked pair, share tick at header/body boundary */}
                <VRuler
                    y1={CY}
                    y2={CY + HH}
                    x={CX + CW + 8}
                    label={`${HH}px`}
                />
                <VRuler
                    y1={CY + HH}
                    y2={CY + HH + BH}
                    x={CX + CW + 8}
                    label={`${BH}px`}
                />

                {/* 170px — one grid cell, top of right column */}
                <HRuler x1={C3X} x2={C3X + C} y={10} label="170px" />

                {/* 20px — chip height, right side of bottom chip in tags cell */}
                <VRuler
                    y1={tagRow2Y}
                    y2={tagRow2Y + 20}
                    x={tag2X + 52 + 8}
                    label="20px"
                />
            </svg>
        </Outer>
    );
};
