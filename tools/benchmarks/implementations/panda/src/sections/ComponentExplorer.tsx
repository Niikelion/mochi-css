import { useState } from "react"
import {
    ExplorerSection, ExplorerInner, ExplorerHeading, ExplorerGrid,
    PlaygroundCard, PlaygroundCardHeading, PreviewBox,
    ControlRow, ControlLabel, ControlSelect, FrameItem,
} from "./ComponentExplorer.styled"
import { Button } from "../components/Button"
import { Frame } from "../components/Frame"

type Align = "start" | "center" | "end"

export function ComponentExplorer() {
    const [btnVariant, setBtnVariant] = useState<"solid" | "outline" | "ghost">("solid")
    const [btnSize, setBtnSize] = useState<"sm" | "md" | "lg">("md")
    const [btnColor, setBtnColor] = useState<"gold" | "neutral" | "danger">("gold")
    const [frameDir, setFrameDir] = useState<"row" | "col">("row")
    const [frameAlignX, setFrameAlignX] = useState<Align>("start")
    const [frameAlignY, setFrameAlignY] = useState<Align>("start")

    return (
        <ExplorerSection>
            <ExplorerInner>
                <ExplorerHeading>Component Explorer</ExplorerHeading>
                <ExplorerGrid>
                    <PlaygroundCard>
                        <PlaygroundCardHeading>Button</PlaygroundCardHeading>
                        <PreviewBox>
                            <Button variant={btnVariant} size={btnSize} color={btnColor}>
                                Preview
                            </Button>
                        </PreviewBox>
                        <ControlRow>
                            <ControlLabel>Variant</ControlLabel>
                            <ControlSelect value={btnVariant} onChange={e => setBtnVariant(e.target.value as typeof btnVariant)}>
                                <option value="solid">solid</option>
                                <option value="outline">outline</option>
                                <option value="ghost">ghost</option>
                            </ControlSelect>
                            <ControlLabel>Size</ControlLabel>
                            <ControlSelect value={btnSize} onChange={e => setBtnSize(e.target.value as typeof btnSize)}>
                                <option value="sm">sm</option>
                                <option value="md">md</option>
                                <option value="lg">lg</option>
                            </ControlSelect>
                            <ControlLabel>Color</ControlLabel>
                            <ControlSelect value={btnColor} onChange={e => setBtnColor(e.target.value as typeof btnColor)}>
                                <option value="gold">gold</option>
                                <option value="neutral">neutral</option>
                                <option value="danger">danger</option>
                            </ControlSelect>
                        </ControlRow>
                    </PlaygroundCard>
                    <PlaygroundCard>
                        <PlaygroundCardHeading>Frame</PlaygroundCardHeading>
                        <PreviewBox>
                            <Frame direction={frameDir} alignX={frameAlignX} alignY={frameAlignY}>
                                <FrameItem>A</FrameItem>
                                <FrameItem>B</FrameItem>
                                <FrameItem>C</FrameItem>
                            </Frame>
                        </PreviewBox>
                        <ControlRow>
                            <ControlLabel>Direction</ControlLabel>
                            <ControlSelect value={frameDir} onChange={e => setFrameDir(e.target.value as typeof frameDir)}>
                                <option value="row">row</option>
                                <option value="col">col</option>
                            </ControlSelect>
                            <ControlLabel>Align X</ControlLabel>
                            <ControlSelect value={frameAlignX} onChange={e => setFrameAlignX(e.target.value as typeof frameAlignX)}>
                                <option value="start">start</option>
                                <option value="center">center</option>
                                <option value="end">end</option>
                            </ControlSelect>
                            <ControlLabel>Align Y</ControlLabel>
                            <ControlSelect value={frameAlignY} onChange={e => setFrameAlignY(e.target.value as typeof frameAlignY)}>
                                <option value="start">start</option>
                                <option value="center">center</option>
                                <option value="end">end</option>
                            </ControlSelect>
                        </ControlRow>
                    </PlaygroundCard>
                </ExplorerGrid>
            </ExplorerInner>
        </ExplorerSection>
    )
}
