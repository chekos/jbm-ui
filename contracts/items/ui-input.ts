import type { ItemContract } from "../schema"

export default {
  name: "ui-input",
  entry: "component",
  title: "UiInput",
  description: "Illustrated outlined text field with a placeholder bar and a cursor you switch on or off.",
  category: "UI Bits",
  capabilities: [],
  api: [
    {
      export: "UiInput",
      kind: "component",
      summary:
        "Cream paper field with an ink outline, a 3px ink cursor (half the height), and a line-colour placeholder bar at 45% of the width. It has no internal timer and no real text entry: blink the cursor by toggling `cursorOn` from a timeline.",
      props: {
        w: "Width in stage pixels, including the 2px Paper edge.",
        h: "Height in stage pixels; sets the corner radius (22%), inner padding (28%), cursor height (50%), and placeholder thickness (12%, at least 6px).",
        cursorOn: "Shows the cursor (opacity 1) when true, hides it (opacity 0) when false; the cursor keeps its space either way.",
        style: "Inline styles merged over the field's flex row; use for positioning or opacity.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 220, height: 70 },
    vertical: { width: 220, height: 70 },
    basis:
      "Fixed w × h box (border-box) at the defaults 220 × 70. `w` and `h` set it directly; the Paper shadow extends below the box.",
  },
  examples: [
    {
      title: "Field with the cursor showing",
      code: 'import { UiInput } from "@/jbm/ui/ui-input"\n\n<UiInput w={220} h={70} cursorOn />',
    },
    {
      title: "Blink the cursor on a Remotion timeline",
      code: 'import { UiInput } from "@/jbm/ui/ui-input"\nimport { useSec } from "@/jbm/motion/hooks" // install @jbm/motion-hooks separately\n\nconst sec = useSec()\n<UiInput w={420} h={120} cursorOn={Math.floor(sec * 2) % 2 === 0} />',
    },
  ],
  qa: [
    "Toggle cursorOn: the cursor appears and disappears without shifting the placeholder bar.",
    "Check small and large h: padding, radius, and cursor scale with h while the placeholder floors at 6px thick.",
    "At narrow w with a tall h, confirm the placeholder bar and padding still fit inside the field (it does not clip its children).",
  ],
} satisfies ItemContract
