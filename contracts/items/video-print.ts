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
  family: "Paper & writing",
  capabilities: ["controls"],
  api: [
    {
      export: "VideoPrint",
      kind: "component",
      summary:
        "A Paper sheet (radius 10, ink edge, paper shadow) carrying a 16:9 frame in pale ink (an opaque 8% ink-on-card tint, identical with or without the sheet, and a 2px ink outline) with a head-and-shoulders line sketch, a pale scrub track whose ink bar advances with `scrub`, ink ticks at the marks the bar has passed, the title (Geist 700) and date (Geist, Graphite), and, when `link` is set, a PunchedTag with the URL in Geist Mono hanging over the bottom edge. Composes Paper and PunchedTag unchanged. Controlled; no timers.",
      props: {
        scrub: "Playhead 0–1: how far the ink scrub bar has advanced along the rule. Clamped; NaN is 0.",
        marks: "Positions 0–1 along the rule. A mark leaves an ink tick once scrub reaches it; its anchor point exists from the start (videoPrintLayout().marks), so a thread can tie on as the tick appears.",
        title: "The video's title in bold type under the rule; one line, ellipsis when long.",
        date: "The line under the title, usually source and date (\"Video · 4 nov 2025\").",
        link: "A URL set in mono on a punched tag straddling the bottom edge: the sign that this page was opened. One line; a URL longer than the print ends in an ellipsis, so the tag never passes the sheet's right edge. Omit for a print nobody opened.",
        opened: "0–1: the tag drops 14 × w/480 px into place; it fades in over the first fifth of the drop and is opaque from then on, so the sheet's edge never shows through it. Only used with link; 0 hides it.",
        w: "Width in stage pixels (default 480). Everything scales with it; the height is 0.765 × w.",
        sheet: "Draw the Paper sheet (default). false keeps the same layout, anchors, and still tint without the sheet, for nesting on a Paper you already have.",
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
        "{ scale, w, h, pad, frame: { x, y, w, h }, rule: { x, y, w }, titleY, dateY, marks: Pt[], tag: Pt | null, tagX, tagMaxW, bounds: { w, h } }. marks[i] is mark i's point on the rule's centreline; tag is the punched hole's centre (on the sheet's bottom edge), or null without a link; tagMaxW is the tag's widest extent from tagX (it stops a padding short of the sheet's right edge); bounds is the box everything draws in, the sheet plus, with a link, the half of the tag that hangs below it.",
    },
    { export: "VideoPrintProps", kind: "type", summary: "Props of VideoPrint." },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 480, height: 385 },
    vertical: { width: 480, height: 385 },
    basis:
      "At the default w 480: 22px padding, a 436 × 245.25 frame, the rule 12px under it, the title 18px under the rule, the date 30px under the title, then 18 + 22px: a 367.25px sheet. With link, the tag straddles the bottom edge and half of it (15.1 × w/480 + 2px) hangs below: 384.35px in all, declared as 385. Every measurement scales with w (sheet height = 0.765 × w); videoPrintLayout().bounds gives the exact box. The tag never extends past the right edge: long URLs end in an ellipsis.",
  },
  examples: [
    {
      title: "Video print with an opened link",
      code: 'import { VideoPrint } from "@/jbm/ui/video-print"\n\n<VideoPrint\n  scrub={1}\n  title="Sample talk"\n  date="Video · 4 nov 2025"\n  link="example.com/watch?v=sample-talk"\n/>',
    },
    {
      title: "Tie a thread to a scrub tick",
      code: 'import { VideoPrint, videoPrintLayout } from "@/jbm/ui/video-print"\nimport { Hilo } from "@/jbm/ui/hilo" // install @jbm/hilo separately\n\ndeclare const scrub: number\nconst at = { x: 1200, y: 300 }\nconst marks = [0.2, 0.45, 0.7]\nconst tick = videoPrintLayout({ marks }, at).marks[1]\n<div style={{ position: "relative", width: 1920, height: 1080 }}>\n  <VideoPrint scrub={scrub} marks={marks} title="Sample talk" date="Video · 4 nov 2025" style={{ position: "absolute", left: at.x, top: at.y }} />\n  <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>\n    <Hilo from={tick} to={{ x: 520, y: 400 }} curve="s" bend={0.5} draw={scrub >= 0.45 ? 1 : 0} />\n  </svg>\n</div>',
    },
  ],
  qa: [
    "Drag Scrub from 0 to 1: the ink bar grows from the left edge of the frame, each tick appears exactly when the bar reaches it, and nothing inks ahead of the bar.",
    "The frame reads as a pale sketch (tinted fill, ink outline, head circle and shoulder arc), never a solid ink block; compare with the video and puertas board panels.",
    "Toggle the link and drag Tag drops in: the mono URL tag straddles the bottom edge, its hole ringed in ink and scaled with the print (PunchedTag scale = w/480), and stays inside the declared bounds; a long URL ends in an ellipsis instead of wrapping or passing the sheet's right edge. At Half the tag is already opaque.",
    "Turn the sheet off: the frame, rule, and type keep their positions (anchors unchanged), and the still keeps exactly the same tint.",
    "Check a thread tied to videoPrintLayout().marks lands on the tick centreline, at w 300 and 480.",
    "The print uses no vermilion of its own.",
  ],
  docs: [
    { title: "Paper and filing illustrations guide", url: "https://jbm-ui.bns.studio/docs/design-video-components.md" },
  ],
} satisfies ItemContract
