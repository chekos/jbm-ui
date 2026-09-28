"use client"

import { createContext, useContext, type ReactNode } from "react"

// Index cards show a compact bench: at most three controls, the most telling ones, so cards in a
// row stay close in height. /c/<name> pages render the same demos outside this provider and keep
// every control. Demos gate secondary controls with `!useBenchCompact()`.
const BenchCompactContext = createContext(false)

/** Wraps an index card's preview: demos inside it render their compact control set. */
export function BenchCompactProvider({ children }: { children: ReactNode }) {
  return (
    <BenchCompactContext.Provider value={true}>
      {children}
    </BenchCompactContext.Provider>
  )
}

/** True on index cards (inside BenchCompactProvider), false on /c/<name> benches. */
export function useBenchCompact() {
  return useContext(BenchCompactContext)
}
