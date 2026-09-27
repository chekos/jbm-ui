"use client"

import { createContext, useContext, type ReactNode } from "react"

const BenchCompactContext = createContext(false)

export function BenchCompactProvider({ children }: { children: ReactNode }) {
  return (
    <BenchCompactContext.Provider value={true}>
      {children}
    </BenchCompactContext.Provider>
  )
}

export function useBenchCompact() {
  return useContext(BenchCompactContext)
}
