import * as React from "react";
import { color, font, shadowLayers } from "../lib/tokens";

/**
 * Paper cut-out primitives. A `Paper` is a flat shape that reads as a piece of card stock laid on the
 * cream canvas: a fine ink edge, no gradient, and the house layered shadow with a slightly longer drop
 * so it lifts off the page. `tone` picks the stock: cream paper, vermilion (sticky note), or ink.
 * Pure React; wrap in a motion `Pop` for entrances.
 */
export type PaperTone = "paper" | "accent" | "ink";

export const paperShadow = [
  ...shadowLayers.card.contact,
  ...shadowLayers.card.ambient,
  "0 18px 28px -14px rgba(32,36,31,0.22)",
].join(", ");

export const paperFill = (tone: PaperTone) => (tone === "accent" ? color.accent : tone === "ink" ? color.ink : color.card);
export const paperInk = (tone: PaperTone) => (tone === "paper" ? color.ink : color.bg);

export function Paper({
  tone = "paper",
  w,
  h,
  radius = 22,
  rotate = 0,
  edge = true,
  shadow = true,
  style,
  children,
}: {
  tone?: PaperTone;
  w?: number;
  h?: number;
  radius?: number;
  rotate?: number;
  edge?: boolean;
  shadow?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: paperFill(tone),
        border: edge ? `2px solid ${tone === "paper" ? color.ink : paperFill(tone)}` : "none",
        borderRadius: radius,
        boxShadow: shadow ? paperShadow : "none",
        boxSizing: "border-box",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A slanted vermilion (or ink) sticky note with one line of display type. The loud word of a scene. */
export function Sticker({
  children,
  tone = "accent",
  size = 72,
  rotate = -5,
  mono,
  style,
}: {
  children: React.ReactNode;
  tone?: PaperTone;
  size?: number;
  rotate?: number;
  mono?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Paper tone={tone} rotate={rotate} radius={Math.round(size * 0.22)} edge={tone === "paper"} style={{ display: "inline-block", padding: `${Math.round(size * 0.18)}px ${Math.round(size * 0.4)}px`, ...style }}>
      <div style={{ fontFamily: mono ? font.mono : font.sans, fontSize: size, fontWeight: 800, letterSpacing: mono ? 0 : -size * 0.02, lineHeight: 1.05, color: paperInk(tone), whiteSpace: "nowrap" }}>{children}</div>
    </Paper>
  );
}

/** Small lowercase caption under an illustration: sans 600, ink. */
export function Caption({ children, size = 34, dim, style }: { children: React.ReactNode; size?: number; dim?: boolean; style?: React.CSSProperties }) {
  return <div style={{ fontFamily: font.sans, fontSize: size, fontWeight: 600, color: dim ? color.dim : color.ink, lineHeight: 1.2, textAlign: "center", ...style }}>{children}</div>;
}
