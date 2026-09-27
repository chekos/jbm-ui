import type { ItemContract } from "../schema"

export default {
  name: "pop",
  entry: "component",
  title: "Pop",
  description:
    "Spring entrances for Remotion: Pop slides or scales one block in, Stagger cascades a list, and Leave fades a block out.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "Pop",
      kind: "component",
      summary:
        "Wraps children in a div whose opacity follows a useIn spring from `at`, while it translates in from one side by `dist` or scales from 0.6 to 1.",
      props: {
        at: "Entrance start in seconds relative to the enclosing Sequence.",
        children: "Content to reveal.",
        style: "Inline styles merged onto the wrapper (after opacity and transform, so a transform here replaces the motion).",
        from: "Entrance direction: `up` rises from below, `down` drops from above, `left`/`right` slide in from that side, `scale` grows from 0.6×.",
        dist: "Travel distance in stage pixels for the directional entrances; ignored by `scale`.",
      },
    },
    {
      export: "Stagger",
      kind: "component",
      summary: "Wraps each child in a Pop; child i enters at `at + i × step` seconds.",
      props: {
        at: "Start of the first child, in seconds relative to the enclosing Sequence.",
        step: "Seconds between consecutive children.",
        from: "Entrance direction applied to every child (see Pop).",
        dist: "Travel distance in stage pixels for every child.",
        children: "Array of children to cascade; each becomes its own Pop wrapper.",
      },
    },
    {
      export: "Leave",
      kind: "component",
      summary: "Exit: from `at`, the wrapper fades out with cubic-out easing and drifts up by `dist` over 0.4 s, keeping its layout space.",
      props: {
        at: "Exit start in seconds relative to the enclosing Sequence.",
        children: "Content that leaves.",
        style: "Inline styles merged onto the wrapper (after opacity and transform).",
        dist: "Upward drift in stage pixels at the end of the exit.",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Each wrapper is a plain block div sized by its children; Pop, Stagger, and Leave add no box of their own. Translations and scale do not change layout size, so reserve room for `dist` travel near the safe-area edge.",
  },
  examples: [
    {
      title: "Cascade chips",
      code: 'import { Stagger } from "@/jbm/motion/pop"\nimport { Chip } from "@/jbm/ui/chip" // install @jbm/chip separately\n\n<Stagger at={0.2} step={0.35}>\n  {["Idea", "Datos"].map(text => <Chip key={text}>{text}</Chip>)}\n</Stagger>',
    },
    {
      title: "Enter, then leave before the scene ends",
      code: 'import { Pop, Leave } from "@/jbm/motion/pop"\n\n<Leave at={3}>\n  <Pop at={0.4} from="left" dist={60}>\n    <h2>Primero esto.</h2>\n  </Pop>\n</Leave>\n// Render inside a Remotion <Composition> or <Player>.',
    },
  ],
  cues: [
    { label: "First chip lands", at: 0.5, note: "“Idea” has scaled in; “Datos” is just starting." },
    { label: "Second chip lands", at: 0.9, note: "“Datos” is nearly settled and “Historia” starts to scale in." },
  ],
  qa: [
    "Step through the first frame (children invisible), mid-cascade (earlier children settled, later ones entering), and the last frame (all fully opaque at rest).",
    "Try each `from` value: directional entrances move by `dist` and settle at 0 offset; `scale` grows without translating.",
    "Check the spring overshoot does not push content past the safe area, especially with large `dist` values in vertical.",
    "For Leave, confirm the block is fully transparent 0.4 s after `at` and its layout space remains.",
  ],
} satisfies ItemContract
