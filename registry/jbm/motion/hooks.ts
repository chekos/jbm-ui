import { interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

/** Seconds since the start of the enclosing Sequence. */
export const useSec = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** 0→1 spring that starts at `startSec` (relative to the sequence). */
export const useIn = (startSec: number, opts?: { damping?: number; stiffness?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - Math.round(startSec * fps), fps, config: { damping: opts?.damping ?? 14, stiffness: opts?.stiffness ?? 120, mass: 0.8 } });
};

/** 0→1 cubic-out fade over `dur` seconds from `startSec`. */
export const useFade = (startSec: number, dur = 0.4) => {
  const s = useSec();
  return interpolate(s, [startSec, startSec + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
};

/** Eased 0→target progress over `dur` seconds from `startSec` (bar fills, counters, draw-on). */
export const useProgress = (startSec: number, target = 1, dur = 0.7) => {
  const s = useSec();
  return interpolate(s, [startSec, startSec + dur], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
};
