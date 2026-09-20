import * as React from "react";
import { color, font } from "../lib/tokens";

/** Section kicker: uppercase, tracked, muted. Sits top-left of every scene and above page sections. */
export function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontFamily: font.sans, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: color.dim, fontWeight: 600, ...style }}>
      {children}
    </div>
  );
}
