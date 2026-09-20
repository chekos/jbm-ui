import * as React from "react";
import { color, font } from "../lib/tokens";

/** A short sentence in a filled pill: `accent` (vermilion), `ink`, or `outline` with accent2 for footnotes. */
export function Callout({ children, variant = "accent", size = 30, maxWidth, style }: { children: React.ReactNode; variant?: "accent" | "ink" | "note"; size?: number; maxWidth?: number; style?: React.CSSProperties }) {
  const v = {
    accent: { background: color.accent, color: color.bg, border: `2px solid ${color.accent}`, fontFamily: font.sans, padding: "14px 22px", borderRadius: 16 },
    ink: { background: color.ink, color: color.bg, border: `2px solid ${color.ink}`, fontFamily: font.mono, padding: "8px 14px", borderRadius: 10 },
    note: { background: "transparent", color: color.accent2, border: `2px solid ${color.accent2}`, fontFamily: font.mono, padding: "10px 18px", borderRadius: 12 },
  }[variant];
  return <div style={{ fontSize: size, display: "inline-block", lineHeight: 1.3, maxWidth, ...v, ...style }}>{children}</div>;
}
