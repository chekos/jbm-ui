import * as React from "react";
import { color, font } from "../lib/tokens";

/** Display heading. 800 weight, tight tracking. `size` in px (56–170 in practice). */
export function Big({ children, size = 96, color: c = color.ink, style }: { children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ fontFamily: font.sans, fontSize: size, fontWeight: 800, color: c, lineHeight: 1.05, letterSpacing: -2, ...style }}>
      {children}
    </div>
  );
}
