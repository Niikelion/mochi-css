import "./global"
import { Root } from "./App.styled"
import { Navbar } from "./sections/Navbar"
import { Hero } from "./sections/Hero"
import { Stats } from "./sections/Stats"
import { Features } from "./sections/Features"
import { CodeShowcase } from "./sections/CodeShowcase"
import { ApiCarousel } from "./sections/ApiCarousel"
import { ComponentExplorer } from "./sections/ComponentExplorer"
import { Cta } from "./sections/Cta"
import { Footer } from "./sections/Footer"

export function App() {
    return (
        <Root>
            <Navbar />
            <Hero />
            <Stats />
            <Features />
            <CodeShowcase />
            <ApiCarousel />
            <ComponentExplorer />
            <Cta />
            <Footer />
        </Root>
    )
}
