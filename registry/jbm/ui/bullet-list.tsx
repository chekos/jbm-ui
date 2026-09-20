import * as React from "react";
import { color, font } from "../lib/tokens";

/** Vertical list with an arrow or dot marker. Pure; wrap each item in a motion `Pop` for staggered entry. */
export function BulletList({ items, marker = "arrow", size = 36, gap = 16, renderItem, style }: { items: string[]; marker?: "arrow" | "dot"; size?: number; gap?: number; renderItem?: (node: React.ReactNode, i: number) => React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, ...style }}>
      {items.map((text, i) => {
        const node = (
          <div key={text} style={{ fontFamily: font.sans, fontSize: size, fontWeight: 600, color: color.ink, lineHeight: 1.25, display: "flex", alignItems: "center", gap: 16 }}>
            {marker === "arrow" ? <span style={{ color: color.accent }}>→</span> : <span style={{ width: 18, height: 18, borderRadius: 9, background: color.accent, display: "inline-block" }} />}
            <span>{text}</span>
          </div>
        );
        return renderItem ? <React.Fragment key={text}>{renderItem(node, i)}</React.Fragment> : node;
      })}
    </div>
  );
}
