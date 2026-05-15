import { HeroSection, HeroHeading, HeroParagraph, ButtonGroup } from "./Hero.styled"
import { Button } from "../components/Button"

export function Hero() {
    return (
        <HeroSection>
            <HeroHeading>CSS-in-JS without the runtime</HeroHeading>
            <HeroParagraph>
                Mochi extracts your styles at build time. Zero runtime overhead. Full type safety.
            </HeroParagraph>
            <ButtonGroup>
                <Button size="lg" variant="solid">Get Started</Button>
                <Button size="lg" variant="ghost">View on GitHub</Button>
            </ButtonGroup>
        </HeroSection>
    )
}
