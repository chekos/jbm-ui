import * as React from "react";
import { color, radius, shadow, surfaceBorder } from "../lib/tokens";

/** Raised surface with a fine border, layered depth, and inset edge light. */
export function Card({ children, style, dark }: { children: React.ReactNode; style?: React.CSSProperties; dark?: boolean }) {
  return (
    <div
      style={{
        background: dark ? color.codeBg : color.card,
        border: dark ? surfaceBorder.cardDark : surfaceBorder.card,
        borderRadius: radius.card,
        padding: 40,
        boxShadow: dark ? shadow.cardDark : shadow.card,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
