import { FooterRoot, FooterLinks } from "./Footer.styled"

export function Footer() {
    return (
        <FooterRoot>
            <span>mochi.css — CSS-in-JS at build time</span>
            <FooterLinks>
                <a href="#">GitHub</a>
                <a href="#">Docs</a>
                <a href="#">Changelog</a>
            </FooterLinks>
        </FooterRoot>
    )
}
