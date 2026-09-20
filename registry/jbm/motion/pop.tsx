import * as React from "react";
import { useIn } from "./hooks";

/** Entrance: opacity plus a translate from one side, or a 0.6→1 scale. `at` in seconds relative to the sequence. */
export function Pop({ at, children, style, from = "up", dist = 40 }: { at: number; children: React.ReactNode; style?: React.CSSProperties; from?: "up" | "down" | "left" | "right" | "scale"; dist?: number }) {
  const p = useIn(at);
  const tx = from === "left" ? -dist : from === "right" ? dist : 0;
  const ty = from === "up" ? dist : from === "down" ? -dist : 0;
  const sc = from === "scale" ? 0.6 + 0.4 * p : 1;
  return (
    <div style={{ opacity: p, transform: `translate(${tx * (1 - p)}px, ${ty * (1 - p)}px) scale(${sc})`, ...style }}>
      {children}
    </div>
  );
}

/** Staggered Pops for a list of children: item i enters at `at + i * step`. */
export function Stagger({ at, step = 0.3, from = "up", dist = 14, children }: { at: number; step?: number; from?: "up" | "down" | "left" | "right" | "scale"; dist?: number; children: React.ReactNode[] }) {
  return <>{React.Children.map(children, (c, i) => <Pop key={i} at={at + i * step} from={from} dist={dist}>{c}</Pop>)}</>;
}
