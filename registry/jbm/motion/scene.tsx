import * as React from "react";
import { color } from "../lib/tokens";

/** Full-bleed frame with the canvas colour. One per scene, inside a Remotion Sequence. */
export function Scene({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ position: "absolute", inset: 0, background: color.bg, overflow: "hidden", ...style }}>{children}</div>;
}
