import { codeTypingSchedule } from "../../registry/jbm/motion/code-card-timing.js"
import { measureSpring } from "remotion"
import type { ComponentProps } from "react"
import type { SceneSpec, SceneLayout, SafeArea } from "../../registry/jbm/motion/spec"
import type { Counter } from "../../registry/jbm/motion/counter"
import type { Stagger } from "../../registry/jbm/motion/pop"
import type { ProbBar } from "../../registry/jbm/motion/prob-bar"
import type { CodeCard } from "../../registry/jbm/motion/code-card"
import type { Captions } from "../../registry/jbm/motion/captions"
import type { RebuildScreens } from "../../registry/jbm/motion/rebuild-screens"
import type { Catalog } from "../../registry/jbm/motion/catalog"
import type { Propagate } from "../../registry/jbm/motion/propagate"
import type { Shelf, Twice } from "../../registry/jbm/motion/shelf"

// The gallery previews' timelines and props. Everything here is data (no JSX), so the contract
// generator reads the same values the Player renders: cues are checked against durationFor, and
// each item's "Gallery preview cues" (/catalog/<name>.md and .json) publish previewDemos.

export const fps = 30
export const timing = {
  counter: { at: 0.2, dur: 1.5 },
  pop: { at: 0.2, step: 0.35 },
  probability: { at: 0.2, dur: 0.7 },
}
export const popItems = ["Idea", "Datos", "Historia"]
// Compact cue sheets for the illustrated scene blocks (seconds).
export const illustrated = {
  screens: { pieces: [0.2, 0.7, 1.2], again: [2.2, 3.2], sticker: 2.3 },
  catalog: {
    at: 0.2,
    items: [0.8, 1.2, 1.6],
    tokensAt: 2.6,
    tokens: [3.0, 3.4, 3.8],
    stamp: 4.4,
  },
  propagate: {
    at: 0.2,
    label: 0.9,
    bug: 1.6,
    fix: 2.4,
    fixed: 3.2,
    recolor: 4.0,
    recolored: 4.8,
  },
  // The cross waits until the second button has settled (second + springFrames ≈ 3.4 s), so the
  // strip's "Built twice" frame shows both buttons whole before the strike starts.
  shelf: { items: [0.2, 0.6, 1.0], twice: 2.0, second: 2.8, strike: 3.6 },
}
export const codeLines = [
  { t: 'const idea = "simple";', at: 0.2 },
  { t: "const story = explain(idea);", at: 0.7 },
  { t: "render(story);", at: 1.2, color: "#FF8A6A" },
]
export const captionWords = [
  { w: "Una", s: 0, e: 0.7 },
  { w: "idea", s: 0.7, e: 1.4, emph: true },
  { w: "a", s: 1.4, e: 1.8 },
  { w: "la", s: 1.8, e: 2.2 },
  { w: "vez.", s: 2.2, e: 3.5 },
]
// Match useIn's spring configuration. Settled means within 0.5% of the target.
export const springFrames = measureSpring({
  fps,
  config: { damping: 14, stiffness: 120, mass: 0.8 },
})
const settle = (damping: number, stiffness = 120) =>
  measureSpring({ fps, config: { damping, stiffness, mass: 0.8 } })
const frame = (seconds: number) => Math.round(seconds * fps)

// Include the terminal frame so interpolated values reach their exact target.
export function durationFor(name: string): number {
  switch (name) {
    case "counter":
    case "motion-hooks":
      return frame(timing.counter.at + timing.counter.dur) + 1
    case "pop":
      return (
        frame(timing.pop.at + (popItems.length - 1) * timing.pop.step) +
        springFrames +
        1
      )
    case "prob-bar":
      return (
        frame(timing.probability.at) +
        Math.max(frame(timing.probability.dur), springFrames) +
        1
      )
    case "scene-spec":
      return frame(0.8) + springFrames + 1
    case "code-card":
      return (codeTypingSchedule(codeLines, fps).at(-1)?.end ?? 0) + 1
    case "captions":
      // Captions keeps its last group for one second, including its fade-out.
      return frame(captionWords[captionWords.length - 1].e + 1) + 1
    case "rebuild-screens":
      return (
        Math.max(
          frame(
            Math.max(...illustrated.screens.again) +
              0.12 +
              (illustrated.screens.pieces.length - 1) * 0.22
          ) + springFrames,
          frame(illustrated.screens.sticker) + settle(9, 160),
          frame(Math.max(...illustrated.screens.again)) + settle(12, 110)
        ) + 1
      )
    case "catalog":
      return (
        Math.max(
          frame(illustrated.catalog.stamp) + settle(9, 160),
          frame(Math.max(...illustrated.catalog.tokens)) + springFrames
        ) + 1
      )
    case "propagate":
      return (
        Math.max(
          frame(illustrated.propagate.recolored + 0.35),
          frame(illustrated.propagate.fixed) + settle(10)
        ) + 1
      )
    case "shelf":
      return (
        Math.max(
          frame(illustrated.shelf.strike + 0.45),
          frame(illustrated.shelf.second) + springFrames
        ) + 1
      )
    default:
      return 1 // Scene is a static layout component, not a timed animation.
  }
}

/** Props each Player preview passes its components (timing props in seconds on the preview). */
export const previewProps = {
  counter: { n: 1024, at: timing.counter.at, dur: timing.counter.dur } satisfies ComponentProps<
    typeof Counter
  >,
  pop: { at: timing.pop.at, step: timing.pop.step, from: "scale" } satisfies Omit<
    ComponentProps<typeof Stagger>,
    "children"
  >,
  probBar: {
    label: "Confianza",
    p: 0.86,
    at: timing.probability.at,
    w: 620,
  } satisfies ComponentProps<typeof ProbBar>,
  codeCard: { w: 620, h: 280, title: "hello.ts", lines: codeLines } satisfies ComponentProps<
    typeof CodeCard
  >,
  captions: { words: captionWords } satisfies ComponentProps<typeof Captions>,
  rebuildScreens: {
    w: 936,
    h: 620,
    pieces: [
      { kind: "button", at: illustrated.screens.pieces[0] },
      { kind: "input", at: illustrated.screens.pieces[1] },
      { kind: "card", at: illustrated.screens.pieces[2] },
    ],
    again: illustrated.screens.again,
    sticker: { text: "¿otra vez?", at: illustrated.screens.sticker },
  } satisfies ComponentProps<typeof RebuildScreens>,
  catalog: {
    w: 936,
    at: illustrated.catalog.at,
    title: "catálogo",
    items: [
      { kind: "button", label: "botón", at: illustrated.catalog.items[0] },
      { kind: "card", label: "tarjeta", at: illustrated.catalog.items[1] },
      { kind: "input", label: "input", at: illustrated.catalog.items[2] },
    ],
    tokensAt: illustrated.catalog.tokensAt,
    tokens: [
      { kind: "color", label: "color", at: illustrated.catalog.tokens[0] },
      { kind: "type", label: "tipografía", at: illustrated.catalog.tokens[1] },
      { kind: "space", label: "espaciado", at: illustrated.catalog.tokens[2] },
    ],
    stamp: { text: "design tokens", at: illustrated.catalog.stamp },
  } satisfies ComponentProps<typeof Catalog>,
  propagate: {
    w: 936,
    h: 640,
    at: illustrated.propagate.at,
    label: { text: "una sola fuente de verdad", at: illustrated.propagate.label },
    targets: 6,
    bug: illustrated.propagate.bug,
    fix: illustrated.propagate.fix,
    fixed: illustrated.propagate.fixed,
    recolor: illustrated.propagate.recolor,
    recolored: illustrated.propagate.recolored,
  } satisfies ComponentProps<typeof Propagate>,
  shelf: {
    w: 936,
    items: [
      { text: "shadcn/ui", at: illustrated.shelf.items[0] },
      { text: "Material UI", at: illustrated.shelf.items[1] },
      { text: "jbm-ui", at: illustrated.shelf.items[2], tone: "accent" },
    ],
  } satisfies ComponentProps<typeof Shelf>,
  twice: {
    w: 936,
    at: illustrated.shelf.twice,
    second: illustrated.shelf.second,
    strike: illustrated.shelf.strike,
  } satisfies ComponentProps<typeof Twice>,
}

/** The reference scene the gallery compiles into both stage orientations. */
export function referenceSpec(layout: SceneLayout, safeArea: SafeArea): SceneSpec {
  const subject = {
    type: "screens" as const,
    phoneScale: 1.5,
    pieces: [
      { kind: "card" as const, at: 0.2 },
      { kind: "input" as const, at: 0.5 },
      { kind: "button" as const, at: 0.8 },
    ],
  }
  return {
    id: "portrait-reference",
    composition: { safeArea, layout, subjectScale: 1.3 },
    blocks:
      layout === "illustration"
        ? [subject]
        : layout === "hero"
          ? [
              {
                type: "big",
                at: 0,
                text: "Hazlo una vez.\nÚsalo siempre.",
                align: "center",
                size: 140,
              },
            ]
          : [
              {
                type: "big",
                at: 0,
                text: "Una biblioteca.\nMuchas posibilidades.",
                align: "center",
                size: 90,
              },
              subject,
            ],
    variants: { vertical: { headlineRatio: 0.23, gap: 48 } },
  }
}

/**
 * One element of a gallery preview as published to agents: a component, its props (JSON), and
 * text or element children. `code` stands in for a hook demo that is not a single element.
 */
export type DemoElement =
  | {
      component: string
      props?: Record<string, unknown>
      children?: string | DemoElement[]
    }
  | { code: string }

/**
 * What each Player item's gallery preview renders, keyed by item name: the elements (with the
 * props above) whose timeline the contract's cues are measured on. Wrappers that only fit the
 * demo into the 800×500 preview (Scene, scaling boxes) are left out.
 */
export const previewDemos: Record<string, DemoElement[]> = {
  counter: [{ component: "Counter", props: previewProps.counter }],
  "motion-hooks": [
    {
      code: [
        `const entrance = useIn(${timing.counter.at})`,
        `const opacity = useFade(${timing.counter.at})`,
        `const progress = useProgress(${timing.counter.at}, 100, ${timing.counter.dur})`,
        "// A Big number shows progress.toFixed(0) + \"%\", fading and rising in with opacity and entrance.",
      ].join("\n"),
    },
  ],
  pop: [
    {
      component: "Stagger",
      props: previewProps.pop,
      children: popItems.map((text) => ({ component: "Chip", children: text })),
    },
  ],
  "prob-bar": [{ component: "ProbBar", props: previewProps.probBar }],
  "code-card": [{ component: "CodeCard", props: previewProps.codeCard }],
  captions: [
    {
      component: "Pop",
      props: { at: 0 },
      children: [{ component: "Big", props: { size: 52 }, children: "Cada palabra cuenta." }],
    },
    { component: "Captions", props: previewProps.captions },
  ],
  "rebuild-screens": [{ component: "RebuildScreens", props: previewProps.rebuildScreens }],
  catalog: [{ component: "Catalog", props: previewProps.catalog }],
  propagate: [{ component: "Propagate", props: previewProps.propagate }],
  shelf: [
    { component: "Shelf", props: previewProps.shelf },
    { component: "Twice", props: previewProps.twice },
  ],
  "scene-spec": [
    {
      component: "SceneFromSpec",
      props: {
        spec: referenceSpec("headline-illustration", "full"),
        orientation: "landscape",
      },
    },
  ],
}
