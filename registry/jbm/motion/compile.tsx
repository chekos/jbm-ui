import * as React from "react"
import { color, stage, type Orientation } from "../lib/tokens"
import { Label } from "../ui/label"
import { Big } from "../ui/big"
import { Chip } from "../ui/chip"
import { StatCard } from "../ui/stat-card"
import { Callout } from "../ui/callout"
import { BulletList } from "../ui/bullet-list"
import { Brand } from "../ui/brand"
import { Scene } from "./scene"
import { Pop, Leave } from "./pop"
import { CodeCard } from "./code-card"
import { RebuildScreens } from "./rebuild-screens"
import { Catalog } from "./catalog"
import { Propagate } from "./propagate"
import { Shelf, Twice } from "./shelf"
import type { At, Block, SceneSpec, SafeArea } from "./spec"

/**
 * Compile a SceneSpec into a Remotion scene for one orientation.
 *
 * Layout is a vertical flow inside the stage's safe area (tokens.stage): blocks stack top to bottom
 * with `gap` between them. Explicit composition options and orientation variants let authors
 * design for each frame; content is not automatically fitted. By default, a block changes shape: a stat-row is three cards
 * side by side in landscape and three row-mode cards stacked in vertical; text sizes step down.
 *
 * `resolve(phrase)` returns seconds from scene start for a narration phrase (the host's `rel`);
 * `t(s)` translates an on-screen string (the host's i18n). Both are injected so the compiler knows
 * nothing about a project's timing table or dictionary.
 */
export type Host = {
  resolve: (phrase: string) => number
  t?: (s: string) => string
}

const pick = <T,>(v: T | { landscape: T; vertical: T }, o: Orientation): T =>
  typeof v === "object" && v !== null && "landscape" in (v as object)
    ? (v as { landscape: T; vertical: T })[o]
    : (v as T)

/** "name", "name+0.2", "name-0.5", or a number of seconds. */
export function resolveAt(at: At, spec: SceneSpec, host: Host): number {
  if (typeof at === "number") {
    if (!Number.isFinite(at))
      throw new Error(`scene ${spec.id}: non-finite time`)
    return at
  }
  const m = /^([\w-]+?)\s*([+-]\s*(?:\d+(?:\.\d+)?|\.\d+))?$/.exec(at.trim())
  if (!m) throw new Error(`scene ${spec.id}: bad anchor "${at}"`)
  const exact = spec.anchors?.[at.trim()]
  const phrase = exact ?? spec.anchors?.[m[1]]
  if (phrase === undefined)
    throw new Error(`scene ${spec.id}: unknown anchor "${m[1]}"`)
  const off =
    exact === undefined && m[2] ? parseFloat(m[2].replace(/\s+/g, "")) : 0
  const result = host.resolve(phrase) + off
  if (!Number.isFinite(result))
    throw new Error(`scene ${spec.id}: non-finite anchor "${at}"`)
  return result
}

/** Resolve explicit canvas insets while retaining legacy geometry for existing scenes. */
export function sceneGeometry(
  orientation: Orientation,
  safeArea: SafeArea = "legacy"
) {
  const s = stage[orientation]
  const insets =
    typeof safeArea === "object"
      ? safeArea
      : safeArea === "legacy"
        ? { left: s.pad, right: s.pad, top: s.top, bottom: s.h - s.bottom }
        : safeArea === "social" && orientation === "vertical"
          ? { left: 72, right: 160, top: 160, bottom: 320 }
          : { left: s.pad, right: s.pad, top: s.top, bottom: s.top }
  if (
    [insets.left, insets.right, insets.top, insets.bottom].some(
      (v) => !Number.isFinite(v) || v < 0
    ) ||
    insets.left + insets.right >= s.w ||
    insets.top + insets.bottom >= s.h
  )
    throw new Error("Invalid scene safe-area insets")
  return {
    left: insets.left,
    top: insets.top,
    width: s.w - insets.left - insets.right,
    height: s.h - insets.top - insets.bottom,
  }
}

export function SceneFromSpec({
  spec,
  orientation,
  host,
  showSafeArea = false,
}: {
  spec: SceneSpec
  showSafeArea?: boolean
  orientation: Orientation
  host: Host
}) {
  const options = { ...spec.composition, ...spec.variants?.[orientation] }
  const area = sceneGeometry(orientation, options.safeArea)
  const layout = options.layout ?? "flow"
  const blocks = options.blocks ?? spec.blocks
  const subjectScale = options.subjectScale ?? 1
  if (!Number.isFinite(subjectScale) || subjectScale <= 0)
    throw new Error("subjectScale must be positive and finite")
  const ratio = options.headlineRatio ?? 0.25
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 1)
    throw new Error("headlineRatio must be between 0 and 1")
  if (layout === "headline-illustration" && (blocks.length !== 2 || spec.title))
    throw new Error(
      "headline-illustration requires exactly two blocks and no title"
    )
  const V = orientation === "vertical"
  const W = area.width
  const H = area.height
  const tr = host.t ?? ((x: string) => x)
  const at = (a: At) => resolveAt(a, spec, host)
  const gap = pick(options.gap ?? spec.gap ?? 40, orientation)
  const tone = (c?: "accent" | "ink") =>
    c === "ink" ? color.ink : color.accent

  const render = (
    b: Block,
    i: number,
    height = H,
    width = W
  ): React.ReactNode => {
    const body = renderBody(b, i, height, width)
    return b.until === undefined || b.type === "overlay" ? (
      body
    ) : (
      <Leave key={i} at={at(b.until)}>
        {body}
      </Leave>
    )
  }

  const renderBody = (
    b: Block,
    i: number,
    height: number,
    W: number
  ): React.ReactNode => {
    switch (b.type) {
      case "big":
        return (
          <Pop key={i} at={at(b.at)} from={b.from ?? "up"} style={{ width: W }}>
            <Big
              size={b.size ?? (V ? 96 : 120)}
              color={b.color ? tone(b.color) : color.ink}
              style={{
                whiteSpace: "pre-line",
                textAlign: b.align === "center" ? "center" : undefined,
              }}
            >
              {tr(b.text)}
            </Big>
          </Pop>
        )
      case "stat-row": {
        const n = b.items.length
        if (n === 0) return null
        const cw = V ? W : Math.floor((W - 40 * (n - 1)) / n)
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: V ? "column" : "row",
              gap: V ? 30 : 40,
            }}
          >
            {b.items.map((it, k) => (
              <Pop key={k} at={at(it.at)} from="up">
                <StatCard
                  row={V}
                  w={cw}
                  h={V ? 180 : 300}
                  label={tr(it.label)}
                  value={tr(it.value)}
                  sub={it.sub ? tr(it.sub) : undefined}
                  valueColor={tone(it.valueColor)}
                />
              </Pop>
            ))}
          </div>
        )
      }
      case "note":
        return (
          <Pop key={i} at={at(b.at)} from="left" style={{ width: W }}>
            <Callout variant="note" size={V ? 22 : 24}>
              {tr(b.text)}
            </Callout>
          </Pop>
        )
      case "callout":
        return (
          <Pop key={i} at={at(b.at)} from="up" style={{ width: W }}>
            <Callout
              variant={b.variant ?? "accent"}
              size={V ? 30 : 34}
              maxWidth={W}
            >
              {tr(b.text)}
            </Callout>
          </Pop>
        )
      case "bullets": {
        const t0 = at(b.at)
        const step = b.step ?? 0.6
        return (
          <BulletList
            key={i}
            items={b.items.map(tr)}
            marker={b.marker}
            size={36}
            gap={V ? 22 : 16}
            style={{ width: W }}
            renderItem={(node, k) => (
              <Pop at={t0 + k * step} from="left" dist={14}>
                {node}
              </Pop>
            )}
          />
        )
      }
      case "chips": {
        const t0 = at(b.at)
        return (
          <div
            key={i}
            style={{ display: "flex", gap: 14, flexWrap: "wrap", width: W }}
          >
            {b.items.map((c, k) => (
              <Pop key={k} at={t0 + k * (b.step ?? 0.35)} from="up" dist={12}>
                <Chip size={V ? 28 : 26} accent={b.accent} mono={b.mono}>
                  {tr(c)}
                </Chip>
              </Pop>
            ))}
          </div>
        )
      }
      case "code": {
        const cc = {
          green: color.codeGreen,
          soft: color.soft,
          dim: color.dim,
        } as const
        return (
          <Pop key={i} at={at(b.at)} from="up">
            <CodeCard
              charsPerSecond={b.charsPerSecond}
              title={b.title ? tr(b.title) : undefined}
              w={V ? W : Math.min(W, 1200)}
              h={
                layout === "illustration" || layout === "headline-illustration"
                  ? height
                  : V
                    ? 520
                    : 480
              }
              size={V ? 26 : 24}
              lines={b.lines.map((l) => ({
                t: tr(l.text),
                at: at(l.at),
                color: l.color ? cc[l.color] : undefined,
              }))}
            />
          </Pop>
        )
      }
      case "spacer":
        return <div key={i} style={{ height: pick(b.h, orientation) }} />
      case "screens":
        return (
          <RebuildScreens
            key={i}
            phoneScale={b.phoneScale}
            w={W}
            h={pick(
              b.h ??
                (layout === "flow"
                  ? { landscape: 720, vertical: 1000 }
                  : height),
              orientation
            )}
            pieces={b.pieces.map((p) => ({ kind: p.kind, at: at(p.at) }))}
            again={(b.again ?? []).map(at)}
            sticker={
              b.sticker
                ? { text: tr(b.sticker.text), at: at(b.sticker.at) }
                : undefined
            }
          />
        )
      case "catalog":
        return (
          <Catalog
            key={i}
            w={V ? W : Math.min(W, 1200)}
            at={at(b.at)}
            title={b.title ? tr(b.title) : undefined}
            items={b.items.map((it) => ({
              kind: it.kind,
              label: tr(it.label),
              at: at(it.at),
            }))}
            tokens={(b.tokens ?? []).map((tk) => ({
              kind: tk.kind,
              label: tr(tk.label),
              at: at(tk.at),
            }))}
            tokensAt={b.tokensAt === undefined ? undefined : at(b.tokensAt)}
            stamp={
              b.stamp
                ? { text: tr(b.stamp.text), at: at(b.stamp.at) }
                : undefined
            }
          />
        )
      case "propagate": {
        const opt = (a?: At) => (a === undefined ? undefined : at(a))
        return (
          <Propagate
            key={i}
            w={W}
            h={pick(
              b.h ??
                (layout === "flow"
                  ? { landscape: 760, vertical: 1040 }
                  : height),
              orientation
            )}
            at={at(b.at)}
            label={
              b.label
                ? { text: tr(b.label.text), at: at(b.label.at) }
                : undefined
            }
            targets={b.targets}
            bug={opt(b.bug)}
            fix={opt(b.fix)}
            fixed={opt(b.fixed)}
            recolor={opt(b.recolor)}
            recolored={opt(b.recolored)}
          />
        )
      }
      case "shelf":
        return (
          <Shelf
            key={i}
            w={V ? W : Math.min(W, 1100)}
            items={b.items.map((it) => ({
              text: tr(it.text),
              at: at(it.at),
              tone: it.tone,
            }))}
          />
        )
      case "twice":
        return (
          <Twice
            key={i}
            w={V ? W : Math.min(W, 1000)}
            at={at(b.at)}
            second={at(b.second)}
            strike={b.strike === undefined ? undefined : at(b.strike)}
          />
        )
      case "brand":
        return (
          <Pop key={i} at={at(b.at)} from="up" dist={20} style={{ width: W }}>
            <Brand
              size={b.size ?? (V ? 56 : 52)}
              tagline={b.tagline ? tr(b.tagline) : undefined}
            />
          </Pop>
        )
      case "overlay":
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: W,
              height,
              display: "flex",
              flexDirection: "column",
              justifyContent:
                (b.valign ?? "center") === "center" ? "center" : undefined,
              gap,
            }}
          >
            {b.until === undefined ? (
              b.blocks.map((block, index) => render(block, index, height, W))
            ) : (
              <Leave
                at={at(b.until)}
                style={{ display: "flex", flexDirection: "column", gap }}
              >
                {b.blocks.map((block, index) => render(block, index, height))}
              </Leave>
            )}
          </div>
        )
    }
  }

  const subject = (block: Block, index: number, height: number) => (
    <div style={{ width: W, height, position: "relative", flexShrink: 0 }}>
      <div
        style={{
          width: W / subjectScale,
          height: height / subjectScale,
          transform: "scale(" + subjectScale + ")",
          transformOrigin: "top left",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {render(block, index, height / subjectScale, W / subjectScale)}
      </div>
    </div>
  )
  if (layout === "illustration" && (blocks.length !== 1 || spec.title))
    throw new Error("illustration requires exactly one block and no title")
  if (!Number.isFinite(gap) || gap < 0 || gap >= H)
    throw new Error("gap must fit inside the safe area")
  return (
    <Scene>
      <div
        style={{
          position: "absolute",
          left: area.left,
          top: area.top,
          width: W,
          maxHeight: H,
          height:
            layout !== "flow" || (options.valign ?? spec.valign) === "center"
              ? H
              : undefined,
          justifyContent:
            layout === "hero" ||
            layout === "illustration" ||
            (options.valign ?? spec.valign) === "center"
              ? "center"
              : undefined,
          display: "flex",
          flexDirection: "column",
          gap,
        }}
      >
        {spec.title ? (
          <Pop at={0.1} style={{ marginBottom: V ? 0 : 30 }}>
            <Label>{tr(spec.title)}</Label>
          </Pop>
        ) : null}
        {layout === "headline-illustration"
          ? blocks.map((block, index) => {
              const height = (H - gap) * (index === 0 ? ratio : 1 - ratio)
              return (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    height,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  {index === 0
                    ? render(block, index, height)
                    : subject(block, index, height)}
                </div>
              )
            })
          : layout === "illustration"
            ? subject(blocks[0], 0, H)
            : blocks.map((block, index) => render(block, index))}
        {showSafeArea && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              height: H,
              outline: "3px dashed " + color.accent,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </Scene>
  )
}
