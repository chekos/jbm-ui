"use client"

import { createContext, useContext, type ReactNode } from "react"

const BenchCompactContext = createContext(false)

/** Marks benches rendered on index cards, which show only their most telling controls. */
export function BenchCompactProvider({ children }: { children: ReactNode }) {
  return (
    <BenchCompactContext.Provider value={true}>
      {children}
    </BenchCompactContext.Provider>
  )
}

/** True inside an index card; false on /c pages, which keep every control. */
export function useBenchCompact() {
  return useContext(BenchCompactContext)
}
