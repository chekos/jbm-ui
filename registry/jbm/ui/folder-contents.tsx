import type { ComponentProps } from "react"
import { Folder, FolderOutline } from "./folder"
import { color, font, stroke } from "../lib/tokens"
import { unit } from "../lib/geometry"

export type FolderEntry = {
  id: string
  label: string
  reveal?: number
  document?: string
  documentReveal?: number
}
/** A complete fan of nested folders. Reveal translates rigid objects; it never stretches them. */
export function FolderContents({
  entries = [],
  sheet = "README.md",
  lift = 0,
  ...props
}: Omit<ComponentProps<typeof Folder>, "children"> & {
  entries?: FolderEntry[]
  sheet?: string
  lift?: number
}) {
  const p = unit(props.open ?? 1)
  return (
    <Folder {...props} open={p}>
      <svg
        x={0}
        y={p * -36}
        width={260}
        height={199 + p * 36}
        viewBox={`0 ${-p * 36} 260 ${199 + p * 36}`}
        overflow="hidden"
      >
        <g transform={`translate(0 ${-unit(lift) * 240})`}>
          {entries.map((entry, i) => {
            const step = entries.length > 1 ? 48 / (entries.length - 1) : 0
            const top = 24 + i * step
            const y = 150 - unit(entry.reveal ?? 1) * p * (150 - top)
            return (
              <g key={entry.id}>
                <FolderOutline
                  x={100}
                  y={y}
                  w={125}
                  h={118}
                  tabX={108}
                  tabWidth={78}
                  fill={color.card}
                />
                <text
                  x={113}
                  y={y + 12}
                  fontFamily={font.mono}
                  fontSize={6.5}
                  fill={color.ink}
                >
                  {entry.label.length > 15
                    ? `${entry.label.slice(0, 14)}…`
                    : entry.label}
                </text>
                {entry.document && (
                  <g
                    transform={`translate(0 ${-unit(entry.documentReveal ?? 0) * p * 45})`}
                  >
                    <rect
                      x={171}
                      y={y + 31}
                      width={45}
                      height={78}
                      fill={color.card}
                      stroke={color.ink}
                      strokeWidth={stroke.outline}
                    />
                    <text
                      x={175}
                      y={y + 43}
                      fontFamily={font.mono}
                      fontSize={5}
                      fill={color.ink}
                    >
                      {entry.document.slice(0, 12)}
                    </text>
                    <path
                      d={`M177 ${y + 53}h31m-31 7h25m-25 7h29`}
                      stroke={color.line}
                      strokeWidth={2}
                    />
                  </g>
                )}
                <path
                  d={`M100 ${y + 29}H225V${y + 118}H100Z`}
                  fill={color.accent}
                  stroke={color.ink}
                  strokeWidth={stroke.outline}
                />
              </g>
            )
          })}
          {sheet && (
            <g transform={`translate(0 ${(1 - p) * 105})`}>
              <rect
                x={35}
                y={44}
                width={75}
                height={110}
                fill={color.card}
                stroke={color.ink}
                strokeWidth={stroke.outline}
              />
              <text
                x={41}
                y={59}
                fontFamily={font.mono}
                fontSize={7}
                fill={color.ink}
              >
                {sheet.slice(0, 15)}
              </text>
              <path d="M42 69H98" stroke={color.accent} strokeWidth={3} />
              <path
                d="M42 80H99M42 89H90M42 98H96"
                stroke={color.line}
                strokeWidth={2}
              />
            </g>
          )}
        </g>
      </svg>
    </Folder>
  )
}
