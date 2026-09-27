import type { ItemContract } from "../schema"

export default {
  name: "shelf",
  entry: "component",
  title: "Shelf",
  description:
    "A pile of tilted library cards that slide in on their own cues, plus Twice: a button, the same button again, and a vermilion cross drawn over the second.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "Shelf",
      kind: "component",
      summary:
        "Column of wide Paper cards, each sliding in from the left (60px) with a spring at its own `at`, tilted −1.2°, 1°, −0.8° in turn. Each card shows its name in mono type and three tiny pieces (card, input without cursor, button). The button is accent on paper and ink cards, paper on an accent card.",
      props: {
        w: "Width of every card in stage pixels.",
        items: "Cards from top to bottom: `text` (mono label, one line, not truncated), `at` (entrance in seconds), and optional `tone` (paper default, accent for the one that is yours, or ink).",
        cardH: "Card height in stage pixels; defaults to round(0.16 × w). Label size, padding, radius, and piece size follow it.",
        gap: "Vertical space between cards in stage pixels.",
      },
    },
    {
      export: "Twice",
      kind: "component",
      summary:
        "Closing gag: an ink button scales in at `at`, an identical one beside it at `second`, then two vermilion strokes draw a cross over the second (each 0.25 s, the second stroke 0.2 s after the first).",
      props: {
        w: "Row width in stage pixels; the buttons are centred with a gap of 5% of w.",
        at: "Seconds when the first button scales in.",
        second: "Seconds when the second, identical button scales in.",
        strike: "Seconds when the cross starts drawing; defaults to second + 0.5.",
        bw: "Button width in stage pixels; defaults to min(420, half the row minus the gap).",
        bh: "Button height in stage pixels; defaults to round(0.34 × button width).",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Shelf is w wide and grows with its items: n × cardH + (n − 1) × gap, with cardH = round(0.16 × w) by default (three cards at w = 936 are 494px tall). Twice is w wide and bh + 52 tall (about 211px at w = 936). SceneFromSpec gives both min(W, 1100) and min(W, 1000) in landscape and the full safe-area width in vertical. Card tilt, the left slide, and the cross strokes reach past these boxes.",
  },
  examples: [
    {
      title: "Library shelf, then the gag",
      code: 'import { Shelf, Twice } from "@/jbm/motion/shelf"\n\n<Shelf w={936} items={[\n  { text: "shadcn/ui", at: 0.2 },\n  { text: "Material UI", at: 0.6 },\n  { text: "jbm-ui", at: 1.0, tone: "accent" },\n]} />\n<Twice w={936} at={2} second={2.8} strike={3} />\n// Render inside a Remotion <Composition> or <Player>.',
    },
  ],
  qa: [
    "Step through each card cue: cards slide in from the left in order and settle at alternating tilts; the accent card's button turns paper.",
    "Try a long label at narrow w: the mono label does not wrap or truncate and can collide with the three pieces.",
    "For Twice, inspect first button, second button, mid-strike, and final frame: both strokes fully drawn tail to head and the cross stays within the row's 26px padding.",
    "Check the full stack height (items plus Twice) fits the safe area in both orientations.",
  ],
} satisfies ItemContract
