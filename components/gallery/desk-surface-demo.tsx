"use client"

import { useBenchParam } from "./bench-url"
import { DeskTop, type DeskTopDrawerSide } from "@/registry/jbm/ui/desk-top"
import { Ejes, type EjesFocusTone, type Quadrant } from "@/registry/jbm/ui/ejes"
import { DeskProp, deskPropLayout, type DeskPropKind } from "@/registry/jbm/ui/desk-prop"
import {
  degrees,
  ProgressControl,
  RangeControl,
  type Presets,
} from "./progress-control"


const labels = {
  top: "hacer",
  bottom: "entender",
  left: "aprender",
  right: "trabajar",
}
const focusOptions = ["none", "tl", "tr", "bl", "br", "all"] as const
type FocusOption = (typeof focusOptions)[number]
const propKinds = ["all", "keycap", "keyboard", "mug"] as const
type PropOption = (typeof propKinds)[number]
const drawerOptions = ["none", "start", "end", "top", "bottom"] as const
type DrawerOption = (typeof drawerOptions)[number]

export function DeskSurfaceDemo({ name }: { name: string }) {
  // On /c/<name> benches each value lives in the URL; see bench-url.tsx.
  const unit = { clamp: [0, 1] } as const
  // The documented light range: 1 (front) down to 0.72, the deepest folder in the visual language.
  const [light, setLight] = useBenchParam("light", 1, { clamp: [0.72, 1] })
  // Opens as a nameable desk: tilted to show its front edge, with a drawer on the right.
  const [edge, setEdge] = useBenchParam("edge", 1, unit)
  const [drawer, setDrawer] = useBenchParam<DrawerOption>("drawer", "end", {
    allowed: drawerOptions,
  })
  const [h, setH] = useBenchParam("h", 1, unit)
  const [v, setV] = useBenchParam("v", 1, unit)
  const [quiet, setQuiet] = useBenchParam("quiet", 0, unit)
  const [origin, setOrigin] = useBenchParam<"center" | "start">(
    "origin",
    "center",
    { allowed: ["center", "start"] }
  )
  const [focus, setFocus] = useBenchParam<FocusOption>("focus", "none", {
    allowed: focusOptions,
  })
  const [tone, setTone] = useBenchParam<EjesFocusTone>("tone", "ink", {
    allowed: ["ink", "fill", "accent"],
  })
  const [focusProgress, setFocusProgress] = useBenchParam("outline", 1, unit)
  const [kind, setKind] = useBenchParam<PropOption>("kind", "all", {
    allowed: propKinds,
  })
  const [scale, setScale] = useBenchParam("scale", 1, { clamp: [0.5, 2] })
  const [rotate, setRotate] = useBenchParam("rotate", 0, { clamp: [-30, 30] })
  const [press, setPress] = useBenchParam("press", 0, unit)

  const range = (
    label: string,
    value: number,
    set: (n: number) => void,
    presets: Presets
  ) => (
    <ProgressControl
      label={label}
      ariaLabel={`${name} ${label}`}
      value={value}
      onChange={set}
      presets={presets}
    />
  )
  const select = <T extends string>(
    label: string,
    value: T,
    set: (value: T) => void,
    options: readonly T[],
    text: (option: T) => string = (o) => o
  ) => (
    <label>
      {label}{" "}
      <select
        aria-label={`${name} ${label}`}
        value={value}
        onChange={(e) => set(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {text(o)}
          </option>
        ))}
      </select>
    </label>
  )
  const focused: readonly Quadrant[] | undefined =
    focus === "none"
      ? undefined
      : focus === "all"
        ? ["tl", "tr", "bl", "br"]
        : [focus]
  const kinds: DeskPropKind[] =
    kind === "all" ? ["keycap", "keyboard", "mug"] : [kind]
  // One prop alone: a fixed viewBox that holds it at the largest Scale and either extreme of
  // Rotation, so it never clips and the Scale slider still reads as growth.
  const propBox = (() => {
    if (kind === "all") return "0 0 560 300"
    const pts = [-30, 0, 30].flatMap(
      (r) => deskPropLayout({ kind, x: 0, y: 0, scale: 2 * 1.4, rotate: r }).corners
    )
    const xs = pts.map((p) => p.x),
      ys = pts.map((p) => p.y)
    const m = 16
    const x0 = Math.min(...xs) - m,
      y0 = Math.min(...ys) - m
    return `${Math.round(x0)} ${Math.round(y0)} ${Math.round(Math.max(...xs) + m - x0)} ${Math.round(Math.max(...ys) + m - y0)}`
  })()

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <svg
          viewBox={
            name === "desk-prop"
              ? propBox
              : name === "ejes"
                ? "0 0 800 500"
                : "0 0 820 520"
          }
          style={{ width: "100%", maxWidth: 640, height: "auto" }}
        >
          {name === "desk-top" && (
            <DeskTop
              box={{ x: 30, y: 30, w: 760, h: 460 }}
              light={light}
              edge={edge}
              drawer={
                drawer === "none" ? undefined : (drawer as DeskTopDrawerSide)
              }
            />
          )}
          {name === "ejes" && (
            <Ejes
              box={{ x: 20, y: 20, w: 760, h: 460 }}
              h={h}
              v={v}
              labels={labels}
              quiet={quiet}
              origin={origin}
              focus={focused}
              focusTone={tone}
              focusProgress={focusProgress}
            />
          )}
          {name === "desk-prop" &&
            kinds.map((k, i) => (
              <DeskProp
                key={k}
                kind={k}
                x={kinds.length === 1 ? 0 : [80, 270, 470][i]}
                y={kinds.length === 1 ? 0 : 150}
                scale={kinds.length === 1 ? scale * 1.4 : 0.8}
                rotate={rotate}
                press={press}
                keys={[13]}
              />
            ))}
        </svg>
      </div>
      <div
        className="composition-options"
        style={{ display: "flex", flexWrap: "wrap", gap: 16, padding: "16px 24px" }}
      >
        {name === "desk-top" && (
          <>
            {range("Edge", edge, setEdge, ["Flat", "Half", "Tilted"])}
            <RangeControl
              label="Light"
              ariaLabel={`${name} Light`}
              value={light}
              onChange={setLight}
              min={0.72}
              max={1}
              step={0.01}
              format={(n) => `k ${n.toFixed(2)}`}
            />
            {select("Drawer", drawer, setDrawer, drawerOptions)}
          </>
        )}
        {name === "ejes" && (
          <>
            {range("Horizontal", h, setH, ["Hidden", "Half", "Drawn"])}
            {range("Vertical", v, setV, ["Hidden", "Half", "Drawn"])}
            {range("Quiet", quiet, setQuiet, ["Full", "Half", "Quiet"])}
            {select("Grow from", origin, setOrigin, ["center", "start"] as const, (o) =>
              o === "center" ? "Crossing" : "Edges"
            )}
            {select("Focus", focus, setFocus, focusOptions, (o) =>
              o === "none" ? "None" : o === "all" ? "All four" : o.toUpperCase()
            )}
            {focus !== "none" && (
              <>
                {select("Tone", tone, setTone, ["ink", "fill", "accent"] as const, (o) =>
                  o === "ink" ? "Ink outline" : o === "fill" ? "Light fill" : "Accent outline"
                )}
                {range("Outline", focusProgress, setFocusProgress, [
                  "None",
                  "Half",
                  "Full",
                ])}
              </>
            )}
          </>
        )}
        {name === "desk-prop" && (
          <>
            {select("Prop", kind, setKind, propKinds, (o) =>
              o === "all" ? "All three" : o[0].toUpperCase() + o.slice(1)
            )}
            {kind !== "all" && (
            <RangeControl
              label="Scale"
              ariaLabel={`${name} Scale`}
              value={scale}
              onChange={setScale}
              min={0.5}
              max={2}
              step={0.05}
              format={(n) => `${n.toFixed(2)}×`}
            />
            )}
            <RangeControl
              label="Rotation"
              ariaLabel={`${name} Rotation`}
              value={rotate}
              onChange={setRotate}
              min={-30}
              max={30}
              step={1}
              format={degrees}
            />
            {kind !== "mug" &&
              range("Press", press, setPress, ["Up", "Half", "Down"])}
          </>
        )}
      </div>
    </div>
  )
}
