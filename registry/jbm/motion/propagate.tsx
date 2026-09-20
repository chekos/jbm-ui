import { interpolate, Easing } from "remotion"
import { color } from "../lib/tokens"
import { useIn, useProgress, useSec } from "./hooks"
import { Pop } from "./pop"
import { Paper, Sticker, type PaperTone } from "../ui/paper"
import { Badge, PhoneFrame, UiButton, UiCard } from "../ui/ui-bits"

/**
 * One source, many screens. A source card holds the piece; ink lines fan out to a grid of small
 * screens that each show the same piece. Cues:
 *   bug      — a cross badge appears on the source and on every screen (the same defect, everywhere)
 *   fix      — the source badge turns into a check; pulses leave along the lines
 *   fixed    — pulses arrive; every screen's badge turns into a check
 *   recolor  — the source piece turns vermilion; pulses leave
 *   recolored— every screen's piece turns vermilion
 * Timing between a cue and its arrival is the pulse's travel time, so it follows the narration.
 */
const NEVER = 1e6 // seconds: a cue that never arrives

export function Propagate({
  w,
  h,
  at,
  label,
  targets = 6,
  bug,
  fix,
  fixed,
  recolor,
  recolored,
}: {
  w: number
  h: number
  at: number
  label?: { text: string; at: number }
  targets?: number
  bug?: number
  fix?: number
  fixed?: number
  recolor?: number
  recolored?: number
}) {
  if (!Number.isInteger(targets) || targets < 1)
    throw new RangeError("targets must be a positive integer")
  const sec = useSec()
  const cols = targets <= 6 ? targets : Math.ceil(targets / 2)
  const rows = Math.ceil(targets / cols)
  const sw = Math.round(Math.min(440, w * 0.47))
  const sh = Math.round(sw * 0.45)
  const top = label ? Math.round(sh * 0.42) : 0 // room for the sticker above the source
  const rowGap = Math.round(h * 0.04)
  const colGap = Math.round(w * 0.02)
  const tw = Math.floor((w - colGap * (cols - 1)) / cols)
  const th = Math.min(
    Math.round(tw * 1.6),
    Math.floor(
      (h - top - sh - Math.round(h * 0.2) - rowGap * (rows - 1)) / rows
    )
  )
  const gridTop = h - rows * th - (rows - 1) * rowGap
  const sx = w / 2
  const sy = top + sh

  const sheet = useIn(at, { damping: 13 })
  const lines = useProgress(at + 0.25, 1, 0.9)
  const srcTone: PaperTone = "ink"
  // Every cue is optional; an absent cue is scheduled at NEVER so the hook order stays fixed.
  const bugP = useIn(bug ?? NEVER, { damping: 10 })
  const fixP = useIn(fix ?? NEVER, { damping: 10 })
  const fixedP = useIn(fixed ?? NEVER, { damping: 10 })
  const recolorP = useProgress(recolor ?? NEVER, 1, 0.35)
  const recoloredP = useProgress(recolored ?? NEVER, 1, 0.35)
  const badgesOut = 1 - useProgress((recolor ?? NEVER) - 0.2, 1, 0.4)

  const p1 = propagationProgress(sec, fix, fixed)
  const p2 = propagationProgress(sec, recolor, recolored)

  const cells = Array.from({ length: targets }).map((_, i) => {
    const c = i % cols
    const r = Math.floor(i / cols)
    const x = cols === 1 ? (w - tw) / 2 : c * (tw + colGap)
    const y = gridTop + r * (th + rowGap)
    return { x, y, tx: x + tw / 2, ty: y }
  })
  const path = (tx: number, ty: number) => {
    const my = sy + (ty - sy) * 0.5
    return {
      d: `M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`,
      pt: (t: number) => bez(sx, sy, sx, my, tx, my, tx, ty, t),
    }
  }

  return (
    <div style={{ position: "relative", width: w, height: h, opacity: sheet }}>
      <svg
        width={w}
        height={h}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {cells.map((cell, i) => {
          const { d } = path(cell.tx, cell.ty)
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={color.ink}
              strokeWidth={5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - lines}
            />
          )
        })}
        {cells.map((cell, i) => {
          const { pt } = path(cell.tx, cell.ty)
          return [p1, p2].map((pp, k) => {
            if (pp <= 0 || pp >= 1) return null
            const [px, py] = pt(pp)
            return (
              <circle
                key={`${i}-${k}`}
                cx={px}
                cy={py}
                r={13}
                fill={color.accent}
              />
            )
          })
        })}
      </svg>

      {/* source */}
      <div
        style={{
          position: "absolute",
          left: (w - sw) / 2,
          top,
          transform: `translateY(${(1 - sheet) * -30}px)`,
        }}
      >
        <Paper
          tone="paper"
          w={sw}
          h={sh}
          radius={28}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stacked
            w={Math.round(sw * 0.6)}
            h={Math.round(sw * 0.19)}
            accent={recolorP}
            base={srcTone}
          />
          <div
            style={{
              position: "absolute",
              right: -22,
              top: -22,
              opacity: Math.min(bugP, badgesOut),
              transform: `scale(${bugP})`,
            }}
          >
            <Flip p={fixP} size={Math.round(sw * 0.15)} />
          </div>
        </Paper>
        {label ? (
          <div
            style={{
              position: "absolute",
              left: -Math.round(sw * 0.12),
              top: -Math.round(sh * 0.36),
            }}
          >
            <Pop at={label.at} from="scale" dist={0}>
              <Sticker size={Math.round(w * 0.045)} rotate={-4}>
                {label.text}
              </Sticker>
            </Pop>
          </div>
        ) : null}
      </div>

      {/* targets */}
      {cells.map((cell, i) => (
        <div
          key={i}
          style={{ position: "absolute", left: cell.x, top: cell.y }}
        >
          <Pop at={at + 0.35 + i * 0.08} from="up" dist={24}>
            <PhoneFrame
              w={tw}
              h={th}
              rotate={[-2, 1.5, -1, 2, -1.5, 1][i % 6]}
              gap={Math.round(tw * 0.1)}
            >
              <UiCard w={Math.round(tw * 0.66)} h={Math.round(tw * 0.5)} />
              <Stacked
                w={Math.round(tw * 0.66)}
                h={Math.round(tw * 0.22)}
                accent={recoloredP}
                base="ink"
              />
            </PhoneFrame>
            <div
              style={{
                position: "absolute",
                right: -14,
                top: -14,
                opacity: Math.min(bugP, badgesOut),
                transform: `scale(${bugP})`,
              }}
            >
              <Flip p={fixedP} size={Math.round(tw * 0.2)} />
            </div>
          </Pop>
        </div>
      ))}
    </div>
  )
}

/** Two buttons stacked; `accent` 0→1 crossfades from the base tone to vermilion. */
function Stacked({
  w,
  h,
  accent,
  base,
}: {
  w: number
  h: number
  accent: number
  base: PaperTone
}) {
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <UiButton
        w={w}
        h={h}
        tone={base}
        style={{ position: "absolute", inset: 0 }}
      />
      <UiButton
        w={w}
        h={h}
        tone="accent"
        style={{ position: "absolute", inset: 0, opacity: accent }}
      />
    </div>
  )
}

/** Cross badge that flips into a check as `p` goes 0→1. */
function Flip({ p, size }: { p: number; size: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <Badge
        kind="x"
        size={size}
        tone="ink"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - p,
          transform: `rotate(${p * 90}deg)`,
        }}
      />
      <Badge
        kind="check"
        size={size}
        tone="accent"
        style={{
          position: "absolute",
          inset: 0,
          opacity: p,
          transform: `scale(${0.6 + 0.4 * p})`,
        }}
      />
    </div>
  )
}

function bez(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  t: number
): [number, number] {
  const u = 1 - t
  const x =
    u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
  const y =
    u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
  return [x, y]
}

/** Progress follows the exact departure and arrival cues, including short trips. */
export function propagationProgress(sec: number, from?: number, to?: number) {
  if (from === undefined || to === undefined) return -1
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) throw new RangeError("Propagation arrival must be later than departure")
  return interpolate(sec, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) })
}
