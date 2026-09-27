"use client"

import { createContext, useContext, type ReactNode } from "react"

const BenchCompactContext = createContext(false)

/** Index cards render benches inside this provider: secondary controls stay on /c pages. */
export function BenchCompactProvider({ children }: { children: ReactNode }) {
  return <BenchCompactContext.Provider value={true}>{children}</BenchCompactContext.Provider>
}

/** True on gallery index cards, false on /c pages. */
export function useBenchCompact() {
  return useContext(BenchCompactContext)
}
