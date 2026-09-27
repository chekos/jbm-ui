import type { ItemContract } from "../schema"

const layoutParams = {
  w: "Print width in stage pixels (default 480); the layout scales with it.",
  marks: "Positions 0–1 along the scrub rule.",
  link: "The URL, when the print carries a link tag; only its presence matters here.",
  at: "The print's top-left corner on your stage (default { x: 0, y: 0 }); every returned point is offset by it.",
}

export default {
  name: "video-print",
  entry: "component",
  title: "VideoPrint",
  description:
    "A printed video still on a Paper sheet: a pale 16:9 line sketch, an ink scrub rule with anchor ticks, title and date, and an optional punched link tag.",
  category: "UI Bits",
  capabilities: ["controls"],
  api: [
    {
      export: "VideoPrint",
      kind: "component",
      summary:
        "A Paper sheet (radius 10, ink edge, paper shadow) carrying a 16:9 frame in pale ink (8% fill, 2px ink outline) with a head-and-shoulders line sketch, a pale scrub track whose ink bar advances with `scrub`, ink ticks at the marks the bar has passed, the title (Geist 700) and date (Geist, Graphite), and, when `link` is set, a PunchedTag with the URL in Geist Mono hanging over the bottom edge. Composes Paper and PunchedTag unchanged. Controlled; no timers.",
      props: {
        scrub: "Playhead 0–1: how far the ink scrub bar has advanced along the rule. Clamped; NaN is 0.",
        marks: "Positions 0–1 along the rule. A mark leaves an ink tick once scrub reaches it; its anchor point exists from the start (videoPrintLayout().marks), so a thread can tie on as the tick appears.",
        title: "The video's title in bold type under the rule; one line, ellipsis when long.",
        date: "The line under the title, usually source and date (\"YouTube · 4 nov 2025\").",
        link: "A URL set in mono on a punched tag straddling the bottom edge: the sign that this page was opened. Omit for a print nobody opened.",
        opened: "0–1: the tag drops 14px into place while it fades in. Only used with link; 0 hides it.",
        w: "Width in stage pixels (default 480). Everything scales with it; the height is 0.765 × w.",
        sheet: "Draw the Paper sheet (default). false keeps the same layout and anchors without the sheet, for nesting on a Paper you already have.",
        style: "Inline styles merged onto the outer box, e.g. position and left/top on a stage.",
      },
    },
    {
      export: "videoPrintLayout",
      kind: "function",
      summary:
        "Where everything on the print sits, so Hilo threads and hands can reach it. Pass the print's stage position as `at` to get stage coordinates.",
      params: layoutParams,
      returns:
        "{ scale, w, h, pad, frame: { x, y, w, h }, rule: { x, y, w }, titleY, dateY, marks: Pt[], tag: Pt | null, tagX }. marks[i] is mark i's point on the rule's centreline; tag is the punched hole's centre (on the sheet's bottom edge), or null without a link.",
    },
    { export: "VideoPrintProps", kind: "type", summary: "Props of VideoPrint." },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 480, height: 367 },
    vertical: { width: 480, height: 367 },
    basis:
      "At the default w 480: 22px padding, a 436 × 245.25 frame, the rule 12px under it, the title 18px under the rule, the date 30px under the title, then 18 + 22px: 367.25px tall. Every measurement scales with w (height = 0.765 × w). With link, the tag hangs about 17px below the bottom edge and may extend past the right edge for long URLs.",
  },
  examples: [
    {
      title: "Video print with an opened link",
      code: 'import { VideoPrint } from "@/jbm/ui/video-print"\n\n<VideoPrint\n  scrub={1}\n  title="Alex Hormozi"\n  date="YouTube · 4 nov 2025"\n  link="youtube.com/watch?v=mr4Pw66_498"\n/>',
    },
    {
      title: "Tie a thread to a scrub tick",
      code: 'import { VideoPrint, videoPrintLayout } from "@/jbm/ui/video-print"\nimport { Hilo } from "@/jbm/ui/hilo" // install @jbm/hilo separately\n\ndeclare const scrub: number\nconst at = { x: 1200, y: 300 }\nconst marks = [0.2, 0.45, 0.7]\nconst tick = videoPrintLayout({ marks }, at).marks[1]\n<div style={{ position: "relative", width: 1920, height: 1080 }}>\n  <VideoPrint scrub={scrub} marks={marks} title="Alex Hormozi" date="YouTube · 4 nov 2025" style={{ position: "absolute", left: at.x, top: at.y }} />\n  <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>\n    <Hilo from={tick} to={{ x: 520, y: 400 }} curve="s" bend={0.5} draw={scrub >= 0.45 ? 1 : 0} />\n  </svg>\n</div>',
    },
  ],
  qa: [
    "Drag Scrub from 0 to 1: the ink bar grows from the left edge of the frame, each tick appears exactly when the bar reaches it, and nothing inks ahead of the bar.",
    "The frame reads as a pale sketch (tinted fill, ink outline, head circle and shoulder arc), never a solid ink block; compare with the video and puertas board panels.",
    "Toggle the link and drag Tag drops in: the mono URL tag straddles the bottom edge, its hole ringed in ink; a long URL extends past the sheet instead of wrapping.",
    "Turn the sheet off: the frame, rule, and type keep their positions (anchors unchanged).",
    "Check a thread tied to videoPrintLayout().marks lands on the tick centreline, at w 300 and 480.",
    "The print uses no vermilion of its own.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
