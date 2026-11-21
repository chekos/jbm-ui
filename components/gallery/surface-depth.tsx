"use client"

import { GalleryCheckbox } from "./controls"
import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle"
import { Button } from "@ui-sdk/react/button"
import { useState } from "react"
import { color, shadowLayers, surfaceBorder } from "@/registry/jbm/lib/tokens"
import { getGalleryItem } from "./item-meta"
import { useBenchCompact } from "./bench-compact"

// The copy button copies the contract's usage example, the same text as the Usage section.
const surfaceUsage = getGalleryItem("surface-depth")?.snippet ?? ""

export function SurfaceDepth() {
  const [before, setBefore] = useState(false)
  const [layers, setLayers] = useState({
    border: true,
    inset: true,
    contact: true,
    ambient: true,
  })
  const [status, setStatus] = useState("")
  // Index cards compare Before and Layered; /c/surface-depth adds the per-layer toggles.
  const compact = useBenchCompact()
  return (
    <div className="surface-lab">
      <ToggleGroup
        className="surface-modes"
        aria-label="Surface comparison"
        value={[before ? "before" : "layered"]}
        onValueChange={([next]) => {
          if (next) setBefore(next === "before")
        }}
      >
        <Toggle value="before">Before</Toggle>
        <Toggle value="layered">Layered</Toggle>
      </ToggleGroup>
      <div className="surface-samples">
        {(["card", "cardDark"] as const).map((variant) => {
          const dark = variant === "cardDark"
          const recipe = shadowLayers[variant]
          const selected = [
            ...(layers.inset ? recipe.inset : []),
            ...(layers.contact ? recipe.contact : []),
            ...(layers.ambient ? recipe.ambient : []),
          ]
          return (
            <div
              key={variant}
              className="surface-sample"
              style={{
                background: dark ? color.codeBg : color.card,
                color: dark ? color.bg : color.ink,
                border: before
                  ? `2px solid ${dark ? color.codeBg : color.line}`
                  : layers.border
                    ? surfaceBorder[variant]
                    : "1px solid transparent",
                boxShadow: before
                  ? "0 18px 40px rgba(32,36,31,0.10)"
                  : selected.join(", ") || "none",
              }}
            >
              <span>{dark ? "Dark" : "Light"}</span>
              <strong>Surface</strong>
            </div>
          )
        })}
      </div>
      {!compact && (
        <fieldset disabled={before}>
          <legend>Layers</legend>
          {(
            [
              ["border", "Border"],
              ["inset", "Inset highlight"],
              ["contact", "Contact shadow"],
              ["ambient", "Soft outer shadows"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <GalleryCheckbox
                checked={layers[key]}
                onCheckedChange={(checked) =>
                  setLayers({ ...layers, [key]: checked })
                }
              />
              {label}
            </label>
          ))}
        </fieldset>
      )}
      <p className="surface-note">
        {before
          ? "Original: one broad shadow and a 2px border."
          : compact
            ? "The current recipe: border, inset highlight, contact and soft outer shadows."
            : "Toggle layers to inspect the current recipe. Copy uses the complete recipe."}
      </p>
      <Button
        className="surface-copy"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(surfaceUsage)
            setStatus("Token usage copied.")
          } catch {
            setStatus("Clipboard unavailable. Copy it from Usage below.")
          }
        }}
      >
        Copy token usage
      </Button>
      <p role="status" className="surface-note">
        {status}
      </p>
    </div>
  )
}
