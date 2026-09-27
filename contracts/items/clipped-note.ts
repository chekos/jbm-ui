import type { ItemContract } from "../schema"

export default {
  name: "clipped-note",
  entry: "component",
  title: "Clipped note",
  description:
    "Paper note with an optional paper clip, rotation, and paper, accent, or ink stock.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "ClippedNote",
      kind: "component",
      summary:
        "Composes Paper (10px radius, 18px padding, 220px wide up to 100% of its container) and PaperClip. Children render in bold sans with ink matched to the stock and wrap anywhere.",
      props: {
        children: "Note content.",
        clip: "Shows the paper clip across the top edge at left 18px, top −24px. The clip extends above the note's box.",
        tone: "Paper stock: `paper` (card with ink text), `accent` (vermilion), or `ink`; text switches to cream on accent and ink.",
        rotate: "Rotation of the whole note, clip included, in degrees.",
        style: "Inline styles merged last onto the Paper, e.g. width, padding, or font size.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width is 220px (maxWidth 100%) unless style overrides it; height follows the wrapped children plus 36px padding and a 4px border. The clip adds 24px above the top edge, and rotation enlarges the visual footprint.",
  },
  examples: [
    {
      title: "Rotated clipped note",
      code: 'import { ClippedNote } from "@/jbm/ui/clipped-note"\n\n<ClippedNote clip rotate={-3}>Revisar el resultado.</ClippedNote>',
    },
    {
      title: "Small note attached to a paper tape",
      code: 'import { ClippedNote } from "@/jbm/ui/clipped-note"\nimport { PaperTape } from "@/jbm/ui/paper-tape" // install @jbm/paper-tape separately\n\n<PaperTape length={700} window={280} attachments={[{ id: "note", at: 650,\n  content: <ClippedNote style={{ width: 108, fontSize: 12, padding: 10 }}>12 de 30 rutas</ClippedNote> }]} />',
    },
  ],
  qa: [
    "Toggle Paper clip: the note does not shift, and the clip overlaps the top edge rather than floating above it.",
    "Toggle Accent paper and try ink: text stays legible on each stock.",
    "Drag Note rotation to both extremes: the clip rotates with the note and nothing is clipped by the preview.",
    "Check a long unbroken word wraps inside the 220px width on narrow screens.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/design-video-components.md" },
  ],
} satisfies ItemContract
