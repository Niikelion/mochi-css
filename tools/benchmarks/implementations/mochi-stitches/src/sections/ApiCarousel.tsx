import { useState } from "react"
import { CarouselSection, CarouselInner, CarouselHeading, TabBar, Tab } from "./ApiCarousel.styled"
import { Pre } from "../components/Pre"

type TabKey = "styled" | "css" | "keyframes" | "globalCss"

const TABS: TabKey[] = ["styled", "css", "keyframes", "globalCss"]

const SNIPPETS: Record<TabKey, string> = {
    styled: `const Button = styled('button', {
  padding: '8px 16px',
  borderRadius: 4,
  variants: {
    variant: {
      solid: { background: '#c9a84c' },
      ghost: { background: 'transparent' },
    },
  },
  defaultVariants: { variant: 'solid' },
})`,
    css: `const heading = css({
  fontSize: '36px',
  fontWeight: 700,
  color: '#e8e0cc',
  variants: {
    size: {
      sm: { fontSize: '20px' },
      lg: { fontSize: '64px' },
    },
  },
})`,
    keyframes: `const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-8px)' },
  to:   { opacity: 1, transform: 'translateY(0)' },
})

const Hero = styled('div', {
  animation: \`\${fadeIn} 0.6s ease-out\`,
})`,
    globalCss: `globalCss({
  '*, *::before, *::after': {
    boxSizing: 'border-box',
    margin: 0, padding: 0,
  },
  body: {
    background: '#131110',
    color: '#e8e0cc',
    fontFamily: "'IBM Plex Mono', monospace",
  },
})`,
}

export function ApiCarousel() {
    const [activeTab, setActiveTab] = useState<TabKey>("styled")

    return (
        <CarouselSection>
            <CarouselInner>
                <CarouselHeading>Explore the API</CarouselHeading>
                <TabBar>
                    {TABS.map(tab => (
                        <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                            {tab}
                        </Tab>
                    ))}
                </TabBar>
                <Pre><code>{SNIPPETS[activeTab]}</code></Pre>
            </CarouselInner>
        </CarouselSection>
    )
}
