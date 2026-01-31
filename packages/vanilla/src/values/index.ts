export type CssVar = `--${string}`
export type CssVarVal = `var(${CssVar})`

export type CssLikeObject<T> = { get value(): T }
export type CssLike<T> = T | CssLikeObject<T>
