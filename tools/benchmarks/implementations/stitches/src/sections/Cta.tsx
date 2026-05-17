import { CtaSection, CtaParagraph, ButtonGroup } from "./Cta.styled"
import { Button } from "../components/Button"
import { Heading } from "../components/Heading"

export function Cta() {
    return (
        <CtaSection>
            <Heading as="h2" size="md" color="gold">Ready to get started?</Heading>
            <CtaParagraph>
                Install with your package manager and start writing styles in minutes.
            </CtaParagraph>
            <ButtonGroup>
                <Button size="lg" variant="solid">Install now</Button>
                <Button size="lg" variant="outline">Read the docs</Button>
                <Button size="lg" variant="ghost">View examples</Button>
            </ButtonGroup>
        </CtaSection>
    )
}
