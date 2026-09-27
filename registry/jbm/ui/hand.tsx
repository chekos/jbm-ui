import type { SVGProps } from "react"
import { color } from "../lib/tokens"
/** Every pose, in gallery order. `pinch` doubles as the pen grip (Pluma); there is no pen pose. */
export const handPoses = ["open", "point", "pinch", "grip", "type", "hold"] as const
export type HandPose = (typeof handPoses)[number]
export type HandProps = SVGProps<SVGSVGElement> & { pose?: HandPose }
type Pt = { readonly x: number; readonly y: number }
/**
 * The straight wrist edge of each pose in the 30×29 viewBox, thumb side first. The forearm
 * leaves along its normal (down and slightly right); Mano's `arm` attaches its sleeve here.
 */
export const handWrist: Readonly<Record<HandPose, readonly [Pt, Pt]>> = {
  open: [
    { x: 12.54, y: 25.86 },
    { x: 20.85, y: 23.61 },
  ],
  point: [
    { x: 12.91, y: 25.7 },
    { x: 21.16, y: 24.19 },
  ],
  pinch: [
    { x: 12.6, y: 26.14 },
    { x: 20.98, y: 24.61 },
  ],
  grip: [
    { x: 12.91, y: 25.7 },
    { x: 21.16, y: 24.19 },
  ],
  type: [
    { x: 12.54, y: 25.86 },
    { x: 20.85, y: 23.61 },
  ],
  hold: [
    { x: 12.27, y: 26.38 },
    { x: 20.73, y: 24.82 },
  ],
}
// Based on the issue #50 cursor reference; open-palm joins share coordinates and stroke widths.
// grip, type, and hold (issue #136) reuse that family: grip is the point pose with the index
// curled into a fourth knuckle, type is the open palm with shorter fingers and the thumb tucked
// under, hold is a side-on fist. Their dividers start on the outline's valley points and use
// the outline's stroke width.
const poses = {
  open: [
    {
      d: "M54 23 C54 18.8 47.6 18.8 47.6 23 V18 C47.6 13.8 41.2 13.8 41.2 18 V20 C41.2 15.8 34.8 15.8 34.8 20 V25 C34.8 20.8 28.4 20.8 28.4 25 C28.4 29.2 29.5 39.5 30 43 L25.1 39.7 C24.2 39.1 23.3 38.8 22.3 38.8 C20.5 38.8 19.2 40 19.2 41.7 C19.2 42.7 19.7 43.6 20.5 44.5 L32.9 57.6 C33.6 58.4 34.5 59 35.3 59.4 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 C55.5 39 54 28 54 23 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M34.8 25 V37",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M41.2 20 V36",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M47.6 23 V36",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  point: [
    {
      d: "m49.4 41.21c-0.06-1.26-0.98-2.35-2.04-2.35-0.37 0-0.73 0.24-0.73 0.24l-0.01-0.85c-0.03-1.15-0.96-1.95-2.05-1.92-0.98 0.03-1.65 0.84-1.6 1.51l-0.01-0.63c-0.06-1.15-1.03-1.96-2.09-1.91-1.16 0.04-1.87 0.97-1.85 1.99l-0.79-6.58c-0.12-1.16-1.14-1.86-2.24-1.78-1.23 0.14-1.96 1.21-1.86 2.27l1.62 11.14-1.94-1.38c-0.99-0.6-2.29-0.21-3 0.96-0.37 0.83-0.09 1.85 0.58 2.48l5.27 5.23c0.77 0.76 1.24 1.72 1.57 2.68 0.1 0.29 0.38 0.44 0.68 0.39l8.25-1.51c0.35-0.06 0.51-0.35 0.43-0.71-0.12-0.79-0.14-1.71 0.24-2.3 1.29-2.09 1.69-4.54 1.57-6.97z",
      fill: "#FFFFFF",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m39.38 39.61-0.11-2.37",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m43.08 40.06-0.1-2.33",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m46.49 41.19-0.05-2.16",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.7116",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  pinch: [
    {
      d: "m76.37 41.83c-0.07-1.15-0.91-1.96-1.85-1.94-0.19 0.01-0.38 0.12-0.42 0.17l-0.03-0.81c-0.02-1.42-1.21-2.44-2.45-2.4-0.75 0.04-1.24 0.63-1.2 1.16l-0.13-0.75c-0.22-1.36-1.57-2.28-2.75-2.17-1.08 0.13-1.56 1.03-1.39 1.85l-1.11-3.05c-0.7-1.87-1.74-2.64-3.37-2.34-1.43 0.34-2.89 0.9-3.97 1.36-0.87 0.38-1.17 1.33-0.86 2.22 0.28 0.78 1.14 1.25 2 1.19l1.88-0.16c0.15-0.02 0.27 0.05 0.34 0.18 1.24 2.08 1.98 4.5 1.97 6.5 0 0.73-0.53 1.14-1.23 0.99-1.33-0.41-2.71-1.45-4.15-2.03-0.95-0.31-2.1 0.23-2.62 1.28-0.3 0.9 0.13 1.94 0.94 2.45 2.6 1.91 5.26 3.76 7.65 5.22 0.73 0.5 1.16 1.21 1.39 2.06 0.07 0.27 0.32 0.38 0.59 0.33l8.38-1.53c0.41-0.08 0.58-0.35 0.53-0.75-0.1-0.72-0.14-1.56 0.21-2.09 1.28-2.11 1.76-4.65 1.65-6.94z",
      fill: "#FFFFFF",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m66.93 39.67-0.71-3",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m70.67 40.25-0.29-2.34",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.8229",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "m73.87 41.43 0.2-1.41",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "0.7116",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  grip: [
    {
      d: "M49.4 41.21 C49.34 39.95 48.42 38.86 47.36 38.86 C46.99 38.86 46.63 39.1 46.63 39.1 L46.62 38.25 C46.59 37.1 45.66 36.3 44.57 36.33 C43.59 36.36 42.92 37.17 42.97 37.84 L42.96 37.21 C42.9 36.06 41.93 35.25 40.87 35.3 C39.71 35.34 39 36.27 39.02 37.29 C38.98 36.2 38.2 35.35 37.1 35.4 C35.95 35.45 35.2 36.3 35.28 37.4 L35.75 42.34 L33.81 40.96 C32.82 40.36 31.52 40.75 30.81 41.92 C30.44 42.75 30.72 43.77 31.39 44.4 L36.66 49.63 C37.43 50.39 37.9 51.35 38.23 52.31 C38.33 52.6 38.61 52.75 38.91 52.7 L47.16 51.19 C47.51 51.13 47.67 50.84 47.59 50.48 C47.47 49.69 47.45 48.77 47.83 48.18 C49.12 46.09 49.52 43.64 49.4 41.21 Z",
      fill: "#FFFFFF",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M39.02 37.29 L39.12 39.6",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M42.97 37.84 L43.05 39.95",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M46.63 39.1 L46.52 41.15",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  type: [
    {
      d: "M54 25 C54 20.8 47.6 20.8 47.6 25 V21 C47.6 16.8 41.2 16.8 41.2 21 V23 C41.2 18.8 34.8 18.8 34.8 23 V27 C34.8 22.8 28.4 22.8 28.4 27 C28.4 31 29.5 39.5 30 43 C30.5 47.5 31.6 52.2 33.4 55.8 C34.3 57.6 35.1 58.8 35.3 59.4 L36.8 64.8 L54.1 60.1 C53.9 59 53.5 56.9 53.5 56 C53.5 53.8 55.5 50.2 55.5 45.2 C55.5 39 54 29.5 54 25 Z",
      fill: "#FFFFFF",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M34.8 27 V38",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M41.2 23 V37",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M47.6 25 V37",
      fill: "none",
      stroke: "#111212",
      strokeWidth: "2.57",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
  hold: [
    {
      d: "M12.2 25.6 C11.2 22.6 10.6 19 10.6 15.6 C10.6 12.2 11.6 9.6 14.2 8.9 C15.9 8.5 18 8.5 19.9 8.5 A1.35 1.35 0 0 1 19.9 11.2 L21 11.2 A1.4 1.4 0 0 1 21 14 L21.1 14 A1.4 1.4 0 0 1 21.1 16.8 L20.8 16.8 A1.3 1.3 0 0 1 20.8 19.4 L20.1 19.4 A1.2 1.2 0 0 1 20.1 21.8 C20 23 20.4 24.4 20.8 25.6 Z",
      fill: "#FFFFFF",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M19.9 11.2 L14.6 11.2",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M21 14 L15.8 14",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M21.1 16.8 L15.8 16.8",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    {
      d: "M20.8 19.4 L16.2 19.4",
      fill: "none",
      stroke: "#141515",
      strokeWidth: "1.234",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
  ],
} as const
const transforms = {
  open: "translate(4 1) scale(0.48) translate(-19 -13)",
  point: "translate(-26 -27)",
  pinch: "translate(-53 -27)",
  grip: "translate(-26 -27)",
  type: "translate(4 1) scale(0.48) translate(-19 -13)",
  hold: "rotate(-10.4 16.5 25.6)",
} as const
export function Hand({ pose = "point", style, ...props }: HandProps) {
  return (
    <svg
      viewBox="0 0 30 29"
      width={180}
      height={174}
      role="img"
      aria-label={`Hand: ${pose}`}
      {...props}
      style={{ display: "block", maxWidth: "100%", height: "auto", ...style }}
    >
      <g transform={transforms[pose]}>
        {poses[pose].map((path, i) => (
          <path
            {...path}
            key={i}
            fill={path.fill === "none" ? "none" : color.card}
            stroke={color.ink}
          />
        ))}
      </g>
    </svg>
  )
}
