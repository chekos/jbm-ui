import * as React from "react";
import { Big } from "../ui/big";
import { color } from "../lib/tokens";
import { useProgress } from "./hooks";

/** Number counting up from 0 to `n` over `dur` seconds from `at`. */
export function Counter({ n, at, dur = 0.8, size = 140, color: c = color.accent }: { n: number; at: number; dur?: number; size?: number; color?: string }) {
  const v = Math.round(useProgress(at, n, dur));
  return <Big size={size} color={c}>{v}</Big>;
}
