---
"@mochi-css/plugins": patch
---

Fix `createClassRemapPlugin` remapping user-authored class names. It now only remaps mochi-generated internal class names (those tracked in `classNameLiterals`), leaving raw selectors like `.ProseMirror` in `& .ProseMirror` untouched so users can target them.
