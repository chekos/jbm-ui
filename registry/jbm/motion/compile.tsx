import * as React from "react"
import { color, stage, type Orientation } from "../lib/tokens"
import { Label } from "../ui/label"
import { Big } from "../ui/big"
import { Chip } from "../ui/chip"
import { StatCard } from "../ui/stat-card"
import { Callout } from "../ui/callout"
import { BulletList } from "../ui/bullet-list"
import { Scene } from "./scene"
import { Pop } from "./pop"
import { CodeCard } from "./code-card"
import type { At, Block, SceneSpec } from "./spec"

/**
 * Compile a SceneSpec into a Remotion scene for one orientation.
 *
 * Layout is a vertical flow inside the stage's safe area (tokens.stage): blocks stack top to bottom
 * with `gap` between them, so the same spec fits 1920×1080 and 1080×1920 without per-orientation
 * coordinates. What changes per orientation is the block's own shape: a stat-row is three cards
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
  const off = exact === undefined && m[2] ? parseFloat(m[2].replace(/\s+/g, "")) : 0
  const result = host.resolve(phrase) + off
  if (!Number.isFinite(result))
    throw new Error(`scene ${spec.id}: non-finite anchor "${at}"`)
  return result
}

export function SceneFromSpec({
  spec,
  orientation,
  host,
}: {
  spec: SceneSpec
  orientation: Orientation
  host: Host
}) {
  const s = stage[orientation]
  const V = orientation === "vertical"
  const W = s.w - s.pad * 2
  const tr = host.t ?? ((x: string) => x)
  const at = (a: At) => resolveAt(a, spec, host)
  const gap = pick(spec.gap ?? 40, orientation)
  const tone = (c?: "accent" | "ink") =>
    c === "ink" ? color.ink : color.accent

  const render = (b: Block, i: number): React.ReactNode => {
    switch (b.type) {
      case "big":
        return (
          <Pop key={i} at={at(b.at)} from={b.from ?? "up"} style={{ width: W }}>
            <Big
              size={b.size ?? (V ? 96 : 120)}
              color={b.color ? tone(b.color) : color.ink}
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
              h={V ? 520 : 480}
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
    }
  }

  return (
    <Scene>
      <div
        style={{
          position: "absolute",
          left: s.pad,
          top: s.top,
          width: W,
          maxHeight: s.bottom - s.top,
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
        {spec.blocks.map(render)}
      </div>
    </Scene>
  )
}
