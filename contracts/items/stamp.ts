import type { ItemContract } from "../schema"

export default {
  name: "stamp",
  entry: "component",
  title: "Stamp",
  description:
    "Vermilion rubber-stamp impression that drops, makes contact, and inks in as a 0–1 press progresses.",
  category: "UI Bits",
  family: "Tape, clips & marks",
  capabilities: ["controls"],
  api: [
    {
      export: "Stamp",
      kind: "component",
      summary:
        "Bordered mono text in vermilion with a faint offset second impression. An ink impression, not a validation verdict. `press` is controlled with no timer: the stamp descends from 60px above until contact at 0.62, and its ink fades in from 0.5 to fully opaque at 0.8.",
      props: {
        text: "Impression text in 24px bold mono; wraps anywhere when space runs out.",
        press: "Press progress 0–1 (clamped). Invisible below 0.5, touches down at 0.62, fully inked from 0.8.",
        angle: "Rotation of the impression in degrees; negative tilts counter-clockwise.",
        style: "Inline styles merged last onto the outer element. Setting transform or opacity here replaces the press animation.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Inline-block sized by the text: one 24px mono line plus 8px/16px padding and a 3px border, up to 100% of the container. Before contact it sits up to 60px higher, and rotation widens the footprint, so reserve headroom (the gallery pads 70px above).",
  },
  examples: [
    {
      title: "Nearly settled stamp",
      code: 'import { Stamp } from "@/jbm/ui/stamp"\n\n<Stamp text="REVISADO" press={0.9} angle={-7} />',
    },
  ],
  qa: [
    "Drag Press through 0, 0.5, 0.62, 0.8, and 1: hidden, faint while descending, touching down, fully inked, and settled with no jump.",
    "Drag Stamp angle to both extremes: the rotated box stays inside the preview on narrow screens.",
    "Check the offset second impression reads as ink texture, not a duplicate label, and screen readers hear the text once.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
