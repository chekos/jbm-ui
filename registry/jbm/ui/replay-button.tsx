import * as React from "react"
import { color } from "../lib/tokens"

export type ReplayButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "type" | "aria-label"
> & {
  /** Normalized progress from the real animation timeline, clamped to 0–1. */
  progress: number
  /** Locks replay until the host animation has finished. */
  charging: boolean
  onReplay: () => void
  label?: string
  iconSize?: number
}

/** Controlled replay: tail-to-head charge, no internal timer or playback dependency. */
export function ReplayButton({
  progress,
  charging,
  onReplay,
  label = "Replay animation",
  iconSize = 26,
  disabled = false,
  style,
  title,
  ...props
}: ReplayButtonProps) {
  const charge = charging
    ? Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0))
    : 1
  const complete = charge >= 1
  const headCharge = Math.min(1, Math.max(0, (charge - 0.85) / 0.15))
  const locked = charging || disabled
  return (
    <button
      {...props}
      type="button"
      aria-label={label}
      title={title ?? (charging ? "Replay recharging" : "Replay")}
      disabled={locked}
      onClick={() => {
        if (!locked) onReplay()
      }}
      style={{
        color: color.ink,
        border: 0,
        borderRadius: 6,
        background: "transparent",
        padding: 9,
        minWidth: 44,
        minHeight: 44,
        display: "inline-grid",
        placeItems: "center",
        cursor: locked ? "default" : "pointer",
        ...style,
      }}
    >
      <svg
        style={{ display: "block", width: iconSize, height: iconSize }}
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {complete ? (
          <path
            data-replay-complete=""
            d="M20 14 A8 8 0 1 1 19 6 L21 8 M16 8 H21 V3"
          />
        ) : (
          <>
            <g opacity={0.18}>
              <path d="M20 14 A8 8 0 1 1 19 6 L21 8" />
              <path d="M16 8 H21 V3" />
            </g>
            <path
              data-replay-shaft=""
              d="M20 14 A8 8 0 1 1 19 6 L21 8"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - Math.min(1, charge / 0.85)}
              opacity={charge > 0 ? 1 : 0}
            />
            <g opacity={charge > 0.85 ? 1 : 0}>
              {["M16 8 H21", "M21 3 V8"].map((d) => (
                <path
                  key={d}
                  d={d}
                  pathLength="1"
                  strokeDasharray="1"
                  strokeDashoffset={1 - headCharge}
                />
              ))}
            </g>
          </>
        )}
      </svg>
    </button>
  )
}
