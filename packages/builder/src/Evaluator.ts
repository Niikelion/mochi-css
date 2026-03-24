import { Runner } from "@/Runner"
import SWC from "@swc/core"

const trackerName = "__mochi__trackValue"

type ExpType = SWC.Expression["type"]
type Exp<N extends ExpType> = SWC.Expression & { type: N }

const emptySpan: SWC.Span = { start: 0, end: 0, ctxt: 0 }

function exp<N extends ExpType>(name: N, node: Omit<Exp<N>, "type" | "span">): Exp<N> {
    return {
        ...node,
        type: name,
        span: emptySpan,
    } as Exp<N>
}

export class Evaluator {
    private nextId = 0
    private readonly values = new Map<number, unknown>()
    private readonly astToIdMapping = new Map<SWC.Expression, number>()

    get freshId() {
        return this.nextId++
    }

    constructor(private readonly runner: Runner) {}

    reset() {
        this.nextId = 0
        this.values.clear()
        this.astToIdMapping.clear()
    }

    valueWithTracking(expression: SWC.Expression) {
        const freshId = this.freshId

        const callee: SWC.Identifier = {
            type: "Identifier",
            span: emptySpan,
            ctxt: 0,
            value: trackerName,
            optional: false,
        }
        const ret: SWC.CallExpression & { ctxt: number } = {
            type: "CallExpression",
            span: emptySpan,
            ctxt: 0,
            callee,
            arguments: [{ expression: exp("NumericLiteral", { value: freshId }) }, { expression: expression }],
        }

        this.astToIdMapping.set(ret, freshId)

        return ret
    }

    getTrackedValue(expression: SWC.Expression): unknown {
        const id = this.astToIdMapping.get(expression)
        if (id === undefined) return undefined
        return this.values.get(id)
    }

    async evaluate(code: string, context: Record<string, unknown>) {
        const interceptedValues = new Map<number, unknown>()

        function tracker(id: number, value: unknown) {
            interceptedValues.set(id, value)
            return value
        }

        await this.runner.execute(code, { ...context, [trackerName]: tracker })
        for (const [key, value] of interceptedValues.entries()) {
            this.values.set(key, value)
        }
    }
}
