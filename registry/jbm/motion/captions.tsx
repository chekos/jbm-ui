import * as React from "react";
import { interpolate } from "remotion";
import { color, font, type Orientation } from "../lib/tokens";
import { useSec } from "./hooks";

export type Word = { w: string; s: number; e: number; emph?: boolean };

/**
 * Kinetic subtitle pill. Groups words on punctuation, gaps > 0.55 s, or max words (9 landscape / 6 vertical);
 * unspoken words sit at 0.28 opacity; emphasis words pop in the soft colour. Pass the video's aligned words.
 */
export function Captions({ words, orientation = "landscape", offset = 0 }: { words: Word[]; orientation?: Orientation; offset?: number }) {
  const t = useSec() - offset;
  const maxW = orientation === "vertical" ? 6 : 9;
  const groups = React.useMemo(() => {
    const out: { words: Word[]; s: number; e: number }[] = [];
    let cur: Word[] = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i]; cur.push(w);
      const next = words[i + 1];
      const ends = /[.!?…,:;—]$/.test(w.w);
      const gap = next ? next.s - w.e : 99;
      if (!next || ends || gap > 0.55 || cur.length >= maxW) { out.push({ words: cur, s: cur[0].s, e: next ? Math.min(w.e + 0.6, next.s) : w.e + 1 }); cur = []; }
    }
    return out;
  }, [words, maxW]);
  const g = groups.find((x) => t >= x.s && t < x.e);
  if (!g) return null;
  const fd = Math.min(0.12, Math.max(0.01, (g.e - g.s) / 2 - 0.005));
  const fade = interpolate(t, [g.s, g.s + fd, g.e - fd, g.e], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = orientation === "vertical";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: v ? 270 : 84, display: "flex", justifyContent: "center", opacity: fade, pointerEvents: "none" }}>
      <div style={{ fontFamily: font.sans, fontSize: v ? 54 : 44, fontWeight: 600, color: color.bg, background: color.ink, padding: v ? "18px 34px" : "14px 28px", borderRadius: 20, maxWidth: v ? 940 : 1500, textAlign: "center", lineHeight: 1.25 }}>
        {g.words.map((w, i) => {
          const on = t >= w.s;
          const pop = w.emph ? interpolate(t, [w.s, w.s + 0.2, w.s + 0.4], [1, 1.22, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
          return (
            <span key={i} style={{ opacity: on ? 1 : 0.28, color: w.emph && on ? color.soft : color.bg, fontWeight: w.emph ? 800 : 600, display: "inline-block", transform: `translateY(${(1 - pop) * 6}px)`, marginRight: 12 }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
}
