import * as React from "react";
import { Card } from "../ui/card";
import { color, font } from "../lib/tokens";
import { Pop } from "./pop";

export type CodeLine = { t: string; at: number; color?: string };

/** Dark code card with traffic lights and an optional filename; each line enters on its own anchor. ~12px per character at size 20. */
export function CodeCard({ lines, w = 900, h = 520, size = 24, title }: { lines: CodeLine[]; w?: number; h?: number; size?: number; title?: string }) {
  return (
    <Card dark style={{ padding: 0, overflow: "hidden", width: w, height: h }}>
      <div style={{ padding: "12px 20px", display: "flex", gap: 10, alignItems: "center" }}>
        {[color.accent, color.bg, color.dim].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
        {title ? <div style={{ fontFamily: font.mono, fontSize: 20, color: color.dim, marginLeft: 14 }}>{title}</div> : null}
      </div>
      <div style={{ fontFamily: font.mono, fontSize: size, color: color.bg, padding: "14px 28px", lineHeight: 1.55 }}>
        {lines.map((l, i) => (
          <Pop key={i} at={l.at} from="left" dist={10}>
            <div style={{ color: l.color ?? color.bg, whiteSpace: "pre" }}>{l.t}</div>
          </Pop>
        ))}
      </div>
    </Card>
  );
}
