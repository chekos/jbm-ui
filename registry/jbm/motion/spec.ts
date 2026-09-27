/**
 * Scene spec: the YAML shape a scene is written in. One spec compiles to both orientations.
 *
 * Timing: every `at` is an anchor NAME (a key of `anchors`), optionally with an offset: "posible+0.2".
 * Anchors map to a phrase in the narration; the host resolves them with its own timing table
 * (see `compile.tsx`, `resolve`). Numbers are also accepted as literal seconds from scene start.
 *
 * Text: every string that is shown on screen passes through the host's `t()` so one spec serves
 * every language; keys are the source-language strings (Spanish in tacosdedatos videos).
 *
 * The JSDoc below is the field reference: these types generate the JSON Schema served at
 * https://jbm-ui.bns.studio/schemas/scene-spec.json. Sizes are canvas pixels; times are seconds.
 */

/**
 * A time. A number is seconds from scene start. A string is an anchor name, optionally followed by
 * a signed offset in seconds: "explain", "explain+0.2", "explain-0.5". An anchor whose own name
 * contains the offset text (e.g. "my-cue-0.5") matches exactly first.
 * @pattern ^\s*[\w-]+?\s*([+-]\s*(\d+(\.\d+)?|\.\d+))?\s*$
 */
export type At = string | number

/** A pixel value that can differ per orientation. */
export type PerOrientation = {
  /**
   * Pixels on the 1920 × 1080 stage.
   * @minimum 0
   */
  landscape: number
  /**
   * Pixels on the 1080 × 1920 stage.
   * @minimum 0
   */
  vertical: number
}

export type StatItem = {
  /** Entrance time of this card. */
  at: At
  /** Small caption above the value; translated. */
  label: string
  /** The figure itself, as display text ("42 %"); translated. */
  value: string
  /** Optional line under the value; translated. */
  sub?: string
  /**
   * Value color.
   * @default "accent"
   */
  valueColor?: "accent" | "ink"
}

/** Any block may leave the screen on a cue: it fades out and drifts up from `until`. */
export type Exit = {
  /** Exit time: the block fades out and drifts up over 0.4 s. Flow blocks keep their layout space. */
  until?: At
}

export type Block = BlockBody & Exit

export type BlockBody =
  | {
      /** Headline text in the display face. */
      type: "big"
      /** Entrance time. */
      at: At
      /** Headline; `\n` breaks lines. Translated. */
      text: string
      /** Text color; omit for ink. */
      color?: "accent" | "ink"
      /**
       * Font size in px; positive. Default 120 in landscape, 96 in vertical.
       * @exclusiveMinimum 0
       */
      size?: number
      /**
       * Entrance motion.
       * @default "up"
       */
      from?: "up" | "scale" | "left"
      /**
       * Text alignment.
       * @default "left"
       */
      align?: "left" | "center"
    }
  | {
      /** Stat cards: side by side (300 px tall) in landscape, stacked row cards (180 px) in vertical. */
      type: "stat-row"
      /** One card per item, each with its own entrance cue; an empty list renders nothing. */
      items: StatItem[]
    }
  | {
      /** A small annotation (Callout note variant, 24 px landscape / 22 px vertical) sliding in from the left. */
      type: "note"
      /** Entrance time. */
      at: At
      /** Annotation text; translated. */
      text: string
    }
  | {
      /** A boxed statement (30–34 px). */
      type: "callout"
      /** Entrance time. */
      at: At
      /** Statement text; translated. */
      text: string
      /**
       * Box style.
       * @default "accent"
       */
      variant?: "accent" | "ink"
    }
  | {
      /** A 36 px bullet list; items enter one after another. */
      type: "bullets"
      /** Entrance time of the first item. */
      at: At
      /** Item texts; translated. */
      items: string[]
      /**
       * Seconds between item entrances.
       * @default 0.6
       * @minimum 0
       */
      step?: number
      /**
       * Bullet marker.
       * @default "arrow"
       */
      marker?: "arrow" | "dot"
    }
  | {
      /** A wrapping row of chips that enter one after another. */
      type: "chips"
      /** Entrance time of the first chip. */
      at: At
      /** Chip texts; translated. */
      items: string[]
      /**
       * Seconds between chip entrances.
       * @default 0.35
       * @minimum 0
       */
      step?: number
      /**
       * Vermilion chips.
       * @default false
       */
      accent?: boolean
      /**
       * Monospace chip text.
       * @default false
       */
      mono?: boolean
    }
  | {
      /** A dark code card whose lines type in place. 480 px tall in landscape flow (max 1200 wide), 520 px in vertical. */
      type: "code"
      /** Card entrance time; set line cues at or after it. */
      at: At
      /** File name in the card header; translated. */
      title?: string
      /**
       * Typing speed in characters per second; positive and finite.
       * @default 32
       * @exclusiveMinimum 0
       */
      charsPerSecond?: number
      /** Code lines. Each starts typing at the later of its `at` and the end of the previous line. */
      lines: {
        /** Line text, typed character by character; translated. */
        text: string
        /** Earliest typing start for this line. */
        at: At
        /** Line color; omit for the default code color. */
        color?: "green" | "soft" | "dim"
      }[]
    }
  | {
      /** Empty vertical space. */
      type: "spacer"
      /**
       * Height in px, or per orientation; nonnegative.
       * @minimum 0
       */
      h: number | PerOrientation
    }
  /** Illustrated blocks (paper cut-out pieces of interface drawn with the UI Bits items). */
  | {
      /** A phone screen built piece by piece, then rebuilt on new screens on every `again` cue. */
      type: "screens"
      /** Interface pieces placed on the phone, each on its own cue. */
      pieces: {
        /** Piece shape. */
        kind: "button" | "input" | "card"
        /** Placement time. */
        at: At
      }[]
      /** Each cue starts a new screen that rebuilds the same pieces. */
      again?: At[]
      /**
       * Phone size multiplier; capped against the available box.
       * @default 1
       * @exclusiveMinimum 0
       */
      phoneScale?: number
      /** A sticker slapped on the pile. */
      sticker?: {
        /** Sticker text; translated. */
        text: string
        /** Sticker time. */
        at: At
      }
      /**
       * Block height in px; positive. Default 720 landscape / 1000 vertical in flow; the allocated height in illustration layouts.
       * @exclusiveMinimum 0
       */
      h?: number | PerOrientation
    }
  | {
      /** A catalogue sheet of pieces (top row) and design-token glyphs (second row). */
      type: "catalog"
      /** Sheet entrance time. */
      at: At
      /** Sheet heading; translated. */
      title?: string
      /** Interface pieces on the top row, each on its own cue. */
      items: {
        /** Piece shape. */
        kind: "button" | "input" | "card"
        /** Caption; translated. */
        label: string
        /** Entrance time. */
        at: At
      }[]
      /** Design-token glyphs on the second row. */
      tokens?: {
        /** Glyph kind. */
        kind: "color" | "type" | "space"
        /** Caption; translated. */
        label: string
        /** Entrance time. */
        at: At
      }[]
      /** When the sheet unfolds to show the token row (default: first token cue − 0.6 s). */
      tokensAt?: At
      /** A stamp pressed onto the sheet. */
      stamp?: {
        /** Stamp text; translated. */
        text: string
        /** Stamp time. */
        at: At
      }
    }
  | {
      /** One source card fanning out to a grid of screens; bug/fix/recolor cues propagate along the lines. */
      type: "propagate"
      /** Entrance time of the source card. */
      at: At
      /** Caption over the source card. */
      label?: {
        /** Caption text; translated. */
        text: string
        /** Caption time. */
        at: At
      }
      /**
       * Number of target screens; a positive integer.
       * @default 6
       * @minimum 1
       * @integer
       */
      targets?: number
      /** A bug appears on the source and travels to every target. */
      bug?: At
      /** The fix leaves the source; `fixed` (later) is when it arrives. */
      fix?: At
      /** Arrival of the fix; must be later than `fix`. */
      fixed?: At
      /** A recolor leaves the source; `recolored` (later) is when it arrives. */
      recolor?: At
      /** Arrival of the recolor; must be later than `recolor`. */
      recolored?: At
      /**
       * Block height in px; positive. Default 760 landscape / 1040 vertical in flow; the allocated height in illustration layouts.
       * @exclusiveMinimum 0
       */
      h?: number | PerOrientation
    }
  | {
      /** A pile of wide library cards, each on its own cue; `tone: accent` for the one that is yours. */
      type: "shelf"
      /** Cards from top to bottom. */
      items: {
        /** Card text; translated. */
        text: string
        /** Entrance time. */
        at: At
        /**
         * Card paper.
         * @default "paper"
         */
        tone?: "paper" | "accent" | "ink"
      }[]
    }
  | {
      /** A button, the same button again, and a vermilion cross over the second. */
      type: "twice"
      /** First button time. */
      at: At
      /** Second (duplicate) button time. */
      second: At
      /** Time the cross strikes the second button. */
      strike?: At
    }
  | {
      /** The jbm brand lockup. */
      type: "brand"
      /** Entrance time. */
      at: At
      /** Line under the lockup; translated. */
      tagline?: string
      /**
       * Lockup size in px; positive. Default 52 in landscape, 56 in vertical.
       * @exclusiveMinimum 0
       */
      size?: number
    }
  | {
      /** A layer over the flow: its blocks stack in their own centred column inside the safe area, so a
       *  late beat can take the middle of the screen after earlier blocks `until`-exit. */
      type: "overlay"
      /** Nested blocks, stacked with the scene gap. */
      blocks: Block[]
      /**
       * Vertical placement of the nested stack.
       * @default "center"
       */
      valign?: "top" | "center"
    }

/**
 * Canvas-pixel insets on a 1920 × 1080 (landscape) or 1080 × 1920 (vertical) composition.
 * "legacy": landscape 90/120/160/120, vertical 100/72/480/72 (top/right/bottom/left).
 * "full": landscape 90/120/90/120, vertical 100/72/100/72.
 * "social": vertical 160/160/320/72; in landscape it falls back to "full".
 * Custom insets must be nonnegative finite numbers that leave a positive content area.
 */
export type SafeArea =
  | "legacy"
  | "full"
  | "social"
  | {
      /** @minimum 0 */
      top: number
      /** @minimum 0 */
      right: number
      /** @minimum 0 */
      bottom: number
      /** @minimum 0 */
      left: number
    }
/**
 * "flow" stacks blocks top to bottom. "hero" centers the stack. "headline-illustration" takes
 * exactly two blocks and no scene title (headline, then subject). "illustration" takes exactly one
 * subject block and no scene title.
 */
export type SceneLayout =
  "flow" | "hero" | "headline-illustration" | "illustration"
export type CompositionOptions = {
  /**
   * Insets are canvas pixels. Social is a house preset, not a platform guarantee.
   * @default "legacy"
   */
  safeArea?: SafeArea
  /**
   * How blocks are placed in the safe area.
   * @default "flow"
   */
  layout?: SceneLayout
  /**
   * Fraction reserved for the first block in headline-illustration (default .25); strictly between 0 and 1.
   * @default 0.25
   * @exclusiveMinimum 0
   * @exclusiveMaximum 1
   */
  headlineRatio?: number
  /**
   * Illustration subject scale; its logical box shrinks to preserve the safe area.
   * @default 1
   * @exclusiveMinimum 0
   */
  subjectScale?: number
  /**
   * Gap between blocks in px (per orientation allowed); overrides the scene `gap`. Nonnegative.
   * @minimum 0
   */
  gap?: number | PerOrientation
  /** Vertical placement of the flow stack; overrides the scene `valign`. */
  valign?: "top" | "center"
  /** Overrides replace the entire block list; anchors remain shared. */
  blocks?: Block[]
}

export type SceneSpec = {
  /** Scene identifier; appears in error messages. */
  id: string
  /** Composition options shared by both orientations. */
  composition?: Omit<CompositionOptions, "blocks">
  /** Per-orientation composition options; they override `composition` key by key. */
  variants?: Partial<Record<"landscape" | "vertical", CompositionOptions>>
  /** Scene heading (Label, top-left). Omit for a headline-only scene. */
  title?: string
  /**
   * First words the narrator says in this scene, for a host that cuts scene boundaries from a
   * narration transcript. The compiler ignores it; not needed on the first scene.
   */
  starts?: string
  /**
   * Optional. Anchor name → phrase spoken in this scene; `host.resolve(phrase)` turns the phrase into
   * seconds. Required only when a block uses an anchor name as its time; omit it when every time
   * is a number.
   */
  anchors?: Record<string, string>
  /** Blocks, top to bottom. */
  blocks: Block[]
  /**
   * Optional per-orientation gap between blocks (default 40); must be ≥ 0 and smaller than the safe-area height.
   * @default 40
   * @minimum 0
   */
  gap?: number | PerOrientation
  /**
   * Vertical placement of the block stack inside the safe area (default top).
   * @default "top"
   */
  valign?: "top" | "center"
}

/** A parsed scenes file: `{ scenes: SceneSpec[] }`. */
export type ScenesFile = { scenes: SceneSpec[] }
