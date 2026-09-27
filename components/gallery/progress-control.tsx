"use client"

import { useId } from "react"

/** Three named states at 0, ½ and 1, in that order ("Closed", "Half", "Open"). */
export type Presets = readonly [string, string, string]

const stops = [0, 0.5, 1] as const
const percent = (value: number) => `${Math.round(value * 100)}%`

/** Whole degrees with a true minus sign: "−7°". */
export const degrees = (value: number) => {
  const n = Math.round(value)
  return `${n < 0 ? "−" : ""}${Math.abs(n)}°`
}

/**
 * A 0–1 illustration control: label, the value as a mono percentage, the slider, and segmented
 * presets for the item's natural states. Screen readers hear "60%", not "0.6". The same control
 * renders on index cards and /c/<name> pages.
 */
export function ProgressControl({
  label,
  value,
  onChange,
  presets,
  ariaLabel = label,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  presets?: Presets
  /** Accessible slider name when the visible label needs more context. */
  ariaLabel?: string
}) {
  const id = useId()
  return (
    <div className="progress-control">
      <div className="progress-control-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} aria-hidden="true">
          {percent(value)}
        </output>
      </div>
      <div className="progress-control-row">
        <input
          id={id}
          aria-label={ariaLabel}
          aria-valuetext={percent(value)}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {presets && (
          <div
            className="progress-presets"
            role="group"
            aria-label={`${ariaLabel} presets`}
          >
            {presets.map((name, i) => (
              <button
                key={name}
                type="button"
                aria-pressed={Math.abs(value - stops[i]) < 0.005}
                onClick={() => onChange(stops[i])}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A slider over a non-progress range (an angle, a position in degrees): same layout as
 * ProgressControl, with the readout and aria-valuetext in the control's own unit.
 */
export function RangeControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  ariaLabel = label,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  format: (value: number) => string
  ariaLabel?: string
}) {
  const id = useId()
  return (
    <div className="progress-control">
      <div className="progress-control-head">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} aria-hidden="true">
          {format(value)}
        </output>
      </div>
      <div className="progress-control-row">
        <input
          id={id}
          aria-label={ariaLabel}
          aria-valuetext={format(value)}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    </div>
  )
}

/**
 * A small whole-number control (a count of folders, sheets): label and a mono readout in the
 * control's own unit, then joined − / + buttons in the preset style. The readout is an <output>,
 * a polite status, so each press is announced ("4 folders"). At a bound the button stays
 * focusable (aria-disabled) and does nothing, so keyboard focus never drops to the page.
 */
export function StepperControl({
  label,
  value,
  onChange,
  min,
  max,
  format,
  noun,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  format: (value: number) => string
  /** Plural noun for the button names: "Fewer folders", "More folders". */
  noun: string
}) {
  const id = useId()
  const steps = [
    ["−", `Fewer ${noun}`, -1, value <= min],
    ["+", `More ${noun}`, 1, value >= max],
  ] as const
  return (
    <div className="progress-control" role="group" aria-labelledby={id}>
      <div className="progress-control-head">
        <span id={id}>{label}</span>
        <output>{format(value)}</output>
      </div>
      <div className="progress-control-row">
        <div className="progress-presets progress-stepper">
          {steps.map(([glyph, name, delta, atBound]) => (
            <button
              key={glyph}
              type="button"
              aria-label={name}
              aria-disabled={atBound || undefined}
              onClick={() => {
                if (!atBound)
                  onChange(Math.min(max, Math.max(min, value + delta)))
              }}
            >
              <span aria-hidden="true">{glyph}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
