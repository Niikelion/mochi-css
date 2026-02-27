import { describe, it, expect } from "vitest"
import { keyframes, MochiKeyframes } from "@/keyframes"
import { KeyframesObject } from "@/keyframesObject"

describe("MochiKeyframes", () => {
    it("should be constructible from KeyframesObject", () => {
        const obj = new KeyframesObject({ from: { opacity: 0 }, to: { opacity: 1 } })
        const kf = MochiKeyframes.from(obj)
        expect(kf.name).toEqual(obj.name)
    })

    it("toString() should return the name", () => {
        const kf = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        expect(kf.toString()).toEqual(kf.name)
        expect(`${kf} 0.3s ease`).toEqual(`${kf.name} 0.3s ease`)
    })

    it(".value should return the name", () => {
        const kf = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        expect(kf.value).toEqual(kf.name)
    })
})

describe("keyframes", () => {
    it("should return a MochiKeyframes instance", () => {
        const kf = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        expect(kf).toBeInstanceOf(MochiKeyframes)
    })

    it("should produce deterministic names", () => {
        const kf1 = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        const kf2 = keyframes({ from: { opacity: 0 }, to: { opacity: 1 } })
        expect(kf1.name).toEqual(kf2.name)
    })
})
