import type { ItemContract } from "../schema"

export default {
  name: "code-card",
  entry: "component",
  title: "CodeCard",
  description:
    "Dark code card that types each line in place at a steady character rate, one line after another.",
  category: "Motion",
  capabilities: ["replay", "player"],
  api: [
    {
      export: "CodeCard",
      kind: "component",
      summary:
        "Fixed-size dark Card with three window dots, an optional mono title, and mono code lines. Each line starts typing at its `at` cue or when the previous line finishes, whichever is later, at `charsPerSecond`; empty rows keep their line height so the layout never jumps.",
      props: {
        lines:
          "Code lines in order: `t` is the text (whitespace preserved, no wrapping), `at` is the earliest start in seconds relative to the enclosing Sequence, and optional `color` overrides the cream text color.",
        w: "Card width in stage pixels.",
        h: "Card height in stage pixels; content beyond it is clipped.",
        size: "Code font size in stage pixels; lines are 1.55 × size tall.",
        title: "Optional mono file name beside the window dots.",
        charsPerSecond: "Typing rate in characters per second; must be positive and finite or the schedule throws.",
      },
    },
    {
      export: "codeTypingSchedule",
      kind: "function",
      summary:
        "Builds the sequential typing schedule CodeCard uses, in frames. Use it in the host to budget scene duration: the last entry's `end` plus one terminal frame.",
      params: {
        lines: "The same `{ t, at }` lines passed to CodeCard; `at` in seconds.",
        fps: "Composition frames per second.",
        charsPerSecond: "Typing rate; throws a RangeError unless positive and finite.",
      },
      returns:
        "One `{ characters, start, end }` per line: the line split into characters (code points) and its start and end frames.",
    },
    {
      export: "typedCode",
      kind: "function",
      summary: "The visible prefix of one scheduled line at a given frame.",
      params: {
        line: "One entry from codeTypingSchedule.",
        frame: "Current frame relative to the enclosing Sequence.",
        fps: "Composition frames per second.",
        charsPerSecond: "Typing rate; must match the value used for the schedule.",
      },
      returns: "The typed text so far: empty before `start`, the full line from `end` on.",
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 900, height: 520 },
    vertical: { width: 900, height: 520 },
    basis:
      "The card is border-box with width `w` (900) and height `h` (520) at the defaults, regardless of content. Scene specs pass w = min(usable width, 1200) and h 480 in landscape, the usable width (936) and h 520 in vertical, and the available height in illustration layouts. Long lines do not wrap; they clip at the card edge.",
  },
  examples: [
    {
      title: "Type a short file",
      code: 'import { CodeCard } from "@/jbm/motion/code-card"\n\n<CodeCard title="hello.ts" charsPerSecond={32} lines={[\n  { t: "const idea = \\"simple\\"", at: 0.2 },\n  { t: "render(idea)", at: 0.7, color: "#FF8A6A" },\n]} />',
    },
    {
      title: "Budget the scene length",
      code: 'import { codeTypingSchedule } from "@/jbm/motion/code-card-timing"\n\nconst fps = 30\nconst schedule = codeTypingSchedule(lines, fps, 32)\nconst durationInFrames = (schedule.at(-1)?.end ?? 0) + 1',
    },
  ],
  qa: [
    "Step to the first frame (empty rows at full height), mid-typing (a partially typed line, earlier lines complete), and the last frame (every line complete).",
    "Give two lines overlapping `at` cues: the second waits for the first to finish instead of typing in parallel.",
    "Check the longest line and the line count fit inside `w` × `h` at the chosen `size`; overflow is clipped, not wrapped.",
    "Inspect the dark surface border and shadow at display scale (docs/surface-depth.md).",
  ],
  docs: [
    { title: "Scene spec guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/scene-spec.md" },
  ],
} satisfies ItemContract
