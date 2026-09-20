import * as React from "react";
import { color, font } from "../lib/tokens";

/** tacos·de·datos lockup with an optional tagline. */
export function Brand({ tagline, size = 56, style }: { tagline?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ textAlign: "center", ...style }}>
      <div style={{ fontFamily: font.mono, fontSize: size, fontWeight: 700, color: color.ink }}>
        tacos<span style={{ color: color.accent }}>de</span>datos
      </div>
      {tagline ? <div style={{ fontFamily: font.sans, fontSize: Math.round(size * 0.46), color: color.dim, marginTop: 10 }}>{tagline}</div> : null}
    </div>
  );
}
