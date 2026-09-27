"use client"

import type { ReactNode } from "react"
import { color } from "@/registry/jbm/lib/tokens"
import {
  TextFillDemo,
  ScrollTextFillDemo,
  FlipTextDemo,
} from "./text-fill-demo"
import { videoPrimitiveExamples } from "./video-primitives-demo"
import { editorialExamples } from "./editorial-demo"
import { ScrollStackDemo } from "./scroll-stack-demo"
import { SurfaceDepth } from "./surface-depth"
import { DesignVideoDemo } from "./design-video-demo"
import { DeskDemo } from "./desk-demo"
import { RegisterDemo } from "./register-demo"
import { designNames, deskNames, registerNames } from "./demo-data"
import { examples } from "./examples"

function Canvas({ children }: { children: ReactNode }) {
  return (
    <div className="preview-canvas">
      <div className="preview-stage">{children}</div>
    </div>
  )
}

// 24px, the inset of the text-fill, paper, and desk demos' controls, so every bench's slider
// tracks start at the same x.
const padded = { padding: 24, width: "100%", boxSizing: "border-box" } as const

/** Previews that size to their content instead of the fixed 8:5 canvas. */
function autoHeight(name: string) {
  return (
    designNames.includes(name) ||
    ["scroll-stack", "flip-text", "text-fill", "scroll-text-fill"].includes(
      name
    ) ||
    name in editorialExamples ||
    name in videoPrimitiveExamples
  )
}

function Demo({ name }: { name: string }) {
  if (designNames.includes(name)) return <DesignVideoDemo name={name} />
  if (deskNames.includes(name)) return <DeskDemo name={name} />
  if (registerNames.includes(name)) return <RegisterDemo name={name} />
  switch (name) {
    case "scroll-stack":
      return <ScrollStackDemo />
    case "flip-text":
      return <FlipTextDemo />
    case "text-fill":
      return <TextFillDemo />
    case "scroll-text-fill":
      return <ScrollTextFillDemo />
    case "surface-depth":
      return <SurfaceDepth />
    case "tokens":
      return (
        <div className="swatches">
          {Object.entries(color).map(([token, value]) => (
            <div key={token}>
              <span style={{ background: value }} />
              <strong>{token}</strong>
              <code>{value}</code>
            </div>
          ))}
        </div>
      )
  }
  if (name in videoPrimitiveExamples)
    return (
      <div style={padded}>
        {videoPrimitiveExamples[name as keyof typeof videoPrimitiveExamples]}
      </div>
    )
  if (name in editorialExamples)
    return (
      <div style={padded}>
        {editorialExamples[name as keyof typeof editorialExamples]}
      </div>
    )
  if (name in examples)
    return <Canvas>{examples[name as keyof typeof examples]}</Canvas>
  return null
}

/**
 * The plain-React preview for one gallery item, standalone: the same demos and direct controls as
 * the index card, sized by its container. Remotion Player items render through MotionBench.
 */
export function ItemPreview({ name }: { name: string }) {
  return (
    <div
      className={name === "surface-depth" ? "surface-preview" : "preview"}
      style={autoHeight(name) ? { aspectRatio: "auto", minHeight: 300 } : undefined}
    >
      <Demo name={name} />
    </div>
  )
}
