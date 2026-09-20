import * as React from "react";
import { color, font } from "../lib/tokens";
import { useProgress } from "./hooks";
import { Pop } from "./pop";

/** Labelled probability bar: mono label, bar filling to `p`, value to two decimals. */
export function ProbBar({ label, p, at, w = 520, labelW = 230 }: { label: string; p: number; at: number; w?: number; labelW?: number }) {
  const f = useProgress(at, p, 0.7);
  return (
    <Pop at={at} from="left" dist={12}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily: font.mono, fontSize: 24, color: color.ink, width: labelW }}>{label}</div>
        <div style={{ width: w - labelW - 90, height: 22, background: color.line, borderRadius: 11, overflow: "hidden" }}>
          <div style={{ width: `${f * 100}%`, height: "100%", background: color.accent }} />
        </div>
        <div style={{ fontFamily: font.mono, fontSize: 24, color: color.accent, fontWeight: 700, width: 80 }}>{f.toFixed(2)}</div>
      </div>
    </Pop>
  );
}
