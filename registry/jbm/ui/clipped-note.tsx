import type { CSSProperties, ReactNode } from "react"
import { Paper, paperInk, type PaperTone } from "./paper"
import { PaperClip } from "./paper-clip"
import { font } from "../lib/tokens"

export function ClippedNote({
  children,
  clip = true,
  tone = "paper",
  rotate = 0,
  style,
}: {
  children: ReactNode
  clip?: boolean
  tone?: PaperTone
  rotate?: number
  style?: CSSProperties
}) {
  return (
    <Paper
      tone={tone}
      rotate={rotate}
      radius={10}
      style={{ width: 220, maxWidth: "100%", padding: 18, ...style }}
    >
      {clip && (
        <PaperClip style={{ position: "absolute", left: 18, top: -24 }} />
      )}
      <div
        style={{
          fontFamily: font.sans,
          fontWeight: 700,
          color: paperInk(tone),
          lineHeight: 1.3,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </div>
    </Paper>
  )
}
