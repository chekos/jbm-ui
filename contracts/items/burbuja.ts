import type { ItemContract } from "../schema"

export default {
  name: "burbuja",
  entry: "component",
  title: "Burbuja",
  description:
    "Chat bubble whose selected words sweep to vermilion with a controlled 0–1 highlight.",
  category: "UI",
  capabilities: ["controls"],
  api: [
    {
      export: "Burbuja",
      kind: "component",
      summary:
        "Composes ChatBubble and TextFill: the message is a list of words joined by single spaces, and the words at the `highlight` indices sweep from the surrounding text color to the vermilion accent as `progress` goes from 0 to 1. Pure React with no timer; ordinary HTML handles wrapping.",
      props: {
        words: "Message words in order; rendered joined by single spaces.",
        highlight:
          "Zero-based indices into `words` that receive the TextFill sweep. Out-of-range indices are ignored.",
        progress:
          "Highlight progress from 0 (highlighted words in the bubble's text color) to 1 (fully vermilion). Clamped by TextFill; non-finite values render as 0.",
        side: "Which side the bubble aligns to and where its tail sits: `start` or `end`.",
        tone: "Bubble fill: `paper` (card with ink text), `ink`, or `accent` (both with cream text). Highlighted words always end in the vermilion accent, so avoid `accent` tone when they must stand out.",
        tail: "Shows the small speech tail under the bubble and reserves 10px of bottom margin for it.",
        speaker: "Optional mono label above the message, e.g. the speaker's name.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "ChatBubble is fit-content up to 100% of its container, so width follows the words and height follows wrapping. At 18px type with line-height 1.5 it adds 16px/20px padding, an optional ~20px speaker line, and 10px for the tail.",
  },
  examples: [
    {
      title: "Highlight one word",
      code: 'import { Burbuja } from "@/jbm/motion/burbuja"\n\n<Burbuja words={["Podemos", "reutilizar", "componentes."]}\n  highlight={[1]} progress={1} speaker="Tú" />',
    },
    {
      title: "Drive the highlight from a Remotion timeline",
      code: 'import { Burbuja } from "@/jbm/motion/burbuja"\nimport { useProgress } from "@/jbm/motion/hooks" // install @jbm/motion-hooks separately\n\nconst progress = useProgress(0.5, 1, 0.8)\n<Burbuja side="end" words={["Una", "pieza", "a", "la", "vez."]} highlight={[1, 4]} progress={progress} />',
    },
  ],
  qa: [
    "Drag Highlight through 0, 0.5, and 1: only the selected words change color, the sweep runs left to right, and at 1 they rest in vermilion.",
    "Check spacing and wrapping are unchanged by the highlight: highlighted words keep the bubble's font size, weight, and line height.",
    "Compare paper, ink, and accent tones and both sides; note that the accent tone hides an accent highlight.",
    "Verify at a narrow width that long words wrap inside the bubble and the tail stays attached.",
  ],
  docs: [
    { title: "Desk illustrations guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/desk-components.md" },
  ],
} satisfies ItemContract
