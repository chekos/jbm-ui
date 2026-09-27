import type { ItemContract } from "../schema"

export default {
  name: "replay-button",
  entry: "component",
  title: "ReplayButton",
  description:
    "Controlled replay icon whose arrow charges from tail to arrowhead as the host animation progresses, then unlocks.",
  category: "Interactive",
  capabilities: ["replay"],
  api: [
    {
      export: "ReplayButton",
      kind: "component",
      summary:
        "Ink replay button with a 44px minimum hit area. While `charging`, the circular shaft draws on over the first 85% of `progress` and the arrowhead over the last 15%; clicks are ignored and the button stays focusable with aria-disabled. When not charging it shows the complete icon and calls `onReplay` on click. No internal timer and no Remotion dependency.",
      props: {
        progress:
          "Normalized progress of the host animation, 0–1. Clamped; non-finite values count as 0. Ignored (treated as 1) when `charging` is false.",
        charging:
          "True while the host animation plays: shows the partial charge and blocks activation (aria-disabled, still focusable). False shows the complete icon and allows replay.",
        onReplay:
          "Called on click only when neither `charging` nor `disabled` is set; restart your animation here.",
        label: "Accessible name (aria-label) for the button.",
        iconSize: "Width and height of the icon in pixels; the button adds 9px padding on each side.",
      },
    },
  ],
  stage: {
    mode: "declared",
    landscape: { width: 44, height: 44 },
    vertical: { width: 44, height: 44 },
    basis:
      "iconSize 26 plus 9px padding on each side gives 44×44, which is also the enforced minimum hit area. Size grows with iconSize (iconSize + 18); the gallery demo uses iconSize 52 for a 70×70 button.",
  },
  examples: [
    {
      title: "Wire to any animation",
      code: 'import { ReplayButton } from "@/jbm/ui/replay-button"\n\n<ReplayButton\n  progress={progress} // 0–1 from your animation\n  charging={isPlaying}\n  onReplay={restartAnimation}\n  label="Replay animation"\n/>',
    },
    {
      title: "Larger icon",
      code: 'import { ReplayButton } from "@/jbm/ui/replay-button"\n\n<ReplayButton progress={1} charging={false} onReplay={() => player.seekTo(0)} iconSize={52} />',
    },
  ],
  qa: [
    "Click replay and watch the charge: the shaft draws from its tail to the top-right, then the two arrowhead strokes draw in after 85% progress; at 100% the complete icon returns.",
    "While charging, click and press Enter/Space: nothing restarts, focus stays on the button, and it announces as disabled.",
    "Tab to the button and confirm the visible focus treatment on cream; check the 44×44 hit area at the default iconSize.",
    "Pass progress values below 0, above 1, and NaN while charging: the icon clamps instead of overdrawing or disappearing.",
  ],
} satisfies ItemContract
