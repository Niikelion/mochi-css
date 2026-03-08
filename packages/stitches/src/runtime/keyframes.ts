import {
    keyframes as vanillaKeyframes,
    MochiKeyframes,
    KeyframeStops,
} from "@mochi-css/vanilla";

export function runtimeKeyframes(stops: KeyframeStops): MochiKeyframes {
    return vanillaKeyframes(stops);
}
