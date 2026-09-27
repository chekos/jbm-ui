import type { ItemContract } from "../schema"

export default {
  name: "clock",
  entry: "component",
  title: "Clock",
  description: "A deterministic analog clock and time label. Supply time explicitly for web or video.",
  category: "UI",
  capabilities: ["controls"],
  api: [
    {
      export: "Clock",
      kind: "component",
      summary:
        "Analog face (dim ring, four quarter ticks, ink hour hand, vermilion minute hand) beside a mono HH:MM label. No timers: the time is (hours × 60 + minutes) wrapped to 24 hours, the hour hand moves continuously with the minutes, and the face is aria-hidden so the label carries the time. Throws RangeError for non-finite values or size ≤ 0.",
      props: {
        hours: "Hours on a 24-hour day; fractions and values outside 0–23 wrap.",
        minutes: "Minutes added to hours; may exceed 59 (e.g. hours 0, minutes 510 is 08:30) and wraps across days.",
        size: "Width and height of the clock face in stage pixels.",
        label: "Text shown instead of the zero-padded 24-hour HH:MM derived from the time.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: "auto", height: 64 },
    vertical: { width: "auto", height: 64 },
    basis:
      "Inline-flex row: a size × size face (64 by default), a 16px gap, and the label in 22px mono. Height equals size while it exceeds the text line; width follows the label. The row wraps when its container is narrower, putting the label below the face.",
  },
  examples: [
    {
      title: "Half past eight",
      code: 'import { Clock } from "@/jbm/ui/clock"\n\n<Clock hours={8} minutes={30} size={64} />\n// Explicit time keeps rendering deterministic. No autoplay.',
    },
    {
      title: "Drive it from minutes of the day",
      code: 'import { Clock } from "@/jbm/ui/clock"\n\nconst minutes = 510 // e.g. from a slider or a video frame\n<Clock hours={0} minutes={minutes} size={96} label="Mañana" />',
    },
  ],
  qa: [
    "Sweep the time control from 00:00 to 23:59: the minute hand completes each hour, the hour hand advances smoothly, and the label matches.",
    "Check 12:00 and 00:00 both point straight up and 06:00 straight down.",
    "At a narrow width the label wraps below the face without clipping.",
  ],
} satisfies ItemContract
