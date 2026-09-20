import * as React from "react";
import { color, font } from "../lib/tokens";
import { Paper, paperShadow, type PaperTone } from "./paper";

/**
 * Illustrated interface pieces, drawn as paper cut-outs with ink line art: a button, a text input, a
 * card, a phone frame, a badge, and three design-token glyphs (color, type, spacing). They stand in
 * for "a button", "a card", "an input" when the subject of a scene is the interface itself.
 * Every piece takes `w` (and `h` when it is not implied); pure React, no timeline.
 */

export type PieceKind = "button" | "input" | "card";
export type TokenKind = "color" | "type" | "space";

/** Rounded pill with a short label bar. `tone` ink (default), accent, or paper (outline). */
export function UiButton({ w = 220, h = 70, tone = "ink", style }: { w?: number; h?: number; tone?: PaperTone; style?: React.CSSProperties }) {
  const bar = tone === "paper" ? color.ink : color.bg;
  return (
    <Paper tone={tone} w={w} h={h} radius={h / 2} style={{ display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
      <div style={{ width: w * 0.42, height: Math.max(6, h * 0.13), borderRadius: 99, background: bar }} />
    </Paper>
  );
}

/** Outlined field with a placeholder bar and a text cursor. `cursorOn` blinks it from the timeline. */
export function UiInput({ w = 220, h = 70, cursorOn = true, style }: { w?: number; h?: number; cursorOn?: boolean; style?: React.CSSProperties }) {
  const pad = Math.round(h * 0.28);
  return (
    <Paper tone="paper" w={w} h={h} radius={Math.round(h * 0.22)} style={{ display: "flex", alignItems: "center", gap: Math.round(h * 0.14), padding: `0 ${pad}px`, ...style }}>
      <div style={{ width: 3, height: h * 0.5, background: color.ink, opacity: cursorOn ? 1 : 0, borderRadius: 2 }} />
      <div style={{ width: w * 0.45, height: Math.max(6, h * 0.12), borderRadius: 99, background: color.line }} />
    </Paper>
  );
}

/** Card with a picture slot (line-art hills and sun) and two text bars. */
export function UiCard({ w = 220, h = 170, style }: { w?: number; h?: number; style?: React.CSSProperties }) {
  const pad = Math.round(w * 0.07);
  const imgH = Math.round(h * 0.5);
  const iw = w - pad * 2;
  return (
    <Paper tone="paper" w={w} h={h} radius={Math.round(w * 0.08)} style={{ padding: pad, display: "flex", flexDirection: "column", gap: Math.round(h * 0.07), ...style }}>
      <svg width={iw} height={imgH} viewBox={`0 0 ${iw} ${imgH}`} style={{ display: "block" }}>
        <rect x={2} y={2} width={iw - 4} height={imgH - 4} rx={Math.round(w * 0.04)} fill="none" stroke={color.ink} strokeWidth={3} />
        <circle cx={iw * 0.72} cy={imgH * 0.32} r={imgH * 0.11} fill={color.accent} />
        <path d={`M ${iw * 0.08} ${imgH * 0.86} L ${iw * 0.36} ${imgH * 0.42} L ${iw * 0.52} ${imgH * 0.66} L ${iw * 0.62} ${imgH * 0.54} L ${iw * 0.92} ${imgH * 0.86}`} fill="none" stroke={color.ink} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div style={{ width: iw * 0.72, height: Math.max(6, h * 0.075), borderRadius: 99, background: color.ink }} />
      <div style={{ width: iw * 0.48, height: Math.max(5, h * 0.06), borderRadius: 99, background: color.line }} />
    </Paper>
  );
}

/** Any of the three pieces by name, at a width; height follows the piece's own proportion. */
export function Piece({ kind, w, tone, cursorOn, style }: { kind: PieceKind; w: number; tone?: PaperTone; cursorOn?: boolean; style?: React.CSSProperties }) {
  if (kind === "button") return <UiButton w={w} h={Math.round(w * 0.32)} tone={tone ?? "ink"} style={style} />;
  if (kind === "input") return <UiInput w={w} h={Math.round(w * 0.32)} cursorOn={cursorOn} style={style} />;
  return <UiCard w={w} h={Math.round(w * 0.78)} style={style} />;
}

/** Phone silhouette: thick ink edge, cream screen, a small speaker slot. Children lay out as a column inside the screen. */
export function PhoneFrame({ w = 420, h = 780, rotate = 0, children, style, gap = 26 }: { w?: number; h?: number; rotate?: number; children?: React.ReactNode; style?: React.CSSProperties; gap?: number }) {
  const edge = Math.max(5, Math.round(w * 0.016));
  const pad = Math.round(w * 0.1);
  return (
    <div
      style={{
        width: w,
        height: h,
        boxSizing: "border-box",
        background: color.card,
        border: `${edge}px solid ${color.ink}`,
        borderRadius: Math.round(w * 0.13),
        boxShadow: paperShadow,
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        position: "relative",
        padding: `${pad + Math.round(w * 0.08)}px ${pad}px ${pad}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        gap,
        ...style,
      }}
    >
      <div style={{ position: "absolute", top: Math.round(w * 0.06), left: "50%", transform: "translateX(-50%)", width: w * 0.26, height: Math.max(5, w * 0.018), borderRadius: 99, background: color.ink }} />
      {children}
    </div>
  );
}

/** Round vermilion badge with a check or a cross, for "fixed" / "broken" states on a piece. */
export function Badge({ kind, size = 44, tone = "accent", style }: { kind: "check" | "x"; size?: number; tone?: PaperTone; style?: React.CSSProperties }) {
  const stroke = tone === "paper" ? color.ink : color.bg;
  const bg = tone === "accent" ? color.accent : tone === "ink" ? color.ink : color.card;
  const s = size;
  return (
    <div style={{ width: s, height: s, borderRadius: s / 2, background: bg, boxShadow: paperShadow, display: "flex", alignItems: "center", justifyContent: "center", border: tone === "paper" ? `2px solid ${color.ink}` : "none", boxSizing: "border-box", ...style }}>
      <svg width={s * 0.55} height={s * 0.55} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        {kind === "check" ? <path d="M4 12.5l5 5L20 6.5" /> : <path d="M6 6l12 12M18 6L6 18" />}
      </svg>
    </div>
  );
}

/** Token glyphs: two overlapping swatches (color), "Aa" (type), a dimension line between two blocks (spacing). */
export function TokenGlyph({ kind, size = 150, style }: { kind: TokenKind; size?: number; style?: React.CSSProperties }) {
  const s = size;
  if (kind === "color")
    return (
      <div style={{ width: s, height: s, position: "relative", ...style }}>
        <div style={{ position: "absolute", left: s * 0.06, top: s * 0.2, width: s * 0.56, height: s * 0.56, borderRadius: "50%", background: color.ink, boxShadow: paperShadow }} />
        <div style={{ position: "absolute", left: s * 0.4, top: s * 0.3, width: s * 0.56, height: s * 0.56, borderRadius: "50%", background: color.accent, boxShadow: paperShadow }} />
      </div>
    );
  if (kind === "type")
    return (
      <div style={{ width: s, height: s, display: "flex", alignItems: "center", justifyContent: "center", ...style }}>
        <div style={{ fontFamily: font.sans, fontSize: s * 0.7, fontWeight: 800, letterSpacing: -s * 0.03, color: color.ink, lineHeight: 1 }}>
          A<span style={{ color: color.accent }}>a</span>
        </div>
      </div>
    );
  const bw = s * 0.26;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={style}>
      <rect x={s * 0.06} y={s * 0.3} width={bw} height={s * 0.44} rx={s * 0.05} fill={color.ink} />
      <rect x={s * 0.68} y={s * 0.3} width={bw} height={s * 0.44} rx={s * 0.05} fill={color.ink} />
      <line x1={s * 0.35} y1={s * 0.52} x2={s * 0.65} y2={s * 0.52} stroke={color.accent} strokeWidth={s * 0.035} strokeLinecap="round" />
      <path d={`M ${s * 0.42} ${s * 0.44} L ${s * 0.35} ${s * 0.52} L ${s * 0.42} ${s * 0.6}`} fill="none" stroke={color.accent} strokeWidth={s * 0.035} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${s * 0.58} ${s * 0.44} L ${s * 0.65} ${s * 0.52} L ${s * 0.58} ${s * 0.6}`} fill="none" stroke={color.accent} strokeWidth={s * 0.035} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
