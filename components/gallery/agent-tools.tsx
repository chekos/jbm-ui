"use client"

import { useEffect } from "react"

export function GalleryAgentTools() {
  useEffect(() => {
    if (!("modelContext" in document)) return
    let cleanup: (() => void) | undefined
    let active = true
    void import("@ui-sdk/react/agent").then(
      ({ createAgent, registerTools }) => {
        if (active)
          cleanup = registerTools(createAgent(), {
            allow: (step) => !step.confirm,
          })
      }
    )
    return () => {
      active = false
      cleanup?.()
    }
  }, [])

  return null
}
