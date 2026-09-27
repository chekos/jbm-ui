import type { ItemContract } from "../schema"

export default {
  name: "propagate",
  entry: "component",
  title: "Propagate",
  description:
    "One source card fans ink lines out to a row of phone screens; bug, fix, and recolour cues travel down the lines to every screen.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "Propagate",
      kind: "component",
      summary:
        "Remotion illustration of one source of truth. At `at` the sheet springs in, the curved lines draw over 0.9 s from at + 0.25, and the screens pop up one by one (0.08 s apart). Optional cue pairs then play: `bug` puts a cross badge on the source and every screen; `fix` → `fixed` flips the source badge to a check, sends vermilion pulses down the lines, and flips every screen's badge on arrival; `recolor` → `recolored` crossfades the source buttons to vermilion (badges fade out from recolor − 0.2), sends pulses, and recolours every screen on arrival. Absent cues never fire.",
      props: {
        w: "Box width in stage pixels; the screens divide it into columns and the source card is 47% of it (at most 440).",
        h: "Box height in stage pixels; screens fill the space below the source, capped at 1.6 × their width.",
        at: "Seconds from the start of the sequence when the sheet enters and the lines start drawing.",
        label: "Optional sticker above the source: `text` and its entrance `at` in seconds. Reserves extra room above the source card.",
        targets: "Number of screens; a positive integer (throws otherwise). Up to 6 sit in one row; more split into two rows.",
        bug: "Seconds when the cross badges appear on the source and on every screen.",
        fix: "Seconds when the source badge flips to a check and fix pulses leave the source.",
        fixed: "Seconds when fix pulses arrive and every screen's badge flips to a check. Must be later than `fix`.",
        recolor: "Seconds when the source buttons turn vermilion (0.35 s crossfade) and recolour pulses leave; badges fade out from 0.2 s before.",
        recolored: "Seconds when recolour pulses arrive and every screen's buttons turn vermilion. Must be later than `recolor`.",
      },
    },
    {
      export: "propagationProgress",
      kind: "function",
      summary:
        "Pulse position along the lines for one departure/arrival pair, eased in-out cubic and clamped. Used by Propagate; exported for tests and custom pulses.",
      params: {
        sec: "Current time in seconds (e.g. from useSec).",
        from: "Departure cue in seconds; when either cue is missing the result is -1 (no pulse).",
        to: "Arrival cue in seconds; must be finite and later than `from`, or it throws a RangeError.",
      },
      returns: "Progress from 0 (at the source) to 1 (arrived), or -1 when a cue is missing. Pulses render only strictly between 0 and 1.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 1680, height: 760 },
    vertical: { width: 936, height: 1040 },
    basis:
      "The box is exactly w × h (both required). The numbers are what SceneFromSpec passes in a legacy flow layout: the safe-area width (1920 − 2 × 120, 1080 − 2 × 72) and the default block height { landscape: 760, vertical: 1040 }. In illustration layouts it gets the allocated height instead. Badges (−22px on the source, −14px on screens), screen tilt, and shadows can reach past the box.",
  },
  examples: [
    {
      title: "Bug, fix, and recolour across six screens",
      code: 'import { Propagate } from "@/jbm/motion/propagate"\n\n<Propagate w={936} h={1040} at={0.9} targets={6}\n  label={{ text: "una sola fuente de verdad", at: 4 }}\n  bug={5.8} fix={6.6} fixed={7.7} recolor={10.5} recolored={11.7} />\n// Render inside a Remotion <Composition> or <Player>.',
    },
    {
      title: "Recolour only, eight screens in two rows",
      code: 'import { Propagate } from "@/jbm/motion/propagate"\n\n<Propagate w={1680} h={760} at={0.2} targets={8}\n  recolor={3} recolored={4.2} />',
    },
  ],
  cues: [
    { label: "Bug appears", at: 2.3, note: "Cross badges sit on the source and on every screen; no pulse has left yet." },
    { label: "Fix travels", at: 2.8, note: "The source shows a check and vermilion pulses are mid-line; screens still show crosses." },
    { label: "Fix lands", at: 3.7, note: "Every screen shows a check and nothing is in flight, before the recolour starts." },
  ],
  qa: [
    "Step through at, mid-line draw, and each cue: badges scale in on `bug`, pulses travel only between departure and arrival, and screens change exactly on `fixed` and `recolored`.",
    "Check the final frame: every screen shows vermilion buttons, badges have faded out after a recolour, and nothing is mid-flight.",
    "Try targets 1, 6, and 7+: one row up to 6, two rows beyond; confirm screens do not become too short when h is small (height is floored by the space left under the source).",
    "Without a label the source sits at the top of the box and its badge pokes 22px above it; leave room in the layout.",
    "Inspect landscape and vertical widths: the last screen's badge and tilt can cross the right edge by about 14px.",
  ],
  docs: [
    { title: "Scene spec guide", url: "https://jbm-ui.bns.studio/docs/scene-spec.md" },
  ],
} satisfies ItemContract
