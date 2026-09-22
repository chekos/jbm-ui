"use client"

import { useState } from "react"
import { Player } from "@remotion/player"
import { useCurrentFrame, useVideoConfig } from "remotion"
import { Cajon, cajonLayout } from "@/registry/jbm/motion/cajon"
import { Mano, pointOn, pathTilt } from "@/registry/jbm/motion/mano"
import { Bandeja } from "@/registry/jbm/motion/bandeja"
import { ToolCaddy } from "@/registry/jbm/motion/tool-caddy"
import {
  Escritorio,
  escritorioLayout,
  type DeskSpec,
} from "@/registry/jbm/motion/escritorio"
import { Burbuja } from "@/registry/jbm/motion/burbuja"
import { color, font } from "@/registry/jbm/lib/tokens"
import { unit } from "@/registry/jbm/lib/geometry"

const names = [
  "análisis",
  "diseño",
  "pruebas",
  "datos",
  "notas",
  "estilo",
  "revisión",
  "video",
  "audio",
  "tablas",
  "texto",
  "archivo",
]
const tools: DeskSpec["tools"] = [
  { name: "Read", kind: "ruler" },
  { name: "Bash", kind: "stamp" },
  { name: "python", kind: "knife" },
]
export const deskNames = [
  "cajon",
  "mano",
  "bandeja",
  "tool-caddy",
  "escritorio",
  "burbuja",
]

function DeskFrame({
  name,
  portrait,
  count,
  fail,
  mirrored,
  progress,
}: {
  name: string
  portrait: boolean
  count: number
  fail: boolean
  mirrored: boolean
  progress: number | null
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = progress === null ? frame / fps : progress * 8
  const p = unit(t / 2)
  const grip = unit((t - 1) / 1.5) * (1 - unit((t - 6) / 1.5))
  const folders = names.slice(0, count).map((name, i) => ({
    name,
    accent: i === 1,
    pulled: i === 1 ? unit((t - 2) / 2) * (1 - unit((t - 6) / 2)) : 0,
  }))
  const width = portrait ? 540 : 900
  const height = portrait ? 960 : 620
  const deskProps = {
    box: { x: 0, y: 0, w: 820, h: 580 },
    spec: {
      tools,
      finish: mirrored ? ("wood" as const) : ("paper" as const),
      drawerSide: mirrored ? ("end" as const) : ("start" as const),
    },
    folders,
    layers: Math.floor(t / 2),
    open: p,
  }
  const d = escritorioLayout(deskProps)
  const drawerProps = { x: 0, y: 0, w: 420, folders, open: p }
  const drawer = cajonLayout(drawerProps)
  const travel = [
    { x: 190, y: 190 },
    { x: 310, y: 160 },
    { x: width - 160, y: 300 },
  ]
  const move = unit((t - 2.5) / 3)
  const handAt = pointOn(travel, move)
  const deskScale = Math.min((width - 60) / d.box.w, (height - 120) / d.box.h)
  const drawerScale = Math.min(
    (width - 90) / drawer.w,
    (height - 180) / drawer.h
  )
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        background: color.bg,
        fontFamily: font.mono,
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "hidden" }}
      >
        {name === "cajon" && (
          <g
            transform={`translate(${(width - drawer.w * drawerScale) / 2} ${(height - drawer.h * drawerScale) / 2}) scale(${drawerScale})`}
          >
            <Cajon {...drawerProps} />
          </g>
        )}
        {name === "escritorio" && (
          <g
            transform={`translate(30 ${(height - d.box.h * deskScale) / 2}) scale(${deskScale})`}
          >
            <Escritorio {...deskProps} />
          </g>
        )}
        {name === "bandeja" && (
          <Bandeja
            x={(width - 320) / 2}
            y={height / 2}
            w={320}
            layers={Math.floor(t)}
            landing={t % 1}
          />
        )}
        {name === "tool-caddy" && (
          <ToolCaddy
            x={(width - 204) / 2}
            y={height / 2 + 50}
            tools={tools.map((tool, i) => ({
              ...tool,
              pulled: i === 1 ? grip : 0,
            }))}
          />
        )}
        {name === "mano" && (
          <>
            <path
              d={`M${travel.map((pt) => `${pt.x} ${pt.y}`).join("L")}`}
              fill="none"
              stroke={color.ink}
              strokeDasharray="3 8"
              opacity={0.18}
            />
            <Mano
              at={handAt}
              grip={grip}
              size={150}
              angle={pathTilt(travel, move)}
            >
              {t >= 2 && t < 6.5 && (
                <g transform="translate(-115 -5)">
                  <path
                    d="M0 15V0H45L58 15H130V105H0Z"
                    fill={color.accent}
                    stroke={color.ink}
                    strokeWidth={2}
                  />
                  <path d="M5 26H125" stroke={color.card} strokeWidth={2} />
                </g>
              )}
            </Mano>
            <Mano
              at={{ x: width / 2 - 70, y: height - 130 }}
              grip={grip}
              size={48}
            />
            <text
              x={width / 2 + 10}
              y={height - 100}
              fontFamily={font.mono}
              fontSize={15}
              fill={color.ink}
            >
              48 px
            </text>
          </>
        )}
        {name === "burbuja" && (
          <g
            transform={`translate(${width / 2 - 120} ${height / 2 + 20})`}
            fill={fail ? color.card : color.accent}
            stroke={color.ink}
            strokeWidth={2}
          >
            <path d="M0 20V0H85L102 20H240V155H0Z" />
            <path d="M0 38H240" />
            <text
              x={22}
              y={127}
              stroke="none"
              fill={fail ? color.ink : color.card}
              fontFamily={font.mono}
              fontSize={20}
            >
              {fail ? "audio" : "análisis"}
            </text>
          </g>
        )}
      </svg>
      {name === "burbuja" && (
        <Burbuja
          words={["Necesito", "un", "análisis", "de", "estos", "datos."]}
          highlight={[2]}
          at={{ x: (width - 390) / 2, y: portrait ? 220 : 70 }}
          width={390}
          speaker="Tú"
          arrive={unit(t / 0.7)}
          glow={unit((t - 1) / 0.6)}
          link={unit((t - 2) / 1.2) * (fail ? 1 - unit((t - 4) / 1.2) : 1)}
          leave={unit((t - 7) / 1)}
          target={{ x: width / 2 - 65, y: height / 2 + 20 }}
          hook
        />
      )}
    </div>
  )
}

export function DeskDemo({ name }: { name: string }) {
  const [portrait, setPortrait] = useState(false)
  const [count, setCount] = useState(6)
  const [fail, setFail] = useState(false)
  const [mirrored, setMirrored] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  return (
    <div style={{ width: "100%" }}>
      <div className="composition-options">
        <label>
          <input
            type="checkbox"
            checked={portrait}
            onChange={(e) => setPortrait(e.target.checked)}
          />{" "}
          Portrait
        </label>
        {(name === "cajon" || name === "escritorio") && (
          <label>
            Folders{" "}
            <select
              aria-label={`${name} folder count`}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[1, 6, 12].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        )}
        {name === "escritorio" && (
          <label>
            <input
              type="checkbox"
              checked={mirrored}
              onChange={(e) => setMirrored(e.target.checked)}
            />{" "}
            Wood / right drawer
          </label>
        )}
        {name === "burbuja" && (
          <label>
            <input
              type="checkbox"
              checked={fail}
              onChange={(e) => setFail(e.target.checked)}
            />{" "}
            No match
          </label>
        )}
        <label>
          <input
            type="checkbox"
            checked={progress !== null}
            onChange={(e) => setProgress(e.target.checked ? 0.5 : null)}
          />{" "}
          Inspect frame
        </label>
        {progress !== null && (
          <input
            aria-label={`${name} progress`}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
        )}
      </div>
      <Player
        component={DeskFrame}
        inputProps={{ name, portrait, count, fail, mirrored, progress }}
        compositionWidth={portrait ? 540 : 900}
        compositionHeight={portrait ? 960 : 620}
        durationInFrames={241}
        fps={30}
        initialFrame={60}
        controls
        autoPlay={false}
        loop={false}
        style={{
          width: "100%",
          maxHeight: 650,
          aspectRatio: portrait ? "9 / 16" : "45 / 31",
        }}
        aria-label={`${name} interaction preview`}
      />
    </div>
  )
}

export const deskSnippets: Record<string, string> = {
  cajon: `<svg viewBox="0 0 500 600">\n  <Cajon x={40} y={80} w={420} folders={[\n    { name: "análisis", accent: true, pulled: 0.4 },\n    { name: "diseño" },\n  ]} open={1} />\n</svg>\n// cajonLayout(props) returns bounds and folder anchors.`,
  mano: `const at = pointOn(path, progress)\n<svg viewBox="0 0 900 620">\n  <Mano at={at} grip={grip} size={100} angle={pathTilt(path, progress)}>\n    <rect x={-90} y={0} width={100} height={70} fill="#C63D24" />\n  </Mano>\n</svg>`,
  bandeja: `<svg viewBox="0 0 400 300">\n  <Bandeja x={50} y={160} layers={5} landing={0.6} />\n</svg>\n// layers = settled sheets; landing = one incoming sheet.`,
  "tool-caddy": `<svg viewBox="0 0 400 300">\n  <ToolCaddy x={70} y={180} tools={[\n    { name: "Read", kind: "ruler" },\n    { name: "Bash", kind: "stamp", pulled: 0.5 },\n    { name: "python", kind: "knife" },\n  ]} />\n</svg>`,
  escritorio: `const props = {\n  box: { x: 30, y: 30, w: 820, h: 580 },\n  spec: { tools: [{ name: "Read", kind: "ruler" }],\n    finish: "wood", drawerSide: "end" },\n  folders: [{ name: "análisis", accent: true }], layers: 3,\n} as const\nconst { anchors, box } = escritorioLayout(props)\n<svg viewBox={\`0 0 \${box.x + box.w} \${box.y + box.h}\`}>\n  <Escritorio {...props} />\n  <Mano at={anchors.folders[0]} grip={1} />\n</svg>`,
  burbuja: `<div style={{ position: "relative", width: 800, height: 600 }}>\n  <Burbuja words={["Analiza", "estos", "datos"]} highlight={[2]}\n    at={{ x: 200, y: 40 }} target={{ x: 300, y: 450 }}\n    arrive={1} glow={1} link={0.8} speaker="Tú" hook />\n</div>\n// Retract a failed match by driving link from 1 back to 0.\n// burbujaLayout(props).positions exports each word's anchor.`,
}
