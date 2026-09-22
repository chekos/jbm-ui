import { ChatBubble } from "../ui/chat-bubble"
import { color, font } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"

export type BurbujaProps = {
  words: readonly string[]
  highlight: readonly number[]
  target?: Pt
  arrive: number
  glow: number
  link: number
  leave?: number
  side?: "start" | "end"
  speaker?: string
  at?: Pt
  width?: number
  fontSize?: number
  hook?: boolean
}

/** Explicit mono cells make wrapping and anchors independent of browser measurements. */
export function burbujaLayout({
  words,
  width = 360,
  fontSize = 20,
  speaker,
  at = { x: 0, y: 0 },
  arrive = 1,
  leave = 0,
  side = "end",
}: Pick<
  BurbujaProps,
  | "words"
  | "width"
  | "fontSize"
  | "speaker"
  | "at"
  | "arrive"
  | "leave"
  | "side"
>) {
  const cell = fontSize * 0.64
  const w = Math.max(
    width,
    40 + Math.max(1, ...words.map((word) => Array.from(word).length)) * cell
  )
  const lineHeight = fontSize * 1.55
  let x = 0,
    row = 0
  const top = speaker ? 43 : 16
  const offset =
    (side === "end" ? 1 : -1) * (1 - unit(arrive) + unit(leave)) * 90
  const origin = { x: at.x + offset, y: at.y }
  const positions = words.map((word) => {
    const wordWidth = Array.from(word).length * cell
    if (x > 0 && x + wordWidth > w - 40) {
      row++
      x = 0
    }
    const position = {
      x: x + 20,
      y: top + row * lineHeight,
      w: wordWidth,
      anchor: {
        x: origin.x + x + 20 + wordWidth / 2,
        y: origin.y + top + (row + 1) * lineHeight,
      },
    }
    x += wordWidth + cell
    return position
  })
  return {
    origin,
    w,
    h: top + (row + 1) * lineHeight + 16,
    positions,
    lineHeight,
    cell,
  }
}

/** HTML scene overlay; target and at use the same containing block's pixel coordinates.
 * Decrease link from 1 to 0 to retract a failed match. No internal clock or DOM measurement.
 */
export function Burbuja(props: BurbujaProps) {
  const {
    words,
    highlight,
    target,
    arrive,
    glow,
    link,
    leave = 0,
    side = "end",
    speaker,
    fontSize = 20,
    hook = false,
  } = props
  const l = burbujaLayout(props)
  const indices = [...new Set(highlight)].filter(
    (i) => Number.isInteger(i) && i >= 0 && i < words.length
  )
  const anchor = l.positions[indices[indices.length - 1]]?.anchor
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: unit(arrive) * (1 - unit(leave)),
      }}
    >
      <ChatBubble
        role="group"
        side={side}
        speaker={speaker}
        aria-label={words.join(" ")}
        style={{
          position: "absolute",
          left: l.origin.x,
          top: l.origin.y,
          width: l.w,
          maxWidth: "none",
          height: l.h,
          margin: 0,
          fontFamily: font.mono,
          outline: `1px solid ${color.ink}`,
        }}
      >
        <span aria-hidden="true">
          {words.map((word, i) => {
            const pos = l.positions[i]
            const order = indices.indexOf(i)
            const p = order < 0 ? 0 : unit(unit(glow) * indices.length - order)
            return (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: pos.x,
                  top: pos.y,
                  width: pos.w,
                  height: l.lineHeight,
                  lineHeight: `${l.lineHeight}px`,
                  fontSize,
                  whiteSpace: "pre",
                  fontWeight: 400 + 300 * p,
                  color: `rgb(${32 + (198 - 32) * p}, ${36 + (61 - 36) * p}, ${31 + (36 - 31) * p})`,
                }}
              >
                {Array.from(word).map((char, j) => (
                  <span
                    key={j}
                    style={{
                      display: "inline-block",
                      width: l.cell,
                      textAlign: "center",
                    }}
                  >
                    {char}
                  </span>
                ))}
                {hook && (
                  <svg
                    width={pos.w}
                    height={9}
                    style={{
                      position: "absolute",
                      top: l.lineHeight - 1,
                      left: 0,
                      opacity: p,
                    }}
                  >
                    <path
                      d={`M0 1H${pos.w - 3}l-4 5`}
                      fill="none"
                      stroke={color.accent}
                      strokeWidth={2}
                    />
                  </svg>
                )}
              </span>
            )
          })}
        </span>
      </ChatBubble>
      {target && anchor && (
        <svg
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          <path
            d={`M${anchor.x} ${anchor.y}C${anchor.x} ${anchor.y + 60} ${target.x} ${target.y - 60} ${target.x} ${target.y}`}
            pathLength={1}
            fill="none"
            stroke={color.accent}
            strokeWidth={2}
            strokeDasharray="1 1"
            strokeDashoffset={1 - unit(link)}
            opacity={unit(link) > 0 ? 1 : 0}
          />
        </svg>
      )}
    </div>
  )
}
