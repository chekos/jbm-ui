import * as React from "react";
import { Card } from "./card";
import { color, font } from "../lib/tokens";

/**
 * One number and its context: mono label, huge value, one-line sub.
 * `row` lays label/value/sub side by side (vertical stage); default stacks them (landscape stage).
 */
export function StatCard({ label, value, sub, valueColor = color.accent, w = 520, h = 300, row = false, style }: { label: string; value: React.ReactNode; sub?: string; valueColor?: string; w?: number; h?: number; row?: boolean; style?: React.CSSProperties }) {
  const Value = <div style={{ fontFamily: font.sans, fontSize: row ? 84 : 96, fontWeight: 800, color: valueColor, letterSpacing: -3, lineHeight: 1, marginTop: row ? 0 : 10, width: row ? 400 : undefined }}>{value}</div>;
  const Text = (
    <div>
      <div style={{ fontFamily: font.mono, fontSize: 22, color: color.dim }}>{label}</div>
      {sub ? <div style={{ fontFamily: font.sans, fontSize: row ? 28 : 30, color: row ? color.ink : color.dim, lineHeight: 1.25, marginTop: row ? 0 : 6 }}>{sub}</div> : null}
    </div>
  );
  return (
    <Card style={{ width: w, height: h, ...(row ? { padding: "22px 34px", display: "flex", alignItems: "center", gap: 30 } : {}), ...style }}>
      {row ? (<>{Value}{Text}</>) : (<>
        <div style={{ fontFamily: font.mono, fontSize: 22, color: color.dim }}>{label}</div>
        {Value}
        {sub ? <div style={{ fontFamily: font.sans, fontSize: 30, color: color.dim }}>{sub}</div> : null}
      </>)}
    </Card>
  );
}
