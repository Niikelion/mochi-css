import { NavbarRoot, Logo, NavLinks } from "./Navbar.styled"
import { Button } from "../components/Button"

export function Navbar() {
    return (
        <NavbarRoot>
            <Logo>mochi.css</Logo>
            <NavLinks>
                <a href="#">Docs</a>
                <a href="#">Examples</a>
                <a href="#">GitHub</a>
            </NavLinks>
            <Button size="sm">Get Started</Button>
        </NavbarRoot>
    )
}
