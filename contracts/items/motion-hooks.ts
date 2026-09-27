import type { ItemContract } from "../schema"

export default {
  name: "motion-hooks",
  entry: "component",
  title: "MotionHooks",
  description:
    "Remotion timing hooks in seconds: elapsed time, a spring entrance, a cubic-out fade, and an eased progress value.",
  category: "Foundations",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "useSec",
      kind: "hook",
      summary: "Seconds elapsed since the start of the enclosing Remotion Sequence (current frame ÷ fps).",
      params: {},
      returns: "Elapsed seconds as a number; fractional between frames.",
    },
    {
      export: "useIn",
      kind: "hook",
      summary:
        "Spring entrance that starts at `startSec` (rounded to the nearest frame) with mass 0.8. Stays 0 before the start and settles near 1; it can overshoot 1 slightly while settling.",
      params: {
        startSec: "Start time in seconds relative to the enclosing Sequence.",
        opts: "Optional spring config: `damping` (default 14) and `stiffness` (default 120). Lower damping bounces more.",
      },
      returns: "Spring value from 0 toward 1, for opacity, scale, or translate progress.",
    },
    {
      export: "useFade",
      kind: "hook",
      summary: "Cubic-out interpolation from 0 to 1 over `dur` seconds starting at `startSec`, clamped at both ends.",
      params: {
        startSec: "Start time in seconds relative to the enclosing Sequence.",
        dur: "Fade length in seconds.",
      },
      returns: "Opacity-style value clamped to 0–1.",
    },
    {
      export: "useProgress",
      kind: "hook",
      summary:
        "Cubic-out interpolation from 0 to `target` over `dur` seconds starting at `startSec`, clamped at both ends. Use for bar fills, counters, and draw-on strokes.",
      params: {
        startSec: "Start time in seconds relative to the enclosing Sequence.",
        target: "Value reached at `startSec + dur` and held afterwards (e.g. 1, 100, or a probability).",
        dur: "Seconds taken to reach `target`.",
      },
      returns: "Number between 0 and `target`.",
    },
  ],
  stage: {
    mode: "n/a",
    reason: "Hooks only; they render nothing. The gallery preview is a demo component built on them.",
  },
  examples: [
    {
      title: "Entrance, fade, and a counting value",
      code: 'import { useSec, useIn, useFade, useProgress } from "@/jbm/motion/hooks"\n\n// Render inside a Remotion <Composition> or <Player>: hooks run in the component body.\nexport function TimelineReadout() {\n  const seconds = useSec()\n  const entrance = useIn(0.2)\n  const opacity = useFade(0.2)\n  const progress = useProgress(0.2, 100, 1.5)\n  return (\n    <div style={{ opacity, transform: `translateY(${(1 - entrance) * 30}px)` }}>\n      {progress.toFixed(0)}% at {seconds.toFixed(2)}s\n    </div>\n  )\n}',
    },
  ],
  qa: [
    "Step to the first frame, the middle of the 1.5 s window, and the last frame: the percentage reads 0, an intermediate value, then exactly 100; useSec matches frame ÷ fps.",
    "Check that times are relative to the enclosing Sequence: a component inside a Sequence that starts later still enters at its own `startSec`.",
    "When changing spring defaults, re-check every consumer (Pop, ProbBar, RebuildScreens, Catalog) and the gallery preview durations measured from the same spring config.",
  ],
} satisfies ItemContract
