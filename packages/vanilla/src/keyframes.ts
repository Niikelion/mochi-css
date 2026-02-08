import { KeyframesObject, type KeyframeStops } from "@/keyframesObject"
export type { KeyframeStops } from "@/keyframesObject"

export class MochiKeyframes {
    constructor(public readonly name: string) {}

    toString(): string {
        return this.name
    }

    get value(): string {
        return this.name
    }

    static from(object: KeyframesObject): MochiKeyframes {
        return new MochiKeyframes(object.name)
    }
}

export function keyframes(stops: KeyframeStops): MochiKeyframes {
    return MochiKeyframes.from(new KeyframesObject(stops))
}
