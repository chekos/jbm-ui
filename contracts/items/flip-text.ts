import type { ItemContract } from "../schema"

export default {
  name: "flip-text",
  entry: "component",
  title: "FlipText",
  description:
    "Letters tumble on hover with a vermilion accent. Click, tap, or use the keyboard to flip the whole phrase. Respects reduced motion.",
  category: "Interactive",
  capabilities: ["controls"],
  api: [
    {
      export: "FlipText",
      kind: "component",
      summary:
        "A native button whose graphemes each flip 360° on the X axis (lifting 0.15em and passing through the accent color at the midpoint) using the Web Animations API. Mouse hover flips one character; click, tap, Enter, or Space flips every character in sequence, staggered 25ms apart. The accessible name is `Flip text: <children>`. No animation runs under reduced motion.",
      props: {
        children: "The phrase, as a plain string. Split into words and graphemes; whitespace is preserved.",
        duration:
          "Milliseconds for each character's flip. Negative values clamp to 0; non-finite values fall back to 450.",
        accentColor: "Color each character passes through at the middle of its flip.",
        reducedMotion:
          "Overrides the system prefers-reduced-motion setting. When reduced, flips are skipped and any running flips are cancelled.",
        className: "Class name on the button.",
        style:
          "Inline styles merged over the defaults (Geist sans, weight 800, line-height 1.3, ink, transparent background); set fontSize here.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "An inline-block button sized by its text: height is lines × fontSize × 1.3 plus 0.2em top and bottom padding, width follows the text up to 100% of the container, where it wraps.",
  },
  examples: [
    {
      title: "Flip a headline",
      code: 'import { FlipText } from "@/jbm/ui/flip-text"\n\n<FlipText duration={450} style={{ fontSize: 48 }}>Una idea viva.</FlipText>\n// Hover individual letters. Click, tap, Enter, or Space flips all.\n// A button: do not nest inside another button or link.',
    },
  ],
  qa: [
    "Hover single letters with a mouse: each tumbles once and returns to ink; re-hovering mid-flip restarts that letter cleanly.",
    "Click, tap, and press Enter or Space with keyboard focus: every letter flips in a left-to-right stagger, then all characters return to ink.",
    "Check touch: tapping flips the whole phrase; pointer-enter from touch does not flip single letters.",
    "Enable prefers-reduced-motion, or pass reducedMotion: no letter moves, and flips in progress are cancelled when the preference turns on.",
    "Check the focus ring is visible and the phrase wraps between words on a narrow screen.",
  ],
} satisfies ItemContract
