import type { ItemContract } from "../schema"

export default {
  name: "captions",
  entry: "component",
  title: "Captions",
  description:
    "Kinetic subtitle pill that groups aligned words into phrases and lights each word as it is spoken.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "Captions",
      kind: "component",
      summary:
        "Absolutely positioned ink pill near the bottom of the stage. Words group into phrases that break after punctuation, at pauses over 0.55 s, or at 9 words (landscape) / 6 words (vertical). A phrase fades in and out over up to 0.12 s; unspoken words sit at 0.28 opacity, and emphasized words turn the soft accent color with a small bounce. Renders nothing between phrases.",
      props: {
        words:
          "Aligned words in order: `w` is the word (trailing punctuation ends a phrase), `s` and `e` are start and end times in seconds, and `emph` marks an emphasized word.",
        orientation:
          "Stage orientation: `vertical` uses a larger 54px font, 6-word phrases, a 940px max width, and sits 270px from the bottom; `landscape` uses 44px, 9 words, 1500px, and 84px.",
        offset: "Seconds subtracted from the Sequence time before matching words, for word timings measured from a different origin.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: "fill", height: 83 },
    vertical: { width: "fill", height: 104 },
    basis:
      "Absolutely positioned from left 0 to right 0 of the positioned parent (the stage), bottom 84 in landscape and 270 in vertical. One line of text: 44px × 1.25 line-height + 2 × 14px padding = 83 in landscape; 54px × 1.25 + 2 × 18px = about 104 in vertical. Each wrapped line (past the 1500 / 940px max width) adds 55 / 68px.",
  },
  examples: [
    {
      title: "Subtitles from aligned words",
      code: 'import { Captions } from "@/jbm/motion/captions"\n\n<Captions words={[\n  { w: "Una", s: 0, e: 0.7 },\n  { w: "idea.", s: 0.7, e: 1.5, emph: true },\n]} />',
    },
    {
      title: "Vertical video with a timing offset",
      code: 'import { Captions } from "@/jbm/motion/captions"\n\n<Captions words={alignedWords} orientation="vertical" offset={12.4} />\n// Place inside a positioned stage (e.g. Scene) in a Remotion composition.',
    },
  ],
  start: "Empty stage",
  cues: [
    { label: "Emphasis word", at: 1.1, note: "“idea” is spoken in the soft colour after its pop; later words wait at low opacity." },
    { label: "Every word spoken", at: 2.5, note: "All words are at full opacity while the pill holds before fading out." },
  ],
  qa: [
    "Step through the first frame of a phrase (fading in), mid-phrase (spoken words bright, upcoming words dim, emphasis in the soft color), and the phrase end (fading out, then nothing between phrases).",
    "Check grouping: a comma or period ends a phrase, a pause over 0.55 s starts a new one, and long runs split at 9 (landscape) or 6 (vertical) words.",
    "Render in vertical: the pill sits above the lower safe area and long phrases wrap inside 940px without covering the subject.",
    "The last phrase stays up to one second after its final word; confirm the composition is long enough to show its fade-out.",
  ],
} satisfies ItemContract
