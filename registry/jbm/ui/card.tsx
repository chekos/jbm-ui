import * as React from "react";
import { color, radius, shadow } from "../lib/tokens";

/** Raised surface: card background, 2px rule border, radius 28, soft shadow. Base of StatCard, CodeCard, Panel. */
export function Card({ children, style, dark }: { children: React.ReactNode; style?: React.CSSProperties; dark?: boolean }) {
  return (
    <div
      style={{
        background: dark ? color.codeBg : color.card,
        border: `2px solid ${dark ? color.codeBg : color.line}`,
        borderRadius: radius.card,
        padding: 40,
        boxShadow: shadow.card,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
