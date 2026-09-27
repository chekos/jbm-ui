import type { ItemContract } from "../schema"

export default {
  name: "text-fill",
  entry: "component",
  title: "TextFill",
  description:
    "A controlled character sweep from muted text through vermilion into ink. Drive progress with a slider, scroll, or a video timeline.",
  category: "Interactive",
  capabilities: ["controls"],
  api: [
    {
      export: "TextFill",
      kind: "component",
      summary:
        "Inline span that colors each grapheme by `progress`: characters ahead of the sweep stay dim, a short accent wave (about three characters) leads, and settled characters turn to text color. Pure React with no timers, browser globals, or Remotion; the full text is also rendered once in a visually hidden span for assistive technology, and the colored copy is aria-hidden.",
      props: {
        text: "The sentence to sweep. Split into words (whitespace preserved, words never break mid-word unless they overflow) and graphemes via Intl.Segmenter.",
        progress:
          "Fill progress from 0 (all dim) to 1 (all text color). Clamped to 0–1; non-finite values render as 0. Drive from a slider, scroll position, or a timeline.",
        dimColor: "Color of characters the sweep has not reached yet.",
        accentColor: "Color of the leading wave between dim and settled characters; keep the vermilion accent.",
        textColor: "Final color of settled characters, and of every character at progress 1.",
        reducedMotion: "When true, renders the complete text in textColor regardless of progress.",
        style:
          "Inline styles merged over the defaults (Geist sans, weight 800, line-height 1.15, pre-wrap); set fontSize here.",
        className: "Class name on the outer span.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Inline text: width follows the container and height follows the wrapped lines at the inherited font size × 1.15 line-height. Nothing is fixed; set fontSize through style or a parent.",
  },
  examples: [
    {
      title: "Half-filled sentence",
      code: 'import { TextFill } from "@/jbm/ui/text-fill"\n\n<TextFill text="Una idea toma forma." progress={0.5} style={{ fontSize: 40 }} />\n// progress: 0–1, controlled; no internal timer.',
    },
    {
      title: "Drive it from a Remotion timeline",
      code: 'import { TextFill } from "@/jbm/ui/text-fill"\nimport { useProgress } from "@/jbm/motion/hooks" // install @jbm/motion-hooks separately\n\n// Render inside a Remotion <Composition> or <Player>: hooks run in the component body.\nexport function FillingText() {\n  const progress = useProgress(0.2, 1, 2)\n  return <TextFill text="Letra por letra." progress={progress} style={{ fontSize: 72 }} />\n}',
    },
  ],
  qa: [
    "Drag the progress slider through 0, about 0.5, and 1: all dim at 0, a dim → vermilion → ink gradient near the sweep front mid-way, and solid ink at 1 with no lingering accent.",
    "Check wrapping on a narrow screen: words stay whole and whitespace is preserved; very long words wrap anywhere instead of overflowing.",
    "With a screen reader, the sentence is read once from the hidden copy, not character by character.",
    "Set reducedMotion and confirm the full ink text renders at any progress.",
    "Try text with emoji or combining marks; each grapheme should color as one unit.",
  ],
} satisfies ItemContract
