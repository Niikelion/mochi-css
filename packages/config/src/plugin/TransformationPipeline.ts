type Transformation<T, Args extends unknown[]> = (value: T, ...args: Args) => T | Promise<T>

export interface TransformationHookProvider<T, Args extends unknown[] = [], Data = void> {
    registerTransformation(transformation: Transformation<T, Args>, data: Data): void
}

export interface TransformationUser<T, Args extends unknown[] = []> {
    transform(value: T, ...args: Args): Promise<T>
}

export class TransformationPipeline<T, Args extends unknown[] = []>
    implements TransformationHookProvider<T, Args>, TransformationUser<T, Args>
{
    private readonly transformations: Transformation<T, Args>[] = []

    registerTransformation(transformation: Transformation<T, Args>): void {
        this.transformations.push(transformation)
    }

    async transform(value: T, ...args: Args): Promise<T> {
        let ret = value

        for (const transformation of this.transformations) {
            ret = await transformation(ret, ...args)
        }

        return ret
    }

    getTransformations() {
        return [...this.transformations]
    }
}

export function makePipeline<T, Args extends unknown[] = []>(transformations: Transformation<T, Args>[]) {
    const ret = new TransformationPipeline<T, Args>()

    for (const transformation of transformations) {
        ret.registerTransformation(transformation)
    }

    return ret
}

type TransformationWithContext<T, Args extends unknown[], Data> = { fn: Transformation<T, Args>; ctx: Data }

export type TransformationFilter<Data, Args extends unknown[]> = (this: void, data: Data, ...args: Args) => boolean

export class FilteredTransformationPipeline<T, Data, Args extends unknown[] = []>
    implements TransformationHookProvider<T, Args, Data>, TransformationUser<T, Args>
{
    private readonly transformations: TransformationWithContext<T, Args, Data>[] = []

    constructor(private filter: TransformationFilter<Data, Args>) {}

    registerTransformation(transformation: Transformation<T, Args>, data: Data): void {
        this.transformations.push({ fn: transformation, ctx: data })
    }

    async transform(value: T, ...args: Args): Promise<T> {
        let ret = value

        for (const transformation of this.transformations) {
            if (!this.filter(transformation.ctx, ...args)) continue

            ret = await transformation.fn(ret, ...args)
        }

        return ret
    }

    getTransformations() {
        return [...this.transformations]
    }
}

export function makeFilteredPipeline<T, Data, Args extends unknown[] = []>(
    filter: TransformationFilter<Data, Args>,
    transformations: TransformationWithContext<T, Args, Data>[],
) {
    const ret = new FilteredTransformationPipeline<T, Data, Args>(filter)

    for (const transformation of transformations) {
        ret.registerTransformation(transformation.fn, transformation.ctx)
    }

    return ret
}
