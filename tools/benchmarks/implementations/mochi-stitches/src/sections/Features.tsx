import { FeaturesSection, FeaturesHeading, FeaturesGrid, FeatureHeading, FeatureBody } from "./Features.styled"
import { Card } from "../components/Card"

const FEATURES = [
    { title: "Zero runtime", body: "Styles are extracted at build time. No JavaScript parsing CSS in the browser." },
    { title: "TypeScript native", body: "Full type safety for your styles, variants, and design tokens." },
    { title: "Stitches compatible", body: "Migrate from Stitches with minimal changes. Same API, better performance." },
    { title: "Framework agnostic", body: "Works with Vite, Next.js, and more. Bring your own framework." },
]

export function Features() {
    return (
        <FeaturesSection>
            <FeaturesHeading>Why Mochi?</FeaturesHeading>
            <FeaturesGrid>
                {FEATURES.map(f => (
                    <Card key={f.title}>
                        <FeatureHeading>{f.title}</FeatureHeading>
                        <FeatureBody>{f.body}</FeatureBody>
                    </Card>
                ))}
            </FeaturesGrid>
        </FeaturesSection>
    )
}
