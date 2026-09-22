import type { SVGProps } from "react"
import { color } from "../lib/tokens"
export type HandPose = "open" | "point" | "pinch"
export type HandProps = SVGProps<SVGSVGElement> & { pose?: HandPose }
// Based on the issue #50 cursor reference; open-palm joins share coordinates and stroke widths.
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
} as const
const transforms = {
  open: "translate(4 1) scale(0.48) translate(-19 -13)",
  point: "translate(-26 -27)",
  pinch: "translate(-53 -27)",
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
