"use client"

import { createContext, useContext, type ReactNode } from "react"

const BenchCompact = createContext(false)

/** Wraps an index card's bench: demos inside show only their most telling controls. */
export function BenchCompactProvider({ children }: { children: ReactNode }) {
  return <BenchCompact.Provider value>{children}</BenchCompact.Provider>
}

/** True on index cards, false on /c pages, which keep every control. */
export function useBenchCompact() {
  return useContext(BenchCompact)
}
