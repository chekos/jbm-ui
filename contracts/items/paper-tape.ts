import type { ItemContract } from "../schema"

export default {
  name: "paper-tape",
  entry: "component",
  title: "Paper tape",
  description:
    "Strip of paper fed out by length, with printed marks, checkpoint markers, and attachments on one coordinate system.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "PaperTape",
      kind: "component",
      summary:
        "A card strip with an ink edge and paper shadow that grows from the source as `length` increases. Paired ink dashes are printed every 72 paper px, and markers and attachments ride on the same paper coordinates, so feeding the tape moves them together. Only marks, markers, and attachments inside the visible window render; the viewport clips at its bounds.",
      props: {
        length: "Paper fed out so far, in stage px. Increase it to feed the tape; negative or non-finite values count as 0.",
        window: "Visible run in stage px; also the component's width (horizontal) or height (vertical).",
        thickness: "Strip thickness in stage px; minimum 16.",
        direction: "`horizontal` feeds along x; `vertical` feeds along y and turns markers 90°.",
        markers:
          "Checkpoint TapeMarkers placed at paper coordinate `at` (0 = start of the paper). `id` must be unique within the tape; `label` shows above the marker.",
        attachments:
          "Arbitrary React content pinned at paper coordinate `at`, below the strip (horizontal) or beside it (vertical). IDs must be unique across markers and attachments.",
        style: "Inline styles merged last onto the outer viewport, e.g. width or overflow.",
      },
    },
    {
      export: "paperAt",
      kind: "function",
      summary:
        "Converts a paper coordinate to its screen distance from the tape's origin; markers, attachments, and printed marks all use it.",
      params: {
        length: "Paper fed out so far, as passed to PaperTape.",
        coordinate: "Position on the paper, measured from the start of the paper.",
      },
      returns: "Screen offset in stage px: length − coordinate (length clamped to ≥ 0). Values within the window are visible.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 400, height: 198 },
    vertical: { width: 400, height: 198 },
    basis:
      "Horizontal default: width = window (400), height = thickness + 150 (48 + 150); the strip sits 48px from the top to leave room for markers and labels. direction=\"vertical\" gives width thickness + 180 (228) by height window (400). maxWidth is 100% of the container. Stage orientation does not change the box.",
  },
  examples: [
    {
      title: "Tape with a checkpoint",
      code: 'import { PaperTape, paperAt } from "@/jbm/ui/paper-tape"\n\n<PaperTape length={700} window={320} markers={[{ id: "review", at: 520, label: "revisar" }]} />\n// paperAt(700, 520) === 180: marks and attachments share this origin.',
    },
    {
      title: "Feed from a Remotion timeline",
      code: 'import { PaperTape } from "@/jbm/ui/paper-tape"\nimport { useProgress } from "@/jbm/motion/hooks" // install @jbm/motion-hooks separately\n\nconst feed = useProgress(0.2, 1000, 4)\n<PaperTape length={feed} window={280} direction="vertical" markers={[{ id: "stop", at: 520 }]} />',
    },
  ],
  qa: [
    "Drag Feed from 0 to 1: the strip grows from zero, printed dashes, the marker, and the note move together, and nothing appears before its coordinate is fed out.",
    "Toggle Vertical tape: markers rotate 90° and attachments sit beside the strip; check both directions at narrow widths.",
    "Toggle Checkpoint marker: the tape and note do not move.",
    "Try a very long length: only the visible dashes render and content past the window is clipped at the edge.",
  ],
} satisfies ItemContract
