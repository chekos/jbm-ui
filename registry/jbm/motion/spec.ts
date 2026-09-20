/**
 * Scene spec: the YAML shape a scene is written in. One spec compiles to both orientations.
 *
 * Timing: every `at` is an anchor NAME (a key of `anchors`), optionally with an offset: "posible+0.2".
 * Anchors map to a phrase in the narration; the host resolves them with its own timing table
 * (see `compile.tsx`, `resolve`). Numbers are also accepted as literal seconds from scene start.
 *
 * Text: every string that is shown on screen passes through the host's `t()` so one spec serves
 * every language; keys are the Spanish source strings, as in the Jev project.
 */
export type At = string | number

export type StatItem = {
  at: At
  label: string
  value: string
  sub?: string
  valueColor?: "accent" | "ink"
}

export type Block =
  | {
      type: "big"
      at: At
      text: string
      color?: "accent" | "ink"
      size?: number
      from?: "up" | "scale" | "left"
    }
  | { type: "stat-row"; items: StatItem[] }
  | { type: "note"; at: At; text: string }
  | { type: "callout"; at: At; text: string; variant?: "accent" | "ink" }
  | {
      type: "bullets"
      at: At
      items: string[]
      step?: number
      marker?: "arrow" | "dot"
    }
  | {
      type: "chips"
      at: At
      items: string[]
      step?: number
      accent?: boolean
      mono?: boolean
    }
  | {
      type: "code"
      at: At
      title?: string
      charsPerSecond?: number
      lines: { text: string; at: At; color?: "green" | "soft" | "dim" }[]
    }
  | { type: "spacer"; h: number | { landscape: number; vertical: number } }

export type SceneSpec = {
  id: string
  /** Scene heading (Label, top-left). Omit for a headline-only scene. */
  title?: string
  /** First words the narrator says in this scene; pipeline/build_timing.py cuts scene boundaries here. Not needed on the first scene. */
  starts?: string
  /** anchor name → phrase spoken in this scene. */
  anchors?: Record<string, string>
  blocks: Block[]
  /** Optional per-orientation gap between blocks (default 40). */
  gap?: number | { landscape: number; vertical: number }
}

export type ScenesFile = { scenes: SceneSpec[] }
