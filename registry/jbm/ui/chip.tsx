import * as React from "react";
import { color, font, radius } from "../lib/tokens";

/** Pill. Outline by default; `accent` fills vermilion; `solid` fills ink; `mono` switches the face. */
export function Chip({ children, accent, solid, mono, size = 26, style }: { children: React.ReactNode; accent?: boolean; solid?: boolean; mono?: boolean; size?: number; style?: React.CSSProperties }) {
  const filled = accent || solid;
  return (
    <div
      style={{
        fontFamily: mono ? font.mono : font.sans,
        fontSize: size,
        fontWeight: 600,
        color: filled ? color.bg : color.ink,
        background: accent ? color.accent : solid ? color.ink : color.card,
        border: `2px solid ${accent ? color.accent : solid ? color.ink : color.line}`,
        padding: "10px 20px",
        borderRadius: radius.chip,
        whiteSpace: "nowrap",
        display: "inline-block",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
