import * as React from "react"
import { color } from "../lib/tokens"
import { unit, type Pt } from "../lib/geometry"
export { pointOn, pathTilt } from "../lib/geometry"

export type ManoProps = {
  at: Pt
  grip: number
  size?: number
  angle?: number
  children?: React.ReactNode
}

/** Native hand coordinates; the controlled contact point interpolates with the grip. */
export function manoAnchor(grip: number): Pt {
  const p = unit(grip)
  return { x: 36 + p * 8, y: 5 + p * 43 }
}

/** SVG group. Children use pixels relative to at, behind the fingers, and follow rotation. */
export function Mano({ at, grip, size = 100, angle = 0, children }: ManoProps) {
  const p = unit(grip)
  const reach = Math.sin(p * Math.PI)
  const anchor = manoAnchor(p)
  const k = Math.max(1, size) / 100
  const indexY = 5 + p * 38
  const middleY = 35 - reach * 23 + p * 5
  const ringY = 43 - reach * 24 + p * 2
  const pinkyY = 52 - reach * 20
  return (
    <g
      transform={`translate(${at.x} ${at.y}) rotate(${angle})`}
      role="img"
      aria-label={
        p > 0.8 ? "Hand gripping" : p > 0.2 ? "Hand reaching" : "Hand pointing"
      }
    >
      <g
        transform={`scale(${k}) translate(${-anchor.x} ${-anchor.y})`}
        fill={color.card}
        stroke={color.ink}
        strokeWidth={Math.max(2, 1.25 / k)}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M30 91C27 80 18 78 15 64C12 56 17 52 22 57L30 66V45H80V67C80 78 72 85 72 93Z" />
      </g>
      {children}
      <g
        transform={`scale(${k}) translate(${-anchor.x} ${-anchor.y})`}
        fill={color.card}
        stroke={color.ink}
        strokeWidth={Math.max(2, 1.25 / k)}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path
          d={`M29 64V${indexY + 8}C29 ${indexY - 2} 43 ${indexY - 2} 43 ${indexY + 8}V${44 + p * 12}V${middleY + 7}C43 ${middleY - 3} 57 ${middleY - 3} 57 ${middleY + 7}V${49 + p * 9}V${ringY + 7}C57 ${ringY - 3} 70 ${ringY - 3} 70 ${ringY + 7}V${56 + p * 6}V${pinkyY + 6}C70 ${pinkyY - 3} 82 ${pinkyY - 3} 82 ${pinkyY + 6}V68C82 81 73 85 73 94H32`}
        />
        <path
          d={`M${22 - reach * 6} ${60 - reach * 6}C${11 - reach * 5} ${50 - reach * 7} 9 ${65 - reach * 6} 18 73L32 87L33 93H72M${23 + p * 15} ${66 - p * 9}Q${30 + p * 14} ${69 - p * 10} ${36 + p * 12} ${76 - p * 9}`}
        />
        <path d={`M31 94H74V101H31Z`} fill={color.bg} />
        {p > 0.3 && (
          <path
            d={`M34 ${55 + p * 6}q8 -5 13 0M48 63q7 -4 12 0M61 68q6 -3 10 0`}
            fill="none"
            opacity={p}
          />
        )}
      </g>
    </g>
  )
}
