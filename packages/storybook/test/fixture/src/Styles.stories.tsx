import React from "react";
import { css, globalCss } from "@mochi-css/vanilla";

globalCss({ body: { letterSpacing: "3px" } });
const box = css({ width: "137px", color: "rebeccapurple" });

export default { title: "Mochi/Styles" };
export const Styled = {
    render: () => <div className={box.variant({})}>Extracted styles</div>,
};
