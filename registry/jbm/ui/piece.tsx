import type * as React from "react"
import type { PaperTone } from "./paper"
import { UiButton } from "./ui-button"
import { UiInput } from "./ui-input"
import { UiCard } from "./ui-card"
export type PieceKind = "button" | "input" | "card"
/** Any of the three pieces by name, at a width; height follows the piece's own proportion. */
export function Piece({
  kind,
  w,
  tone,
  cursorOn,
  style,
}: {
  kind: PieceKind
  w: number
  tone?: PaperTone
  cursorOn?: boolean
  style?: React.CSSProperties
}) {
  if (kind === "button")
    return (
      <UiButton
        w={w}
        h={Math.round(w * 0.32)}
        tone={tone ?? "ink"}
        style={style}
      />
    )
  if (kind === "input")
    return (
      <UiInput
        w={w}
        h={Math.round(w * 0.32)}
        cursorOn={cursorOn}
        style={style}
      />
    )
  return <UiCard w={w} h={Math.round(w * 0.78)} style={style} />
}
