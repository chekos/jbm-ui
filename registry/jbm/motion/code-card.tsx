import * as React from "react";
import { Card } from "../ui/card";
import { color, font } from "../lib/tokens";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { codeTypingSchedule, typedCode } from "./code-card-timing.js";

export type CodeLine = { t: string; at: number; color?: string };

/** Types code in place. Each anchor is an earliest start; lines wait for preceding text to finish. */
export function CodeCard({ lines, w = 900, h = 520, size = 24, title, charsPerSecond = 32 }: { lines: CodeLine[]; w?: number; h?: number; size?: number; title?: string; charsPerSecond?: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const schedule = codeTypingSchedule(lines, fps, charsPerSecond);
  return (
    <Card dark style={{ padding: 0, overflow: "hidden", width: w, height: h }}>
      <div style={{ padding: "12px 20px", display: "flex", gap: 10, alignItems: "center" }}>
        {[color.accent, color.bg, color.dim].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
        {title ? <div style={{ fontFamily: font.mono, fontSize: 20, color: color.dim, marginLeft: 14 }}>{title}</div> : null}
      </div>
      <div style={{ fontFamily: font.mono, fontSize: size, color: color.bg, padding: "14px 28px", lineHeight: 1.55 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: l.color ?? color.bg, whiteSpace: "pre", minHeight: "1.55em" }}>
            {typedCode(schedule[i], frame, fps, charsPerSecond)}
          </div>
        ))}
      </div>
    </Card>
  );
}
