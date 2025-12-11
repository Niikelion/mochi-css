# Mochi-CSS/vanilla

This package is part of [Mochi-CSS project](https://github.com/Niikelion/mochi-css) that provides styling functions and type definitions.

## Functions

### `css(...styles)`

`css` is the fundamental styling function of Mochi-CSS.
It takes style definitions as parameters, marks them for static extraction and returns class names to apply on elements.

```ts
import {css} from "@mochi-css/vanilla"

const buttonStyles = css({
    borderRadius: 10,
    border: "10px solid red"
})

console.log(`${buttonStyles}`)
```

Output of the `css` function is also a valid style definition, so you can split your styles:

```ts
const textStyles = css({
    color: "green"
})

const buttonStyles = css(textStyles, {
    borderRadius: 10,
    border: "10px solid red"
})
```

### `styled(component, ...styles)`

`styled`  is just a simple wrapper around `css` that takes a component as the first argument and applies all the classnames for you.

```tsx
import {styled} from "@mochi-css/vanilla"

const Button = styled("button", {
    borderRadius: 10,
    border: "10px solid red"
})
```

## Style definitions

Now, that we know how to use our style definitions, we probably should learn how to write them, right?
Style definition is either bundle of styles returned by `css` or object containing:

* any number of valid css properties converted to camelCase, like in reacts styles property
* any number of css variable assignments, more on that later
* optional variants definition
* optional default variants definition

In the future, nested css selectors and media queries will be available as parts of style definitions

## Variants

You may want to create many variants of a button, with a shared set of css:

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

This works, but now, either you have to wrap your component manually and decide which style to apply or use different components.
To make the code simpler and cleaner, Mochi-CSS allows you to specify variants inside the style definition, and even handles variant params for you!

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

`defaultVariants` is optional, but we recommend that you specify defaults for all the variants.

## Tokens

To help with type safety, Mochi-CSS provides typed wrappers around concept of css variables.
Variables can be created using `createToken<T>(name)` function:

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

As you can see, tokens can be used as css values and as keys in style definition objects.
