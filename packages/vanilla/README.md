# Mochi-CSS/vanilla

This package is part of the [Mochi-CSS project](https://github.com/Niikelion/mochi-css).
It provides type-safe CSS-in-JS styling functions with static extraction support, allowing you to write styles in TypeScript that get extracted to plain CSS at build time.

## Functions

### `css(...styles)`

`css` is the fundamental styling function of Mochi-CSS.
It takes style definitions as parameters, marks them for static extraction and returns class names to apply on elements.

```tsx
import {css} from "@mochi-css/vanilla"

const buttonStyles = css({
    borderRadius: 10,
    border: "2px solid red"
})

// Use in JSX
const button = <button className={buttonStyles}>Click me</button>
```

Output of the `css` function is also a valid style definition, so you can split your styles:

```ts
const textStyles = css({
    color: "green"
})

const buttonStyles = css(textStyles, {
    borderRadius: 10,
    border: "2px solid red"
})
```

### `styled(component, ...styles)`

`styled` creates a styled component by combining a base element or component with style definitions. It automatically applies the generated class names and forwards variant props.

```tsx
import {styled} from "@mochi-css/vanilla"

const Button = styled("button", {
    borderRadius: 10,
    border: "2px solid red"
})
```

## Style definitions

A style definition is either a bundle of styles returned by `css`, or an object containing:

* any number of valid CSS properties converted to camelCase, like in React's style property
* any number of CSS variable assignments (see [Tokens](#tokens))
* optional variants definition
* optional default variants definition

## Nested Selectors

Mochi-CSS supports nested selectors, allowing you to define styles for child elements, pseudo-classes, and pseudo-elements directly within your style definitions.

The `&` character represents the parent selector and must be included in every nested selector:

```ts
import { css } from "@mochi-css/vanilla"

const buttonStyle = css({
    backgroundColor: "blue",
    color: "white",

    // Pseudo-classes
    "&:hover": {
        backgroundColor: "darkblue"
    },
    "&:active": {
        backgroundColor: "navy"
    },
    "&:disabled": {
        backgroundColor: "gray",
        cursor: "not-allowed"
    },

    // Pseudo-elements
    "&::before": {
        content: '""',
        display: "block"
    },

    // Child selectors
    "& > span": {
        fontWeight: "bold"
    },

    // Descendant selectors
    "& p": {
        margin: 0
    },

    // Compound selectors (when element also has another class)
    "&.active": {
        borderColor: "green"
    },

    // Adjacent sibling
    "& + &": {
        marginTop: 8
    }
})
```

### Selector Position

The `&` can appear anywhere in the selector, allowing for flexible parent-child relationships:

```ts
const linkStyle = css({
    color: "blue",

    // Parent context: style this element when inside .dark-mode
    ".dark-mode &": {
        color: "lightblue"
    },

    // Multiple parent contexts
    "nav &, footer &": {
        textDecoration: "underline"
    }
})
```

## Media Selectors

Media selectors allow you to apply styles conditionally based on viewport size, color scheme preferences, and other media features. Media selectors start with the `@` symbol and are compiled into CSS media queries:

```ts
import { css } from "@mochi-css/vanilla"

const responsiveContainer = css({
    display: "flex",
    flexDirection: "row",
    padding: 32,

    // Responsive breakpoints
    "@max-width: 768px": {
        flexDirection: "column",
        padding: 16
    },

    "@max-width: 480px": {
        padding: 8
    },

    // Modern range syntax
    "@width <= 1024px": {
        gap: 16
    },

    // Color scheme preferences
    "@prefers-color-scheme: dark": {
        backgroundColor: "#1a1a1a",
        color: "white"
    },

    // Reduced motion
    "@prefers-reduced-motion: reduce": {
        transition: "none"
    }
})
```

### Combined Media Selectors

You can combine multiple media conditions using `and` and `not` operators:

```ts
const responsiveLayout = css({
    display: "grid",
    gridTemplateColumns: "1fr",

    // Screen media type with width condition
    "@screen and (width > 1000px)": {
        gridTemplateColumns: "1fr 1fr"
    },

    // Multiple conditions with 'and'
    "@screen and (min-width: 768px) and (max-width: 1024px)": {
        gridTemplateColumns: "1fr 1fr",
        gap: 16
    },

    // Print styles
    "@print": {
        display: "block"
    },

    // Combining media type with preference
    "@screen and (not (prefers-color-scheme: dark))": {
        backgroundColor: "#121212"
    }
})
```

### Combining Nested Selectors with Media Selectors

Nested selectors and media selectors can be combined for fine-grained control:

```ts
const buttonStyle = css({
    backgroundColor: "blue",

    "&:hover": {
        backgroundColor: "darkblue",

        // Media selector inside nested selector
        "@width <= 480px": {
            // Disable hover effects on mobile (touch devices)
            backgroundColor: "blue"
        }
    },

    // Media selector with nested selectors inside
    "@max-width: 768px": {
        padding: 8,

        "& > span": {
            display: "none"
        }
    }
})
```

### Using with Variants

Nested selectors and media selectors work seamlessly inside variant definitions:

```ts
const cardStyle = css({
    padding: 16,
    borderRadius: 8,

    variants: {
        size: {
            small: {
                padding: 8,
                "@max-width: 480px": {
                    padding: 4
                }
            },
            large: {
                padding: 32,
                "@max-width: 480px": {
                    padding: 16
                }
            }
        },
        interactive: {
            true: {
                cursor: "pointer",
                "&:hover": {
                    transform: "translateY(-2px)"
                }
            },
            false: {}
        }
    },
    defaultVariants: {
        size: "small",
        interactive: false
    }
})
```

## Variants

You may want to create multiple variants of a button that share a common base style:

```ts
import {css} from "@mochi-css/vanilla"

const baseButtonStyle = css({
    border: "2px solid black",
    color: "black",
    backgroundColor: "white"
})

const redButtonStyle = css(baseButtonStyle, {
    backgroundColor: "red"
})
```

This works, but requires you to either manually select which style to apply in your component logic, or create separate components for each variant.
Mochi-CSS allows you to define variants directly in your style definition and automatically generates the corresponding props for your component.

```tsx
import {styled, css} from "@mochi-css/vanilla"

const buttonStyle = css({
    border: "2px solid black",
    color: "black",
    backgroundColor: "white",
    variants: {
        color: {
            white: {
                backgroundColor: "white"
            },
            red: {
                backgroundColor: "red"
            }
        }
    },
    defaultVariants: {
        color: "white"
    }
})

const Button = styled("button", buttonStyle)

const SomeComponent = () => <div>
    <Button>White button</Button>
    <Button color="red">Red button</Button>
</div>
```

`defaultVariants` is optional, but specifying defaults for all variants ensures predictable styling when variant props are omitted.

## Tokens

Mochi-CSS provides typed wrappers around CSS variables to help with type safety. Tokens ensure that only valid values are assigned to your CSS variables.

Create tokens using the `createToken<T>(name)` function, where `T` is a CSS value type like `CssColorLike`, `CssLengthLike`, or `string`:

```ts
import {createToken, css, CssColorLike} from "@mochi-css/vanilla"

const primaryColor = createToken<CssColorLike>("primaryColor")
const secondaryColor = createToken<CssColorLike>("secondaryColor")
const buttonColor = createToken<CssColorLike>("buttonColor")

const buttonStyle = css({
    backgroundColor: buttonColor,
    variants: {
        variant: {
            primary: {
                [buttonColor.variable]: primaryColor
            },
            secondary: {
                [buttonColor.variable]: secondaryColor
            }
        }
    },
    defaultVariants: {
        variant: "primary"
    }
})
```

Tokens can be used in two ways:
- **As values**: Use the token directly (e.g., `backgroundColor: buttonColor`) to reference the CSS variable
- **As keys**: Use `token.variable` (e.g., `[buttonColor.variable]: primaryColor`) to assign a value to the CSS variable

## Keyframes

The `keyframes` function lets you define CSS animations using the same type-safe syntax as style definitions.

### Basic Usage

Define animation stops using `from`/`to` or percentage keys:

```ts
import { keyframes, css } from "@mochi-css/vanilla"

const fadeIn = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 }
})

const fadeInStyle = css({
    animation: `${fadeIn} 0.3s ease`
})
```

### Percentage Stops

For more control over animation timing, use percentage-based stops:

```ts
import { keyframes, css } from "@mochi-css/vanilla"

const bounce = keyframes({
    "0%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-20px)" },
    "100%": { transform: "translateY(0)" }
})

const bouncingElement = css({
    animation: `${bounce} 1s ease-in-out infinite`
})
```

### Multiple Properties

Each stop can contain multiple CSS properties with auto-units:

```ts
import { keyframes } from "@mochi-css/vanilla"

const grow = keyframes({
    from: {
        opacity: 0,
        transform: "scale(0.5)",
        fontSize: 12  // becomes 12px
    },
    to: {
        opacity: 1,
        transform: "scale(1)",
        fontSize: 24  // becomes 24px
    }
})
```
