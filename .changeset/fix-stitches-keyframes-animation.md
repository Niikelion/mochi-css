---
"@mochi-css/stitches": patch
---

Fix keyframes animation name in `StitchesKeyframesGenerator`. `mockFunction` was returning a `MochiKeyframes` object which `wrapGenerator` spread into a plain object, losing `toString()`. Template literals then produced `[object Object]` instead of the keyframe name in generated CSS.
