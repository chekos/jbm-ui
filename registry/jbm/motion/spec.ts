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

/** Any block may leave the screen on a cue: it fades out and drifts up from `until`. */
export type Exit = { until?: At }

export type Block = BlockBody & Exit

export type BlockBody =
  | {
      type: "big"
      at: At
      text: string
      color?: "accent" | "ink"
      size?: number
      from?: "up" | "scale" | "left"
      align?: "left" | "center"
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
  /** Illustrated blocks (paper cut-out pieces of interface). See ../ui/ui-bits.tsx. */
  | {
      /** A phone screen built piece by piece, then rebuilt on new screens on every `again` cue. */
      type: "screens"
      pieces: { kind: "button" | "input" | "card"; at: At }[]
      again?: At[]
      phoneScale?: number
      sticker?: { text: string; at: At }
      h?: number | { landscape: number; vertical: number }
    }
  | {
      /** A catalogue sheet of pieces (top row) and design-token glyphs (second row). */
      type: "catalog"
      at: At
      title?: string
      items: { kind: "button" | "input" | "card"; label: string; at: At }[]
      tokens?: { kind: "color" | "type" | "space"; label: string; at: At }[]
      /** When the sheet unfolds to show the token row (default: first token cue − 0.6 s). */
      tokensAt?: At
      stamp?: { text: string; at: At }
    }
  | {
      /** One source card fanning out to a grid of screens; bug/fix/recolor cues propagate along the lines. */
      type: "propagate"
      at: At
      label?: { text: string; at: At }
      targets?: number
      bug?: At
      fix?: At
      fixed?: At
      recolor?: At
      recolored?: At
      h?: number | { landscape: number; vertical: number }
    }
  | {
      /** A pile of wide library cards, each on its own cue; `tone: accent` for the one that is yours. */
      type: "shelf"
      items: { text: string; at: At; tone?: "paper" | "accent" | "ink" }[]
    }
  | {
      /** A button, the same button again, and a vermilion cross over the second. */
      type: "twice"
      at: At
      second: At
      strike?: At
    }
  | { type: "brand"; at: At; tagline?: string; size?: number }
  | {
      /** A layer over the flow: its blocks stack in their own centred column inside the safe area, so a
       *  late beat can take the middle of the screen after earlier blocks `until`-exit. */
      type: "overlay"
      blocks: Block[]
      valign?: "top" | "center"
    }

export type SafeArea =
  | "legacy"
  | "full"
  | "social"
  | { top: number; right: number; bottom: number; left: number }
export type SceneLayout =
  "flow" | "hero" | "headline-illustration" | "illustration"
export type CompositionOptions = {
  /** Insets are canvas pixels. Social is a house preset, not a platform guarantee. */
  safeArea?: SafeArea
  layout?: SceneLayout
  /** Fraction reserved for the first block in headline-illustration (default .25). */
  headlineRatio?: number
  /** Illustration subject scale; its logical box shrinks to preserve the safe area. */
  subjectScale?: number
  gap?: number | { landscape: number; vertical: number }
  valign?: "top" | "center"
  /** Overrides replace the entire block list; anchors remain shared. */
  blocks?: Block[]
}

export type SceneSpec = {
  id: string
  composition?: Omit<CompositionOptions, "blocks">
  variants?: Partial<Record<"landscape" | "vertical", CompositionOptions>>
  /** Scene heading (Label, top-left). Omit for a headline-only scene. */
  title?: string
  /** First words the narrator says in this scene; pipeline/build_timing.py cuts scene boundaries here. Not needed on the first scene. */
  starts?: string
  /** anchor name → phrase spoken in this scene. */
  anchors?: Record<string, string>
  blocks: Block[]
  /** Optional per-orientation gap between blocks (default 40). */
  gap?: number | { landscape: number; vertical: number }
  /** Vertical placement of the block stack inside the safe area (default top). */
  valign?: "top" | "center"
}

export type ScenesFile = { scenes: SceneSpec[] }
