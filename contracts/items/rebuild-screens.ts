import type { ItemContract } from "../schema"

export default {
  name: "rebuild-screens",
  entry: "component",
  title: "RebuildScreens",
  description:
    "A phone screen assembled piece by piece, then rebuilt on each new screen that springs onto the pile; Stamp slams a loud word on top.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "RebuildScreens",
      kind: "component",
      summary:
        "Fixed w × h box holding a pile of tilted PhoneFrames. The first screen is present from the start and its pieces (card, input, button, stacked in that order) pop in on their own cues. Each cue in `again` springs in another screen offset up and to the right, whose pieces rebuild in a quick stagger; the pile re-centres as screens arrive. An optional sticker stamps a word near the top left. The input piece's cursor blinks about 2.2 times per second.",
      props: {
        w: "Box width in stage pixels; also caps the phone width at 50% of w.",
        h: "Box height in stage pixels; the phone width is also capped at 47% of h (phone height is 1.82 × its width).",
        pieces:
          "Pieces for the first screen: `kind` is button, input, or card and `at` is its entrance in seconds relative to the Sequence. One piece per kind; rendering order is always card, input, button.",
        again: "Seconds at which each extra screen arrives; every cue adds one screen whose pieces rebuild starting 0.12 s after it.",
        sticker: "Optional loud word: `text` and the `at` second it stamps in over the pile.",
        rebuildStep: "Seconds between pieces when a new screen rebuilds them, in the order the pieces are listed in `pieces`.",
        phoneScale:
          "Multiplies the default phone width; above 1 it is still limited so the whole pile fits in 90% of the box. Must be positive and finite or it throws.",
      },
    },
    {
      export: "Stamp",
      kind: "component",
      summary:
        "Absolutely positioned Sticker that slams in from 1.7× to 1× scale on a bouncy spring (damping 9, stiffness 160) and fades in over the first half of the spring. Catalog reuses it.",
      props: {
        at: "Stamp time in seconds relative to the enclosing Sequence.",
        text: "The loud word or short phrase; it does not wrap.",
        left: "Left offset in stage pixels inside the positioned parent.",
        top: "Top offset in stage pixels inside the positioned parent.",
        size: "Sticker font size in stage pixels; the sticker's padding and corner radius scale with it.",
        rotate: "Sticker tilt in degrees; negative tilts counter-clockwise.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 1680, height: 720 },
    vertical: { width: 936, height: 1000 },
    basis:
      "The component is exactly `w` × `h`; w and h are required, so these are the scene-spec `screens` defaults in flow layout: the usable width (1920 − 2 × 120, 1080 − 2 × 72) and h 720 landscape / 1000 vertical (override with the block's `h`). The phone is min(470, 0.5 w, 0.47 h) wide at phoneScale 1: 338 × 615 landscape, 468 × 852 vertical. Tilts and the arrival spring can reach slightly past the box.",
  },
  examples: [
    {
      title: "Build, then rebuild twice",
      code: 'import { RebuildScreens } from "@/jbm/motion/rebuild-screens"\n\n<RebuildScreens w={936} h={1000}\n  pieces={[{ kind: "button", at: 1 }, { kind: "input", at: 2.8 }, { kind: "card", at: 5.3 }]}\n  again={[12.9, 14.5]} sticker={{ text: "¿otra vez?", at: 13 }} />',
    },
    {
      title: "Stamp a word on any scene",
      code: 'import { Stamp } from "@/jbm/motion/rebuild-screens"\n\n<div style={{ position: "relative", width: 936, height: 600 }}>\n  <Stamp at={2} text="¡listo!" left={420} top={60} size={96} />\n</div>',
    },
  ],
  qa: [
    "Step to the start (empty first phone), mid-build (some pieces in), the moment each `again` screen arrives (spring from the upper right, pile re-centering), and the end (all screens rebuilt, sticker settled).",
    "Check the rotated phones and sticker stay inside the safe area in both orientations, especially with phoneScale above 1 or three or more screens.",
    "Rebuilt pieces stagger in `pieces` array order while pieces always stack card, input, button; confirm the rebuild order reads as intended. Duplicate kinds share a React key and are not supported.",
    "Confirm the input cursor blink is visible but not distracting at the final render scale.",
  ],
  docs: [
    { title: "Scene spec guide", url: "https://jbm-ui.bns.studio/docs/scene-spec.md" },
  ],
} satisfies ItemContract
