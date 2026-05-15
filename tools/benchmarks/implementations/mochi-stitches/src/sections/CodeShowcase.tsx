import { CodeSection, CodeSectionInner, CodeHeading } from "./CodeShowcase.styled"
import { Pre } from "../components/Pre"

const SNIPPET = `const Button = styled('button', {
  padding: '8px 16px',
  borderRadius: 4,
  variants: {
    variant: {
      solid: { background: '#c9a84c' },
      ghost: { background: 'transparent' },
    },
  },
  defaultVariants: { variant: 'solid' },
})`

export function CodeShowcase() {
    return (
        <CodeSection>
            <CodeSectionInner>
                <CodeHeading>Simple by design</CodeHeading>
                <Pre>
                    <code>{SNIPPET}</code>
                </Pre>
            </CodeSectionInner>
        </CodeSection>
    )
}
